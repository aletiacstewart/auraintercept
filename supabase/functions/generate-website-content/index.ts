import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const CONTENT_PROMPTS: Record<string, { generate: string; reword: string }> = {
  hero_headline: {
    generate: "Create a compelling, attention-grabbing headline for the website hero section. Maximum 60 characters. Make it bold, memorable, and action-oriented.",
    reword: "Improve this headline to be more compelling and attention-grabbing. Keep it under 60 characters. Maintain the core message but make it more impactful."
  },
  hero_subheadline: {
    generate: "Create a supportive subheadline that expands on the main value proposition. Maximum 120 characters. Should complement the headline and encourage action.",
    reword: "Improve this subheadline to better support the main message. Keep it under 120 characters. Make it more engaging and benefit-focused."
  },
  cta_text: {
    generate: "Create a short, action-oriented call-to-action button text. Maximum 25 characters. Should create urgency and clearly state the action.",
    reword: "Improve this call-to-action to be more compelling. Keep it under 25 characters. Make it action-oriented and create urgency."
  },
  night_headline: {
    generate: "Create an after-hours/emergency headline that conveys urgency and availability. Maximum 60 characters. Should reassure customers they can get help.",
    reword: "Improve this after-hours headline to better convey urgency and availability. Keep it under 60 characters."
  },
  night_subheadline: {
    generate: "Create a supportive after-hours subheadline emphasizing 24/7 availability or emergency services. Maximum 120 characters.",
    reword: "Improve this after-hours subheadline to better emphasize availability. Keep it under 120 characters."
  },
  emergency_cta: {
    generate: "Create an urgent call-to-action for emergency services. Maximum 25 characters. Should convey immediacy.",
    reword: "Improve this emergency CTA to convey more urgency. Keep it under 25 characters."
  },
  about_header: {
    generate: "Create a compelling 'About Us' section header. Maximum 50 characters. Should be welcoming and professional.",
    reword: "Improve this about section header to be more engaging. Keep it under 50 characters."
  },
  about_subheader: {
    generate: "Create a brief tagline or mission statement for the about section. Maximum 80 characters.",
    reword: "Improve this about section tagline. Keep it under 80 characters. Make it more memorable."
  },
  about_paragraph: {
    generate: "Write a compelling about us paragraph (2-3 sentences) that highlights the company's expertise, values, and commitment to customers. Maximum 300 characters.",
    reword: "Improve this about section paragraph. Keep similar length but make it more engaging and professional. Highlight key benefits."
  },
  holiday_headline: {
    generate: "Create a festive, themed headline for this holiday. Maximum 60 characters. Should be warm and celebratory.",
    reword: "Improve this holiday headline to be more festive and engaging. Keep it under 60 characters."
  },
  holiday_subheadline: {
    generate: "Create a holiday-themed subheadline with special offers or warm wishes. Maximum 100 characters.",
    reword: "Improve this holiday subheadline. Keep it under 100 characters. Make it more engaging."
  },
  service_name: {
    generate: "Create a professional, clear service name. Maximum 40 characters. Should be descriptive and easy to understand.",
    reword: "Improve this service name to be more professional and descriptive. Keep it under 40 characters."
  },
  service_description: {
    generate: "Write a compelling service description (1-2 sentences) highlighting benefits and value. Maximum 200 characters.",
    reword: "Improve this service description. Keep similar length but emphasize benefits and value proposition."
  },
  email_subject: {
    generate: "Create an engaging email subject line that encourages opens. Maximum 60 characters. Avoid spam trigger words.",
    reword: "Improve this email subject to increase open rates. Keep it under 60 characters. Make it more compelling."
  },
  email_heading: {
    generate: "Create a clear, professional email heading. Maximum 50 characters.",
    reword: "Improve this email heading to be more engaging. Keep it under 50 characters."
  },
  email_message: {
    generate: "Write a professional, friendly email message body. Include a clear call-to-action. Maximum 500 characters.",
    reword: "Improve this email message. Keep similar length but make it more engaging and professional."
  },
  social_content: {
    generate: "Create engaging social media content. Include relevant emojis. Adapt length for the platform.",
    reword: "Improve this social media content. Make it more engaging while maintaining the core message. Include appropriate emojis."
  },
  keywords_suggestion: {
    generate: "Generate 15 highly relevant SEO keywords for this business based on the industries provided. Focus on: services, solutions, customer pain points, local search terms, and industry-specific terminology. Return ONLY a JSON array of keyword strings with no explanation. Example format: [\"keyword1\", \"keyword2\", \"keyword3\"]",
    reword: "Suggest alternative keywords based on the existing ones provided."
  }
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { contentType, action, existingContent, context, companyId } = await req.json();

    if (!contentType || !action) {
      return new Response(
        JSON.stringify({ error: 'contentType and action are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const promptConfig = CONTENT_PROMPTS[contentType];
    if (!promptConfig) {
      return new Response(
        JSON.stringify({ error: `Unknown content type: ${contentType}` }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    // Fetch AI Content Profile and Services from database if companyId is provided
    let aiProfile = null;
    let services: string[] = [];
    
    if (companyId) {
      const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
      const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
      const supabase = createClient(supabaseUrl, supabaseKey);

      // Fetch AI Content Profile
      const { data: profileData } = await supabase
        .from('company_ai_content_profiles')
        .select('*')
        .eq('company_id', companyId)
        .maybeSingle();
      
      aiProfile = profileData;

      // Fetch active services
      const { data: servicesData } = await supabase
        .from('services')
        .select('name, description')
        .eq('company_id', companyId)
        .eq('is_active', true)
        .limit(10);
      
      if (servicesData) {
        services = servicesData.map(s => s.name);
      }
    }

    // Build comprehensive context string
    const contextParts: string[] = [];
    
    // Basic context from props
    if (context?.companyName) contextParts.push(`Company Name: ${context.companyName}`);
    if (context?.holidayName) contextParts.push(`Holiday: ${context.holidayName}`);
    if (context?.platform) contextParts.push(`Platform: ${context.platform}`);
    if (context?.templateType) contextParts.push(`Template Type: ${context.templateType}`);
    if (context?.serviceType) contextParts.push(`Service Type: ${context.serviceType}`);
    
    // Rich context from AI Content Profile (stored in Knowledge Base)
    if (aiProfile) {
      if (aiProfile.primary_industry) {
        contextParts.push(`Primary Industry: ${aiProfile.primary_industry}`);
      }
      if (aiProfile.secondary_industries?.length > 0) {
        contextParts.push(`Related Industries: ${aiProfile.secondary_industries.join(', ')}`);
      }
      if (aiProfile.keywords?.length > 0) {
        contextParts.push(`Key Terms to Include: ${aiProfile.keywords.join(', ')}`);
      }
      if (aiProfile.business_description) {
        contextParts.push(`Business Description: ${aiProfile.business_description}`);
      }
      if (aiProfile.unique_selling_points?.length > 0) {
        contextParts.push(`Unique Selling Points: ${aiProfile.unique_selling_points.join(', ')}`);
      }
      if (aiProfile.target_audience) {
        contextParts.push(`Target Audience: ${aiProfile.target_audience}`);
      }
      if (aiProfile.tone) {
        contextParts.push(`Preferred Tone: ${aiProfile.tone}`);
      }
      if (aiProfile.brand_voice) {
        contextParts.push(`Brand Voice: ${aiProfile.brand_voice}`);
      }
      if (aiProfile.avoid_keywords?.length > 0) {
        contextParts.push(`Words/Phrases to Avoid: ${aiProfile.avoid_keywords.join(', ')}`);
      }
    } else {
      // Fallback to basic context props if no AI profile exists
      if (context?.industry) contextParts.push(`Industry: ${context.industry}`);
      if (context?.tone) contextParts.push(`Tone: ${context.tone}`);
    }
    
    // Add services context
    if (services.length > 0) {
      contextParts.push(`Services Offered: ${services.join(', ')}`);
    }

    const contextString = contextParts.length > 0 
      ? `\n\nBusiness Context:\n${contextParts.join('\n')}`
      : '';

    // Build avoidance instructions
    let avoidanceInstructions = '';
    if (aiProfile?.avoid_keywords?.length > 0) {
      avoidanceInstructions = `\n\nIMPORTANT: Do NOT use these words/phrases: ${aiProfile.avoid_keywords.join(', ')}`;
    }

    let userPrompt = '';
    if (action === 'generate') {
      userPrompt = promptConfig.generate + contextString + avoidanceInstructions;
    } else if (action === 'reword') {
      if (!existingContent) {
        return new Response(
          JSON.stringify({ error: 'existingContent is required for reword action' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      userPrompt = `${promptConfig.reword}${contextString}${avoidanceInstructions}\n\nOriginal content:\n"${existingContent}"`;
    } else {
      return new Response(
        JSON.stringify({ error: 'action must be either "generate" or "reword"' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Generating content for ${contentType}, action: ${action}, companyId: ${companyId || 'none'}`);
    console.log(`Context parts: ${contextParts.length}, AI Profile: ${aiProfile ? 'yes' : 'no'}, Services: ${services.length}`);

    // Build system prompt with tone guidance
    let toneGuidance = '';
    if (aiProfile?.tone) {
      const toneDescriptions: Record<string, string> = {
        professional: 'Use a professional, business-like tone that conveys expertise and trust.',
        friendly: 'Use a warm, approachable tone that makes customers feel welcome.',
        casual: 'Use a relaxed, conversational tone that feels natural and relatable.',
        formal: 'Use a traditional, sophisticated tone that conveys authority and prestige.',
        energetic: 'Use a dynamic, exciting tone that creates enthusiasm and energy.',
        empathetic: 'Use an understanding, caring tone that shows you genuinely care about customers.',
        authoritative: 'Use an expert, confident tone that establishes credibility and leadership.',
      };
      toneGuidance = toneDescriptions[aiProfile.tone] || '';
    }

    const systemPrompt = `You are a professional marketing copywriter specializing in Aura Web Presence pages for service businesses. 
Generate concise, engaging content that:
- Is clear and easy to read
- Focuses on customer benefits
- Uses active voice
- Avoids jargon unless industry-specific
- Creates trust and professionalism
${toneGuidance ? `\nTone: ${toneGuidance}` : ''}
${aiProfile?.brand_voice ? `\nBrand Voice: ${aiProfile.brand_voice}` : ''}

IMPORTANT: Return ONLY the generated content, no explanations, quotes, or additional text.
The content must be specifically relevant to the business described in the context.`;

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-3-flash-preview',
        messages: [
          {
            role: 'system',
            content: systemPrompt
          },
          {
            role: 'user',
            content: userPrompt
          }
        ],
        temperature: 0.7,
        max_tokens: 500,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: 'Rate limit exceeded. Please try again in a moment.' }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: 'AI credits exhausted. Please add credits to continue.' }),
          { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      const errorText = await response.text();
      console.error('AI gateway error:', response.status, errorText);
      throw new Error(`AI gateway error: ${response.status}`);
    }

    const data = await response.json();
    const generatedContent = data.choices?.[0]?.message?.content?.trim();

    if (!generatedContent) {
      throw new Error('No content generated');
    }

    console.log(`Generated content: ${generatedContent.substring(0, 50)}...`);

    return new Response(
      JSON.stringify({ content: generatedContent }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error generating content:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Failed to generate content' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});