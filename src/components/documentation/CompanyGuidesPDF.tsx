import React from 'react';
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
} from '@react-pdf/renderer';

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
    <Text>Aura Intercept Platform - Company Admin Guide - {new Date().toLocaleDateString()}</Text>
  </View>
);

// Company Admin specific guide data (excludes platform-admin-only features)
const companyGuideCategories = [
  {
    title: 'Getting Started',
    guides: [
      {
        title: 'Company Dashboard Overview',
        duration: '5 min',
        steps: [
          'Log in to your admin dashboard at /auth',
          'View your company stats and metrics on the dashboard',
          'Review employee count, appointments, and revenue',
          'Navigate using the sidebar on the left',
          'Check the Help section for additional resources'
        ],
        tips: ['Bookmark the dashboard URL for quick access']
      },
      {
        title: 'Initial Setup Checklist',
        duration: '15 min',
        steps: [
          'Complete company profile in Settings → Branding',
          'Upload your company logo (200x200px PNG recommended)',
          'Configure business hours in Knowledge Base',
          'Add your services catalog',
          'Set up employee accounts',
          'Configure notification preferences'
        ],
        tips: ['Use the Onboarding Wizard for guided setup']
      },
      {
        title: 'Managing Your Team',
        duration: '8 min',
        steps: [
          'Navigate to Employees section',
          'Add new employees with Add Employee button',
          'Assign job types (technician, booking, dispatch, etc.)',
          'Configure individual availability schedules',
          'Set skill tags for intelligent dispatch',
          'Enable mobile app access for technicians'
        ],
        tips: ['Assign multiple job types to versatile employees']
      }
    ]
  },
  {
    title: 'AI Agents Configuration',
    guides: [
      {
        title: 'AI Agents Hub Overview',
        duration: '10 min',
        steps: [
          'Navigate to AI Agents Hub from the sidebar',
          'View available agents organized by category',
          'Click an agent card for detailed settings',
          'Use batch activation for multiple agents',
          'Monitor agent activity in event logs'
        ],
        tips: ['Start with Customer Engagement agents first']
      },
      {
        title: 'Enabling & Configuring Agents',
        duration: '12 min',
        steps: [
          'Select an agent from the AI Agents Hub',
          'Toggle the enable switch to activate',
          'Configure agent-specific settings',
          'Set up handoff rules for transfers',
          'Test agent behavior in Test Console'
        ],
        tips: ['Configure during low-traffic periods']
      },
      {
        title: 'AI Receptionist (Triage Agent)',
        duration: '8 min',
        steps: [
          'Enable the AI Receptionist in Hub',
          'Configure the initial greeting message',
          'Set up inquiry classification rules',
          'Define handoff triggers for specialists',
          'Test with sample customer inquiries'
        ],
        tips: ['Entry point for all customer interactions']
      },
      {
        title: 'Scheduling Agent Setup',
        duration: '10 min',
        steps: [
          'Enable the Scheduling Agent',
          'Ensure business hours are configured',
          'Set up service duration defaults',
          'Configure employee availability',
          'Enable calendar sync (Google optional)',
          'Test booking flow end-to-end'
        ],
        tips: ['Sync external calendars for accuracy']
      },
      {
        title: 'Field Operations Agents',
        duration: '15 min',
        steps: [
          'Enable Dispatch, Route, ETA, Check-in agents',
          'Configure dispatch rules (skills, zones)',
          'Set up route optimization preferences',
          'Configure ETA notification triggers',
          'Enable photo documentation',
          'Test complete field operations workflow'
        ],
        tips: ['Train technicians on mobile check-in']
      }
    ]
  },
  {
    title: 'AI Consoles',
    guides: [
      {
        title: 'Customer Portal Console',
        duration: '8 min',
        steps: [
          'Access via AI Consoles → Customer Portal',
          'AI Chat Widget (Text-Based) available on ALL tiers - customers type, AI responds in text',
          'AI Voice Chat (Speech-Based) available on Single-Point+ - requires ElevenLabs',
          'Use quick actions: Book, Emergency, Quote, etc.',
          'Monitor conversation context and handoffs',
          'Test customer-facing interactions'
        ],
        tips: ['Text Chat works on Core tier with no external dependencies. Voice requires ElevenLabs + Twilio.']
      },
      {
        title: 'Field Operations Console',
        duration: '10 min',
        steps: [
          'Access via AI Consoles → Field Operations',
          'Manage dispatch and routing with AI assistance',
          'Check technician locations and ETAs',
          'Process check-ins and job updates',
          'Optimize routes and scheduling'
        ],
        tips: ['Use map view for visual dispatch']
      },
      {
        title: 'Business Management Ops Console',
        duration: '10 min',
        steps: [
          'Access via AI Consoles → Business Management Ops',
          'Create quotes and invoices with AI help',
          'Look up customer billing information',
          'Track outstanding payments',
          'Generate financial reports'
        ],
        tips: ['Use AI for quick price lookups']
      },
      {
        title: 'Marketing & Sales Ops Console',
        duration: '10 min',
        steps: [
          'Access via AI Consoles → Marketing & Sales Ops',
          'Manage campaigns, leads, and promo codes',
          'Create marketing campaigns with AI assistance',
          'Track lead conversion and customer segments',
          'Set up referral and loyalty programs'
        ],
        tips: ['Use AI to generate campaign content']
      },
      {
        title: 'Analytics & Reports Ops Console',
        duration: '12 min',
        steps: [
          'Access via AI Consoles → Analytics & Reports Ops',
          'View performance dashboards and KPIs',
          'Generate revenue reports and forecasts',
          'Track customer trends and insights',
          'Export reports to PDF or CSV'
        ],
        tips: ['Schedule automated report delivery']
      },
      {
        title: 'Social Media Ops Console',
        duration: '10 min',
        steps: [
          'Access via AI Consoles → Social Media Ops (Command tier)',
          'Create AI-generated content for 6 platforms',
          'Schedule posts using the Content Calendar',
          'Track engagement metrics across channels',
          'Use platform-specific templates and character limits'
        ],
        tips: ['AI handles IG, FB, LinkedIn, TikTok, GMB, SMS']
      }
    ]
  },
  {
    title: 'Integrations Setup',
    guides: [
      {
        title: 'AI Chat Widget Setup (All Tiers)',
        duration: '10 min',
        steps: [
          'Navigate to Integrations → Website Widget',
          'Copy the embed code for your website',
          'Add the code to your website footer or page',
          'The Chat Widget works on ALL tiers including Core',
          'No external dependencies required (no ElevenLabs or Twilio)',
          'Test the widget on your website'
        ],
        tips: ['Text-based chat works out of the box. Voice features require additional setup.']
      },
      {
        title: 'AI Voice Integration (Single-Point+ Only)',
        duration: '20 min',
        steps: [
          'Navigate to Integrations → Voice Agent',
          'NOTE: AI Voice (Speech-Based) requires Single-Point tier or higher',
          'Create Twilio account at twilio.com',
          'Obtain Account SID and Auth Token',
          'Purchase a phone number from Twilio',
          'Create ElevenLabs account for natural voice synthesis',
          'Enter credentials in Voice settings',
          'Configure voice agent prompts',
          'Test with a phone call'
        ],
        tips: ['Voice features use microphone/speakers. Text Chat Widget works without this setup.']
      },
      {
        title: 'SMS Integration (Twilio)',
        duration: '15 min',
        steps: [
          'Navigate to Integrations → SMS & Text',
          'Ensure Twilio account is set up',
          'Enable SMS on your Twilio number',
          'Configure SMS templates in Settings',
          'Set up reminder schedules',
          'Test SMS to your number'
        ],
        tips: ['Keep messages under 160 characters']
      },
      {
        title: 'Email Integration (Resend)',
        duration: '15 min',
        steps: [
          'Navigate to Integrations → Email',
          'Create Resend account at resend.com',
          'Verify your sending domain',
          'Obtain your Resend API key',
          'Enter key in Email settings',
          'Configure email templates',
          'Send a test email'
        ],
        tips: ['Set up SPF and DKIM records']
      },
      {
        title: 'Calendar Integration (Google)',
        duration: '12 min',
        steps: [
          'Navigate to Integrations → Calendar',
          'Click "Connect Google Calendar"',
          'Sign in with Google account',
          'Grant calendar permissions',
          'Select calendar to sync',
          'Enable two-way sync',
          'Verify appointments appear'
        ],
        tips: ['Use dedicated calendar for business']
      },
      {
        title: 'Web Presence Widget Embed',
        duration: '10 min',
        steps: [
          'Navigate to Customer App',
          'Choose embed method (JS, iframe, link)',
          'Copy embed code',
          'Paste into your website',
          'Customize widget appearance',
          'Test on live website'
        ],
        tips: ['Use iframe for WordPress/Wix']
      }
    ]
  },
  {
    title: 'Operations Management',
    guides: [
      {
        title: 'Managing Appointments',
        duration: '10 min',
        steps: [
          'Navigate to Appointments from sidebar',
          'View calendar or list view',
          'Click appointment for details',
          'Use filters to find specific ones',
          'Assign/reassign technicians',
          'Update status as needed',
          'Send reminders to customers'
        ],
        tips: ['Set up automatic reminders 24h and 1h before']
      },
      {
        title: 'Technician Management',
        duration: '12 min',
        steps: [
          'Navigate to Employees section',
          'Add technicians with Add Employee button',
          'Assign job types',
          'Configure availability schedules',
          'Set skill tags for dispatch',
          'Enable mobile app access',
          'Monitor performance metrics'
        ],
        tips: ['Verify mobile app installation']
      },
      {
        title: 'Technician Mobile App',
        duration: '8 min',
        steps: [
          'Technicians access /technician on mobile',
          'Click "Install App" or use banner',
          'Add to home screen',
          'Log in with credentials',
          'View assigned jobs in Jobs tab',
          'Check in/out with photos',
          'Update job status in real-time'
        ],
        tips: ['Enable location services for ETAs']
      },
      {
        title: 'Dispatch-Field Ops',
        duration: '15 min',
        steps: [
          'Navigate to Dispatch-Field Ops from sidebar',
          'View dispatch map with locations',
          'Switch between Map and Agenda views',
          'Monitor real-time ETA updates',
          'Drag and drop to reassign jobs',
          'Track job progress on map'
        ],
        tips: ['Consider traffic patterns']
      }
    ]
  },
  {
    title: 'Business & Finance',
    guides: [
      {
        title: 'Creating Quotes',
        duration: '8 min',
        steps: [
          'Navigate to Quotes from sidebar',
          'Click "New Quote" button',
          'Enter customer information',
          'Add line items from catalog',
          'Apply discounts if applicable',
          'Preview quote before sending',
          'Email quote to customer'
        ],
        tips: ['Save templates for common services']
      },
      {
        title: 'Managing Invoices',
        duration: '10 min',
        steps: [
          'Navigate to Invoices from sidebar',
          'Create from quote or manually',
          'Add payment terms and due date',
          'Send invoice via email',
          'Track payment status',
          'Record payments when received',
          'Generate payment receipts'
        ],
        tips: ['Convert quotes to invoices automatically']
      },
      {
        title: 'Business Operations Console',
        duration: '12 min',
        steps: [
          'Navigate to Business Ops Console',
          'View Business Ops Overview dashboard',
          'Track pending quotes and invoices',
          'Monitor monthly revenue',
          'Access New Lead capture',
          'Create quotes and invoices directly'
        ],
        tips: ['Use dashboard for daily financial overview']
      }
    ]
  },
  {
    title: 'Knowledge Base Management',
    guides: [
      {
        title: 'Managing Services',
        duration: '8 min',
        steps: [
          'Navigate to Knowledge Base → Services tab',
          'Add services your company offers',
          'Set pricing and duration for each',
          'Organize by categories',
          'Enable/disable services as needed',
          'Services power AI quoting and booking'
        ],
        tips: ['Be specific with service descriptions']
      },
      {
        title: 'Managing FAQs',
        duration: '8 min',
        steps: [
          'Navigate to Knowledge Base → FAQ tab',
          'Add common questions and answers',
          'Organize by categories',
          'AI uses FAQs to answer customers',
          'Keep answers concise and accurate',
          'Update regularly based on inquiries'
        ],
        tips: ['Upload documents to auto-generate FAQs']
      },
      {
        title: 'Setting Business Hours',
        duration: '5 min',
        steps: [
          'Navigate to Knowledge Base → Business Hours',
          'Set regular operating hours',
          'Configure after-hours settings',
          'Add holiday closures',
          'Hours affect scheduling availability',
          'AI respects hours for bookings'
        ],
        tips: ['Set buffer time before/after hours']
      }
    ]
  },
  {
    title: 'Settings & Configuration',
    guides: [
      {
        title: 'Branding Settings',
        duration: '8 min',
        steps: [
          'Navigate to Settings → Branding',
          'Upload your company logo',
          'Set primary and secondary colors',
          'Colors apply to customer-facing widgets',
          'Preview branding in widget preview',
          'Save changes to apply'
        ],
        tips: ['Use high-contrast colors for readability']
      },
      {
        title: 'Notification Preferences',
        duration: '10 min',
        steps: [
          'Navigate to Settings → Alerts',
          'Configure email notification recipients',
          'Set up SMS notification triggers',
          'Enable/disable specific alert types',
          'Configure reminder timing (24h, 1h)',
          'Test notifications to verify setup'
        ],
        tips: ['Use different emails for different alert types']
      },
      {
        title: 'Customer Preferences',
        duration: '6 min',
        steps: [
          'Navigate to Settings → Customer Preferences',
          'Set default communication channels',
          'Configure opt-out options',
          'Enable customer portal features',
          'Set default reminder settings',
          'Customers can override at individual level'
        ],
        tips: ['Respect customer channel preferences']
      }
    ]
  }
];

