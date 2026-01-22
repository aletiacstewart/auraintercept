import { SubscriptionTier } from './subscriptionAgentConfig';
import { 
  HeadphonesIcon, 
  Truck, 
  Briefcase, 
  Megaphone, 
  Share2, 
  BarChart3,
  LucideIcon
} from 'lucide-react';

// Console configuration with tier-based access
export interface ConsoleHelpConfig {
  id: string;
  title: string;
  icon: LucideIcon;
  description: string;
  agents: { name: string; tier: SubscriptionTier }[];
  features: { text: string; tier?: SubscriptionTier }[];
  useCases: string[];
  requiredTier: SubscriptionTier;
}

// Agent display names mapping (ID to display name)
export const AGENT_DISPLAY_NAMES: Record<string, string> = {
  triage: 'AI Receptionist',
  booking: 'Scheduling Agent',
  followup: 'Follow-up Agent',
  review: 'Review Agent',
  dispatch: 'Dispatch Agent',
  route: 'Route Agent',
  eta: 'ETA Agent',
  checkin: 'Check-in Agent',
  admin: 'Admin Agent',
  quoting: 'Quoting Agent',
  invoice: 'Invoice Agent',
  inventory: 'Inventory Agent',
  warranty: 'Warranty Agent',
  campaign: 'Campaign Agent',
  marketing: 'Marketing Agent',
  social_content: 'Social Content Agent',
  social_scheduler: 'Social Scheduler Agent',
  social_analytics: 'Social Analytics Agent',
  insights: 'Insights Agent',
  performance: 'Performance Agent',
  revenue: 'Revenue Agent',
  forecast: 'Forecast Agent',
  analytics: 'Analytics Agent',
};

