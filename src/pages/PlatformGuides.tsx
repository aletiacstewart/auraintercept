import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { PageContainer } from '@/components/ui/page-container';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { PDFDownloadLink } from '@react-pdf/renderer';
import PlatformDocumentPDF from '@/components/documentation/PlatformDocumentPDF';
import { ComprehensiveGuidesPDF } from '@/components/documentation/ComprehensiveGuidesPDF';
import { 
  Download, 
  BookOpen, 
  Bot, 
  Puzzle, 
  BarChart3,
  FileText,
  Truck,
  Briefcase,
  Megaphone,
  CheckCircle2,
  Lightbulb,
  Clock,
  Globe,
  ExternalLink
} from 'lucide-react';
import { PageHeader } from '@/components/ui/page-header';

// Route mapping for interactive navigation
const NAVIGATION_ROUTES: Record<string, string> = {
  'Dashboard': '/dashboard',
  'AI Agents Hub': '/dashboard/ai-operatives-hub',
  'AI Operatives Hub': '/dashboard/ai-operatives-hub',
  'Knowledge Base': '/dashboard/knowledge',
  'Appointments': '/dashboard/appointments',
  'Calendar': '/dashboard/calendar',
  'Customers': '/dashboard/customers',
  'Employees': '/dashboard/employees',
  'Quotes': '/dashboard/quotes',
  'Invoices': '/dashboard/invoices',
  'Settings': '/dashboard/settings',
  'Help': '/dashboard/help',
  'Integrations': '/dashboard/settings/integrations',
  'Integrations → Voice Agent': '/dashboard/settings/integrations',
  'Integrations → SMS & Text': '/dashboard/settings/integrations',
  'Integrations → Calendar': '/dashboard/settings/integrations',
  'Integrations → Email': '/dashboard/settings/integrations',
  'Integrations → Payment Connections': '/dashboard/settings/integrations',
  'Integrations → Website Embed': '/dashboard/settings/integrations',
  'Integrations → AI Research': '/dashboard/settings/integrations',
  'Integrations → Social Media': '/dashboard/settings/integrations',
  'Field Operations': '/dashboard/ai-consoles/field-operations',
  'Field Operations Console': '/dashboard/ai-consoles/field-operations',
  'Business Management Console': '/dashboard/ai-consoles/business-mgt-ops',
  'Business Ops Console': '/dashboard/ai-consoles/business-mgt-ops',
  'Business Operations Console': '/dashboard/ai-consoles/business-mgt-ops',
  'Outreach & Sales Console': '/dashboard/ai-consoles/outreach-sales',
  'Outreach & Sales Ops Console': '/dashboard/ai-consoles/outreach-sales',
  'Marketing Console': '/dashboard/ai-consoles/outreach-sales',
  'Social Media Console': '/dashboard/ai-consoles/social-media',
  'Analytics & Reports': '/dashboard/ai-consoles/analytics-reports',
  'Analytics & Reports Console': '/dashboard/ai-consoles/analytics-reports',
  'Analytics Console': '/dashboard/ai-consoles/analytics-reports',
  'Customer Portal Console': '/dashboard/ai-consoles/customer-portal',
  'Customer Portal': '/dashboard/ai-consoles/customer-portal',
  'Creative & Web Presence': '/dashboard/ai-consoles/creative-web',
  'Creative & Web Presence Console': '/dashboard/ai-consoles/creative-web',
  'Creative Console': '/dashboard/ai-consoles/creative-web',
  'Knowledge Base → Services': '/dashboard/knowledge',
  'Knowledge Base → FAQs': '/dashboard/knowledge',
  'Knowledge Base → Hours': '/dashboard/knowledge',
  'Knowledge Base → Documents': '/dashboard/knowledge',
  'Knowledge Base → Inventory': '/dashboard/knowledge',
  'Settings → Branding': '/dashboard/settings',
  'Settings → Email Templates': '/dashboard/settings',
  'Settings → Role Permissions': '/dashboard/settings',
  'Settings → Digests': '/dashboard/settings',
  'Settings → Subscription': '/dashboard/subscription',
  'Settings → Missed Calls': '/dashboard/settings',
  'Platform Resources → AI Agent Guide': '/dashboard/ai-agent-guide',
  'AI Agent Guide': '/dashboard/ai-agent-guide',
  'Platform Guides': '/dashboard/platform-guides',
  'Quick Setup': '/dashboard/quick-setup',
  'Dashboard → DashboardSetupNav': '/dashboard',
  '/auth': '/auth',
  '/customer-portal': '/customer-portal',
  '/technician': '/technician',
};


