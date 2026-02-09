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
    <Text style={styles.coverTitle}>{sanitizePdfText('Questionnaire')}</Text>
    <Text style={styles.coverSubtitle}>
      {sanitizePdfText('Complete this form to help us configure your AI platform')}
    </Text>
    <View style={{ marginTop: 40 }}>
      <Text style={{ fontSize: 11, color: '#a5b4fc', textAlign: 'center', marginBottom: 8 }}>
        {sanitizePdfText('This document includes:')}
      </Text>
      <Text style={{ fontSize: 10, color: colors.white, textAlign: 'center', marginBottom: 4 }}>
        {sanitizePdfText(`${SAFE_BULLET} Company Profile & Contact Information`)}
      </Text>
      <Text style={{ fontSize: 10, color: colors.white, textAlign: 'center', marginBottom: 4 }}>
        {sanitizePdfText(`${SAFE_BULLET} Business Operations Details`)}
      </Text>
      <Text style={{ fontSize: 10, color: colors.white, textAlign: 'center', marginBottom: 4 }}>
        {sanitizePdfText(`${SAFE_BULLET} 30-Question AI Opportunity Audit`)}
      </Text>
      <Text style={{ fontSize: 10, color: colors.white, textAlign: 'center', marginBottom: 4 }}>
        {sanitizePdfText(`${SAFE_BULLET} Integration Requirements Checklist`)}
      </Text>
      <Text style={{ fontSize: 10, color: colors.white, textAlign: 'center', marginBottom: 4 }}>
        {sanitizePdfText(`${SAFE_BULLET} Knowledge Base Setup Forms`)}
      </Text>
      <Text style={{ fontSize: 10, color: colors.white, textAlign: 'center', marginBottom: 4 }}>
        {sanitizePdfText(`${SAFE_BULLET} Employee Account Information`)}
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
    { name: 'SignalWire', purpose: 'Voice & SMS Communications', tiers: 'Express, Flow, Halo, Single-Point, Multi-Track, Command' },
    { name: 'ElevenLabs', purpose: 'AI Voice Synthesis', tiers: 'Express, Flow, Halo, Single-Point, Multi-Track, Command' },
    { name: 'Resend', purpose: 'Email Delivery', tiers: 'Flow, Single-Point, Multi-Track, Command (Required)' },
    { name: 'Stripe', purpose: 'Payment Processing', tiers: 'Multi-Track, Command (Required)' },
    { name: 'Google Calendar', purpose: 'Calendar Sync', tiers: 'Flow, Halo, Multi-Track, Command (Required)' },
    { name: 'Social Media Accounts', purpose: 'Content Publishing', tiers: 'All tiers with Social Media Ops' },
    { name: 'Tavily', purpose: 'AI Content Research', tiers: 'All tiers (Optional)' },
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
        {sanitizePdfText('Express/Flow/Core: 2 employees | Halo: 3 employees | Single-Point: 5 employees | Multi-Track: 10 employees | Command: 25 employees')}
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
    <Text style={styles.paragraph}>{sanitizePdfText('What would success look like in 90 days?')}</Text>
    
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

// Main PDF Component
export const CompanyOnboardingPDF = () => (
  <Document>
    <CoverPage />
    <CompanyProfilePage />
    <BusinessOperationsPage />
    <AuditQuestionsPages />
    <IntegrationRequirementsPage />
    <KnowledgeBasePage />
    <KnowledgeBasePage2 />
    <EmployeeInfoPage />
    <GoalsNotesPage />
  </Document>
);

export default CompanyOnboardingPDF;
