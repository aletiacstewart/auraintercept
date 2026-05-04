/**
 * Industry-aware Aura voice greetings.
 *
 * Returns a short, natural opening line for inbound voice calls,
 * tailored per industry pack so callers immediately hear their
 * vertical reflected. Used by the Fast Start launch step to seed
 * `companies.ai_voice_greeting` and exposed via a "Reset to industry
 * default" button in AI Agent Settings.
 */

const DEFAULT_GREETING = 'Thanks for calling {company}. This is Aura — how can I help today?';

const PER_INDUSTRY: Record<string, string> = {
  hvac: 'Thanks for calling {company}. This is Aura — are you calling about a service issue, a quote, or scheduling a tune-up?',
  plumbing: 'Thanks for calling {company}. This is Aura — is this an emergency, or are you scheduling something for later?',
  electrical: 'Thanks for calling {company}. This is Aura — are you calling about a repair, a panel upgrade, or a new install?',
  appliance_repair: 'Thanks for calling {company}. This is Aura — what appliance can I help you get fixed today?',
  solar: 'Thanks for calling {company}. This is Aura — are you exploring solar for your home, or following up on an existing project?',
  roofing: 'Thanks for calling {company}. This is Aura — are you calling about a leak, an inspection, or storm damage?',
  fencing: 'Thanks for calling {company}. This is Aura — are you looking at a new fence, a repair, or a quote?',
  landscape: 'Thanks for calling {company}. This is Aura — are you looking for recurring service, a one-time cleanup, or a quote?',
  pest_control: 'Thanks for calling {company}. This is Aura — are you calling about an active pest issue or recurring service?',
  pool_spa: 'Thanks for calling {company}. This is Aura — are you calling about your pool, your spa, or scheduling service?',
  auto_care: 'Thanks for calling {company}. This is Aura — what kind of service does your vehicle need today?',
  construction: 'Thanks for calling {company}. This is Aura — are you calling about a project quote or an existing job?',
  handyman: 'Thanks for calling {company}. This is Aura — what would you like to get fixed or installed?',
  security_systems: 'Thanks for calling {company}. This is Aura — are you calling about your existing system or a new install?',
  real_estate: 'Thanks for calling {company}. This is Aura — are you buying, selling, or following up on a listing?',
  beauty_wellness: 'Thanks for calling {company}. This is Aura — would you like to book, reschedule, or check on an appointment?',
  salon: 'Thanks for calling {company}. This is Aura — would you like to book, reschedule, or check on an appointment?',
  fitness: 'Thanks for calling {company}. This is Aura — are you a member, or would you like to learn about classes and trials?',
  restaurants: 'Thanks for calling {company}. This is Aura — I can text you a link to book a table, view our menu, hours, or catering info. What would you like?',
  personal_assistant: 'Thanks for calling {company}. This is Aura — how can I help you today?',
  professional: 'Thanks for calling {company}. This is Aura — how can I direct your call today?',
  saas_platform: 'Thanks for contacting {company}. This is Aura — are you a customer needing support, or exploring our platform?',
};

export function getIndustryVoiceGreeting(
  industryId: string | null | undefined,
  companyName?: string | null,
): string {
  const tmpl = (industryId && PER_INDUSTRY[industryId]) || DEFAULT_GREETING;
  return tmpl.replace('{company}', companyName?.trim() || 'us');
}
