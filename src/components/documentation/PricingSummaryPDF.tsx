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
  starter: {
    name: 'Aura Single-Point (Solo-Focus)',
    monthlyPrice: 1000,
    annualPrice: 10000,
    annualSavings: 2000,
    agents: ['AI Receptionist', 'Scheduling Agent'],
    consoles: ['Customer Portal Console'],
    appointments: '500/month',
    reminders: 'Email only',
    employees: '5 included',
    additionalEmployees: '$25/mo (max 5 extra)',
    bestFor: 'Small service companies getting started with AI automation',
  },
  professional: {
    name: 'Professional',
    monthlyPrice: 1750,
    annualPrice: 17500,
    annualSavings: 3500,
    agents: ['AI Receptionist', 'Scheduling Agent', 'Dispatch Agent', 'Route Agent', 'ETA Agent', 'Check-in Agent', 'Quote Agent'],
    consoles: ['Customer Portal Console', 'Field Operations Console'],
    appointments: '2,000/month',
    reminders: 'Email + SMS',
    employees: '10 included',
    additionalEmployees: '$25/mo (max 5 extra)',
    bestFor: 'Growing companies with field technicians needing dispatch automation',
  },
  enterprise: {
    name: 'Enterprise',
    monthlyPrice: 2250,
    annualPrice: 22500,
    annualSavings: 4500,
    agents: 'All 18 AI Agents',
    consoles: 'All 5 Control Centers',
    appointments: 'Unlimited',
    reminders: 'Email + SMS + Voice',
    employees: 'Unlimited',
    additionalEmployees: 'N/A',
    bestFor: 'Large service companies requiring full AI automation and voice capabilities',
  },
};

