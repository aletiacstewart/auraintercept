import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
} from '@react-pdf/renderer';
import { QUESTIONS, SECTION_ORDER } from '@/components/audit/types';
import { 
  SUBSCRIPTION_TIERS, 
  INTEGRATION_REQUIREMENTS,
  THIRD_PARTY_INTEGRATIONS,
} from '@/lib/documentationConfig';
import { sanitizePdfText, SAFE_BULLET } from './pdfSanitize';
import { CARRIERS, FORWARDING_RULES, fillTokens } from '@/lib/carrierForwarding';

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
    fontSize: 32,
    fontWeight: 700,
    marginBottom: 16,
    textAlign: 'center',
  },
  coverSubtitle: {
    fontSize: 16,
    fontWeight: 400,
    marginBottom: 40,
    textAlign: 'center',
    color: '#a5b4fc',
  },
  coverTagline: {
    fontSize: 12,
    marginBottom: 30,
    textAlign: 'center',
    color: colors.accent,
    fontWeight: 600,
  },
  coverVersion: {
    fontSize: 10,
    color: colors.gray,
    marginTop: 60,
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
    marginTop: 12,
  },
  paragraph: {
    fontSize: 10,
    lineHeight: 1.6,
    marginBottom: 10,
    color: colors.dark,
  },
  formRow: {
    flexDirection: 'row',
    marginBottom: 12,
    alignItems: 'flex-end',
  },
  formLabel: {
    fontSize: 10,
    fontWeight: 600,
    color: colors.dark,
    width: 140,
    marginRight: 8,
  },
  formLine: {
    flex: 1,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray,
    minHeight: 16,
  },
  formNote: {
    fontSize: 8,
    color: colors.gray,
    marginLeft: 148,
    marginTop: -8,
    marginBottom: 8,
  },
  questionContainer: {
    marginBottom: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.lightGray,
  },
  questionNumber: {
    fontSize: 9,
    fontWeight: 700,
    color: colors.primary,
    marginBottom: 2,
  },
  questionText: {
    fontSize: 11,
    fontWeight: 600,
    color: colors.dark,
    marginBottom: 4,
  },
  questionDescription: {
    fontSize: 9,
    color: colors.gray,
    marginBottom: 8,
    fontStyle: 'italic',
  },
  optionRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 4,
    paddingLeft: 8,
  },
  checkbox: {
    width: 12,
    height: 12,
    borderWidth: 1,
    borderColor: colors.dark,
    marginRight: 8,
    marginTop: 1,
  },
  optionText: {
    fontSize: 10,
    color: colors.dark,
    flex: 1,
  },
  sectionHeader: {
    backgroundColor: colors.primary,
    padding: 10,
    marginBottom: 12,
    borderRadius: 4,
  },
  sectionHeaderText: {
    fontSize: 12,
    fontWeight: 700,
    color: colors.white,
  },
  table: {
    marginBottom: 16,
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: colors.lightGray,
    paddingVertical: 8,
    paddingHorizontal: 6,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray,
  },
  tableHeaderCell: {
    fontSize: 9,
    fontWeight: 700,
    color: colors.dark,
  },
  tableRow: {
    flexDirection: 'row',
    paddingVertical: 8,
    paddingHorizontal: 6,
    borderBottomWidth: 1,
    borderBottomColor: colors.lightGray,
  },
  tableCell: {
    fontSize: 9,
    color: colors.dark,
  },
  checklistItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    paddingLeft: 4,
  },
  checklistBox: {
    width: 10,
    height: 10,
    borderWidth: 1,
    borderColor: colors.dark,
    marginRight: 8,
  },
  checklistText: {
    fontSize: 10,
    color: colors.dark,
    flex: 1,
  },
  checklistOptions: {
    flexDirection: 'row',
    marginLeft: 'auto',
    gap: 8,
  },
  checklistOption: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  checklistOptionText: {
    fontSize: 8,
    color: colors.gray,
    marginLeft: 4,
  },
  infoBox: {
    backgroundColor: colors.lightGray,
    padding: 12,
    borderRadius: 4,
    marginBottom: 16,
  },
  infoBoxTitle: {
    fontSize: 11,
    fontWeight: 600,
    color: colors.dark,
    marginBottom: 6,
  },
  infoBoxText: {
    fontSize: 9,
    color: colors.gray,
    lineHeight: 1.5,
  },
  notesSection: {
    marginTop: 20,
  },
  notesLabel: {
    fontSize: 10,
    fontWeight: 600,
    color: colors.dark,
    marginBottom: 8,
  },
  notesLines: {
    borderBottomWidth: 1,
    borderBottomColor: colors.lightGray,
    height: 24,
    marginBottom: 4,
  },
  signatureLine: {
    marginTop: 40,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  signatureBlock: {
    width: '45%',
  },
  signatureLabel: {
    fontSize: 9,
    color: colors.gray,
    marginTop: 4,
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
});

// Group questions by section
function getQuestionsBySection(): Record<string, typeof QUESTIONS> {
  const grouped: Record<string, typeof QUESTIONS> = {};
  SECTION_ORDER.forEach(section => {
    grouped[section] = QUESTIONS.filter(q => q.section === section);
  });
  return grouped;
}

// Cover Page
const CoverPage = () => (
  <Page size="A4" style={styles.coverPage}>
    <Text style={styles.coverTagline}>{sanitizePdfText('AURA INTERCEPT')}</Text>
    <Text style={styles.coverTitle}>{sanitizePdfText('Company Onboarding')}</Text>
    <Text style={styles.coverTitle}>{sanitizePdfText('Workbook')}</Text>
    <Text style={styles.coverSubtitle}>
      {sanitizePdfText('Everything we need to launch your AI platform — fill this out before kickoff.')}
    </Text>
    <View style={{ marginTop: 40 }}>
      <Text style={{ fontSize: 11, color: '#a5b4fc', textAlign: 'center', marginBottom: 8 }}>
        {sanitizePdfText('This document includes:')}
      </Text>
      <Text style={{ fontSize: 10, color: colors.white, textAlign: 'center', marginBottom: 4 }}>
        {sanitizePdfText(`${SAFE_BULLET} How to use this workbook + master document checklist`)}
      </Text>
      <Text style={{ fontSize: 10, color: colors.white, textAlign: 'center', marginBottom: 4 }}>
        {sanitizePdfText(`${SAFE_BULLET} Company profile, hours, service area, branding`)}
      </Text>
      <Text style={{ fontSize: 10, color: colors.white, textAlign: 'center', marginBottom: 4 }}>
        {sanitizePdfText(`${SAFE_BULLET} 3rd-party account worksheet (SignalWire, ElevenLabs, Resend, Tavily, Stripe, A2P 10DLC, Google, Social)`)}
      </Text>
      <Text style={{ fontSize: 10, color: colors.white, textAlign: 'center', marginBottom: 4 }}>
        {sanitizePdfText(`${SAFE_BULLET} Brand voice + knowledge base intake`)}
      </Text>
      <Text style={{ fontSize: 10, color: colors.white, textAlign: 'center', marginBottom: 4 }}>
        {sanitizePdfText(`${SAFE_BULLET} Industry-specific intake pack`)}
      </Text>
      <Text style={{ fontSize: 10, color: colors.white, textAlign: 'center', marginBottom: 4 }}>
        {sanitizePdfText(`${SAFE_BULLET} Communication routing + employee/technician roster`)}
      </Text>
      <Text style={{ fontSize: 10, color: colors.white, textAlign: 'center', marginBottom: 4 }}>
        {sanitizePdfText(`${SAFE_BULLET} Booking, customer portal, Smart Website inputs`)}
      </Text>
      <Text style={{ fontSize: 10, color: colors.white, textAlign: 'center', marginBottom: 4 }}>
        {sanitizePdfText(`${SAFE_BULLET} 30-question AI Opportunity Audit + sign-off`)}
      </Text>
    </View>
    <Text style={styles.coverVersion}>
      {sanitizePdfText('Version 2026.1 | (c) Aura Intercept')}
    </Text>
  </Page>
);

// Page Header Component
const PageHeader = ({ title, pageNum }: { title: string; pageNum: number }) => (
  <View style={styles.header}>
    <Text style={styles.headerTitle}>{sanitizePdfText(`Company Onboarding Questionnaire | ${title}`)}</Text>
    <Text style={styles.pageNumber}>{sanitizePdfText(`Page ${pageNum}`)}</Text>
  </View>
);

// Company Profile Page
const CompanyProfilePage = () => (
  <Page size="A4" style={styles.page}>
    <PageHeader title="Company Profile" pageNum={2} />
    <Text style={styles.sectionTitle}>{sanitizePdfText('Section 1: Company Profile')}</Text>
    <Text style={styles.paragraph}>
      {sanitizePdfText('Please provide your company information for dashboard setup and branding configuration.')}
    </Text>
    
    <Text style={styles.subsectionTitle}>{sanitizePdfText('Basic Information')}</Text>
    
    <View style={styles.formRow}>
      <Text style={styles.formLabel}>{sanitizePdfText('Company Name:')}</Text>
      <View style={styles.formLine} />
    </View>
    
    <View style={styles.formRow}>
      <Text style={styles.formLabel}>{sanitizePdfText('DBA (if different):')}</Text>
      <View style={styles.formLine} />
    </View>
    
    <View style={styles.formRow}>
      <Text style={styles.formLabel}>{sanitizePdfText('Website URL:')}</Text>
      <View style={styles.formLine} />
    </View>
    
    <View style={styles.formRow}>
      <Text style={styles.formLabel}>{sanitizePdfText('Industry/Business Type:')}</Text>
      <View style={styles.formLine} />
    </View>
    <Text style={styles.formNote}>{sanitizePdfText('(Circle one: HVAC, Plumbing, Electrical, Solar, Roofing, Fencing & Decking, Landscape & Trees, Pool & Spa, Pest Control, Appliance Repair, Handyman & Cleaning, Construction, Auto Care, Security Systems, Real Estate, Beauty & Wellness, Restaurants, Personal Assistant, Home Health, Physical Therapy, Occupational Therapy, Hospice, Veterinary, Medical Practice, Other)')}</Text>
    
    <View style={styles.formRow}>
      <Text style={styles.formLabel}>{sanitizePdfText('Years in Business:')}</Text>
      <View style={styles.formLine} />
    </View>

    <Text style={styles.subsectionTitle}>{sanitizePdfText('Primary Contact (Admin Account)')}</Text>
    
    <View style={styles.formRow}>
      <Text style={styles.formLabel}>{sanitizePdfText('Full Name:')}</Text>
      <View style={styles.formLine} />
    </View>
    
    <View style={styles.formRow}>
      <Text style={styles.formLabel}>{sanitizePdfText('Job Title:')}</Text>
      <View style={styles.formLine} />
    </View>
    <Text style={styles.formNote}>{sanitizePdfText('(Common: Owner, Co-Owner, CEO, President, General Manager, Operations Manager, Office Manager, Admin / Receptionist, Sales Manager, Sales Rep, Marketing Manager, Customer Service Lead, Bookkeeper. Or write in your industry-specific role.)')}</Text>
    
    <View style={styles.formRow}>
      <Text style={styles.formLabel}>{sanitizePdfText('Email Address:')}</Text>
      <View style={styles.formLine} />
    </View>
    <Text style={styles.formNote}>{sanitizePdfText('(This will be the login email for the admin account)')}</Text>
    
    <View style={styles.formRow}>
      <Text style={styles.formLabel}>{sanitizePdfText('Phone Number:')}</Text>
      <View style={styles.formLine} />
    </View>
    <Text style={styles.formNote}>{sanitizePdfText('(For SMS notifications and 2FA)')}</Text>

    <Text style={styles.subsectionTitle}>{sanitizePdfText('Business Address')}</Text>
    
    <View style={styles.formRow}>
      <Text style={styles.formLabel}>{sanitizePdfText('Street Address:')}</Text>
      <View style={styles.formLine} />
    </View>
    
    <View style={styles.formRow}>
      <Text style={styles.formLabel}>{sanitizePdfText('City, State, ZIP:')}</Text>
      <View style={styles.formLine} />
    </View>
    
    <Text style={styles.subsectionTitle}>{sanitizePdfText('Branding')}</Text>
    
    <View style={styles.formRow}>
      <Text style={styles.formLabel}>{sanitizePdfText('Primary Brand Color:')}</Text>
      <View style={styles.formLine} />
    </View>
    <Text style={styles.formNote}>{sanitizePdfText('(Hex code e.g., #6366f1 or color name)')}</Text>
    
    <View style={styles.formRow}>
      <Text style={styles.formLabel}>{sanitizePdfText('Secondary Brand Color:')}</Text>
      <View style={styles.formLine} />
    </View>
    
    <View style={styles.infoBox}>
      <Text style={styles.infoBoxTitle}>{sanitizePdfText('Logo Upload')}</Text>
      <Text style={styles.infoBoxText}>
        {sanitizePdfText('Please email your company logo (PNG or SVG format, min 200x200px) to your implementation specialist or upload via the dashboard after onboarding.')}
      </Text>
    </View>
  </Page>
);