const guideCategories = [
  {
    id: 'getting-started',
    title: 'Getting Started',
    icon: BookOpen,
    featureColor: 'feature-overview',
    guides: [
      {
        title: 'Platform Overview',
        duration: '5 min',
        steps: [
          'Log in to your admin dashboard at /auth',
          'Explore the main navigation sidebar on the left',
          'Review your subscription tier in the bottom left (Aura Core, Boost, Pro, or Elite)',
          'Navigate to Dashboard for company overview and KPIs',
          'Check the DashboardSetupNav bar for Quick Setup progress'
        ],
        tips: ['Bookmark the dashboard URL for quick access', 'Use Ask Aura voice navigation with Ctrl+Shift+V']
      },
      {
        title: 'Quick Setup Wizard',
        duration: '15 min',
        steps: [
          'Access Quick Setup from Dashboard → DashboardSetupNav bar',
          'Complete company branding (logo, colors) in Settings → Branding',
          'Configure business hours in Knowledge Base → Hours',
          'Add your services catalog in Knowledge Base → Services',
          'Set up FAQs for AI agent accuracy in Knowledge Base → FAQs',
          'Create employee accounts with job type assignments'
        ],
        tips: ['Track progress in the DashboardSetupNav progress bars', 'Complete all required items before going live']
      },
      {
        title: 'Subscription Tiers',
        duration: '10 min',
        steps: [
          'Aura Core ($697/mo): 8 AI Agents — Receptionist, Booking, Follow-Up, Review, Creative Content, Web Presence, Lead, Marketing',
          'Aura Boost ($1,097/mo): 12 AI Agents — All Core + Dispatch, Route, ETA, Check-In',
          'Aura Pro ($1,997/mo): 16 AI Agents — All Boost + Campaign, Outreach, Social Scheduler Agent, Social Analytics',
          'Aura Elite ($3,497/mo): All 24 AI Agents + 7 Consoles + AI Hub + Advanced Analytics & Forecasting',
          'Employee limits: 10 (Core), 25 (Boost), 50 (Pro), Unlimited (Elite)',
          'Industry Specialist Agents (Diagnostic, Permit, Site Survey, Insurance Claim) auto-activate on Pro and Elite based on selected industry',
          'All tiers include API Access and Chat Widget'
        ],
        tips: ['Trial users get full Elite tier access', 'Annual billing = 10x monthly rate']
      },
      {
        title: 'User Roles & Permissions',
        duration: '8 min',
        steps: [
          'Platform Admin: Full system access across all companies',
          'Company Admin: Full access to their company features',
          'Manager: Operations management without system settings',
          'Dispatch: Field operations and technician management',
          'Technician: Mobile app access for field jobs',
          'Configure permissions per role in Settings → Role Permissions'
        ],
        tips: ['Follow principle of least privilege', 'Use job type assignments for specialized access']
      },
      {
        title: 'Customer Portal Setup',
        duration: '8 min',
        steps: [
          'Customers access portal at /customer-portal or via embedded widget',
          'Core: AI Assistant, Services, Contact, Hours tabs',
          'Boost+: Full suite with Appointments, Voice AI, Contact, Hours tabs',
          'Portal supports multi-company access for customers',
          'Talk to Aura (Voice) included for Core+ tiers',
          'Configure widget embed code in Integrations → Website Embed'
        ],
        tips: ['Widget works on WordPress, Wix, and any HTML site', 'Customers can manage preferences per company']
      },
      {
        title: '7 Control Centers + AI Operatives Hub',
        duration: '12 min',
        steps: [
          '1. Customer Portal: AI-powered customer engagement (Core+)',
          '2. Field Operations: GPS dispatch, routing, job management (Boost+)',
          '3. Business Operations: Quoting, invoicing, inventory (Elite)',
          '4. Outreach & Sales Ops: Campaigns, leads, marketing (Pro+)',
          '5. Social Media Ops: 6-platform content creation and scheduling (Pro+)',
          '6. Creative & Web Presence: Content Engine, website, blog, SEO (Core+)',
          '7. Analytics & Reports: KPIs, forecasting, exports (Elite)',
          'AI Operatives Hub: Central agent management interface (Elite only, not a console)',
          'Each console manages specific AI operatives',
          'Access consoles via sidebar navigation'
        ],
        tips: ['Consoles unlock based on subscription tier', 'Start with Customer Portal for immediate impact']
      }
    ]
  },
  {
    id: 'ai-agents',
    title: 'AI Agents',
    icon: Bot,
    featureColor: 'feature-config',
    guides: [
      {
        title: 'AI Operatives Overview (24 Agents)',
        duration: '15 min',
        steps: [
          'The platform includes 24 AI Operatives organized into functional groups:',
          '1. Customer Portal Stack (Core): AI Receptionist, Booking, Follow-Up, Review',
          '2. Creative & Web Stack (Core): Creative Content, Web Presence, Lead, Marketing',
          '3. Field Ops Stack (Boost): Dispatch, Route, ETA, Check-In',
          '4. Outreach & Social Stack (Pro): Campaign, Outreach, Social Scheduler Agent, Social Analytics',
          '5. Business Ops Stack (Elite): Admin, Quoting, Invoice, Inventory',
          '6. Analytics Stack (Elite): Insights, Performance, Revenue, Forecast',
          'Agents unlock progressively as you upgrade tiers',
          'Each agent has specific dependencies and capabilities'
        ],
        tips: ['Start with AI Receptionist as your foundation', 'Dependencies must be enabled for agents to work together']
      },
      {
        title: 'AI Receptionist (Triage)',
        duration: '10 min',
        steps: [
          'Primary entry point for all customer interactions',
          'Collects customer name, phone, and intent before handoff',
          'Routes to specialized agents based on inquiry type',
          'Configure greeting in AI Agents Hub → AI Receptionist',
          'Works across Voice, SMS, Email, and Widget channels',
          'Available in all paid tiers (Core+)',
          'Uses Knowledge Base for FAQ responses'
        ],
        tips: ['AI Receptionist is required for all other customer-facing agents', 'Customize greeting for your brand voice']
      },
      {
        title: 'Booking Agent',
        duration: '10 min',
        steps: [
          'Enable in AI Agents Hub (requires Core+ tier)',
          'Checks business hours and employee availability automatically',
          'Presents available time slots to customers',
          'Creates confirmed appointments in the system',
          'Triggers calendar sync if Google Calendar connected',
          'Hands off to Dispatch/GPS Console for technician assignment',
          'Depends on AI Receptionist being enabled'
        ],
        tips: ['Ensure business hours are configured accurately', 'Set buffer times between appointments in Settings']
      },
      {
        title: 'Follow-up Agent',
        duration: '8 min',
        steps: [
          'Automated post-service check-ins via Email/SMS',
          'Sends appointment reminders (24h and 1h before)',
          'Handles confirmation and rescheduling requests',
          'Configure templates in Settings → Email Templates',
          'Set timing delays for post-service follow-up',
          'Requires Core+ tier',
          'Depends on AI Receptionist being enabled'
        ],
        tips: ['Customize reminder timing based on service type', 'Use personalization tokens in templates']
      },
      {
        title: 'Review Agent',
        duration: '8 min',
        steps: [
          'Collects customer ratings after service completion',
          'Routes satisfied customers to Google/Yelp/Facebook reviews',
          'Negative feedback routed internally before public review',
          'Configure review links in company settings',
          'Set timing delay (recommended: 2 hours after service)',
          'Requires Pro+ tier',
          'Depends on Follow-up Agent being enabled'
        ],
        tips: ['Ask immediately after positive service', 'Respond to all reviews promptly']
      },
      {
        title: 'Campaign Agent',
        duration: '10 min',
        steps: [
          'Creates and sends email/SMS marketing campaigns',
          'Target specific customer segments',
          'Schedule campaigns for optimal send times',
          'A/B test subject lines and content',
          'Track open rates and click-through',
          'Requires Pro+ tier',
          'Access via Outreach & Sales Ops Console'
        ],
        tips: ['Segment audiences for better engagement', 'Use AI content generation for copy']
      },
      {
        title: 'Lead Agent',
        duration: '8 min',
        steps: [
          'Qualifies and scores incoming leads',
          'Auto-qualification based on engagement signals',
          'Manages lead pipeline stages',
          'Triggers nurture sequences for cold leads',
          'Integrates with appointment booking',
          'Requires Pro+ tier',
          'Configure scoring thresholds in agent settings'
        ],
        tips: ['Define clear qualification criteria', 'Follow up quickly on hot leads']
      },
      {
        title: 'Marketing Agent',
        duration: '8 min',
        steps: [
          'Manages customer segments for targeting',
          'Creates and tracks promo codes',
          'Handles referral program rewards',
          'Win-back campaigns for inactive customers',
          'Discount management with expiration rules',
          'Requires Pro+ tier',
          'Works with Campaign Agent for distribution'
        ],
        tips: ['Use memorable promo codes', 'Set reasonable usage limits']
      },
      {
        title: 'Social Media Agents (3 Agents)',
        duration: '12 min',
        steps: [
          'Creative Content Agent: Creates posts for 6 platforms (IG, FB, LI, TT, GMB, SMS)',
          'Social Scheduler Agent: Queues and publishes at optimal times',
          'Social Analytics Agent: Tracks engagement across platforms',
          'All three require Pro+ tier',
          'Uses 3-step Content Wizard: Topic → Generate → Schedule',
          'Auto-adjusts content for platform character limits',
          'Access via Social Media Ops Console'
        ],
        tips: ['Consistent posting improves engagement', 'Let AI adapt content per platform']
      },
      {
        title: 'Creative Agent (Content Engine)',
        duration: '10 min',
        steps: [
          'Unified AI content generation hub',
          'Enter single topic to generate content for all channels',
          'Outputs: Social posts, Blog, Email, SMS, Website copy',
          'Uses Brand Voice from AI Content Profile',
          'Push content to Web Presence, Blog, or Campaigns',
          'Requires Pro+ tier',
          'Access via Creative & Web Presence Console'
        ],
        tips: ['Set up AI Content Profile first', 'Generate from one topic for consistent messaging']
      },
      {
        title: 'Web Presence Agent',
        duration: '8 min',
        steps: [
          'Manages AI-powered website and blog',
          'Auto-optimizes SEO for all pages',
          'Monitors site performance metrics',
          'Auto-publishes blog posts from Content Engine',
          'Handles custom domain setup',
          'Requires Core+ tier',
          'Depends on Creative Agent being enabled'
        ],
        tips: ['Connect custom domain for branding', 'Enable auto-publish for hands-off management']
      },
      {
        title: 'Field Operations Agents (4 Agents)',
        duration: '12 min',
        steps: [
          'Dispatch/GPS Console: Assigns technicians based on skills, zones, workload',
          'Route Agent: Optimizes travel routes with traffic awareness',
          'ETA Agent: Calculates arrival times, sends customer updates',
          'Check-in Agent: Tracks on-site status with photo documentation',
          'All four require Boost+ tier',
          'GPS tracking required on technician devices',
          'Access via Field Operations Console'
        ],
        tips: ['Use skill tags for intelligent dispatch', 'Enable GPS for accurate ETAs']
      },
      {
        title: 'Quoting & Invoice Agents',
        duration: '10 min',
        steps: [
          'Quoting Agent: Generates quotes from service catalog',
          'Invoice Agent: Creates invoices, tracks payments',
          'Both support multi-line items with AI descriptions',
          'Stripe integration for payment links',
          'Both require Boost+ tier',
          'Invoice Agent depends on Quoting Agent',
          'Access via Business Operations Console'
        ],
        tips: ['Link quotes to appointments', 'Payment links increase collection rate']
      },
      {
        title: 'Admin & Inventory Agents',
        duration: '8 min',
        steps: [
          'Admin Agent: Company settings, user management, access control',
          'Inventory Agent: Stock tracking, low-level alerts, reorder planning',
          'Both require Elite tier',
          'Inventory tracks parts usage per job',
          'Admin handles role-based permissions',
          'Access via Business Operations Console'
        ],
        tips: ['Regular inventory audits ensure accuracy', 'Set appropriate low-stock thresholds']
      },
      {
        title: 'Analytics Agents (4 Agents)',
        duration: '12 min',
        steps: [
          'Insights Agent: Natural language business queries',
          'Performance Agent: KPIs and operational metrics',
          'Revenue Agent: Financial trends and analysis (Elite only)',
          'Forecast Agent: Demand prediction and capacity planning (Elite only)',
          'Insights + Performance require Elite tier',
          'Revenue + Forecast require Elite tier',
          'Access via Analytics & Reports Console'
        ],
        tips: ['Use structured forms for consistent reports', 'Forecasts help with staffing decisions']
      },
      {
        title: 'Talk to Aura (Voice)',
        duration: '8 min',
        steps: [
          'Voice interaction powered by ElevenLabs',
          'Customers speak naturally with AI agents',
          'Supports inbound and outbound calls',
          'Configure voice settings in Integrations',
          'Voice cloning available for brand voice',
          'Real-time transcription in console',
          'Requires ElevenLabs + SignalWire integrations'
        ],
        tips: ['Choose voice matching your brand personality', 'Test voice interactions before going live']
      },
      {
        title: 'AI Agent Dependencies',
        duration: '10 min',
        steps: [
          'AI Receptionist (triage) is the root dependency for customer-facing agents',
          'Booking Agent requires AI Receptionist',
          'Follow-up Agent requires AI Receptionist',
          'Review Agent requires Follow-up Agent',
          'Dispatch/GPS Console is root for field operations',
          'Route, ETA, Check-in agents require Dispatch',
          'Web Presence Agent requires Creative Agent',
          'Invoice Agent requires Quoting Agent',
          'Enable dependencies first before dependent agents'
        ],
        tips: ['Use dependency graph in AI Operatives Hub', 'Locked agents show required dependencies']
      }
    ]
  },
  {
    id: 'control-centers',
    title: 'Control Centers',
    icon: Briefcase,
    featureColor: 'feature-platform',
    guides: [
      {
        title: 'Customer Portal Console',
        duration: '10 min',
        steps: [
          'Navigate to Customer Portal Console from sidebar',
          'Tabs: AI Assistant, Services, Appointments (tier-aware), Voice AI (if enabled), Contact, Hours',
          'AI Assistant tab: Chat with Aura AI for help, booking, tracking',
          'Services tab: Browse available service catalog',
          'Appointments tab: View and manage upcoming appointments',
          'Voice AI tab: Talk to Aura via voice (requires ElevenLabs)',
          'Contact tab: Phone, email, and address with clickable links',
          'Hours tab: Business operating hours display',
          'Agents: AI Receptionist, Scheduling, Follow-up, Review'
        ],
        tips: ['Configure widget in Integrations for website embedding', 'Monitor feedback for service improvements']
      },
      {
        title: 'Field Operations Console',
        duration: '12 min',
        steps: [
          'Navigate to Field Operations from sidebar (Boost+ tier)',
          'Quick Action Tabs: Map View, Schedule, Dispatch, Check-in',
          'Map View: Real-time technician GPS locations',
          'Dispatch tab: Job assignment and technician routing',
          'Schedule tab: Daily/weekly planning view',
          'Check-in tab: On-site status monitoring',
          'Agents: Dispatch, Route, ETA, Check-in'
        ],
        tips: ['Map View ideal for dispatchers', 'Use skill tags for intelligent matching']
      },
      {
        title: 'Business Operations Console',
        duration: '10 min',
        steps: [
          'Navigate to Business Management Console from sidebar',
          'Tabs: Aura Live, Quote, Invoice, Lead, Appts, Inventory, Companies, Employees, Customers',
          'Aura Live: Real-time activity monitoring',
          'Quote/Invoice: AI-powered document generation',
          'Lead: Pipeline and qualification management',
          'Inventory: Stock levels and reorder alerts (Command)',
          'Agents: Admin, Quoting, Invoice, Inventory'
        ],
        tips: ['Use Aura Live for real-time visibility', 'Quote Forge saves time on complex quotes']
      },
      {
        title: 'Outreach & Sales Ops Console',
        duration: '10 min',
        steps: [
          'Navigate to Outreach & Sales Ops from sidebar (Pro+ tier)',
          'Tabs: Campaign, Leads, Marketing',
          'Campaign: Create and manage email/SMS campaigns',
          'Leads: Pipeline management and scoring',
          'Marketing: Segments, promos, referrals, win-back',
          'Agents: Campaign, Lead, Marketing'
        ],
        tips: ['Segment audiences for personalization', 'A/B test campaigns for better results']
      },
      {
        title: 'Social Media Ops Console',
        duration: '10 min',
        steps: [
          'Navigate to Social Media Ops from sidebar (Pro+ tier)',
          'Tabs: Home, Create Content, My Posts',
          'Home: AI Chat with Creative Content agent for guidance',
          'Create Content: MultiChannelGenerator with AI Suggest topics, Industry Templates, and Manual Bridge posting',
          'My Posts: SocialFeedQueue showing all drafts and published content',
          'Agents: Creative Content, Social Scheduler Agent, Social Analytics',
          'Supports: Instagram, Facebook, LinkedIn, TikTok, GMB, SMS'
        ],
        tips: ['Use AI Suggest for topic inspiration', 'Manual Bridge lets you post without API setup']
      },
      {
        title: 'Creative & Web Presence Console',
        duration: '12 min',
        steps: [
          'Navigate to Creative & Web Presence from sidebar (Core+ tier)',
          'Tabs: Content Engine, Brand Voice, Generate, Dashboard, Calendar, Web Presence, Blog, SEO',
          'Content Engine: Multi-channel content generation',
          'Brand Voice: Configure your brand personality',
          'Web Presence: AI website builder',
          'Blog: Manage and publish articles',
          'SEO: Site optimization and performance',
          'Agents: Creative Agent, Web Presence Agent'
        ],
        tips: ['Set Brand Voice first for consistent content', 'Push content to website with one click']
      },
      {
        title: 'Analytics & Reports Console',
        duration: '10 min',
        steps: [
          'Navigate to Analytics & Reports from sidebar (Elite tier)',
          'Tabs: Performance, Revenue, Insights, Forecast, KPIs, Social, Reminders, Export',
          'Performance: Operational metrics and trends',
          'Revenue: Financial analysis (Command for full features)',
          'Forecast: Demand prediction (Elite only)',
          'Export: CSV and PDF report generation',
          'Agents: Insights, Performance, Revenue, Forecast'
        ],
        tips: ['Weekly reviews catch issues early', 'Use forecasts for capacity planning']
      },
      {
        title: 'AI Operatives Hub',
        duration: '15 min',
        steps: [
          'Navigate to AI Operatives Hub from sidebar (Elite tier only)',
          'Tabs: Operatives, Quick Start, Monitor, Analytics, History',
          'Operatives: Individual agent management with toggle enable/disable',
          'Quick Start: Batch activation and dependency visualization',
          'Monitor: Real-time event streaming from all agents',
          'Analytics: Performance metrics (requests, success rate, handoffs)',
          'History: Searchable conversation browser',
          'Central management for all 24 AI Operatives'
        ],
        tips: ['Use Quick Start for rapid deployment', 'Monitor tab shows live agent activity']
      }
    ]
  },
  {
    id: 'integrations',
    title: 'Integrations',
    icon: Puzzle,
    featureColor: 'feature-integrations',
    guides: [
      {
        title: 'SignalWire Voice & SMS',
        duration: '15 min',
        steps: [
          'Navigate to Integrations → Voice Agent or SMS & Text',
          'Create SignalWire account at signalwire.com',
          'Obtain Project ID and API Token from SignalWire Dashboard',
          'Note your Space URL (e.g., yourspace.signalwire.com)',
          'Purchase a phone number with Voice and SMS capabilities',
          'Enter credentials in the integration settings',
          'Configure LaML webhook URLs for call and message handling',
          'Test with your own phone number'
        ],
        tips: ['Use a local number for better answer rates', 'Keep SMS under 160 characters for single message']
      },
      {
        title: 'Phone Number Setup (4 Options)',
        duration: '10 min',
        steps: [
          'Option 1 — Conditional Call Forwarding (CFNA): Your phone rings first, unanswered calls forward to AI',
          'Dial carrier-specific codes: AT&T (*61*), Verizon (*71), T-Mobile (**61*)',
          'Option 2 — Port Number to SignalWire: Transfer your number for full control (7-14 business days)',
          'Option 3 — Unconditional Forwarding: All calls go to AI immediately (*21* for AT&T, *72 for Verizon)',
          'Option 4 — Use New AI Number: Update Google Business, Yelp, website with your SignalWire number',
          'Configure in Settings → Missed Calls → "How is your number connected?"',
          'System auto-sets routing mode based on your choice (AI Direct for forwarding, Ring First for ported)',
          'Deactivation codes included for each carrier to reverse forwarding'
        ],
        tips: ['Conditional Forwarding is the most popular — no number change required', 'Test forwarding by calling your number and letting it ring', 'Update Google Business Profile first for maximum impact']
      },
      {
        title: 'ElevenLabs Voice Setup',
        duration: '12 min',
        steps: [
          'Navigate to Integrations → Voice Agent → TTS Settings',
          'Create ElevenLabs account at elevenlabs.io',
          'Generate API key from ElevenLabs dashboard',
          'Enter API key in Voice Integration settings',
          'Select a pre-built voice or clone your own',
          'Adjust stability and clarity settings',
          'Test voice output with sample greeting'
        ],
        tips: ['Higher stability = more consistent voice', 'Use voice cloning for personalized brand voice']
      },
      {
        title: 'Resend Email Integration',
        duration: '12 min',
        steps: [
          'Navigate to Integrations → Email',
          'Create Resend account at resend.com',
          'Verify your sending domain with DNS records',
          'Obtain Resend API key',
          'Enter API key in Email settings',
          'Configure email templates in Settings',
          'Send test email to verify setup'
        ],
        tips: ['Use subdomain for sending (mail.yourcompany.com)', 'Set up SPF and DKIM for deliverability']
      },
      {
        title: 'Google Calendar Sync',
        duration: '10 min',
        steps: [
          'Navigate to Integrations → Calendar',
          'Click Connect Google Calendar button',
          'Sign in with your Google account',
          'Grant calendar read/write permissions',
          'Select calendar to sync appointments',
          'Enable two-way sync for updates',
          'Verify appointments appear in Google Calendar'
        ],
        tips: ['Use dedicated business calendar', 'Sync employee calendars for availability']
      },
      {
        title: 'iCal / CalDAV Calendar Sync',
        duration: '10 min',
        steps: [
          'Navigate to Integrations → Calendar',
          'Select iCal/CalDAV option for non-Google calendars',
          'Supports Apple Calendar, Outlook, and any iCal-compatible calendar',
          'Copy the unique calendar feed URL generated for your account',
          'Paste URL into your calendar app as a subscription',
          'Appointments sync automatically (read-only from external calendars)',
          'Use for viewing appointments in your preferred calendar app'
        ],
        tips: ['iCal is read-only; use Google Calendar for two-way sync', 'Share feed URL with team for visibility']
      },
      {
        title: 'Stripe Payments',
        duration: '15 min',
        steps: [
          'Navigate to Integrations → Payment Connections',
          'Click Connect Stripe Account',
          'Create or link existing Stripe account',
          'Complete Stripe verification requirements',
          'Enable payment links on invoices',
          'Configure payment notifications',
          'Test with a small transaction'
        ],
        tips: ['Stripe handles all PCI compliance', 'Payment links work on any device']
      },
      {
        title: 'Social Media Integration',
        duration: '15 min',
        steps: [
          'Navigate to Social Media Ops → Settings (Pro+ tier)',
          'Connect social accounts via OAuth for each platform',
          'Supported platforms: Instagram, Facebook, LinkedIn, TikTok, GMB, SMS',
          'Grant posting permissions when prompted',
          'Configure brand voice and default hashtags',
          'Set up content approval workflow if needed',
          'Test with a draft post before scheduling'
        ],
        tips: ['Connect business accounts, not personal', 'Each platform requires separate OAuth authorization']
      },
      {
        title: 'Website Widget Embed',
        duration: '10 min',
        steps: [
          'Navigate to Integrations → Website Embed',
          'Choose embed method (JavaScript or iframe)',
          'Copy embed code for your method',
          'Paste into your website (WordPress, Wix, Squarespace)',
          'Customize widget position and colors',
          'Test on live website',
          'Verify messages reach your dashboard'
        ],
        tips: ['Iframe works on most website builders', 'Test on mobile devices too']
      },
      {
        title: 'Tavily AI Research',
        duration: '8 min',
        steps: [
          'Navigate to Integrations → AI Research',
          'Optional integration for enhanced content research',
          'Create Tavily account at tavily.com',
          'Generate and enter API key',
          'Content Engine uses Tavily for real-time research',
          'Improves accuracy of AI-generated content',
          'Available for Core+ tiers'
        ],
        tips: ['Optional enhancement for content quality', 'Useful for industry-specific content']
      }
    ]
  },
  {
    id: 'creative-web-presence',
    title: 'Creative & Web Presence',
    icon: Globe,
    featureColor: 'feature-marketing',
    guides: [
      {
        title: 'Creative & Web Presence Console',
        duration: '12 min',
        steps: [
          'Navigate to Creative & Web Presence from sidebar (Core+ tier)',
          'Tabs: Content Engine, Brand Voice, Generate, Dashboard, Calendar, Web Presence, Blog, SEO',
          'Content Engine: Multi-channel content generation hub',
          'Brand Voice: Configure your brand personality for AI',
          'Web Presence: AI-powered website builder',
          'Blog: Manage and publish articles',
          'SEO: Site optimization and performance monitoring',
          'Agents: Creative Agent, Web Presence Agent'
        ],
        tips: ['Set Brand Voice first for consistent content', 'Use Content Engine for multi-channel campaigns']
      },
      {
        title: 'Content Engine Overview',
        duration: '10 min',
        steps: [
          'Access Content Engine tab in Creative & Web Presence Console',
          'Enter a single topic or theme for content generation',
          'AI generates content for all channels: Social, Blog, Email, SMS, Website',
          'Content automatically uses your Brand Voice settings',
          'Preview and edit generated content before saving',
          'Push content directly to Web Presence, Blog, or Campaigns',
          'View content history in Dashboard tab'
        ],
        tips: ['One topic = consistent messaging across all channels', 'Edit AI content to add specific details']
      },
      {
        title: 'Brand Voice Configuration',
        duration: '8 min',
        steps: [
          'Navigate to Brand Voice tab in Creative & Web Presence Console',
          'Set your primary industry and business type',
          'Define your target audience demographics',
          'Choose brand tone: Professional, Friendly, Technical, Casual',
          'Add unique selling points for AI context',
          'Set keywords to include and topics to avoid',
          'All AI content uses these settings automatically'
        ],
        tips: ['Specific voice settings improve content quality', 'Update regularly as your brand evolves']
      },
      {
        title: 'Multi-Channel Content Generation',
        duration: '12 min',
        steps: [
          'Go to Generate tab in Content Engine',
          'Enter your topic (e.g., "Summer HVAC maintenance tips")',
          'Select channels: Social, Blog, Email, SMS, Website',
          'AI generates platform-specific content for each',
          'Social: 6 platform-optimized posts',
          'Blog: Full article with headings and SEO',
          'Email: Campaign-ready HTML template',
          'SMS: 160-character message',
          'Website: Hero copy, about section, CTAs',
          'Review and approve each piece before publishing'
        ],
        tips: ['Generate all channels at once for campaign consistency', 'Use Dashboard to track generated content']
      },
      {
        title: 'Web Presence Manager',
        duration: '10 min',
        steps: [
          'Navigate to Web Presence tab in Creative Console',
          'AI-powered website builder with drag-and-drop sections',
          'Edit hero section: headline, subheadline, CTA button',
          'Manage about section, services, and testimonials',
          'Push website content from Content Engine',
          'Configure custom domain (Core+ tier)',
          'Preview changes before publishing'
        ],
        tips: ['Use Push to Web Presence for quick updates', 'Keep hero section focused on your main offer']
      },
      {
        title: 'Blog Management',
        duration: '10 min',
        steps: [
          'Navigate to Blog tab in Creative Console',
          'View and manage all blog posts',
          'Create new posts manually or from Content Engine',
          'Edit title, content, featured image, and excerpt',
          'Set publish date for scheduling',
          'Enable auto-publish from Content Engine',
          'Web Presence Agent optimizes SEO automatically'
        ],
        tips: ['Consistent blogging improves SEO rankings', 'Use Content Engine for topic ideas']
      },
      {
        title: 'SEO Optimization',
        duration: '8 min',
        steps: [
          'Navigate to SEO tab in Creative Console',
          'Run SEO scan on your website',
          'View optimization recommendations',
          'Check page speed and performance metrics',
          'Monitor search engine visibility',
          'Configure scan frequency (Daily/Weekly/Monthly)',
          'Web Presence Agent applies fixes automatically'
        ],
        tips: ['Run scans after major content updates', 'Address high-priority issues first']
      },
      {
        title: 'Content Calendar',
        duration: '8 min',
        steps: [
          'Navigate to Calendar tab in Creative Console',
          'View scheduled content across all channels',
          'Monthly view shows posts, blogs, and campaigns',
          'Click any item to edit or reschedule',
          'Color-coded by channel type',
          'Drag and drop to reschedule',
          'Plan content weeks in advance'
        ],
        tips: ['Visualize content gaps in your schedule', 'Balance content across channels']
      }
    ]
  },
  {
    id: 'operations',
    title: 'Operations',
    icon: Truck,
    featureColor: 'feature-fieldops',
    guides: [
      {
        title: 'Field Operations Console',
        duration: '12 min',
        steps: [
          'Navigate to Field Operations from sidebar (Boost+ tier)',
          'Use Quick Action Tabs: Map View, Schedule, Dispatch, Check-in',
          'Map View shows real-time technician GPS locations',
          'Dispatch tab for job assignment and routing',
          'Schedule tab for daily/weekly planning',
          'Check-in tab for on-site status monitoring'
        ],
        tips: ['Map View ideal for dispatchers', 'Schedule View better for daily planning']
      },
      {
        title: 'Managing Appointments',
        duration: '10 min',
        steps: [
          'Navigate to Appointments from sidebar',
          'Toggle between Calendar and List view',
          'Click appointment for details and actions',
          'Use filters by status, technician, or date range',
          'Assign or reassign technicians as needed',
          'Send reminders via Email/SMS',
          'Update status as appointments progress'
        ],
        tips: ['Color coding indicates appointment status', 'Set up 24h and 1h automatic reminders']
      },
      {
        title: 'Technician Mobile App',
        duration: '8 min',
        steps: [
          'Technicians access app at /technician on mobile browser',
          'Click Install App banner for PWA installation',
          'Add to home screen for native app experience',
          'Log in with technician credentials',
          'View assigned jobs in Jobs tab',
          'Check in/out with status updates and photos',
          'Use Get Directions for navigation'
        ],
        tips: ['PWA works offline for basic features', 'Enable location services for accurate ETAs']
      },
      {
        title: 'Technician Check-In Process',
        duration: '8 min',
        steps: [
          'Technician taps Check-In button on job card',
          'Select status: En Route, On Site, or Completed',
          'Upload before photos when arriving on site',
          'Customer receives automatic status notification',
          'Complete work and upload after photos',
          'Add notes about work performed',
          'Mark job complete to trigger follow-up'
        ],
        tips: ['Photos document work for future reference', 'GPS location captured with each status update']
      },
      {
        title: 'Dispatch & Route Optimization',
        duration: '10 min',
        steps: [
          'Access Field Operations Console → Dispatch tab',
          'View unassigned jobs in the queue',
          'Auto-dispatch suggests optimal technician match',
          'Consider skills, zones, and current workload',
          'Route Agent optimizes travel between jobs',
          'Monitor real-time ETA updates on map',
          'Override assignments manually when needed'
        ],
        tips: ['Use skill tags for specialized job matching', 'Consider traffic patterns in route planning']
      },
      {
        title: 'Employee Management',
        duration: '10 min',
        steps: [
          'Navigate to Employees section from sidebar',
          'Add new employees with Add Employee button',
          'Assign job types (Technician, Dispatch, Manager, etc.)',
          'Configure individual availability schedules',
          'Set skill tags for intelligent dispatch matching',
          'Generate registration codes for self-onboarding',
          'Monitor performance metrics per employee'
        ],
        tips: ['Use registration codes for easy onboarding', 'Skill tags improve dispatch accuracy']
      }
    ]
  },
  {
    id: 'business',
    title: 'Business & Finance',
    icon: Briefcase,
    featureColor: 'feature-platform',
    guides: [
      {
        title: 'Business Ops Console',
        duration: '10 min',
        steps: [
          'Navigate to Business Management Console from sidebar',
          'Quick Action Tabs: Companies, Employees, Customers, Inventory',
          'View real-time KPIs for quotes, invoices, and revenue',
          'Access Quote Forge for AI-powered quote generation',
          'Monitor payment status and outstanding invoices',
          'Inventory tab requires Elite tier'
        ],
        tips: ['Use Business Ops Overview for executive dashboard', 'Quote Forge saves time on complex quotes']
      },
      {
        title: 'Creating & Managing Quotes',
        duration: '10 min',
        steps: [
          'Navigate to Quotes from sidebar',
          'Click New Quote to create manually',
          'Or use Quote Forge for AI-generated quotes',
          'Add line items from service catalog',
          'Apply discounts and terms',
          'Generate branded PDF quote',
          'Email directly to customer'
        ],
        tips: ['Quote templates speed up common services', 'Set expiration dates on quotes']
      },
      {
        title: 'Invoice Management',
        duration: '10 min',
        steps: [
          'Navigate to Invoices from sidebar',
          'Convert accepted quotes to invoices automatically',
          'Or create invoices manually',
          'Add payment terms and due date',
          'Enable Stripe payment links for online payment',
          'Track payment status and send reminders',
          'Generate payment receipts'
        ],
        tips: ['Auto-convert quotes to invoices saves time', 'Payment link invoices get paid 2x faster']
      },
      {
        title: 'Customer Management',
        duration: '8 min',
        steps: [
          'Navigate to Customers from sidebar',
          'View customer profiles and history',
          'Track appointment history per customer',
          'Monitor quote and invoice history',
          'View opt-out preferences (Email, SMS, Call)',
          'Add notes for context on future interactions',
          'Export customer data for reporting'
        ],
        tips: ['Customer history improves service quality', 'Respect opt-out preferences across all channels']
      },
      {
        title: 'Inventory Tracking',
        duration: '10 min',
        steps: [
          'Navigate to Knowledge Base → Inventory (Elite tier)',
          'Add inventory items with SKU codes',
          'Set minimum quantity thresholds',
          'Configure low-stock alert notifications',
          'Track parts usage per job',
          'Run inventory reports for ordering',
          'Inventory Agent monitors and alerts automatically'
        ],
        tips: ['Link common parts to service types', 'Regular audits ensure accuracy']
      },
      {
        title: 'Payment Connections',
        duration: '10 min',
        steps: [
          'Navigate to Integrations → Payment Connections',
          'Connect Stripe account for payment processing',
          'Enable payment links on invoices',
          'Customers pay via any device with link',
          'Payments automatically recorded',
          'Configure payment notifications',
          'View payment reports in Analytics'
        ],
        tips: ['Stripe handles all security compliance', 'Payment links increase collection rate']
      },
      {
        title: 'Financial Reports',
        duration: '8 min',
        steps: [
          'Navigate to Analytics & Reports Console (Elite tier)',
          'Select Revenue tab for financial analysis',
          'Choose date range and apply filters',
          'View revenue breakdown by service type',
          'Export to PDF or CSV from Export tab',
          'Schedule automated report delivery',
          'Compare periods for trend analysis'
        ],
        tips: ['Compare seasonal trends year over year', 'Use forecasts for capacity planning']
      }
    ]
  },
  {
    id: 'marketing',
    title: 'Outreach & Campaigns',
    icon: Megaphone,
    featureColor: 'feature-marketing',
    guides: [
      {
        title: 'Outreach & Sales Ops Console',
        duration: '10 min',
        steps: [
          'Navigate to Outreach & Sales Ops from sidebar (Pro+ tier)',
          'Quick Action Tabs: Campaign, Leads, Marketing',
          'Create and manage marketing campaigns',
          'Configure promo codes and discounts',
          'Manage lead pipeline and segmentation',
          'Track referral program performance'
        ],
        tips: ['Focus on Campaigns and Segments first', 'Use AI assistance for campaign content']
      },
      {
        title: 'Creating Campaigns',
        duration: '12 min',
        steps: [
          'Navigate to Campaigns tab in Marketing Console',
          'Click New Campaign button',
          'Choose channel: Email, SMS, or multi-channel',
          'Select target segment or create new',
          'Create content (use AI generation for assistance)',
          'Schedule send time or send immediately',
          'Monitor performance in analytics'
        ],
        tips: ['A/B test subject lines', 'Segment audiences for personalization']
      },
      {
        title: 'Customer Segmentation',
        duration: '8 min',
        steps: [
          'Navigate to Segments tab in Marketing Console',
          'Create new segment with filter criteria',
          'Filter by service history, location, or spend',
          'Use date filters (last visit, signup date)',
          'Preview segment size before saving',
          'Segments update dynamically as data changes',
          'Apply segments to campaigns'
        ],
        tips: ['Create segment for repeat customers', 'Geographic segments for local promotions']
      },
      {
        title: 'Promo Codes & Discounts',
        duration: '8 min',
        steps: [
          'Navigate to Promos tab in Marketing Console',
          'Create promo code with unique identifier',
          'Set discount type (percentage or fixed)',
          'Define usage limits and expiration',
          'Restrict to specific services if needed',
          'Share codes through campaigns',
          'Track redemption in analytics'
        ],
        tips: ['Use memorable codes for better recall', 'Set reasonable limits to prevent abuse']
      },
      {
        title: 'Referral Program',
        duration: '8 min',
        steps: [
          'Navigate to Referrals tab in Marketing Console',
          'Configure reward structure for referrer and referee',
          'Set reward values (discount or credit)',
          'Generate unique referral codes per customer',
          'Track referral conversions',
          'Process rewards for successful referrals',
          'Promote program in follow-up emails'
        ],
        tips: ['Make rewards attractive enough to motivate', 'Remind customers post-service']
      },
      {
        title: 'Review Collection',
        duration: '8 min',
        steps: [
          'Navigate to Review tab in Marketing Console',
          'Review Agent sends requests post-service',
          'Collects rating before directing to review sites',
          'Negative feedback routes internally first',
          'Positive ratings direct to Google/Yelp/Facebook',
          'Configure review links in Settings',
          'Monitor review analytics'
        ],
        tips: ['Ask immediately after positive service', 'Respond to all reviews promptly']
      }
    ]
  },
  {
    id: 'social-media',
    title: 'Social Media Console',
    icon: Globe,
    featureColor: 'feature-marketing',
    guides: [
      {
        title: 'Social Media Console',
        duration: '10 min',
        steps: [
          'Navigate to Social Media Ops from sidebar (Pro+ tier)',
          'Tabs: Home, Create Content, My Posts',
          'Supports 6 platforms: Instagram, Facebook, LinkedIn, TikTok, GMB, SMS',
          'AI-powered content generation via MultiChannelGenerator',
          'Manual Bridge posting: copy content + open platform composer',
          'AI Suggest for topic ideas, Industry Templates for quick starts'
        ],
        tips: ['Use AI Suggest for content ideas', 'Manual Bridge requires no API setup']
      },
      {
        title: 'Content Creation with MultiChannelGenerator',
        duration: '12 min',
        steps: [
          'Go to Create Content tab in Social Media Ops console',
          'Click AI Suggest for AI-powered topic recommendations based on your industry',
          'Or select an Industry Template for pre-built content structures',
          'Enter your topic and select target platforms',
          'AI generates platform-optimized content with hashtags',
          'Use Manual Bridge: click "Copy & Open [Platform]" to post',
          'Content saved as draft in My Posts tab for tracking'
        ],
        tips: ['AI Suggest uses your company profile for relevant topics', 'Update status to published after posting manually']
      },
      {
        title: 'Posting Strategy (Dual-Mode)',
        duration: '10 min',
        steps: [
          'Navigate to Integrations → Social Media',
          'Default: Manual Bridge — AI generates content, you copy and paste via deep links',
          'Advanced: Own API Credentials — register your developer app per platform',
          'Enter Client ID/Secret in tenant_integrations for automatic publishing via OAuth',
          'Platform-level automatic posting (one-click connect for all tenants) is Coming Soon',
          'Configure default hashtags and brand voice for AI content',
          'Supports Meta (Facebook/Instagram), LinkedIn, TikTok, Google Business'
        ],
        tips: ['Manual Bridge requires zero API setup', 'Own API Credentials enable scheduled auto-publishing']
      },
      {
        title: 'Social Analytics',
        duration: '8 min',
        steps: [
          'Navigate to Analytics tab in Social Media Console',
          'View engagement metrics per platform',
          'Track post performance (likes, shares, comments)',
          'Analyze best posting times',
          'Compare platform performance',
          'Export social reports to PDF/CSV',
          'Analytics Agent provides AI-powered insights'
        ],
        tips: ['Track trends over time', 'Adjust strategy based on performance data']
      }
    ]
  },
  {
    id: 'analytics',
    title: 'Analytics & Reports',
    icon: BarChart3,
    featureColor: 'feature-analytics',
    guides: [
      {
        title: 'Analytics Console',
        duration: '10 min',
        steps: [
          'Navigate to Analytics & Reports Console from sidebar (Elite tier)',
          'Quick Action Tabs: Home, Performance, Revenue, Customers, Trends, KPI, Social, Reminders, Export',
          'Form-based interfaces for structured reporting',
          'AI Insights Agent for natural language queries',
          'Real-time data from all platform modules',
          'Export capabilities for all report types'
        ],
        tips: ['Use structured forms for consistent reports', 'Natural language queries for quick insights']
      },
      {
        title: 'Performance Reports',
        duration: '8 min',
        steps: [
          'Navigate to Performance tab in Analytics Console',
          'Select date range and metrics to analyze',
          'View appointment completion rates',
          'Track technician utilization and efficiency',
          'Monitor response times and SLA compliance',
          'Compare periods for trend analysis',
          'Export performance reports to PDF/CSV'
        ],
        tips: ['Weekly reviews catch issues early', 'Compare against previous periods']
      },
      {
        title: 'Revenue Analysis',
        duration: '10 min',
        steps: [
          'Navigate to Revenue tab in Analytics Console',
          'View revenue breakdown by service type',
          'Analyze trends over time periods',
          'Identify top-performing services',
          'Review revenue per customer metrics',
          'Forecast Agent predicts future revenue',
          'Export financial reports'
        ],
        tips: ['Compare seasonal trends year over year', 'Use forecasts for capacity planning']
      },
      {
        title: 'KPI Dashboard',
        duration: '8 min',
        steps: [
          'Navigate to KPI tab in Analytics Console',
          'View key performance indicators at a glance',
          'Monitor conversion rates and response times',
          'Track customer lifetime value',
          'Set alerts for KPI thresholds',
          'Compare against benchmarks',
          'Customize visible KPIs'
        ],
        tips: ['Focus on 5-7 key metrics', 'Set realistic targets based on history']
      },
      {
        title: 'Export Reports',
        duration: '8 min',
        steps: [
          'Navigate to Export tab in Analytics Console',
          'Select data sets to include (Jobs, Revenue, Social, etc.)',
          'Choose field categories (Financials, Marketing, Operations)',
          'Select export format (CSV or PDF)',
          'Configure date range and filters',
          'Download report immediately',
          'Schedule recurring exports via email'
        ],
        tips: ['CSV for data analysis', 'PDF for stakeholder presentations']
      },
      {
        title: 'Setting up Reports',
        duration: '8 min',
        steps: [
          'Navigate to Settings → Digests',
          'Enable weekly and/or monthly digests',
          'Configure recipient email addresses',
          'Select metrics to include',
          'Choose delivery day and time',
          'Preview digest format',
          'Digests sent automatically on schedule'
        ],
        tips: ['Include key stakeholders as recipients', 'Keep content focused and actionable']
      }
    ]
  },
  {
    id: 'knowledge-base',
    title: 'Knowledge Base',
    icon: FileText,
    featureColor: 'feature-config',
    guides: [
      {
        title: 'Services Catalog Setup',
        duration: '15 min',
        steps: [
          'Navigate to Knowledge Base → Services',
          'Click Add Service button',
          'Enter service name and detailed description',
          'Set pricing (fixed price or range)',
          'Define estimated duration',
          'Add service categories for organization',
          'Enable or disable services as needed',
          'Services used by Quoting Agent and Customer Portal'
        ],
        tips: ['Detailed descriptions improve AI accuracy', 'Update pricing regularly']
      },
      {
        title: 'FAQ Management',
        duration: '10 min',
        steps: [
          'Navigate to Knowledge Base → FAQs',
          'Add frequently asked questions',
          'Provide clear, helpful answers',
          'Organize FAQs by category',
          'AI agents reference FAQs for customer responses',
          'Update based on common customer inquiries',
          'Bulk import from document upload'
        ],
        tips: ['Use real customer questions', 'Keep answers concise and accurate']
      },
      {
        title: 'Document Uploads',
        duration: '8 min',
        steps: [
          'Navigate to Knowledge Base → Documents',
          'Click Upload Document button',
          'Supports PDF, CSV, and markdown files',
          'AI parses content automatically',
          'Review and approve extracted information',
          'Documents enhance AI agent knowledge',
          'Product manuals improve support'
        ],
        tips: ['Upload service manuals for better support', 'Keep documents current']
      },
      {
        title: 'Business Hours Configuration',
        duration: '5 min',
        steps: [
          'Navigate to Knowledge Base → Hours',
          'Set operating hours for each day of week',
          'Mark days as closed if applicable',
          'Add holiday closures in advance',
          'Configure after-hours messaging',
          'Booking Agent respects these hours',
          'Customer Portal shows current status'
        ],
        tips: ['Update hours before holidays', 'Set emergency contact for after-hours']
      },
      {
        title: 'Inventory Management',
        duration: '12 min',
        steps: [
          'Navigate to Knowledge Base → Inventory (Elite tier)',
          'Add parts and supplies with SKU codes',
          'Set stock quantities and minimum levels',
          'Configure low-stock alert thresholds',
          'Track inventory usage per completed job',
          'Inventory Agent monitors and sends alerts',
          'Run inventory reports for ordering'
        ],
        tips: ['Regular audits ensure accuracy', 'Link parts to service types']
      }
    ]
  }
];

