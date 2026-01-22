import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
} from '@react-pdf/renderer';

const colors = {
  primary: '#214ebb',
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
    fontSize: 16,
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
  // Table styles
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
  // Pricing cards
  pricingCard: {
    backgroundColor: colors.lightGray,
    padding: 16,
    marginBottom: 12,
    borderRadius: 4,
    borderLeftWidth: 4,
    borderLeftColor: colors.primary,
  },
  pricingCardHighlight: {
    backgroundColor: colors.lightGray,
    padding: 16,
    marginBottom: 12,
    borderRadius: 4,
    borderLeftWidth: 4,
    borderLeftColor: colors.accent,
    borderWidth: 2,
    borderColor: colors.accent,
  },
  pricingTierName: {
    fontSize: 16,
    fontWeight: 700,
    color: colors.dark,
    marginBottom: 4,
  },
  pricingPrice: {
    fontSize: 24,
    fontWeight: 700,
    color: colors.primary,
    marginBottom: 2,
  },
  pricingAnnual: {
    fontSize: 10,
    color: colors.gray,
    marginBottom: 8,
  },
  pricingSavings: {
    fontSize: 10,
    color: colors.green,
    fontWeight: 600,
    marginBottom: 12,
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
  // Notice boxes
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
    backgroundColor: colors.greenLight,
    padding: 12,
    marginVertical: 12,
    borderRadius: 4,
    borderLeftWidth: 4,
    borderLeftColor: colors.green,
  },
  // TOC styles
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
  // Bullet points
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
  // Summary grid
  summaryGrid: {
    flexDirection: 'row',
    gap: 12,
    marginVertical: 12,
  },
  summaryCard: {
    flex: 1,
    backgroundColor: colors.lightGray,
    padding: 12,
    borderRadius: 4,
    alignItems: 'center',
  },
  summaryPrice: {
    fontSize: 18,
    fontWeight: 700,
    color: colors.primary,
    marginBottom: 4,
  },
  summaryLabel: {
    fontSize: 10,
    color: colors.gray,
    textAlign: 'center',
  },
  // Two-column layout
  twoColumn: {
    flexDirection: 'row',
    gap: 16,
    marginVertical: 12,
  },
  column: {
    flex: 1,
  },
  columnCard: {
    backgroundColor: colors.lightGray,
    padding: 12,
    borderRadius: 4,
  },
  columnTitle: {
    fontSize: 12,
    fontWeight: 700,
    color: colors.dark,
    marginBottom: 8,
  },
});

// Subscription tier data
const SUBSCRIPTION_TIERS = {
  singlePoint: {
    name: 'Single-Point',
    monthlyPrice: 497,
    annualPrice: 4970,
    annualSavings: 994,
    agents: ['AI Receptionist (Triage)', 'Follow-up Agent', 'Review Agent'],
    consoles: ['Customer Portal Console'],
    appointments: 'Unlimited',
    reminders: 'Email + SMS + Voice',
    employees: '5 included',
    additionalEmployees: '$25/mo per 10 employees',
    bestFor: 'Small service companies getting started with AI automation. Includes AI Voice. Saves 10+ hours/week in lead intake.',
    voiceIncluded: true,
  },
  multiTrack: {
    name: 'Multi-Track',
    monthlyPrice: 897,
    annualPrice: 8970,
    annualSavings: 1794,
    agents: ['AI Receptionist (Triage)', 'Scheduling Agent (Booking)', 'Follow-up Agent', 'Review Agent', 'Dispatch Agent', 'Route Agent', 'ETA Agent', 'Check-in Agent', 'Quoting Agent', 'Invoice Agent'],
    consoles: ['Customer Portal Console', 'Field Operations Console'],
    appointments: 'Unlimited',
    reminders: 'Email + SMS + Voice',
    employees: '10 included',
    additionalEmployees: '$25/mo per 10 employees',
    bestFor: 'Growing companies with field technicians needing dispatch automation and online booking.',
    voiceIncluded: true,
  },
  command: {
    name: 'Command',
    monthlyPrice: 1497,
    annualPrice: 14970,
    annualSavings: 2994,
    agents: 'All 19 AI Agents',
    consoles: 'All 5 Control Centers',
    appointments: 'Unlimited',
    reminders: 'Email + SMS + Voice',
    employees: 'Unlimited',
    additionalEmployees: 'N/A',
    bestFor: 'Large service companies requiring full AI automation, voice capabilities, and total brand control.',
    voiceIncluded: true,
  },
};

