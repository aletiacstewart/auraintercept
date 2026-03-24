// Shared agent styling definitions for all AI consoles
// This ensures consistent styling across all agent consoles

export interface AgentStyle {
  label: string;
  color: string;
  bgColor: string;
}

export const AGENT_STYLES: Record<string, AgentStyle> = {
  // Customer Portal Agents
  triage: { label: 'AI Receptionist', color: 'text-secondary', bgColor: 'bg-secondary/10' },
  booking: { label: 'Scheduling', color: 'text-secondary', bgColor: 'bg-secondary/10' },
  followup: { label: 'Follow-up', color: 'text-secondary', bgColor: 'bg-secondary/10' },
  review: { label: 'Social Media Review', color: 'text-secondary', bgColor: 'bg-secondary/10' },
  
  // Field Operations Agents
  dispatch: { label: 'Dispatch', color: 'text-accent', bgColor: 'bg-accent/10' },
  route: { label: 'Route', color: 'text-accent', bgColor: 'bg-accent/10' },
  eta: { label: 'ETA', color: 'text-accent', bgColor: 'bg-accent/10' },
  checkin: { label: 'Check-in', color: 'text-accent', bgColor: 'bg-accent/10' },
  
  // Business Operations Agents
  quoting: { label: 'Quoting', color: 'text-channel-chat', bgColor: 'bg-channel-chat/10' },
  invoice: { label: 'Invoice', color: 'text-channel-chat', bgColor: 'bg-channel-chat/10' },
  inventory: { label: 'Inventory', color: 'text-channel-chat', bgColor: 'bg-channel-chat/10' },
  admin: { label: 'Admin', color: 'text-channel-chat', bgColor: 'bg-channel-chat/10' },
  
  // Marketing & Sales Agents
  campaign: { label: 'Campaign', color: 'text-orange-400', bgColor: 'bg-orange-500/10' },
  marketing: { label: 'Marketing', color: 'text-orange-400', bgColor: 'bg-orange-500/10' },
  promo: { label: 'Promo', color: 'text-orange-400', bgColor: 'bg-orange-500/10' },
  referral: { label: 'Referral', color: 'text-accent', bgColor: 'bg-accent/10' },
  winback: { label: 'Win-Back', color: 'text-channel-chat', bgColor: 'bg-channel-chat/10' },
  seasonal: { label: 'Seasonal', color: 'text-accent', bgColor: 'bg-accent/10' },
  
  // Creative Content Agent (merged social_content + creative)
  creative_content: { label: 'Creative Content', color: 'text-pink-400', bgColor: 'bg-pink-500/10' },
  
  // Analytics & Reports Agents
  insights: { label: 'Insights', color: 'text-secondary', bgColor: 'bg-secondary/10' },
  performance: { label: 'Performance', color: 'text-secondary', bgColor: 'bg-secondary/10' },
  revenue: { label: 'Revenue', color: 'text-secondary', bgColor: 'bg-secondary/10' },
  forecast: { label: 'Forecast', color: 'text-secondary', bgColor: 'bg-secondary/10' },
  
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
 * @param agent - The agent type identifier
 * @returns AgentStyle object with label, color, and bgColor
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
 * Get all available agent types grouped by category
 */
export const AGENT_CATEGORIES = {
  customerEngagement: ['triage', 'booking', 'followup', 'review'],
  fieldOperations: ['dispatch', 'route', 'eta', 'checkin'],
  businessOperations: ['admin', 'quoting', 'invoice', 'inventory'],
  marketingSales: ['campaign', 'marketing', 'promo', 'referral', 'winback', 'seasonal'],
  socialMedia: ['creative_content'],
  analyticsReports: ['insights', 'performance', 'revenue', 'forecast'],
  webPresence: ['web_presence'],
} as const;

export type AgentCategory = keyof typeof AGENT_CATEGORIES;
export type AgentType = typeof AGENT_CATEGORIES[AgentCategory][number];