// Console configurations with tier-based content
export const CONSOLE_HELP_CONFIG: ConsoleHelpConfig[] = [
  {
    id: 'customer_portal',
    title: 'Customer Portal',
    icon: HeadphonesIcon,
    description: 'AI-powered customer engagement with intelligent triage, follow-ups, and reviews. AI Voice Chat included for all paid tiers.',
    requiredTier: 'single_point',
    agents: [
      { name: 'AI Receptionist', tier: 'single_point' },
      { name: 'Follow-up Agent', tier: 'single_point' },
      { name: 'Review Agent', tier: 'single_point' },
      { name: 'Scheduling Agent', tier: 'multi_track' },
    ],
    features: [
      { text: 'Intelligent triage and routing of customer inquiries', tier: 'single_point' },
      { text: 'AI Voice Chat and Outbound Calls', tier: 'single_point' },
      { text: 'Answer customer questions using your knowledge base', tier: 'single_point' },
      { text: 'Automated follow-up sequences', tier: 'single_point' },
      { text: 'Collect feedback and request reviews', tier: 'single_point' },
      { text: 'Online booking via AI chat', tier: 'multi_track' },
      { text: 'Appointment tracking and reminders', tier: 'multi_track' },
      { text: 'Instant quotes for services', tier: 'multi_track' },
    ],
    useCases: [
      '"What are your business hours?"',
      '"Can I speak with someone about my issue?"',
      '"Book an appointment for AC repair tomorrow at 2pm"',
      '"How much does a water heater installation cost?"',
      '"I need to reschedule my appointment"',
    ],
  },
  {
    id: 'field_operations',
    title: 'Field Operations',
    icon: Truck,
    description: 'Mobile-optimized console for field technicians with AI-powered dispatch, routing, and job management.',
    requiredTier: 'multi_track',
    agents: [
      { name: 'Dispatch Agent', tier: 'multi_track' },
      { name: 'Route Agent', tier: 'multi_track' },
      { name: 'ETA Agent', tier: 'multi_track' },
      { name: 'Check-in Agent', tier: 'multi_track' },
    ],
    features: [
      { text: 'Accept assigned jobs and notify customers automatically' },
      { text: 'Get turn-by-turn directions to customer locations' },
      { text: 'Mark en route status with automatic customer notifications' },
      { text: 'Update and communicate real-time ETA to customers' },
      { text: 'Arrive & Start job with one-tap status updates' },
      { text: 'Complete jobs and trigger follow-up workflows' },
      { text: 'Generate quotes and invoices directly from the field' },
      { text: 'Contact dispatch with one tap for support' },
    ],
    useCases: [
      '"Accept Job" - Accept your next assigned job',
      '"Get Directions" - Open navigation to customer',
      '"Mark En Route" - Update status and notify customer',
      '"Update ETA" - Send updated arrival time',
      '"Complete Job" - Finish and trigger notifications',
    ],
  },
  {
    id: 'business_management',
    title: 'Business Operations',
    icon: Briefcase,
    description: 'Comprehensive business management with AI-powered quoting, invoicing, inventory, and warranty tracking.',
    requiredTier: 'command',
    agents: [
      { name: 'Admin Agent', tier: 'command' },
      { name: 'Quoting Agent', tier: 'multi_track' },
      { name: 'Invoice Agent', tier: 'multi_track' },
      { name: 'Inventory Agent', tier: 'command' },
      { name: 'Warranty Agent', tier: 'command' },
    ],
    features: [
      { text: 'Create and send professional quotes', tier: 'multi_track' },
      { text: 'Generate and track invoices', tier: 'multi_track' },
      { text: 'Look up pricing for parts and services', tier: 'multi_track' },
      { text: 'Manage leads and customer pipeline', tier: 'command' },
      { text: 'Track inventory levels and reorder alerts', tier: 'command' },
      { text: 'Manage warranty claims and policies', tier: 'command' },
      { text: 'View KPI dashboards and metrics', tier: 'command' },
    ],
    useCases: [
      '"Create a quote for HVAC installation"',
      '"Generate an invoice for John Smith"',
      '"Look up the price for a compressor"',
      '"Check warranty status for order #12345"',
      '"What\'s the current stock level for air filters?"',
    ],
  },
  {
    id: 'marketing_sales',
    title: 'Marketing & Sales',
    icon: Megaphone,
    description: 'AI-powered marketing automation with campaign management, lead segmentation, and promotional tools.',
    requiredTier: 'command',
    agents: [
      { name: 'Campaign Agent', tier: 'command' },
      { name: 'Marketing Agent', tier: 'command' },
    ],
    features: [
      { text: 'Create targeted marketing campaigns' },
      { text: 'Segment customers for personalized outreach' },
      { text: 'Generate promotional codes and discounts' },
      { text: 'Track referrals and reward programs' },
      { text: 'Win back lapsed customers with special offers' },
      { text: 'Manage leads and sales pipeline' },
    ],
    useCases: [
      '"Create a 20% off campaign for HVAC maintenance"',
      '"Generate a promo code for first-time customers"',
      '"Find customers who haven\'t booked in 6 months"',
      '"Set up a referral reward program"',
    ],
  },
  {
    id: 'social_media',
    title: 'Social Media',
    icon: Share2,
    description: 'AI-powered social media management with content creation, scheduling, and analytics.',
    requiredTier: 'command',
    agents: [
      { name: 'Social Content Agent', tier: 'command' },
      { name: 'Social Scheduler Agent', tier: 'command' },
      { name: 'Social Analytics Agent', tier: 'command' },
    ],
    features: [
      { text: 'Generate platform-specific social media content' },
      { text: 'Schedule posts across multiple platforms' },
      { text: 'Track engagement and analytics' },
      { text: 'AI-powered content suggestions' },
      { text: 'Platform-specific character limits and optimization' },
    ],
    useCases: [
      '"Create a Facebook post about our summer special"',
      '"Schedule an Instagram story for tomorrow at 9am"',
      '"Show me engagement stats for last week"',
      '"Generate content for a seasonal promotion"',
    ],
  },
  {
    id: 'analytics_reports',
    title: 'Analytics & Reports',
    icon: BarChart3,
    description: 'Advanced analytics and reporting with AI-powered insights, forecasting, and performance tracking.',
    requiredTier: 'command',
    agents: [
      { name: 'Insights Agent', tier: 'command' },
      { name: 'Performance Agent', tier: 'command' },
      { name: 'Revenue Agent', tier: 'command' },
      { name: 'Forecast Agent', tier: 'command' },
    ],
    features: [
      { text: 'Real-time KPI dashboards' },
      { text: 'Revenue trends and forecasts' },
      { text: 'Customer behavior insights' },
      { text: 'Performance reports and analytics' },
      { text: 'AI-powered demand forecasting' },
    ],
    useCases: [
      '"Show me this month\'s revenue"',
      '"Generate a performance report for Q4"',
      '"Forecast demand for next quarter"',
      '"What are our top-performing services?"',
    ],
  },
];

