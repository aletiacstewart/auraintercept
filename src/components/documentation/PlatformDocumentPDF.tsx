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
  success: '#10b981',
  warning: '#f59e0b',
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
  coverTagline: {
    fontSize: 14,
    marginBottom: 30,
    textAlign: 'center',
    color: colors.accent,
    fontWeight: 600,
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
  highlightBox: {
    backgroundColor: colors.primary,
    padding: 16,
    borderRadius: 8,
    marginBottom: 16,
  },
  highlightTitle: {
    fontSize: 14,
    fontWeight: 700,
    color: colors.white,
    marginBottom: 8,
  },
  highlightText: {
    fontSize: 11,
    color: '#e0e7ff',
    lineHeight: 1.5,
  },
  statCard: {
    backgroundColor: colors.lightGray,
    padding: 12,
    marginBottom: 8,
    borderRadius: 4,
    flexDirection: 'row',
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 700,
    color: colors.primary,
    width: 80,
  },
  statContent: {
    flex: 1,
  },
  statLabel: {
    fontSize: 11,
    fontWeight: 600,
    color: colors.dark,
    marginBottom: 2,
  },
  statDescription: {
    fontSize: 9,
    color: colors.gray,
    lineHeight: 1.4,
  },
  heroStatGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginTop: 12,
    marginBottom: 16,
  },
  heroStatCard: {
    width: '31%',
    backgroundColor: colors.dark,
    padding: 12,
    borderRadius: 6,
    alignItems: 'center',
  },
  heroStatNumber: {
    fontSize: 20,
    fontWeight: 700,
    color: colors.accent,
    marginBottom: 4,
  },
  heroStatLabel: {
    fontSize: 8,
    color: '#a5b4fc',
    textAlign: 'center',
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
    color: colors.primary,
  },
  featureDesc: {
    fontSize: 9,
    color: colors.gray,
    lineHeight: 1.4,
  },
  featureGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginTop: 10,
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
  comparisonRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: colors.lightGray,
    paddingVertical: 8,
  },
  comparisonLabel: {
    width: '40%',
    fontSize: 9,
    fontWeight: 600,
  },
  comparisonBefore: {
    width: '30%',
    fontSize: 9,
    color: colors.gray,
    textAlign: 'center',
  },
  comparisonAfter: {
    width: '30%',
    fontSize: 9,
    color: colors.success,
    fontWeight: 600,
    textAlign: 'center',
  },
  testimonialBox: {
    backgroundColor: colors.lightGray,
    padding: 16,
    borderRadius: 8,
    marginBottom: 12,
    borderLeftWidth: 4,
    borderLeftColor: colors.primary,
  },
  testimonialQuote: {
    fontSize: 10,
    fontStyle: 'italic',
    color: colors.dark,
    lineHeight: 1.6,
    marginBottom: 8,
  },
  testimonialAuthor: {
    fontSize: 9,
    fontWeight: 600,
    color: colors.primary,
  },
  pricingCard: {
    backgroundColor: colors.lightGray,
    padding: 16,
    borderRadius: 8,
    marginBottom: 12,
  },
  pricingTier: {
    fontSize: 14,
    fontWeight: 700,
    color: colors.primary,
    marginBottom: 4,
  },
  pricingPrice: {
    fontSize: 24,
    fontWeight: 700,
    color: colors.dark,
    marginBottom: 8,
  },
  pricingFeature: {
    fontSize: 9,
    color: colors.gray,
    marginBottom: 4,
  },
  ctaBox: {
    backgroundColor: colors.accent,
    padding: 20,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 20,
  },
  ctaTitle: {
    fontSize: 16,
    fontWeight: 700,
    color: colors.white,
    marginBottom: 8,
  },
  ctaText: {
    fontSize: 11,
    color: colors.white,
    textAlign: 'center',
    marginBottom: 12,
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
  roiCard: {
    backgroundColor: colors.success,
    padding: 16,
    borderRadius: 8,
    marginBottom: 12,
  },
  roiTitle: {
    fontSize: 12,
    fontWeight: 700,
    color: colors.white,
    marginBottom: 4,
  },
  roiValue: {
    fontSize: 28,
    fontWeight: 700,
    color: colors.white,
    marginBottom: 4,
  },
  roiSubtext: {
    fontSize: 9,
    color: '#d1fae5',
  },
  painPointCard: {
    backgroundColor: '#fef3c7',
    padding: 12,
    borderRadius: 4,
    marginBottom: 8,
  },
  painPointTitle: {
    fontSize: 10,
    fontWeight: 600,
    color: '#92400e',
    marginBottom: 4,
  },
  painPointText: {
    fontSize: 9,
    color: '#78350f',
    lineHeight: 1.4,
  },
  solutionCard: {
    backgroundColor: '#d1fae5',
    padding: 12,
    borderRadius: 4,
    marginBottom: 8,
  },
  solutionTitle: {
    fontSize: 10,
    fontWeight: 600,
    color: '#065f46',
    marginBottom: 4,
  },
  solutionText: {
    fontSize: 9,
    color: '#064e3b',
    lineHeight: 1.4,
  },
  visualDataBox: {
    backgroundColor: colors.dark,
    padding: 16,
    borderRadius: 8,
    marginBottom: 12,
  },
  visualDataTitle: {
    fontSize: 11,
    fontWeight: 600,
    color: colors.accent,
    marginBottom: 8,
  },
  visualDataRow: {
    flexDirection: 'row',
    marginBottom: 6,
    alignItems: 'center',
  },
  visualDataLabel: {
    fontSize: 9,
    color: '#a5b4fc',
    width: '40%',
  },
  visualDataBar: {
    flex: 1,
    height: 10,
    backgroundColor: '#312e81',
    borderRadius: 5,
    marginRight: 8,
  },
  visualDataBarFill: {
    height: 10,
    backgroundColor: colors.accent,
    borderRadius: 5,
  },
  visualDataValue: {
    fontSize: 9,
    fontWeight: 600,
    color: colors.white,
    width: 40,
    textAlign: 'right',
  },
});

const Header = ({ title }: { title: string }) => (
  <View style={styles.header} fixed>
    <Text style={styles.headerTitle}>Aura Intercept - {title}</Text>
    <Text style={styles.pageNumber} render={({ pageNumber }) => `Page ${pageNumber}`} />
  </View>
);

const BulletPoint = ({ children }: { children: string }) => (
  <View style={styles.bulletPoint}>
    <Text style={styles.bullet}>-</Text>
    <Text style={styles.bulletText}>{children}</Text>
  </View>
);

