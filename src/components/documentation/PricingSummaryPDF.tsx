import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
} from '@react-pdf/renderer';
import { SUBSCRIPTION_TIERS } from '@/lib/documentationConfig';

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
  rose: '#f43f5e',
  roseLight: '#ffe4e6',
};

const styles = StyleSheet.create({
  page: { padding: 40, fontFamily: 'Helvetica', fontSize: 10, color: colors.dark, backgroundColor: colors.white },
  coverPage: { padding: 60, fontFamily: 'Helvetica', backgroundColor: colors.dark, color: colors.white, justifyContent: 'center', alignItems: 'center' },
  coverTitle: { fontSize: 36, fontWeight: 700, marginBottom: 8, textAlign: 'center' },
  coverBrand: { fontSize: 24, fontWeight: 700, marginBottom: 16, textAlign: 'center', color: colors.accent },
  coverSubtitle: { fontSize: 16, fontWeight: 400, marginBottom: 40, textAlign: 'center', color: '#a5b4fc' },
  coverStats: { flexDirection: 'row', justifyContent: 'center', gap: 30, marginTop: 40 },
  coverStat: { alignItems: 'center' },
  coverStatNumber: { fontSize: 28, fontWeight: 700, color: colors.accent },
  coverStatLabel: { fontSize: 9, color: '#a5b4fc', marginTop: 4, textAlign: 'center' },
  header: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20, paddingBottom: 10, borderBottomWidth: 1, borderBottomColor: colors.lightGray },
  headerTitle: { fontSize: 8, color: colors.gray },
  pageNumber: { fontSize: 8, color: colors.gray },
  sectionTitle: { fontSize: 20, fontWeight: 700, color: colors.primary, marginBottom: 16, marginTop: 10 },
  subsectionTitle: { fontSize: 14, fontWeight: 600, color: colors.dark, marginBottom: 10, marginTop: 16 },
  paragraph: { fontSize: 10, lineHeight: 1.6, marginBottom: 10, color: colors.dark },
  footer: { position: 'absolute', bottom: 30, left: 40, right: 40, flexDirection: 'row', justifyContent: 'space-between', fontSize: 8, color: colors.gray },
  table: { marginVertical: 12 },
  tableHeader: { flexDirection: 'row', backgroundColor: colors.dark, color: colors.white, padding: 8 },
  tableHeaderCell: { fontSize: 9, fontWeight: 700, color: colors.white, textAlign: 'center' },
  tableRow: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: colors.lightGray, padding: 8 },
  tableRowAlt: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: colors.lightGray, padding: 8, backgroundColor: colors.lightGray },
  tableCell: { fontSize: 9, textAlign: 'center' },
  tableCellLeft: { fontSize: 9, textAlign: 'left' },
  pricingCard: { backgroundColor: colors.lightGray, padding: 16, marginBottom: 12, borderRadius: 4, borderLeftWidth: 4, borderLeftColor: colors.primary },
  pricingCardHighlight: { backgroundColor: colors.lightGray, padding: 16, marginBottom: 12, borderRadius: 4, borderLeftWidth: 4, borderLeftColor: colors.accent, borderWidth: 2, borderColor: colors.accent },
  pricingTierName: { fontSize: 16, fontWeight: 700, color: colors.dark, marginBottom: 4 },
  pricingPrice: { fontSize: 24, fontWeight: 700, color: colors.primary, marginBottom: 2 },
  pricingAnnual: { fontSize: 10, color: colors.gray, marginBottom: 8 },
  pricingSavings: { fontSize: 10, color: colors.green, fontWeight: 600, marginBottom: 12 },
  featureList: { marginTop: 8 },
  featureItem: { flexDirection: 'row', marginBottom: 4 },
  featureCheck: { fontSize: 10, color: colors.green, marginRight: 6 },
  featureText: { fontSize: 9, color: colors.dark, flex: 1 },
  noticeBox: { backgroundColor: colors.amberLight, padding: 12, marginVertical: 12, borderRadius: 4, borderLeftWidth: 4, borderLeftColor: colors.amber },
  noticeTitle: { fontSize: 11, fontWeight: 700, color: colors.dark, marginBottom: 6 },
  noticeText: { fontSize: 9, color: colors.dark, lineHeight: 1.5 },
  infoBox: { backgroundColor: colors.greenLight, padding: 12, marginVertical: 12, borderRadius: 4, borderLeftWidth: 4, borderLeftColor: colors.green },
  tocItem: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8, paddingBottom: 6, borderBottomWidth: 1, borderBottomColor: colors.lightGray, borderBottomStyle: 'dotted' },
  tocTitle: { fontSize: 11 },
  tocPage: { fontSize: 11, color: colors.primary },
  bulletPoint: { flexDirection: 'row', marginBottom: 6, paddingLeft: 10 },
  bullet: { width: 15, fontSize: 10, color: colors.primary },
  bulletText: { flex: 1, fontSize: 10, lineHeight: 1.5 },
  summaryGrid: { flexDirection: 'row', gap: 12, marginVertical: 12 },
  summaryCard: { flex: 1, backgroundColor: colors.lightGray, padding: 12, borderRadius: 4, alignItems: 'center' },
  summaryPrice: { fontSize: 18, fontWeight: 700, color: colors.primary, marginBottom: 4 },
  summaryLabel: { fontSize: 9, color: colors.gray, textAlign: 'center' },
  twoColumn: { flexDirection: 'row', gap: 16, marginVertical: 12 },
  column: { flex: 1 },
  columnCard: { backgroundColor: colors.lightGray, padding: 12, borderRadius: 4 },
  columnTitle: { fontSize: 12, fontWeight: 700, color: colors.dark, marginBottom: 8 },
});

