import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { guardedTavilyFetch } from '../_shared/tavily-guard.ts';
import { createClient } from "npm:@supabase/supabase-js@2";
import { loadIndustryPackForCompany, applyIndustryPackToPrompt } from "../_shared/industry-pack.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface GenerateVariationsRequest {
  topic: string;
  platforms: string[];
  companyId: string;
  includeImage: boolean;
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
      console.error("[generate-social-variations] JWT verification failed:", claimsError);
      return new Response(
        JSON.stringify({ error: "Unauthorized - Invalid token" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const callerId = claimsData.claims.sub;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // ============ PARSE REQUEST ============
    const { topic, platforms, companyId, includeImage } = await req.json() as GenerateVariationsRequest;

    if (!topic || !platforms?.length || !companyId) {
      return new Response(
        JSON.stringify({ error: "Missing required fields: topic, platforms, companyId" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // ============ VERIFY ACCESS ============
    const { data: profile } = await supabase
      .from("profiles")
      .select("company_id")
      .eq("id", callerId)
      .single();

    const { data: roles } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", callerId)
      .in("role", ["platform_admin", "company_admin"]);

    const isAdmin = roles && roles.length > 0;
    const belongsToCompany = profile?.company_id === companyId;

    if (!isAdmin && !belongsToCompany) {
      return new Response(
        JSON.stringify({ error: "Forbidden - Access denied to this company" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("[generate-social-variations] Generating for platforms:", platforms);

    // ============ FETCH TAVILY API KEY ============
    const { data: integrations } = await supabase
      .from("tenant_integrations")
      .select("tavily_api_key")
      .eq("company_id", companyId)
      .maybeSingle();

    let tavilyResearch = '';
    if (integrations?.tavily_api_key) {
      console.log("[generate-social-variations] Tavily connected, researching trends...");
      try {
        const searchQuery = `${topic} marketing trends social media`;
        const tavilyResponse = await guardedTavilyFetch({
            supabase, companyId,
            apiKey: integrations.tavily_api_key,
            source: 'generate-social-variations',
            body: { query: searchQuery,
            search_depth: "basic",
            max_results: 3,
            include_answer: true },
          });
          if (tavilyResponse === null) { /* Tavily skipped: cap reached or unavailable */ } else

        if (tavilyResponse.ok) {
          const tavilyData = await tavilyResponse.json();
          const insights: string[] = [];
          
          if (tavilyData.answer) {
            insights.push(`Key Insight: ${tavilyData.answer}`);
          }
          
          if (tavilyData.results?.length > 0) {
            const topResults = tavilyData.results.slice(0, 3);
            topResults.forEach((r: any, idx: number) => {
              if (r.content) {
                insights.push(`Source ${idx + 1}: ${r.content.substring(0, 200)}...`);
              }
            });
          }

          if (insights.length > 0) {
            tavilyResearch = `\n\n=== CURRENT TRENDS & RESEARCH ===\n${insights.join('\n\n')}`;
          }
          console.log("[generate-social-variations] Tavily research added to context");
        }
      } catch (tavilyError) {
        console.error("[generate-social-variations] Tavily error (continuing without):", tavilyError);
      }
    }

    // ============ FETCH COMPREHENSIVE CONTEXT ============
    const [
      companyRes,
      aiProfileRes,
      activeCampaignRes,
      websiteRes,
      servicesRes,
      faqsRes,
      hoursRes,
      inventoryRes
    ] = await Promise.all([
      supabase.from("companies").select("name, service_categories").eq("id", companyId).single(),
      supabase.from("company_ai_content_profiles").select("*").eq("company_id", companyId).maybeSingle(),
      supabase.from("marketing_campaigns")
        .select("name, campaign_type, discount_type, discount_value, promo_code")
        .eq("company_id", companyId).eq("status", "active")
        .order("created_at", { ascending: false }).limit(1).maybeSingle(),
      supabase.from("smart_websites").select("cta_button_text, cta_button_url").eq("company_id", companyId).maybeSingle(),
      supabase.from("services").select("name, description, base_price, duration_minutes")
        .eq("company_id", companyId).eq("is_active", true).limit(15),
      supabase.from("faqs").select("question, answer, category").eq("company_id", companyId).limit(20),
      supabase.from("business_hours").select("*").eq("company_id", companyId),
      supabase.from("inventory_items").select("name, category, brand")
        .eq("company_id", companyId).limit(15),
    ]);

    const company = companyRes.data;
    const aiProfile = aiProfileRes.data;
    const activeCampaign = activeCampaignRes.data;
    const website = websiteRes.data;
    const services = servicesRes.data || [];
    const faqs = faqsRes.data || [];
    const hours = hoursRes.data || [];
    const inventory = inventoryRes.data || [];

    const companyName = company?.name || "Our Company";
    const serviceCategories = company?.service_categories || [];
    const brandTone = aiProfile?.tone || "professional";
    const brandVoice = aiProfile?.brand_voice || "Friendly and approachable";
    const avoidKeywords = aiProfile?.avoid_keywords?.join(", ") || "none specified";
    const contentTopics = aiProfile?.content_topics || [];
    const keywords = aiProfile?.keywords || [];
    const usps = aiProfile?.unique_selling_points || [];
    const targetAudience = aiProfile?.target_audience || "";
    const ctaTarget = website?.cta_button_text || "Contact Us";
    const ctaUrl = website?.cta_button_url || "website";

    const campaignContext = activeCampaign 
      ? `${activeCampaign.name} - ${activeCampaign.campaign_type} with ${activeCampaign.discount_value}${activeCampaign.discount_type === 'percentage' ? '%' : '$'} off (code: ${activeCampaign.promo_code || 'N/A'})`
      : "No active campaign";

    // Format business hours
    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const formattedHours = hours.map(h => 
      `${dayNames[h.day_of_week]}: ${h.is_closed ? 'Closed' : `${h.open_time} - ${h.close_time}`}`
    ).join('\n') || "Not specified";

    // Build knowledge base context
    const servicesContext = services.map(s => 
      `• ${s.name}: ${s.description || 'No description'}${s.base_price ? ` ($${s.base_price})` : ''}`
    ).join('\n') || "No services listed";

    const faqsContext = faqs.map(f => `Q: ${f.question}\nA: ${f.answer}`).join('\n\n') || "No FAQs";

    const inventoryContext = inventory.map(i =>
      `• ${i.name}${i.brand ? ` (${i.brand})` : ''}${i.category ? ` - ${i.category}` : ''}`
    ).join('\n') || "No inventory listed";

    // ============ BUILD ENHANCED SYSTEM PROMPT ============
    const systemPrompt = `Role: You are the "Aura Content Strategist" for ${companyName}.
${tavilyResearch}

=== KNOWLEDGE BASE ===
Services Offered:
${servicesContext}

FAQs:
${faqsContext}

Business Hours:
${formattedHours}

Equipment/Products Available:
${inventoryContext}

=== AI PROFILE ===
Brand Voice: ${brandTone} - ${brandVoice}
Target Audience: ${targetAudience || "General customers"}
Key USPs: ${usps.join(', ') || "Quality service"}
Industry: ${serviceCategories.join(", ") || "Home Services"}
Keywords to Use: ${keywords.join(', ') || "service, quality, professional"}
Keywords to Avoid: ${avoidKeywords}

=== CONTENT TOPICS ===
${contentTopics.length > 0 ? `Focus on these themes:\n${contentTopics.map((t: string) => `• ${t}`).join('\n')}` : "Generate content based on the topic provided."}

=== ACTIVE CAMPAIGN ===
${campaignContext}

=== TASK ===
Generate platform-optimized social media content based on the user's topic.

Platform Requirements:
- Instagram (max 2200 chars): Engaging, visual-focused, include relevant hashtags
- Facebook (max 500 chars): Shareable, community-oriented
- LinkedIn (max 3000 chars): Professional, industry insight focused
- TikTok (max 2200 chars): Hook-heavy, trendy, conversational
- Google Business (max 1500 chars): Local SEO focused, professional
- SMS (max 160 chars): Concise, action-oriented

=== RULES ===
- Only state facts present in the Knowledge Base when mentioning services, prices, or capabilities
- Match brand voice consistently across all platforms
- ${includeImage ? "Content will accompany an image - reference visuals naturally" : "No image - content should stand alone"}
- Include relevant hashtags for Instagram and TikTok only
- CTA must align with: ${ctaTarget} → ${ctaUrl}`;

    const industryPack = await loadIndustryPackForCompany(supabase, companyId);
    const industrySystemPrompt = applyIndustryPackToPrompt(systemPrompt, industryPack, 'social');

    const userPrompt = `Create social media content about: "${topic}"

Generate unique, platform-optimized content for: ${platforms.join(", ")}`;

    // ============ BUILD TOOL SCHEMA ============
    const platformSchemas: Record<string, any> = {
      instagram: {
        type: "object",
        properties: {
          content: { type: "string", description: "Instagram caption (max 2200 chars)" },
          hashtags: { type: "array", items: { type: "string" }, description: "Relevant hashtags without # prefix" },
        },
        required: ["content", "hashtags"],
      },
      facebook: {
        type: "object",
        properties: {
          content: { type: "string", description: "Facebook post (max 500 chars)" },
        },
        required: ["content"],
      },
      linkedin: {
        type: "object",
        properties: {
          content: { type: "string", description: "LinkedIn post (max 3000 chars)" },
        },
        required: ["content"],
      },
      tiktok: {
        type: "object",
        properties: {
          content: { type: "string", description: "TikTok caption (max 2200 chars)" },
          hashtags: { type: "array", items: { type: "string" }, description: "Trending hashtags without # prefix" },
        },
        required: ["content", "hashtags"],
      },
      google_business: {
        type: "object",
        properties: {
          content: { type: "string", description: "Google Business post (max 1500 chars)" },
        },
        required: ["content"],
      },
      sms: {
        type: "object",
        properties: {
          content: { type: "string", description: "SMS message (max 160 chars)" },
        },
        required: ["content"],
      },
    };

    // Only include schemas for requested platforms
    const requestedSchemas: Record<string, any> = {};
    for (const platform of platforms) {
      if (platformSchemas[platform]) {
        requestedSchemas[platform] = platformSchemas[platform];
      }
    }

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
          { role: "system", content: industrySystemPrompt },
          { role: "user", content: userPrompt },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "generate_platform_content",
              description: "Generate platform-specific social media content variations",
              parameters: {
                type: "object",
                properties: requestedSchemas,
                required: platforms,
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "generate_platform_content" } },
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
      console.error("[generate-social-variations] AI error:", response.status, errorText);
      return new Response(
        JSON.stringify({ error: "Failed to generate content" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const aiData = await response.json();
    const toolCall = aiData.choices?.[0]?.message?.tool_calls?.[0];
    
    if (!toolCall?.function?.arguments) {
      console.error("[generate-social-variations] No tool call response");
      return new Response(
        JSON.stringify({ error: "Invalid AI response" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const variations = JSON.parse(toolCall.function.arguments);
    console.log("[generate-social-variations] Generated variations for:", Object.keys(variations));

    return new Response(
      JSON.stringify({ variations }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("[generate-social-variations] Error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