// Marketing-focused AI Agent Categories (19 Core Agents)
const agents = {
  customerEngagement: [
    { name: 'AI Receptionist (Triage)', desc: 'First point of contact - greets customers 24/7 and routes them to the right AI agent. Never misses a call.' },
    { name: 'Follow-up Agent', desc: 'Automated reminders via email, SMS, and voice calls. Reduces no-shows by up to 80%.' },
    { name: 'Review Agent', desc: 'Collects customer feedback and drives reviews to Google, Yelp, and Facebook automatically.' },
  ],
  fieldOperations: [
    { name: 'Booking Agent', desc: 'Natural language appointment scheduling with real-time availability checks and instant confirmations.' },
    { name: 'Dispatch/GPS Console', desc: 'Smart job assignment based on skills, location, and availability. Optimizes technician utilization.' },
    { name: 'Route Agent', desc: 'Real-time route optimization saves fuel and increases daily job capacity by 20%.' },
    { name: 'ETA Agent', desc: 'Accurate arrival predictions with automatic customer notifications. Improves satisfaction scores.' },
    { name: 'Check-in Agent', desc: 'Digital job tracking with photo documentation. Creates audit trails automatically.' },
  ],
  businessManagement: [
    { name: 'Quoting Agent', desc: 'Instant professional quotes from service catalog. Increases close rates.' },
    { name: 'Invoice Agent', desc: 'Automated invoice creation with one-click payment links. Faster collections.' },
    { name: 'Inventory Agent', desc: 'Parts and inventory tracking with low-stock alerts. Prevents service delays.' },
  ],
  marketingSales: [
    { name: 'Campaign Agent', desc: 'Creates and manages promotional, referral, win-back, seasonal, and loyalty campaigns.' },
    { name: 'Lead Agent', desc: 'AI-powered lead scoring and customer segmentation for targeted marketing with higher conversion rates.' },
    { name: 'Marketing Agent', desc: 'Manages customer segments, promo codes, referral tracking, and win-back targeting for inactive customers.' },
  ],
  analytics: [
    { name: 'Insights Agent', desc: 'Business data analysis and trend identification for strategic decisions.' },
    { name: 'Performance Agent', desc: 'Team and technician performance metrics. Identifies top performers and training needs.' },
    { name: 'Revenue Agent', desc: 'Financial trend tracking and analysis. Spots revenue opportunities.' },
    { name: 'Forecast Agent', desc: 'AI-powered demand and revenue predictions. Plan with confidence.' },
  ],
  // Social Media agents are premium add-ons (not included in core 19)
  socialMediaAddons: [
    { name: 'Creative Content Agent', desc: 'AI-generated platform-specific content for Instagram, Facebook, LinkedIn, TikTok, GMB, and SMS.' },
    { name: 'Social Scheduler Agent', desc: 'Optimal posting times and automated queue management across all 6 platforms.' },
    { name: 'Social Analytics Agent', desc: 'Performance tracking and engagement insights for continuous improvement.' },
  ],
};

