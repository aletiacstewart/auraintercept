import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
} from '@react-pdf/renderer';
import {
  INTEGRATION_PROVIDERS,
  POLICY_BANNER,
} from '@/lib/integrationOnboardingData';
import { sanitizePdfText, SAFE_BULLET } from './pdfSanitize';

const colors = {
  primary: '#6366f1',
  accent: '#06b6d4',
  warning: '#f59e0b',
  dark: '#1e1b4b',
  gray: '#64748b',
  lightGray: '#f1f5f9',
  white: '#ffffff',
};

const s = StyleSheet.create({
  page: { padding: 40, fontFamily: 'Helvetica', fontSize: 10, color: colors.dark, backgroundColor: colors.white },
  cover: { padding: 60, fontFamily: 'Helvetica', backgroundColor: colors.dark, color: colors.white, justifyContent: 'center', alignItems: 'center' },
  coverTitle: { fontSize: 30, fontWeight: 700, marginBottom: 14, textAlign: 'center' },
  coverSub: { fontSize: 14, marginBottom: 30, textAlign: 'center', color: '#a5b4fc' },
  coverTag: { fontSize: 11, marginBottom: 24, textAlign: 'center', color: colors.accent, fontWeight: 600 },
  coverDate: { fontSize: 10, color: colors.gray, marginTop: 40 },
  h1: { fontSize: 18, fontWeight: 700, color: colors.primary, marginBottom: 10, marginTop: 4 },
  h2: { fontSize: 13, fontWeight: 700, color: colors.dark, marginBottom: 6, marginTop: 12 },
  h3: { fontSize: 11, fontWeight: 700, color: colors.primary, marginBottom: 4, marginTop: 10 },
  p: { fontSize: 10, lineHeight: 1.55, marginBottom: 8, color: colors.dark },
  small: { fontSize: 9, color: colors.gray, marginBottom: 6 },
  banner: { backgroundColor: '#fef3c7', borderLeftWidth: 3, borderLeftColor: colors.warning, padding: 10, marginBottom: 14 },
  bannerText: { fontSize: 9, color: '#78350f', lineHeight: 1.5 },
  metaRow: { flexDirection: 'row', marginBottom: 4 },
  metaLabel: { fontSize: 9, fontWeight: 700, color: colors.gray, width: 90 },
  metaVal: { fontSize: 9, color: colors.dark, flex: 1 },
  step: { flexDirection: 'row', marginBottom: 8 },
  stepNum: { width: 22, fontSize: 10, fontWeight: 700, color: colors.primary },
  stepBody: { flex: 1 },
  stepTitle: { fontSize: 10, fontWeight: 700, color: colors.dark, marginBottom: 2 },
  stepDetail: { fontSize: 9, color: colors.dark, lineHeight: 1.5 },
  hint: { fontSize: 8, color: colors.gray, fontStyle: 'italic', marginTop: 2 },
  bullet: { flexDirection: 'row', marginBottom: 3, paddingLeft: 4 },
  bulletDot: { width: 10, fontSize: 9, color: colors.primary },
  bulletText: { flex: 1, fontSize: 9, color: colors.dark, lineHeight: 1.45 },
  checkRow: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 5 },
  checkbox: { width: 10, height: 10, borderWidth: 1, borderColor: colors.dark, marginRight: 6, marginTop: 1 },
  checkText: { flex: 1, fontSize: 9, color: colors.dark },
  tocRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 5 },
  tocName: { fontSize: 10, color: colors.dark },
  tocMeta: { fontSize: 9, color: colors.gray },
  footer: { position: 'absolute', bottom: 20, left: 40, right: 40, fontSize: 8, color: colors.gray, textAlign: 'center' },
});

const t = (x: string) => sanitizePdfText(x);

