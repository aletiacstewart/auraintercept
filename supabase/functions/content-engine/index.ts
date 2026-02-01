import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

type ContentChannel = "website" | "social" | "campaign" | "blog" | "lead" | "sms";

interface ContentEngineRequest {
  channel: ContentChannel;
  contentType: string;
  topic: string;
  companyId: string;
  additionalContext?: Record<string, unknown>;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const lovableApiKey = Deno.env.get("LOVABLE_API_KEY")!;

    // ============ AUTHORIZATION CHECK ============
    const authHeader = req.headers.get("authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return new Response(
        JSON.stringify({ error: "Unauthorized - Missing or invalid authorization header" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } }
    });

    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsError } = await supabaseClient.auth.getClaims(token);
    
    if (claimsError || !claimsData?.claims) {
      console.error("[content-engine] JWT verification failed:", claimsError);
      return new Response(
        JSON.stringify({ error: "Unauthorized - Invalid token" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const callerId = claimsData.claims.sub;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Verify user has access to this company
    const { data: profile } = await supabase
      .from("profiles")
      .select("company_id")
      .eq("id", callerId)
      .single();

    const { channel, contentType, topic, companyId, additionalContext } = 
      await req.json() as ContentEngineRequest;

    const { data: roles } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", callerId)
      .in("role", ["platform_admin", "company_admin"]);

    const isAdmin = roles && roles.length > 0;
    const belongsToCompany = profile?.company_id === companyId;

    if (!isAdmin && !belongsToCompany) {
      console.error("[content-engine] Access denied for user:", callerId);
      return new Response(
        JSON.stringify({ error: "Forbidden - Access denied to this company" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!channel || !topic || !companyId) {
      return new Response(
        JSON.stringify({ error: "Missing required fields: channel, topic, companyId" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("[content-engine] Generating content for channel:", channel, "type:", contentType);

    // ============ FETCH COMPANY CONTEXT ============
    const [companyRes, aiProfileRes, servicesRes, websiteRes] = await Promise.all([
      supabase.from("companies").select("name, service_categories, phone, email").eq("id", companyId).single(),
      supabase.from("company_ai_content_profiles").select("*").eq("company_id", companyId).maybeSingle(),
      supabase.from("services").select("name, description, base_price").eq("company_id", companyId).eq("is_active", true).limit(10),
      supabase.from("smart_websites").select("cta_button_text, cta_button_url").eq("company_id", companyId).maybeSingle(),
    ]);

    const company = companyRes.data;
    const aiProfile = aiProfileRes.data;
    const services = servicesRes.data || [];
    const website = websiteRes.data;

    const companyName = company?.name || "Our Company";
    const brandTone = aiProfile?.tone || "professional";
    const brandVoice = aiProfile?.brand_voice || "Friendly and approachable";
    const targetAudience = aiProfile?.target_audience || "General customers";
    const usps = aiProfile?.unique_selling_points || [];
    const keywords = aiProfile?.keywords || [];
    const avoidKeywords = aiProfile?.avoid_keywords || [];
    const ctaText = website?.cta_button_text || "Contact Us";
    const ctaUrl = website?.cta_button_url || "";

    const servicesContext = services.map(s => 
      `• ${s.name}: ${s.description || 'Professional service'}${s.base_price ? ` ($${s.base_price})` : ''}`
    ).join('\n') || "Professional services";

    // ============ BUILD SYSTEM PROMPT ============
    const systemPrompt = `You are the Creative Agent for ${companyName}, a unified AI content engine.

=== BRAND PROFILE ===
Company: ${companyName}
Industry: ${company?.service_categories?.join(", ") || "Service Business"}
Tone: ${brandTone}
Voice: ${brandVoice}
Target Audience: ${targetAudience}
Key USPs: ${usps.join(", ") || "Quality and reliability"}
Keywords to Include: ${keywords.join(", ") || "professional, quality, service"}
Keywords to Avoid: ${avoidKeywords.join(", ") || "none specified"}

=== SERVICES ===
${servicesContext}

=== CTA ===
Primary CTA: ${ctaText}${ctaUrl ? ` → ${ctaUrl}` : ""}

=== RULES ===
1. Always maintain brand voice consistency
2. Include relevant keywords naturally
3. Avoid prohibited keywords
4. Match the specified platform's best practices
5. Include a clear call-to-action when appropriate`;

    // ============ BUILD CHANNEL-SPECIFIC PROMPTS ============
    const channelPrompts: Record<ContentChannel, string> = {
      website: `Generate professional website copy for: ${topic}
Content Type: ${contentType || "general"}
Include: headline, subheadline, body copy, and CTA
Format: JSON with fields: headline, subheadline, body, cta`,

      social: `Generate social media content for: ${topic}
Platforms: Instagram, Facebook, LinkedIn, TikTok, Google Business, SMS
For each platform, include optimized copy with appropriate length, hashtags (where applicable), and tone.
Format: JSON with platform keys containing: post, hashtags (array), character_count`,

      campaign: `Generate email/SMS marketing campaign content for: ${topic}
Campaign Type: ${contentType || "promotional"}
Include: subject line, preview text, headline, body copy, CTA button text
Format: JSON with fields: subject, preview, headline, body, cta_text`,

      blog: `Generate a blog post for: ${topic}
Include: SEO title (under 60 chars), meta description (under 160 chars), excerpt, full content with headers
Format: JSON with fields: title, meta_description, excerpt, content (markdown)`,

      lead: `Generate lead nurturing content for: ${topic}
Sequence Type: ${contentType || "welcome"}
Create a 3-email sequence with increasing engagement
Format: JSON array with objects containing: subject, body, cta, delay_days`,

      sms: `Generate SMS templates for: ${topic}
Type: ${contentType || "reminder"}
Create 3 variations under 160 characters each
Format: JSON array with objects containing: message, character_count`,
    };

    const userPrompt = channelPrompts[channel] || `Generate content for ${topic}`;

    // ============ CALL LOVABLE AI ============
    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${lovableApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt + (additionalContext ? `\n\nAdditional context: ${JSON.stringify(additionalContext)}` : "") },
        ],
        response_format: { type: "json_object" },
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded, please try again later." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "Payment required, please add credits to your workspace." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const errorText = await response.text();
      console.error("[content-engine] AI error:", response.status, errorText);
      return new Response(
        JSON.stringify({ error: "Failed to generate content" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const aiData = await response.json();
    const contentText = aiData.choices?.[0]?.message?.content;
    
    if (!contentText) {
      console.error("[content-engine] No content in response");
      return new Response(
        JSON.stringify({ error: "Invalid AI response" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    let content;
    try {
      content = JSON.parse(contentText);
    } catch {
      // If not valid JSON, return as raw text
      content = { raw: contentText };
    }

    console.log("[content-engine] Generated content for channel:", channel);

    return new Response(
      JSON.stringify({
        success: true,
        channel,
        contentType,
        topic,
        content,
        metadata: {
          model: "google/gemini-3-flash-preview",
          generatedAt: new Date().toISOString(),
          companyId,
        },
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("[content-engine] Error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
