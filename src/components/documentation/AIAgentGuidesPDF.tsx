import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
} from '@react-pdf/renderer';
import { SUBSCRIPTION_TIERS } from '@/lib/documentationConfig';

const colors = {
  primary: '#00E5FF',
  secondary: '#6366f1',
  accent: '#06b6d4',
  dark: '#1e1b4b',
  gray: '#64748b',
  lightGray: '#f1f5f9',
  white: '#ffffff',
  amber: '#f59e0b',
  amberLight: '#fef3c7',
  green: '#10b981',
  greenLight: '#d1fae5',
  blue: '#3b82f6',
  blueLight: '#dbeafe',
  purple: '#8b5cf6',
  purpleLight: '#ede9fe',
  orange: '#f97316',
  orangeLight: '#ffedd5',
  cyan: '#06b6d4',
  cyanLight: '#cffafe',
  red: '#ef4444',
  redLight: '#fee2e2',
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
    marginBottom: 8,
    textAlign: 'center',
  },
  coverBrand: {
    fontSize: 24,
    fontWeight: 700,
    marginBottom: 16,
    textAlign: 'center',
    color: colors.accent,
  },
  coverSubtitle: {
    fontSize: 14,
    fontWeight: 400,
    marginBottom: 40,
    textAlign: 'center',
    color: '#a5b4fc',
  },
  coverStats: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 30,
    marginTop: 40,
  },
  coverStat: {
    alignItems: 'center',
  },
  coverStatNumber: {
    fontSize: 28,
    fontWeight: 700,
    color: colors.accent,
  },
  coverStatLabel: {
    fontSize: 9,
    color: '#a5b4fc',
    marginTop: 4,
    textAlign: 'center',
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
    fontSize: 20,
    fontWeight: 700,
    color: colors.primary,
    marginBottom: 16,
    marginTop: 10,
  },
  subsectionTitle: {
    fontSize: 14,
    fontWeight: 600,
    color: colors.dark,
    marginBottom: 10,
    marginTop: 16,
  },
  paragraph: {
    fontSize: 10,
    lineHeight: 1.6,
    marginBottom: 10,
    color: colors.dark,
  },
  footer: {
    position: 'absolute',
    bottom: 30,
    left: 40,
    right: 40,
    flexDirection: 'row',
    justifyContent: 'space-between',
    fontSize: 8,
    color: colors.gray,
  },
  table: {
    marginVertical: 12,
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: colors.dark,
    color: colors.white,
    padding: 8,
  },
  tableHeaderCell: {
    fontSize: 9,
    fontWeight: 700,
    color: colors.white,
    textAlign: 'center',
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: colors.lightGray,
    padding: 8,
  },
  tableRowAlt: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: colors.lightGray,
    padding: 8,
    backgroundColor: colors.lightGray,
  },
  tableCell: {
    fontSize: 9,
    textAlign: 'center',
  },
  tableCellLeft: {
    fontSize: 9,
    textAlign: 'left',
  },
  consoleCard: {
    backgroundColor: colors.lightGray,
    padding: 12,
    marginBottom: 12,
    borderRadius: 4,
    borderLeftWidth: 4,
  },
  consoleTitle: {
    fontSize: 14,
    fontWeight: 700,
    marginBottom: 6,
  },
  consoleDesc: {
    fontSize: 10,
    color: colors.gray,
    marginBottom: 8,
  },
  featureList: {
    marginTop: 8,
  },
  featureItem: {
    flexDirection: 'row',
    marginBottom: 4,
  },
  featureCheck: {
    fontSize: 10,
    color: colors.green,
    marginRight: 6,
  },
  featureText: {
    fontSize: 9,
    color: colors.dark,
    flex: 1,
  },
  agentCard: {
    backgroundColor: colors.white,
    padding: 10,
    marginBottom: 8,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: colors.lightGray,
  },
  agentName: {
    fontSize: 11,
    fontWeight: 700,
    color: colors.dark,
    marginBottom: 4,
  },
  agentDesc: {
    fontSize: 9,
    color: colors.gray,
    marginBottom: 6,
    lineHeight: 1.4,
  },
  agentStatus: {
    flexDirection: 'row',
    gap: 12,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  statusText: {
    fontSize: 8,
    fontWeight: 600,
  },
  tocItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
    paddingBottom: 6,
    borderBottomWidth: 1,
    borderBottomColor: colors.lightGray,
    borderBottomStyle: 'dotted',
  },
  tocTitle: {
    fontSize: 11,
  },
  tocPage: {
    fontSize: 11,
    color: colors.primary,
  },
  legendBox: {
    backgroundColor: colors.lightGray,
    padding: 12,
    marginVertical: 12,
    borderRadius: 4,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  legendIcon: {
    width: 20,
    textAlign: 'center',
    marginRight: 8,
  },
  legendText: {
    fontSize: 9,
    color: colors.dark,
  },
  noticeBox: {
    backgroundColor: colors.amberLight,
    padding: 12,
    marginVertical: 12,
    borderRadius: 4,
    borderLeftWidth: 4,
    borderLeftColor: colors.amber,
  },
  noticeTitle: {
    fontSize: 11,
    fontWeight: 700,
    color: colors.dark,
    marginBottom: 6,
  },
  noticeText: {
    fontSize: 9,
    color: colors.dark,
    lineHeight: 1.5,
  },
  infoBox: {
    backgroundColor: colors.blueLight,
    padding: 12,
    marginVertical: 12,
    borderRadius: 4,
    borderLeftWidth: 4,
    borderLeftColor: colors.blue,
  },
  tierCard: {
    backgroundColor: colors.lightGray,
    padding: 12,
    marginBottom: 10,
    borderRadius: 4,
    borderLeftWidth: 4,
    borderLeftColor: colors.primary,
  },
  tierName: {
    fontSize: 14,
    fontWeight: 700,
    color: colors.dark,
    marginBottom: 4,
  },
  tierPrice: {
    fontSize: 18,
    fontWeight: 700,
    color: colors.primary,
    marginBottom: 8,
  },
  integrationCard: {
    backgroundColor: colors.white,
    padding: 10,
    marginBottom: 8,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: colors.lightGray,
  },
  integrationName: {
    fontSize: 11,
    fontWeight: 700,
    color: colors.dark,
    marginBottom: 4,
  },
  integrationPurpose: {
    fontSize: 9,
    color: colors.gray,
    marginBottom: 4,
  },
  integrationCost: {
    fontSize: 9,
    color: colors.dark,
    marginBottom: 4,
  },
  glossaryTerm: {
    fontSize: 10,
    fontWeight: 700,
    color: colors.primary,
    marginTop: 8,
  },
  glossaryDef: {
    fontSize: 9,
    color: colors.dark,
    marginLeft: 10,
    marginTop: 2,
    lineHeight: 1.4,
  },
});

