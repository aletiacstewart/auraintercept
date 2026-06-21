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
    description: 'Real jobs, leads, customers, and analytics — everything you enter (or that your concierge specialist enters during onboarding) is live in your company.',
  },
  {
    id: 'aura_chat',
    feature: 'Message Aura (text chat)',
    status: 'live',
    description: 'Aura answers using your real company knowledge base and books real appointments into your calendar.',
  },
  {
    id: 'image_gen',
    feature: 'AI image generation (social posts, content)',
    status: 'live',
    description: 'Real AI-generated images saved to your company\'s content library, ready to publish from the Content Engine.',
  },
  {
    id: 'voice_inbound',
    feature: 'Inbound voice calls / Talk to Aura',
    status: 'live',
    description: 'Real inbound calls hit your SignalWire number, Aura answers via your ElevenLabs voice, and every call logs to your dashboard.',
    requires: 'Your own SignalWire phone number + ElevenLabs voice agent (billed separately by each provider).',
  },
  {
    id: 'sms_outbound',
    feature: 'Outbound SMS & SMS auto-responder',
    status: 'live',
    description: 'Real SMS sends through your A2P-registered SignalWire number — auto-responders, follow-ups, and broadcasts go to real customers.',
    requires: 'Your own SignalWire 10DLC-registered number (A2P registration + carrier fees billed by SignalWire to your card).',
  },
  {
    id: 'email',
    feature: 'Outbound email (notifications, campaigns)',
    status: 'live',
    description: 'Real email delivery through your Resend account and verified sending domain.',
    requires: 'Your own Resend account + verified sending domain (email volume billed by Resend to your card).',
  },
  {
    id: 'gcal',
    feature: 'Google Calendar two-way sync',
    status: 'live',
    description: 'Two-way sync with the Google Calendar you connect — events created in Aura appear on your calendar and vice-versa.',
    requires: 'Google Calendar OAuth connection.',
  },
  {
    id: 'stripe',
    feature: 'Stripe billing & invoice payments',
    status: 'live',
    description: 'Real Stripe checkout against your connected products and prices — invoices and subscriptions charge live.',
    requires: 'Live Stripe account + connected products/prices.',
  },
  {
    id: 'social',
    feature: 'Social media auto-publishing',
    status: 'live',
    description: 'Posts publish live to the Meta / LinkedIn / TikTok / Google Business profiles you connect from the Content Engine.',
    requires: 'Meta / LinkedIn / TikTok / Google Business OAuth connections.',
  },
];

export const DEMO_FEATURE_DISCLAIMER =
  'Your 60-Day Live Demo runs entirely on live data — either entered by you in-app or set up on your behalf by a concierge specialist during onboarding. Aura connects to 3rd-party providers (SignalWire, ElevenLabs, Resend, Stripe, Google, Meta/LinkedIn/TikTok) using your own accounts; usage on those providers is billed by them directly to your card.';