const PlatformDocumentPDF = () => (
  <Document>
    {/* Cover Page */}
    <Page size="A4" style={styles.coverPage}>
      <Text style={styles.coverTitle}>AURA INTERCEPT</Text>
      <Text style={styles.coverSubtitle}>AI-Powered Service Business Automation</Text>
      <Text style={styles.coverTagline}>"Your Business. Always On. Always Growing."</Text>
      <View style={styles.coverStats}>
        <View style={styles.coverStat}>
          <Text style={styles.coverStatNumber}>10</Text>
          <Text style={styles.coverStatLabel}>AI Operatives</Text>
        </View>
        <View style={styles.coverStat}>
          <Text style={styles.coverStatNumber}>7</Text>
          <Text style={styles.coverStatLabel}>Control Centers</Text>
        </View>
        <View style={styles.coverStat}>
          <Text style={styles.coverStatNumber}>80%</Text>
          <Text style={styles.coverStatLabel}>Time Saved</Text>
        </View>
        <View style={styles.coverStat}>
          <Text style={styles.coverStatNumber}>24/7</Text>
          <Text style={styles.coverStatLabel}>Always On</Text>
        </View>
      </View>
      <View style={{ marginTop: 60 }}>
        <Text style={{ fontSize: 12, textAlign: 'center', color: '#a5b4fc' }}>
          Sales & Marketing Guide - {new Date().toLocaleDateString()}
        </Text>
      </View>
    </Page>

    {/* Table of Contents */}
    <Page size="A4" style={styles.page}>
      <Text style={styles.sectionTitle}>Table of Contents</Text>
      <View style={styles.tableOfContents}>
        {[
          { title: '1. Executive Pitch Summary', page: '3' },
          { title: '2. The Problem We Solve', page: '4' },
          { title: '3. Key Value Metrics & ROI', page: '5' },
          { title: '4. Visual Impact Data', page: '6' },
          { title: '5. AI Agent Ecosystem', page: '7-8' },
          { title: '6. Before vs After Comparison', page: '9' },
          { title: '7. Platform Features Showcase', page: '10' },
          { title: '8. Target Industries', page: '11' },
          { title: '9. Customer Success Stories', page: '12' },
          { title: '10. Pricing & ROI Calculator', page: '13' },
          { title: '11. Competitive Advantages', page: '14' },
          { title: '12. Sales Talking Points', page: '15' },
          { title: '13. Video Script Ideas', page: '16' },
          { title: '14. Social Media Content Ideas', page: '17' },
          { title: '15. Graphic Design Data Points', page: '18' },
        ].map((item, i) => (
          <View key={i} style={styles.tocItem}>
            <Text style={styles.tocTitle}>{item.title}</Text>
            <Text style={styles.tocPage}>{item.page}</Text>
          </View>
        ))}
      </View>
    </Page>

    {/* Executive Pitch Summary */}
    <Page size="A4" style={styles.page}>
      <Header title="Executive Pitch Summary" />
      <Text style={styles.sectionTitle}>Executive Pitch Summary</Text>
      
      <View style={styles.highlightBox}>
        <Text style={styles.highlightTitle}>The 30-Second Elevator Pitch</Text>
        <Text style={styles.highlightText}>
          Aura Intercept is an AI-powered automation platform that runs your service business 24/7. 
          With 10 AI Operatives, we handle everything from answering calls and booking appointments 
          to dispatching technicians and collecting payments. Our clients save 10+ hours per week and 
          see a 40% reduction in missed appointments within 30 days.
        </Text>
      </View>
      
      <Text style={styles.subsectionTitle}>Core Value Propositions</Text>
      <View style={styles.heroStatGrid}>
        <View style={styles.heroStatCard}>
          <Text style={styles.heroStatNumber}>10+</Text>
          <Text style={styles.heroStatLabel}>Hours Saved Weekly</Text>
        </View>
        <View style={styles.heroStatCard}>
          <Text style={styles.heroStatNumber}>40%</Text>
          <Text style={styles.heroStatLabel}>Fewer No-Shows</Text>
        </View>
        <View style={styles.heroStatCard}>
          <Text style={styles.heroStatNumber}>24/7</Text>
          <Text style={styles.heroStatLabel}>Customer Response</Text>
        </View>
        <View style={styles.heroStatCard}>
          <Text style={styles.heroStatNumber}>2x</Text>
          <Text style={styles.heroStatLabel}>More Reviews</Text>
        </View>
        <View style={styles.heroStatCard}>
          <Text style={styles.heroStatNumber}>30%</Text>
          <Text style={styles.heroStatLabel}>Revenue Increase</Text>
        </View>
        <View style={styles.heroStatCard}>
          <Text style={styles.heroStatNumber}>$0</Text>
          <Text style={styles.heroStatLabel}>Missed Call Cost</Text>
        </View>
      </View>

      <Text style={styles.subsectionTitle}>Who It's For</Text>
      <BulletPoint>HVAC, Plumbing, and Electrical companies with 5-50 employees</BulletPoint>
      <BulletPoint>Service businesses struggling with phone overflow and missed leads</BulletPoint>
      <BulletPoint>Companies spending too much time on scheduling and dispatching</BulletPoint>
      <BulletPoint>Owners who want to scale without adding administrative staff</BulletPoint>
      
      <Text style={styles.subsectionTitle}>Key Differentiator</Text>
      <Text style={styles.paragraph}>
        Unlike generic CRMs or answering services, Aura Intercept uses 10 AI Operatives that 
        work together intelligently. When a customer calls about a broken AC, our AI Receptionist 
        classifies the urgency, Booking Agent books the appointment, Dispatch/GPS Console assigns the 
        best technician, and Follow-up Agent sends confirmation—all in seconds, all automatically.
      </Text>
    </Page>

    {/* The Problem We Solve */}
    <Page size="A4" style={styles.page}>
      <Header title="The Problem We Solve" />
      <Text style={styles.sectionTitle}>The Problem We Solve</Text>
      
      <Text style={styles.paragraph}>
        Every service business faces the same challenges. Use these pain points in your sales conversations 
        and marketing materials to connect with prospects on an emotional level.
      </Text>
      
      <View style={styles.painPointCard}>
        <Text style={styles.painPointTitle}>Missed Calls = Missed Revenue</Text>
        <Text style={styles.painPointText}>
          The average service business misses 62% of incoming calls. Each missed call is worth $200-$500 
          in potential revenue. That's $10,000-$25,000 lost monthly.
        </Text>
      </View>
      
      <View style={styles.painPointCard}>
        <Text style={styles.painPointTitle}>Scheduling Chaos</Text>
        <Text style={styles.painPointText}>
          Office staff spend 2-3 hours daily on phone calls, scheduling, and rescheduling. That's 50+ hours 
          monthly of administrative work that doesn't grow the business.
        </Text>
      </View>
      
      <View style={styles.painPointCard}>
        <Text style={styles.painPointTitle}>No-Shows Drain Profits</Text>
        <Text style={styles.painPointText}>
          Industry average no-show rate is 20-30%. Without automated reminders, businesses lose 
          thousands monthly to empty time slots and wasted technician hours.
        </Text>
      </View>
      
      <View style={styles.painPointCard}>
        <Text style={styles.painPointTitle}>After-Hours Black Hole</Text>
        <Text style={styles.painPointText}>
          55% of service requests come outside business hours. Without 24/7 coverage, these leads 
          go to competitors or simply disappear.
        </Text>
      </View>
      
      <View style={styles.painPointCard}>
        <Text style={styles.painPointTitle}>Flying Blind</Text>
        <Text style={styles.painPointText}>
          Most owners don't know their true cost per lead, technician utilization rate, or which 
          services are most profitable. Decisions are based on gut feeling, not data.
        </Text>
      </View>

      <View style={styles.solutionCard}>
        <Text style={styles.solutionTitle}>The Aura Intercept Solution</Text>
        <Text style={styles.solutionText}>
          Our 10 AI Operatives work 24/7 to answer every call, book every appointment, remind every customer, 
          dispatch every technician, and collect every payment - automatically. One platform. Zero missed opportunities.
        </Text>
      </View>
    </Page>

    {/* Key Value Metrics & ROI */}
    <Page size="A4" style={styles.page}>
      <Header title="Key Value Metrics & ROI" />
      <Text style={styles.sectionTitle}>Key Value Metrics & ROI</Text>
      
      <Text style={styles.paragraph}>
        Use these statistics in sales presentations, social media posts, and video content. 
        All metrics are based on industry averages and platform performance data.
      </Text>

      <View style={styles.roiCard}>
        <Text style={styles.roiTitle}>Annual ROI Potential</Text>
        <Text style={styles.roiValue}>$75,000 - $150,000</Text>
        <Text style={styles.roiSubtext}>Based on recovered missed calls + reduced no-shows + time savings</Text>
      </View>

      <View style={styles.statCard}>
        <Text style={styles.statNumber}>10+</Text>
        <View style={styles.statContent}>
          <Text style={styles.statLabel}>Hours Saved Per Week</Text>
          <Text style={styles.statDescription}>Automated scheduling, reminders, and dispatch eliminates manual tasks</Text>
        </View>
      </View>

      <View style={styles.statCard}>
        <Text style={styles.statNumber}>40%</Text>
        <View style={styles.statContent}>
          <Text style={styles.statLabel}>Reduction in No-Shows</Text>
          <Text style={styles.statDescription}>Multi-channel reminders (email, SMS, voice) dramatically cut missed appointments</Text>
        </View>
      </View>

      <View style={styles.statCard}>
        <Text style={styles.statNumber}>100%</Text>
        <View style={styles.statContent}>
          <Text style={styles.statLabel}>Call Answer Rate</Text>
          <Text style={styles.statDescription}>AI Receptionist answers every call 24/7/365—no hold times, no voicemail</Text>
        </View>
      </View>

      <View style={styles.statCard}>
        <Text style={styles.statNumber}>2x</Text>
        <View style={styles.statContent}>
          <Text style={styles.statLabel}>More Online Reviews</Text>
          <Text style={styles.statDescription}>Automated review requests after every completed job drive reputation growth</Text>
        </View>
      </View>

      <View style={styles.statCard}>
        <Text style={styles.statNumber}>30%</Text>
        <View style={styles.statContent}>
          <Text style={styles.statLabel}>Revenue Increase</Text>
          <Text style={styles.statDescription}>Recovered leads + improved efficiency + better customer retention</Text>
        </View>
      </View>

      <View style={styles.statCard}>
        <Text style={styles.statNumber}>5 min</Text>
        <View style={styles.statContent}>
          <Text style={styles.statLabel}>Average Response Time</Text>
          <Text style={styles.statDescription}>Instant AI response vs industry average of 47 minutes for lead follow-up</Text>
        </View>
      </View>
    </Page>

    {/* Visual Impact Data */}
    <Page size="A4" style={styles.page}>
      <Header title="Visual Impact Data" />
      <Text style={styles.sectionTitle}>Visual Impact Data</Text>
      
      <Text style={styles.paragraph}>
        Use these data visualizations for infographics, social media graphics, and video presentations.
      </Text>

      <View style={styles.visualDataBox}>
        <Text style={styles.visualDataTitle}>Time Savings by Task (Hours/Week)</Text>
        {[
          { label: 'Phone Answering', value: 85, display: '8.5 hrs' },
          { label: 'Scheduling', value: 70, display: '7 hrs' },
          { label: 'Reminders', value: 50, display: '5 hrs' },
          { label: 'Dispatching', value: 40, display: '4 hrs' },
          { label: 'Invoicing', value: 30, display: '3 hrs' },
        ].map((item, i) => (
          <View key={i} style={styles.visualDataRow}>
            <Text style={styles.visualDataLabel}>{item.label}</Text>
            <View style={styles.visualDataBar}>
              <View style={[styles.visualDataBarFill, { width: `${item.value}%` }]} />
            </View>
            <Text style={styles.visualDataValue}>{item.display}</Text>
          </View>
        ))}
      </View>

      <View style={styles.visualDataBox}>
        <Text style={styles.visualDataTitle}>AI Agent Performance Metrics</Text>
        {[
          { label: 'Call Answer Rate', value: 100, display: '100%' },
          { label: 'Appointment Accuracy', value: 98, display: '98%' },
          { label: 'Customer Satisfaction', value: 94, display: '94%' },
          { label: 'First-Contact Resolution', value: 87, display: '87%' },
          { label: 'Review Request Success', value: 72, display: '72%' },
        ].map((item, i) => (
          <View key={i} style={styles.visualDataRow}>
            <Text style={styles.visualDataLabel}>{item.label}</Text>
            <View style={styles.visualDataBar}>
              <View style={[styles.visualDataBarFill, { width: `${item.value}%` }]} />
            </View>
            <Text style={styles.visualDataValue}>{item.display}</Text>
          </View>
        ))}
      </View>

      <View style={styles.visualDataBox}>
        <Text style={styles.visualDataTitle}>Revenue Impact by Feature</Text>
        {[
          { label: 'Recovered Missed Calls', value: 90, display: '$2,500/mo' },
          { label: 'Reduced No-Shows', value: 75, display: '$1,800/mo' },
          { label: 'Faster Payments', value: 60, display: '$1,200/mo' },
          { label: 'More Reviews', value: 45, display: '$800/mo' },
          { label: 'Route Optimization', value: 35, display: '$600/mo' },
        ].map((item, i) => (
          <View key={i} style={styles.visualDataRow}>
            <Text style={styles.visualDataLabel}>{item.label}</Text>
            <View style={styles.visualDataBar}>
              <View style={[styles.visualDataBarFill, { width: `${item.value}%` }]} />
            </View>
            <Text style={styles.visualDataValue}>{item.display}</Text>
          </View>
        ))}
      </View>
    </Page>

    {/* AI Agent Ecosystem - Page 1 */}
    <Page size="A4" style={styles.page}>
      <Header title="AI Agent Ecosystem" />
      <Text style={styles.sectionTitle}>10 AI Operatives Working Together</Text>
      <Text style={styles.paragraph}>
        Each agent is specialized for a specific task but seamlessly hands off to others when needed.
        This creates an intelligent, always-on workforce that handles your entire operation.
      </Text>
      
      <Text style={styles.categoryHeader}>Customer Engagement (3 Agents)</Text>
      {agents.customerEngagement.map((agent, i) => (
        <View key={i} style={styles.agentCard}>
          <Text style={styles.agentName}>{agent.name}</Text>
          <Text style={styles.agentDescription}>{agent.desc}</Text>
        </View>
      ))}
      
      <Text style={styles.categoryHeader}>Field Operations (5 Agents)</Text>
      {agents.fieldOperations.map((agent, i) => (
        <View key={i} style={styles.agentCard}>
          <Text style={styles.agentName}>{agent.name}</Text>
          <Text style={styles.agentDescription}>{agent.desc}</Text>
        </View>
      ))}
    </Page>

    {/* AI Agent Ecosystem - Page 2 */}
    <Page size="A4" style={styles.page}>
      <Header title="AI Agent Ecosystem" />
      
      <Text style={styles.categoryHeader}>Business Management (4 Agents)</Text>
      {agents.businessManagement.map((agent, i) => (
        <View key={i} style={styles.agentCard}>
          <Text style={styles.agentName}>{agent.name}</Text>
          <Text style={styles.agentDescription}>{agent.desc}</Text>
        </View>
      ))}
      
      <Text style={styles.categoryHeader}>Outreach & Sales Ops (3 Agents)</Text>
      {agents.marketingSales.map((agent, i) => (
        <View key={i} style={styles.agentCard}>
          <Text style={styles.agentName}>{agent.name}</Text>
          <Text style={styles.agentDescription}>{agent.desc}</Text>
        </View>
      ))}

      <Text style={styles.categoryHeader}>Analytics & Reporting (4 Agents)</Text>
      {agents.analytics.map((agent, i) => (
        <View key={i} style={styles.agentCard}>
          <Text style={styles.agentName}>{agent.name}</Text>
          <Text style={styles.agentDescription}>{agent.desc}</Text>
        </View>
      ))}

      <Text style={styles.categoryHeader}>Social Media Add-ons (3 Agents)</Text>
      <Text style={styles.paragraph}><Text style={styles.paragraph}>Premium agents available with Pro and Elite tiers</Text></Text>
      {agents.socialMediaAddons.map((agent, i) => (
        <View key={i} style={styles.agentCard}>
          <Text style={styles.agentName}>{agent.name}</Text>
          <Text style={styles.agentDescription}>{agent.desc}</Text>
        </View>
      ))}

      <Text style={styles.categoryHeader}>Analytics & Reporting (4 Agents)</Text>
      {agents.analytics.map((agent, i) => (
        <View key={i} style={styles.agentCard}>
          <Text style={styles.agentName}>{agent.name}</Text>
          <Text style={styles.agentDescription}>{agent.desc}</Text>
        </View>
      ))}
    </Page>

    {/* Before vs After Comparison */}
    <Page size="A4" style={styles.page}>
      <Header title="Before vs After" />
      <Text style={styles.sectionTitle}>Before vs After Aura Intercept</Text>
      
      <Text style={styles.paragraph}>
        Use this comparison in sales decks and video content to show the transformation clearly.
      </Text>

      <View style={styles.comparisonRow}>
        <Text style={[styles.comparisonLabel, { fontWeight: 700 }]}>Metric</Text>
        <Text style={[styles.comparisonBefore, { fontWeight: 700 }]}>Before</Text>
        <Text style={[styles.comparisonAfter, { fontWeight: 700 }]}>After</Text>
      </View>
      
      {[
        { metric: 'Missed Calls Monthly', before: '150+', after: '0' },
        { metric: 'Call Answer Rate', before: '38%', after: '100%' },
        { metric: 'Average Response Time', before: '47 min', after: '< 5 sec' },
        { metric: 'No-Show Rate', before: '25%', after: '10%' },
        { metric: 'Admin Hours/Week', before: '25+', after: '5-10' },
        { metric: 'Online Reviews/Month', before: '2-3', after: '10-15' },
        { metric: 'After-Hours Bookings', before: '0', after: '30%' },
        { metric: 'Customer Satisfaction', before: '72%', after: '94%' },
        { metric: 'Quote Turnaround', before: '1-2 days', after: 'Instant' },
        { metric: 'Invoice Collection', before: '14 days', after: '3 days' },
        { metric: 'Technician Utilization', before: '65%', after: '85%' },
        { metric: 'Revenue per Tech', before: 'Baseline', after: '+30%' },
      ].map((row, i) => (
        <View key={i} style={styles.comparisonRow}>
          <Text style={styles.comparisonLabel}>{row.metric}</Text>
          <Text style={styles.comparisonBefore}>{row.before}</Text>
          <Text style={styles.comparisonAfter}>{row.after}</Text>
        </View>
      ))}

      <View style={styles.ctaBox}>
        <Text style={styles.ctaTitle}>Ready to Transform Your Business?</Text>
        <Text style={styles.ctaText}><Text style={styles.ctaText}>Start your 60-Day Live Trial today. No credit card required. The first 30 days are dedicated to onboarding, then 30 days of full live use.</Text></Text>
      </View>
    </Page>

    {/* Platform Features Showcase */}
    <Page size="A4" style={styles.page}>
      <Header title="Platform Features" />
      <Text style={styles.sectionTitle}>Platform Features Showcase</Text>
      
      <View style={styles.featureGrid}>
        <View style={styles.featureCard}>
          <Text style={styles.featureTitle}>🎙️ AI Voice Calls</Text>
          <Text style={styles.featureDesc}>
            Natural voice conversations 24/7. Custom voice cloning available. Handles inbound and outbound calls.
          </Text>
        </View>
        
        <View style={styles.featureCard}>
          <Text style={styles.featureTitle}>[CHAT] Multi-Channel Chat</Text>
          <Text style={styles.featureDesc}>
            Unified AI across SMS, email, and web chat. Same context, same intelligence, any channel.
          </Text>
        </View>
        
        <View style={styles.featureCard}>
          <Text style={styles.featureTitle}>[CALENDAR] Smart Scheduling</Text>
          <Text style={styles.featureDesc}>
            AI books appointments based on technician skills, location, and availability in real-time.
          </Text>
        </View>
        
        <View style={styles.featureCard}>
          <Text style={styles.featureTitle}>[LAUNCH] Intelligent Dispatch</Text>
          <Text style={styles.featureDesc}>
            Automated job assignment and route optimization. Maximizes technician productivity.
          </Text>
        </View>
        
        <View style={styles.featureCard}>
          <Text style={styles.featureTitle}>[MONEY] Payment Integration</Text>
          <Text style={styles.featureDesc}>
            One-click payment links via Stripe. Invoice-to-payment in minutes, not weeks.
          </Text>
        </View>
        
        <View style={styles.featureCard}>
          <Text style={styles.featureTitle}>[STAR] Review Automation</Text>
          <Text style={styles.featureDesc}>
            Automatic review requests after jobs. Drives reputation on Google, Yelp, Facebook.
          </Text>
        </View>
        
        <View style={styles.featureCard}>
          <Text style={styles.featureTitle}>[CHART] Real-Time Analytics</Text>
          <Text style={styles.featureDesc}>
            KPI dashboards, AI forecasting, and actionable insights. Make data-driven decisions.
          </Text>
        </View>
        
        <View style={styles.featureCard}>
          <Text style={styles.featureTitle}>[MOBILE] Technician App</Text>
          <Text style={styles.featureDesc}>
            Mobile-optimized for field use. Job queue, navigation, check-in, photo documentation.
          </Text>
        </View>
        
        <View style={styles.featureCard}>
          <Text style={styles.featureTitle}>Industry-Tuned</Text>
          <Text style={styles.featureDesc}>
            Pick your industry at signup and Aura auto-tunes prompts, widgets, and specialist agents for your trade.
          </Text>
        </View>
        
        <View style={styles.featureCard}>
          <Text style={styles.featureTitle}>Social Media AI</Text>
          <Text style={styles.featureDesc}>
            AI-generated content for 6 platforms. Scheduling, posting, and analytics included.
          </Text>
        </View>
      </View>
    </Page>

    {/* Target Industries */}
    <Page size="A4" style={styles.page}>
      <Header title="Target Industries" />
      <Text style={styles.sectionTitle}>Industries We Serve</Text>
      
      <Text style={styles.paragraph}>
        Aura Intercept is designed for appointment-based service businesses that dispatch 
        technicians or service professionals to customer locations.
      </Text>
      
      <View style={styles.featureGrid}>
        <View style={styles.featureCard}>
          <Text style={styles.featureTitle}>HVAC Services</Text>
          <Text style={styles.featureDesc}>
            Heating, cooling, ventilation. Average ticket: $250-$2,500. High urgency, perfect for AI.
          </Text>
        </View>
        
        <View style={styles.featureCard}>
          <Text style={styles.featureTitle}>Plumbing</Text>
          <Text style={styles.featureDesc}>
            Residential and commercial. Emergency-heavy. 24/7 AI coverage is a game-changer.
          </Text>
        </View>
        
        <View style={styles.featureCard}>
          <Text style={styles.featureTitle}>Electrical</Text>
          <Text style={styles.featureDesc}>
            Installation and repair. Complex scheduling needs. AI handles permits and inspections.
          </Text>
        </View>
        
        <View style={styles.featureCard}>
          <Text style={styles.featureTitle}>Appliance Repair</Text>
          <Text style={styles.featureDesc}>
            Multi-brand expertise. Parts inventory tracking.
          </Text>
        </View>
        
        <View style={styles.featureCard}>
          <Text style={styles.featureTitle}>Home Services</Text>
          <Text style={styles.featureDesc}>
            Handyman, cleaning, maintenance. High volume, lower ticket. AI scales efficiently.
          </Text>
        </View>
        
        <View style={styles.featureCard}>
          <Text style={styles.featureTitle}>Pest Control</Text>
          <Text style={styles.featureDesc}>
            Recurring service model. Perfect for automated scheduling and reminders.
          </Text>
        </View>
        
        <View style={styles.featureCard}>
          <Text style={styles.featureTitle}>Landscaping</Text>
          <Text style={styles.featureDesc}>
            Seasonal peaks and valleys. AI forecasting helps plan staffing and resources.
          </Text>
        </View>
        
        <View style={styles.featureCard}>
          <Text style={styles.featureTitle}>Pool and Spa</Text>
          <Text style={styles.featureDesc}>
            Maintenance schedules, equipment tracking. Route optimization for service routes.
          </Text>
        </View>
      </View>

      <Text style={styles.subsectionTitle}>Ideal Customer Profile</Text>
      <BulletPoint>5-50 employees (sweet spot: 10-25)</BulletPoint>
      <BulletPoint>$500K - $10M annual revenue</BulletPoint>
      <BulletPoint>Dispatch-based service model</BulletPoint>
      <BulletPoint>Currently using manual processes or basic software</BulletPoint>
      <BulletPoint>Experiencing growth but struggling with operations</BulletPoint>
    </Page>

    {/* Customer Success Stories */}
    <Page size="A4" style={styles.page}>
      <Header title="Customer Success Stories" />
      <Text style={styles.sectionTitle}>Customer Success Stories</Text>
      
      <Text style={styles.paragraph}>
        Use these testimonial templates for video production, social proof, and case studies.
      </Text>

      <View style={styles.testimonialBox}>
        <Text style={styles.testimonialQuote}>
          "We were missing 60% of our calls. Now we capture every single lead 24/7. In the first month, 
          we booked $47,000 in jobs that would have gone to competitors."
        </Text>
        <Text style={styles.testimonialAuthor}>— HVAC Company Owner, Texas</Text>
      </View>

      <View style={styles.testimonialBox}>
        <Text style={styles.testimonialQuote}>
          "My office manager was drowning in phone calls and scheduling. Aura Intercept handles it all now. 
          She focuses on customer relationships instead of administrative chaos."
        </Text>
        <Text style={styles.testimonialAuthor}>— Plumbing Business Owner, Florida</Text>
      </View>

      <View style={styles.testimonialBox}>
        <Text style={styles.testimonialQuote}>
          "Our no-show rate dropped from 28% to 8% in the first month. The automated reminders pay for 
          the entire platform many times over."
        </Text>
        <Text style={styles.testimonialAuthor}>— Electrical Services Manager, California</Text>
      </View>

      <View style={styles.testimonialBox}>
        <Text style={styles.testimonialQuote}>
          "I can finally take a vacation without my phone blowing up. The AI handles everything, and I 
          just check the dashboard once a day. Best investment I've ever made."
        </Text>
        <Text style={styles.testimonialAuthor}>— Appliance Repair Owner, Ohio</Text>
      </View>

      <Text style={styles.subsectionTitle}>Key Results to Highlight</Text>
      <BulletPoint>$47,000 in recovered leads (first month)</BulletPoint>
      <BulletPoint>60% → 0% missed call rate</BulletPoint>
      <BulletPoint>28% → 8% no-show rate reduction</BulletPoint>
      <BulletPoint>25+ hours saved weekly on admin tasks</BulletPoint>
      <BulletPoint>3x increase in online reviews</BulletPoint>
    </Page>

    {/* Pricing & ROI Calculator */}
    <Page size="A4" style={styles.page}>
      <Header title="Pricing & ROI" />
      <Text style={styles.sectionTitle}>Pricing & ROI Calculator</Text>
      
      <View style={styles.pricingCard}>
        <Text style={styles.pricingTier}>Aura Core</Text>
        <Text style={styles.pricingPrice}>$897/month</Text>
        <Text style={styles.pricingFeature}>- 8 Smart AI Agents + 3 Consoles</Text>
        <Text style={styles.pricingFeature}>- AI Receptionist, Booking, Follow-Up, Review</Text>
        <Text style={styles.pricingFeature}>- Creative Content, Web Presence, Lead, Marketing</Text>
        <Text style={styles.pricingFeature}>- 10 Employee Accounts</Text>
        <Text style={styles.pricingFeature}>- $249 one-time onboarding fee (due at start of 60-Day Live Trial; first 30 days = onboarding)</Text>
      </View>



      <View style={styles.pricingCard}>
        <Text style={styles.pricingTier}>Aura Boost</Text>
        <Text style={styles.pricingPrice}>$897/month</Text>
        <Text style={styles.pricingFeature}>- 12 Smart AI Agents + 5 Consoles</Text>
        <Text style={styles.pricingFeature}>- All Core agents + Dispatch, Route, ETA, Check-In</Text>
        <Text style={styles.pricingFeature}>- Field Operations & Social Media</Text>
        <Text style={styles.pricingFeature}>- 25 Employee Accounts</Text>
        <Text style={styles.pricingFeature}>- $449 one-time onboarding fee (due at start of 60-Day Live Trial; first 30 days = onboarding)</Text>
      </View>

      <View style={[styles.pricingCard, { borderWidth: 2, borderColor: colors.primary }]}>
        <Text style={styles.pricingTier}>Aura Pro (Growth)</Text>
        <Text style={styles.pricingPrice}>$1,797/month</Text>
        <Text style={styles.pricingFeature}>- 16 Smart AI Agents + 5 Consoles</Text>
        <Text style={styles.pricingFeature}>- All Boost agents + Campaign, Outreach, Social</Text>
        <Text style={styles.pricingFeature}>- Industry Specialist Agents (Diagnostic, Permit, Site Survey, Insurance Claim)</Text>
        <Text style={styles.pricingFeature}>- 50 Employee Accounts</Text>
        <Text style={styles.pricingFeature}>- $899 one-time onboarding fee (due at start of 60-Day Live Trial; first 30 days = onboarding)</Text>
      </View>

      <View style={styles.pricingCard}>
        <Text style={styles.pricingTier}>Aura Elite (Enterprise)</Text>
        <Text style={styles.pricingPrice}>$2,997/month</Text>
        <Text style={styles.pricingFeature}>- All 10 AI Operatives + 7 Consoles + AI Hub</Text>
        <Text style={styles.pricingFeature}>- Advanced Analytics & Revenue Forecasting</Text>
        <Text style={styles.pricingFeature}>- All Industry Specialists + AI Hub</Text>
        <Text style={styles.pricingFeature}>- Unlimited Employee Accounts</Text>
        <Text style={styles.pricingFeature}>- $1,549 one-time onboarding fee (due at start of 60-Day Live Trial; first 30 days = onboarding)</Text>
      </View>

      <Text style={styles.subsectionTitle}>ROI Quick Calculator</Text>
      <Text style={styles.paragraph}>
        Average service business with 10 missed calls/week × $300 avg job = $12,000/month in lost revenue.
        Aura Intercept captures 100% of these calls. Platform cost: $897. Net ROI: $11,503/month.
      </Text>
    </Page>

    {/* Competitive Advantages */}
    <Page size="A4" style={styles.page}>
      <Header title="Competitive Advantages" />
      <Text style={styles.sectionTitle}>Why Aura Intercept Wins</Text>
      
      <Text style={styles.subsectionTitle}>vs. Generic CRMs (ServiceTitan, Housecall Pro)</Text>
      <BulletPoint>10 AI Operatives vs. basic automation rules</BulletPoint>
      <BulletPoint>True 24/7 AI voice answering vs. voicemail or expensive call centers</BulletPoint>
      <BulletPoint>Intelligent agent handoffs vs. siloed features</BulletPoint>
      <BulletPoint>Social media automation included vs. extra integrations needed</BulletPoint>

      <Text style={styles.subsectionTitle}>vs. Answering Services (Ruby, AnswerConnect)</Text>
      <BulletPoint>$897-$2,997/mo flat vs. $500-$2,000+/mo for limited minutes</BulletPoint>
      <BulletPoint>Unlimited calls vs. per-minute pricing</BulletPoint>
      <BulletPoint>Books appointments directly vs. just takes messages</BulletPoint>
      <BulletPoint>Full business automation vs. phone only</BulletPoint>

      <Text style={styles.subsectionTitle}>vs. Chatbots (Drift, Intercom)</Text>
      <BulletPoint>Voice + SMS + Email + Chat vs. chat only</BulletPoint>
      <BulletPoint>Service business specialized vs. generic SaaS focus</BulletPoint>
      <BulletPoint>Dispatch and field ops included vs. marketing only</BulletPoint>

      <Text style={styles.subsectionTitle}>Unique Selling Points</Text>
      <View style={styles.highlightBox}>
        <Text style={styles.highlightTitle}>Only Platform With:</Text>
        <Text style={styles.highlightText}>
          - 10 AI Operatives organized as 10 Operatives that work together{"\n"}
          - True voice AI (not just IVR or voicemail){"\n"}
          - Full social media content creation (6 platforms){"\n"}
          - 22 industry packs covering trades, outdoor, repair, and booking-first verticals that auto-tune the platform on signup.{"\n"}
          - Built specifically for service businesses{"\n"}
          - Customer holds own accounts at SignalWire, ElevenLabs, Resend, Tavily, and Stripe (billed directly by each provider, separate from the Aura plan fee)
        </Text>
      </View>
    </Page>

    {/* Sales Talking Points */}
    <Page size="A4" style={styles.page}>
      <Header title="Sales Talking Points" />
      <Text style={styles.sectionTitle}>Sales Talking Points</Text>
      
      <Text style={styles.subsectionTitle}>Discovery Questions</Text>
      <BulletPoint>"How many calls do you think you miss each week?"</BulletPoint>
      <BulletPoint>"What happens to leads that come in after hours?"</BulletPoint>
      <BulletPoint>"How much time does your team spend on scheduling and reminders?"</BulletPoint>
      <BulletPoint>"What's your current no-show rate?"</BulletPoint>
      <BulletPoint>"How many online reviews did you get last month?"</BulletPoint>

      <Text style={styles.subsectionTitle}>Pain Point Responses</Text>
      <View style={styles.agentCard}>
        <Text style={styles.agentName}>"We're too busy to answer every call"</Text>
        <Text style={styles.agentDescription}>
          "Our AI Receptionist answers every call instantly, 24/7. It's like having a receptionist 
          that never sleeps, never takes breaks, and costs less than $20/day."
        </Text>
      </View>

      <View style={styles.agentCard}>
        <Text style={styles.agentName}>"We already have a CRM"</Text>
        <Text style={styles.agentDescription}>
          "Great! We're not replacing your CRM - we're adding a 24/7 AI workforce on top. 
          Most CRMs help you track data. We actually do the work."
        </Text>
      </View>

      <View style={styles.agentCard}>
        <Text style={styles.agentName}>"Sounds expensive"</Text>
        <Text style={styles.agentDescription}>
          "Let's do the math together. If you miss just 5 calls per week at $300 average job, 
          that's $6,000/month in lost revenue. Aura Core starts at $249/month — and there's a 60-Day Live Trial with no credit card required (first 30 days are dedicated to onboarding, then 30 days of full live use)."
        </Text>
      </View>

      <View style={styles.agentCard}>
        <Text style={styles.agentName}>"Will customers know it's AI?"</Text>
        <Text style={styles.agentDescription}>
          "We use advanced voice synthesis that sounds completely natural. Many customers prefer 
          the instant response over waiting on hold. And it's always trained on your business."
        </Text>
      </View>

      <Text style={styles.subsectionTitle}>Closing Phrases</Text>
      <BulletPoint>"Let's start your 60-Day Live Trial today—no credit card required. First 30 days = onboarding, then 30 days of full live use."</BulletPoint>
      <BulletPoint>"What would it mean for your business to never miss another call?"</BulletPoint>
      <BulletPoint>"Every day without Aura is another day of missed opportunities."</BulletPoint>
    </Page>

    {/* Video Script Ideas */}
    <Page size="A4" style={styles.page}>
      <Header title="Video Script Ideas" />
      <Text style={styles.sectionTitle}>Video Script Ideas</Text>
      
      <View style={styles.agentCard}>
        <Text style={styles.agentName}>[VIDEO] "The Missed Call Cost" (30 seconds)</Text>
        <Text style={styles.agentDescription}>
          Hook: "Every missed call costs your business $300-$500."{"\n"}
          Problem: Show phone ringing, going to voicemail, competitor getting the job.{"\n"}
          Solution: Aura AI answers instantly, books appointment, sends confirmation.{"\n"}
          CTA: "Never miss a lead again. Start your 60-Day Live Trial at AuraIntercept.com"
        </Text>
      </View>

      <View style={styles.agentCard}>
        <Text style={styles.agentName}>[VIDEO] "Day in the Life" (60 seconds)</Text>
        <Text style={styles.agentDescription}>
          Follow a business owner through a typical day.{"\n"}
          Show Aura handling: morning calls, scheduling, dispatch, reminders, reviews.{"\n"}
          Owner checks dashboard, sees everything running smoothly.{"\n"}
          "19 AI agents. Zero stress. All day, every day."
        </Text>
      </View>

      <View style={styles.agentCard}>
        <Text style={styles.agentName}>[VIDEO] "Before and After" (45 seconds)</Text>
        <Text style={styles.agentDescription}>
          Split screen comparison.{"\n"}
          Before: Chaos, missed calls, stressed staff, unhappy customers.{"\n"}
          After: Calm, every call answered, smooth operations, 5-star reviews.{"\n"}
          "Same business. Different results. That's the Aura effect."
        </Text>
      </View>

      <View style={styles.agentCard}>
        <Text style={styles.agentName}>[VIDEO] "Customer Testimonial" (90 seconds)</Text>
        <Text style={styles.agentDescription}>
          Real customer shares their transformation story.{"\n"}
          Key moments: "We were missing 60% of calls..." "Now we capture every lead..."{"\n"}
          Show actual results: revenue increase, time savings, review growth.{"\n"}
          End with their recommendation.
        </Text>
      </View>

      <Text style={styles.subsectionTitle}>Key Visual Elements</Text>
      <BulletPoint>Dashboard screenshots showing real metrics</BulletPoint>
      <BulletPoint>Phone ringing → AI answering animation</BulletPoint>
      <BulletPoint>Before/after statistics with animated numbers</BulletPoint>
      <BulletPoint>Happy customer reactions and 5-star reviews</BulletPoint>
    </Page>

    {/* Social Media Content Ideas */}
    <Page size="A4" style={styles.page}>
      <Header title="Social Media Content" />
      <Text style={styles.sectionTitle}>Social Media Content Ideas</Text>
      
      <Text style={styles.subsectionTitle}>Instagram/TikTok Hooks</Text>
      <BulletPoint>"POV: You never miss another customer call"</BulletPoint>
      <BulletPoint>"This AI just saved my HVAC business $47,000"</BulletPoint>
      <BulletPoint>"Stop losing leads to voicemail. Watch this."</BulletPoint>
      <BulletPoint>"What if your business ran itself 24/7?"</BulletPoint>
      <BulletPoint>"The #1 reason service businesses fail (and how to fix it)"</BulletPoint>

      <Text style={styles.subsectionTitle}>LinkedIn Posts</Text>
      <View style={styles.agentCard}>
        <Text style={styles.agentName}>Thought Leadership</Text>
        <Text style={styles.agentDescription}>
          "The average service business misses 62% of incoming calls. At $300 per job, that's 
          $10,000+ in monthly lost revenue. Here's how AI is changing that..."
        </Text>
      </View>

      <Text style={styles.subsectionTitle}>Facebook Ad Copy</Text>
      <View style={styles.agentCard}>
        <Text style={styles.agentName}>Pain Point Ad</Text>
        <Text style={styles.agentDescription}>
          "Still missing customer calls?{"\n\n"}
          Your competitors aren't.{"\n\n"}
          Aura Intercept answers every call 24/7, books appointments instantly, and sends 
          automatic reminders. 19 AI agents working for you around the clock.{"\n\n"}
          Free 60-day trial (first 30 days = onboarding). No credit card. Start now"
        </Text>
      </View>

      <Text style={styles.subsectionTitle}>Carousel Post Ideas</Text>
      <BulletPoint>Slide 1: "19 AI Agents for Your Service Business"</BulletPoint>
      <BulletPoint>Slide 2-7: One agent per slide with icon and benefit</BulletPoint>
      <BulletPoint>Slide 8: "All working together 24/7"</BulletPoint>
      <BulletPoint>Slide 9: CTA with 60-Day Live Trial offer</BulletPoint>

      <Text style={styles.subsectionTitle}>Hashtags</Text>
      <Text style={styles.paragraph}>
        #ServiceBusiness #HVAC #Plumbing #Electrical #SmallBusiness #BusinessAutomation 
        #AIforBusiness #FieldService #ServiceTech #BusinessGrowth #CustomerService
      </Text>
    </Page>

    {/* Graphic Design Data Points */}
    <Page size="A4" style={styles.page}>
      <Header title="Graphic Design Data" />
      <Text style={styles.sectionTitle}>Graphic Design Data Points</Text>
      
      <Text style={styles.paragraph}>
        Use these statistics and visual concepts for infographics, social graphics, and presentations.
      </Text>

      <Text style={styles.subsectionTitle}>Key Numbers for Graphics</Text>
      <View style={styles.heroStatGrid}>
        <View style={styles.heroStatCard}>
          <Text style={styles.heroStatNumber}>23</Text>
          <Text style={styles.heroStatLabel}>AI Operatives</Text>
        </View>
        <View style={styles.heroStatCard}>
          <Text style={styles.heroStatNumber}>7</Text>
          <Text style={styles.heroStatLabel}>Consoles</Text>
        </View>
        <View style={styles.heroStatCard}>
          <Text style={styles.heroStatNumber}>24/7</Text>
          <Text style={styles.heroStatLabel}>Always On</Text>
        </View>
        <View style={styles.heroStatCard}>
          <Text style={styles.heroStatNumber}>100%</Text>
          <Text style={styles.heroStatLabel}>Calls Answered</Text>
        </View>
        <View style={styles.heroStatCard}>
          <Text style={styles.heroStatNumber}>40%</Text>
          <Text style={styles.heroStatLabel}>Fewer No-Shows</Text>
        </View>
        <View style={styles.heroStatCard}>
          <Text style={styles.heroStatNumber}>10+</Text>
          <Text style={styles.heroStatLabel}>Hours Saved</Text>
        </View>
      </View>

      <Text style={styles.subsectionTitle}>Infographic Concepts</Text>
      <BulletPoint>"The Customer Journey with Aura" - flowchart showing AI touchpoints</BulletPoint>
      <BulletPoint>"24 Agents, 1 Platform" - visual agent ecosystem</BulletPoint>
      <BulletPoint>"Before vs After" - side-by-side metrics comparison</BulletPoint>
      <BulletPoint>"ROI Calculator" - interactive or static infographic</BulletPoint>
      <BulletPoint>"Industry Applications" - icons for each vertical</BulletPoint>

      <Text style={styles.subsectionTitle}>Color Palette</Text>
      <BulletPoint>Primary: Indigo (#6366f1) - Trust, technology, intelligence</BulletPoint>
      <BulletPoint>Secondary: Purple (#8b5cf6) - Innovation, premium</BulletPoint>
      <BulletPoint>Accent: Cyan (#06b6d4) - Energy, action, modern</BulletPoint>
      <BulletPoint>Success: Emerald (#10b981) - Growth, positive results</BulletPoint>
      <BulletPoint>Dark: Deep Indigo (#1e1b4b) - Professional, sophisticated</BulletPoint>

      <Text style={styles.subsectionTitle}>Visual Elements to Create</Text>
      <BulletPoint>Agent icons for each of the 19 AI agents</BulletPoint>
      <BulletPoint>Console screenshots (anonymized demo data)</BulletPoint>
      <BulletPoint>Comparison tables (Before/After)</BulletPoint>
      <BulletPoint>Customer journey maps</BulletPoint>
      <BulletPoint>ROI calculator visualizations</BulletPoint>
      <BulletPoint>Feature highlight cards</BulletPoint>
    </Page>

    {/* Final CTA Page */}
    <Page size="A4" style={styles.coverPage}>
      <Text style={styles.coverTitle}>Ready to Transform Your Business?</Text>
      <Text style={styles.coverSubtitle}>19 AI Agents Working 24/7 For You</Text>
      
      <View style={styles.coverStats}>
        <View style={styles.coverStat}>
          <Text style={styles.coverStatNumber}>$0</Text>
          <Text style={styles.coverStatLabel}>To Start</Text>
        </View>
        <View style={styles.coverStat}>
          <Text style={styles.coverStatNumber}>90</Text>
          <Text style={styles.coverStatLabel}>Day Live Trial</Text>
        </View>
        <View style={styles.coverStat}>
          <Text style={styles.coverStatNumber}>0</Text>
          <Text style={styles.coverStatLabel}>Credit Card Required</Text>
        </View>
      </View>
      
      <View style={{ marginTop: 60 }}>
        <Text style={{ fontSize: 18, textAlign: 'center', color: colors.accent, fontWeight: 700 }}>
          www.AuraIntercept.com
        </Text>
        <Text style={{ fontSize: 12, textAlign: 'center', color: '#a5b4fc', marginTop: 16 }}>
          Contact: sales@auraintercept.com
        </Text>
        <Text style={{ fontSize: 10, textAlign: 'center', color: '#a5b4fc', marginTop: 8 }}>
          "Your Business. Always On. Always Growing."
        </Text>
      </View>
    </Page>
  </Document>
);

export default PlatformDocumentPDF;
