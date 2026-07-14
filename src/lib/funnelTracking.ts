/**
 * Marketing funnel tracking helper.
 *
 * Fire-and-forget: never throws, never blocks. Analytics only.
 * Session is stitched via localStorage so repeat visits from the same
 * browser hang together as a single funnel session. UTM/referrer
 * attribution is captured once per session and never overwritten by
 * later in-app navigations.
 */

export type FunnelEventType =
  | 'page_view'
  | 'chat_opened'
  | 'chat_message_sent'
  | 'pricing_viewed'
  | 'pricing_expanded'
  | 'demo_cta_clicked'
  | 'auth_started'
  | 'signup_completed'
  | 'checkout_completed';

interface TrackMeta {
  industry?: string | null;
  tier?: string | null;
  pagePath?: string | null;
  companyId?: string | null;
}

const SESSION_KEY = 'aura_funnel_session_id';
const ATTR_FLAG_KEY = 'aura_funnel_attribution_captured';

const LOG_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/log-funnel-event`;
const ANON_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string;

function getOrCreateSessionId(): string {
  try {
    const existing = localStorage.getItem(SESSION_KEY);
    if (existing) return existing;
    const id =
      typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
        ? crypto.randomUUID()
        : `s_${Math.random().toString(36).slice(2)}${Date.now().toString(36)}`;
    localStorage.setItem(SESSION_KEY, id);
    return id;
  } catch {
    return `s_${Date.now().toString(36)}`;
  }
}

function captureAttributionOnce(): {
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
  referrer?: string;
} {
  try {
    if (localStorage.getItem(ATTR_FLAG_KEY) === '1') return {};
    localStorage.setItem(ATTR_FLAG_KEY, '1');

    const params = new URLSearchParams(window.location.search);
    const out: Record<string, string> = {};
    const utmSource = params.get('utm_source');
    const utmMedium = params.get('utm_medium');
    const utmCampaign = params.get('utm_campaign');
    if (utmSource) out.utm_source = utmSource;
    if (utmMedium) out.utm_medium = utmMedium;
    if (utmCampaign) out.utm_campaign = utmCampaign;
    if (document.referrer) out.referrer = document.referrer;
    return out;
  } catch {
    return {};
  }
}

export function trackFunnelEvent(eventType: FunnelEventType, meta?: TrackMeta): void {
  try {
    if (typeof window === 'undefined') return;
    const session_id = getOrCreateSessionId();
    const attribution = captureAttributionOnce();

    const body: Record<string, unknown> = {
      session_id,
      event_type: eventType,
      page_path: meta?.pagePath ?? window.location.pathname,
      ...attribution,
    };
    if (meta?.industry) body.industry = meta.industry;
    if (meta?.tier) body.tier = meta.tier;
    if (meta?.companyId) body.company_id = meta.companyId;

    // Fire-and-forget. Do not await, do not throw.
    fetch(LOG_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${ANON_KEY}`,
      },
      body: JSON.stringify(body),
      keepalive: true,
    }).catch((err) => {
      // eslint-disable-next-line no-console
      console.debug('[funnelTracking] send failed', err);
    });
  } catch (err) {
    // eslint-disable-next-line no-console
    console.debug('[funnelTracking] tracking failed', err);
  }
}