// Business Operations Page
const BusinessOperationsPage = () => (
  <Page size="A4" style={styles.page}>
    <PageHeader title="Business Operations" pageNum={3} />
    <Text style={styles.sectionTitle}>{sanitizePdfText('Section 2: Business Operations')}</Text>
    <Text style={styles.paragraph}>
      {sanitizePdfText('This information helps us configure your subscription tier, employee limits, and operational features.')}
    </Text>

    <Text style={styles.subsectionTitle}>{sanitizePdfText('Team Size & Structure')}</Text>
    
    <View style={styles.formRow}>
      <Text style={styles.formLabel}>{sanitizePdfText('Total Employee Count:')}</Text>
      <View style={styles.formLine} />
    </View>
    
    <View style={styles.formRow}>
      <Text style={styles.formLabel}>{sanitizePdfText('Field Technicians/Staff:')}</Text>
      <View style={styles.formLine} />
    </View>
    
    <View style={styles.formRow}>
      <Text style={styles.formLabel}>{sanitizePdfText('Office/Admin Staff:')}</Text>
      <View style={styles.formLine} />
    </View>
    
    <View style={styles.formRow}>
      <Text style={styles.formLabel}>{sanitizePdfText('Number of Locations:')}</Text>
      <View style={styles.formLine} />
    </View>

    <Text style={styles.subsectionTitle}>{sanitizePdfText('Financial Information')}</Text>
    
    <View style={styles.formRow}>
      <Text style={styles.formLabel}>{sanitizePdfText('Approx. Annual Revenue:')}</Text>
      <View style={styles.formLine} />
    </View>
    
    <View style={styles.formRow}>
      <Text style={styles.formLabel}>{sanitizePdfText('Avg. Service Ticket Value:')}</Text>
      <View style={styles.formLine} />
    </View>

    <Text style={styles.subsectionTitle}>{sanitizePdfText('Business Hours')}</Text>
    
    <View style={styles.table}>
      <View style={styles.tableHeader}>
        <Text style={[styles.tableHeaderCell, { width: 80 }]}>{sanitizePdfText('Day')}</Text>
        <Text style={[styles.tableHeaderCell, { width: 100 }]}>{sanitizePdfText('Open Time')}</Text>
        <Text style={[styles.tableHeaderCell, { width: 100 }]}>{sanitizePdfText('Close Time')}</Text>
        <Text style={[styles.tableHeaderCell, { flex: 1 }]}>{sanitizePdfText('Closed?')}</Text>
      </View>
      {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map(day => (
        <View key={day} style={styles.tableRow}>
          <Text style={[styles.tableCell, { width: 80 }]}>{sanitizePdfText(day)}</Text>
          <Text style={[styles.tableCell, { width: 100 }]}>{sanitizePdfText('_________')}</Text>
          <Text style={[styles.tableCell, { width: 100 }]}>{sanitizePdfText('_________')}</Text>
          <Text style={[styles.tableCell, { flex: 1 }]}>{sanitizePdfText('[ ]')}</Text>
        </View>
      ))}
    </View>

    <Text style={styles.subsectionTitle}>{sanitizePdfText('Service Area')}</Text>
    
    <View style={styles.formRow}>
      <Text style={styles.formLabel}>{sanitizePdfText('Service Cities:')}</Text>
      <View style={styles.formLine} />
    </View>
    
    <View style={styles.formRow}>
      <Text style={styles.formLabel}>{sanitizePdfText('Service ZIP Codes:')}</Text>
      <View style={styles.formLine} />
    </View>
    
    <View style={styles.formRow}>
      <Text style={styles.formLabel}>{sanitizePdfText('Max Service Radius:')}</Text>
      <View style={styles.formLine} />
    </View>

    <Text style={styles.subsectionTitle}>{sanitizePdfText('Emergency Contact')}</Text>
    
    <View style={styles.formRow}>
      <Text style={styles.formLabel}>{sanitizePdfText('After-Hours Phone:')}</Text>
      <View style={styles.formLine} />
    </View>
    
    <View style={styles.formRow}>
      <Text style={styles.formLabel}>{sanitizePdfText('Emergency Email:')}</Text>
      <View style={styles.formLine} />
    </View>
  </Page>
);

// Audit Questions Pages
const AuditQuestionsPages = () => {
  const questionsBySection = getQuestionsBySection();
  const pages: JSX.Element[] = [];
  let currentPageQuestions: typeof QUESTIONS = [];
  let pageNum = 4;
  let questionNum = 0;

  // Create pages with ~4 questions each
  SECTION_ORDER.forEach((section, sectionIdx) => {
    const sectionQuestions = questionsBySection[section];
    
    sectionQuestions.forEach((question, qIdx) => {
      questionNum++;
      currentPageQuestions.push(question);
      
      // Create new page every 4 questions or when section changes significantly
      if (currentPageQuestions.length >= 4 || (qIdx === sectionQuestions.length - 1 && sectionIdx < SECTION_ORDER.length - 1)) {
        const isFirstOfSection = currentPageQuestions[0].section === section && qIdx < 4;
        
        pages.push(
          <Page key={`audit-${pageNum}`} size="A4" style={styles.page}>
            <PageHeader title="AI Opportunity Audit" pageNum={pageNum} />
            {isFirstOfSection && qIdx < 4 && (
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionHeaderText}>
                  {sanitizePdfText(`Section ${String.fromCharCode(65 + sectionIdx)}: ${section}`)}
                </Text>
              </View>
            )}
            {currentPageQuestions.map((q, idx) => (
              <View key={q.id} style={styles.questionContainer}>
                <Text style={styles.questionNumber}>
                  {sanitizePdfText(`Q${questionNum - currentPageQuestions.length + idx + 1}`)}
                </Text>
                <Text style={styles.questionText}>{sanitizePdfText(q.question)}</Text>
                {q.description && (
                  <Text style={styles.questionDescription}>{sanitizePdfText(q.description)}</Text>
                )}
                {q.options.map((opt, optIdx) => (
                  <View key={optIdx} style={styles.optionRow}>
                    <View style={styles.checkbox} />
                    <Text style={styles.optionText}>{sanitizePdfText(opt.label)}</Text>
                  </View>
                ))}
              </View>
            ))}
          </Page>
        );
        pageNum++;
        currentPageQuestions = [];
      }
    });
  });

  // Handle remaining questions
  if (currentPageQuestions.length > 0) {
    pages.push(
      <Page key={`audit-${pageNum}`} size="A4" style={styles.page}>
        <PageHeader title="AI Opportunity Audit" pageNum={pageNum} />
        {currentPageQuestions.map((q, idx) => (
          <View key={q.id} style={styles.questionContainer}>
            <Text style={styles.questionNumber}>
              {sanitizePdfText(`Q${questionNum - currentPageQuestions.length + idx + 1}`)}
            </Text>
            <Text style={styles.questionText}>{sanitizePdfText(q.question)}</Text>
            {q.description && (
              <Text style={styles.questionDescription}>{sanitizePdfText(q.description)}</Text>
            )}
            {q.options.map((opt, optIdx) => (
              <View key={optIdx} style={styles.optionRow}>
                <View style={styles.checkbox} />
                <Text style={styles.optionText}>{sanitizePdfText(opt.label)}</Text>
              </View>
            ))}
          </View>
        ))}
      </Page>
    );
  }

  return <>{pages}</>;
};

