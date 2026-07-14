import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-cron-secret',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, serviceKey);

    // Cron auth: optional shared secret via _cron_shared_secret table
    const providedSecret = req.headers.get('x-cron-secret');
    if (providedSecret) {
      const { data: secretRow } = await supabase.from('_cron_shared_secret').select('secret').eq('id', 1).maybeSingle();
      if (secretRow?.secret && secretRow.secret !== providedSecret) {
        return new Response(JSON.stringify({ error: 'Invalid cron secret' }), {
          status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
    }

    const nowIso = new Date().toISOString();

    const { data: due, error: selErr } = await supabase
      .from('blog_posts')
      .select('id, title, published_at')
      .eq('published', false)
      .not('published_at', 'is', null)
      .lte('published_at', nowIso);

    if (selErr) throw selErr;

    let published = 0;
    if (due && due.length) {
      const ids = due.map((r) => r.id);
      const { error: upErr } = await supabase
        .from('blog_posts')
        .update({ published: true })
        .in('id', ids);
      if (upErr) throw upErr;
      published = ids.length;
      console.log('publish-scheduled-blog-posts: published', published, 'posts');
    }

    return new Response(JSON.stringify({ success: true, published, scanned_at: nowIso }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('publish-scheduled-blog-posts error:', error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});