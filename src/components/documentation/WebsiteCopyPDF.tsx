import React from 'react';
import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer';
import { sanitizePdfText } from './pdfSanitize';

const colors = {
  primary: '#214ebb',
  secondary: '#6366f1',
  accent: '#06b6d4',
  dark: '#1e293b',
  light: '#f8fafc',
  gray: '#64748b',
  success: '#10b981',
  warning: '#f59e0b',
};

const styles = StyleSheet.create({
  page: {
    padding: 40,
    backgroundColor: colors.light,
    fontFamily: 'Helvetica',
  },
  coverPage: {
    padding: 40,
    backgroundColor: colors.accent,
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
    backgroundColor: 'white',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
  },
  coverBadgeText: {
    color: colors.accent,
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
    borderBottomColor: colors.accent,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.accent,
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
  copyCard: {
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 10,
    marginBottom: 15,
    borderLeftWidth: 5,
    borderLeftColor: colors.primary,
  },
  copyLabel: {
    fontSize: 9,
    color: colors.primary,
    fontWeight: 'bold',
    marginBottom: 6,
    textTransform: 'uppercase',
  },
  copyHeadline: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.dark,
    marginBottom: 8,
  },
  copySubhead: {
    fontSize: 12,
    color: colors.gray,
    marginBottom: 10,
    lineHeight: 1.5,
  },
  copyBody: {
    fontSize: 10,
    color: colors.dark,
    lineHeight: 1.6,
  },
  variationCard: {
    backgroundColor: '#f1f5f9',
    padding: 12,
    borderRadius: 6,
    marginBottom: 8,
  },
  variationLabel: {
    fontSize: 8,
    color: colors.gray,
    marginBottom: 4,
  },
  variationText: {
    fontSize: 11,
    color: colors.dark,
    fontWeight: 'bold',
  },
  featureCard: {
    backgroundColor: 'white',
    padding: 15,
    borderRadius: 8,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  featureName: {
    fontSize: 12,
    fontWeight: 'bold',
    color: colors.dark,
    marginBottom: 6,
  },
  featureDesc: {
    fontSize: 10,
    color: colors.gray,
    lineHeight: 1.5,
  },
  faqCard: {
    backgroundColor: 'white',
    padding: 15,
    borderRadius: 8,
    marginBottom: 12,
    borderLeftWidth: 4,
    borderLeftColor: colors.secondary,
  },
  faqQuestion: {
    fontSize: 11,
    fontWeight: 'bold',
    color: colors.dark,
    marginBottom: 8,
  },
  faqAnswer: {
    fontSize: 10,
    color: colors.gray,
    lineHeight: 1.5,
  },
  seoCard: {
    backgroundColor: '#ecfdf5',
    padding: 15,
    borderRadius: 8,
    marginBottom: 10,
  },
  seoLabel: {
    fontSize: 9,
    color: colors.success,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  seoText: {
    fontSize: 10,
    color: colors.dark,
  },
  twoColumn: {
    flexDirection: 'row',
    gap: 15,
  },
  column: {
    flex: 1,
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
  ctaCard: {
    backgroundColor: colors.primary,
    padding: 15,
    borderRadius: 8,
    marginTop: 10,
  },
  ctaLabel: {
    fontSize: 9,
    color: 'white',
    opacity: 0.8,
    marginBottom: 4,
  },
  ctaText: {
    fontSize: 12,
    color: 'white',
    fontWeight: 'bold',
  },
  agentCard: {
    backgroundColor: 'white',
    padding: 12,
    borderRadius: 6,
    marginBottom: 8,
    borderLeftWidth: 3,
    borderLeftColor: colors.accent,
  },
  agentName: {
    fontSize: 10,
    fontWeight: 'bold',
    color: colors.dark,
    marginBottom: 4,
  },
  agentDesc: {
    fontSize: 9,
    color: colors.gray,
    lineHeight: 1.4,
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
    <Text style={styles.footerText}>Web Presence Copy Pack</Text>
    <Text style={styles.footerText}>© 2025 Aura Intercept</Text>
  </View>
);

export const WebsiteCopyPDF: React.FC = () => (
  <Document>
    {/* Cover Page */}
    <Page size="A4" style={styles.coverPage}>
      <Text style={styles.coverTitle}>Web Presence{'\n'}Copy Pack</Text>
      <Text style={styles.coverSubtitle}>
        SEO-Optimized Headlines & Content Blocks{'\n'}
        Homepage • Features • Pricing • FAQ{'\n'}
        Ready to Deploy
      </Text>
      <View style={styles.coverBadge}>
        <Text style={styles.coverBadgeText}>100+ Copy Blocks</Text>
      </View>
    </Page>

    {/* Homepage Hero Section */}
    <Page size="A4" style={styles.page}>
      <Header title="Homepage Hero Section" pageNum={2} />
      
      <Text style={styles.sectionTitle}>Hero Headlines</Text>
      <Text style={styles.sectionSubtitle}>Primary headlines for maximum impact above the fold</Text>

      <View style={styles.copyCard}>
        <Text style={styles.copyLabel}>Hero Variation 1 - Problem-Focused</Text>
        <Text style={styles.copyHeadline}>Stop Losing $10,000+ Monthly to Missed Calls</Text>
        <Text style={styles.copySubhead}>Your AI-powered team answers every call, books every lead, and runs your business operations 24/7.</Text>
        <View style={styles.ctaCard}>
          <Text style={styles.ctaLabel}>CTA</Text>
          <Text style={styles.ctaText}>Start Your Free Trial</Text>
        </View>
      </View>

      <View style={styles.copyCard}>
        <Text style={styles.copyLabel}>Hero Variation 2 - Solution-Focused</Text>
        <Text style={styles.copyHeadline}>23 AI Operatives. One Mission: Grow Your Business.</Text>
        <Text style={styles.copySubhead}>From answering calls to dispatching technicians, Aura Intercept handles every operational task while you focus on what matters.</Text>
      </View>

      <View style={styles.copyCard}>
        <Text style={styles.copyLabel}>Hero Variation 3 - Results-Focused</Text>
        <Text style={styles.copyHeadline}>$11,500 Average Month-1 Revenue Recovery</Text>
        <Text style={styles.copySubhead}>Join hundreds of service businesses using AI to capture every lead, optimize every route, and maximize every dollar.</Text>
      </View>

      <View style={styles.copyCard}>
        <Text style={styles.copyLabel}>Hero Variation 4 - Fear-Based</Text>
        <Text style={styles.copyHeadline}>Every Missed Call Walks Straight to Your Competitor</Text>
        <Text style={styles.copySubhead}>AI reception ensures zero missed opportunities. Your business never sleeps, even when you do.</Text>
      </View>

      <View style={styles.copyCard}>
        <Text style={styles.copyLabel}>Hero Variation 5 - Empowerment</Text>
        <Text style={styles.copyHeadline}>Your Virtual Operations Team, Ready in 24 Hours</Text>
        <Text style={styles.copySubhead}>Intelligent automation for every call, every appointment, every invoice. Scale without the payroll.</Text>
      </View>

      <Footer />
    </Page>

    {/* Homepage Features Section */}
    <Page size="A4" style={styles.page}>
      <Header title="Homepage Feature Blocks" pageNum={3} />
      
      <Text style={styles.sectionTitle}>Feature Section Copy</Text>
      <Text style={styles.sectionSubtitle}>Content blocks for highlighting key capabilities</Text>

      <View style={styles.twoColumn}>
        <View style={styles.column}>
          <View style={styles.featureCard}>
            <Text style={styles.featureName}>[VOICE] AI Receptionist</Text>
            <Text style={styles.featureDesc}>Natural voice AI answers every call instantly. Books appointments, answers questions, and routes emergencies—all while sounding human.</Text>
          </View>
          <View style={styles.featureCard}>
            <Text style={styles.featureName}>[CALENDAR] Smart Scheduling</Text>
            <Text style={styles.featureDesc}>Automated booking syncs with your calendar, sends confirmations, and reminds customers. No more phone tag.</Text>
          </View>
          <View style={styles.featureCard}>
            <Text style={styles.featureName}>[ROUTE] Route Optimization</Text>
            <Text style={styles.featureDesc}>AI plans the most efficient paths for your technicians. Less driving, more jobs, happier crews.</Text>
          </View>
        </View>
        <View style={styles.column}>
          <View style={styles.featureCard}>
            <Text style={styles.featureName}>[CHART] Real-Time Analytics</Text>
            <Text style={styles.featureDesc}>See every metric that matters. Track calls, bookings, revenue, and team performance in one dashboard.</Text>
          </View>
          <View style={styles.featureCard}>
            <Text style={styles.featureName}>[STAR] Review Automation</Text>
            <Text style={styles.featureDesc}>Automatically request reviews after every service. Build your reputation while you work.</Text>
          </View>
          <View style={styles.featureCard}>
            <Text style={styles.featureName}>[MONEY] Instant Quoting</Text>
            <Text style={styles.featureDesc}>Generate professional quotes on-site. Convert more leads with faster proposals.</Text>
          </View>
        </View>
      </View>

      <View style={styles.copyCard}>
        <Text style={styles.copyLabel}>Social Proof Block</Text>
        <Text style={styles.copyHeadline}>Trusted by 500+ Service Businesses</Text>
        <Text style={styles.copyBody}>
          "Aura Intercept paid for itself in the first week. I'm booking 23 more jobs per month that I would have missed." — Mike T., HVAC Pro{'\n\n'}
          "My dispatchers now focus on customers instead of logistics. The AI handles the grunt work." — Sarah K., ProPlumb
        </Text>
      </View>

      <Footer />
    </Page>

    {/* AI Agent Descriptions */}
    <Page size="A4" style={styles.page}>
      <Header title="AI Agent Descriptions" pageNum={4} />
      
      <Text style={styles.sectionTitle}>19 AI Agent Copy Blocks</Text>
      <Text style={styles.sectionSubtitle}>Short descriptions for feature pages and marketing</Text>

      <View style={styles.twoColumn}>
        <View style={styles.column}>
          <View style={styles.agentCard}>
            <Text style={styles.agentName}>AI Receptionist</Text>
            <Text style={styles.agentDesc}>Your 24/7 front desk. Natural voice AI that answers calls, handles inquiries, and books appointments—even at 2 AM.</Text>
          </View>
          <View style={styles.agentCard}>
            <Text style={styles.agentName}>Follow-up Agent</Text>
            <Text style={styles.agentDesc}>Never lose a lead to silence. Automated sequences nurture every prospect until they convert or opt out.</Text>
          </View>
          <View style={styles.agentCard}>
            <Text style={styles.agentName}>Review Agent</Text>
            <Text style={styles.agentDesc}>Turn happy customers into 5-star reviews. Automated requests timed perfectly after every job.</Text>
          </View>
          <View style={styles.agentCard}>
            <Text style={styles.agentName}>Scheduling Agent</Text>
            <Text style={styles.agentDesc}>Goodbye, calendar chaos. AI books appointments based on availability, location, and job requirements.</Text>
          </View>
          <View style={styles.agentCard}>
            <Text style={styles.agentName}>Dispatch Agent</Text>
            <Text style={styles.agentDesc}>Right tech, right job, right time. Intelligent assignment based on skills, location, and workload.</Text>
          </View>
          <View style={styles.agentCard}>
            <Text style={styles.agentName}>Route Agent</Text>
            <Text style={styles.agentDesc}>Shortest paths, more jobs. Real-time route optimization saves hours and fuel costs daily.</Text>
          </View>
          <View style={styles.agentCard}>
            <Text style={styles.agentName}>ETA Agent</Text>
            <Text style={styles.agentDesc}>Customers always know when you're coming. Automatic updates via SMS as techs approach.</Text>
          </View>
          <View style={styles.agentCard}>
            <Text style={styles.agentName}>Check-in Agent</Text>
            <Text style={styles.agentDesc}>Track job progress in real-time. Techs update status with a tap; you see it instantly.</Text>
          </View>
          <View style={styles.agentCard}>
            <Text style={styles.agentName}>Quoting Agent</Text>
            <Text style={styles.agentDesc}>Professional estimates in seconds. On-site quoting that converts more leads on the spot.</Text>
          </View>
          <View style={styles.agentCard}>
            <Text style={styles.agentName}>Invoicing Agent</Text>
            <Text style={styles.agentDesc}>Get paid faster. Automatic invoices sent as jobs complete, with integrated payment links.</Text>
          </View>
        </View>
        <View style={styles.column}>
          <View style={styles.agentCard}>
            <Text style={styles.agentName}>Inventory Agent</Text>
            <Text style={styles.agentDesc}>Never run out of parts. AI tracks stock levels and alerts you before you hit zero.</Text>
          </View>
          <View style={styles.agentCard}>
            <Text style={styles.agentName}>Warranty Agent</Text>
            <Text style={styles.agentDesc}>Warranty tracking without the headache. Know exactly what's covered and when it expires.</Text>
          </View>
          <View style={styles.agentCard}>
            <Text style={styles.agentName}>Lead Agent</Text>
            <Text style={styles.agentDesc}>Score and prioritize every lead. Focus your energy on prospects most likely to convert.</Text>
          </View>
          <View style={styles.agentCard}>
            <Text style={styles.agentName}>Campaign Agent</Text>
            <Text style={styles.agentDesc}>Marketing that runs itself. Seasonal promotions, re-engagement campaigns, referral programs—all automated.</Text>
          </View>
          <View style={styles.agentCard}>
            <Text style={styles.agentName}>Social Content Agent</Text>
            <Text style={styles.agentDesc}>AI-generated posts for every platform. On-brand content created in seconds, not hours.</Text>
          </View>
          <View style={styles.agentCard}>
            <Text style={styles.agentName}>Social Scheduler</Text>
            <Text style={styles.agentDesc}>Post at the perfect time. Queue content across all platforms with a single click.</Text>
          </View>
          <View style={styles.agentCard}>
            <Text style={styles.agentName}>Social Analytics Agent</Text>
            <Text style={styles.agentDesc}>See what's working. Track engagement, reach, and growth across every channel.</Text>
          </View>
          <View style={styles.agentCard}>
            <Text style={styles.agentName}>Performance Agent</Text>
            <Text style={styles.agentDesc}>Metrics that matter. Real-time dashboards for calls, bookings, and team efficiency.</Text>
          </View>
          <View style={styles.agentCard}>
            <Text style={styles.agentName}>Revenue Agent</Text>
            <Text style={styles.agentDesc}>Watch your money grow. Track revenue trends, forecast growth, and spot opportunities.</Text>
          </View>
          <View style={styles.agentCard}>
            <Text style={styles.agentName}>Customer Insights Agent</Text>
            <Text style={styles.agentDesc}>Know your customers better. AI analyzes behavior patterns to improve service and retention.</Text>
          </View>
          <View style={styles.agentCard}>
            <Text style={styles.agentName}>Report Agent</Text>
            <Text style={styles.agentDesc}>Beautiful reports, zero effort. Automated weekly/monthly summaries delivered to your inbox.</Text>
          </View>
        </View>
      </View>

      <Footer />
    </Page>

    {/* Pricing Page Copy */}
    <Page size="A4" style={styles.page}>
      <Header title="Pricing Page Copy" pageNum={5} />
      
      <Text style={styles.sectionTitle}>Tier Headlines & Descriptions</Text>
      <Text style={styles.sectionSubtitle}>Copy for pricing tables and plan comparisons</Text>

      <View style={styles.copyCard}>
        <Text style={styles.copyLabel}>Single-Point Tier - $1,500/mo</Text>
        <Text style={styles.copyHeadline}>Perfect for Solo Operators</Text>
        <Text style={styles.copyBody}>
          Stop missing calls and start building your reputation. The Single-Point tier gives you 24/7 AI reception, automated follow-up, and review collection—everything you need to capture every lead and grow your reviews.{'\n\n'}
          - AI Receptionist (24/7 call answering){'\n'}
          - Follow-up Agent (automated lead nurturing){'\n'}
          - Review Agent (5-star collection){'\n'}
          - Up to 5 team members{'\n'}
          - AI Voice capabilities included
        </Text>
      </View>

      <View style={styles.copyCard}>
        <Text style={styles.copyLabel}>Multi-Track Tier - $3,997/mo</Text>
        <Text style={styles.copyHeadline}>Built for Growing Teams</Text>
        <Text style={styles.copyBody}>
          You're scaling. Your operations should too. Multi-Track adds intelligent scheduling, dispatch optimization, and financial automation—so you can handle more jobs without more chaos.{'\n\n'}
          - Everything in Single-Point, plus:{'\n'}
          - Scheduling and Booking automation{'\n'}
          - Dispatch and Route optimization{'\n'}
          - ETA and Check-in tracking{'\n'}
          - Quoting and Invoicing{'\n'}
          - Inventory management{'\n'}
          - Up to 10 team members
        </Text>
      </View>

      <View style={styles.copyCard}>
        <Text style={styles.copyLabel}>Aura Pro Command Tier - $5,997/mo</Text>
        <Text style={styles.copyHeadline}>Complete AI Operations Suite</Text>
        <Text style={styles.copyBody}>
          Full command of your business. The complete 19-agent suite handles every operational task from marketing to analytics. For businesses ready to dominate their market.{'\n\n'}
          - Everything in Multi-Track, plus:{'\n'}
          - Lead scoring and Campaign automation{'\n'}
          - Social Media Signal management (all 6 platforms){'\n'}
          - Advanced analytics and reporting{'\n'}
          - Customer insights AI{'\n'}
          - Unlimited team members{'\n'}
          - Priority support
        </Text>
      </View>

      <Footer />
    </Page>

    {/* FAQ Content */}
    <Page size="A4" style={styles.page}>
      <Header title="FAQ Content" pageNum={6} />
      
      <Text style={styles.sectionTitle}>Frequently Asked Questions</Text>
      <Text style={styles.sectionSubtitle}>Pre-written Q&A for website FAQ sections</Text>

      <View style={styles.faqCard}>
        <Text style={styles.faqQuestion}>How does the AI voice sound? Will customers know it's not human?</Text>
        <Text style={styles.faqAnswer}>Our AI uses advanced natural language processing that sounds remarkably human. In testing, 94% of callers couldn't distinguish our AI from a trained receptionist. The voice is warm, professional, and handles natural conversation flow including interruptions and clarifying questions.</Text>
      </View>

      <View style={styles.faqCard}>
        <Text style={styles.faqQuestion}>How long does setup take?</Text>
        <Text style={styles.faqAnswer}>Most businesses are fully operational within 24-48 hours. Our implementation team handles everything: connecting your phone number, setting up your scheduling preferences, and training the AI on your services and pricing. You don't need any technical expertise.</Text>
      </View>

      <View style={styles.faqCard}>
        <Text style={styles.faqQuestion}>What if the AI can't handle a complex question?</Text>
        <Text style={styles.faqAnswer}>Our Triage Agent identifies when a call needs human attention and routes it appropriately. You set the rules: emergencies go to your cell, complex quotes get flagged for callback, and everything else gets handled automatically. You're always in control.</Text>
      </View>

      <View style={styles.faqCard}>
        <Text style={styles.faqQuestion}>Can I try before I commit?</Text>
        <Text style={styles.faqAnswer}>Absolutely. We offer a 14-day free trial with full access to your chosen tier. No credit card required to start. Most customers see ROI within the first week—often from a single recovered lead that would have otherwise gone to voicemail.</Text>
      </View>

      <View style={styles.faqCard}>
        <Text style={styles.faqQuestion}>How does pricing work? Are there any hidden fees?</Text>
        <Text style={styles.faqAnswer}>Simple, transparent pricing. Your monthly subscription includes all features for your tier. There's a one-time implementation fee ($499-$999 depending on complexity) that covers setup, training, and customization. No per-call charges, no hidden costs, no surprises.</Text>
      </View>

      <View style={styles.faqCard}>
        <Text style={styles.faqQuestion}>Will this work with my existing software?</Text>
        <Text style={styles.faqAnswer}>Aura Intercept integrates with popular calendar systems (Google Calendar), payment processors (Stripe), and communication platforms (Twilio). Our team will work with you during implementation to ensure smooth integration with your existing workflow.</Text>
      </View>

      <Footer />
    </Page>

    {/* SEO Metadata */}
    <Page size="A4" style={styles.page}>
      <Header title="SEO Metadata" pageNum={7} />
      
      <Text style={styles.sectionTitle}>Page Titles & Meta Descriptions</Text>
      <Text style={styles.sectionSubtitle}>Optimized metadata for search engine visibility</Text>

      <View style={styles.seoCard}>
        <Text style={styles.seoLabel}>Homepage</Text>
        <Text style={styles.seoText}>
          Title: Aura Intercept | AI Business Automation for Service Companies{'\n'}
          Meta: 23 AI operatives handle calls, scheduling, dispatch & more 24/7. Stop missing leads. Start growing revenue. Try free for 14 days.
        </Text>
      </View>

      <View style={styles.seoCard}>
        <Text style={styles.seoLabel}>Features Page</Text>
        <Text style={styles.seoText}>
          Title: AI-Powered Features | Aura Intercept Business Automation{'\n'}
          Meta: AI receptionist, smart scheduling, route optimization, automated invoicing & 15 more agents. See how Aura Intercept transforms operations.
        </Text>
      </View>

      <View style={styles.seoCard}>
        <Text style={styles.seoLabel}>Pricing Page</Text>
        <Text style={styles.seoText}>
          Title: Pricing Plans | Aura Intercept AI Business Automation{'\n'}
          Meta: Plans from $197/mo. 23 AI operatives, 24/7 call answering, scheduling automation & more. 23x average ROI. Start your free trial today.
        </Text>
      </View>

      <View style={styles.seoCard}>
        <Text style={styles.seoLabel}>HVAC Industry Page</Text>
        <Text style={styles.seoText}>
          Title: AI Automation for HVAC Companies | Aura Intercept{'\n'}
          Meta: HVAC-specific AI that answers calls, schedules appointments & dispatches technicians 24/7. Never miss an AC emergency call again.
        </Text>
      </View>

      <View style={styles.seoCard}>
        <Text style={styles.seoLabel}>Plumbing Industry Page</Text>
        <Text style={styles.seoText}>
          Title: AI Automation for Plumbing Businesses | Aura Intercept{'\n'}
          Meta: AI receptionist handles emergency calls day & night. Route optimization, automated quoting & invoicing for plumbers. Try free.
        </Text>
      </View>

      <View style={styles.copyCard}>
        <Text style={styles.copyLabel}>Image Alt Text Examples</Text>
        <Text style={styles.copyBody}>
          - "Aura Intercept AI dashboard showing real-time call analytics"{'\n'}
          - "HVAC technician using Aura Intercept mobile app for job updates"{'\n'}
          - "AI receptionist interface answering customer call"{'\n'}
          - "Route optimization map showing technician dispatch paths"{'\n'}
          - "Customer appointment confirmation screen on smartphone"
        </Text>
      </View>

      <Footer />
    </Page>

    {/* About Page Copy */}
    <Page size="A4" style={styles.page}>
      <Header title="About & Mission Copy" pageNum={8} />
      
      <Text style={styles.sectionTitle}>Company Story Content</Text>
      <Text style={styles.sectionSubtitle}>Narrative copy for About pages and brand storytelling</Text>

      <View style={styles.copyCard}>
        <Text style={styles.copyLabel}>Mission Statement - Short</Text>
        <Text style={styles.copyHeadline}>Empowering service businesses with AI that works as hard as they do.</Text>
      </View>

      <View style={styles.copyCard}>
        <Text style={styles.copyLabel}>Mission Statement - Long</Text>
        <Text style={styles.copyBody}>
          Aura Intercept exists because service business owners deserve better. Better than missed calls at 2 AM. Better than scheduling chaos. Better than spending hours on admin when they could be doing what they love.{'\n\n'}
          We built an AI operations platform that handles the grunt work—every call answered, every lead followed up, every appointment scheduled, every route optimized—so business owners can focus on growth, family, and the craft that made them entrepreneurs in the first place.{'\n\n'}
          This isn't about replacing humans. It's about giving humans superpowers.
        </Text>
      </View>

      <View style={styles.copyCard}>
        <Text style={styles.copyLabel}>Value Proposition Block</Text>
        <Text style={styles.copyHeadline}>We Believe In:</Text>
        <Text style={styles.copyBody}>
          [PHONE] Every Call Matters - A missed call is a missed opportunity. Our AI ensures zero slip through the cracks.{'\n\n'}
          [CLOCK] Time Is Your Most Valuable Asset - Automation should free you, not chain you to a dashboard.{'\n\n'}
          [HANDSHAKE] Technology Should Feel Human - AI that sounds robotic fails. Ours sounds like your best receptionist.{'\n\n'}
          [CHART] Results Over Features - We measure success by your revenue growth, not our feature list.
        </Text>
      </View>

      <View style={styles.copyCard}>
        <Text style={styles.copyLabel}>Founder Story Framework</Text>
        <Text style={styles.copyBody}>
          [Name] spent 15 years in the service industry watching talented business owners drown in operational chaos. Great plumbers missing calls while on jobs. HVAC pros losing leads to competitors who answered faster. The same story, every business.{'\n\n'}
          The tools that existed were built for enterprise. Complex. Expensive. Impractical.{'\n\n'}
          Aura Intercept was born from a simple question: What if AI could handle everything that takes you away from your craft?{'\n\n'}
          Today, hundreds of service businesses use Aura to reclaim their time—and their revenue.
        </Text>
      </View>

      <Footer />
    </Page>
  </Document>
);

export default WebsiteCopyPDF;
