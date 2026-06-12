import { supabase } from '@/integrations/supabase/client';

// Brand terms that must NEVER be translated (mirrors edge function list).
export const BRAND_TERMS = [
  'Aura', 'Aura Intercept', 'Operative', 'Operatives',
  'Core', 'Boost', 'Pro', 'Elite', 'Beta Pricing',
  'Cyber-Sentry', 'SignalWire', 'ElevenLabs', 'Tavily', 'Stripe', 'Resend',
];

const LS_PREFIX = 'tx:';
const memCache = new Map<string, string>();

async function sha256Hex(text: string): Promise<string> {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text));
  return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join('');
}

function lsKey(text: string, lang: string) {
  return `${LS_PREFIX}${lang}:${text}`;
}

export function getCachedTranslation(text: string, lang: string): string | null {
  const key = lsKey(text, lang);
  if (memCache.has(key)) return memCache.get(key)!;
  try {
    const v = localStorage.getItem(key);
    if (v) {
      memCache.set(key, v);
      return v;
    }
  } catch {/* ignore */}
  return null;
}

function setCachedTranslation(text: string, lang: string, translated: string) {
  const key = lsKey(text, lang);
  memCache.set(key, translated);
  try { localStorage.setItem(key, translated); } catch {/* quota */}
}

// Skip translation for short or non-textual strings
export function shouldTranslate(text: string): boolean {
  if (!text || typeof text !== 'string') return false;
  const trimmed = text.trim();
  if (trimmed.length < 2) return false;
  if (!/[a-zA-Z]/.test(trimmed)) return false; // numbers, symbols only
  if (/^https?:\/\//i.test(trimmed)) return false;
  return true;
}

type Pending = {
  text: string;
  lang: string;
  resolve: (s: string) => void;
};
let queue: Pending[] = [];
let flushTimer: number | null = null;

function scheduleFlush() {
  if (flushTimer !== null) return;
  flushTimer = window.setTimeout(flush, 50);
}

async function flush() {
  flushTimer = null;
  const batch = queue;
  queue = [];
  if (batch.length === 0) return;

  // Group by target language
  const byLang = new Map<string, Pending[]>();
  for (const p of batch) {
    const arr = byLang.get(p.lang) ?? [];
    arr.push(p);
    byLang.set(p.lang, arr);
  }

  for (const [lang, items] of byLang) {
    const uniqueTexts = [...new Set(items.map(i => i.text))];
    try {
      const { data, error } = await supabase.functions.invoke('translate-ui', {
        body: { texts: uniqueTexts, target: lang },
      });
      if (error) throw error;
      const results: Record<string, string> = (data?.results as Record<string, string>) ?? {};
      // Map hash → text using same hash fn
      const hashes = await Promise.all(uniqueTexts.map(sha256Hex));
      const textToTranslation = new Map<string, string>();
      uniqueTexts.forEach((t, i) => {
        const tr = results[hashes[i]];
        if (tr) {
          textToTranslation.set(t, tr);
          setCachedTranslation(t, lang, tr);
        }
      });
      for (const item of items) {
        item.resolve(textToTranslation.get(item.text) ?? item.text);
      }
    } catch (e) {
      console.warn('translate-ui failed', e);
      for (const item of items) item.resolve(item.text);
    }
  }
}

export function translateText(text: string, lang: string): Promise<string> {
  return new Promise((resolve) => {
    queue.push({ text, lang, resolve });
    scheduleFlush();
  });
}