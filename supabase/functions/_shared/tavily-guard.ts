// Shared Tavily usage guard.
// Enforces per-company monthly Tavily credit cap (default 1,000/mo to match
// Tavily Free Tier), logs every attempt, and returns a normalized result.
//
// Usage:
//   import { tavilySearch } from '../_shared/tavily-guard.ts';
//   const r = await tavilySearch({
//     supabase, apiKey, companyId,
//     query, searchDepth: 'basic' | 'advanced',
//     maxResults: 5, includeAnswer: true,
//     source: 'generate-blog-content',
//   });
//   if (!r.allowed) { /* skip / fall back without Tavily */ }
//   else { use r.data }

const DEFAULT_MONTHLY_CAP = Number(Deno.env.get('TAVILY_MONTHLY_CAP') ?? '1000');

export type TavilyDepth = 'basic' | 'advanced';

export interface TavilySearchArgs {
  // deno-lint-ignore no-explicit-any
  supabase: any;
  apiKey: string;
  companyId: string | null;
  query: string;
  searchDepth?: TavilyDepth;
  maxResults?: number;
  includeAnswer?: boolean;
  source?: string;
}

export interface TavilyExtractArgs {
  // deno-lint-ignore no-explicit-any
  supabase: any;
  apiKey: string;
  companyId: string | null;
  urls: string[];
  extractDepth?: TavilyDepth;
  source?: string;
}

export interface TavilyGuardResult<T = unknown> {
  allowed: boolean;
  reason?: string;
  data?: T;
  // deno-lint-ignore no-explicit-any
  error?: any;
  credits: number;
  monthlyCredits?: number;
  monthlyCap?: number;
}

async function resolveCap(
  // deno-lint-ignore no-explicit-any
  supabase: any,
  companyId: string | null,
): Promise<number> {
  if (!companyId) return DEFAULT_MONTHLY_CAP;
  try {
    const { data } = await supabase
      .from('companies')
      .select('tavily_caps')
      .eq('id', companyId)
      .maybeSingle();
    const caps = (data?.tavily_caps ?? {}) as { monthly?: number };
    return typeof caps.monthly === 'number' ? caps.monthly : DEFAULT_MONTHLY_CAP;
  } catch {
    return DEFAULT_MONTHLY_CAP;
  }
}

async function logAttempt(
  // deno-lint-ignore no-explicit-any
  supabase: any,
  row: {
    company_id: string | null;
    operation: string;
    depth?: string;
    url_count?: number;
    credits: number;
    status: 'sent' | 'blocked_monthly' | 'failed';
    reason?: string;
    source?: string;
  },
) {
  try {
    await supabase.from('tavily_usage_attempts').insert(row);
  } catch (e) {
    console.error('[tavily-guard] log insert failed:', e);
  }
}

async function gate(
  // deno-lint-ignore no-explicit-any
  supabase: any,
  companyId: string | null,
  credits: number,
): Promise<{ allowed: boolean; reason?: string; monthlyCredits: number; monthlyCap: number }> {
  const cap = await resolveCap(supabase, companyId);
  const { data, error } = await supabase.rpc('increment_tavily_usage', {
    p_company_id: companyId,
    p_credits: credits,
    p_monthly_cap: cap,
  });
  if (error) {
    console.error('[tavily-guard] increment_tavily_usage error:', error);
    return { allowed: true, monthlyCredits: 0, monthlyCap: cap };
  }
  const row = Array.isArray(data) ? data[0] : data;
  return {
    allowed: row?.allowed ?? true,
    reason: row?.reason,
    monthlyCredits: row?.monthly_credits ?? 0,
    monthlyCap: row?.monthly_cap ?? cap,
  };
}

export async function tavilySearch(args: TavilySearchArgs): Promise<TavilyGuardResult> {
  const { supabase, apiKey, companyId, query, searchDepth = 'basic',
          maxResults = 5, includeAnswer = true, source } = args;
  const credits = searchDepth === 'advanced' ? 2 : 1;

  if (!apiKey) {
    await logAttempt(supabase, {
      company_id: companyId, operation: 'search', depth: searchDepth,
      credits: 0, status: 'failed', reason: 'missing_api_key', source,
    });
    return { allowed: false, reason: 'missing_api_key', credits: 0 };
  }

  const g = await gate(supabase, companyId, credits);
  if (!g.allowed) {
    await logAttempt(supabase, {
      company_id: companyId, operation: 'search', depth: searchDepth,
      credits: 0, status: 'blocked_monthly', reason: g.reason, source,
    });
    return { allowed: false, reason: g.reason, credits: 0,
             monthlyCredits: g.monthlyCredits, monthlyCap: g.monthlyCap };
  }

  try {
    const res = await fetch('https://api.tavily.com/search', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        api_key: apiKey, query,
        search_depth: searchDepth,
        max_results: maxResults,
        include_answer: includeAnswer,
      }),
    });
    if (!res.ok) {
      const body = await res.text();
      await logAttempt(supabase, {
        company_id: companyId, operation: 'search', depth: searchDepth,
        credits, status: 'failed', reason: `tavily_${res.status}`, source,
      });
      return { allowed: true, error: body, credits,
               monthlyCredits: g.monthlyCredits, monthlyCap: g.monthlyCap };
    }
    const data = await res.json();
    await logAttempt(supabase, {
      company_id: companyId, operation: 'search', depth: searchDepth,
      credits, status: 'sent', source,
    });
    return { allowed: true, data, credits,
             monthlyCredits: g.monthlyCredits, monthlyCap: g.monthlyCap };
  } catch (e) {
    await logAttempt(supabase, {
      company_id: companyId, operation: 'search', depth: searchDepth,
      credits, status: 'failed', reason: String(e), source,
    });
    return { allowed: true, error: e, credits,
             monthlyCredits: g.monthlyCredits, monthlyCap: g.monthlyCap };
  }
}

