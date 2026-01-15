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
    fontSize: 36,
    fontWeight: 700,
    marginBottom: 16,
    textAlign: 'center',
  },
  coverSubtitle: {
    fontSize: 18,
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
    fontSize: 32,
    fontWeight: 700,
    color: colors.accent,
  },
  coverStatLabel: {
    fontSize: 10,
    color: '#a5b4fc',
    marginTop: 4,
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
  agentCard: {
    backgroundColor: colors.lightGray,
    padding: 12,
    marginBottom: 8,
    borderRadius: 4,
  },
  agentName: {
    fontSize: 11,
    fontWeight: 600,
    color: colors.dark,
    marginBottom: 4,
  },
  agentDescription: {
    fontSize: 9,
    color: colors.gray,
    lineHeight: 1.4,
  },
  categoryHeader: {
    fontSize: 12,
    fontWeight: 600,
    color: colors.secondary,
    marginTop: 14,
    marginBottom: 8,
    paddingBottom: 4,
    borderBottomWidth: 1,
    borderBottomColor: colors.lightGray,
  },
  featureGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginTop: 10,
  },
  featureCard: {
    width: '48%',
    backgroundColor: colors.lightGray,
    padding: 12,
    borderRadius: 4,
    marginBottom: 10,
  },
  featureTitle: {
    fontSize: 11,
    fontWeight: 600,
    marginBottom: 4,
  },
  featureDesc: {
    fontSize: 9,
    color: colors.gray,
    lineHeight: 1.4,
  },
  integrationRow: {
    flexDirection: 'row',
    marginBottom: 8,
    alignItems: 'flex-start',
  },
  integrationName: {
    fontSize: 10,
    fontWeight: 600,
    width: 100,
  },
  integrationDesc: {
    fontSize: 9,
    color: colors.gray,
    flex: 1,
  },
  tableOfContents: {
    marginTop: 20,
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
  bulletPoint: {
    flexDirection: 'row',
    marginBottom: 6,
    paddingLeft: 10,
  },
  bullet: {
    width: 15,
    fontSize: 10,
    color: colors.primary,
  },
  bulletText: {
    flex: 1,
    fontSize: 10,
    lineHeight: 1.5,
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
  timelinePhase: {
    marginBottom: 12,
    paddingLeft: 12,
    borderLeftWidth: 3,
    borderLeftColor: colors.primary,
  },
  timelinePhaseName: {
    fontSize: 11,
    fontWeight: 600,
    color: colors.primary,
    marginBottom: 2,
  },
  timelinePeriod: {
    fontSize: 9,
    color: colors.gray,
    marginBottom: 6,
  },
  timelineMilestone: {
    flexDirection: 'row',
    marginBottom: 3,
    paddingLeft: 8,
  },
  timelineBullet: {
    width: 12,
    fontSize: 8,
    color: colors.secondary,
  },
  timelineMilestoneText: {
    flex: 1,
    fontSize: 9,
    lineHeight: 1.4,
  },
  // Complexity Score Styles
  complexityScoreCard: {
    backgroundColor: colors.primary,
    padding: 20,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 16,
  },
  complexityScoreNumber: {
    fontSize: 48,
    fontWeight: 700,
    color: colors.white,
  },
  complexityScoreLabel: {
    fontSize: 12,
    color: '#a5b4fc',
    marginTop: 4,
  },
  complexityRating: {
    fontSize: 14,
    fontWeight: 600,
    color: colors.white,
    marginTop: 8,
  },
  dimensionRow: {
    flexDirection: 'row',
    marginBottom: 8,
    alignItems: 'center',
  },
  dimensionName: {
    fontSize: 9,
    fontWeight: 600,
    width: 130,
  },
  dimensionBar: {
    flex: 1,
    height: 12,
    backgroundColor: colors.lightGray,
    borderRadius: 6,
    marginHorizontal: 8,
  },
  dimensionBarFill: {
    height: 12,
    backgroundColor: colors.primary,
    borderRadius: 6,
  },
  dimensionScore: {
    fontSize: 9,
    fontWeight: 600,
    width: 35,
    textAlign: 'right',
  },
  metricGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 12,
  },
  metricCard: {
    width: '48%',
    backgroundColor: colors.lightGray,
    padding: 10,
    borderRadius: 4,
    marginBottom: 4,
  },
  metricCardTitle: {
    fontSize: 10,
    fontWeight: 600,
    color: colors.primary,
    marginBottom: 6,
  },
  metricItem: {
    flexDirection: 'row',
    marginBottom: 3,
  },
  metricLabel: {
    fontSize: 8,
    color: colors.gray,
    flex: 1,
  },
  metricValue: {
    fontSize: 8,
    fontWeight: 600,
  },
  effortGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginTop: 12,
  },
  effortCard: {
    width: '23%',
    backgroundColor: colors.dark,
    padding: 10,
    borderRadius: 4,
    alignItems: 'center',
  },
  effortValue: {
    fontSize: 14,
    fontWeight: 700,
    color: colors.accent,
    marginBottom: 4,
  },
  effortLabel: {
    fontSize: 7,
    color: '#a5b4fc',
    textAlign: 'center',
  },
});

