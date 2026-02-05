import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

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
    const { 
      campaignType, 
      targetSegment, 
      companyName, 
      field,
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

    // Fetch Tavily research if companyId provided
    let researchContext = '';
    
    if (companyId) {
      const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
      const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
      const supabase = createClient(supabaseUrl, supabaseKey);

      const { data: integrations } = await supabase
        .from('tenant_integrations')
        .select('tavily_api_key')
        .eq('company_id', companyId)
        .single();

      if (integrations?.tavily_api_key) {
        console.log('Tavily API key found, performing campaign research...');
        
        const searchQuery = buildSearchQuery(campaignType, industry);
        
        try {
          const tavilyResponse = await fetch('https://api.tavily.com/search', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              api_key: integrations.tavily_api_key,
              query: searchQuery,
              search_depth: 'basic',
              max_results: 3,
              include_answer: true
            })
          });

          if (tavilyResponse.ok) {
            const research: TavilyResponse = await tavilyResponse.json();
            researchContext = formatResearchForPrompt(research);
            console.log('Tavily research completed for campaign');
          }
        } catch (tavilyError) {
          console.error('Tavily search failed:', tavilyError);
        }
      }
    }

    // Build discount string if provided
    let discountInfo = '';
    if (discountValue) {
      discountInfo = discountType === 'percent' 
        ? `${discountValue}% off` 
        : `$${discountValue} off`;
    }

    const fieldPrompt = field === 'subject' 
      ? 'Generate a compelling email subject line (max 60 characters) that will get high open rates.'
      : 'Generate an engaging marketing message template. Use {customer_name} as a placeholder for personalization. Keep it concise but persuasive (2-3 short paragraphs max).';

    const systemPrompt = `You are a marketing copywriter specializing in service-based businesses. Create compelling campaign content that drives engagement and conversions. Be direct, use action-oriented language, and create urgency when appropriate.`;

    // Build context from form data
    let contextDetails = [];
    if (campaignName) contextDetails.push(`Campaign: "${campaignName}"`);
    if (promoCode) contextDetails.push(`Promo Code: ${promoCode}`);
    if (discountInfo) contextDetails.push(`Offer: ${discountInfo}`);
    if (inactivePeriod) contextDetails.push(`Targeting customers inactive for ${inactivePeriod} days`);

    const userPrompt = `${researchContext ? `=== CURRENT MARKET RESEARCH ===\n${researchContext}\n\n` : ''}Create content for a ${campaignType} campaign targeting ${targetSegment} customers for ${companyName || 'our company'}.

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
${researchContext ? 'Incorporate relevant trends or insights from the market research above to make the message timely and compelling.' : ''}

Respond with ONLY the content, no explanations or quotes around it.`;

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
        max_tokens: 500,
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
