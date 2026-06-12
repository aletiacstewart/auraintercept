import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
} from '@react-pdf/renderer';
import { 
  SUBSCRIPTION_TIERS, 
  AI_OPERATIVES, 
  CONSOLES, 
  THIRD_PARTY_INTEGRATIONS,
  PLATFORM_STATS,
  ADDON_PRICING,
  TIER_ORDER
} from '@/lib/documentationConfig';
import { sanitizePdfText } from './pdfSanitize';

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
    marginBottom: 8,
    textAlign: 'center',
  },
  coverBrand: {
    fontSize: 20,
    fontWeight: 700,
    marginBottom: 16,
    textAlign: 'center',
    color: colors.accent,
  },
  coverSubtitle: {
    fontSize: 14,
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
    fontSize: 24,
    fontWeight: 700,
    color: colors.accent,
  },
  coverStatLabel: {
    fontSize: 8,
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
    fontSize: 18,
    fontWeight: 700,
    color: colors.primary,
    marginBottom: 16,
    marginTop: 10,
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
  faqContainer: {
    marginBottom: 16,
  },
  faqQuestion: {
    fontSize: 11,
    fontWeight: 700,
    color: colors.primary,
    marginBottom: 6,
  },
  faqAnswer: {
    fontSize: 10,
    lineHeight: 1.6,
    color: colors.dark,
    marginBottom: 4,
    paddingLeft: 12,
  },
  faqBox: {
    backgroundColor: colors.lightGray,
    padding: 12,
    marginBottom: 12,
    borderRadius: 4,
    borderLeftWidth: 4,
    borderLeftColor: colors.primary,
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
  infoBox: {
    backgroundColor: colors.greenLight,
    padding: 12,
    marginVertical: 12,
    borderRadius: 4,
    borderLeftWidth: 4,
    borderLeftColor: colors.green,
  },
  warningBox: {
    backgroundColor: colors.amberLight,
    padding: 12,
    marginVertical: 12,
    borderRadius: 4,
    borderLeftWidth: 4,
    borderLeftColor: colors.amber,
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
  },
  bulletPoint: {
    flexDirection: 'row',
    marginBottom: 4,
    paddingLeft: 8,
  },
  bullet: {
    width: 12,
    fontSize: 10,
    color: colors.primary,
  },
  bulletText: {
    flex: 1,
    fontSize: 10,
    lineHeight: 1.5,
  },
});

const Header = ({ title }: { title: string }) => (
  <View style={styles.header} fixed>
    <Text style={styles.headerTitle}>{title}</Text>
    <Text style={styles.pageNumber} render={({ pageNumber }) => `Page ${pageNumber}`} />
  </View>
);

const FAQItem = ({ question, answer }: { question: string; answer: string }) => (
  <View style={styles.faqBox}>
    <Text style={styles.faqQuestion}>Q: {sanitizePdfText(question)}</Text>
    <Text style={styles.faqAnswer}>A: {sanitizePdfText(answer)}</Text>
  </View>
);

const BulletPoint = ({ children }: { children: string }) => (
  <View style={styles.bulletPoint}>
    <Text style={styles.bullet}>-</Text>
    <Text style={styles.bulletText}>{sanitizePdfText(children)}</Text>
  </View>
);

