import { createClient } from "npm:@supabase/supabase-js@2";
import { callAIGatewayWithFallback } from "../_shared/ai-gateway.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface PlatformTopic {
  topic: string;
  keywords?: string[];
  scheduledFor: string; // ISO timestamp — when to publish
}

interface GeneratedBlog {
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  featuredImageDescription?: string;
}

const AURA_SYSTEM_PROMPT = `You are the content voice for Aura Intercept — an AI receptionist and business automation platform for service businesses (HVAC, plumbing, electrical, salons, medical practices, etc.).

Write direct, no-fluff blog posts aimed at business owners evaluating whether AI can actually help them capture more leads, cut missed calls, and reduce admin work. Voice: warm, concrete, numbers-driven when possible. Never marketing-brochure. Never uses the word "leverage" or "seamless" or "unlock". Use short paragraphs, real examples, and a call to action to try Aura or book a live demo at the end.`;

function slugify(s: string): string {
  return s.toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 80);
}

async function generateOne(topic: PlatformTopic, wordCount: number): Promise<GeneratedBlog> {
  const userPrompt = `Write a blog post about: ${topic.topic}

${topic.keywords?.length ? `Keywords to naturally include: ${topic.keywords.join(', ')}` : ''}
Target length: approximately ${wordCount} words.

Structure:
1. Engaging SEO title under 60 characters
2. URL-friendly slug
3. Meta description 150-160 characters
4. Full HTML article with intro, 3-5 H2 sections, and a concluding CTA to try Aura Intercept or book a live demo at auraintercept.ai
5. Description for a suggested featured image

Respond in valid JSON only:
{
  "title": "...",
  "slug": "...",
  "excerpt": "...",
  "content": "<h2>...</h2><p>...</p>...",
  "featuredImageDescription": "..."
}`;

  const { response } = await callAIGatewayWithFallback({
    model: 'google/gemini-2.5-flash',
    messages: [
      { role: 'system', content: AURA_SYSTEM_PROMPT },
      { role: 'user', content: userPrompt },
    ],
    max_tokens: 4000,
  });

  if (!response.ok) {
    throw new Error(`AI gateway error: ${response.status} ${await response.text()}`);
  }

  const data = await response.json();
  let raw = (data.choices?.[0]?.message?.content || '').trim();
  raw = raw.replace(/```json\n?/g, '').replace(/```\n?/g, '');
  const parsed = JSON.parse(raw);
  if (!parsed.slug) parsed.slug = slugify(parsed.title || topic.topic);
  return parsed as GeneratedBlog;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const authHeader = req.headers.get('Authorization') || '';
    const jwt = authHeader.replace(/^Bearer\s+/i, '');
    if (!jwt) {
      return new Response(JSON.stringify({ error: 'Missing auth token' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabase = createClient(supabaseUrl, serviceKey);
    const { data: userRes, error: userErr } = await supabase.auth.getUser(jwt);
    if (userErr || !userRes?.user) {
      return new Response(JSON.stringify({ error: 'Invalid session' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    const userId = userRes.user.id;

    const { data: isAdmin } = await supabase.rpc('has_role', { _user_id: userId, _role: 'platform_admin' });
    if (!isAdmin) {
      return new Response(JSON.stringify({ error: 'Platform admin only' }), {
        status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const body = await req.json();
    const topics: PlatformTopic[] = Array.isArray(body.topics) ? body.topics : [];
    const wordCount: number = body.wordCount || 900;

    if (!topics.length) {
      return new Response(JSON.stringify({ error: 'topics[] is required' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const generated: Array<{ topic: string; ok: boolean; error?: string; postId?: string }> = [];

    for (let i = 0; i < topics.length; i++) {
      const t = topics[i];
      try {
        const blog = await generateOne(t, wordCount);
        const publishAt = t.scheduledFor ? new Date(t.scheduledFor).toISOString() : new Date().toISOString();
        const isFuture = new Date(publishAt).getTime() > Date.now();

        const { data: inserted, error: insErr } = await supabase
          .from('blog_posts')
          .insert({
            title: blog.title,
            slug: blog.slug,
            excerpt: blog.excerpt,
            content: blog.content,
            featured_image_url: null,
            author_id: userId,
            published: !isFuture,
            published_at: publishAt,
          })
          .select('id')
          .single();

        if (insErr) throw insErr;
        generated.push({ topic: t.topic, ok: true, postId: inserted?.id });
      } catch (err) {
        console.error('generate-platform-blog error:', t.topic, err);
        generated.push({ topic: t.topic, ok: false, error: err instanceof Error ? err.message : 'Unknown' });
      }

      if (i < topics.length - 1) await new Promise((r) => setTimeout(r, 800));
    }

    return new Response(JSON.stringify({
      success: true,
      generated,
      okCount: generated.filter((g) => g.ok).length,
      failCount: generated.filter((g) => !g.ok).length,
    }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  } catch (error) {
    console.error('generate-platform-blog fatal:', error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});