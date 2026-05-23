import React from 'react';
import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer';
import { TIER_AGENT_CONFIG } from '@/lib/subscriptionAgentConfig';

// Cyber-Sentry inspired palette (PDF renderer requires literal colors).
const c = {
  bg: '#0B1220',
  panel: '#111A2E',
  panelAlt: '#0E1626',
  border: '#1F2A44',
  text: '#E6EDF7',
  textDim: '#9AA7BD',
  primary: '#00E5FF',
  accent: '#7C5CFF',
  success: '#22D3A8',
  warn: '#F59E0B',
  white: '#FFFFFF',
};

const s = StyleSheet.create({
  page: { padding: 40, backgroundColor: c.bg, color: c.text, fontFamily: 'Helvetica', fontSize: 10, lineHeight: 1.45 },
  cover: { padding: 40, backgroundColor: c.bg, height: '100%', justifyContent: 'center' },
  coverBadge: { alignSelf: 'flex-start', backgroundColor: c.primary, color: c.bg, paddingHorizontal: 10, paddingVertical: 4, fontSize: 9, fontWeight: 'bold', borderRadius: 4, marginBottom: 24 },
  coverTitle: { fontSize: 40, fontWeight: 'bold', color: c.white, marginBottom: 14 },
  coverSub: { fontSize: 14, color: c.textDim, marginBottom: 28, maxWidth: 460 },
  coverMeta: { fontSize: 10, color: c.textDim, marginTop: 30 },
  coverRule: { height: 2, width: 80, backgroundColor: c.primary, marginBottom: 24 },
  h1: { fontSize: 22, fontWeight: 'bold', color: c.white, marginBottom: 6 },
  h2: { fontSize: 14, fontWeight: 'bold', color: c.primary, marginTop: 14, marginBottom: 6, textTransform: 'uppercase', letterSpacing: 1 },
  h3: { fontSize: 12, fontWeight: 'bold', color: c.white, marginTop: 10, marginBottom: 4 },
  p: { fontSize: 10, color: c.text, marginBottom: 6 },
  dim: { fontSize: 9, color: c.textDim, marginBottom: 4 },
  divider: { height: 1, backgroundColor: c.border, marginVertical: 10 },
  card: { backgroundColor: c.panel, borderWidth: 1, borderColor: c.border, borderRadius: 6, padding: 12, marginBottom: 10 },
  cardAlt: { backgroundColor: c.panelAlt, borderWidth: 1, borderColor: c.border, borderRadius: 6, padding: 12, marginBottom: 10 },
  rowWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  pill: { backgroundColor: c.panelAlt, borderWidth: 1, borderColor: c.border, color: c.text, paddingHorizontal: 8, paddingVertical: 3, fontSize: 8, borderRadius: 10, marginRight: 4, marginBottom: 4 },
  pillPrimary: { backgroundColor: c.primary, color: c.bg, paddingHorizontal: 8, paddingVertical: 3, fontSize: 8, borderRadius: 10, marginRight: 4, marginBottom: 4, fontWeight: 'bold' },
  tableHead: { flexDirection: 'row', backgroundColor: c.panelAlt, borderTopLeftRadius: 4, borderTopRightRadius: 4, paddingVertical: 6, paddingHorizontal: 8 },
  tableRow: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: c.border, paddingVertical: 6, paddingHorizontal: 8 },
  th: { color: c.primary, fontSize: 9, fontWeight: 'bold', textTransform: 'uppercase' },
  td: { color: c.text, fontSize: 9 },
  footer: { position: 'absolute', bottom: 20, left: 40, right: 40, flexDirection: 'row', justifyContent: 'space-between', borderTopWidth: 1, borderTopColor: c.border, paddingTop: 6 },
  footerText: { fontSize: 8, color: c.textDim },
  callout: { backgroundColor: c.panelAlt, borderLeftWidth: 3, borderLeftColor: c.primary, padding: 10, marginBottom: 10 },
  bullet: { flexDirection: 'row', marginBottom: 3 },
  bulletDot: { color: c.primary, marginRight: 6, fontSize: 10 },
  bulletText: { color: c.text, fontSize: 9, flex: 1 },
});