// Console data with colors
const CONSOLES = [
  {
    name: 'Customer Portal',
    color: colors.blue,
    colorLight: colors.blueLight,
    description: 'Your virtual front desk that handles all customer interactions - booking appointments, answering questions, and collecting feedback.',
    features: [
      'Request Appointment',
      'Emergency Requests',
      'Get Quote',
      'View Business Hours',
      'Browse Services',
      'Track Appointment Status',
      'Leave Feedback/Review',
    ],
    agents: [
      {
        name: 'AI Receptionist (Triage)',
        description: 'First point of contact for all customers. Greets visitors, understands their needs, and routes them to the right agent or information.',
        isCore: true,
        worksAlone: true,
        requires: [],
      },
      {
        name: 'Booking Agent',
        description: 'Books appointments by checking technician availability, confirming dates and times, and sending confirmation messages.',
        isCore: false,
        worksAlone: false,
        requires: ['AI Receptionist (Triage)'],
      },
      {
        name: 'Follow-up Agent',
        description: 'Sends appointment reminders before service, follows up after completion, and handles confirmation requests.',
        isCore: false,
        worksAlone: false,
        requires: ['Booking Agent'],
      },
      {
        name: 'Review Agent',
        description: 'Collects customer reviews after service completion. Directs satisfied customers to leave reviews on Google, Yelp, or Facebook.',
        isCore: false,
        worksAlone: false,
        requires: ['Follow-up Agent'],
      },
    ],
  },
  {
    name: 'Field Operations',
    color: colors.green,
    colorLight: colors.greenLight,
    description: 'Command center for technicians and dispatchers. Manages job assignments, routing, and real-time status updates.',
    features: [
      'Accept/Reject Jobs',
      'Get Directions',
      'Mark En Route',
      'Update ETA',
      'Arrive & Start Job',
      'Complete Job',
      'Generate On-Site Quote',
      'Generate Invoice',
      'Contact Dispatch',
    ],
    agents: [
      {
        name: 'Dispatch/GPS Console',
        description: 'Assigns technicians to jobs based on skills, location, availability, and workload. Optimizes assignments for efficiency.',
        isCore: true,
        worksAlone: true,
        requires: [],
      },
      {
        name: 'Route Agent',
        description: 'Plans the best driving routes for technicians. Considers traffic, distance, and appointment times to minimize travel.',
        isCore: false,
        worksAlone: false,
        requires: ['Dispatch/GPS Console'],
      },
      {
        name: 'ETA Agent',
        description: 'Calculates and communicates arrival times to customers. Automatically updates estimates based on traffic and delays.',
        isCore: false,
        worksAlone: false,
        requires: ['Dispatch/GPS Console', 'Route Agent'],
      },
      {
        name: 'Check-in Agent',
        description: 'Tracks when technicians arrive at jobs and start work. Logs job progress and completion for accountability.',
        isCore: false,
        worksAlone: false,
        requires: ['Dispatch/GPS Console'],
      },
    ],
  },
  {
    name: 'Business Management',
    color: colors.purple,
    colorLight: colors.purpleLight,
    description: 'Office management hub for quotes, invoices, leads, and day-to-day operations. Your back-office automation center.',
    features: [
      'Create Quotes',
      'Generate Invoices',
      'Add New Leads',
      'Manage Appointments',
      'Track Inventory',
    ],
    agents: [
      {
        name: 'Admin Agent',
        description: 'Handles general business administration tasks. Manages settings, user access, and administrative operations.',
        isCore: true,
        worksAlone: true,
        requires: [],
      },
      {
        name: 'Quoting Agent',
        description: 'Creates price quotes for customers based on service type, materials, and labor. Supports multi-line item quotes.',
        isCore: false,
        worksAlone: true,
        requires: [],
      },
      {
        name: 'Invoice Agent',
        description: 'Generates invoices from completed jobs or quotes. Tracks payment status and sends payment reminders.',
        isCore: false,
        worksAlone: false,
        requires: ['Quoting Agent'],
      },
      {
        name: 'Inventory Agent',
        description: 'Tracks parts, materials, and supplies. Alerts when stock is low and helps plan reorders.',
        isCore: false,
        worksAlone: true,
        requires: [],
      },
    ],
  },
  {
    name: 'Outreach & Sales Console',
    color: colors.orange,
    colorLight: colors.orangeLight,
    description: 'Customer outreach and campaign management. Create targeted campaigns to grow your customer base.',
    features: [
      'Create Email Campaigns',
      'Create SMS Campaigns',
      'View Customer Segments',
      'Promotional Offers',
      'Referral Programs',
      'Win-back Campaigns',
      'Lead Scoring',
    ],
    agents: [
      {
        name: 'Campaign Agent',
        description: 'Creates and manages all marketing campaigns including email, SMS, seasonal promotions, referral programs, and customer win-back efforts.',
        isCore: true,
        worksAlone: true,
        requires: [],
      },
      {
        name: 'Lead Agent',
        description: 'Scores and prioritizes leads based on engagement, intent signals, and conversion likelihood. Helps focus sales efforts.',
        isCore: false,
        worksAlone: true,
        requires: [],
      },
      {
        name: 'Marketing Agent',
        description: 'Manages customer segments, promo codes, referral tracking, and win-back targeting for inactive customers.',
        isCore: false,
        worksAlone: false,
        requires: ['Campaign Agent'],
      },
    ],
  },
  {
    name: 'Social Media & Web Presence',
    color: colors.purple,
    colorLight: colors.purpleLight,
    description: 'Content creation, social media management, website builder, and blog publishing. Your complete digital presence hub.',
    features: [
      'Multi-platform content creation (6 platforms)',
      'Content Engine for unified messaging',
      'Smart Website Manager',
      'Blog Management with auto-publish',
      'SEO optimization',
      'Content calendar',
      'Brand voice consistency',
    ],
    agents: [
      {
        name: 'Social Media Agent',
        description: 'AI-generated content for 6 platforms (Instagram, Facebook, LinkedIn, TikTok, GMB, SMS). Respects character limits and platform styles.',
        isCore: true,
        worksAlone: true,
        requires: [],
      },
      {
        name: 'Social Media Scheduler',
        description: 'Queues and publishes social media content at optimal times across all platforms.',
        isCore: false,
        worksAlone: false,
        requires: ['Social Media Agent'],
      },
      {
        name: 'Social Media Analytics',
        description: 'Tracks engagement metrics across all social platforms. Measures reach, clicks, and conversions.',
        isCore: false,
        worksAlone: false,
        requires: ['Social Media Agent'],
      },
      {
        name: 'Creative Agent',
        description: 'Unified AI content generation for all channels. Creates on-brand content for web, social, campaigns, and blogs.',
        isCore: true,
        worksAlone: true,
        requires: [],
      },
      {
        name: 'Web Presence Agent',
        description: 'AI-powered website and blog management. Auto-optimizes SEO, monitors performance, auto-publishes blogs.',
        isCore: true,
        worksAlone: false,
        requires: ['Creative Agent'],
      },
    ],
  },
  {
    name: 'Analytics & Reports',
    color: colors.cyan,
    colorLight: colors.cyanLight,
    description: 'Business insights and performance tracking. Turn your data into actionable intelligence.',
    features: [
      'Performance Reports',
      'Revenue Analysis',
      'Customer Insights',
      'Business Trend Analysis',
      'Revenue Forecasting',
      'KPI Dashboard',
      'Reminder Analytics',
      'Export Reports',
    ],
    agents: [
      {
        name: 'Insights Agent',
        description: 'Analyzes business data to find patterns and trends. Identifies opportunities for improvement and growth.',
        isCore: true,
        worksAlone: true,
        requires: [],
      },
      {
        name: 'Performance Agent',
        description: 'Tracks team and individual technician performance. Measures productivity, customer satisfaction, and job completion rates.',
        isCore: false,
        worksAlone: false,
        requires: ['Insights Agent'],
      },
      {
        name: 'Revenue Agent',
        description: 'Tracks income, analyzes financial trends, and monitors revenue by service type, technician, or time period.',
        isCore: false,
        worksAlone: false,
        requires: ['Insights Agent'],
      },
      {
        name: 'Forecast Agent',
        description: 'Predicts future business activity, demand patterns, and revenue based on historical data and trends.',
        isCore: false,
        worksAlone: false,
        requires: ['Insights Agent', 'Revenue Agent'],
      },
    ],
  },
  {
    name: 'AI Operatives Hub',
    color: colors.blue,
    colorLight: colors.blueLight,
    description: 'Central management console for configuring, monitoring, and analyzing all 10 AI Operatives.',
    features: [
      'Operative configuration and activation',
      'Quick Start batch activation',
      'Real-time workflow monitoring',
      'Analytics dashboard',
      'Conversation history browser',
      'Dependency visualization',
    ],
    agents: [],
  },
];

