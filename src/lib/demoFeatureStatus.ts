export type DemoFeatureStatus = 'live' | 'mock';

export interface DemoFeatureRow {
  id: string;
  feature: string;
  status: DemoFeatureStatus;
  description: string;
  /** What's needed in production to make this real */
  requires?: string;
}

export const DEMO_FEATURE_STATUS: DemoFeatureRow[] = [
  {
    id: 'dashboard',
    feature: 'Owner dashboard, jobs, leads, customers, analytics',
    status: 'mock',
    description: 'Pre-seeded mock data in an isolated demo company. Every action writes to demo records only — no real customer data.',
  },
  {
    id: 'aura_chat',
    feature: 'Message Aura (text chat)',
    status: 'mock',
    description: 'AI replies run against mock demo data only. Bookings and customers created during the demo are simulated, not real.',
  },
  {
    id: 'image_gen',
    feature: 'AI image generation (social posts, content)',
    status: 'mock',
    description: 'Images generate in the demo environment for preview only — not published anywhere live.',
  },
  {
    id: 'voice_inbound',
    feature: 'Inbound voice calls / Talk to Aura',
    status: 'mock',
    description: 'Demo plays a sample call transcript and inserts a simulated call log so you can see how it surfaces in the dashboard.',
    requires: 'Your own SignalWire phone number + ElevenLabs voice agent (billed separately by each provider).',
  },
  {
    id: 'sms_outbound',
    feature: 'Outbound SMS & SMS auto-responder',
    status: 'mock',
    description: 'Demo sends are logged in-app with a "Demo" badge — nothing is delivered to real carriers.',
    requires: 'Your own SignalWire 10DLC-registered number (A2P registration + carrier fees billed by SignalWire to your card).',
  },
  {
    id: 'email',
    feature: 'Outbound email (notifications, campaigns)',
    status: 'mock',
    description: 'Demo emails are recorded in the in-app log. Real sends require a verified sending domain.',
    requires: 'Your own Resend account + verified sending domain (email volume billed by Resend to your card).',
  },
  {
    id: 'gcal',
    feature: 'Google Calendar two-way sync',
    status: 'mock',
    description: 'Demo seeds events tagged as "synced" so the calendar UI looks populated.',
    requires: 'Google Calendar OAuth connection.',
  },
  {
    id: 'stripe',
    feature: 'Stripe billing & invoice payments',
    status: 'mock',
    description: 'Checkout opens a "this would launch Stripe" preview. No card is charged in demo.',
    requires: 'Live Stripe account + connected products/prices.',
  },
  {
    id: 'social',
    feature: 'Social media auto-publishing',
    status: 'mock',
    description: 'Generated posts save as drafts in the Content Engine — nothing is posted to live profiles.',
    requires: 'Meta / LinkedIn / TikTok / Google Business OAuth connections.',
  },
];

export const DEMO_FEATURE_DISCLAIMER =
  'Every demo runs entirely on mock data in an isolated demo company — no real customers, calls, texts, emails, or charges. Third-party services (SignalWire, ElevenLabs, Resend, Stripe, Google, social platforms) only activate after signup with your own accounts and are billed separately by each provider.';