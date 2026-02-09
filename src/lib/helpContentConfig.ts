import { SubscriptionTier } from './subscriptionAgentConfig';
import { 
  HeadphonesIcon, 
  Truck, 
  Briefcase, 
  Megaphone, 
  Share2, 
  BarChart3,
  Bot,
  Palette,
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
  tabs?: string[]; // Quick action tabs available in the console
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
  campaign: 'Campaign Agent',
  lead: 'Lead Agent',
  marketing: 'Marketing Agent',
  social_content: 'Social Media Agent',
  social_scheduler: 'Social Media Scheduler',
  social_analytics: 'Social Media Analytics',
  creative: 'Creative Agent',
  web_presence: 'Web Presence Agent',
  insights: 'Insights Agent',
  performance: 'Performance Agent',
  revenue: 'Revenue Agent',
  forecast: 'Forecast Agent',
  analytics: 'Analytics Agent',
  assistant: 'Aura Assistant',
};

// Console configurations with tier-based content - NEW 7-TIER STRUCTURE
export const CONSOLE_HELP_CONFIG: ConsoleHelpConfig[] = [
  {
    id: 'customer_portal',
    title: 'Customer Portal',
    icon: HeadphonesIcon,
    description: 'AI-powered customer engagement hub with Message Aura (Text) on all tiers, Talk to Aura (Voice) on Scheduling+, automated follow-ups, and review collection.',
    requiredTier: 'scheduling',  // Now available starting at Scheduling tier
    tabs: ['Chat', 'Voice', 'Services', 'Hours', 'Feedback', 'Track', 'Billing'],
    agents: [
      { name: 'AI Receptionist', tier: 'starter' },
      { name: 'Scheduling Agent', tier: 'scheduling' },
      { name: 'Follow-up Agent', tier: 'scheduling' },
      { name: 'Review Agent', tier: 'growth' },
    ],
    features: [
      { text: 'Message Aura (Text) - keyboard input, no dependencies required', tier: 'starter' },
      { text: 'Intelligent customer triage and routing', tier: 'starter' },
      { text: 'Talk to Aura (Voice) - microphone/speaker, requires ElevenLabs + SignalWire', tier: 'scheduling' },
      { text: 'Voice Reminders for appointments - requires ElevenLabs + SignalWire', tier: 'scheduling' },
      { text: 'Answer questions using your Knowledge Base', tier: 'starter' },
      { text: 'Automated follow-up sequences via Email/SMS', tier: 'scheduling' },
      { text: 'Review collection and Google/Yelp/Facebook integration', tier: 'growth' },
      { text: 'Service catalog display with pricing', tier: 'scheduling' },
      { text: 'Business hours display', tier: 'starter' },
      { text: 'Online appointment booking via AI chat', tier: 'scheduling' },
      { text: 'Appointment tracking and status updates', tier: 'scheduling' },
      { text: 'Instant quote requests', tier: 'field_ops' },
      { text: 'Invoice viewing and billing status', tier: 'field_ops' },
    ],
    useCases: [
      '"What are your business hours?"',
      '"What services do you offer?"',
      '"I need to speak with someone about my issue"',
      '"Book an appointment for AC repair tomorrow at 2pm"',
      '"How much does a water heater installation cost?"',
      '"I need to reschedule my appointment"',
      '"What\'s the status of my service request?"',
      '"I have an emergency situation"',
    ],
  },
  {
    id: 'field_operations',
    title: 'Field Operations',
    icon: Truck,
    description: 'Mobile-optimized console for field technicians with AI-powered dispatch, real-time GPS routing, and one-tap job management.',
    requiredTier: 'field_ops',
    tabs: ['Accept Job', 'Get Directions', 'Mark En Route', 'Update ETA', 'Arrive & Start', 'Complete Job', 'Generate Quote', 'Generate Invoice', 'Contact Dispatch'],
    agents: [
      { name: 'Dispatch Agent', tier: 'field_ops' },
      { name: 'Route Agent', tier: 'field_ops' },
      { name: 'ETA Agent', tier: 'field_ops' },
      { name: 'Check-in Agent', tier: 'field_ops' },
    ],
    features: [
      { text: 'Accept assigned jobs with one tap' },
      { text: 'Automatic customer notification on job acceptance' },
      { text: 'Real-time GPS navigation to customer locations' },
      { text: 'Mark en route with automatic SMS/Email to customer' },
      { text: 'Update and communicate real-time ETA' },
      { text: 'Arrive & Start job with status tracking' },
      { text: 'Complete jobs and trigger follow-up workflows' },
      { text: 'Generate quotes directly from the field' },
      { text: 'Create invoices on job completion' },
      { text: 'One-tap dispatch contact' },
      { text: 'Job queue with customer details and service info' },
      { text: 'Photo documentation for job check-ins' },
    ],
    useCases: [
      '"Accept Job" - Accept your next assigned job and notify customer',
      '"Get Directions" - Open GPS navigation to customer address',
      '"Mark En Route" - Update status and send customer notification',
      '"Update ETA" - Send updated arrival time to customer',
      '"Arrive & Start" - Check in at location and begin work',
      '"Complete Job" - Finish job and trigger completion notifications',
      '"Generate Quote" - Create a quote for additional services',
      '"Generate Invoice" - Bill customer for completed work',
      '"Contact Dispatch" - Call dispatch for support',
    ],
  },
  {
    id: 'business_management',
    title: 'Business Operations',
    icon: Briefcase,
    description: 'Comprehensive business management console with AI-powered quoting, invoicing, lead management, and inventory tracking.',
    requiredTier: 'field_ops',  // Available at Field Ops tier
    tabs: ['Quote', 'Invoice', 'Lead', 'Appointments', 'Inventory', 'Companies', 'Employees', 'Customers'],
    agents: [
      { name: 'Quoting Agent', tier: 'field_ops' },
      { name: 'Invoice Agent', tier: 'field_ops' },
      { name: 'Admin Agent', tier: 'performance' },
      { name: 'Inventory Agent', tier: 'performance' },
    ],
    features: [
      { text: 'Create and send professional quotes', tier: 'field_ops' },
      { text: 'Generate and track invoices with payment status', tier: 'field_ops' },
      { text: 'Service catalog with pricing management', tier: 'field_ops' },
      { text: 'Lead capture and pipeline management', tier: 'growth' },
      { text: 'Appointment scheduling and calendar management', tier: 'scheduling' },
      { text: 'Inventory tracking with stock levels', tier: 'performance' },
      { text: 'Reorder alerts and supplier management', tier: 'performance' },
      { text: 'Multi-company management (Platform Admin)', tier: 'command' },
      { text: 'Employee management and job assignments', tier: 'field_ops' },
      { text: 'Customer database with service history', tier: 'scheduling' },
    ],
    useCases: [
      '"Create a quote for HVAC installation"',
      '"Generate an invoice for John Smith\'s repair"',
      '"Add a new lead from the website"',
      '"Schedule an appointment for next Tuesday"',
      '"Check inventory levels for air filters"',
      '"Add a new employee to the team"',
      '"View customer service history"',
    ],
  },
  {
    id: 'marketing_sales',
    title: 'Outreach & Sales Ops',
    icon: Megaphone,
    description: 'AI-powered marketing automation with campaign management, customer segmentation, promotional tools, and lead nurturing.',
    requiredTier: 'growth',  // Available at Growth tier
    tabs: ['Campaign', 'Leads', 'Marketing'],
    agents: [
      { name: 'Campaign Agent', tier: 'growth' },
      { name: 'Lead Agent', tier: 'growth' },
      { name: 'Marketing Agent', tier: 'growth' },
    ],
    features: [
      { text: 'Create targeted Email and SMS campaigns' },
      { text: 'Customer segmentation for personalized outreach' },
      { text: 'Promotional code generation and tracking' },
      { text: 'Discount management and expiration rules' },
      { text: 'Referral program with reward tracking' },
      { text: 'Win-back campaigns for lapsed customers' },
      { text: 'Lead scoring and pipeline management' },
      { text: 'Campaign performance analytics' },
      { text: 'A/B testing for messaging' },
    ],
    useCases: [
      '"Create a 20% off campaign for HVAC maintenance"',
      '"Generate a promo code for first-time customers"',
      '"Find customers who haven\'t booked in 6 months"',
      '"Set up a referral reward program"',
      '"Create a summer AC tune-up promotion"',
      '"Send a win-back offer to inactive customers"',
      '"Segment high-value customers for VIP offers"',
    ],
  },
  {
    id: 'social_media',
    title: 'Social Media Ops',
    icon: Share2,
    description: 'AI-powered social media management with content creation for 6 platforms, scheduling, and visual content calendar.',
    requiredTier: 'growth',  // Available at Growth tier
    tabs: ['Home', 'Social Posts', 'Content Engine', 'Web Presence', 'Blog'],
    agents: [
      { name: 'Social Media Agent', tier: 'growth' },
      { name: 'Social Media Scheduler', tier: 'growth' },
      { name: 'Social Media Analytics', tier: 'growth' },
      { name: 'Creative Agent', tier: 'growth' },
      { name: 'Web Presence Agent', tier: 'business' },
    ],
    features: [
      { text: 'AI content generation for 6 platforms: Instagram, Facebook, LinkedIn, TikTok, Google My Business, SMS' },
      { text: '3-step Content Wizard: Topic → AI Generation → Review & Schedule' },
      { text: 'Platform-specific character limits and optimization' },
      { text: 'Visual post mockups for each platform' },
      { text: 'AI-powered content rewording and variations' },
      { text: 'Image upload with 2MB limit and auto-resize' },
      { text: 'Content scheduling with date/time picker' },
      { text: 'Visual content calendar with monthly view' },
      { text: 'Draft management for pending posts' },
      { text: 'Automatic is_aigc disclosure for TikTok compliance' },
      { text: 'Brand voice integration from Knowledge Base' },
      { text: 'Content Engine for multi-channel generation (Social, Blog, Email, SMS, Website)', tier: 'business' },
      { text: 'Web Presence Manager with AI-powered website and blog', tier: 'business' },
      { text: 'Auto-publish blog posts from Content Engine', tier: 'business' },
      { text: 'SEO optimization for all pages and posts', tier: 'business' },
    ],
    useCases: [
      '"Create an Instagram post about our summer special"',
      '"Generate a LinkedIn post for our new service"',
      '"Schedule a Facebook post for tomorrow at 9am"',
      '"Create content variations for all platforms"',
      '"Show me my scheduled posts for this week"',
      '"Open the content calendar"',
      '"Reword this post to be more professional"',
      '"Generate content for all channels from one topic"',
      '"Push this blog post to the website"',
      '"Run an SEO scan on my website"',
    ],
  },
  {
    id: 'creative_web_presence',
    title: 'Creative & Web Presence',
    icon: Palette,
    description: 'AI-powered content generation and web management hub with Content Engine, AI website builder, blog management, and SEO optimization.',
    requiredTier: 'business',
    tabs: ['Content Engine', 'Brand Voice', 'Generate', 'Dashboard', 'Calendar', 'Web Presence', 'Blog', 'SEO'],
    agents: [
      { name: 'Creative Agent', tier: 'growth' },
      { name: 'Web Presence Agent', tier: 'business' },
    ],
    features: [
      { text: 'Multi-channel content generation (Social, Blog, Email, SMS, Website)' },
      { text: 'Brand Voice configuration and consistency' },
      { text: 'AI-powered content variations and rewording' },
      { text: 'Content calendar with cross-channel scheduling' },
      { text: 'AI website builder with drag-and-drop sections' },
      { text: 'Blog management with auto-publishing' },
      { text: 'SEO optimization and scan frequency settings' },
      { text: 'Push to Web Presence for website content' },
      { text: 'Content history and performance metrics' },
      { text: 'Integration with Knowledge Base for brand context' },
    ],
    useCases: [
      '"Generate content about our summer special for all channels"',
      '"Create a blog post about HVAC maintenance tips"',
      '"Update the website hero section"',
      '"Run an SEO scan on my website"',
      '"Push this content to the website"',
      '"Show my content calendar for this month"',
      '"Generate variations of this marketing copy"',
      '"Set up my brand voice profile"',
    ],
  },
  {
    id: 'analytics_reports',
    title: 'Analytics & Reports',
    icon: BarChart3,
    description: 'Advanced analytics console with 8 specialized tabs for comprehensive business intelligence, forecasting, and multi-format report export.',
    requiredTier: 'performance',
    tabs: ['Performance', 'Revenue', 'Insights', 'Forecast', 'KPIs', 'Social', 'Reminders', 'Export'],
    agents: [
      { name: 'Insights Agent', tier: 'performance' },
      { name: 'Performance Agent', tier: 'performance' },
      { name: 'Revenue Agent', tier: 'performance' },
      { name: 'Forecast Agent', tier: 'performance' },
    ],
    features: [
      { text: 'Performance reports with AI analysis' },
      { text: 'Revenue trends and projections' },
      { text: 'Customer behavior insights' },
      { text: 'AI-powered demand forecasting' },
      { text: 'Real-time KPI dashboards' },
      { text: 'Social media analytics across all platforms (IG, FB, LI, TT, GMB)' },
      { text: 'Reminder delivery analytics (SMS, Email, Voice)' },
      { text: 'Multi-format export: CSV and PDF (jsPDF)' },
      { text: 'Field selection for custom reports' },
      { text: 'Date range filtering' },
      { text: 'Automated trend detection' },
    ],
    useCases: [
      '"Generate a performance report for last month"',
      '"Show me revenue analysis for Q4"',
      '"What are our top-performing services?"',
      '"Forecast demand for next quarter"',
      '"Show KPI dashboard"',
      '"Analyze social media engagement"',
      '"How are our reminder deliveries performing?"',
      '"Export a CSV of all jobs this month"',
      '"Generate a PDF revenue report"',
    ],
  },
  {
    id: 'ai_operatives_hub',
    title: 'AI Operatives Hub',
    icon: Bot,
    description: 'Central management console for all 24 AI Operatives with real-time monitoring, batch activation, dependency visualization, and performance analytics.',
    requiredTier: 'command',
    tabs: ['Operatives', 'Quick Start', 'Monitor', 'Analytics', 'History'],
    agents: [
      { name: 'All 24 AI Operatives', tier: 'command' },
    ],
    features: [
      { text: 'Individual agent configuration and enable/disable' },
      { text: 'Batch activation for quick setup' },
      { text: 'Dependency visualization graph showing agent relationships' },
      { text: 'Real-time event monitoring with live updates' },
      { text: 'Performance metrics dashboard (requests, success rate, handoffs)' },
      { text: 'Conversation history browser with search' },
      { text: 'Agent health status indicators' },
      { text: 'Test suite for validating agent functionality' },
      { text: 'Role-based access control (admin vs employee view)' },
      { text: 'Agent-specific settings (thresholds, auto-actions, notifications)' },
    ],
    useCases: [
      '"Enable all marketing agents"',
      '"Show me which agents are currently active"',
      '"View the dependency graph for dispatch agents"',
      '"Check the health status of my agents"',
      '"Run tests on the invoice agent"',
      '"View conversation history for last week"',
      '"Monitor real-time agent events"',
      '"Configure the dispatch agent settings"',
    ],
  },
];