// Integration Requirements Page
const IntegrationRequirementsPage = () => {
  const integrations = [
    { name: 'SignalWire', purpose: 'Voice & SMS Communications — your own account · valid card · billed directly by SignalWire', tiers: 'All tiers — Core, Boost, Pro, Elite' },
    { name: 'ElevenLabs', purpose: 'AI Voice Synthesis — your own account · valid card · billed directly by ElevenLabs', tiers: 'All tiers — Core, Boost, Pro, Elite' },
    { name: 'Resend', purpose: 'Email Delivery — your own account · valid card · billed directly by Resend', tiers: 'All tiers — Core, Boost, Pro, Elite' },
    { name: 'Tavily', purpose: 'AI Content Research — your own account · valid card · billed directly by Tavily', tiers: 'All tiers — Core, Boost, Pro, Elite' },
    { name: 'Stripe', purpose: 'Payment Processing — your own account · billed directly by Stripe', tiers: 'All tiers — required if collecting payments' },
    { name: 'Google Calendar', purpose: 'Calendar Sync', tiers: 'Boost, Pro, Elite (Optional)' },
    { name: 'Social Media Accounts', purpose: 'Content Publishing', tiers: 'Pro, Elite' },
  ];

  return (
    <Page size="A4" style={styles.page}>
      <PageHeader title="Integration Requirements" pageNum={12} />
      <Text style={styles.sectionTitle}>{sanitizePdfText('Section 4: Integration Requirements')}</Text>
      <Text style={styles.paragraph}>
        {sanitizePdfText('Check each integration you have set up or need assistance with. We will help configure these during implementation.')}
      </Text>

      <View style={styles.table}>
        <View style={styles.tableHeader}>
          <Text style={[styles.tableHeaderCell, { width: 100 }]}>{sanitizePdfText('Integration')}</Text>
          <Text style={[styles.tableHeaderCell, { width: 140 }]}>{sanitizePdfText('Purpose')}</Text>
          <Text style={[styles.tableHeaderCell, { width: 60 }]}>{sanitizePdfText('Have It')}</Text>
          <Text style={[styles.tableHeaderCell, { width: 60 }]}>{sanitizePdfText('Need Help')}</Text>
          <Text style={[styles.tableHeaderCell, { flex: 1 }]}>{sanitizePdfText('N/A')}</Text>
        </View>
        {integrations.map(int => (
          <View key={int.name} style={styles.tableRow}>
            <Text style={[styles.tableCell, { width: 100, fontWeight: 600 }]}>{sanitizePdfText(int.name)}</Text>
            <Text style={[styles.tableCell, { width: 140 }]}>{sanitizePdfText(int.purpose)}</Text>
            <Text style={[styles.tableCell, { width: 60, textAlign: 'center' }]}>{sanitizePdfText('[ ]')}</Text>
            <Text style={[styles.tableCell, { width: 60, textAlign: 'center' }]}>{sanitizePdfText('[ ]')}</Text>
            <Text style={[styles.tableCell, { flex: 1, textAlign: 'center' }]}>{sanitizePdfText('[ ]')}</Text>
          </View>
        ))}
      </View>

      <Text style={styles.subsectionTitle}>{sanitizePdfText('Existing Account Details (if applicable)')}</Text>
      
      <View style={styles.formRow}>
        <Text style={styles.formLabel}>{sanitizePdfText('SignalWire Project ID:')}</Text>
        <View style={styles.formLine} />
      </View>
      
      <View style={styles.formRow}>
        <Text style={styles.formLabel}>{sanitizePdfText('SignalWire Phone Number:')}</Text>
        <View style={styles.formLine} />
      </View>
      
      <View style={styles.formRow}>
        <Text style={styles.formLabel}>{sanitizePdfText('ElevenLabs API Key:')}</Text>
        <View style={styles.formLine} />
      </View>
      
      <View style={styles.formRow}>
        <Text style={styles.formLabel}>{sanitizePdfText('Stripe Account Email:')}</Text>
        <View style={styles.formLine} />
      </View>
      
      <View style={styles.formRow}>
        <Text style={styles.formLabel}>{sanitizePdfText('Google Account Email:')}</Text>
        <View style={styles.formLine} />
      </View>

      <View style={styles.infoBox}>
        <Text style={styles.infoBoxTitle}>{sanitizePdfText('Security Note')}</Text>
        <Text style={styles.infoBoxText}>
          {sanitizePdfText('API keys and secrets will be securely configured during your onboarding call. Never share secrets via email or insecure channels.')}
        </Text>
      </View>
    </Page>
  );
};

// Knowledge Base Setup Page
const KnowledgeBasePage = () => (
  <Page size="A4" style={styles.page}>
    <PageHeader title="Knowledge Base Setup" pageNum={13} />
    <Text style={styles.sectionTitle}>{sanitizePdfText('Section 5: Knowledge Base Setup')}</Text>
    <Text style={styles.paragraph}>
      {sanitizePdfText('This information helps your AI assistant answer customer questions accurately.')}
    </Text>

    <Text style={styles.subsectionTitle}>{sanitizePdfText('Services Offered')}</Text>
    <View style={styles.table}>
      <View style={styles.tableHeader}>
        <Text style={[styles.tableHeaderCell, { width: 140 }]}>{sanitizePdfText('Service Name')}</Text>
        <Text style={[styles.tableHeaderCell, { width: 60 }]}>{sanitizePdfText('Duration')}</Text>
        <Text style={[styles.tableHeaderCell, { width: 70 }]}>{sanitizePdfText('Price')}</Text>
        <Text style={[styles.tableHeaderCell, { flex: 1 }]}>{sanitizePdfText('Description')}</Text>
      </View>
      {[1, 2, 3, 4, 5, 6, 7, 8].map(i => (
        <View key={i} style={styles.tableRow}>
          <Text style={[styles.tableCell, { width: 140 }]}>{sanitizePdfText('')}</Text>
          <Text style={[styles.tableCell, { width: 60 }]}>{sanitizePdfText('')}</Text>
          <Text style={[styles.tableCell, { width: 70 }]}>{sanitizePdfText('')}</Text>
          <Text style={[styles.tableCell, { flex: 1 }]}>{sanitizePdfText('')}</Text>
        </View>
      ))}
    </View>

    <Text style={styles.subsectionTitle}>{sanitizePdfText('Frequently Asked Questions')}</Text>
    <View style={styles.table}>
      <View style={styles.tableHeader}>
        <Text style={[styles.tableHeaderCell, { width: 200 }]}>{sanitizePdfText('Question')}</Text>
        <Text style={[styles.tableHeaderCell, { flex: 1 }]}>{sanitizePdfText('Answer')}</Text>
      </View>
      {[1, 2, 3, 4, 5, 6].map(i => (
        <View key={i} style={[styles.tableRow, { minHeight: 28 }]}>
          <Text style={[styles.tableCell, { width: 200 }]}>{sanitizePdfText('')}</Text>
          <Text style={[styles.tableCell, { flex: 1 }]}>{sanitizePdfText('')}</Text>
        </View>
      ))}
    </View>
  </Page>
);

// Knowledge Base Page 2
const KnowledgeBasePage2 = () => (
  <Page size="A4" style={styles.page}>
    <PageHeader title="Knowledge Base Setup" pageNum={14} />
    
    <Text style={styles.subsectionTitle}>{sanitizePdfText('Competitor Differentiators')}</Text>
    <Text style={styles.paragraph}>{sanitizePdfText('What makes your business unique? List 3-5 key differentiators:')}</Text>
    
    {[1, 2, 3, 4, 5].map(i => (
      <View key={i} style={styles.formRow}>
        <Text style={styles.formLabel}>{sanitizePdfText(`${i}.`)}</Text>
        <View style={styles.formLine} />
      </View>
    ))}

    <Text style={styles.subsectionTitle}>{sanitizePdfText('Common Customer Questions')}</Text>
    <Text style={styles.paragraph}>{sanitizePdfText('What questions do customers frequently ask?')}</Text>
    
    {[1, 2, 3, 4, 5, 6, 7, 8].map(i => (
      <View key={i} style={styles.formRow}>
        <Text style={{ fontSize: 10, width: 20 }}>{sanitizePdfText(`${i}.`)}</Text>
        <View style={styles.formLine} />
      </View>
    ))}

    <Text style={styles.subsectionTitle}>{sanitizePdfText('Service Area Notes')}</Text>
    <Text style={styles.paragraph}>{sanitizePdfText('Any special notes about your service area (travel fees, exclusions, etc.):')}</Text>
    
    <View style={styles.notesLines} />
    <View style={styles.notesLines} />
    <View style={styles.notesLines} />
    <View style={styles.notesLines} />
  </Page>
);

// Employee Information Page
const EmployeeInfoPage = () => (
  <Page size="A4" style={styles.page}>
    <PageHeader title="Employee Information" pageNum={15} />
    <Text style={styles.sectionTitle}>{sanitizePdfText('Section 6: Employee Accounts')}</Text>
    <Text style={styles.paragraph}>
      {sanitizePdfText('List employees who need dashboard access. Job types: Owner, Manager, Technician, Admin, Sales.')}
    </Text>

    <View style={styles.table}>
      <View style={styles.tableHeader}>
        <Text style={[styles.tableHeaderCell, { width: 120 }]}>{sanitizePdfText('Full Name')}</Text>
        <Text style={[styles.tableHeaderCell, { width: 140 }]}>{sanitizePdfText('Email')}</Text>
        <Text style={[styles.tableHeaderCell, { width: 90 }]}>{sanitizePdfText('Phone')}</Text>
        <Text style={[styles.tableHeaderCell, { flex: 1 }]}>{sanitizePdfText('Job Type')}</Text>
      </View>
      {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(i => (
        <View key={i} style={styles.tableRow}>
          <Text style={[styles.tableCell, { width: 120 }]}>{sanitizePdfText('')}</Text>
          <Text style={[styles.tableCell, { width: 140 }]}>{sanitizePdfText('')}</Text>
          <Text style={[styles.tableCell, { width: 90 }]}>{sanitizePdfText('')}</Text>
          <Text style={[styles.tableCell, { flex: 1 }]}>{sanitizePdfText('')}</Text>
        </View>
      ))}
    </View>

    <View style={styles.infoBox}>
      <Text style={styles.infoBoxTitle}>{sanitizePdfText('Employee Limits by Tier')}</Text>
      <Text style={styles.infoBoxText}>
        {sanitizePdfText('Aura Core: 10 employees | Aura Boost: 25 employees | Aura Pro: 50 employees | Aura Elite: Unlimited employees')}
      </Text>
    </View>
  </Page>
);

// Goals & Notes Page
const GoalsNotesPage = () => (
  <Page size="A4" style={styles.page}>
    <PageHeader title="Goals & Notes" pageNum={16} />
    <Text style={styles.sectionTitle}>{sanitizePdfText('Section 7: Goals & Additional Notes')}</Text>

    <Text style={styles.subsectionTitle}>{sanitizePdfText('Top 3 Pain Points')}</Text>
    <Text style={styles.paragraph}>{sanitizePdfText('What are your biggest operational challenges right now?')}</Text>
    
    <View style={styles.formRow}>
      <Text style={styles.formLabel}>{sanitizePdfText('1.')}</Text>
      <View style={styles.formLine} />
    </View>
    <View style={styles.formRow}>
      <Text style={styles.formLabel}>{sanitizePdfText('2.')}</Text>
      <View style={styles.formLine} />
    </View>
    <View style={styles.formRow}>
      <Text style={styles.formLabel}>{sanitizePdfText('3.')}</Text>
      <View style={styles.formLine} />
    </View>

    <Text style={styles.subsectionTitle}>{sanitizePdfText('Success Metrics')}</Text>
    <Text style={styles.paragraph}>{sanitizePdfText('What would success look like in 60 days?')}</Text>
    
    <View style={styles.notesLines} />
    <View style={styles.notesLines} />
    <View style={styles.notesLines} />

    <Text style={styles.subsectionTitle}>{sanitizePdfText('Features You Are Most Excited About')}</Text>
    
    <View style={styles.notesLines} />
    <View style={styles.notesLines} />

    <Text style={styles.subsectionTitle}>{sanitizePdfText('Additional Notes or Questions')}</Text>
    
    <View style={styles.notesLines} />
    <View style={styles.notesLines} />
    <View style={styles.notesLines} />
    <View style={styles.notesLines} />

    <View style={styles.signatureLine}>
      <View style={styles.signatureBlock}>
        <View style={[styles.formLine, { marginBottom: 0 }]} />
        <Text style={styles.signatureLabel}>{sanitizePdfText('Signature')}</Text>
      </View>
      <View style={styles.signatureBlock}>
        <View style={[styles.formLine, { marginBottom: 0 }]} />
        <Text style={styles.signatureLabel}>{sanitizePdfText('Date')}</Text>
      </View>
    </View>

    <View style={styles.footer}>
      <Text>{sanitizePdfText('(c) 2026 Aura Intercept')}</Text>
      <Text>{sanitizePdfText('Confidential - For Internal Use Only')}</Text>
    </View>
  </Page>
);

