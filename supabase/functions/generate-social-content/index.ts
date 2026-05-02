import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface GenerateSocialContentRequest {
  jobAssignmentId: string;
  afterPhotos: string[];
  companyId: string;
  serviceType?: string;
  customerName?: string;
  employeeName?: string;
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

    // Verify the caller's JWT
    const supabaseClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } }
    });

    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsError } = await supabaseClient.auth.getClaims(token);
    
    if (claimsError || !claimsData?.claims) {
      console.error("[generate-social-content] JWT verification failed:", claimsError);
      return new Response(
        JSON.stringify({ error: "Unauthorized - Invalid token" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const callerId = claimsData.claims.sub;
    // ============ END AUTHORIZATION CHECK ============

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Verify user has access to this company (via profile or admin role)
    const { data: profile } = await supabase
      .from("profiles")
      .select("company_id")
      .eq("id", callerId)
      .single();

    const { jobAssignmentId, afterPhotos, companyId, serviceType, customerName, employeeName } = 
      await req.json() as GenerateSocialContentRequest;

    // Check if user belongs to the company or is an admin
    const { data: roles } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", callerId)
      .in("role", ["platform_admin", "company_admin"]);

    const isAdmin = roles && roles.length > 0;
    const belongsToCompany = profile?.company_id === companyId;

    if (!isAdmin && !belongsToCompany) {
      console.error("[generate-social-content] Access denied for user:", callerId);
      return new Response(
        JSON.stringify({ error: "Forbidden - Access denied to this company" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("[generate-social-content] Processing job:", jobAssignmentId);
    console.log("[generate-social-content] Photos:", afterPhotos?.length || 0);

    if (!jobAssignmentId || !companyId) {
      return new Response(
        JSON.stringify({ error: "Missing required fields: jobAssignmentId, companyId" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // ============ FETCH COMPREHENSIVE KNOWLEDGE BASE CONTEXT ============
    const [
      companyRes,
      aiProfileRes,
      servicesRes,
      faqsRes,
      hoursRes,
      inventoryRes,
      activeCampaignRes,
      websiteRes
    ] = await Promise.all([
      supabase.from("companies").select("name, service_categories").eq("id", companyId).single(),
      supabase.from("company_ai_content_profiles").select("*").eq("company_id", companyId).maybeSingle(),
      supabase.from("services").select("name, description, base_price, duration_minutes")
        .eq("company_id", companyId).eq("is_active", true).limit(15),
      supabase.from("faqs").select("question, answer, category").eq("company_id", companyId).limit(20),
      supabase.from("business_hours").select("*").eq("company_id", companyId),
      supabase.from("inventory_items").select("name, category, brand")
        .eq("company_id", companyId).limit(15),
      supabase.from("marketing_campaigns")
        .select("name, campaign_type, discount_type, discount_value, promo_code")
        .eq("company_id", companyId).eq("status", "active")
        .order("created_at", { ascending: false }).limit(1).maybeSingle(),
      supabase.from("smart_websites").select("cta_button_text, cta_button_url").eq("company_id", companyId).maybeSingle(),
    ]);

    const company = companyRes.data;
    const aiProfile = aiProfileRes.data;
    const services = servicesRes.data || [];
    const faqs = faqsRes.data || [];
    const hours = hoursRes.data || [];
    const inventory = inventoryRes.data || [];
    const activeCampaign = activeCampaignRes.data;
    const website = websiteRes.data;

    const companyName = company?.name || "Our Company";
    const serviceCategories = company?.service_categories || [];
    const service = serviceType || "service";

    // Format business hours
    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const formattedHours = hours.map(h => 
      `${dayNames[h.day_of_week]}: ${h.is_closed ? 'Closed' : `${h.open_time} - ${h.close_time}`}`
    ).join('\n') || "Not specified";

    // Build comprehensive knowledge base context
    const servicesContext = services.map(s => 
      `• ${s.name}: ${s.description || 'No description'}${s.base_price ? ` ($${s.base_price})` : ''}`
    ).join('\n') || "No services listed";

    const faqsContext = faqs.map(f => `Q: ${f.question}\nA: ${f.answer}`).join('\n\n') || "No FAQs";
    
    const warrantiesContext = warranties.map(w => 
      `• ${w.name}: ${w.coverage_details || 'Standard coverage'}${w.duration_months ? ` (${w.duration_months} months)` : ''}`
    ).join('\n') || "No warranties listed";

    const inventoryContext = inventory.map(i => 
      `• ${i.name}${i.brand ? ` (${i.brand})` : ''}${i.category ? ` - ${i.category}` : ''}`
    ).join('\n') || "No inventory listed";

    const campaignContext = activeCampaign 
      ? `${activeCampaign.name} - ${activeCampaign.campaign_type} with ${activeCampaign.discount_value}${activeCampaign.discount_type === 'percentage' ? '%' : '$'} off (code: ${activeCampaign.promo_code || 'N/A'})`
      : "No active campaign";

    const brandTone = aiProfile?.tone || "professional";
    const brandVoice = aiProfile?.brand_voice || "Friendly and approachable";
    const avoidKeywords = aiProfile?.avoid_keywords?.join(", ") || "none specified";
    const contentTopics = aiProfile?.content_topics || [];
    const keywords = aiProfile?.keywords || [];
    const usps = aiProfile?.unique_selling_points || [];
    const targetAudience = aiProfile?.target_audience || "";
    const ctaTarget = website?.cta_button_text || "Contact Us";
    const ctaUrl = website?.cta_button_url || "website";

    // ============ BUILD ENHANCED SYSTEM PROMPT ============
    const systemPrompt = `Role: You are the "Aura Intercept Content Strategist." Your purpose is to act as a specialized social media manager for the company: ${companyName}.

=== KNOWLEDGE BASE ===
Services Offered:
${servicesContext}

FAQs:
${faqsContext}

Business Hours:
${formattedHours}

Warranties & Guarantees:
${warrantiesContext}

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
${contentTopics.length > 0 ? `Focus on these themes:\n${contentTopics.map((t: string) => `• ${t}`).join('\n')}` : "Generate content based on the job details."}

=== ACTIVE CAMPAIGN ===
${campaignContext}

=== TASK ===
Analyze the job completion details and generate high-engagement social media posts for multiple platforms.

Output Requirements:
For each platform, generate:
1. "post_body": Platform-optimized text with appropriate tone and length
2. "media_instructions": Which uploaded asset(s) should be used and how
3. "api_metadata": Platform-specific publishing metadata

=== RULES ===
- Only use facts present in the Knowledge Base when mentioning services, prices, or capabilities
- If content is AI-generated, include the 'is_aigc' flag for TikTok compliance
- CTA must align with: ${ctaTarget} → ${ctaUrl}
- Match platform character limits:
  * Instagram: 2200 chars max
  * Google Business: 1500 chars max
  * Facebook: 500 chars max
  * LinkedIn: 3000 chars max
  * TikTok: 2200 chars max (title)
  * SMS: 160 chars max`;

    const userPrompt = `A technician${employeeName ? ` named ${employeeName}` : ""} just completed a ${service} job${customerName ? ` for a customer` : ""}.
${afterPhotos?.length ? `They uploaded ${afterPhotos.length} photo(s) of the completed work.` : "No photos available."}

Generate social media content for all 6 platforms:
1. Instagram (engaging caption with hashtags)
2. Google Business Profile (professional post)
3. Facebook (shareable community post)
4. LinkedIn (professional industry insight)
5. TikTok (hook-heavy, trending format)
6. SMS (personalized thank you with review request)`;

    // ============ CALL LOVABLE AI WITH ENHANCED TOOL ============
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
          { role: "user", content: userPrompt },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "generate_social_content",
              description: "Generate social media content for multiple platforms with API-ready metadata",
              parameters: {
                type: "object",
                properties: {
                  instagram: {
                    type: "object",
                    properties: {
                      post_body: { type: "string", description: "Instagram caption text (max 2200 chars)" },
                      media_instructions: { type: "string", description: "Which photo(s) to use and any editing suggestions" },
                      api_metadata: {
                        type: "object",
                        properties: {
                          caption: { type: "string" },
                          hashtags: { type: "array", items: { type: "string" } },
                        },
                        required: ["caption", "hashtags"],
                      },
                    },
                    required: ["post_body", "media_instructions", "api_metadata"],
                  },
                  google_business: {
                    type: "object",
                    properties: {
                      post_body: { type: "string", description: "Google Business post (max 1500 chars)" },
                      media_instructions: { type: "string" },
                      api_metadata: {
                        type: "object",
                        properties: {
                          summary: { type: "string" },
                          call_to_action: { type: "string" },
                        },
                      },
                    },
                    required: ["post_body", "media_instructions"],
                  },
                  facebook: {
                    type: "object",
                    properties: {
                      post_body: { type: "string", description: "Facebook post (max 500 chars)" },
                      media_instructions: { type: "string" },
                      api_metadata: {
                        type: "object",
                        properties: {
                          message: { type: "string" },
                        },
                      },
                    },
                    required: ["post_body", "media_instructions"],
                  },
                  linkedin: {
                    type: "object",
                    properties: {
                      post_body: { type: "string", description: "LinkedIn professional post (max 3000 chars)" },
                      media_instructions: { type: "string" },
                      api_metadata: {
                        type: "object",
                        properties: {
                          commentary: { type: "string" },
                          visibility: { type: "string", enum: ["PUBLIC", "CONNECTIONS"] },
                        },
                        required: ["commentary", "visibility"],
                      },
                    },
                    required: ["post_body", "media_instructions", "api_metadata"],
                  },
                  tiktok: {
                    type: "object",
                    properties: {
                      post_body: { type: "string", description: "TikTok caption/script (hook-heavy, max 2200 chars)" },
                      media_instructions: { type: "string" },
                      api_metadata: {
                        type: "object",
                        properties: {
                          title: { type: "string", description: "TikTok video title" },
                          is_aigc: { type: "boolean", description: "AI-generated content disclosure (always true)" },
                        },
                        required: ["title", "is_aigc"],
                      },
                    },
                    required: ["post_body", "media_instructions", "api_metadata"],
                  },
                  sms: {
                    type: "object",
                    properties: {
                      post_body: { type: "string", description: "SMS template with {customer_name} placeholder (max 160 chars)" },
                      media_instructions: { type: "string" },
                      api_metadata: {
                        type: "object",
                        properties: {
                          template: { type: "string" },
                        },
                      },
                    },
                    required: ["post_body"],
                  },
                },
                required: ["instagram", "google_business", "facebook", "linkedin", "tiktok", "sms"],
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "generate_social_content" } },
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
      console.error("[generate-social-content] AI error:", response.status, errorText);
      return new Response(
        JSON.stringify({ error: "Failed to generate content" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const aiData = await response.json();
    const toolCall = aiData.choices?.[0]?.message?.tool_calls?.[0];
    
    if (!toolCall?.function?.arguments) {
      console.error("[generate-social-content] No tool call response");
      return new Response(
        JSON.stringify({ error: "Invalid AI response" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const content = JSON.parse(toolCall.function.arguments);
    console.log("[generate-social-content] Generated content for platforms:", Object.keys(content));

    // Use the first photo as the image URL for all drafts
    const imageUrl = afterPhotos?.[0] || null;

    // Create drafts for each platform with enhanced metadata
    const drafts = [
      {
        company_id: companyId,
        job_assignment_id: jobAssignmentId,
        image_url: imageUrl,
        platform: "instagram",
        generated_content: content.instagram.post_body,
        hashtags: content.instagram.api_metadata?.hashtags || [],
        media_instructions: content.instagram.media_instructions,
        api_metadata: content.instagram.api_metadata,
        status: "pending",
      },
      {
        company_id: companyId,
        job_assignment_id: jobAssignmentId,
        image_url: imageUrl,
        platform: "google_business",
        generated_content: content.google_business.post_body,
        hashtags: null,
        media_instructions: content.google_business.media_instructions,
        api_metadata: content.google_business.api_metadata || {},
        status: "pending",
      },
      {
        company_id: companyId,
        job_assignment_id: jobAssignmentId,
        image_url: imageUrl,
        platform: "facebook",
        generated_content: content.facebook.post_body,
        hashtags: null,
        media_instructions: content.facebook.media_instructions,
        api_metadata: content.facebook.api_metadata || {},
        status: "pending",
      },
      {
        company_id: companyId,
        job_assignment_id: jobAssignmentId,
        image_url: imageUrl,
        platform: "linkedin",
        generated_content: content.linkedin.post_body,
        hashtags: null,
        media_instructions: content.linkedin.media_instructions,
        api_metadata: content.linkedin.api_metadata,
        status: "pending",
      },
      {
        company_id: companyId,
        job_assignment_id: jobAssignmentId,
        image_url: imageUrl,
        platform: "tiktok",
        generated_content: content.tiktok.post_body,
        hashtags: null,
        media_instructions: content.tiktok.media_instructions,
        api_metadata: content.tiktok.api_metadata,
        status: "pending",
      },
      {
        company_id: companyId,
        job_assignment_id: jobAssignmentId,
        image_url: null,
        platform: "sms",
        generated_content: content.sms.post_body,
        hashtags: null,
        media_instructions: content.sms.media_instructions || null,
        api_metadata: content.sms.api_metadata || {},
        status: "pending",
      },
    ];

    const { data: insertedDrafts, error: insertError } = await supabase
      .from("social_content_drafts")
      .insert(drafts)
      .select();

    if (insertError) {
      console.error("[generate-social-content] Insert error:", insertError);
      return new Response(
        JSON.stringify({ error: "Failed to save drafts" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("[generate-social-content] Created", insertedDrafts?.length, "drafts");

    return new Response(
      JSON.stringify({ success: true, drafts: insertedDrafts }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("[generate-social-content] Error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
