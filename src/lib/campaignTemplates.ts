export interface CampaignTemplate {
  id: string;
  label: string;
  subject?: string;
  body: string;
}

/**
 * Built-in SMS template library used by CampaignForm.
 * Each body should already be opt-out compliant (Reply STOP) and under ~320 chars.
 */
export const SMS_TEMPLATES: CampaignTemplate[] = [
  {
    id: 'welcome',
    label: 'Welcome (Post-Signup)',
    body:
      'Welcome to Aura Intercept. Your journey toward a proactive digital workforce starts now. You will receive updates and onboarding tips at this number. Access your portal here: https://auraintercept.ai/for-business. Reply STOP to opt out.',
  },
  {
    id: 'onboarding-reminder',
    label: 'Onboarding Reminder',
    body:
      'Aura Intercept Reminder: Your AI Agent is almost ready to deploy. Please finish your 10DLC registration and campaign setup to start capturing missed leads: https://auraintercept.ai/for-business. Reply STOP to opt out.',
  },
  {
    id: 'product-update',
    label: 'Product / Logic Update',
    body:
      'Aura Intercept Update: Our AI logic has been enhanced for faster performance. Check out the new dashboard features and improvements. Reply STOP to unsubscribe.',
  },
  {
    id: 'tier-upgrade',
    label: 'Service Tier Upgrade',
    body:
      'Aura Intercept Service Update: We now offer advanced AI-to-Voice handoff. Upgrade your service tier to ensure your business never misses a connection. View plans here: https://auraintercept.ai/for-business. Reply STOP to opt out.',
  },
  {
    id: 'system-alert',
    label: 'Scheduled System Alert',
    body:
      'Aura Intercept System Alert: We are performing a scheduled logic optimization on {date} at {time}. Your AI Agents will remain active, but dashboard reporting may be temporarily delayed. Details: https://auraintercept.ai/for-business. Reply STOP to unsubscribe.',
  },
];

/**
 * Starter email templates mirroring the SMS set. Subjects are kept short
 * and the body uses {customer_name} for personalization.
 */
export const EMAIL_TEMPLATES: CampaignTemplate[] = [
  {
    id: 'welcome',
    label: 'Welcome (Post-Signup)',
    subject: 'Welcome to Aura Intercept',
    body:
      'Hi {customer_name},\n\nWelcome to Aura Intercept — your journey toward a proactive digital workforce starts now.\n\nYou will receive onboarding tips and product updates from us as you get set up. Access your portal anytime here: https://auraintercept.ai/for-business.\n\n— The Aura Intercept Team',
  },
  {
    id: 'onboarding-reminder',
    label: 'Onboarding Reminder',
    subject: 'Finish setting up your AI Agent',
    body:
      'Hi {customer_name},\n\nYour AI Agent is almost ready to deploy. To start capturing missed leads, please finish your 10DLC registration and campaign setup.\n\nContinue setup: https://auraintercept.ai/for-business\n\n— The Aura Intercept Team',
  },
  {
    id: 'product-update',
    label: 'Product / Logic Update',
    subject: 'New in Aura Intercept: faster AI logic',
    body:
      'Hi {customer_name},\n\nWe just enhanced our AI logic for faster performance and shipped new dashboard features. Log in to see what is new.\n\nOpen your dashboard: https://auraintercept.ai/for-business\n\n— The Aura Intercept Team',
  },
  {
    id: 'tier-upgrade',
    label: 'Service Tier Upgrade',
    subject: 'Never miss a connection — upgrade your tier',
    body:
      'Hi {customer_name},\n\nWe now offer advanced AI-to-Voice handoff. Upgrade your service tier to ensure your business never misses a connection.\n\nView plans: https://auraintercept.ai/for-business\n\n— The Aura Intercept Team',
  },
  {
    id: 'system-alert',
    label: 'Scheduled System Alert',
    subject: 'Scheduled maintenance notice',
    body:
      'Hi {customer_name},\n\nWe are performing a scheduled logic optimization on {date} at {time}. Your AI Agents will remain active, but dashboard reporting may be temporarily delayed.\n\nDetails: https://auraintercept.ai/for-business\n\n— The Aura Intercept Team',
  },
];