// ============================================================
// EXPANDED INTAKE PAGES
// ============================================================

const HowToUsePage = () => (
  <Page size="A4" style={styles.page}>
    <PageHeader title="How to Use This Workbook" pageNum={2} />
    <Text style={styles.sectionTitle}>{sanitizePdfText('How to Use This Workbook')}</Text>
    <Text style={styles.paragraph}>
      {sanitizePdfText('This workbook is everything our onboarding team needs from you to stand up your Aura Intercept platform end-to-end. The more complete this is when you return it, the faster we launch — most fully prepared customers go live in 5-10 business days.')}
    </Text>
    <Text style={styles.subsectionTitle}>{sanitizePdfText('Steps')}</Text>
    <View style={styles.optionRow}><View style={styles.checkbox} /><Text style={styles.optionText}>{sanitizePdfText('1. Fill out every section below that applies to your business.')}</Text></View>
    <View style={styles.optionRow}><View style={styles.checkbox} /><Text style={styles.optionText}>{sanitizePdfText('2. Gather the documents & assets listed on the Master Document Checklist (next page).')}</Text></View>
    <View style={styles.optionRow}><View style={styles.checkbox} /><Text style={styles.optionText}>{sanitizePdfText('3. Confirm you have or will create the 3rd-party accounts listed in the 3rd-Party Worksheet (with billing card on file).')}</Text></View>
    <View style={styles.optionRow}><View style={styles.checkbox} /><Text style={styles.optionText}>{sanitizePdfText('4. Email the completed PDF + attachments to onboarding@auraintercept.ai.')}</Text></View>
    <View style={styles.optionRow}><View style={styles.checkbox} /><Text style={styles.optionText}>{sanitizePdfText('5. We will schedule your kickoff call within 1 business day of receipt.')}</Text></View>

    <Text style={styles.subsectionTitle}>{sanitizePdfText('Kickoff Details')}</Text>
    <View style={styles.formRow}><Text style={styles.formLabel}>{sanitizePdfText('Company / Legal Name:')}</Text><View style={styles.formLine} /></View>
    <View style={styles.formRow}><Text style={styles.formLabel}>{sanitizePdfText('Date Completed:')}</Text><View style={styles.formLine} /></View>
    <View style={styles.formRow}><Text style={styles.formLabel}>{sanitizePdfText('Tier Selected:')}</Text><View style={styles.formLine} /></View>
    <Text style={styles.formNote}>{sanitizePdfText('(Beta Pricing: Core $497 (was $697) · Boost $994 (was $1,394) · Pro $1,988 (was $2,788) · Elite $3,979 (was $5,576) / month. Onboarding fee = 1 month of plan, 50% OFF during Beta: Core $249 (was $497) · Boost $497 (was $994) · Pro $994 (was $1,988) · Elite $1,990 (was $3,979), due at start.)')}</Text>
    <View style={styles.formRow}><Text style={styles.formLabel}>{sanitizePdfText('Target Go-Live Date:')}</Text><View style={styles.formLine} /></View>
    <View style={styles.formRow}><Text style={styles.formLabel}>{sanitizePdfText('Primary Onboarding Contact:')}</Text><View style={styles.formLine} /></View>

    <View style={styles.infoBox}>
      <Text style={styles.infoBoxTitle}>{sanitizePdfText('Important — 3rd-Party Costs')}</Text>
      <Text style={styles.infoBoxText}>
        {sanitizePdfText('Every 3rd-party provider (SignalWire, ElevenLabs, Resend, Tavily, Stripe, A2P 10DLC, social platforms) requires YOUR own account with a valid credit card. Each invoices you directly, separately from your Aura plan. Your plan covers the platform only — never resold or marked up.')}
      </Text>
    </View>
  </Page>
);

const DocumentChecklistPage = () => {
  const items = [
    { cat: 'Brand', label: 'Company logo (SVG + PNG, transparent background, min 512x512)' },
    { cat: 'Brand', label: 'Favicon (ICO or 512x512 PNG)' },
    { cat: 'Brand', label: 'Primary + secondary brand colors (hex)' },
    { cat: 'Brand', label: 'Preferred fonts (or screenshots of current website)' },
    { cat: 'Legal', label: 'Business license / certificate of formation' },
    { cat: 'Legal', label: 'EIN confirmation letter (CP 575) — required for A2P 10DLC' },
    { cat: 'Legal', label: 'W-9 (for Stripe payouts)' },
    { cat: 'Legal', label: 'Certificate of insurance (field-service businesses)' },
    { cat: 'Web', label: 'Existing website URL + admin login (if migrating)' },
    { cat: 'Web', label: 'DNS registrar login (to add CNAME / TXT records)' },
    { cat: 'Data', label: 'Existing customer list (CSV: name, email, phone, address)' },
    { cat: 'Data', label: 'Existing employee/technician list (CSV: name, email, phone, role)' },
    { cat: 'Data', label: 'Service catalog / price list' },
    { cat: 'Data', label: 'Sample quote template' },
    { cat: 'Data', label: 'Sample invoice template' },
    { cat: 'Content', label: '5-10 photos: team, storefront, completed work' },
    { cat: 'Content', label: 'Testimonials or Google review screenshots (5+)' },
    { cat: 'Content', label: 'About-us paragraph or bullet points' },
    { cat: 'Voice', label: 'Voicemail greeting script' },
    { cat: 'Voice', label: 'After-hours greeting script' },
    { cat: 'Voice', label: 'Auto-attendant menu (if any)' },
  ];
  return (
    <Page size="A4" style={styles.page}>
      <PageHeader title="Master Document Checklist" pageNum={3} />
      <Text style={styles.sectionTitle}>{sanitizePdfText('Master Document & Asset Checklist')}</Text>
      <Text style={styles.paragraph}>
        {sanitizePdfText('Tick each item as you attach it to your onboarding email. Items marked "field-service" only apply if you dispatch technicians.')}
      </Text>
      <View style={styles.table}>
        <View style={styles.tableHeader}>
          <Text style={[styles.tableHeaderCell, { width: 30 }]}>{sanitizePdfText(' ')}</Text>
          <Text style={[styles.tableHeaderCell, { width: 70 }]}>{sanitizePdfText('Category')}</Text>
          <Text style={[styles.tableHeaderCell, { flex: 1 }]}>{sanitizePdfText('Item')}</Text>
          <Text style={[styles.tableHeaderCell, { width: 60, textAlign: 'center' }]}>{sanitizePdfText('Attached')}</Text>
        </View>
        {items.map((it, i) => (
          <View key={i} style={styles.tableRow}>
            <View style={{ width: 30 }}><View style={styles.checklistBox} /></View>
            <Text style={[styles.tableCell, { width: 70, fontWeight: 600 }]}>{sanitizePdfText(it.cat)}</Text>
            <Text style={[styles.tableCell, { flex: 1 }]}>{sanitizePdfText(it.label)}</Text>
            <Text style={[styles.tableCell, { width: 60, textAlign: 'center' }]}>{sanitizePdfText('[ ]')}</Text>
          </View>
        ))}
      </View>
    </Page>
  );
};

const WhyYourOwnAccountsPage = () => (
  <Page size="A4" style={styles.page}>
    <PageHeader title="Why You Hold These Accounts" pageNum={4} />
    <Text style={styles.sectionTitle}>{sanitizePdfText('Why Do I Need My Own Accounts for SignalWire, ElevenLabs, and Resend?')}</Text>

    <Text style={styles.paragraph}>
      {sanitizePdfText("You're not paying us a markup on your phone, voice, or email costs. You hold those accounts directly and pay the provider their actual rate — the same rate any business pays. We don't add a margin on top and resell it back to you as a mystery line item.")}
    </Text>
    <Text style={styles.paragraph}>
      {sanitizePdfText('Other platforms bundle these costs into proprietary add-ons ("Phones Pro," "AI Receptionist," "Marketing Pro") and charge a flat monthly fee regardless of usage. You never see the underlying cost. We\'d rather show you the real number.')}
    </Text>

    <Text style={styles.subsectionTitle}>{sanitizePdfText('What this actually costs (typical small service business)')}</Text>
    <View style={styles.table}>
      <View style={styles.tableHeader}>
        <Text style={[styles.tableHeaderCell, { width: 80 }]}>{sanitizePdfText('Provider')}</Text>
        <Text style={[styles.tableHeaderCell, { flex: 1 }]}>{sanitizePdfText('What it covers')}</Text>
        <Text style={[styles.tableHeaderCell, { width: 140 }]}>{sanitizePdfText('Typical monthly')}</Text>
      </View>
      {[
        ['SignalWire', 'Phone number, inbound/outbound calls, SMS', '~$15-30/mo'],
        ['ElevenLabs', 'Talk to Aura voice synthesis', '$22/mo (Creator)'],
        ['Resend', 'Email confirmations, reminders, campaigns', 'Free to 3k - then $20/mo'],
        ['Total', 'Scales with how busy your phones are', '~$35-70/mo'],
      ].map(([n, p, c]) => (
        <View key={n} style={styles.tableRow}>
          <Text style={[styles.tableCell, { width: 80, fontWeight: 600 }]}>{sanitizePdfText(n)}</Text>
          <Text style={[styles.tableCell, { flex: 1 }]}>{sanitizePdfText(p)}</Text>
          <Text style={[styles.tableCell, { width: 140 }]}>{sanitizePdfText(c)}</Text>
        </View>
      ))}
    </View>
    <Text style={styles.formNote}>
      {sanitizePdfText('One-time setup: SignalWire A2P 10DLC carrier registration (required for business SMS) — small one-time brand fee + ~$10/mo ongoing. Carrier requirement, not specific to Aura.')}
    </Text>

    <Text style={styles.subsectionTitle}>{sanitizePdfText('How this compares')}</Text>
    <View style={styles.table}>
      <View style={styles.tableHeader}>
        <Text style={[styles.tableHeaderCell, { width: 80 }]}>{sanitizePdfText('Item')}</Text>
        <Text style={[styles.tableHeaderCell, { flex: 1 }]}>{sanitizePdfText('AuraIntercept')}</Text>
        <Text style={[styles.tableHeaderCell, { flex: 1 }]}>{sanitizePdfText('ServiceTitan')}</Text>
        <Text style={[styles.tableHeaderCell, { flex: 1 }]}>{sanitizePdfText('Jobber')}</Text>
      </View>
      {[
        ['Phone / voice', 'Provider cost direct (~$15-30/mo)', '"Phones Pro" add-on, $100-300/mo flat', 'Bundled into $199+/mo Grow tier'],
        ['AI receptionist', 'Included (you cover voice ~$22/mo)', 'Not standard - separate cost', '$99/mo flat add-on'],
        ['Marketing', 'Included in your Aura tier', '"Marketing Pro," $200-600+/mo', '"Marketing Suite," $79/mo'],
        ['Transparency', 'You see actual provider invoices', 'Bundled - underlying cost hidden', 'Bundled - underlying cost hidden'],
      ].map(([item, a, st, jb]) => (
        <View key={item} style={styles.tableRow}>
          <Text style={[styles.tableCell, { width: 80, fontWeight: 600 }]}>{sanitizePdfText(item)}</Text>
          <Text style={[styles.tableCell, { flex: 1 }]}>{sanitizePdfText(a)}</Text>
          <Text style={[styles.tableCell, { flex: 1 }]}>{sanitizePdfText(st)}</Text>
          <Text style={[styles.tableCell, { flex: 1 }]}>{sanitizePdfText(jb)}</Text>
        </View>
      ))}
    </View>
    <Text style={styles.formNote}>
      {sanitizePdfText('Based on public competitor pricing as of June 2026 — verify with vendor.')}
    </Text>

    <View style={styles.infoBox}>
      <Text style={styles.infoBoxTitle}>{sanitizePdfText('Short answer to the 3 questions we hear most')}</Text>
      <Text style={styles.infoBoxText}>
        {sanitizePdfText('1) Why not bundle it? — We keep our platform fee separate so neither number is inflated. Your Aura bill never fluctuates with call volume.\n2) Extra setup work? — A little. Concierge Onboarding can create and configure these accounts for you using your login and card.\n3) Do you mark up provider costs? — No. You\'re billed directly by SignalWire, ElevenLabs, and Resend on your own card. We never see or touch that money.')}
      </Text>
    </View>
  </Page>
);

