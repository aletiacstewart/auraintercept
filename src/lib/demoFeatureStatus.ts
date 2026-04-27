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
    status: 'live',
    description: 'Fully functional. Every action writes to your isolated demo company in real time.',
  },
  {
    id: 'aura_chat',
    feature: 'Message Aura (text chat)',
    status: 'live',
    description: 'Real AI conversations powered by the Lovable AI gateway. Try booking a job from the customer portal.',
  },
  {
    id: 'image_gen',
    feature: 'AI image generation (social posts, content)',
    status: 'live',
    description: 'Real image generation via google/gemini-2.5-flash-image.',
  },
  {
    id: 'voice_inbound',
    feature: 'Inbound voice calls / Talk to Aura',
    status: 'mock',
    description: 'Demo plays a sample call transcript and inserts a simulated call log so you can see how it surfaces in the dashboard.',
    requires: 'SignalWire phone number + ElevenLabs voice agent (3rd-party fees apply).',
  },
  {
    id: 'sms_outbound',
    feature: 'Outbound SMS & SMS auto-responder',
    status: 'mock',
    description: 'Demo sends are logged in-app with a "Demo" badge — nothing is delivered to real carriers.',
    requires: 'SignalWire 10DLC-registered number (3rd-party carrier fees apply).',
  },
  {
    id: 'email',
    feature: 'Outbound email (notifications, campaigns)',
    status: 'mock',
    description: 'Demo emails are recorded in the in-app log. Real sends require Resend.',
    requires: 'Resend API key + verified sending domain.',
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
  'Third-party services (SignalWire, ElevenLabs, Resend, Stripe, Google, social platforms) are billed separately by their providers. Aura Intercept does not mark up these fees.';