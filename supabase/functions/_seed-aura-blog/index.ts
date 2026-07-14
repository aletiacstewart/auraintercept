import { createClient } from "npm:@supabase/supabase-js@2";
import posts from "./posts.json" with { type: "json" };

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const AUTHOR_ID = "7cfa0640-447a-4465-935c-bb81d2e6ddba";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const { error: delErr } = await supabase.from("blog_posts").delete().gte("created_at", "1900-01-01");
    if (delErr) throw delErr;

    const now = Date.now();
    // tomorrow 14:00 UTC (~9am ET)
    const t = new Date();
    t.setUTCHours(14, 0, 0, 0);
    t.setUTCDate(t.getUTCDate() + 1);
    const tomorrow = t.getTime();

    let schedIdx = 0;
    const rows: any[] = [];
    const seen = new Set<string>();
    (posts as any[]).forEach((item, i) => {
      if (!item.ok) return;
      const b = item.blog;
      let slug = b.slug as string;
      let n = 1;
      while (seen.has(slug)) { n++; slug = `${b.slug}-${n}`; }
      seen.add(slug);
      let publishedAt: string;
      let published: boolean;
      if (i < 3) {
        published = true;
        publishedAt = new Date(now - i * 5 * 60_000).toISOString();
      } else {
        published = false;
        publishedAt = new Date(tomorrow + Math.round(schedIdx * 3.5) * 86_400_000).toISOString();
        schedIdx++;
      }
      rows.push({
        title: b.title,
        slug,
        excerpt: b.excerpt ?? null,
        content: b.content,
        author_id: AUTHOR_ID,
        published,
        published_at: publishedAt,
      });
    });

    const { error: insErr, data } = await supabase.from("blog_posts").insert(rows).select("id, slug, published, published_at");
    if (insErr) throw insErr;

    return new Response(JSON.stringify({ ok: true, inserted: data?.length ?? 0, rows: data }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("_seed-aura-blog error:", err);
    return new Response(JSON.stringify({ error: err instanceof Error ? err.message : String(err) }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});