const THIRD_PARTY_INTEGRATIONS = [
  { name: 'SignalWire', purpose: 'SMS & Voice Calls', cost: '$2/number + ~$0.004/SMS + ~$0.01/min', required: 'All Tiers (for Voice)' },
  { name: 'ElevenLabs', purpose: 'AI Voice Synthesis', cost: '$0-99+/month based on usage', required: 'All Tiers (for Voice)' },
  { name: 'Resend', purpose: 'Email Notifications', cost: '$0-20+/month based on volume', required: 'All Tiers' },
  { name: 'Google Calendar', purpose: 'Calendar Sync', cost: 'Free', required: 'Optional (All Tiers)' },
  { name: 'Stripe', purpose: 'Invoice Payments', cost: '2.9% + $0.30/transaction', required: 'Performance+ (for Invoicing)' },
  { name: 'Social Media Accounts', purpose: 'Content Publishing', cost: 'Free (platform accounts)', required: 'Connect+ (Social Media)' },
];

const Header = ({ title }: { title: string }) => (
  <View style={styles.header} fixed>
    <Text style={styles.headerTitle}>{title}</Text>
    <Text style={styles.pageNumber} render={({ pageNumber }) => `Page ${pageNumber}`} />
  </View>
);

const BulletPoint = ({ children }: { children: string }) => (
  <View style={styles.bulletPoint}>
    <Text style={styles.bullet}>-</Text>
    <Text style={styles.bulletText}>{children}</Text>
  </View>
);

const FeatureItem = ({ children }: { children: string }) => (
  <View style={styles.featureItem}>
    <Text style={styles.featureCheck}>-</Text>
    <Text style={styles.featureText}>{children}</Text>
  </View>
);

const connect = SUBSCRIPTION_TIERS.aura_connect;
const performance = SUBSCRIPTION_TIERS.multi_track;
const command = SUBSCRIPTION_TIERS.command;