const Bullet = ({ children }: { children: React.ReactNode }) => (
  <View style={s.bullet}><Text style={s.bulletDot}>•</Text><Text style={s.bulletText}>{children}</Text></View>
);

const Footer = ({ page, total }: { page: number; total: number }) => (
  <View style={s.footer} fixed>
    <Text style={s.footerText}>Aura Intercept · Marketing & Sales Master Guide</Text>
    <Text style={s.footerText}>auraintercept.ai · Page {page} of {total}</Text>
  </View>
);

// Auto-paginated footer using react-pdf's render prop.
const AutoFooter = () => (
  <View style={s.footer} fixed>
    <Text style={s.footerText}>Aura Intercept · Marketing & Sales Master Guide</Text>
    <Text
      style={s.footerText}
      render={({ pageNumber, totalPages }) => `auraintercept.ai · Page ${pageNumber} of ${totalPages}`}
    />
  </View>
);

// --- Data ---

const OPERATIVES: Array<{
  id: string;
  name: string;
  customerLabel: string;
  oneLiner: string;
  capabilities: string[];
  useCases: string[];
}> = [
  {
    id: 'triage', name: 'AI Receptionist (Triage)', customerLabel: 'Front Desk',
    oneLiner: 'First point of contact across voice, SMS, email, and web chat. Routes intent to the right operative.',
    capabilities: ['24/7 multi-channel intake', 'Intent detection & routing', 'Caller identification & spam filtering', 'Multilingual greeting'],
    useCases: ['After-hours coverage', 'Spike call deflection', 'Qualifying new vs returning customers'],
  },
  {
    id: 'customer_journey', name: 'Customer Journey', customerLabel: 'Front Desk',
    oneLiner: 'Books appointments, sends confirmations & follow-ups, and orchestrates the post-service review request.',
    capabilities: ['Booking with Google Calendar', 'Confirmation & reminder cadence', 'Post-service review automation', 'Re-engagement of stale customers'],
    useCases: ['No-show reduction', 'Review velocity boost', 'Repeat booking automation'],
  },
  {
    id: 'outreach', name: 'Outreach', customerLabel: 'Marketing',
    oneLiner: 'Captures, scores, and warms leads from every channel. Runs targeted campaigns with personalization.',
    capabilities: ['Lead capture & scoring', 'Drip campaigns (SMS/email)', 'List segmentation', 'A/B subject and copy tests'],
    useCases: ['Reactivating dormant lists', 'Promo blasts', 'New-lead instant follow-up'],
  },
  {
    id: 'creative_content', name: 'Creative Content', customerLabel: 'Social Posts',
    oneLiner: 'Generates social posts, captions, image briefs and schedules content across connected platforms.',
    capabilities: ['Multi-platform post drafting', 'AI image generation', 'Scheduling & queue', 'Engagement analytics'],
    useCases: ['Daily content calendar', 'Promo announcements', 'Review reshares'],
  },
  {
    id: 'web_presence', name: 'Web Presence', customerLabel: 'Website',
    oneLiner: 'Smart Website + blog + embeddable chat widget tuned to the company\'s industry pack.',
    capabilities: ['Smart Website builder', 'Blog management', 'Custom domain (CNAME)', 'Embeddable chat widget'],
    useCases: ['New-business website launch', 'SEO blog cadence', 'Lead capture from existing site'],
  },
  {
    id: 'dispatch', name: 'Dispatch', customerLabel: 'Dispatch',
    oneLiner: 'Assigns jobs to the right technician using skills, availability, and routing.',
    capabilities: ['Skill-based assignment', 'Availability JSON awareness', 'Click-to-call dispatch UI', 'Real-time job board'],
    useCases: ['Same-day emergency routing', 'Multi-tech coordination', 'Shift handoffs'],
  },
  {
    id: 'field_navigation', name: 'Field Navigation', customerLabel: 'On The Way',
    oneLiner: 'Optimizes routes, broadcasts ETAs, and runs check-in / check-out flows.',
    capabilities: ['Route optimization', 'Live ETA messaging', 'Check-in / check-out', 'Geofence triggers'],
    useCases: ['Customer ETA notifications', 'Tech location accountability', 'Job-time accuracy'],
  },
  {
    id: 'business_finance', name: 'Business Finance', customerLabel: 'Billing',
    oneLiner: 'Quotes, invoices, inventory, and Stripe payments — pre-filled by industry templates.',
    capabilities: ['Quote & invoice templates', 'Inventory tracking', 'Stripe payment links', 'Industry-aware line items'],
    useCases: ['On-site invoice & pay', 'Quote-to-job conversion', 'Inventory reorder alerts'],
  },
  {
    id: 'analytics_intelligence', name: 'Analytics Intelligence', customerLabel: 'Reports',
    oneLiner: 'Natural-language analytics across the entire platform — ask, don\'t click.',
    capabilities: ['NLP querying', 'Revenue & demand forecasts', 'Per-industry KPI presets', 'Auto-generated executive briefs'],
    useCases: ['Weekly performance review', 'Forecast next 30 days', 'Find the biggest leak'],
  },
  {
    id: 'admin', name: 'Admin', customerLabel: 'Office',
    oneLiner: 'Back-office automations — employee, settings, notifications, knowledge-base curation.',
    capabilities: ['Employee onboarding', 'Notification preferences', 'KB curation & updates', 'Bulk settings actions'],
    useCases: ['New hire ramp', 'Policy rollout', 'Quiet-hours config'],
  },
];