export async function tavilyExtract(args: TavilyExtractArgs): Promise<TavilyGuardResult> {
  const { supabase, apiKey, companyId, urls, extractDepth = 'basic', source } = args;
  // basic = 1 credit / 5 URLs, advanced = 2 credits / 5 URLs
  const per5 = extractDepth === 'advanced' ? 2 : 1;
  const credits = Math.max(1, Math.ceil(urls.length / 5)) * per5;

  if (!apiKey) {
    await logAttempt(supabase, {
      company_id: companyId, operation: 'extract', depth: extractDepth,
      url_count: urls.length, credits: 0, status: 'failed',
      reason: 'missing_api_key', source,
    });
    return { allowed: false, reason: 'missing_api_key', credits: 0 };
  }

  const g = await gate(supabase, companyId, credits);
  if (!g.allowed) {
    await logAttempt(supabase, {
      company_id: companyId, operation: 'extract', depth: extractDepth,
      url_count: urls.length, credits: 0, status: 'blocked_monthly',
      reason: g.reason, source,
    });
    return { allowed: false, reason: g.reason, credits: 0,
             monthlyCredits: g.monthlyCredits, monthlyCap: g.monthlyCap };
  }

  try {
    const res = await fetch('https://api.tavily.com/extract', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ api_key: apiKey, urls, extract_depth: extractDepth }),
    });
    if (!res.ok) {
      const body = await res.text();
      await logAttempt(supabase, {
        company_id: companyId, operation: 'extract', depth: extractDepth,
        url_count: urls.length, credits, status: 'failed',
        reason: `tavily_${res.status}`, source,
      });
      return { allowed: true, error: body, credits,
               monthlyCredits: g.monthlyCredits, monthlyCap: g.monthlyCap };
    }
    const data = await res.json();
    await logAttempt(supabase, {
      company_id: companyId, operation: 'extract', depth: extractDepth,
      url_count: urls.length, credits, status: 'sent', source,
    });
    return { allowed: true, data, credits,
             monthlyCredits: g.monthlyCredits, monthlyCap: g.monthlyCap };
  } catch (e) {
    await logAttempt(supabase, {
      company_id: companyId, operation: 'extract', depth: extractDepth,
      url_count: urls.length, credits, status: 'failed',
      reason: String(e), source,
    });
    return { allowed: true, error: e, credits,
             monthlyCredits: g.monthlyCredits, monthlyCap: g.monthlyCap };
  }
}

// Compatibility shim: returns a Response-like object so existing code that
// reads `.ok` and `.json()` keeps working. Returns null if blocked by cap.
export interface GuardedTavilyResponse {
  ok: boolean;
  status: number;
  json: () => Promise<unknown>;
  text: () => Promise<string>;
}

export async function guardedTavilyFetch(opts: {
  // deno-lint-ignore no-explicit-any
  supabase: any;
  apiKey: string;
  companyId: string | null;
  body: Record<string, unknown>;
  source?: string;
  endpoint?: 'search' | 'extract';
}): Promise<GuardedTavilyResponse | null> {
  const { supabase, apiKey, companyId, body, source, endpoint = 'search' } = opts;
  const depth = (body.search_depth as TavilyDepth) ?? (body.extract_depth as TavilyDepth) ?? 'basic';
  let credits = depth === 'advanced' ? 2 : 1;
  let urlCount: number | undefined;
  if (endpoint === 'extract') {
    const urls = (body.urls as string[]) ?? [];
    urlCount = urls.length;
    const per5 = depth === 'advanced' ? 2 : 1;
    credits = Math.max(1, Math.ceil(urls.length / 5)) * per5;
  }
  if (!apiKey) {
    await logAttempt(supabase, {
      company_id: companyId, operation: endpoint, depth,
      url_count: urlCount, credits: 0, status: 'failed',
      reason: 'missing_api_key', source,
    });
    return null;
  }
  const g = await gate(supabase, companyId, credits);
  if (!g.allowed) {
    await logAttempt(supabase, {
      company_id: companyId, operation: endpoint, depth,
      url_count: urlCount, credits: 0, status: 'blocked_monthly',
      reason: g.reason, source,
    });
    console.warn(`[tavily-guard] ${source ?? 'unknown'} blocked: ${g.reason} (${g.monthlyCredits}/${g.monthlyCap})`);
    return null;
  }
  try {
    const res = await fetch(`https://api.tavily.com/${endpoint}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...body, api_key: apiKey }),
    });
    const status = res.status;
    const ok = res.ok;
    const buf = await res.text();
    await logAttempt(supabase, {
      company_id: companyId, operation: endpoint, depth,
      url_count: urlCount, credits, status: ok ? 'sent' : 'failed',
      reason: ok ? undefined : `tavily_${status}`, source,
    });
    return {
      ok, status,
      json: async () => JSON.parse(buf),
      text: async () => buf,
    };
  } catch (e) {
    await logAttempt(supabase, {
      company_id: companyId, operation: endpoint, depth,
      url_count: urlCount, credits, status: 'failed',
      reason: String(e), source,
    });
    throw e;
  }
}