// Get consoles available for a specific tier - NEW 7-TIER STRUCTURE
export function getConsolesForTier(tier: SubscriptionTier): ConsoleHelpConfig[] {
  const tierHierarchy: Record<SubscriptionTier, number> = {
    free: 0,
    starter: 1,
    scheduling: 2,
    growth: 3,
    business: 4,
    field_ops: 5,
    performance: 6,
    command: 7,
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
    starter: 1,
    scheduling: 2,
    growth: 3,
    business: 4,
    field_ops: 5,
    performance: 6,
    command: 7,
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
    starter: 1,
    scheduling: 2,
    growth: 3,
    business: 4,
    field_ops: 5,
    performance: 6,
    command: 7,
  };
  
  const currentTierLevel = tierHierarchy[tier];
  
  return console.agents
    .filter(agent => tierHierarchy[agent.tier] <= currentTierLevel)
    .map(a => a.name);
}

// Tier descriptions for Help page - NEW 7-TIER STRUCTURE
export const TIER_HELP_DESCRIPTIONS: Record<SubscriptionTier, { title: string; description: string; highlights: string[] }> = {
  free: {
    title: 'Free Plan',
    description: 'Limited access to platform features.',
    highlights: [],
  },
  starter: {
    title: 'Aura Starter',
    description: 'Never miss a lead again - 24/7 AI answering and lead capture.',
    highlights: [
      'AI Receptionist for 24/7 customer engagement',
      'Message Aura (Text) + Talk to Aura (Voice)',
      'Smart Link Sharing',
      'Knowledge Base for FAQs',
      'Embeddable Chat Widget',
      '2 Employee Accounts',
      'Requires ElevenLabs + SignalWire integrations',
    ],
  },
  scheduling: {
    title: 'Aura Scheduling',
    description: 'Turn conversations into booked appointments with automated booking and reminders.',
    highlights: [
      'Everything in Starter',
      'Scheduling Agent with calendar sync',
      'Follow-up Agent (SMS + Email reminders)',
      'Customer Portal Console',
      'Unlimited appointments',
      '3 Employee Accounts',
    ],
  },
  growth: {
    title: 'Aura Growth',
    description: 'Start growing automatically with marketing automation and social media.',
    highlights: [
      'Everything in Scheduling',
      'Review Agent for reputation management',
      'Campaign, Lead, and Marketing Agents',
      'Social Media Suite (Content, Scheduler, Analytics)',
      'Creative Agent for content generation',
      'Outreach & Sales Ops Console',
      'Social Media Console',
      '5 Employee Accounts',
    ],
  },
  business: {
    title: 'Aura Business',
    description: 'Run your office automatically with web presence and management dashboards.',
    highlights: [
      'Everything in Growth',
      'Web Presence Agent for website management',
      'Creative & Web Presence Console',
      'AI-powered website and blog',
      'SEO optimization',
      '8 Employee Accounts',
      'Note: Voice features disabled (digital-only tier)',
    ],
  },
  field_ops: {
    title: 'Aura Field Ops',
    description: 'Run your field team automatically with dispatch, routing, and job management.',
    highlights: [
      'Everything in Business',
      'Dispatch, Route, ETA, and Check-in Agents',
      'Quoting and Invoice Agents',
      'Field Operations Console',
      'Business Management Console',
      'GPS routing and navigation',
      'Customer ETA notifications',
      '15 Employee Accounts',
    ],
  },
  performance: {
    title: 'Aura Performance',
    description: 'Run your entire company with AI and business intelligence.',
    highlights: [
      'Everything in Field Ops',
      'Admin and Inventory Agents',
      'Insights, Performance, Revenue, and Forecast Agents',
      'Analytics & Reports Console',
      'AI-powered demand forecasting',
      'Multi-format report export',
      'Priority Support',
      '25 Employee Accounts',
    ],
  },
  command: {
    title: 'Aura Command',
    description: 'AI Operating System for multi-location companies with dedicated support.',
    highlights: [
      'Everything in Performance',
      'All 24 AI Agents',
      'All 7 Control Centers (Consoles)',
      'AI Operatives Hub for central management',
      'Multi-location support',
      'White-label branding',
      'Dedicated Account Manager',
      'Priority Support',
      '50 Employee Accounts',
    ],
  },
};

