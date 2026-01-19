import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface PublishRequest {
  draftId: string;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { draftId } = await req.json() as PublishRequest;

    console.log("[publish-social-content] Publishing draft:", draftId);

    if (!draftId) {
      return new Response(
        JSON.stringify({ error: "Missing required field: draftId" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get the draft
    const { data: draft, error: fetchError } = await supabase
      .from("social_content_drafts")
      .select("*")
      .eq("id", draftId)
      .single();

    if (fetchError || !draft) {
      console.error("[publish-social-content] Draft not found:", fetchError);
      return new Response(
        JSON.stringify({ error: "Draft not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Simulate publishing to the respective platform
    const platform = draft.platform;
    const content = draft.edited_content || draft.generated_content;
    const imageUrl = draft.image_url;

    console.log(`[publish-social-content] Simulating publish to ${platform}`);
    console.log(`[publish-social-content] Content: ${content.substring(0, 100)}...`);
    if (imageUrl) {
      console.log(`[publish-social-content] Image: ${imageUrl}`);
    }

    // Simulate API delay
    await new Promise((resolve) => setTimeout(resolve, 1000));

    // In a real implementation, you would call the respective platform APIs:
    // - Instagram: Graph API
    // - Google Business: Business Profile API
    // - Facebook: Graph API
    // - SMS: Twilio or similar

    const simulatedResults: Record<string, { success: boolean; postId?: string; message?: string }> = {
      instagram: {
        success: true,
        postId: `ig_${Date.now()}`,
        message: "Post published successfully to Instagram",
      },
      google_business: {
        success: true,
        postId: `gbp_${Date.now()}`,
        message: "Update posted to Google Business Profile",
      },
      facebook: {
        success: true,
        postId: `fb_${Date.now()}`,
        message: "Post published to Facebook page",
      },
      sms: {
        success: true,
        message: "SMS template saved and ready to send",
      },
    };

    const result = simulatedResults[platform] || { success: true, message: "Published" };

    // Update the draft status
    const { error: updateError } = await supabase
      .from("social_content_drafts")
      .update({
        status: "published",
        published_at: new Date().toISOString(),
      })
      .eq("id", draftId);

    if (updateError) {
      console.error("[publish-social-content] Update error:", updateError);
      return new Response(
        JSON.stringify({ error: "Failed to update draft status" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`[publish-social-content] Successfully published to ${platform}`);

    return new Response(
      JSON.stringify({
        success: true,
        platform,
        result,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("[publish-social-content] Error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
