import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
} from '@react-pdf/renderer';
import { sanitizePdfText, SAFE_BULLET } from '@/components/documentation/pdfSanitize';
import { TierType, TIER_RECOMMENDATIONS } from './types';

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
  brand: {
    fontSize: 14,
    color: colors.accent,
    fontWeight: 700,
    marginBottom: 24,
    letterSpacing: 2,
  },
  coverTitle: {
    fontSize: 28,
    fontWeight: 700,
    marginBottom: 12,
    textAlign: 'center',
    color: colors.white,
  },
  coverSubtitle: {
    fontSize: 14,
    fontWeight: 400,
    marginBottom: 40,
    textAlign: 'center',
    color: '#a5b4fc',
  },
  coverTierBox: {
    borderWidth: 1,
    borderColor: colors.accent,
    borderRadius: 8,
    paddingVertical: 20,
    paddingHorizontal: 32,
    alignItems: 'center',
    marginBottom: 24,
  },
  coverTierLabel: {
    fontSize: 22,
    fontWeight: 700,
    color: colors.white,
    marginBottom: 6,
  },
  coverTierPrice: {
    fontSize: 16,
    color: colors.accent,
    fontWeight: 600,
  },
  coverFit: {
    fontSize: 11,
    color: '#cbd5e1',
    marginTop: 8,
  },
  coverFooter: {
    position: 'absolute',
    bottom: 40,
    left: 60,
    right: 60,
    textAlign: 'center',
    fontSize: 9,
    color: colors.gray,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: colors.lightGray,
  },
  headerTitle: { fontSize: 8, color: colors.gray },
  pageNumber: { fontSize: 8, color: colors.gray },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 700,
    color: colors.primary,
    marginBottom: 14,
    marginTop: 8,
  },
  subsectionTitle: {
    fontSize: 12,
    fontWeight: 600,
    color: colors.dark,
    marginBottom: 8,
    marginTop: 14,
  },
  paragraph: {
    fontSize: 10,
    lineHeight: 1.5,
    marginBottom: 10,
    color: colors.dark,
  },
  bulletRow: {
    flexDirection: 'row',
    marginBottom: 5,
    paddingLeft: 4,
  },
  bullet: {
    width: 12,
    fontSize: 10,
    color: colors.primary,
    fontWeight: 700,
  },
  bulletText: {
    flex: 1,
    fontSize: 10,
    lineHeight: 1.5,
    color: colors.dark,
  },
  checkRow: {
    flexDirection: 'row',
    marginBottom: 6,
    paddingLeft: 4,
  },
  checkbox: {
    width: 14,
    fontSize: 10,
    color: colors.primary,
    fontWeight: 700,
  },
  callout: {
    backgroundColor: colors.lightGray,
    borderLeftWidth: 3,
    borderLeftColor: colors.primary,
    padding: 10,
    marginVertical: 10,
  },
  calloutText: {
    fontSize: 9,
    color: colors.dark,
    lineHeight: 1.5,
  },
  table: {
    marginTop: 8,
    borderWidth: 1,
    borderColor: colors.lightGray,
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: colors.lightGray,
  },
  tableHeader: {
    backgroundColor: colors.dark,
  },
  tableHeaderCell: {
    flex: 1,
    padding: 6,
    fontSize: 9,
    fontWeight: 700,
    color: colors.white,
    borderRightWidth: 1,
    borderRightColor: '#334155',
  },
  tableCell: {
    flex: 1,
    padding: 6,
    fontSize: 8,
    color: colors.dark,
    borderRightWidth: 1,
    borderRightColor: colors.lightGray,
  },
  tableCellBold: {
    fontWeight: 700,
    color: colors.primary,
  },
  disclaimer: {
    marginTop: 12,
    padding: 10,
    backgroundColor: '#fef3c7',
    borderLeftWidth: 3,
    borderLeftColor: colors.warning,
    fontSize: 8,
    color: '#78350f',
    lineHeight: 1.5,
  },
  ctaBox: {
    marginTop: 16,
    padding: 14,
    backgroundColor: colors.primary,
    borderRadius: 6,
  },
  ctaTitle: {
    fontSize: 13,
    fontWeight: 700,
    color: colors.white,
    marginBottom: 6,
  },
  ctaText: {
    fontSize: 9,
    color: '#e0e7ff',
    lineHeight: 1.5,
  },
});

const t = (s: string) => sanitizePdfText(s);

