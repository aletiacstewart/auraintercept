import React, { useState, useMemo } from 'react';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { PageContainer } from '@/components/ui/page-container';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { PDFDownloadLink } from '@react-pdf/renderer';
import PlatformDocumentPDF from '@/components/documentation/PlatformDocumentPDF';
import { ComprehensiveGuidesPDF } from '@/components/documentation/ComprehensiveGuidesPDF';
import { 
  Download, 
  BookOpen, 
  Bot, 
  Users, 
  Settings, 
  Puzzle, 
  BarChart3,
  Phone,
  MessageSquare,
  Mail,
  Calendar,
  FileText,
  Truck,
  Briefcase,
  Megaphone,
  CheckCircle2,
  ArrowRight,
  Lightbulb,
  AlertCircle,
  Clock,
  Shield,
  Zap,
  Globe
} from 'lucide-react';
import { PageHeader } from '@/components/ui/page-header';

const guideCategories = [
  {
    id: 'getting-started',
    title: 'Getting Started',
    icon: BookOpen,
    color: 'from-blue-500 to-cyan-500',
    guides: [
      {
        title: 'Platform Overview',
        duration: '5 min',
        steps: [
          'Log in to your admin dashboard at /auth',
          'Explore the main navigation sidebar on the left',
          'Review your subscription status in the bottom left',
          'Navigate to Dashboard for your company overview',
          'Check the Help section for additional resources'
        ],
        tips: ['Bookmark the dashboard URL for quick access', 'Enable browser notifications for real-time alerts']
      },
      {
        title: 'Initial Setup Checklist',
        duration: '15 min',
        steps: [
          'Complete company profile in Settings → Branding',
          'Upload your company logo (recommended: 200x200px PNG)',
          'Configure business hours in Knowledge Base → Business Hours',
          'Add your services catalog in Knowledge Base → Services',
          'Set up employee accounts in Employees section',
          'Configure notification preferences in Settings → Alerts'
        ],
        tips: ['Use the Onboarding Wizard for guided setup', 'Test all configurations before going live']
      },
      {
        title: 'Onboarding Wizard',
        duration: '10 min',
        steps: [
          'Access the Onboarding Wizard from Dashboard',
          'Follow the guided checklist of required setup steps',
          'Complete each section: Profile, Hours, Services, Employees',
          'Track your progress with the completion indicator',
          'Required items are marked with priority badges',
          'Finish all required items before going live'
        ],
        tips: ['Complete required items first, then recommended ones', 'The wizard tracks progress automatically']
      },
      {
        title: 'User Roles & Permissions',
        duration: '8 min',
        steps: [
          'Platform Admin: Full system access across all companies',
          'Company Admin: Full access to their company\'s features',
          'Employee: Access based on assigned job types',
          'Technician: Mobile-optimized field operations access',
          'Assign roles when creating user accounts',
          'Configure job types for specialized access'
        ],
        tips: ['Follow principle of least privilege', 'Regularly audit user access permissions']
      },
      {
        title: 'Customer Portal Setup',
        duration: '8 min',
        steps: [
          'Customers access the portal at /customer-portal',
          'They can view appointments across multiple companies',
          'Each company\'s data remains completely separate',
          'Customers can request quotes and track services',
          'Portal shows appointment history and invoices',
          'Enable widget authentication for linked accounts'
        ],
        tips: ['Promote the customer portal for self-service', 'Customers can manage preferences per company']
      }
    ]
  },
  {
    id: 'ai-agents',
    title: 'AI Agents',
    icon: Bot,
    color: 'from-purple-500 to-pink-500',
    guides: [
      {
        title: 'AI Agents Hub Overview',
        duration: '10 min',
        steps: [
          'Navigate to AI Agents Hub from the sidebar',
          'View all 18 specialized agents organized by 5 consoles',
          'Each agent card shows name, console, and enable status',
          'Click an agent card to view detailed settings',
          'Use batch activation to enable multiple agents at once',
          'Monitor agent activity in the event logs'
        ],
        tips: ['Start with Customer Portal agents', 'Enable agents gradually to monitor performance']
      },
      {
        title: 'Enabling & Configuring Agents',
        duration: '12 min',
        steps: [
          'Select an agent from the AI Agents Hub',
          'Toggle the enable switch to activate the agent',
          'Configure agent-specific settings (prompts, thresholds)',
          'Set up handoff rules for agent-to-agent transfers',
          'Test agent behavior in the Agent Test Console',
          'Monitor agent logs for performance issues'
        ],
        tips: ['Configure agents during low-traffic periods', 'Document custom configurations for reference']
      },
      {
        title: 'Agent Test Console',
        duration: '8 min',
        steps: [
          'Access the Agent Test Console from AI Agents Hub',
          'Select an agent to test from the dropdown',
          'Choose a predefined test scenario or create custom',
          'Send test messages and observe agent responses',
          'Review handoff indicators showing agent transitions',
          'Verify agent behavior before enabling for customers'
        ],
        tips: ['Test each agent with realistic scenarios', 'Check handoff logic between related agents']
      },
      {
        title: 'AI Receptionist (Triage Agent)',
        duration: '8 min',
        steps: [
          'Enable the AI Receptionist in AI Agents Hub',
          'Configure the initial greeting message',
          'Set up inquiry classification rules',
          'Define handoff triggers for specialized agents',
          'Test with sample customer inquiries',
          'Review classification accuracy in analytics'
        ],
        tips: ['The AI Receptionist is the entry point for all customer interactions', 'Customize greetings for your brand voice']
      },
      {
        title: 'Scheduling Agent Setup',
        duration: '10 min',
        steps: [
          'Enable the Scheduling Agent in AI Agents Hub',
          'Ensure business hours are configured correctly',
          'Set up service duration defaults',
          'Configure employee availability calendars',
          'Enable calendar sync (Google Calendar optional)',
          'Test booking flow end-to-end'
        ],
        tips: ['Sync with external calendars for accurate availability', 'Set buffer times between appointments']
      },
      {
        title: 'Customer Portal Agents',
        duration: '12 min',
        steps: [
          'Enable Voice, SMS, and Email agents for multi-channel support',
          'Configure Voice Agent for phone interactions',
          'Set up SMS Agent for text-based conversations',
          'Enable Email Agent for email inquiries',
          'Configure channel preferences per customer',
          'Test each channel with sample interactions'
        ],
        tips: ['Customers can opt out of specific channels', 'Use consistent messaging across all channels']
      },
      {
        title: 'Field Operations Agents',
        duration: '15 min',
        steps: [
          'Enable Dispatch, Route, ETA, and Check-in agents',
          'Configure dispatch rules (skills, zones, availability)',
          'Set up route optimization preferences',
          'Configure ETA notification triggers',
          'Enable photo documentation for Check-in agent',
          'Test the complete field operations workflow'
        ],
        tips: ['Train technicians on mobile check-in process', 'Use GPS tracking for accurate ETAs']
      },
      {
        title: 'Business Ops Agents',
        duration: '12 min',
        steps: [
          'Enable Quoting, Invoicing, and Inventory agents in AI Agents Hub',
          'Configure Quote Agent for automated quote generation',
          'Set up Invoice Agent for payment tracking and reminders',
          'Enable Inventory Agent for stock level monitoring',
          'Configure pricing rules and discount limits',
          'Test quote-to-invoice conversion workflow'
        ],
        tips: ['Link agents to your service catalog for accurate pricing', 'Set up low-stock alerts for proactive ordering']
      },
      {
        title: 'Marketing & Campaign Agents',
        duration: '10 min',
        steps: [
          'Enable Marketing, Promotion, and Winback agents',
          'Configure campaign automation rules',
          'Set up customer segmentation criteria',
          'Define promotion triggers and discount limits',
          'Enable winback campaigns for inactive customers',
          'Monitor campaign performance in analytics'
        ],
        tips: ['Start with simple campaigns before complex automation', 'A/B test messaging for best results']
      },
      {
        title: 'Analytics & Reporting Agents',
        duration: '8 min',
        steps: [
          'Enable Business Insights and Data Analytics agents',
          'Configure KPI tracking thresholds',
          'Set up automated report generation',
          'Define alert triggers for anomalies',
          'Enable revenue forecasting features',
          'Schedule regular performance digests'
        ],
        tips: ['Use natural language queries for quick insights', 'Set up weekly automated reports for stakeholders']
      }
    ]
  },
  {
    id: 'integrations',
    title: 'Integrations',
    icon: Puzzle,
    color: 'from-green-500 to-emerald-500',
    guides: [
      {
        title: 'Voice Integration (Twilio)',
        duration: '20 min',
        steps: [
          'Navigate to Integrations → Voice Agent',
          'Create a Twilio account at twilio.com',
          'Obtain your Twilio Account SID and Auth Token',
          'Purchase a phone number from Twilio',
          'Enter credentials in the Voice Integration settings',
          'Configure voice agent greeting and prompts',
          'Test with a phone call to your Twilio number'
        ],
        tips: ['Use a local number for better answer rates', 'Configure voicemail fallback for missed calls']
      },
      {
        title: 'ElevenLabs Voice Setup',
        duration: '15 min',
        steps: [
          'Navigate to Integrations → Voice Agent → TTS Settings',
          'Create an ElevenLabs account at elevenlabs.io',
          'Generate an API key from your ElevenLabs dashboard',
          'Enter the API key in Voice Integration settings',
          'Select a voice from the available options',
          'Adjust voice settings (stability, clarity)',
          'Test voice output with sample text'
        ],
        tips: ['Choose a voice that matches your brand personality', 'Higher stability = more consistent voice']
      },
      {
        title: 'Voice Cloning',
        duration: '10 min',
        steps: [
          'Navigate to Voice Agent → Voice Cloning',
          'Record or upload a voice sample (30+ seconds)',
          'Ensure clear audio without background noise',
          'Submit for voice clone processing',
          'Wait for clone to be ready (usually minutes)',
          'Select your cloned voice in TTS settings',
          'Test the cloned voice with your greeting'
        ],
        tips: ['Use high-quality audio for best results', 'Record in a quiet environment']
      },
      {
        title: 'SMS Integration (Twilio)',
        duration: '15 min',
        steps: [
          'Navigate to Integrations → SMS & Text',
          'Ensure Twilio account is set up (same as voice)',
          'Enable SMS capabilities on your Twilio number',
          'Configure SMS templates in Settings',
          'Set up appointment reminder schedules',
          'Test SMS sending to your own number'
        ],
        tips: ['Keep messages under 160 characters for single SMS', 'Include opt-out instructions in messages']
      },
      {
        title: 'Email Integration (Resend)',
        duration: '15 min',
        steps: [
          'Navigate to Integrations → Email',
          'Create a Resend account at resend.com',
          'Verify your sending domain',
          'Obtain your Resend API key',
          'Enter API key in Email Integration settings',
          'Configure email templates in Settings',
          'Send a test email to verify setup'
        ],
        tips: ['Use a subdomain for sending (e.g., mail.yourcompany.com)', 'Set up SPF and DKIM records for deliverability']
      },
      {
        title: 'Calendar Integration (Google)',
        duration: '12 min',
        steps: [
          'Navigate to Integrations → Calendar',
          'Click "Connect Google Calendar"',
          'Sign in with your Google account',
          'Grant calendar permissions',
          'Select which calendar to sync',
          'Enable two-way sync for updates',
          'Verify appointments appear in Google Calendar'
        ],
        tips: ['Use a dedicated calendar for business appointments', 'Set up calendar sharing with employees']
      },
      {
        title: 'CRM Integration',
        duration: '15 min',
        steps: [
          'Navigate to Integrations → CRM',
          'Select your CRM provider (Salesforce, HubSpot, etc.)',
          'Authenticate with your CRM credentials',
          'Configure sync direction (to CRM, from CRM, or both)',
          'Map fields between platform and CRM',
          'Enable desired sync options (contacts, activities, deals)',
          'Test sync by creating a sample contact'
        ],
        tips: ['Start with one-way sync to avoid conflicts', 'Monitor sync logs for errors']
      },
      {
        title: 'Website Widget Embed',
        duration: '10 min',
        steps: [
          'Navigate to Integrations → Website Embed',
          'Choose embed method (JavaScript, iframe, or direct link)',
          'Copy the embed code for your chosen method',
          'Paste code into your website (WordPress, Wix, etc.)',
          'Customize widget appearance (position, colors)',
          'Test widget on your live website',
          'Verify chat messages reach your dashboard'
        ],
        tips: ['Use iframe for WordPress/Wix compatibility', 'Test on mobile devices too']
      }
    ]
  },
  {
    id: 'operations',
    title: 'Operations',
    icon: Truck,
    color: 'from-orange-500 to-amber-500',
    guides: [
      {
        title: 'Managing Appointments',
        duration: '10 min',
        steps: [
          'Navigate to Appointments from the sidebar',
          'View calendar or list view of appointments',
          'Click an appointment to view details',
          'Use filters to find specific appointments',
          'Assign or reassign technicians',
          'Update appointment status as needed',
          'Send reminders or notifications to customers'
        ],
        tips: ['Use color coding for appointment status', 'Set up automatic reminders 24h and 1h before']
      },
      {
        title: 'Field Operations Console',
        duration: '15 min',
        steps: [
          'Navigate to Field Operations from the sidebar',
          'Use Map View to see technician locations in real-time',
          'Switch to Agenda View for schedule overview',
          'Monitor Real-Time ETAs in the sidebar panel',
          'Drag and drop to reassign jobs on the map',
          'Track job status updates as they happen',
          'Use filters to focus on specific technicians or areas'
        ],
        tips: ['Map View is ideal for dispatch decisions', 'Agenda View works better for daily planning']
      },
      {
        title: 'Technician Management',
        duration: '12 min',
        steps: [
          'Navigate to Employees section',
          'Add new technicians with the Add Employee button',
          'Assign job types (technician, dispatch, etc.)',
          'Configure individual availability schedules',
          'Set skill tags for intelligent dispatch',
          'Enable technician mobile app access',
          'Monitor technician performance metrics'
        ],
        tips: ['Verify technician mobile app installation', 'Use skill matching for specialized jobs']
      },
      {
        title: 'Technician Mobile App',
        duration: '8 min',
        steps: [
          'Technicians access /technician on their mobile browser',
          'Click "Install App" or use the install banner',
          'Add to home screen for app-like experience',
          'Log in with technician credentials',
          'View assigned jobs in the Jobs tab',
          'Check in/out of jobs with photos',
          'Update job status and notes in real-time'
        ],
        tips: ['The app works offline for basic features', 'Enable location services for accurate ETAs']
      },
      {
        title: 'Technician Check-In Process',
        duration: '8 min',
        steps: [
          'Technician taps large Check-In button on job',
          'Select status: En Route, On Site, or Completed',
          'Upload before photos when arriving on site',
          'Use Get Directions for navigation to customer',
          'Upload after photos when job is complete',
          'Add notes about work performed',
          'Customer receives automatic status notifications'
        ],
        tips: ['Photos document work for warranty purposes', 'GPS location is captured with each check-in']
      },
      {
        title: 'Dispatch & Routing',
        duration: '15 min',
        steps: [
          'Navigate to Field Operations Console',
          'View the dispatch map with technician locations',
          'New jobs appear in the unassigned queue',
          'Auto-dispatch suggests optimal technician',
          'Manually override assignments if needed',
          'Monitor real-time ETA updates',
          'Track job progress on the map'
        ],
        tips: ['Use the dispatcher map view for complex days', 'Consider traffic patterns in route planning']
      }
    ]
  },
  {
    id: 'business',
    title: 'Business & Finance',
    icon: Briefcase,
    color: 'from-indigo-500 to-violet-500',
    guides: [
      {
        title: 'Business & Accounting Console',
        duration: '12 min',
        steps: [
          'Navigate to Business Operations from the sidebar',
          'View Business Ops Overview dashboard for quick overview',
          'Monitor outstanding quotes and invoices',
          'Track revenue trends and payment status',
          'Use Quote Forge for AI-powered quote generation',
          'Access Inventory Matrix for stock levels',
          'Configure payment connections in Settings'
        ],
        tips: ['Business Ops Overview updates in real-time', 'Use Quote Forge for branded PDF quotes']
      },
      {
        title: 'Creating Quotes',
        duration: '8 min',
        steps: [
          'Navigate to Quotes from the sidebar',
          'Click "New Quote" button',
          'Enter customer information',
          'Add line items from service catalog',
          'Apply discounts if applicable',
          'Preview quote before sending',
          'Email quote directly to customer'
        ],
        tips: ['Save quote templates for common services', 'Set quote expiration dates']
      },
      {
        title: 'Quote Forge (AI Quotes)',
        duration: '10 min',
        steps: [
          'Access Quote Forge from Business Operations Console',
          'Select customer or enter new customer details',
          'Describe the job or select from service catalog',
          'AI generates detailed quote with line items',
          'Review and adjust pricing as needed',
          'Generate branded PDF quote',
          'Send directly to customer via email'
        ],
        tips: ['AI uses your service catalog for accurate pricing', 'Customize PDF template in branding settings']
      },
      {
        title: 'Managing Invoices',
        duration: '10 min',
        steps: [
          'Navigate to Invoices from the sidebar',
          'Create invoice from quote or manually',
          'Add payment terms and due date',
          'Send invoice via email',
          'Track payment status',
          'Record payments when received',
          'Generate payment receipts'
        ],
        tips: ['Convert accepted quotes to invoices automatically', 'Set up payment reminders']
      },
      {
        title: 'Payment Connections (Stripe)',
        duration: '15 min',
        steps: [
          'Navigate to Business Operations → Payment Connections',
          'Click Connect Stripe Account',
          'Create or link your Stripe account',
          'Complete Stripe onboarding requirements',
          'Enable payment links on invoices',
          'Configure payment notification settings',
          'Test a payment with a small transaction'
        ],
        tips: ['Stripe handles all payment security', 'Payment links work on any device']
      },
      {
        title: 'Inventory Tracking',
        duration: '12 min',
        steps: [
          'Navigate to Knowledge Base → Inventory',
          'Add inventory items with SKUs',
          'Set minimum quantity thresholds',
          'Track parts usage per job',
          'Receive low-stock alerts',
          'Record inventory adjustments',
          'Generate inventory reports'
        ],
        tips: ['Assign commonly used parts to service types', 'Use barcode scanning for accuracy']
      },
      {
        title: 'Warranty Management',
        duration: '10 min',
        steps: [
          'Navigate to Knowledge Base → Warranties',
          'Create warranty policies for products/services',
          'Set warranty durations and terms',
          'Link warranties to completed jobs',
          'Customers can look up warranty status',
          'Process warranty claims through the system',
          'Track warranty expiration dates'
        ],
        tips: ['Automate warranty registration on job completion', 'Send warranty expiration reminders']
      },
      {
        title: 'Financial Reports',
        duration: '10 min',
        steps: [
          'Navigate to Settings → Reports',
          'Select report type (revenue, expenses, etc.)',
          'Choose date range for the report',
          'Apply filters (customer, service type, etc.)',
          'Generate report with visualizations',
          'Export to PDF or CSV format',
          'Schedule automated report delivery'
        ],
        tips: ['Compare periods to identify trends', 'Use filters for detailed analysis']
      }
    ]
  },
  {
    id: 'marketing',
    title: 'Marketing & Campaigns',
    icon: Megaphone,
    color: 'from-pink-500 to-rose-500',
    guides: [
      {
        title: 'Creating Campaigns',
        duration: '15 min',
        steps: [
          'Navigate to Campaigns from the sidebar',
          'Click "New Campaign" button',
          'Choose campaign type (email, SMS, or both)',
          'Define target audience using filters',
          'Create campaign content (use AI assistance)',
          'Schedule send time or send immediately',
          'Monitor campaign performance metrics'
        ],
        tips: ['A/B test subject lines for better open rates', 'Segment audiences for personalized messaging']
      },
      {
        title: 'Customer Segmentation',
        duration: '10 min',
        steps: [
          'Navigate to Campaigns → Segments',
          'Create new segment with criteria filters',
          'Filter by service history, location, or spend',
          'Use date-based filters (last visit, signup date)',
          'Preview segment size before saving',
          'Save segment for reuse in campaigns',
          'Segments update dynamically as data changes'
        ],
        tips: ['Create segments for repeat customers', 'Use geographic segments for local promotions']
      },
      {
        title: 'Winback Campaigns',
        duration: '12 min',
        steps: [
          'Navigate to Campaigns → Winback',
          'Define "inactive" customer criteria (e.g., 90+ days)',
          'Create compelling winback offer',
          'Set up automated campaign trigger',
          'Choose communication channel (email/SMS)',
          'Track winback conversion rates',
          'Adjust offer based on performance'
        ],
        tips: ['Start with 60-90 day inactivity threshold', 'Offer incentives for returning customers']
      },
      {
        title: 'Referral Program',
        duration: '10 min',
        steps: [
          'Navigate to Referrals from the sidebar',
          'Configure referral reward structure',
          'Set reward values for referrer and referee',
          'Generate referral codes for customers',
          'Track referral conversions',
          'Process rewards for successful referrals',
          'Promote program through automated emails'
        ],
        tips: ['Make rewards attractive enough to motivate sharing', 'Remind customers about referral program post-service']
      },
      {
        title: 'Promo Codes & Discounts',
        duration: '8 min',
        steps: [
          'Navigate to Campaigns → Promo Codes',
          'Create new promo code with unique identifier',
          'Set discount type (percentage or fixed amount)',
          'Define usage limits and expiration date',
          'Restrict to specific services if desired',
          'Share codes through campaigns',
          'Track redemption analytics'
        ],
        tips: ['Use memorable codes for better recall', 'Set reasonable usage limits to prevent abuse']
      },
      {
        title: 'Review Collection',
        duration: '8 min',
        steps: [
          'Enable the Social Media Review Agent',
          'Configure review request timing (post-service)',
          'Set up links to Google, Yelp, Facebook reviews',
          'Customize review request email/SMS templates',
          'Collect feedback before directing to review sites',
          'Monitor incoming feedback and reviews',
          'Respond to reviews promptly'
        ],
        tips: ['Ask satisfied customers for reviews immediately after service', 'Route negative feedback internally first']
      }
    ]
  },
  {
    id: 'analytics',
    title: 'Analytics & Reports',
    icon: BarChart3,
    color: 'from-cyan-500 to-blue-500',
    guides: [
      {
        title: 'Dashboard Analytics',
        duration: '8 min',
        steps: [
          'Navigate to Dashboard for overview metrics',
          'View appointment trends and completion rates',
          'Monitor revenue and invoice status',
          'Check customer satisfaction scores',
          'Review technician utilization',
          'Identify peak booking times',
          'Export data for further analysis'
        ],
        tips: ['Check dashboard daily for operational awareness', 'Set up automated digest emails']
      },
      {
        title: 'Analytics Console',
        duration: '12 min',
        steps: [
          'Navigate to Knowledge Base → Analytics',
          'Use AI-powered insights for recommendations',
          'Generate custom reports by date range',
          'Analyze revenue trends and forecasts',
          'Review customer acquisition costs',
          'Compare performance across time periods',
          'Schedule automated report delivery'
        ],
        tips: ['Use Analytics Agent for natural language queries', 'Compare weekly performance trends']
      },
      {
        title: 'KPI Dashboard',
        duration: '10 min',
        steps: [
          'Access KPI metrics from Analytics console',
          'View key performance indicators at a glance',
          'Monitor conversion rates and response times',
          'Track customer lifetime value trends',
          'Set up alerts for KPI thresholds',
          'Compare KPIs against industry benchmarks',
          'Export KPI reports for stakeholders'
        ],
        tips: ['Focus on 5-7 key metrics', 'Set realistic targets based on historical data']
      },
      {
        title: 'Revenue Analysis',
        duration: '10 min',
        steps: [
          'Navigate to Analytics → Revenue',
          'View revenue breakdown by service type',
          'Analyze trends over time periods',
          'Identify top-performing services',
          'Review revenue per customer metrics',
          'Forecast future revenue with AI predictions',
          'Export revenue reports to CSV/PDF'
        ],
        tips: ['Compare seasonal trends year over year', 'Use forecasts for capacity planning']
      },
      {
        title: 'Setting Up Digests',
        duration: '8 min',
        steps: [
          'Navigate to Settings → Digests',
          'Enable weekly and/or monthly digests',
          'Configure digest recipients (email addresses)',
          'Select metrics to include in digest',
          'Choose delivery day and time',
          'Preview digest format',
          'Review delivery history for past digests'
        ],
        tips: ['Include key stakeholders in digest recipients', 'Keep digest content focused and actionable']
      },
      {
        title: 'Performance Trends',
        duration: '8 min',
        steps: [
          'Access trend analysis from Analytics console',
          'Compare metrics across time periods',
          'Identify patterns and seasonality',
          'Drill down into specific metrics',
          'Use AI to detect anomalies',
          'Set up trend alerts for significant changes',
          'Share trend reports with team'
        ],
        tips: ['Look for weekly and monthly patterns', 'Investigate sudden changes immediately']
      }
    ]
  },
  {
    id: 'knowledge-base',
    title: 'Knowledge Base',
    icon: FileText,
    color: 'from-teal-500 to-green-500',
    guides: [
      {
        title: 'Services Catalog Setup',
        duration: '15 min',
        steps: [
          'Navigate to Knowledge Base → Services',
          'Click "Add Service" button',
          'Enter service name and description',
          'Set pricing (fixed or range)',
          'Define estimated duration',
          'Add service categories for organization',
          'Enable or disable services as needed'
        ],
        tips: ['Include detailed descriptions for AI agent accuracy', 'Update pricing regularly']
      },
      {
        title: 'FAQ Management',
        duration: '10 min',
        steps: [
          'Navigate to Knowledge Base → FAQs',
          'Add frequently asked questions',
          'Provide clear, helpful answers',
          'Organize FAQs by category',
          'AI agents use FAQs for customer responses',
          'Update FAQs based on common inquiries',
          'Upload FAQ document for bulk import'
        ],
        tips: ['Use customer inquiry patterns to identify new FAQs', 'Keep answers concise and accurate']
      },
      {
        title: 'Document Uploads',
        duration: '8 min',
        steps: [
          'Navigate to Knowledge Base → Documents',
          'Click "Upload Document" button',
          'Select PDF, CSV, or markdown files',
          'AI parses document content automatically',
          'Review extracted information',
          'Approve or edit extracted data',
          'Documents enhance AI agent knowledge'
        ],
        tips: ['Upload product manuals for warranty support', 'Update documents when information changes']
      },
      {
        title: 'Business Hours Configuration',
        duration: '5 min',
        steps: [
          'Navigate to Knowledge Base → Hours',
          'Set operating hours for each day',
          'Mark days as closed if applicable',
          'Add holiday closures',
          'Configure after-hours messaging',
          'AI agents respect business hours for scheduling'
        ],
        tips: ['Update hours for holidays in advance', 'Set up emergency contact for after-hours']
      },
      {
        title: 'Inventory Management',
        duration: '12 min',
        steps: [
          'Navigate to Knowledge Base → Inventory',
          'Add parts and supplies with SKU codes',
          'Set stock quantities and minimum levels',
          'Configure low-stock alert thresholds',
          'Track inventory usage per job',
          'Run inventory reports for ordering'
        ],
        tips: ['Regular stock audits ensure accuracy', 'Link common parts to service types']
      },
      {
        title: 'Warranty Policies',
        duration: '8 min',
        steps: [
          'Navigate to Knowledge Base → Warranties',
          'Create warranty policy templates',
          'Define coverage terms and durations',
          'Set up automatic warranty assignment',
          'Enable customer warranty lookups',
          'Process and track warranty claims'
        ],
        tips: ['Clear warranty terms reduce disputes', 'Send reminders before warranties expire']
      }
    ]
  }
];