// Get tier by agent type - NEW MAPPING
export function getTierForAgent(agentType: string): SubscriptionTier | null {
  const agentTierMap: Record<string, SubscriptionTier> = {
    // Starter tier (Lead Capture Stack)
    triage: 'starter',
    
    // Scheduling tier (Booking Stack)
    booking: 'scheduling',
    followup: 'scheduling',
    
    // Growth tier (Marketing Stack)
    review: 'growth',
    campaign: 'growth',
    lead: 'growth',
    marketing: 'growth',
    social_content: 'growth',
    social_scheduler: 'growth',
    social_analytics: 'growth',
    creative: 'growth',
    
    // Business tier (Office Stack)
    web_presence: 'business',
    
    // Field Ops tier (Field Operations Stack)
    dispatch: 'field_ops',
    route: 'field_ops',
    eta: 'field_ops',
    checkin: 'field_ops',
    quoting: 'field_ops',
    invoice: 'field_ops',
    
    // Performance tier (Business Intelligence Stack)
    admin: 'performance',
    inventory: 'performance',
    insights: 'performance',
    performance: 'performance',
    revenue: 'performance',
    forecast: 'performance',
  };
  
  return agentTierMap[agentType] || null;
}

// Agent count per tier - NEW STRUCTURE
export const TIER_AGENT_COUNTS: Record<SubscriptionTier, number> = {
  free: 0,
  starter: 1,
  scheduling: 3,
  growth: 11,
  business: 12,
  field_ops: 18,
  performance: 24,
  command: 24,
};

// Console count per tier - 7 Control Centers (AI Operatives Hub is management interface, not counted)
export const TIER_CONSOLE_COUNTS: Record<SubscriptionTier, number> = {
  free: 0,
  starter: 0,
  scheduling: 1,
  growth: 3,
  business: 4,
  field_ops: 6,
  performance: 7,
  command: 7,  // All 7 Control Centers + AI Operatives Hub (management interface)
};

// Employee limits per tier - NEW STRUCTURE
export const TIER_EMPLOYEE_LIMITS: Record<SubscriptionTier, number> = {
  free: 0,
  starter: 2,
  scheduling: 3,
  growth: 5,
  business: 8,
  field_ops: 15,
  performance: 25,
  command: 50,
};
