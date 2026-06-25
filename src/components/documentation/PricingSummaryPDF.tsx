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
  { name: 'SignalWire', purpose: 'SMS & Voice Calls (billed directly by SignalWire)', cost: '~$0.50/local # + SMS $0.00415/segment + Voice $0.0066/min in / $0.008/min out + AI Agent $0.16/min', required: 'All Tiers (for Voice)' },
  { name: 'A2P 10DLC', purpose: 'US SMS carrier registration (billed by SignalWire / The Campaign Registry)', cost: '$4.50 brand one-time + $1.50-$30/mo campaign + $7.50/submission DCA + $250/mo T-Mobile if inactive 60 consecutive days', required: 'All Tiers (for SMS) - 3-5 business days when clean, up to 1-2+ weeks with revisions' },
  { name: 'ElevenLabs', purpose: 'AI Voice Synthesis (billed directly by ElevenLabs)', cost: 'Free 15 min/mo - Starter $5 - Creator $22 - Pro $99 - pay-as-you-go', required: 'All Tiers (for Voice)' },
  { name: 'Resend', purpose: 'Email Notifications (billed directly by Resend)', cost: 'Free 3,000/mo - Pro $20 (50k) - Scale $90+ - then ~$0.90 per 1,000', required: 'All Tiers' },
  { name: 'Tavily', purpose: 'AI Research Engine (billed directly by Tavily)', cost: 'Free 1,000 credits/mo - then $0.008/credit - Project plans from ~$30/mo', required: 'Recommended for content-heavy businesses' },
  { name: 'Google Calendar', purpose: 'Calendar Sync', cost: 'Free', required: 'Optional (All Tiers)' },
  { name: 'Stripe', purpose: 'Invoice Payments', cost: '2.9% + $0.30/transaction', required: 'Elite (for Invoicing)' },
  { name: 'Social Media Accounts', purpose: 'Content Publishing', cost: 'Free (platform accounts)', required: 'Pro+ (Social Media)' },
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

const connect = SUBSCRIPTION_TIERS.aura_core;
const performance = SUBSCRIPTION_TIERS.aura_boost;
const pro = SUBSCRIPTION_TIERS.aura_pro;
const command = SUBSCRIPTION_TIERS.aura_elite;

