import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { guardedTavilyFetch } from '../_shared/tavily-guard.ts';
import { createClient } from "npm:@supabase/supabase-js@2";
import { loadIndustryPackForCompany, applyIndustryPackToPrompt } from "../_shared/industry-pack.ts";

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

    // Initialize context variables
    let researchContext = '';
    let aiProfile: any = null;
    let services: any[] = [];
    let faqs: any[] = [];
    let resolvedCompanyName = companyName;
    let resolvedIndustry = industry;
    let resolvedTone = tone;
    
    if (companyId) {
      const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
      const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
      const supabase = createClient(supabaseUrl, supabaseKey);

      // Fetch all data in parallel: company, AI profile, services, FAQs, integrations
      const [companyRes, aiProfileRes, servicesRes, faqsRes, integrationsRes] = await Promise.all([
        supabase.from('companies').select('name, service_categories, brand_tone').eq('id', companyId).maybeSingle(),
        supabase.from('company_ai_content_profiles').select('*').eq('company_id', companyId).maybeSingle(),
        supabase.from('services').select('name, description, base_price').eq('company_id', companyId).eq('is_active', true).limit(15),
        supabase.from('faqs').select('question, answer, category').eq('company_id', companyId).limit(15),
        supabase.from('tenant_integrations').select('tavily_api_key').eq('company_id', companyId).maybeSingle(),
      ]);

      // Set resolved values from database
      if (companyRes.data) {
        resolvedCompanyName = companyName || companyRes.data.name;
        resolvedIndustry = industry || companyRes.data.service_categories?.join(', ');
      }

      aiProfile = aiProfileRes.data;
      services = servicesRes.data || [];
      faqs = faqsRes.data || [];

      // Use AI profile tone if available
      if (aiProfile?.tone && tone === 'professional') {
        resolvedTone = aiProfile.tone;
      }

      // Tavily research
      if (integrationsRes.data?.tavily_api_key) {
        console.log('[generate-blog-content] Tavily connected, researching...');
        
        const keywordStr = keywords.length > 0 ? keywords.join(' ') : '';
        const searchQuery = `${topic} ${keywordStr} ${aiProfile?.primary_industry || resolvedIndustry || ''} latest trends insights`.trim();
        
        try {
          const tavilyResponse = await guardedTavilyFetch({
            supabase, companyId,
            apiKey: integrationsRes.data.tavily_api_key,
            source: 'generate-blog-content',
            body: { query: searchQuery,
              search_depth: 'advanced',
              max_results: 5,
              include_answer: true },
          });
          if (tavilyResponse === null) { /* Tavily skipped: cap reached or unavailable */ } else

          if (tavilyResponse.ok) {
            const research: TavilyResponse = await tavilyResponse.json();
            researchContext = formatResearchForPrompt(research);
            console.log('[generate-blog-content] Tavily research added');
          } else {
            console.error('[generate-blog-content] Tavily API error:', await tavilyResponse.text());
          }
        } catch (tavilyError) {
          console.error('[generate-blog-content] Tavily error:', tavilyError);
        }
      }
    }

    // Build AI profile context
    const aiProfileContext: string[] = [];
    if (aiProfile) {
      if (aiProfile.primary_industry) aiProfileContext.push(`Primary Industry: ${aiProfile.primary_industry}`);
      if (aiProfile.brand_voice) aiProfileContext.push(`Brand Voice: ${aiProfile.brand_voice}`);
      if (aiProfile.target_audience) aiProfileContext.push(`Target Audience: ${aiProfile.target_audience}`);
      if (aiProfile.unique_selling_points?.length) aiProfileContext.push(`USPs: ${aiProfile.unique_selling_points.join(', ')}`);
      if (aiProfile.content_topics?.length) aiProfileContext.push(`Content Themes: ${aiProfile.content_topics.join(', ')}`);
    }

    // Build knowledge base context
    const knowledgeContext: string[] = [];
    if (services.length > 0) {
      const servicesList = services.map(s => `${s.name}${s.base_price ? ` ($${s.base_price})` : ''}`).join(', ');
      knowledgeContext.push(`Services: ${servicesList}`);
    }
    if (faqs.length > 0) {
      const faqSummary = faqs.slice(0, 5).map(f => `Q: ${f.question}`).join(' | ');
      knowledgeContext.push(`Common Questions: ${faqSummary}`);
    }

    // Merge keywords from profile
    const allKeywords = [...keywords];
    if (aiProfile?.keywords?.length) {
      aiProfile.keywords.forEach((kw: string) => {
        if (!allKeywords.includes(kw)) allKeywords.push(kw);
      });
    }

    // Build avoidance instructions
    const avoidKeywords = aiProfile?.avoid_keywords?.length 
      ? `\nIMPORTANT: Do NOT use these words/phrases: ${aiProfile.avoid_keywords.join(', ')}`
      : '';

    const baseSystemPrompt = `You are an expert content writer for ${resolvedCompanyName || 'a service business'}. Create engaging, SEO-optimized blog articles.
Write in a ${resolvedTone} tone that connects with readers.
${aiProfile?.brand_voice ? `Brand voice: ${aiProfile.brand_voice}` : ''}
Incorporate keywords naturally without keyword stuffing.${avoidKeywords}`;
    const industryPack = companyId ? await loadIndustryPackForCompany(supabase, companyId) : null;
    const systemPrompt = applyIndustryPackToPrompt(baseSystemPrompt, industryPack, 'blog');

    const userPrompt = `${researchContext ? `=== CURRENT INDUSTRY RESEARCH ===\n${researchContext}\n\n` : ''}${aiProfileContext.length > 0 ? `=== BRAND PROFILE ===\n${aiProfileContext.join('\n')}\n\n` : ''}${knowledgeContext.length > 0 ? `=== KNOWLEDGE BASE ===\n${knowledgeContext.join('\n')}\n\n` : ''}=== TASK ===
Write a comprehensive blog article about: ${topic}

${allKeywords.length > 0 ? `Keywords to include naturally: ${allKeywords.join(', ')}` : ''}
${resolvedCompanyName ? `Company: ${resolvedCompanyName}` : ''}
${resolvedIndustry ? `Industry: ${resolvedIndustry}` : ''}
Tone: ${resolvedTone}
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

${researchContext ? 'Incorporate statistics, trends, or insights from the research above.' : ''}
${knowledgeContext.length > 0 ? 'Reference actual services from the knowledge base when relevant.' : ''}

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
