/**
 * Centralized tooltip definitions for Aura platform features
 * Ensures consistent naming and descriptions across all components
 */

export const FEATURE_TOOLTIPS = {
  // Customer-facing communication features
  messageAura: {
    label: 'Message Aura (Text)',
    tooltip: 'Text-based chat where customers type questions and receive text responses. Works on ALL tiers with no external integrations needed.',
    shortDescription: 'Text chat for customer inquiries',
  },
  talkToAura: {
    label: 'Talk to Aura (Voice)',
    tooltip: 'Speech-based conversations using microphone and speakers. Customers speak naturally and hear AI voice responses. Requires ElevenLabs (voice synthesis) and SignalWire (telephony).',
    shortDescription: 'Voice conversations with AI assistant',
  },
  
  // Internal staff features
  askAura: {
    label: 'Ask Aura',
    tooltip: 'Internal voice navigation for staff. Use voice commands to navigate the dashboard hands-free. Only available within the staff dashboard.',
    shortDescription: 'Hands-free voice navigation for staff',
  },
  
  // Communication channels
  smsReminders: {
    label: 'SMS Reminders',
    tooltip: 'Automated text message reminders for appointments, follow-ups, and campaigns. Requires SignalWire integration.',
    shortDescription: 'Automated text message notifications',
  },
  emailReminders: {
    label: 'Email Reminders',
    tooltip: 'Automated email notifications for appointments, confirmations, and marketing campaigns. No external integration required.',
    shortDescription: 'Automated email notifications',
  },
  voiceReminders: {
    label: 'Voice Reminders',
    tooltip: 'Automated outbound phone calls for appointment reminders and follow-ups. Requires ElevenLabs + SignalWire integration.',
    shortDescription: 'Automated phone call reminders',
  },
  
  // Console tooltips
  consoles: {
    customerPortal: {
      label: 'Customer Portal Console',
      tooltip: 'Customer-facing hub for appointments, quotes, tracking, billing, and AI chat. Accessible via widget or dedicated portal page.',
    },
    fieldOperations: {
      label: 'Field Operations Console',
      tooltip: 'Mobile-optimized console for field technicians. Manage jobs, navigation, status updates, and on-site invoicing.',
    },
    businessOperations: {
      label: 'Business Operations Console',
      tooltip: 'Central hub for quotes, invoices, leads, appointments, inventory, and employee management.',
    },
    marketingSales: {
      label: 'Outreach & Sales Console',
      tooltip: 'Marketing automation with campaigns, promo codes, customer segments, referrals, and win-back programs.',
    },
    socialMedia: {
      label: 'Social Media Console',
      tooltip: 'AI-powered content creation for 6 platforms: Instagram, Facebook, LinkedIn, TikTok, Google My Business, and SMS.',
    },
    analyticsReports: {
      label: 'Analytics & Reports Console',
      tooltip: 'Business intelligence with performance metrics, revenue analysis, forecasting, and multi-format exports.',
    },
  },
  
  // Agent tooltips
  agents: {
    receptionist: {
      label: 'AI Receptionist',
      tooltip: 'Handles initial customer contact, routes inquiries, and provides business information 24/7.',
    },
    scheduling: {
      label: 'Booking Agent',
      tooltip: 'Manages online appointment booking with smart time slot suggestions and conflict detection.',
    },
    followup: {
      label: 'Follow-up Agent',
      tooltip: 'Sends automated reminders via SMS, email, and voice. Handles confirmation sequences.',
    },
    review: {
      label: 'Review Agent',
      tooltip: 'Collects customer feedback and directs satisfied customers to leave reviews on Google, Yelp, or Facebook.',
    },
    dispatch: {
      label: 'Dispatch/GPS Console',
      tooltip: 'Assigns jobs to technicians based on location, skills, and availability.',
    },
    quoting: {
      label: 'Quoting Agent',
      tooltip: 'Generates professional quotes with itemized pricing and automatic follow-up.',
    },
    invoice: {
      label: 'Invoice Agent',
      tooltip: 'Creates invoices with Stripe payment links for instant online payment.',
    },
  },
  
  // Integration tooltips
  integrations: {
    elevenlabs: {
      label: 'ElevenLabs',
      tooltip: 'Powers Talk to Aura (Voice) and Voice Reminders. Provides natural-sounding AI voice synthesis.',
    },
    signalwire: {
      label: 'SignalWire',
      tooltip: 'Enables SMS Reminders and Voice Reminders. Provides phone number provisioning and call handling.',
    },
    stripe: {
      label: 'Stripe',
      tooltip: 'Processes payments via invoice payment links. Enables instant online payment collection.',
    },
  },
} as const;

// Helper to get tooltip by feature key
export function getFeatureTooltip(key: keyof typeof FEATURE_TOOLTIPS): { label: string; tooltip: string } {
  const feature = FEATURE_TOOLTIPS[key];
  if ('label' in feature && 'tooltip' in feature) {
    return { label: feature.label as string, tooltip: feature.tooltip as string };
  }
  return { label: key, tooltip: '' };
}

// Helper to get console tooltip
export function getConsoleTooltip(consoleKey: keyof typeof FEATURE_TOOLTIPS.consoles): { label: string; tooltip: string } {
  return FEATURE_TOOLTIPS.consoles[consoleKey];
}

// Helper to get agent tooltip
export function getAgentTooltip(agentKey: keyof typeof FEATURE_TOOLTIPS.agents): { label: string; tooltip: string } {
  return FEATURE_TOOLTIPS.agents[agentKey];
}
