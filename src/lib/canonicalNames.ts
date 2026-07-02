/**
 * Canonical display names — single source of truth for console + agent labels
 * (per Aura Intercept Voice & Style Sheet v2).
 *
 * RULES
 * - Consoles: use the names below verbatim. These match what the product
 *   ships (Business Management, Field Operations Console, Outreach & Sales
 *   Console, etc.) — do NOT drop or add "Console" arbitrarily.
 * - Agents: every unit is "[Function] Agent". Sole exception: "AI Receptionist".
 * - "Operative" is a collective/narrative word only ("24 AI operatives",
 *   "the operative network"). Never a per-unit label.
 */

export const CONSOLE_NAMES = {
  customer_portal: 'Customer Portal',
  field_operations: 'Field Operations Console',
  business_management: 'Business Management',
  marketing_sales: 'Outreach & Sales Console',
  social_media: 'Social Media',
  creative_web_presence: 'Creative & Web Presence',
  analytics_reports: 'Analytics & Reports',
  ai_operatives_hub: 'AI Operatives Hub',
} as const;

export type ConsoleKey = keyof typeof CONSOLE_NAMES;

export function getConsoleName(key: string): string {
  return (CONSOLE_NAMES as Record<string, string>)[key] ?? key;
}

/**
 * Owner-voice one-liners for each of the 24 named agents + AI Receptionist.
 * Read out loud, these should sound like a foreman explaining a job to a new
 * hire — not a spec sheet.
 */
export const AGENT_DESCRIPTIONS: Record<string, string> = {
  'AI Receptionist':
    'Answers every call, figures out what the customer needs, and either handles it or hands it straight to the right agent.',
  'Booking Agent':
    'Checks your calendar and books the job at a time that actually works.',
  'Follow-Up Agent':
    'Nudges customers before and after the visit so no one gets forgotten.',
  'Review Agent':
    'Asks happy customers for a Google or Yelp review at the right moment.',
  'Assignment Agent':
    'Picks the right person for each job based on skills, load, and who is free.',
  'Routing Agent':
    'Builds the shortest drive between stops so your team spends less time in traffic.',
  'ETA Agent':
    'Tells the customer when you will actually arrive — and updates them if it slips.',
  'Check-In Agent':
    'Logs when a tech starts, what they did, and when they wrap.',
  'Admin Agent':
    "Manages your team's logins and settings, so you control who can see and change what.",
  'Quoting Agent':
    'Turns a phone call or a photo into a clean estimate the customer can approve.',
  'Invoice Agent':
    'Sends the invoice, chases the payment, and keeps the numbers straight.',
  'Inventory Agent':
    "Watches your parts and materials and tells you when it's time to reorder.",
  'Insights Agent':
    'Ask it a plain-English question about your business and get a straight answer.',
  'Performance Agent':
    'Shows how your team is doing this week — who is crushing it, who needs help.',
  'Revenue Agent':
    'Tracks the money in, the money out, and where your margin actually lives.',
  'Forecast Agent':
    'Predicts your busy weeks so you can staff up before the phone rings.',
  'Campaign Agent':
    'Runs email and SMS campaigns end to end — draft, schedule, send, measure.',
  'Lead Agent':
    'Scores new leads by how likely they are to book, so you call the hot ones first.',
  'Marketing Agent':
    'Runs promos, referrals, and win-backs so lapsed customers come home.',
  'Outreach Agent':
    "Reaches out to prospects who haven't replied yet and keeps the pipeline moving.",
  'Social Scheduler Agent':
    'Posts your content on the schedule you approved, using your own connected social account.',
  'Social Analytics Agent':
    'Tells you what posts landed, what fell flat, and where your audience is growing.',
  'Creative Content Agent':
    'Writes the posts, emails, and website copy in your voice — you approve, it publishes.',
  'Web Presence Agent':
    'Builds and updates your website, blog, and SEO in the background so you stay found.',
};

/**
 * Console one-liners — plain sentences in owner voice. Used by landing pages
 * and pricing tables so every console has the same short description.
 */
export const CONSOLE_DESCRIPTIONS: Record<string, string> = {
  customer_portal:
    'Where your customers book, message, and pay — 24 hours a day, no phone tag.',
  field_operations:
    'Schedule, assign, and track every job, visit, or appointment in real time.',
  business_management:
    'One place for quotes, invoices, inventory, employees, and customer records.',
  marketing_sales:
    'Capture leads, score them, and run the campaigns that turn them into jobs.',
  social_media:
    'Write, schedule, and post on-brand content across your social accounts.',
  creative_web_presence:
    'Your website, blog, and SEO — built and updated by AI so you stay found.',
  analytics_reports:
    'Every KPI, dashboard, and forecast, answered in plain English when you ask.',
  ai_operatives_hub:
    'One roof over the operative network — turn agents on, off, or tune them.',
};