const THIRD_PARTY_INTEGRATIONS = [
  { name: 'Twilio', purpose: 'SMS & Voice Calls', cost: '$1.15/number + ~$30-100/mo usage', required: 'Professional & Enterprise' },
  { name: 'ElevenLabs', purpose: 'AI Voice Synthesis', cost: '$0-99+/month based on usage', required: 'Enterprise (Voice)' },
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
          <Text style={styles.coverStatNumber}>18+</Text>
          <Text style={styles.coverStatLabel}>AI Agents</Text>
        </View>
        <View style={styles.coverStat}>
          <Text style={styles.coverStatNumber}>5</Text>
          <Text style={styles.coverStatLabel}>Control Centers</Text>
        </View>
        <View style={styles.coverStat}>
          <Text style={styles.coverStatNumber}>16%</Text>
          <Text style={styles.coverStatLabel}>Annual Savings</Text>
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
          { title: 'Starter Tier Details', page: '5' },
          { title: 'Professional Tier Details', page: '6' },
          { title: 'Enterprise Tier Details', page: '7' },
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
          <Text style={{ fontSize: 12, fontWeight: 700, marginBottom: 8 }}>STARTER</Text>
          <Text style={styles.summaryPrice}>$1,000</Text>
          <Text style={styles.summaryLabel}>per month</Text>
          <Text style={{ fontSize: 9, color: colors.green, marginTop: 4 }}>$10,000/year (Save $2,000)</Text>
        </View>
        <View style={[styles.summaryCard, { borderWidth: 2, borderColor: colors.accent }]}>
          <Text style={{ fontSize: 12, fontWeight: 700, marginBottom: 8, color: colors.accent }}>PROFESSIONAL</Text>
          <Text style={styles.summaryPrice}>$1,750</Text>
          <Text style={styles.summaryLabel}>per month</Text>
          <Text style={{ fontSize: 9, color: colors.green, marginTop: 4 }}>$17,500/year (Save $3,500)</Text>
        </View>
        <View style={styles.summaryCard}>
          <Text style={{ fontSize: 12, fontWeight: 700, marginBottom: 8 }}>ENTERPRISE</Text>
          <Text style={styles.summaryPrice}>$2,250</Text>
          <Text style={styles.summaryLabel}>per month</Text>
          <Text style={{ fontSize: 9, color: colors.green, marginTop: 4 }}>$22,500/year (Save $4,500)</Text>
        </View>
      </View>

      <Text style={styles.subsectionTitle}>Quick Feature Highlights</Text>
      
      <View style={styles.table}>
        <View style={styles.tableHeader}>
          <Text style={[styles.tableHeaderCell, { flex: 2 }]}>Feature</Text>
          <Text style={[styles.tableHeaderCell, { flex: 1 }]}>Starter</Text>
          <Text style={[styles.tableHeaderCell, { flex: 1 }]}>Professional</Text>
          <Text style={[styles.tableHeaderCell, { flex: 1 }]}>Enterprise</Text>
        </View>
        {[
          { feature: 'AI Agents', starter: '2', pro: '7', enterprise: '18+' },
          { feature: 'Control Centers', starter: '1', pro: '2', enterprise: '5' },
          { feature: 'Appointments/Month', starter: '500', pro: '2,000', enterprise: 'Unlimited' },
          { feature: 'Reminder Channels', starter: 'Email', pro: 'Email + SMS', enterprise: 'Email + SMS + Voice' },
          { feature: 'Employee Accounts', starter: '5', pro: '10', enterprise: 'Unlimited' },
        ].map((row, i) => (
          <View key={i} style={i % 2 === 0 ? styles.tableRow : styles.tableRowAlt}>
            <Text style={[styles.tableCellLeft, { flex: 2, fontWeight: 600 }]}>{row.feature}</Text>
            <Text style={[styles.tableCell, { flex: 1 }]}>{row.starter}</Text>
            <Text style={[styles.tableCell, { flex: 1 }]}>{row.pro}</Text>
            <Text style={[styles.tableCell, { flex: 1 }]}>{row.enterprise}</Text>
          </View>
        ))}
      </View>

      <View style={styles.infoBox}>
        <Text style={styles.noticeTitle}>Additional Employee Pricing</Text>
        <Text style={styles.noticeText}>
          Starter and Professional tiers can add up to 5 additional employee accounts at $25/month each. 
          Enterprise tier includes unlimited employee accounts at no additional cost.
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
          <Text style={[styles.tableHeaderCell, { flex: 1.5 }]}>Starter</Text>
          <Text style={[styles.tableHeaderCell, { flex: 1.5 }]}>Professional</Text>
          <Text style={[styles.tableHeaderCell, { flex: 1.5 }]}>Enterprise</Text>
        </View>
        {[
          { category: 'Monthly Price', starter: '$1,000', pro: '$1,750', enterprise: '$2,250' },
          { category: 'Annual Price', starter: '$10,000', pro: '$17,500', enterprise: '$22,500' },
          { category: 'Annual Savings', starter: '$2,000', pro: '$3,500', enterprise: '$4,500' },
          { category: '', starter: '', pro: '', enterprise: '' },
          { category: 'AI Agents Included', starter: '2', pro: '7', enterprise: 'All 18+' },
          { category: 'Control Centers', starter: '1', pro: '2', enterprise: 'All 5' },
          { category: 'Appointments/Month', starter: '500', pro: '2,000', enterprise: 'Unlimited' },
          { category: '', starter: '', pro: '', enterprise: '' },
          { category: 'Email Reminders', starter: '✓', pro: '✓', enterprise: '✓' },
          { category: 'SMS Reminders', starter: '—', pro: '✓', enterprise: '✓' },
          { category: 'Voice Reminders', starter: '—', pro: '—', enterprise: '✓' },
          { category: '', starter: '', pro: '', enterprise: '' },
          { category: 'Employee Accounts', starter: '5', pro: '10', enterprise: 'Unlimited' },
          { category: 'Additional Employees', starter: '$25/mo (max 5)', pro: '$25/mo (max 5)', enterprise: 'Included' },
          { category: 'Widget Access', starter: '✓', pro: '✓', enterprise: '✓' },
          { category: '', starter: '', pro: '', enterprise: '' },
          { category: 'Customer Portal', starter: '✓', pro: '✓', enterprise: '✓' },
          { category: 'Field Operations', starter: '—', pro: '✓', enterprise: '✓' },
          { category: 'Business Operations', starter: '—', pro: '—', enterprise: '✓' },
          { category: 'Marketing & Sales', starter: '—', pro: '—', enterprise: '✓' },
          { category: 'Analytics Console', starter: '—', pro: '—', enterprise: '✓' },
        ].map((row, i) => (
          <View key={i} style={row.category === '' ? { height: 8 } : (i % 2 === 0 ? styles.tableRow : styles.tableRowAlt)}>
            {row.category !== '' && (
              <>
                <Text style={[styles.tableCellLeft, { flex: 2.5, fontWeight: row.category.includes('Price') || row.category.includes('Savings') ? 700 : 400 }]}>{row.category}</Text>
                <Text style={[styles.tableCell, { flex: 1.5 }]}>{row.starter}</Text>
                <Text style={[styles.tableCell, { flex: 1.5 }]}>{row.pro}</Text>
                <Text style={[styles.tableCell, { flex: 1.5 }]}>{row.enterprise}</Text>
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

    {/* Starter Tier Details */}
    <Page size="A4" style={styles.page}>
      <Header title="Aura Intercept - Pricing Guide" />
      <Text style={styles.sectionTitle}>Aura Single-Point Tier</Text>

      <View style={styles.pricingCard}>
        <Text style={styles.pricingTierName}>Aura Single-Point (Solo-Focus)</Text>
        <Text style={styles.pricingPrice}>$1,000/month</Text>
        <Text style={styles.pricingAnnual}>or $10,000/year (billed annually)</Text>
        <Text style={styles.pricingSavings}>Save $2,000 with annual billing</Text>
        
        <Text style={{ fontSize: 10, fontWeight: 600, marginBottom: 8 }}>Best For:</Text>
        <Text style={{ fontSize: 9, color: colors.gray, marginBottom: 12 }}>
          {SUBSCRIPTION_TIERS.starter.bestFor}
        </Text>
      </View>

      <Text style={styles.subsectionTitle}>Included AI Agents (2)</Text>
      <View style={styles.featureList}>
        <FeatureItem>AI Receptionist - Intelligent inquiry routing and classification</FeatureItem>
        <FeatureItem>Scheduling Agent - Natural language appointment booking with availability checks</FeatureItem>
      </View>

      <Text style={styles.subsectionTitle}>Control Centers (1)</Text>
      <View style={styles.featureList}>
        <FeatureItem>Customer Portal Console - Self-service booking and appointment management</FeatureItem>
      </View>

      <Text style={styles.subsectionTitle}>Platform Limits</Text>
      <View style={styles.featureList}>
        <FeatureItem>500 appointments per month</FeatureItem>
        <FeatureItem>Email reminders only</FeatureItem>
        <FeatureItem>5 employee accounts included</FeatureItem>
        <FeatureItem>Up to 5 additional employees at $25/month each</FeatureItem>
        <FeatureItem>Embeddable booking widget</FeatureItem>
      </View>

      <Text style={styles.subsectionTitle}>Key Features</Text>
      <View style={styles.featureList}>
        <FeatureItem>24/7 AI-powered chat for customer inquiries</FeatureItem>
        <FeatureItem>Automated appointment booking and confirmation</FeatureItem>
        <FeatureItem>Email-based appointment reminders</FeatureItem>
        <FeatureItem>Customer self-service portal</FeatureItem>
        <FeatureItem>Basic reporting and analytics</FeatureItem>
      </View>

      <View style={styles.footer}>
        <Text>Aura Intercept - AI-Powered Service Platform</Text>
        <Text render={({ pageNumber }) => `Page ${pageNumber}`} />
      </View>
    </Page>

    {/* Professional Tier Details */}
    <Page size="A4" style={styles.page}>
      <Header title="Aura Intercept - Pricing Guide" />
      <Text style={styles.sectionTitle}>Professional Tier</Text>

      <View style={styles.pricingCardHighlight}>
        <Text style={{ fontSize: 9, color: colors.accent, fontWeight: 700, marginBottom: 4 }}>MOST POPULAR</Text>
        <Text style={styles.pricingTierName}>Professional Plan</Text>
        <Text style={styles.pricingPrice}>$1,750/month</Text>
        <Text style={styles.pricingAnnual}>or $17,500/year (billed annually)</Text>
        <Text style={styles.pricingSavings}>Save $3,500 with annual billing</Text>
        
        <Text style={{ fontSize: 10, fontWeight: 600, marginBottom: 8 }}>Best For:</Text>
        <Text style={{ fontSize: 9, color: colors.gray, marginBottom: 12 }}>
          {SUBSCRIPTION_TIERS.professional.bestFor}
        </Text>
      </View>

      <Text style={styles.subsectionTitle}>Included AI Agents (7)</Text>
      <View style={styles.featureList}>
        <FeatureItem>AI Receptionist - Intelligent inquiry routing and classification</FeatureItem>
        <FeatureItem>Scheduling Agent - Natural language appointment booking</FeatureItem>
        <FeatureItem>Dispatch Agent - Smart job assignment based on skills and location</FeatureItem>
        <FeatureItem>Route Agent - Real-time route optimization for technicians</FeatureItem>
        <FeatureItem>ETA Agent - Arrival time predictions with customer notifications</FeatureItem>
        <FeatureItem>Check-in Agent - Job status tracking with photo documentation</FeatureItem>
        <FeatureItem>Quote Agent - Instant quote generation from service catalog</FeatureItem>
      </View>

      <Text style={styles.subsectionTitle}>Control Centers (2)</Text>
      <View style={styles.featureList}>
        <FeatureItem>Customer Portal Console - Self-service booking and management</FeatureItem>
        <FeatureItem>Field Operations Console - Dispatch, routing, and technician management</FeatureItem>
      </View>

      <Text style={styles.subsectionTitle}>Platform Limits</Text>
      <View style={styles.featureList}>
        <FeatureItem>2,000 appointments per month</FeatureItem>
        <FeatureItem>Email + SMS reminders</FeatureItem>
        <FeatureItem>10 employee accounts included</FeatureItem>
        <FeatureItem>Up to 5 additional employees at $25/month each</FeatureItem>
      </View>

      <View style={styles.footer}>
        <Text>Aura Intercept - AI-Powered Service Platform</Text>
        <Text render={({ pageNumber }) => `Page ${pageNumber}`} />
      </View>
    </Page>

    {/* Enterprise Tier Details */}
    <Page size="A4" style={styles.page}>
      <Header title="Aura Intercept - Pricing Guide" />
      <Text style={styles.sectionTitle}>Enterprise Tier</Text>

      <View style={styles.pricingCard}>
        <Text style={styles.pricingTierName}>Enterprise Plan</Text>
        <Text style={styles.pricingPrice}>$2,250/month</Text>
        <Text style={styles.pricingAnnual}>or $22,500/year (billed annually)</Text>
        <Text style={styles.pricingSavings}>Save $4,500 with annual billing</Text>
        
        <Text style={{ fontSize: 10, fontWeight: 600, marginBottom: 8 }}>Best For:</Text>
        <Text style={{ fontSize: 9, color: colors.gray, marginBottom: 12 }}>
          {SUBSCRIPTION_TIERS.enterprise.bestFor}
        </Text>
      </View>

      <Text style={styles.subsectionTitle}>Included AI Agents (All 18+)</Text>
      <Text style={styles.paragraph}>
        Full access to all AI agents including Customer Engagement (6), Field Operations (4), 
        Business Operations (5), Marketing & Sales (6), and Analytics (4) agents.
      </Text>

      <Text style={styles.subsectionTitle}>Control Centers (All 5)</Text>
      <View style={styles.featureList}>
        <FeatureItem>Customer Portal Console - Complete self-service experience</FeatureItem>
        <FeatureItem>Field Operations Console - Full dispatch and routing capabilities</FeatureItem>
        <FeatureItem>Business Operations Console - Invoicing, inventory, and warranties</FeatureItem>
        <FeatureItem>Marketing & Sales Console - Campaigns, leads, and referrals</FeatureItem>
        <FeatureItem>Analytics Console - KPIs, forecasting, and performance tracking</FeatureItem>
      </View>

      <Text style={styles.subsectionTitle}>Platform Limits</Text>
      <View style={styles.featureList}>
        <FeatureItem>Unlimited appointments</FeatureItem>
        <FeatureItem>Email + SMS + Voice reminders</FeatureItem>
        <FeatureItem>Unlimited employee accounts</FeatureItem>
        <FeatureItem>Priority support</FeatureItem>
        <FeatureItem>AI voice synthesis with ElevenLabs</FeatureItem>
        <FeatureItem>Advanced analytics and forecasting</FeatureItem>
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
          { tier: 'Starter', monthly: '$1,000', yearlyPath: '$12,000', annual: '$10,000', savings: '$2,000' },
          { tier: 'Professional', monthly: '$1,750', yearlyPath: '$21,000', annual: '$17,500', savings: '$3,500' },
          { tier: 'Enterprise', monthly: '$2,250', yearlyPath: '$27,000', annual: '$22,500', savings: '$4,500' },
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
          { scenario: 'Starter (1 year)', monthly: '$12,000', annual: '$10,000', savings: '$2,000' },
          { scenario: 'Professional (1 year)', monthly: '$21,000', annual: '$17,500', savings: '$3,500' },
          { scenario: 'Enterprise (1 year)', monthly: '$27,000', annual: '$22,500', savings: '$4,500' },
          { scenario: 'Enterprise (3 years)', monthly: '$81,000', annual: '$67,500', savings: '$13,500' },
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
          { scenario: 'Starter (Email Only)', sub: '$1,000', third: '~$20', total: '~$1,020' },
          { scenario: 'Professional (Light SMS)', sub: '$1,750', third: '~$80', total: '~$1,830' },
          { scenario: 'Professional (Heavy SMS)', sub: '$1,750', third: '~$150', total: '~$1,900' },
          { scenario: 'Enterprise (Light Voice)', sub: '$2,250', third: '~$150', total: '~$2,400' },
          { scenario: 'Enterprise (Full Voice)', sub: '$2,250', third: '~$300', total: '~$2,550' },
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
          { tier: 'Starter + 3rd Party Est.', monthly: '~$12,240/year', annual: '~$10,240/year', savings: '~$2,000' },
          { tier: 'Professional + 3rd Party Est.', monthly: '~$22,200/year', annual: '~$18,700/year', savings: '~$3,500' },
          { tier: 'Enterprise + 3rd Party Est.', monthly: '~$30,600/year', annual: '~$26,100/year', savings: '~$4,500' },
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