// All agents for summary table
const ALL_AGENTS = CONSOLES.flatMap(console =>
  console.agents.map(agent => ({
    ...agent,
    console: console.name,
    consoleColor: console.color,
  }))
);

// Third party integrations
const INTEGRATIONS = [
  {
    name: 'Resend',
    purpose: 'Email Notifications & Reminders',
    cost: 'Your own Resend account · valid card · billed directly by Resend (separate from Aura plan)',
    required: true,
    requiredFor: 'All email features (appointment confirmations, reminders, campaigns)',
    agentsAffected: ['Follow-up Agent', 'Campaign Agent', 'Review Agent', 'Invoice Agent'],
    whatHappensWithout: 'No email reminders, confirmations, invoices, or marketing campaigns can be sent.',
  },
  {
    name: 'SignalWire',
    purpose: 'SMS Messages & Voice Calls',
    cost: '$2/phone number + ~$0.004/SMS + ~$0.01/minute for calls',
    required: false,
    requiredFor: 'SMS reminders, voice call reminders, and AI Voice features. NOT required for the Text Chat Widget.',
    agentsAffected: ['AI Receptionist (Voice)', 'Follow-up Agent', 'ETA Agent', 'Campaign Agent'],
    whatHappensWithout: 'No SMS or voice calls - customers interact via text-based Chat Widget only.',
  },
  {
    name: 'ElevenLabs',
    purpose: 'Talk to Aura (Voice) Synthesis',
    cost: 'Free 10,000 characters/month, then $5-99+/month tiers',
    required: false,
    requiredFor: 'Talk to Aura (Voice) features (speech-based conversations). NOT required for Message Aura (Text) which works on all tiers without any dependencies.',
    agentsAffected: ['AI Receptionist (Voice Mode)', 'Follow-up Agent (Voice Reminders)', 'Talk to Aura (Voice)'],
    whatHappensWithout: 'No Talk to Aura (Voice) features - customers interact via Message Aura (Text) only (still fully functional on all tiers).',
  },
  {
    name: 'Google Calendar',
    purpose: 'Calendar Synchronization',
    cost: 'Free (requires Google account)',
    required: false,
    requiredFor: 'Two-way calendar sync with technician schedules',
    agentsAffected: ['Booking Agent', 'Dispatch/GPS Console'],
    whatHappensWithout: 'Manual availability management only - no automatic calendar sync.',
  },
  {
    name: 'Stripe (Company Account)',
    purpose: 'Payment Processing',
    cost: '2.9% + $0.30 per transaction',
    required: false,
    requiredFor: 'Accepting invoice payments from customers',
    agentsAffected: ['Invoice Agent'],
    whatHappensWithout: 'Cannot collect payments through invoices - manual payment collection required.',
  },
];

// Communication Channels Mapping
const COMMUNICATION_CHANNELS = [
  {
    channel: 'Talk to Aura (Text-Based)',
    icon: '[KEYBOARD]',
    inbound: 'AI Receptionist handles all text conversations via keyboard input',
    outbound: 'All agents can respond via handoff',
    agents: ['AI Receptionist', 'All Agents via Handoff'],
    integration: 'Built-in - No external dependencies required',
    tiers: 'All tiers (Core, Core, Boost, Command)',
  },
  {
    channel: 'Talk to Aura (Voice/Speech-Based)',
    icon: '[MIC]',
    inbound: 'AI Receptionist answers inbound voice calls via microphone/speakers',
    outbound: 'Follow-up Agent (reminders), Missed Call Callbacks via speakers',
    agents: ['AI Receptionist', 'Follow-up Agent'],
    integration: 'SignalWire + ElevenLabs (required)',
    tiers: 'All tiers (Core, Boost, Pro, Elite)',
  },
  {
    channel: 'SMS Text',
    icon: '[CHAT]',
    inbound: 'AI Receptionist receives and responds to texts',
    outbound: 'Follow-up, ETA, Campaign, Review agents send messages',
    agents: ['AI Receptionist', 'Follow-up Agent', 'ETA Agent', 'Campaign Agent', 'Review Agent'],
    integration: 'SignalWire',
    tiers: 'All tiers',
  },
  {
    channel: 'Email',
    icon: '[EMAIL]',
    inbound: 'Not automated (manual inbox)',
    outbound: 'Follow-up, Campaign, Review, Invoice agents send emails',
    agents: ['Follow-up Agent', 'Campaign Agent', 'Review Agent', 'Invoice Agent'],
    integration: 'Resend',
    tiers: 'All tiers',
  },
];

