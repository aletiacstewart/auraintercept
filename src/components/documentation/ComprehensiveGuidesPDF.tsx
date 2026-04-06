import React from 'react';
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
} from '@react-pdf/renderer';
import { sanitizePdfText } from './pdfSanitize';

const colors = {
  primary: '#6366f1',
  secondary: '#8b5cf6',
  accent: '#06b6d4',
  dark: '#1e1b4b',
  gray: '#64748b',
  lightGray: '#f1f5f9',
  white: '#ffffff',
  green: '#10b981',
  amber: '#f59e0b',
};

const styles = StyleSheet.create({
  page: {
    padding: 40,
    fontFamily: 'Helvetica',
    fontSize: 10,
    color: colors.dark,
    backgroundColor: colors.white,
  },
  coverPage: {
    padding: 60,
    fontFamily: 'Helvetica',
    backgroundColor: colors.dark,
    color: colors.white,
    justifyContent: 'center',
    alignItems: 'center',
  },
  coverTitle: {
    fontSize: 32,
    fontWeight: 700,
    marginBottom: 12,
    textAlign: 'center',
  },
  coverSubtitle: {
    fontSize: 16,
    marginBottom: 30,
    textAlign: 'center',
    color: '#a5b4fc',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: colors.lightGray,
  },
  headerTitle: {
    fontSize: 8,
    color: colors.gray,
  },
  pageNumber: {
    fontSize: 8,
    color: colors.gray,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 700,
    color: colors.primary,
    marginBottom: 12,
  },
  categoryTitle: {
    fontSize: 14,
    fontWeight: 600,
    color: colors.secondary,
    marginBottom: 8,
    marginTop: 16,
    paddingBottom: 4,
    borderBottomWidth: 1,
    borderBottomColor: colors.lightGray,
  },
  guideTitle: {
    fontSize: 12,
    fontWeight: 600,
    color: colors.dark,
    marginBottom: 6,
    marginTop: 12,
  },
  guideDuration: {
    fontSize: 9,
    color: colors.accent,
    marginBottom: 8,
  },
  stepContainer: {
    marginLeft: 10,
    marginBottom: 4,
  },
  stepNumber: {
    fontSize: 9,
    fontWeight: 600,
    color: colors.primary,
    marginRight: 6,
  },
  stepText: {
    fontSize: 9,
    color: colors.dark,
    lineHeight: 1.5,
  },
  tipBox: {
    backgroundColor: '#fef3c7',
    padding: 8,
    marginTop: 8,
    marginBottom: 8,
    borderRadius: 4,
    borderLeftWidth: 3,
    borderLeftColor: colors.amber,
  },
  tipTitle: {
    fontSize: 9,
    fontWeight: 600,
    color: colors.amber,
    marginBottom: 4,
  },
  tipText: {
    fontSize: 8,
    color: colors.dark,
    lineHeight: 1.4,
  },
  tocItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
    paddingBottom: 4,
    borderBottomWidth: 1,
    borderBottomColor: colors.lightGray,
    borderBottomStyle: 'dotted',
  },
  tocTitle: {
    fontSize: 10,
  },
  tocPage: {
    fontSize: 10,
    color: colors.primary,
  },
  footer: {
    position: 'absolute',
    bottom: 30,
    left: 40,
    right: 40,
    fontSize: 8,
    color: colors.gray,
    textAlign: 'center',
  },
  bulletRow: {
    flexDirection: 'row',
    marginBottom: 3,
    paddingLeft: 15,
  },
  bullet: {
    fontSize: 9,
    color: colors.primary,
    width: 12,
  },
  bulletText: {
    fontSize: 9,
    flex: 1,
    lineHeight: 1.4,
  },
});

const Header = ({ title }: { title: string }) => (
  <View style={styles.header} fixed>
    <Text style={styles.headerTitle}>Aura Intercept - {title}</Text>
    <Text style={styles.pageNumber} render={({ pageNumber, totalPages }) => `Page ${pageNumber} of ${totalPages}`} />
  </View>
);

const Footer = () => (
  <View style={styles.footer} fixed>
    <Text>Aura Intercept Platform - Comprehensive User Guide - {new Date().toLocaleDateString()}</Text>
  </View>
);

