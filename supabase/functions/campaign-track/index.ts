import { createClient } from 'npm:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// 1x1 transparent GIF
const PIXEL = Uint8Array.from([
  0x47,0x49,0x46,0x38,0x39,0x61,0x01,0x00,0x01,0x00,0x80,0x00,0x00,
  0x00,0x00,0x00,0xff,0xff,0xff,0x21,0xf9,0x04,0x01,0x00,0x00,0x00,
  0x00,0x2c,0x00,0x00,0x00,0x00,0x01,0x00,0x01,0x00,0x00,0x02,0x02,
  0x44,0x01,0x00,0x3b,
]);

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  const url = new URL(req.url);
  const id = url.searchParams.get('id');
  const event = url.searchParams.get('e');
  const target = url.searchParams.get('u');

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  );

  try {
    if (id && (event === 'open' || event === 'click')) {
      const { data: send } = await supabase
        .from('campaign_sends')
        .select('id, campaign_id, opened_at, clicked_at')
        .eq('id', id)
        .maybeSingle();

      if (send) {
        if (event === 'open' && !send.opened_at) {
          await supabase.from('campaign_sends').update({ opened_at: new Date().toISOString() }).eq('id', id);
          const { data: c } = await supabase.from('marketing_campaigns').select('total_opened').eq('id', send.campaign_id).maybeSingle();
          await supabase.from('marketing_campaigns').update({ total_opened: (c?.total_opened || 0) + 1 }).eq('id', send.campaign_id);
        } else if (event === 'click' && !send.clicked_at) {
          await supabase.from('campaign_sends').update({ clicked_at: new Date().toISOString() }).eq('id', id);
          const { data: c } = await supabase.from('marketing_campaigns').select('total_clicked').eq('id', send.campaign_id).maybeSingle();
          await supabase.from('marketing_campaigns').update({ total_clicked: (c?.total_clicked || 0) + 1 }).eq('id', send.campaign_id);
        }
      }
    }
  } catch (e) {
    console.error('[campaign-track] error', e);
  }

  if (event === 'click' && target) {
    try {
      const decoded = decodeURIComponent(target);
      return new Response(null, { status: 302, headers: { ...corsHeaders, Location: decoded } });
    } catch {
      return new Response('Bad URL', { status: 400, headers: corsHeaders });
    }
  }

  return new Response(PIXEL, {
    headers: {
      ...corsHeaders,
      'Content-Type': 'image/gif',
      'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0',
    },
  });
});