const PricingSummaryPDF = () => (
  <Document>
    {/* Cover Page */}
    <Page size="A4" style={styles.coverPage}>
      <Text style={styles.coverBrand}>AURA INTERCEPT</Text>
      <Text style={styles.coverTitle}>Pricing Guide</Text>
      <Text style={styles.coverSubtitle}>4 tiers · Beta Pricing</Text>
      <View style={styles.coverStats}>
        <View style={styles.coverStat}>
          <Text style={styles.coverStatNumber}>4</Text>
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
          <Text style={styles.coverStatNumber}>$497</Text>
          <Text style={styles.coverStatLabel}>Starting Price (Beta Pricing — was $697)</Text>
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
          { title: '4-Tier Comparison Table', page: '4' },
          { title: 'Aura Core Tier Details', page: '5' },
          { title: 'Aura Boost Tier Details', page: '6' },
          { title: 'Aura Pro Tier Details', page: '7' },
          { title: 'Aura Elite Tier (Enterprise)', page: '8' },
          { title: 'Annual Discount Savings', page: '9' },
          { title: '3rd Party Integration Requirements', page: '10' },
          { title: 'Add-Ons & Implementation Fees', page: '11' },
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
      <Text style={styles.sectionTitle}>Pricing at a Glance</Text>
      <Text style={styles.paragraph}>
        Four tiers. Beta Pricing active. Annual billing saves ~20% vs monthly (billed upfront).
      </Text>
      <View style={styles.summaryGrid}>
        <View style={styles.summaryCard}>
          <Text style={{ fontSize: 10, fontWeight: 700, marginBottom: 6 }}>AURA CORE</Text>
          <Text style={styles.summaryPrice}>$497</Text>
          <Text style={styles.summaryLabel}>per month</Text>
          <Text style={{ fontSize: 8, color: colors.green, marginTop: 4 }}>4 AI Operatives · 3 Consoles</Text>
        </View>
        <View style={styles.summaryCard}>
          <Text style={{ fontSize: 10, fontWeight: 700, marginBottom: 6 }}>AURA BOOST</Text>
          <Text style={styles.summaryPrice}>$994</Text>
          <Text style={styles.summaryLabel}>per month</Text>
          <Text style={{ fontSize: 8, color: colors.green, marginTop: 4 }}>6 AI Operatives · 5 Consoles</Text>
        </View>
        <View style={[styles.summaryCard, { borderWidth: 2, borderColor: colors.accent }]}>
          <Text style={{ fontSize: 10, fontWeight: 700, marginBottom: 6, color: colors.accent }}>AURA PRO</Text>
          <Text style={styles.summaryPrice}>$1,988</Text>
          <Text style={styles.summaryLabel}>per month</Text>
          <Text style={{ fontSize: 8, color: colors.green, marginTop: 4 }}>8 AI Operatives · 5 Consoles</Text>
        </View>
        <View style={styles.summaryCard}>
          <Text style={{ fontSize: 10, fontWeight: 700, marginBottom: 6 }}>AURA ELITE</Text>
          <Text style={styles.summaryPrice}>$3,979</Text>
          <Text style={styles.summaryLabel}>per month (was $5,576)</Text>
          <Text style={{ fontSize: 8, color: colors.primary, marginTop: 4 }}>All 24 AI Operatives</Text>
        </View>
      </View>

      <Text style={styles.subsectionTitle}>Quick Feature Highlights</Text>
      <View style={styles.table}>
        <View style={styles.tableHeader}>
          <Text style={[styles.tableHeaderCell, { flex: 2 }]}>Feature</Text>
          <Text style={[styles.tableHeaderCell, { flex: 1 }]}>Core</Text>
          <Text style={[styles.tableHeaderCell, { flex: 1 }]}>Boost</Text>
          <Text style={[styles.tableHeaderCell, { flex: 1 }]}>Pro</Text>
          <Text style={[styles.tableHeaderCell, { flex: 1 }]}>Elite</Text>
        </View>
        {[
          { feature: 'AI Operatives', core: '4', boost: '6', pro: '8', elite: 'All 10' },
          { feature: 'Consoles', core: '3', boost: '5', pro: '5', elite: 'All 7' },
          { feature: 'Employees', core: '10', boost: '25', pro: '50', elite: 'Unlimited' },
          { feature: 'Talk to Aura (Voice)', core: 'Yes', boost: 'Yes', pro: 'Yes', elite: 'Yes' },
          { feature: 'Online Booking', core: 'Yes', boost: 'Yes', pro: 'Yes', elite: 'Yes' },
          { feature: 'Field Operations', core: '-', boost: 'Yes', pro: 'Yes', elite: 'Yes' },
          { feature: 'Industry Specialist Agents', core: 'By industry', boost: 'By industry', pro: 'By industry', elite: 'By industry' },
          { feature: 'Analytics Console', core: '-', boost: '-', pro: '-', elite: 'Yes' },
        ].map((row, i) => (
          <View key={i} style={i % 2 === 0 ? styles.tableRow : styles.tableRowAlt}>
            <Text style={[styles.tableCellLeft, { flex: 2, fontWeight: 600 }]}>{row.feature}</Text>
            <Text style={[styles.tableCell, { flex: 1 }]}>{row.core}</Text>
            <Text style={[styles.tableCell, { flex: 1 }]}>{row.boost}</Text>
            <Text style={[styles.tableCell, { flex: 1 }]}>{row.pro}</Text>
            <Text style={[styles.tableCell, { flex: 1 }]}>{row.elite}</Text>
          </View>
        ))}
      </View>
      <View style={styles.infoBox}>
        <Text style={styles.noticeTitle}>One-Time Onboarding Fee</Text>
        <Text style={styles.noticeText}>
          Equals one month of your plan, with 50% OFF during Beta: Core $249 (was $497) · Boost $497 (was $994) · Pro $994 (was $1,988) · Elite $1,990 (was $3,979). Due at start of the 60-Day Live Trial. The first 30 days of the trial are dedicated to onboarding, then 30 days of full live use. Non-refundable once onboarding begins. Annual billing saves ~20% vs monthly (billed upfront).
        </Text>
      </View>
      <View style={styles.footer}>
        <Text>Aura Intercept - AI-Powered Service Platform</Text>
        <Text render={({ pageNumber }) => `Page ${pageNumber}`} />
      </View>
    </Page>

    {/* 4-Tier Comparison Table */}
    <Page size="A4" style={styles.page}>
      <Header title="Aura Intercept - Pricing Guide" />
      <Text style={styles.sectionTitle}>Complete 4-Tier Comparison</Text>
      <View style={styles.table}>
        <View style={styles.tableHeader}>
          <Text style={[styles.tableHeaderCell, { flex: 2.5 }]}>Feature Category</Text>
          <Text style={[styles.tableHeaderCell, { flex: 1 }]}>Core</Text>
          <Text style={[styles.tableHeaderCell, { flex: 1 }]}>Boost</Text>
          <Text style={[styles.tableHeaderCell, { flex: 1 }]}>Pro</Text>
          <Text style={[styles.tableHeaderCell, { flex: 1 }]}>Elite</Text>
        </View>
        {[
          { category: 'Monthly Price', core: '$497', boost: '$994', pro: '$1,988', elite: '$3,979' },
          { category: 'Annual Price', core: '$4,771', boost: '$9,542', pro: '$19,085', elite: '$38,198' },
          { category: 'One-Time Onboarding Fee', core: '$249', boost: '$497', pro: '$994', elite: '$1,990' },
          { category: '', core: '', boost: '', pro: '', elite: '' },
          { category: 'AI Operatives', core: '4', boost: '6', pro: '8', elite: 'All 10' },
          { category: 'Consoles', core: '3', boost: '5', pro: '5', elite: 'All 7' },
          { category: 'Employees', core: '10', boost: '25', pro: '50', elite: 'Unlimited' },
          { category: '', core: '', boost: '', pro: '', elite: '' },
          { category: 'Message Aura (Text)', core: 'Yes', boost: 'Yes', pro: 'Yes', elite: 'Yes' },
          { category: 'Talk to Aura (Voice)', core: 'Yes', boost: 'Yes', pro: 'Yes', elite: 'Yes' },
          { category: 'Online Booking', core: 'Yes', boost: 'Yes', pro: 'Yes', elite: 'Yes' },
          { category: 'Customer Portal', core: 'Yes', boost: 'Yes', pro: 'Yes', elite: 'Yes' },
          { category: 'Field Operations', core: '-', boost: 'Yes', pro: 'Yes', elite: 'Yes' },
          { category: 'Business Ops', core: '-', boost: '-', pro: '-', elite: 'Yes' },
          { category: 'Marketing Console', core: 'Yes', boost: 'Yes', pro: 'Yes', elite: 'Yes' },
          { category: 'Analytics Console', core: '-', boost: '-', pro: '-', elite: 'Yes' },
          { category: 'AI Operatives Hub', core: '-', boost: '-', pro: '-', elite: 'Yes' },
        ].map((row, i) => (
          <View key={i} style={row.category === '' ? { height: 6 } : (i % 2 === 0 ? styles.tableRow : styles.tableRowAlt)}>
            {row.category !== '' && (
              <>
                <Text style={[styles.tableCellLeft, { flex: 2.5, fontWeight: row.category.includes('Price') || row.category.includes('Fee') ? 700 : 400 }]}>{row.category}</Text>
                <Text style={[styles.tableCell, { flex: 1 }]}>{row.core}</Text>
                <Text style={[styles.tableCell, { flex: 1 }]}>{row.boost}</Text>
                <Text style={[styles.tableCell, { flex: 1 }]}>{row.pro}</Text>
                <Text style={[styles.tableCell, { flex: 1 }]}>{row.elite}</Text>
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

    {/* Aura Core Tier */}
    <Page size="A4" style={styles.page}>
      <Header title="Aura Intercept - Pricing Guide" />
      <Text style={styles.sectionTitle}>Aura Core Tier</Text>
      <View style={styles.pricingCard}>
        <Text style={{ fontSize: 9, color: colors.green, fontWeight: 700, marginBottom: 4 }}>ENTRY LEVEL</Text>
        <Text style={styles.pricingTierName}>Aura Core</Text>
        <Text style={styles.pricingPrice}>$497/month</Text>
        <Text style={styles.pricingAnnual}>or $4,771/year (billed annually)</Text>
        <Text style={styles.pricingSavings}>Save ~$1,193 with annual billing</Text>
        <Text style={{ fontSize: 10, fontWeight: 600, marginBottom: 8 }}>Best For:</Text>
        <Text style={{ fontSize: 9, color: colors.gray, marginBottom: 12 }}>{connect.bestFor}</Text>
      </View>
      <Text style={styles.subsectionTitle}>Included Smart AI Agents (8)</Text>
      <View style={styles.featureList}>
        <FeatureItem>AI Receptionist (Triage) - 24/7 customer engagement and routing</FeatureItem>
        <FeatureItem>Booking Agent - Appointment scheduling</FeatureItem>
        <FeatureItem>Follow-Up Agent - Automated follow-ups</FeatureItem>
        <FeatureItem>Review Agent - Review collection and management</FeatureItem>
        <FeatureItem>Creative Content Agent - Multi-channel content generation</FeatureItem>
        <FeatureItem>Web Presence Agent - AI website builder and SEO</FeatureItem>
        <FeatureItem>Lead Agent - Lead capture and nurturing</FeatureItem>
        <FeatureItem>Marketing Agent - Marketing automation</FeatureItem>
      </View>
      <Text style={styles.subsectionTitle}>Consoles (3)</Text>
      <View style={styles.featureList}>
        <FeatureItem>Customer Portal Console</FeatureItem>
        <FeatureItem>Outreach & Sales Ops Console</FeatureItem>
        <FeatureItem>Creative & Web Presence Console</FeatureItem>
      </View>
      <Text style={styles.subsectionTitle}>Platform Features</Text>
      <View style={styles.featureList}>
        <FeatureItem>Message Aura (Text) + Talk to Aura (Voice)</FeatureItem>
        <FeatureItem>SMS/Email appointment reminders</FeatureItem>
        <FeatureItem>10 employee accounts included</FeatureItem>
        <FeatureItem>$249 one-time onboarding fee (was $497, 50% OFF — Beta; due at start of 60-Day Live Trial; first 30 days = onboarding)</FeatureItem>
      </View>
      <View style={styles.footer}>
        <Text>Aura Intercept - AI-Powered Service Platform</Text>
        <Text render={({ pageNumber }) => `Page ${pageNumber}`} />
      </View>
    </Page>

    {/* Aura Boost Tier */}
    <Page size="A4" style={styles.page}>
      <Header title="Aura Intercept - Pricing Guide" />
      <Text style={styles.sectionTitle}>Aura Boost Tier</Text>
      <View style={styles.pricingCardHighlight}>
        <Text style={{ fontSize: 9, color: colors.accent, fontWeight: 700, marginBottom: 4 }}>MOST POPULAR</Text>
        <Text style={styles.pricingTierName}>Aura Boost</Text>
        <Text style={styles.pricingPrice}>$994/month</Text>
        <Text style={styles.pricingAnnual}>or $9,542/year (billed annually)</Text>
        <Text style={styles.pricingSavings}>Save ~$2,386 with annual billing</Text>
        <Text style={{ fontSize: 10, fontWeight: 600, marginBottom: 8 }}>Best For:</Text>
        <Text style={{ fontSize: 9, color: colors.gray, marginBottom: 12 }}>{performance.bestFor}</Text>
      </View>
      <Text style={styles.subsectionTitle}>Included Smart AI Agents (12)</Text>
      <View style={styles.featureList}>
        <FeatureItem>Everything in Core (4 operatives, 3 consoles), plus:</FeatureItem>
        <FeatureItem>Dispatch/GPS Console - Smart job assignment by skills and proximity</FeatureItem>
        <FeatureItem>Route Agent - Optimal route planning</FeatureItem>
        <FeatureItem>ETA Agent - Real-time arrival estimates</FeatureItem>
        <FeatureItem>Check-In Agent - Job status tracking and photo documentation</FeatureItem>
      </View>
      <Text style={styles.subsectionTitle}>Consoles (5)</Text>
      <View style={styles.featureList}>
        <FeatureItem>Everything in Core (3 consoles), plus:</FeatureItem>
        <FeatureItem>Field Operations Console</FeatureItem>
        <FeatureItem>Social Media Ops Console</FeatureItem>
      </View>
      <Text style={styles.subsectionTitle}>Platform Features</Text>
      <View style={styles.featureList}>
        <FeatureItem>25 employees included</FeatureItem>
        <FeatureItem>$497 one-time onboarding fee (was $994, 50% OFF — Beta; due at start of 60-Day Live Trial; first 30 days = onboarding)</FeatureItem>
      </View>
      <View style={styles.footer}>
        <Text>Aura Intercept - AI-Powered Service Platform</Text>
        <Text render={({ pageNumber }) => `Page ${pageNumber}`} />
      </View>
    </Page>

    {/* Aura Pro Tier */}
    <Page size="A4" style={styles.page}>
      <Header title="Aura Intercept - Pricing Guide" />
      <Text style={styles.sectionTitle}>Aura Pro Tier</Text>
      <View style={styles.pricingCard}>
        <Text style={{ fontSize: 9, color: colors.accent, fontWeight: 700, marginBottom: 4 }}>GROWTH</Text>
        <Text style={styles.pricingTierName}>Aura Pro</Text>
        <Text style={styles.pricingPrice}>$1,988/month</Text>
        <Text style={styles.pricingAnnual}>or $19,085/year (billed annually)</Text>
        <Text style={styles.pricingSavings}>Save ~$4,771 with annual billing</Text>
        <Text style={{ fontSize: 10, fontWeight: 600, marginBottom: 8 }}>Best For:</Text>
        <Text style={{ fontSize: 9, color: colors.gray, marginBottom: 12 }}>{pro.bestFor}</Text>
      </View>
      <Text style={styles.subsectionTitle}>Included Smart AI Agents (16)</Text>
      <View style={styles.featureList}>
        <FeatureItem>Everything in Boost (6 operatives, 5 consoles), plus:</FeatureItem>
        <FeatureItem>Campaign Agent - Automated campaign creation</FeatureItem>
        <FeatureItem>Outreach Agent - Sales outreach automation</FeatureItem>
        <FeatureItem>Social Scheduler Agent - Social media scheduling</FeatureItem>
        <FeatureItem>Social Analytics - Social media performance tracking</FeatureItem>
      </View>
      <Text style={styles.subsectionTitle}>Consoles (5)</Text>
      <View style={styles.featureList}>
        <FeatureItem>Same 5 consoles as Boost</FeatureItem>
        <FeatureItem>Industry Specialist Agents auto-activate by industry on every plan</FeatureItem>
      </View>
      <Text style={styles.subsectionTitle}>Platform Features</Text>
      <View style={styles.featureList}>
        <FeatureItem>50 employees included</FeatureItem>
        <FeatureItem>$994 one-time onboarding fee (was $1,988, 50% OFF — Beta; due at start of 60-Day Live Trial; first 30 days = onboarding)</FeatureItem>
      </View>
      <View style={styles.footer}>
        <Text>Aura Intercept - AI-Powered Service Platform</Text>
        <Text render={({ pageNumber }) => `Page ${pageNumber}`} />
      </View>
    </Page>

    {/* Aura Elite Tier */}
    <Page size="A4" style={styles.page}>
      <Header title="Aura Intercept - Pricing Guide" />
      <Text style={styles.sectionTitle}>Aura Elite Tier</Text>
      <View style={styles.pricingCard}>
        <Text style={{ fontSize: 9, color: colors.primary, fontWeight: 700, marginBottom: 4 }}>ENTERPRISE</Text>
        <Text style={styles.pricingTierName}>Aura Elite</Text>
        <Text style={styles.pricingPrice}>$3,979/month</Text>
        <Text style={styles.pricingAnnual}>or $38,198/year (billed annually)</Text>
        <Text style={styles.pricingSavings}>Save ~$9,550 with annual billing</Text>
        <Text style={{ fontSize: 10, fontWeight: 600, marginBottom: 8 }}>Best For:</Text>
        <Text style={{ fontSize: 9, color: colors.gray, marginBottom: 12 }}>{command.bestFor}</Text>
      </View>
      <View style={styles.noticeBox}>
        <Text style={styles.noticeTitle}>Enterprise Qualification</Text>
        <Text style={styles.noticeText}>
          Aura Elite is designed for service companies with large teams and
          enterprise operations. Custom implementation and onboarding included.
        </Text>
      </View>
      <Text style={styles.subsectionTitle}>Included AI Operatives (All 10)</Text>
      <Text style={styles.paragraph}>
        Full access to all 24 AI Operatives (organized into 10 operative roles): everything in Pro plus Admin, Quoting, Invoice, Inventory, Insights, Performance, Revenue, and Forecast capabilities.
      </Text>
      <Text style={styles.subsectionTitle}>Consoles (All 7 + AI Operatives Hub)</Text>
      <View style={styles.featureList}>
        <FeatureItem>Everything in Pro (5 consoles), plus:</FeatureItem>
        <FeatureItem>Business Management Console</FeatureItem>
        <FeatureItem>Analytics & Reports Console - KPIs, forecasting, performance</FeatureItem>
        <FeatureItem>AI Operatives Hub - Central agent management</FeatureItem>
      </View>
      <Text style={styles.subsectionTitle}>Platform Features</Text>
      <View style={styles.featureList}>
        <FeatureItem>Unlimited employee accounts</FeatureItem>
        <FeatureItem>Enterprise access control</FeatureItem>
        <FeatureItem>All Industry Specialist Agents included</FeatureItem>
        <FeatureItem>$1,990 one-time onboarding fee (was $3,979, 50% OFF — Beta; due at start of 60-Day Live Trial; first 30 days = onboarding)</FeatureItem>
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
        Annual billing saves ~20% vs paying monthly (billed upfront). All plans include the same
        features whether you choose monthly or annual billing.
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
          { tier: 'Aura Core', monthly: '$497', yearlyPath: '$5,964', annual: '$4,771', savings: '$1,193' },
          { tier: 'Aura Boost', monthly: '$994', yearlyPath: '$11,928', annual: '$9,542', savings: '$2,386' },
          { tier: 'Aura Pro', monthly: '$1,988', yearlyPath: '$23,856', annual: '$19,085', savings: '$4,771' },
          { tier: 'Aura Elite', monthly: '$3,979', yearlyPath: '$47,748', annual: '$38,198', savings: '$9,550' },
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
          billed separately from your Aura Intercept subscription. All 3rd-party fees are set by their respective vendors and are subject to change at any time, which may affect the cost of those services for your company.
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
            <Text style={styles.columnTitle}>Content Features (Pro+)</Text>
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
          { tier: 'Aura Core', fee: '$249 (was $497)', includes: 'Guided setup · 50% OFF — Beta; due at start of 60-Day Live Trial; first 30 days = onboarding' },
          { tier: 'Aura Boost', fee: '$497 (was $994)', includes: 'Onboarding, setup, training · 50% OFF — Beta; due at start of 60-Day Live Trial' },
          { tier: 'Aura Pro', fee: '$994 (was $1,988)', includes: 'Onboarding, setup, training, industry tuning · 50% OFF — Beta; due at start of 60-Day Live Trial' },
          { tier: 'Aura Elite', fee: '$1,990 (was $3,979)', includes: 'Enterprise onboarding, custom setup · 50% OFF — Beta; due at start of 60-Day Live Trial' },
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
