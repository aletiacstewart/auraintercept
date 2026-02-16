import { createClient } from "npm:@supabase/supabase-js@2";
import { publishToFacebook, publishToInstagram } from "../_shared/social-platforms/meta.ts";
import { publishToTikTok } from "../_shared/social-platforms/tiktok.ts";
import { publishToLinkedIn } from "../_shared/social-platforms/linkedin.ts";
import { publishToGoogleBusiness } from "../_shared/social-platforms/google-business.ts";
import { ensureFreshTokens } from "../_shared/social-platforms/token-refresh.ts";
import { SocialPostRequest, SocialPostResult } from "../_shared/social-platforms/types.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface PublishRequest {
  draftId: string;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const bodyText = await req.text();
    let body: PublishRequest;
    try {
      body = JSON.parse(bodyText);
    } catch {
      return new Response(
        JSON.stringify({ error: "Invalid JSON body" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { draftId } = body;

    if (!draftId) {
      return new Response(
        JSON.stringify({ error: "Missing required field: draftId" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("[publish-social-content] Publishing draft:", draftId);

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

    const platform = draft.platform;
    const content = draft.edited_content || draft.generated_content;
    const imageUrl = draft.image_url;
    const companyId = draft.company_id;

    // Get fresh access token
    const tokenResult = await ensureFreshTokens(companyId, platform, supabase);
    if (!tokenResult.accessToken) {
      console.error("[publish-social-content] No access token:", tokenResult.error);
      
      // Update draft status to failed
      await supabase
        .from("social_content_drafts")
        .update({ status: "failed", api_metadata: { error: tokenResult.error } })
        .eq("id", draftId);

      return new Response(
        JSON.stringify({ error: tokenResult.error || "No access token available" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get platform-specific IDs
    const { data: integrations } = await supabase
      .from("tenant_integrations")
      .select("*")
      .eq("company_id", companyId)
      .single();

    // Build the request
    const postRequest: SocialPostRequest = {
      content,
      imageUrl: imageUrl || undefined,
      accessToken: tokenResult.accessToken,
      hashtags: draft.hashtags || undefined,
    };

    // Route to platform adapter
    let result: SocialPostResult;
    console.log(`[publish-social-content] Publishing to ${platform}`);

    switch (platform) {
      case "facebook":
        postRequest.pageId = integrations?.meta_page_id || undefined;
        result = await publishToFacebook(postRequest);
        break;

      case "instagram":
        postRequest.accountId = integrations?.meta_instagram_account_id || undefined;
        result = await publishToInstagram(postRequest);
        break;

      case "tiktok":
        result = await publishToTikTok(postRequest);
        break;

      case "linkedin":
        postRequest.accountId = integrations?.linkedin_organization_id || undefined;
        result = await publishToLinkedIn(postRequest);
        break;

      case "google_business":
        postRequest.accountId = integrations?.google_business_account_id || undefined;
        postRequest.locationId = integrations?.google_business_location_id || undefined;
        result = await publishToGoogleBusiness(postRequest);
        break;

      default:
        result = { success: false, error: `Unsupported platform: ${platform}` };
    }

    // Update draft based on result
    if (result.success) {
      await supabase
        .from("social_content_drafts")
        .update({
          status: "published",
          published_at: new Date().toISOString(),
          external_post_id: result.postId || null,
          external_post_url: result.platformUrl || null,
          api_metadata: result.metadata || null,
        })
        .eq("id", draftId);

      console.log(`[publish-social-content] Successfully published to ${platform}:`, result.postId);
    } else {
      await supabase
        .from("social_content_drafts")
        .update({
          status: "failed",
          api_metadata: { error: result.error },
        })
        .eq("id", draftId);

      console.error(`[publish-social-content] Failed to publish to ${platform}:`, result.error);
    }

    return new Response(
      JSON.stringify({
        success: result.success,
        platform,
        postId: result.postId,
        platformUrl: result.platformUrl,
        error: result.error,
      }),
      {
        status: result.success ? 200 : 502,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("[publish-social-content] Error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
