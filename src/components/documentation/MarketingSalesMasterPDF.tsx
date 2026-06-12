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
  underlyingAgents: string[];
  channels: string[];
  handoffs: string;
  kpis: string[];
  thirdParty: string[];
  minTier: 'Core' | 'Boost' | 'Pro' | 'Elite';
  sampleTranscript: { from: string; line: string }[];
}> = [
  {
    id: 'triage', name: 'AI Receptionist (Triage)', customerLabel: 'Front Desk',
    oneLiner: 'First point of contact across voice, SMS, email, and web chat. Routes intent to the right operative.',
    capabilities: ['24/7 multi-channel intake', 'Intent detection & routing', 'Caller identification & spam filtering', 'Multilingual greeting'],
    useCases: ['After-hours coverage', 'Spike call deflection', 'Qualifying new vs returning customers'],
    underlyingAgents: ['triage', 'intent_router', 'spam_filter'],
    channels: ['Voice', 'SMS', 'Email', 'Web Chat'],
    handoffs: 'Routes to Customer Journey (booking), Outreach (new lead), Dispatch (emergency), Business Finance (billing question), or Admin (account).',
    kpis: ['Answer rate', 'Avg time-to-answer', 'Routed-correctly %', 'Missed-call recoveries'],
    thirdParty: ['SignalWire (voice/SMS)', 'ElevenLabs (voice synth)', 'Resend (email)'],
    minTier: 'Core',
    sampleTranscript: [
      { from: 'Caller', line: '"Hi, my AC stopped working."' },
      { from: 'Aura', line: '"I can get a tech out today. Are you a current customer? I\'ll route you to dispatch."' },
    ],
  },
  {
    id: 'customer_journey', name: 'Customer Journey', customerLabel: 'Front Desk',
    oneLiner: 'Books appointments, sends confirmations & follow-ups, and orchestrates the post-service review request.',
    capabilities: ['Booking with Google Calendar', 'Confirmation & reminder cadence', 'Post-service review automation', 'Re-engagement of stale customers'],
    useCases: ['No-show reduction', 'Review velocity boost', 'Repeat booking automation'],
    underlyingAgents: ['booking', 'followup', 'review'],
    channels: ['SMS', 'Email', 'Voice', 'Web Chat'],
    handoffs: 'Receives from Triage; hands to Dispatch (assign tech) and Outreach (re-engagement campaigns).',
    kpis: ['No-show rate', 'Booking conversion', 'Review request → review %', 'Repeat-booking rate'],
    thirdParty: ['Google Calendar (OAuth)', 'SignalWire (SMS)', 'Resend (email)'],
    minTier: 'Core',
    sampleTranscript: [
      { from: 'Aura', line: '"Reminder: tomorrow 2pm appointment with Mike. Reply C to confirm, R to reschedule."' },
      { from: 'Customer', line: '"C"' },
    ],
  },
  {
    id: 'outreach', name: 'Outreach', customerLabel: 'Marketing',
    oneLiner: 'Captures, scores, and warms leads from every channel. Runs targeted campaigns with personalization.',
    capabilities: ['Lead capture & scoring', 'Drip campaigns (SMS/email)', 'List segmentation', 'A/B subject and copy tests'],
    useCases: ['Reactivating dormant lists', 'Promo blasts', 'New-lead instant follow-up'],
    underlyingAgents: ['lead', 'campaign', 'marketing'],
    channels: ['SMS', 'Email', 'Web Chat', 'Social'],
    handoffs: 'Receives leads from Triage and Web Presence; hands hot leads to Customer Journey for booking.',
    kpis: ['Lead score distribution', 'Campaign open/click/reply', 'Lead → booked %', 'Cost per booked lead'],
    thirdParty: ['SignalWire (SMS, A2P 10DLC)', 'Resend (email)'],
    minTier: 'Core',
    sampleTranscript: [
      { from: 'Aura', line: '"New lead from website: Sara, kitchen remodel, scored 87. Suggested first touch: SMS within 5 min."' },
    ],
  },
  {
    id: 'creative_content', name: 'Creative Content', customerLabel: 'Social Posts',
    oneLiner: 'Generates social posts, captions, image briefs and schedules content across connected platforms.',
    capabilities: ['Multi-platform post drafting', 'AI image generation', 'Scheduling & queue', 'Engagement analytics'],
    useCases: ['Daily content calendar', 'Promo announcements', 'Review reshares'],
    underlyingAgents: ['creative', 'social_content', 'social_scheduler', 'social_analytics'],
    channels: ['Facebook', 'Instagram', 'Google Business', 'LinkedIn', 'X', 'TikTok'],
    handoffs: 'Pulls brief from Outreach campaigns; pushes drafts to Web Presence (blog) and Content Engine (queue).',
    kpis: ['Posts published', 'Engagement rate', 'Profile reach growth', 'Inbound DMs from posts'],
    thirdParty: ['Social OAuth (per platform)', 'Lovable AI Gateway (image gen)'],
    minTier: 'Core',
    sampleTranscript: [
      { from: 'Owner', line: '"Post about our heat wave special."' },
      { from: 'Aura', line: '"Drafted 3 variants + image. Scheduling for IG + FB tomorrow 9am."' },
    ],
  },
  {
    id: 'web_presence', name: 'Web Presence', customerLabel: 'Website',
    oneLiner: 'Smart Website + blog + embeddable chat widget tuned to the company\'s industry pack.',
    capabilities: ['Smart Website builder', 'Blog management', 'Custom domain (CNAME)', 'Embeddable chat widget'],
    useCases: ['New-business website launch', 'SEO blog cadence', 'Lead capture from existing site'],
    underlyingAgents: ['web_presence', 'blog', 'widget'],
    channels: ['Web', 'Embeddable widget (3 install methods)'],
    handoffs: 'Captured leads flow to Outreach; chat sessions escalate to Triage.',
    kpis: ['Sessions', 'Chat-started %', 'Lead capture rate', 'Blog post throughput'],
    thirdParty: ['Custom DNS (CNAME + TXT)', 'Lovable AI Gateway (content gen)'],
    minTier: 'Core',
    sampleTranscript: [
      { from: 'Visitor', line: '"Do you service my zip code?"' },
      { from: 'Aura', line: '"Yes — 4 techs cover 30339. Want to book a window now?"' },
    ],
  },
  {
    id: 'dispatch', name: 'Dispatch', customerLabel: 'Dispatch',
    oneLiner: 'Assigns jobs to the right technician using skills, availability, and routing.',
    capabilities: ['Skill-based assignment', 'Availability JSON awareness', 'Click-to-call dispatch UI', 'Real-time job board'],
    useCases: ['Same-day emergency routing', 'Multi-tech coordination', 'Shift handoffs'],
    underlyingAgents: ['dispatch'],
    channels: ['Internal dispatch board', 'SMS to tech', 'Push to PWA'],
    handoffs: 'Receives confirmed jobs from Customer Journey; hands to Field Navigation when tech accepts.',
    kpis: ['Time-to-assign', 'First-time-fix %', 'Tech utilization', 'Same-day fill rate'],
    thirdParty: ['SignalWire (tech SMS)', 'Web Push (PWA)'],
    minTier: 'Boost',
    sampleTranscript: [
      { from: 'Aura', line: '"Emergency drain call · 2 mi from Jose · he\'s open 11–1. Assigning + sending route."' },
    ],
  },
  {
    id: 'field_navigation', name: 'Field Navigation', customerLabel: 'On The Way',
    oneLiner: 'Optimizes routes, broadcasts ETAs, and runs check-in / check-out flows.',
    capabilities: ['Route optimization', 'Live ETA messaging', 'Check-in / check-out', 'Geofence triggers'],
    useCases: ['Customer ETA notifications', 'Tech location accountability', 'Job-time accuracy'],
    underlyingAgents: ['route', 'eta', 'checkin'],
    channels: ['Tech PWA', 'Customer SMS', 'Push notifications'],
    handoffs: 'Receives from Dispatch; check-out completes a job and pings Business Finance to invoice and Customer Journey to request a review.',
    kpis: ['On-time arrival %', 'Avg drive time', 'ETA accuracy', 'Jobs/day per tech'],
    thirdParty: ['Mapping (Leaflet)', 'SignalWire (customer SMS)'],
    minTier: 'Boost',
    sampleTranscript: [
      { from: 'Aura → customer', line: '"Mike is 12 min away. Track: aura.link/abc"' },
    ],
  },
  {
    id: 'business_finance', name: 'Business Finance', customerLabel: 'Billing',
    oneLiner: 'Quotes, invoices, inventory, and Stripe payments — pre-filled by industry templates.',
    capabilities: ['Quote & invoice templates', 'Inventory tracking', 'Stripe payment links', 'Industry-aware line items'],
    useCases: ['On-site invoice & pay', 'Quote-to-job conversion', 'Inventory reorder alerts'],
    underlyingAgents: ['quoting', 'invoice', 'inventory'],
    channels: ['Tech PWA (on-site)', 'Email', 'SMS payment links'],
    handoffs: 'Triggered by Field Navigation check-out; quote acceptance creates a job routed back to Customer Journey.',
    kpis: ['Quote acceptance %', 'Days-to-pay', 'Invoice volume', 'Inventory stockouts'],
    thirdParty: ['Stripe (customer connects own account)'],
    minTier: 'Pro',
    sampleTranscript: [
      { from: 'Aura', line: '"Job complete. Invoice $487 sent via SMS + email. Stripe link expires in 7 days."' },
    ],
  },
  {
    id: 'analytics_intelligence', name: 'Analytics Intelligence', customerLabel: 'Reports',
    oneLiner: 'Natural-language analytics across the entire platform — ask, don\'t click.',
    capabilities: ['NLP querying', 'Revenue & demand forecasts', 'Per-industry KPI presets', 'Auto-generated executive briefs'],
    useCases: ['Weekly performance review', 'Forecast next 30 days', 'Find the biggest leak'],
    underlyingAgents: ['insights', 'revenue', 'forecast'],
    channels: ['Analytics Console', 'Command Center', 'Email digest'],
    handoffs: 'Reads from every operative; surfaces action prompts that route back to the relevant console.',
    kpis: ['Revenue trend', 'Pipeline coverage', 'Forecast accuracy', 'KPI alert volume'],
    thirdParty: ['Lovable AI Gateway (NLP)'],
    minTier: 'Pro',
    sampleTranscript: [
      { from: 'Owner', line: '"What\'s slipping this week?"' },
      { from: 'Aura', line: '"3 quotes >7 days old totaling $12.4k. Want me to follow up?"' },
    ],
  },
  {
    id: 'admin', name: 'Admin', customerLabel: 'Office',
    oneLiner: 'Back-office automations — employee, settings, notifications, knowledge-base curation.',
    capabilities: ['Employee onboarding', 'Notification preferences', 'KB curation & updates', 'Bulk settings actions'],
    useCases: ['New hire ramp', 'Policy rollout', 'Quiet-hours config'],
    underlyingAgents: ['admin'],
    channels: ['Settings', 'Notifications (push/email/SMS/in-app)'],
    handoffs: 'Configures every other operative — quiet hours, escalation paths, KB content, employee permissions.',
    kpis: ['Setup completion %', 'KB freshness', 'Notification opt-in rate', 'Employee activation'],
    thirdParty: ['Resend (email)', 'SignalWire (SMS)', 'Web Push'],
    minTier: 'Pro',
    sampleTranscript: [
      { from: 'Owner', line: '"Add Sarah as a tech, weekday 8–5, plumbing skills."' },
      { from: 'Aura', line: '"Created. Invite sent. Dispatch will start routing her tomorrow."' },
    ],
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
  { group: 'Platform & Security', items: ['RLS-protected DB', 'SECURITY DEFINER RPCs for public reads', 'Push / Email / SMS / In-app alerts', '60-Day Live Trial (30d onboarding + 30d live)'] },
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

// --- Industry Specialists (expanded) ---
const SPECIALISTS: Array<{ name: string; what: string; industries: string; sample: string }> = [
  { name: 'Diagnostic', what: 'Photo + symptom analysis with likely-fix and parts list.', industries: 'HVAC, Plumbing, Electrical, Appliance Repair, Auto Care', sample: '"Photo shows corroded contactor + low refrigerant. Likely cause: capacitor failure. Parts: 45/5 MFD cap, R-410A."' },
  { name: 'Permit & Code', what: 'Local code lookups, permit determinations, pull-process guidance.', industries: 'Electrical, Plumbing, Construction, Roofing, Solar', sample: '"Fulton County requires panel-upgrade permit ($165). Schedule inspection within 30 days of pull."' },
  { name: 'Site Survey & Quote', what: 'Pre-install survey, measurements, takeoff math.', industries: 'Roofing, Solar, Fencing, Landscape, Construction', sample: '"3,200 sq ft roof, 2 layers tear-off. Material: $9.4k, labor: $6.8k, dump: $1.1k."' },
  { name: 'Insurance Claim', what: 'Damage documentation and claim-ready reports.', industries: 'Roofing, Auto Care, Pool/Spa, Plumbing', sample: '"Hail dents on slopes 1 + 3, 47 hits/100sf, photo evidence packaged for State Farm submission."' },
  { name: 'Listing Writer', what: 'Listing descriptions, headlines, feature highlights.', industries: 'Real Estate', sample: '"\'Light-filled 3BR Buckhead bungalow with chef\'s kitchen and walkable Beltline access.\'"' },
  { name: 'Offer Drafter', what: 'Offer letters, counter-offers, contingency language.', industries: 'Real Estate', sample: '"$485k offer, 14-day inspection, 30-day close, FHA contingency. Ready for review."' },
  { name: 'Comp Analyst', what: 'Comparable sales/rentals + pricing position summary.', industries: 'Real Estate', sample: '"6 comps within 0.4 mi · median $/sf $312. Subject is priced 4% above market — recommend $475k."' },
  { name: 'Style Consultant', what: 'Cuts/colors/treatments based on client photo + history.', industries: 'Beauty & Wellness, Salon', sample: '"Based on last 3 visits + current photo: balayage refresh + olaplex bond builder."' },
  { name: 'Loyalty Coach', what: 'Identifies repeat-visit risk + drafts rebook outreach.', industries: 'Beauty & Wellness, Salon, Fitness, Auto Care', sample: '"42 clients last visited >9 weeks ago. Drafted personal rebook SMS for each."' },
  { name: 'Menu Writer', what: 'Menu copy, daily specials, dietary callouts.', industries: 'Restaurants', sample: '"Today\'s special: Pan-seared snapper with citrus beurre blanc. GF · pescatarian."' },
  { name: 'Reservation Optimizer', what: 'Reshuffles bookings to maximize covers, minimize gaps.', industries: 'Restaurants', sample: '"Move 7:00 4-top to 7:15 → opens 6:45 2-top window. +1 cover."' },
  { name: 'Task Triager', what: 'Sorts inbound client tasks by urgency, owner, due date.', industries: 'Personal Assistant, Professional Services', sample: '"3 urgent: flight change (today), gift order (Fri), tax doc (Mon). Routed to you, assistant, vendor."' },
  { name: 'Calendar Optimizer', what: 'Slot consolidation + travel-aware scheduling fixes.', industries: 'Personal Assistant, Beauty, Fitness, Real Estate', sample: '"Combining 2 Buckhead showings saves 38 min drive time. Suggested order: 2pm → 2:45pm."' },
  { name: 'Review Responder', what: 'On-brand responses to Google/Yelp/Facebook reviews.', industries: 'All (auto-enabled in every pack)', sample: '"\'Thanks Maria — we\'ll let Jose know! Glad the system\'s running cool.\'"' },
];

// --- Feature detail catalog ---
const FEATURES_DETAIL: Array<{
  area: string;
  items: Array<{ name: string; value: string; route?: string; tier: string; who: string; dep?: string }>;
}> = [
  { area: 'Voice & Telephony', items: [
    { name: 'AI Voice Receptionist', value: 'Answers, qualifies, and routes calls 24/7.', route: '/dashboard/integrations/voice', tier: 'Core', who: 'Caller / Admin', dep: 'SignalWire + ElevenLabs' },
    { name: 'Call History & Recording', value: 'Searchable call log with transcripts.', route: '/dashboard/calls', tier: 'Core', who: 'Admin', dep: 'SignalWire' },
    { name: 'CFNA (Call Forward No-Answer)', value: 'Forward existing number to Aura on missed calls.', tier: 'Core', who: 'Admin', dep: 'Phone provider' },
    { name: 'Missed-Call Auto-Followup', value: 'Instant SMS recovery for missed calls.', tier: 'Core', who: 'Caller', dep: 'SignalWire' },
  ]},
  { area: 'SMS & Messaging', items: [
    { name: 'AI SMS Handler', value: 'Two-way SMS with intent routing.', route: '/dashboard/messages', tier: 'Core', who: 'Customer / Admin', dep: 'SignalWire + A2P 10DLC' },
    { name: 'Keyword Auto-Responder', value: 'Hashtag triggers bypass AI for instant replies.', route: '/dashboard/integrations/sms', tier: 'Core', who: 'Admin' },
    { name: 'SMS Logs', value: 'Per-conversation history, deliverability stats.', route: '/dashboard/sms-logs', tier: 'Core', who: 'Admin' },
  ]},
  { area: 'Email', items: [
    { name: 'Transactional Email', value: 'Confirmations, receipts, alerts.', tier: 'Core', who: 'Customer / Admin', dep: 'Resend' },
    { name: 'Marketing Email', value: 'Campaigns from Outreach operative.', route: '/dashboard/campaigns', tier: 'Core', who: 'Admin', dep: 'Resend' },
    { name: 'Email Logs + Send-Cap Guard', value: 'Daily/monthly caps prevent runaway sends.', route: '/dashboard/email-logs', tier: 'Core', who: 'Admin' },
  ]},
  { area: 'Web Chat & Smart Website', items: [
    { name: 'Smart Website Builder', value: 'Industry-tuned website with editable sections.', route: '/dashboard/smart-website', tier: 'Core', who: 'Admin' },
    { name: 'Blog Management', value: 'Per-company blog with public reading + AI drafts.', route: '/dashboard/blog', tier: 'Core', who: 'Admin' },
    { name: 'Embeddable Chat Widget', value: '3 install methods: script tag, iframe, React component.', tier: 'Core', who: 'Visitor / Admin' },
    { name: 'Custom Domain', value: 'CNAME + TXT verification for white-label hosting.', tier: 'Core', who: 'Admin', dep: 'DNS' },
  ]},
  { area: 'Social Media', items: [
    { name: 'Multi-Platform Posting', value: 'OAuth (FB, IG, GBP, LI, X, TT) + manual fallback.', route: '/dashboard/social-media', tier: 'Core', who: 'Admin', dep: 'Social OAuth' },
    { name: 'Scheduling & Queue', value: 'Calendar view with reschedule + bulk.', tier: 'Core', who: 'Admin' },
    { name: 'Content Engine', value: 'Unified AI generation → schedule → publish.', route: '/dashboard/content-engine', tier: 'Core', who: 'Admin' },
  ]},
  { area: 'Scheduling & Booking', items: [
    { name: 'Unified Booking Engine', value: '14-day scan, pending-status loop, calendar sync.', route: '/dashboard/appointments', tier: 'Core', who: 'Customer / Admin' },
    { name: 'Google Calendar Sync', value: 'OAuth two-way sync of staff calendars.', tier: 'Core', who: 'Admin', dep: 'Google Calendar' },
    { name: 'Public Booking Page', value: '/book/{company-slug} branded booking flow.', tier: 'Core', who: 'Customer' },
    { name: 'Per-Industry Appointment Rules', value: 'Duration, prep-time, technician requirements from industry pack.', tier: 'Core', who: 'Admin' },
  ]},
  { area: 'Field Operations', items: [
    { name: 'Dispatch Board', value: 'Real-time job board with skill-based assign.', route: '/dashboard/field-operations', tier: 'Boost', who: 'Dispatcher' },
    { name: 'Route Optimization', value: 'Travel-time-aware ordering.', tier: 'Boost', who: 'Dispatcher / Tech' },
    { name: 'Technician PWA', value: 'Mobile app for jobs, voice input, check-in/out.', route: '/technician', tier: 'Boost', who: 'Technician' },
    { name: 'Live ETA Broadcast', value: 'Customer-facing SMS + tracking link.', tier: 'Boost', who: 'Customer', dep: 'SignalWire' },
  ]},
  { area: 'Quotes / Invoices / Payments', items: [
    { name: 'Quote Templates', value: 'Per-industry line items pre-filled.', route: '/dashboard/quotes', tier: 'Pro', who: 'Admin / Tech' },
    { name: 'Invoice Templates', value: 'Per-industry invoice + payment links.', route: '/dashboard/invoices', tier: 'Pro', who: 'Admin / Tech' },
    { name: 'Stripe Payment Links', value: 'Customer-connected Stripe account.', tier: 'Pro', who: 'Customer / Admin', dep: 'Stripe' },
    { name: 'Inventory Tracking', value: 'Stock + reorder thresholds.', route: '/dashboard/inventory', tier: 'Pro', who: 'Admin' },
  ]},
  { area: 'Lead Capture & Scoring', items: [
    { name: 'Lead Capture (multi-source)', value: 'Web, chat, SMS, voice, social → unified pipeline.', route: '/dashboard/leads', tier: 'Core', who: 'Admin' },
    { name: 'AI Lead Scoring', value: '0–100 score from channel, intent, history.', tier: 'Core', who: 'Admin' },
    { name: 'Campaign Manager', value: 'Drip flows + A/B + segmentation.', route: '/dashboard/campaigns', tier: 'Core', who: 'Admin' },
  ]},
  { area: 'Customer Portal', items: [
    { name: 'Unified Portal', value: 'Bookings, status, invoices, messages per company.', route: '/customer-portal', tier: 'Core', who: 'Customer' },
    { name: 'Public Company Directory', value: 'Cross-company discovery (opt-in).', tier: 'Core', who: 'Customer' },
    { name: 'Portal PWA Install', value: 'Customer-facing installable app.', tier: 'Core', who: 'Customer' },
  ]},
  { area: 'Analytics & Reports', items: [
    { name: 'NLP Analytics', value: 'Ask Aura questions; get charts + actions.', route: '/dashboard/analytics', tier: 'Pro', who: 'Owner / Admin' },
    { name: 'KPI Dashboard', value: 'Per-industry preset KPIs.', tier: 'Pro', who: 'Admin' },
    { name: 'Revenue Analysis', value: 'Trend, mix, drivers.', tier: 'Pro', who: 'Owner' },
    { name: 'Demand Forecast', value: '30/60/90 day projection.', tier: 'Pro', who: 'Owner' },
  ]},
  { area: 'AI Operatives & Hub', items: [
    { name: 'AI Operatives Hub', value: 'Central command for all 10 operatives + specialists.', route: '/dashboard/ai-agents', tier: 'Elite', who: 'Admin' },
    { name: 'Specialist Operatives Console', value: 'Launch industry specialists on demand.', tier: 'All (industry pack)', who: 'Admin' },
    { name: 'Talk to Aura', value: 'Voice-first conversational interface.', route: '/dashboard/talk-to-aura', tier: 'Core', who: 'Admin' },
  ]},
  { area: 'Knowledge, Help & Notifications', items: [
    { name: 'Knowledge Base', value: 'Curated content fed into every operative prompt.', route: '/dashboard/knowledge-base', tier: 'Core', who: 'Admin' },
    { name: 'AI Help Center', value: 'In-product help powered by KB + industry pack.', tier: 'Core', who: 'Anyone' },
    { name: 'Tavily Web Research', value: 'Live web lookups for the AI.', tier: 'Core', who: 'AI', dep: 'Tavily' },
    { name: 'Staff Alerts (4 channels)', value: 'Push, email, SMS, in-app bell.', route: '/dashboard/notifications', tier: 'Core', who: 'Staff' },
  ]},
  { area: 'Integrations', items: [
    { name: 'Voice Integration', value: 'SignalWire setup + number provisioning.', route: '/dashboard/integrations/voice', tier: 'Core', who: 'Admin' },
    { name: 'SMS Integration', value: '10DLC registration + keyword setup.', route: '/dashboard/integrations/sms', tier: 'Core', who: 'Admin' },
    { name: 'Email Integration', value: 'Resend domain verification.', route: '/dashboard/integrations/email', tier: 'Core', who: 'Admin' },
    { name: 'Calendar Integration', value: 'Google OAuth flow.', route: '/dashboard/integrations/calendar', tier: 'Core', who: 'Admin' },
    { name: 'Tavily Integration', value: 'Research key + caps.', route: '/dashboard/integrations/tavily', tier: 'Core', who: 'Admin' },
  ]},
];

// --- Dashboards (detailed) ---
const DASHBOARDS_DETAIL: Array<{
  name: string; who: string; route: string; tier: string;
  widgets: string[]; actions: string[];
}> = [
  { name: 'Aura Command Center', who: 'Owner / GM', route: '/dashboard', tier: 'Core',
    widgets: ['Natural-language Aura prompt (hero)', 'Today\'s priorities', 'Live operative status', 'At-risk items'],
    actions: ['Ask Aura', 'Approve/reject AI actions', 'Jump to console'] },
  { name: 'Company Admin Dashboard (Simple)', who: 'Admin / Manager', route: '/dashboard', tier: 'Core',
    widgets: ['Top 5 KPIs (calls, bookings, leads, revenue, reviews)', 'Quick actions'],
    actions: ['Toggle Pro mode', 'Open any console'] },
  { name: 'Company Admin Dashboard (Pro)', who: 'Admin / Manager', route: '/dashboard', tier: 'Core',
    widgets: ['Full KPI grid', 'Per-operative latest events', 'Subscription progress', 'Setup progress'],
    actions: ['Drill into any KPI', 'Manage operatives'] },
  { name: 'Technician Dashboard (PWA)', who: 'Field staff', route: '/technician', tier: 'Boost',
    widgets: ['Today\'s jobs', 'Route map', 'Voice input FAB', 'Customer history'],
    actions: ['Check in / out', 'Capture photo + notes', 'Send invoice'] },
  { name: 'Customer Portal Home', who: 'End customer', route: '/customer-portal', tier: 'Core',
    widgets: ['Active bookings', 'Live job status', 'Open invoices', 'Message thread'],
    actions: ['Book again', 'Pay invoice', 'Message Aura'] },
  { name: 'Platform Health (Admin)', who: 'Platform admin', route: '/dashboard/platform-health', tier: 'Internal',
    widgets: ['Uptime chips', 'Edge function pulse', 'Tenant counts'],
    actions: ['Restart agent sessions', 'Open logs'] },
  { name: 'Subscription Analytics', who: 'Owner / Admin', route: '/dashboard/subscription-analytics', tier: 'Pro',
    widgets: ['Trial progress bar', 'Plan utilization', 'Upgrade prompts'],
    actions: ['Upgrade plan', 'Manage billing'] },
  { name: 'Analytics Console Suite (8 tabs)', who: 'Owner / Admin', route: '/dashboard/analytics', tier: 'Pro',
    widgets: ['KPI dashboard', 'Revenue', 'Demand forecast', 'Customer insights', 'Business insights', 'Performance', 'New leads', 'Custom NLP query'],
    actions: ['Ask Aura in any tab', 'Schedule email digest'] },
];

// --- Consoles (detailed) ---
const CONSOLES_DETAIL: Array<{
  id: string; name: string; route: string; tier: string; operatives: string[];
  tabs: string[]; purpose: string; kpis: string[];
}> = [
  { id: 'customer_portal', name: 'Customer Portal Console', route: '/dashboard/customer-portal', tier: 'Core',
    operatives: ['triage', 'customer_journey'],
    tabs: ['Inbound', 'Bookings', 'Chat', 'Missed-call recovery'],
    purpose: 'Front-of-house inbox: every channel + booking pipeline in one view.',
    kpis: ['Answer rate', 'Booking conversion', 'Missed-call recovery rate'] },
  { id: 'marketing_sales', name: 'Outreach & Sales Console', route: '/dashboard/marketing-sales', tier: 'Core',
    operatives: ['outreach'],
    tabs: ['Leads', 'Campaigns', 'Pipeline', 'Specialists'],
    purpose: 'Lead capture & scoring, campaign control, pipeline progression.',
    kpis: ['Leads/day', 'Lead → booked %', 'Campaign reply rate'] },
  { id: 'creative_web_presence', name: 'Creative & Web Presence Console', route: '/dashboard/creative-web-presence', tier: 'Core',
    operatives: ['creative_content', 'web_presence'],
    tabs: ['Smart Website', 'Blog', 'Widget', 'Brand assets'],
    purpose: 'Build + maintain web presence + brand-aware content generation.',
    kpis: ['Sessions', 'Blog cadence', 'Chat-to-lead %'] },
  { id: 'social_media', name: 'Social Media Console', route: '/dashboard/social-media', tier: 'Core',
    operatives: ['creative_content'],
    tabs: ['Composer', 'Queue', 'Insights'],
    purpose: 'Multi-platform posting, scheduling, analytics.',
    kpis: ['Posts published', 'Engagement', 'Reach'] },
  { id: 'field_operations', name: 'Field Operations Console', route: '/dashboard/field-operations', tier: 'Boost',
    operatives: ['dispatch', 'field_navigation'],
    tabs: ['Dispatch board', 'Route map', 'Technicians', 'ETA broadcast'],
    purpose: 'Dispatch + route + tech PWA + customer ETA.',
    kpis: ['Time-to-assign', 'On-time arrival', 'Jobs/day per tech'] },
  { id: 'business_management', name: 'Business Management Console', route: '/dashboard/business-management', tier: 'Pro',
    operatives: ['business_finance', 'admin'],
    tabs: ['Quotes', 'Invoices', 'Inventory', 'Payments', 'Employees'],
    purpose: 'Back-office: billing, inventory, payments, employee management.',
    kpis: ['Quote acceptance', 'Days-to-pay', 'Stockouts'] },
  { id: 'analytics_reports', name: 'Analytics & Reports Console', route: '/dashboard/analytics', tier: 'Pro',
    operatives: ['analytics_intelligence'],
    tabs: ['KPI', 'Revenue', 'Demand forecast', 'Customer', 'Business', 'Performance', 'New leads', 'Ask Aura'],
    purpose: 'NLP analytics across the platform; per-industry KPI presets.',
    kpis: ['Revenue trend', 'Forecast accuracy', 'Action-rate from prompts'] },
  { id: 'ai_operatives_hub', name: 'AI Operatives Hub', route: '/dashboard/ai-agents', tier: 'Elite',
    operatives: ['triage','customer_journey','outreach','creative_content','web_presence','dispatch','field_navigation','business_finance','analytics_intelligence','admin'],
    tabs: ['Core operatives', 'Advanced operatives', 'Specialists', 'Live activity'],
    purpose: 'Central command for all 10 operatives + industry specialists.',
    kpis: ['Operative health', 'Action volume', 'Override rate'] },
];

// --- Industry Packs (18) ---
const INDUSTRY_PACKS: Array<{ id: string; cluster: string; tagline: string }> = [
  { id: 'hvac', cluster: 'Trades', tagline: 'Capture more cooling & heating peaks' },
  { id: 'plumbing', cluster: 'Trades', tagline: 'Win more emergency calls before competitors' },
  { id: 'electrical', cluster: 'Trades', tagline: 'Higher-ticket panel & EV opportunities' },
  { id: 'roofing', cluster: 'Trades', tagline: 'Storm-driven leads, organized' },
  { id: 'solar', cluster: 'Trades', tagline: 'Higher-intent solar leads, faster' },
  { id: 'construction', cluster: 'Trades', tagline: 'Bigger pipeline, cleaner bids' },
  { id: 'handyman', cluster: 'Trades', tagline: 'Recurring small-job revenue' },
  { id: 'fencing', cluster: 'Trades', tagline: 'Spring season fence demand' },
  { id: 'security_systems', cluster: 'Trades', tagline: 'Higher monitoring attach rates' },
  { id: 'landscape', cluster: 'Outdoor', tagline: 'More properties per route, more spring sign-ups' },
  { id: 'pest_control', cluster: 'Outdoor', tagline: 'Recurring plans drive predictable revenue' },
  { id: 'pool_spa', cluster: 'Outdoor', tagline: 'Open-and-close season revenue' },
  { id: 'appliance_repair', cluster: 'Repair', tagline: 'Win the repair-vs-replace decision' },
  { id: 'auto_care', cluster: 'Repair', tagline: 'More repeat visits per active vehicle' },
  { id: 'real_estate', cluster: 'Booking', tagline: 'More booked showings and faster offers' },
  { id: 'beauty_wellness', cluster: 'Booking', tagline: 'Fuller chairs, fewer no-shows' },
  { id: 'salon', cluster: 'Booking', tagline: 'Fuller chairs, more rebookings' },
  { id: 'restaurants', cluster: 'Booking', tagline: 'More covers, better reviews' },
  { id: 'fitness', cluster: 'Booking', tagline: 'Fewer cancellations, more retention' },
  { id: 'personal_assistant', cluster: 'Booking', tagline: 'Higher-trust client communications' },
  { id: 'professional', cluster: 'Booking', tagline: 'Higher-trust client communications' },
];

// --- Sales rep toolkit ---
const DISCOVERY_QUESTIONS = [
  'How many calls do you miss in a typical week — and what does each one cost you?',
  'Who answers your phone after hours, on weekends, or during a rush?',
  'How do new leads come in today — and how long before someone follows up?',
  'What\'s your current tool stack (CRM, dispatch, booking, SMS, email)?',
  'How many employees / technicians, and across how many service zones?',
  'Which industry pack fits you best — and do you have niche workflows I should know?',
  'Do you bill / invoice / take payments today — and how?',
  'What\'s the #1 thing that would unlock 20% more revenue right now?',
];

const ELEVATOR_PITCH =
  'Aura Intercept is an AI operations platform that consolidates 24 AI agents into 10 operatives — one for the front desk, one for marketing, one for dispatch, one for billing, and so on. It answers your phone, texts, emails, and chat 24/7, books appointments, dispatches techs, sends invoices, and runs your marketing — all under one platform fee starting at $497/mo (Beta Pricing, was $697). Customers bring their own SignalWire, Stripe, etc., so we never mark up usage. There\'s a 60-day live trial with concierge onboarding in the first 30 days, then 30 days of full live use.';

const DEMO_FLOW = [
  '0:00 — Show Command Center. Ask Aura a natural-language question. Wow.',
  '0:45 — Open Outreach & Sales Console. Show lead → score → drip → booking.',
  '1:30 — Field Operations. Drag a job, watch the customer SMS go live.',
  '2:15 — Business Management. Quote → invoice → Stripe link.',
  '2:45 — AI Operatives Hub (Elite). Show all 10 operatives + specialists.',
  '3:00 — Close: "Pick your tier. We onboard you in 30 days, you run live for 60."',
];

const TIER_FIT = [
  { who: '1–10 employees, no field techs, owner-operator', tier: 'Aura Core ($497/mo)' },
  { who: '10–25 employees, dispatch + field crews, needs routing/ETA', tier: 'Aura Boost ($994/mo)' },
  { who: '25–50 employees, billing + analytics critical', tier: 'Aura Pro ($1,988/mo)' },
  { who: '50+ employees, multi-team, wants AI Operatives Hub + everything', tier: 'Aura Elite ($3,979/mo)' },
];

const OBJECTIONS_EXTRA = [
  { q: '"What if AI says something wrong to my customer?"', a: 'Every operative supports human override and "validate before send" mode. KB-grounded answers + DOMPurify safety + explicit reject/approve UI for high-stakes actions.' },
  { q: '"We already use SignalWire / Stripe / Resend."', a: 'Perfect — we plug into your existing accounts. Aura never resells provider usage; you keep the same vendor relationships and bills.' },
  { q: '"Onboarding fee feels steep."', a: 'It\'s a one-time concierge cost equal to one month — you get a 30-day live setup of voice, SMS, KB, agents, calendars, and integrations. Without it, most teams take 60–90 days to self-serve.' },
  { q: '"Will my staff resist AI?"', a: 'Aura is the receptionist that frees your staff for high-value work. Plain-English labels (Front Desk, Dispatch, Billing) make it feel like a teammate, not a robot.' },
  { q: '"What about multi-location?"', a: 'Aura is single-tenant per company today. Multi-location is on the roadmap; current customers operate one Aura per brand or location.' },
  { q: '"Can I cancel during the trial?"', a: 'Yes. Monthly billing only begins after day 60. The one-time onboarding fee is non-refundable since concierge work is performed in days 1–30.' },
  { q: '"How do you compare to ServiceTitan / Housecall Pro?"', a: 'Those are operations platforms; Aura is an AI layer that *runs* the operations — answering, booking, dispatching, marketing autonomously. Many customers run Aura alongside an existing FSM.' },
];

const EMAIL_TEMPLATES = [
  { name: 'Cold opener', body: 'Subject: 24/7 AI receptionist for {{company}}\n\nHi {{first_name}} — your team likely misses 20–40% of calls outside business hours. Aura Intercept is an AI receptionist + dispatcher + marketer that answers every call, books appointments, and dispatches your techs — for $497/mo. Worth a 15-min look?' },
  { name: 'Demo follow-up', body: 'Subject: Recap + next step\n\nThanks for the time. Pulling together: tier fit ({{tier}}), onboarding timeline (30d), 3rd-party setup list. Reply "go" and we\'ll send the trial signup link.' },
  { name: 'Stalled prospect', body: 'Subject: Quick re-ping\n\nHaven\'t heard back — usually means timing or budget. We have a free AI Opportunity Audit (no card, 10 min) that quantifies missed-call revenue. Worth a look?' },
];

const SMS_TEMPLATES = [
  { name: 'Cold opener', body: 'Hi {{first_name}} — saw {{company}} online. Curious if you\'re losing calls after hours? We have an AI receptionist that answers 24/7 from $497/mo. Worth a quick demo?' },
  { name: 'Demo nudge', body: 'Still on for our {{day}} demo? I\'ll show how Aura would handle your last week of missed calls. — {{rep}}' },
  { name: 'Trial activation', body: 'Trial link: auraintercept.ai/auth — 60 days, concierge setup in the first 30. Reply if you need help.' },
];

const TALKING_POINTS = [
  { q: '"Why not just hire a receptionist?"', a: 'A receptionist works ~40 hrs/week; AI Receptionist works 168 — across voice, SMS, email, and chat — and never misses a call. Concierge Onboarding sets it up for you in the first 30 days.' },
  { q: '"What about my existing tools?"', a: 'Aura plugs into Google Calendar, Stripe, your social accounts, and your phone provider. We replace the glue — not the tools you already love.' },
  { q: '"How fast can we go live?"', a: '30-day concierge onboarding configures voice, SMS, KB, agents, calendars, and integrations. The next 30 days are full live operation under the trial.' },
  { q: '"Is my data safe?"', a: 'RLS-protected database, security-definer RPCs for any public read, encrypted secrets, scoped third-party tokens. We never resell or pool customer data.' },
  { q: '"What if I outgrow my tier?"', a: 'Upgrade in one click. Operatives, consoles, and employee caps adjust live — no data migration.' },
];

const today = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });

const TIERS: Array<{ key: keyof typeof TIER_AGENT_CONFIG; onboarding: string; employees: string }> = [
  { key: 'starter', onboarding: '$497 one-time', employees: '10 employees' },
  { key: 'connect', onboarding: '$497 one-time', employees: '25 employees' },
  { key: 'performance', onboarding: '$497 one-time', employees: '50 employees' },
  { key: 'command', onboarding: '$497 one-time', employees: 'Unlimited employees' },
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
      <Text style={s.coverMeta}>Version 2.0 · {today}</Text>
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
          60-Day Live Trial · The first 30 days are dedicated concierge onboarding
          (account config, agent tuning, KB, 3rd-party activation, training). The
          remaining 30 days are full live operation. Onboarding fee is due at trial start.
        </Text>
      </View>
      <AutoFooter />
    </Page>

    {/* Pricing & Tiers */}
    <Page size="LETTER" style={s.page}>
      <Text style={s.h1}>Pricing &amp; Tiers</Text>
      <Text style={s.dim}>Operatives and consoles included per tier.</Text>
      <View style={s.divider} />
      {TIERS.map(t => {
        const cfg = TIER_AGENT_CONFIG[t.key];
        return (
          <View key={t.key} style={s.card} wrap={false}>
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
      <AutoFooter />
    </Page>

    {/* Operatives — one detailed profile per page */}
    {OPERATIVES.map((op, i) => (
      <Page key={`op-${op.id}`} size="LETTER" style={s.page}>
        <Text style={s.h1}>{op.name}</Text>
        <Text style={s.dim}>Operative {i + 1} of 10  ·  Customer-facing: "{op.customerLabel}"  ·  Min tier: {op.minTier}</Text>
        <View style={s.divider} />
        <View style={s.card}>
          <Text style={s.p}>{op.oneLiner}</Text>
        </View>

        <Text style={s.h2}>Key capabilities</Text>
        {op.capabilities.map((cap, k) => <Bullet key={k}>{cap}</Bullet>)}

        <Text style={s.h2}>Channels</Text>
        <View style={s.rowWrap}>
          {op.channels.map((ch, k) => <Text key={k} style={s.pillPrimary}>{ch}</Text>)}
        </View>

        <Text style={s.h2}>Underlying agents</Text>
        <View style={s.rowWrap}>
          {op.underlyingAgents.map((a, k) => <Text key={k} style={s.pill}>{a}</Text>)}
        </View>

        <Text style={s.h2}>Triggers &amp; handoffs</Text>
        <Text style={s.p}>{op.handoffs}</Text>

        <Text style={s.h2}>KPIs it moves</Text>
        <View style={s.rowWrap}>
          {op.kpis.map((k2, k) => <Text key={k} style={s.pill}>{k2}</Text>)}
        </View>

        <Text style={s.h2}>3rd-party dependencies</Text>
        <View style={s.rowWrap}>
          {op.thirdParty.map((tp, k) => <Text key={k} style={s.pill}>{tp}</Text>)}
        </View>

        <Text style={s.h2}>Sample interaction</Text>
        <View style={s.cardAlt}>
          {op.sampleTranscript.map((line, k) => (
            <Text key={k} style={s.p}><Text style={{ color: c.primary }}>{line.from}: </Text>{line.line}</Text>
          ))}
        </View>

        <Text style={s.h2}>Sample use cases</Text>
        <View style={s.rowWrap}>
          {op.useCases.map((u, k) => <Text key={k} style={s.pill}>{u}</Text>)}
        </View>
        <AutoFooter />
      </Page>
    ))}

    {/* Industry Specialists - expanded */}
    <Page size="LETTER" style={s.page}>
      <Text style={s.h1}>Industry Specialists</Text>
      <Text style={s.dim}>Auto-activated by industry pack on every plan.</Text>
      <View style={s.divider} />
      <View style={s.card}>
        <Text style={s.p}>
          Aura ships with 22 industry packs across 4 clusters (Trades, Outdoor,
          Repair, Booking). Selecting an industry at signup activates that pack's
          terminology, quote/invoice templates, KPI presets, marketing playbooks, and
          specialist operatives — without changing tier or pricing. 14 specialists
          ship today.
        </Text>
      </View>
      <Text style={s.h2}>All 14 specialists</Text>
      <View style={s.tableHead}>
        <Text style={[s.th, { width: '22%' }]}>Specialist</Text>
        <Text style={[s.th, { width: '38%' }]}>What it does</Text>
        <Text style={[s.th, { width: '40%' }]}>Auto-activates for</Text>
      </View>
      {SPECIALISTS.map(sp => (
        <View key={sp.name} style={s.tableRow}>
          <Text style={[s.td, { width: '22%' }]}>{sp.name}</Text>
          <Text style={[s.td, { width: '38%' }]}>{sp.what}</Text>
          <Text style={[s.td, { width: '40%' }]}>{sp.industries}</Text>
        </View>
      ))}
      <Text style={s.h2}>What changes per industry pack</Text>
      <Bullet>Operative system prompts (industry prompt injection)</Bullet>
      <Bullet>Quote/invoice line-item templates + terminology</Bullet>
      <Bullet>KPI labels and analytics presets</Bullet>
      <Bullet>Empty-state copy + quick actions</Bullet>
      <Bullet>Voice greeting + marketing playbook</Bullet>
      <AutoFooter />
    </Page>

    {/* Specialist sample outputs */}
    <Page size="LETTER" style={s.page}>
      <Text style={s.h1}>Specialist Sample Outputs</Text>
      <Text style={s.dim}>What each specialist actually returns.</Text>
      <View style={s.divider} />
      {SPECIALISTS.map(sp => (
        <View key={sp.name} style={s.cardAlt} wrap={false}>
          <Text style={s.h3}>{sp.name}</Text>
          <Text style={s.p}>{sp.sample}</Text>
        </View>
      ))}
      <AutoFooter />
    </Page>

    {/* Platform Features — detailed per-feature */}
    {FEATURES_DETAIL.map(group => (
      <Page key={`feat-${group.area}`} size="LETTER" style={s.page}>
        <Text style={s.h1}>{group.area}</Text>
        <Text style={s.dim}>Feature detail — value, route, tier, audience, dependencies.</Text>
        <View style={s.divider} />
        {group.items.map(it => (
          <View key={it.name} style={s.card} wrap={false}>
            <Text style={s.h3}>{it.name}</Text>
            <Text style={s.p}>{it.value}</Text>
            <View style={s.rowWrap}>
              <Text style={s.pillPrimary}>Tier: {it.tier}</Text>
              <Text style={s.pill}>Who: {it.who}</Text>
              {it.route && <Text style={s.pill}>Route: {it.route}</Text>}
              {it.dep && <Text style={s.pill}>Needs: {it.dep}</Text>}
            </View>
          </View>
        ))}
        <AutoFooter />
      </Page>
    ))}

    {/* Feature catalog (legacy quick view) */}
    <Page size="LETTER" style={s.page}>
      <Text style={s.h1}>Feature Catalog (Quick View)</Text>
      <Text style={s.dim}>One-glance grouped capability list.</Text>
      <View style={s.divider} />
      {FEATURE_GROUPS.map(g => (
        <View key={g.group} style={s.cardAlt}>
          <Text style={s.h3}>{g.group}</Text>
          <View style={s.rowWrap}>
            {g.items.map((it, i) => <Text key={i} style={s.pill}>{it}</Text>)}
          </View>
        </View>
      ))}
      <AutoFooter />
    </Page>

    {/* Dashboards — overview */}
    <Page size="LETTER" style={s.page}>
      <Text style={s.h1}>Dashboards</Text>
      <Text style={s.dim}>Overview of every dashboard surface.</Text>
      <View style={s.divider} />
      <View style={s.tableHead}>
        <Text style={[s.th, { width: '32%' }]}>Dashboard</Text>
        <Text style={[s.th, { width: '20%' }]}>Audience</Text>
        <Text style={[s.th, { width: '28%' }]}>Route</Text>
        <Text style={[s.th, { width: '20%' }]}>Tier</Text>
      </View>
      {DASHBOARDS_DETAIL.map(d => (
        <View key={d.name} style={s.tableRow}>
          <Text style={[s.td, { width: '32%' }]}>{d.name}</Text>
          <Text style={[s.td, { width: '20%' }]}>{d.who}</Text>
          <Text style={[s.td, { width: '28%' }]}>{d.route}</Text>
          <Text style={[s.td, { width: '20%' }]}>{d.tier}</Text>
        </View>
      ))}
      <View style={s.callout}>
        <Text style={s.p}>
          Aura Command Center prioritizes natural language over static metrics —
          owners ask Aura ("What's slipping this week?") and get a prioritized action
          list rather than a chart wall.
        </Text>
      </View>
      <AutoFooter />
    </Page>

    {/* Per-dashboard detail */}
    {DASHBOARDS_DETAIL.map(d => (
      <Page key={`dash-${d.name}`} size="LETTER" style={s.page}>
        <Text style={s.h1}>{d.name}</Text>
        <Text style={s.dim}>{d.who}  ·  {d.route}  ·  Tier: {d.tier}</Text>
        <View style={s.divider} />
        <Text style={s.h2}>Widgets</Text>
        {d.widgets.map((w, i) => <Bullet key={i}>{w}</Bullet>)}
        <Text style={s.h2}>Primary actions</Text>
        {d.actions.map((a, i) => <Bullet key={i}>{a}</Bullet>)}
        <AutoFooter />
      </Page>
    ))}

    {/* Consoles & Hubs — overview */}
    <Page size="LETTER" style={s.page}>
      <Text style={s.h1}>Consoles &amp; Hubs</Text>
      <Text style={s.dim}>7 consoles plus the AI Operatives Hub (Elite).</Text>
      <View style={s.divider} />
      {CONSOLES_DETAIL.map(co => (
        <View key={co.id} style={s.card} wrap={false}>
          <Text style={s.h3}>{co.name}  ·  <Text style={{ color: c.primary }}>{co.tier}</Text></Text>
          <Text style={s.dim}>{co.route}</Text>
          <Text style={s.p}>{co.purpose}</Text>
        </View>
      ))}
      <AutoFooter />
    </Page>

    {/* Per-console detail */}
    {CONSOLES_DETAIL.map(co => (
      <Page key={`con-${co.id}`} size="LETTER" style={s.page}>
        <Text style={s.h1}>{co.name}</Text>
        <Text style={s.dim}>{co.route}  ·  Min tier: {co.tier}</Text>
        <View style={s.divider} />
        <View style={s.card}>
          <Text style={s.p}>{co.purpose}</Text>
        </View>
        <Text style={s.h2}>Tabs / sub-views</Text>
        <View style={s.rowWrap}>
          {co.tabs.map((t, i) => <Text key={i} style={s.pillPrimary}>{t}</Text>)}
        </View>
        <Text style={s.h2}>Operatives surfaced</Text>
        <View style={s.rowWrap}>
          {co.operatives.map(op => <Text key={op} style={s.pill}>{opName(op)}</Text>)}
        </View>
        <Text style={s.h2}>Headline KPIs</Text>
        {co.kpis.map((k, i) => <Bullet key={i}>{k}</Bullet>)}
        <AutoFooter />
      </Page>
    ))}

    {/* Industry Packs Appendix */}
    <Page size="LETTER" style={s.page}>
      <Text style={s.h1}>Industry Packs Appendix</Text>
      <Text style={s.dim}>Every shipping pack and its marketing tagline.</Text>
      <View style={s.divider} />
      <View style={s.tableHead}>
        <Text style={[s.th, { width: '28%' }]}>Pack</Text>
        <Text style={[s.th, { width: '18%' }]}>Cluster</Text>
        <Text style={[s.th, { width: '54%' }]}>Marketing tagline</Text>
      </View>
      {INDUSTRY_PACKS.map(p => (
        <View key={p.id} style={s.tableRow}>
          <Text style={[s.td, { width: '28%' }]}>{p.id}</Text>
          <Text style={[s.td, { width: '18%' }]}>{p.cluster}</Text>
          <Text style={[s.td, { width: '54%' }]}>{p.tagline}</Text>
        </View>
      ))}
      <AutoFooter />
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
      <AutoFooter />
    </Page>

    {/* Sales Rep Toolkit — pitch */}
    <Page size="LETTER" style={s.page}>
      <Text style={s.h1}>Sales Rep Toolkit</Text>
      <Text style={s.dim}>Pitch, discovery, demo flow, and tier-fit guide.</Text>
      <View style={s.divider} />
      <Text style={s.h2}>60-second elevator pitch</Text>
      <View style={s.cardAlt}><Text style={s.p}>{ELEVATOR_PITCH}</Text></View>

      <Text style={s.h2}>Discovery questions</Text>
      {DISCOVERY_QUESTIONS.map((q, i) => <Bullet key={i}>{q}</Bullet>)}

      <Text style={s.h2}>3-minute demo flow</Text>
      {DEMO_FLOW.map((d, i) => <Bullet key={i}>{d}</Bullet>)}

      <Text style={s.h2}>Tier-fit decision guide</Text>
      <View style={s.tableHead}>
        <Text style={[s.th, { width: '60%' }]}>Profile</Text>
        <Text style={[s.th, { width: '40%' }]}>Recommended tier</Text>
      </View>
      {TIER_FIT.map(t => (
        <View key={t.tier} style={s.tableRow}>
          <Text style={[s.td, { width: '60%' }]}>{t.who}</Text>
          <Text style={[s.td, { width: '40%' }]}>{t.tier}</Text>
        </View>
      ))}
      <AutoFooter />
    </Page>

    {/* Outreach templates */}
    <Page size="LETTER" style={s.page}>
      <Text style={s.h1}>Outreach Templates</Text>
      <Text style={s.dim}>Drop-in email and SMS templates.</Text>
      <View style={s.divider} />
      <Text style={s.h2}>Email</Text>
      {EMAIL_TEMPLATES.map(t => (
        <View key={t.name} style={s.card} wrap={false}>
          <Text style={s.h3}>{t.name}</Text>
          <Text style={s.p}>{t.body}</Text>
        </View>
      ))}
      <Text style={s.h2}>SMS</Text>
      {SMS_TEMPLATES.map(t => (
        <View key={t.name} style={s.cardAlt} wrap={false}>
          <Text style={s.h3}>{t.name}</Text>
          <Text style={s.p}>{t.body}</Text>
        </View>
      ))}
      <AutoFooter />
    </Page>

    {/* Trial & Onboarding + Talking Points */}
    <Page size="LETTER" style={s.page}>
      <Text style={s.h1}>Trial, Onboarding &amp; Sales Talking Points</Text>
      <View style={s.divider} />
      <Text style={s.h2}>60-Day Live Trial structure</Text>
      <Bullet>Days 1–30: Concierge onboarding — account config, agent tuning, KB build, 3rd-party activation, team training.</Bullet>
      <Bullet>Days 31–90: Full live operation — every operative live across the customer's actual channels.</Bullet>
      <Bullet>Onboarding fee due at trial start. Monthly billing begins after the trial.</Bullet>
      <Bullet>No credit card required to start the trial signup; required to activate 3rd-party providers.</Bullet>

      <Text style={s.h2}>Talking points / objection handling</Text>
      {TALKING_POINTS.map((t, i) => (
        <View key={i} style={s.cardAlt} wrap={false}>
          <Text style={s.h3}>{t.q}</Text>
          <Text style={s.p}>{t.a}</Text>
        </View>
      ))}
      {OBJECTIONS_EXTRA.map((t, i) => (
        <View key={`x-${i}`} style={s.cardAlt} wrap={false}>
          <Text style={s.h3}>{t.q}</Text>
          <Text style={s.p}>{t.a}</Text>
        </View>
      ))}
      <AutoFooter />
    </Page>

    {/* Compliance & legal one-pager */}
    <Page size="LETTER" style={s.page}>
      <Text style={s.h1}>Compliance &amp; Legal Summary</Text>
      <View style={s.divider} />
      <Text style={s.h2}>3rd-party billing disclosure</Text>
      <View style={s.card}><Text style={s.p}>
        Every 3rd-party provider (SignalWire, ElevenLabs, Resend, Tavily, Stripe,
        A2P 10DLC carriers, social platforms) requires the customer's own account
        and a valid credit card on file. Each provider invoices the customer
        directly and separately from the Aura plan fee. Aura Intercept does not
        resell, mark up, or mark up 3rd-party usage.
      </Text></View>
      <Text style={s.h2}>A2P 10DLC (US SMS)</Text>
      <View style={s.card}><Text style={s.p}>
        US business SMS requires brand + campaign registration with The Campaign
        Registry via the carrier/aggregator. Customer pays one-time + monthly
        registry fees directly. Aura assists with submission during concierge
        onboarding.
      </Text></View>
      <Text style={s.h2}>Trial terms</Text>
      <Bullet>60-Day Live Trial — 30-day concierge onboarding + 30-day full live operation.</Bullet>
      <Bullet>Onboarding fee (equal to one month of the chosen tier) is due at trial start and is non-refundable.</Bullet>
      <Bullet>Monthly subscription billing begins on day 91.</Bullet>
      <Bullet>Cancel any time during the trial; only the onboarding fee applies.</Bullet>
      <Text style={s.h2}>Data &amp; security</Text>
      <Bullet>RLS-protected database; SECURITY DEFINER RPCs for any public read.</Bullet>
      <Bullet>Customer secrets stored in encrypted vault; never logged.</Bullet>
      <Bullet>DOMPurify sanitization on all rendered AI output.</Bullet>
      <Bullet>No data resold or pooled across tenants.</Bullet>
      <AutoFooter />
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
        <Text style={s.h3}>Start the 60-Day Live Trial</Text>
        <Text style={s.p}>auraintercept.ai/auth</Text>
      </View>
      <View style={s.card}>
        <Text style={s.h3}>Run a free AI Opportunity Audit</Text>
        <Text style={s.p}>auraintercept.ai/audit</Text>
      </View>
      <View style={s.callout}>
        <Text style={s.p}>Aura Intercept · auraintercept.ai · Generated {today}</Text>
      </View>
      <AutoFooter />
    </Page>
  </Document>
);

export default MarketingSalesMasterPDF;