import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const ALLOWED_MIME = new Set([
  'image/png','image/jpeg','image/jpg','image/webp','image/gif','image/svg+xml',
  'application/pdf',
  'text/csv','text/plain',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
]);
const MAX_FILE = 20 * 1024 * 1024; // 20 MB
const MAX_TOTAL = 100 * 1024 * 1024; // 100 MB per invite

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });
  try {
    const form = await req.formData();
    const token = String(form.get('token') || '');
    const section = String(form.get('section') || 'misc');
    const file = form.get('file');
    if (!token || !(file instanceof File)) {
      return new Response(JSON.stringify({ error: 'token and file required' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }
    if (file.size > MAX_FILE) {
      return new Response(JSON.stringify({ error: 'file_too_large' }), { status: 413, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }
    if (file.type && !ALLOWED_MIME.has(file.type)) {
      return new Response(JSON.stringify({ error: 'mime_type_not_allowed', type: file.type }), { status: 415, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const admin = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);
    const { data: invite } = await admin.from('onboarding_invites').select('id, status, expires_at').eq('token', token).maybeSingle();
    if (!invite) return new Response(JSON.stringify({ error: 'invalid' }), { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    if (invite.status === 'submitted') return new Response(JSON.stringify({ error: 'already_submitted' }), { status: 409, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    if (new Date(invite.expires_at) < new Date()) return new Response(JSON.stringify({ error: 'expired' }), { status: 410, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

    // Enforce total upload size per invite
    const { data: existing } = await admin.from('onboarding_uploads').select('size_bytes').eq('invite_id', invite.id);
    const total = (existing ?? []).reduce((s: number, r: { size_bytes: number | null }) => s + (r.size_bytes || 0), 0);
    if (total + file.size > MAX_TOTAL) {
      return new Response(JSON.stringify({ error: 'total_quota_exceeded' }), { status: 413, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const safeName = file.name.replace(/[^A-Za-z0-9._-]/g, '_').slice(0, 120);
    const path = `${invite.id}/${section}/${Date.now()}_${safeName}`;
    const buf = new Uint8Array(await file.arrayBuffer());
    const { error: upErr } = await admin.storage.from('onboarding-uploads').upload(path, buf, {
      contentType: file.type || 'application/octet-stream',
      upsert: false,
    });
    if (upErr) throw upErr;

    const { data: row, error: rowErr } = await admin.from('onboarding_uploads').insert({
      invite_id: invite.id, section, file_name: file.name, storage_path: path, mime_type: file.type, size_bytes: file.size,
    }).select('id, section, file_name, mime_type, size_bytes, created_at').single();
    if (rowErr) throw rowErr;

    return new Response(JSON.stringify({ upload: row }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  } catch (e) {
    console.error('[upload-onboarding-file]', e);
    return new Response(JSON.stringify({ error: String(e) }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
});