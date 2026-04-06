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
  tabs?: string[];
}

// Agent display names mapping (ID to display name) — 10 Consolidated Operatives
export const AGENT_DISPLAY_NAMES: Record<string, string> = {
  triage: 'AI Receptionist',
  customer_journey: 'Customer Journey Agent',
  dispatch: 'Dispatch Agent',
  field_navigation: 'Field Navigation Agent',
  admin: 'Admin Agent',
  business_finance: 'Business Finance Agent',
  outreach: 'Outreach Agent',
  creative_content: 'Creative Content Agent',
  web_presence: 'Web Presence Agent',
  analytics_intelligence: 'Analytics Intelligence Agent',
  // Legacy aliases
  booking: 'Customer Journey Agent',
  followup: 'Customer Journey Agent',
  review: 'Customer Journey Agent',
  route: 'Field Navigation Agent',
  eta: 'Field Navigation Agent',
  checkin: 'Field Navigation Agent',
  quoting: 'Business Finance Agent',
  invoice: 'Business Finance Agent',
  inventory: 'Business Finance Agent',
  campaign: 'Outreach Agent',
  lead: 'Outreach Agent',
  marketing: 'Outreach Agent',
  insights: 'Analytics Intelligence Agent',
  performance: 'Analytics Intelligence Agent',
  revenue: 'Analytics Intelligence Agent',
  forecast: 'Analytics Intelligence Agent',
  assistant: 'Aura Assistant',
};