const ThirdPartyAccountsPage = () => {
  const providers = [
    { name: 'SignalWire', purpose: 'Voice calls + SMS', signup: 'signalwire.com', required: 'All tiers' },
    { name: 'ElevenLabs', purpose: 'AI voice synthesis', signup: 'elevenlabs.io', required: 'All tiers (voice ops)' },
    { name: 'Resend', purpose: 'Email sending', signup: 'resend.com', required: 'All tiers (email ops)' },
    { name: 'Tavily', purpose: 'AI web research', signup: 'tavily.com', required: 'Pro, Elite' },
    { name: 'Stripe', purpose: 'Payment processing', signup: 'stripe.com', required: 'If collecting payments' },
    { name: 'A2P 10DLC', purpose: 'SMS carrier registration', signup: 'via SignalWire console', required: 'All tiers sending SMS' },
    { name: 'Google Workspace', purpose: 'Calendar + email aliases', signup: 'workspace.google.com', required: 'Optional, recommended' },
  ];
  return (
    <Page size="A4" style={styles.page}>
      <PageHeader title="3rd-Party Account Worksheet" pageNum={4} />
      <Text style={styles.sectionTitle}>{sanitizePdfText('3rd-Party Account Worksheet')}</Text>
      <Text style={styles.paragraph}>
        {sanitizePdfText('Every provider below is owned by you and billed to you directly. Confirm status for each so we know what to create during Concierge Onboarding.')}
      </Text>
      <View style={styles.table}>
        <View style={styles.tableHeader}>
          <Text style={[styles.tableHeaderCell, { width: 80 }]}>{sanitizePdfText('Provider')}</Text>
          <Text style={[styles.tableHeaderCell, { width: 100 }]}>{sanitizePdfText('Purpose')}</Text>
          <Text style={[styles.tableHeaderCell, { width: 90 }]}>{sanitizePdfText('Sign Up')}</Text>
          <Text style={[styles.tableHeaderCell, { width: 55, textAlign: 'center' }]}>{sanitizePdfText('Have It')}</Text>
          <Text style={[styles.tableHeaderCell, { width: 55, textAlign: 'center' }]}>{sanitizePdfText('Card on File')}</Text>
          <Text style={[styles.tableHeaderCell, { flex: 1, textAlign: 'center' }]}>{sanitizePdfText('Need Setup')}</Text>
        </View>
        {providers.map(p => (
          <View key={p.name} style={styles.tableRow}>
            <Text style={[styles.tableCell, { width: 80, fontWeight: 600 }]}>{sanitizePdfText(p.name)}</Text>
            <Text style={[styles.tableCell, { width: 100 }]}>{sanitizePdfText(p.purpose)}</Text>
            <Text style={[styles.tableCell, { width: 90 }]}>{sanitizePdfText(p.signup)}</Text>
            <Text style={[styles.tableCell, { width: 55, textAlign: 'center' }]}>{sanitizePdfText('[ ]')}</Text>
            <Text style={[styles.tableCell, { width: 55, textAlign: 'center' }]}>{sanitizePdfText('[ ]')}</Text>
            <Text style={[styles.tableCell, { flex: 1, textAlign: 'center' }]}>{sanitizePdfText('[ ]')}</Text>
          </View>
        ))}
      </View>

      <Text style={styles.subsectionTitle}>{sanitizePdfText('Account Owner / Admin Email per Provider')}</Text>
      {['SignalWire', 'ElevenLabs', 'Resend', 'Tavily', 'Stripe', 'Google Workspace'].map(p => (
        <View key={p} style={styles.formRow}>
          <Text style={styles.formLabel}>{sanitizePdfText(`${p}:`)}</Text>
          <View style={styles.formLine} />
        </View>
      ))}

      <View style={styles.infoBox}>
        <Text style={styles.infoBoxTitle}>{sanitizePdfText('Do NOT email API keys or passwords')}</Text>
        <Text style={styles.infoBoxText}>
          {sanitizePdfText('Your implementation specialist will collect credentials in a secure session on your kickoff call.')}
        </Text>
      </View>
    </Page>
  );
};

const A2P10DLCPage = () => (
  <Page size="A4" style={styles.page}>
    <PageHeader title="A2P 10DLC Registration Data" pageNum={5} />
    <Text style={styles.sectionTitle}>{sanitizePdfText('A2P 10DLC SMS Registration')}</Text>
    <Text style={styles.paragraph}>
      {sanitizePdfText('US carriers require every business sending SMS to register. Fill this out exactly as it appears on your business documents — mismatched data is the #1 cause of rejection.')}
    </Text>
    {[
      'Legal Business Name:', 'DBA / Brand Name:', 'EIN:', 'Business Address (street, city, state, ZIP):',
      'Business Phone:', 'Business Website:', 'Business Vertical (e.g. Home Services, Healthcare):',
      'Business Type (LLC, Corp, Sole Prop):', 'State of Registration:', 'Stock Symbol (if public, else N/A):',
      'Authorized Representative Name:', 'Rep Email:', 'Rep Phone:',
    ].map(label => (
      <View key={label} style={styles.formRow}>
        <Text style={[styles.formLabel, { width: 180 }]}>{sanitizePdfText(label)}</Text>
        <View style={styles.formLine} />
      </View>
    ))}

    <Text style={styles.subsectionTitle}>{sanitizePdfText('Sample Messages (need 2-3)')}</Text>
    <Text style={styles.paragraph}>{sanitizePdfText('Examples of SMS you will send (carriers review these).')}</Text>
    <View style={styles.notesLines} /><View style={styles.notesLines} /><View style={styles.notesLines} /><View style={styles.notesLines} />

    <Text style={styles.subsectionTitle}>{sanitizePdfText('Opt-In Language')}</Text>
    <Text style={styles.paragraph}>{sanitizePdfText('Where/how do customers consent to texts? (form, checkbox, verbal — paste your current language)')}</Text>
    <View style={styles.notesLines} /><View style={styles.notesLines} /><View style={styles.notesLines} />
  </Page>
);

const SocialAccountsPage = () => {
  const platforms = ['Facebook', 'Instagram', 'LinkedIn', 'X (Twitter)', 'TikTok', 'YouTube', 'Google Business Profile'];
  return (
    <Page size="A4" style={styles.page}>
      <PageHeader title="Social Accounts" pageNum={6} />
      <Text style={styles.sectionTitle}>{sanitizePdfText('Social Media & Google Business Profile')}</Text>
      <Text style={styles.paragraph}>
        {sanitizePdfText('List the handle/URL and admin email for every account you want Aura to publish to or monitor.')}
      </Text>
      <View style={styles.table}>
        <View style={styles.tableHeader}>
          <Text style={[styles.tableHeaderCell, { width: 100 }]}>{sanitizePdfText('Platform')}</Text>
          <Text style={[styles.tableHeaderCell, { width: 140 }]}>{sanitizePdfText('Handle / URL')}</Text>
          <Text style={[styles.tableHeaderCell, { flex: 1 }]}>{sanitizePdfText('Admin Email')}</Text>
          <Text style={[styles.tableHeaderCell, { width: 50, textAlign: 'center' }]}>{sanitizePdfText('Skip')}</Text>
        </View>
        {platforms.map(p => (
          <View key={p} style={styles.tableRow}>
            <Text style={[styles.tableCell, { width: 100, fontWeight: 600 }]}>{sanitizePdfText(p)}</Text>
            <Text style={[styles.tableCell, { width: 140 }]}>{sanitizePdfText('')}</Text>
            <Text style={[styles.tableCell, { flex: 1 }]}>{sanitizePdfText('')}</Text>
            <Text style={[styles.tableCell, { width: 50, textAlign: 'center' }]}>{sanitizePdfText('[ ]')}</Text>
          </View>
        ))}
      </View>
    </Page>
  );
};