const CONSOLES: Array<{ id: string; name: string; purpose: string; operatives: string[]; tier: string }> = [
  { id: 'customer_portal', name: 'Customer Portal Console', purpose: 'Inbound channels, booking pipeline, customer chat, missed-call recovery.', operatives: ['triage', 'customer_journey'], tier: 'Core+' },
  { id: 'marketing_sales', name: 'Outreach & Sales Console', purpose: 'Lead capture & scoring, campaign control, pipeline.', operatives: ['outreach'], tier: 'Core+' },
  { id: 'creative_web_presence', name: 'Creative & Web Presence Console', purpose: 'Smart Website, blog, chat widget, brand-aware content gen.', operatives: ['creative_content', 'web_presence'], tier: 'Core+' },
  { id: 'social_media', name: 'Social Media Console', purpose: 'Multi-platform posting, scheduling, analytics.', operatives: ['creative_content'], tier: 'Core+' },
  { id: 'field_operations', name: 'Field Operations Console', purpose: 'Dispatch board, route map, technician PWA, ETA broadcast.', operatives: ['dispatch', 'field_navigation'], tier: 'Boost+' },
  { id: 'business_management', name: 'Business Management Console', purpose: 'Quotes, invoices, inventory, payments, employee mgmt.', operatives: ['business_finance', 'admin'], tier: 'Pro+' },
  { id: 'analytics_reports', name: 'Analytics & Reports Console', purpose: 'NLP analytics, KPI dashboard, revenue & demand forecasts.', operatives: ['analytics_intelligence'], tier: 'Pro+' },
  { id: 'ai_operatives_hub', name: 'AI Operatives Hub', purpose: 'Central command for all 10 operatives + industry specialists.', operatives: ['triage', 'customer_journey', 'outreach', 'creative_content', 'web_presence', 'dispatch', 'field_navigation', 'business_finance', 'analytics_intelligence', 'admin'], tier: 'Elite' },
];

const DASHBOARDS = [
  { name: 'Aura Command Center', who: 'Owner / GM', what: 'Natural-language hero. Ask Aura anything; receive prioritized actions.' },
  { name: 'Company Admin Dashboard', who: 'Admin / Manager', what: 'Simple mode = top 5 KPIs · Pro mode = full grid (toggle persisted).' },
  { name: 'Technician Dashboard (PWA)', who: 'Field staff', what: 'Today\'s jobs, route, check-in/out, voice input, customer history.' },
  { name: 'Customer Portal Home', who: 'End customer', what: 'Bookings, status, invoices, messages — branded per company.' },
];

