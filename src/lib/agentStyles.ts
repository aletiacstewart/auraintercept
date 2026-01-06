// Shared agent styling definitions for all AI consoles
// This ensures consistent styling across all agent consoles

export interface AgentStyle {
  label: string;
  color: string;
  bgColor: string;
}

export const AGENT_STYLES: Record<string, AgentStyle> = {
  // Customer Engagement Agents
  triage: { label: 'AI Receptionist', color: 'text-blue-700', bgColor: 'bg-blue-100' },
  booking: { label: 'Scheduling', color: 'text-blue-700', bgColor: 'bg-blue-100' },
  followup: { label: 'Follow-up', color: 'text-blue-700', bgColor: 'bg-blue-100' },
  review: { label: 'Social Media Review', color: 'text-blue-700', bgColor: 'bg-blue-100' },
  
  // Field Operations Agents
  dispatch: { label: 'Dispatch', color: 'text-green-700', bgColor: 'bg-green-100' },
  route: { label: 'Route', color: 'text-green-700', bgColor: 'bg-green-100' },
  eta: { label: 'ETA', color: 'text-green-700', bgColor: 'bg-green-100' },
  checkin: { label: 'Check-in', color: 'text-green-700', bgColor: 'bg-green-100' },
  
  // Business Operations Agents
  quoting: { label: 'Quoting', color: 'text-purple-700', bgColor: 'bg-purple-100' },
  invoice: { label: 'Invoice', color: 'text-purple-700', bgColor: 'bg-purple-100' },
  inventory: { label: 'Inventory', color: 'text-purple-700', bgColor: 'bg-purple-100' },
  warranty: { label: 'Warranty', color: 'text-cyan-700', bgColor: 'bg-cyan-100' },
  admin: { label: 'Admin', color: 'text-purple-700', bgColor: 'bg-purple-100' },
  
  // Marketing & Sales Agents
  marketing: { label: 'Marketing', color: 'text-orange-700', bgColor: 'bg-orange-100' },
  promo: { label: 'Promo', color: 'text-orange-700', bgColor: 'bg-orange-100' },
  referral: { label: 'Referral', color: 'text-pink-700', bgColor: 'bg-pink-100' },
  winback: { label: 'Win-Back', color: 'text-purple-700', bgColor: 'bg-purple-100' },
  seasonal: { label: 'Seasonal', color: 'text-green-700', bgColor: 'bg-green-100' },
  
  // Analytics & Insights Agents
  insights: { label: 'Business Insights', color: 'text-indigo-700', bgColor: 'bg-indigo-100' },
  forecast: { label: 'Forecast', color: 'text-teal-700', bgColor: 'bg-teal-100' },
  revenue: { label: 'Revenue', color: 'text-emerald-700', bgColor: 'bg-emerald-100' },
  performance: { label: 'Performance', color: 'text-violet-700', bgColor: 'bg-violet-100' },
  analytics: { label: 'Data Analytics', color: 'text-cyan-700', bgColor: 'bg-cyan-100' },
};

// Default style for unknown agents
const DEFAULT_STYLE: AgentStyle = {
  label: 'AI Assistant',
  color: 'text-gray-700',
  bgColor: 'bg-gray-100',
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
    color: 'text-gray-700', 
    bgColor: 'bg-gray-100' 
  };
}

/**
 * Get all available agent types grouped by category
 */
export const AGENT_CATEGORIES = {
  customerEngagement: ['triage', 'booking', 'followup', 'review'],
  fieldOperations: ['dispatch', 'route', 'eta', 'checkin'],
  businessOperations: ['quoting', 'invoice', 'inventory', 'warranty'],
  marketingSales: ['marketing', 'promo', 'referral', 'winback', 'seasonal'],
  analytics: ['insights', 'forecast', 'revenue', 'performance', 'analytics'],
} as const;

export type AgentCategory = keyof typeof AGENT_CATEGORIES;
export type AgentType = typeof AGENT_CATEGORIES[AgentCategory][number];