const THIRD_PARTY_INTEGRATIONS = [
  { name: 'Twilio', purpose: 'SMS & Voice Calls', cost: '$1.15/number + ~$30-100/mo usage', required: 'Multi-Track & Command' },
  { name: 'ElevenLabs', purpose: 'AI Voice Synthesis', cost: '$0-99+/month based on usage', required: 'Command (Voice)' },
  { name: 'Resend', purpose: 'Email Notifications', cost: '$0-20+/month based on volume', required: 'All Tiers' },
  { name: 'Google Calendar', purpose: 'Calendar Sync', cost: 'Free', required: 'All Tiers (Optional)' },
  { name: 'Stripe (Company)', purpose: 'Invoice Payments', cost: '2.9% + $0.30/transaction', required: 'All Tiers' },
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

const FeatureItem = ({ children }: { children: string }) => (
  <View style={styles.featureItem}>
    <Text style={styles.featureCheck}>✓</Text>
    <Text style={styles.featureText}>{children}</Text>
  </View>
);

const PricingSummaryPDF = () => (
  <Document>
    {/* Cover Page */}
    <Page size="A4" style={styles.coverPage}>
      <Text style={styles.coverBrand}>AURA INTERCEPT</Text>
      <Text style={styles.coverTitle}>Subscription Pricing Guide</Text>
      <Text style={styles.coverSubtitle}>Complete Pricing Breakdown for AI-Powered Service Business Platform</Text>
      <View style={styles.coverStats}>
        <View style={styles.coverStat}>
          <Text style={styles.coverStatNumber}>3</Text>
          <Text style={styles.coverStatLabel}>Pricing Tiers</Text>
        </View>
        <View style={styles.coverStat}>
          <Text style={styles.coverStatNumber}>19</Text>
          <Text style={styles.coverStatLabel}>AI Agents</Text>
        </View>
        <View style={styles.coverStat}>
          <Text style={styles.coverStatNumber}>5</Text>
          <Text style={styles.coverStatLabel}>Control Centers</Text>
        </View>
        <View style={styles.coverStat}>
          <Text style={styles.coverStatNumber}>$497</Text>
          <Text style={styles.coverStatLabel}>Starting Price</Text>
        </View>
      </View>
      <View style={styles.footer}>
        <Text>Aura Intercept - AI-Powered Service Platform</Text>
        <Text>Generated: {new Date().toLocaleDateString()}</Text>
      </View>
    </Page>

    {/* Table of Contents */}
    <Page size="A4" style={styles.page}>
      <Header title="Aura Intercept - Pricing Guide" />
      <Text style={styles.sectionTitle}>Table of Contents</Text>
      
      <View style={{ marginTop: 20 }}>
        {[
          { title: 'Executive Pricing Summary', page: '3' },
          { title: 'Tier Comparison Table', page: '4' },
          { title: 'Single-Point Tier Details', page: '5' },
          { title: 'Multi-Track Tier Details', page: '6' },
          { title: 'Command Tier Details', page: '7' },
          { title: 'Annual Discount Savings', page: '8' },
          { title: '3rd Party Integration Requirements', page: '9' },
          { title: 'Billing Clarifications', page: '10' },
          { title: 'Total Cost Examples', page: '11' },
        ].map((item, i) => (
          <View key={i} style={styles.tocItem}>
            <Text style={styles.tocTitle}>{item.title}</Text>
            <Text style={styles.tocPage}>{item.page}</Text>
          </View>
        ))}
      </View>

      <View style={styles.footer}>
        <Text>Aura Intercept - AI-Powered Service Platform</Text>
        <Text render={({ pageNumber }) => `Page ${pageNumber}`} />
      </View>
    </Page>

    {/* Executive Pricing Summary */}
    <Page size="A4" style={styles.page}>
      <Header title="Aura Intercept - Pricing Guide" />
      <Text style={styles.sectionTitle}>Executive Pricing Summary</Text>
      
      <Text style={styles.paragraph}>
        Aura Intercept offers three subscription tiers designed to scale with your business needs. 
        All tiers include access to our AI-powered platform with varying levels of agents, consoles, 
        and features. Save 16% with annual billing.
      </Text>

      <View style={styles.summaryGrid}>
        <View style={styles.summaryCard}>
          <Text style={{ fontSize: 12, fontWeight: 700, marginBottom: 8 }}>SINGLE-POINT</Text>
          <Text style={styles.summaryPrice}>$497</Text>
          <Text style={styles.summaryLabel}>per month</Text>
          <Text style={{ fontSize: 9, color: colors.green, marginTop: 4 }}>$4,970/year (Save ~$1,000)</Text>
        </View>
        <View style={[styles.summaryCard, { borderWidth: 2, borderColor: colors.accent }]}>
          <Text style={{ fontSize: 12, fontWeight: 700, marginBottom: 8, color: colors.accent }}>MULTI-TRACK</Text>
          <Text style={styles.summaryPrice}>$897</Text>
          <Text style={styles.summaryLabel}>per month</Text>
          <Text style={{ fontSize: 9, color: colors.green, marginTop: 4 }}>$8,970/year (Save ~$1,800)</Text>
        </View>
        <View style={styles.summaryCard}>
          <Text style={{ fontSize: 12, fontWeight: 700, marginBottom: 8 }}>COMMAND</Text>
          <Text style={styles.summaryPrice}>$1,497</Text>
          <Text style={styles.summaryLabel}>per month</Text>
          <Text style={{ fontSize: 9, color: colors.green, marginTop: 4 }}>$14,970/year (Save ~$3,000)</Text>
        </View>
      </View>

      <Text style={styles.subsectionTitle}>Quick Feature Highlights</Text>
      
      <View style={styles.table}>
        <View style={styles.tableHeader}>
          <Text style={[styles.tableHeaderCell, { flex: 2 }]}>Feature</Text>
          <Text style={[styles.tableHeaderCell, { flex: 1 }]}>Single-Point</Text>
          <Text style={[styles.tableHeaderCell, { flex: 1 }]}>Multi-Track</Text>
          <Text style={[styles.tableHeaderCell, { flex: 1 }]}>Command</Text>
        </View>
        {[
          { feature: 'AI Agents', singlePoint: '3', multiTrack: '10', command: '19' },
          { feature: 'Control Centers', singlePoint: '1', multiTrack: '2', command: '5' },
          { feature: 'Appointments/Month', singlePoint: 'Unlimited', multiTrack: 'Unlimited', command: 'Unlimited' },
          { feature: 'Reminder Channels', singlePoint: 'Email + SMS + Voice', multiTrack: 'Email + SMS + Voice', command: 'Email + SMS + Voice' },
          { feature: 'AI Voice (Chat + Calls)', singlePoint: '✓', multiTrack: '✓', command: '✓' },
          { feature: 'Online Booking', singlePoint: '—', multiTrack: '✓', command: '✓' },
          { feature: 'Employee Accounts', singlePoint: '5', multiTrack: '10', command: 'Unlimited' },
        ].map((row, i) => (
          <View key={i} style={i % 2 === 0 ? styles.tableRow : styles.tableRowAlt}>
            <Text style={[styles.tableCellLeft, { flex: 2, fontWeight: 600 }]}>{row.feature}</Text>
            <Text style={[styles.tableCell, { flex: 1 }]}>{row.singlePoint}</Text>
            <Text style={[styles.tableCell, { flex: 1 }]}>{row.multiTrack}</Text>
            <Text style={[styles.tableCell, { flex: 1 }]}>{row.command}</Text>
          </View>
        ))}
      </View>

      <View style={styles.infoBox}>
        <Text style={styles.noticeTitle}>Additional Employee Pricing</Text>
        <Text style={styles.noticeText}>
          Single-Point and Multi-Track tiers can add additional employee accounts at $25/month per 10 employees. 
          Command tier includes unlimited employee accounts at no additional cost.
        </Text>
      </View>

      <View style={styles.footer}>
        <Text>Aura Intercept - AI-Powered Service Platform</Text>
        <Text render={({ pageNumber }) => `Page ${pageNumber}`} />
      </View>
    </Page>

    {/* Tier Comparison Table */}
    <Page size="A4" style={styles.page}>
      <Header title="Aura Intercept - Pricing Guide" />
      <Text style={styles.sectionTitle}>Complete Tier Comparison</Text>

      <View style={styles.table}>
        <View style={styles.tableHeader}>
          <Text style={[styles.tableHeaderCell, { flex: 2.5 }]}>Feature Category</Text>
          <Text style={[styles.tableHeaderCell, { flex: 1.5 }]}>Single-Point</Text>
          <Text style={[styles.tableHeaderCell, { flex: 1.5 }]}>Multi-Track</Text>
          <Text style={[styles.tableHeaderCell, { flex: 1.5 }]}>Command</Text>
        </View>
        {[
          { category: 'Monthly Price', singlePoint: '$497', multiTrack: '$897', command: '$1,497' },
          { category: 'Annual Price', singlePoint: '$4,970', multiTrack: '$8,970', command: '$14,970' },
          { category: 'Annual Savings', singlePoint: '~$1,000', multiTrack: '~$1,800', command: '~$3,000' },
          { category: '', singlePoint: '', multiTrack: '', command: '' },
          { category: 'AI Agents Included', singlePoint: '3', multiTrack: '10', command: 'All 19' },
          { category: 'Control Centers', singlePoint: '1', multiTrack: '2', command: 'All 5' },
          { category: 'Appointments/Month', singlePoint: 'Unlimited', multiTrack: 'Unlimited', command: 'Unlimited' },
          { category: '', singlePoint: '', multiTrack: '', command: '' },
          { category: 'Email Reminders', singlePoint: '✓', multiTrack: '✓', command: '✓' },
          { category: 'SMS Reminders', singlePoint: '✓', multiTrack: '✓', command: '✓' },
          { category: 'Voice Reminders', singlePoint: '✓', multiTrack: '✓', command: '✓' },
          { category: 'AI Voice (Chat + Calls)', singlePoint: '✓', multiTrack: '✓', command: '✓' },
          { category: 'Online Booking Agent', singlePoint: '—', multiTrack: '✓', command: '✓' },
          { category: '', singlePoint: '', multiTrack: '', command: '' },
          { category: 'Employee Accounts', singlePoint: '5', multiTrack: '10', command: 'Unlimited' },
          { category: 'Additional Employees', singlePoint: '$25/mo per 10', multiTrack: '$25/mo per 10', command: 'Included' },
          { category: 'Widget Access', singlePoint: '✓', multiTrack: '✓', command: '✓' },
          { category: '', singlePoint: '', multiTrack: '', command: '' },
          { category: 'Customer Portal', singlePoint: '✓', multiTrack: '✓', command: '✓' },
          { category: 'Field Operations', singlePoint: '—', multiTrack: '✓', command: '✓' },
          { category: 'Business Management', singlePoint: '—', multiTrack: '—', command: '✓' },
          { category: 'Marketing & Sales', singlePoint: '—', multiTrack: '—', command: '✓' },
          { category: 'Analytics Console', singlePoint: '—', multiTrack: '—', command: '✓' },
        ].map((row, i) => (
          <View key={i} style={row.category === '' ? { height: 8 } : (i % 2 === 0 ? styles.tableRow : styles.tableRowAlt)}>
            {row.category !== '' && (
              <>
                <Text style={[styles.tableCellLeft, { flex: 2.5, fontWeight: row.category.includes('Price') || row.category.includes('Savings') ? 700 : 400 }]}>{row.category}</Text>
                <Text style={[styles.tableCell, { flex: 1.5 }]}>{row.singlePoint}</Text>
                <Text style={[styles.tableCell, { flex: 1.5 }]}>{row.multiTrack}</Text>
                <Text style={[styles.tableCell, { flex: 1.5 }]}>{row.command}</Text>
              </>
            )}
          </View>
        ))}
      </View>

      <View style={styles.footer}>
        <Text>Aura Intercept - AI-Powered Service Platform</Text>
        <Text render={({ pageNumber }) => `Page ${pageNumber}`} />
      </View>
    </Page>

    {/* Single-Point Tier Details */}
    <Page size="A4" style={styles.page}>
      <Header title="Aura Intercept - Pricing Guide" />
      <Text style={styles.sectionTitle}>Single-Point Tier</Text>

      <View style={styles.pricingCard}>
        <Text style={styles.pricingTierName}>Single-Point</Text>
        <Text style={styles.pricingPrice}>$497/month</Text>
        <Text style={styles.pricingAnnual}>or $4,970/year (billed annually)</Text>
        <Text style={styles.pricingSavings}>Save ~$1,000 with annual billing</Text>
        
        <Text style={{ fontSize: 10, fontWeight: 600, marginBottom: 8 }}>Best For:</Text>
        <Text style={{ fontSize: 9, color: colors.gray, marginBottom: 12 }}>
          {SUBSCRIPTION_TIERS.singlePoint.bestFor}
        </Text>
      </View>

      <Text style={styles.subsectionTitle}>Included AI Agents (3)</Text>
      <View style={styles.featureList}>
        <FeatureItem>AI Receptionist (Triage) - First point of contact, routes customers to right agent</FeatureItem>
        <FeatureItem>Follow-up Agent - Automated reminders and confirmations via email, SMS, and voice</FeatureItem>
        <FeatureItem>Review Agent - Customer feedback collection for Google, Yelp, Facebook</FeatureItem>
      </View>

      <Text style={styles.subsectionTitle}>Control Centers (1)</Text>
      <View style={styles.featureList}>
        <FeatureItem>Customer Portal Console - Self-service appointment management</FeatureItem>
      </View>

      <Text style={styles.subsectionTitle}>Platform Features</Text>
      <View style={styles.featureList}>
        <FeatureItem>Unlimited appointments</FeatureItem>
        <FeatureItem>Email + SMS + Voice reminders</FeatureItem>
        <FeatureItem>AI Voice Chat and Outbound Calling (requires Twilio + ElevenLabs)</FeatureItem>
        <FeatureItem>5 employees included ($25/month per 10 additional)</FeatureItem>
        <FeatureItem>Embeddable chat widget</FeatureItem>
        <FeatureItem>1-Page Smart Website Included</FeatureItem>
      </View>

      <Text style={styles.subsectionTitle}>Key Benefits</Text>
      <View style={styles.featureList}>
        <FeatureItem>24/7 AI-powered chat and voice for customer inquiries</FeatureItem>
        <FeatureItem>Call-to-book via AI Voice (online booking requires Multi-Track)</FeatureItem>
        <FeatureItem>Multi-channel appointment reminders</FeatureItem>
        <FeatureItem>Customer self-service portal</FeatureItem>
        <FeatureItem>Saves 10+ hours/week in lead intake</FeatureItem>
      </View>

      <View style={styles.footer}>
        <Text>Aura Intercept - AI-Powered Service Platform</Text>
        <Text render={({ pageNumber }) => `Page ${pageNumber}`} />
      </View>
    </Page>

    {/* Multi-Track Tier Details */}
    <Page size="A4" style={styles.page}>
      <Header title="Aura Intercept - Pricing Guide" />
      <Text style={styles.sectionTitle}>Multi-Track Tier</Text>

      <View style={styles.pricingCardHighlight}>
        <Text style={{ fontSize: 9, color: colors.accent, fontWeight: 700, marginBottom: 4 }}>MOST POPULAR</Text>
        <Text style={styles.pricingTierName}>Multi-Track</Text>
        <Text style={styles.pricingPrice}>$897/month</Text>
        <Text style={styles.pricingAnnual}>or $8,970/year (billed annually)</Text>
        <Text style={styles.pricingSavings}>Save ~$1,800 with annual billing</Text>
        
        <Text style={{ fontSize: 10, fontWeight: 600, marginBottom: 8 }}>Best For:</Text>
        <Text style={{ fontSize: 9, color: colors.gray, marginBottom: 12 }}>
          {SUBSCRIPTION_TIERS.multiTrack.bestFor}
        </Text>
      </View>

      <Text style={styles.subsectionTitle}>Included AI Agents (10)</Text>
      <View style={styles.featureList}>
        <FeatureItem>AI Receptionist (Triage) - First point of contact and routing</FeatureItem>
        <FeatureItem>Scheduling Agent (Booking) - Natural language appointment booking</FeatureItem>
        <FeatureItem>Follow-up Agent - Automated reminders and confirmations</FeatureItem>
        <FeatureItem>Review Agent - Customer feedback collection</FeatureItem>
        <FeatureItem>Dispatch Agent - Smart job assignment based on skills and location</FeatureItem>
        <FeatureItem>Route Agent - Real-time route optimization for technicians</FeatureItem>
        <FeatureItem>ETA Agent - Arrival time predictions with customer notifications</FeatureItem>
        <FeatureItem>Check-in Agent - Job status tracking with photo documentation</FeatureItem>
        <FeatureItem>Quoting Agent - Instant quote generation from service catalog</FeatureItem>
        <FeatureItem>Invoice Agent - Automated invoice creation and payment tracking</FeatureItem>
      </View>

      <Text style={styles.subsectionTitle}>Control Centers (2)</Text>
      <View style={styles.featureList}>
        <FeatureItem>Customer Portal Console - Self-service booking and management</FeatureItem>
        <FeatureItem>Field Operations Console - Dispatch, routing, and technician management</FeatureItem>
      </View>

      <Text style={styles.subsectionTitle}>Platform Features</Text>
      <View style={styles.featureList}>
        <FeatureItem>Unlimited appointments</FeatureItem>
        <FeatureItem>Email + SMS reminders</FeatureItem>
        <FeatureItem>Base employee allocation</FeatureItem>
        <FeatureItem>Manages up to 5 Field Techs automatically</FeatureItem>
      </View>

      <View style={styles.footer}>
        <Text>Aura Intercept - AI-Powered Service Platform</Text>
        <Text render={({ pageNumber }) => `Page ${pageNumber}`} />
      </View>
    </Page>

    {/* Command Tier Details */}
    <Page size="A4" style={styles.page}>
      <Header title="Aura Intercept - Pricing Guide" />
      <Text style={styles.sectionTitle}>Command Tier</Text>

      <View style={styles.pricingCard}>
        <Text style={styles.pricingTierName}>Command</Text>
        <Text style={styles.pricingPrice}>$1,497/month</Text>
        <Text style={styles.pricingAnnual}>or $14,970/year (billed annually)</Text>
        <Text style={styles.pricingSavings}>Save ~$3,000 with annual billing</Text>
        
        <Text style={{ fontSize: 10, fontWeight: 600, marginBottom: 8 }}>Best For:</Text>
        <Text style={{ fontSize: 9, color: colors.gray, marginBottom: 12 }}>
          {SUBSCRIPTION_TIERS.command.bestFor}
        </Text>
      </View>

      <Text style={styles.subsectionTitle}>Included AI Agents (All 19)</Text>
      <Text style={styles.paragraph}>
        Full access to all 19 AI agents including Customer Engagement (3), Field Operations (4), 
        Business Management (4), Marketing & Sales (4), and Analytics & Reports (4) agents.
      </Text>

      <Text style={styles.subsectionTitle}>Control Centers (All 5)</Text>
      <View style={styles.featureList}>
        <FeatureItem>Customer Portal Console - Complete self-service experience</FeatureItem>
        <FeatureItem>Field Operations Console - Full dispatch and routing capabilities</FeatureItem>
        <FeatureItem>Business Mgt Ops Console - Invoicing, inventory, and warranties</FeatureItem>
        <FeatureItem>Marketing & Sales Console - Campaigns, leads, and referrals</FeatureItem>
        <FeatureItem>Analytics & Reports Console - KPIs, forecasting, and performance tracking</FeatureItem>
      </View>

      <Text style={styles.subsectionTitle}>Platform Features</Text>
      <View style={styles.featureList}>
        <FeatureItem>Unlimited appointments</FeatureItem>
        <FeatureItem>Email + SMS + Voice reminders</FeatureItem>
        <FeatureItem>Unlimited employee accounts</FeatureItem>
        <FeatureItem>Priority support</FeatureItem>
        <FeatureItem>AI voice synthesis with ElevenLabs</FeatureItem>
        <FeatureItem>Advanced analytics and forecasting</FeatureItem>
        <FeatureItem>Total Business Automation & Brand Control</FeatureItem>
      </View>

      <View style={styles.footer}>
        <Text>Aura Intercept - AI-Powered Service Platform</Text>
        <Text render={({ pageNumber }) => `Page ${pageNumber}`} />
      </View>
    </Page>

    {/* Annual Discount Savings */}
    <Page size="A4" style={styles.page}>
      <Header title="Aura Intercept - Pricing Guide" />
      <Text style={styles.sectionTitle}>Annual Discount Savings</Text>

      <Text style={styles.paragraph}>
        Save 16% on your subscription by choosing annual billing. All plans include the same features 
        whether you choose monthly or annual billing - the only difference is the savings!
      </Text>

      <Text style={styles.subsectionTitle}>Monthly vs Annual Comparison</Text>

      <View style={styles.table}>
        <View style={styles.tableHeader}>
          <Text style={[styles.tableHeaderCell, { flex: 1.5 }]}>Tier</Text>
          <Text style={[styles.tableHeaderCell, { flex: 1 }]}>Monthly Rate</Text>
          <Text style={[styles.tableHeaderCell, { flex: 1.2 }]}>Monthly Path (12 mo)</Text>
          <Text style={[styles.tableHeaderCell, { flex: 1 }]}>Annual Rate</Text>
          <Text style={[styles.tableHeaderCell, { flex: 1 }]}>You Save</Text>
        </View>
        {[
          { tier: 'Single-Point', monthly: '$497', yearlyPath: '$5,964', annual: '$4,970', savings: '~$1,000' },
          { tier: 'Multi-Track', monthly: '$897', yearlyPath: '$10,764', annual: '$8,970', savings: '~$1,800' },
          { tier: 'Command', monthly: '$1,497', yearlyPath: '$17,964', annual: '$14,970', savings: '~$3,000' },
        ].map((row, i) => (
          <View key={i} style={i % 2 === 0 ? styles.tableRow : styles.tableRowAlt}>
            <Text style={[styles.tableCellLeft, { flex: 1.5, fontWeight: 600 }]}>{row.tier}</Text>
            <Text style={[styles.tableCell, { flex: 1 }]}>{row.monthly}</Text>
            <Text style={[styles.tableCell, { flex: 1.2 }]}>{row.yearlyPath}</Text>
            <Text style={[styles.tableCell, { flex: 1, fontWeight: 600 }]}>{row.annual}</Text>
            <Text style={[styles.tableCell, { flex: 1, color: colors.green, fontWeight: 700 }]}>{row.savings}</Text>
          </View>
        ))}
      </View>

      <View style={styles.infoBox}>
        <Text style={styles.noticeTitle}>Annual Billing Benefits</Text>
        <Text style={styles.noticeText}>
          • Significant cost savings (16% discount){'\n'}
          • Simplified budgeting with one annual payment{'\n'}
          • Lock in your rate for 12 months{'\n'}
          • Same features and support as monthly plans
        </Text>
      </View>

      <Text style={styles.subsectionTitle}>Combined Savings Potential</Text>
      <Text style={styles.paragraph}>
        When combined with efficient use of 3rd party integrations, annual billing can significantly 
        reduce your total cost of ownership for the platform.
      </Text>

      <View style={styles.table}>
        <View style={styles.tableHeader}>
          <Text style={[styles.tableHeaderCell, { flex: 1.5 }]}>Scenario</Text>
          <Text style={[styles.tableHeaderCell, { flex: 1 }]}>Monthly Path</Text>
          <Text style={[styles.tableHeaderCell, { flex: 1 }]}>Annual Path</Text>
          <Text style={[styles.tableHeaderCell, { flex: 1 }]}>Total Savings</Text>
        </View>
        {[
          { scenario: 'Single-Point (1 year)', monthly: '$5,964', annual: '$4,970', savings: '~$1,000' },
          { scenario: 'Multi-Track (1 year)', monthly: '$10,764', annual: '$8,970', savings: '~$1,800' },
          { scenario: 'Command (1 year)', monthly: '$17,964', annual: '$14,970', savings: '~$3,000' },
          { scenario: 'Command (3 years)', monthly: '$53,892', annual: '$44,910', savings: '~$9,000' },
        ].map((row, i) => (
          <View key={i} style={i % 2 === 0 ? styles.tableRow : styles.tableRowAlt}>
            <Text style={[styles.tableCellLeft, { flex: 1.5, fontWeight: 600 }]}>{row.scenario}</Text>
            <Text style={[styles.tableCell, { flex: 1 }]}>{row.monthly}</Text>
            <Text style={[styles.tableCell, { flex: 1 }]}>{row.annual}</Text>
            <Text style={[styles.tableCell, { flex: 1, color: colors.green, fontWeight: 700 }]}>{row.savings}</Text>
          </View>
        ))}
      </View>

      <View style={styles.footer}>
        <Text>Aura Intercept - AI-Powered Service Platform</Text>
        <Text render={({ pageNumber }) => `Page ${pageNumber}`} />
      </View>
    </Page>

    {/* 3rd Party Integration Requirements */}
    <Page size="A4" style={styles.page}>
      <Header title="Aura Intercept - Pricing Guide" />
      <Text style={styles.sectionTitle}>3rd Party Integration Requirements</Text>

      <View style={styles.noticeBox}>
        <Text style={styles.noticeTitle}>⚠️ Important: Separate Billing</Text>
        <Text style={styles.noticeText}>
          A valid credit card is required for all 3rd party integration accounts. These services are 
          billed separately from your Aura Intercept subscription. Companies must set up and manage 
          their own accounts with each provider.
        </Text>
      </View>

      <Text style={styles.subsectionTitle}>Required Integrations by Tier</Text>

      <View style={styles.table}>
        <View style={styles.tableHeader}>
          <Text style={[styles.tableHeaderCell, { flex: 1.2 }]}>Service</Text>
          <Text style={[styles.tableHeaderCell, { flex: 1.5 }]}>Purpose</Text>
          <Text style={[styles.tableHeaderCell, { flex: 1.5 }]}>Estimated Cost</Text>
          <Text style={[styles.tableHeaderCell, { flex: 1.3 }]}>Required For</Text>
        </View>
        {THIRD_PARTY_INTEGRATIONS.map((integration, i) => (
          <View key={i} style={i % 2 === 0 ? styles.tableRow : styles.tableRowAlt}>
            <Text style={[styles.tableCellLeft, { flex: 1.2, fontWeight: 600 }]}>{integration.name}</Text>
            <Text style={[styles.tableCellLeft, { flex: 1.5 }]}>{integration.purpose}</Text>
            <Text style={[styles.tableCell, { flex: 1.5 }]}>{integration.cost}</Text>
            <Text style={[styles.tableCell, { flex: 1.3, fontSize: 8 }]}>{integration.required}</Text>
          </View>
        ))}
      </View>

      <Text style={styles.subsectionTitle}>Integration Details</Text>

      <View style={styles.twoColumn}>
        <View style={styles.column}>
          <View style={styles.columnCard}>
            <Text style={styles.columnTitle}>Twilio (SMS & Voice)</Text>
            <Text style={{ fontSize: 9, color: colors.gray, marginBottom: 8 }}>
              Required for SMS reminders and voice calls. Pricing based on usage:
            </Text>
            <BulletPoint>Phone number: ~$1.15/month</BulletPoint>
            <BulletPoint>SMS: ~$0.0075/message</BulletPoint>
            <BulletPoint>Voice: ~$0.013/minute</BulletPoint>
            <BulletPoint>Estimated: $30-100/month</BulletPoint>
          </View>
        </View>
        <View style={styles.column}>
          <View style={styles.columnCard}>
            <Text style={styles.columnTitle}>ElevenLabs (Voice AI)</Text>
            <Text style={{ fontSize: 9, color: colors.gray, marginBottom: 8 }}>
              Required for Enterprise tier voice reminders:
            </Text>
            <BulletPoint>Free tier: 10,000 characters/month</BulletPoint>
            <BulletPoint>Starter: $5/month (30k chars)</BulletPoint>
            <BulletPoint>Creator: $22/month (100k chars)</BulletPoint>
            <BulletPoint>Pro: $99/month (500k chars)</BulletPoint>
          </View>
        </View>
      </View>

      <View style={styles.twoColumn}>
        <View style={styles.column}>
          <View style={styles.columnCard}>
            <Text style={styles.columnTitle}>Resend (Email)</Text>
            <Text style={{ fontSize: 9, color: colors.gray, marginBottom: 8 }}>
              Email delivery for notifications and reminders:
            </Text>
            <BulletPoint>Free: 100 emails/day</BulletPoint>
            <BulletPoint>Pro: $20/month (50k emails)</BulletPoint>
            <BulletPoint>Additional emails at usage rates</BulletPoint>
          </View>
        </View>
        <View style={styles.column}>
          <View style={styles.columnCard}>
            <Text style={styles.columnTitle}>Google Calendar</Text>
            <Text style={{ fontSize: 9, color: colors.gray, marginBottom: 8 }}>
              Optional calendar sync integration:
            </Text>
            <BulletPoint>Free to use with Google account</BulletPoint>
            <BulletPoint>Two-way sync with appointments</BulletPoint>
            <BulletPoint>OAuth authentication required</BulletPoint>
          </View>
        </View>
      </View>

      <View style={styles.footer}>
        <Text>Aura Intercept - AI-Powered Service Platform</Text>
        <Text render={({ pageNumber }) => `Page ${pageNumber}`} />
      </View>
    </Page>

    {/* Billing Clarifications */}
    <Page size="A4" style={styles.page}>
      <Header title="Aura Intercept - Pricing Guide" />
      <Text style={styles.sectionTitle}>Billing Clarifications</Text>

      <Text style={styles.paragraph}>
        Understanding the two types of billing associated with using Aura Intercept is essential for 
        accurate budgeting and financial planning.
      </Text>

      <View style={styles.twoColumn}>
        <View style={styles.column}>
          <View style={[styles.columnCard, { borderLeftWidth: 4, borderLeftColor: colors.primary }]}>
            <Text style={[styles.columnTitle, { color: colors.primary }]}>Platform Subscription</Text>
            <Text style={{ fontSize: 10, fontWeight: 600, marginBottom: 6 }}>Billed by Aura Intercept</Text>
            <Text style={{ fontSize: 9, color: colors.gray, marginBottom: 10 }}>
              Your subscription payment for access to the AI platform and agents.
            </Text>
            <BulletPoint>Monthly or Annual billing cycle</BulletPoint>
            <BulletPoint>Managed through platform dashboard</BulletPoint>
            <BulletPoint>Single invoice for AI platform access</BulletPoint>
            <BulletPoint>Includes all agents and consoles for your tier</BulletPoint>
            <BulletPoint>Upgrade/downgrade at any time</BulletPoint>
          </View>
        </View>
        <View style={styles.column}>
          <View style={[styles.columnCard, { borderLeftWidth: 4, borderLeftColor: colors.amber }]}>
            <Text style={[styles.columnTitle, { color: colors.amber }]}>Company Stripe Account</Text>
            <Text style={{ fontSize: 10, fontWeight: 600, marginBottom: 6 }}>Separate - Required for Invoice Payments</Text>
            <Text style={{ fontSize: 9, color: colors.gray, marginBottom: 10 }}>
              Your company's own Stripe account for processing customer payments.
            </Text>
            <BulletPoint>Companies must connect their own Stripe</BulletPoint>
            <BulletPoint>Required for processing customer invoices</BulletPoint>
            <BulletPoint>Transaction fees: 2.9% + $0.30</BulletPoint>
            <BulletPoint>Funds go directly to your account</BulletPoint>
            <BulletPoint>You manage payouts and disputes</BulletPoint>
          </View>
        </View>
      </View>

      <View style={styles.noticeBox}>
        <Text style={styles.noticeTitle}>⚠️ Important Notice</Text>
        <Text style={styles.noticeText}>
          Aura Intercept does not process invoice payments on behalf of companies. Each company must 
          set up and connect their own Stripe account to collect payments from their customers. This 
          ensures funds go directly to your business account and you maintain full control over your 
          payment processing.
        </Text>
      </View>

      <Text style={styles.subsectionTitle}>Payment Processing Flow</Text>
      
      <View style={styles.featureList}>
        <FeatureItem>Customer receives invoice generated by Invoice Agent</FeatureItem>
        <FeatureItem>Invoice includes Stripe payment link (connected to YOUR Stripe account)</FeatureItem>
        <FeatureItem>Customer pays via Stripe checkout</FeatureItem>
        <FeatureItem>Payment is deposited to your company's bank account</FeatureItem>
        <FeatureItem>Aura Intercept updates invoice status automatically</FeatureItem>
      </View>

      <Text style={styles.subsectionTitle}>Setting Up Your Stripe Account</Text>
      
      <Text style={styles.paragraph}>
        To enable invoice payments, navigate to Settings → Payment Connections in your Aura Intercept 
        dashboard. You'll be guided through connecting your existing Stripe account or creating a new 
        one. Once connected, invoice payments will be processed through your account.
      </Text>

      <View style={styles.footer}>
        <Text>Aura Intercept - AI-Powered Service Platform</Text>
        <Text render={({ pageNumber }) => `Page ${pageNumber}`} />
      </View>
    </Page>

    {/* Total Cost Examples */}
    <Page size="A4" style={styles.page}>
      <Header title="Aura Intercept - Pricing Guide" />
      <Text style={styles.sectionTitle}>Total Cost Examples</Text>

      <Text style={styles.paragraph}>
        The following examples illustrate typical monthly costs including platform subscription and 
        estimated 3rd party integration usage. Actual costs will vary based on your specific usage.
      </Text>

      <Text style={styles.subsectionTitle}>Monthly Cost Scenarios</Text>

      <View style={styles.table}>
        <View style={styles.tableHeader}>
          <Text style={[styles.tableHeaderCell, { flex: 2 }]}>Scenario</Text>
          <Text style={[styles.tableHeaderCell, { flex: 1 }]}>Subscription</Text>
          <Text style={[styles.tableHeaderCell, { flex: 1.2 }]}>3rd Party Est.</Text>
          <Text style={[styles.tableHeaderCell, { flex: 1 }]}>Total/Month</Text>
        </View>
        {[
          { scenario: 'Single-Point (Email Only)', sub: '$497', third: '~$20', total: '~$517' },
          { scenario: 'Multi-Track (Light SMS)', sub: '$897', third: '~$80', total: '~$977' },
          { scenario: 'Multi-Track (Heavy SMS)', sub: '$897', third: '~$150', total: '~$1,047' },
          { scenario: 'Command (Light Voice)', sub: '$1,497', third: '~$150', total: '~$1,647' },
          { scenario: 'Command (Full Voice)', sub: '$1,497', third: '~$300', total: '~$1,797' },
        ].map((row, i) => (
          <View key={i} style={i % 2 === 0 ? styles.tableRow : styles.tableRowAlt}>
            <Text style={[styles.tableCellLeft, { flex: 2, fontWeight: 600 }]}>{row.scenario}</Text>
            <Text style={[styles.tableCell, { flex: 1 }]}>{row.sub}</Text>
            <Text style={[styles.tableCell, { flex: 1.2 }]}>{row.third}</Text>
            <Text style={[styles.tableCell, { flex: 1, fontWeight: 700 }]}>{row.total}</Text>
          </View>
        ))}
      </View>

      <Text style={styles.subsectionTitle}>Annual Cost Comparison</Text>

      <View style={styles.table}>
        <View style={styles.tableHeader}>
          <Text style={[styles.tableHeaderCell, { flex: 2 }]}>Tier</Text>
          <Text style={[styles.tableHeaderCell, { flex: 1.2 }]}>Monthly Billing</Text>
          <Text style={[styles.tableHeaderCell, { flex: 1.2 }]}>Annual Billing</Text>
          <Text style={[styles.tableHeaderCell, { flex: 1 }]}>Annual Savings</Text>
        </View>
        {[
          { tier: 'Single-Point + 3rd Party Est.', monthly: '~$6,200/year', annual: '~$5,200/year', savings: '~$1,000' },
          { tier: 'Multi-Track + 3rd Party Est.', monthly: '~$11,700/year', annual: '~$9,900/year', savings: '~$1,800' },
          { tier: 'Command + 3rd Party Est.', monthly: '~$21,600/year', annual: '~$18,600/year', savings: '~$3,000' },
        ].map((row, i) => (
          <View key={i} style={i % 2 === 0 ? styles.tableRow : styles.tableRowAlt}>
            <Text style={[styles.tableCellLeft, { flex: 2, fontWeight: 600 }]}>{row.tier}</Text>
            <Text style={[styles.tableCell, { flex: 1.2 }]}>{row.monthly}</Text>
            <Text style={[styles.tableCell, { flex: 1.2 }]}>{row.annual}</Text>
            <Text style={[styles.tableCell, { flex: 1, color: colors.green, fontWeight: 700 }]}>{row.savings}</Text>
          </View>
        ))}
      </View>

      <View style={styles.infoBox}>
        <Text style={styles.noticeTitle}>ROI Considerations</Text>
        <Text style={styles.noticeText}>
          Most service businesses report significant ROI from AI automation:{'\n\n'}
          • Average time saved: 20+ hours/week on scheduling and customer service{'\n'}
          • Reduced no-shows: Up to 35% reduction with automated reminders{'\n'}
          • Increased bookings: 24/7 AI availability captures after-hours inquiries{'\n'}
          • Customer satisfaction: Faster response times improve reviews
        </Text>
      </View>

      <Text style={styles.subsectionTitle}>Questions?</Text>
      <Text style={styles.paragraph}>
        Contact our sales team to discuss your specific needs and get a customized quote based on your 
        expected usage patterns.
      </Text>

      <View style={styles.footer}>
        <Text>Aura Intercept - AI-Powered Service Platform</Text>
        <Text render={({ pageNumber }) => `Page ${pageNumber}`} />
      </View>
    </Page>
  </Document>
);

export default PricingSummaryPDF;