// Get consoles available for a specific tier
export function getConsolesForTier(tier: SubscriptionTier): ConsoleHelpConfig[] {
  const tierHierarchy: Record<SubscriptionTier, number> = {
    free: 0,
    single_point: 1,
    multi_track: 2,
    command: 3,
  };
  
  const currentTierLevel = tierHierarchy[tier];
  
  return CONSOLE_HELP_CONFIG.filter(console => {
    const requiredLevel = tierHierarchy[console.requiredTier];
    return requiredLevel <= currentTierLevel;
  });
}

// Get filtered features for a console based on tier
export function getFilteredFeatures(console: ConsoleHelpConfig, tier: SubscriptionTier): string[] {
  const tierHierarchy: Record<SubscriptionTier, number> = {
    free: 0,
    single_point: 1,
    multi_track: 2,
    command: 3,
  };
  
  const currentTierLevel = tierHierarchy[tier];
  
  return console.features
    .filter(feature => {
      if (!feature.tier) return true;
      return tierHierarchy[feature.tier] <= currentTierLevel;
    })
    .map(f => f.text);
}

// Get filtered agents for a console based on tier
export function getFilteredAgents(console: ConsoleHelpConfig, tier: SubscriptionTier): string[] {
  const tierHierarchy: Record<SubscriptionTier, number> = {
    free: 0,
    single_point: 1,
    multi_track: 2,
    command: 3,
  };
  
  const currentTierLevel = tierHierarchy[tier];
  
  return console.agents
    .filter(agent => tierHierarchy[agent.tier] <= currentTierLevel)
    .map(a => a.name);
}

// Tier descriptions for Help page
export const TIER_HELP_DESCRIPTIONS: Record<SubscriptionTier, { title: string; description: string; highlights: string[] }> = {
  free: {
    title: 'Free Plan',
    description: 'Limited access to platform features.',
    highlights: [],
  },
  single_point: {
    title: 'Single-Point Plan',
    description: 'Perfect for businesses focused on lead intake and reputation management.',
    highlights: [
      'AI Receptionist for customer engagement',
      'Automated follow-up sequences',
      'Review collection and management',
      'AI Voice Chat and Outbound Calls',
      'Call to Book (no online scheduling)',
    ],
  },
  multi_track: {
    title: 'Multi-Track Plan',
    description: 'Ideal for businesses with field operations and service scheduling needs.',
    highlights: [
      'Everything in Single-Point',
      'Online appointment booking',
      'Field Operations console',
      'Dispatch and route optimization',
      'Quoting and invoicing',
      'Customer ETA notifications',
    ],
  },
  command: {
    title: 'Command Plan',
    description: 'Full business automation suite for growing enterprises.',
    highlights: [
      'Everything in Multi-Track',
      'Business Operations console',
      'Marketing & Sales automation',
      'Social Media management',
      'Analytics & Reporting',
      'Inventory management',
      'Warranty tracking',
      '18+ AI Agents',
    ],
  },
};