export function CompanyGuidesPDF() {
  return (
    <Document>
      {/* Cover Page */}
      <Page size="A4" style={styles.coverPage}>
        <View>
          <Text style={styles.coverTitle}>Aura Intercept</Text>
          <Text style={styles.coverSubtitle}>Company Admin Guide</Text>
          <View style={{ marginTop: 40 }}>
            <Text style={{ fontSize: 12, textAlign: 'center', marginBottom: 8 }}>
              Complete guide for Company Administrators
            </Text>
            <Text style={{ fontSize: 10, textAlign: 'center', opacity: 0.7 }}>
              Managing your company, employees, and AI agents
            </Text>
          </View>
          <View style={{ marginTop: 60 }}>
            <Text style={{ fontSize: 10, textAlign: 'center', opacity: 0.6 }}>
              Generated: {new Date().toLocaleDateString()}
            </Text>
          </View>
        </View>
      </Page>

      {/* Table of Contents */}
      <Page size="A4" style={styles.page}>
        <Header title="Table of Contents" />
        <Text style={styles.sectionTitle}>Table of Contents</Text>
        {companyGuideCategories.map((category, idx) => (
          <View key={idx} style={{ marginBottom: 12 }}>
            <Text style={{ fontSize: 11, fontWeight: 600, marginBottom: 4, color: colors.primary }}>
              {idx + 1}. {category.title}
            </Text>
            {category.guides.map((guide, gIdx) => (
              <View key={gIdx} style={styles.tocItem}>
                <Text style={styles.tocTitle}>    {guide.title}</Text>
                <Text style={styles.tocPage}>{guide.duration}</Text>
              </View>
            ))}
          </View>
        ))}
        <Footer />
      </Page>

      {/* Guide Pages */}
      {companyGuideCategories.map((category, catIdx) => (
        <Page key={catIdx} size="A4" style={styles.page} wrap>
          <Header title={category.title} />
          <Text style={styles.sectionTitle}>{category.title}</Text>
          
          {category.guides.map((guide, guideIdx) => (
            <View key={guideIdx} wrap={false} style={{ marginBottom: 16 }}>
              <Text style={styles.guideTitle}>{guide.title}</Text>
              <Text style={styles.guideDuration}>⏱ {guide.duration}</Text>
              
              {guide.steps.map((step, stepIdx) => (
                <View key={stepIdx} style={styles.bulletRow}>
                  <Text style={styles.bullet}>{stepIdx + 1}.</Text>
                  <Text style={styles.bulletText}>{step}</Text>
                </View>
              ))}
              
              {guide.tips.length > 0 && (
                <View style={styles.tipBox}>
                  <Text style={styles.tipTitle}>💡 Tips</Text>
                  {guide.tips.map((tip, tipIdx) => (
                    <Text key={tipIdx} style={styles.tipText}>• {tip}</Text>
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
        
        <Text style={styles.categoryTitle}>Key Navigation Paths</Text>
        <View style={styles.bulletRow}>
          <Text style={styles.bullet}>•</Text>
          <Text style={styles.bulletText}>Dashboard: /dashboard - Company overview</Text>
        </View>
        <View style={styles.bulletRow}>
          <Text style={styles.bullet}>•</Text>
          <Text style={styles.bulletText}>AI Agents Hub: /dashboard/ai-agents - Configure AI agents</Text>
        </View>
        <View style={styles.bulletRow}>
          <Text style={styles.bullet}>•</Text>
          <Text style={styles.bulletText}>Appointments: /dashboard/appointments - Manage bookings</Text>
        </View>
        <View style={styles.bulletRow}>
          <Text style={styles.bullet}>•</Text>
          <Text style={styles.bulletText}>Employees: /dashboard/employees - Team management</Text>
        </View>
        <View style={styles.bulletRow}>
          <Text style={styles.bullet}>•</Text>
          <Text style={styles.bulletText}>Knowledge Base: /dashboard/knowledge - Services, FAQs, Hours</Text>
        </View>
        <View style={styles.bulletRow}>
          <Text style={styles.bullet}>•</Text>
          <Text style={styles.bulletText}>Settings: /dashboard/aura-quick-start - Configuration</Text>
        </View>

        <Text style={styles.categoryTitle}>5 AI Control Centers</Text>
        <View style={styles.bulletRow}>
          <Text style={styles.bullet}>•</Text>
          <Text style={styles.bulletText}>Customer Portal Console - Booking, support, communication</Text>
        </View>
        <View style={styles.bulletRow}>
          <Text style={styles.bullet}>•</Text>
          <Text style={styles.bulletText}>Field Operations Console - Dispatch, routing, technician management</Text>
        </View>
        <View style={styles.bulletRow}>
          <Text style={styles.bullet}>•</Text>
          <Text style={styles.bulletText}>Business Management Ops Console - Quotes, invoices, inventory</Text>
        </View>
        <View style={styles.bulletRow}>
          <Text style={styles.bullet}>•</Text>
          <Text style={styles.bulletText}>Marketing & Sales Ops Console - Campaigns, leads, referrals</Text>
        </View>
        <View style={styles.bulletRow}>
          <Text style={styles.bullet}>•</Text>
          <Text style={styles.bulletText}>Analytics & Reports Ops Console - KPIs, performance, forecasting</Text>
        </View>

        <Text style={styles.categoryTitle}>Support Resources</Text>
        <View style={styles.bulletRow}>
          <Text style={styles.bullet}>•</Text>
          <Text style={styles.bulletText}>Help Page: /dashboard/help</Text>
        </View>
        <View style={styles.bulletRow}>
          <Text style={styles.bullet}>•</Text>
          <Text style={styles.bulletText}>Calculators: /dashboard/calculators - ROI and cost tools</Text>
        </View>

        <Footer />
      </Page>
    </Document>
  );
}

export default CompanyGuidesPDF;
