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
  'AI Agents Hub': '/dashboard/ai-agents-hub',
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
  'Integrations → CRM': '/dashboard/settings/integrations',
  'Field Operations': '/dashboard/ai-consoles/field-ops',
  'Field Operations Console': '/dashboard/ai-consoles/field-ops',
  'Business Ops Hub': '/dashboard/ai-consoles/business-ops',
  'Business Ops Console': '/dashboard/ai-consoles/business-ops',
  'Marketing & Sales Ops': '/dashboard/ai-consoles/marketing',
  'Marketing Console': '/dashboard/ai-consoles/marketing',
  'Aura Social Signal Ops': '/dashboard/ai-consoles/social-media',
  'Aura Social Signal Console': '/dashboard/ai-consoles/social-media',
  'Analytics & Reports Ops': '/dashboard/ai-consoles/analytics',
  'Analytics Console': '/dashboard/ai-consoles/analytics',
  'Customer Portal Console': '/dashboard/ai-consoles/customer-portal',
  'Knowledge Base → Services': '/dashboard/knowledge',
  'Knowledge Base → FAQs': '/dashboard/knowledge',
  'Knowledge Base → Hours': '/dashboard/knowledge',
  'Knowledge Base → Documents': '/dashboard/knowledge',
  'Knowledge Base → Inventory': '/dashboard/knowledge',
  'Knowledge Base → Warranties': '/dashboard/knowledge',
  'Settings → Branding': '/dashboard/settings',
  'Settings → Email Templates': '/dashboard/settings',
  'Settings → Role Permissions': '/dashboard/settings',
  'Settings → Digests': '/dashboard/settings',
  'Settings → Subscription': '/dashboard/subscription',
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
          'Review your subscription tier in the bottom left (Single-Point, Multi-Track, or Command)',
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
        duration: '8 min',
        steps: [
          'Single-Point ($497/mo): 3 AI Agents (Receptionist, Follow-up, Review) + Call to Book',
          'Multi-Track ($897/mo): 10 AI Agents + 2 Control Centers + Online Booking',
          'Command ($1,497/mo): All 23 AI Agents + 6 Control Centers + White-Label Branding',
          'All tiers include AI Voice Chat powered by ElevenLabs',
          'Employee limits: 5 (Single-Point), 10 (Multi-Track), Unlimited (Command)',
          'Premium Add-Ons: Social Media ($150/mo), Smart Website ($150/mo)',
          'View your tier status in the sidebar bottom section'
        ],
        tips: ['Trial users get full Command tier access', 'Annual billing saves up to $2,994/year']
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
          'Single-Point: Call to Book, Emergency, Services, Hours, Feedback tabs',
          'Multi-Track+: Full suite with Book Appointment, Get Quote, Track, Billing tabs',
          'Portal supports multi-company access for customers',
          'AI Voice Chat included for all paid tiers',
          'Configure widget embed code in Integrations → Website Embed'
        ],
        tips: ['Widget works on WordPress, Wix, and any HTML site', 'Customers can manage preferences per company']
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
        title: 'AI Agents Hub Overview',
        duration: '10 min',
        steps: [
          'Navigate to AI Agents Hub from the sidebar',
          'View all 23 AI agents organized by 6 Control Centers',
          'Agents locked by tier show "Locked" badge with upgrade path',
          'Click any agent card to view settings and dependencies',
          'Enable/disable agents with the toggle switch',
          'Monitor agent activity in console-specific event logs'
        ],
        tips: ['Start with Customer Portal agents', 'Locked agents show required tier for upgrade planning']
      },
      {
        title: 'AI Agent Workflow Guide',
        duration: '15 min',
        steps: [
          'Navigate to Platform Resources → AI Agent Guide in sidebar',
          'View Agent Dependency Flow diagram showing handoff sequences',
          'Explore Console Requirements to understand which consoles need which agents',
          'Use the Calculator tab to determine which agents you need',
          'Review Quick Reference for agent-to-console mappings',
          'Compare subscription tiers in the Tier Comparison tab'
        ],
        tips: ['Use the Calculator for upgrade planning', 'Bookmark the guide for quick reference'],
        link: '/dashboard/ai-agent-guide'
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
          'Available in all paid tiers (Single-Point+)'
        ],
        tips: ['AI Receptionist is required for all other customer-facing agents', 'Customize greeting for your brand voice']
      },
      {
        title: 'Scheduling Agent',
        duration: '10 min',
        steps: [
          'Enable in AI Agents Hub (requires Multi-Track+ tier)',
          'Checks business hours and employee availability automatically',
          'Presents available time slots to customers',
          'Creates confirmed appointments in the system',
          'Triggers calendar sync if Google Calendar connected',
          'Hands off to Dispatch Agent for technician assignment'
        ],
        tips: ['Ensure business hours are configured accurately', 'Set buffer times between appointments in Settings']
      },
      {
        title: 'Follow-up & Review Agents',
        duration: '8 min',
        steps: [
          'Follow-up Agent: Automated post-service check-ins via Email/SMS',
          'Review Agent: Collects ratings and routes to Google/Yelp/Facebook',
          'Both depend on AI Receptionist being enabled',
          'Configure templates in Settings → Email Templates',
          'Set timing delays (e.g., 2 hours after service)',
          'Negative feedback routes internally before public review'
        ],
        tips: ['Both agents included in Single-Point tier', 'Customize templates with your brand voice']
      },
      {
        title: 'Field Operations Agents',
        duration: '12 min',
        steps: [
          'Dispatch Agent: Assigns technicians based on skills and zones',
          'Route Agent: Optimizes travel routes using distance calculations',
          'ETA Agent: Sends real-time arrival updates to customers',
          'Check-in Agent: Manages on-site status with photo documentation',
          'All require Multi-Track+ tier',
          'Access via Field Operations Console in sidebar'
        ],
        tips: ['Enable GPS on technician mobile devices for accurate ETAs', 'Use skill tags for intelligent dispatch matching']
      },
      {
        title: 'Business Operations Agents',
        duration: '10 min',
        steps: [
          'Quoting Agent: Generates quotes from service catalog pricing',
          'Invoice Agent: Creates invoices and tracks payment status',
          'Inventory Agent: Monitors stock levels and triggers alerts (Command)',
          'Warranty Agent: Manages warranty policies and claims (Command)',
          'Access via Business Ops Console',
          'Quoting/Invoice available Multi-Track+; Inventory/Warranty Command only'
        ],
        tips: ['Link Quote Forge to your service catalog', 'Configure low-stock thresholds for proactive ordering']
      },
      {
        title: 'Marketing & Campaign Agents',
        duration: '10 min',
        steps: [
          'Campaign Agent: Creates and sends marketing campaigns',
          'Marketing Agent: Manages segments and promo codes',
          'Winback automation for inactive customers',
          'Referral program management',
          'All marketing agents require Command tier',
          'Access via Marketing & Sales Ops Console'
        ],
        tips: ['A/B test subject lines for better performance', 'Start with simple campaigns before automation']
      },
      {
        title: 'Aura Social Signal Agents',
        duration: '12 min',
        steps: [
          'Aura Social Signal Agent: Creates posts for 6 platforms (IG, FB, LI, TT, GMB, SMS)',
          'Aura Signal Scheduler: Queues and publishes content',
          'Aura Signal Analytics: Tracks engagement metrics',
          'Uses 3-step Content Wizard: Template → Customize → Schedule',
          'All Aura Social Signal agents require Command tier',
          'Access via Aura Social Signal Ops Console'
        ],
        tips: ['Respects platform character limits automatically', 'Queue posts for optimal engagement times']
      },
      {
        title: 'Analytics & Reporting Agents',
        duration: '10 min',
        steps: [
          'Insights Agent: Natural language business queries',
          'Performance Agent: Tracks KPIs and operational metrics',
          'Revenue Agent: Analyzes financial trends and forecasts',
          'Forecast Agent: Predicts demand and capacity needs',
          'All analytics agents require Command tier',
          'Access via Analytics & Reports Ops Console'
        ],
        tips: ['Use form-based interfaces for structured reports', 'Export to CSV/PDF from Reports tab']
      },
      {
        title: 'AI Voice Chat (ElevenLabs)',
        duration: '8 min',
        steps: [
          'AI Voice powered by ElevenLabs included in all paid tiers',
          'Customers can speak naturally with AI agents',
          'Supports inbound and outbound voice interactions',
          'Configure voice settings in Integrations → Voice Agent',
          'Voice cloning available with ElevenLabs account',
          'Real-time transcription shows in console'
        ],
        tips: ['Choose a voice matching your brand personality', 'Test voice interactions before going live']
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
        title: 'Twilio Voice & SMS',
        duration: '15 min',
        steps: [
          'Navigate to Integrations → Voice Agent or SMS & Text',
          'Create Twilio account at twilio.com',
          'Obtain Account SID and Auth Token from Twilio Console',
          'Purchase a phone number with Voice and SMS capabilities',
          'Enter credentials in the integration settings',
          'Configure call handling and SMS templates',
          'Test with your own phone number'
        ],
        tips: ['Use a local number for better answer rates', 'Keep SMS under 160 characters for single message']
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
          'Navigate to Social Media Ops → Settings (Command tier or Add-On)',
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
        title: 'CRM Integration',
        duration: '12 min',
        steps: [
          'Navigate to Integrations → CRM (Multi-Track+ tier)',
          'Select your CRM provider from supported options',
          'Authenticate with your CRM account credentials',
          'Map customer fields between platforms',
          'Configure sync direction (one-way or two-way)',
          'Set sync frequency (real-time or scheduled)',
          'Verify customer data appears in both systems'
        ],
        tips: ['Start with one-way sync to avoid conflicts', 'Review field mappings carefully before enabling']
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
          'Navigate to Field Operations from sidebar (Multi-Track+ tier)',
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
        tips: ['Photos document work for warranty purposes', 'GPS location captured with each status update']
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
          'Navigate to Business Ops Hub from sidebar',
          'Quick Action Tabs: Companies, Employees, Customers, Inventory, Warranties',
          'View real-time KPIs for quotes, invoices, and revenue',
          'Access Quote Forge for AI-powered quote generation',
          'Monitor payment status and outstanding invoices',
          'Inventory and Warranty tabs require Command tier'
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
          'Navigate to Knowledge Base → Inventory (Command tier)',
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
        title: 'Warranty Management',
        duration: '8 min',
        steps: [
          'Navigate to Knowledge Base → Warranties (Command tier)',
          'Create warranty policy templates',
          'Define coverage terms and durations',
          'Link warranties to completed jobs automatically',
          'Customers can look up warranty status in portal',
          'Process and track warranty claims',
          'Warranty Agent sends expiration reminders'
        ],
        tips: ['Clear warranty terms reduce disputes', 'Auto-assign warranties on job completion']
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
          'Navigate to Analytics & Reports Console (Command tier)',
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
    title: 'Marketing & Campaigns',
    icon: Megaphone,
    featureColor: 'feature-marketing',
    guides: [
      {
        title: 'Marketing & Sales Console',
        duration: '10 min',
        steps: [
          'Navigate to Marketing & Sales Ops from sidebar (Command tier)',
          'Quick Action Tabs: Campaigns, Promos, Leads, Segments, Referrals, Review',
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
    title: 'Social Media Ops',
    icon: Globe,
    featureColor: 'feature-marketing',
    guides: [
      {
        title: 'Social Media Console',
        duration: '10 min',
        steps: [
          'Navigate to Social Media Ops from sidebar (Command tier)',
          'Quick Action Tabs: Home, Templates, Compose, Schedule, Analytics',
          'Supports 6 platforms: Instagram, Facebook, LinkedIn, TikTok, GMB, SMS',
          'AI-powered content generation and scheduling',
          'Cross-platform analytics and engagement tracking',
          'Content Wizard for guided post creation'
        ],
        tips: ['Start with content templates', 'Schedule posts for optimal engagement times']
      },
      {
        title: '3-Step Content Wizard',
        duration: '12 min',
        steps: [
          'Step 1 - Template: Choose from pre-built templates or start blank',
          'Step 2 - Customize: Edit content, add images, apply brand voice',
          'Step 3 - Schedule: Select platforms and set publish times',
          'AI auto-adjusts content for platform-specific limits',
          'Instagram: 2200 chars, Twitter/X: 280 chars, SMS: 160 chars',
          'Preview posts before scheduling'
        ],
        tips: ['Templates maintain brand consistency', 'Let AI adapt content per platform']
      },
      {
        title: 'Platform Configuration',
        duration: '10 min',
        steps: [
          'Navigate to Social Media Ops → Settings',
          'Connect social accounts (OAuth for major platforms)',
          'Configure default hashtags and mentions',
          'Set brand voice guidelines',
          'Enable/disable specific platforms',
          'Configure posting schedules per platform'
        ],
        tips: ['Use consistent branding across platforms', 'Different content works better on different platforms']
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
          'Navigate to Analytics & Reports Ops from sidebar (Command tier)',
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
          'Product manuals improve warranty support'
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
          'Scheduling Agent respects these hours',
          'Customer Portal shows current status'
        ],
        tips: ['Update hours before holidays', 'Set emergency contact for after-hours']
      },
      {
        title: 'Inventory Management',
        duration: '12 min',
        steps: [
          'Navigate to Knowledge Base → Inventory (Command tier)',
          'Add parts and supplies with SKU codes',
          'Set stock quantities and minimum levels',
          'Configure low-stock alert thresholds',
          'Track inventory usage per completed job',
          'Inventory Agent monitors and sends alerts',
          'Run inventory reports for ordering'
        ],
        tips: ['Regular audits ensure accuracy', 'Link parts to service types']
      },
      {
        title: 'Warranty Policies',
        duration: '8 min',
        steps: [
          'Navigate to Knowledge Base → Warranties (Command tier)',
          'Create warranty policy templates',
          'Define coverage terms and durations',
          'Set up automatic warranty assignment on job completion',
          'Customers can lookup warranty status in portal',
          'Process and track warranty claims',
          'Warranty Agent sends expiration reminders'
        ],
        tips: ['Clear terms reduce disputes', 'Automate warranty registration']
      }
    ]
  }
];

// Guides restricted to platform_admin only (Command tier content)
const RESTRICTED_GUIDE_TITLES = [
  'Inventory Tracking', 
  'Inventory Management', 
  'Warranty Management',
  'Warranty Policies', 
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

// Categories hidden from non-platform-admin (Command tier only)
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
          <Card className="bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
            <CardContent className="pt-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/10">
                  <BookOpen className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{filteredCategories.length}</p>
                  <p className="text-xs text-card-foreground/70">Categories</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-br from-secondary/10 to-secondary/5 border-secondary/20">
            <CardContent className="pt-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-secondary/10">
                  <FileText className="h-5 w-5 text-secondary" />
                </div>
                <div>
                  <p className="text-2xl font-bold">
                    {filteredCategories.reduce((acc, c) => acc + c.guides.length, 0)}
                  </p>
                  <p className="text-xs text-card-foreground/70">Guides</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-br from-accent/10 to-accent/5 border-accent/20">
            <CardContent className="pt-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-accent/10">
                  <Bot className="h-5 w-5 text-accent" />
                </div>
                <div>
                  <p className="text-2xl font-bold">19</p>
                  <p className="text-xs text-card-foreground/70">AI Agents</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-br from-success/10 to-success/5 border-success/20">
            <CardContent className="pt-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-success/10">
                  <Puzzle className="h-5 w-5 text-success" />
                </div>
                <div>
                  <p className="text-2xl font-bold">9</p>
                  <p className="text-xs text-card-foreground/70">Integrations</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <div className="grid lg:grid-cols-12 gap-6">
          {/* Category Sidebar */}
          <Card className="lg:col-span-4 xl:col-span-3">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Guide Categories</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <ScrollArea className="h-auto max-h-[600px]">
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
                            ? 'bg-primary text-primary-foreground' 
                            : 'hover:bg-accent/50'
                        }`}
                      >
                        <div className={`p-2 rounded-lg shrink-0 ${isSelected ? 'bg-primary-foreground/20' : `bg-${category.featureColor}`}`}>
                          <Icon className={`h-4 w-4 ${isSelected ? 'text-primary-foreground' : 'text-white'}`} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className={`font-medium text-sm ${isSelected ? 'text-primary-foreground' : 'text-card-foreground'}`}>
                            {category.title}
                          </p>
                          <p className={`text-xs ${isSelected ? 'text-primary-foreground/70' : 'text-muted-foreground'}`}>
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
          <Card className="lg:col-span-8 xl:col-span-9">
            <CardHeader>
              <div className="flex items-center gap-3">
                {currentCategory && (
                  <div className={`p-3 rounded-xl bg-${currentCategory.featureColor}`}>
                    <currentCategory.icon className="h-6 w-6 text-white" />
                  </div>
                )}
                <div>
                  <CardTitle>{currentCategory?.title} Guides</CardTitle>
                  <CardDescription className="text-card-foreground/70">
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
                    className="border rounded-lg px-4"
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