// Subscription tiers - pulled from centralized config (4-tier model)
const TIERS = [
  {
    name: SUBSCRIPTION_TIERS.aura_core?.name ?? 'Aura Core',
    price: `$${(SUBSCRIPTION_TIERS.aura_core?.price ?? 497).toLocaleString()}/month`,
    annualPrice: `$${(SUBSCRIPTION_TIERS.aura_core?.annualPrice ?? 4970).toLocaleString()}/year`,
    consoles: [`${SUBSCRIPTION_TIERS.aura_core?.consoles ?? 3} Consoles`],
    agentCount: SUBSCRIPTION_TIERS.aura_core?.operatives ?? 8,
    agents: ['AI Receptionist (Triage)', 'Booking Agent', 'Follow-Up Agent', 'Review Agent', 'Creative Content Agent', 'Web Presence Agent', 'Lead Agent', 'Marketing Agent'],
    voiceIncluded: SUBSCRIPTION_TIERS.aura_core?.hasVoice ?? true,
    note: SUBSCRIPTION_TIERS.aura_core?.description ?? '8 Smart AI Agents for booking, follow-up, creative content & web presence.',
  },
  {
    name: SUBSCRIPTION_TIERS.aura_boost?.name ?? 'Aura Boost',
    price: `$${(SUBSCRIPTION_TIERS.aura_boost?.price ?? 897).toLocaleString()}/month`,
    annualPrice: `$${(SUBSCRIPTION_TIERS.aura_boost?.annualPrice ?? 8970).toLocaleString()}/year`,
    consoles: [`${SUBSCRIPTION_TIERS.aura_boost?.consoles ?? 5} Consoles`],
    agentCount: SUBSCRIPTION_TIERS.aura_boost?.operatives ?? 12,
    agents: [
      'All Core Agents', 'Dispatch/GPS Console', 'Route Agent',
      'ETA Agent', 'Check-In Agent',
    ],
    voiceIncluded: SUBSCRIPTION_TIERS.aura_boost?.hasVoice ?? true,
    note: SUBSCRIPTION_TIERS.aura_boost?.description ?? '12 Smart AI Agents with dispatch, routing & field operations.',
  },
  {
    name: SUBSCRIPTION_TIERS.aura_pro?.name ?? 'Aura Pro',
    price: `$${(SUBSCRIPTION_TIERS.aura_pro?.price ?? 1797).toLocaleString()}/month`,
    annualPrice: `$${(SUBSCRIPTION_TIERS.aura_pro?.annualPrice ?? 17970).toLocaleString()}/year`,
    consoles: [`${SUBSCRIPTION_TIERS.aura_pro?.consoles ?? 5} Consoles`],
    agentCount: SUBSCRIPTION_TIERS.aura_pro?.operatives ?? 16,
    agents: ['All Boost Agents', 'Campaign Agent', 'Outreach Agent', 'Social Scheduler Agent', 'Social Analytics'],
    voiceIncluded: SUBSCRIPTION_TIERS.aura_pro?.hasVoice ?? true,
    note: SUBSCRIPTION_TIERS.aura_pro?.description ?? '16 Smart AI Agents with social media, campaigns, and industry specialist agents.',
  },
  {
    name: SUBSCRIPTION_TIERS.aura_elite?.name ?? 'Aura Elite',
    price: `$${(SUBSCRIPTION_TIERS.aura_elite?.price ?? 2997).toLocaleString()}/month`,
    annualPrice: `$${(SUBSCRIPTION_TIERS.aura_elite?.annualPrice ?? 29970).toLocaleString()}/year`,
    consoles: [`All ${SUBSCRIPTION_TIERS.aura_elite?.consoles ?? 7} Consoles + AI Hub`],
    agentCount: SUBSCRIPTION_TIERS.aura_elite?.operatives ?? 24,
    agents: [`All ${SUBSCRIPTION_TIERS.aura_elite?.operatives ?? 24} AI Agents`],
    voiceIncluded: SUBSCRIPTION_TIERS.aura_elite?.hasVoice ?? true,
    note: SUBSCRIPTION_TIERS.aura_elite?.description ?? '10 AI Operatives — full suite with business operations, analytics & AI Hub.',
  },
];

const Header = ({ title }: { title: string }) => (
  <View style={styles.header} fixed>
    <Text style={styles.headerTitle}>{title}</Text>
    <Text style={styles.pageNumber} render={({ pageNumber }) => `Page ${pageNumber}`} />
  </View>
);

const Footer = () => (
  <View style={styles.footer} fixed>
    <Text>Aura Intercept - AI Agent & Console Reference Guide</Text>
    <Text render={({ pageNumber }) => `Page ${pageNumber}`} />
  </View>
);

const FeatureItem = ({ children }: { children: string }) => (
  <View style={styles.featureItem}>
    <Text style={styles.featureCheck}>-</Text>
    <Text style={styles.featureText}>{children}</Text>
  </View>
);