const IntegrationOnboardingPDF = () => (
  <Document>
    {/* Cover */}
    <Page size="LETTER" style={s.cover}>
      <Text style={s.coverTag}>{t('AURA INTERCEPT')}</Text>
      <Text style={s.coverTitle}>{t('3rd-Party Integration Onboarding Guide')}</Text>
      <Text style={s.coverSub}>{t('Setup steps for every external account you connect.')}</Text>
      <Text style={s.coverDate}>{t(`Generated ${new Date().toLocaleDateString()}`)}</Text>
    </Page>

    {/* Policy + TOC */}
    <Page size="LETTER" style={s.page}>
      <Text style={s.h1}>{t('Policy & Overview')}</Text>
      <View style={s.banner}>
        <Text style={s.bannerText}>{t(POLICY_BANNER)}</Text>
      </View>
      <Text style={s.p}>{t('Concierge Onboarding configures these on your behalf using your login and card. Self-serve customers can follow this guide.')}</Text>

      <Text style={s.h2}>{t('Setup Order')}</Text>
      {INTEGRATION_PROVIDERS.map((p, i) => (
        <View key={p.id} style={s.tocRow}>
          <Text style={s.tocName}>{t(`${i + 1}. ${p.name}`)}</Text>
          <Text style={s.tocMeta}>{t(`${p.estTime}`)}</Text>
        </View>
      ))}
      <Text style={s.footer} fixed render={({ pageNumber, totalPages }) => t(`Aura Intercept - Integration Onboarding - Page ${pageNumber} of ${totalPages}`)} />
    </Page>

    {/* Why You Hold These Accounts */}
    <Page size="LETTER" style={s.page}>
      <Text style={s.h1}>{t('Why Do I Need My Own Accounts for SignalWire, ElevenLabs, and Resend?')}</Text>
      <Text style={s.p}>{t("You're not paying us a markup on your phone, voice, or email costs. You hold those accounts directly and pay the provider their actual rate — the same rate any business pays. We don't add a margin on top and resell it back to you as a mystery line item.")}</Text>
      <Text style={s.p}>{t('Other platforms (ServiceTitan, Jobber) bundle these costs into flat-fee add-ons regardless of your actual usage. You never see the underlying cost. We\'d rather show you the real number.')}</Text>

      <Text style={s.h2}>{t('Typical monthly cost (small service business)')}</Text>
      {[
        ['SignalWire', 'Phone number, calls, SMS', '~$15-30/mo'],
        ['ElevenLabs', 'Talk to Aura voice synthesis', '$22/mo (Creator)'],
        ['Resend', 'Email confirmations & campaigns', 'Free to 3k - then $20/mo'],
        ['Total', 'Scales with phone activity', '~$35-70/mo'],
      ].map(([name, what, cost]) => (
        <View key={name} style={{ flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: colors.lightGray, paddingVertical: 4 }}>
          <Text style={{ width: 80, fontSize: 9, fontWeight: 700, color: colors.dark }}>{t(name)}</Text>
          <Text style={{ flex: 1, fontSize: 9, color: colors.dark }}>{t(what)}</Text>
          <Text style={{ width: 130, fontSize: 9, color: colors.dark }}>{t(cost)}</Text>
        </View>
      ))}
      <Text style={s.small}>{t('Plus one-time SignalWire A2P 10DLC carrier registration (~$10/mo ongoing) — required for business SMS.')}</Text>

      <Text style={s.h3}>{t('The bottom line')}</Text>
      <Text style={s.p}>{t('You pay each provider directly on your own card. Aura never marks up, resells, or invoices third-party usage. Concierge Onboarding can create and configure these accounts on your behalf using your login and card.')}</Text>

      <Text style={s.footer} fixed render={({ pageNumber, totalPages }) => t(`Aura Intercept - Integration Onboarding - Page ${pageNumber} of ${totalPages}`)} />
    </Page>

    {/* One page per provider */}
    {INTEGRATION_PROVIDERS.map((p, idx) => (
      <Page key={p.id} size="LETTER" style={s.page}>
        <Text style={s.h1}>{t(`${idx + 1}. ${p.name}`)}</Text>
        <Text style={s.p}>{t(p.purpose)}</Text>
        <Text style={s.small}>{t(p.whyNeeded)}</Text>

        <View style={{ marginBottom: 8 }}>
          <View style={s.metaRow}><Text style={s.metaLabel}>{t('Est. time:')}</Text><Text style={s.metaVal}>{t(p.estTime)}</Text></View>
          <View style={s.metaRow}><Text style={s.metaLabel}>{t('Est. cost:')}</Text><Text style={s.metaVal}>{t(p.estCost)}</Text></View>
          <View style={s.metaRow}><Text style={s.metaLabel}>{t('Sign up:')}</Text><Text style={s.metaVal}>{t(p.signupUrl)}</Text></View>
        </View>

        <Text style={s.h3}>{t('Prerequisites')}</Text>
        {p.prereqs.map((x, i) => (
          <View key={i} style={s.bullet}>
            <Text style={s.bulletDot}>{SAFE_BULLET}</Text>
            <Text style={s.bulletText}>{t(x)}</Text>
          </View>
        ))}

        <Text style={s.h3}>{t('Step-by-step')}</Text>
        {p.steps.map((step, i) => (
          <View key={i} style={s.step} wrap={false}>
            <Text style={s.stepNum}>{t(`${i + 1}.`)}</Text>
            <View style={s.stepBody}>
              <Text style={s.stepTitle}>{t(step.title)}</Text>
              <Text style={s.stepDetail}>{t(step.detail)}</Text>
              {step.screenshotHint && (
                <Text style={s.hint}>{t(`Screenshot: ${step.screenshotHint}`)}</Text>
              )}
            </View>
          </View>
        ))}

        <Text style={s.h3}>{t('What to paste back into Aura admin')}</Text>
        {p.whatToPasteBack.map((x, i) => (
          <View key={i} style={s.bullet}>
            <Text style={s.bulletDot}>{SAFE_BULLET}</Text>
            <Text style={s.bulletText}>{t(x)}</Text>
          </View>
        ))}

        <Text style={s.h3}>{t('Verification')}</Text>
        {p.verification.map((x, i) => (
          <View key={i} style={s.checkRow}>
            <View style={s.checkbox} />
            <Text style={s.checkText}>{t(x)}</Text>
          </View>
        ))}

        <Text style={s.footer} fixed render={({ pageNumber, totalPages }) => t(`Aura Intercept - Integration Onboarding - Page ${pageNumber} of ${totalPages}`)} />
      </Page>
    ))}

    {/* Final master checklist */}
    <Page size="LETTER" style={s.page}>
      <Text style={s.h1}>{t('Master Verification Checklist')}</Text>
      <Text style={s.p}>{t('Check every box at handoff before the customer is considered onboarded.')}</Text>
      {INTEGRATION_PROVIDERS.map((p) => (
        <View key={p.id} style={{ marginBottom: 10 }} wrap={false}>
          <Text style={s.h3}>{t(p.name)}</Text>
          {['Account created', 'Credit card on file', 'API credentials pasted into Aura admin', 'End-to-end test passed'].map((label, i) => (
            <View key={i} style={s.checkRow}>
              <View style={s.checkbox} />
              <Text style={s.checkText}>{t(label)}</Text>
            </View>
          ))}
        </View>
      ))}
      <Text style={s.footer} fixed render={({ pageNumber, totalPages }) => t(`Aura Intercept - Integration Onboarding - Page ${pageNumber} of ${totalPages}`)} />
    </Page>
  </Document>
);

export default IntegrationOnboardingPDF;