// Development Timeline Data
const developmentTimeline = [
  {
    name: 'Phase 1: Foundation',
    period: 'Core Platform Setup',
    milestones: [
      'Multi-tenant architecture with Row-Level Security (RLS)',
      'User authentication and role-based access control',
      'Company and employee management systems',
      'Basic customer portal and booking interface',
      'Database schema design (55 tables)',
    ],
  },
  {
    name: 'Phase 2: Customer Engagement',
    period: 'AI-Powered Interactions',
    milestones: [
      'AI Agent orchestration system',
      'Customer Engagement Console with 6 agents',
      'Multi-channel chat interface (web, widget)',
      'Appointment scheduling with availability checking',
      'Automated reminders (email, SMS)',
    ],
  },
  {
    name: 'Phase 3: Field Operations',
    period: 'Dispatch & Technician Tools',
    milestones: [
      'Field Operations Console with dispatch agents',
      'Technician mobile app (PWA)',
      'Real-time location tracking and ETA',
      'Job queue management and photo documentation',
      'Route optimization integration',
    ],
  },
  {
    name: 'Phase 4: Business Operations',
    period: 'Financial Workflows',
    milestones: [
      'Quote generation with service catalog',
      'Invoice creation with Stripe payment links',
      'Inventory management system',
      'Warranty registration and claims processing',
      'Financial reporting dashboards',
    ],
  },
  {
    name: 'Phase 5: Marketing & Analytics',
    period: 'Growth & Insights',
    milestones: [
      'Marketing & Sales Console with campaign agents',
      'Customer referral program tracking',
      'Win-back campaign automation',
      'Analytics Console with KPI dashboards',
      'AI-powered forecasting and insights',
    ],
  },
  {
    name: 'Phase 6: Integrations & Polish',
    period: 'Third-Party Connections',
    milestones: [
      'Stripe payment processing integration',
      'Twilio voice and SMS integration',
      'ElevenLabs voice synthesis and cloning',
      'Google Calendar OAuth sync',
      'CRM adapter framework',
      'Platform documentation and guides',
    ],
  },
];

const Header = ({ title }: { title: string }) => (
  <View style={styles.header} fixed>
    <Text style={styles.headerTitle}>{title}</Text>
    <Text style={styles.pageNumber} render={({ pageNumber }) => `Page ${pageNumber}`} />
  </View>
);

const BulletPoint = ({ children }: { children: string }) => (
  <View style={styles.bulletPoint}>
    <Text style={styles.bullet}>•</Text>
    <Text style={styles.bulletText}>{children}</Text>
  </View>
);

const agents = {
  customerEngagement: [
    { name: 'AI Receptionist', desc: 'AI-powered inquiry routing and classification' },
    { name: 'Scheduling Agent', desc: 'Natural language appointment scheduling with availability checks' },
    { name: 'Follow-up Agent', desc: 'Automated reminders via email, SMS, and voice calls' },
    { name: 'Social Media Review Agent', desc: 'Feedback collection and review platform integration' },
    { name: 'Support Agent', desc: 'Customer support and inquiry handling' },
    { name: 'Portal Agent', desc: 'Customer self-service portal assistance' },
  ],
  fieldOperations: [
    { name: 'Dispatch Agent', desc: 'Smart job assignment based on skills, location, and availability' },
    { name: 'Route Agent', desc: 'Real-time route optimization for technicians' },
    { name: 'ETA Agent', desc: 'Arrival time predictions with customer notifications' },
    { name: 'Check-in Agent', desc: 'Job status tracking with photo documentation' },
  ],
  businessOperations: [
    { name: 'Quoting Agent', desc: 'Instant quote generation from service catalog' },
    { name: 'Invoice Agent', desc: 'Automated invoice creation and payment tracking' },
    { name: 'Inventory Agent', desc: 'Parts and inventory tracking with low-stock alerts' },
    { name: 'Warranty Agent', desc: 'Warranty registration, lookup, and claims processing' },
    { name: 'Admin Agent', desc: 'Business administration and operations tasks' },
  ],
  marketingSales: [
    { name: 'Marketing Agent', desc: 'Campaign orchestration and content generation' },
    { name: 'Promo Agent', desc: 'Promotional campaigns and coupon management' },
    { name: 'Referral Agent', desc: 'Customer referral program tracking and rewards' },
    { name: 'Win-back Agent', desc: 'Re-engage inactive customers with targeted offers' },
    { name: 'Seasonal Agent', desc: 'Holiday and seasonal campaign automation' },
    { name: 'Lead Agent', desc: 'Lead capture and qualification' },
  ],
  analytics: [
    { name: 'Insights Agent', desc: 'Real-time dashboards and KPI monitoring' },
    { name: 'Forecast Agent', desc: 'AI-powered demand and revenue predictions' },
    { name: 'Revenue Agent', desc: 'Financial trend tracking and analysis' },
    { name: 'Performance Agent', desc: 'Team and technician performance metrics' },
  ],
};