interface AuditChecklistPDFProps {
  recommendedTier: TierType;
  fitScore: number;
  answers: Record<string, string>;
}

const TIER_ORDER: TierType[] = ['CORE', 'BOOST', 'PRO', 'ELITE'];

// ----- Cover Page -----
const CoverPage = ({ tier, fitScore }: { tier: TierType; fitScore: number }) => {
  const rec = TIER_RECOMMENDATIONS[tier];
  return (
    <Page size="LETTER" style={styles.coverPage}>
      <Text style={styles.brand}>{t('AURA INTERCEPT')}</Text>
      <Text style={styles.coverTitle}>{t('Your Aura Intercept Setup Plan')}</Text>
      <Text style={styles.coverSubtitle}>
        {t('Personalized 30-day launch checklist based on your AI Opportunity Audit')}
      </Text>

      <View style={styles.coverTierBox}>
        <Text style={styles.coverTierLabel}>{t(`Recommended: ${rec.label}`)}</Text>
        <Text style={styles.coverTierPrice}>{t(`${rec.price} ${SAFE_BULLET} ${rec.employeeLimit}`)}</Text>
        <Text style={styles.coverFit}>{t(`Fit score: ${fitScore}%  ${SAFE_BULLET}  Implementation: ${rec.implementationFee}`)}</Text>
      </View>

      <Text style={{ fontSize: 10, color: '#cbd5e1', textAlign: 'center', maxWidth: 380 }}>
        {t(rec.description)}
      </Text>

      <Text style={styles.coverFooter}>
        {t('https://auraintercept.ai  |  Generated for your business by the Aura AI Opportunity Audit')}
      </Text>
    </Page>
  );
};

// ----- Standard Header -----
const StdHeader = ({ tier, label }: { tier: TierType; label: string }) => (
  <View style={styles.header}>
    <Text style={styles.headerTitle}>{t(`Aura Intercept ${SAFE_BULLET} ${TIER_RECOMMENDATIONS[tier].label} Setup Plan`)}</Text>
    <Text style={styles.pageNumber}>{t(label)}</Text>
  </View>
);

const Bullet = ({ children }: { children: string }) => (
  <View style={styles.bulletRow}>
    <Text style={styles.bullet}>{SAFE_BULLET}</Text>
    <Text style={styles.bulletText}>{t(children)}</Text>
  </View>
);

const Check = ({ children }: { children: string }) => (
  <View style={styles.checkRow}>
    <Text style={styles.checkbox}>{t('[  ]')}</Text>
    <Text style={styles.bulletText}>{t(children)}</Text>
  </View>
);

// ----- Page 2: What's Included -----
const PlanContentsPage = ({ tier }: { tier: TierType }) => {
  const rec = TIER_RECOMMENDATIONS[tier];
  return (
    <Page size="LETTER" style={styles.page}>
      <StdHeader tier={tier} label="Page 2 - What's included" />
      <Text style={styles.sectionTitle}>{t("What's Included In Your Plan")}</Text>
      <Text style={styles.paragraph}>
        {t(`${rec.label} comes with ${rec.agentCount} Smart AI Agents organized into ${rec.consoleCount} Control Centers, all included for ${rec.price}.`)}
      </Text>

      <Text style={styles.subsectionTitle}>{t('Plan summary')}</Text>
      <Bullet>{`Plan: ${rec.label} (${rec.price})`}</Bullet>
      <Bullet>{`Smart AI Agents: ${rec.agentCount}`}</Bullet>
      <Bullet>{`Control Centers: ${rec.consoleCount}`}</Bullet>
      <Bullet>{`Team: ${rec.employeeLimit}`}</Bullet>
      <Bullet>{`Implementation fee: ${rec.implementationFee} (one-time)`}</Bullet>
      <Bullet>{`30-day free trial included on every plan`}</Bullet>

      <Text style={styles.subsectionTitle}>{t('Key features')}</Text>
      {rec.keyFeatures.map((f, i) => (
        <Bullet key={i}>{f}</Bullet>
      ))}

      <Text style={styles.subsectionTitle}>{t('Plain-English agent groups (what your team will see)')}</Text>
      <Bullet>{'Front Desk - voice, text & email triage, booking, reminders, follow-ups, review asks'}</Bullet>
      {(tier === 'BOOST' || tier === 'PRO' || tier === 'ELITE') && (
        <Bullet>{'On The Way - dispatch, routing, ETA texts, check-ins'}</Bullet>
      )}
      {(tier === 'PRO' || tier === 'ELITE') && (
        <Bullet>{'Marketing - campaigns, outreach, social posting & analytics'}</Bullet>
      )}
      {tier === 'ELITE' && (
        <Bullet>{'Billing - quotes, invoices, inventory'}</Bullet>
      )}
      <Bullet>{'Reports - performance, revenue insights & KPI dashboards'}</Bullet>
    </Page>
  );
};