// Guides restricted to platform_admin only (Elite tier content)
const RESTRICTED_GUIDE_TITLES = [
  'Inventory Tracking', 
  'Inventory Management', 
  'Social Media Agents',
  'Analytics & Reporting Agents',
  'Analytics Console',
  'KPI Dashboard',
  'Revenue Analysis',
  'Export Reports',
  'Social Media Console',
  '3-Step Content Wizard',
  'Platform Configuration',
  'Social Analytics'
];

// Categories hidden from non-platform-admin (Elite tier only)
const RESTRICTED_CATEGORIES = ['marketing', 'analytics', 'social-media'];

// Helper component to render interactive steps with clickable links
const InteractiveStep: React.FC<{ text: string; navigate: (path: string) => void }> = ({ text, navigate }) => {
  // Sort routes by length (longest first) to match more specific routes first
  const sortedRoutes = Object.entries(NAVIGATION_ROUTES).sort((a, b) => b[0].length - a[0].length);
  
  // Find all navigation references in the text
  const parts: { text: string; isLink: boolean; route?: string }[] = [];
  let remainingText = text;
  
  while (remainingText.length > 0) {
    let foundMatch = false;
    
    for (const [label, route] of sortedRoutes) {
      const index = remainingText.indexOf(label);
      if (index !== -1) {
        // Add text before the match
        if (index > 0) {
          parts.push({ text: remainingText.slice(0, index), isLink: false });
        }
        // Add the matched link
        parts.push({ text: label, isLink: true, route });
        // Continue with remaining text
        remainingText = remainingText.slice(index + label.length);
        foundMatch = true;
        break;
      }
    }
    
    if (!foundMatch) {
      // No more matches, add remaining text
      parts.push({ text: remainingText, isLink: false });
      break;
    }
  }
  
  return (
    <span>
      {parts.map((part, idx) => 
        part.isLink ? (
          <button
            key={idx}
            onClick={() => navigate(part.route!)}
            className="text-primary hover:text-primary/80 hover:underline font-medium inline-flex items-center gap-0.5 transition-colors"
          >
            {part.text}
            <ExternalLink className="h-3 w-3 inline" />
          </button>
        ) : (
          <span key={idx}>{part.text}</span>
        )
      )}
    </span>
  );
};