// Console configurations with tier-based content - 3-TIER STRUCTURE
export const CONSOLE_HELP_CONFIG: ConsoleHelpConfig[] = [
  {
    id: 'customer_portal',
    title: 'Customer Portal',
    icon: HeadphonesIcon,
    description: 'AI-powered customer engagement hub with Message Aura (Text), Talk to Aura (Voice), automated scheduling, follow-ups, and review collection — all in one Customer Journey Agent.',
    requiredTier: 'connect',
    tabs: ['Chat', 'Voice', 'Services', 'Hours', 'Feedback', 'Track', 'Billing'],
    agents: [
      { name: 'AI Receptionist', tier: 'connect' },
      { name: 'Customer Journey Agent', tier: 'connect' },
    ],
    features: [
      { text: 'Message Aura (Text) - keyboard input, no dependencies required', tier: 'connect' },
      { text: 'Intelligent customer triage and routing', tier: 'connect' },
      { text: 'Talk to Aura (Voice) - microphone/speaker, requires ElevenLabs + SignalWire', tier: 'connect' },
      { text: 'Voice Reminders for appointments - requires ElevenLabs + SignalWire', tier: 'connect' },
      { text: 'Answer questions using your Knowledge Base', tier: 'connect' },
      { text: 'Automated follow-up sequences via Email/SMS', tier: 'connect' },
      { text: 'Review collection and Google/Yelp/Facebook integration', tier: 'connect' },
      { text: 'Service catalog display with pricing', tier: 'connect' },
      { text: 'Business hours display', tier: 'connect' },
      { text: 'Online appointment booking via AI chat', tier: 'connect' },
      { text: 'Appointment tracking and status updates', tier: 'connect' },
      { text: 'Instant quote requests', tier: 'performance' },
      { text: 'Invoice viewing and billing status', tier: 'performance' },
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
    description: 'Mobile-optimized console powered by Dispatch Agent + Field Navigation Agent covering GPS routing, real-time ETA updates, and one-tap job check-in.',
    requiredTier: 'performance',
    tabs: ['Accept Job', 'Get Directions', 'Mark En Route', 'Update ETA', 'Arrive & Start', 'Complete Job', 'Generate Quote', 'Generate Invoice', 'Contact Dispatch'],
    agents: [
      { name: 'Dispatch Agent', tier: 'performance' },
      { name: 'Field Navigation Agent', tier: 'performance' },
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
    description: 'Comprehensive business management console powered by Admin Agent + Business Finance Agent (Quoting, Invoicing, Inventory).',
    requiredTier: 'performance',
    tabs: ['Quote', 'Invoice', 'Lead', 'Appointments', 'Inventory', 'Companies', 'Employees', 'Customers'],
    agents: [
      { name: 'Business Finance Agent', tier: 'performance' },
      { name: 'Admin Agent', tier: 'command' },
    ],
    features: [
      { text: 'Create and send professional quotes', tier: 'performance' },
      { text: 'Generate and track invoices with payment status', tier: 'performance' },
      { text: 'Service catalog with pricing management', tier: 'performance' },
      { text: 'Lead capture and pipeline management', tier: 'connect' },
      { text: 'Appointment scheduling and calendar management', tier: 'connect' },
      { text: 'Inventory tracking with stock levels', tier: 'command' },
      { text: 'Reorder alerts and supplier management', tier: 'command' },
      { text: 'Multi-company management (Platform Admin)', tier: 'command' },
      { text: 'Employee management and job assignments', tier: 'performance' },
      { text: 'Customer database with service history', tier: 'connect' },
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
    description: 'AI-powered marketing automation — all in one Outreach Agent covering campaign management, lead nurturing, customer segmentation, and promotional tools.',
    requiredTier: 'connect',
    tabs: ['Campaign', 'Leads', 'Marketing'],
    agents: [
      { name: 'Outreach Agent', tier: 'connect' },
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
    description: 'AI-powered creative studio powered by the Creative Content Agent — generates platform-optimized posts, AI images/videos, and multi-channel content for 6 platforms.',
    requiredTier: 'connect',
    tabs: ['Home', 'Create Content', 'My Posts'],
    agents: [
      { name: 'Creative Content Agent', tier: 'connect' },
    ],
    features: [
      { text: 'AI content generation for 6 platforms: Instagram, Facebook, LinkedIn, TikTok, Google My Business, SMS' },
      { text: '3-step Content Wizard: Topic → AI Generation → Review & Post' },
      { text: 'Platform-specific character limits and optimization' },
      { text: 'Visual post mockups for each platform' },
      { text: 'AI-powered content rewording and variations' },
      { text: 'Image upload with 2MB limit and auto-resize' },
      { text: 'Content scheduling with date/time picker' },
      { text: 'Visual content calendar with monthly view' },
      { text: 'Draft management for pending posts' },
      { text: 'Automatic is_aigc disclosure for TikTok compliance' },
      { text: 'Brand voice integration from Knowledge Base' },
      { text: 'Content Engine for multi-channel generation (Social, Blog, Email, SMS, Website)', tier: 'connect' },
      { text: 'Web Presence Manager with AI-powered website and blog', tier: 'connect' },
      { text: 'Auto-publish blog posts from Content Engine', tier: 'connect' },
      { text: 'SEO optimization for all pages and posts', tier: 'connect' },
    ],
    useCases: [
      '"Create an Instagram post about our summer special"',
      '"Generate a LinkedIn post for our new service"',
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
    description: 'AI-powered content generation and web management hub with Creative Content Agent + Web Presence Agent.',
    requiredTier: 'connect',
    tabs: ['Content Engine', 'Brand Voice', 'Generate', 'Dashboard', 'Calendar', 'Web Presence', 'Blog', 'SEO'],
    agents: [
      { name: 'Creative Content Agent', tier: 'connect' },
      { name: 'Web Presence Agent', tier: 'connect' },
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
    requiredTier: 'command',
    tabs: ['Performance', 'Revenue', 'Insights', 'Forecast', 'KPIs', 'Social', 'Reminders', 'Export'],
    agents: [
      { name: 'Analytics Intelligence Agent', tier: 'command' },
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
    description: 'Central management console for all 10 AI Operatives with real-time monitoring, batch activation, dependency visualization, and performance analytics.',
    requiredTier: 'command',
    tabs: ['Operatives', 'Quick Start', 'Monitor', 'Analytics', 'History'],
    agents: [
      { name: 'All 10 AI Operatives', tier: 'command' },
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

// 4-tier hierarchy for console/feature filtering
const TIER_HIERARCHY_HELP: Record<SubscriptionTier, number> = {
  free: 0,
  starter: 1,
  connect: 2,
  performance: 3,
  command: 4,
};

// Get consoles available for a specific tier - 3-TIER STRUCTURE
export function getConsolesForTier(tier: SubscriptionTier): ConsoleHelpConfig[] {
  const currentTierLevel = TIER_HIERARCHY_HELP[tier] ?? 0;
  return CONSOLE_HELP_CONFIG.filter(console => {
    const requiredLevel = TIER_HIERARCHY_HELP[console.requiredTier] ?? 0;
    return requiredLevel <= currentTierLevel;
  });
}

// Get filtered features for a console based on tier
export function getFilteredFeatures(console: ConsoleHelpConfig, tier: SubscriptionTier): string[] {
  const currentTierLevel = TIER_HIERARCHY_HELP[tier] ?? 0;
  return console.features
    .filter(feature => {
      if (!feature.tier) return true;
      return (TIER_HIERARCHY_HELP[feature.tier] ?? 0) <= currentTierLevel;
    })
    .map(f => f.text);
}

// Get filtered agents for a console based on tier
export function getFilteredAgents(console: ConsoleHelpConfig, tier: SubscriptionTier): string[] {
  const currentTierLevel = TIER_HIERARCHY_HELP[tier] ?? 0;
  return console.agents
    .filter(agent => (TIER_HIERARCHY_HELP[agent.tier] ?? 0) <= currentTierLevel)
    .map(a => a.name);
}

// Tier descriptions for Help page - 4-TIER STRUCTURE
export const TIER_HELP_DESCRIPTIONS: Record<SubscriptionTier, { title: string; description: string; highlights: string[] }> = {
  free: {
    title: 'Free Plan',
    description: 'Limited access to platform features.',
    highlights: [],
  },
  starter: {
    title: 'Aura Starter',
    description: 'AI answering, booking, follow-up, and creative content for solo operators.',
    highlights: [
      'AI Receptionist (Triage)',
      'Booking Agent + Follow-Up Agent',
      'Creative Content Agent',
      'Customer Portal + Outreach & Sales + Creative & Web Consoles',
      'Message Aura (Text) + Email Reminders',
      '10 Employee Accounts',
    ],
  },
  connect: {
    title: 'Aura Connect',
    description: '24/7 AI answering, booking, marketing automation, and web presence.',
    highlights: [
      'AI Receptionist for 24/7 customer engagement',
      'Message Aura (Text) + Talk to Aura (Voice)',
      'Customer Journey Agent (Scheduling, Follow-up, Review)',
      'Outreach Agent (Campaign, Lead Capture, Marketing)',
      'Creative Content Agent (Social, Images, Video, Web Copy)',
      'Web Presence Agent (AI-powered site + SEO)',
      'Customer Portal + Outreach & Sales + Social Media + Creative & Web Consoles',
      '5 Employee Accounts',
    ],
  },
  performance: {
    title: 'Aura Performance',
    description: 'Full field operations with dispatch, routing, quoting, and invoicing.',
    highlights: [
      'Everything in Connect',
      'Dispatch Agent (Smart job assignment)',
      'Field Navigation Agent (Route, ETA, Check-in)',
      'Business Finance Agent (Quoting, Invoice, Inventory)',
      'Field Operations Console',
      'Business Operations Console',
      'GPS routing and navigation',
      '15 Employee Accounts',
    ],
  },
  command: {
    title: 'Aura Command',
    description: 'Enterprise AI operating system with unlimited employees, white-label branding, and predictive analytics.',
    highlights: [
      'Everything in Performance',
      'Admin Agent (Scheduling, Staff, Customers)',
      'Analytics Intelligence Agent (Insights, Performance, Revenue, Forecast)',
      'Analytics & Reports Console',
      'AI Operatives Hub (Management Interface)',
      'Unlimited Employee Accounts',
      'Multi-location support',
      'White-label branding',
      'Priority Support & Custom Implementation',
    ],
  },
};

// Get tier by agent type - 4-TIER MAPPING
export function getTierForAgent(agentType: string): SubscriptionTier | null {
  const agentTierMap: Record<string, SubscriptionTier> = {
    // Starter tier
    triage: 'starter',
    customer_journey: 'starter',
    booking: 'starter',
    followup: 'starter',
    creative_content: 'starter',
    creative: 'starter',
    // Connect tier
    outreach: 'connect',
    web_presence: 'connect',
    dispatch: 'connect',
    field_navigation: 'connect',
    route: 'connect',
    review: 'connect',
    campaign: 'connect',
    lead: 'connect',
    marketing: 'connect',
    social_content: 'connect',
    social_scheduler: 'connect',
    social_analytics: 'connect',
    // Performance tier
    admin: 'performance',
    business_finance: 'performance',
    eta: 'performance',
    checkin: 'performance',
    quoting: 'performance',
    invoice: 'performance',
    inventory: 'performance',
    insights: 'performance',
    // Command tier
    analytics_intelligence: 'command',
    revenue: 'command',
    forecast: 'command',
  };
  
  return agentTierMap[agentType] || null;
}

// Operative count per tier - 4-TIER STRUCTURE
export const TIER_AGENT_COUNTS: Record<SubscriptionTier, number> = {
  free: 0,
  starter: 4,
  connect: 7,
  performance: 9,
  command: 10,
};

// Console count per tier
export const TIER_CONSOLE_COUNTS: Record<SubscriptionTier, number> = {
  free: 0,
  starter: 3,
  connect: 5,
  performance: 6,
  command: 7,
};

// Employee limits per tier
export const TIER_EMPLOYEE_LIMITS: Record<SubscriptionTier, number> = {
  free: 0,
  starter: 10,
  connect: 25,
  performance: 50,
  command: 999,  // Unlimited
};
