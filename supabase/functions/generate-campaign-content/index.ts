import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { guardedTavilyFetch } from '../_shared/tavily-guard.ts';
import { createClient } from "npm:@supabase/supabase-js@2";
import { loadIndustryPackForCompany, applyIndustryPackToPrompt } from "../_shared/industry-pack.ts";
import { callAIGatewayWithFallback } from "../_shared/ai-gateway.ts";

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
    formatted += `Current Trends: ${research.answer}\n`;
  }
  
  if (research.results && research.results.length > 0) {
    formatted += 'Key Insights:\n';
    research.results.slice(0, 2).forEach((result, i) => {
      formatted += `- ${result.content.substring(0, 150)}...\n`;
    });
  }
  
  return formatted;
}

function buildSearchQuery(campaignType: string, industry?: string): string {
  const queries: Record<string, string> = {
    promotional: `${industry || 'service business'} promotional marketing trends effective offers`,
    winback: `customer re-engagement win-back strategies ${industry || 'service industry'}`,
    seasonal: `seasonal marketing campaigns ${new Date().toLocaleString('en-US', { month: 'long' })} ${industry || ''}`,
    referral: `referral marketing best practices incentives ${industry || 'local business'}`,
    loyalty: `customer loyalty program trends ${industry || 'service business'}`,
  };
  return queries[campaignType] || queries.promotional;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // redeploy-nudge: v2 (supabase client hoisted)
    const { 
      campaignType, 
      targetSegment, 
      companyName, 
      field,
      channel,
      campaignName,
      promoCode,
      discountType,
      discountValue,
      inactivePeriod,
      companyId,
      industry
    } = await req.json();
    
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    // Initialize context variables
    let researchContext = '';
    let aiProfile: any = null;
    let services: string[] = [];
    let faqs: any[] = [];
    let resolvedCompanyName = companyName;
    let resolvedIndustry = industry;

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    if (companyId) {
      // Fetch company info, AI profile, services, FAQs, and integrations in parallel
      const [companyRes, aiProfileRes, servicesRes, faqsRes, integrationsRes] = await Promise.all([
        supabase.from('companies').select('name, service_categories, brand_tone').eq('id', companyId).maybeSingle(),
        supabase.from('company_ai_content_profiles').select('*').eq('company_id', companyId).maybeSingle(),
        supabase.from('services').select('name, description').eq('company_id', companyId).eq('is_active', true).limit(10),
        supabase.from('faqs').select('question, answer').eq('company_id', companyId).limit(10),
        supabase.from('tenant_integrations').select('tavily_api_key').eq('company_id', companyId).maybeSingle(),
      ]);

      // Set company name and industry from database if not provided
      if (companyRes.data) {
        resolvedCompanyName = companyName || companyRes.data.name;
        resolvedIndustry = industry || companyRes.data.service_categories?.join(', ');
      }

      aiProfile = aiProfileRes.data;
      services = servicesRes.data?.map(s => s.name) || [];
      faqs = faqsRes.data || [];

      // Tavily research
      if (integrationsRes.data?.tavily_api_key) {
        console.log('[generate-campaign-content] Tavily connected, researching...');
        const searchQuery = buildSearchQuery(campaignType, aiProfile?.primary_industry || resolvedIndustry);
        
        try {
          const tavilyResponse = await guardedTavilyFetch({
            supabase, companyId,
            apiKey: integrationsRes.data.tavily_api_key,
            source: 'generate-campaign-content',
            body: { query: searchQuery,
              search_depth: 'basic',
              max_results: 3,
              include_answer: true },
          });
          if (tavilyResponse === null) { /* Tavily skipped: cap reached or unavailable */ } else

          if (tavilyResponse.ok) {
            const research: TavilyResponse = await tavilyResponse.json();
            researchContext = formatResearchForPrompt(research);
            console.log('[generate-campaign-content] Tavily research added');
          }
        } catch (tavilyError) {
          console.error('[generate-campaign-content] Tavily error:', tavilyError);
        }
      }
    }

    // Build AI profile context
    const aiProfileContext: string[] = [];
    if (aiProfile) {
      if (aiProfile.primary_industry) aiProfileContext.push(`Industry: ${aiProfile.primary_industry}`);
      if (aiProfile.tone) aiProfileContext.push(`Brand Tone: ${aiProfile.tone}`);
      if (aiProfile.brand_voice) aiProfileContext.push(`Brand Voice: ${aiProfile.brand_voice}`);
      if (aiProfile.target_audience) aiProfileContext.push(`Target Audience: ${aiProfile.target_audience}`);
      if (aiProfile.unique_selling_points?.length) aiProfileContext.push(`USPs: ${aiProfile.unique_selling_points.join(', ')}`);
      if (aiProfile.keywords?.length) aiProfileContext.push(`Keywords to use: ${aiProfile.keywords.join(', ')}`);
      if (aiProfile.avoid_keywords?.length) aiProfileContext.push(`Keywords to AVOID: ${aiProfile.avoid_keywords.join(', ')}`);
    }

    // Build knowledge base context
    const knowledgeContext: string[] = [];
    if (services.length > 0) knowledgeContext.push(`Services: ${services.join(', ')}`);
    if (faqs.length > 0) {
      const faqSummary = faqs.slice(0, 3).map(f => `Q: ${f.question} A: ${f.answer.substring(0, 100)}`).join(' | ');
      knowledgeContext.push(`FAQs: ${faqSummary}`);
    }

    // Build discount string if provided
    let discountInfo = '';
    if (discountValue) {
      discountInfo = discountType === 'percent' 
        ? `${discountValue}% off` 
        : `$${discountValue} off`;
    }

    const resolvedChannel: 'email' | 'sms' =
      channel === 'sms' || field === 'sms' ? 'sms' : 'email';

    const fieldPrompt = field === 'subject'
      ? 'Generate a compelling email subject line (max 60 characters) that will get high open rates.'
      : resolvedChannel === 'sms'
        ? `Generate a single SMS marketing message. STRICT REQUIREMENTS:
- Maximum 320 characters total (aim for under 160 when possible).
- Plain text only — no markdown, no emoji, no line headers like "Subject:".
- Lead with the brand name ("${resolvedCompanyName || 'Our team'}").
- Use {customer_name} for personalization only if it fits naturally.
- MUST end with "Reply STOP to opt out." for opt-out compliance.
- One short call-to-action with a single link is OK.`
        : 'Generate an engaging marketing EMAIL body. Use {customer_name} as a placeholder for personalization. Keep it concise but persuasive (2-3 short paragraphs max). Do NOT include the subject line in the body.';

    // Build tone guidance from AI profile
    const toneGuidance = aiProfile?.tone ? `Write in a ${aiProfile.tone} tone.` : '';
    const voiceGuidance = aiProfile?.brand_voice ? `Brand voice: ${aiProfile.brand_voice}` : '';
    const avoidanceGuidance = aiProfile?.avoid_keywords?.length 
      ? `IMPORTANT: Do NOT use these words: ${aiProfile.avoid_keywords.join(', ')}`
      : '';

    const baseSystemPrompt = `You are a marketing copywriter for ${resolvedCompanyName || 'a service business'}. Create compelling campaign content that drives engagement and conversions.
${toneGuidance}
${voiceGuidance}
Be direct, use action-oriented language, and create urgency when appropriate.
${avoidanceGuidance}`;
    const industryPack = companyId ? await loadIndustryPackForCompany(supabase, companyId) : null;
    const systemPrompt = applyIndustryPackToPrompt(baseSystemPrompt, industryPack, 'campaign');

    // Build context from form data
    let contextDetails = [];
    if (campaignName) contextDetails.push(`Campaign: "${campaignName}"`);
    if (promoCode) contextDetails.push(`Promo Code: ${promoCode}`);
    if (discountInfo) contextDetails.push(`Offer: ${discountInfo}`);
    if (inactivePeriod) contextDetails.push(`Targeting customers inactive for ${inactivePeriod} days`);

    const userPrompt = `${researchContext ? `=== CURRENT MARKET RESEARCH ===\n${researchContext}\n\n` : ''}${aiProfileContext.length > 0 ? `=== BRAND PROFILE ===\n${aiProfileContext.join('\n')}\n\n` : ''}${knowledgeContext.length > 0 ? `=== KNOWLEDGE BASE ===\n${knowledgeContext.join('\n')}\n\n` : ''}Create content for a ${campaignType} campaign targeting ${targetSegment} customers for ${resolvedCompanyName || 'our company'}.

${contextDetails.length > 0 ? `Campaign Details:\n${contextDetails.join('\n')}\n` : ''}
Campaign Type: ${campaignType}
- promotional: Focus on special offers, discounts, and limited-time deals
- winback: Re-engage inactive customers with compelling reasons to return
- seasonal: Tie messaging to current season or upcoming holidays
- referral: Encourage customers to refer friends with incentives

Target: ${targetSegment}
- all: General audience messaging
- new: Welcome and onboard new customers
- inactive: Win back customers who haven't engaged recently
- vip: Exclusive offers for loyal customers

${fieldPrompt}
${promoCode ? `Include the promo code "${promoCode}" in the message.` : ''}
${discountInfo ? `Highlight the ${discountInfo} offer.` : ''}
${researchContext ? 'Incorporate relevant trends or insights from the market research above.' : ''}
${knowledgeContext.length > 0 ? 'Reference actual services from the knowledge base when relevant.' : ''}

Respond with ONLY the content, no explanations or quotes around it.`;

    const { response: response, modelUsed: responseModel, fellBackFromPrimary: responseFellBack } = await callAIGatewayWithFallback({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        max_tokens: 500,
      });
    if (responseFellBack) console.warn(`[generate-campaign-content] primary model unavailable, served by ${responseModel}`);

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
      throw new Error('Failed to generate content');
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content?.trim() || '';

    return new Response(JSON.stringify({ content, usedTavily: !!researchContext }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error generating campaign content:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
