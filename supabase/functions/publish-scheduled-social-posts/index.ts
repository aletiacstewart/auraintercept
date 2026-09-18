import { createClient } from "npm:@supabase/supabase-js@2";
import { profileUsernameFor, publishViaUploadPost } from "../_shared/upload-post.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function contentFor(contentJson: any, platform: string, topic: string): string {
  const cj = contentJson ?? {};
  const perPlatform = cj?.platforms?.[platform] ?? cj?.[platform];
  const candidate =
    (typeof perPlatform === "string" ? perPlatform : perPlatform?.content ?? perPlatform?.caption) ??
    cj.content ??
    cj.caption ??
    cj.text ??
    topic;
  return String(candidate ?? "").trim();
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );

  const summary = { checked: 0, published: 0, failed: 0, skipped: 0 };

  try {
    const { data: due, error } = await supabase
      .from("scheduled_social_posts")
      .select("id, company_id, content_json, platforms, image_url, topic, status, scheduled_for")
      .in("status", ["approved", "scheduled"])
      .lte("scheduled_for", new Date().toISOString())
      .is("published_at", null)
      .order("scheduled_for", { ascending: true })
      .limit(50);

    if (error) throw error;

    const integrationCache = new Map<string, any>();

    for (const post of due ?? []) {
      summary.checked++;

      let integ = integrationCache.get(post.company_id);
      if (!integ) {
        const { data } = await supabase
          .from("tenant_integrations")
          .select("upload_post_api_key, upload_post_profile, upload_post_enabled, upload_post_auto_publish")
          .eq("company_id", post.company_id)
          .maybeSingle();
        integ = data ?? {};
        integrationCache.set(post.company_id, integ);
      }

      const apiKey = integ.upload_post_api_key || Deno.env.get("UPLOAD_POST_API_KEY");
      const autoAllowed = post.status === "approved" || integ.upload_post_auto_publish === true;

      if (!integ.upload_post_enabled || !apiKey || !autoAllowed) {
        summary.skipped++;
        continue;
      }

      const username = integ.upload_post_profile || profileUsernameFor(post.company_id);
      const platforms: string[] = post.platforms ?? [];
      const text = contentFor(post.content_json, platforms[0] ?? "", post.topic);

      if (!text) {
        summary.skipped++;
        continue;
      }

      const result = await publishViaUploadPost({
        apiKey,
        username,
        platforms,
        content: text,
        imageUrl: post.image_url,
        externalId: post.id,
      });

      if (result.success) {
        summary.published++;
        await supabase
          .from("scheduled_social_posts")
          .update({ status: "published", published_at: new Date().toISOString(), publish_error: null })
          .eq("id", post.id);
      } else {
        summary.failed++;
        await supabase
          .from("scheduled_social_posts")
          .update({ status: "failed", publish_error: result.error ?? "Upload-Post publish failed" })
          .eq("id", post.id);
      }
    }

    console.log("[publish-scheduled-social-posts]", JSON.stringify(summary));
    return new Response(JSON.stringify({ success: true, ...summary }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("[publish-scheduled-social-posts] error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error", ...summary }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