// All guide data - synchronized with PlatformGuides.tsx
const guideCategories = [
  {
    title: 'Getting Started',
    guides: [
      {
        title: 'Platform Overview',
        duration: '5 min',
        steps: [
          'Log in to your admin dashboard at /auth',
          'Explore the main navigation sidebar on the left',
          'Review your subscription tier (Aura Core, Aura Boost, Aura Pro, or Aura Elite)',
          'Navigate to Dashboard for company overview and KPIs',
          'Check the DashboardSetupNav bar for Quick Setup progress'
        ],
        tips: ['Use Ask Aura voice navigation with Ctrl+Shift+V']
      },
      {
        title: 'Quick Setup Wizard',
        duration: '15 min',
        steps: [
          'Access Quick Setup from Dashboard → DashboardSetupNav bar',
          'Complete company branding (logo, colors) in Settings → Branding',
          'Configure business hours in Knowledge Base → Hours',
          'Add your services catalog in Knowledge Base → Services',
          'Set up FAQs for AI agent accuracy',
          'Create employee accounts with job type assignments'
        ],
        tips: ['Track progress in the DashboardSetupNav progress bars']
      },
      {
        title: 'Subscription Tiers',
        duration: '10 min',
        steps: [
          'Aura Core ($197/mo): 8 Smart AI Agents + 3 Consoles, 10 employees',
          'Aura Boost ($497/mo): 12 Smart AI Agents + 5 Consoles, 25 employees',
          'Aura Pro ($997/mo): 16 Smart AI Agents + 5 Consoles, 50 employees, White-Label',
          'Aura Elite ($1,997/mo): All 24 Smart AI Agents + 7 Consoles + AI Operatives Hub, Unlimited employees',
          'All tiers include API Access and Embeddable Chat Widget'
        ],
        tips: ['Trial users get full Elite tier access', 'Annual billing saves ~20%']
      },
      {
        title: 'User Roles & Permissions',
        duration: '8 min',
        steps: [
          'Platform Admin: Full system access across all companies',
          'Company Admin: Full access to their company features',
          'Manager: Operations management without system settings',
          'Dispatch: Field operations and technician management',
          'Technician: Mobile app access for field jobs'
        ],
        tips: ['Follow principle of least privilege']
      },
      {
        title: 'Customer Portal Setup',
        duration: '8 min',
        steps: [
          'Customers access portal at /customer-portal or via widget',
          'Core: AI Assistant, Services, Contact, Hours tabs',
          'Boost+: Full suite with Appointments, Voice AI, Contact, Hours tabs',
          'Portal supports multi-company access',
          'Talk to Aura (Voice) included for Core+ tiers'
        ],
        tips: ['Widget works on WordPress, Wix, and any HTML site']
      }
    ]
  },
  {
    title: 'AI Agents Configuration',
    guides: [
      {
        title: 'AI Operatives Hub Overview',
        duration: '10 min',
        steps: [
          'Navigate to AI Operatives Hub from the sidebar',
          'View all 24 Smart AI Agents organized across 7 Control Centers (Consoles)',
          'Operatives locked by tier show "Locked" badge',
          'Click any operative card to view settings and dependencies',
          'Enable/disable operatives with the toggle switch'
        ],
        tips: ['Start with Customer Portal operatives first']
      },
      {
        title: 'AI Receptionist (Triage)',
        duration: '10 min',
        steps: [
          'Primary entry point for all customer interactions',
          'Collects customer name, phone, and intent before handoff',
          'Routes to specialized agents based on inquiry type',
          'Configure greeting in AI Agents Hub',
          'Works across Voice, SMS, Email, and Widget channels'
        ],
        tips: ['Required for all other customer-facing agents']
      },
      {
        title: 'Scheduling Agent',
        duration: '10 min',
        steps: [
          'Enable in AI Agents Hub (requires Boost+ tier)',
          'Checks business hours and employee availability',
          'Presents available time slots to customers',
          'Creates confirmed appointments in the system',
          'Hands off to Dispatch Agent for technician assignment'
        ],
        tips: ['Ensure business hours are configured accurately']
      },
      {
        title: 'Follow-up & Review Agents',
        duration: '8 min',
        steps: [
          'Follow-up Agent: Automated post-service check-ins',
          'Review Agent: Collects ratings and routes to review sites',
          'Both depend on AI Receptionist being enabled',
          'Configure templates in Settings → Email Templates',
          'Negative feedback routes internally first'
        ],
        tips: ['Both agents included in Core tier']
      },
      {
        title: 'Field Operations Agents',
        duration: '12 min',
        steps: [
          'Dispatch Agent: Assigns technicians based on skills/zones',
          'Route Agent: Optimizes travel routes',
          'ETA Agent: Sends real-time arrival updates',
          'Check-in Agent: On-site status with photo documentation',
          'All require Boost+ tier'
        ],
        tips: ['Enable GPS on technician mobile devices']
      },
      {
        title: 'Business Operations Agents',
        duration: '10 min',
        steps: [
          'Admin Agent: Business administration and settings (Elite)',
          'Quoting Agent: Generates quotes from service catalog (Elite)',
          'Invoice Agent: Creates invoices and tracks payments (Elite)',
          'Inventory Agent: Monitors stock levels (Elite)',
          'All Business Operations agents require Elite tier'
        ],
        tips: ['Link Quote Forge to your service catalog']
      },
      {
        title: 'Social Media Agents',
        duration: '12 min',
        steps: [
          'Creative Content Agent: Creates posts for 6 platforms',
          'Social Feed Queue: Queues and publishes content',
          'Social Media Analytics: Tracks engagement metrics',
          'Uses 3-step Content Wizard: Template → Customize → Schedule',
          'All Social Media agents require Pro+ tier'
        ],
        tips: ['Respects platform character limits automatically']
      },
      {
        title: 'Analytics Agents',
        duration: '10 min',
        steps: [
          'Insights Agent: Natural language business queries',
          'Performance Agent: Tracks KPIs and operational metrics',
          'Revenue Agent: Analyzes financial trends and forecasts',
          'Forecast Agent: Predicts demand and capacity needs',
          'All analytics agents require Command tier'
        ],
        tips: ['Use form-based interfaces for structured reports']
      },
      {
        title: 'Talk to Aura (Voice)',
        duration: '8 min',
        steps: [
          'Talk to Aura (Voice) powered by ElevenLabs included in Core+ tiers',
          'Customers can speak naturally with AI agents',
          'Supports inbound and outbound voice interactions',
          'Configure voice settings in Integrations → Voice Agent',
          'Voice cloning available with ElevenLabs account'
        ],
        tips: ['Choose a voice matching your brand personality']
      }
    ]
  },
  {
    title: 'Integrations Setup',
    guides: [
      {
        title: 'SignalWire Voice & SMS',
        duration: '15 min',
        steps: [
          'Navigate to Integrations → Voice Agent or SMS & Text',
          'Create SignalWire account at signalwire.com',
          'Obtain Project ID and API Token',
          'Purchase a phone number with Voice and SMS',
          'Enter credentials in integration settings',
          'Configure call handling and SMS templates'
        ],
        tips: ['Use a local number for better answer rates']
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
          'Test voice output with sample greeting'
        ],
        tips: ['Higher stability = more consistent voice']
      },
      {
        title: 'Resend Email Integration',
        duration: '12 min',
        steps: [
          'Navigate to Integrations → Email',
          'Create Resend account at resend.com',
          'Verify your sending domain with DNS records',
          'Obtain Resend API key',
          'Configure email templates in Settings'
        ],
        tips: ['Set up SPF and DKIM for deliverability']
      },
      {
        title: 'Google Calendar Sync',
        duration: '10 min',
        steps: [
          'Navigate to Integrations → Calendar',
          'Click Connect Google Calendar button',
          'Sign in with your Google account',
          'Grant calendar read/write permissions',
          'Select calendar to sync appointments'
        ],
        tips: ['Use dedicated business calendar']
      },
      {
        title: 'Stripe Payments',
        duration: '15 min',
        steps: [
          'Navigate to Integrations → Payment Connections',
          'Click Connect Stripe Account',
          'Create or link existing Stripe account',
          'Complete Stripe verification requirements',
          'Enable payment links on invoices'
        ],
        tips: ['Stripe handles all PCI compliance']
      },
      {
        title: 'Social Media Integration (Platform OAuth)',
        duration: '10 min',
        steps: [
          'Social media uses platform-level OAuth (one-time setup by platform admin)',
          'Platform admin registers master apps for Meta, LinkedIn, TikTok, Google',
          'Navigate to Integrations → Social Media → Platform Credentials Settings',
          'Enter Client ID and Secret for each platform',
          'Once configured, tenants connect with one-click "Connect with [Platform]" buttons',
          'Tenant tokens stored securely per-company',
          'Supports Instagram, Facebook, LinkedIn, TikTok, Google Business'
        ],
        tips: ['Platform admin does this once; tenants just click Connect', 'Meta requires Business Verification for production use']
      },
      {
        title: 'Tavily AI Research',
        duration: '8 min',
        steps: [
          'Navigate to Integrations → AI Research',
          'Optional integration for enhanced AI content research',
          'Create Tavily account at tavily.com (1,000 free searches/month)',
          'Generate and enter API key',
          'Content Engine uses Tavily for real-time industry research',
          'Improves accuracy of social, blog, and campaign content',
          'Status shown via Tavily badge on content creation forms'
        ],
        tips: ['Great for industry-specific content', 'Free tier sufficient for most businesses']
      },
    ]
  },
  {
    title: 'Operations Management',
    guides: [
      {
        title: 'Field Operations Console',
        duration: '12 min',
        steps: [
          'Navigate to Field Operations from sidebar',
          'Quick Action Tabs: Map View, Schedule, Dispatch, Check-in',
          'Map View shows real-time technician GPS locations',
          'Dispatch tab for job assignment and routing',
          'Schedule tab for daily/weekly planning'
        ],
        tips: ['Map View ideal for dispatchers']
      },
      {
        title: 'Managing Appointments',
        duration: '10 min',
        steps: [
          'Navigate to Appointments from sidebar',
          'Toggle between Calendar and List view',
          'Click appointment for details and actions',
          'Use filters by status, technician, or date range',
          'Send reminders via Email/SMS'
        ],
        tips: ['Set up 24h and 1h automatic reminders']
      },
      {
        title: 'Technician Mobile App',
        duration: '8 min',
        steps: [
          'Technicians access app at /technician on mobile browser',
          'Click Install App banner for PWA installation',
          'Add to home screen for native app experience',
          'View assigned jobs in Jobs tab',
          'Check in/out with status updates and photos'
        ],
        tips: ['PWA works offline for basic features']
      },
      {
        title: 'Technician Check-In Process',
        duration: '8 min',
        steps: [
          'Technician taps Check-In button on job card',
          'Select status: En Route, On Site, or Completed',
          'Upload before photos when arriving on site',
          'Customer receives automatic status notification',
          'Complete work and upload after photos'
        ],
        tips: ['GPS location captured with each status update']
      },
      {
        title: 'Dispatch & Route Optimization',
        duration: '10 min',
        steps: [
          'Access Field Operations Console → Dispatch tab',
          'View unassigned jobs in the queue',
          'Auto-dispatch suggests optimal technician match',
          'Route Agent optimizes travel between jobs',
          'Monitor real-time ETA updates on map'
        ],
        tips: ['Use skill tags for specialized job matching']
      },
      {
        title: 'Employee Management',
        duration: '10 min',
        steps: [
          'Navigate to Employees section from sidebar',
          'Add new employees with Add Employee button',
          'Assign job types (Technician, Dispatch, Manager)',
          'Configure individual availability schedules',
          'Generate registration codes for self-onboarding'
        ],
        tips: ['Registration codes simplify onboarding']
      }
    ]
  },
  {
    title: 'Business & Finance',
    guides: [
      {
        title: 'Business Ops Console',
        duration: '10 min',
        steps: [
          'Navigate to Business Ops Hub from sidebar',
          'Quick Action Tabs: Companies, Employees, Customers, Inventory',
          'View real-time KPIs for quotes, invoices, and revenue',
          'Access Quote Forge for AI-powered quote generation',
          'Inventory tab requires Command tier'
        ],
        tips: ['Use Business Ops Overview for executive dashboard']
      },
      {
        title: 'Creating & Managing Quotes',
        duration: '10 min',
        steps: [
          'Navigate to Quotes from sidebar',
          'Click New Quote to create manually',
          'Or use Quote Forge for AI-generated quotes',
          'Add line items from service catalog',
          'Generate branded PDF quote'
        ],
        tips: ['Quote templates speed up common services']
      },
      {
        title: 'Invoice Management',
        duration: '10 min',
        steps: [
          'Navigate to Invoices from sidebar',
          'Convert accepted quotes to invoices automatically',
          'Add payment terms and due date',
          'Enable Stripe payment links for online payment',
          'Track payment status and send reminders'
        ],
        tips: ['Payment link invoices get paid 2x faster']
      },
      {
        title: 'Inventory Tracking',
        duration: '10 min',
        steps: [
          'Navigate to Knowledge Base → Inventory (Command tier)',
          'Add inventory items with SKU codes',
          'Set minimum quantity thresholds',
          'Configure low-stock alert notifications',
          'Inventory Agent monitors and alerts automatically'
        ],
        tips: ['Link common parts to service types']
      },
      {
        title: 'Payment Connections',
        duration: '10 min',
        steps: [
          'Navigate to Integrations → Payment Connections',
          'Connect Stripe account for payment processing',
          'Enable payment links on invoices',
          'Customers pay via any device with link',
          'Payments automatically recorded'
        ],
        tips: ['Stripe handles all security compliance']
      }
    ]
  },
  {
    title: 'Outreach & Campaigns',
    guides: [
      {
        title: 'Outreach & Sales Ops Console',
        duration: '10 min',
        steps: [
          'Navigate to Outreach & Sales Ops (Command tier)',
          'Quick Action Tabs: Campaign, Leads, Marketing',
          'Create and manage marketing campaigns',
          'Configure promo codes and discounts',
          'Manage lead pipeline and segmentation'
        ],
        tips: ['Focus on Campaign and Leads tabs first']
      },
      {
        title: 'Creating Campaigns',
        duration: '12 min',
        steps: [
          'Navigate to Campaigns tab in Marketing Console',
          'Click New Campaign button',
          'Choose channel: Email, SMS, or multi-channel',
          'Select target segment or create new',
          'Create content with AI generation assistance'
        ],
        tips: ['A/B test subject lines']
      },
      {
        title: 'Customer Segmentation',
        duration: '8 min',
        steps: [
          'Navigate to Segments tab in Marketing Console',
          'Create new segment with filter criteria',
          'Filter by service history, location, or spend',
          'Preview segment size before saving',
          'Segments update dynamically'
        ],
        tips: ['Create segment for repeat customers']
      },
      {
        title: 'Promo Codes & Discounts',
        duration: '8 min',
        steps: [
          'Navigate to Promos tab in Marketing Console',
          'Create promo code with unique identifier',
          'Set discount type (percentage or fixed)',
          'Define usage limits and expiration',
          'Track redemption in analytics'
        ],
        tips: ['Use memorable codes for better recall']
      },
      {
        title: 'Referral Program',
        duration: '8 min',
        steps: [
          'Navigate to Referrals tab in Marketing Console',
          'Configure reward structure for referrer and referee',
          'Set reward values (discount or credit)',
          'Generate unique referral codes per customer',
          'Track referral conversions'
        ],
        tips: ['Remind customers post-service']
      },
      {
        title: 'Review Collection',
        duration: '8 min',
        steps: [
          'Navigate to Review tab in Marketing Console',
          'Review Agent sends requests post-service',
          'Collects rating before directing to review sites',
          'Negative feedback routes internally first',
          'Monitor review analytics'
        ],
        tips: ['Ask immediately after positive service']
      }
    ]
  },
  {
    title: 'Social Media Ops',
    guides: [
      {
        title: 'Social Media Console',
        duration: '10 min',
        steps: [
          'Navigate to Social Media Ops from sidebar (Growth+ tier)',
          'Quick Action Tabs: Home, Templates, Compose, Schedule, Analytics',
          'Supports 6 platforms: IG, FB, LI, TT, GMB, SMS',
          'AI-powered content generation and scheduling',
          'Cross-platform analytics tracking',
          'Connect accounts via OAuth in Social Media Settings'
        ],
        tips: ['Platform admin must configure OAuth credentials first']
      },
      {
        title: '3-Step Content Wizard',
        duration: '12 min',
        steps: [
          'Step 1 - Template: Choose from pre-built templates',
          'Step 2 - Customize: Edit content, add images, apply brand voice',
          'Step 3 - Schedule: Select platforms and set publish times',
          'AI auto-adjusts content for platform limits',
          'Preview posts before scheduling'
        ],
        tips: ['Templates maintain brand consistency']
      },
      {
        title: 'Platform Configuration',
        duration: '10 min',
        steps: [
          'Navigate to Social Media Ops → Settings',
          'Connect accounts via "Connect with [Platform]" OAuth buttons',
          'Platform admin configures global credentials in Platform Credentials Settings',
          'Tenants authorize with one-click per platform',
          'Configure default hashtags and mentions',
          'Set brand voice guidelines',
          'Enable/disable specific platforms'
        ],
        tips: ['Use consistent branding across platforms', 'Contact platform admin if "Not Configured" appears']
      },
      {
        title: 'Social Analytics',
        duration: '8 min',
        steps: [
          'Navigate to Analytics tab in Social Media Console',
          'View engagement metrics per platform',
          'Track post performance (likes, shares, comments)',
          'Compare platform performance',
          'Export social reports to PDF/CSV'
        ],
        tips: ['Track trends over time']
      }
    ]
  },
  {
    title: 'Analytics & Reports',
    guides: [
      {
        title: 'Analytics Console',
        duration: '10 min',
        steps: [
          'Navigate to Analytics & Reports Ops (Command tier)',
          'Tabs: Home, Performance, Revenue, Customers, Trends, KPI, Export',
          'Form-based interfaces for structured reporting',
          'AI Insights Agent for natural language queries',
          'Export capabilities for all report types'
        ],
        tips: ['Use structured forms for consistent reports']
      },
      {
        title: 'Performance Reports',
        duration: '8 min',
        steps: [
          'Navigate to Performance tab in Analytics Console',
          'Select date range and metrics to analyze',
          'View appointment completion rates',
          'Track technician utilization and efficiency',
          'Export performance reports to PDF/CSV'
        ],
        tips: ['Weekly reviews catch issues early']
      },
      {
        title: 'Revenue Analysis',
        duration: '10 min',
        steps: [
          'Navigate to Revenue tab in Analytics Console',
          'View revenue breakdown by service type',
          'Identify top-performing services',
          'Forecast Agent predicts future revenue',
          'Export financial reports'
        ],
        tips: ['Compare seasonal trends year over year']
      },
      {
        title: 'Export Reports',
        duration: '8 min',
        steps: [
          'Navigate to Export tab in Analytics Console',
          'Select data sets to include (Jobs, Revenue, Social)',
          'Choose field categories (Financials, Marketing)',
          'Select export format (CSV or PDF)',
          'Download report immediately'
        ],
        tips: ['CSV for data analysis, PDF for presentations']
      },
      {
        title: 'Setting up Reports',
        duration: '8 min',
        steps: [
          'Navigate to Settings → Digests',
          'Enable weekly and/or monthly digests',
          'Configure recipient email addresses',
          'Select metrics to include',
          'Digests sent automatically on schedule'
        ],
        tips: ['Include key stakeholders as recipients']
      }
    ]
  },
  {
    title: 'Knowledge Base Setup',
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
          'Services used by Quoting Agent and Customer Portal'
        ],
        tips: ['Detailed descriptions improve AI accuracy']
      },
      {
        title: 'FAQ Management',
        duration: '10 min',
        steps: [
          'Navigate to Knowledge Base → FAQs',
          'Add frequently asked questions',
          'Provide clear, helpful answers',
          'AI agents reference FAQs for customer responses',
          'Bulk import from document upload'
        ],
        tips: ['Use real customer questions']
      },
      {
        title: 'Document Uploads',
        duration: '8 min',
        steps: [
          'Navigate to Knowledge Base → Documents',
          'Click Upload Document button',
          'Supports PDF, CSV, and markdown files',
          'AI parses content automatically',
          'Documents enhance AI agent knowledge'
        ],
        tips: ['Upload service manuals for better support']
      },
      {
        title: 'Business Hours Configuration',
        duration: '5 min',
        steps: [
          'Navigate to Knowledge Base → Hours',
          'Set operating hours for each day of week',
          'Add holiday closures in advance',
          'Configure after-hours messaging',
          'Scheduling Agent respects these hours'
        ],
        tips: ['Update hours before holidays']
      },
      {
        title: 'Inventory Management',
        duration: '12 min',
        steps: [
          'Navigate to Knowledge Base → Inventory (Command tier)',
          'Add parts and supplies with SKU codes',
          'Set stock quantities and minimum levels',
          'Configure low-stock alert thresholds',
          'Inventory Agent monitors and sends alerts'
        ],
        tips: ['Regular audits ensure accuracy']
      }
    ]
  }
];

