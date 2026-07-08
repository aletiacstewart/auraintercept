import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { callAIGatewayWithFallback } from "../_shared/ai-gateway.ts";
import { authorizeInternalRequest } from "../_shared/internal-auth.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { companyId, industry, serviceArea, businessType, description, contentTypes } = await req.json();

    if (!industry) {
      return new Response(
        JSON.stringify({ error: 'industry is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    // Fetch company AI profile for additional context
    let aiProfile = null;
    if (companyId) {
      const authz = await authorizeInternalRequest(req, companyId);
      if (!authz.ok) {
        return new Response(JSON.stringify({ error: authz.error }), {
          status: authz.status,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
      const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
      const supabase = createClient(supabaseUrl, supabaseKey);

      const { data: profileData } = await supabase
        .from('company_ai_content_profiles')
        .select('*')
        .eq('company_id', companyId)
        .maybeSingle();
      
      aiProfile = profileData;
    }

    // Build context
    const contextParts: string[] = [
      `Industry: ${industry}`,
      `Business Type: ${businessType || 'residential'}`,
    ];
    
    if (serviceArea) contextParts.push(`Service Area: ${serviceArea}`);
    if (description) contextParts.push(`Business Description: ${description}`);
    if (aiProfile?.unique_selling_points?.length > 0) {
      contextParts.push(`Unique Selling Points: ${aiProfile.unique_selling_points.join(', ')}`);
    }
    if (aiProfile?.target_audience) {
      contextParts.push(`Target Audience: ${aiProfile.target_audience}`);
    }

    const contextString = contextParts.join('\n');

    // Build generation instructions based on what's requested
    const generateInstructions: string[] = [];
    
    if (contentTypes?.faqs) {
      generateInstructions.push(`
"faqs": Generate 10-15 frequently asked questions and answers that customers commonly ask about ${industry} services. 
Each FAQ should have a "question" and "answer" field.
Focus on: pricing concerns, service processes, timing, warranties, emergency services, and common problems.`);
    }

    if (contentTypes?.services) {
      generateInstructions.push(`
"services": Generate 5-8 typical services offered by a ${industry} business.
Each service should have: "name" (string), "description" (1-2 sentence description), "price" (number or null if varies).
Include both common services and specialty services.`);
    }

    if (contentTypes?.business_hours) {
      generateInstructions.push(`
"business_hours": Generate standard business hours appropriate for a ${businessType} ${industry} business.
Return an array with 7 objects (one for each day), each having:
- "day_of_week": 0 (Sunday) through 6 (Saturday)
- "open_time": string like "08:00" (24hr format)
- "close_time": string like "17:00" (24hr format)
- "is_closed": boolean
Typical ${industry} businesses often have extended hours for emergencies.`);
    }

    const systemPrompt = `You are a knowledgeable assistant that generates structured business content for service companies.
Generate realistic, professional content that would be appropriate for a real ${industry} business.
Return ONLY valid JSON with no markdown formatting, code blocks, or explanation.`;

    const userPrompt = `Generate knowledge base content for a ${industry} business with the following context:

${contextString}

Return a JSON object with the following fields (only include fields that are requested):
${generateInstructions.join('\n')}

Important:
- Content should be professional and industry-appropriate
- FAQs should address real customer concerns
- Service prices should be realistic for the industry (or null if pricing varies)
- Business hours should match industry norms

Return ONLY the JSON object, no additional text.`;

    console.log(`Generating knowledge base for ${industry}, companyId: ${companyId || 'none'}`);

    const { response: response, modelUsed: responseModel, fellBackFromPrimary: responseFellBack } = await callAIGatewayWithFallback({
        model: 'google/gemini-3-flash-preview',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        temperature: 0.7,
        max_tokens: 4000,
      });
    if (responseFellBack) console.warn(`[generate-knowledge-base] primary model unavailable, served by ${responseModel}`);

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

    // Parse the JSON
    const generatedContent = JSON.parse(content);

    console.log(`Generated: ${Object.keys(generatedContent).join(', ')}`);

    return new Response(
      JSON.stringify(generatedContent),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error generating knowledge base:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Failed to generate content' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