const BrandVoicePage = () => (
  <Page size="A4" style={styles.page}>
    <PageHeader title="Brand Voice" pageNum={7} />
    <Text style={styles.sectionTitle}>{sanitizePdfText('Brand & Voice Worksheet')}</Text>
    <Text style={styles.paragraph}>
      {sanitizePdfText('These answers feed directly into how every AI operative speaks on your behalf — voice calls, SMS, email, web chat, social posts.')}
    </Text>
    <Text style={styles.subsectionTitle}>{sanitizePdfText('Tone (circle or check up to 4)')}</Text>
    {['Friendly & warm', 'Professional & formal', 'Casual & conversational', 'Confident & direct',
      'Empathetic & caring', 'Energetic & playful', 'Expert & authoritative', 'Minimal & efficient'].map(t => (
      <View key={t} style={styles.optionRow}><View style={styles.checkbox} /><Text style={styles.optionText}>{sanitizePdfText(t)}</Text></View>
    ))}
    <Text style={styles.subsectionTitle}>{sanitizePdfText('Words & Phrases to ALWAYS use')}</Text>
    <View style={styles.notesLines} /><View style={styles.notesLines} />
    <Text style={styles.subsectionTitle}>{sanitizePdfText('Words & Phrases to NEVER use')}</Text>
    <View style={styles.notesLines} /><View style={styles.notesLines} />
    <Text style={styles.subsectionTitle}>{sanitizePdfText('Sample Customer Greeting (how you answer the phone today)')}</Text>
    <View style={styles.notesLines} /><View style={styles.notesLines} />
    <Text style={styles.subsectionTitle}>{sanitizePdfText('Sign-Off (email/SMS closing)')}</Text>
    <View style={styles.formRow}><Text style={styles.formLabel}>{sanitizePdfText('Default sign-off:')}</Text><View style={styles.formLine} /></View>
  </Page>
);

const KnowledgeBaseExpandedPage = () => (
  <Page size="A4" style={styles.page}>
    <PageHeader title="Knowledge Base — Policies" pageNum={8} />
    <Text style={styles.sectionTitle}>{sanitizePdfText('Business Policies (Knowledge Base)')}</Text>
    <Text style={styles.paragraph}>
      {sanitizePdfText('Aura quotes these verbatim to customers. Be specific — vague answers create bad customer experiences.')}
    </Text>
    {[
      { l: 'Pricing rules / how you quote:', lines: 3 },
      { l: 'Payment terms (deposit, net, accepted methods):', lines: 2 },
      { l: 'Cancellation / reschedule policy:', lines: 2 },
      { l: 'Refund / warranty / return policy:', lines: 2 },
      { l: 'Service-area exclusions / travel fees:', lines: 2 },
      { l: 'Emergency / after-hours protocol:', lines: 2 },
      { l: 'Escalation rules (when AI hands off to a human):', lines: 2 },
      { l: 'Holiday schedule / planned closures:', lines: 2 },
    ].map(item => (
      <View key={item.l} style={{ marginBottom: 8 }}>
        <Text style={styles.formLabel}>{sanitizePdfText(item.l)}</Text>
        {Array.from({ length: item.lines }).map((_, i) => <View key={i} style={styles.notesLines} />)}
      </View>
    ))}
  </Page>
);

const IndustryIntakePage = () => (
  <Page size="A4" style={styles.page}>
    <PageHeader title="Industry-Specific Intake" pageNum={9} />
    <Text style={styles.sectionTitle}>{sanitizePdfText('Industry-Specific Intake')}</Text>
    <Text style={styles.paragraph}>
      {sanitizePdfText('Fill out ONLY the cluster that matches your business. We use this to activate the right industry pack, specialists, and prompt templates.')}
    </Text>
    <Text style={styles.subsectionTitle}>{sanitizePdfText('Home Services (HVAC, plumbing, electrical, cleaning, landscaping, pest, roofing, etc.)')}</Text>
    {['Typical job duration:', 'Trip / dispatch fee:', 'Diagnostic fee:', 'Common service ZIPs:', 'On-call / emergency rate:'].map(l => (
      <View key={l} style={styles.formRow}><Text style={[styles.formLabel, { width: 170 }]}>{sanitizePdfText(l)}</Text><View style={styles.formLine} /></View>
    ))}
    <Text style={styles.subsectionTitle}>{sanitizePdfText('Professional Services (legal, accounting, consulting, agency, coaching)')}</Text>
    {['Hourly rate or retainer:', 'Intake-call duration:', 'Free consult? (Y/N):', 'Practice area / specialty:'].map(l => (
      <View key={l} style={styles.formRow}><Text style={[styles.formLabel, { width: 170 }]}>{sanitizePdfText(l)}</Text><View style={styles.formLine} /></View>
    ))}
    <Text style={styles.subsectionTitle}>{sanitizePdfText('Retail / Restaurants')}</Text>
    {['Top-selling categories:', 'Online ordering URL:', 'Reservation system:', 'Delivery partners (DoorDash, etc.):'].map(l => (
      <View key={l} style={styles.formRow}><Text style={[styles.formLabel, { width: 170 }]}>{sanitizePdfText(l)}</Text><View style={styles.formLine} /></View>
    ))}
    <Text style={styles.subsectionTitle}>{sanitizePdfText('Real Estate')}</Text>
    {['Brokerage / MLS:', 'Listing types (resi/comm/lease):', 'Lead-routing rules:', 'Showing-coordinator contact:'].map(l => (
      <View key={l} style={styles.formRow}><Text style={[styles.formLabel, { width: 170 }]}>{sanitizePdfText(l)}</Text><View style={styles.formLine} /></View>
    ))}
    <Text style={styles.subsectionTitle}>{sanitizePdfText('Wellness & Personal Care (med spa, gym, salon, beauty)')}</Text>
    {['Appointment types + durations:', 'Membership / package pricing:', 'Booking platform URL:', 'New-client intake form URL:'].map(l => (
      <View key={l} style={styles.formRow}><Text style={[styles.formLabel, { width: 170 }]}>{sanitizePdfText(l)}</Text><View style={styles.formLine} /></View>
    ))}
  </Page>
);

const CommunicationRoutingPage = () => (
  <Page size="A4" style={styles.page}>
    <PageHeader title="Communication Routing" pageNum={10} />
    <Text style={styles.sectionTitle}>{sanitizePdfText('Communication Routing Worksheet')}</Text>
    <Text style={styles.paragraph}>
      {sanitizePdfText('Tells Aura who handles what and where to send escalations.')}
    </Text>
    <Text style={styles.subsectionTitle}>{sanitizePdfText('Voice')}</Text>
    {['Main business line:', 'After-hours forward to:', 'Missed-call SMS text:', 'Sales transfer to:', 'Service transfer to:', 'Billing transfer to:'].map(l => (
      <View key={l} style={styles.formRow}><Text style={[styles.formLabel, { width: 160 }]}>{sanitizePdfText(l)}</Text><View style={styles.formLine} /></View>
    ))}
    <Text style={styles.subsectionTitle}>{sanitizePdfText('SMS Keywords (instant auto-replies)')}</Text>
    <View style={styles.table}>
      <View style={styles.tableHeader}>
        <Text style={[styles.tableHeaderCell, { width: 80 }]}>{sanitizePdfText('Keyword')}</Text>
        <Text style={[styles.tableHeaderCell, { flex: 1 }]}>{sanitizePdfText('Auto-Reply Message')}</Text>
      </View>
      {[1, 2, 3, 4, 5].map(i => (
        <View key={i} style={styles.tableRow}>
          <Text style={[styles.tableCell, { width: 80 }]}>{sanitizePdfText('')}</Text>
          <Text style={[styles.tableCell, { flex: 1 }]}>{sanitizePdfText('')}</Text>
        </View>
      ))}
    </View>
    <Text style={styles.subsectionTitle}>{sanitizePdfText('Email Aliases')}</Text>
    {['sales@:', 'support@:', 'billing@:', 'info@:'].map(l => (
      <View key={l} style={styles.formRow}><Text style={styles.formLabel}>{sanitizePdfText(l)}</Text><View style={styles.formLine} /></View>
    ))}
    <Text style={styles.subsectionTitle}>{sanitizePdfText('Notification Recipients (push/email/SMS)')}</Text>
    {['New lead:', 'New booking:', 'Missed call:', 'Negative review:', 'Payment received:'].map(l => (
      <View key={l} style={styles.formRow}><Text style={styles.formLabel}>{sanitizePdfText(l)}</Text><View style={styles.formLine} /></View>
    ))}
  </Page>
);

const TechnicianRosterPage = () => (
  <Page size="A4" style={styles.page}>
    <PageHeader title="Employee / Technician Roster" pageNum={11} />
    <Text style={styles.sectionTitle}>{sanitizePdfText('Employee & Technician Roster')}</Text>
    <Text style={styles.paragraph}>
      {sanitizePdfText('Everyone who needs a login. Role options: admin, employee, technician, dispatcher.')}
    </Text>
    <View style={styles.table}>
      <View style={styles.tableHeader}>
        <Text style={[styles.tableHeaderCell, { width: 90 }]}>{sanitizePdfText('Name')}</Text>
        <Text style={[styles.tableHeaderCell, { width: 110 }]}>{sanitizePdfText('Email')}</Text>
        <Text style={[styles.tableHeaderCell, { width: 70 }]}>{sanitizePdfText('Phone')}</Text>
        <Text style={[styles.tableHeaderCell, { width: 60 }]}>{sanitizePdfText('Role')}</Text>
        <Text style={[styles.tableHeaderCell, { width: 70 }]}>{sanitizePdfText('Service Area')}</Text>
        <Text style={[styles.tableHeaderCell, { flex: 1 }]}>{sanitizePdfText('Skills / Notes')}</Text>
      </View>
      {Array.from({ length: 14 }).map((_, i) => (
        <View key={i} style={styles.tableRow}>
          <Text style={[styles.tableCell, { width: 90 }]}>{sanitizePdfText('')}</Text>
          <Text style={[styles.tableCell, { width: 110 }]}>{sanitizePdfText('')}</Text>
          <Text style={[styles.tableCell, { width: 70 }]}>{sanitizePdfText('')}</Text>
          <Text style={[styles.tableCell, { width: 60 }]}>{sanitizePdfText('')}</Text>
          <Text style={[styles.tableCell, { width: 70 }]}>{sanitizePdfText('')}</Text>
          <Text style={[styles.tableCell, { flex: 1 }]}>{sanitizePdfText('')}</Text>
        </View>
      ))}
    </View>
    <View style={styles.infoBox}>
      <Text style={styles.infoBoxTitle}>{sanitizePdfText('Tier limits')}</Text>
      <Text style={styles.infoBoxText}>{sanitizePdfText('Core: 10 · Boost: 25 · Pro: 50 · Elite: unlimited')}</Text>
    </View>
  </Page>
);

