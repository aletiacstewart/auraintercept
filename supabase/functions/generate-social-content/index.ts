import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

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

    // Get company info for branding
    const { data: company } = await supabase
      .from("companies")
      .select("name, service_categories")
      .eq("id", companyId)
      .single();

    const companyName = company?.name || "Our Company";
    const serviceCategories = company?.service_categories || [];
    const service = serviceType || "service";

    // Generate content using Lovable AI
    const systemPrompt = `You are an expert social media marketing specialist for service businesses. 
You create engaging, professional content that showcases completed work and builds trust.
Company: ${companyName}
Industry: ${serviceCategories.join(", ") || "Home Services"}

Generate platform-specific content that:
- Highlights the quality of work completed
- Uses a professional yet approachable tone
- Includes relevant industry hashtags for Instagram
- Is optimized for each platform's character limits and style`;

    const userPrompt = `A technician${employeeName ? ` named ${employeeName}` : ""} just completed a ${service} job${customerName ? ` for a customer` : ""}.
${afterPhotos?.length ? `They took ${afterPhotos.length} photo(s) of the completed work.` : ""}

Generate social media content for:
1. Instagram (engaging caption with hashtags, 2200 char max)
2. Google Business Profile (professional post, 1500 char max)
3. Facebook (shareable post, 500 char max)
4. SMS follow-up template (personalized thank you with review request, 160 char max)`;

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
              description: "Generate social media content for multiple platforms",
              parameters: {
                type: "object",
                properties: {
                  instagram: {
                    type: "object",
                    properties: {
                      caption: { type: "string", description: "Instagram caption text" },
                      hashtags: { type: "array", items: { type: "string" }, description: "Array of hashtags without # symbol" },
                    },
                    required: ["caption", "hashtags"],
                  },
                  google_business: {
                    type: "object",
                    properties: {
                      post: { type: "string", description: "Google Business Profile post" },
                    },
                    required: ["post"],
                  },
                  facebook: {
                    type: "object",
                    properties: {
                      post: { type: "string", description: "Facebook post" },
                    },
                    required: ["post"],
                  },
                  sms: {
                    type: "object",
                    properties: {
                      template: { type: "string", description: "SMS template with {customer_name} placeholder" },
                    },
                    required: ["template"],
                  },
                },
                required: ["instagram", "google_business", "facebook", "sms"],
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "generate_social_content" } },
      }),
    });

    if (!response.ok) {
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
    console.log("[generate-social-content] Generated content:", content);

    // Use the first photo as the image URL for all drafts
    const imageUrl = afterPhotos?.[0] || null;

    // Create drafts for each platform
    const drafts = [
      {
        company_id: companyId,
        job_assignment_id: jobAssignmentId,
        image_url: imageUrl,
        platform: "instagram",
        generated_content: content.instagram.caption,
        hashtags: content.instagram.hashtags,
        status: "pending",
      },
      {
        company_id: companyId,
        job_assignment_id: jobAssignmentId,
        image_url: imageUrl,
        platform: "google_business",
        generated_content: content.google_business.post,
        hashtags: null,
        status: "pending",
      },
      {
        company_id: companyId,
        job_assignment_id: jobAssignmentId,
        image_url: imageUrl,
        platform: "facebook",
        generated_content: content.facebook.post,
        hashtags: null,
        status: "pending",
      },
      {
        company_id: companyId,
        job_assignment_id: jobAssignmentId,
        image_url: null,
        platform: "sms",
        generated_content: content.sms.template,
        hashtags: null,
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
