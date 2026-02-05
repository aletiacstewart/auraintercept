import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

interface TavilyResult {
  title: string;
  content: string;
  url: string;
}

interface TavilyResponse {
  answer?: string;
  results?: TavilyResult[];
}

interface BlogTopic {
  topic: string;
  keywords: string[];
  scheduledFor: string;
}

interface GeneratedBlog {
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  featuredImageDescription?: string;
  scheduledFor: string;
  keywords: string[];
  usedTavily: boolean;
}

function formatResearchForPrompt(research: TavilyResponse): string {
  let formatted = '';
  
  if (research.answer) {
    formatted += `Summary: ${research.answer}\n\n`;
  }
  
  if (research.results && research.results.length > 0) {
    formatted += 'Key Sources:\n';
    research.results.slice(0, 3).forEach((result, i) => {
      formatted += `${i + 1}. ${result.title}\n   ${result.content.substring(0, 200)}...\n`;
    });
  }
  
  return formatted;
}

async function generateSingleBlog(
  topic: BlogTopic,
  companyName: string | null,
  industry: string | null,
  tone: string,
  wordCount: number,
  researchContext: string,
  apiKey: string
): Promise<GeneratedBlog> {
  const systemPrompt = `You are an expert content writer specializing in creating engaging, SEO-optimized blog articles for service-based businesses. Write in a ${tone} tone that connects with readers while incorporating relevant keywords naturally.`;

  const userPrompt = `${researchContext ? `=== CURRENT INDUSTRY RESEARCH ===\n${researchContext}\n\n` : ''}=== TASK ===
Write a comprehensive blog article about: ${topic.topic}

${topic.keywords.length > 0 ? `Keywords to include naturally: ${topic.keywords.join(', ')}` : ''}
${companyName ? `Company: ${companyName}` : ''}
${industry ? `Industry: ${industry}` : ''}
Tone: ${tone}
Target length: approximately ${wordCount} words

Generate a complete blog article with:
1. An engaging, SEO-optimized title (under 60 characters)
2. A URL-friendly slug
3. A compelling meta description (150-160 characters)
4. Full article content in HTML format with:
   - An attention-grabbing introduction
   - 3-5 main sections with H2 headings
   - Practical tips, insights, or actionable advice
   - A conclusion with a call-to-action
5. A description for a suggested featured image

${researchContext ? 'Incorporate relevant statistics, trends, or insights from the research provided above to make the content current and authoritative.' : ''}

Respond in valid JSON format:
{
  "title": "Article Title",
  "slug": "article-url-slug",
  "excerpt": "Meta description here...",
  "content": "<h2>Section Title</h2><p>Content...</p>...",
  "featuredImageDescription": "Description of suggested hero image"
}`;

  const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'google/gemini-2.5-flash',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      max_tokens: 4000,
    }),
  });

  if (!response.ok) {
    throw new Error(`AI API error: ${response.status}`);
  }

  const data = await response.json();
  let content = data.choices?.[0]?.message?.content?.trim() || '';
  
  // Remove markdown code blocks if present
  content = content.replace(/```json\n?/g, '').replace(/```\n?/g, '');
  
  const blogData = JSON.parse(content);

  return {
    ...blogData,
    scheduledFor: topic.scheduledFor,
    keywords: topic.keywords,
    usedTavily: !!researchContext
  };
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { 
      topics,
      tone = 'professional', 
      wordCount = 1000,
      companyId,
      timezone = 'America/New_York'
    }: {
      topics: BlogTopic[];
      tone: string;
      wordCount: number;
      companyId: string;
      timezone: string;
    } = await req.json();
    
    if (!topics || topics.length === 0) {
      throw new Error('At least one topic is required');
    }

    if (!companyId) {
      throw new Error('Company ID is required');
    }

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Fetch company info
    const { data: company } = await supabase
      .from('companies')
      .select('name, service_categories')
      .eq('id', companyId)
      .single();

    const companyName = company?.name || null;
    const industry = company?.service_categories?.[0] || null;

    // Fetch Tavily API key
    const { data: integrations } = await supabase
      .from('tenant_integrations')
      .select('tavily_api_key')
      .eq('company_id', companyId)
      .maybeSingle();

    let researchContext = '';
    
    if (integrations?.tavily_api_key) {
      console.log('Tavily API key found, performing research...');
      
      // Use first topic for general research
      const searchQuery = `${topics[0].topic} ${industry || ''} latest trends insights best practices`.trim();
      
      try {
        const tavilyResponse = await fetch('https://api.tavily.com/search', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            api_key: integrations.tavily_api_key,
            query: searchQuery,
            search_depth: 'advanced',
            max_results: 5,
            include_answer: true
          })
        });

        if (tavilyResponse.ok) {
          const research: TavilyResponse = await tavilyResponse.json();
          researchContext = formatResearchForPrompt(research);
          console.log('Tavily research completed successfully');
        }
      } catch (tavilyError) {
        console.error('Tavily search failed:', tavilyError);
      }
    }

    // Generate batch ID for grouping
    const batchId = crypto.randomUUID();
    const generatedBlogs: GeneratedBlog[] = [];
    const errors: string[] = [];

    // Generate each blog post
    for (let i = 0; i < topics.length; i++) {
      const topic = topics[i];
      console.log(`Generating blog ${i + 1}/${topics.length}: ${topic.topic}`);
      
      try {
        const blog = await generateSingleBlog(
          topic,
          companyName,
          industry,
          tone,
          wordCount,
          researchContext,
          LOVABLE_API_KEY
        );
        generatedBlogs.push(blog);

        // Small delay between requests to avoid rate limiting
        if (i < topics.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      } catch (error) {
        console.error(`Failed to generate blog for topic: ${topic.topic}`, error);
        errors.push(`Failed to generate: ${topic.topic}`);
      }
    }

    // Insert all generated blogs into scheduled_blog_posts
    if (generatedBlogs.length > 0) {
      const insertData = generatedBlogs.map(blog => ({
        company_id: companyId,
        title: blog.title,
        slug: blog.slug,
        excerpt: blog.excerpt,
        content: blog.content,
        featured_image_url: null,
        keywords: blog.keywords,
        tone: tone,
        scheduled_for: blog.scheduledFor,
        timezone: timezone,
        status: 'pending',
        batch_id: batchId,
        ai_research_used: blog.usedTavily,
      }));

      const { error: insertError } = await supabase
        .from('scheduled_blog_posts')
        .insert(insertData);

      if (insertError) {
        console.error('Failed to save scheduled posts:', insertError);
        throw new Error('Failed to save generated blogs to database');
      }
    }

    return new Response(JSON.stringify({ 
      success: true,
      batchId,
      generatedCount: generatedBlogs.length,
      totalRequested: topics.length,
      errors: errors.length > 0 ? errors : undefined,
      usedTavily: !!researchContext
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error generating blog batch:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    
    if (errorMessage.includes('429') || errorMessage.includes('Rate limit')) {
      return new Response(JSON.stringify({ error: 'Rate limits exceeded, please try again later.' }), {
        status: 429,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