// ----- Page 3: Documents to gather -----
const DocumentsPage = ({ tier }: { tier: TierType }) => (
  <Page size="LETTER" style={styles.page}>
    <StdHeader tier={tier} label="Page 3 - Documents to gather" />
    <Text style={styles.sectionTitle}>{t('Documents To Gather Before You Launch')}</Text>
    <Text style={styles.paragraph}>
      {t('Have these handy before your guided 30-day launch. Most take less than 10 minutes each.')}
    </Text>

    <Text style={styles.subsectionTitle}>{t('Business basics')}</Text>
    <Check>{'Legal business name + EIN (or SSN for sole prop)'}</Check>
    <Check>{'Business address + service area (cities or ZIP codes)'}</Check>
    <Check>{'Business phone number you want customers to call'}</Check>
    <Check>{'Hours of operation (regular + emergency / after-hours)'}</Check>
    <Check>{'Owner / primary contact name + email + cell'}</Check>

    <Text style={styles.subsectionTitle}>{t('Services & pricing')}</Text>
    <Check>{'List of services you offer (with short descriptions)'}</Check>
    <Check>{'Pricing or pricing ranges (flat-rate, hourly, or quote-based)'}</Check>
    <Check>{'Standard appointment durations per service'}</Check>
    <Check>{'Any emergency / after-hours surcharges'}</Check>

    <Text style={styles.subsectionTitle}>{t('Team & operations')}</Text>
    <Check>{'Roster of employees (name, role, email, mobile)'}</Check>
    <Check>{'Who answers the phone today (so we can hand off correctly)'}</Check>
    <Check>{'Top 5-10 customer FAQs (so Aura Front Desk knows the answers)'}</Check>

    <Text style={styles.subsectionTitle}>{t('Brand & web presence')}</Text>
    <Check>{'Logo (PNG or SVG, transparent background preferred)'}</Check>
    <Check>{'Brand colors (primary + accent, hex codes if you have them)'}</Check>
    <Check>{'Google Business Profile URL (for review requests)'}</Check>
    <Check>{'Existing website URL (if you have one)'}</Check>
    <Check>{'Social media handles you want to keep posting to'}</Check>
  </Page>
);

// ----- Page 4: Third-party setups -----
interface ThirdPartyRow {
  provider: string;
  purpose: string;
  whoSetsItUp: string;
  cost: string;
}

const get3rdPartyRows = (tier: TierType): ThirdPartyRow[] => {
  const all: ThirdPartyRow[] = [
    {
      provider: 'SignalWire',
      purpose: 'Voice + SMS phone number for Front Desk',
      whoSetsItUp: 'Aura helps you set this up',
      cost: '$5-30/mo (number + usage)',
    },
    {
      provider: 'ElevenLabs',
      purpose: 'Voice agent (natural-sounding AI voice)',
      whoSetsItUp: 'Aura provisions on your behalf',
      cost: 'Included in agent usage',
    },
    {
      provider: 'Resend',
      purpose: 'Transactional email (confirmations, receipts)',
      whoSetsItUp: 'Aura provisions on your behalf',
      cost: 'Included up to fair-use limits',
    },
  ];
  if (tier === 'PRO' || tier === 'ELITE') {
    all.push({
      provider: 'Social platforms (Facebook, Instagram, LinkedIn, TikTok, Google Business)',
      purpose: 'Auto-publish marketing posts on your behalf',
      whoSetsItUp: 'You connect via OAuth (1-click)',
      cost: 'Free (platform fees only)',
    });
  }
  if (tier === 'ELITE') {
    all.push({
      provider: 'Stripe',
      purpose: 'Invoicing + payment collection (Billing agents)',
      whoSetsItUp: 'You connect your Stripe account',
      cost: 'Standard Stripe processing fees apply',
    });
  }
  return all;
};