const PlatformFAQPDF = () => {
  const tiers = TIER_ORDER.map(id => SUBSCRIPTION_TIERS[id]);
  
  return (
    <Document>
      {/* Cover Page */}
      <Page size="A4" style={styles.coverPage}>
        <Text style={styles.coverBrand}>AURA INTERCEPT</Text>
        <Text style={styles.coverTitle}>Platform FAQ</Text>
        <Text style={styles.coverSubtitle}>Answers to the questions we get most.</Text>
        <View style={styles.coverStats}>
          <View style={styles.coverStat}>
            <Text style={styles.coverStatNumber}>{PLATFORM_STATS.totalTiers}</Text>
            <Text style={styles.coverStatLabel}>Subscription Tiers</Text>
          </View>
          <View style={styles.coverStat}>
            <Text style={styles.coverStatNumber}>10</Text>
            <Text style={styles.coverStatLabel}>AI Operatives</Text>
          </View>
          <View style={styles.coverStat}>
            <Text style={styles.coverStatNumber}>{PLATFORM_STATS.totalConsoles}</Text>
            <Text style={styles.coverStatLabel}>Control Centers</Text>
          </View>
          <View style={styles.coverStat}>
            <Text style={styles.coverStatNumber}>60+</Text>
            <Text style={styles.coverStatLabel}>FAQ Answers</Text>
          </View>
        </View>
        <View style={styles.footer}>
          <Text>Aura Intercept - AI-Powered Service Platform</Text>
          <Text>2026 Edition</Text>
        </View>
      </Page>

      {/* Table of Contents */}
      <Page size="A4" style={styles.page}>
        <Header title="Aura Intercept - Platform FAQ" />
        <Text style={styles.sectionTitle}>Table of Contents</Text>
        
        <View style={{ marginTop: 20 }}>
          {[
            { title: 'Section 1: Getting Started', page: '3' },
            { title: 'Section 2: Subscription Plans & Pricing', page: '5' },
            { title: 'Section 3: Smart AI Agents & Features', page: '8' },
            { title: 'Section 4: Consoles & Dashboards', page: '11' },
            { title: 'Section 5: Integrations & Technical Setup', page: '13' },
            { title: 'Section 6: Knowledge Base & Training', page: '15' },
            { title: 'Section 7: Billing & Account Management', page: '17' },
            { title: 'Section 8: Troubleshooting', page: '19' },
          ].map((item, i) => (
            <View key={i} style={styles.tocItem}>
              <Text style={styles.tocTitle}>{item.title}</Text>
              <Text style={styles.tocPage}>{item.page}</Text>
            </View>
          ))}
        </View>

        <View style={styles.infoBox}>
          <Text style={{ fontSize: 11, fontWeight: 700, marginBottom: 6 }}>How to use</Text>
          <Text style={{ fontSize: 9, lineHeight: 1.5 }}>
            Organized by category. For more, see Platform Guides in your dashboard.
          </Text>
        </View>

        <View style={styles.footer}>
          <Text>Aura Intercept - AI-Powered Service Platform</Text>
          <Text render={({ pageNumber }) => `Page ${pageNumber}`} />
        </View>
      </Page>

      {/* Section 1: Getting Started */}
      <Page size="A4" style={styles.page}>
        <Header title="Aura Intercept - Platform FAQ" />
        <Text style={styles.sectionTitle}>Section 1: Getting Started</Text>
        
        <FAQItem 
          question="What is Aura Intercept?"
          answer="Aura Intercept is an AI-powered business platform that synchronizes your voice, chat, email, and SMS communications into a 24/7 proactive workforce. It captures every lead and booking while your team is in the field, featuring 10 AI Operatives and 7 Control Centers designed for service businesses."
        />
        
        <FAQItem 
          question="How do I get started with Aura Intercept?"
          answer="Getting started is simple: 1) Sign up for a subscription tier that fits your business needs, 2) Complete the onboarding questionnaire to configure your AI, 3) Set up required integrations (SignalWire, Resend, etc.), 4) Train your Knowledge Base with business information, and 5) Launch your AI-powered communication channels."
        />
        
        <FAQItem 
          question="What subscription plan is right for my business?"
          answer="Aura Core ($497/mo, was $697) for solo operators. Aura Boost ($994/mo, was $1,394) for small teams with field ops. Aura Pro ($1,988/mo, was $2,788) for growing companies. Aura Elite ($3,979/mo, was $5,576) for large teams and enterprise. All tiers include voice, SMS, and email."
        />
        
        <FAQItem 
          question="How long does implementation take?"
          answer="1–2 weeks typical. Core/Boost: 3–5 business days. Pro/Elite with field ops: 2–3 weeks. The first 30 days of the 60-Day Live Trial are the concierge onboarding window."
        />
        
        <FAQItem 
          question="What do I need to prepare before onboarding?"
          answer="Prepare the following: company branding (logo, colors), business hours and service areas, list of services offered with descriptions, FAQ content for customer questions, employee information, and accounts for required integrations (SignalWire, Stripe, etc.)."
        />

        <View style={styles.footer}>
          <Text>Aura Intercept - AI-Powered Service Platform</Text>
          <Text render={({ pageNumber }) => `Page ${pageNumber}`} />
        </View>
      </Page>

      {/* Getting Started Continued */}
      <Page size="A4" style={styles.page}>
        <Header title="Aura Intercept - Platform FAQ" />
        <Text style={styles.subsectionTitle}>Getting Started (Continued)</Text>
        
        <FAQItem 
          question="Is there a free trial?"
          answer="Yes — 60-Day Live Trial. First 30 days = concierge onboarding (setup, KB, 3rd-party activation, training). Remaining 30 days = fully live. Full tier access. No credit card required to start; onboarding fee due at start."
        />
        
        <FAQItem 
          question="Can I change my plan after signing up?"
          answer="Absolutely! You can upgrade or downgrade your plan at any time through Settings > Subscription. Upgrades take effect immediately, while downgrades apply at the next billing cycle. Any unused time from upgrades is prorated."
        />
        
        <FAQItem 
          question="What industries does Aura Intercept support?"
          answer={`Aura Intercept is designed for service businesses including: ${PLATFORM_STATS.industries.join(', ')}. The platform is flexible and can be configured for most B2C service industries.`}
        />

        <View style={styles.infoBox}>
          <Text style={{ fontSize: 11, fontWeight: 700, marginBottom: 6 }}>Quick Start Checklist</Text>
          <BulletPoint>Complete company profile with branding</BulletPoint>
          <BulletPoint>Configure business hours and service areas</BulletPoint>
          <BulletPoint>Set up required integrations (SignalWire, Resend)</BulletPoint>
          <BulletPoint>Train Knowledge Base with services and FAQs</BulletPoint>
          <BulletPoint>Enable Smart AI Agents for your workflow</BulletPoint>
          <BulletPoint>Test communication channels before going live</BulletPoint>
        </View>

        <View style={styles.footer}>
          <Text>Aura Intercept - AI-Powered Service Platform</Text>
          <Text render={({ pageNumber }) => `Page ${pageNumber}`} />
        </View>
      </Page>

      {/* Section 2: Subscription Plans & Pricing */}
      <Page size="A4" style={styles.page}>
        <Header title="Aura Intercept - Platform FAQ" />
        <Text style={styles.sectionTitle}>Section 2: Subscription Plans & Pricing</Text>
        
        <FAQItem 
          question="What subscription plans are available?"
          answer={`Aura Intercept offers 3 subscription tiers: ${tiers.map(t => `${t.name} ($${t.price.toLocaleString()}/mo)`).join(', ')}. Each tier is designed for specific business needs and includes varying numbers of Smart AI Agents and Consoles.`}
        />
        
        <FAQItem 
          question="What's the difference between the tiers?"
          answer="Tiers differ by: 1) Number of AI Operatives (8-24), 2) Number of Consoles (2-7), 3) Employee accounts (2-25), 4) Voice capabilities (Talk to Aura), 5) Field operations features, and 6) Advanced analytics. Higher tiers unlock more automation and enterprise features."
        />

        <Text style={styles.subsectionTitle}>Tier Comparison</Text>
        <View style={styles.table}>
          <View style={styles.tableHeader}>
            <Text style={[styles.tableHeaderCell, { flex: 2 }]}>Tier</Text>
            <Text style={[styles.tableHeaderCell, { flex: 1 }]}>Price</Text>
            <Text style={[styles.tableHeaderCell, { flex: 1 }]}>Operatives</Text>
            <Text style={[styles.tableHeaderCell, { flex: 1 }]}>Consoles</Text>
            <Text style={[styles.tableHeaderCell, { flex: 1 }]}>Employees</Text>
          </View>
          {tiers.map((tier, i) => (
            <View key={tier.id} style={i % 2 === 0 ? styles.tableRow : styles.tableRowAlt}>
              <Text style={[styles.tableCell, { flex: 2 }]}>{tier.name}</Text>
              <Text style={[styles.tableCell, { flex: 1 }]}>${tier.price.toLocaleString()}</Text>
              <Text style={[styles.tableCell, { flex: 1 }]}>{tier.operatives}</Text>
              <Text style={[styles.tableCell, { flex: 1 }]}>{tier.consoles}</Text>
              <Text style={[styles.tableCell, { flex: 1 }]}>{tier.employees}</Text>
            </View>
          ))}
        </View>

        <View style={styles.footer}>
          <Text>Aura Intercept - AI-Powered Service Platform</Text>
          <Text render={({ pageNumber }) => `Page ${pageNumber}`} />
        </View>
      </Page>

      {/* Pricing Continued */}
      <Page size="A4" style={styles.page}>
        <Header title="Aura Intercept - Platform FAQ" />
        <Text style={styles.subsectionTitle}>Pricing (Continued)</Text>
        
        <FAQItem 
          question="Can I upgrade or downgrade my plan?"
          answer="Yes, you can change your plan at any time. Upgrades take effect immediately with prorated billing. Downgrades apply at the start of your next billing cycle. Go to Settings > Subscription to make changes."
        />
        
        <FAQItem 
          question="What are the onboarding fees?"
          answer={`One-time onboarding fees are due at the start of your 60-Day Live Trial and vary by tier: Core ($${SUBSCRIPTION_TIERS.aura_core?.implementationFee ?? 249}), Boost ($${SUBSCRIPTION_TIERS.aura_boost?.implementationFee ?? 449}), Pro ($${SUBSCRIPTION_TIERS.aura_pro?.implementationFee ?? 899}), and Elite ($${SUBSCRIPTION_TIERS.aura_elite?.implementationFee ?? 1549}). The first 30 days of the trial are dedicated to onboarding — initial setup, configuration, knowledge-base build-out, 3rd-party activation, and training — so the remaining 60 days are spent fully live.`}
        />
        
        <FAQItem 
          question="Are there annual billing discounts?"
          answer="Yes! Save approximately 17% with annual billing (10x monthly rate). For example, Aura Elite annual is $38,198/year (saving ~$9,550 vs monthly). Annual plans are billed upfront and include priority support."
        />
        
        <FAQItem 
          question="What add-ons are available?"
          answer={`Available add-ons include: Additional Employees ($${ADDON_PRICING.additionalEmployees.price} per 10 employees/month) for Pro and Elite tiers. Social media, web presence, and creative tools are included starting at the Aura Core tier.`}
        />

        <FAQItem 
          question="What happens when my trial ends?"
          answer="You'll receive email reminders at 30 days, 7 days, and 1 day before trial expiration. After the trial, your subscription begins automatically if payment is configured. Without payment, access is paused until you subscribe."
        />

        <View style={styles.footer}>
          <Text>Aura Intercept - AI-Powered Service Platform</Text>
          <Text render={({ pageNumber }) => `Page ${pageNumber}`} />
        </View>
      </Page>

      {/* Pricing Page 3 */}
      <Page size="A4" style={styles.page}>
        <Header title="Aura Intercept - Platform FAQ" />
        <Text style={styles.subsectionTitle}>Pricing (Continued)</Text>
        
        <FAQItem 
          question="Which tier includes Talk to Aura (Voice)?"
          answer="Talk to Aura (Voice) is included on ALL paid tiers. Every tier from Aura Core through Aura Elite includes full voice, SMS, and email capabilities."
        />
        
        <FAQItem 
          question="Do I need to pay for integrations separately?"
          answer="Yes, third-party integrations have their own costs, billed directly by each provider on your own account with a valid credit card on file: SignalWire (~$0.50/number + SMS $0.00415/segment + Voice $0.0066/min in / $0.008/min out + AI Agent $0.16/min), A2P 10DLC ($4.50 brand one-time + campaign $1.50–$30/mo + DCA $7.50/submission + $250/mo T-Mobile if inactive 60 consecutive days), ElevenLabs (Free 15 min/mo · Starter $5 · Creator $22 · Pro $99 · pay-as-you-go), Resend (Free 3,000/mo · Pro $20 · Scale $90+ · then ~$0.90/1,000), Tavily (Free 1,000 credits/mo · $0.008/credit · Project plans from ~$30/mo), and Stripe (2.9% + $0.30 per transaction). Google Calendar sync is free."
        />

        <FAQItem 
          question="What's included in the Aura Core tier specifically?"
          answer={`Aura Core ($${SUBSCRIPTION_TIERS.aura_core?.price ?? 197}/mo) is the entry-level tier with 8 Smart AI Agents, 3 Control Centers, and 10 employees. Perfect for solo operators, restaurants, salons, and single-location businesses.`}
        />

        <View style={styles.warningBox}>
          <Text style={{ fontSize: 11, fontWeight: 700, marginBottom: 6 }}>Important Note on Pricing</Text>
          <Text style={{ fontSize: 9, lineHeight: 1.5 }}>
            Prices shown are for the Aura Intercept platform subscription only. Third-party integration 
            costs (SignalWire, ElevenLabs, Resend, Stripe) are billed separately by those providers based on 
            your actual usage. Estimate $50-200/month for typical integration usage. All 3rd-party fees are set by their respective vendors and are subject to change at any time, which may affect the cost of those services for your company.
          </Text>
        </View>

        <View style={styles.footer}>
          <Text>Aura Intercept - AI-Powered Service Platform</Text>
          <Text render={({ pageNumber }) => `Page ${pageNumber}`} />
        </View>
      </Page>

      {/* Section 3: AI Operatives & Features */}
      <Page size="A4" style={styles.page}>
        <Header title="Aura Intercept - Platform FAQ" />
        <Text style={styles.sectionTitle}>Section 3: AI Operatives & Features</Text>
        
        <FAQItem 
          question="What are AI Operatives?"
          answer={`AI Operatives are specialized AI agents that automate specific business tasks. Aura Intercept includes ${PLATFORM_STATS.totalOperatives} operatives organized into ${PLATFORM_STATS.totalConsoles} Control Centers. Each operative handles a distinct function like scheduling, dispatch, lead management, or content creation.`}
        />
        
        <FAQItem 
          question="What is Message Aura vs Talk to Aura?"
          answer="Message Aura (Text) is AI-powered chat communication via web widget, SMS, and email. Talk to Aura (Voice) is real-time voice conversation using AI speech synthesis powered by ElevenLabs and SignalWire. Voice is available on ALL paid tiers (Core through Elite)."
        />
        
        <FAQItem 
          question="How does the AI Receptionist work?"
          answer="The AI Receptionist (Triage Agent) is your 24/7 first point of contact. It greets visitors, understands their needs through natural conversation, and routes them to the appropriate agent or information. It can answer FAQs, capture lead information, and hand off to human staff when needed."
        />
        
        <FAQItem 
          question="What can the Booking Agent do?"
          answer="The Booking Agent automates appointment booking by checking technician availability, confirming dates/times with customers, syncing with Google Calendar, and sending confirmation messages. It handles rescheduling requests and cancellations automatically."
        />

        <View style={styles.footer}>
          <Text>Aura Intercept - AI-Powered Service Platform</Text>
          <Text render={({ pageNumber }) => `Page ${pageNumber}`} />
        </View>
      </Page>

      {/* AI Operatives Continued */}
      <Page size="A4" style={styles.page}>
        <Header title="Aura Intercept - Platform FAQ" />
        <Text style={styles.subsectionTitle}>AI Operatives (Continued)</Text>
        
        <FAQItem 
          question="How do Follow-up and Review agents help?"
          answer="The Follow-up Agent sends appointment reminders before service and follows up after completion. The Review Agent collects customer feedback and directs satisfied customers to leave reviews on Google, Yelp, or Facebook. Together, they improve customer retention and online reputation."
        />
        
        <FAQItem 
          question="What are the Field Operations agents?"
          answer="Field Operations includes 4 specialized agents: Dispatch/GPS Console (assigns technicians to jobs), Route Agent (plans optimal driving routes), ETA Agent (communicates arrival times), and Check-in Agent (tracks job progress). These agents work together for efficient field service management."
        />
        
        <FAQItem 
          question="How does the Creative Agent generate content?"
          answer="The Creative Agent is your unified content engine for all channels. It creates on-brand content for social media (6 platforms), email campaigns, blog posts, web pages, and lead nurturing sequences. It learns your brand voice and maintains consistent messaging across all outputs."
        />

        <Text style={styles.subsectionTitle}>AI Operative Categories</Text>
        <View style={styles.table}>
          <View style={styles.tableHeader}>
            <Text style={[styles.tableHeaderCell, { flex: 2 }]}>Console</Text>
            <Text style={[styles.tableHeaderCell, { flex: 1 }]}>Agents</Text>
            <Text style={[styles.tableHeaderCell, { flex: 3 }]}>Key Functions</Text>
          </View>
          {CONSOLES.map((console, i) => (
            <View key={console.id} style={i % 2 === 0 ? styles.tableRow : styles.tableRowAlt}>
              <Text style={[styles.tableCell, { flex: 2 }]}>{sanitizePdfText(console.name)}</Text>
              <Text style={[styles.tableCell, { flex: 1 }]}>{console.agentCount}</Text>
              <Text style={[styles.tableCell, { flex: 3 }]}>{sanitizePdfText(console.tabs.slice(0, 4).join(', '))}</Text>
            </View>
          ))}
        </View>

        <View style={styles.footer}>
          <Text>Aura Intercept - AI-Powered Service Platform</Text>
          <Text render={({ pageNumber }) => `Page ${pageNumber}`} />
        </View>
      </Page>

      {/* AI Operatives Page 3 */}
      <Page size="A4" style={styles.page}>
        <Header title="Aura Intercept - Platform FAQ" />
        <Text style={styles.subsectionTitle}>AI Operatives (Continued)</Text>
        
        <FAQItem 
          question="Can I enable/disable specific operatives?"
          answer="Yes! Each AI Operative can be individually enabled or disabled from the AI Operatives Hub. Some operatives have dependencies (e.g., Route Agent requires Dispatch/GPS Console), which the system enforces automatically. Core operatives for your tier are enabled by default."
        />
        
        <FAQItem 
          question="What is Ask Aura?"
          answer="Ask Aura is the internal staff-only voice navigation tool that helps employees quickly access dashboard features using voice commands. It's separate from Talk to Aura (customer-facing voice) and Message Aura (customer chat). Available for company staff only."
        />
        
        <FAQItem 
          question="How do operative dependencies work?"
          answer="Some operatives require others to function. For example, the ETA Agent needs both the Dispatch/GPS Console and Route Agent to calculate accurate arrival times. The system shows these dependencies in the Operative Dependency Graph and prevents enabling agents without their required dependencies."
        />

        <View style={styles.infoBox}>
          <Text style={{ fontSize: 11, fontWeight: 700, marginBottom: 6 }}>Complete Operative List ({AI_OPERATIVES.length} Total)</Text>
          <Text style={{ fontSize: 9, lineHeight: 1.4 }}>
            {AI_OPERATIVES.map(op => sanitizePdfText(op.name)).join(' - ')}
          </Text>
        </View>

        <View style={styles.footer}>
          <Text>Aura Intercept - AI-Powered Service Platform</Text>
          <Text render={({ pageNumber }) => `Page ${pageNumber}`} />
        </View>
      </Page>

      {/* Section 4: Consoles & Dashboards */}
      <Page size="A4" style={styles.page}>
        <Header title="Aura Intercept - Platform FAQ" />
        <Text style={styles.sectionTitle}>Section 4: Consoles & Dashboards</Text>
        
        <FAQItem 
          question="What consoles are included in my plan?"
          answer={`Console access varies by tier: Aura Core (7 consoles), Aura Boost (7 consoles + Field Operations agents), Aura Pro (7 consoles + Business Management), Aura Elite (all ${PLATFORM_STATS.totalConsoles} consoles + AI Operatives Hub). All tiers include access to the core consoles; higher tiers unlock additional agents and the AI Operatives Hub.`}
        />
        
        <FAQItem 
          question="How do I access the Customer Portal console?"
          answer="The Customer Portal console is your hub for customer engagement. Access it from the main dashboard navigation. It includes tabs for Chat, Voice, Services, Hours, Feedback, Track, and Billing. Available on all tiers (Core and above)."
        />
        
        <FAQItem 
          question="What's in the Field Operations console?"
          answer="Field Operations is a mobile-optimized console for technicians with: Accept Job, Get Directions, Mark En Route, Update ETA, Arrive & Start, Complete Job, Generate Quote, Generate Invoice, and Contact Dispatch. Available on Boost and above (Field Ops agents)."
        />
        
        <FAQItem 
          question="How do Outreach & Sales Ops work?"
          answer="Outreach & Sales Ops is your marketing automation console with 3 agents: Campaign Agent (email/SMS campaigns), Lead Agent (lead qualification and scoring), and Marketing Agent (segmentation and promos). Available on all tiers as a universal console."
        />

        <View style={styles.footer}>
          <Text>Aura Intercept - AI-Powered Service Platform</Text>
          <Text render={({ pageNumber }) => `Page ${pageNumber}`} />
        </View>
      </Page>

      {/* Consoles Continued */}
      <Page size="A4" style={styles.page}>
        <Header title="Aura Intercept - Platform FAQ" />
        <Text style={styles.subsectionTitle}>Consoles (Continued)</Text>
        
        <FAQItem 
          question="What social media platforms are supported?"
          answer={`The Social Media Ops console supports ${PLATFORM_STATS.socialPlatforms} platforms: Instagram, Facebook, LinkedIn, TikTok, Google My Business, and SMS broadcast. Create, schedule, and analyze content for all platforms from a single dashboard.`}
        />
        
        <FAQItem 
          question="What reports can I generate?"
          answer={`The Analytics & Reports console includes ${PLATFORM_STATS.analyticsTabs} specialized tabs: Performance (KPIs), Revenue (financial trends), Insights (natural language queries), Forecast (demand prediction), KPIs (metrics), Social (engagement), Reminders (communication stats), and Export (PDF/CSV reports). Available on Aura Elite tier.`}
        />

        <FAQItem 
          question="What is the Business Operations console?"
          answer="Business Operations is a comprehensive management console with: Quote generation, Invoice creation, Lead management, Appointment scheduling, Inventory tracking, Company settings, Employee management, and Customer database. Available on Aura Elite tier only."
        />

        <FAQItem 
          question="What is the Creative & Web Presence console?"
          answer="This console combines two powerful tools: The Content Engine for unified multi-channel content generation, and Web Presence for AI-powered website building, blog management, and SEO optimization. Includes the Creative Agent and Web Presence Agent."
        />

        <View style={styles.footer}>
          <Text>Aura Intercept - AI-Powered Service Platform</Text>
          <Text render={({ pageNumber }) => `Page ${pageNumber}`} />
        </View>
      </Page>

      {/* Section 5: Integrations & Technical Setup */}
      <Page size="A4" style={styles.page}>
        <Header title="Aura Intercept - Platform FAQ" />
        <Text style={styles.sectionTitle}>Section 5: Integrations & Technical Setup</Text>
        
        <FAQItem 
          question="What 3rd party integrations are required?"
          answer="Required integrations depend on your tier features: SignalWire (SMS/Voice) for tiers with Talk to Aura, ElevenLabs (AI Voice) for voice synthesis, Resend (Email) for notifications, and Stripe for payment processing. Google Calendar is optional for scheduling sync."
        />
        
        <Text style={styles.subsectionTitle}>Integration Cost Summary</Text>
        <View style={styles.table}>
          <View style={styles.tableHeader}>
            <Text style={[styles.tableHeaderCell, { flex: 2 }]}>Integration</Text>
            <Text style={[styles.tableHeaderCell, { flex: 2 }]}>Purpose</Text>
            <Text style={[styles.tableHeaderCell, { flex: 2 }]}>Estimated Cost</Text>
          </View>
          {THIRD_PARTY_INTEGRATIONS.map((integration, i) => (
            <View key={integration.name} style={i % 2 === 0 ? styles.tableRow : styles.tableRowAlt}>
              <Text style={[styles.tableCell, { flex: 2 }]}>{sanitizePdfText(integration.name)}</Text>
              <Text style={[styles.tableCell, { flex: 2 }]}>{sanitizePdfText(integration.purpose)}</Text>
              <Text style={[styles.tableCell, { flex: 2 }]}>{sanitizePdfText(integration.cost)}</Text>
            </View>
          ))}
        </View>

        <FAQItem 
          question="How do I connect my social media accounts?"
          answer="From the Social Media Ops console, click 'Connect Accounts' for each platform. You'll be redirected to authorize the connection. Supported platforms: Instagram (Business/Creator), Facebook (Page), LinkedIn (Company), TikTok (Business), and Google My Business."
        />

        <View style={styles.footer}>
          <Text>Aura Intercept - AI-Powered Service Platform</Text>
          <Text render={({ pageNumber }) => `Page ${pageNumber}`} />
        </View>
      </Page>

      {/* Integrations Continued */}
      <Page size="A4" style={styles.page}>
        <Header title="Aura Intercept - Platform FAQ" />
        <Text style={styles.subsectionTitle}>Integrations (Continued)</Text>
        
        <FAQItem 
          question="Can I sync with Google Calendar?"
          answer="Yes! Google Calendar integration provides two-way sync for appointments. Enable it from Settings > Integrations. The Booking Agent automatically creates/updates calendar events when appointments are booked, modified, or cancelled. Free to use with a Google account."
        />
        
        <FAQItem 
          question="What is Tavily and do I need it?"
          answer="Tavily is an optional AI research tool that enhances content generation with real-time web research. It helps the Creative Agent find current information, trends, and statistics when creating content. Optional for all tiers but recommended for content-heavy businesses."
        />

        <FAQItem 
          question="How do I set up SignalWire for voice calls?"
          answer="1) Create a SignalWire account at signalwire.com with a valid credit card on file, 2) Get a local US phone number (~$0.50/month), 3) Copy your Project ID and API Token, 4) Add credentials in Settings > Integrations > SignalWire, 5) Complete A2P 10DLC registration (brand $4.50 one-time + campaign $1.50–$30/mo) — approval typically 3–5 business days when clean, up to 1–2+ weeks with revisions, 6) Configure voice settings and test. Required for Talk to Aura voice functionality."
        />

        <FAQItem 
          question="How do I set up Resend for emails?"
          answer="1) Create a Resend account at resend.com (free tier available), 2) Verify your sending domain, 3) Generate an API key, 4) Add the API key in Settings > Integrations > Resend, 5) Test with a sample email. Required for email notifications and campaigns."
        />

        <View style={styles.warningBox}>
          <Text style={{ fontSize: 11, fontWeight: 700, marginBottom: 6 }}>Integration Security</Text>
          <Text style={{ fontSize: 9, lineHeight: 1.5 }}>
            All integration credentials are encrypted and stored securely. Never share your API keys 
            or access tokens. Each integration has its own security settings and can be disconnected 
            at any time from Settings - Integrations.
          </Text>
        </View>

        <View style={styles.footer}>
          <Text>Aura Intercept - AI-Powered Service Platform</Text>
          <Text render={({ pageNumber }) => `Page ${pageNumber}`} />
        </View>
      </Page>

      {/* Section 6: Knowledge Base & Training */}
      <Page size="A4" style={styles.page}>
        <Header title="Aura Intercept - Platform FAQ" />
        <Text style={styles.sectionTitle}>Section 6: Knowledge Base & Training</Text>
        
        <FAQItem 
          question="How do I train the AI on my business?"
          answer="Train your AI through the Knowledge Base section: 1) Complete your AI Profile with personality and tone, 2) Add all services with descriptions and pricing, 3) Create FAQ entries for common questions, 4) Set business hours and service areas, 5) Upload relevant documents (policies, procedures). The AI learns from this content to respond accurately."
        />
        
        <FAQItem 
          question="What information should I add to the Knowledge Base?"
          answer="Essential information includes: Company description and history, complete service catalog with pricing, FAQ answers to common customer questions, business hours and holiday schedule, service areas (cities, zip codes), staff bios, policies (cancellation, refund, terms), and any unique selling points."
        />
        
        <FAQItem 
          question="Can I upload documents to train the AI?"
          answer="Yes! Upload PDFs, Word documents, and text files to the Knowledge Base. The AI extracts information from these documents to enhance responses. Great for policy documents, service manuals, pricing sheets, and employee handbooks."
        />
        
        <FAQItem 
          question="How do I configure Aura Intelligence?"
          answer="Aura Intelligence (Master Logic) settings control AI behavior across all operatives. Configure: response style (formal/casual), escalation triggers, handoff rules, confidence thresholds, and forbidden topics. Access from Settings > AI Configuration or the AI Operatives Hub."
        />

        <View style={styles.footer}>
          <Text>Aura Intercept - AI-Powered Service Platform</Text>
          <Text render={({ pageNumber }) => `Page ${pageNumber}`} />
        </View>
      </Page>

      {/* Knowledge Base Continued */}
      <Page size="A4" style={styles.page}>
        <Header title="Aura Intercept - Platform FAQ" />
        <Text style={styles.subsectionTitle}>Knowledge Base (Continued)</Text>
        
        <FAQItem 
          question="What is Brand Voice and how do I set it?"
          answer="Brand Voice controls how the AI communicates with customers. Set your tone (professional, friendly, casual), personality traits, forbidden words/topics, and communication style. Access from Knowledge Base > AI Profile. The AI maintains this voice across all channels."
        />
        
        <FAQItem 
          question="How often should I update the Knowledge Base?"
          answer="Update your Knowledge Base whenever: prices change, new services are added, policies update, FAQs change based on customer interactions, or seasonal offerings start. We recommend a monthly review to ensure accuracy. The AI can only be as accurate as its training data."
        />

        <FAQItem 
          question="Can the AI learn from customer conversations?"
          answer="The AI doesn't automatically learn from individual conversations. However, you can review conversation logs to identify gaps in knowledge and manually add new FAQ entries or clarifications. This controlled approach ensures accuracy and prevents misinformation."
        />

        <View style={styles.infoBox}>
          <Text style={{ fontSize: 11, fontWeight: 700, marginBottom: 6 }}>Knowledge Base Best Practices</Text>
          <BulletPoint>Use clear, concise language in FAQ answers</BulletPoint>
          <BulletPoint>Include common misspellings in search terms</BulletPoint>
          <BulletPoint>Add multiple FAQ entries for complex topics</BulletPoint>
          <BulletPoint>Review AI responses weekly and refine as needed</BulletPoint>
          <BulletPoint>Keep pricing and availability current</BulletPoint>
        </View>

        <View style={styles.footer}>
          <Text>Aura Intercept - AI-Powered Service Platform</Text>
          <Text render={({ pageNumber }) => `Page ${pageNumber}`} />
        </View>
      </Page>

      {/* Section 7: Billing & Account Management */}
      <Page size="A4" style={styles.page}>
        <Header title="Aura Intercept - Platform FAQ" />
        <Text style={styles.sectionTitle}>Section 7: Billing & Account Management</Text>
        
        <FAQItem 
          question="How does billing work?"
          answer="Billing is processed monthly or annually through Stripe. Monthly subscriptions are billed on the same day each month. Annual subscriptions are billed upfront with a 16% discount. Integration costs (SignalWire, ElevenLabs, etc.) are billed separately by those providers."
        />
        
        <FAQItem 
          question="Can I add more employees to my plan?"
          answer={`Each tier includes a set number of employee accounts (Core: 10, Boost: 25, Pro: 50, Elite: Unlimited). Additional employees can be added for $25 per 10 employees on Core, Boost, and Pro tiers. Elite tier includes unlimited employees.`}
        />
        
        <FAQItem 
          question="How do I manage my company profile?"
          answer="Access company settings from Settings > Company Profile. Update: company name and branding, contact information, business hours, service areas, logo and colors, and public-facing information. Changes apply across all AI communications immediately."
        />
        
        <FAQItem 
          question="What if I need to cancel my subscription?"
          answer="Cancel anytime from Settings > Subscription > Cancel Plan. Cancellations take effect at the end of your current billing period. You retain access until then. Data is retained for 30 days after cancellation before deletion. Annual plan refunds are prorated."
        />

        <View style={styles.footer}>
          <Text>Aura Intercept - AI-Powered Service Platform</Text>
          <Text render={({ pageNumber }) => `Page ${pageNumber}`} />
        </View>
      </Page>

      {/* Billing Continued */}
      <Page size="A4" style={styles.page}>
        <Header title="Aura Intercept - Platform FAQ" />
        <Text style={styles.subsectionTitle}>Billing (Continued)</Text>
        
        <FAQItem 
          question="How do I get support?"
          answer="Support options include: 1) In-app Help Center with searchable guides, 2) Platform Guides section with step-by-step instructions, 3) Email support at ai@auraintercept.ai, 4) Live chat during business hours, 5) Priority support for Aura Pro and Aura Elite tiers. Average response time is under 24 hours."
        />
        
        <FAQItem 
          question="How do I add employees to my account?"
          answer="Add employees from Settings > Team > Add Employee. Enter their name, email, role, and permissions. They'll receive an invitation email to set up their account. Assign them to specific job types (technician, admin, manager) to control access to features."
        />

        <FAQItem 
          question="Can I transfer my subscription to another company?"
          answer="Subscription transfers are handled on a case-by-case basis. Contact support with details about the transfer request. Generally, we can transfer subscriptions between companies under the same ownership. Data migration may be included depending on your tier."
        />

        <FAQItem 
          question="What payment methods are accepted?"
          answer="We accept all major credit cards (Visa, Mastercard, American Express, Discover) and ACH bank transfers for annual plans. Payment is processed securely through Stripe. International cards are accepted where Stripe operates."
        />

        <View style={styles.footer}>
          <Text>Aura Intercept - AI-Powered Service Platform</Text>
          <Text render={({ pageNumber }) => `Page ${pageNumber}`} />
        </View>
      </Page>

      {/* Section 8: Troubleshooting */}
      <Page size="A4" style={styles.page}>
        <Header title="Aura Intercept - Platform FAQ" />
        <Text style={styles.sectionTitle}>Section 8: Troubleshooting</Text>
        
        <FAQItem 
          question="Why isn't my AI responding correctly?"
          answer="Common causes: 1) Knowledge Base needs more information - add relevant FAQs, 2) Brand Voice settings conflict with query - review AI Profile, 3) Integration issues - check that SignalWire/Resend are connected, 4) Operative is disabled - enable required agents in AI Hub. Review conversation logs to identify specific issues."
        />
        
        <FAQItem 
          question="My voice calls aren't working - what should I check?"
          answer="Troubleshoot voice issues: 1) Verify SignalWire credentials are correct in Settings, 2) Check that a phone number is purchased and assigned, 3) Confirm ElevenLabs integration is active, 4) Test with a manual call from the dashboard, 5) Review call logs for error messages. Voice requires both SignalWire and ElevenLabs."
        />
        
        <FAQItem 
          question="Emails aren't being sent - how do I fix this?"
          answer="Email troubleshooting: 1) Verify Resend API key in Settings > Integrations, 2) Check that your sending domain is verified in Resend, 3) Review email logs for bounce/error messages, 4) Ensure email opt-out isn't enabled for the recipient, 5) Check spam folders. Test with a manual email from Campaigns."
        />
        
        <FAQItem 
          question="I can't see certain features - are they locked?"
          answer="Features are tier-based. If you can't access a feature: 1) Check your current tier in Settings > Subscription, 2) Review tier comparison to see which tier includes the feature, 3) Upgrade your plan to access the feature, or 4) Contact support if you believe it should be available."
        />

        <View style={styles.warningBox}>
          <Text style={{ fontSize: 11, fontWeight: 700, marginBottom: 6 }}>Still Having Issues?</Text>
          <Text style={{ fontSize: 9, lineHeight: 1.5 }}>
            If these solutions don't resolve your issue, contact support with: your company name, 
            description of the problem, steps to reproduce, and any error messages. Screenshots 
            help us diagnose issues faster. Email: ai@auraintercept.ai
          </Text>
        </View>

        <View style={styles.footer}>
          <Text>Aura Intercept - AI-Powered Service Platform</Text>
          <Text render={({ pageNumber }) => `Page ${pageNumber}`} />
        </View>
      </Page>

      {/* Final Page */}
      <Page size="A4" style={styles.page}>
        <Header title="Aura Intercept - Platform FAQ" />
        <Text style={styles.sectionTitle}>Additional Resources</Text>
        
        <Text style={styles.paragraph}>
          This FAQ covers the most common questions about the Aura Intercept platform. 
          For more detailed information, explore these additional resources:
        </Text>

        <View style={styles.infoBox}>
          <Text style={{ fontSize: 11, fontWeight: 700, marginBottom: 8 }}>Documentation Library</Text>
          <BulletPoint>AI Agent and Console Guide - Complete operative reference</BulletPoint>
          <BulletPoint>Pricing Summary PDF - Detailed tier comparisons</BulletPoint>
          <BulletPoint>Comprehensive User Guide - Step-by-step instructions</BulletPoint>
          <BulletPoint>Company Admin Guide - Management and setup</BulletPoint>
          <BulletPoint>Company Onboarding Questionnaire - New client setup</BulletPoint>
        </View>

        <View style={{ marginTop: 20 }}>
          <Text style={styles.subsectionTitle}>Quick Reference</Text>
          <View style={styles.table}>
            <View style={styles.tableRow}>
              <Text style={[styles.tableCell, { flex: 1, fontWeight: 700 }]}>Support Email</Text>
              <Text style={[styles.tableCell, { flex: 2 }]}>ai@auraintercept.ai</Text>
            </View>
            <View style={styles.tableRowAlt}>
              <Text style={[styles.tableCell, { flex: 1, fontWeight: 700 }]}>Starting Price</Text>
              <Text style={[styles.tableCell, { flex: 2 }]}>${PLATFORM_STATS.startingPrice}/month (Aura Core)</Text>
            </View>
            <View style={styles.tableRow}>
              <Text style={[styles.tableCell, { flex: 1, fontWeight: 700 }]}>AI Operatives</Text>
              <Text style={[styles.tableCell, { flex: 2 }]}>{PLATFORM_STATS.totalOperatives} specialized agents</Text>
            </View>
            <View style={styles.tableRowAlt}>
              <Text style={[styles.tableCell, { flex: 1, fontWeight: 700 }]}>Control Centers</Text>
              <Text style={[styles.tableCell, { flex: 2 }]}>{PLATFORM_STATS.totalConsoles} consoles</Text>
            </View>
            <View style={styles.tableRow}>
              <Text style={[styles.tableCell, { flex: 1, fontWeight: 700 }]}>Social Platforms</Text>
              <Text style={[styles.tableCell, { flex: 2 }]}>{PLATFORM_STATS.socialPlatforms} supported</Text>
            </View>
          </View>
        </View>

        <View style={{ marginTop: 30, textAlign: 'center', alignItems: 'center' }}>
          <Text style={{ fontSize: 14, fontWeight: 700, color: colors.primary, marginBottom: 8 }}>
            Thank You for Choosing Aura Intercept
          </Text>
          <Text style={{ fontSize: 10, color: colors.gray }}>
            AI-Powered Service Business Platform - 2026 Edition
          </Text>
        </View>

        <View style={styles.footer}>
          <Text>Aura Intercept - AI-Powered Service Platform</Text>
          <Text render={({ pageNumber }) => `Page ${pageNumber}`} />
        </View>
      </Page>
    </Document>
  );
};

export default PlatformFAQPDF;
