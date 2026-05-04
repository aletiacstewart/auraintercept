import React from 'react';
import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer';
import { sanitizePdfText } from './pdfSanitize';

const colors = {
  primary: '#00E5FF',
  secondary: '#6366f1',
  accent: '#06b6d4',
  dark: '#1e293b',
  light: '#f8fafc',
  gray: '#64748b',
  success: '#10b981',
  warning: '#f59e0b',
  // Essential Trades
  hvac: '#ef4444',
  plumbing: '#3b82f6',
  electrical: '#f59e0b',
  solar: '#eab308',
  // Exterior & Structural
  roofing: '#78716c',
  fencing: '#a16207',
  // Property & Estate
  landscape: '#22c55e',
  pool: '#0ea5e9',
  pest: '#dc2626',
  // Specialized Home
  appliance: '#6366f1',
  handyman: '#f97316',
  construction: '#059669',
  // Mobile & Commercial
  auto: '#7c3aed',
  security: '#334155',
  realestate: '#0891b2',
  // Wellness & Personal
  beauty: '#ec4899',
  food: '#f97316',
  personal: '#14b8a6',
};

const styles = StyleSheet.create({
  page: {
    padding: 40,
    backgroundColor: colors.light,
    fontFamily: 'Helvetica',
  },
  coverPage: {
    padding: 40,
    backgroundColor: colors.success,
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
    fontSize: 14,
    color: 'white',
    opacity: 0.9,
    textAlign: 'center',
    marginBottom: 30,
    lineHeight: 1.6,
  },
  coverCategories: {
    marginBottom: 30,
  },
  coverCategory: {
    fontSize: 11,
    color: 'white',
    opacity: 0.85,
    textAlign: 'center',
    marginBottom: 6,
  },
  coverBadge: {
    backgroundColor: 'white',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
  },
  coverBadgeText: {
    color: colors.success,
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
    borderBottomColor: colors.success,
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
  industryBadge: {
    paddingHorizontal: 15,
    paddingVertical: 6,
    borderRadius: 15,
    alignSelf: 'flex-start',
    marginBottom: 15,
  },
  industryBadgeText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
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
  painPointCard: {
    backgroundColor: 'white',
    padding: 15,
    borderRadius: 8,
    marginBottom: 10,
    borderLeftWidth: 4,
  },
  painPointTitle: {
    fontSize: 11,
    fontWeight: 'bold',
    color: colors.dark,
    marginBottom: 6,
  },
  painPointText: {
    fontSize: 10,
    color: colors.gray,
    lineHeight: 1.5,
  },
  solutionCard: {
    backgroundColor: '#ecfdf5',
    padding: 15,
    borderRadius: 8,
    marginBottom: 10,
    borderLeftWidth: 4,
    borderLeftColor: colors.success,
  },
  solutionTitle: {
    fontSize: 11,
    fontWeight: 'bold',
    color: colors.success,
    marginBottom: 6,
  },
  solutionText: {
    fontSize: 10,
    color: colors.dark,
    lineHeight: 1.5,
  },
  templateCard: {
    backgroundColor: 'white',
    padding: 15,
    borderRadius: 10,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  templateLabel: {
    fontSize: 9,
    color: colors.gray,
    marginBottom: 6,
    textTransform: 'uppercase',
  },
  templateText: {
    fontSize: 10,
    color: colors.dark,
    lineHeight: 1.6,
  },
  twoColumn: {
    flexDirection: 'row',
    gap: 15,
  },
  column: {
    flex: 1,
  },
  seasonCard: {
    backgroundColor: 'white',
    padding: 12,
    borderRadius: 8,
    marginBottom: 10,
  },
  seasonTitle: {
    fontSize: 10,
    fontWeight: 'bold',
    color: colors.dark,
    marginBottom: 6,
  },
  seasonText: {
    fontSize: 9,
    color: colors.gray,
    lineHeight: 1.4,
  },
  emailCard: {
    backgroundColor: '#f1f5f9',
    padding: 15,
    borderRadius: 8,
    marginBottom: 10,
  },
  emailSubject: {
    fontSize: 10,
    fontWeight: 'bold',
    color: colors.dark,
    marginBottom: 8,
  },
  emailBody: {
    fontSize: 9,
    color: colors.gray,
    lineHeight: 1.5,
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
  videoCard: {
    backgroundColor: colors.secondary,
    padding: 15,
    borderRadius: 8,
    marginBottom: 10,
  },
  videoLabel: {
    fontSize: 9,
    color: 'white',
    opacity: 0.8,
    marginBottom: 4,
  },
  videoTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 8,
  },
  videoScript: {
    fontSize: 9,
    color: 'white',
    lineHeight: 1.5,
  },
  landingCard: {
    backgroundColor: 'white',
    padding: 15,
    borderRadius: 10,
    marginBottom: 15,
    borderWidth: 2,
    borderColor: colors.accent,
  },
  landingHeadline: {
    fontSize: 14,
    fontWeight: 'bold',
    color: colors.dark,
    marginBottom: 8,
  },
  landingSubhead: {
    fontSize: 10,
    color: colors.gray,
    lineHeight: 1.5,
  },
  bulletList: {
    marginTop: 10,
  },
  bulletItem: {
    fontSize: 9,
    color: colors.dark,
    marginBottom: 4,
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
    <Text style={styles.footerText}>Aura Intercept Industry Marketing Kits</Text>
    <Text style={styles.footerText}>© 2026 Aura Intercept</Text>
  </View>
);

export const IndustryMarketingKitPDF: React.FC = () => (
  <Document>
    {/* Cover Page */}
    <Page size="A4" style={styles.coverPage}>
      <Text style={styles.coverTitle}>Industry{'\n'}Marketing Kits</Text>
      <Text style={styles.coverSubtitle}>
        Targeted Content for 18 Key Industry Verticals
      </Text>
      <View style={styles.coverCategories}>
        <Text style={styles.coverCategory}>⚡ Essential Trades: HVAC • Plumbing • Electrical • Solar Energy</Text>
        <Text style={styles.coverCategory}>🏠 Exterior & Structural: Roofing • Fencing & Decking</Text>
        <Text style={styles.coverCategory}>🌿 Property & Estate: Landscape & Trees • Pool & Spa • Pest Control</Text>
        <Text style={styles.coverCategory}>🛠 Specialized Home: Appliance Repair • Handyman & Cleaning • Construction</Text>
        <Text style={styles.coverCategory}>🚗 Mobile & Commercial: Auto Care • Security Systems • Real Estate</Text>
        <Text style={styles.coverCategory}>💆 Wellness & Personal: Beauty & Wellness • Restaurants • Personal Assistant</Text>
      </View>
      <View style={styles.coverBadge}>
        <Text style={styles.coverBadgeText}>18 Complete Kits</Text>
      </View>
    </Page>

    {/* ==================== ESSENTIAL TRADES ==================== */}

    {/* HVAC Industry Kit - Page 1 */}
    <Page size="A4" style={styles.page}>
      <Header title="HVAC Industry Kit" pageNum={2} />
      
      <View style={[styles.industryBadge, { backgroundColor: colors.hvac }]}>
        <Text style={styles.industryBadgeText}>HVAC / HEATING & COOLING</Text>
      </View>

      <Text style={styles.sectionTitle}>Industry Pain Points</Text>
      <Text style={styles.sectionSubtitle}>What HVAC business owners struggle with most</Text>

      <View style={styles.twoColumn}>
        <View style={styles.column}>
          <View style={[styles.painPointCard, { borderLeftColor: colors.hvac }]}>
            <Text style={styles.painPointTitle}>Seasonal Call Spikes</Text>
            <Text style={styles.painPointText}>First hot day = phone explosion. Can't scale human staff for 2-week surges. Leads go to competitors who answer faster.</Text>
          </View>
          <View style={[styles.painPointCard, { borderLeftColor: colors.hvac }]}>
            <Text style={styles.painPointTitle}>After-Hours Emergencies</Text>
            <Text style={styles.painPointText}>AC dies at midnight in July = urgent call. Miss it, lose the $800+ job AND future business from that homeowner.</Text>
          </View>
          <View style={[styles.painPointCard, { borderLeftColor: colors.hvac }]}>
            <Text style={styles.painPointTitle}>Technician Coordination</Text>
            <Text style={styles.painPointText}>Multiple techs, multiple locations, constantly changing schedules. Manual dispatch = chaos and wasted windshield time.</Text>
          </View>
        </View>
        <View style={styles.column}>
          <View style={styles.solutionCard}>
            <Text style={styles.solutionTitle}>Aura Solution: AI Receptionist</Text>
            <Text style={styles.solutionText}>Handles unlimited simultaneous calls during peak season. Never overwhelmed, never puts anyone on hold.</Text>
          </View>
          <View style={styles.solutionCard}>
            <Text style={styles.solutionTitle}>Aura Solution: 24/7 Coverage</Text>
            <Text style={styles.solutionText}>AI answers at 2 AM, books emergency service, dispatches on-call tech with ETA notification to homeowner.</Text>
          </View>
          <View style={styles.solutionCard}>
            <Text style={styles.solutionTitle}>Aura Solution: Smart Dispatch</Text>
            <Text style={styles.solutionText}>AI assigns jobs based on location, skills, and current workload. Routes optimize in real-time as jobs complete.</Text>
          </View>
        </View>
      </View>

      <Text style={[styles.sectionTitle, { marginTop: 20 }]}>Seasonal Marketing Angles</Text>

      <View style={styles.twoColumn}>
        <View style={styles.column}>
          <View style={styles.seasonCard}>
            <Text style={styles.seasonTitle}>[SUMMER] Summer (Peak)</Text>
            <Text style={styles.seasonText}>"When the heat hits, every call counts. AI answers them all—even when your lines are jammed."</Text>
          </View>
          <View style={styles.seasonCard}>
            <Text style={styles.seasonTitle}>[WINTER] Winter</Text>
            <Text style={styles.seasonText}>"Heating emergencies don't wait for business hours. Neither does your AI receptionist."</Text>
          </View>
        </View>
        <View style={styles.column}>
          <View style={styles.seasonCard}>
            <Text style={styles.seasonTitle}>[FALL] Fall (Maintenance)</Text>
            <Text style={styles.seasonText}>"Turn seasonal checkups into booked revenue. AI follow-up reminds every customer on your list."</Text>
          </View>
          <View style={styles.seasonCard}>
            <Text style={styles.seasonTitle}>[SPRING] Spring</Text>
            <Text style={styles.seasonText}>"AC tune-up season is coming. AI books appointments while you're still finishing heating calls."</Text>
          </View>
        </View>
      </View>

      <Footer />
    </Page>

    {/* HVAC Industry Kit - Page 2 */}
    <Page size="A4" style={styles.page}>
      <Header title="HVAC Social & Video Content" pageNum={3} />

      <View style={[styles.industryBadge, { backgroundColor: colors.hvac }]}>
        <Text style={styles.industryBadgeText}>HVAC CONTENT TEMPLATES</Text>
      </View>

      <Text style={styles.sectionTitle}>Social Post Templates</Text>

      <View style={styles.templateCard}>
        <Text style={styles.templateLabel}>Instagram/Facebook Post</Text>
        <Text style={styles.templateText}>
          [HOT] First 90-degree day of the year.{'\n'}
          Our phones: *exploding*{'\n'}
          Our AI: "I've got this."{'\n\n'}
          While our competitors are sending calls to voicemail, we're booking every single appointment.{'\n\n'}
          That's what happens when you have an AI that never gets overwhelmed.{'\n\n'}
          #HVAClife #SmartBusiness #NeverMissACall
        </Text>
      </View>

      <View style={styles.videoCard}>
        <Text style={styles.videoLabel}>VIDEO SCRIPT (30 seconds)</Text>
        <Text style={styles.videoTitle}>"The Heat Wave Test"</Text>
        <Text style={styles.videoScript}>
          [Scene: Thermometer hitting 95°F]{'\n'}
          "First hot day of summer. Phone's ringing off the hook."{'\n'}
          [Split screen: Stressed receptionist vs. calm AI dashboard]{'\n'}
          "Your competitors are sending calls to voicemail."{'\n'}
          "You're booking every single one."{'\n'}
          [Show booking notifications flowing in]{'\n'}
          "AI doesn't sweat. Neither does your revenue."
        </Text>
      </View>

      <View style={styles.landingCard}>
        <Text style={styles.landingHeadline}>Landing Page Headline: HVAC</Text>
        <Text style={styles.landingSubhead}>
          Never Miss Another Emergency Call—Even During Peak Season{'\n\n'}
          AI-powered reception that scales with demand. Book every AC emergency, furnace breakdown, and maintenance request 24/7.
        </Text>
        <View style={styles.bulletList}>
          <Text style={styles.bulletItem}>• Unlimited simultaneous calls during heat waves</Text>
          <Text style={styles.bulletItem}>• After-hours emergency dispatch</Text>
          <Text style={styles.bulletItem}>• Seasonal maintenance reminders</Text>
          <Text style={styles.bulletItem}>• Route optimization for faster response</Text>
        </View>
      </View>

      <Footer />
    </Page>

    {/* Plumbing Industry Kit */}
    <Page size="A4" style={styles.page}>
      <Header title="Plumbing Industry Kit" pageNum={4} />
      
      <View style={[styles.industryBadge, { backgroundColor: colors.plumbing }]}>
        <Text style={styles.industryBadgeText}>PLUMBING</Text>
      </View>

      <Text style={styles.sectionTitle}>Industry Pain Points</Text>

      <View style={styles.twoColumn}>
        <View style={styles.column}>
          <View style={[styles.painPointCard, { borderLeftColor: colors.plumbing }]}>
            <Text style={styles.painPointTitle}>Emergency Call Chaos</Text>
            <Text style={styles.painPointText}>Burst pipes, flooded basements, backed-up sewage—customers in panic mode need immediate answers, not voicemail.</Text>
          </View>
          <View style={[styles.painPointCard, { borderLeftColor: colors.plumbing }]}>
            <Text style={styles.painPointTitle}>Quote Follow-Through</Text>
            <Text style={styles.painPointText}>Give 10 quotes, close 3. The other 7? No time to follow up. They went with whoever called back first.</Text>
          </View>
          <View style={[styles.painPointCard, { borderLeftColor: colors.plumbing }]}>
            <Text style={styles.painPointTitle}>Trust Factor</Text>
            <Text style={styles.painPointText}>Plumbing has reputation issues. New customers are skeptical. Need reviews and professionalism to stand out.</Text>
          </View>
        </View>
        <View style={styles.column}>
          <View style={styles.solutionCard}>
            <Text style={styles.solutionTitle}>Aura Solution: Instant Triage</Text>
            <Text style={styles.solutionText}>AI assesses urgency, provides calming responses, and dispatches emergency tech immediately. Customer feels handled.</Text>
          </View>
          <View style={styles.solutionCard}>
            <Text style={styles.solutionTitle}>Aura Solution: Auto Follow-up</Text>
            <Text style={styles.solutionText}>Every quote gets systematic follow-up. "Hi [Name], just checking if you had questions about your estimate..."</Text>
          </View>
          <View style={styles.solutionCard}>
            <Text style={styles.solutionTitle}>Aura Solution: Review Engine</Text>
            <Text style={styles.solutionText}>Automatic review requests after every job. Build 5-star reputation that closes skeptical customers.</Text>
          </View>
        </View>
      </View>

      <View style={styles.templateCard}>
        <Text style={styles.templateLabel}>Social Post: Trust Building</Text>
        <Text style={styles.templateText}>
          5-STAR REVIEW:{'\n\n'}
          "They answered at 11 PM when my basement was flooding. Sent someone within the hour. Saved my house."—Sarah M.{'\n\n'}
          When plumbing disasters strike, we're there. 24/7 AI reception means you ALWAYS reach us. No voicemail. No waiting.{'\n\n'}
          #EmergencyPlumber #LocalBusiness #TrustMatters
        </Text>
      </View>

      <View style={styles.videoCard}>
        <Text style={styles.videoLabel}>VIDEO SCRIPT (30 seconds)</Text>
        <Text style={styles.videoTitle}>"The Midnight Flood"</Text>
        <Text style={styles.videoScript}>
          [Scene: Water spraying from pipe at night]{'\n'}
          "It's 2 AM. Your basement is flooding."{'\n'}
          [Phone ringing... going to voicemail]{'\n'}
          "Option A: Voicemail. Wait until morning. Pray."{'\n'}
          [New phone ringing... AI answers immediately]{'\n'}
          "Option B: Someone answers. Help is coming."{'\n'}
          "Which plumber would you call next time?"
        </Text>
      </View>

      <Footer />
    </Page>

    {/* Electrical Industry Kit */}
    <Page size="A4" style={styles.page}>
      <Header title="Electrical Industry Kit" pageNum={5} />
      
      <View style={[styles.industryBadge, { backgroundColor: colors.electrical }]}>
        <Text style={styles.industryBadgeText}>ELECTRICAL</Text>
      </View>

      <Text style={styles.sectionTitle}>Industry Pain Points</Text>

      <View style={styles.twoColumn}>
        <View style={styles.column}>
          <View style={[styles.painPointCard, { borderLeftColor: colors.electrical }]}>
            <Text style={styles.painPointTitle}>Safety-Critical Urgency</Text>
            <Text style={styles.painPointText}>Electrical issues are scary. Sparking outlets, burning smells—customers need reassurance and fast response.</Text>
          </View>
          <View style={[styles.painPointCard, { borderLeftColor: colors.electrical }]}>
            <Text style={styles.painPointTitle}>Complex Quote Process</Text>
            <Text style={styles.painPointText}>Panel upgrades, rewiring, EV chargers—jobs need on-site estimates. Hard to give quick phone quotes.</Text>
          </View>
          <View style={[styles.painPointCard, { borderLeftColor: colors.electrical }]}>
            <Text style={styles.painPointTitle}>Commercial vs Residential</Text>
            <Text style={styles.painPointText}>Two different sales cycles. Commercial needs different follow-up than residential. Hard to manage both.</Text>
          </View>
        </View>
        <View style={styles.column}>
          <View style={styles.solutionCard}>
            <Text style={styles.solutionTitle}>Aura Solution: Safety Protocol</Text>
            <Text style={styles.solutionText}>AI trained on electrical safety. Gives appropriate warnings, schedules urgent inspection, escalates true emergencies.</Text>
          </View>
          <View style={styles.solutionCard}>
            <Text style={styles.solutionTitle}>Aura Solution: Smart Scheduling</Text>
            <Text style={styles.solutionText}>AI books estimate appointments efficiently. Knows which jobs need site visits vs. phone quotes.</Text>
          </View>
          <View style={styles.solutionCard}>
            <Text style={styles.solutionTitle}>Aura Solution: Segmented Follow-up</Text>
            <Text style={styles.solutionText}>Different nurture sequences for commercial prospects vs. residential. Right message, right timing.</Text>
          </View>
        </View>
      </View>

      <View style={styles.templateCard}>
        <Text style={styles.templateLabel}>Social Post: Safety Focus</Text>
        <Text style={styles.templateText}>
          [ELECTRICAL] Electrical problems don't wait for business hours.{'\n\n'}
          Sparking outlet at 10 PM? Burning smell from the panel?{'\n'}
          Our AI answers immediately. Assesses the situation. Dispatches emergency help if needed.{'\n\n'}
          Because electrical safety isn't a 9-5 issue.{'\n\n'}
          #ElectricalSafety #24HourService #LicensedElectrician
        </Text>
      </View>

      <View style={styles.emailCard}>
        <Text style={styles.emailSubject}>Email Template: EV Charger Lead Follow-up</Text>
        <Text style={styles.emailBody}>
          Subject: Your Home EV Charger Estimate{'\n\n'}
          Hi [Name],{'\n\n'}
          Thanks for reaching out about EV charger installation!{'\n\n'}
          Most home installations take 2-4 hours and include:{'\n'}
          • Level 2 charger installation{'\n'}
          • Panel assessment{'\n'}
          • Permit handling{'\n'}
          • 3-year warranty{'\n\n'}
          Would you like to schedule a quick site visit?
        </Text>
      </View>

      <Footer />
    </Page>

    {/* Solar Energy Industry Kit */}
    <Page size="A4" style={styles.page}>
      <Header title="Solar Energy Industry Kit" pageNum={6} />
      
      <View style={[styles.industryBadge, { backgroundColor: colors.solar }]}>
        <Text style={styles.industryBadgeText}>SOLAR ENERGY</Text>
      </View>

      <Text style={styles.sectionTitle}>Industry Pain Points</Text>
      <Text style={styles.sectionSubtitle}>What solar installation companies struggle with most</Text>

      <View style={styles.twoColumn}>
        <View style={styles.column}>
          <View style={[styles.painPointCard, { borderLeftColor: colors.solar }]}>
            <Text style={styles.painPointTitle}>Long Sales Cycles</Text>
            <Text style={styles.painPointText}>Solar is a major investment. Leads need months of nurturing. Manual follow-up falls through the cracks.</Text>
          </View>
          <View style={[styles.painPointCard, { borderLeftColor: colors.solar }]}>
            <Text style={styles.painPointTitle}>Complex Questions</Text>
            <Text style={styles.painPointText}>ROI calculations, tax credits, net metering—prospects have endless questions before committing.</Text>
          </View>
          <View style={[styles.painPointCard, { borderLeftColor: colors.solar }]}>
            <Text style={styles.painPointTitle}>Seasonal Demand</Text>
            <Text style={styles.painPointText}>Spring/summer rush overwhelms staff. Winter slow periods mean wasted capacity and revenue gaps.</Text>
          </View>
        </View>
        <View style={styles.column}>
          <View style={styles.solutionCard}>
            <Text style={styles.solutionTitle}>Aura Solution: Long-Term Nurture</Text>
            <Text style={styles.solutionText}>AI maintains contact over months with educational content, ROI updates, and incentive reminders.</Text>
          </View>
          <View style={styles.solutionCard}>
            <Text style={styles.solutionTitle}>Aura Solution: Knowledge Base</Text>
            <Text style={styles.solutionText}>Train AI on tax credits, rebates, financing options. Answers complex questions accurately 24/7.</Text>
          </View>
          <View style={styles.solutionCard}>
            <Text style={styles.solutionTitle}>Aura Solution: Demand Smoothing</Text>
            <Text style={styles.solutionText}>AI campaigns fill slow periods with maintenance contracts and referral programs.</Text>
          </View>
        </View>
      </View>

      <View style={styles.templateCard}>
        <Text style={styles.templateLabel}>Social Post: ROI Focus</Text>
        <Text style={styles.templateText}>
          [SUN] "How long until solar pays for itself?"{'\n\n'}
          Great question. Our AI can calculate your specific ROI in 30 seconds.{'\n\n'}
          Just text "SOLAR" to [Number] and answer 3 questions:{'\n'}
          • Monthly electric bill{'\n'}
          • Roof direction{'\n'}
          • State/utility{'\n\n'}
          Instant ROI estimate. No salespeople. No pressure.{'\n\n'}
          #SolarEnergy #CleanEnergy #SolarROI
        </Text>
      </View>

      <View style={styles.landingCard}>
        <Text style={styles.landingHeadline}>Landing Page: Solar Energy</Text>
        <Text style={styles.landingSubhead}>
          Turn Sunlight Into Savings—With AI-Powered Sales{'\n\n'}
          Nurture leads for months, answer complex questions instantly, and close more deals.
        </Text>
        <View style={styles.bulletList}>
          <Text style={styles.bulletItem}>• Automated ROI calculators and lead nurturing</Text>
          <Text style={styles.bulletItem}>• Tax credit and rebate information 24/7</Text>
          <Text style={styles.bulletItem}>• Maintenance scheduling and reminders</Text>
          <Text style={styles.bulletItem}>• Referral program management</Text>
        </View>
      </View>

      <Footer />
    </Page>

    {/* ==================== EXTERIOR & STRUCTURAL ==================== */}

    {/* Roofing Industry Kit */}
    <Page size="A4" style={styles.page}>
      <Header title="Roofing Industry Kit" pageNum={7} />
      
      <View style={[styles.industryBadge, { backgroundColor: colors.roofing }]}>
        <Text style={styles.industryBadgeText}>ROOFING</Text>
      </View>

      <Text style={styles.sectionTitle}>Industry Pain Points</Text>
      <Text style={styles.sectionSubtitle}>What roofing contractors struggle with most</Text>

      <View style={styles.twoColumn}>
        <View style={styles.column}>
          <View style={[styles.painPointCard, { borderLeftColor: colors.roofing }]}>
            <Text style={styles.painPointTitle}>Storm Surge Chaos</Text>
            <Text style={styles.painPointText}>One hailstorm = 200 calls in 48 hours. Miss calls during the surge, lose $15,000+ jobs to faster competitors.</Text>
          </View>
          <View style={[styles.painPointCard, { borderLeftColor: colors.roofing }]}>
            <Text style={styles.painPointTitle}>Insurance Coordination</Text>
            <Text style={styles.painPointText}>Homeowners don't understand claims process. Need hand-holding through adjusters, inspections, approvals.</Text>
          </View>
          <View style={[styles.painPointCard, { borderLeftColor: colors.roofing }]}>
            <Text style={styles.painPointTitle}>Weather Dependencies</Text>
            <Text style={styles.painPointText}>Rain delays cascade. Customers frustrated. Rescheduling manually is a nightmare during busy season.</Text>
          </View>
        </View>
        <View style={styles.column}>
          <View style={styles.solutionCard}>
            <Text style={styles.solutionTitle}>Aura Solution: Storm Response</Text>
            <Text style={styles.solutionText}>AI handles unlimited storm calls simultaneously. Books inspections, captures damage details, sends tech immediately.</Text>
          </View>
          <View style={styles.solutionCard}>
            <Text style={styles.solutionTitle}>Aura Solution: Claim Guidance</Text>
            <Text style={styles.solutionText}>AI walks homeowners through insurance process. Automated status updates at each claim stage.</Text>
          </View>
          <View style={styles.solutionCard}>
            <Text style={styles.solutionTitle}>Aura Solution: Weather Alerts</Text>
            <Text style={styles.solutionText}>Automatic rescheduling when weather changes. Customers notified instantly with new timeframes.</Text>
          </View>
        </View>
      </View>

      <View style={styles.templateCard}>
        <Text style={styles.templateLabel}>Social Post: Storm Response</Text>
        <Text style={styles.templateText}>
          [STORM] Hail damage? Here's what to do:{'\n\n'}
          1. Document damage with photos{'\n'}
          2. Don't sign anything yet{'\n'}
          3. Call us for a FREE inspection{'\n\n'}
          We handle insurance companies every day. Our AI books your inspection instantly—even at 2 AM after a storm.{'\n\n'}
          Text "HAIL" to [Number] for immediate response.{'\n\n'}
          #StormDamage #RoofRepair #InsuranceClaims
        </Text>
      </View>

      <View style={styles.landingCard}>
        <Text style={styles.landingHeadline}>Landing Page: Roofing</Text>
        <Text style={styles.landingSubhead}>
          Never Miss a Storm Call Again{'\n\n'}
          AI-powered response that captures every lead during weather events and guides homeowners through insurance.
        </Text>
        <View style={styles.bulletList}>
          <Text style={styles.bulletItem}>• Unlimited simultaneous storm calls</Text>
          <Text style={styles.bulletItem}>• Insurance claim guidance and tracking</Text>
          <Text style={styles.bulletItem}>• Weather-based rescheduling</Text>
          <Text style={styles.bulletItem}>• Emergency tarp dispatch</Text>
        </View>
      </View>

      <Footer />
    </Page>

    {/* Fencing & Decking Industry Kit */}
    <Page size="A4" style={styles.page}>
      <Header title="Fencing & Decking Kit" pageNum={8} />
      
      <View style={[styles.industryBadge, { backgroundColor: colors.fencing }]}>
        <Text style={styles.industryBadgeText}>FENCING & DECKING</Text>
      </View>

      <Text style={styles.sectionTitle}>Industry Pain Points</Text>
      <Text style={styles.sectionSubtitle}>What fence and deck contractors struggle with most</Text>

      <View style={styles.twoColumn}>
        <View style={styles.column}>
          <View style={[styles.painPointCard, { borderLeftColor: colors.fencing }]}>
            <Text style={styles.painPointTitle}>Quote-Heavy Business</Text>
            <Text style={styles.painPointText}>Every job needs on-site measurement. Scheduling quotes is tedious. 50% of quotes never close.</Text>
          </View>
          <View style={[styles.painPointCard, { borderLeftColor: colors.fencing }]}>
            <Text style={styles.painPointTitle}>Seasonal Crush</Text>
            <Text style={styles.painPointText}>Spring = everyone wants a fence before summer. 3-month backlog while still answering new inquiries.</Text>
          </View>
          <View style={[styles.painPointCard, { borderLeftColor: colors.fencing }]}>
            <Text style={styles.painPointTitle}>Material Coordination</Text>
            <Text style={styles.painPointText}>Custom orders, lead times, delivery coordination. One delay pushes entire schedule.</Text>
          </View>
        </View>
        <View style={styles.column}>
          <View style={styles.solutionCard}>
            <Text style={styles.solutionTitle}>Aura Solution: Smart Quote Booking</Text>
            <Text style={styles.solutionText}>AI schedules measurement appointments efficiently. Routes estimators by location to minimize travel.</Text>
          </View>
          <View style={styles.solutionCard}>
            <Text style={styles.solutionTitle}>Aura Solution: Waitlist Management</Text>
            <Text style={styles.solutionText}>AI manages overflow during peak season. Keeps leads warm with progress updates until slot opens.</Text>
          </View>
          <View style={styles.solutionCard}>
            <Text style={styles.solutionTitle}>Aura Solution: Project Tracking</Text>
            <Text style={styles.solutionText}>Automated updates when materials arrive. Customer notified at each milestone.</Text>
          </View>
        </View>
      </View>

      <View style={styles.templateCard}>
        <Text style={styles.templateLabel}>Social Post: Before/After</Text>
        <Text style={styles.templateText}>
          [FENCE] From quote to completion in 10 days.{'\n\n'}
          [Before: old, broken fence]{'\n'}
          [After: beautiful new cedar fence]{'\n\n'}
          Ready to upgrade your backyard? Our AI schedules your free estimate instantly.{'\n\n'}
          Text "FENCE" to [Number] or call anytime—we answer 24/7.{'\n\n'}
          #FenceInstallation #BackyardGoals #HomeImprovement
        </Text>
      </View>

      <View style={styles.landingCard}>
        <Text style={styles.landingHeadline}>Landing Page: Fencing & Decking</Text>
        <Text style={styles.landingSubhead}>
          Book Your Backyard Upgrade Today{'\n\n'}
          AI-powered scheduling that handles the spring rush and keeps every project on track.
        </Text>
        <View style={styles.bulletList}>
          <Text style={styles.bulletItem}>• Instant estimate appointment booking</Text>
          <Text style={styles.bulletItem}>• Material arrival notifications</Text>
          <Text style={styles.bulletItem}>• Project milestone updates</Text>
          <Text style={styles.bulletItem}>• Peak season waitlist management</Text>
        </View>
      </View>

      <Footer />
    </Page>

    {/* ==================== PROPERTY & ESTATE ==================== */}

    {/* Landscape & Trees Industry Kit */}
    <Page size="A4" style={styles.page}>
      <Header title="Landscape & Trees Kit" pageNum={9} />
      
      <View style={[styles.industryBadge, { backgroundColor: colors.landscape }]}>
        <Text style={styles.industryBadgeText}>LANDSCAPE & TREES</Text>
      </View>

      <Text style={styles.sectionTitle}>Industry Pain Points</Text>
      <Text style={styles.sectionSubtitle}>What landscapers and tree services struggle with most</Text>

      <View style={styles.twoColumn}>
        <View style={styles.column}>
          <View style={[styles.painPointCard, { borderLeftColor: colors.landscape }]}>
            <Text style={styles.painPointTitle}>Storm Emergency Calls</Text>
            <Text style={styles.painPointText}>Fallen trees = panic calls at all hours. Tree on house is a $3,000+ emergency job. Miss it, competitor gets it.</Text>
          </View>
          <View style={[styles.painPointCard, { borderLeftColor: colors.landscape }]}>
            <Text style={styles.painPointTitle}>Recurring Service Chaos</Text>
            <Text style={styles.painPointText}>Lawn maintenance = weekly visits for 50+ clients. One reschedule cascades. Manual coordination nightmare.</Text>
          </View>
          <View style={[styles.painPointCard, { borderLeftColor: colors.landscape }]}>
            <Text style={styles.painPointTitle}>Seasonal Timing</Text>
            <Text style={styles.painPointText}>Spring cleanup, fall leaf removal, winter pruning—different services need different outreach timing.</Text>
          </View>
        </View>
        <View style={styles.column}>
          <View style={styles.solutionCard}>
            <Text style={styles.solutionTitle}>Aura Solution: Emergency Dispatch</Text>
            <Text style={styles.solutionText}>AI triages storm calls, prioritizes by urgency, dispatches crews immediately with customer ETA updates.</Text>
          </View>
          <View style={styles.solutionCard}>
            <Text style={styles.solutionTitle}>Aura Solution: Route Optimization</Text>
            <Text style={styles.solutionText}>AI manages recurring routes. Automatically reschedules weather delays and notifies affected customers.</Text>
          </View>
          <View style={styles.solutionCard}>
            <Text style={styles.solutionTitle}>Aura Solution: Seasonal Campaigns</Text>
            <Text style={styles.solutionText}>Automated outreach for each season's services. Right message at right time to entire customer base.</Text>
          </View>
        </View>
      </View>

      <View style={styles.templateCard}>
        <Text style={styles.templateLabel}>Social Post: Storm Response</Text>
        <Text style={styles.templateText}>
          [TREE] Storm damage? We're already on it.{'\n\n'}
          Tree on your roof? Blocking your driveway?{'\n'}
          Our AI answers 24/7 and dispatches crews immediately.{'\n\n'}
          Last night's storm = 47 calls answered, 23 emergency jobs scheduled—all before sunrise.{'\n\n'}
          Call or text anytime. We're here.{'\n\n'}
          #TreeService #StormDamage #EmergencyResponse
        </Text>
      </View>

      <View style={styles.landingCard}>
        <Text style={styles.landingHeadline}>Landing Page: Landscape & Trees</Text>
        <Text style={styles.landingSubhead}>
          Storm Response + Year-Round Service Management{'\n\n'}
          AI-powered scheduling for emergencies and recurring maintenance.
        </Text>
        <View style={styles.bulletList}>
          <Text style={styles.bulletItem}>• 24/7 emergency tree removal dispatch</Text>
          <Text style={styles.bulletItem}>• Recurring lawn care route management</Text>
          <Text style={styles.bulletItem}>• Seasonal service campaigns</Text>
          <Text style={styles.bulletItem}>• Weather-based rescheduling</Text>
        </View>
      </View>

      <Footer />
    </Page>

    {/* Pool & Spa Industry Kit */}
    <Page size="A4" style={styles.page}>
      <Header title="Pool & Spa Kit" pageNum={10} />
      
      <View style={[styles.industryBadge, { backgroundColor: colors.pool }]}>
        <Text style={styles.industryBadgeText}>POOL & SPA</Text>
      </View>

      <Text style={styles.sectionTitle}>Industry Pain Points</Text>
      <Text style={styles.sectionSubtitle}>What pool service companies struggle with most</Text>

      <View style={styles.twoColumn}>
        <View style={styles.column}>
          <View style={[styles.painPointCard, { borderLeftColor: colors.pool }]}>
            <Text style={styles.painPointTitle}>Opening Season Rush</Text>
            <Text style={styles.painPointText}>Everyone wants their pool open the same 3 weeks. Staff overwhelmed. Calls go unanswered. Revenue lost.</Text>
          </View>
          <View style={[styles.painPointCard, { borderLeftColor: colors.pool }]}>
            <Text style={styles.painPointTitle}>Equipment Emergencies</Text>
            <Text style={styles.painPointText}>Pump dies on July 4th weekend = frantic homeowner. Party in 6 hours. Need immediate response.</Text>
          </View>
          <View style={[styles.painPointCard, { borderLeftColor: colors.pool }]}>
            <Text style={styles.painPointTitle}>Recurring Service Coordination</Text>
            <Text style={styles.painPointText}>Weekly chemical service for 100+ pools. Route optimization, access issues, weather delays—constant juggling.</Text>
          </View>
        </View>
        <View style={styles.column}>
          <View style={styles.solutionCard}>
            <Text style={styles.solutionTitle}>Aura Solution: Season Booking</Text>
            <Text style={styles.solutionText}>AI handles spring opening rush. Books appointments efficiently, manages waitlist during peak weeks.</Text>
          </View>
          <View style={styles.solutionCard}>
            <Text style={styles.solutionTitle}>Aura Solution: Emergency Response</Text>
            <Text style={styles.solutionText}>AI triages equipment failures, books emergency visits, and dispatches techs with customer notification.</Text>
          </View>
          <View style={styles.solutionCard}>
            <Text style={styles.solutionTitle}>Aura Solution: Route Management</Text>
            <Text style={styles.solutionText}>Optimized recurring routes. Automatic rescheduling for rain days. Customer notifications included.</Text>
          </View>
        </View>
      </View>

      <View style={styles.templateCard}>
        <Text style={styles.templateLabel}>Social Post: Opening Season</Text>
        <Text style={styles.templateText}>
          [POOL] Pool opening season is HERE.{'\n\n'}
          Don't wait until May 15th when everyone else calls.{'\n'}
          Book now and pick your date.{'\n\n'}
          Our AI schedules 24/7—even at midnight when you suddenly remember "oh, the pool!"{'\n\n'}
          Text "OPEN" to [Number]{'\n\n'}
          #PoolSeason #PoolService #SummerReady
        </Text>
      </View>

      <View style={styles.landingCard}>
        <Text style={styles.landingHeadline}>Landing Page: Pool & Spa</Text>
        <Text style={styles.landingSubhead}>
          Crystal Clear Service, Year-Round{'\n\n'}
          AI-powered scheduling for openings, closings, maintenance, and equipment emergencies.
        </Text>
        <View style={styles.bulletList}>
          <Text style={styles.bulletItem}>• Spring opening and fall closing booking</Text>
          <Text style={styles.bulletItem}>• Weekly service route optimization</Text>
          <Text style={styles.bulletItem}>• Equipment emergency dispatch</Text>
          <Text style={styles.bulletItem}>• Chemistry issue triage</Text>
        </View>
      </View>

      <Footer />
    </Page>

    {/* Pest Control Industry Kit */}
    <Page size="A4" style={styles.page}>
      <Header title="Pest Control Kit" pageNum={11} />
      
      <View style={[styles.industryBadge, { backgroundColor: colors.pest }]}>
        <Text style={styles.industryBadgeText}>PEST CONTROL</Text>
      </View>

      <Text style={styles.sectionTitle}>Industry Pain Points</Text>
      <Text style={styles.sectionSubtitle}>What pest control companies struggle with most</Text>

      <View style={styles.twoColumn}>
        <View style={styles.column}>
          <View style={[styles.painPointCard, { borderLeftColor: colors.pest }]}>
            <Text style={styles.painPointTitle}>Panic Calls</Text>
            <Text style={styles.painPointText}>Bed bugs, roaches, rats—customers in emotional distress need calm, immediate response. Voicemail = lost job.</Text>
          </View>
          <View style={[styles.painPointCard, { borderLeftColor: colors.pest }]}>
            <Text style={styles.painPointTitle}>Recurring Revenue</Text>
            <Text style={styles.painPointText}>Quarterly treatments = stable income. But customers forget to rebook. Manual reminders are tedious.</Text>
          </View>
          <View style={[styles.painPointCard, { borderLeftColor: colors.pest }]}>
            <Text style={styles.painPointTitle}>Commercial Accounts</Text>
            <Text style={styles.painPointText}>Restaurants, hotels need proof of service for health inspections. Documentation requirements are heavy.</Text>
          </View>
        </View>
        <View style={styles.column}>
          <View style={styles.solutionCard}>
            <Text style={styles.solutionTitle}>Aura Solution: Calm Response</Text>
            <Text style={styles.solutionText}>AI provides reassuring responses, gathers pest details, and schedules urgent inspection immediately.</Text>
          </View>
          <View style={styles.solutionCard}>
            <Text style={styles.solutionTitle}>Aura Solution: Auto-Rebooking</Text>
            <Text style={styles.solutionText}>Automated reminders for quarterly treatments. Easy one-click rebooking via text. Zero manual effort.</Text>
          </View>
          <View style={styles.solutionCard}>
            <Text style={styles.solutionTitle}>Aura Solution: Service Reports</Text>
            <Text style={styles.solutionText}>Automatic documentation after every visit. Commercial clients get inspection-ready reports.</Text>
          </View>
        </View>
      </View>

      <View style={styles.templateCard}>
        <Text style={styles.templateLabel}>Social Post: Seasonal Prevention</Text>
        <Text style={styles.templateText}>
          [BUG] Spring = bugs are waking up.{'\n\n'}
          Ants in the kitchen? Spiders in the garage?{'\n'}
          Don't wait until you have an infestation.{'\n\n'}
          Text "BUGS" for a free prevention assessment.{'\n'}
          Our AI responds instantly—even at 11 PM when you see that spider.{'\n\n'}
          #PestControl #SpringCleaning #BugFree
        </Text>
      </View>

      <View style={styles.landingCard}>
        <Text style={styles.landingHeadline}>Landing Page: Pest Control</Text>
        <Text style={styles.landingSubhead}>
          Fast Response, Lasting Protection{'\n\n'}
          AI-powered scheduling that handles emergency calls and maintains recurring treatment programs.
        </Text>
        <View style={styles.bulletList}>
          <Text style={styles.bulletItem}>• Calm, immediate emergency response</Text>
          <Text style={styles.bulletItem}>• Quarterly treatment auto-rebooking</Text>
          <Text style={styles.bulletItem}>• Commercial service documentation</Text>
          <Text style={styles.bulletItem}>• Seasonal prevention campaigns</Text>
        </View>
      </View>

      <Footer />
    </Page>

    {/* ==================== SPECIALIZED HOME ==================== */}

    {/* Appliance Repair Industry Kit */}
    <Page size="A4" style={styles.page}>
      <Header title="Appliance Repair Kit" pageNum={12} />
      
      <View style={[styles.industryBadge, { backgroundColor: colors.appliance }]}>
        <Text style={styles.industryBadgeText}>APPLIANCE REPAIR</Text>
      </View>

      <Text style={styles.sectionTitle}>Industry Pain Points</Text>
      <Text style={styles.sectionSubtitle}>What appliance repair technicians struggle with most</Text>

      <View style={styles.twoColumn}>
        <View style={styles.column}>
          <View style={[styles.painPointCard, { borderLeftColor: colors.appliance }]}>
            <Text style={styles.painPointTitle}>Diagnostic Challenges</Text>
            <Text style={styles.painPointText}>Customer says "it's broken." Need to know brand, model, symptoms to bring right parts. Phone tag wastes time.</Text>
          </View>
          <View style={[styles.painPointCard, { borderLeftColor: colors.appliance }]}>
            <Text style={styles.painPointTitle}>Part Availability</Text>
            <Text style={styles.painPointText}>Nothing worse than diagnosing, then saying "I need to order the part." Customer frustrated. Second trip required.</Text>
          </View>
          <View style={[styles.painPointCard, { borderLeftColor: colors.appliance }]}>
            <Text style={styles.painPointTitle}>Weekend Warriors</Text>
            <Text style={styles.painPointText}>Refrigerator dies Friday night. Wedding Saturday. Customer desperate. Premium pricing available if you answer.</Text>
          </View>
        </View>
        <View style={styles.column}>
          <View style={styles.solutionCard}>
            <Text style={styles.solutionTitle}>Aura Solution: Smart Intake</Text>
            <Text style={styles.solutionText}>AI asks right questions: brand, model, symptoms, age. Tech arrives prepared with likely parts.</Text>
          </View>
          <View style={styles.solutionCard}>
            <Text style={styles.solutionTitle}>Aura Solution: Parts Prep</Text>
            <Text style={styles.solutionText}>Common part inventory tracked. AI knows what's in the van. Can promise same-day fix for common issues.</Text>
          </View>
          <View style={styles.solutionCard}>
            <Text style={styles.solutionTitle}>Aura Solution: Weekend Premium</Text>
            <Text style={styles.solutionText}>AI quotes weekend rates automatically. Books emergency visits. Captures high-value jobs others miss.</Text>
          </View>
        </View>
      </View>

      <View style={styles.templateCard}>
        <Text style={styles.templateLabel}>Social Post: Same-Day Service</Text>
        <Text style={styles.templateText}>
          [FRIDGE] Refrigerator making weird noises?{'\n\n'}
          Text us the brand and model number.{'\n'}
          Our AI will tell you if we can fix it TODAY.{'\n\n'}
          Most common repairs = same-day. Parts in the van.{'\n'}
          No waiting for parts. No second visit.{'\n\n'}
          Text "FIX" + your appliance type to [Number]{'\n\n'}
          #ApplianceRepair #SameDayService #FixItFast
        </Text>
      </View>

      <View style={styles.landingCard}>
        <Text style={styles.landingHeadline}>Landing Page: Appliance Repair</Text>
        <Text style={styles.landingSubhead}>
          Same-Day Fixes, Smart Diagnostics{'\n\n'}
          AI-powered intake that gets the right info so we show up prepared.
        </Text>
        <View style={styles.bulletList}>
          <Text style={styles.bulletItem}>• Smart diagnostic questions before arrival</Text>
          <Text style={styles.bulletItem}>• Same-day service for common repairs</Text>
          <Text style={styles.bulletItem}>• Weekend and evening availability</Text>
          <Text style={styles.bulletItem}>• All major brands and appliances</Text>
        </View>
      </View>

      <Footer />
    </Page>

    {/* Handyman & Cleaning Industry Kit */}
    <Page size="A4" style={styles.page}>
      <Header title="Handyman & Cleaning Kit" pageNum={13} />
      
      <View style={[styles.industryBadge, { backgroundColor: colors.handyman }]}>
        <Text style={styles.industryBadgeText}>HANDYMAN & CLEANING</Text>
      </View>

      <Text style={styles.sectionTitle}>Industry Pain Points</Text>
      <Text style={styles.sectionSubtitle}>What handymen and cleaning services struggle with most</Text>

      <View style={styles.twoColumn}>
        <View style={styles.column}>
          <View style={[styles.painPointCard, { borderLeftColor: colors.handyman }]}>
            <Text style={styles.painPointTitle}>Scope Creep</Text>
            <Text style={styles.painPointText}>"While you're here..." turns a 1-hour job into 4 hours. Hard to quote accurately. Profitability suffers.</Text>
          </View>
          <View style={[styles.painPointCard, { borderLeftColor: colors.handyman }]}>
            <Text style={styles.painPointTitle}>Recurring Booking</Text>
            <Text style={styles.painPointText}>Cleaning clients need regular service. Manual rebooking = missed appointments. Revenue gaps.</Text>
          </View>
          <View style={[styles.painPointCard, { borderLeftColor: colors.handyman }]}>
            <Text style={styles.painPointTitle}>Trust & Access</Text>
            <Text style={styles.painPointText}>Clients give you keys. Need reliable communication. Late without notice = lost client forever.</Text>
          </View>
        </View>
        <View style={styles.column}>
          <View style={styles.solutionCard}>
            <Text style={styles.solutionTitle}>Aura Solution: Clear Quoting</Text>
            <Text style={styles.solutionText}>AI gathers detailed task list upfront. Sets expectations before arrival. Reduces surprise add-ons.</Text>
          </View>
          <View style={styles.solutionCard}>
            <Text style={styles.solutionTitle}>Aura Solution: Auto-Schedule</Text>
            <Text style={styles.solutionText}>Recurring appointments booked automatically. Reminders sent. Clients confirm or reschedule via text.</Text>
          </View>
          <View style={styles.solutionCard}>
            <Text style={styles.solutionTitle}>Aura Solution: ETA Updates</Text>
            <Text style={styles.solutionText}>Real-time arrival notifications. Running late? Customer knows automatically. Trust maintained.</Text>
          </View>
        </View>
      </View>

      <View style={styles.templateCard}>
        <Text style={styles.templateLabel}>Social Post: Honey-Do List</Text>
        <Text style={styles.templateText}>
          [TOOLS] Got a honey-do list a mile long?{'\n\n'}
          Text us everything. We'll quote it all.{'\n'}
          • Leaky faucet{'\n'}
          • Squeaky door{'\n'}
          • Picture hanging{'\n'}
          • Whatever's been bugging you{'\n\n'}
          One visit. Everything fixed.{'\n\n'}
          Text "FIX" to [Number] with your list.{'\n\n'}
          #Handyman #HomeRepair #HoneyDoList
        </Text>
      </View>

      <View style={styles.landingCard}>
        <Text style={styles.landingHeadline}>Landing Page: Handyman & Cleaning</Text>
        <Text style={styles.landingSubhead}>
          Reliable Service, Clear Communication{'\n\n'}
          AI-powered booking with automatic reminders and real-time updates.
        </Text>
        <View style={styles.bulletList}>
          <Text style={styles.bulletItem}>• Detailed task intake for accurate quotes</Text>
          <Text style={styles.bulletItem}>• Recurring service auto-scheduling</Text>
          <Text style={styles.bulletItem}>• Real-time arrival notifications</Text>
          <Text style={styles.bulletItem}>• Easy rebooking via text</Text>
        </View>
      </View>

      <Footer />
    </Page>

    {/* Construction Industry Kit */}
    <Page size="A4" style={styles.page}>
      <Header title="Construction Kit" pageNum={14} />
      
      <View style={[styles.industryBadge, { backgroundColor: colors.construction }]}>
        <Text style={styles.industryBadgeText}>CONSTRUCTION (PAINTING, FLOORING, TILE)</Text>
      </View>

      <Text style={styles.sectionTitle}>Industry Pain Points</Text>
      <Text style={styles.sectionSubtitle}>What construction contractors struggle with most</Text>

      <View style={styles.twoColumn}>
        <View style={styles.column}>
          <View style={[styles.painPointCard, { borderLeftColor: colors.construction }]}>
            <Text style={styles.painPointTitle}>Multi-Trade Coordination</Text>
            <Text style={styles.painPointText}>Flooring can't go in until painting's done. Tile waits for plumbing. One delay = domino effect.</Text>
          </View>
          <View style={[styles.painPointCard, { borderLeftColor: colors.construction }]}>
            <Text style={styles.painPointTitle}>Client Communication</Text>
            <Text style={styles.painPointText}>"When will you be done?" "What color did I pick?" Constant questions while trying to work.</Text>
          </View>
          <View style={[styles.painPointCard, { borderLeftColor: colors.construction }]}>
            <Text style={styles.painPointTitle}>Quote Follow-Through</Text>
            <Text style={styles.painPointText}>Big projects = long decision cycles. Leads go cold without consistent follow-up.</Text>
          </View>
        </View>
        <View style={styles.column}>
          <View style={styles.solutionCard}>
            <Text style={styles.solutionTitle}>Aura Solution: Project Timeline</Text>
            <Text style={styles.solutionText}>AI manages dependencies. Notifies next trade when ready. Customers see progress without asking.</Text>
          </View>
          <View style={styles.solutionCard}>
            <Text style={styles.solutionTitle}>Aura Solution: Client Portal</Text>
            <Text style={styles.solutionText}>Selections, schedule, progress photos—all in one place. Questions answered automatically.</Text>
          </View>
          <View style={styles.solutionCard}>
            <Text style={styles.solutionTitle}>Aura Solution: Lead Nurture</Text>
            <Text style={styles.solutionText}>AI maintains contact during decision period. Design tips, project examples, gentle follow-ups.</Text>
          </View>
        </View>
      </View>

      <View style={styles.templateCard}>
        <Text style={styles.templateLabel}>Social Post: Before/After</Text>
        <Text style={styles.templateText}>
          [PAINT] Same room. Completely different vibe.{'\n\n'}
          [Before: dated beige walls]{'\n'}
          [After: modern slate gray accent wall]{'\n\n'}
          Ready to transform your space?{'\n'}
          Our AI schedules your free color consultation instantly.{'\n\n'}
          Text "COLOR" to [Number]{'\n\n'}
          #HomeRenovation #PaintingPros #BeforeAndAfter
        </Text>
      </View>

      <View style={styles.landingCard}>
        <Text style={styles.landingHeadline}>Landing Page: Construction</Text>
        <Text style={styles.landingSubhead}>
          From Quote to Completion, Seamlessly{'\n\n'}
          AI-powered project coordination for painting, flooring, tile, and trim work.
        </Text>
        <View style={styles.bulletList}>
          <Text style={styles.bulletItem}>• Multi-trade scheduling coordination</Text>
          <Text style={styles.bulletItem}>• Client portal with progress updates</Text>
          <Text style={styles.bulletItem}>• Selection tracking and reminders</Text>
          <Text style={styles.bulletItem}>• Lead nurturing for larger projects</Text>
        </View>
      </View>

      <Footer />
    </Page>

    {/* ==================== MOBILE & COMMERCIAL ==================== */}

    {/* Auto Care Industry Kit */}
    <Page size="A4" style={styles.page}>
      <Header title="Auto Care Kit" pageNum={15} />
      
      <View style={[styles.industryBadge, { backgroundColor: colors.auto }]}>
        <Text style={styles.industryBadgeText}>AUTO CARE (DETAILING & REPAIR)</Text>
      </View>

      <Text style={styles.sectionTitle}>Industry Pain Points</Text>
      <Text style={styles.sectionSubtitle}>What auto service businesses struggle with most</Text>

      <View style={styles.twoColumn}>
        <View style={styles.column}>
          <View style={[styles.painPointCard, { borderLeftColor: colors.auto }]}>
            <Text style={styles.painPointTitle}>Mobile Logistics</Text>
            <Text style={styles.painPointText}>Detailing at customer locations = route complexity. Travel time eats into profitable hours.</Text>
          </View>
          <View style={[styles.painPointCard, { borderLeftColor: colors.auto }]}>
            <Text style={styles.painPointTitle}>No-Show Losses</Text>
            <Text style={styles.painPointText}>Drive 30 minutes to location. Customer forgot. Wasted trip. Lost revenue. No way to fill slot.</Text>
          </View>
          <View style={[styles.painPointCard, { borderLeftColor: colors.auto }]}>
            <Text style={styles.painPointTitle}>Upsell Opportunities</Text>
            <Text style={styles.painPointText}>Customer gets basic wash. Doesn't know you offer ceramic coating. Leaving money on the table.</Text>
          </View>
        </View>
        <View style={styles.column}>
          <View style={styles.solutionCard}>
            <Text style={styles.solutionTitle}>Aura Solution: Route Optimization</Text>
            <Text style={styles.solutionText}>AI clusters appointments by location. Minimizes drive time. Maximizes billable hours.</Text>
          </View>
          <View style={styles.solutionCard}>
            <Text style={styles.solutionTitle}>Aura Solution: Reminder System</Text>
            <Text style={styles.solutionText}>Automated confirmations 24h and 2h before. Customers reschedule easily. No-shows plummet.</Text>
          </View>
          <View style={styles.solutionCard}>
            <Text style={styles.solutionTitle}>Aura Solution: Service Education</Text>
            <Text style={styles.solutionText}>AI shares service options during booking. "Would you like to add interior detail?" Upsells naturally.</Text>
          </View>
        </View>
      </View>

      <View style={styles.templateCard}>
        <Text style={styles.templateLabel}>Social Post: Convenience</Text>
        <Text style={styles.templateText}>
          [CAR] We come to you.{'\n\n'}
          While you're at work, at home, wherever—we detail your car.{'\n\n'}
          Book in 30 seconds:{'\n'}
          Text "DETAIL" + your address to [Number]{'\n\n'}
          AI schedules instantly. Pick your time. We show up.{'\n'}
          Come out to a showroom-clean car.{'\n\n'}
          #MobileDetailing #AutoCare #Convenience
        </Text>
      </View>

      <View style={styles.landingCard}>
        <Text style={styles.landingHeadline}>Landing Page: Auto Care</Text>
        <Text style={styles.landingSubhead}>
          Mobile Service, Maximum Convenience{'\n\n'}
          AI-powered scheduling that optimizes routes and eliminates no-shows.
        </Text>
        <View style={styles.bulletList}>
          <Text style={styles.bulletItem}>• Location-based route optimization</Text>
          <Text style={styles.bulletItem}>• Automated confirmations and reminders</Text>
          <Text style={styles.bulletItem}>• Service upsell suggestions</Text>
          <Text style={styles.bulletItem}>• Fleet account management</Text>
        </View>
      </View>

      <Footer />
    </Page>

    {/* Security Systems Industry Kit */}
    <Page size="A4" style={styles.page}>
      <Header title="Security Systems Kit" pageNum={16} />
      
      <View style={[styles.industryBadge, { backgroundColor: colors.security }]}>
        <Text style={styles.industryBadgeText}>SECURITY SYSTEMS (CAMERAS & ALARMS)</Text>
      </View>

      <Text style={styles.sectionTitle}>Industry Pain Points</Text>
      <Text style={styles.sectionSubtitle}>What security installers struggle with most</Text>

      <View style={styles.twoColumn}>
        <View style={styles.column}>
          <View style={[styles.painPointCard, { borderLeftColor: colors.security }]}>
            <Text style={styles.painPointTitle}>Fear-Based Sales</Text>
            <Text style={styles.painPointText}>Break-in happens = neighbor wants security NOW. Speed matters. First to respond wins the job.</Text>
          </View>
          <View style={[styles.painPointCard, { borderLeftColor: colors.security }]}>
            <Text style={styles.painPointTitle}>Technical Questions</Text>
            <Text style={styles.painPointText}>DIY vs pro install? Wired vs wireless? Cloud vs local? Prospects need education before committing.</Text>
          </View>
          <View style={[styles.painPointCard, { borderLeftColor: colors.security }]}>
            <Text style={styles.painPointTitle}>Monitoring Revenue</Text>
            <Text style={styles.painPointText}>Install is one-time. Monitoring is recurring. Hard to convert customers to monthly plans.</Text>
          </View>
        </View>
        <View style={styles.column}>
          <View style={styles.solutionCard}>
            <Text style={styles.solutionTitle}>Aura Solution: Instant Response</Text>
            <Text style={styles.solutionText}>AI answers concerned homeowners 24/7. Books consultations immediately while urgency is high.</Text>
          </View>
          <View style={styles.solutionCard}>
            <Text style={styles.solutionTitle}>Aura Solution: Knowledge Base</Text>
            <Text style={styles.solutionText}>Train AI on your products and options. Answers technical questions accurately. Builds confidence.</Text>
          </View>
          <View style={styles.solutionCard}>
            <Text style={styles.solutionTitle}>Aura Solution: Monitoring Pitch</Text>
            <Text style={styles.solutionText}>AI educates on monitoring benefits during booking. Converts more installs to recurring revenue.</Text>
          </View>
        </View>
      </View>

      <View style={styles.templateCard}>
        <Text style={styles.templateLabel}>Social Post: Neighborhood Alert</Text>
        <Text style={styles.templateText}>
          [ALERT] Break-in reported on [Neighborhood] last night.{'\n\n'}
          Don't wait until it happens to you.{'\n\n'}
          Free security assessment:{'\n'}
          • Camera placement recommendations{'\n'}
          • Entry point vulnerabilities{'\n'}
          • Monitoring options{'\n\n'}
          Text "SECURE" to [Number] or call 24/7.{'\n\n'}
          #HomeSecurity #ProtectYourFamily #SecurityCamera
        </Text>
      </View>

      <View style={styles.landingCard}>
        <Text style={styles.landingHeadline}>Landing Page: Security Systems</Text>
        <Text style={styles.landingSubhead}>
          Peace of Mind, Installed by Pros{'\n\n'}
          AI-powered consultations that answer questions and book installations fast.
        </Text>
        <View style={styles.bulletList}>
          <Text style={styles.bulletItem}>• 24/7 response to security concerns</Text>
          <Text style={styles.bulletItem}>• Technical Q&A about camera systems</Text>
          <Text style={styles.bulletItem}>• Free security assessment booking</Text>
          <Text style={styles.bulletItem}>• Monitoring plan education</Text>
        </View>
      </View>

      <Footer />
    </Page>

    {/* Real Estate Industry Kit */}
    <Page size="A4" style={styles.page}>
      <Header title="Real Estate Kit" pageNum={17} />
      
      <View style={[styles.industryBadge, { backgroundColor: colors.realestate }]}>
        <Text style={styles.industryBadgeText}>REAL ESTATE</Text>
      </View>

      <Text style={styles.sectionTitle}>Industry Pain Points</Text>
      <Text style={styles.sectionSubtitle}>What real estate professionals struggle with most</Text>

      <View style={styles.twoColumn}>
        <View style={styles.column}>
          <View style={[styles.painPointCard, { borderLeftColor: colors.realestate }]}>
            <Text style={styles.painPointTitle}>Lead Response Time</Text>
            <Text style={styles.painPointText}>Zillow lead comes in at 9 PM. Call back tomorrow = lead already talked to 3 other agents.</Text>
          </View>
          <View style={[styles.painPointCard, { borderLeftColor: colors.realestate }]}>
            <Text style={styles.painPointTitle}>Showing Coordination</Text>
            <Text style={styles.painPointText}>Multiple buyers, multiple properties, overlapping schedules. Manual coordination is chaos.</Text>
          </View>
          <View style={[styles.painPointCard, { borderLeftColor: colors.realestate }]}>
            <Text style={styles.painPointTitle}>Long-Term Nurture</Text>
            <Text style={styles.painPointText}>Most leads aren't ready to buy for 6-12 months. Staying top-of-mind without being annoying is hard.</Text>
          </View>
        </View>
        <View style={styles.column}>
          <View style={styles.solutionCard}>
            <Text style={styles.solutionTitle}>Aura Solution: Instant Response</Text>
            <Text style={styles.solutionText}>AI responds to new leads within seconds. Qualifies interest, books consultation, captures while hot.</Text>
          </View>
          <View style={styles.solutionCard}>
            <Text style={styles.solutionTitle}>Aura Solution: Showing Scheduler</Text>
            <Text style={styles.solutionText}>AI coordinates showings across multiple properties. Optimizes routes. Sends confirmations automatically.</Text>
          </View>
          <View style={styles.solutionCard}>
            <Text style={styles.solutionTitle}>Aura Solution: Drip Campaigns</Text>
            <Text style={styles.solutionText}>Automated market updates, new listings, and check-ins. Stay present without manual effort.</Text>
          </View>
        </View>
      </View>

      <View style={styles.templateCard}>
        <Text style={styles.templateLabel}>Social Post: Market Update</Text>
        <Text style={styles.templateText}>
          [HOME] [City] Market Update:{'\n\n'}
          • Median price: [X]% vs last year{'\n'}
          • Days on market: [X] days{'\n'}
          • Best time to list: NOW{'\n\n'}
          Thinking about buying or selling?{'\n'}
          Text "MARKET" for a personalized analysis.{'\n\n'}
          Our AI responds instantly—even at midnight.{'\n\n'}
          #RealEstate #MarketUpdate #HomeValue
        </Text>
      </View>

      <View style={styles.landingCard}>
        <Text style={styles.landingHeadline}>Landing Page: Real Estate</Text>
        <Text style={styles.landingSubhead}>
          Never Miss Another Lead, Never Lose Another Sale{'\n\n'}
          AI-powered response that captures leads instantly and nurtures until they're ready.
        </Text>
        <View style={styles.bulletList}>
          <Text style={styles.bulletItem}>• Instant lead response 24/7</Text>
          <Text style={styles.bulletItem}>• Multi-property showing coordination</Text>
          <Text style={styles.bulletItem}>• Long-term drip campaign automation</Text>
          <Text style={styles.bulletItem}>• Market update distribution</Text>
        </View>
      </View>

      <Footer />
    </Page>

    {/* ==================== WELLNESS & PERSONAL ==================== */}

    {/* Beauty & Wellness Industry Kit - Page 1 */}
    <Page size="A4" style={styles.page}>
      <Header title="Beauty & Wellness Kit" pageNum={18} />
      
      <View style={[styles.industryBadge, { backgroundColor: colors.beauty }]}>
        <Text style={styles.industryBadgeText}>BEAUTY & WELLNESS (AURA HALO)</Text>
      </View>

      <Text style={styles.sectionTitle}>Industry Pain Points</Text>
      <Text style={styles.sectionSubtitle}>What salon and spa owners struggle with most</Text>

      <View style={styles.twoColumn}>
        <View style={styles.column}>
          <View style={[styles.painPointCard, { borderLeftColor: colors.beauty }]}>
            <Text style={styles.painPointTitle}>No-Shows & Late Cancellations</Text>
            <Text style={styles.painPointText}>Empty chairs cost $75-$200 per hour. Last-minute cancellations leave no time to fill slots. Revenue evaporates.</Text>
          </View>
          <View style={[styles.painPointCard, { borderLeftColor: colors.beauty }]}>
            <Text style={styles.painPointTitle}>Double-Booking Chaos</Text>
            <Text style={styles.painPointText}>Peak hours mean overlapping appointments. Staff stressed, clients waiting, and reviews suffering.</Text>
          </View>
          <View style={[styles.painPointCard, { borderLeftColor: colors.beauty }]}>
            <Text style={styles.painPointTitle}>After-Hours Requests</Text>
            <Text style={styles.painPointText}>Clients want to book at 10 PM or during your busiest hours. Missed calls = lost appointments to competitors.</Text>
          </View>
        </View>
        <View style={styles.column}>
          <View style={styles.solutionCard}>
            <Text style={styles.solutionTitle}>Aura Solution: Smart Reminders</Text>
            <Text style={styles.solutionText}>Automated SMS/email reminders 24h and 2h before. Reduce no-shows by 40% with zero effort.</Text>
          </View>
          <View style={styles.solutionCard}>
            <Text style={styles.solutionTitle}>Aura Solution: AI Scheduling</Text>
            <Text style={styles.solutionText}>AI manages your calendar perfectly. No overlaps, optimal spacing, and automatic waitlist management.</Text>
          </View>
          <View style={styles.solutionCard}>
            <Text style={styles.solutionTitle}>Aura Solution: 24/7 Booking</Text>
            <Text style={styles.solutionText}>AI Receptionist books appointments round the clock. Clients book when convenient, you fill every slot.</Text>
          </View>
        </View>
      </View>

      <View style={styles.templateCard}>
        <Text style={styles.templateLabel}>Social Post: Self-Care Hook</Text>
        <Text style={styles.templateText}>
          Your next glam appointment is one text away. [sparkle]{'\n\n'}
          We answer at 11 PM because self-care doesn't wait.{'\n\n'}
          While other salons are sending you to voicemail, we're confirming your booking.{'\n\n'}
          Try it: Text "BOOK" to [Number]{'\n\n'}
          #SalonLife #BeautyAppointment #SelfCareSunday #HairGoals
        </Text>
      </View>

      <Footer />
    </Page>

    {/* Beauty & Wellness - Page 2 */}
    <Page size="A4" style={styles.page}>
      <Header title="Beauty & Wellness Content" pageNum={19} />

      <View style={[styles.industryBadge, { backgroundColor: colors.beauty }]}>
        <Text style={styles.industryBadgeText}>BEAUTY CONTENT TEMPLATES</Text>
      </View>

      <View style={styles.templateCard}>
        <Text style={styles.templateLabel}>Instagram Post - Review Focus</Text>
        <Text style={styles.templateText}>
          [5-STAR] "I booked my appointment at midnight and got a confirmation in seconds. No waiting, no phone tag. Just glam."—Sarah M.{'\n\n'}
          That's the Aura difference. 24/7 booking that works while you sleep.{'\n\n'}
          Ready to level up your salon experience?{'\n\n'}
          #SalonReviews #HappyClients #BeautyTech
        </Text>
      </View>

      <View style={styles.videoCard}>
        <Text style={styles.videoLabel}>VIDEO SCRIPT (30 seconds)</Text>
        <Text style={styles.videoTitle}>"The Last-Minute Booking"</Text>
        <Text style={styles.videoScript}>
          [Scene: Client looking at phone at 9:45 PM]{'\n'}
          "Ugh, I need my nails done for tomorrow's event."{'\n'}
          [Shows texting salon]{'\n'}
          [Instant response from AI: "I have 10 AM available!"]{'\n'}
          "Wait, they actually answered?"{'\n'}
          [Show confirmation]{'\n'}
          "AI doesn't sleep. Neither does your booking calendar."
        </Text>
      </View>

      <View style={styles.landingCard}>
        <Text style={styles.landingHeadline}>Landing Page: Beauty & Wellness</Text>
        <Text style={styles.landingSubhead}>
          Fill Every Chair. Miss No Appointment.{'\n\n'}
          AI-powered booking and reminders designed for salons, spas, and wellness businesses.
        </Text>
        <View style={styles.bulletList}>
          <Text style={styles.bulletItem}>• 24/7 appointment booking via text or call</Text>
          <Text style={styles.bulletItem}>• Automated reminders reduce no-shows 40%</Text>
          <Text style={styles.bulletItem}>• Review collection after every service</Text>
          <Text style={styles.bulletItem}>• Client rebooking campaigns</Text>
        </View>
      </View>

      <Footer />
    </Page>

    {/* Food Service Industry Kit */}
    <Page size="A4" style={styles.page}>
      <Header title="Food Service Kit" pageNum={20} />
      
      <View style={[styles.industryBadge, { backgroundColor: colors.food }]}>
        <Text style={styles.industryBadgeText}>FOOD SERVICE (AURA EXPRESS)</Text>
      </View>

      <Text style={styles.sectionTitle}>Industry Pain Points</Text>
      <Text style={styles.sectionSubtitle}>What restaurant and cafe owners struggle with most</Text>

      <View style={styles.twoColumn}>
        <View style={styles.column}>
          <View style={[styles.painPointCard, { borderLeftColor: colors.food }]}>
            <Text style={styles.painPointTitle}>Missed Reservation Calls</Text>
            <Text style={styles.painPointText}>Rush hour = phones ringing constantly. Staff can't cook AND answer. Empty tables while calls go to voicemail.</Text>
          </View>
          <View style={[styles.painPointCard, { borderLeftColor: colors.food }]}>
            <Text style={styles.painPointTitle}>Menu Questions Overload</Text>
            <Text style={styles.painPointText}>"Do you have gluten-free?" "What's in the special?" Same questions 50 times a day, clogging your phone lines.</Text>
          </View>
          <View style={[styles.painPointCard, { borderLeftColor: colors.food }]}>
            <Text style={styles.painPointTitle}>Online Ordering Confusion</Text>
            <Text style={styles.painPointText}>Customers can't find your ordering link. Staff texts it manually. Orders get lost. Revenue walks out the door.</Text>
          </View>
        </View>
        <View style={styles.column}>
          <View style={styles.solutionCard}>
            <Text style={styles.solutionTitle}>Aura Solution: AI Voice</Text>
            <Text style={styles.solutionText}>AI handles peak call volume instantly. Books reservations, answers questions, never puts anyone on hold.</Text>
          </View>
          <View style={styles.solutionCard}>
            <Text style={styles.solutionTitle}>Aura Solution: Knowledge Base</Text>
            <Text style={styles.solutionText}>Train AI on your menu, hours, specials. Answers every FAQ accurately and instantly—24/7.</Text>
          </View>
          <View style={styles.solutionCard}>
            <Text style={styles.solutionTitle}>Aura Solution: Smart Links</Text>
            <Text style={styles.solutionText}>AI automatically shares your menu, ordering links, and reservation page. One text, instant access.</Text>
          </View>
        </View>
      </View>

      <View style={styles.templateCard}>
        <Text style={styles.templateLabel}>Social Post: AI Menu Expert</Text>
        <Text style={styles.templateText}>
          Ask us anything—our AI knows the menu better than the chef. [wink]{'\n\n'}
          "What's gluten-free?" Answered.{'\n'}
          "What time do you close?" Answered.{'\n'}
          "Can I order ahead?" Link sent.{'\n\n'}
          Text or call anytime. We're always here.{'\n\n'}
          #RestaurantLife #FoodService #SmartDining
        </Text>
      </View>

      <View style={styles.landingCard}>
        <Text style={styles.landingHeadline}>Landing Page: Food Service</Text>
        <Text style={styles.landingSubhead}>
          Never Miss a Reservation Again{'\n\n'}
          AI-powered phone answering designed specifically for restaurants, cafes, and food service.
        </Text>
        <View style={styles.bulletList}>
          <Text style={styles.bulletItem}>• Instant reservation booking</Text>
          <Text style={styles.bulletItem}>• Menu and hours FAQ answered 24/7</Text>
          <Text style={styles.bulletItem}>• Smart link sharing for online ordering</Text>
          <Text style={styles.bulletItem}>• Peak hour call handling</Text>
        </View>
      </View>

      <Footer />
    </Page>

    {/* Personal Services Industry Kit */}
    <Page size="A4" style={styles.page}>
      <Header title="Personal Services Kit" pageNum={21} />
      
      <View style={[styles.industryBadge, { backgroundColor: colors.personal }]}>
        <Text style={styles.industryBadgeText}>PERSONAL SERVICES (AURA FLOW)</Text>
      </View>

      <Text style={styles.sectionTitle}>Industry Pain Points</Text>
      <Text style={styles.sectionSubtitle}>What personal service providers struggle with most</Text>

      <View style={styles.twoColumn}>
        <View style={styles.column}>
          <View style={[styles.painPointCard, { borderLeftColor: colors.personal }]}>
            <Text style={styles.painPointTitle}>Calendar Chaos</Text>
            <Text style={styles.painPointText}>Multiple clients, multiple calendars. Double-bookings happen. Appointments fall through the cracks.</Text>
          </View>
          <View style={[styles.painPointCard, { borderLeftColor: colors.personal }]}>
            <Text style={styles.painPointTitle}>Booking Friction</Text>
            <Text style={styles.painPointText}>Back-and-forth texts to find a time. 5 messages to book 1 appointment. Prospects give up.</Text>
          </View>
          <View style={[styles.painPointCard, { borderLeftColor: colors.personal }]}>
            <Text style={styles.painPointTitle}>No-Show Losses</Text>
            <Text style={styles.painPointText}>Your time is your inventory. One no-show = lost hour you can't recover.</Text>
          </View>
        </View>
        <View style={styles.column}>
          <View style={styles.solutionCard}>
            <Text style={styles.solutionTitle}>Aura Solution: Calendar Sync</Text>
            <Text style={styles.solutionText}>AI integrates with your calendar. Shows real availability. No conflicts, no manual updates.</Text>
          </View>
          <View style={styles.solutionCard}>
            <Text style={styles.solutionTitle}>Aura Solution: One-Text Booking</Text>
            <Text style={styles.solutionText}>Client texts "book." AI shows times. Client picks. Done. One interaction, appointment confirmed.</Text>
          </View>
          <View style={styles.solutionCard}>
            <Text style={styles.solutionTitle}>Aura Solution: Smart Reminders</Text>
            <Text style={styles.solutionText}>Automated confirmations and reminders. Easy reschedule via text. No-shows reduced dramatically.</Text>
          </View>
        </View>
      </View>

      <View style={styles.templateCard}>
        <Text style={styles.templateLabel}>Social Post: Effortless Booking</Text>
        <Text style={styles.templateText}>
          [CALENDAR] Booking an appointment shouldn't take 10 texts.{'\n\n'}
          With our AI:{'\n'}
          1. You text "book"{'\n'}
          2. AI shows available times{'\n'}
          3. You pick one{'\n'}
          4. Done.{'\n\n'}
          No phone tag. No waiting. No back-and-forth.{'\n\n'}
          Try it: Text "BOOK" to [Number]{'\n\n'}
          #PersonalAssistant #EasyBooking #TimeManagement
        </Text>
      </View>

      <View style={styles.landingCard}>
        <Text style={styles.landingHeadline}>Landing Page: Personal Services</Text>
        <Text style={styles.landingSubhead}>
          Your AI Scheduling Assistant{'\n\n'}
          Effortless booking that syncs with your calendar and eliminates no-shows.
        </Text>
        <View style={styles.bulletList}>
          <Text style={styles.bulletItem}>• Real-time calendar integration</Text>
          <Text style={styles.bulletItem}>• One-text appointment booking</Text>
          <Text style={styles.bulletItem}>• Automated reminders and confirmations</Text>
          <Text style={styles.bulletItem}>• Easy client rescheduling</Text>
        </View>
      </View>

      <Footer />
    </Page>
  </Document>
);

export default IndustryMarketingKitPDF;
