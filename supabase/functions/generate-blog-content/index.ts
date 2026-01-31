import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
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

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { 
      topic, 
      keywords = [], 
      tone = 'professional', 
      wordCount = 1000,
      companyId,
      companyName,
      industry
    } = await req.json();
    
    if (!topic) {
      throw new Error('Topic is required');
    }

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    // Initialize Supabase client if companyId provided
    let researchContext = '';
    
    if (companyId) {
      const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
      const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
      const supabase = createClient(supabaseUrl, supabaseKey);

      // Fetch Tavily API key from tenant_integrations
      const { data: integrations } = await supabase
        .from('tenant_integrations')
        .select('tavily_api_key')
        .eq('company_id', companyId)
        .single();

      if (integrations?.tavily_api_key) {
        console.log('Tavily API key found, performing research...');
        
        // Build search query
        const keywordStr = keywords.length > 0 ? keywords.join(' ') : '';
        const searchQuery = `${topic} ${keywordStr} latest trends insights best practices`.trim();
        
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
          } else {
            console.error('Tavily API error:', await tavilyResponse.text());
          }
        } catch (tavilyError) {
          console.error('Tavily search failed:', tavilyError);
        }
      }
    }

    const systemPrompt = `You are an expert content writer specializing in creating engaging, SEO-optimized blog articles for service-based businesses. Write in a ${tone} tone that connects with readers while incorporating relevant keywords naturally.`;

    const userPrompt = `${researchContext ? `=== CURRENT INDUSTRY RESEARCH ===\n${researchContext}\n\n` : ''}=== TASK ===
Write a comprehensive blog article about: ${topic}

${keywords.length > 0 ? `Keywords to include naturally: ${keywords.join(', ')}` : ''}
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
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
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
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: 'Rate limits exceeded, please try again later.' }), {
          status: 429,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: 'Payment required, please add funds to your workspace.' }), {
          status: 402,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      const errorText = await response.text();
      console.error('AI gateway error:', response.status, errorText);
      throw new Error('Failed to generate blog content');
    }

    const data = await response.json();
    let content = data.choices?.[0]?.message?.content?.trim() || '';
    
    // Parse the JSON response
    // Remove markdown code blocks if present
    content = content.replace(/```json\n?/g, '').replace(/```\n?/g, '');
    
    let blogData;
    try {
      blogData = JSON.parse(content);
    } catch (parseError) {
      console.error('Failed to parse AI response as JSON:', content);
      throw new Error('Invalid response format from AI');
    }

    return new Response(JSON.stringify({ 
      ...blogData,
      usedTavily: !!researchContext
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error generating blog content:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