// ---------------------------------------------------------------------------
// Carrier call-forwarding reference page (mirrors the live intake guide).
// ---------------------------------------------------------------------------
const CarrierForwardingPage = () => (
  <>
    <Page size="A4" style={styles.page}>
      <PageHeader title="Carrier Call-Forwarding Guide" pageNum={10} />
      <Text style={styles.sectionTitle}>{sanitizePdfText('Carrier Call-Forwarding Setup')}</Text>
      <Text style={styles.paragraph}>
        {sanitizePdfText(
          'These codes tell your business mobile phone to forward calls to the Aura number assigned during setup. Replace {num} with the Aura number (e.g. +15551234567) and {rings} with 30 for ~6 rings before forwarding. Most phones answer with a short confirmation tone; if nothing happens, your carrier may require the conditional-forwarding add-on to be enabled (free) — call them and ask to activate "Call Forwarding No Answer".'
        )}
      </Text>
      <View style={styles.infoBox}>
        <Text style={styles.infoBoxTitle}>{sanitizePdfText('Four scenarios Aura covers')}</Text>
        {FORWARDING_RULES.map((r) => (
          <Text key={r.short} style={[styles.infoBoxText, { marginBottom: 3 }]}>
            {sanitizePdfText(`${SAFE_BULLET} ${r.label} — ${r.when}`)}
          </Text>
        ))}
      </View>
      <Text style={styles.subsectionTitle}>{sanitizePdfText('My carrier')}</Text>
      <View style={styles.formRow}>
        <Text style={[styles.formLabel, { width: 160 }]}>{sanitizePdfText('Carrier name:')}</Text>
        <View style={styles.formLine} />
      </View>
      <View style={styles.formRow}>
        <Text style={[styles.formLabel, { width: 160 }]}>{sanitizePdfText('Aura number to forward TO:')}</Text>
        <View style={styles.formLine} />
      </View>
      <View style={styles.formRow}>
        <Text style={[styles.formLabel, { width: 160 }]}>{sanitizePdfText('Business line being forwarded:')}</Text>
        <View style={styles.formLine} />
      </View>
    </Page>
    {CARRIERS.map((c, idx) => (
      <Page key={c.name} size="A4" style={styles.page}>
        <PageHeader title={`Carrier Guide — ${c.name}`} pageNum={10 + idx + 1} />
        <Text style={styles.sectionTitle}>{sanitizePdfText(c.name)}</Text>
        <Text style={[styles.paragraph, { marginTop: -6, color: colors.gray }]}>
          {sanitizePdfText(c.type)}
        </Text>
        <View style={styles.table}>
          <View style={styles.tableHeader}>
            <Text style={[styles.tableHeaderCell, { width: 90 }]}>{sanitizePdfText('Scenario')}</Text>
            <Text style={[styles.tableHeaderCell, { flex: 1 }]}>{sanitizePdfText('Turn ON')}</Text>
            <Text style={[styles.tableHeaderCell, { flex: 1 }]}>{sanitizePdfText('Turn OFF')}</Text>
          </View>
          {FORWARDING_RULES.map((rule) => {
            const on = fillTokens(c[rule.on] as string, '{num}');
            const off = rule.short === 'Cancel All' ? '' : fillTokens(c[rule.off] as string, '{num}');
            return (
              <View key={rule.short} style={styles.tableRow}>
                <Text style={[styles.tableCell, { width: 90, fontWeight: 700 }]}>{sanitizePdfText(rule.short)}</Text>
                <Text style={[styles.tableCell, { flex: 1 }]}>{sanitizePdfText(on)}</Text>
                <Text style={[styles.tableCell, { flex: 1 }]}>{sanitizePdfText(off || '—')}</Text>
              </View>
            );
          })}
          <View style={styles.tableRow}>
            <Text style={[styles.tableCell, { width: 90, fontWeight: 700 }]}>{sanitizePdfText('Verify')}</Text>
            <Text style={[styles.tableCell, { flex: 2 }]}>{sanitizePdfText(fillTokens(c.verify, '{num}'))}</Text>
          </View>
        </View>
        <View style={styles.infoBox}>
          <Text style={styles.infoBoxTitle}>{sanitizePdfText('Carrier notes')}</Text>
          <Text style={styles.infoBoxText}>{sanitizePdfText(c.notes)}</Text>
        </View>
      </Page>
    ))}
  </>
);

const BookingPortalPage = () => (
  <Page size="A4" style={styles.page}>
    <PageHeader title="Booking & Customer Portal" pageNum={12} />
    <Text style={styles.sectionTitle}>{sanitizePdfText('Booking & Customer Portal Setup')}</Text>
    <Text style={styles.subsectionTitle}>{sanitizePdfText('Booking Rules')}</Text>
    {['Booking window (how far out customers can book):', 'Lead time required (min hours before slot):', 'Buffer between appointments (minutes):', 'Default appointment length:', 'Deposit required? (amount or %):', 'Cancellation deadline:'].map(l => (
      <View key={l} style={styles.formRow}><Text style={[styles.formLabel, { width: 220 }]}>{sanitizePdfText(l)}</Text><View style={styles.formLine} /></View>
    ))}
    <Text style={styles.subsectionTitle}>{sanitizePdfText('Intake Form — custom fields')}</Text>
    <Text style={styles.paragraph}>{sanitizePdfText('What do you need to ask every new customer? (e.g. property address, vehicle make/model, insurance carrier)')}</Text>
    {[1, 2, 3, 4, 5, 6].map(i => (
      <View key={i} style={styles.formRow}><Text style={{ fontSize: 10, width: 20 }}>{sanitizePdfText(`${i}.`)}</Text><View style={styles.formLine} /></View>
    ))}
    <Text style={styles.subsectionTitle}>{sanitizePdfText('Customer Portal Welcome Message')}</Text>
    <View style={styles.notesLines} /><View style={styles.notesLines} /><View style={styles.notesLines} />
  </Page>
);

const SmartWebsitePage = () => (
  <Page size="A4" style={styles.page}>
    <PageHeader title="Smart Website Inputs" pageNum={13} />
    <Text style={styles.sectionTitle}>{sanitizePdfText('Smart Website & Content Inputs')}</Text>
    <Text style={styles.subsectionTitle}>{sanitizePdfText('Domain')}</Text>
    {['Preferred domain (yourbrand.com):', 'Currently registered with (GoDaddy, Cloudflare...):', 'DNS admin login available? (Y/N):'].map(l => (
      <View key={l} style={styles.formRow}><Text style={[styles.formLabel, { width: 220 }]}>{sanitizePdfText(l)}</Text><View style={styles.formLine} /></View>
    ))}
    <Text style={styles.subsectionTitle}>{sanitizePdfText('Hero Headline (one line, customer-facing)')}</Text>
    <View style={styles.formRow}><View style={styles.formLine} /></View>
    <Text style={styles.subsectionTitle}>{sanitizePdfText('About Us (2-3 sentences or bullet points)')}</Text>
    <View style={styles.notesLines} /><View style={styles.notesLines} /><View style={styles.notesLines} />
    <Text style={styles.subsectionTitle}>{sanitizePdfText('Top 5 Services (name + 1-sentence blurb each)')}</Text>
    {[1, 2, 3, 4, 5].map(i => (
      <View key={i} style={{ marginBottom: 6 }}>
        <View style={styles.formRow}><Text style={styles.formLabel}>{sanitizePdfText(`Service ${i}:`)}</Text><View style={styles.formLine} /></View>
        <View style={styles.notesLines} />
      </View>
    ))}
    <Text style={styles.subsectionTitle}>{sanitizePdfText('Photo Slots — label each attachment by number')}</Text>
    {['Slot 1 (hero):', 'Slot 2 (team):', 'Slot 3 (work sample):', 'Slot 4 (work sample):', 'Slot 5 (storefront):'].map(l => (
      <View key={l} style={styles.formRow}><Text style={[styles.formLabel, { width: 160 }]}>{sanitizePdfText(l)}</Text><View style={styles.formLine} /></View>
    ))}
  </Page>
);

const TOS_CLAUSES: Array<{ title: string; body: string }> = [
  { title: '1. Services', body: 'Aura Intercept provides an AI-powered customer engagement and business operations platform ("Platform") accessed via subscription. Specific features available depend on the tier purchased (Core, Boost, Pro, or Elite).' },
  { title: '2. Subscription & 60-Day Live Trial', body: 'Subscription begins on the date the onboarding fee is paid. A 60-Day Live Trial period applies; the platform is fully active during the trial. Cancellation must occur in writing before the next monthly billing date.' },
  { title: '3. Onboarding Fee', body: 'A one-time onboarding fee equal to one month of your plan applies, with 50% OFF during Beta: Core $249 (was $497), Boost $497 (was $994), Pro $994 (was $1,988), Elite $1,990 (was $3,979). It is due at the start of the 60-Day Live Trial and is non-refundable once onboarding begins. The fee covers Concierge Onboarding services and platform configuration.' },
  { title: '4. Third-Party Provider Accounts & Pass-Through Billing', body: 'All third-party providers (SignalWire, ElevenLabs, Resend, Tavily, Stripe, A2P 10DLC, social platforms, Google Workspace, etc.) require Customer\'s own account and valid credit card. Each provider invoices Customer DIRECTLY and SEPARATELY from the Aura plan fee. Aura Intercept never resells or marks up third-party usage charges.' },
  { title: '5. Concierge Onboarding Authorization', body: 'Customer authorizes Aura Intercept Concierge Onboarding to configure third-party accounts on Customer\'s behalf using Customer-provided credentials and payment methods. Customer remains responsible for all charges incurred on those accounts.' },
  { title: '6. Customer Data & Privacy', body: 'Customer retains ownership of all customer data uploaded to the Platform. Aura Intercept processes data per the Privacy Policy and applicable law (CCPA, GDPR where relevant). Customer is the data controller; Aura Intercept is the data processor.' },
  { title: '7. Acceptable Use', body: 'Customer agrees not to use the Platform for unlawful, harassing, or fraudulent activity, to violate TCPA / CAN-SPAM / A2P 10DLC rules, or to interfere with platform operation. Aura may suspend service for material violations.' },
  { title: '8. Intellectual Property', body: 'Aura Intercept retains all rights to the Platform, software, models, prompts, and documentation. Customer retains rights to its own content, branding, and customer data.' },
  { title: '9. Disclaimers & Limitation of Liability', body: 'The Platform is provided "AS IS" without warranties of any kind. Aura Intercept\'s aggregate liability is limited to fees paid in the preceding twelve (12) months. Aura Intercept is not liable for indirect, consequential, or third-party provider damages.' },
  { title: '10. Termination', body: 'Either party may terminate at end of any monthly billing cycle. Aura may terminate immediately for non-payment or material breach. Customer remains responsible for any outstanding fees and all third-party provider charges incurred.' },
  { title: '11. Governing Law', body: 'These Terms are governed by the laws of the United States and the State of Aura Intercept\'s registered jurisdiction. Disputes resolved by binding arbitration unless otherwise required by law.' },
];

