import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { guardedTavilyFetch } from '../_shared/tavily-guard.ts';
import { createClient } from "npm:@supabase/supabase-js@2";
import { loadIndustryPackForCompany, applyIndustryPackToPrompt } from "../_shared/industry-pack.ts";
import { callAIGatewayWithFallback } from "../_shared/ai-gateway.ts";

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

interface SocialTopic {
  topic: string;
  keywords: string[];
  scheduledFor: string;
  platforms?: string[];
}

interface PlatformContent {
  content: string;
  hashtags: string[];
  characterCount: number;
}

interface GeneratedSocialPost {
  topic: string;
  keywords: string[];
  platforms: string[];
  contentJson: Record<string, PlatformContent>;
  scheduledFor: string;
  usedTavily: boolean;
}

const PLATFORM_LIMITS: Record<string, number> = {
  instagram: 2200,
  facebook: 63206,
  linkedin: 3000,
  twitter: 280,
  tiktok: 2200,
  youtube: 5000,
};

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

async function generateSocialContent(
  topic: SocialTopic,
  platforms: string[],
  companyName: string | null,
  industry: string | null,
  brandVoice: string | null,
  targetAudience: string | null,
  researchContext: string,
  apiKey: string,
  industryPack: any = null
): Promise<GeneratedSocialPost> {
  const targetPlatforms = topic.platforms?.length ? topic.platforms : platforms;
  
  const baseSystemPrompt = `You are an expert social media content strategist who creates engaging, platform-optimized content. You understand the unique characteristics, algorithms, and audience expectations of each social platform.

${brandVoice ? `Brand Voice: ${brandVoice}` : ''}
${targetAudience ? `Target Audience: ${targetAudience}` : ''}`;
  const systemPrompt = applyIndustryPackToPrompt(baseSystemPrompt, industryPack, 'social');

  const platformInstructions = targetPlatforms.map(p => {
    const limit = PLATFORM_LIMITS[p] || 2000;
    switch(p) {
      case 'instagram':
        return `Instagram (max ${limit} chars): Visual-focused, storytelling, 5-15 relevant hashtags, emojis welcome`;
      case 'facebook':
        return `Facebook (max ${limit} chars): Conversational, engaging questions, minimal hashtags (0-3)`;
      case 'linkedin':
        return `LinkedIn (max ${limit} chars): Professional, thought leadership, industry insights, 3-5 hashtags`;
      case 'twitter':
        return `Twitter/X (max ${limit} chars): Concise, punchy, 1-3 hashtags, drive engagement`;
      case 'tiktok':
        return `TikTok (max ${limit} chars): Trendy, casual, hook-first, 3-5 trending hashtags`;
      case 'youtube':
        return `YouTube (max ${limit} chars): Descriptive, SEO-optimized, includes relevant tags`;
      default:
        return `${p} (max ${limit} chars): Optimized for platform engagement`;
    }
  }).join('\n');

  const userPrompt = `${researchContext ? `=== CURRENT INDUSTRY RESEARCH ===\n${researchContext}\n\n` : ''}=== TASK ===
Create unique social media content for the following topic:
Topic: ${topic.topic}
${topic.keywords.length > 0 ? `Keywords to incorporate: ${topic.keywords.join(', ')}` : ''}
${companyName ? `Company: ${companyName}` : ''}
${industry ? `Industry: ${industry}` : ''}

Generate content optimized for each platform:
${platformInstructions}

${researchContext ? 'Incorporate relevant insights from the research to make content current and authoritative.' : ''}

Respond in valid JSON format:
{
  ${targetPlatforms.map(p => `"${p}": { "content": "platform-specific content here", "hashtags": ["tag1", "tag2"] }`).join(',\n  ')}
}

Make each platform's content UNIQUE - not just shortened versions of each other. Adapt tone, format, and approach for each platform's audience.`;

  const { response: response, modelUsed: responseModel, fellBackFromPrimary: responseFellBack } = await callAIGatewayWithFallback({
      model: 'google/gemini-2.5-flash',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      max_tokens: 3000,
    });
  if (responseFellBack) console.warn(`[generate-social-batch] primary model unavailable, served by ${responseModel}`);

  if (!response.ok) {
    throw new Error(`AI API error: ${response.status}`);
  }

  const data = await response.json();
  let content = data.choices?.[0]?.message?.content?.trim() || '';
  
  // Remove markdown code blocks if present
  content = content.replace(/```json\n?/g, '').replace(/```\n?/g, '');
  
  const contentData = JSON.parse(content);
  
  // Format the content JSON with character counts
  const contentJson: Record<string, PlatformContent> = {};
  for (const platform of targetPlatforms) {
    const platformData = contentData[platform];
    if (platformData) {
      contentJson[platform] = {
        content: platformData.content || '',
        hashtags: platformData.hashtags || [],
        characterCount: (platformData.content || '').length,
      };
    }
  }

  return {
    topic: topic.topic,
    keywords: topic.keywords,
    platforms: targetPlatforms,
    contentJson,
    scheduledFor: topic.scheduledFor,
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
      defaultPlatforms,
      companyId,
      timezone = 'America/New_York'
    }: {
      topics: SocialTopic[];
      defaultPlatforms: string[];
      companyId: string;
      timezone: string;
    } = await req.json();
    
    if (!topics || topics.length === 0) {
      throw new Error('At least one topic is required');
    }

    if (!defaultPlatforms || defaultPlatforms.length === 0) {
      throw new Error('At least one platform is required');
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

    // Fetch AI content profile
    const { data: aiProfile } = await supabase
      .from('company_ai_content_profiles')
      .select('brand_voice, target_audience, tone')
      .eq('company_id', companyId)
      .maybeSingle();

    const brandVoice = aiProfile?.brand_voice || null;
    const targetAudience = aiProfile?.target_audience || null;
    const industryPack = await loadIndustryPackForCompany(supabase, companyId);

    // Fetch Tavily API key
    const { data: integrations } = await supabase
      .from('tenant_integrations')
      .select('tavily_api_key')
      .eq('company_id', companyId)
      .maybeSingle();

    let researchContext = '';
    
    if (integrations?.tavily_api_key) {
      console.log('Tavily API key found, performing research...');
      
      // Use first topic and industry for general research
      const searchQuery = `${topics[0].topic} ${industry || ''} social media trends best practices`.trim();
      
      try {
        const tavilyResponse = await guardedTavilyFetch({
            supabase, companyId,
            apiKey: integrations.tavily_api_key,
            source: 'generate-social-batch',
            body: { query: searchQuery,
            search_depth: 'basic',
            max_results: 5,
            include_answer: true },
          });
          if (tavilyResponse === null) { /* Tavily skipped: cap reached or unavailable */ } else

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
    const generatedPosts: GeneratedSocialPost[] = [];
    const errors: string[] = [];

    // Generate each social post
    for (let i = 0; i < topics.length; i++) {
      const topic = topics[i];
      console.log(`Generating social content ${i + 1}/${topics.length}: ${topic.topic}`);
      
      try {
        const post = await generateSocialContent(
          topic,
          defaultPlatforms,
          companyName,
          industry,
          brandVoice,
          targetAudience,
          researchContext,
          LOVABLE_API_KEY,
          industryPack
        );
        generatedPosts.push(post);

        // Small delay between requests to avoid rate limiting
        if (i < topics.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 800));
        }
      } catch (error) {
        console.error(`Failed to generate content for topic: ${topic.topic}`, error);
        errors.push(`Failed to generate: ${topic.topic}`);
      }
    }

    // Insert all generated posts into scheduled_social_posts
    if (generatedPosts.length > 0) {
      const insertData = generatedPosts.map(post => ({
        company_id: companyId,
        topic: post.topic,
        keywords: post.keywords,
        platforms: post.platforms,
        content_json: post.contentJson,
        scheduled_for: post.scheduledFor,
        timezone: timezone,
        status: 'pending',
        batch_id: batchId,
        ai_research_used: post.usedTavily,
      }));

      const { error: insertError } = await supabase
        .from('scheduled_social_posts')
        .insert(insertData);

      if (insertError) {
        console.error('Failed to save scheduled posts:', insertError);
        throw new Error('Failed to save generated posts to database');
      }
    }

    return new Response(JSON.stringify({ 
      success: true,
      batchId,
      generatedCount: generatedPosts.length,
      totalRequested: topics.length,
      errors: errors.length > 0 ? errors : undefined,
      usedTavily: !!researchContext
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error generating social batch:', error);
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
