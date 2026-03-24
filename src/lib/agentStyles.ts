// Shared agent styling definitions for all AI consoles
// 10 Consolidated AI Operatives

export interface AgentStyle {
  label: string;
  color: string;
  bgColor: string;
}

export const AGENT_STYLES: Record<string, AgentStyle> = {
  // Customer Portal Agents
  triage: { label: 'AI Receptionist', color: 'text-secondary', bgColor: 'bg-secondary/10' },
  customer_journey: { label: 'Customer Journey', color: 'text-secondary', bgColor: 'bg-secondary/10' },
  // Legacy aliases (backward compat)
  booking: { label: 'Customer Journey', color: 'text-secondary', bgColor: 'bg-secondary/10' },
  followup: { label: 'Customer Journey', color: 'text-secondary', bgColor: 'bg-secondary/10' },
  review: { label: 'Customer Journey', color: 'text-secondary', bgColor: 'bg-secondary/10' },
  
  // Field Operations Agents
  dispatch: { label: 'Dispatch', color: 'text-accent', bgColor: 'bg-accent/10' },
  field_navigation: { label: 'Field Navigation', color: 'text-accent', bgColor: 'bg-accent/10' },
  // Legacy aliases
  route: { label: 'Field Navigation', color: 'text-accent', bgColor: 'bg-accent/10' },
  eta: { label: 'Field Navigation', color: 'text-accent', bgColor: 'bg-accent/10' },
  checkin: { label: 'Field Navigation', color: 'text-accent', bgColor: 'bg-accent/10' },
  
  // Business Operations Agents
  admin: { label: 'Admin', color: 'text-channel-chat', bgColor: 'bg-channel-chat/10' },
  business_finance: { label: 'Business Finance', color: 'text-channel-chat', bgColor: 'bg-channel-chat/10' },
  // Legacy aliases
  quoting: { label: 'Business Finance', color: 'text-channel-chat', bgColor: 'bg-channel-chat/10' },
  invoice: { label: 'Business Finance', color: 'text-channel-chat', bgColor: 'bg-channel-chat/10' },
  inventory: { label: 'Business Finance', color: 'text-channel-chat', bgColor: 'bg-channel-chat/10' },
  
  // Outreach & Sales (merged)
  outreach: { label: 'Outreach', color: 'text-orange-400', bgColor: 'bg-orange-500/10' },
  // Legacy aliases
  campaign: { label: 'Outreach', color: 'text-orange-400', bgColor: 'bg-orange-500/10' },
  marketing: { label: 'Outreach', color: 'text-orange-400', bgColor: 'bg-orange-500/10' },
  lead: { label: 'Outreach', color: 'text-orange-400', bgColor: 'bg-orange-500/10' },
  
  // Creative Content Agent
  creative_content: { label: 'Creative Content', color: 'text-pink-400', bgColor: 'bg-pink-500/10' },
  
  // Analytics Intelligence Agent (unified)
  analytics_intelligence: { label: 'Analytics Intelligence', color: 'text-secondary', bgColor: 'bg-secondary/10' },
  // Legacy aliases
  insights: { label: 'Analytics Intelligence', color: 'text-secondary', bgColor: 'bg-secondary/10' },
  performance: { label: 'Analytics Intelligence', color: 'text-secondary', bgColor: 'bg-secondary/10' },
  revenue: { label: 'Analytics Intelligence', color: 'text-secondary', bgColor: 'bg-secondary/10' },
  forecast: { label: 'Analytics Intelligence', color: 'text-secondary', bgColor: 'bg-secondary/10' },
  
  // Web Presence
  web_presence: { label: 'Web Presence', color: 'text-purple-400', bgColor: 'bg-purple-500/10' },
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