const PlatformDocumentPDF = () => (
  <Document>
    {/* Cover Page */}
    <Page size="A4" style={styles.coverPage}>
      <Text style={styles.coverTitle}>AI-Powered Service Business Platform</Text>
      <Text style={styles.coverSubtitle}>Complete Automation for Appointment-Based Businesses</Text>
      <View style={styles.coverStats}>
        <View style={styles.coverStat}>
          <Text style={styles.coverStatNumber}>22+</Text>
          <Text style={styles.coverStatLabel}>AI Agents</Text>
        </View>
        <View style={styles.coverStat}>
          <Text style={styles.coverStatNumber}>5</Text>
          <Text style={styles.coverStatLabel}>Agent Consoles</Text>
        </View>
        <View style={styles.coverStat}>
          <Text style={styles.coverStatNumber}>47+</Text>
          <Text style={styles.coverStatLabel}>Backend Services</Text>
        </View>
        <View style={styles.coverStat}>
          <Text style={styles.coverStatNumber}>4</Text>
          <Text style={styles.coverStatLabel}>Channels</Text>
        </View>
      </View>
      <View style={{ marginTop: 60 }}>
        <Text style={{ fontSize: 12, textAlign: 'center', color: '#a5b4fc' }}>
          Business Documentation • {new Date().toLocaleDateString()}
        </Text>
      </View>
    </Page>

    {/* Table of Contents */}
    <Page size="A4" style={styles.page}>
      <Text style={styles.sectionTitle}>Table of Contents</Text>
      <View style={styles.tableOfContents}>
        {[
          { title: '1. Executive Summary', page: '3' },
          { title: '2. Development Timeline', page: '4' },
          { title: '3. Project Complexity Score', page: '5' },
          { title: '4. AI Agents Catalog', page: '6' },
          { title: '5. Agent Consoles', page: '9' },
          { title: '6. Platform Features', page: '10' },
          { title: '7. Third-Party Integrations', page: '11' },
          { title: '8. Technical Architecture', page: '12' },
          { title: '9. User Roles & Portals', page: '13' },
          { title: '10. Knowledge Base System', page: '14' },
          { title: '11. Communication Channels', page: '15' },
          { title: '12. Target Industries', page: '16' },
          { title: '13. Pricing Model', page: '17' },
        ].map((item, i) => (
          <View key={i} style={styles.tocItem}>
            <Text style={styles.tocTitle}>{item.title}</Text>
            <Text style={styles.tocPage}>{item.page}</Text>
          </View>
        ))}
      </View>
    </Page>

    {/* Executive Summary */}
    <Page size="A4" style={styles.page}>
      <Header title="Executive Summary" />
      <Text style={styles.sectionTitle}>Executive Summary</Text>
      
      <Text style={styles.subsectionTitle}>Platform Overview</Text>
      <Text style={styles.paragraph}>
        Our AI-powered platform is a comprehensive solution designed specifically for appointment-based 
        service businesses. It combines 22+ specialized AI agents with multi-channel communication 
        capabilities to automate customer engagement, field operations, business administration, 
        marketing, and analytics.
      </Text>
      
      <Text style={styles.subsectionTitle}>Value Proposition</Text>
      <BulletPoint>24/7 AI-powered customer engagement across voice, SMS, email, and web chat</BulletPoint>
      <BulletPoint>Intelligent appointment scheduling with real-time availability checking</BulletPoint>
      <BulletPoint>Automated technician dispatch and route optimization</BulletPoint>
      <BulletPoint>Complete financial workflow automation (quotes, invoices, payments)</BulletPoint>
      <BulletPoint>AI-driven marketing campaigns and customer retention</BulletPoint>
      <BulletPoint>Real-time analytics and business intelligence</BulletPoint>
      
      <Text style={styles.subsectionTitle}>Target Market</Text>
      <Text style={styles.paragraph}>
        The platform is designed for appointment-focused service businesses including HVAC companies, 
        plumbing services, home repair businesses, appliance repair, electrical services, and other 
        field service operations that rely on scheduling and dispatching technicians.
      </Text>
      
      <Text style={styles.subsectionTitle}>Key Differentiators</Text>
      <BulletPoint>Multi-agent AI orchestration with intelligent handoffs between specialized agents</BulletPoint>
      <BulletPoint>White-label ready with full custom branding capabilities</BulletPoint>
      <BulletPoint>Multi-tenant architecture with enterprise-grade security (RLS, RBAC)</BulletPoint>
      <BulletPoint>Platform-managed integrations eliminating need for third-party dashboard configuration</BulletPoint>
    </Page>

    {/* Development Timeline */}
    <Page size="A4" style={styles.page}>
      <Header title="Development Timeline" />
      <Text style={styles.sectionTitle}>Development Timeline</Text>
      <Text style={styles.paragraph}>
        The platform was developed through 6 major phases, each building upon the previous 
        to create a comprehensive AI-powered service business solution. Key milestones 
        represent significant feature completions and capability additions.
      </Text>
      
      {developmentTimeline.map((phase, i) => (
        <View key={i} style={styles.timelinePhase}>
          <Text style={styles.timelinePhaseName}>{phase.name}</Text>
          <Text style={styles.timelinePeriod}>{phase.period}</Text>
          {phase.milestones.map((milestone, j) => (
            <View key={j} style={styles.timelineMilestone}>
              <Text style={styles.timelineBullet}>●</Text>
              <Text style={styles.timelineMilestoneText}>{milestone}</Text>
            </View>
          ))}
        </View>
      ))}
    </Page>

    {/* Project Complexity Score */}
    <Page size="A4" style={styles.page}>
      <Header title="Project Complexity Score" />
      <Text style={styles.sectionTitle}>Project Complexity Score</Text>
      
      <View style={styles.complexityScoreCard}>
        <Text style={styles.complexityScoreNumber}>87</Text>
        <Text style={styles.complexityScoreLabel}>out of 100</Text>
        <Text style={styles.complexityRating}>Enterprise-Grade Complexity</Text>
      </View>

      <Text style={styles.subsectionTitle}>Scoring Dimensions</Text>
      {[
        { name: 'Frontend Complexity', score: 18, max: 20 },
        { name: 'Backend Complexity', score: 19, max: 20 },
        { name: 'AI/ML Integration', score: 14, max: 15 },
        { name: 'Third-Party Integrations', score: 13, max: 15 },
        { name: 'Security & Architecture', score: 12, max: 15 },
        { name: 'User Experience', score: 11, max: 15 },
      ].map((dim, i) => (
        <View key={i} style={styles.dimensionRow}>
          <Text style={styles.dimensionName}>{dim.name}</Text>
          <View style={styles.dimensionBar}>
            <View style={[styles.dimensionBarFill, { width: `${(dim.score / dim.max) * 100}%` }]} />
          </View>
          <Text style={styles.dimensionScore}>{dim.score}/{dim.max}</Text>
        </View>
      ))}

      <View style={styles.metricGrid}>
        <View style={styles.metricCard}>
          <Text style={styles.metricCardTitle}>Frontend Metrics</Text>
          {[
            { label: 'React Components', value: '150+' },
            { label: 'Pages/Routes', value: '44+' },
            { label: 'UI Components (shadcn)', value: '30+' },
            { label: 'Custom Hooks', value: '15+' },
            { label: 'Form Components', value: '25+' },
          ].map((m, i) => (
            <View key={i} style={styles.metricItem}>
              <Text style={styles.metricLabel}>{m.label}</Text>
              <Text style={styles.metricValue}>{m.value}</Text>
            </View>
          ))}
        </View>
        <View style={styles.metricCard}>
          <Text style={styles.metricCardTitle}>Backend Metrics</Text>
          {[
            { label: 'Database Tables', value: '55' },
            { label: 'Edge Functions', value: '48' },
            { label: 'Database Functions', value: '11' },
            { label: 'Storage Buckets', value: '4' },
            { label: 'Scheduled Jobs', value: '8+' },
          ].map((m, i) => (
            <View key={i} style={styles.metricItem}>
              <Text style={styles.metricLabel}>{m.label}</Text>
              <Text style={styles.metricValue}>{m.value}</Text>
            </View>
          ))}
        </View>
        <View style={styles.metricCard}>
          <Text style={styles.metricCardTitle}>AI System Metrics</Text>
          {[
            { label: 'Specialized Agents', value: '22+' },
            { label: 'Agent Consoles', value: '5' },
            { label: 'Orchestration Flows', value: 'Multi-agent' },
            { label: 'Supported Channels', value: '4' },
          ].map((m, i) => (
            <View key={i} style={styles.metricItem}>
              <Text style={styles.metricLabel}>{m.label}</Text>
              <Text style={styles.metricValue}>{m.value}</Text>
            </View>
          ))}
        </View>
        <View style={styles.metricCard}>
          <Text style={styles.metricCardTitle}>Security Metrics</Text>
          {[
            { label: 'Row-Level Security', value: 'All tables' },
            { label: 'Role-Based Access', value: '4 roles' },
            { label: 'Multi-Tenant Isolation', value: 'company_id' },
            { label: 'API Encryption', value: 'Vault' },
          ].map((m, i) => (
            <View key={i} style={styles.metricItem}>
              <Text style={styles.metricLabel}>{m.label}</Text>
              <Text style={styles.metricValue}>{m.value}</Text>
            </View>
          ))}
        </View>
      </View>

      <Text style={styles.subsectionTitle}>Estimated Development Effort</Text>
      <View style={styles.effortGrid}>
        <View style={styles.effortCard}>
          <Text style={styles.effortValue}>800-1200+</Text>
          <Text style={styles.effortLabel}>Development Hours</Text>
        </View>
        <View style={styles.effortCard}>
          <Text style={styles.effortValue}>3-4</Text>
          <Text style={styles.effortLabel}>Developers</Text>
        </View>
        <View style={styles.effortCard}>
          <Text style={styles.effortValue}>4-6</Text>
          <Text style={styles.effortLabel}>Months</Text>
        </View>
        <View style={styles.effortCard}>
          <Text style={styles.effortValue}>50,000+</Text>
          <Text style={styles.effortLabel}>Lines of Code</Text>
        </View>
      </View>
    </Page>

    {/* AI Agents Catalog - Page 1 */}
    <Page size="A4" style={styles.page}>
      <Header title="AI Agents Catalog" />
      <Text style={styles.sectionTitle}>AI Agents Catalog</Text>
      <Text style={styles.paragraph}>
        The platform features 22+ specialized AI agents organized into 5 functional categories. 
        Each agent is purpose-built for specific tasks and can seamlessly hand off to other agents 
        as needed through our intelligent orchestration system.
      </Text>
      
      <Text style={styles.categoryHeader}>Customer Engagement (6 Agents)</Text>
      {agents.customerEngagement.map((agent, i) => (
        <View key={i} style={styles.agentCard}>
          <Text style={styles.agentName}>{agent.name}</Text>
          <Text style={styles.agentDescription}>{agent.desc}</Text>
        </View>
      ))}
      
      <Text style={styles.categoryHeader}>Field Operations (4 Agents)</Text>
      {agents.fieldOperations.map((agent, i) => (
        <View key={i} style={styles.agentCard}>
          <Text style={styles.agentName}>{agent.name}</Text>
          <Text style={styles.agentDescription}>{agent.desc}</Text>
        </View>
      ))}
    </Page>

    {/* AI Agents Catalog - Page 2 */}
    <Page size="A4" style={styles.page}>
      <Header title="AI Agents Catalog" />
      
      <Text style={styles.categoryHeader}>Business Operations (5 Agents)</Text>
      {agents.businessOperations.map((agent, i) => (
        <View key={i} style={styles.agentCard}>
          <Text style={styles.agentName}>{agent.name}</Text>
          <Text style={styles.agentDescription}>{agent.desc}</Text>
        </View>
      ))}
      
      <Text style={styles.categoryHeader}>Marketing & Sales (6 Agents)</Text>
      {agents.marketingSales.map((agent, i) => (
        <View key={i} style={styles.agentCard}>
          <Text style={styles.agentName}>{agent.name}</Text>
          <Text style={styles.agentDescription}>{agent.desc}</Text>
        </View>
      ))}
    </Page>

    {/* AI Agents Catalog - Page 3 */}
    <Page size="A4" style={styles.page}>
      <Header title="AI Agents Catalog" />
      
      <Text style={styles.categoryHeader}>Analytics & Optimization (4 Agents)</Text>
      {agents.analytics.map((agent, i) => (
        <View key={i} style={styles.agentCard}>
          <Text style={styles.agentName}>{agent.name}</Text>
          <Text style={styles.agentDescription}>{agent.desc}</Text>
        </View>
      ))}
      
      <Text style={styles.subsectionTitle}>Agent Orchestration</Text>
      <Text style={styles.paragraph}>
        All agents communicate through an event-driven architecture using a shared context system. 
        When a customer interaction requires multiple capabilities, agents seamlessly hand off 
        conversations while preserving full context. For example, a customer calling about a 
        broken AC might interact with:
      </Text>
      <BulletPoint>AI Receptionist → classifies as urgent HVAC issue</BulletPoint>
      <BulletPoint>Dispatch Agent → assigns nearest available technician</BulletPoint>
      <BulletPoint>ETA Agent → provides real-time arrival estimate</BulletPoint>
      <BulletPoint>Follow-up Agent → sends confirmation and reminder notifications</BulletPoint>
    </Page>

    {/* Agent Consoles */}
    <Page size="A4" style={styles.page}>
      <Header title="Agent Consoles" />
      <Text style={styles.sectionTitle}>Agent Consoles</Text>
      <Text style={styles.paragraph}>
        Five specialized consoles provide role-based access to AI agents and platform functionality:
      </Text>
      
      <View style={styles.agentCard}>
        <Text style={styles.agentName}>Customer Engagement Console</Text>
        <Text style={styles.agentDescription}>
          Central hub for all customer-facing AI interactions. Includes booking, support, 
          follow-up, and review management capabilities. Features quick actions for common 
          tasks and real-time conversation monitoring.
        </Text>
      </View>
      
      <View style={styles.agentCard}>
        <Text style={styles.agentName}>Field Operations Console</Text>
        <Text style={styles.agentDescription}>
          Technician and dispatch management center. Handles job assignment, route optimization, 
          ETA tracking, and check-in/check-out workflows. Mobile-optimized for field use with 
          photo documentation and parts tracking.
        </Text>
      </View>
      
      <View style={styles.agentCard}>
        <Text style={styles.agentName}>Business & Accounting Console</Text>
        <Text style={styles.agentDescription}>
          Financial and administrative hub. Manages quotes, invoices, inventory, warranties, 
          and business administration tasks. Integrates with payment processing and accounting.
        </Text>
      </View>
      
      <View style={styles.agentCard}>
        <Text style={styles.agentName}>Marketing & Sales Console</Text>
        <Text style={styles.agentDescription}>
          Growth and retention center. Orchestrates marketing campaigns, promotional offers, 
          referral programs, and customer win-back initiatives. AI-powered content generation 
          and audience segmentation.
        </Text>
      </View>
      
      <View style={styles.agentCard}>
        <Text style={styles.agentName}>Analytics & Reports Ops Console</Text>
        <Text style={styles.agentDescription}>
          Business intelligence dashboard. Real-time KPIs, revenue forecasting, performance 
          metrics, and trend analysis. AI-powered insights and recommendations for optimization.
        </Text>
      </View>
    </Page>

    {/* Platform Features */}
    <Page size="A4" style={styles.page}>
      <Header title="Platform Features" />
      <Text style={styles.sectionTitle}>Platform Features</Text>
      
      <View style={styles.featureGrid}>
        <View style={styles.featureCard}>
          <Text style={styles.featureTitle}>Multi-Channel AI</Text>
          <Text style={styles.featureDesc}>
            Unified AI experience across voice calls, SMS, email, and web chat with consistent 
            personality and context preservation.
          </Text>
        </View>
        
        <View style={styles.featureCard}>
          <Text style={styles.featureTitle}>Customer Self-Service Portal</Text>
          <Text style={styles.featureDesc}>
            Branded portal for customers to book appointments, track service status, view 
            invoices, and communicate with AI agents.
          </Text>
        </View>
        
        <View style={styles.featureCard}>
          <Text style={styles.featureTitle}>White-Label Ready</Text>
          <Text style={styles.featureDesc}>
            Full branding customization including logos, colors, and domain. Each company 
            gets their own branded experience.
          </Text>
        </View>
        
        <View style={styles.featureCard}>
          <Text style={styles.featureTitle}>Multi-Tenant Architecture</Text>
          <Text style={styles.featureDesc}>
            Enterprise-grade data isolation with Row Level Security (RLS). Each company's 
            data is completely isolated and secure.
          </Text>
        </View>
        
        <View style={styles.featureCard}>
          <Text style={styles.featureTitle}>Smart Reminders</Text>
          <Text style={styles.featureDesc}>
            Automated appointment reminders via preferred channel (email, SMS, or voice) 
            with configurable timing and content.
          </Text>
        </View>
        
        <View style={styles.featureCard}>
          <Text style={styles.featureTitle}>Embeddable Chat Widget</Text>
          <Text style={styles.featureDesc}>
            Customizable chat widget that companies can embed on their websites for 
            24/7 AI-powered customer engagement.
          </Text>
        </View>
        
        <View style={styles.featureCard}>
          <Text style={styles.featureTitle}>Knowledge Base</Text>
          <Text style={styles.featureDesc}>
            Centralized repository for services, FAQs, business hours, documents, 
            inventory, and warranties that AI agents use for accurate responses.
          </Text>
        </View>
        
        <View style={styles.featureCard}>
          <Text style={styles.featureTitle}>Role-Based Access Control</Text>
          <Text style={styles.featureDesc}>
            Granular permissions for platform admins, company admins, employees, 
            technicians, and customers with job-type specific agent access.
          </Text>
        </View>
      </View>
    </Page>

    {/* Third-Party Integrations */}
    <Page size="A4" style={styles.page}>
      <Header title="Third-Party Integrations" />
      <Text style={styles.sectionTitle}>Third-Party Integrations</Text>
      <Text style={styles.paragraph}>
        The platform integrates with industry-leading services. All integrations are platform-managed, 
        meaning companies only provide API credentials and the platform handles all configuration.
      </Text>
      
      <Text style={styles.subsectionTitle}>Payments</Text>
      <View style={styles.integrationRow}>
        <Text style={styles.integrationName}>Stripe</Text>
        <Text style={styles.integrationDesc}>
          Complete payment processing including subscriptions, invoicing, and customer billing. 
          Platform-managed with automatic reconciliation.
        </Text>
      </View>
      
      <Text style={styles.subsectionTitle}>Communications</Text>
      <View style={styles.integrationRow}>
        <Text style={styles.integrationName}>Twilio</Text>
        <Text style={styles.integrationDesc}>
          Voice calling and SMS messaging infrastructure. Supports inbound/outbound calls, 
          two-way SMS, and automated voice reminders.
        </Text>
      </View>
      <View style={styles.integrationRow}>
        <Text style={styles.integrationName}>ElevenLabs</Text>
        <Text style={styles.integrationDesc}>
          AI voice synthesis with natural-sounding voices. Supports voice cloning for 
          brand-consistent customer interactions.
        </Text>
      </View>
      <View style={styles.integrationRow}>
        <Text style={styles.integrationName}>Resend</Text>
        <Text style={styles.integrationDesc}>
          Transactional email delivery for appointment confirmations, reminders, 
          invoices, and marketing campaigns.
        </Text>
      </View>
      
      <Text style={styles.subsectionTitle}>Calendar Sync</Text>
      <View style={styles.integrationRow}>
        <Text style={styles.integrationName}>Google Calendar</Text>
        <Text style={styles.integrationDesc}>
          Two-way OAuth sync with automatic appointment updates and conflict detection.
        </Text>
      </View>
      <View style={styles.integrationRow}>
        <Text style={styles.integrationName}>CalDAV</Text>
        <Text style={styles.integrationDesc}>
          Universal calendar protocol supporting Apple Calendar, Thunderbird, and Android DAVx5.
        </Text>
      </View>
      <View style={styles.integrationRow}>
        <Text style={styles.integrationName}>ICS Feeds</Text>
        <Text style={styles.integrationDesc}>
          Subscribe-only feeds for any calendar application with token-based access.
        </Text>
      </View>
      
      <Text style={styles.subsectionTitle}>CRM</Text>
      <View style={styles.integrationRow}>
        <Text style={styles.integrationName}>CRM Adapter</Text>
        <Text style={styles.integrationDesc}>
          Configurable CRM connections for syncing customer data, appointments, and activities.
        </Text>
      </View>
    </Page>

    {/* Technical Architecture */}
    <Page size="A4" style={styles.page}>
      <Header title="Technical Architecture" />
      <Text style={styles.sectionTitle}>Technical Architecture</Text>
      
      <Text style={styles.subsectionTitle}>Frontend Stack</Text>
      <BulletPoint>React 18 with TypeScript for type-safe development</BulletPoint>
      <BulletPoint>Vite for fast development and optimized production builds</BulletPoint>
      <BulletPoint>Tailwind CSS with custom design system and semantic tokens</BulletPoint>
      <BulletPoint>TanStack Query for server state management and caching</BulletPoint>
      <BulletPoint>React Router for client-side navigation</BulletPoint>
      <BulletPoint>Shadcn/UI component library with Radix primitives</BulletPoint>
      
      <Text style={styles.subsectionTitle}>Backend Stack</Text>
      <BulletPoint>Supabase (PostgreSQL) for database and authentication</BulletPoint>
      <BulletPoint>47+ Edge Functions (Deno) for serverless business logic</BulletPoint>
      <BulletPoint>Supabase Realtime for live updates and notifications</BulletPoint>
      <BulletPoint>Row Level Security (RLS) for data isolation</BulletPoint>
      <BulletPoint>Database triggers for automated workflows</BulletPoint>
      
      <Text style={styles.subsectionTitle}>AI Infrastructure</Text>
      <BulletPoint>Lovable AI Gateway with Gemini 2.5 Flash model</BulletPoint>
      <BulletPoint>Specialized system prompts per agent type</BulletPoint>
      <BulletPoint>Tool definitions for agent actions (booking, dispatch, quoting, etc.)</BulletPoint>
      <BulletPoint>Event-driven agent communication via shared context</BulletPoint>
      
      <Text style={styles.subsectionTitle}>Edge Functions (47+)</Text>
      <Text style={styles.paragraph}>
        Key functions include: ai-agent-chat, ai-orchestrator, booking-actions, appointment-reminders, 
        voice-handler, outbound-call, send-appointment-sms, send-appointment-email, create-checkout, 
        stripe-customer-portal, google-calendar-sync, caldav-server, crm-adapter, generate-campaign-content, 
        elevenlabs-tts, elevenlabs-clone-voice, and many more.
      </Text>
    </Page>

    {/* User Roles & Portals */}
    <Page size="A4" style={styles.page}>
      <Header title="User Roles & Portals" />
      <Text style={styles.sectionTitle}>User Roles & Portals</Text>
      
      <View style={styles.agentCard}>
        <Text style={styles.agentName}>Platform Administrator</Text>
        <Text style={styles.agentDescription}>
          Full platform access including company management, subscription oversight, and system 
          configuration. Can view and manage all companies on the platform.
        </Text>
      </View>
      
      <View style={styles.agentCard}>
        <Text style={styles.agentName}>Company Administrator</Text>
        <Text style={styles.agentDescription}>
          Complete control over their company's settings, employees, customers, and integrations. 
          Access to all 5 agent consoles and full reporting capabilities.
        </Text>
      </View>
      
      <View style={styles.agentCard}>
        <Text style={styles.agentName}>Employee</Text>
        <Text style={styles.agentDescription}>
          Role-based access to specific agent consoles based on job type assignments. Can have 
          multiple job types (e.g., scheduling agent, dispatcher, marketing manager).
        </Text>
      </View>
      
      <View style={styles.agentCard}>
        <Text style={styles.agentName}>Technician</Text>
        <Text style={styles.agentDescription}>
          Dedicated mobile-optimized dashboard for field operations. Includes job queue, calendar, 
          route navigation, check-in/out, photo documentation, and availability management.
        </Text>
      </View>
      
      <View style={styles.agentCard}>
        <Text style={styles.agentName}>Customer</Text>
        <Text style={styles.agentDescription}>
          Self-service portal for booking appointments, tracking service status, viewing history, 
          managing invoices, and communicating with AI agents. Can connect to multiple companies.
        </Text>
      </View>
      
      <Text style={styles.subsectionTitle}>Job Type to Agent Access Mapping</Text>
      <Text style={styles.paragraph}>
        Employees are assigned job types that automatically grant access to relevant AI agents:
      </Text>
      <BulletPoint>Technicians → Dispatch Agent, ETA Agent, Check-in Agent</BulletPoint>
      <BulletPoint>Scheduling Agents → Scheduling Agent, Quoting Agent, Support Agent</BulletPoint>
      <BulletPoint>Dispatchers → Dispatch Agent, Route Agent, ETA Agent</BulletPoint>
      <BulletPoint>Marketing Managers → Marketing Agent, Promo Agent, Win-back Agent</BulletPoint>
    </Page>

    {/* Knowledge Base System */}
    <Page size="A4" style={styles.page}>
      <Header title="Knowledge Base System" />
      <Text style={styles.sectionTitle}>Knowledge Base System</Text>
      <Text style={styles.paragraph}>
        The Knowledge Base is the central repository of information that AI agents use to provide 
        accurate, company-specific responses. Companies configure their knowledge base once, and 
        all agents automatically have access to this information.
      </Text>
      
      <View style={styles.agentCard}>
        <Text style={styles.agentName}>Services Catalog</Text>
        <Text style={styles.agentDescription}>
          Complete list of services offered with descriptions, pricing, duration estimates, 
          and availability. Used by Booking and Quoting agents.
        </Text>
      </View>
      
      <View style={styles.agentCard}>
        <Text style={styles.agentName}>FAQs</Text>
        <Text style={styles.agentDescription}>
          Frequently asked questions with answers organized by category. Can be bulk imported 
          from documents. Used by all customer-facing agents.
        </Text>
      </View>
      
      <View style={styles.agentCard}>
        <Text style={styles.agentName}>Business Hours</Text>
        <Text style={styles.agentDescription}>
          Operating hours by day of week including holiday closures. Used by Scheduling agent 
          to ensure appointments are only scheduled during open hours.
        </Text>
      </View>
      
      <View style={styles.agentCard}>
        <Text style={styles.agentName}>Documents</Text>
        <Text style={styles.agentDescription}>
          Uploaded documents (PDFs, manuals, policies) that agents can reference. Supports 
          document parsing and search.
        </Text>
      </View>
      
      <View style={styles.agentCard}>
        <Text style={styles.agentName}>Inventory</Text>
        <Text style={styles.agentDescription}>
          Parts and materials inventory with quantities, pricing, and low-stock alerts. 
          Used by Inventory and Quoting agents.
        </Text>
      </View>
      
      <View style={styles.agentCard}>
        <Text style={styles.agentName}>Warranties</Text>
        <Text style={styles.agentDescription}>
          Warranty policies and registered customer warranties. Used by Warranty agent 
          for lookups, registration, and claims processing.
        </Text>
      </View>
    </Page>

    {/* Communication Channels */}
    <Page size="A4" style={styles.page}>
      <Header title="Communication Channels" />
      <Text style={styles.sectionTitle}>Communication Channels</Text>
      <Text style={styles.paragraph}>
        The platform provides unified AI-powered communication across four channels. All channels 
        share the same AI agents and context, ensuring consistent customer experiences.
      </Text>
      
      <View style={styles.agentCard}>
        <Text style={styles.agentName}>Voice AI</Text>
        <Text style={styles.agentDescription}>
          Natural voice conversations via phone using ElevenLabs voice synthesis. Supports 
          inbound call handling, outbound reminders, and voice-based booking. Companies can 
          clone voices for brand consistency.
        </Text>
      </View>
      
      <View style={styles.agentCard}>
        <Text style={styles.agentName}>SMS Messaging</Text>
        <Text style={styles.agentDescription}>
          Two-way SMS communication via Twilio. Includes automated reminders, conversational 
          booking, status updates, and marketing campaigns. Supports opt-out management.
        </Text>
      </View>
      
      <View style={styles.agentCard}>
        <Text style={styles.agentName}>Email</Text>
        <Text style={styles.agentDescription}>
          Transactional and marketing emails via Resend. Includes appointment confirmations, 
          reminders, invoices, review requests, and campaign emails. Customizable templates 
          with company branding.
        </Text>
      </View>
      
      <View style={styles.agentCard}>
        <Text style={styles.agentName}>Web Chat Widget</Text>
        <Text style={styles.agentDescription}>
          Embeddable chat widget for company websites. Provides 24/7 AI-powered customer 
          engagement with the full multi-agent system. Customizable appearance and behavior.
        </Text>
      </View>
      
      <Text style={styles.subsectionTitle}>Channel Preferences</Text>
      <Text style={styles.paragraph}>
        Customers can set their preferred communication channels and opt out of specific 
        channels. The platform respects these preferences across all automated communications.
      </Text>
    </Page>

    {/* Target Industries */}
    <Page size="A4" style={styles.page}>
      <Header title="Target Industries" />
      <Text style={styles.sectionTitle}>Target Industries</Text>
      <Text style={styles.paragraph}>
        The platform is designed for appointment-based service businesses that dispatch 
        technicians or service professionals to customer locations.
      </Text>
      
      <View style={styles.featureGrid}>
        <View style={styles.featureCard}>
          <Text style={styles.featureTitle}>HVAC Services</Text>
          <Text style={styles.featureDesc}>
            Heating, ventilation, and air conditioning installation, repair, and maintenance.
          </Text>
        </View>
        
        <View style={styles.featureCard}>
          <Text style={styles.featureTitle}>Plumbing</Text>
          <Text style={styles.featureDesc}>
            Residential and commercial plumbing repair, installation, and emergency services.
          </Text>
        </View>
        
        <View style={styles.featureCard}>
          <Text style={styles.featureTitle}>Electrical Services</Text>
          <Text style={styles.featureDesc}>
            Electrical installation, repair, and maintenance for homes and businesses.
          </Text>
        </View>
        
        <View style={styles.featureCard}>
          <Text style={styles.featureTitle}>Appliance Repair</Text>
          <Text style={styles.featureDesc}>
            Repair and maintenance for household and commercial appliances.
          </Text>
        </View>
        
        <View style={styles.featureCard}>
          <Text style={styles.featureTitle}>Home Services</Text>
          <Text style={styles.featureDesc}>
            General home maintenance, cleaning, and handyman services.
          </Text>
        </View>
        
        <View style={styles.featureCard}>
          <Text style={styles.featureTitle}>Pest Control</Text>
          <Text style={styles.featureDesc}>
            Pest management and prevention services for residential and commercial.
          </Text>
        </View>
        
        <View style={styles.featureCard}>
          <Text style={styles.featureTitle}>Landscaping</Text>
          <Text style={styles.featureDesc}>
            Lawn care, landscaping, and outdoor maintenance services.
          </Text>
        </View>
        
        <View style={styles.featureCard}>
          <Text style={styles.featureTitle}>Pool & Spa</Text>
          <Text style={styles.featureDesc}>
            Pool and spa maintenance, repair, and installation services.
          </Text>
        </View>
      </View>
    </Page>

    {/* Pricing Model */}
    <Page size="A4" style={styles.page}>
      <Header title="Pricing Model" />
      <Text style={styles.sectionTitle}>Pricing Model</Text>
      
      <View style={styles.agentCard}>
        <Text style={styles.agentName}>Enterprise Tier - $250/month</Text>
        <Text style={styles.agentDescription}>
          Single all-inclusive tier with full access to all platform features, AI agents, 
          and integrations. No feature restrictions or tier limitations.
        </Text>
      </View>
      
      <Text style={styles.subsectionTitle}>What's Included</Text>
      <BulletPoint>All 22+ AI agents across 5 consoles</BulletPoint>
      <BulletPoint>All communication channels (voice, SMS, email, web chat)</BulletPoint>
      <BulletPoint>Customer self-service portal</BulletPoint>
      <BulletPoint>Technician mobile dashboard</BulletPoint>
      <BulletPoint>Knowledge base management</BulletPoint>
      <BulletPoint>Calendar sync (Google, CalDAV, ICS)</BulletPoint>
      <BulletPoint>Analytics and reporting</BulletPoint>
      <BulletPoint>White-label branding</BulletPoint>
      <BulletPoint>10 employee accounts included</BulletPoint>
      
      <Text style={styles.subsectionTitle}>Additional Employee Pricing</Text>
      <Text style={styles.paragraph}>
        The base subscription includes employee accounts based on your tier. Additional employees 
        are billed at $25/month per 10 employees. The system automatically adjusts the subscription 
        fee when employee count exceeds the included amount.
      </Text>
      
      <Text style={styles.subsectionTitle}>Usage-Based Costs (Pass-Through)</Text>
      <BulletPoint>SMS: ~$0.01 per message (Twilio rates)</BulletPoint>
      <BulletPoint>Voice: ~$0.12 per minute (ElevenLabs) or cheaper with Google/OpenAI TTS</BulletPoint>
      <BulletPoint>Email: Included in base price (Resend)</BulletPoint>
      <BulletPoint>Stripe: Standard payment processing fees (2.9% + $0.30)</BulletPoint>
      
      <Text style={styles.subsectionTitle}>Free Trial</Text>
      <Text style={styles.paragraph}>
        14-day free trial with full feature access. No credit card required to start. 
        Automated trial reminders at 7 days, 3 days, and 1 day before expiration.
      </Text>
    </Page>
  </Document>
);

export default PlatformDocumentPDF;
