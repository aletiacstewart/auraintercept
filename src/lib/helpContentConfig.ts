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
  social_content: 'Social Media Signal Agent',
  social_scheduler: 'Signal Scheduler',
  social_analytics: 'Signal Analytics',
  creative: 'Creative Agent',
  web_presence: 'Web Presence Agent',
  insights: 'Insights Agent',
  performance: 'Performance Agent',
  revenue: 'Revenue Agent',
  forecast: 'Forecast Agent',
  analytics: 'Analytics Agent',
  assistant: 'Aura Assistant',
};

// Console configurations with tier-based content - FULLY UPDATED FOR LAUNCH
export const CONSOLE_HELP_CONFIG: ConsoleHelpConfig[] = [
  {
    id: 'customer_portal',
    title: 'Customer Portal',
    icon: HeadphonesIcon,
    description: 'AI-powered customer engagement hub with Message Aura (Text) on all tiers, Talk to Aura (Voice) on Single-Point+, automated follow-ups, and review collection.',
    requiredTier: 'single_point',
    tabs: ['Chat', 'Voice', 'Services', 'Hours', 'Feedback', 'Track', 'Billing'],
    agents: [
      { name: 'AI Receptionist', tier: 'single_point' },
      { name: 'Follow-up Agent', tier: 'single_point' },
      { name: 'Review Agent', tier: 'single_point' },
      { name: 'Scheduling Agent', tier: 'multi_track' },
    ],
    features: [
      { text: 'Message Aura (Text) - keyboard input, no dependencies required', tier: 'core' },
      { text: 'Intelligent customer triage and routing', tier: 'single_point' },
      { text: 'Talk to Aura (Voice) - microphone/speaker, requires ElevenLabs + Twilio', tier: 'single_point' },
      { text: 'Voice Reminders for appointments - requires ElevenLabs + Twilio', tier: 'single_point' },
      { text: 'Answer questions using your Knowledge Base', tier: 'single_point' },
      { text: 'Automated follow-up sequences via Email/SMS', tier: 'single_point' },
      { text: 'Review collection and Google/Yelp/Facebook integration', tier: 'single_point' },
      { text: 'Service catalog display with pricing', tier: 'single_point' },
      { text: 'Business hours display', tier: 'single_point' },
      { text: 'Call to Book (phone dialer for scheduling)', tier: 'single_point' },
      { text: 'Online appointment booking via AI chat', tier: 'multi_track' },
      { text: 'Appointment tracking and status updates', tier: 'multi_track' },
      { text: 'Instant quote requests', tier: 'multi_track' },
      { text: 'Invoice viewing and billing status', tier: 'multi_track' },
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
    requiredTier: 'multi_track',
    tabs: ['Accept Job', 'Get Directions', 'Mark En Route', 'Update ETA', 'Arrive & Start', 'Complete Job', 'Generate Quote', 'Generate Invoice', 'Contact Dispatch'],
    agents: [
      { name: 'Dispatch Agent', tier: 'multi_track' },
      { name: 'Route Agent', tier: 'multi_track' },
      { name: 'ETA Agent', tier: 'multi_track' },
      { name: 'Check-in Agent', tier: 'multi_track' },
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
    description: 'Comprehensive business management console with AI-powered quoting, invoicing, lead management, inventory tracking, and warranty administration.',
    requiredTier: 'command',
    tabs: ['Quote', 'Invoice', 'Lead', 'Appointments', 'Inventory', 'Companies', 'Employees', 'Customers'],
    agents: [
      { name: 'Admin Agent', tier: 'command' },
      { name: 'Quoting Agent', tier: 'multi_track' },
      { name: 'Invoice Agent', tier: 'multi_track' },
      { name: 'Inventory Agent', tier: 'command' },
    ],
    features: [
      { text: 'Create and send professional quotes', tier: 'multi_track' },
      { text: 'Generate and track invoices with payment status', tier: 'multi_track' },
      { text: 'Service catalog with pricing management', tier: 'multi_track' },
      { text: 'Lead capture and pipeline management', tier: 'command' },
      { text: 'Appointment scheduling and calendar management', tier: 'command' },
      { text: 'Inventory tracking with stock levels', tier: 'command' },
      { text: 'Reorder alerts and supplier management', tier: 'command' },
      { text: 'Warranty claims and policy tracking', tier: 'command' },
      { text: 'Multi-company management (Platform Admin)', tier: 'command' },
      { text: 'Employee management and job assignments', tier: 'command' },
      { text: 'Customer database with service history', tier: 'command' },
    ],
    useCases: [
      '"Create a quote for HVAC installation"',
      '"Generate an invoice for John Smith\'s repair"',
      '"Add a new lead from the website"',
      '"Schedule an appointment for next Tuesday"',
      '"Check inventory levels for air filters"',
      '"Process warranty claim for order #12345"',
      '"Add a new employee to the team"',
      '"View customer service history"',
    ],
  },
  {
    id: 'marketing_sales',
    title: 'Outreach & Sales Ops',
    icon: Megaphone,
    description: 'AI-powered marketing automation with campaign management, customer segmentation, promotional tools, and lead nurturing.',
    requiredTier: 'command',
    tabs: ['Campaign', 'Leads', 'Marketing'],
    agents: [
      { name: 'Campaign Agent', tier: 'command' },
      { name: 'Lead Agent', tier: 'command' },
      { name: 'Marketing Agent', tier: 'command' },
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
    title: 'Social Media & Web Presence',
    icon: Share2,
    description: 'AI-powered social media signal management, content engine, and web presence with content creation for 6 platforms, scheduling, visual content calendar, and website management.',
    requiredTier: 'command',
    tabs: ['Home', 'Social Posts', 'Content Engine', 'Web Presence', 'Blog'],
    agents: [
      { name: 'Social Media Signal Agent', tier: 'command' },
      { name: 'Signal Scheduler', tier: 'command' },
      { name: 'Signal Analytics', tier: 'command' },
      { name: 'Creative Agent', tier: 'command' },
      { name: 'Web Presence Agent', tier: 'command' },
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
      { text: 'Content Engine for multi-channel generation (Social, Blog, Email, SMS, Website)' },
      { text: 'Web Presence Manager with AI-powered website and blog' },
      { text: 'Auto-publish blog posts from Content Engine' },
      { text: 'SEO optimization for all pages and posts' },
      { text: 'Custom domain support and SSL management' },
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
    id: 'analytics_reports',
    title: 'Analytics & Reports',
    icon: BarChart3,
    description: 'Advanced analytics console with 8 specialized tabs for comprehensive business intelligence, forecasting, and multi-format report export.',
    requiredTier: 'command',
    tabs: ['Performance', 'Revenue', 'Insights', 'Forecast', 'KPIs', 'Social', 'Reminders', 'Export'],
    agents: [
      { name: 'Insights Agent', tier: 'command' },
      { name: 'Performance Agent', tier: 'command' },
      { name: 'Revenue Agent', tier: 'command' },
      { name: 'Forecast Agent', tier: 'command' },
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
];

// Get consoles available for a specific tier
export function getConsolesForTier(tier: SubscriptionTier): ConsoleHelpConfig[] {
  const tierHierarchy: Record<SubscriptionTier, number> = {
    free: 0,
    express: 1,
    aura_flow: 2,
    halo: 3,
    core: 4,
    single_point: 5,
    multi_track: 6,
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
    express: 1,
    aura_flow: 2,
    halo: 3,
    core: 4,
    single_point: 5,
    multi_track: 6,
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
    express: 1,
    aura_flow: 2,
    halo: 3,
    core: 4,
    single_point: 5,
    multi_track: 6,
    command: 7,
  };
  
  const currentTierLevel = tierHierarchy[tier];
  
  return console.agents
    .filter(agent => tierHierarchy[agent.tier] <= currentTierLevel)
    .map(a => a.name);
}

// Tier descriptions for Help page - UPDATED FOR LAUNCH
export const TIER_HELP_DESCRIPTIONS: Record<SubscriptionTier, { title: string; description: string; highlights: string[] }> = {
  free: {
    title: 'Free Plan',
    description: 'Limited access to platform features.',
    highlights: [],
  },
  express: {
    title: 'Aura Express',
    description: 'AI Voice & Chat for restaurants with smart link sharing.',
    highlights: [
      'Message Aura (Text) - AI chat for customer inquiries',
      'Talk to Aura (Voice) - AI voice interactions',
      'Smart Link Sharing - share menu, ordering, website links',
      'Perfect for restaurants, cafes, and food service',
      'No AI automation agents (voice/chat only)',
      'Requires ElevenLabs + Twilio integrations',
    ],
  },
  aura_flow: {
    title: 'Aura Flow',
    description: 'AI voice, chat, and scheduling with calendar sync for service businesses.',
    highlights: [
      'AI Receptionist for 24/7 customer engagement',
      'Message Aura (Text) + Talk to Aura (Voice)',
      'Smart Link Sharing',
      'Scheduling Agent with direct calendar sync',
      'Follow-up Agent (SMS + Email reminders)',
      'Knowledge Base for FAQs',
      'No customer portal - calendar sync only',
      'Perfect for service businesses needing automated booking',
    ],
  },
  core: {
    title: 'Aura Core',
    description: 'Entry-level plan with Message Aura (Text), Social Media Signal, and Web Presence.',
    highlights: [
      'Message Aura (Text) - customers type, AI responds in text',
      'No voice features - text chat only (no ElevenLabs/Twilio needed)',
      'Social Media Signal (6 platforms)',
      'Web Presence (1pg)',
      '2 Employee Accounts',
      'No AI agents included',
    ],
  },
  halo: {
    title: 'Aura Halo',
    description: 'Perfect for salons, spas, and wellness businesses with AI scheduling and voice.',
    highlights: [
      'AI Receptionist for 24/7 customer engagement',
      'Scheduling Agent for online booking',
      'Follow-up Agent for SMS/Email confirmations',
      'Message Aura (Text) + Talk to Aura (Voice)',
      'Customer Portal Console',
      'Designed for nail salons, hair salons, barbers, massage centers',
    ],
  },
  single_point: {
    title: 'Aura Single-Point',
    description: 'Perfect for businesses focused on lead intake and reputation management.',
    highlights: [
      'Message Aura (Text) + Talk to Aura (Voice)',
      'AI Receptionist for 24/7 customer engagement',
      'Automated follow-up sequences (Email, SMS, Voice)',
      'Review collection with Google/Yelp/Facebook integration',
      'Talk to Aura (Voice) - speech via microphone/speakers (requires ElevenLabs + Twilio)',
      'Voice Reminders for appointments (requires ElevenLabs + Twilio)',
      'Knowledge Base for intelligent responses',
      'Call to Book (no online scheduling)',
      'Up to 5 employees',
    ],
  },
  multi_track: {
    title: 'Aura Multi-Track',
    description: 'Ideal for businesses with field operations and service scheduling needs.',
    highlights: [
      'Everything in Single-Point',
      'Online appointment booking via AI',
      'Field Operations console for technicians',
      'Smart dispatch and job assignment',
      'Real-time GPS routing and navigation',
      'Customer ETA notifications',
      'Quoting and invoicing from the field',
      'Appointment tracking and reminders',
      'Up to 10 employees',
    ],
  },
  command: {
    title: 'Aura Pro Command',
    description: 'Enterprise automation with full 24-operative suite for 15+ technicians or multi-location.',
    highlights: [
      'Everything in Multi-Track',
      'All 24 AI Operatives',
      'All 7 Consoles',
      'Business Operations console',
      'Outreach & Sales Ops automation',
      'Social Media Signal Ops (6 platforms)',
      'Analytics & Reports (8 tabs)',
      'Inventory management with reorder alerts',
      'Warranty claims tracking',
      'Multi-location support',
      'White-label branding',
      '25 Employee Accounts',
      '$5,997/mo (Custom implementation)',
    ],
  },
};

// Platform feature highlights for quick reference
export const PLATFORM_HIGHLIGHTS = {
  aiChatWidget: {
    title: 'Message Aura (Text)',
    description: 'Text-based chat interface using keyboard input - no external dependencies required',
    tiers: ['core', 'single_point', 'multi_track', 'command'] as SubscriptionTier[],
  },
  aiVoice: {
    title: 'Talk to Aura (Voice)',
    description: 'Speech-to-speech conversations via microphone/speakers - requires ElevenLabs + Twilio',
    tiers: ['single_point', 'multi_track', 'command'] as SubscriptionTier[],
  },
  askAura: {
    title: 'Ask Aura',
    description: 'Internal staff-only voice navigation for hands-free dashboard control',
    tiers: ['single_point', 'multi_track', 'command'] as SubscriptionTier[],
  },
  knowledgeBase: {
    title: 'Knowledge Base',
    description: 'Train your AI with services, FAQs, and documents',
    tiers: ['single_point', 'multi_track', 'command'] as SubscriptionTier[],
  },
  onlineBooking: {
    title: 'Online Booking',
    description: 'AI-powered appointment scheduling',
    tiers: ['multi_track', 'command'] as SubscriptionTier[],
  },
  fieldOps: {
    title: 'Field Operations',
    description: 'Mobile console for technicians',
    tiers: ['multi_track', 'command'] as SubscriptionTier[],
  },
  analytics: {
    title: 'Analytics & Reports',
    description: 'Business intelligence and forecasting',
    tiers: ['command'] as SubscriptionTier[],
  },
  socialMedia: {
    title: 'Social Media Ops',
    description: 'AI content creation for 6 platforms',
    tiers: ['command'] as SubscriptionTier[],
  },
  marketing: {
    title: 'Outreach & Sales Ops',
    description: 'Campaigns, promos, and lead nurturing',
    tiers: ['command'] as SubscriptionTier[],
  },
};
