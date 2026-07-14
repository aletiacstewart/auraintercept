import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { FunnelEventType } from '@/lib/funnelTracking';

export const FUNNEL_STAGES: FunnelEventType[] = [
  'page_view',
  'chat_opened',
  'pricing_viewed',
  'demo_cta_clicked',
  'auth_started',
  'signup_completed',
  'checkout_completed',
];

const STAGE_LABELS: Record<FunnelEventType, string> = {
  page_view: 'Page view',
  chat_opened: 'Chat opened',
  chat_message_sent: 'Chat message sent',
  pricing_viewed: 'Pricing viewed',
  pricing_expanded: 'Pricing expanded',
  demo_cta_clicked: 'Demo CTA clicked',
  auth_started: 'Auth started',
  signup_completed: 'Signup completed',
  checkout_completed: 'Checkout completed',
};

export interface FunnelStageRow {
  stage: FunnelEventType;
  label: string;
  sessions: number;
  conversionFromPrev: number | null; // pct 0-100
}

export interface IndustryFunnelRow {
  industry: string;
  counts: Partial<Record<FunnelEventType, number>>;
  total: number;
}

export interface AttributionRow {
  source: string;
  sessions: number;
}

export interface FunnelAnalyticsResult {
  stageCounts: FunnelStageRow[];
  byIndustry: IndustryFunnelRow[];
  byAttribution: AttributionRow[];
  totalSessions: number;
}

interface EventRow {
  session_id: string;
  event_type: FunnelEventType;
  industry: string | null;
  utm_source: string | null;
  referrer: string | null;
}

function stageIndex(evt: FunnelEventType): number {
  return FUNNEL_STAGES.indexOf(evt);
}

function computeStageCounts(events: EventRow[]): FunnelStageRow[] {
  // For each session, find the highest stage index it reached (from the canonical funnel).
  const sessionMaxStage = new Map<string, number>();
  for (const e of events) {
    const idx = stageIndex(e.event_type);
    if (idx < 0) continue;
    const prev = sessionMaxStage.get(e.session_id) ?? -1;
    if (idx > prev) sessionMaxStage.set(e.session_id, idx);
  }

  // A session "reaches" stage N if its max stage index >= N.
  const reached: number[] = FUNNEL_STAGES.map(() => 0);
  for (const maxIdx of sessionMaxStage.values()) {
    for (let i = 0; i <= maxIdx; i++) reached[i] += 1;
  }

  return FUNNEL_STAGES.map((stage, i) => ({
    stage,
    label: STAGE_LABELS[stage],
    sessions: reached[i],
    conversionFromPrev:
      i === 0
        ? null
        : reached[i - 1] > 0
          ? Math.round((reached[i] / reached[i - 1]) * 100)
          : 0,
  }));
}

function computeByIndustry(events: EventRow[]): IndustryFunnelRow[] {
  // Determine an industry per session (first non-null value seen).
  const sessionIndustry = new Map<string, string>();
  const sessionMaxStage = new Map<string, number>();
  for (const e of events) {
    if (e.industry && !sessionIndustry.has(e.session_id)) {
      sessionIndustry.set(e.session_id, e.industry);
    }
    const idx = stageIndex(e.event_type);
    if (idx < 0) continue;
    const prev = sessionMaxStage.get(e.session_id) ?? -1;
    if (idx > prev) sessionMaxStage.set(e.session_id, idx);
  }

  const grouped = new Map<string, { counts: Partial<Record<FunnelEventType, number>>; total: number }>();
  for (const [sid, maxIdx] of sessionMaxStage.entries()) {
    const ind = sessionIndustry.get(sid) ?? 'unknown';
    if (!grouped.has(ind)) grouped.set(ind, { counts: {}, total: 0 });
    const bucket = grouped.get(ind)!;
    bucket.total += 1;
    for (let i = 0; i <= maxIdx; i++) {
      const stage = FUNNEL_STAGES[i];
      bucket.counts[stage] = (bucket.counts[stage] ?? 0) + 1;
    }
  }

  return Array.from(grouped.entries())
    .map(([industry, v]) => ({ industry, counts: v.counts, total: v.total }))
    .sort((a, b) => b.total - a.total)
    .slice(0, 10);
}

function computeByAttribution(events: EventRow[]): AttributionRow[] {
  const sessionSource = new Map<string, string>();
  for (const e of events) {
    if (sessionSource.has(e.session_id)) continue;
    if (e.utm_source) {
      sessionSource.set(e.session_id, e.utm_source);
    } else if (e.referrer) {
      try {
        const host = new URL(e.referrer).hostname.replace(/^www\./, '');
        sessionSource.set(e.session_id, host || '(direct)');
      } catch {
        sessionSource.set(e.session_id, '(direct)');
      }
    }
  }
  // Sessions never assigned a source are direct.
  const allSessions = new Set(events.map((e) => e.session_id));
  for (const sid of allSessions) {
    if (!sessionSource.has(sid)) sessionSource.set(sid, '(direct)');
  }

  const counts = new Map<string, number>();
  for (const src of sessionSource.values()) {
    counts.set(src, (counts.get(src) ?? 0) + 1);
  }

  return Array.from(counts.entries())
    .map(([source, sessions]) => ({ source, sessions }))
    .sort((a, b) => b.sessions - a.sessions);
}

export function useFunnelAnalytics(days: number = 30) {
  return useQuery<FunnelAnalyticsResult>({
    queryKey: ['marketing-funnel', days],
    queryFn: async () => {
      const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();
      const { data, error } = await supabase
        .from('marketing_funnel_events')
        .select('session_id, event_type, industry, utm_source, referrer')
        .gte('created_at', since)
        .order('created_at', { ascending: true })
        .limit(50000);

      if (error) throw error;
      const events = (data ?? []) as EventRow[];
      const sessions = new Set(events.map((e) => e.session_id));
      return {
        stageCounts: computeStageCounts(events),
        byIndustry: computeByIndustry(events),
        byAttribution: computeByAttribution(events),
        totalSessions: sessions.size,
      };
    },
  });
}