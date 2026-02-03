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
  instagram: '#E4405F',
  facebook: '#1877F2',
  linkedin: '#0A66C2',
  tiktok: '#000000',
  gmb: '#4285F4',
  sms: '#22c55e',
};

const styles = StyleSheet.create({
  page: {
    padding: 40,
    backgroundColor: colors.light,
    fontFamily: 'Helvetica',
  },
  coverPage: {
    padding: 40,
    backgroundColor: colors.primary,
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
    color: colors.primary,
    fontSize: 14,
    fontWeight: 'bold',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 30,
    paddingBottom: 15,
    borderBottomWidth: 2,
    borderBottomColor: colors.primary,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.primary,
  },
  headerPage: {
    fontSize: 10,
    color: colors.gray,
  },
  sectionTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.dark,
    marginBottom: 15,
    marginTop: 10,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: colors.gray,
    marginBottom: 20,
  },
  platformHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
    marginTop: 20,
  },
  platformBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 15,
    marginRight: 10,
  },
  platformBadgeText: {
    color: 'white',
    fontSize: 10,
    fontWeight: 'bold',
  },
  platformTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.dark,
  },
  platformCharLimit: {
    fontSize: 10,
    color: colors.gray,
    marginLeft: 'auto',
  },
  templateCard: {
    backgroundColor: 'white',
    padding: 15,
    borderRadius: 8,
    marginBottom: 10,
    borderLeftWidth: 4,
    borderLeftColor: colors.primary,
  },
  templateLabel: {
    fontSize: 9,
    color: colors.gray,
    marginBottom: 5,
    textTransform: 'uppercase',
  },
  templateText: {
    fontSize: 11,
    color: colors.dark,
    lineHeight: 1.5,
  },
  hashtagSection: {
    backgroundColor: '#eef2ff',
    padding: 15,
    borderRadius: 8,
    marginTop: 10,
    marginBottom: 15,
  },
  hashtagLabel: {
    fontSize: 10,
    color: colors.secondary,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  hashtagText: {
    fontSize: 10,
    color: colors.dark,
    lineHeight: 1.6,
  },
  ctaBox: {
    backgroundColor: colors.accent,
    padding: 12,
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
    fontSize: 11,
    color: 'white',
    fontWeight: 'bold',
  },
  calendarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  calendarDay: {
    width: '18%',
    backgroundColor: 'white',
    padding: 10,
    borderRadius: 6,
    marginBottom: 8,
  },
  calendarDayNum: {
    fontSize: 14,
    fontWeight: 'bold',
    color: colors.primary,
    marginBottom: 4,
  },
  calendarTheme: {
    fontSize: 8,
    color: colors.dark,
  },
  twoColumn: {
    flexDirection: 'row',
    gap: 15,
  },
  column: {
    flex: 1,
  },
  promptBox: {
    backgroundColor: '#fef3c7',
    padding: 15,
    borderRadius: 8,
    marginTop: 15,
  },
  promptLabel: {
    fontSize: 10,
    color: colors.warning,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  promptText: {
    fontSize: 10,
    color: colors.dark,
    lineHeight: 1.5,
    fontStyle: 'italic',
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
  statsRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 15,
  },
  statCard: {
    flex: 1,
    backgroundColor: 'white',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.primary,
  },
  statLabel: {
    fontSize: 8,
    color: colors.gray,
    marginTop: 4,
  },
  tipBox: {
    backgroundColor: '#ecfdf5',
    padding: 12,
    borderRadius: 8,
    marginTop: 10,
    borderLeftWidth: 4,
    borderLeftColor: colors.success,
  },
  tipLabel: {
    fontSize: 9,
    color: colors.success,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  tipText: {
    fontSize: 10,
    color: colors.dark,
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
    <Text style={styles.footerText}>Aura Intercept Social Media Content Pack</Text>
    <Text style={styles.footerText}>© 2026 Aura Intercept</Text>
  </View>
);

const PlatformBadge = ({ platform, color }: { platform: string; color: string }) => (
  <View style={[styles.platformBadge, { backgroundColor: color }]}>
    <Text style={styles.platformBadgeText}>{platform}</Text>
  </View>
);

export const SocialMediaContentPackPDF: React.FC = () => (
  <Document>
    {/* Cover Page */}
    <Page size="A4" style={styles.coverPage}>
      <Text style={styles.coverTitle}>Social Media{'\n'}Content Pack</Text>
      <Text style={styles.coverSubtitle}>
        Ready-to-Post Templates for All 6 Platforms{'\n'}
        Hashtags - CTAs - 30-Day Calendar - AI Prompts
      </Text>
      <View style={styles.coverBadge}>
        <Text style={styles.coverBadgeText}>80+ Templates Included</Text>
      </View>
    </Page>

    {/* Instagram Templates */}
    <Page size="A4" style={styles.page}>
      <Header title="Instagram Templates" pageNum={2} />
      
      <View style={styles.platformHeader}>
        <PlatformBadge platform="INSTAGRAM" color={colors.instagram} />
        <Text style={styles.platformTitle}>Feed & Reels Content</Text>
        <Text style={styles.platformCharLimit}>Max: 2,200 characters</Text>
      </View>

      <View style={styles.statsRow}>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>10</Text>
          <Text style={styles.statLabel}>Post Templates</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>50+</Text>
          <Text style={styles.statLabel}>Hashtags</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>5</Text>
          <Text style={styles.statLabel}>CTA Variations</Text>
        </View>
      </View>

      <Text style={styles.sectionSubtitle}>Problem-Solution Posts</Text>

      <View style={styles.templateCard}>
        <Text style={styles.templateLabel}>Template 1: The Time-Saver</Text>
        <Text style={styles.templateText}>
          [TIME] Still spending 3+ hours on phone tag with customers?{'\n\n'}
          Our AI Receptionist answers every call, books appointments, and sends confirmations—while you focus on the job that pays.{'\n\n'}
          - 24/7 availability{'\n'}
          - Instant booking{'\n'}
          - Zero missed calls{'\n\n'}
          Stop losing leads. Start closing jobs.{'\n\n'}
          Link in bio to see it in action
        </Text>
      </View>

      <View style={styles.templateCard}>
        <Text style={styles.templateLabel}>Template 2: The Revenue Hook</Text>
        <Text style={styles.templateText}>
          [MONEY] The math doesn't lie:{'\n\n'}
          X 1 missed call = $500 average job{'\n'}
          X 5 missed calls/week = $10,000/month lost{'\n'}
          + AI answers every call = Revenue protected{'\n\n'}
          Aura Intercept never sleeps, never takes breaks, never misses a lead.{'\n\n'}
          Your competitors are already using AI. Are you?
        </Text>
      </View>

      <View style={styles.hashtagSection}>
        <Text style={styles.hashtagLabel}>RECOMMENDED HASHTAGS</Text>
        <Text style={styles.hashtagText}>
          #ServiceBusiness #HVAC #PlumbingLife #ElectricianLife #ContractorLife #SmallBusinessOwner #BusinessAutomation #AIforBusiness #LeadGeneration #NeverMissACall #BusinessGrowth #FieldServiceManagement #TechForTrades #BlueCollarBusiness #ServicePro
        </Text>
      </View>

      <Footer />
    </Page>

    {/* Instagram Templates Continued */}
    <Page size="A4" style={styles.page}>
      <Header title="Instagram Templates (Continued)" pageNum={3} />

      <View style={styles.templateCard}>
        <Text style={styles.templateLabel}>Template 3: Customer Story</Text>
        <Text style={styles.templateText}>
          "I used to miss 40% of my calls while on jobs. Last month? Zero missed calls, 12 new bookings."—Mike, HVAC Pro [HOT]{'\n\n'}
          Real results. Real contractors. Real AI that works.{'\n\n'}
          What would 12 extra bookings do for YOUR business?{'\n\n'}
          Comment "DEMO" and we'll show you
        </Text>
      </View>

      <View style={styles.templateCard}>
        <Text style={styles.templateLabel}>Template 4: Behind the Scenes</Text>
        <Text style={styles.templateText}>
          POV: You're on a job and your AI just:{'\n\n'}
          [x] Answered a new lead call{'\n'}
          [x] Scheduled them for tomorrow{'\n'}
          [x] Sent a confirmation email{'\n'}
          [x] Added them to your dispatch route{'\n'}
          [x] Notified your team{'\n\n'}
          All while you're elbow-deep in an AC unit.{'\n\n'}
          This is what working smarter looks like.
        </Text>
      </View>

      <View style={styles.templateCard}>
        <Text style={styles.templateLabel}>Template 5: Myth Buster</Text>
        <Text style={styles.templateText}>
          [MYTH BUSTER] "AI sounds robotic and customers hate it"{'\n\n'}
          Reality: 94% of customers can't tell they're talking to AI. Our voice tech sounds natural, warm, and professional.{'\n\n'}
          Don't believe us? Call our demo line yourself:{'\n'}
          [Demo Number]{'\n\n'}
          The future of customer service is here. And it sounds human.
        </Text>
      </View>

      <View style={styles.ctaBox}>
        <Text style={styles.ctaLabel}>CTA VARIATIONS</Text>
        <Text style={styles.ctaText}>
          - "Link in bio to start your free trial"{'\n'}
          - "Comment 'INFO' for a personalized demo"{'\n'}
          - "DM us 'SAVE' to see your ROI calculation"{'\n'}
          - "Tag a contractor who needs this"{'\n'}
          - "Double-tap if you're tired of missed calls"
        </Text>
      </View>

      <Footer />
    </Page>

    {/* Facebook Templates */}
    <Page size="A4" style={styles.page}>
      <Header title="Facebook Templates" pageNum={4} />
      
      <View style={styles.platformHeader}>
        <PlatformBadge platform="FACEBOOK" color={colors.facebook} />
        <Text style={styles.platformTitle}>Feed & Group Content</Text>
        <Text style={styles.platformCharLimit}>Optimal: 40-80 characters for engagement</Text>
      </View>

      <View style={styles.templateCard}>
        <Text style={styles.templateLabel}>Template 1: Question Hook</Text>
        <Text style={styles.templateText}>
          Quick question for service business owners:{'\n\n'}
          How many calls did you miss last week?{'\n\n'}
          If the answer isn't "zero," you're leaving money on the table. Our AI Receptionist ensures every single call gets answered, every lead gets captured, and every customer gets scheduled.{'\n\n'}
          No more playing phone tag. No more lost revenue.{'\n\n'}
          [LINK] See how it works: [Link]
        </Text>
      </View>

      <View style={styles.templateCard}>
        <Text style={styles.templateLabel}>Template 2: Story Format</Text>
        <Text style={styles.templateText}>
          True story from last week:{'\n\n'}
          A plumber named Dave was losing 30% of his leads because he couldn't answer calls while on jobs. He tried hiring a receptionist ($3,500/month). Still missed calls after hours.{'\n\n'}
          Then he tried Aura Intercept. $1,500/month. 24/7 coverage. Zero missed calls.{'\n\n'}
          First month: 23 new bookings he would have missed.{'\n'}
          Revenue recovered: $11,500{'\n\n'}
          That's a 7x return. In month one.{'\n\n'}
          Dave's only regret? Not starting sooner.
        </Text>
      </View>

      <View style={styles.templateCard}>
        <Text style={styles.templateLabel}>Template 3: List Post</Text>
        <Text style={styles.templateText}>
          5 things your AI receptionist does that a human can't:{'\n\n'}
          1. Answer calls at 2 AM (when emergencies happen){'\n'}
          2. Handle 10 calls simultaneously during rush hour{'\n'}
          3. Never call in sick or take vacation{'\n'}
          4. Instantly access your full schedule and pricing{'\n'}
          5. Send confirmations before hanging up{'\n\n'}
          This isn't about replacing people. It's about being there when you can't be.{'\n\n'}
          Ready to never miss a call again?
        </Text>
      </View>

      <View style={styles.tipBox}>
        <Text style={styles.tipLabel}>FACEBOOK PRO TIP</Text>
        <Text style={styles.tipText}>
          Post in local business groups and trade-specific communities. Engagement rates are 3x higher in niche groups. Use story formats—Facebook's algorithm prioritizes narrative content.
        </Text>
      </View>

      <Footer />
    </Page>

    {/* LinkedIn Templates */}
    <Page size="A4" style={styles.page}>
      <Header title="LinkedIn Templates" pageNum={5} />
      
      <View style={styles.platformHeader}>
        <PlatformBadge platform="LINKEDIN" color={colors.linkedin} />
        <Text style={styles.platformTitle}>Professional Network Content</Text>
        <Text style={styles.platformCharLimit}>Max: 3,000 characters</Text>
      </View>

      <View style={styles.templateCard}>
        <Text style={styles.templateLabel}>Template 1: Thought Leadership</Text>
        <Text style={styles.templateText}>
          The service industry has a $75 billion problem.{'\n\n'}
          It's called "missed calls."{'\n\n'}
          Every year, HVAC, plumbing, and electrical businesses lose an estimated $75B in revenue from calls that go unanswered. The average service call is worth $400-$800. Miss just one call a day, and you're looking at $150,000+ in lost annual revenue.{'\n\n'}
          The solution isn't hiring more staff. It's intelligent automation.{'\n\n'}
          AI receptionists now handle:{'\n'}
          → Natural voice conversations{'\n'}
          → Real-time scheduling{'\n'}
          → Instant confirmations{'\n'}
          → 24/7/365 availability{'\n\n'}
          The contractors who adopt this technology first will dominate their markets. The rest will wonder where their leads went.{'\n\n'}
          The future of service business isn't coming. It's here.{'\n\n'}
          #ServiceIndustry #AIAutomation #BusinessGrowth
        </Text>
      </View>

      <View style={styles.templateCard}>
        <Text style={styles.templateLabel}>Template 2: Data-Driven Post</Text>
        <Text style={styles.templateText}>
          I analyzed 10,000 service calls. Here's what I found:{'\n\n'}
          [DATA] 62% of calls to contractors go unanswered{'\n'}
          [DATA] 85% of unanswered callers don't leave voicemails{'\n'}
          [DATA] 78% call a competitor within 5 minutes{'\n'}
          [DATA] Average lifetime value of a customer: $4,200{'\n\n'}
          The math: Every missed call = $4,200 walking to your competitor.{'\n\n'}
          AI changes this equation entirely. When every call gets answered, every lead gets captured. When every lead gets captured, revenue compounds.{'\n\n'}
          What's your current call answer rate?
        </Text>
      </View>

      <View style={styles.hashtagSection}>
        <Text style={styles.hashtagLabel}>LINKEDIN HASHTAGS</Text>
        <Text style={styles.hashtagText}>
          #AIinBusiness #ServiceIndustry #SmallBusinessGrowth #Automation #FieldService #BusinessTech #Entrepreneurship #HVAC #Plumbing #Electrical #ContractorLife #CustomerExperience #LeadGen #SalesAutomation #B2B
        </Text>
      </View>

      <Footer />
    </Page>

    {/* TikTok Templates */}
    <Page size="A4" style={styles.page}>
      <Header title="TikTok Templates" pageNum={6} />
      
      <View style={styles.platformHeader}>
        <PlatformBadge platform="TIKTOK" color={colors.tiktok} />
        <Text style={styles.platformTitle}>Short-Form Video Hooks</Text>
        <Text style={styles.platformCharLimit}>Max: 300 characters • Mark as AI-generated</Text>
      </View>

      <Text style={styles.sectionSubtitle}>Hook Scripts for First 3 Seconds</Text>

      <View style={styles.templateCard}>
        <Text style={styles.templateLabel}>Hook 1: The Reveal</Text>
        <Text style={styles.templateText}>
          "This AI just made me $11,000 in one month..." [PAUSE]{'\n\n'}
          [Show phone ringing, AI answering]{'\n\n'}
          "And all I did was let it answer my phone."{'\n\n'}
          #ContractorTok #BusinessTips #AI #Entrepreneur
        </Text>
      </View>

      <View style={styles.templateCard}>
        <Text style={styles.templateLabel}>Hook 2: The Comparison</Text>
        <Text style={styles.templateText}>
          POV: Your competitor answered that call you missed at 9 PM{'\n\n'}
          [Split screen: You relaxing vs. competitor booking job]{'\n\n'}
          Unless... you have AI that never sleeps [ROBOT]{'\n\n'}
          #SmallBusiness #HVAC #PlumbingTikTok
        </Text>
      </View>

      <View style={styles.templateCard}>
        <Text style={styles.templateLabel}>Hook 3: The Challenge</Text>
        <Text style={styles.templateText}>
          "Your business can't handle AI" - someone who's never tried it{'\n\n'}
          Watch me set up an AI receptionist in 10 minutes:{'\n\n'}
          [Speed run of setup process]{'\n\n'}
          Now every call gets answered. Forever.
        </Text>
      </View>

      <View style={styles.templateCard}>
        <Text style={styles.templateLabel}>Hook 4: The Story</Text>
        <Text style={styles.templateText}>
          "I almost quit my HVAC business. Then I found this..."{'\n\n'}
          [Show before: stressed, missing calls]{'\n'}
          [Show after: AI handling everything, owner relaxed]{'\n\n'}
          "Best $197 I ever spent."
        </Text>
      </View>

      <View style={styles.tipBox}>
        <Text style={styles.tipLabel}>[!] TIKTOK COMPLIANCE NOTE</Text>
        <Text style={styles.tipText}>
          All AI-generated content must be marked with the "AI-generated" label per TikTok's policies. Include "#ad" or "#sponsored" for paid promotions. The Aura Intercept platform automatically adds 'is_aigc' disclosure for scheduled TikTok posts.
        </Text>
      </View>

      <Footer />
    </Page>

    {/* Google My Business Templates */}
    <Page size="A4" style={styles.page}>
      <Header title="Google My Business Templates" pageNum={7} />
      
      <View style={styles.platformHeader}>
        <PlatformBadge platform="GMB" color={colors.gmb} />
        <Text style={styles.platformTitle}>Local Business Updates</Text>
        <Text style={styles.platformCharLimit}>Optimal: 150-300 characters</Text>
      </View>

      <Text style={styles.sectionSubtitle}>Weekly Update Posts</Text>

      <View style={styles.templateCard}>
        <Text style={styles.templateLabel}>Update 1: Service Announcement</Text>
        <Text style={styles.templateText}>
          [NEW] NEW: 24/7 Phone Support{'\n\n'}
          We now answer calls around the clock! Our AI-powered system ensures you always reach us—day or night, weekends and holidays.{'\n\n'}
          Call anytime: [Phone Number]{'\n'}
          Book online: [Link]
        </Text>
      </View>

      <View style={styles.templateCard}>
        <Text style={styles.templateLabel}>Update 2: Seasonal</Text>
        <Text style={styles.templateText}>
          [WINTER] Winter is coming! Is your HVAC ready?{'\n\n'}
          Schedule your heating system tune-up before the rush. Same-day appointments available.{'\n\n'}
          Call or text us anytime—we're here 24/7!
        </Text>
      </View>

      <View style={styles.templateCard}>
        <Text style={styles.templateLabel}>Update 3: Review Request</Text>
        <Text style={styles.templateText}>
          [STAR] Love our service? We'd love your feedback!{'\n\n'}
          Your 5-star review helps local homeowners find reliable service. Takes just 30 seconds.{'\n\n'}
          Thank you for being part of our community!
        </Text>
      </View>

      <View style={styles.twoColumn}>
        <View style={styles.column}>
          <View style={styles.tipBox}>
            <Text style={styles.tipLabel}>[PIN] GMB BEST PRACTICES</Text>
            <Text style={styles.tipText}>
              - Post weekly for best visibility{'\n'}
              - Include location keywords{'\n'}
              - Add photos when possible{'\n'}
              - Respond to all reviews
            </Text>
          </View>
        </View>
        <View style={styles.column}>
          <View style={styles.hashtagSection}>
            <Text style={styles.hashtagLabel}>LOCAL KEYWORDS</Text>
            <Text style={styles.hashtagText}>
              [City] HVAC, [City] plumber, 24/7 service [City], emergency repair [City], same-day service
            </Text>
          </View>
        </View>
      </View>

      <Footer />
    </Page>

    {/* SMS Templates */}
    <Page size="A4" style={styles.page}>
      <Header title="SMS Templates" pageNum={8} />
      
      <View style={styles.platformHeader}>
        <PlatformBadge platform="SMS" color={colors.sms} />
        <Text style={styles.platformTitle}>Text Message Campaigns</Text>
        <Text style={styles.platformCharLimit}>Max: 160 characters per segment</Text>
      </View>

      <Text style={styles.sectionSubtitle}>Promotional Messages</Text>

      <View style={styles.templateCard}>
        <Text style={styles.templateLabel}>SMS 1: Limited Offer</Text>
        <Text style={styles.templateText}>
          [Business]: Spring tune-up special! $99 AC check (reg $149). Book by [Date]: [Link] Reply STOP to opt out
        </Text>
      </View>

      <View style={styles.templateCard}>
        <Text style={styles.templateLabel}>SMS 2: Appointment Reminder</Text>
        <Text style={styles.templateText}>
          Hi [Name]! Your [Service] appt is tomorrow at [Time]. Reply C to confirm or R to reschedule. See you soon! -[Business]
        </Text>
      </View>

      <View style={styles.templateCard}>
        <Text style={styles.templateLabel}>SMS 3: Follow-Up</Text>
        <Text style={styles.templateText}>
          Thanks for choosing [Business]! How was your service? Reply 1-5. Your feedback helps us improve!
        </Text>
      </View>

      <View style={styles.templateCard}>
        <Text style={styles.templateLabel}>SMS 4: Re-Engagement</Text>
        <Text style={styles.templateText}>
          [Name], it's been 6 months since your last service. Time for a checkup? Book in 30 sec: [Link] -[Business]
        </Text>
      </View>

      <View style={styles.templateCard}>
        <Text style={styles.templateLabel}>SMS 5: Referral</Text>
        <Text style={styles.templateText}>
          Thanks for being a valued customer! Refer a friend & you both get $50 off. Share your code: [CODE] -[Business]
        </Text>
      </View>

      <View style={styles.tipBox}>
        <Text style={styles.tipLabel}>[MOBILE] SMS COMPLIANCE</Text>
        <Text style={styles.tipText}>
          - Always include opt-out instructions (Reply STOP){'\n'}
          - Only text customers who have opted in{'\n'}
          - Identify your business name in every message{'\n'}
          - Keep messages under 160 characters to avoid splitting{'\n'}
          - Aura Intercept tracks opt-outs automatically
        </Text>
      </View>

      <Footer />
    </Page>

    {/* 30-Day Content Calendar */}
    <Page size="A4" style={styles.page}>
      <Header title="30-Day Content Calendar" pageNum={9} />
      
      <Text style={styles.sectionTitle}>Monthly Content Themes</Text>
      <Text style={styles.sectionSubtitle}>Rotate these themes for consistent, varied content</Text>

      <View style={styles.calendarGrid}>
        <View style={styles.calendarDay}>
          <Text style={styles.calendarDayNum}>1</Text>
          <Text style={styles.calendarTheme}>Problem Hook</Text>
        </View>
        <View style={styles.calendarDay}>
          <Text style={styles.calendarDayNum}>2</Text>
          <Text style={styles.calendarTheme}>Feature Spotlight</Text>
        </View>
        <View style={styles.calendarDay}>
          <Text style={styles.calendarDayNum}>3</Text>
          <Text style={styles.calendarTheme}>Customer Story</Text>
        </View>
        <View style={styles.calendarDay}>
          <Text style={styles.calendarDayNum}>4</Text>
          <Text style={styles.calendarTheme}>Behind Scenes</Text>
        </View>
        <View style={styles.calendarDay}>
          <Text style={styles.calendarDayNum}>5</Text>
          <Text style={styles.calendarTheme}>Data/Stats</Text>
        </View>
        <View style={styles.calendarDay}>
          <Text style={styles.calendarDayNum}>6</Text>
          <Text style={styles.calendarTheme}>Myth Buster</Text>
        </View>
        <View style={styles.calendarDay}>
          <Text style={styles.calendarDayNum}>7</Text>
          <Text style={styles.calendarTheme}>Industry Tip</Text>
        </View>
        <View style={styles.calendarDay}>
          <Text style={styles.calendarDayNum}>8</Text>
          <Text style={styles.calendarTheme}>Problem Hook</Text>
        </View>
        <View style={styles.calendarDay}>
          <Text style={styles.calendarDayNum}>9</Text>
          <Text style={styles.calendarTheme}>Agent Demo</Text>
        </View>
        <View style={styles.calendarDay}>
          <Text style={styles.calendarDayNum}>10</Text>
          <Text style={styles.calendarTheme}>Testimonial</Text>
        </View>
        <View style={styles.calendarDay}>
          <Text style={styles.calendarDayNum}>11</Text>
          <Text style={styles.calendarTheme}>How-To</Text>
        </View>
        <View style={styles.calendarDay}>
          <Text style={styles.calendarDayNum}>12</Text>
          <Text style={styles.calendarTheme}>ROI Focus</Text>
        </View>
        <View style={styles.calendarDay}>
          <Text style={styles.calendarDayNum}>13</Text>
          <Text style={styles.calendarTheme}>Comparison</Text>
        </View>
        <View style={styles.calendarDay}>
          <Text style={styles.calendarDayNum}>14</Text>
          <Text style={styles.calendarTheme}>Weekend Tip</Text>
        </View>
        <View style={styles.calendarDay}>
          <Text style={styles.calendarDayNum}>15</Text>
          <Text style={styles.calendarTheme}>Mid-Month CTA</Text>
        </View>
        <View style={styles.calendarDay}>
          <Text style={styles.calendarDayNum}>16</Text>
          <Text style={styles.calendarTheme}>Feature Deep-Dive</Text>
        </View>
        <View style={styles.calendarDay}>
          <Text style={styles.calendarDayNum}>17</Text>
          <Text style={styles.calendarTheme}>Success Story</Text>
        </View>
        <View style={styles.calendarDay}>
          <Text style={styles.calendarDayNum}>18</Text>
          <Text style={styles.calendarTheme}>Quick Tip</Text>
        </View>
        <View style={styles.calendarDay}>
          <Text style={styles.calendarDayNum}>19</Text>
          <Text style={styles.calendarTheme}>Industry News</Text>
        </View>
        <View style={styles.calendarDay}>
          <Text style={styles.calendarDayNum}>20</Text>
          <Text style={styles.calendarTheme}>Q&A Post</Text>
        </View>
        <View style={styles.calendarDay}>
          <Text style={styles.calendarDayNum}>21</Text>
          <Text style={styles.calendarTheme}>Weekend Engage</Text>
        </View>
        <View style={styles.calendarDay}>
          <Text style={styles.calendarDayNum}>22</Text>
          <Text style={styles.calendarTheme}>Feature List</Text>
        </View>
        <View style={styles.calendarDay}>
          <Text style={styles.calendarDayNum}>23</Text>
          <Text style={styles.calendarTheme}>User Generated</Text>
        </View>
        <View style={styles.calendarDay}>
          <Text style={styles.calendarDayNum}>24</Text>
          <Text style={styles.calendarTheme}>Poll/Question</Text>
        </View>
        <View style={styles.calendarDay}>
          <Text style={styles.calendarDayNum}>25</Text>
          <Text style={styles.calendarTheme}>Pricing Value</Text>
        </View>
        <View style={styles.calendarDay}>
          <Text style={styles.calendarDayNum}>26</Text>
          <Text style={styles.calendarTheme}>Team/Culture</Text>
        </View>
        <View style={styles.calendarDay}>
          <Text style={styles.calendarDayNum}>27</Text>
          <Text style={styles.calendarTheme}>Demo Invite</Text>
        </View>
        <View style={styles.calendarDay}>
          <Text style={styles.calendarDayNum}>28</Text>
          <Text style={styles.calendarTheme}>Weekend Recap</Text>
        </View>
        <View style={styles.calendarDay}>
          <Text style={styles.calendarDayNum}>29</Text>
          <Text style={styles.calendarTheme}>Month Preview</Text>
        </View>
        <View style={styles.calendarDay}>
          <Text style={styles.calendarDayNum}>30</Text>
          <Text style={styles.calendarTheme}>Strong CTA</Text>
        </View>
      </View>

      <Footer />
    </Page>

    {/* AI Prompt Templates */}
    <Page size="A4" style={styles.page}>
      <Header title="AI Content Generation Prompts" pageNum={10} />
      
      <Text style={styles.sectionTitle}>Generate More Content Like This</Text>
      <Text style={styles.sectionSubtitle}>Use these prompts with AI tools to create unlimited variations</Text>

      <View style={styles.promptBox}>
        <Text style={styles.promptLabel}>[AI] SOCIAL POST GENERATOR</Text>
        <Text style={styles.promptText}>
          "Create a [platform] post for a [HVAC/plumbing/electrical] business promoting AI-powered call answering. Use a [problem-solution/story/data-driven] format. Include a hook in the first line, 3-4 key benefits, and a clear CTA. Keep it under [character limit] characters. Tone should be [professional/friendly/urgent]."
        </Text>
      </View>

      <View style={styles.promptBox}>
        <Text style={styles.promptLabel}>[AI] HASHTAG GENERATOR</Text>
        <Text style={styles.promptText}>
          "Generate 20 hashtags for a B2B SaaS company targeting [industry] business owners. Include a mix of: industry-specific tags, business growth tags, technology/AI tags, and local service tags. Prioritize hashtags with 10K-500K posts for optimal reach."
        </Text>
      </View>

      <View style={styles.promptBox}>
        <Text style={styles.promptLabel}>[AI] VIDEO SCRIPT GENERATOR</Text>
        <Text style={styles.promptText}>
          "Write a [15/30/60]-second video script promoting Aura Intercept to [industry] business owners. Start with a hook that stops scrolling. Address the pain of missed calls. Show the AI solution. End with a clear CTA. Include visual direction notes in brackets."
        </Text>
      </View>

      <View style={styles.promptBox}>
        <Text style={styles.promptLabel}>[AI] TESTIMONIAL FRAMEWORK</Text>
        <Text style={styles.promptText}>
          "Create a customer testimonial template for a [industry] business owner who started using AI call answering. Include: their initial skepticism, the specific problem they faced, results after 30 days (with numbers), and their recommendation. Keep it conversational and authentic."
        </Text>
      </View>

      <View style={styles.promptBox}>
        <Text style={styles.promptLabel}>🤖 TONE VARIATIONS</Text>
        <Text style={styles.promptText}>
          Professional: "Maximize operational efficiency with intelligent automation..."{'\n'}
          Friendly: "Hey there! Tired of missing calls while you're on the job?"{'\n'}
          Urgent: "Every missed call is money walking to your competitor. Stop the leak now."{'\n'}
          Casual: "So I found this AI thing that answers my phone and honestly? Game changer."
        </Text>
      </View>

      <Footer />
    </Page>
  </Document>
);

export default SocialMediaContentPackPDF;