const ThirdPartyPage = ({ tier }: { tier: TierType }) => {
  const rows = get3rdPartyRows(tier);
  return (
    <Page size="LETTER" style={styles.page}>
      <StdHeader tier={tier} label="Page 4 - Third-party setups" />
      <Text style={styles.sectionTitle}>{t('Third-Party Setups Required For Your Tier')}</Text>
      <Text style={styles.paragraph}>
        {t('These are the outside services that power Aura. Most are provisioned for you automatically. The ones that need your account are clearly marked below.')}
      </Text>

      <View style={styles.table}>
        <View style={[styles.tableRow, styles.tableHeader]}>
          <Text style={styles.tableHeaderCell}>{t('Provider')}</Text>
          <Text style={styles.tableHeaderCell}>{t('What it powers')}</Text>
          <Text style={styles.tableHeaderCell}>{t('Who sets it up')}</Text>
          <Text style={styles.tableHeaderCell}>{t('Estimated cost')}</Text>
        </View>
        {rows.map((r, i) => (
          <View key={i} style={styles.tableRow}>
            <Text style={[styles.tableCell, styles.tableCellBold]}>{t(r.provider)}</Text>
            <Text style={styles.tableCell}>{t(r.purpose)}</Text>
            <Text style={styles.tableCell}>{t(r.whoSetsItUp)}</Text>
            <Text style={styles.tableCell}>{t(r.cost)}</Text>
          </View>
        ))}
      </View>

      <Text style={styles.disclaimer}>
        {t('Important: Third-party fees (SignalWire telephony usage, ElevenLabs voice minutes, Resend email volume, Stripe processing, social platform fees) are billed separately by those providers and are not included in your Aura Intercept subscription. Your Aura plan covers the platform, the AI agents, and the infrastructure that connects them. Estimated costs are typical SMB ranges and will vary based on your actual usage.')}
      </Text>
    </Page>
  );
};

// ----- Page 5: Phone setup path -----
const phoneSteps = (answer?: string): string[] => {
  if (!answer) return [
    'Aura will help you choose the best path during your guided launch.',
    'Most companies decide between porting an existing number or getting a new SignalWire number.',
  ];
  if (answer.includes('port')) return [
    'During launch we send you a Letter of Authorization (LOA) to port your existing number.',
    'You sign and return it (about 5 minutes). Carrier port typically completes in 5-10 business days.',
    'During the port, we forward calls to a temporary number so you never miss a call.',
    'Once ported, your existing number rings into Aura Front Desk 24/7.',
    'For SMS, we register your number with 10DLC (US business texting compliance) - we handle the paperwork.',
  ];
  if (answer.includes('new business number')) return [
    'You pick the area code (and optionally a vanity number) during onboarding.',
    'Aura provisions a SignalWire number for you - usually live within minutes.',
    'We register the new number with 10DLC for SMS compliance (US) - we handle the paperwork.',
    'Update your Google Business Profile, website, and signage with the new number on launch day.',
  ];
  if (answer.includes('Forward')) return [
    'You set up call forwarding on your current line to your new SignalWire number.',
    'Your existing carrier (AT&T, Verizon, etc.) usually does this with a *72 dial code or in their app.',
    'Aura answers all forwarded calls - you keep your existing number for outbound and billing.',
    'You can switch to a full port-in later with no service interruption.',
  ];
  return [
    'Aura provisions a brand-new SignalWire number for you - usually live within minutes.',
    'You pick the area code and (optionally) a vanity number.',
    'We register it with 10DLC for SMS compliance and you are ready to advertise it everywhere.',
    'Add it to your Google Business Profile, website, and any printed signage on launch day.',
  ];
};

const PhoneSetupPage = ({ tier, phoneAnswer }: { tier: TierType; phoneAnswer?: string }) => (
  <Page size="LETTER" style={styles.page}>
    <StdHeader tier={tier} label="Page 5 - Your phone setup path" />
    <Text style={styles.sectionTitle}>{t('Your Phone Setup Path')}</Text>
    <Text style={styles.paragraph}>
      {t(phoneAnswer ? `Based on your audit answer: "${phoneAnswer}"` : 'We will tailor this during your guided launch.')}
    </Text>

    <Text style={styles.subsectionTitle}>{t('Step-by-step')}</Text>
    {phoneSteps(phoneAnswer).map((s, i) => (
      <Bullet key={i}>{`Step ${i + 1}: ${s}`}</Bullet>
    ))}

    <View style={styles.callout}>
      <Text style={styles.calloutText}>
        {t('Heads up: SMS for any US business number requires 10DLC registration (a federal carrier requirement to reduce spam). Aura submits the brand and campaign registration on your behalf - it usually clears in 1-7 business days.')}
      </Text>
    </View>
  </Page>
);

