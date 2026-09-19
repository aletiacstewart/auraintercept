import {
  Calendar,
  CreditCard,
  Database,
  Mail,
  Mic,
  Phone,
  Share2,
  type LucideIcon,
} from 'lucide-react';
import type { IntegrationKey } from '@/lib/industryConfig';

export type IntegrationCategory = 'essential' | 'recommended' | 'optional';
export type IntegrationSetupKind = 'credentials' | 'calendar' | 'social' | 'crm';

export interface IntegrationFieldDef {
  key: string;
  label: string;
  placeholder?: string;
  type: 'text' | 'password';
  required?: boolean;
  helpText?: string;
}

export interface IntegrationDef {
  id: string;
  name: string;
  description: string;
  icon: LucideIcon;
  color: string;
  /** Which quick-start connection keys this card satisfies. */
  packKeys: IntegrationKey[];
  category: IntegrationCategory;
  setupKind: IntegrationSetupKind;
  fields: IntegrationFieldDef[];
  /** Columns on `tenant_integrations_safe` that prove a live connection. */
  connectedFlags?: string[];
  docsUrl?: string;
  estimatedTime: string;
  pricingNote?: string;
  requiredFor: string;
}

export const INTEGRATIONS: IntegrationDef[] = [
  {
    id: 'google_calendar',
    name: 'Calendar',
    description: 'Two-way sync so every booking lands in the calendar you already use.',
    icon: Calendar,
    color: 'bg-green-500',
    packKeys: ['calendar'],
    category: 'essential',
    setupKind: 'calendar',
    fields: [],
    estimatedTime: '3 min',
    requiredFor: 'Booking, reminders and dispatch',
  },
  {
    id: 'signalwire',
    name: 'Calls & Texts',
    description: 'Your business number for the AI receptionist, reminders and two-way texting.',
    icon: Phone,
    color: 'bg-red-500',
    packKeys: ['sms', 'voice'],
    category: 'essential',
    setupKind: 'credentials',
    fields: [
      { key: 'signalwire_project_id', label: 'Project ID', placeholder: 'Project ID', type: 'text', required: true },
      { key: 'signalwire_api_token', label: 'API Token', placeholder: 'PT...', type: 'password', required: true },
      { key: 'signalwire_space_url', label: 'Space URL', placeholder: 'yourspace.signalwire.com', type: 'text', required: true },
      { key: 'signalwire_phone_number', label: 'Phone Number', placeholder: '+15551234567', type: 'text', required: true, helpText: 'Use E.164 format' },
    ],
    connectedFlags: ['has_signalwire'],
    docsUrl: 'https://signalwire.com',
    estimatedTime: '10 min',
    pricingNote: 'Your own SignalWire account and card · billed directly by SignalWire, separate from your Aura plan.',
    requiredFor: 'AI receptionist, reminders, missed-call follow-up',
  },
  {
    id: 'resend',
    name: 'Email',
    description: 'Confirmations, reminders, quotes and invoices sent from your own domain.',
    icon: Mail,
    color: 'bg-emerald-500',
    packKeys: ['email'],
    category: 'essential',
    setupKind: 'credentials',
    fields: [
      { key: 'resend_api_key', label: 'API Key', placeholder: 're_...', type: 'password', required: true, helpText: 'Get from resend.com/api-keys' },
    ],
    connectedFlags: ['has_resend'],
    docsUrl: 'https://resend.com/api-keys',
    estimatedTime: '5 min',
    pricingNote: 'Your own Resend account and card · billed directly by Resend, separate from your Aura plan.',
    requiredFor: 'Customer emails and reminders',
  },
  {
    id: 'elevenlabs',
    name: 'AI Voice',
    description: 'The natural-sounding voice your customers hear when Aura answers.',
    icon: Mic,
    color: 'bg-blue-500',
    packKeys: ['voice'],
    category: 'optional',
    setupKind: 'credentials',
    fields: [
      { key: 'elevenlabs_api_key', label: 'API Key', placeholder: 'sk_...', type: 'password', required: true, helpText: 'Get from elevenlabs.io · must start with sk_' },
      { key: 'elevenlabs_agent_id', label: 'Agent ID', placeholder: 'agent_...', type: 'text' },
    ],
    connectedFlags: ['has_elevenlabs'],
    docsUrl: 'https://elevenlabs.io',
    estimatedTime: '10 min',
    pricingNote: 'Your own ElevenLabs account and card · billed directly by ElevenLabs, separate from your Aura plan.',
    requiredFor: 'Spoken AI receptionist',
  },
  {
    id: 'stripe',
    name: 'Payments',
    description: 'Take card payments on quotes and invoices.',
    icon: CreditCard,
    color: 'bg-purple-500',
    packKeys: ['payments'],
    category: 'optional',
    setupKind: 'credentials',
    fields: [
      { key: 'stripe_publishable_key', label: 'Publishable Key', placeholder: 'pk_live_...', type: 'text', required: true },
      { key: 'stripe_secret_key', label: 'Secret Key', placeholder: 'sk_live_...', type: 'password', required: true },
    ],
    connectedFlags: ['has_stripe'],
    docsUrl: 'https://dashboard.stripe.com/apikeys',
    estimatedTime: '10 min',
    pricingNote: 'Your own Stripe account · Stripe charges its own processing fees directly.',
    requiredFor: 'Getting paid online',
  },
  {
    id: 'upload_post',
    name: 'Social Posting',
    description: 'Automatic, scheduled posting to your connected social platforms.',
    icon: Share2,
    color: 'bg-pink-500',
    packKeys: ['social'],
    category: 'optional',
    setupKind: 'social',
    fields: [],
    docsUrl: 'https://upload-post.com',
    estimatedTime: '10 min',
    pricingNote:
      'Copy & Post is included on every plan with no setup. Automation uses your own Upload-Post account and card, billed directly by Upload-Post (~$9–$99/mo, up to 6 platforms per social set).',
    requiredFor: 'Hands-off social posting',
  },
  {
    id: 'crm',
    name: 'Lead Capture & Scoring',
    description: 'Push new leads and jobs into the CRM your team already uses.',
    icon: Database,
    color: 'bg-indigo-500',
    packKeys: ['crm'],
    category: 'optional',
    setupKind: 'crm',
    fields: [],
    estimatedTime: '10 min',
    requiredFor: 'Keeping an outside CRM in sync',
  },
];

/**
 * Resolves the display category: anything the company's industry quick-start
 * asks for is promoted to "Recommended" unless it is already essential.
 */
export function resolveCategory(
  integration: IntegrationDef,
  requiredIntegrations: IntegrationKey[],
): IntegrationCategory {
  if (integration.category === 'essential') return 'essential';
  const wanted = integration.packKeys.some((k) => requiredIntegrations.includes(k));
  return wanted ? 'recommended' : 'optional';
}

export const CATEGORY_LABELS: Record<IntegrationCategory, { title: string; description: string }> = {
  essential: { title: 'Essential', description: 'Aura needs these to answer, book and confirm work.' },
  recommended: { title: 'Recommended for your industry', description: 'Common for businesses like yours.' },
  optional: { title: 'Optional', description: 'Add these whenever you need them.' },
};
