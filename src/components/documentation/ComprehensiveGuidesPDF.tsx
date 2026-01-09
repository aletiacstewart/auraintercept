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
    <Text>Aura Intercept Platform - Comprehensive User Guide - {new Date().toLocaleDateString()}</Text>
  </View>
);

// All guide data
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
          'Review your subscription status in the bottom left',
          'Navigate to Dashboard for your company overview',
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
        title: 'User Roles & Permissions',
        duration: '8 min',
        steps: [
          'Platform Admin: Full system access across all companies',
          'Company Admin: Full access to their company features',
          'Employee: Access based on assigned job types',
          'Technician: Mobile-optimized field operations access',
          'Assign roles when creating user accounts'
        ],
        tips: ['Follow principle of least privilege']
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
          'View all 22 specialized agents by category',
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
          'Test agent behavior in Test Console',
          'Monitor agent logs for issues'
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
    title: 'Integrations Setup',
    guides: [
      {
        title: 'Voice Integration (Twilio)',
        duration: '20 min',
        steps: [
          'Navigate to Integrations → Voice Agent',
          'Create Twilio account at twilio.com',
          'Obtain Account SID and Auth Token',
          'Purchase a phone number from Twilio',
          'Enter credentials in Voice settings',
          'Configure voice agent prompts',
          'Test with a phone call'
        ],
        tips: ['Use local number for better answer rates']
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
        title: 'Website Widget Embed',
        duration: '10 min',
        steps: [
          'Navigate to Integrations → Website Embed',
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
        title: 'Dispatch & Routing',
        duration: '15 min',
        steps: [
          'Navigate to Field Ops Dispatch Console',
          'View dispatch map with locations',
          'New jobs appear in unassigned queue',
          'Auto-dispatch suggests optimal tech',
          'Manually override if needed',
          'Monitor real-time ETA updates',
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
        title: 'Inventory Tracking',
        duration: '12 min',
        steps: [
          'Navigate to Resources → Inventory',
          'Add items with SKUs',
          'Set minimum quantity thresholds',
          'Track parts usage per job',
          'Receive low-stock alerts',
          'Record adjustments',
          'Generate inventory reports'
        ],
        tips: ['Assign common parts to service types']
      },
      {
        title: 'Warranty Management',
        duration: '10 min',
        steps: [
          'Navigate to Resources → Warranties',
          'Create warranty policies',
          'Set durations and terms',
          'Link warranties to completed jobs',
          'Customers look up warranty status',
          'Process warranty claims',
          'Track expiration dates'
        ],
        tips: ['Automate registration on job completion']
      }
    ]
  },
  {
    title: 'Marketing & Campaigns',
    guides: [
      {
        title: 'Creating Campaigns',
        duration: '15 min',
        steps: [
          'Navigate to Campaigns from sidebar',
          'Click "New Campaign" button',
          'Choose type (email, SMS, both)',
          'Define target audience with filters',
          'Create content (use AI assistance)',
          'Schedule or send immediately',
          'Monitor performance metrics'
        ],
        tips: ['A/B test subject lines']
      },
      {
        title: 'Referral Program',
        duration: '10 min',
        steps: [
          'Navigate to Referrals from sidebar',
          'Configure reward structure',
          'Set values for referrer/referee',
          'Generate referral codes',
          'Track conversions',
          'Process rewards',
          'Promote via automated emails'
        ],
        tips: ['Make rewards attractive to motivate sharing']
      },
      {
        title: 'Review Collection',
        duration: '8 min',
        steps: [
          'Enable Social Media Review Agent',
          'Configure request timing',
          'Set up review site links',
          'Customize request templates',
          'Collect feedback first',
          'Monitor incoming reviews',
          'Respond promptly'
        ],
        tips: ['Ask satisfied customers immediately']
      }
    ]
  },
  {
    title: 'Analytics & Reports',
    guides: [
      {
        title: 'Dashboard Analytics',
        duration: '8 min',
        steps: [
          'Navigate to Dashboard for overview',
          'View appointment trends',
          'Monitor revenue and invoices',
          'Check satisfaction scores',
          'Review technician utilization',
          'Identify peak booking times',
          'Export data for analysis'
        ],
        tips: ['Check dashboard daily']
      },
      {
        title: 'Analytics Console',
        duration: '12 min',
        steps: [
          'Navigate to Resources → Analytics',
          'Use AI-powered insights',
          'Generate custom reports',
          'Analyze revenue trends',
          'Review acquisition costs',
          'Compare time periods',
          'Schedule automated delivery'
        ],
        tips: ['Use Analytics Agent for natural language']
      },
      {
        title: 'Setting Up Digests',
        duration: '8 min',
        steps: [
          'Navigate to Settings → Digests',
          'Enable weekly/monthly digests',
          'Configure recipients',
          'Select metrics to include',
          'Choose delivery schedule',
          'Preview format',
          'Review delivery history'
        ],
        tips: ['Include key stakeholders']
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
          'Click "Add Service" button',
          'Enter name and description',
          'Set pricing (fixed or range)',
          'Define estimated duration',
          'Add categories for organization',
          'Enable/disable as needed'
        ],
        tips: ['Include detailed descriptions for AI accuracy']
      },
      {
        title: 'FAQ Management',
        duration: '10 min',
        steps: [
          'Navigate to Knowledge Base → FAQs',
          'Add frequently asked questions',
          'Provide clear, helpful answers',
          'Organize by category',
          'AI agents use FAQs for responses',
          'Update based on inquiries',
          'Upload document for bulk import'
        ],
        tips: ['Use inquiry patterns to identify new FAQs']
      },
      {
        title: 'Business Hours Configuration',
        duration: '5 min',
        steps: [
          'Navigate to Knowledge Base → Hours',
          'Set operating hours for each day',
          'Mark closed days',
          'Add holiday closures',
          'Configure after-hours messaging',
          'AI respects hours for scheduling'
        ],
        tips: ['Update for holidays in advance']
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
              <Text style={{ fontSize: 28, fontWeight: 700, color: colors.accent }}>22</Text>
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
                    <Text key={tipIndex} style={styles.tipText}>• {tip}</Text>
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
        
        <Text style={styles.categoryTitle}>AI Agent Categories</Text>
        <View style={styles.bulletRow}>
          <Text style={styles.bullet}>•</Text>
          <Text style={styles.bulletText}>Customer Engagement (6 agents): Receptionist, Scheduling, Follow-up, Review, Support, Portal</Text>
        </View>
        <View style={styles.bulletRow}>
          <Text style={styles.bullet}>•</Text>
          <Text style={styles.bulletText}>Field Operations (4 agents): Dispatch, Route, ETA, Check-in</Text>
        </View>
        <View style={styles.bulletRow}>
          <Text style={styles.bullet}>•</Text>
          <Text style={styles.bulletText}>Business Operations (5 agents): Quoting, Invoice, Inventory, Warranty, Admin</Text>
        </View>
        <View style={styles.bulletRow}>
          <Text style={styles.bullet}>•</Text>
          <Text style={styles.bulletText}>Marketing & Sales (6 agents): Marketing, Promo, Referral, Win-back, Seasonal, Lead</Text>
        </View>
        <View style={styles.bulletRow}>
          <Text style={styles.bullet}>•</Text>
          <Text style={styles.bulletText}>Analytics (4 agents): Insights, Forecast, Revenue, Performance</Text>
        </View>

        <Text style={styles.categoryTitle}>Key URLs</Text>
        <View style={styles.bulletRow}>
          <Text style={styles.bullet}>•</Text>
          <Text style={styles.bulletText}>Admin Dashboard: /dashboard</Text>
        </View>
        <View style={styles.bulletRow}>
          <Text style={styles.bullet}>•</Text>
          <Text style={styles.bulletText}>Technician App: /technician</Text>
        </View>
        <View style={styles.bulletRow}>
          <Text style={styles.bullet}>•</Text>
          <Text style={styles.bulletText}>Customer Portal: /customer-portal</Text>
        </View>
        <View style={styles.bulletRow}>
          <Text style={styles.bullet}>•</Text>
          <Text style={styles.bulletText}>Public Chat: /chat/[company-slug]</Text>
        </View>

        <Text style={styles.categoryTitle}>Keyboard Shortcuts</Text>
        <View style={styles.bulletRow}>
          <Text style={styles.bullet}>•</Text>
          <Text style={styles.bulletText}>Ctrl/Cmd + K: Quick search</Text>
        </View>
        <View style={styles.bulletRow}>
          <Text style={styles.bullet}>•</Text>
          <Text style={styles.bulletText}>Ctrl/Cmd + N: New appointment</Text>
        </View>
        <View style={styles.bulletRow}>
          <Text style={styles.bullet}>•</Text>
          <Text style={styles.bulletText}>Escape: Close dialogs</Text>
        </View>

        <Text style={styles.categoryTitle}>Support Resources</Text>
        <View style={styles.bulletRow}>
          <Text style={styles.bullet}>•</Text>
          <Text style={styles.bulletText}>Help Center: /dashboard/help</Text>
        </View>
        <View style={styles.bulletRow}>
          <Text style={styles.bullet}>•</Text>
          <Text style={styles.bulletText}>Architecture Docs: /dashboard/architecture</Text>
        </View>
        <View style={styles.bulletRow}>
          <Text style={styles.bullet}>•</Text>
          <Text style={styles.bulletText}>Integration Guides: /dashboard/integrations/embed</Text>
        </View>

        <Footer />
      </Page>
    </Document>
  );
};

export default ComprehensiveGuidesPDF;