const TermsOfServiceSummaryPage = () => (
  <Page size="A4" style={styles.page}>
    <PageHeader title="Terms of Service Agreement" pageNum={97} />
    <Text style={styles.sectionTitle}>{sanitizePdfText('Terms of Service Agreement')}</Text>
    <Text style={styles.paragraph}>
      {sanitizePdfText('This page summarizes the binding terms between Customer ("you", "your", "Company") and Aura Intercept ("we", "us"). The full Terms of Service and Privacy Policy are available at https://auraintercept.ai/terms-of-service and https://auraintercept.ai/privacy-policy. By signing the next page, you agree to be bound by the full Terms, not only this summary.')}
    </Text>
    {TOS_CLAUSES.map(clause => (
      <View key={clause.title} style={{ marginBottom: 8 }}>
        <Text style={[styles.subsectionTitle, { marginTop: 4, marginBottom: 2 }]}>
          {sanitizePdfText(clause.title)}
        </Text>
        <Text style={[styles.paragraph, { marginBottom: 0 }]}>
          {sanitizePdfText(clause.body)}
        </Text>
      </View>
    ))}
    <View style={styles.infoBox}>
      <Text style={styles.infoBoxTitle}>{sanitizePdfText('Key Reminders')}</Text>
      <Text style={styles.infoBoxText}>
        {sanitizePdfText('- 60-Day Live Trial: platform is fully active; onboarding fee due at start and non-refundable.\n- 3rd-Party Costs: SignalWire, ElevenLabs, Resend, Tavily, Stripe, A2P 10DLC, and social platforms bill you directly on your own account and card.\n- Concierge Onboarding configures these accounts on your behalf using your credentials.\n- Cancel in writing before your next monthly billing date to avoid the next charge.')}
      </Text>
    </View>
  </Page>
);

const TermsAcknowledgementPage = () => {
  const ackItems = [
    'I have read and agree to the Aura Intercept Terms of Service (summarized on the previous page and published in full at auraintercept.ai/terms-of-service).',
    'I have read and agree to the Aura Intercept Privacy Policy at auraintercept.ai/privacy-policy.',
    'I understand all 3rd-party providers (SignalWire, ElevenLabs, Resend, Tavily, Stripe, A2P 10DLC, social platforms) require my own account and credit card and will be invoiced to me DIRECTLY and SEPARATELY from my Aura plan fee.',
    'I authorize Aura Intercept Concierge Onboarding to configure these third-party accounts on my behalf using credentials I provide.',
    'I agree to the 60-Day Live Trial terms; the tier-specific onboarding fee (1 month of plan, 50% OFF during Beta — Core $249 / Boost $497 / Pro $994 / Elite $1,990) is due at the start of the trial and is non-refundable once onboarding begins.',
    'I confirm that I am an authorized signer with legal authority to bind the Company named below.',
  ];
  return (
    <Page size="A4" style={styles.page}>
      <PageHeader title="Terms Acknowledgement & Signature" pageNum={98} />
      <Text style={styles.sectionTitle}>{sanitizePdfText('Acknowledgement & Signature')}</Text>
      <Text style={styles.paragraph}>
        {sanitizePdfText('Initial each item below to confirm agreement, then complete and sign at the bottom of the page. Return this signed page with the rest of the onboarding workbook.')}
      </Text>
      <Text style={styles.subsectionTitle}>{sanitizePdfText('Plan Selection (check one)')}</Text>
      {[
        { id: 'core',  label: 'Aura Core  — $497/mo (was $697)  ·  $249 one-time onboarding (50% OFF — was $497)' },
        { id: 'boost', label: 'Aura Boost — $994/mo (was $1,394)  ·  $497 one-time onboarding (50% OFF — was $994)' },
        { id: 'pro',   label: 'Aura Pro   — $1,988/mo (was $2,788) ·  $994 one-time onboarding (50% OFF — was $1,988)' },
        { id: 'elite', label: 'Aura Elite — $3,979/mo (was $5,576) ·  $1,990 one-time onboarding (50% OFF — was $3,979)' },
      ].map((p) => (
        <View key={p.id} style={styles.optionRow}>
          <View style={styles.checkbox} />
          <Text style={styles.optionText}>{sanitizePdfText(p.label)}</Text>
        </View>
      ))}
      <Text style={[styles.formNote, { marginLeft: 20, marginTop: 4 }]}>
        {sanitizePdfText('Billing cycle (check one): [ ] Monthly   [ ] Annual (save ~17%)')}
      </Text>
      <View style={[styles.formRow, { marginTop: 8 }]}>
        <Text style={[styles.formLabel, { width: 180 }]}>{sanitizePdfText('Invoice email for onboarding fee:')}</Text>
        <View style={styles.formLine} />
      </View>
      <Text style={[styles.formNote, { marginLeft: 188 }]}>
        {sanitizePdfText('One-time onboarding invoice is sent here. Subscription billing begins after the 60-Day Live Trial.')}
      </Text>

      <Text style={[styles.subsectionTitle, { marginTop: 14 }]}>{sanitizePdfText('Acknowledgements (initial each)')}</Text>
      {ackItems.map((item, i) => (
        <View key={i} style={[styles.optionRow, { marginBottom: 10, alignItems: 'flex-start' }]}>
          <View style={[styles.checkbox, { marginTop: 2 }]} />
          <Text style={[styles.optionText, { paddingRight: 60 }]}>
            {sanitizePdfText(item)}
          </Text>
          <View style={{ width: 50, borderBottomWidth: 1, borderBottomColor: colors.gray, alignSelf: 'flex-end', marginLeft: 6 }} />
        </View>
      ))}
      <Text style={[styles.formNote, { marginLeft: 20, marginTop: 0, marginBottom: 12 }]}>
        {sanitizePdfText('Initials')}
      </Text>

      <Text style={styles.subsectionTitle}>{sanitizePdfText('Signer Information')}</Text>
      <View style={styles.formRow}><Text style={styles.formLabel}>{sanitizePdfText('Company Legal Name:')}</Text><View style={styles.formLine} /></View>
      <View style={styles.formRow}><Text style={styles.formLabel}>{sanitizePdfText('Authorized Signer Name:')}</Text><View style={styles.formLine} /></View>
      <View style={styles.formRow}><Text style={styles.formLabel}>{sanitizePdfText('Title:')}</Text><View style={styles.formLine} /></View>
      <View style={styles.formRow}><Text style={styles.formLabel}>{sanitizePdfText('Email:')}</Text><View style={styles.formLine} /></View>

      <View style={styles.signatureLine}>
        <View style={styles.signatureBlock}>
          <View style={[styles.formLine, { marginBottom: 0 }]} />
          <Text style={styles.signatureLabel}>{sanitizePdfText('Authorized Signature')}</Text>
        </View>
        <View style={styles.signatureBlock}>
          <View style={[styles.formLine, { marginBottom: 0 }]} />
          <Text style={styles.signatureLabel}>{sanitizePdfText('Date')}</Text>
        </View>
      </View>

      <Text style={[styles.subsectionTitle, { marginTop: 20 }]}>{sanitizePdfText('Witness / Secondary Signer (optional)')}</Text>
      <View style={styles.signatureLine}>
        <View style={styles.signatureBlock}>
          <View style={[styles.formLine, { marginBottom: 0 }]} />
          <Text style={styles.signatureLabel}>{sanitizePdfText('Printed Name')}</Text>
        </View>
        <View style={styles.signatureBlock}>
          <View style={[styles.formLine, { marginBottom: 0 }]} />
          <Text style={styles.signatureLabel}>{sanitizePdfText('Signature & Date')}</Text>
        </View>
      </View>
    </Page>
  );
};

const SignOffPage = () => (
  <Page size="A4" style={styles.page}>
    <PageHeader title="Sign-Off & Submission" pageNum={99} />
    <Text style={styles.sectionTitle}>{sanitizePdfText('Sign-Off & Submission')}</Text>
    <Text style={styles.subsectionTitle}>{sanitizePdfText('Attachments included with this workbook')}</Text>
    {['Signed Terms of Service Agreement (previous page) — REQUIRED',
      'Logo files', 'Business license / EIN letter', 'W-9 (for Stripe)', 'Insurance cert (if applicable)',
      'Customer list CSV', 'Employee/technician list CSV', 'Service / price list', 'Quote + invoice samples',
      'Photos (numbered to website slots)', 'Testimonials / review screenshots'].map(item => (
      <View key={item} style={styles.optionRow}>
        <View style={styles.checkbox} />
        <Text style={styles.optionText}>{sanitizePdfText(item)}</Text>
      </View>
    ))}
    <Text style={styles.subsectionTitle}>{sanitizePdfText('Return To')}</Text>
    <Text style={styles.paragraph}>{sanitizePdfText('Email completed workbook + attachments to: onboarding@auraintercept.ai')}</Text>
    <View style={styles.infoBox}>
      <Text style={styles.infoBoxTitle}>{sanitizePdfText('Acknowledgement')}</Text>
      <Text style={styles.infoBoxText}>
        {sanitizePdfText('By signing below, I confirm the information is accurate and I understand that all 3rd-party providers (SignalWire, ElevenLabs, Resend, Tavily, Stripe, A2P 10DLC, social platforms) require my own account with my valid credit card and will be invoiced to me directly and separately from my Aura plan fee. I authorize Aura Intercept Concierge Onboarding to configure these accounts on my behalf using my credentials.')}
      </Text>
    </View>
    <View style={styles.signatureLine}>
      <View style={styles.signatureBlock}>
        <View style={[styles.formLine, { marginBottom: 0 }]} />
        <Text style={styles.signatureLabel}>{sanitizePdfText('Authorized Signature')}</Text>
      </View>
      <View style={styles.signatureBlock}>
        <View style={[styles.formLine, { marginBottom: 0 }]} />
        <Text style={styles.signatureLabel}>{sanitizePdfText('Printed Name & Title')}</Text>
      </View>
    </View>
    <View style={[styles.signatureLine, { marginTop: 20 }]}>
      <View style={styles.signatureBlock}>
        <View style={[styles.formLine, { marginBottom: 0 }]} />
        <Text style={styles.signatureLabel}>{sanitizePdfText('Date')}</Text>
      </View>
      <View style={styles.signatureBlock}>
        <View style={[styles.formLine, { marginBottom: 0 }]} />
        <Text style={styles.signatureLabel}>{sanitizePdfText('Target Go-Live Date')}</Text>
      </View>
    </View>
  </Page>
);

// Main PDF Component
export const CompanyOnboardingPDF = () => (
  <Document>
    <CoverPage />
    <HowToUsePage />
    <DocumentChecklistPage />
    <WhyYourOwnAccountsPage />
    <ThirdPartyAccountsPage />
    <A2P10DLCPage />
    <SocialAccountsPage />
    <CompanyProfilePage />
    <BusinessOperationsPage />
    <BrandVoicePage />
    <KnowledgeBasePage />
    <KnowledgeBasePage2 />
    <KnowledgeBaseExpandedPage />
    <IndustryIntakePage />
    <CommunicationRoutingPage />
    <CarrierForwardingPage />
    <TechnicianRosterPage />
    <BookingPortalPage />
    <SmartWebsitePage />
    <IntegrationRequirementsPage />
    <EmployeeInfoPage />
    <AuditQuestionsPages />
    <GoalsNotesPage />
    <TermsOfServiceSummaryPage />
    <TermsAcknowledgementPage />
    <SignOffPage />
  </Document>
);

export default CompanyOnboardingPDF;
