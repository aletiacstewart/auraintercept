import React from 'react';
import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer';
import { sanitizePdfText } from './pdfSanitize';
import { SUBSCRIPTION_TIERS } from '@/lib/documentationConfig';

const colors = {
  primary: '#214ebb',
  secondary: '#6366f1',
  accent: '#06b6d4',
  dark: '#1e293b',
  light: '#f8fafc',
  gray: '#64748b',
  success: '#10b981',
  warning: '#f59e0b',
  error: '#ef4444',
};

const styles = StyleSheet.create({
  page: {
    padding: 40,
    backgroundColor: colors.light,
    fontFamily: 'Helvetica',
  },
  coverPage: {
    padding: 40,
    backgroundColor: colors.dark,
    justifyContent: 'center',
    alignItems: 'center',
    height: '100%',
  },
  coverTitle: {
    fontSize: 36,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 20,
    textAlign: 'center',
  },
  coverSubtitle: {
    fontSize: 18,
    color: 'white',
    opacity: 0.9,
    textAlign: 'center',
    marginBottom: 40,
  },
  coverBadge: {
    backgroundColor: colors.accent,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
  },
  coverBadgeText: {
    color: 'white',
    fontSize: 14,
    fontWeight: 'bold',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 25,
    paddingBottom: 15,
    borderBottomWidth: 2,
    borderBottomColor: colors.dark,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.dark,
  },
  headerPage: {
    fontSize: 10,
    color: colors.gray,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: colors.dark,
    marginBottom: 10,
  },
  sectionSubtitle: {
    fontSize: 12,
    color: colors.gray,
    marginBottom: 20,
  },
  dataCard: {
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 10,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  dataCardTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: colors.dark,
    marginBottom: 15,
  },
  visualDataRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  visualDataLabel: {
    width: 140,
    fontSize: 10,
    color: colors.dark,
  },
  visualDataBar: {
    flex: 1,
    height: 16,
    backgroundColor: '#e2e8f0',
    borderRadius: 8,
    overflow: 'hidden',
    marginHorizontal: 10,
  },
  visualDataBarFill: {
    height: '100%',
    backgroundColor: colors.primary,
    borderRadius: 8,
  },
  visualDataValue: {
    width: 50,
    fontSize: 10,
    fontWeight: 'bold',
    color: colors.primary,
    textAlign: 'right',
  },
  comparisonTable: {
    marginTop: 10,
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
    paddingVertical: 8,
  },
  tableHeader: {
    backgroundColor: colors.dark,
    borderBottomWidth: 0,
  },
  tableHeaderText: {
    color: 'white',
    fontSize: 9,
    fontWeight: 'bold',
  },
  tableCell: {
    flex: 1,
    fontSize: 9,
    color: colors.dark,
    paddingHorizontal: 8,
  },
  tableCellBold: {
    fontWeight: 'bold',
  },
  checkMark: {
    color: colors.success,
    fontWeight: 'bold',
  },
  xMark: {
    color: colors.error,
    fontWeight: 'bold',
  },
  roiCard: {
    backgroundColor: colors.primary,
    padding: 20,
    borderRadius: 10,
    marginBottom: 15,
  },
  roiTitle: {
    color: 'white',
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 15,
  },
  roiRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  roiLabel: {
    color: 'white',
    fontSize: 11,
    opacity: 0.9,
  },
  roiValue: {
    color: 'white',
    fontSize: 11,
    fontWeight: 'bold',
  },
  roiTotal: {
    borderTopWidth: 2,
    borderTopColor: 'rgba(255,255,255,0.3)',
    paddingTop: 10,
    marginTop: 10,
  },
  roiTotalLabel: {
    color: 'white',
    fontSize: 14,
    fontWeight: 'bold',
  },
  roiTotalValue: {
    color: colors.accent,
    fontSize: 18,
    fontWeight: 'bold',
  },
  objectionCard: {
    backgroundColor: 'white',
    padding: 15,
    borderRadius: 8,
    marginBottom: 12,
    borderLeftWidth: 4,
    borderLeftColor: colors.warning,
  },
  objectionLabel: {
    fontSize: 9,
    color: colors.warning,
    fontWeight: 'bold',
    marginBottom: 5,
    textTransform: 'uppercase',
  },
  objectionText: {
    fontSize: 11,
    color: colors.dark,
    fontStyle: 'italic',
    marginBottom: 8,
  },
  responseLabel: {
    fontSize: 9,
    color: colors.success,
    fontWeight: 'bold',
    marginBottom: 5,
    textTransform: 'uppercase',
  },
  responseText: {
    fontSize: 10,
    color: colors.dark,
    lineHeight: 1.5,
  },
  caseStudyCard: {
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 10,
    marginBottom: 15,
    borderWidth: 2,
    borderColor: colors.accent,
  },
  caseStudyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 15,
  },
  caseStudyTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: colors.dark,
  },
  caseStudyIndustry: {
    backgroundColor: colors.accent,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
  },
  caseStudyIndustryText: {
    color: 'white',
    fontSize: 9,
    fontWeight: 'bold',
  },
  statsRow: {
    flexDirection: 'row',
    gap: 15,
    marginBottom: 15,
  },
  statBox: {
    flex: 1,
    backgroundColor: colors.light,
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.primary,
  },
  statLabel: {
    fontSize: 8,
    color: colors.gray,
    marginTop: 4,
    textAlign: 'center',
  },
  footer: {
    position: 'absolute',
    bottom: 30,
    left: 40,
    right: 40,
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
    paddingTop: 10,
  },
  footerText: {
    fontSize: 8,
    color: colors.gray,
  },
  twoColumn: {
    flexDirection: 'row',
    gap: 15,
  },
  column: {
    flex: 1,
  },
  closingCard: {
    backgroundColor: colors.success,
    padding: 15,
    borderRadius: 8,
    marginTop: 15,
  },
  closingTitle: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  closingText: {
    color: 'white',
    fontSize: 10,
    lineHeight: 1.5,
  },
  tierCard: {
    backgroundColor: 'white',
    padding: 15,
    borderRadius: 8,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  tierHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  tierName: {
    fontSize: 14,
    fontWeight: 'bold',
    color: colors.dark,
  },
  tierPrice: {
    fontSize: 14,
    fontWeight: 'bold',
    color: colors.primary,
  },
  tierDesc: {
    fontSize: 9,
    color: colors.gray,
    marginBottom: 8,
  },
  tierBullet: {
    fontSize: 9,
    color: colors.dark,
    marginBottom: 3,
  },
});