// ----- Page 6: 30-day guided launch -----
const LaunchPage = ({ tier }: { tier: TierType }) => (
  <Page size="LETTER" style={styles.page}>
    <StdHeader tier={tier} label="Page 6 - Your 30-day guided launch" />
    <Text style={styles.sectionTitle}>{t('Your 30-Day Guided Launch')}</Text>
    <Text style={styles.paragraph}>
      {t('Every Aura plan includes a guided 30-day launch built around the Fast Start wizard. Here is what to expect week by week.')}
    </Text>

    <Text style={styles.subsectionTitle}>{t('Day 1 - Fast Start (about 20 minutes)')}</Text>
    <Bullet>{'Step 1: Tell us your business type (industry, size, services)'}</Bullet>
    <Bullet>{'Step 2: Connect your integrations (calendar, social, phone)'}</Bullet>
    <Bullet>{'Step 3: Tell Aura how to talk (brand voice, FAQs, escalation rules)'}</Bullet>
    <Bullet>{'Step 4: Launch - Front Desk goes live and starts taking calls / chats'}</Bullet>

    <Text style={styles.subsectionTitle}>{t('Week 1 - Front Desk live')}</Text>
    <Bullet>{'Front Desk is answering 24/7 across voice, text & email'}</Bullet>
    <Bullet>{'Booking flow live for your top services'}</Bullet>
    <Bullet>{'You review the first day of conversations together with us'}</Bullet>

    {(tier === 'BOOST' || tier === 'PRO' || tier === 'ELITE') && (
      <>
        <Text style={styles.subsectionTitle}>{t('Week 2 - On The Way live')}</Text>
        <Bullet>{'Dispatch, routing & ETA texts turned on'}</Bullet>
        <Bullet>{'Field Ops Console available to your team on mobile'}</Bullet>
      </>
    )}

    {(tier === 'PRO' || tier === 'ELITE') && (
      <>
        <Text style={styles.subsectionTitle}>{t('Week 3 - Marketing live')}</Text>
        <Bullet>{'Social accounts connected and first posts scheduled'}</Bullet>
        <Bullet>{'Review-request automation turned on'}</Bullet>
        <Bullet>{'First reactivation campaign drafted'}</Bullet>
      </>
    )}

    {tier === 'ELITE' && (
      <>
        <Text style={styles.subsectionTitle}>{t('Week 4 - Billing & Reports live')}</Text>
        <Bullet>{'Stripe connected; AI Quoting & Invoicing turned on'}</Bullet>
        <Bullet>{'Inventory items imported'}</Bullet>
        <Bullet>{'Full KPI dashboards + revenue forecasts active'}</Bullet>
      </>
    )}

    {tier !== 'ELITE' && (
      <>
        <Text style={styles.subsectionTitle}>{t('Week 4 - Optimize & report')}</Text>
        <Bullet>{'Review your first month of metrics in Reports'}</Bullet>
        <Bullet>{'Tune Front Desk responses and escalation rules'}</Bullet>
        <Bullet>{'Plan your upgrade path if you outgrow this tier'}</Bullet>
      </>
    )}
  </Page>
);