const AIAgentGuidesPDF = () => (
  <Document>
    {/* Cover Page */}
    <Page size="A4" style={styles.coverPage}>
      <Text style={styles.coverBrand}>AURA INTERCEPT</Text>
      <Text style={styles.coverTitle}>AI Agent & Console</Text>
      <Text style={styles.coverTitle}>Reference Guide</Text>
      <Text style={styles.coverSubtitle}>Understanding Your AI-Powered Business Assistants</Text>
      <View style={styles.coverStats}>
        <View style={styles.coverStat}>
          <Text style={styles.coverStatNumber}>7</Text>
          <Text style={styles.coverStatLabel}>Control Centers (Consoles)</Text>
        </View>
        <View style={styles.coverStat}>
          <Text style={styles.coverStatNumber}>24</Text>
          <Text style={styles.coverStatLabel}>AI Operatives</Text>
        </View>
        <View style={styles.coverStat}>
          <Text style={styles.coverStatNumber}>5</Text>
          <Text style={styles.coverStatLabel}>Integrations</Text>
        </View>
        <View style={styles.coverStat}>
          <Text style={styles.coverStatNumber}>7</Text>
          <Text style={styles.coverStatLabel}>Pricing Tiers</Text>
        </View>
      </View>
      <View style={styles.footer}>
        <Text>Aura Intercept - AI-Powered Service Platform</Text>
        <Text>Generated: {new Date().toLocaleDateString()}</Text>
      </View>
    </Page>

    {/* Table of Contents */}
    <Page size="A4" style={styles.page}>
      <Header title="AI Agent & Console Reference Guide" />
      <Text style={styles.sectionTitle}>Table of Contents</Text>
      
      <View style={{ marginTop: 20 }}>
        {[
          { title: 'Introduction & How to Read This Guide', page: '3' },
          { title: 'Communication Channels Overview', page: '4' },
          { title: 'Console 1: Customer Portal', page: '5' },
          { title: 'Console 2: Field Operations', page: '6' },
          { title: 'Console 3: Business Management', page: '7' },
          { title: 'Console 4: Outreach & Sales Ops', page: '8' },
          { title: 'Console 5: Social Media & Web Presence', page: '9' },
          { title: 'Console 6: Analytics & Reports', page: '10' },
          { title: 'Console 7: AI Operatives Hub', page: '11' },
          { title: 'Complete Operative Summary Table', page: '12' },
          { title: 'Subscription Tiers & Operative Access', page: '13' },
          { title: '3rd Party Integrations (Required & Optional)', page: '14' },
          { title: 'Glossary & FAQ', page: '15' },
        ].map((item, i) => (
          <View key={i} style={styles.tocItem}>
            <Text style={styles.tocTitle}>{item.title}</Text>
            <Text style={styles.tocPage}>{item.page}</Text>
          </View>
        ))}
      </View>

      <Footer />
    </Page>

    {/* Introduction */}
    <Page size="A4" style={styles.page}>
      <Header title="AI Agent & Console Reference Guide" />
      <Text style={styles.sectionTitle}>Introduction</Text>
      
      <Text style={styles.paragraph}>
        Aura Intercept uses AI Operatives to automate your service business. Think of each operative as a 
        virtual employee that specializes in a specific task. These operatives work together within 
        Control Centers (Consoles) - specialized hubs for different areas of your business.
      </Text>

      <Text style={styles.subsectionTitle}>What are AI Agents?</Text>
      <Text style={styles.paragraph}>
        AI Agents are like virtual employees that handle specific tasks automatically. They can answer 
        customer questions, book appointments, dispatch technicians, create invoices, and much more. 
        Each agent is trained to do one thing really well.
      </Text>

      <Text style={styles.subsectionTitle}>What are Consoles?</Text>
      <Text style={styles.paragraph}>
        Consoles are control centers that group related AI Agents together. For example, the Customer 
        Portal console contains all agents that handle customer interactions. You access consoles through 
        your dashboard to manage and monitor agent activity.
      </Text>

      <View style={styles.legendBox}>
        <Text style={[styles.subsectionTitle, { marginTop: 0 }]}>How to Read Agent Information</Text>
        <View style={styles.legendItem}>
          <Text style={[styles.legendIcon, { color: colors.green }]}>[CORE]</Text>
          <Text style={styles.legendText}><Text style={{ fontWeight: 700 }}>Core Agent</Text> - The main agent that must be enabled for the console to work</Text>
        </View>
        <View style={styles.legendItem}>
          <Text style={[styles.legendIcon, { color: colors.green }]}>[OK]</Text>
          <Text style={styles.legendText}><Text style={{ fontWeight: 700 }}>Works Alone</Text> - Can function without other agents being enabled</Text>
        </View>
        <View style={styles.legendItem}>
          <Text style={[styles.legendIcon, { color: colors.amber }]}>{'[->]'}</Text>
          <Text style={styles.legendText}><Text style={{ fontWeight: 700 }}>Requires</Text> - Needs these other agents to be enabled first</Text>
        </View>
      </View>

      <View style={styles.infoBox}>
        <Text style={styles.noticeTitle}>Quick Tip</Text>
        <Text style={styles.noticeText}>
          Always start by enabling the Core Agent (marked with [CORE]) for each console you want to use. 
          Other agents in that console depend on the core agent being active.
        </Text>
      </View>

      <Footer />
    </Page>

    {/* Communication Channels Page */}
    <Page size="A4" style={styles.page}>
      <Header title="AI Agent & Console Reference Guide" />
      <Text style={styles.sectionTitle}>Communication Channels</Text>
      
      <Text style={styles.paragraph}>
        AI agents communicate with customers across multiple channels. The AI Receptionist acts as the 
        primary interceptor for all inbound communication, while specialized agents handle outbound 
        messages based on their function.
      </Text>

      <View style={styles.table}>
        <View style={styles.tableHeader}>
          <Text style={[styles.tableHeaderCell, { flex: 1.2 }]}>Channel</Text>
          <Text style={[styles.tableHeaderCell, { flex: 2 }]}>Inbound Handling</Text>
          <Text style={[styles.tableHeaderCell, { flex: 2 }]}>Outbound Sending</Text>
          <Text style={[styles.tableHeaderCell, { flex: 1 }]}>Integration</Text>
        </View>
        {COMMUNICATION_CHANNELS.map((ch, i) => (
          <View key={i} style={i % 2 === 0 ? styles.tableRow : styles.tableRowAlt}>
            <Text style={[styles.tableCellLeft, { flex: 1.2 }]}>{ch.icon} {ch.channel}</Text>
            <Text style={[styles.tableCellLeft, { flex: 2, fontSize: 8 }]}>{ch.inbound}</Text>
            <Text style={[styles.tableCellLeft, { flex: 2, fontSize: 8 }]}>{ch.outbound}</Text>
            <Text style={[styles.tableCell, { flex: 1, fontSize: 8 }]}>{ch.integration}</Text>
          </View>
        ))}
      </View>

      <Text style={styles.subsectionTitle}>Agent Communication Capabilities</Text>
      
      <View style={styles.agentCard}>
        <Text style={styles.agentName}>[PHONE] AI Receptionist (Triage)</Text>
        <Text style={styles.agentDesc}>
          Answers Voice Calls - Responds to SMS - Handles Chat Widget - Routes to Specialists
        </Text>
      </View>

      <View style={styles.agentCard}>
        <Text style={styles.agentName}>[BELL] Follow-up Agent</Text>
        <Text style={styles.agentDesc}>
          Sends Email Reminders - Sends SMS Reminders - Makes Voice Reminder Calls
        </Text>
      </View>

      <View style={styles.agentCard}>
        <Text style={styles.agentName}>[LOCATION] ETA Agent</Text>
        <Text style={styles.agentDesc}>
          Sends SMS ETA Updates - Sends Email ETA Notifications
        </Text>
      </View>

      <View style={styles.agentCard}>
        <Text style={styles.agentName}>[MEGAPHONE] Campaign Agent</Text>
        <Text style={styles.agentDesc}>
          Sends Email Campaigns - Sends SMS Campaigns - Promotional Messages
        </Text>
      </View>

      <View style={styles.agentCard}>
        <Text style={styles.agentName}>[STAR] Review Agent</Text>
        <Text style={styles.agentDesc}>
          Sends Review Request Emails - Sends Review Request SMS
        </Text>
      </View>

      <View style={styles.agentCard}>
        <Text style={styles.agentName}>[MONEY] Invoice Agent</Text>
        <Text style={styles.agentDesc}>
          Sends Invoice Emails - Payment Reminder Emails
        </Text>
      </View>

      <View style={styles.infoBox}>
        <Text style={styles.noticeTitle}>24/7 Availability</Text>
        <Text style={styles.noticeText}>
          The AI Receptionist operates around the clock, ensuring customers can always reach your 
          business via phone, text, or chat widget - even outside business hours.
        </Text>
      </View>

      <Footer />
    </Page>

    {/* Console 1: Customer Portal */}
    <Page size="A4" style={styles.page}>
      <Header title="AI Agent & Console Reference Guide" />
      <Text style={styles.sectionTitle}>Console 1: Customer Portal</Text>
      
      <View style={[styles.consoleCard, { borderLeftColor: CONSOLES[0].color, backgroundColor: CONSOLES[0].colorLight }]}>
        <Text style={[styles.consoleTitle, { color: CONSOLES[0].color }]}>{CONSOLES[0].name}</Text>
        <Text style={styles.consoleDesc}>{CONSOLES[0].description}</Text>
        <Text style={{ fontSize: 10, fontWeight: 700, marginTop: 8, marginBottom: 6 }}>Features:</Text>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 4 }}>
          {CONSOLES[0].features.map((f, i) => (
            <Text key={i} style={{ fontSize: 8, backgroundColor: colors.white, padding: 4, borderRadius: 2 }}>{f}</Text>
          ))}
        </View>
      </View>

      <Text style={styles.subsectionTitle}>AI Agents in This Console</Text>
      
      {CONSOLES[0].agents.map((agent, i) => (
        <View key={i} style={styles.agentCard}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            {agent.isCore && <Text style={{ color: colors.green, fontSize: 12 }}>[CORE]</Text>}
            <Text style={styles.agentName}>{agent.name}</Text>
          </View>
          <Text style={styles.agentDesc}>{agent.description}</Text>
          <View style={styles.agentStatus}>
            <View style={[styles.statusBadge, { backgroundColor: agent.worksAlone ? colors.greenLight : colors.amberLight }]}>
              <Text style={[styles.statusText, { color: agent.worksAlone ? colors.green : colors.amber }]}>
                {agent.worksAlone ? 'Works Alone' : 'Needs Other Agents'}
              </Text>
            </View>
            {agent.requires.length > 0 && (
              <Text style={{ fontSize: 8, color: colors.gray }}>Requires: {agent.requires.join(', ')}</Text>
            )}
          </View>
        </View>
      ))}

      <Footer />
    </Page>

    {/* Console 2: Field Operations */}
    <Page size="A4" style={styles.page}>
      <Header title="AI Agent & Console Reference Guide" />
      <Text style={styles.sectionTitle}>Console 2: Field Operations</Text>
      
      <View style={[styles.consoleCard, { borderLeftColor: CONSOLES[1].color, backgroundColor: CONSOLES[1].colorLight }]}>
        <Text style={[styles.consoleTitle, { color: CONSOLES[1].color }]}>{CONSOLES[1].name}</Text>
        <Text style={styles.consoleDesc}>{CONSOLES[1].description}</Text>
        <Text style={{ fontSize: 10, fontWeight: 700, marginTop: 8, marginBottom: 6 }}>Features:</Text>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 4 }}>
          {CONSOLES[1].features.map((f, i) => (
            <Text key={i} style={{ fontSize: 8, backgroundColor: colors.white, padding: 4, borderRadius: 2 }}>{f}</Text>
          ))}
        </View>
      </View>

      <Text style={styles.subsectionTitle}>AI Agents in This Console</Text>
      
      {CONSOLES[1].agents.map((agent, i) => (
        <View key={i} style={styles.agentCard}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            {agent.isCore && <Text style={{ color: colors.green, fontSize: 12 }}>[CORE]</Text>}
            <Text style={styles.agentName}>{agent.name}</Text>
          </View>
          <Text style={styles.agentDesc}>{agent.description}</Text>
          <View style={styles.agentStatus}>
            <View style={[styles.statusBadge, { backgroundColor: agent.worksAlone ? colors.greenLight : colors.amberLight }]}>
              <Text style={[styles.statusText, { color: agent.worksAlone ? colors.green : colors.amber }]}>
                {agent.worksAlone ? 'Works Alone' : 'Needs Other Agents'}
              </Text>
            </View>
            {agent.requires.length > 0 && (
              <Text style={{ fontSize: 8, color: colors.gray }}>Requires: {agent.requires.join(', ')}</Text>
            )}
          </View>
        </View>
      ))}

      <Footer />
    </Page>

    {/* Console 3: Business Management */}
    <Page size="A4" style={styles.page}>
      <Header title="AI Agent & Console Reference Guide" />
      <Text style={styles.sectionTitle}>Console 3: Business Management</Text>
      
      <View style={[styles.consoleCard, { borderLeftColor: CONSOLES[2].color, backgroundColor: CONSOLES[2].colorLight }]}>
        <Text style={[styles.consoleTitle, { color: CONSOLES[2].color }]}>{CONSOLES[2].name}</Text>
        <Text style={styles.consoleDesc}>{CONSOLES[2].description}</Text>
        <Text style={{ fontSize: 10, fontWeight: 700, marginTop: 8, marginBottom: 6 }}>Features:</Text>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 4 }}>
          {CONSOLES[2].features.map((f, i) => (
            <Text key={i} style={{ fontSize: 8, backgroundColor: colors.white, padding: 4, borderRadius: 2 }}>{f}</Text>
          ))}
        </View>
      </View>

      <Text style={styles.subsectionTitle}>AI Agents in This Console</Text>
      
      {CONSOLES[2].agents.map((agent, i) => (
        <View key={i} style={styles.agentCard}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            {agent.isCore && <Text style={{ color: colors.green, fontSize: 12 }}>[CORE]</Text>}
            <Text style={styles.agentName}>{agent.name}</Text>
          </View>
          <Text style={styles.agentDesc}>{agent.description}</Text>
          <View style={styles.agentStatus}>
            <View style={[styles.statusBadge, { backgroundColor: agent.worksAlone ? colors.greenLight : colors.amberLight }]}>
              <Text style={[styles.statusText, { color: agent.worksAlone ? colors.green : colors.amber }]}>
                {agent.worksAlone ? 'Works Alone' : 'Needs Other Agents'}
              </Text>
            </View>
            {agent.requires.length > 0 && (
              <Text style={{ fontSize: 8, color: colors.gray }}>Requires: {agent.requires.join(', ')}</Text>
            )}
          </View>
        </View>
      ))}

      <Footer />
    </Page>

    {/* Console 4: Outreach & Sales Ops */}
    <Page size="A4" style={styles.page}>
      <Header title="AI Agent & Console Reference Guide" />
      <Text style={styles.sectionTitle}>Console 4: Outreach & Sales Ops</Text>
      
      <View style={[styles.consoleCard, { borderLeftColor: CONSOLES[3].color, backgroundColor: CONSOLES[3].colorLight }]}>
        <Text style={[styles.consoleTitle, { color: CONSOLES[3].color }]}>{CONSOLES[3].name}</Text>
        <Text style={styles.consoleDesc}>{CONSOLES[3].description}</Text>
        <Text style={{ fontSize: 10, fontWeight: 700, marginTop: 8, marginBottom: 6 }}>Features:</Text>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 4 }}>
          {CONSOLES[3].features.map((f, i) => (
            <Text key={i} style={{ fontSize: 8, backgroundColor: colors.white, padding: 4, borderRadius: 2 }}>{f}</Text>
          ))}
        </View>
      </View>

      <Text style={styles.subsectionTitle}>AI Agents in This Console</Text>
      
      {CONSOLES[3].agents.map((agent, i) => (
        <View key={i} style={styles.agentCard}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            {agent.isCore && <Text style={{ color: colors.green, fontSize: 12 }}>[CORE]</Text>}
            <Text style={styles.agentName}>{agent.name}</Text>
          </View>
          <Text style={styles.agentDesc}>{agent.description}</Text>
          <View style={styles.agentStatus}>
            <View style={[styles.statusBadge, { backgroundColor: agent.worksAlone ? colors.greenLight : colors.amberLight }]}>
              <Text style={[styles.statusText, { color: agent.worksAlone ? colors.green : colors.amber }]}>
                {agent.worksAlone ? 'Works Alone' : 'Needs Other Agents'}
              </Text>
            </View>
          </View>
        </View>
      ))}

      <Text style={styles.subsectionTitle}>Console 5: Analytics & Reports</Text>
      
      <View style={[styles.consoleCard, { borderLeftColor: CONSOLES[4].color, backgroundColor: CONSOLES[4].colorLight }]}>
        <Text style={[styles.consoleTitle, { color: CONSOLES[4].color }]}>{CONSOLES[4].name}</Text>
        <Text style={styles.consoleDesc}>{CONSOLES[4].description}</Text>
        <Text style={{ fontSize: 10, fontWeight: 700, marginTop: 8, marginBottom: 6 }}>Features:</Text>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 4 }}>
          {CONSOLES[4].features.map((f, i) => (
            <Text key={i} style={{ fontSize: 8, backgroundColor: colors.white, padding: 4, borderRadius: 2 }}>{f}</Text>
          ))}
        </View>
      </View>

      <Footer />
    </Page>

    {/* Console 5: Analytics & Reports - Agents */}
    <Page size="A4" style={styles.page}>
      <Header title="AI Agent & Console Reference Guide" />
      <Text style={styles.sectionTitle}>Console 5: Analytics & Reports (Agents)</Text>
      
      {CONSOLES[4].agents.map((agent, i) => (
        <View key={i} style={styles.agentCard}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            {agent.isCore && <Text style={{ color: colors.green, fontSize: 12 }}>[CORE]</Text>}
            <Text style={styles.agentName}>{agent.name}</Text>
          </View>
          <Text style={styles.agentDesc}>{agent.description}</Text>
          <View style={styles.agentStatus}>
            <View style={[styles.statusBadge, { backgroundColor: agent.worksAlone ? colors.greenLight : colors.amberLight }]}>
              <Text style={[styles.statusText, { color: agent.worksAlone ? colors.green : colors.amber }]}>
                {agent.worksAlone ? 'Works Alone' : 'Needs Other Agents'}
              </Text>
            </View>
            {agent.requires.length > 0 && (
              <Text style={{ fontSize: 8, color: colors.gray }}>Requires: {agent.requires.join(', ')}</Text>
            )}
          </View>
        </View>
      ))}

      <View style={styles.noticeBox}>
        <Text style={styles.noticeTitle}>Agent Dependency Chain</Text>
        <Text style={styles.noticeText}>
          Some agents need other agents to be enabled first. For example, the Invoice Agent needs the 
          Quoting Agent to be active. This is because invoices are often created from quotes. When you 
          try to enable a dependent agent, the system will prompt you to enable required agents first.
        </Text>
      </View>

      <Footer />
    </Page>

    {/* Complete Agent Summary */}
    <Page size="A4" style={styles.page}>
      <Header title="AI Agent & Console Reference Guide" />
      <Text style={styles.sectionTitle}>Complete Agent Summary</Text>
      
      <Text style={styles.paragraph}>
        Quick reference of all 19 AI Agents, organized by console. Use this table to see at a glance 
        which agents work independently and which need other agents enabled.
      </Text>

      <View style={styles.table}>
        <View style={styles.tableHeader}>
          <Text style={[styles.tableHeaderCell, { flex: 2 }]}>Agent Name</Text>
          <Text style={[styles.tableHeaderCell, { flex: 1.5 }]}>Console</Text>
          <Text style={[styles.tableHeaderCell, { flex: 1 }]}>Type</Text>
          <Text style={[styles.tableHeaderCell, { flex: 1 }]}>Works Alone</Text>
        </View>
        {ALL_AGENTS.map((agent, i) => (
          <View key={i} style={i % 2 === 0 ? styles.tableRow : styles.tableRowAlt}>
            <Text style={[styles.tableCellLeft, { flex: 2 }]}>
              {agent.isCore ? '[CORE] ' : ''}{agent.name}
            </Text>
            <Text style={[styles.tableCell, { flex: 1.5 }]}>{agent.console}</Text>
            <Text style={[styles.tableCell, { flex: 1 }]}>{agent.isCore ? 'Core' : 'Dependent'}</Text>
            <Text style={[styles.tableCell, { flex: 1, color: agent.worksAlone ? colors.green : colors.amber }]}>
              {agent.worksAlone ? 'Yes' : 'No'}
            </Text>
          </View>
        ))}
      </View>

      <Footer />
    </Page>

    {/* Subscription Tiers */}
    <Page size="A4" style={styles.page}>
      <Header title="AI Agent & Console Reference Guide" />
      <Text style={styles.sectionTitle}>Subscription Tiers & Agent Access</Text>
      
      <Text style={styles.paragraph}>
        Different subscription tiers give you access to different consoles and agents. Choose the tier 
        that matches your business needs.
      </Text>

      {TIERS.map((tier, i) => (
        <View key={i} style={styles.tierCard}>
          <Text style={styles.tierName}>{tier.name}</Text>
          <Text style={styles.tierPrice}>{tier.price}</Text>
          <Text style={{ fontSize: 9, color: colors.gray, marginBottom: 8 }}>Annual: {tier.annualPrice} (Save ~16%)</Text>
          
          <View style={{ flexDirection: 'row', gap: 20 }}>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 10, fontWeight: 700, marginBottom: 4 }}>Consoles:</Text>
              {tier.consoles.map((c, j) => (
                <Text key={j} style={{ fontSize: 9 }}>- {c}</Text>
              ))}
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 10, fontWeight: 700, marginBottom: 4 }}>{tier.agentCount} AI Agents:</Text>
              {Array.isArray(tier.agents) ? tier.agents.slice(0, 5).map((a, j) => (
                <Text key={j} style={{ fontSize: 9 }}>- {a}</Text>
              )) : <Text style={{ fontSize: 9 }}>{tier.agents}</Text>}
              {Array.isArray(tier.agents) && tier.agents.length > 5 && (
                <Text style={{ fontSize: 9, color: colors.gray }}>+ {tier.agents.length - 5} more...</Text>
              )}
            </View>
          </View>
        </View>
      ))}

      <View style={styles.infoBox}>
        <Text style={styles.noticeTitle}>Upgrading Tiers</Text>
        <Text style={styles.noticeText}>
          When you upgrade to a higher tier, all agents included in that tier are automatically activated. 
          You can still customize which agents are enabled within your tier's allowance.
        </Text>
      </View>

      <Footer />
    </Page>

    {/* 3rd Party Integrations */}
    <Page size="A4" style={styles.page}>
      <Header title="AI Agent & Console Reference Guide" />
      <Text style={styles.sectionTitle}>3rd Party Integrations</Text>
      
      <Text style={styles.paragraph}>
        Some features require connecting to external services. Below is a breakdown of required and 
        optional integrations, their costs, and which agents they affect.
      </Text>

      <Text style={[styles.subsectionTitle, { color: colors.red }]}>Required Integration</Text>
      
      <View style={styles.integrationCard}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <Text style={styles.integrationName}>{INTEGRATIONS[0].name}</Text>
          <View style={[styles.statusBadge, { backgroundColor: colors.redLight }]}>
            <Text style={[styles.statusText, { color: colors.red }]}>REQUIRED</Text>
          </View>
        </View>
        <Text style={styles.integrationPurpose}>Purpose: {INTEGRATIONS[0].purpose}</Text>
        <Text style={styles.integrationCost}>Cost: {INTEGRATIONS[0].cost}</Text>
        <Text style={{ fontSize: 9, color: colors.gray }}>Used by: {INTEGRATIONS[0].agentsAffected.join(', ')}</Text>
        <Text style={{ fontSize: 9, color: colors.dark, marginTop: 4 }}>
          Needed for: {INTEGRATIONS[0].requiredFor}
        </Text>
      </View>

      <Text style={[styles.subsectionTitle, { color: colors.green }]}>Optional Integrations</Text>
      
      {INTEGRATIONS.slice(1).map((integration, i) => (
        <View key={i} style={styles.integrationCard}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <Text style={styles.integrationName}>{integration.name}</Text>
            <View style={[styles.statusBadge, { backgroundColor: colors.greenLight }]}>
              <Text style={[styles.statusText, { color: colors.green }]}>OPTIONAL</Text>
            </View>
          </View>
          <Text style={styles.integrationPurpose}>Purpose: {integration.purpose}</Text>
          <Text style={styles.integrationCost}>Cost: {integration.cost}</Text>
          <Text style={{ fontSize: 9, color: colors.gray }}>Enhances: {integration.agentsAffected.join(', ')}</Text>
          <Text style={{ fontSize: 9, color: colors.dark, marginTop: 4 }}>
            Needed for: {integration.requiredFor}
          </Text>
          <Text style={{ fontSize: 8, color: colors.amber, marginTop: 2, fontStyle: 'italic' }}>
            Without: {integration.whatHappensWithout}
          </Text>
        </View>
      ))}

      <View style={styles.noticeBox}>
        <Text style={styles.noticeTitle}>Important: Your Stripe Account</Text>
        <Text style={styles.noticeText}>
          To accept payments from customers through invoices, you need to connect YOUR OWN Stripe account. 
          This is separate from the platform subscription. Stripe fees (2.9% + $0.30 per transaction) are 
          charged by Stripe directly to you, not through the platform.
        </Text>
        <Text style={[styles.noticeText, { marginTop: 4, fontStyle: 'italic', fontSize: 8 }]}>
          All 3rd-party fees are set by their respective vendors and are subject to change at any time, which may affect the cost of those services for your company.
        </Text>
      </View>

      <Footer />
    </Page>

    {/* Glossary & FAQ */}
    <Page size="A4" style={styles.page}>
      <Header title="AI Agent & Console Reference Guide" />
      <Text style={styles.sectionTitle}>Glossary & FAQ</Text>
      
      <Text style={styles.subsectionTitle}>Key Terms</Text>
      
      <Text style={styles.glossaryTerm}>AI Agent</Text>
      <Text style={styles.glossaryDef}>A virtual assistant that performs specific tasks automatically, like booking appointments or sending reminders.</Text>
      
      <Text style={styles.glossaryTerm}>Console</Text>
      <Text style={styles.glossaryDef}>A control center in your dashboard that groups related AI Agents together for easy management.</Text>
      
      <Text style={styles.glossaryTerm}>Core Agent</Text>
      <Text style={styles.glossaryDef}>The main agent in a console that must be enabled for other agents in that console to work.</Text>
      
      <Text style={styles.glossaryTerm}>Dependent Agent</Text>
      <Text style={styles.glossaryDef}>An agent that requires one or more other agents to be enabled before it can function.</Text>
      
      <Text style={styles.glossaryTerm}>Triage</Text>
      <Text style={styles.glossaryDef}>The process of sorting and routing customer requests to the right place or agent.</Text>

      <Text style={styles.subsectionTitle}>Frequently Asked Questions</Text>
      
      <Text style={styles.glossaryTerm}>Q: Can I enable just some agents within a console?</Text>
      <Text style={styles.glossaryDef}>Yes, as long as you have the core agent enabled. You can customize which dependent agents are active.</Text>
      
      <Text style={styles.glossaryTerm}>Q: What happens if I disable a required agent?</Text>
      <Text style={styles.glossaryDef}>Dependent agents will show a warning and may not function correctly until you re-enable the required agent.</Text>
      
      <Text style={styles.glossaryTerm}>Q: Do I need all the 3rd party integrations?</Text>
      <Text style={styles.glossaryDef}>Only Resend (for email) is required. Other integrations are optional and add extra features like SMS and voice calls.</Text>
      
      <Text style={styles.glossaryTerm}>Q: Can agents work while I'm away?</Text>
      <Text style={styles.glossaryDef}>Yes! Once configured, AI agents work 24/7 automatically. They can book appointments, answer questions, and more even when you're not logged in.</Text>
      
      <Text style={styles.glossaryTerm}>Q: How do I upgrade my subscription tier?</Text>
      <Text style={styles.glossaryDef}>Go to Settings → Subscription to view and change your plan. Upgrades take effect immediately.</Text>

      <View style={[styles.infoBox, { marginTop: 20 }]}>
        <Text style={styles.noticeTitle}>Need Help?</Text>
        <Text style={styles.noticeText}>
          Contact support through your dashboard or email for personalized assistance with configuring 
          your AI agents and integrations.
        </Text>
      </View>

      <Footer />
    </Page>
  </Document>
);

export default AIAgentGuidesPDF;