const FEATURE_GROUPS: Array<{ group: string; items: string[] }> = [
  { group: 'Communication', items: ['Voice (SignalWire + ElevenLabs)', 'SMS with keyword auto-responder', 'Email (Resend)', 'Web chat widget', 'Missed-call auto-followup'] },
  { group: 'Scheduling & Booking', items: ['Unified 14-day booking scanner', 'Google Calendar OAuth sync', 'Public booking widget', 'Per-industry appointment rules'] },
  { group: 'Field Operations', items: ['Dispatch board', 'Route optimization', 'Live ETA messaging', 'Technician PWA + voice input'] },
  { group: 'Business Finance', items: ['Quote & invoice templates (28 industry packs)', 'Inventory tracking', 'Stripe payment links', 'Payment reconciliation'] },
  { group: 'Marketing & Outreach', items: ['Lead capture & scoring', 'Campaign manager', 'Content Engine (unified generation + posting)', 'Social media adapters (OAuth + manual)'] },
  { group: 'Web Presence', items: ['Smart Website builder', 'Blog management', 'Embeddable chat widget (3 install methods)', 'Custom domains (CNAME + TXT)'] },
  { group: 'Analytics & Reports', items: ['NLP analytics interface', 'KPI dashboard', 'Demand forecast', 'Revenue analysis', 'Per-industry KPI presets'] },
  { group: 'Knowledge & AI', items: ['Tavily web research', 'Knowledge base curation', 'Conversational intelligence', 'Industry prompt injection'] },
  { group: 'Customer Portal', items: ['Unified customer portal', 'Public company listing / directory', 'Branded per-company experience'] },
  { group: 'Platform & Security', items: ['RLS-protected DB', 'SECURITY DEFINER RPCs for public reads', 'Push / Email / SMS / In-app alerts', '90-Day Live Trial (30d onboarding + 60d live)'] },
];

const THIRD_PARTY = [
  { name: 'SignalWire', purpose: 'Voice + SMS telephony', model: "Customer's own account + card; billed directly." },
  { name: 'ElevenLabs', purpose: 'AI voice synthesis', model: "Customer's own account + card; billed directly." },
  { name: 'Resend', purpose: 'Transactional & marketing email', model: "Customer's own account + card; billed directly." },
  { name: 'Tavily', purpose: 'Live web research for AI', model: "Customer's own account + card; billed directly." },
  { name: 'Stripe', purpose: 'Payments & subscriptions', model: 'Customer connects their Stripe; pays Stripe transaction fees direct.' },
  { name: 'A2P 10DLC', purpose: 'SMS carrier registration (US)', model: 'Customer pays carrier/aggregator fees direct.' },
  { name: 'Social platforms', purpose: 'OAuth posting', model: "Customer's own pages/accounts." },
];

const TALKING_POINTS = [
  { q: '"Why not just hire a receptionist?"', a: 'A receptionist works ~40 hrs/week; AI Receptionist works 168 — across voice, SMS, email, and chat — and never misses a call. Concierge Onboarding sets it up for you in the first 30 days.' },
  { q: '"What about my existing tools?"', a: 'Aura plugs into Google Calendar, Stripe, your social accounts, and your phone provider. We replace the glue — not the tools you already love.' },
  { q: '"How fast can we go live?"', a: '30-day concierge onboarding configures voice, SMS, KB, agents, calendars, and integrations. The next 60 days are full live operation under the trial.' },
  { q: '"Is my data safe?"', a: 'RLS-protected database, security-definer RPCs for any public read, encrypted secrets, scoped third-party tokens. We never resell or pool customer data.' },
  { q: '"What if I outgrow my tier?"', a: 'Upgrade in one click. Operatives, consoles, and employee caps adjust live — no data migration.' },
];

const today = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });

const TIERS: Array<{ key: keyof typeof TIER_AGENT_CONFIG; onboarding: string; employees: string }> = [
  { key: 'starter', onboarding: '$497 one-time', employees: '10 employees' },
  { key: 'connect', onboarding: '$697 one-time', employees: '25 employees' },
  { key: 'performance', onboarding: '$1,197 one-time', employees: '50 employees' },
  { key: 'command', onboarding: '$2,197 one-time', employees: 'Unlimited employees' },
];

const opName = (id: string) => OPERATIVES.find(o => o.id === id)?.name ?? id;