// ----- Page 7: Plan comparison -----
const ComparisonPage = ({ tier }: { tier: TierType }) => (
  <Page size="LETTER" style={styles.page}>
    <StdHeader tier={tier} label="Page 7 - Plan comparison" />
    <Text style={styles.sectionTitle}>{t('Compare All 4 Aura Plans')}</Text>
    <Text style={styles.paragraph}>
      {t('Use this side-by-side to share with partners or decision makers.')}
    </Text>

    <View style={styles.table}>
      <View style={[styles.tableRow, styles.tableHeader]}>
        <Text style={styles.tableHeaderCell}>{t('Feature')}</Text>
        {TIER_ORDER.map((tk) => (
          <Text key={tk} style={styles.tableHeaderCell}>{t(TIER_RECOMMENDATIONS[tk].label)}</Text>
        ))}
      </View>
      {[
        { label: 'Monthly price', get: (r: typeof TIER_RECOMMENDATIONS.CORE) => r.price },
        { label: 'Smart AI Agents', get: (r: typeof TIER_RECOMMENDATIONS.CORE) => `${r.agentCount} agents` },
        { label: 'Control Centers', get: (r: typeof TIER_RECOMMENDATIONS.CORE) => `${r.consoleCount} consoles` },
        { label: 'Team size', get: (r: typeof TIER_RECOMMENDATIONS.CORE) => r.employeeLimit },
        { label: 'Implementation fee', get: (r: typeof TIER_RECOMMENDATIONS.CORE) => r.implementationFee },
      ].map((row, i) => (
        <View key={i} style={styles.tableRow}>
          <Text style={[styles.tableCell, styles.tableCellBold]}>{t(row.label)}</Text>
          {TIER_ORDER.map((tk) => (
            <Text key={tk} style={styles.tableCell}>{t(row.get(TIER_RECOMMENDATIONS[tk]))}</Text>
          ))}
        </View>
      ))}
    </View>

    <Text style={styles.subsectionTitle}>{t('What unlocks at each tier')}</Text>
    <Bullet>{'Core - Front Desk + Marketing basics + Smart Website'}</Bullet>
    <Bullet>{'Boost - adds On The Way (dispatch, routing, ETAs) for field teams'}</Bullet>
    <Bullet>{'Pro - adds full Marketing automation, Outreach & deeper Reports'}</Bullet>
    <Bullet>{'Elite - adds Billing (quotes, invoices, inventory) + full Reports'}</Bullet>

    <Text style={[styles.paragraph, { marginTop: 12, fontSize: 9, color: colors.gray }]}>
      {t('All plans include a 30-day free trial and the guided launch. You can upgrade or downgrade at any time.')}
    </Text>
  </Page>
);

// ----- Page 8: Next steps -----
const NextStepsPage = ({ tier }: { tier: TierType }) => (
  <Page size="LETTER" style={styles.page}>
    <StdHeader tier={tier} label="Page 8 - Next steps" />
    <Text style={styles.sectionTitle}>{t('Next Steps')}</Text>
    <Text style={styles.paragraph}>
      {t('You have everything you need to launch. Pick the path that suits you best.')}
    </Text>

    <View style={styles.ctaBox}>
      <Text style={styles.ctaTitle}>{t('Start your 30-day free trial')}</Text>
      <Text style={styles.ctaText}>
        {t('Sign up at https://auraintercept.ai/auth?mode=company and step through the Fast Start wizard. Front Desk can be live the same day.')}
      </Text>
    </View>

    <View style={[styles.ctaBox, { backgroundColor: colors.dark }]}>
      <Text style={styles.ctaTitle}>{t('Schedule a Concierge Kickoff')}</Text>
      <Text style={styles.ctaText}>
        {t('Want a guided onboarding call? Book a 30-minute Concierge Kickoff at https://calendly.com/aura-intercept/implementation and we will set up your Front Desk live with you on the call.')}
      </Text>
    </View>

    <Text style={styles.subsectionTitle}>{t('Questions?')}</Text>
    <Bullet>{'Email: auraintercept@gmail.com'}</Bullet>
    <Bullet>{'Web: https://auraintercept.ai'}</Bullet>
    <Bullet>{'Help center: https://auraintercept.ai/dashboard/help (after signup)'}</Bullet>

    <Text style={styles.disclaimer}>
      {t('Reminder: Third-party fees (SignalWire telephony, ElevenLabs voice minutes, Resend email volume, Stripe processing, social platform fees) are billed separately by those providers and are not included in your Aura Intercept subscription.')}
    </Text>

    <Text style={[styles.paragraph, { marginTop: 16, fontSize: 8, color: colors.gray, textAlign: 'center' }]}>
      {t('© 2026 Aura Intercept. Generated from your AI Opportunity Audit.')}
    </Text>
  </Page>
);

export const AuditChecklistPDF = ({ recommendedTier, fitScore, answers }: AuditChecklistPDFProps) => (
  <Document>
    <CoverPage tier={recommendedTier} fitScore={fitScore} />
    <PlanContentsPage tier={recommendedTier} />
    <DocumentsPage tier={recommendedTier} />
    <ThirdPartyPage tier={recommendedTier} />
    <PhoneSetupPage tier={recommendedTier} phoneAnswer={answers.phone_setup} />
    <LaunchPage tier={recommendedTier} />
    <ComparisonPage tier={recommendedTier} />
    <NextStepsPage tier={recommendedTier} />
  </Document>
);

export default AuditChecklistPDF;