const PlatformGuides: React.FC = () => {
  const { userRole } = useAuth();
  const navigate = useNavigate();
  const [selectedCategory, setSelectedCategory] = useState('getting-started');

  // Filter out restricted guides and categories for non-platform-admin users
  const filteredCategories = useMemo(() => {
    if (userRole === 'platform_admin') {
      return guideCategories;
    }
    
    return guideCategories
      .filter(category => !RESTRICTED_CATEGORIES.includes(category.id))
      .map(category => ({
        ...category,
        guides: category.guides.filter(guide => !RESTRICTED_GUIDE_TITLES.includes(guide.title))
      }));
  }, [userRole]);

  const currentCategory = filteredCategories.find(c => c.id === selectedCategory);

  return (
    <DashboardLayout>
      <PageContainer>
        <div className="space-y-6 animate-fade-in">
        {/* Header */}
        <PageHeader
          icon={BookOpen}
          title="Platform Guides"
          description="Step-by-step instructions for all platform features"
          featureColor="overview"
          action={
            <div className="flex gap-3">
              <PDFDownloadLink 
                document={<ComprehensiveGuidesPDF />} 
                fileName="aura-intercept-comprehensive-guide.pdf"
              >
                {({ loading }) => (
                  <Button variant="default" disabled={loading} className="gap-2">
                    <Download className="h-4 w-4" />
                    {loading ? 'Generating...' : 'Download Complete Guide'}
                  </Button>
                )}
              </PDFDownloadLink>
              <PDFDownloadLink 
                document={<PlatformDocumentPDF />} 
                fileName="aura-intercept-overview.pdf"
              >
                {({ loading }) => (
                  <Button variant="outline" disabled={loading} className="gap-2">
                    <FileText className="h-4 w-4" />
                    {loading ? 'Generating...' : 'Platform Overview'}
                  </Button>
                )}
              </PDFDownloadLink>
            </div>
          }
        />

        {/* Quick Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="glass-card border-primary/30 bg-primary/5">
            <CardContent className="pt-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/15 border border-primary/20">
                  <BookOpen className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-foreground">{filteredCategories.length}</p>
                  <p className="text-xs text-muted-foreground">Categories</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="glass-card border-feature-analytics/30 bg-feature-analytics/5">
            <CardContent className="pt-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-feature-analytics/15 border border-feature-analytics/20">
                  <FileText className="h-5 w-5 text-feature-analytics" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-foreground">
                    {filteredCategories.reduce((acc, c) => acc + c.guides.length, 0)}
                  </p>
                  <p className="text-xs text-muted-foreground">Guides</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="glass-card border-feature-config/30 bg-feature-config/5">
            <CardContent className="pt-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-feature-config/15 border border-feature-config/20">
                  <Bot className="h-5 w-5 text-feature-config" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-foreground">24</p>
                  <p className="text-xs text-muted-foreground">AI Operatives</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="glass-card border-feature-fieldops/30 bg-feature-fieldops/5">
            <CardContent className="pt-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-feature-fieldops/15 border border-feature-fieldops/20">
                  <Puzzle className="h-5 w-5 text-feature-fieldops" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-foreground">9</p>
                  <p className="text-xs text-muted-foreground">Integrations</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <div className="grid lg:grid-cols-12 gap-6">
          {/* Category Sidebar */}
          <Card className="lg:col-span-4 xl:col-span-3 glass-card border-border/40">
            <CardHeader className="pb-3 border-b border-border/30">
              <CardTitle className="text-base text-foreground">Guide Categories</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <ScrollArea className="h-[calc(100vh-280px)] min-h-[400px]">
                <div className="space-y-1 p-3">
                  {filteredCategories.map((category) => {
                    const Icon = category.icon;
                    const isSelected = selectedCategory === category.id;
                    return (
                      <button
                        key={category.id}
                        onClick={() => setSelectedCategory(category.id)}
                         className={`w-full flex items-center gap-3 p-3 rounded-lg text-left transition-all ${
                          isSelected 
                            ? 'bg-primary/20 text-primary border border-primary/40' 
                            : 'hover:bg-white/5 border border-transparent hover:border-border/30'
                        }`}
                      >
                        <div className={`p-2 rounded-lg shrink-0 ${isSelected ? 'bg-primary/20' : `bg-${category.featureColor}/20 border border-${category.featureColor}/30`}`}>
                          <Icon className={`h-4 w-4 ${isSelected ? 'text-primary' : `text-${category.featureColor}`}`} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className={`font-medium text-sm ${isSelected ? 'text-primary' : 'text-foreground'}`}>
                            {category.title}
                          </p>
                          <p className={`text-xs ${isSelected ? 'text-primary/70' : 'text-muted-foreground'}`}>
                            {category.guides.length} guides
                          </p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>

          {/* Guides Content */}
          <Card className="lg:col-span-8 xl:col-span-9 glass-card border-border/40">
            <CardHeader>
              <div className="flex items-center gap-3">
                {currentCategory && (
                  <div className={`p-3 rounded-xl bg-${currentCategory.featureColor}/20 border border-${currentCategory.featureColor}/30`}>
                    <currentCategory.icon className="h-6 w-6 text-white" />
                  </div>
                )}
                <div>
                  <CardTitle>{currentCategory?.title} Guides</CardTitle>
                  <CardDescription className="text-muted-foreground">
                    {currentCategory?.guides.length} step-by-step guides
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <Accordion type="single" collapsible className="space-y-3">
                {currentCategory?.guides.map((guide, index) => (
                  <AccordionItem 
                    key={index} 
                    value={`guide-${index}`}
                    className="border border-border/30 rounded-lg px-4 bg-white/3 hover:bg-white/5 transition-colors"
                  >
                    <AccordionTrigger className="hover:no-underline py-4">
                      <div className="flex items-center gap-4 text-left">
                        <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 text-primary font-bold text-sm">
                          {index + 1}
                        </div>
                        <div>
                          <p className="font-semibold">{guide.title}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <Badge variant="secondary" className="text-xs">
                              <Clock className="h-3 w-3 mr-1" />
                              {guide.duration}
                            </Badge>
                            <Badge variant="outline" className="text-xs text-white/70 border-white/30">
                              {guide.steps.length} steps
                            </Badge>
                          </div>
                        </div>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent className="pb-4">
                      <div className="space-y-4 pt-2">
                        {/* Steps */}
                        <div className="space-y-3">
                          {guide.steps.map((step, stepIndex) => (
                            <div key={stepIndex} className="flex gap-3">
                              <div className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-medium">
                                {stepIndex + 1}
                              </div>
                              <p className="text-sm text-card-foreground/70 pt-0.5">
                                <InteractiveStep text={step} navigate={navigate} />
                              </p>
                            </div>
                          ))}
                        </div>

                        {/* Tips */}
                        {guide.tips && guide.tips.length > 0 && (
                          <div className="bg-warning/10 border border-warning/20 rounded-lg p-4 mt-4">
                            <div className="flex items-center gap-2 text-warning mb-2">
                              <Lightbulb className="h-4 w-4" />
                              <span className="font-medium text-sm">Pro Tips</span>
                            </div>
                            <ul className="space-y-1">
                              {guide.tips.map((tip, tipIndex) => (
                                 <li key={tipIndex} className="text-sm text-card-foreground/70 flex items-start gap-2">
                                   <CheckCircle2 className="h-4 w-4 text-warning flex-shrink-0 mt-0.5" />
                                   <InteractiveStep text={tip} navigate={navigate} />
                                 </li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </CardContent>
          </Card>
        </div>
        </div>
      </PageContainer>
    </DashboardLayout>
  );
};

export default PlatformGuides;
