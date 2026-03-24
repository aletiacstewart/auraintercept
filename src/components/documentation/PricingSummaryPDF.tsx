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

const THIRD_PARTY_INTEGRATIONS = [
  { name: 'SignalWire', purpose: 'SMS & Voice Calls', cost: '$2/number + ~$0.004/SMS + ~$0.01/min', required: 'Growth+ (for Voice)' },
  { name: 'ElevenLabs', purpose: 'AI Voice Synthesis', cost: '$0-99+/month based on usage', required: 'Growth+ (for Voice)' },
  { name: 'Resend', purpose: 'Email Notifications', cost: '$0-20+/month based on volume', required: 'All Tiers' },
  { name: 'Google Calendar', purpose: 'Calendar Sync', cost: 'Free', required: 'Optional (Growth+)' },
  { name: 'Stripe', purpose: 'Invoice Payments', cost: '2.9% + $0.30/transaction', required: 'All Tiers' },
  { name: 'Social Media Accounts', purpose: 'Content Publishing', cost: 'Free (platform accounts)', required: 'Business+ (Social Media)' },
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
      <Text style={styles.coverSubtitle}>Complete 7-Tier Pricing Breakdown for AI-Powered Service Business Platform</Text>
      <View style={styles.coverStats}>
        <View style={styles.coverStat}>
          <Text style={styles.coverStatNumber}>7</Text>
          <Text style={styles.coverStatLabel}>Pricing Tiers</Text>
        </View>
        <View style={styles.coverStat}>
          <Text style={styles.coverStatNumber}>24</Text>
          <Text style={styles.coverStatLabel}>AI Operatives</Text>
        </View>
        <View style={styles.coverStat}>
          <Text style={styles.coverStatNumber}>7</Text>
          <Text style={styles.coverStatLabel}>Consoles</Text>
        </View>
        <View style={styles.coverStat}>
          <Text style={styles.coverStatNumber}>$197</Text>
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
          { title: '7-Tier Comparison Table', page: '4' },
          { title: 'Aura Starter Tier (Restaurants)', page: '5' },
          { title: 'Aura Connect Tier (Personal Assistant)', page: '6' },
          { title: 'Aura Growth Tier (Salons/Wellness)', page: '7' },
          { title: 'Aura Presence Tier (AI-Assisted Tools)', page: '8' },
          { title: 'Aura Logistics Tier Details', page: '9' },
          { title: 'Aura Performance Tier Details', page: '10' },
          { title: 'Aura Command Tier (Enterprise)', page: '11' },
          { title: 'Annual Discount Savings', page: '12' },
          { title: '3rd Party Integration Requirements', page: '13' },
          { title: 'Add-Ons & Implementation Fees', page: '14' },
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
        Aura Intercept offers seven subscription tiers designed to scale with your business needs. 
        All automated tiers include access to our AI-powered platform with varying levels of operatives, 
        consoles, and features. Save 16% with annual billing.
      </Text>

      <View style={styles.summaryGrid}>
        <View style={[styles.summaryCard, { backgroundColor: colors.amberLight }]}> 
          <Text style={{ fontSize: 10, fontWeight: 700, marginBottom: 6 }}>AURA STARTER</Text>
          <Text style={styles.summaryPrice}>${SUBSCRIPTION_TIERS.express.price}</Text>
          <Text style={styles.summaryLabel}>per month</Text>
          <Text style={{ fontSize: 8, color: colors.amber, marginTop: 4 }}>Restaurants</Text>
        </View>
        <View style={[styles.summaryCard, { backgroundColor: colors.greenLight }]}>
          <Text style={{ fontSize: 10, fontWeight: 700, marginBottom: 6 }}>AURA CONNECT</Text>
          <Text style={styles.summaryPrice}>${SUBSCRIPTION_TIERS.aura_flow.price}</Text>
          <Text style={styles.summaryLabel}>per month</Text>
          <Text style={{ fontSize: 8, color: colors.green, marginTop: 4 }}>Personal Assistant</Text>
        </View>
        <View style={[styles.summaryCard, { backgroundColor: colors.roseLight }]}>
          <Text style={{ fontSize: 10, fontWeight: 700, marginBottom: 6 }}>AURA GROWTH</Text>
          <Text style={styles.summaryPrice}>${SUBSCRIPTION_TIERS.halo.price}</Text>
          <Text style={styles.summaryLabel}>per month</Text>
          <Text style={{ fontSize: 8, color: colors.rose, marginTop: 4 }}>Salons/Wellness</Text>
        </View>
        <View style={styles.summaryCard}>
          <Text style={{ fontSize: 10, fontWeight: 700, marginBottom: 6 }}>AURA PRESENCE</Text>
          <Text style={styles.summaryPrice}>${SUBSCRIPTION_TIERS.core.price}</Text>
          <Text style={styles.summaryLabel}>per month</Text>
          <Text style={{ fontSize: 8, color: colors.gray, marginTop: 4 }}>{SUBSCRIPTION_TIERS.core.operatives} Operatives</Text>
        </View>
        <View style={styles.summaryCard}>
          <Text style={{ fontSize: 10, fontWeight: 700, marginBottom: 6 }}>AURA LOGISTICS</Text>
          <Text style={styles.summaryPrice}>${SUBSCRIPTION_TIERS.single_point.price.toLocaleString()}</Text>
          <Text style={styles.summaryLabel}>per month</Text>
          <Text style={{ fontSize: 8, color: colors.green, marginTop: 4 }}>{SUBSCRIPTION_TIERS.single_point.operatives} Operatives</Text>
        </View>
        <View style={[styles.summaryCard, { borderWidth: 2, borderColor: colors.accent }]}>
          <Text style={{ fontSize: 10, fontWeight: 700, marginBottom: 6, color: colors.accent }}>AURA PERFORMANCE</Text>
          <Text style={styles.summaryPrice}>${SUBSCRIPTION_TIERS.multi_track.price.toLocaleString()}</Text>
          <Text style={styles.summaryLabel}>per month</Text>
          <Text style={{ fontSize: 8, color: colors.green, marginTop: 4 }}>{SUBSCRIPTION_TIERS.multi_track.operatives} Operatives</Text>
        </View>
        <View style={styles.summaryCard}>
          <Text style={{ fontSize: 10, fontWeight: 700, marginBottom: 6 }}>AURA COMMAND</Text>
          <Text style={styles.summaryPrice}>${SUBSCRIPTION_TIERS.command.price.toLocaleString()}</Text>
          <Text style={styles.summaryLabel}>per month</Text>
          <Text style={{ fontSize: 8, color: colors.primary, marginTop: 4 }}>All {SUBSCRIPTION_TIERS.command.operatives} Operatives</Text>
        </View>
      </View>

      <Text style={styles.subsectionTitle}>Quick Feature Highlights</Text>
      
      <View style={styles.table}>
        <View style={styles.tableHeader}>
          <Text style={[styles.tableHeaderCell, { flex: 2 }]}>Feature</Text>
          <Text style={[styles.tableHeaderCell, { flex: 1 }]}>Starter</Text>
          <Text style={[styles.tableHeaderCell, { flex: 1 }]}>Sched</Text>
          <Text style={[styles.tableHeaderCell, { flex: 1 }]}>Growth</Text>
          <Text style={[styles.tableHeaderCell, { flex: 1 }]}>Biz</Text>
          <Text style={[styles.tableHeaderCell, { flex: 1 }]}>Field</Text>
          <Text style={[styles.tableHeaderCell, { flex: 1 }]}>Perf</Text>
          <Text style={[styles.tableHeaderCell, { flex: 1 }]}>Command</Text>
        </View>
        {[
          { feature: 'AI Operatives', express: String(SUBSCRIPTION_TIERS.express.operatives), flow: String(SUBSCRIPTION_TIERS.aura_flow.operatives), halo: String(SUBSCRIPTION_TIERS.halo.operatives), core: String(SUBSCRIPTION_TIERS.core.operatives), single: String(SUBSCRIPTION_TIERS.single_point.operatives), multi: String(SUBSCRIPTION_TIERS.multi_track.operatives), command: String(SUBSCRIPTION_TIERS.command.operatives) },
          { feature: 'Consoles', express: String(SUBSCRIPTION_TIERS.express.consoles), flow: String(SUBSCRIPTION_TIERS.aura_flow.consoles), halo: String(SUBSCRIPTION_TIERS.halo.consoles), core: String(SUBSCRIPTION_TIERS.core.consoles), single: String(SUBSCRIPTION_TIERS.single_point.consoles), multi: String(SUBSCRIPTION_TIERS.multi_track.consoles), command: String(SUBSCRIPTION_TIERS.command.consoles) },
          { feature: 'Employees', express: String(SUBSCRIPTION_TIERS.express.employees), flow: String(SUBSCRIPTION_TIERS.aura_flow.employees), halo: String(SUBSCRIPTION_TIERS.halo.employees), core: String(SUBSCRIPTION_TIERS.core.employees), single: String(SUBSCRIPTION_TIERS.single_point.employees), multi: String(SUBSCRIPTION_TIERS.multi_track.employees), command: String(SUBSCRIPTION_TIERS.command.employees) },
          { feature: 'AI Automation', express: '-', flow: 'Yes', halo: 'Yes', core: 'Yes', single: 'Yes', multi: 'Yes', command: 'Yes' },
          { feature: 'Talk to Aura (Voice)', express: SUBSCRIPTION_TIERS.express.hasVoice ? 'Yes' : '-', flow: SUBSCRIPTION_TIERS.aura_flow.hasVoice ? 'Yes' : '-', halo: SUBSCRIPTION_TIERS.halo.hasVoice ? 'Yes' : '-', core: SUBSCRIPTION_TIERS.core.hasVoice ? 'Yes' : '-', single: SUBSCRIPTION_TIERS.single_point.hasVoice ? 'Yes' : '-', multi: SUBSCRIPTION_TIERS.multi_track.hasVoice ? 'Yes' : '-', command: SUBSCRIPTION_TIERS.command.hasVoice ? 'Yes' : '-' },
          { feature: 'Online Booking', express: '-', flow: 'Calendar', halo: 'Yes', core: '-', single: '-', multi: 'Yes', command: 'Yes' },
        ].map((row, i) => (
          <View key={i} style={i % 2 === 0 ? styles.tableRow : styles.tableRowAlt}>
            <Text style={[styles.tableCellLeft, { flex: 2, fontWeight: 600 }]}>{row.feature}</Text>
            <Text style={[styles.tableCell, { flex: 1 }]}>{row.express}</Text>
            <Text style={[styles.tableCell, { flex: 1 }]}>{row.flow}</Text>
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
          All tiers include a one-time implementation fee ($299 for Aura Starter, $499 for most tiers; Custom for Aura Command).
          Annual billing saves 16% (~$800 to $12,000 depending on tier).
        </Text>
      </View>

      <View style={styles.footer}>
        <Text>Aura Intercept - AI-Powered Service Platform</Text>
        <Text render={({ pageNumber }) => `Page ${pageNumber}`} />
      </View>
    </Page>

    {/* 6-Tier Comparison Table */}
    <Page size="A4" style={styles.page}>
      <Header title="Aura Intercept - Pricing Guide" />
      <Text style={styles.sectionTitle}>Complete 7-Tier Comparison</Text>

      <View style={styles.table}>
        <View style={styles.tableHeader}>
          <Text style={[styles.tableHeaderCell, { flex: 2.5 }]}>Feature Category</Text>
          <Text style={[styles.tableHeaderCell, { flex: 1 }]}>Starter</Text>
          <Text style={[styles.tableHeaderCell, { flex: 1 }]}>Sched</Text>
          <Text style={[styles.tableHeaderCell, { flex: 1 }]}>Growth</Text>
          <Text style={[styles.tableHeaderCell, { flex: 1 }]}>Biz</Text>
          <Text style={[styles.tableHeaderCell, { flex: 1 }]}>Field</Text>
          <Text style={[styles.tableHeaderCell, { flex: 1 }]}>Perf</Text>
          <Text style={[styles.tableHeaderCell, { flex: 1 }]}>Command</Text>
        </View>
        {[
          { category: 'Monthly Price', starter: '$197', scheduling: '$397', growth: '$597', biz: '$797', field: '$1,497', perf: '$497', command: '$697' },
          { category: 'Annual Price', starter: '$1,970', scheduling: '$3,970', growth: '$5,970', biz: '$7,970', field: '$14,970', perf: '$24,970', command: '$34,970' },
          { category: 'Annual Savings', starter: '~$394', scheduling: '~$794', growth: '~$1,194', biz: '~$1,594', field: '~$2,994', perf: '~$4,994', command: '~$6,994' },
          { category: '', starter: '', scheduling: '', growth: '', biz: '', field: '', perf: '', command: '' },
          { category: 'AI Operatives', starter: '1', scheduling: '3', growth: '11', biz: '12', field: '18', perf: '22', command: 'All 24' },
          { category: 'Consoles', starter: '0', scheduling: '1', growth: '3', biz: '4', field: '6', perf: '7', command: 'All 7' },
          { category: 'Employees', starter: '2', scheduling: '3', growth: '5', biz: '8', field: '15', perf: '25', command: '50' },
          { category: '', starter: '', scheduling: '', growth: '', biz: '', field: '', perf: '', command: '' },
          { category: 'AI Automation', starter: '-', scheduling: 'Yes', growth: 'Yes', biz: 'Yes', field: 'Yes', perf: 'Yes', command: 'Yes' },
          { category: 'Message Aura (Text)', starter: 'Yes', scheduling: 'Yes', growth: 'Yes', biz: 'Yes', field: 'Yes', perf: 'Yes', command: 'Yes' },
          { category: 'Talk to Aura (Voice)', starter: 'Yes', scheduling: 'Yes', growth: 'Yes', biz: '-', field: 'Yes', perf: 'Yes', command: 'Yes' },
          { category: 'Online Booking', starter: '-', scheduling: 'Yes', growth: 'Yes', biz: '-', field: 'Yes', perf: 'Yes', command: 'Yes' },
          { category: '', starter: '', scheduling: '', growth: '', biz: '', field: '', perf: '', command: '' },
          { category: 'Customer Portal', starter: '-', scheduling: 'Yes', growth: 'Yes', biz: 'Yes', field: 'Yes', perf: 'Yes', command: 'Yes' },
          { category: 'Field Operations', starter: '-', scheduling: '-', growth: '-', biz: '-', field: 'Yes', perf: 'Yes', command: 'Yes' },
          { category: 'Business Ops', starter: '-', scheduling: '-', growth: '-', biz: '-', field: 'Yes', perf: 'Yes', command: 'Yes' },
          { category: 'Marketing Console', starter: '-', scheduling: '-', growth: 'Yes', biz: 'Yes', field: 'Yes', perf: 'Yes', command: 'Yes' },
          { category: 'Analytics Console', starter: '-', scheduling: '-', growth: '-', biz: '-', field: '-', perf: 'Yes', command: 'Yes' },
        ].map((row, i) => (
          <View key={i} style={row.category === '' ? { height: 6 } : (i % 2 === 0 ? styles.tableRow : styles.tableRowAlt)}>
            {row.category !== '' && (
              <>
                <Text style={[styles.tableCellLeft, { flex: 2.5, fontWeight: row.category.includes('Price') || row.category.includes('Savings') ? 700 : 400 }]}>{row.category}</Text>
                <Text style={[styles.tableCell, { flex: 1, fontSize: 8 }]}>{row.starter}</Text>
                <Text style={[styles.tableCell, { flex: 1, fontSize: 8 }]}>{row.scheduling}</Text>
                <Text style={[styles.tableCell, { flex: 1, fontSize: 8 }]}>{row.growth}</Text>
                <Text style={[styles.tableCell, { flex: 1, fontSize: 8 }]}>{row.biz}</Text>
                <Text style={[styles.tableCell, { flex: 1, fontSize: 8 }]}>{row.field}</Text>
                <Text style={[styles.tableCell, { flex: 1, fontSize: 8 }]}>{row.perf}</Text>
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

    {/* Aura Starter Tier */}
    <Page size="A4" style={styles.page}>
      <Header title="Aura Intercept - Pricing Guide" />
      <Text style={styles.sectionTitle}>Aura Starter Tier</Text>

      <View style={[styles.pricingCard, { backgroundColor: colors.amberLight, borderLeftColor: colors.amber }]}>
        <Text style={{ fontSize: 9, color: colors.amber, fontWeight: 700, marginBottom: 4 }}>RESTAURANTS & CAFES</Text>
        <Text style={styles.pricingTierName}>Aura Starter</Text>
        <Text style={styles.pricingPrice}>$197/month</Text>
        <Text style={styles.pricingAnnual}>or $1,970/year (billed annually)</Text>
        <Text style={styles.pricingSavings}>Save ~$400 with annual billing</Text>

        <Text style={{ fontSize: 10, fontWeight: 600, marginBottom: 8 }}>Best For:</Text>
        <Text style={{ fontSize: 9, color: colors.gray, marginBottom: 12 }}>
          {SUBSCRIPTION_TIERS.express.bestFor}
        </Text>
      </View>

      <Text style={styles.subsectionTitle}>Included Tools</Text>
      <View style={styles.featureList}>
        <FeatureItem>Message Aura (Text) - embedded chat for website visitors</FeatureItem>
        <FeatureItem>Talk to Aura (Voice) - voice conversations (requires ElevenLabs + SignalWire)</FeatureItem>
        <FeatureItem>Smart Link Sharing - website, menu, ordering links</FeatureItem>
        <FeatureItem>Knowledge Base for FAQs</FeatureItem>
      </View>

      <View style={styles.noticeBox}>
        <Text style={styles.noticeTitle}>Designed for Restaurants</Text>
        <Text style={styles.noticeText}>
          Aura Starter focuses on fast customer responses and link sharing (menu + ordering) without full automation workflows.
        </Text>
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

      <View style={[styles.pricingCard, { backgroundColor: colors.greenLight, borderLeftColor: colors.green }]}>
        <Text style={{ fontSize: 9, color: colors.green, fontWeight: 700, marginBottom: 4 }}>PERSONAL ASSISTANT</Text>
        <Text style={styles.pricingTierName}>Aura Connect</Text>
        <Text style={styles.pricingPrice}>$397/month</Text>
        <Text style={styles.pricingAnnual}>or $3,970/year (billed annually)</Text>
        <Text style={styles.pricingSavings}>Save ~$794 with annual billing</Text>
        
        <Text style={{ fontSize: 10, fontWeight: 600, marginBottom: 8 }}>Best For:</Text>
        <Text style={{ fontSize: 9, color: colors.gray, marginBottom: 12 }}>
          {SUBSCRIPTION_TIERS.aura_flow.bestFor}
        </Text>
      </View>

      <Text style={styles.subsectionTitle}>Included AI Operatives (3)</Text>
      <View style={styles.featureList}>
        <FeatureItem>AI Receptionist - 24/7 customer engagement and triage</FeatureItem>
        <FeatureItem>Scheduling Agent - Online appointment booking with calendar sync</FeatureItem>
        <FeatureItem>Follow-up Agent - SMS/Email confirmations and reminders</FeatureItem>
      </View>

      <Text style={styles.subsectionTitle}>Console (1)</Text>
      <View style={styles.featureList}>
        <FeatureItem>Customer Portal Console - Self-service booking and management</FeatureItem>
      </View>

      <Text style={styles.subsectionTitle}>Platform Features</Text>
      <View style={styles.featureList}>
        <FeatureItem>Message Aura (Text)</FeatureItem>
        <FeatureItem>Talk to Aura (Voice) - requires ElevenLabs + SignalWire</FeatureItem>
        <FeatureItem>SMS/Email appointment reminders</FeatureItem>
        <FeatureItem>3 employee accounts included</FeatureItem>
        <FeatureItem>$499 implementation fee</FeatureItem>
      </View>

      <View style={styles.footer}>
        <Text>Aura Intercept - AI-Powered Service Platform</Text>
        <Text render={({ pageNumber }) => `Page ${pageNumber}`} />
      </View>
    </Page>

    {/* Aura Growth Tier */}
    <Page size="A4" style={styles.page}>
      <Header title="Aura Intercept - Pricing Guide" />
      <Text style={styles.sectionTitle}>Aura Growth Tier</Text>

      <View style={styles.pricingCardRose}>
        <Text style={{ fontSize: 9, color: colors.rose, fontWeight: 700, marginBottom: 4 }}>SALONS & WELLNESS</Text>
        <Text style={styles.pricingTierName}>Aura Growth</Text>
        <Text style={styles.pricingPrice}>$597/month</Text>
        <Text style={styles.pricingAnnual}>or $5,970/year (billed annually)</Text>
        <Text style={styles.pricingSavings}>Save ~$1,194 with annual billing</Text>
        
        <Text style={{ fontSize: 10, fontWeight: 600, marginBottom: 8 }}>Best For:</Text>
        <Text style={{ fontSize: 9, color: colors.gray, marginBottom: 12 }}>
          {SUBSCRIPTION_TIERS.halo.bestFor}
        </Text>
      </View>

      <Text style={styles.subsectionTitle}>Included AI Operatives (11)</Text>
      <View style={styles.featureList}>
        <FeatureItem>AI Receptionist, Scheduling, Follow-up Agents</FeatureItem>
        <FeatureItem>Review, Campaign, Lead, Marketing Agents</FeatureItem>
        <FeatureItem>Social Media, Social Scheduler, Social Analytics Agents</FeatureItem>
        <FeatureItem>Creative Agent</FeatureItem>
      </View>

      <Text style={styles.subsectionTitle}>Consoles (3)</Text>
      <View style={styles.featureList}>
        <FeatureItem>Customer Portal Console</FeatureItem>
        <FeatureItem>Outreach & Sales Ops Console</FeatureItem>
        <FeatureItem>Social Media Console</FeatureItem>
      </View>

      <Text style={styles.subsectionTitle}>Platform Features</Text>
      <View style={styles.featureList}>
        <FeatureItem>Message Aura (Text) + Talk to Aura (Voice)</FeatureItem>
        <FeatureItem>Marketing Automation + Social Media</FeatureItem>
        <FeatureItem>5 employee accounts included</FeatureItem>
        <FeatureItem>$499 implementation fee</FeatureItem>
      </View>

      <View style={styles.footer}>
        <Text>Aura Intercept - AI-Powered Service Platform</Text>
        <Text render={({ pageNumber }) => `Page ${pageNumber}`} />
      </View>
    </Page>

    {/* Aura Presence Tier */}
    <Page size="A4" style={styles.page}>
      <Header title="Aura Intercept - Pricing Guide" />
      <Text style={styles.sectionTitle}>Aura Presence Tier</Text>

      <View style={styles.pricingCard}>
        <Text style={{ fontSize: 9, color: colors.gray, fontWeight: 700, marginBottom: 4 }}>CREATIVE & WEB PRESENCE FOCUS</Text>
        <Text style={styles.pricingTierName}>Aura Presence</Text>
        <Text style={styles.pricingPrice}>${SUBSCRIPTION_TIERS.core.price}/month</Text>
        <Text style={styles.pricingAnnual}>or ${SUBSCRIPTION_TIERS.core.annualPrice.toLocaleString()}/year (billed annually)</Text>
        <Text style={styles.pricingSavings}>Save ~${SUBSCRIPTION_TIERS.core.annualSavings.toLocaleString()} with annual billing</Text>
        
        <Text style={{ fontSize: 10, fontWeight: 600, marginBottom: 8 }}>Best For:</Text>
        <Text style={{ fontSize: 9, color: colors.gray, marginBottom: 12 }}>
          {SUBSCRIPTION_TIERS.core.bestFor}
        </Text>
      </View>

      <Text style={styles.subsectionTitle}>Included AI Operatives ({SUBSCRIPTION_TIERS.core.operatives})</Text>
      <View style={styles.featureList}>
        <FeatureItem>Message Aura (Text) - AI chat for customer inquiries</FeatureItem>
        <FeatureItem>Talk to Aura (Voice) - Speech-based AI conversations</FeatureItem>
        <FeatureItem>SMS & Email Reminders - Automated customer notifications</FeatureItem>
        <FeatureItem>Social Media Console - AI content creation for 6 platforms</FeatureItem>
        <FeatureItem>Web Presence Console - 1-page professional website</FeatureItem>
        <FeatureItem>Creative Agent - Unified content generation</FeatureItem>
      </View>

      <Text style={styles.subsectionTitle}>Included Consoles ({SUBSCRIPTION_TIERS.core.consoles})</Text>
      <View style={styles.featureList}>
        <FeatureItem>Social Media Console</FeatureItem>
        <FeatureItem>Web Presence Console</FeatureItem>
        <FeatureItem>Creative Console</FeatureItem>
      </View>

      <View style={styles.infoBox}>
        <Text style={styles.noticeTitle}>Creative & Web Presence Tier</Text>
        <Text style={styles.noticeText}>
          Aura Presence includes {SUBSCRIPTION_TIERS.core.operatives} operatives and {SUBSCRIPTION_TIERS.core.consoles} consoles with full voice, SMS, and email capabilities. 
          This tier is designed for businesses that want AI-powered content, digital presence tools, and complete communication channels.
        </Text>
      </View>

      <Text style={styles.subsectionTitle}>Not Included in This Tier</Text>
      <View style={styles.featureList}>
        <FeatureItem>No Customer Portal Console</FeatureItem>
        <FeatureItem>No automated scheduling or follow-ups</FeatureItem>
        <FeatureItem>No Field Operations</FeatureItem>
      </View>

      <Text style={styles.subsectionTitle}>Platform Features</Text>
      <View style={styles.featureList}>
        <FeatureItem>{`${SUBSCRIPTION_TIERS.core.employees} employee accounts included`}</FeatureItem>
        <FeatureItem>{`$${SUBSCRIPTION_TIERS.core.implementationFee} implementation fee`}</FeatureItem>
      </View>

      <View style={styles.footer}>
        <Text>Aura Intercept - AI-Powered Service Platform</Text>
        <Text render={({ pageNumber }) => `Page ${pageNumber}`} />
      </View>
    </Page>

    {/* Aura Logistics Tier */}
    <Page size="A4" style={styles.page}>
      <Header title="Aura Intercept - Pricing Guide" />
      <Text style={styles.sectionTitle}>Aura Logistics Tier</Text>

      <View style={styles.pricingCard}>
        <Text style={styles.pricingTierName}>Aura Logistics</Text>
        <Text style={styles.pricingPrice}>$1,497/month</Text>
        <Text style={styles.pricingAnnual}>or $14,970/year (billed annually)</Text>
        <Text style={styles.pricingSavings}>Save ~$2,994 with annual billing</Text>
        
        <Text style={{ fontSize: 10, fontWeight: 600, marginBottom: 8 }}>Best For:</Text>
        <Text style={{ fontSize: 9, color: colors.gray, marginBottom: 12 }}>
          {SUBSCRIPTION_TIERS.single_point.bestFor}
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
        <FeatureItem>Message Aura (Text)</FeatureItem>
        <FeatureItem>Talk to Aura (Voice) - requires ElevenLabs</FeatureItem>
        <FeatureItem>AI Outbound Calls for reminders - requires SignalWire</FeatureItem>
        <FeatureItem>Choice of Social Media OR Web Presence (included)</FeatureItem>
        <FeatureItem>5 employees included ($25/month per 10 additional)</FeatureItem>
        <FeatureItem>Call to Book (no online scheduling - use Aura Performance for that)</FeatureItem>
        <FeatureItem>$499 implementation fee</FeatureItem>
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
        <Text style={styles.pricingAnnual}>or $24,970/year (billed annually)</Text>
        <Text style={styles.pricingSavings}>Save ~$4,994 with annual billing</Text>
        
        <Text style={{ fontSize: 10, fontWeight: 600, marginBottom: 8 }}>Best For:</Text>
        <Text style={{ fontSize: 9, color: colors.gray, marginBottom: 12 }}>
          {SUBSCRIPTION_TIERS.multi_track.bestFor}
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

    {/* Aura Command Tier */}
    <Page size="A4" style={styles.page}>
      <Header title="Aura Intercept - Pricing Guide" />
      <Text style={styles.sectionTitle}>Aura Command Tier</Text>

      <View style={styles.pricingCard}>
        <Text style={{ fontSize: 9, color: colors.primary, fontWeight: 700, marginBottom: 4 }}>ENTERPRISE</Text>
        <Text style={styles.pricingTierName}>Aura Command</Text>
        <Text style={styles.pricingPrice}>$697/month</Text>
        <Text style={styles.pricingAnnual}>or $34,970/year (billed annually)</Text>
        <Text style={styles.pricingSavings}>Save ~$6,994 with annual billing</Text>
        
        <Text style={{ fontSize: 10, fontWeight: 600, marginBottom: 8 }}>Best For:</Text>
        <Text style={{ fontSize: 9, color: colors.gray, marginBottom: 12 }}>
          {SUBSCRIPTION_TIERS.command.bestFor}
        </Text>
      </View>

      <View style={styles.noticeBox}>
        <Text style={styles.noticeTitle}>Enterprise Qualification</Text>
        <Text style={styles.noticeText}>
          Aura Command is designed for service companies with 15+ technicians or multi-location 
          operations. Custom implementation and onboarding included. Contact sales for consultation.
        </Text>
      </View>

      <Text style={styles.subsectionTitle}>Included AI Operatives (All 24)</Text>
      <Text style={styles.paragraph}>
        Full access to all 24 AI operatives including Customer Portal (4), Field Operations (4), 
        Business Management (4), Outreach & Sales Ops (3), Social Media & Web Presence (5), and Analytics (4) operatives.
      </Text>

      <Text style={styles.subsectionTitle}>Consoles (All 7)</Text>
      <View style={styles.featureList}>
        <FeatureItem>Customer Portal Console - Complete self-service experience</FeatureItem>
        <FeatureItem>Field Operations Console - Full dispatch and routing</FeatureItem>
        <FeatureItem>Business Operations Console - Invoicing, inventory management</FeatureItem>
        <FeatureItem>Outreach & Sales Ops Console - Campaigns, leads, referrals</FeatureItem>
        <FeatureItem>Social Media Ops Console - 6-platform content management</FeatureItem>
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
          { tier: 'Aura Growth', monthly: '$397', yearlyPath: '$4,764', annual: '$3,970', savings: '~$800' },
          { tier: 'Aura Presence', monthly: '$797', yearlyPath: '$9,564', annual: '$7,970', savings: '~$1,594' },
          { tier: 'Aura Logistics', monthly: '$1,497', yearlyPath: '$17,964', annual: '$14,970', savings: '~$2,994' },
          { tier: 'Aura Performance', monthly: '$497', yearlyPath: '$5,964', annual: '$4,970', savings: '~$994' },
          { tier: 'Aura Command', monthly: '$697', yearlyPath: '$8,364', annual: '$6,970', savings: '~$1,394' },
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
            <Text style={styles.columnTitle}>Content Features (Business+)</Text>
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

      <Text style={styles.subsectionTitle}>Premium Add-Ons</Text>
      <Text style={styles.paragraph}>
        Available for Aura Logistics and Aura Performance tiers. Command tier includes all features.
      </Text>

      <View style={styles.table}>
        <View style={styles.tableHeader}>
          <Text style={[styles.tableHeaderCell, { flex: 2 }]}>Add-On</Text>
          <Text style={[styles.tableHeaderCell, { flex: 1 }]}>Monthly Price</Text>
          <Text style={[styles.tableHeaderCell, { flex: 2 }]}>Description</Text>
        </View>
        {[
          { addon: 'Social Media', price: '$150/mo', desc: 'AI content creation for 6 platforms' },
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
          { tier: 'Aura Growth', fee: '$499', includes: 'Onboarding, setup, training' },
          { tier: 'Aura Presence', fee: '$499', includes: 'Onboarding, setup, training' },
          { tier: 'Aura Logistics', fee: '$499', includes: 'Onboarding, setup, training' },
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
