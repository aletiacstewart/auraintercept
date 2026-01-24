import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
} from '@react-pdf/renderer';
import { sanitizePdfText } from './pdfSanitize';

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
  pricingCardRose: {
    backgroundColor: colors.roseLight,
    padding: 16,
    marginBottom: 12,
    borderRadius: 4,
    borderLeftWidth: 4,
    borderLeftColor: colors.rose,
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
  summaryGrid: {
    flexDirection: 'row',
    gap: 8,
    marginVertical: 12,
    flexWrap: 'wrap',
  },
  summaryCard: {
    flex: 1,
    minWidth: 90,
    backgroundColor: colors.lightGray,
    padding: 10,
    borderRadius: 4,
    alignItems: 'center',
  },
  summaryPrice: {
    fontSize: 16,
    fontWeight: 700,
    color: colors.primary,
    marginBottom: 4,
  },
  summaryLabel: {
    fontSize: 9,
    color: colors.gray,
    textAlign: 'center',
  },
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

// Updated 5-Tier subscription data
const SUBSCRIPTION_TIERS = {
  halo: {
    name: 'Aura Halo',
    monthlyPrice: 397,
    annualPrice: 3970,
    annualSavings: 794,
    implementationFee: 499,
    operatives: 4,
    consoles: 1,
    employees: 3,
    bestFor: 'Nail salons, hair salons, barbers, massage centers, spas, and wellness businesses.',
    hasVoice: true,
    hasAutomation: true,
  },
  core: {
    name: 'Aura Core',
    monthlyPrice: 500,
    annualPrice: 5000,
    annualSavings: 1000,
    implementationFee: 499,
    operatives: 0,
    consoles: 0,
    employees: 2,
    bestFor: 'Businesses wanting AI-ready tools (Talk to Aura, Social Media Signal, Web Presence) without automated workflows.',
    hasVoice: false,
    hasAutomation: false,
  },
  singlePoint: {
    name: 'Single-Point',
    monthlyPrice: 1500,
    annualPrice: 15000,
    annualSavings: 3000,
    implementationFee: 499,
    operatives: 3,
    consoles: 1,
    employees: 5,
    bestFor: 'Small service companies focused on lead capture, reputation management, and AI voice/chat engagement.',
    hasVoice: true,
    hasAutomation: true,
  },
  multiTrack: {
    name: 'Multi-Track',
    monthlyPrice: 3997,
    annualPrice: 39970,
    annualSavings: 7994,
    implementationFee: 499,
    operatives: 10,
    consoles: 2,
    employees: 10,
    bestFor: 'Growing companies with field technicians needing dispatch automation, online booking, and route optimization.',
    hasVoice: true,
    hasAutomation: true,
  },
  command: {
    name: 'Aura Pro Command',
    monthlyPrice: 6997,
    annualPrice: 69970,
    annualSavings: 13994,
    implementationFee: 'Custom',
    operatives: 23,
    consoles: 7,
    employees: 25,
    bestFor: 'Large service companies with 15+ technicians or multi-location operations requiring full enterprise automation.',
    hasVoice: true,
    hasAutomation: true,
    isEnterprise: true,
  },
};

const THIRD_PARTY_INTEGRATIONS = [
  { name: 'Twilio', purpose: 'SMS & Voice Calls', cost: '$1.15/number + ~$30-100/mo usage', required: 'Halo+ (for Voice)' },
  { name: 'ElevenLabs', purpose: 'AI Voice Synthesis', cost: '$0-99+/month based on usage', required: 'Halo+ (for Voice)' },
  { name: 'Resend', purpose: 'Email Notifications', cost: '$0-20+/month based on volume', required: 'All Tiers' },
  { name: 'Google Calendar', purpose: 'Calendar Sync', cost: 'Free', required: 'Optional (Halo+)' },
  { name: 'Stripe', purpose: 'Invoice Payments', cost: '2.9% + $0.30/transaction', required: 'All Tiers' },
  { name: 'Social Media Accounts', purpose: 'Content Publishing', cost: 'Free (platform accounts)', required: 'Core+ (Social Signal)' },
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

const PricingSummaryPDF = () => (
  <Document>
    {/* Cover Page */}
    <Page size="A4" style={styles.coverPage}>
      <Text style={styles.coverBrand}>AURA INTERCEPT</Text>
      <Text style={styles.coverTitle}>Subscription Pricing Guide</Text>
      <Text style={styles.coverSubtitle}>Complete 5-Tier Pricing Breakdown for AI-Powered Service Business Platform</Text>
      <View style={styles.coverStats}>
        <View style={styles.coverStat}>
          <Text style={styles.coverStatNumber}>5</Text>
          <Text style={styles.coverStatLabel}>Pricing Tiers</Text>
        </View>
        <View style={styles.coverStat}>
          <Text style={styles.coverStatNumber}>23</Text>
          <Text style={styles.coverStatLabel}>AI Operatives</Text>
        </View>
        <View style={styles.coverStat}>
          <Text style={styles.coverStatNumber}>7</Text>
          <Text style={styles.coverStatLabel}>Consoles</Text>
        </View>
        <View style={styles.coverStat}>
          <Text style={styles.coverStatNumber}>$397</Text>
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
          { title: '5-Tier Comparison Table', page: '4' },
          { title: 'Aura Halo Tier (Salons/Wellness)', page: '5' },
          { title: 'Aura Core Tier (AI-Assisted Tools)', page: '6' },
          { title: 'Single-Point Tier Details', page: '7' },
          { title: 'Multi-Track Tier Details', page: '8' },
          { title: 'Aura Pro Command Tier (Enterprise)', page: '9' },
          { title: 'Annual Discount Savings', page: '10' },
          { title: '3rd Party Integration Requirements', page: '11' },
          { title: 'Add-Ons & Implementation Fees', page: '12' },
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
        Aura Intercept offers five subscription tiers designed to scale with your business needs. 
        All automated tiers include access to our AI-powered platform with varying levels of operatives, 
        consoles, and features. Save 16% with annual billing.
      </Text>

      <View style={styles.summaryGrid}>
        <View style={[styles.summaryCard, { backgroundColor: colors.roseLight }]}>
          <Text style={{ fontSize: 10, fontWeight: 700, marginBottom: 6 }}>AURA HALO</Text>
          <Text style={styles.summaryPrice}>$397</Text>
          <Text style={styles.summaryLabel}>per month</Text>
          <Text style={{ fontSize: 8, color: colors.rose, marginTop: 4 }}>Salons/Wellness</Text>
        </View>
        <View style={styles.summaryCard}>
          <Text style={{ fontSize: 10, fontWeight: 700, marginBottom: 6 }}>AURA CORE</Text>
          <Text style={styles.summaryPrice}>$500</Text>
          <Text style={styles.summaryLabel}>per month</Text>
          <Text style={{ fontSize: 8, color: colors.gray, marginTop: 4 }}>Tools Only</Text>
        </View>
        <View style={styles.summaryCard}>
          <Text style={{ fontSize: 10, fontWeight: 700, marginBottom: 6 }}>SINGLE-POINT</Text>
          <Text style={styles.summaryPrice}>$1,500</Text>
          <Text style={styles.summaryLabel}>per month</Text>
          <Text style={{ fontSize: 8, color: colors.green, marginTop: 4 }}>AI-Automated</Text>
        </View>
        <View style={[styles.summaryCard, { borderWidth: 2, borderColor: colors.accent }]}>
          <Text style={{ fontSize: 10, fontWeight: 700, marginBottom: 6, color: colors.accent }}>MULTI-TRACK</Text>
          <Text style={styles.summaryPrice}>$3,997</Text>
          <Text style={styles.summaryLabel}>per month</Text>
          <Text style={{ fontSize: 8, color: colors.green, marginTop: 4 }}>Popular</Text>
        </View>
        <View style={styles.summaryCard}>
          <Text style={{ fontSize: 10, fontWeight: 700, marginBottom: 6 }}>PRO COMMAND</Text>
          <Text style={styles.summaryPrice}>$6,997</Text>
          <Text style={styles.summaryLabel}>per month</Text>
          <Text style={{ fontSize: 8, color: colors.primary, marginTop: 4 }}>Enterprise</Text>
        </View>
      </View>

      <Text style={styles.subsectionTitle}>Quick Feature Highlights</Text>
      
      <View style={styles.table}>
        <View style={styles.tableHeader}>
          <Text style={[styles.tableHeaderCell, { flex: 2 }]}>Feature</Text>
          <Text style={[styles.tableHeaderCell, { flex: 1 }]}>Halo</Text>
          <Text style={[styles.tableHeaderCell, { flex: 1 }]}>Core</Text>
          <Text style={[styles.tableHeaderCell, { flex: 1 }]}>Single</Text>
          <Text style={[styles.tableHeaderCell, { flex: 1 }]}>Multi</Text>
          <Text style={[styles.tableHeaderCell, { flex: 1 }]}>Command</Text>
        </View>
        {[
          { feature: 'AI Operatives', halo: '4', core: '0', single: '3', multi: '10', command: '23' },
          { feature: 'Consoles', halo: '1', core: '0', single: '1', multi: '2', command: '7' },
          { feature: 'Employees', halo: '3', core: '2', single: '5', multi: '10', command: '25' },
          { feature: 'AI Automation', halo: 'Yes', core: '-', single: 'Yes', multi: 'Yes', command: 'Yes' },
          { feature: 'Proxy Voice Chat', halo: 'Yes', core: '-', single: 'Yes', multi: 'Yes', command: 'Yes' },
          { feature: 'Online Booking', halo: 'Yes', core: '-', single: '-', multi: 'Yes', command: 'Yes' },
        ].map((row, i) => (
          <View key={i} style={i % 2 === 0 ? styles.tableRow : styles.tableRowAlt}>
            <Text style={[styles.tableCellLeft, { flex: 2, fontWeight: 600 }]}>{row.feature}</Text>
            <Text style={[styles.tableCell, { flex: 1 }]}>{row.halo}</Text>
            <Text style={[styles.tableCell, { flex: 1 }]}>{row.core}</Text>
            <Text style={[styles.tableCell, { flex: 1 }]}>{row.single}</Text>
            <Text style={[styles.tableCell, { flex: 1 }]}>{row.multi}</Text>
            <Text style={[styles.tableCell, { flex: 1 }]}>{row.command}</Text>
          </View>
        ))}
      </View>

      <View style={styles.infoBox}>
        <Text style={styles.noticeTitle}>Implementation Fees</Text>
        <Text style={styles.noticeText}>
          All tiers include a one-time $499 implementation fee (Custom for Aura Pro Command).
          Annual billing saves 16% (~$800 to $14,000 depending on tier).
        </Text>
      </View>

      <View style={styles.footer}>
        <Text>Aura Intercept - AI-Powered Service Platform</Text>
        <Text render={({ pageNumber }) => `Page ${pageNumber}`} />
      </View>
    </Page>

    {/* 5-Tier Comparison Table */}
    <Page size="A4" style={styles.page}>
      <Header title="Aura Intercept - Pricing Guide" />
      <Text style={styles.sectionTitle}>Complete 5-Tier Comparison</Text>

      <View style={styles.table}>
        <View style={styles.tableHeader}>
          <Text style={[styles.tableHeaderCell, { flex: 2.5 }]}>Feature Category</Text>
          <Text style={[styles.tableHeaderCell, { flex: 1 }]}>Halo</Text>
          <Text style={[styles.tableHeaderCell, { flex: 1 }]}>Core</Text>
          <Text style={[styles.tableHeaderCell, { flex: 1 }]}>Single</Text>
          <Text style={[styles.tableHeaderCell, { flex: 1 }]}>Multi</Text>
          <Text style={[styles.tableHeaderCell, { flex: 1 }]}>Command</Text>
        </View>
        {[
          { category: 'Monthly Price', halo: '$397', core: '$500', single: '$1,500', multi: '$3,997', command: '$6,997' },
          { category: 'Annual Price', halo: '$3,970', core: '$5,000', single: '$15,000', multi: '$39,970', command: '$69,970' },
          { category: 'Annual Savings', halo: '~$800', core: '~$1,000', single: '~$3,000', multi: '~$8,000', command: '~$14,000' },
          { category: '', halo: '', core: '', single: '', multi: '', command: '' },
          { category: 'AI Operatives', halo: '4', core: '0', single: '3', multi: '10', command: 'All 23' },
          { category: 'Consoles', halo: '1', core: '0', single: '1', multi: '2', command: 'All 7' },
          { category: 'Employees', halo: '3', core: '2', single: '5', multi: '10', command: '25' },
          { category: '', halo: '', core: '', single: '', multi: '', command: '' },
          { category: 'AI Automation', halo: 'Yes', core: '-', single: 'Yes', multi: 'Yes', command: 'Yes' },
          { category: 'Talk to Aura (Text)', halo: 'Yes', core: 'Yes', single: 'Yes', multi: 'Yes', command: 'Yes' },
          { category: 'Proxy Voice Chat', halo: 'Yes', core: '-', single: 'Yes', multi: 'Yes', command: 'Yes' },
          { category: 'Online Booking', halo: 'Yes', core: '-', single: '-', multi: 'Yes', command: 'Yes' },
          { category: '', halo: '', core: '', single: '', multi: '', command: '' },
          { category: 'Customer Portal', halo: 'Yes', core: '-', single: 'Yes', multi: 'Yes', command: 'Yes' },
          { category: 'Field Operations', halo: '-', core: '-', single: '-', multi: 'Yes', command: 'Yes' },
          { category: 'Business Ops', halo: '-', core: '-', single: '-', multi: '-', command: 'Yes' },
          { category: 'Marketing Console', halo: '-', core: '-', single: '-', multi: '-', command: 'Yes' },
          { category: 'Analytics Console', halo: '-', core: '-', single: '-', multi: '-', command: 'Yes' },
        ].map((row, i) => (
          <View key={i} style={row.category === '' ? { height: 6 } : (i % 2 === 0 ? styles.tableRow : styles.tableRowAlt)}>
            {row.category !== '' && (
              <>
                <Text style={[styles.tableCellLeft, { flex: 2.5, fontWeight: row.category.includes('Price') || row.category.includes('Savings') ? 700 : 400 }]}>{row.category}</Text>
                <Text style={[styles.tableCell, { flex: 1, fontSize: 8 }]}>{row.halo}</Text>
                <Text style={[styles.tableCell, { flex: 1, fontSize: 8 }]}>{row.core}</Text>
                <Text style={[styles.tableCell, { flex: 1, fontSize: 8 }]}>{row.single}</Text>
                <Text style={[styles.tableCell, { flex: 1, fontSize: 8 }]}>{row.multi}</Text>
                <Text style={[styles.tableCell, { flex: 1, fontSize: 8 }]}>{row.command}</Text>
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

    {/* Aura Halo Tier */}
    <Page size="A4" style={styles.page}>
      <Header title="Aura Intercept - Pricing Guide" />
      <Text style={styles.sectionTitle}>Aura Halo Tier</Text>

      <View style={styles.pricingCardRose}>
        <Text style={{ fontSize: 9, color: colors.rose, fontWeight: 700, marginBottom: 4 }}>BEAUTY & WELLNESS</Text>
        <Text style={styles.pricingTierName}>Aura Halo</Text>
        <Text style={styles.pricingPrice}>$397/month</Text>
        <Text style={styles.pricingAnnual}>or $3,970/year (billed annually)</Text>
        <Text style={styles.pricingSavings}>Save ~$800 with annual billing</Text>
        
        <Text style={{ fontSize: 10, fontWeight: 600, marginBottom: 8 }}>Best For:</Text>
        <Text style={{ fontSize: 9, color: colors.gray, marginBottom: 12 }}>
          {SUBSCRIPTION_TIERS.halo.bestFor}
        </Text>
      </View>

      <Text style={styles.subsectionTitle}>Included AI Operatives (4)</Text>
      <View style={styles.featureList}>
        <FeatureItem>AI Receptionist - 24/7 customer engagement and triage</FeatureItem>
        <FeatureItem>Scheduling Agent - Online appointment booking</FeatureItem>
        <FeatureItem>Follow-up Agent - SMS/Email confirmations and reminders</FeatureItem>
        <FeatureItem>Aura Assistant - Voice and text navigation</FeatureItem>
      </View>

      <Text style={styles.subsectionTitle}>Console (1)</Text>
      <View style={styles.featureList}>
        <FeatureItem>Customer Portal Console - Self-service booking and management</FeatureItem>
      </View>

      <Text style={styles.subsectionTitle}>Platform Features</Text>
      <View style={styles.featureList}>
        <FeatureItem>Talk to Aura (Text-Based Chat)</FeatureItem>
        <FeatureItem>Proxy Voice Chat (Speech-Based) - requires ElevenLabs</FeatureItem>
        <FeatureItem>SMS/Email appointment reminders</FeatureItem>
        <FeatureItem>3 employee accounts included</FeatureItem>
        <FeatureItem>$499 implementation fee</FeatureItem>
      </View>

      <View style={styles.noticeBox}>
        <Text style={styles.noticeTitle}>Designed for Salons & Wellness</Text>
        <Text style={styles.noticeText}>
          Aura Halo is specifically designed for nail salons, hair salons, barbers, massage centers, 
          spas, and wellness businesses. It includes online booking and voice capabilities at an 
          accessible price point.
        </Text>
      </View>

      <View style={styles.footer}>
        <Text>Aura Intercept - AI-Powered Service Platform</Text>
        <Text render={({ pageNumber }) => `Page ${pageNumber}`} />
      </View>
    </Page>

    {/* Aura Core Tier */}
    <Page size="A4" style={styles.page}>
      <Header title="Aura Intercept - Pricing Guide" />
      <Text style={styles.sectionTitle}>Aura Core Tier</Text>

      <View style={styles.pricingCard}>
        <Text style={{ fontSize: 9, color: colors.gray, fontWeight: 700, marginBottom: 4 }}>AI-ASSISTED (NO AUTOMATION)</Text>
        <Text style={styles.pricingTierName}>Aura Core</Text>
        <Text style={styles.pricingPrice}>$500/month</Text>
        <Text style={styles.pricingAnnual}>or $5,000/year (billed annually)</Text>
        <Text style={styles.pricingSavings}>Save ~$1,000 with annual billing</Text>
        
        <Text style={{ fontSize: 10, fontWeight: 600, marginBottom: 8 }}>Best For:</Text>
        <Text style={{ fontSize: 9, color: colors.gray, marginBottom: 12 }}>
          {SUBSCRIPTION_TIERS.core.bestFor}
        </Text>
      </View>

      <Text style={styles.subsectionTitle}>Included AI Tools (3 Tools - No Automation)</Text>
      <View style={styles.featureList}>
        <FeatureItem>Talk to Aura (Text-Based Chat Tool) - AI chat for customer inquiries</FeatureItem>
        <FeatureItem>Social Media Signal - AI content creation for 6 platforms</FeatureItem>
        <FeatureItem>Web Presence - 1-page professional website</FeatureItem>
      </View>

      <View style={styles.noticeBox}>
        <Text style={styles.noticeTitle}>[WARNING] Important: No AI Automation</Text>
        <Text style={styles.noticeText}>
          Aura Core is an AI-assisted tier with tools that require manual operation. It does NOT 
          include automated workflows, AI operatives, or Proxy Voice Chat. All tools are manually 
          operated by your team. This tier is designed for businesses that want AI-ready tools 
          without automated customer engagement.
        </Text>
      </View>

      <Text style={styles.subsectionTitle}>What's NOT Included</Text>
      <View style={styles.featureList}>
        <FeatureItem>No AI Operatives (0 automation)</FeatureItem>
        <FeatureItem>No Consoles</FeatureItem>
        <FeatureItem>No Proxy Voice Chat - text only</FeatureItem>
        <FeatureItem>No automated follow-ups or reminders</FeatureItem>
        <FeatureItem>No automated booking</FeatureItem>
      </View>

      <Text style={styles.subsectionTitle}>Platform Features</Text>
      <View style={styles.featureList}>
        <FeatureItem>2 employee accounts included</FeatureItem>
        <FeatureItem>$499 implementation fee</FeatureItem>
        <FeatureItem>Manual workflow operation</FeatureItem>
      </View>

      <View style={styles.footer}>
        <Text>Aura Intercept - AI-Powered Service Platform</Text>
        <Text render={({ pageNumber }) => `Page ${pageNumber}`} />
      </View>
    </Page>

    {/* Single-Point Tier */}
    <Page size="A4" style={styles.page}>
      <Header title="Aura Intercept - Pricing Guide" />
      <Text style={styles.sectionTitle}>Single-Point Tier</Text>

      <View style={styles.pricingCard}>
        <Text style={styles.pricingTierName}>Single-Point</Text>
        <Text style={styles.pricingPrice}>$1,500/month</Text>
        <Text style={styles.pricingAnnual}>or $15,000/year (billed annually)</Text>
        <Text style={styles.pricingSavings}>Save ~$3,000 with annual billing</Text>
        
        <Text style={{ fontSize: 10, fontWeight: 600, marginBottom: 8 }}>Best For:</Text>
        <Text style={{ fontSize: 9, color: colors.gray, marginBottom: 12 }}>
          {SUBSCRIPTION_TIERS.singlePoint.bestFor}
        </Text>
      </View>

      <Text style={styles.subsectionTitle}>Included AI Operatives (3)</Text>
      <View style={styles.featureList}>
        <FeatureItem>AI Receptionist (Triage) - First point of contact, routes customers</FeatureItem>
        <FeatureItem>Follow-up Agent - Automated reminders via email, SMS, and voice</FeatureItem>
        <FeatureItem>Review Agent - Customer feedback collection for Google, Yelp, Facebook</FeatureItem>
      </View>

      <Text style={styles.subsectionTitle}>Console (1)</Text>
      <View style={styles.featureList}>
        <FeatureItem>Customer Portal Console - Self-service management and engagement</FeatureItem>
      </View>

      <Text style={styles.subsectionTitle}>Platform Features</Text>
      <View style={styles.featureList}>
        <FeatureItem>Talk to Aura (Text-Based Chat)</FeatureItem>
        <FeatureItem>Proxy Voice Chat (Speech-Based) - requires ElevenLabs</FeatureItem>
        <FeatureItem>AI Outbound Calls for reminders - requires Twilio</FeatureItem>
        <FeatureItem>Choice of Social Media Signal OR Web Presence (included)</FeatureItem>
        <FeatureItem>5 employees included ($25/month per 10 additional)</FeatureItem>
        <FeatureItem>Call to Book (no online scheduling - use Multi-Track for that)</FeatureItem>
        <FeatureItem>$499 implementation fee</FeatureItem>
      </View>

      <View style={styles.footer}>
        <Text>Aura Intercept - AI-Powered Service Platform</Text>
        <Text render={({ pageNumber }) => `Page ${pageNumber}`} />
      </View>
    </Page>

    {/* Multi-Track Tier */}
    <Page size="A4" style={styles.page}>
      <Header title="Aura Intercept - Pricing Guide" />
      <Text style={styles.sectionTitle}>Multi-Track Tier</Text>

      <View style={styles.pricingCardHighlight}>
        <Text style={{ fontSize: 9, color: colors.accent, fontWeight: 700, marginBottom: 4 }}>MOST POPULAR</Text>
        <Text style={styles.pricingTierName}>Multi-Track</Text>
        <Text style={styles.pricingPrice}>$3,997/month</Text>
        <Text style={styles.pricingAnnual}>or $39,970/year (billed annually)</Text>
        <Text style={styles.pricingSavings}>Save ~$8,000 with annual billing</Text>
        
        <Text style={{ fontSize: 10, fontWeight: 600, marginBottom: 8 }}>Best For:</Text>
        <Text style={{ fontSize: 9, color: colors.gray, marginBottom: 12 }}>
          {SUBSCRIPTION_TIERS.multiTrack.bestFor}
        </Text>
      </View>

      <Text style={styles.subsectionTitle}>Included AI Operatives (10)</Text>
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

      <Text style={styles.subsectionTitle}>Consoles (2)</Text>
      <View style={styles.featureList}>
        <FeatureItem>Customer Portal Console - Self-service booking and management</FeatureItem>
        <FeatureItem>Field Operations Console - Dispatch, routing, and technician management</FeatureItem>
      </View>

      <Text style={styles.subsectionTitle}>Platform Features</Text>
      <View style={styles.featureList}>
        <FeatureItem>10 employees included ($25/month per 10 additional)</FeatureItem>
        <FeatureItem>$499 implementation fee</FeatureItem>
      </View>

      <View style={styles.footer}>
        <Text>Aura Intercept - AI-Powered Service Platform</Text>
        <Text render={({ pageNumber }) => `Page ${pageNumber}`} />
      </View>
    </Page>

    {/* Aura Pro Command Tier */}
    <Page size="A4" style={styles.page}>
      <Header title="Aura Intercept - Pricing Guide" />
      <Text style={styles.sectionTitle}>Aura Pro Command Tier</Text>

      <View style={styles.pricingCard}>
        <Text style={{ fontSize: 9, color: colors.primary, fontWeight: 700, marginBottom: 4 }}>ENTERPRISE</Text>
        <Text style={styles.pricingTierName}>Aura Pro Command</Text>
        <Text style={styles.pricingPrice}>$6,997/month</Text>
        <Text style={styles.pricingAnnual}>or $69,970/year (billed annually)</Text>
        <Text style={styles.pricingSavings}>Save ~$14,000 with annual billing</Text>
        
        <Text style={{ fontSize: 10, fontWeight: 600, marginBottom: 8 }}>Best For:</Text>
        <Text style={{ fontSize: 9, color: colors.gray, marginBottom: 12 }}>
          {SUBSCRIPTION_TIERS.command.bestFor}
        </Text>
      </View>

      <View style={styles.noticeBox}>
        <Text style={styles.noticeTitle}>Enterprise Qualification</Text>
        <Text style={styles.noticeText}>
          Aura Pro Command is designed for service companies with 15+ technicians or multi-location 
          operations. Custom implementation and onboarding included. Contact sales for consultation.
        </Text>
      </View>

      <Text style={styles.subsectionTitle}>Included AI Operatives (All 23)</Text>
      <Text style={styles.paragraph}>
        Full access to all 23 AI operatives including Customer Portal (4), Field Operations (4), 
        Business Management (5), Marketing & Sales (2), Social Media Signal (3), and Analytics (4) operatives, plus Aura Assistant.
      </Text>

      <Text style={styles.subsectionTitle}>Consoles (All 7)</Text>
      <View style={styles.featureList}>
        <FeatureItem>Customer Portal Console - Complete self-service experience</FeatureItem>
        <FeatureItem>Field Operations Console - Full dispatch and routing</FeatureItem>
        <FeatureItem>Business Operations Console - Invoicing, inventory, warranties</FeatureItem>
        <FeatureItem>Marketing & Sales Console - Campaigns, leads, referrals</FeatureItem>
        <FeatureItem>Social Media Signal Ops Console - 6-platform content management</FeatureItem>
        <FeatureItem>Analytics & Reports Console - KPIs, forecasting, performance</FeatureItem>
        <FeatureItem>AI Operatives Hub - Central operative management</FeatureItem>
      </View>

      <Text style={styles.subsectionTitle}>Platform Features</Text>
      <View style={styles.featureList}>
        <FeatureItem>25 employee accounts included</FeatureItem>
        <FeatureItem>Multi-location support</FeatureItem>
        <FeatureItem>White-label branding</FeatureItem>
        <FeatureItem>Custom implementation (fee varies)</FeatureItem>
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
        Save 16% on your subscription by choosing annual billing. All plans include the same features 
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
          { tier: 'Aura Halo', monthly: '$397', yearlyPath: '$4,764', annual: '$3,970', savings: '~$800' },
          { tier: 'Aura Core', monthly: '$500', yearlyPath: '$6,000', annual: '$5,000', savings: '~$1,000' },
          { tier: 'Single-Point', monthly: '$1,500', yearlyPath: '$18,000', annual: '$15,000', savings: '~$3,000' },
          { tier: 'Multi-Track', monthly: '$3,997', yearlyPath: '$47,964', annual: '$39,970', savings: '~$8,000' },
          { tier: 'Pro Command', monthly: '$6,997', yearlyPath: '$83,964', annual: '$69,970', savings: '~$14,000' },
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
            <Text style={styles.columnTitle}>Voice Features (Halo+)</Text>
            <Text style={{ fontSize: 9, color: colors.gray, marginBottom: 8 }}>
              Required for Proxy Voice Chat and AI Calls:
            </Text>
            <BulletPoint>Twilio: SMS & phone calls</BulletPoint>
            <BulletPoint>ElevenLabs: AI voice synthesis</BulletPoint>
            <BulletPoint>Not needed for Core tier (text-only)</BulletPoint>
          </View>
        </View>
        <View style={styles.column}>
          <View style={styles.columnCard}>
            <Text style={styles.columnTitle}>Content Features (Core+)</Text>
            <Text style={{ fontSize: 9, color: colors.gray, marginBottom: 8 }}>
              Required for Social Media Signal:
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

      <Text style={styles.subsectionTitle}>Premium Add-Ons</Text>
      <Text style={styles.paragraph}>
        Available for Single-Point and Multi-Track tiers. Command tier includes all features.
      </Text>

      <View style={styles.table}>
        <View style={styles.tableHeader}>
          <Text style={[styles.tableHeaderCell, { flex: 2 }]}>Add-On</Text>
          <Text style={[styles.tableHeaderCell, { flex: 1 }]}>Monthly Price</Text>
          <Text style={[styles.tableHeaderCell, { flex: 2 }]}>Description</Text>
        </View>
        {[
          { addon: 'Social Media Signal', price: '$150/mo', desc: 'AI content creation for 6 platforms' },
          { addon: 'Web Presence', price: '$150/mo', desc: '1-page professional website' },
          { addon: 'Additional Employees', price: '$25/mo', desc: 'Per 10 additional employees' },
        ].map((row, i) => (
          <View key={i} style={i % 2 === 0 ? styles.tableRow : styles.tableRowAlt}>
            <Text style={[styles.tableCellLeft, { flex: 2, fontWeight: 600 }]}>{row.addon}</Text>
            <Text style={[styles.tableCell, { flex: 1 }]}>{row.price}</Text>
            <Text style={[styles.tableCellLeft, { flex: 2 }]}>{row.desc}</Text>
          </View>
        ))}
      </View>

      <Text style={styles.subsectionTitle}>Implementation Fees</Text>
      <View style={styles.table}>
        <View style={styles.tableHeader}>
          <Text style={[styles.tableHeaderCell, { flex: 2 }]}>Tier</Text>
          <Text style={[styles.tableHeaderCell, { flex: 1 }]}>Implementation Fee</Text>
          <Text style={[styles.tableHeaderCell, { flex: 2 }]}>Includes</Text>
        </View>
        {[
          { tier: 'Aura Halo', fee: '$499', includes: 'Onboarding, setup, training' },
          { tier: 'Aura Core', fee: '$499', includes: 'Onboarding, setup, training' },
          { tier: 'Single-Point', fee: '$499', includes: 'Onboarding, setup, training' },
          { tier: 'Multi-Track', fee: '$499', includes: 'Onboarding, setup, training' },
          { tier: 'Aura Pro Command', fee: 'Custom', includes: 'Enterprise onboarding, custom setup' },
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