const MarketingSalesMasterPDF: React.FC = () => (
  <Document>
    {/* Cover */}
    <Page size="LETTER" style={s.cover}>
      <Text style={s.coverBadge}>AURA INTERCEPT</Text>
      <View style={s.coverRule} />
      <Text style={s.coverTitle}>Marketing &amp; Sales{'\n'}Master Guide</Text>
      <Text style={s.coverSub}>
        Every AI operative, platform feature, dashboard, and console — in one
        sales-ready reference. Built for reps, partners, and prospects.
      </Text>
      <Text style={s.coverMeta}>Version 1.0 · {today}</Text>
      <Text style={s.coverMeta}>auraintercept.ai</Text>
    </Page>

    {/* Executive Summary */}
    <Page size="LETTER" style={s.page}>
      <Text style={s.h1}>Executive Summary</Text>
      <Text style={s.dim}>What Aura Intercept is, who it's for, and how it's priced.</Text>
      <View style={s.divider} />
      <View style={s.card}>
        <Text style={s.p}>
          Aura Intercept is an AI operations platform that consolidates 24 underlying
          AI agents into 10 specialized operatives across 7 consoles — handling voice,
          SMS, email, chat, dispatch, billing, marketing, and analytics for service
          businesses and SMBs.
        </Text>
      </View>
      <Text style={s.h2}>Who it's for</Text>
      <Bullet>Service businesses (HVAC, plumbing, electrical, auto, beauty, real estate, restaurants, etc.)</Bullet>
      <Bullet>Owner-operators replacing missed calls and after-hours coverage</Bullet>
      <Bullet>Growing teams that need dispatch + billing + marketing in one stack</Bullet>
      <Bullet>Multi-channel businesses needing voice + SMS + email + chat unified</Bullet>

      <Text style={s.h2}>4-Tier model at a glance</Text>
      <View style={s.tableHead}>
        <Text style={[s.th, { width: '22%' }]}>Tier</Text>
        <Text style={[s.th, { width: '22%' }]}>Monthly</Text>
        <Text style={[s.th, { width: '28%' }]}>Onboarding</Text>
        <Text style={[s.th, { width: '28%' }]}>Employees</Text>
      </View>
      {TIERS.map(t => {
        const cfg = TIER_AGENT_CONFIG[t.key];
        return (
          <View key={t.key} style={s.tableRow}>
            <Text style={[s.td, { width: '22%' }]}>{cfg.label}</Text>
            <Text style={[s.td, { width: '22%' }]}>{cfg.price}</Text>
            <Text style={[s.td, { width: '28%' }]}>{t.onboarding}</Text>
            <Text style={[s.td, { width: '28%' }]}>{t.employees}</Text>
          </View>
        );
      })}
      <View style={s.callout}>
        <Text style={s.p}>
          90-Day Live Trial · The first 30 days are dedicated concierge onboarding
          (account config, agent tuning, KB, 3rd-party activation, training). The
          remaining 60 days are full live operation. Onboarding fee is due at trial start.
        </Text>
      </View>
      <Footer page={2} total={12} />
    </Page>

    {/* Pricing & Tiers */}
    <Page size="LETTER" style={s.page}>
      <Text style={s.h1}>Pricing &amp; Tiers</Text>
      <Text style={s.dim}>Operatives and consoles included per tier.</Text>
      <View style={s.divider} />
      {TIERS.map(t => {
        const cfg = TIER_AGENT_CONFIG[t.key];
        return (
          <View key={t.key} style={s.card}>
            <Text style={s.h3}>{cfg.label} · {cfg.price} · {t.onboarding} · {t.employees}</Text>
            <Text style={s.p}>{cfg.description}</Text>
            <Text style={s.dim}>Operatives ({cfg.agents.length})</Text>
            <View style={s.rowWrap}>
              {cfg.agents.map(a => <Text key={a} style={s.pillPrimary}>{opName(a)}</Text>)}
            </View>
            <Text style={[s.dim, { marginTop: 6 }]}>Consoles ({cfg.consoles.length})</Text>
            <View style={s.rowWrap}>
              {cfg.consoles.map(co => <Text key={co} style={s.pill}>{CONSOLES.find(x => x.id === co)?.name ?? co}</Text>)}
            </View>
          </View>
        );
      })}
      <Footer page={3} total={12} />
    </Page>

    {/* Operatives — split across pages */}
    {[OPERATIVES.slice(0, 5), OPERATIVES.slice(5, 10)].map((batch, batchIdx) => (
      <Page key={`op-${batchIdx}`} size="LETTER" style={s.page}>
        <Text style={s.h1}>The 10 AI Operatives {batchIdx === 0 ? '(1–5)' : '(6–10)'}</Text>
        <Text style={s.dim}>Consolidated operatives that run the business. Customer-facing labels in parentheses.</Text>
        <View style={s.divider} />
        {batch.map(op => (
          <View key={op.id} style={s.card}>
            <Text style={s.h3}>{op.name}  ·  <Text style={{ color: c.textDim }}>"{op.customerLabel}"</Text></Text>
            <Text style={s.p}>{op.oneLiner}</Text>
            <Text style={s.dim}>Key capabilities</Text>
            {op.capabilities.map((cap, i) => <Bullet key={i}>{cap}</Bullet>)}
            <Text style={[s.dim, { marginTop: 4 }]}>Sample use cases</Text>
            <View style={s.rowWrap}>
              {op.useCases.map((u, i) => <Text key={i} style={s.pill}>{u}</Text>)}
            </View>
          </View>
        ))}
        <Footer page={4 + batchIdx} total={12} />
      </Page>
    ))}

    {/* Industry Specialists */}
    <Page size="LETTER" style={s.page}>
      <Text style={s.h1}>Industry Specialists</Text>
      <Text style={s.dim}>Auto-activated by industry pack on every plan.</Text>
      <View style={s.divider} />
      <View style={s.card}>
        <Text style={s.p}>
          Aura ships with 18 industry packs across 4 clusters (Trades, Outdoor,
          Repair, Booking). Selecting an industry at signup activates that pack's
          terminology, quote/invoice templates, KPI presets, marketing playbooks,
          and specialist operatives — without changing tier or pricing.
        </Text>
      </View>
      <Text style={s.h2}>Example specialists</Text>
      <Bullet>Real Estate — Listing Writer, Comp Analyst</Bullet>
      <Bullet>Beauty & Wellness — Style Consultant, Loyalty Coach</Bullet>
      <Bullet>Restaurants — Menu Writer, Review Responder</Bullet>
      <Bullet>Trades (HVAC / Plumbing / Electrical) — Diagnostic, Site Survey, Insurance Claim</Bullet>
      <Bullet>Personal Assistant — Task Triager, Calendar Optimizer</Bullet>
      <Text style={s.h2}>What changes per industry</Text>
      <Bullet>Operative system prompts (industry prompt injection)</Bullet>
      <Bullet>Quote/invoice line-item templates and terminology</Bullet>
      <Bullet>KPI labels and analytics presets</Bullet>
      <Bullet>Empty-state copy and quick actions</Bullet>
      <Bullet>Voice greeting and marketing playbook</Bullet>
      <Footer page={6} total={12} />
    </Page>

    {/* Platform Features */}
    <Page size="LETTER" style={s.page}>
      <Text style={s.h1}>Platform Features</Text>
      <Text style={s.dim}>Grouped capability catalog.</Text>
      <View style={s.divider} />
      {FEATURE_GROUPS.map(g => (
        <View key={g.group} style={s.cardAlt}>
          <Text style={s.h3}>{g.group}</Text>
          <View style={s.rowWrap}>
            {g.items.map((it, i) => <Text key={i} style={s.pill}>{it}</Text>)}
          </View>
        </View>
      ))}
      <Footer page={7} total={12} />
    </Page>

    {/* Dashboards */}
    <Page size="LETTER" style={s.page}>
      <Text style={s.h1}>Dashboards</Text>
      <Text style={s.dim}>Where each role lives day-to-day.</Text>
      <View style={s.divider} />
      <View style={s.tableHead}>
        <Text style={[s.th, { width: '30%' }]}>Dashboard</Text>
        <Text style={[s.th, { width: '20%' }]}>Audience</Text>
        <Text style={[s.th, { width: '50%' }]}>What it shows</Text>
      </View>
      {DASHBOARDS.map(d => (
        <View key={d.name} style={s.tableRow}>
          <Text style={[s.td, { width: '30%' }]}>{d.name}</Text>
          <Text style={[s.td, { width: '20%' }]}>{d.who}</Text>
          <Text style={[s.td, { width: '50%' }]}>{d.what}</Text>
        </View>
      ))}
      <View style={s.callout}>
        <Text style={s.p}>
          Aura Command Center prioritizes natural language over static metrics —
          owners ask Aura ("What's slipping this week?") and get a prioritized action
          list rather than a chart wall.
        </Text>
      </View>
      <Footer page={8} total={12} />
    </Page>

    {/* Consoles & Hubs */}
    <Page size="LETTER" style={s.page}>
      <Text style={s.h1}>Consoles &amp; Hubs</Text>
      <Text style={s.dim}>7 consoles plus the AI Operatives Hub (Elite).</Text>
      <View style={s.divider} />
      {CONSOLES.map(co => (
        <View key={co.id} style={s.card}>
          <Text style={s.h3}>{co.name}  ·  <Text style={{ color: c.primary }}>{co.tier}</Text></Text>
          <Text style={s.p}>{co.purpose}</Text>
          <View style={s.rowWrap}>
            {co.operatives.map(op => <Text key={op} style={s.pill}>{opName(op)}</Text>)}
          </View>
        </View>
      ))}
      <Footer page={9} total={12} />
    </Page>

    {/* 3rd-Party Stack */}
    <Page size="LETTER" style={s.page}>
      <Text style={s.h1}>3rd-Party Stack Disclosure</Text>
      <Text style={s.dim}>Aura is the platform. All third-party usage is billed by each provider directly.</Text>
      <View style={s.divider} />
      <View style={s.tableHead}>
        <Text style={[s.th, { width: '20%' }]}>Provider</Text>
        <Text style={[s.th, { width: '30%' }]}>Purpose</Text>
        <Text style={[s.th, { width: '50%' }]}>Billing model</Text>
      </View>
      {THIRD_PARTY.map(t => (
        <View key={t.name} style={s.tableRow}>
          <Text style={[s.td, { width: '20%' }]}>{t.name}</Text>
          <Text style={[s.td, { width: '30%' }]}>{t.purpose}</Text>
          <Text style={[s.td, { width: '50%' }]}>{t.model}</Text>
        </View>
      ))}
      <View style={s.callout}>
        <Text style={s.p}>
          All providers require the customer's own account and a valid credit card on
          file. Concierge Onboarding configures these accounts on the customer's behalf.
          Aura plan fee = platform only; never resells or marks up third-party usage.
        </Text>
      </View>
      <Footer page={10} total={12} />
    </Page>

    {/* Trial & Onboarding + Talking Points */}
    <Page size="LETTER" style={s.page}>
      <Text style={s.h1}>Trial, Onboarding &amp; Sales Talking Points</Text>
      <View style={s.divider} />
      <Text style={s.h2}>90-Day Live Trial structure</Text>
      <Bullet>Days 1–30: Concierge onboarding — account config, agent tuning, KB build, 3rd-party activation, team training.</Bullet>
      <Bullet>Days 31–90: Full live operation — every operative live across the customer's actual channels.</Bullet>
      <Bullet>Onboarding fee due at trial start. Monthly billing begins after the trial.</Bullet>
      <Bullet>No credit card required to start the trial signup; required to activate 3rd-party providers.</Bullet>

      <Text style={s.h2}>Talking points / objection handling</Text>
      {TALKING_POINTS.map((t, i) => (
        <View key={i} style={s.cardAlt}>
          <Text style={s.h3}>{t.q}</Text>
          <Text style={s.p}>{t.a}</Text>
        </View>
      ))}
      <Footer page={11} total={12} />
    </Page>

    {/* Contact / Next Steps */}
    <Page size="LETTER" style={s.page}>
      <Text style={s.h1}>Next Steps</Text>
      <View style={s.divider} />
      <View style={s.card}>
        <Text style={s.h3}>Book a demo</Text>
        <Text style={s.p}>auraintercept.ai/contact</Text>
      </View>
      <View style={s.card}>
        <Text style={s.h3}>Start the 90-Day Live Trial</Text>
        <Text style={s.p}>auraintercept.ai/auth</Text>
      </View>
      <View style={s.card}>
        <Text style={s.h3}>Run a free AI Opportunity Audit</Text>
        <Text style={s.p}>auraintercept.ai/audit</Text>
      </View>
      <View style={s.callout}>
        <Text style={s.p}>Aura Intercept · auraintercept.ai · Generated {today}</Text>
      </View>
      <Footer page={12} total={12} />
    </Page>
  </Document>
);

export default MarketingSalesMasterPDF;