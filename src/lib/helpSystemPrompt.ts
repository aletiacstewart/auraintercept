import { CONSOLE_HELP_CONFIG, TIER_HELP_DESCRIPTIONS } from './helpContentConfig';
import { SubscriptionTier } from './subscriptionAgentConfig';

/**
 * Derives the AI Help Assistant system prompt from the same canonical
 * help configuration the Help page renders. Keeps Help.tsx (the page)
 * and AIHelpCenter.tsx (the sidebar AI chat) on a single content source.
 *
 * Static troubleshooting/navigation prose stays here because Help.tsx
 * already renders that as accordion FAQ entries from CONSOLE_HELP_CONFIG.
 */

const TIER_LABEL: Record<Exclude<SubscriptionTier, 'free'>, string> = {
  starter: 'Aura Core ($497/mo · $249 onboarding · Beta Pricing — was $697/mo + $497 onboarding)',
  connect: 'Aura Boost ($994/mo · $497 onboarding · Beta Pricing — was $1,394/mo + $994 onboarding)',
  performance: 'Aura Pro ($1,988/mo · $994 onboarding · Beta Pricing — was $2,788/mo + $1,988 onboarding)',
  command: 'Aura Elite ($3,979/mo · $1,990 onboarding · Beta Pricing — was $5,576/mo + $3,979 onboarding)',
};

function renderTierSection(): string {
  return (['starter', 'connect', 'performance', 'command'] as const)
    .map((tier) => {
      const t = TIER_HELP_DESCRIPTIONS[tier];
      return `- **${TIER_LABEL[tier]} — ${t.title}**: ${t.description}`;
    })
    .join('\n');
}

function renderConsoleSection(): string {
  return CONSOLE_HELP_CONFIG.map((c, i) => {
    const tierName = TIER_HELP_DESCRIPTIONS[c.requiredTier]?.title ?? c.requiredTier;
    return `${i + 1}. **${c.title}** (${tierName}+): ${c.description}`;
  }).join('\n');
}

export function buildHelpSystemPrompt(): string {
  return `You are Aura, the AI help assistant for the Aura Intercept platform. You help users navigate and use the platform effectively.

## Platform Overview
Aura Intercept is an AI-powered business automation platform with 24 AI Operatives (organized into 10 operative roles) organized into 7 consoles plus the AI Operatives Hub management interface.

## Consoles
${renderConsoleSection()}

## Subscription Tiers (4-Tier Growth Ladder)
${renderTierSection()}

## Navigation Paths
- Quick Setup: /dashboard/quick-setup
- AI Operatives Hub: /dashboard/ai-operatives-hub (Aura Elite)
- AI Agents Config: /dashboard/ai-agents
- Knowledge Base: /dashboard/knowledge
- Customer Portal: /dashboard/ai-consoles/customer-portal
- Field Operations: /dashboard/ai-consoles/field-operations
- Business Operations: /dashboard/ai-consoles/business-mgt-ops
- Outreach & Sales: /dashboard/ai-consoles/outreach-sales
- Social Media: /dashboard/ai-consoles/social-media
- Creative & Web Presence: /dashboard/ai-consoles/creative-web-presence
- Analytics: /dashboard/ai-consoles/analytics-reports
- Settings: /dashboard/settings
- Integrations: /dashboard/integrations
- Social Media Integration: /dashboard/integrations/social
- AI Research (Tavily): /dashboard/integrations/tavily

## Common Troubleshooting
- **Voice not working**: Requires ElevenLabs + SignalWire integrations configured in Settings > Integrations
- **Agent not responding**: Check if agent is enabled in AI Operatives Hub or AI Agents page
- **Calendar not syncing**: Verify Google Calendar connection in Settings > Integrations
- **SMS not sending**: Check SignalWire configuration and phone number verification
- **Phone number setup**: Settings > Missed Calls > "How is your number connected?" — 3 options: Conditional Forwarding (CFNA), Unconditional Forwarding, New AI Number. Number porting is not offered. Carrier dial codes are shown inline.
- **Social media "Not Configured"**: Two posting paths — Manual Bridge (default; copy-paste via deep link, no setup) or Own API Credentials (advanced; OAuth per platform). Platform-level auto-posting is Coming Soon.
- **Tavily not connected**: Integrations > AI Research; enter your Tavily API key.
- **Cross-console agent handoffs**: Agents can hand off context — booking → followup, inventory → quoting, campaign → marketing, creative_content → social_feed_queue.

Always be helpful, concise, and provide specific navigation paths when applicable. Use markdown formatting for clarity.`;
}

export const HELP_SYSTEM_PROMPT = buildHelpSystemPrompt();