const Header = ({ title, pageNum }: { title: string; pageNum: number }) => (
  <View style={styles.header}>
    <Text style={styles.headerTitle}>{title}</Text>
    <Text style={styles.headerPage}>Page {pageNum}</Text>
  </View>
);

const Footer = () => (
  <View style={styles.footer}>
    <Text style={styles.footerText}>Aura Intercept Sales Pitch Data</Text>
    <Text style={styles.footerText}>© 2026 Aura Intercept</Text>
  </View>
);

const VisualDataRow = ({ label, value, display, color = colors.primary }: { label: string; value: number; display: string; color?: string }) => (
  <View style={styles.visualDataRow}>
    <Text style={styles.visualDataLabel}>{label}</Text>
    <View style={styles.visualDataBar}>
      <View style={[styles.visualDataBarFill, { width: `${value}%`, backgroundColor: color }]} />
    </View>
    <Text style={[styles.visualDataValue, { color }]}>{display}</Text>
  </View>
);

export const SalesPitchDataPDF: React.FC = () => (
  <Document>
    {/* Cover Page */}
    <Page size="A4" style={styles.coverPage}>
      <Text style={styles.coverTitle}>Sales Pitch{'\n'}Data Pack</Text>
      <Text style={styles.coverSubtitle}>
        Visual Data • ROI Calculations • Objection Handling{'\n'}
        Case Studies • Competitor Comparisons{'\n'}
        Closing Scripts
      </Text>
      <View style={styles.coverBadge}>
        <Text style={styles.coverBadgeText}>Complete Sales Toolkit</Text>
      </View>
    </Page>

    {/* Time Savings Data */}
    <Page size="A4" style={styles.page}>
      <Header title="Time Savings Visualization" pageNum={2} />
      
      <Text style={styles.sectionTitle}>Hours Saved Per Week</Text>
      <Text style={styles.sectionSubtitle}>Average time savings reported by Aura Intercept customers</Text>

      <View style={styles.dataCard}>
        <Text style={styles.dataCardTitle}>Administrative Tasks Automated</Text>
        <VisualDataRow label="Phone Answering" value={95} display="15+ hrs" color={colors.primary} />
        <VisualDataRow label="Appointment Scheduling" value={85} display="12 hrs" color={colors.secondary} />
        <VisualDataRow label="Follow-up Calls" value={75} display="8 hrs" color={colors.accent} />
        <VisualDataRow label="Route Planning" value={65} display="6 hrs" color={colors.success} />
        <VisualDataRow label="Invoicing & Quotes" value={55} display="5 hrs" color={colors.warning} />
        <VisualDataRow label="Review Management" value={40} display="3 hrs" color={colors.error} />
      </View>

      <View style={styles.statsRow}>
        <View style={styles.statBox}>
          <Text style={styles.statValue}>49+</Text>
          <Text style={styles.statLabel}>Hours Saved Weekly</Text>
        </View>
        <View style={styles.statBox}>
          <Text style={styles.statValue}>$2,450</Text>
          <Text style={styles.statLabel}>Value at $50/hr</Text>
        </View>
        <View style={styles.statBox}>
          <Text style={styles.statValue}>6</Text>
          <Text style={styles.statLabel}>Full Work Days</Text>
        </View>
      </View>

      <View style={styles.dataCard}>
        <Text style={styles.dataCardTitle}>Call Answer Rate Improvement</Text>
        <VisualDataRow label="Before Aura (Industry Avg)" value={38} display="38%" color={colors.error} />
        <VisualDataRow label="After Aura" value={100} display="100%" color={colors.success} />
      </View>

      <Footer />
    </Page>

    {/* Revenue Impact Data */}
    <Page size="A4" style={styles.page}>
      <Header title="Revenue Impact Analysis" pageNum={3} />
      
      <Text style={styles.sectionTitle}>Financial Performance Data</Text>
      <Text style={styles.sectionSubtitle}>Quantifiable business impact for sales conversations</Text>

      <View style={styles.roiCard}>
        <Text style={styles.roiTitle}>ROI Calculator: Aura Performance Tier ($2,497/mo)</Text>
        <View style={styles.roiRow}>
          <Text style={styles.roiLabel}>Missed calls recovered (23/mo x $500)</Text>
          <Text style={styles.roiValue}>+$11,500</Text>
        </View>
        <View style={styles.roiRow}>
          <Text style={styles.roiLabel}>Admin time saved (40 hrs x $50)</Text>
          <Text style={styles.roiValue}>+$2,000</Text>
        </View>
        <View style={styles.roiRow}>
          <Text style={styles.roiLabel}>Fuel savings (route optimization)</Text>
          <Text style={styles.roiValue}>+$400</Text>
        </View>
        <View style={styles.roiRow}>
          <Text style={styles.roiLabel}>Customer retention improvement</Text>
          <Text style={styles.roiValue}>+$800</Text>
        </View>
        <View style={styles.roiRow}>
          <Text style={styles.roiLabel}>Aura Intercept cost</Text>
          <Text style={styles.roiValue}>-$2,497</Text>
        </View>
        <View style={[styles.roiRow, styles.roiTotal]}>
          <Text style={styles.roiTotalLabel}>Net Monthly ROI</Text>
          <Text style={styles.roiTotalValue}>+$12,203</Text>
        </View>
      </View>

      <View style={styles.dataCard}>
        <Text style={styles.dataCardTitle}>Revenue Recovery by Channel</Text>
        <VisualDataRow label="After-Hours Calls" value={85} display="$8,500/mo" color={colors.primary} />
        <VisualDataRow label="During-Job Calls" value={60} display="$4,200/mo" color={colors.secondary} />
        <VisualDataRow label="Follow-up Conversions" value={45} display="$2,800/mo" color={colors.accent} />
        <VisualDataRow label="Review-Driven Referrals" value={30} display="$1,500/mo" color={colors.success} />
      </View>

      <View style={styles.statsRow}>
        <View style={styles.statBox}>
          <Text style={styles.statValue}>23x</Text>
          <Text style={styles.statLabel}>Average ROI</Text>
        </View>
        <View style={styles.statBox}>
          <Text style={styles.statValue}>7 days</Text>
          <Text style={styles.statLabel}>Time to ROI</Text>
        </View>
        <View style={styles.statBox}>
          <Text style={styles.statValue}>$165K</Text>
          <Text style={styles.statLabel}>Annual Value</Text>
        </View>
      </View>

      <Footer />
    </Page>

    {/* 7-Tier ROI Calculator */}
    <Page size="A4" style={styles.page}>
      <Header title="7-Tier ROI Calculators" pageNum={4} />
      
      <Text style={styles.sectionTitle}>ROI by Subscription Tier</Text>
      <Text style={styles.sectionSubtitle}>Expected monthly return for each pricing tier</Text>

      <View style={styles.twoColumn}>
        <View style={styles.column}>
          <View style={styles.tierCard}>
            <View style={styles.tierHeader}>
              <Text style={styles.tierName}>Aura Express</Text>
              <Text style={styles.tierPrice}>$197/mo</Text>
            </View>
            <Text style={styles.tierDesc}>Restaurants & Cafes</Text>
            <Text style={styles.tierBullet}>- Reservations captured: +$2,000</Text>
            <Text style={styles.tierBullet}>- Order links shared: +$500</Text>
            <Text style={styles.tierBullet}>- Cost: -$197</Text>
            <Text style={[styles.tierBullet, { fontWeight: 'bold', color: colors.success }]}>Net ROI: +$2,303/mo</Text>
          </View>

          <View style={styles.tierCard}>
            <View style={styles.tierHeader}>
              <Text style={styles.tierName}>Aura Scheduling</Text>
              <Text style={styles.tierPrice}>$397/mo</Text>
            </View>
            <Text style={styles.tierDesc}>Personal Assistant</Text>
            <Text style={styles.tierBullet}>- Appointments booked: +$1,500</Text>
            <Text style={styles.tierBullet}>- Time saved (10h): +$500</Text>
            <Text style={styles.tierBullet}>- Cost: -$397</Text>
            <Text style={[styles.tierBullet, { fontWeight: 'bold', color: colors.success }]}>Net ROI: +$1,603/mo</Text>
          </View>

          <View style={styles.tierCard}>
            <View style={styles.tierHeader}>
              <Text style={styles.tierName}>Aura Growth</Text>
              <Text style={styles.tierPrice}>$597/mo</Text>
            </View>
            <Text style={styles.tierDesc}>Marketing & Social</Text>
            <Text style={styles.tierBullet}>- No-shows reduced: +$1,200</Text>
            <Text style={styles.tierBullet}>- After-hours bookings: +$800</Text>
            <Text style={styles.tierBullet}>- Reviews generated: +$400</Text>
            <Text style={styles.tierBullet}>- Cost: -$597</Text>
            <Text style={[styles.tierBullet, { fontWeight: 'bold', color: colors.success }]}>Net ROI: +$1,803/mo</Text>
          </View>

          <View style={styles.tierCard}>
            <View style={styles.tierHeader}>
              <Text style={styles.tierName}>Aura Business</Text>
              <Text style={styles.tierPrice}>$797/mo</Text>
            </View>
            <Text style={styles.tierDesc}>Digital Foundation</Text>
            <Text style={styles.tierBullet}>- Leads captured: +$2,500</Text>
            <Text style={styles.tierBullet}>- Social engagement: +$300</Text>
            <Text style={styles.tierBullet}>- Cost: -$797</Text>
            <Text style={[styles.tierBullet, { fontWeight: 'bold', color: colors.success }]}>Net ROI: +$2,003/mo</Text>
          </View>
        </View>
        <View style={styles.column}>
          <View style={styles.tierCard}>
            <View style={styles.tierHeader}>
              <Text style={styles.tierName}>Aura Field Ops</Text>
              <Text style={styles.tierPrice}>$1,497/mo</Text>
            </View>
            <Text style={styles.tierDesc}>Field Operations</Text>
            <Text style={styles.tierBullet}>- Missed calls recovered: +$5,000</Text>
            <Text style={styles.tierBullet}>- Follow-up conversions: +$1,800</Text>
            <Text style={styles.tierBullet}>- Review revenue: +$500</Text>
            <Text style={styles.tierBullet}>- Cost: -$1,497</Text>
            <Text style={[styles.tierBullet, { fontWeight: 'bold', color: colors.success }]}>Net ROI: +$5,803/mo</Text>
          </View>

          <View style={styles.tierCard}>
            <View style={styles.tierHeader}>
              <Text style={styles.tierName}>Aura Performance</Text>
            <Text style={styles.tierPrice}>$2,497/mo</Text>
            </View>
            <Text style={styles.tierDesc}>Full Automation</Text>
            <Text style={styles.tierBullet}>- Calls recovered: +$11,500</Text>
            <Text style={styles.tierBullet}>- Route savings: +$400</Text>
            <Text style={styles.tierBullet}>- Admin time: +$2,000</Text>
            <Text style={styles.tierBullet}>- Cost: -$2,497</Text>
            <Text style={[styles.tierBullet, { fontWeight: 'bold', color: colors.success }]}>Net ROI: +$11,403/mo</Text>
          </View>

          <View style={styles.tierCard}>
            <View style={styles.tierHeader}>
              <Text style={styles.tierName}>Aura Command</Text>
            <Text style={styles.tierPrice}>$3,497/mo</Text>
            </View>
            <Text style={styles.tierDesc}>Enterprise Suite</Text>
            <Text style={styles.tierBullet}>- Full operations: +$17,000</Text>
            <Text style={styles.tierBullet}>- Marketing automation: +$3,000</Text>
            <Text style={styles.tierBullet}>- Analytics insights: +$2,000</Text>
            <Text style={styles.tierBullet}>- Cost: -$3,497</Text>
            <Text style={[styles.tierBullet, { fontWeight: 'bold', color: colors.success }]}>Net ROI: +$18,503/mo</Text>
          </View>
        </View>
      </View>

      <Footer />
    </Page>

    {/* Competitor Comparison */}
    <Page size="A4" style={styles.page}>
      <Header title="Competitor Comparison" pageNum={4} />
      
      <Text style={styles.sectionTitle}>Market Positioning</Text>
      <Text style={styles.sectionSubtitle}>How Aura Intercept compares to alternatives</Text>

      <View style={styles.dataCard}>
        <View style={styles.comparisonTable}>
          <View style={[styles.tableRow, styles.tableHeader]}>
            <Text style={[styles.tableCell, styles.tableHeaderText]}>Feature</Text>
            <Text style={[styles.tableCell, styles.tableHeaderText]}>Aura Intercept</Text>
            <Text style={[styles.tableCell, styles.tableHeaderText]}>Human Receptionist</Text>
            <Text style={[styles.tableCell, styles.tableHeaderText]}>Basic Answering</Text>
          </View>
          <View style={styles.tableRow}>
            <Text style={styles.tableCell}>24/7 Availability</Text>
            <Text style={[styles.tableCell, styles.checkMark]}>Yes</Text>
            <Text style={[styles.tableCell, styles.xMark]}>No</Text>
            <Text style={[styles.tableCell, styles.checkMark]}>Yes</Text>
          </View>
          <View style={styles.tableRow}>
            <Text style={styles.tableCell}>Instant Scheduling</Text>
            <Text style={[styles.tableCell, styles.checkMark]}>Yes</Text>
            <Text style={[styles.tableCell, styles.checkMark]}>Yes</Text>
            <Text style={[styles.tableCell, styles.xMark]}>No</Text>
          </View>
          <View style={styles.tableRow}>
            <Text style={styles.tableCell}>Route Optimization</Text>
            <Text style={[styles.tableCell, styles.checkMark]}>Yes</Text>
            <Text style={[styles.tableCell, styles.xMark]}>No</Text>
            <Text style={[styles.tableCell, styles.xMark]}>No</Text>
          </View>
          <View style={styles.tableRow}>
            <Text style={styles.tableCell}>AI-Powered Dispatch</Text>
            <Text style={[styles.tableCell, styles.checkMark]}>Yes</Text>
            <Text style={[styles.tableCell, styles.xMark]}>No</Text>
            <Text style={[styles.tableCell, styles.xMark]}>No</Text>
          </View>
          <View style={styles.tableRow}>
            <Text style={styles.tableCell}>Automatic Follow-up</Text>
            <Text style={[styles.tableCell, styles.checkMark]}>Yes</Text>
            <Text style={[styles.tableCell, styles.xMark]}>No</Text>
            <Text style={[styles.tableCell, styles.xMark]}>No</Text>
          </View>
          <View style={styles.tableRow}>
            <Text style={styles.tableCell}>Multi-Channel (Voice/SMS/Email)</Text>
            <Text style={[styles.tableCell, styles.checkMark]}>Yes</Text>
            <Text style={[styles.tableCell, styles.xMark]}>Limited</Text>
            <Text style={[styles.tableCell, styles.xMark]}>No</Text>
          </View>
          <View style={styles.tableRow}>
            <Text style={styles.tableCell}>Invoice Generation</Text>
            <Text style={[styles.tableCell, styles.checkMark]}>Yes</Text>
            <Text style={[styles.tableCell, styles.xMark]}>No</Text>
            <Text style={[styles.tableCell, styles.xMark]}>No</Text>
          </View>
          <View style={styles.tableRow}>
            <Text style={[styles.tableCell, styles.tableCellBold]}>Monthly Cost</Text>
            <Text style={[styles.tableCell, styles.tableCellBold, { color: colors.success }]}>$197-$3,497</Text>
            <Text style={[styles.tableCell, styles.tableCellBold, { color: colors.error }]}>$3,500+</Text>
            <Text style={[styles.tableCell, styles.tableCellBold, { color: colors.warning }]}>$200-$400</Text>
          </View>
        </View>
      </View>

      <View style={styles.dataCard}>
        <Text style={styles.dataCardTitle}>Cost Comparison Over 12 Months</Text>
        <VisualDataRow label="Full-time Receptionist" value={100} display="$42,000" color={colors.error} />
        <VisualDataRow label="Part-time + After-hours" value={70} display="$28,000" color={colors.warning} />
        <VisualDataRow label="Aura Pro Command Tier" value={100} display="$71,964" color={colors.primary} />
        <VisualDataRow label="Aura Multi-Track Tier" value={57} display="$47,964" color={colors.secondary} />
        <VisualDataRow label="Aura Single-Point Tier" value={43} display="$18,000" color={colors.accent} />
        <VisualDataRow label="Aura Halo Tier" value={11} display="$4,764" color={colors.success} />
      </View>

      <Footer />
    </Page>

    {/* Objection Handling */}
    <Page size="A4" style={styles.page}>
      <Header title="Objection Handling Scripts" pageNum={5} />
      
      <Text style={styles.sectionTitle}>Common Objections & Responses</Text>
      <Text style={styles.sectionSubtitle}>Proven responses to overcome sales resistance</Text>

      <View style={styles.objectionCard}>
        <Text style={styles.objectionLabel}>Objection</Text>
        <Text style={styles.objectionText}>"My customers want to talk to a real person, not a robot."</Text>
        <Text style={styles.responseLabel}>Response</Text>
        <Text style={styles.responseText}>
          "I completely understand that concern. Here's what's interesting: 94% of callers can't tell they're speaking with our AI. The voice is natural, conversational, and warm. But here's the real question: would your customers rather talk to a robot that answers instantly, or a voicemail that never calls back? We've found that customers care most about getting their problem solved quickly. Want to call our demo line yourself and see if you can tell?"
        </Text>
      </View>

      <View style={styles.objectionCard}>
        <Text style={styles.objectionLabel}>Objection</Text>
        <Text style={styles.objectionText}>"It's too expensive for my small business."</Text>
        <Text style={styles.responseLabel}>Response</Text>
        <Text style={styles.responseText}>
          "Let's do the math together. How many calls do you miss per week? [Wait for answer] At an average job value of $500, missing just 2 calls a week costs you $4,000/month in lost revenue. Our Aura Halo tier is $397/month for salons or Single-Point at $1,500/month and captures every single one of those calls. That's not an expense—it's an investment with significant return. Most customers see ROI in their first week. What would 8 extra jobs a month do for your business?"
        </Text>
      </View>

      <View style={styles.objectionCard}>
        <Text style={styles.objectionLabel}>Objection</Text>
        <Text style={styles.objectionText}>"I'm not tech-savvy. This seems complicated."</Text>
        <Text style={styles.responseLabel}>Response</Text>
        <Text style={styles.responseText}>
          "That's actually one of our biggest advantages. Our implementation team does everything for you. We connect your phone number, set up your scheduling preferences, train the AI on your services and pricing—you don't touch a thing. Most businesses are fully operational in 24-48 hours. And our support team is available anytime you have questions. We've had 70-year-old business owners tell us it's the easiest tech they've ever used."
        </Text>
      </View>

      <View style={styles.objectionCard}>
        <Text style={styles.objectionLabel}>Objection</Text>
        <Text style={styles.objectionText}>"I need to think about it / talk to my partner."</Text>
        <Text style={styles.responseLabel}>Response</Text>
        <Text style={styles.responseText}>
          "Absolutely, this is an important decision. While you're considering it, you'll miss approximately [calculate: calls/week × days thinking] calls. At $500 each, that's $[amount] in potential revenue. What specific questions do you need answered to make this decision? I can provide whatever information would help you discuss this with your partner."
        </Text>
      </View>

      <Footer />
    </Page>

    {/* Case Studies */}
    <Page size="A4" style={styles.page}>
      <Header title="Case Study Frameworks" pageNum={6} />
      
      <Text style={styles.sectionTitle}>Customer Success Stories</Text>
      <Text style={styles.sectionSubtitle}>Real scenarios to reference in sales conversations</Text>

      <View style={styles.caseStudyCard}>
        <View style={styles.caseStudyHeader}>
          <Text style={styles.caseStudyTitle}>Case Study: Mike's HVAC Solutions</Text>
          <View style={styles.caseStudyIndustry}>
            <Text style={styles.caseStudyIndustryText}>HVAC</Text>
          </View>
        </View>
        <View style={styles.statsRow}>
          <View style={styles.statBox}>
            <Text style={styles.statValue}>40%</Text>
            <Text style={styles.statLabel}>Missed Calls Before</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statValue}>0%</Text>
            <Text style={styles.statLabel}>Missed Calls After</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statValue}>$11,500</Text>
            <Text style={styles.statLabel}>Month 1 Revenue</Text>
          </View>
        </View>
        <Text style={{ fontSize: 10, color: colors.dark, lineHeight: 1.5 }}>
          "Mike was a solo HVAC tech missing calls while on jobs. After implementing Aura's Multi-Track tier, he recovered 23 leads in month one. The AI scheduled appointments, sent confirmations, and even optimized his routes. He's since hired two technicians and credits Aura with enabling his growth."
        </Text>
      </View>

      <View style={styles.caseStudyCard}>
        <View style={styles.caseStudyHeader}>
          <Text style={styles.caseStudyTitle}>Case Study: ProPlumb Multi-Location</Text>
          <View style={styles.caseStudyIndustry}>
            <Text style={styles.caseStudyIndustryText}>PLUMBING</Text>
          </View>
        </View>
        <View style={styles.statsRow}>
          <View style={styles.statBox}>
            <Text style={styles.statValue}>3</Text>
            <Text style={styles.statLabel}>Locations</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statValue}>45%</Text>
            <Text style={styles.statLabel}>Efficiency Gain</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statValue}>$34K</Text>
            <Text style={styles.statLabel}>Monthly Impact</Text>
          </View>
        </View>
        <Text style={{ fontSize: 10, color: colors.dark, lineHeight: 1.5 }}>
          "ProPlumb was struggling to coordinate dispatching across 3 locations and 12 technicians. The Command tier unified their operations with AI-powered dispatch, eliminating scheduling conflicts and reducing drive time by 45%. Their dispatchers now focus on customer relationships instead of logistics."
        </Text>
      </View>

      <Footer />
    </Page>

    {/* Tier Recommendation Guide */}
    <Page size="A4" style={styles.page}>
      <Header title="Tier Recommendation Guide" pageNum={7} />
      
      <Text style={styles.sectionTitle}>Matching Customers to Tiers</Text>
      <Text style={styles.sectionSubtitle}>Use these criteria to recommend the right tier</Text>

      <View style={styles.tierCard}>
        <View style={styles.tierHeader}>
          <Text style={styles.tierName}>Aura Halo (Salons/Wellness)</Text>
          <Text style={styles.tierPrice}>$397/mo</Text>
        </View>
        <Text style={styles.tierDesc}>Best for: Nail salons, hair salons, barbers, massage centers</Text>
        <Text style={styles.tierBullet}>- 1-3 person operations</Text>
        <Text style={styles.tierBullet}>- Primary pain: Booking automation</Text>
        <Text style={styles.tierBullet}>- Need scheduling + follow-up</Text>
        <Text style={styles.tierBullet}>- Talk to Aura (Voice) included</Text>
        <Text style={styles.tierBullet}>- 3 AI Operatives: Receptionist, Scheduling, Follow-up</Text>
      </View>

      <View style={styles.tierCard}>
         <View style={styles.tierHeader}>
          <Text style={styles.tierName}>Single-Point</Text>
          <Text style={styles.tierPrice}>$1,497/mo</Text>
        </View>
        <Text style={styles.tierDesc}>Best for: Service businesses focused on lead capture and reputation</Text>
        <Text style={styles.tierBullet}>- 1-5 person operations</Text>
        <Text style={styles.tierBullet}>- Primary pain: Missed calls</Text>
        <Text style={styles.tierBullet}>- Focus on building reviews</Text>
        <Text style={styles.tierBullet}>- Talk to Aura (Voice) included</Text>
        <Text style={styles.tierBullet}>- 3 AI Operatives: Receptionist, Follow-up, Review</Text>
      </View>

      <View style={styles.tierCard}>
        <View style={styles.tierHeader}>
          <Text style={styles.tierName}>Multi-Track</Text>
          <Text style={styles.tierPrice}>$2,497/mo</Text>
        </View>
        <Text style={styles.tierDesc}>Best for: Growing teams needing scheduling and field ops</Text>
        <Text style={styles.tierBullet}>- 5-10 employees</Text>
        <Text style={styles.tierBullet}>- Multiple technicians to dispatch</Text>
        <Text style={styles.tierBullet}>- Need route optimization</Text>
        <Text style={styles.tierBullet}>- Want automated quoting/invoicing</Text>
        <Text style={styles.tierBullet}>- 10 AI Operatives + 2 Consoles</Text>
      </View>

      <View style={styles.tierCard}>
        <View style={styles.tierHeader}>
          <Text style={styles.tierName}>Aura Pro Command (Enterprise)</Text>
          <Text style={styles.tierPrice}>$3,497/mo</Text>
        </View>
        <Text style={styles.tierDesc}>Best for: 15+ technicians or multi-location operations</Text>
        <Text style={styles.tierBullet}>- 15+ employees or multi-location</Text>
        <Text style={styles.tierBullet}>- Need marketing automation</Text>
        <Text style={styles.tierBullet}>- Want comprehensive analytics</Text>
        <Text style={styles.tierBullet}>- All 7 Consoles</Text>
        <Text style={styles.tierBullet}>- All 24 AI Operatives: Full enterprise suite</Text>
      </View>

      <View style={styles.closingCard}>
        <Text style={styles.closingTitle}>[TARGET] Closing Question</Text>
        <Text style={styles.closingText}>
          "Based on what you've shared about your business—[recap their situation]—I'd recommend starting with [Tier]. It addresses your immediate need for [primary pain point] while giving you room to grow. Should I walk you through the 14-day trial?"
        </Text>
      </View>

      <Footer />
    </Page>

    {/* Closing Scripts */}
    <Page size="A4" style={styles.page}>
      <Header title="Closing Scripts" pageNum={8} />
      
      <Text style={styles.sectionTitle}>Proven Closing Techniques</Text>
      <Text style={styles.sectionSubtitle}>Scripts to move prospects to decision</Text>

      <View style={styles.objectionCard}>
        <Text style={styles.objectionLabel}>The Summary Close</Text>
        <Text style={styles.responseText}>
          "So let me make sure I have this right: You're losing about [X] calls per week, which at $500 average is costing you $[amount] monthly. You want to focus on the work, not the phone. And you need something that works 24/7 without adding payroll.{'\n\n'}
          Aura Intercept solves all three. You get every call answered, you stay focused on jobs, and it costs a fraction of a receptionist.{'\n\n'}
          The only question is: would you like to start with the [recommended tier] today, or would you prefer to begin with [lower tier] and upgrade as you grow?"
        </Text>
      </View>

      <View style={styles.objectionCard}>
        <Text style={styles.objectionLabel}>The Urgency Close</Text>
        <Text style={styles.responseText}>
          "Here's what's happening while we're talking: Your phone might be ringing right now. If no one answers, that's a potential $500 job going to your competitor.{'\n\n'}
          Every day you wait is another day of leaked revenue. Our implementation takes 24-48 hours. If you start today, by [day after tomorrow], every call gets answered.{'\n\n'}
          What's holding you back from getting this protection in place today?"
        </Text>
      </View>

      <View style={styles.objectionCard}>
        <Text style={styles.objectionLabel}>The Risk Reversal Close</Text>
        <Text style={styles.responseText}>
          "I understand you want to be careful with this decision. Here's what I can offer:{'\n\n'}
          Start your 14-day trial today. Full access to [tier]. If after two weeks you don't see the value—if you're not capturing more leads and saving time—you pay nothing.{'\n\n'}
          There's literally zero risk. The only risk is continuing to miss calls while you think about it.{'\n\n'}
          Can I get you started with that trial right now?"
        </Text>
      </View>

      <View style={styles.closingCard}>
        <Text style={styles.closingTitle}>[MONEY] Final Value Stack</Text>
        <Text style={styles.closingText}>
          "When you add it all up: 24/7 call answering, automatic scheduling, route optimization, follow-up automation, review collection, invoicing—you're looking at $4,000-$5,000/month in value for just $[tier price]. That's a 10x return on day one. Let's get you started."
        </Text>
      </View>

      <Footer />
    </Page>
  </Document>
);

export default SalesPitchDataPDF;