// Guides restricted to platform_admin only (containing inventory/warranty/marketing content)
const RESTRICTED_GUIDE_TITLES = [
  'Inventory Tracking', 
  'Warranty Management', 
  'Inventory Management', 
  'Warranty Policies', 
  'Quote Forge (AI Quotes)',
  'Business Ops Agents',
  'Marketing & Campaign Agents',
  'Analytics & Reporting Agents',
  'Analytics Console',
  'KPI Dashboard',
  'Revenue Analysis',
  'Performance Trends'
];

// Categories hidden from non-platform-admin
const RESTRICTED_CATEGORIES = ['marketing', 'analytics'];

const PlatformGuides: React.FC = () => {
  const { userRole } = useAuth();
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
          featureColor="platform"
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
                  <p className="text-2xl font-bold">22</p>
                  <p className="text-xs text-card-foreground/70">AI Agents</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-br from-green-500/10 to-green-500/5 border-green-500/20">
            <CardContent className="pt-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-green-500/10">
                  <Puzzle className="h-5 w-5 text-green-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold">6</p>
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
                            : 'hover:bg-muted'
                        }`}
                      >
                        <div className={`p-2 rounded-lg shrink-0 ${isSelected ? 'bg-primary-foreground/20' : `bg-gradient-to-br ${category.color}`}`}>
                          <Icon className={`h-4 w-4 ${isSelected ? 'text-primary-foreground' : 'text-white'}`} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className={`font-medium text-sm ${isSelected ? '' : 'text-card-foreground'}`}>
                            {category.title}
                          </p>
                          <p className={`text-xs ${isSelected ? 'text-primary-foreground/70' : 'text-card-foreground/70'}`}>
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
                  <div className={`p-3 rounded-xl bg-gradient-to-br ${currentCategory.color}`}>
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
                               <p className="text-sm text-card-foreground/70 pt-0.5">{step}</p>
                            </div>
                          ))}
                        </div>

                        {/* Tips */}
                        {guide.tips && guide.tips.length > 0 && (
                          <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-4 mt-4">
                            <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400 mb-2">
                              <Lightbulb className="h-4 w-4" />
                              <span className="font-medium text-sm">Pro Tips</span>
                            </div>
                            <ul className="space-y-1">
                              {guide.tips.map((tip, tipIndex) => (
                                 <li key={tipIndex} className="text-sm text-card-foreground/70 flex items-start gap-2">
                                   <CheckCircle2 className="h-4 w-4 text-amber-500 flex-shrink-0 mt-0.5" />
                                   {tip}
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