export const ComprehensiveGuidesPDF: React.FC = () => {
  let currentPage = 3; // Start after cover and TOC
  const tocEntries: { title: string; page: number }[] = [];
  
  guideCategories.forEach(category => {
    tocEntries.push({ title: category.title, page: currentPage });
    currentPage += Math.ceil(category.guides.length / 3) + 1;
  });

  return (
    <Document>
      {/* Cover Page */}
      <Page size="A4" style={styles.coverPage}>
        <Text style={styles.coverTitle}>Aura Intercept</Text>
        <Text style={styles.coverSubtitle}>Comprehensive Platform User Guide</Text>
        <View style={{ marginTop: 40, alignItems: 'center' }}>
          <View style={{ flexDirection: 'row', gap: 30, marginBottom: 20 }}>
            <View style={{ alignItems: 'center' }}>
              <Text style={{ fontSize: 28, fontWeight: 700, color: colors.accent }}>
                {guideCategories.length}
              </Text>
              <Text style={{ fontSize: 10, color: '#a5b4fc' }}>Categories</Text>
            </View>
            <View style={{ alignItems: 'center' }}>
              <Text style={{ fontSize: 28, fontWeight: 700, color: colors.accent }}>
                {guideCategories.reduce((acc, c) => acc + c.guides.length, 0)}
              </Text>
              <Text style={{ fontSize: 10, color: '#a5b4fc' }}>Guides</Text>
            </View>
            <View style={{ alignItems: 'center' }}>
              <Text style={{ fontSize: 28, fontWeight: 700, color: colors.accent }}>24</Text>
              <Text style={{ fontSize: 10, color: '#a5b4fc' }}>AI Agents</Text>
            </View>
          </View>
        </View>
        <View style={{ marginTop: 60 }}>
          <Text style={{ fontSize: 11, textAlign: 'center', color: '#a5b4fc' }}>
            Step-by-Step Instructions for Every Feature
          </Text>
          <Text style={{ fontSize: 10, textAlign: 'center', color: '#a5b4fc', marginTop: 8 }}>
            Generated: {new Date().toLocaleDateString()}
          </Text>
        </View>
      </Page>

      {/* Table of Contents */}
      <Page size="A4" style={styles.page}>
        <Header title="Table of Contents" />
        <Text style={styles.sectionTitle}>Table of Contents</Text>
        <View style={{ marginTop: 10 }}>
          {guideCategories.map((category, i) => (
            <View key={i}>
              <View style={styles.tocItem}>
                <Text style={[styles.tocTitle, { fontWeight: 600 }]}>
                  {i + 1}. {category.title}
                </Text>
                <Text style={styles.tocPage}>{tocEntries[i]?.page || i + 3}</Text>
              </View>
              {category.guides.map((guide, j) => (
                <View key={j} style={[styles.tocItem, { paddingLeft: 15 }]}>
                  <Text style={[styles.tocTitle, { fontSize: 9, color: colors.gray }]}>
                    {guide.title}
                  </Text>
                </View>
              ))}
            </View>
          ))}
        </View>
        <Footer />
      </Page>

      {/* Guide Pages */}
      {guideCategories.map((category, catIndex) => (
        <Page key={catIndex} size="A4" style={styles.page} wrap>
          <Header title={category.title} />
          <Text style={styles.sectionTitle}>{category.title}</Text>
          
          {category.guides.map((guide, guideIndex) => (
            <View key={guideIndex} wrap={false}>
              <Text style={styles.guideTitle}>
                {guideIndex + 1}. {guide.title}
              </Text>
              <Text style={styles.guideDuration}>Estimated time: {guide.duration}</Text>
              
              {guide.steps.map((step, stepIndex) => (
                <View key={stepIndex} style={styles.stepContainer}>
                  <View style={{ flexDirection: 'row' }}>
                    <Text style={styles.stepNumber}>{stepIndex + 1}.</Text>
                    <Text style={styles.stepText}>{step}</Text>
                  </View>
                </View>
              ))}
              
              {guide.tips && guide.tips.length > 0 && (
                <View style={styles.tipBox}>
                  <Text style={styles.tipTitle}>Pro Tip</Text>
                  {guide.tips.map((tip, tipIndex) => (
                    <Text key={tipIndex} style={styles.tipText}>- {sanitizePdfText(tip)}</Text>
                  ))}
                </View>
              )}
            </View>
          ))}
          
          <Footer />
        </Page>
      ))}

      {/* Quick Reference Page */}
      <Page size="A4" style={styles.page}>
        <Header title="Quick Reference" />
        <Text style={styles.sectionTitle}>Quick Reference</Text>
        
        <Text style={styles.categoryTitle}>AI Agent Categories (24 Total)</Text>
        <View style={styles.bulletRow}>
          <Text style={styles.bullet}>-</Text>
          <Text style={styles.bulletText}>Customer Portal (4 agents): AI Receptionist, Scheduling, Follow-up, Review</Text>
        </View>
        <View style={styles.bulletRow}>
          <Text style={styles.bullet}>-</Text>
          <Text style={styles.bulletText}>Field Operations (4 agents): Dispatch, Route, ETA, Check-in</Text>
        </View>
        <View style={styles.bulletRow}>
          <Text style={styles.bullet}>-</Text>
          <Text style={styles.bulletText}>Business Management (4 agents): Admin, Quoting, Invoice, Inventory</Text>
        </View>
        <View style={styles.bulletRow}>
          <Text style={styles.bullet}>-</Text>
          <Text style={styles.bulletText}>Outreach & Sales Ops (3 agents): Campaign, Lead, Marketing</Text>
        </View>
        <View style={styles.bulletRow}>
          <Text style={styles.bullet}>-</Text>
          <Text style={styles.bulletText}>Social Media (3 agents): Social Content, Social Scheduler, Social Analytics</Text>
        </View>
        <View style={styles.bulletRow}>
          <Text style={styles.bullet}>-</Text>
          <Text style={styles.bulletText}>Creative & Web Presence (2 agents): Creative Agent, Web Presence Agent</Text>
        </View>
        <View style={styles.bulletRow}>
          <Text style={styles.bullet}>-</Text>
          <Text style={styles.bulletText}>Analytics & Reports (4 agents): Insights, Performance, Revenue, Forecast</Text>
        </View>

        <Text style={styles.categoryTitle}>Subscription Tiers (4-Tier Growth Ladder)</Text>
        <View style={styles.bulletRow}>
          <Text style={styles.bullet}>-</Text>
          <Text style={styles.bulletText}>Aura Core ($197/mo): 8 agents, 3 consoles, 10 employees</Text>
        </View>
        <View style={styles.bulletRow}>
          <Text style={styles.bullet}>-</Text>
          <Text style={styles.bulletText}>Aura Boost ($497/mo): 12 agents, 5 consoles, 25 employees</Text>
        </View>
        <View style={styles.bulletRow}>
          <Text style={styles.bullet}>-</Text>
          <Text style={styles.bulletText}>Aura Pro ($997/mo): 16 agents, 5 consoles, 50 employees</Text>
        </View>
        <View style={styles.bulletRow}>
          <Text style={styles.bullet}>-</Text>
          <Text style={styles.bulletText}>Aura Elite ($1,997/mo): All 24 Smart AI Agents, 7 consoles + AI Operatives Hub, unlimited employees</Text>
        </View>

        <Text style={styles.categoryTitle}>Key URLs</Text>
        <View style={styles.bulletRow}>
          <Text style={styles.bullet}>-</Text>
          <Text style={styles.bulletText}>Admin Dashboard: /dashboard</Text>
        </View>
        <View style={styles.bulletRow}>
          <Text style={styles.bullet}>-</Text>
          <Text style={styles.bulletText}>Technician App: /technician</Text>
        </View>
        <View style={styles.bulletRow}>
          <Text style={styles.bullet}>-</Text>
          <Text style={styles.bulletText}>Customer Portal: /customer-portal</Text>
        </View>
        <View style={styles.bulletRow}>
          <Text style={styles.bullet}>-</Text>
          <Text style={styles.bulletText}>Public Chat Widget: /chat/[company-slug]</Text>
        </View>

        <Text style={styles.categoryTitle}>Keyboard Shortcuts</Text>
        <View style={styles.bulletRow}>
          <Text style={styles.bullet}>-</Text>
          <Text style={styles.bulletText}>Ctrl/Cmd + Shift + V: Toggle Ask Aura Voice Mode</Text>
        </View>
        <View style={styles.bulletRow}>
          <Text style={styles.bullet}>-</Text>
          <Text style={styles.bulletText}>Ctrl/Cmd + K: Quick search</Text>
        </View>
        <View style={styles.bulletRow}>
          <Text style={styles.bullet}>-</Text>
          <Text style={styles.bulletText}>Escape: Close dialogs</Text>
        </View>

        <Text style={styles.categoryTitle}>Support Resources</Text>
        <View style={styles.bulletRow}>
          <Text style={styles.bullet}>-</Text>
          <Text style={styles.bulletText}>Help & Documentation: /dashboard/help</Text>
        </View>
        <View style={styles.bulletRow}>
          <Text style={styles.bullet}>-</Text>
          <Text style={styles.bulletText}>Platform Guides: /dashboard/platform-guides</Text>
        </View>
        <View style={styles.bulletRow}>
          <Text style={styles.bullet}>-</Text>
          <Text style={styles.bulletText}>Architecture Docs: /dashboard/architecture</Text>
        </View>

        <Footer />
      </Page>
    </Document>
  );
};

export default ComprehensiveGuidesPDF;