const PricingSummaryPDF = () => (
  <Document>
    {/* Cover Page */}
    <Page size="A4" style={styles.coverPage}>
      <Text style={styles.coverBrand}>AURA INTERCEPT</Text>
      <Text style={styles.coverTitle}>Subscription Pricing Guide</Text>
      <Text style={styles.coverSubtitle}>Complete 3-Tier Pricing Breakdown for AI-Powered Service Business Platform</Text>
      <View style={styles.coverStats}>
        <View style={styles.coverStat}>
          <Text style={styles.coverStatNumber}>3</Text>
          <Text style={styles.coverStatLabel}>Pricing Tiers</Text>
        </View>
        <View style={styles.coverStat}>
          <Text style={styles.coverStatNumber}>10</Text>
          <Text style={styles.coverStatLabel}>AI Operatives</Text>
        </View>
        <View style={styles.coverStat}>
          <Text style={styles.coverStatNumber}>7</Text>
          <Text style={styles.coverStatLabel}>Consoles</Text>
        </View>
        <View style={styles.coverStat}>
          <Text style={styles.coverStatNumber}>$297</Text>
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
          { title: '3-Tier Comparison Table', page: '4' },
          { title: 'Aura Connect Tier Details', page: '5' },
          { title: 'Aura Performance Tier Details', page: '6' },
          { title: 'Aura Command Tier (Enterprise)', page: '7' },
          { title: 'Annual Discount Savings', page: '8' },
          { title: '3rd Party Integration Requirements', page: '9' },
          { title: 'Add-Ons & Implementation Fees', page: '10' },
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
        All tiers include access to our AI-powered platform with varying levels of operatives,
        consoles, and features. Annual billing is priced at 10x the monthly rate.
      </Text>
      <View style={styles.summaryGrid}>
        <View style={styles.summaryCard}>
          <Text style={{ fontSize: 10, fontWeight: 700, marginBottom: 6 }}>AURA CONNECT</Text>
          <Text style={styles.summaryPrice}>${connect.price}</Text>
          <Text style={styles.summaryLabel}>per month</Text>
          <Text style={{ fontSize: 8, color: colors.green, marginTop: 4 }}>{connect.operatives} Operatives</Text>
        </View>
        <View style={[styles.summaryCard, { borderWidth: 2, borderColor: colors.accent }]}>
          <Text style={{ fontSize: 10, fontWeight: 700, marginBottom: 6, color: colors.accent }}>AURA PERFORMANCE</Text>
          <Text style={styles.summaryPrice}>${performance.price}</Text>
          <Text style={styles.summaryLabel}>per month</Text>
          <Text style={{ fontSize: 8, color: colors.green, marginTop: 4 }}>{performance.operatives} Operatives</Text>
        </View>
        <View style={styles.summaryCard}>
          <Text style={{ fontSize: 10, fontWeight: 700, marginBottom: 6 }}>AURA COMMAND</Text>
          <Text style={styles.summaryPrice}>${command.price}</Text>
          <Text style={styles.summaryLabel}>per month</Text>
          <Text style={{ fontSize: 8, color: colors.primary, marginTop: 4 }}>All {command.operatives} Operatives</Text>
        </View>
      </View>

      <Text style={styles.subsectionTitle}>Quick Feature Highlights</Text>
      <View style={styles.table}>
        <View style={styles.tableHeader}>
          <Text style={[styles.tableHeaderCell, { flex: 2 }]}>Feature</Text>
          <Text style={[styles.tableHeaderCell, { flex: 1 }]}>Connect</Text>
          <Text style={[styles.tableHeaderCell, { flex: 1 }]}>Performance</Text>
          <Text style={[styles.tableHeaderCell, { flex: 1 }]}>Command</Text>
        </View>
        {[
          { feature: 'AI Operatives', c: String(connect.operatives), p: String(performance.operatives), cmd: `All ${command.operatives}` },
          { feature: 'Consoles', c: String(connect.consoles), p: String(performance.consoles), cmd: `All ${command.consoles}` },
          { feature: 'Employees', c: String(connect.employees), p: String(performance.employees), cmd: String(command.employees) },
          { feature: 'Talk to Aura (Voice)', c: 'Yes', p: 'Yes', cmd: 'Yes' },
          { feature: 'Online Booking', c: 'Yes', p: 'Yes', cmd: 'Yes' },
          { feature: 'Field Operations', c: '-', p: 'Yes', cmd: 'Yes' },
          { feature: 'Analytics Console', c: '-', p: '-', cmd: 'Yes' },
        ].map((row, i) => (
          <View key={i} style={i % 2 === 0 ? styles.tableRow : styles.tableRowAlt}>
            <Text style={[styles.tableCellLeft, { flex: 2, fontWeight: 600 }]}>{row.feature}</Text>
            <Text style={[styles.tableCell, { flex: 1 }]}>{row.c}</Text>
            <Text style={[styles.tableCell, { flex: 1 }]}>{row.p}</Text>
            <Text style={[styles.tableCell, { flex: 1 }]}>{row.cmd}</Text>
          </View>
        ))}
      </View>
      <View style={styles.infoBox}>
        <Text style={styles.noticeTitle}>Implementation Fees</Text>
        <Text style={styles.noticeText}>
          Connect: $299 | Performance: $499 | Command: Custom. Annual billing = 10x monthly rate.
        </Text>
      </View>
      <View style={styles.footer}>
        <Text>Aura Intercept - AI-Powered Service Platform</Text>
        <Text render={({ pageNumber }) => `Page ${pageNumber}`} />
      </View>
    </Page>

    {/* 3-Tier Comparison Table */}
    <Page size="A4" style={styles.page}>
      <Header title="Aura Intercept - Pricing Guide" />
      <Text style={styles.sectionTitle}>Complete 3-Tier Comparison</Text>
      <View style={styles.table}>
        <View style={styles.tableHeader}>
          <Text style={[styles.tableHeaderCell, { flex: 2.5 }]}>Feature Category</Text>
          <Text style={[styles.tableHeaderCell, { flex: 1 }]}>Connect</Text>
          <Text style={[styles.tableHeaderCell, { flex: 1 }]}>Performance</Text>
          <Text style={[styles.tableHeaderCell, { flex: 1 }]}>Command</Text>
        </View>
        {[
          { category: 'Monthly Price', c: '$297', p: '$497', cmd: '$697' },
          { category: 'Annual Price', c: '$2,970', p: '$4,970', cmd: '$6,970' },
          { category: 'Annual Savings', c: '$594', p: '$994', cmd: '$1,394' },
          { category: '', c: '', p: '', cmd: '' },
          { category: 'AI Operatives', c: '5', p: '8', cmd: 'All 10' },
          { category: 'Consoles', c: '4', p: '6', cmd: 'All 7' },
          { category: 'Employees', c: '5', p: '15', cmd: 'Unlimited' },
          { category: '', c: '', p: '', cmd: '' },
          { category: 'Message Aura (Text)', c: 'Yes', p: 'Yes', cmd: 'Yes' },
          { category: 'Talk to Aura (Voice)', c: 'Yes', p: 'Yes', cmd: 'Yes' },
          { category: 'Online Booking', c: 'Yes', p: 'Yes', cmd: 'Yes' },
          { category: 'Customer Portal', c: 'Yes', p: 'Yes', cmd: 'Yes' },
          { category: 'Field Operations', c: '-', p: 'Yes', cmd: 'Yes' },
          { category: 'Business Ops', c: '-', p: 'Yes', cmd: 'Yes' },
          { category: 'Marketing Console', c: 'Yes', p: 'Yes', cmd: 'Yes' },
          { category: 'Analytics Console', c: '-', p: '-', cmd: 'Yes' },
          { category: 'AI Operatives Hub', c: '-', p: '-', cmd: 'Yes' },
        ].map((row, i) => (
          <View key={i} style={row.category === '' ? { height: 6 } : (i % 2 === 0 ? styles.tableRow : styles.tableRowAlt)}>
            {row.category !== '' && (
              <>
                <Text style={[styles.tableCellLeft, { flex: 2.5, fontWeight: row.category.includes('Price') || row.category.includes('Savings') ? 700 : 400 }]}>{row.category}</Text>
                <Text style={[styles.tableCell, { flex: 1 }]}>{row.c}</Text>
                <Text style={[styles.tableCell, { flex: 1 }]}>{row.p}</Text>
                <Text style={[styles.tableCell, { flex: 1 }]}>{row.cmd}</Text>
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

    {/* Aura Connect Tier */}
    <Page size="A4" style={styles.page}>
      <Header title="Aura Intercept - Pricing Guide" />
      <Text style={styles.sectionTitle}>Aura Connect Tier</Text>
      <View style={styles.pricingCard}>
        <Text style={{ fontSize: 9, color: colors.green, fontWeight: 700, marginBottom: 4 }}>SOLO OPERATORS & SMALL BUSINESSES</Text>
        <Text style={styles.pricingTierName}>Aura Connect</Text>
        <Text style={styles.pricingPrice}>$297/month</Text>
        <Text style={styles.pricingAnnual}>or $2,970/year (billed annually)</Text>
        <Text style={styles.pricingSavings}>Save $594 with annual billing</Text>
        <Text style={{ fontSize: 10, fontWeight: 600, marginBottom: 8 }}>Best For:</Text>
        <Text style={{ fontSize: 9, color: colors.gray, marginBottom: 12 }}>{connect.bestFor}</Text>
      </View>
      <Text style={styles.subsectionTitle}>Included AI Operatives (5)</Text>
      <View style={styles.featureList}>
        <FeatureItem>AI Receptionist (Triage) - 24/7 customer engagement and routing</FeatureItem>
        <FeatureItem>Customer Journey - Booking, follow-ups, review collection</FeatureItem>
        <FeatureItem>Outreach - Campaign creation, lead management, marketing</FeatureItem>
        <FeatureItem>Creative Content - Multi-channel content generation</FeatureItem>
        <FeatureItem>Web Presence - AI website builder and SEO</FeatureItem>
      </View>
      <Text style={styles.subsectionTitle}>Consoles (4)</Text>
      <View style={styles.featureList}>
        <FeatureItem>Customer Portal Console</FeatureItem>
        <FeatureItem>Outreach & Sales Ops Console</FeatureItem>
        <FeatureItem>Social Media Ops Console</FeatureItem>
        <FeatureItem>Creative & Web Presence Console</FeatureItem>
      </View>
      <Text style={styles.subsectionTitle}>Platform Features</Text>
      <View style={styles.featureList}>
        <FeatureItem>Message Aura (Text) + Talk to Aura (Voice)</FeatureItem>
        <FeatureItem>SMS/Email appointment reminders</FeatureItem>
        <FeatureItem>5 employee accounts included</FeatureItem>
        <FeatureItem>$299 implementation fee</FeatureItem>
      </View>
      <View style={styles.footer}>
        <Text>Aura Intercept - AI-Powered Service Platform</Text>
        <Text render={({ pageNumber }) => `Page ${pageNumber}`} />
      </View>
    </Page>

    {/* Aura Performance Tier */}
    <Page size="A4" style={styles.page}>
      <Header title="Aura Intercept - Pricing Guide" />
      <Text style={styles.sectionTitle}>Aura Performance Tier</Text>
      <View style={styles.pricingCardHighlight}>
        <Text style={{ fontSize: 9, color: colors.accent, fontWeight: 700, marginBottom: 4 }}>MOST POPULAR</Text>
        <Text style={styles.pricingTierName}>Aura Performance</Text>
        <Text style={styles.pricingPrice}>$497/month</Text>
        <Text style={styles.pricingAnnual}>or $4,970/year (billed annually)</Text>
        <Text style={styles.pricingSavings}>Save $994 with annual billing</Text>
        <Text style={{ fontSize: 10, fontWeight: 600, marginBottom: 8 }}>Best For:</Text>
        <Text style={{ fontSize: 9, color: colors.gray, marginBottom: 12 }}>{performance.bestFor}</Text>
      </View>
      <Text style={styles.subsectionTitle}>Included AI Operatives (8)</Text>
      <View style={styles.featureList}>
        <FeatureItem>Everything in Connect (5 operatives), plus:</FeatureItem>
        <FeatureItem>Dispatch - Smart job assignment by skills and proximity</FeatureItem>
        <FeatureItem>Field Navigation - Route optimization, ETA, check-in</FeatureItem>
        <FeatureItem>Business Finance - Quoting, invoicing, inventory</FeatureItem>
      </View>
      <Text style={styles.subsectionTitle}>Consoles (6)</Text>
      <View style={styles.featureList}>
        <FeatureItem>Everything in Connect (4 consoles), plus:</FeatureItem>
        <FeatureItem>Field Operations Console</FeatureItem>
        <FeatureItem>Business Operations Console</FeatureItem>
      </View>
      <Text style={styles.subsectionTitle}>Platform Features</Text>
      <View style={styles.featureList}>
        <FeatureItem>15 employees included</FeatureItem>
        <FeatureItem>$499 implementation fee</FeatureItem>
      </View>
      <View style={styles.footer}>
        <Text>Aura Intercept - AI-Powered Service Platform</Text>
        <Text render={({ pageNumber }) => `Page ${pageNumber}`} />
      </View>
    </Page>

    {/* Aura Command Tier */}
    <Page size="A4" style={styles.page}>
      <Header title="Aura Intercept - Pricing Guide" />
      <Text style={styles.sectionTitle}>Aura Command Tier</Text>
      <View style={styles.pricingCard}>
        <Text style={{ fontSize: 9, color: colors.primary, fontWeight: 700, marginBottom: 4 }}>ENTERPRISE</Text>
        <Text style={styles.pricingTierName}>Aura Command</Text>
        <Text style={styles.pricingPrice}>$697/month</Text>
        <Text style={styles.pricingAnnual}>or $6,970/year (billed annually)</Text>
        <Text style={styles.pricingSavings}>Save $1,394 with annual billing</Text>
        <Text style={{ fontSize: 10, fontWeight: 600, marginBottom: 8 }}>Best For:</Text>
        <Text style={{ fontSize: 9, color: colors.gray, marginBottom: 12 }}>{command.bestFor}</Text>
      </View>
      <View style={styles.noticeBox}>
        <Text style={styles.noticeTitle}>Enterprise Qualification</Text>
        <Text style={styles.noticeText}>
          Aura Command is designed for service companies with large teams or multi-location
          operations. Custom implementation and onboarding included.
        </Text>
      </View>
      <Text style={styles.subsectionTitle}>Included AI Operatives (All 10)</Text>
      <Text style={styles.paragraph}>
        Full access to all 10 AI operatives: everything in Performance plus Admin and Analytics Intelligence operatives.
      </Text>
      <Text style={styles.subsectionTitle}>Consoles (All 7 + AI Operatives Hub)</Text>
      <View style={styles.featureList}>
        <FeatureItem>Everything in Performance (6 consoles), plus:</FeatureItem>
        <FeatureItem>Analytics & Reports Console - KPIs, forecasting, performance</FeatureItem>
        <FeatureItem>AI Operatives Hub - Central operative management</FeatureItem>
      </View>
      <Text style={styles.subsectionTitle}>Platform Features</Text>
      <View style={styles.featureList}>
        <FeatureItem>Unlimited employee accounts</FeatureItem>
        <FeatureItem>Multi-location support</FeatureItem>
        <FeatureItem>White-label branding</FeatureItem>
        <FeatureItem>Custom implementation</FeatureItem>
        <FeatureItem>Priority support</FeatureItem>
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
        Save by choosing annual billing (10x monthly rate). All plans include the same features
        whether you choose monthly or annual billing.
      </Text>
      <Text style={styles.subsectionTitle}>Monthly vs Annual Comparison</Text>
      <View style={styles.table}>
        <View style={styles.tableHeader}>
          <Text style={[styles.tableHeaderCell, { flex: 1.5 }]}>Tier</Text>
          <Text style={[styles.tableHeaderCell, { flex: 1 }]}>Monthly</Text>
          <Text style={[styles.tableHeaderCell, { flex: 1.2 }]}>12 Months</Text>
          <Text style={[styles.tableHeaderCell, { flex: 1 }]}>Annual</Text>
          <Text style={[styles.tableHeaderCell, { flex: 1 }]}>Savings</Text>
        </View>
        {[
          { tier: 'Aura Connect', monthly: '$297', yearlyPath: '$3,564', annual: '$2,970', savings: '$594' },
          { tier: 'Aura Performance', monthly: '$497', yearlyPath: '$5,964', annual: '$4,970', savings: '$994' },
          { tier: 'Aura Command', monthly: '$697', yearlyPath: '$8,364', annual: '$6,970', savings: '$1,394' },
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
          {'\u2022'} Significant cost savings{'\n'}
          {'\u2022'} Simplified budgeting with one annual payment{'\n'}
          {'\u2022'} Lock in your rate for 12 months{'\n'}
          {'\u2022'} Same features and support as monthly plans
        </Text>
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
        <Text style={styles.noticeTitle}>[WARNING] Important: Separate Billing</Text>
        <Text style={styles.noticeText}>
          A valid credit card is required for all 3rd party integration accounts. These services are
          billed separately from your Aura Intercept subscription.
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
      <Text style={styles.subsectionTitle}>Integration Notes</Text>
      <View style={styles.twoColumn}>
        <View style={styles.column}>
          <View style={styles.columnCard}>
            <Text style={styles.columnTitle}>Voice Features (All Tiers)</Text>
            <Text style={{ fontSize: 9, color: colors.gray, marginBottom: 8 }}>
              Required for Talk to Aura (Voice) and AI Calls:
            </Text>
            <BulletPoint>SignalWire: SMS & phone calls</BulletPoint>
            <BulletPoint>ElevenLabs: AI voice synthesis</BulletPoint>
            <BulletPoint>Available on all subscription tiers</BulletPoint>
          </View>
        </View>
        <View style={styles.column}>
          <View style={styles.columnCard}>
            <Text style={styles.columnTitle}>Content Features (Connect+)</Text>
            <Text style={{ fontSize: 9, color: colors.gray, marginBottom: 8 }}>
              Required for Social Media:
            </Text>
            <BulletPoint>Connect social accounts via OAuth</BulletPoint>
            <BulletPoint>IG, FB, LinkedIn, TikTok, GMB, SMS</BulletPoint>
            <BulletPoint>Free platform accounts required</BulletPoint>
          </View>
        </View>
      </View>
      <View style={styles.footer}>
        <Text>Aura Intercept - AI-Powered Service Platform</Text>
        <Text render={({ pageNumber }) => `Page ${pageNumber}`} />
      </View>
    </Page>

    {/* Add-Ons & Implementation Fees */}
    <Page size="A4" style={styles.page}>
      <Header title="Aura Intercept - Pricing Guide" />
      <Text style={styles.sectionTitle}>Add-Ons & Implementation Fees</Text>
      <Text style={styles.subsectionTitle}>Implementation Fees</Text>
      <View style={styles.table}>
        <View style={styles.tableHeader}>
          <Text style={[styles.tableHeaderCell, { flex: 2 }]}>Tier</Text>
          <Text style={[styles.tableHeaderCell, { flex: 1 }]}>Implementation Fee</Text>
          <Text style={[styles.tableHeaderCell, { flex: 2 }]}>Includes</Text>
        </View>
        {[
          { tier: 'Aura Connect', fee: '$299', includes: 'Onboarding, setup, training' },
          { tier: 'Aura Performance', fee: '$499', includes: 'Onboarding, setup, training' },
          { tier: 'Aura Command', fee: 'Custom', includes: 'Enterprise onboarding, custom setup' },
        ].map((row, i) => (
          <View key={i} style={i % 2 === 0 ? styles.tableRow : styles.tableRowAlt}>
            <Text style={[styles.tableCellLeft, { flex: 2, fontWeight: 600 }]}>{row.tier}</Text>
            <Text style={[styles.tableCell, { flex: 1, fontWeight: 700 }]}>{row.fee}</Text>
            <Text style={[styles.tableCellLeft, { flex: 2 }]}>{row.includes}</Text>
          </View>
        ))}
      </View>
      <View style={styles.infoBox}>
        <Text style={styles.noticeTitle}>Questions?</Text>
        <Text style={styles.noticeText}>
          Contact our sales team to discuss your specific needs and get a customized quote based on
          your expected usage patterns. Enterprise customers receive dedicated onboarding and support.
        </Text>
      </View>
      <View style={styles.footer}>
        <Text>Aura Intercept - AI-Powered Service Platform</Text>
        <Text render={({ pageNumber }) => `Page ${pageNumber}`} />
      </View>
    </Page>
  </Document>
);

export default PricingSummaryPDF;
