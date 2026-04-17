// Shared agent styling definitions for all AI consoles
// 10 Consolidated AI Operatives

export interface AgentStyle {
  label: string;
  color: string;
  bgColor: string;
}

export const AGENT_STYLES: Record<string, AgentStyle> = {
  // Customer-facing — grouped under "Front Desk" in plain English
  triage: { label: 'Front Desk', color: 'text-secondary', bgColor: 'bg-secondary/10' },
  customer_journey: { label: 'Front Desk', color: 'text-secondary', bgColor: 'bg-secondary/10' },
  // Legacy aliases (backward compat)
  booking: { label: 'Front Desk', color: 'text-secondary', bgColor: 'bg-secondary/10' },
  followup: { label: 'Front Desk', color: 'text-secondary', bgColor: 'bg-secondary/10' },
  review: { label: 'Front Desk', color: 'text-secondary', bgColor: 'bg-secondary/10' },
  
  // Field Operations — grouped as "On The Way"
  dispatch: { label: 'Dispatch', color: 'text-accent', bgColor: 'bg-accent/10' },
  field_navigation: { label: 'On The Way', color: 'text-accent', bgColor: 'bg-accent/10' },
  // Legacy aliases
  route: { label: 'On The Way', color: 'text-accent', bgColor: 'bg-accent/10' },
  eta: { label: 'On The Way', color: 'text-accent', bgColor: 'bg-accent/10' },
  checkin: { label: 'On The Way', color: 'text-accent', bgColor: 'bg-accent/10' },
  
  // Business Operations — grouped as "Billing & Office"
  admin: { label: 'Office', color: 'text-channel-chat', bgColor: 'bg-channel-chat/10' },
  business_finance: { label: 'Billing', color: 'text-channel-chat', bgColor: 'bg-channel-chat/10' },
  // Legacy aliases
  quoting: { label: 'Billing', color: 'text-channel-chat', bgColor: 'bg-channel-chat/10' },
  invoice: { label: 'Billing', color: 'text-channel-chat', bgColor: 'bg-channel-chat/10' },
  inventory: { label: 'Billing', color: 'text-channel-chat', bgColor: 'bg-channel-chat/10' },
  
  // Marketing — plain "Marketing"
  outreach: { label: 'Marketing', color: 'text-orange-400', bgColor: 'bg-orange-500/10' },
  // Legacy aliases
  campaign: { label: 'Marketing', color: 'text-orange-400', bgColor: 'bg-orange-500/10' },
  marketing: { label: 'Marketing', color: 'text-orange-400', bgColor: 'bg-orange-500/10' },
  lead: { label: 'Marketing', color: 'text-orange-400', bgColor: 'bg-orange-500/10' },
  
  // Social posts
  creative_content: { label: 'Social Posts', color: 'text-pink-400', bgColor: 'bg-pink-500/10' },
  
  // Reports — friendlier than "Analytics Intelligence"
  analytics_intelligence: { label: 'Reports', color: 'text-secondary', bgColor: 'bg-secondary/10' },
  // Legacy aliases
  insights: { label: 'Reports', color: 'text-secondary', bgColor: 'bg-secondary/10' },
  performance: { label: 'Reports', color: 'text-secondary', bgColor: 'bg-secondary/10' },
  revenue: { label: 'Reports', color: 'text-secondary', bgColor: 'bg-secondary/10' },
  forecast: { label: 'Reports', color: 'text-secondary', bgColor: 'bg-secondary/10' },
  
  // Website
  web_presence: { label: 'Website', color: 'text-purple-400', bgColor: 'bg-purple-500/10' },
};

// Default style for unknown agents
const DEFAULT_STYLE: AgentStyle = {
  label: 'AI Assistant',
  color: 'text-foreground/70',
  bgColor: 'bg-muted',
};

/**
 * Get the styling for a specific agent type
 */
export function getAgentStyle(agent: string | undefined | null): AgentStyle {
  if (!agent) return DEFAULT_STYLE;
  return AGENT_STYLES[agent.toLowerCase()] || { 
    label: agent.charAt(0).toUpperCase() + agent.slice(1), 
    color: 'text-foreground/70', 
    bgColor: 'bg-muted' 
  };
}

/**
 * Get all available agent types grouped by category (10 consolidated)
 */
export const AGENT_CATEGORIES = {
  customerEngagement: ['triage', 'customer_journey'],
  fieldOperations: ['dispatch', 'field_navigation'],
  businessOperations: ['admin', 'business_finance'],
  marketingSales: ['outreach'],
  socialMedia: ['creative_content'],
  analyticsReports: ['analytics_intelligence'],
  webPresence: ['web_presence'],
} as const;

export type AgentCategory = keyof typeof AGENT_CATEGORIES;
export type AgentType = typeof AGENT_CATEGORIES[AgentCategory][number];
