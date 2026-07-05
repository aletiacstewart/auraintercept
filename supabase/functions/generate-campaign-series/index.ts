import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { loadIndustryPackForCompany, applyIndustryPackToPrompt } from "../_shared/industry-pack.ts";
import { callAIGatewayWithFallback } from "../_shared/ai-gateway.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { companyId, seriesName, campaignType, durationWeeks, targetSegment, channels } = await req.json();

    if (!seriesName || !campaignType || !durationWeeks) {
      return new Response(
        JSON.stringify({ error: 'seriesName, campaignType, and durationWeeks are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    // Fetch company info for context
    let companyName = 'our company';
    let aiProfile = null;
    let industryPack: any = null;
    
    if (companyId) {
      const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
      const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
      const supabase = createClient(supabaseUrl, supabaseKey);

      const { data: company } = await supabase
        .from('companies')
        .select('name')
        .eq('id', companyId)
        .maybeSingle();
      
      if (company?.name) companyName = company.name;

      const { data: profileData } = await supabase
        .from('company_ai_content_profiles')
        .select('*')
        .eq('company_id', companyId)
        .maybeSingle();
      
      aiProfile = profileData;
      industryPack = await loadIndustryPackForCompany(supabase, companyId);
    }

    // Build channel list
    const channelList: string[] = [];
    if (channels?.email) channelList.push('email');
    if (channels?.sms) channelList.push('sms');
    if (channelList.length === 0) channelList.push('email');

    // Calculate touchpoints
    const touchpointsPerWeek = channelList.length === 2 ? 2 : 1;
    const totalTouchpoints = Math.min(durationWeeks * touchpointsPerWeek, 12);

    // Build context
    const contextParts: string[] = [
      `Company Name: ${companyName}`,
      `Campaign Type: ${campaignType}`,
      `Target Segment: ${targetSegment || 'all customers'}`,
      `Duration: ${durationWeeks} weeks`,
      `Channels: ${channelList.join(' and ')}`,
    ];
    
    if (aiProfile?.primary_industry) {
      contextParts.push(`Industry: ${aiProfile.primary_industry}`);
    }
    if (aiProfile?.tone) {
      contextParts.push(`Tone: ${aiProfile.tone}`);
    }
    if (aiProfile?.unique_selling_points?.length > 0) {
      contextParts.push(`Key Selling Points: ${aiProfile.unique_selling_points.join(', ')}`);
    }

    const contextString = contextParts.join('\n');

    // Campaign type descriptions
    const typeDescriptions: Record<string, string> = {
      promotional: 'driving sales with special offers and discounts',
      winback: 're-engaging customers who haven\'t visited in a while',
      seasonal: 'promoting seasonal services or holiday specials',
      onboarding: 'welcoming new customers and introducing services',
      nurture: 'building long-term relationships and trust',
    };

    const typeDesc = typeDescriptions[campaignType] || typeDescriptions.promotional;

    const baseSystemPrompt = `You are an expert marketing copywriter specializing in multi-touch campaign sequences.
Generate compelling, professional marketing content that builds on each touchpoint to create a cohesive campaign journey.
For SMS messages, keep them under 160 characters.
For email subjects, keep them under 60 characters.
Return ONLY valid JSON with no markdown formatting or code blocks.`;
    const systemPrompt = applyIndustryPackToPrompt(baseSystemPrompt, industryPack, 'campaign');

    const userPrompt = `Create a ${durationWeeks}-week marketing campaign series focused on ${typeDesc}.

Context:
${contextString}

Generate exactly ${totalTouchpoints} touchpoints. Each touchpoint should be a JSON object with:
- "week": number (1 to ${durationWeeks})
- "day": number (day of the campaign, starting from 1)
- "channel": "${channelList.length === 1 ? channelList[0] : 'email" or "sms'}"
- "purpose": brief description of this touchpoint's goal
- "subject": email subject line (only for email channel)
- "message": the full message content

Campaign structure guidelines:
- Week 1: Introduction and initial hook
- Middle weeks: Value proposition, social proof, benefits
- Final weeks: Urgency, limited offer, final call-to-action
${channelList.includes('sms') ? '- SMS should be short reminders or urgent CTAs between emails' : ''}

Return a JSON object with a "touchpoints" array containing exactly ${totalTouchpoints} touchpoint objects.
Alternate channels if both email and SMS are enabled.
Space touchpoints appropriately across the ${durationWeeks} weeks.`;

    console.log(`Generating ${totalTouchpoints} touchpoints for ${durationWeeks}-week ${campaignType} campaign`);

    const { response: response, modelUsed: responseModel, fellBackFromPrimary: responseFellBack } = await callAIGatewayWithFallback({
        model: 'google/gemini-3-flash-preview',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        temperature: 0.8,
        max_tokens: 4000,
      });
    if (responseFellBack) console.warn(`[generate-campaign-series] primary model unavailable, served by ${responseModel}`);

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: 'Rate limit exceeded' }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      throw new Error(`AI gateway error: ${response.status}`);
    }

    const data = await response.json();
    let content = data.choices?.[0]?.message?.content?.trim();

    if (!content) {
      throw new Error('No content generated');
    }

    // Clean up potential markdown formatting
    content = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();

    const generatedContent = JSON.parse(content);

    console.log(`Generated ${generatedContent.touchpoints?.length || 0} touchpoints`);

    return new Response(
      JSON.stringify(generatedContent),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error generating campaign series:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Failed to generate content' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
