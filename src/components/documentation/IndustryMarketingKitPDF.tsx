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
  hvac: '#ef4444',
  plumbing: '#3b82f6',
  electrical: '#f59e0b',
  general: '#10b981',
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
        Targeted Content for 7 Key Verticals{'\n'}
        HVAC • Plumbing • Electrical • General Contracting{'\n'}
        Beauty/Wellness • Food Service • Personal Services
      </Text>
      <View style={styles.coverBadge}>
        <Text style={styles.coverBadgeText}>7 Complete Kits</Text>
      </View>
    </Page>

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

      <View style={styles.templateCard}>
        <Text style={styles.templateLabel}>LinkedIn Thought Leadership</Text>
        <Text style={styles.templateText}>
          HVAC owners: How many calls did you miss during last summer's first heat wave?{'\n\n'}
          Industry data shows the average HVAC company misses 40% of calls during peak season.{'\n'}
          At $500-$800 per missed emergency call, that's $50,000+ in lost revenue—annually.{'\n\n'}
          AI doesn't get overwhelmed. It scales instantly.{'\n'}
          Every call answered. Every lead captured. Even when your human staff is maxed out.{'\n\n'}
          The HVAC companies adopting AI now will own their markets in 3 years.
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
          <Text style={styles.bulletItem}>- Unlimited simultaneous calls during heat waves</Text>
          <Text style={styles.bulletItem}>- After-hours emergency dispatch</Text>
          <Text style={styles.bulletItem}>- Seasonal maintenance reminders</Text>
          <Text style={styles.bulletItem}>- Route optimization for faster response</Text>
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
          That's why we have 200+ 5-star reviews.{'\n\n'}
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
          [Plumber arriving, relieved homeowner]{'\n'}
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
          Call or text anytime. We're always here.{'\n\n'}
          #ElectricalSafety #24HourService #LicensedElectrician
        </Text>
      </View>

      <View style={styles.emailCard}>
        <Text style={styles.emailSubject}>Email Template: EV Charger Lead Follow-up</Text>
        <Text style={styles.emailBody}>
          Subject: Your Home EV Charger Estimate{'\n\n'}
          Hi [Name],{'\n\n'}
          Thanks for reaching out about EV charger installation! Just wanted to follow up on your inquiry.{'\n\n'}
          Most home installations take 2-4 hours and include:{'\n'}
          - Level 2 charger installation{'\n'}
          - Panel assessment{'\n'}
          - Permit handling{'\n'}
          - 3-year warranty{'\n\n'}
          Would you like to schedule a quick site visit for an exact quote? I have availability [Day/Time].{'\n\n'}
          Best,{'\n'}
          [Business Name]
        </Text>
      </View>

      <Footer />
    </Page>

    {/* General Contractor Kit */}
    <Page size="A4" style={styles.page}>
      <Header title="General Contractor Kit" pageNum={6} />
      
      <View style={[styles.industryBadge, { backgroundColor: colors.general }]}>
        <Text style={styles.industryBadgeText}>GENERAL CONTRACTING</Text>
      </View>

      <Text style={styles.sectionTitle}>Industry Pain Points</Text>

      <View style={styles.twoColumn}>
        <View style={styles.column}>
          <View style={[styles.painPointCard, { borderLeftColor: colors.general }]}>
            <Text style={styles.painPointTitle}>Multi-Trade Coordination</Text>
            <Text style={styles.painPointText}>Juggling subs, inspections, material deliveries. One delay cascades. Need real-time visibility across everything.</Text>
          </View>
          <View style={[styles.painPointCard, { borderLeftColor: colors.general }]}>
            <Text style={styles.painPointTitle}>Project Communication</Text>
            <Text style={styles.painPointText}>Clients want updates constantly. "When will tile arrive?" "Is the inspector coming?" Drowning in questions.</Text>
          </View>
          <View style={[styles.painPointCard, { borderLeftColor: colors.general }]}>
            <Text style={styles.painPointTitle}>Quote-to-Close Cycle</Text>
            <Text style={styles.painPointText}>Big projects = long sales cycles. Leads go cold if not nurtured properly over weeks/months.</Text>
          </View>
        </View>
        <View style={styles.column}>
          <View style={styles.solutionCard}>
            <Text style={styles.solutionTitle}>Aura Solution: Project Hub</Text>
            <Text style={styles.solutionText}>All trades, all schedules, all updates in one place. AI tracks milestones and flags delays before they cascade.</Text>
          </View>
          <View style={styles.solutionCard}>
            <Text style={styles.solutionTitle}>Aura Solution: Client Portal</Text>
            <Text style={styles.solutionText}>Automated status updates. Clients check progress anytime. Fewer phone calls, happier customers.</Text>
          </View>
          <View style={styles.solutionCard}>
            <Text style={styles.solutionTitle}>Aura Solution: Long-Term Nurture</Text>
            <Text style={styles.solutionText}>AI maintains contact over months. Check-ins, project tips, seasonal reminders. Leads stay warm until ready.</Text>
          </View>
        </View>
      </View>

      <View style={styles.templateCard}>
        <Text style={styles.templateLabel}>Social Post: Project Showcase</Text>
        <Text style={styles.templateText}>
          [PROJECT] 12 weeks. 8 trades. 1 seamless renovation.{'\n\n'}
          Our secret? AI-powered coordination.{'\n\n'}
          While other contractors are juggling phone calls and spreadsheets, we're running projects with military precision:{'\n\n'}
          - Real-time scheduling across all trades{'\n'}
          - Automatic client updates{'\n'}
          - Zero communication gaps{'\n\n'}
          The result? On-time, on-budget, happy clients.{'\n\n'}
          #GeneralContractor #HomeRenovation #SmartBuilding
        </Text>
      </View>

      <View style={styles.landingCard}>
        <Text style={styles.landingHeadline}>Landing Page: General Contractors</Text>
        <Text style={styles.landingSubhead}>
          Coordinate Complex Projects Without the Chaos{'\n\n'}
          AI-powered project management that keeps subs on schedule, clients informed, and your sanity intact.
        </Text>
        <View style={styles.bulletList}>
          <Text style={styles.bulletItem}>- Multi-trade scheduling coordination</Text>
          <Text style={styles.bulletItem}>- Automated client status updates</Text>
          <Text style={styles.bulletItem}>- Sub-contractor communication hub</Text>
          <Text style={styles.bulletItem}>- Long-term lead nurturing for big projects</Text>
        </View>
      </View>

      <Footer />
    </Page>

    {/* Beauty & Wellness Industry Kit - Page 1 */}
    <Page size="A4" style={styles.page}>
      <Header title="Beauty & Wellness Kit" pageNum={7} />
      
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
      <Header title="Beauty & Wellness Content" pageNum={8} />

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
          <Text style={styles.bulletItem}>- 24/7 appointment booking via text or call</Text>
          <Text style={styles.bulletItem}>- Automated reminders reduce no-shows 40%</Text>
          <Text style={styles.bulletItem}>- Review collection after every service</Text>
          <Text style={styles.bulletItem}>- Client rebooking campaigns</Text>
        </View>
      </View>

      <Footer />
    </Page>

    {/* Food Service Industry Kit */}
    <Page size="A4" style={styles.page}>
      <Header title="Food Service Kit" pageNum={9} />
      
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
          <Text style={styles.bulletItem}>- Instant reservation booking</Text>
          <Text style={styles.bulletItem}>- Menu and hours FAQ answered 24/7</Text>
          <Text style={styles.bulletItem}>- Smart link sharing for online ordering</Text>
          <Text style={styles.bulletItem}>- Peak hour call handling</Text>
        </View>
      </View>

      <Footer />
    </Page>

    {/* Personal Services Industry Kit */}
    <Page size="A4" style={styles.page}>
      <Header title="Personal Services Kit" pageNum={10} />
      
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
            <Text style={styles.painPointTitle}>Missed Appointment Requests</Text>
            <Text style={styles.painPointText}>You're with a client when another one calls. By the time you call back, they've booked someone else.</Text>
          </View>
          <View style={[styles.painPointCard, { borderLeftColor: colors.personal }]}>
            <Text style={styles.painPointTitle}>Manual Follow-Up Burnout</Text>
            <Text style={styles.painPointText}>Chasing clients for rebooking. Sending reminders manually. Administrative work eating your billable hours.</Text>
          </View>
        </View>
        <View style={styles.column}>
          <View style={styles.solutionCard}>
            <Text style={styles.solutionTitle}>Aura Solution: Direct Calendar Sync</Text>
            <Text style={styles.solutionText}>AI syncs directly with your calendar. Real-time availability, no conflicts, perfect scheduling.</Text>
          </View>
          <View style={styles.solutionCard}>
            <Text style={styles.solutionTitle}>Aura Solution: 24/7 Scheduling</Text>
            <Text style={styles.solutionText}>AI Receptionist and Scheduling Agent book appointments while you're busy or sleeping. Never miss a lead.</Text>
          </View>
          <View style={styles.solutionCard}>
            <Text style={styles.solutionTitle}>Aura Solution: Automated Follow-ups</Text>
            <Text style={styles.solutionText}>Intelligent rebooking reminders. Automated SMS/email sequences. Clients stay engaged without your effort.</Text>
          </View>
        </View>
      </View>

      <View style={styles.templateCard}>
        <Text style={styles.templateLabel}>Social Post: Time Saver</Text>
        <Text style={styles.templateText}>
          Your time is precious. Aura manages the calendar so you don't have to.{'\n\n'}
          24/7 booking. Zero missed appointments. Pure flow.{'\n\n'}
          While you're focused on clients, AI is:{'\n'}
          - Booking new appointments{'\n'}
          - Sending reminders{'\n'}
          - Following up on no-shows{'\n'}
          - Managing your schedule{'\n\n'}
          #PersonalAssistant #TimeManagement #ProductivityHacks
        </Text>
      </View>

      <View style={styles.landingCard}>
        <Text style={styles.landingHeadline}>Landing Page: Personal Services</Text>
        <Text style={styles.landingSubhead}>
          Your AI-Powered Scheduling Assistant{'\n\n'}
          Direct calendar sync and 24/7 booking for personal service providers.
        </Text>
        <View style={styles.bulletList}>
          <Text style={styles.bulletItem}>- Real-time calendar synchronization</Text>
          <Text style={styles.bulletItem}>- 24/7 scheduling via voice and chat</Text>
          <Text style={styles.bulletItem}>- Automated SMS/Email reminders</Text>
          <Text style={styles.bulletItem}>- Intelligent rebooking suggestions</Text>
        </View>
      </View>

      <Footer />
    </Page>

    {/* Email Campaign Templates */}
    <Page size="A4" style={styles.page}>
      <Header title="Email Campaign Templates" pageNum={7} />
      
      <Text style={styles.sectionTitle}>Industry Email Sequences</Text>
      <Text style={styles.sectionSubtitle}>Pre-written email flows for each vertical</Text>

      <View style={styles.emailCard}>
        <Text style={styles.emailSubject}>HVAC: Seasonal Maintenance Reminder</Text>
        <Text style={styles.emailBody}>
          Subject: Is Your AC Ready for Summer? [First Name]?{'\n\n'}
          Hi [Name],{'\n\n'}
          Spring is here, which means summer heat isn't far behind.{'\n\n'}
          Last year, we saw a 300% spike in emergency AC calls during the first heat wave. Don't be one of those calls.{'\n\n'}
          Schedule your pre-season tune-up now:{'\n'}
          {'>'} Avoid emergency rates{'\n'}
          {'>'} Extend system life{'\n'}
          {'>'} Lock in priority scheduling{'\n\n'}
          [Book Now Button]{'\n\n'}
          Stay cool,{'\n'}
          [Business Name]
        </Text>
      </View>

      <View style={styles.emailCard}>
        <Text style={styles.emailSubject}>Plumbing: Quote Follow-Up (Day 3)</Text>
        <Text style={styles.emailBody}>
          Subject: Quick question about your plumbing estimate{'\n\n'}
          Hi [Name],{'\n\n'}
          Just wanted to check in on the estimate we provided for [Service Type].{'\n\n'}
          I know comparing quotes can be overwhelming. Happy to answer any questions or walk through the details.{'\n\n'}
          One thing worth knowing: We're booking [X] weeks out right now. If you want work done before [upcoming date/event], scheduling soon would guarantee your spot.{'\n\n'}
          Any questions? Just reply to this email.{'\n\n'}
          [Business Name]
        </Text>
      </View>

      <View style={styles.emailCard}>
        <Text style={styles.emailSubject}>Electrical: Commercial Project Nurture</Text>
        <Text style={styles.emailBody}>
          Subject: Electrical planning for your [Building Type]?{'\n\n'}
          Hi [Name],{'\n\n'}
          Following up on our conversation about [Project]. Commercial electrical projects have a lot of moving parts—want to make sure you have everything you need.{'\n\n'}
          Quick resources that might help:{'\n'}
          - Our commercial project checklist (attached){'\n'}
          - Permit timeline for [City]{'\n'}
          - Financing options for larger jobs{'\n\n'}
          When you're ready to move forward, we can start with a site assessment. Takes about an hour and gives you a complete scope and timeline.{'\n\n'}
          Let me know what works.{'\n\n'}
          [Business Name]
        </Text>
      </View>

      <View style={styles.emailCard}>
        <Text style={styles.emailSubject}>General Contractor: Project Completion Follow-Up</Text>
        <Text style={styles.emailBody}>
          Subject: How's everything holding up, [Name]?{'\n\n'}
          Hi [Name],{'\n\n'}
          It's been 30 days since we completed your [Project Type]. Wanted to check in and make sure everything is working perfectly.{'\n\n'}
          Any questions about:{'\n'}
          - Warranty coverage?{'\n'}
          - Maintenance tips?{'\n'}
          - Future project ideas?{'\n\n'}
          Also, if you're happy with the work, we'd love a quick Google review. It helps other homeowners find reliable contractors:{'\n'}
          [Review Link]{'\n\n'}
          Thanks for choosing us!{'\n'}
          [Business Name]
        </Text>
      </View>

      <Footer />
    </Page>

    {/* Competitor Positioning by Industry */}
    <Page size="A4" style={styles.page}>
      <Header title="Competitor Positioning" pageNum={8} />
      
      <Text style={styles.sectionTitle}>Industry-Specific Differentiators</Text>
      <Text style={styles.sectionSubtitle}>How to position against competitors in each vertical</Text>

      <View style={styles.templateCard}>
        <Text style={[styles.templateLabel, { color: colors.hvac }]}>HVAC: vs. Traditional Answering Services</Text>
        <Text style={styles.templateText}>
          "Traditional answering services take messages. We book appointments.{'\n\n'}
          When a customer calls at 9 PM with a broken AC, they don't want to leave a message and hope someone calls back. They want the problem solved.{'\n\n'}
          Our AI books the emergency service call, dispatches your on-call tech, and sends the customer an ETA—all before a human answering service would finish taking the message."
        </Text>
      </View>

      <View style={styles.templateCard}>
        <Text style={[styles.templateLabel, { color: colors.plumbing }]}>PLUMBING: vs. Cheap Online Leads</Text>
        <Text style={styles.templateText}>
          "Buying leads from HomeAdvisor means competing with 5 other plumbers for the same customer.{'\n\n'}
          What if you captured every lead yourself—directly from your own phone line?{'\n\n'}
          Aura ensures every call to YOUR number becomes YOUR booking. No competing. No lead fees. Just direct customer relationships."
        </Text>
      </View>

      <View style={styles.templateCard}>
        <Text style={[styles.templateLabel, { color: colors.electrical }]}>ELECTRICAL: vs. DIY Scheduling Tools</Text>
        <Text style={styles.templateText}>
          "Calendly is fine for simple appointments. But electrical jobs aren't simple.{'\n\n'}
          You need to know: Is this residential or commercial? Panel upgrade or outlet repair? Urgent or routine?{'\n\n'}
          Our AI asks the right questions, routes to the right technician, and schedules with the right time allocation. No more showing up to a 'quick repair' that's actually a full rewire."
        </Text>
      </View>

      <View style={styles.templateCard}>
        <Text style={[styles.templateLabel, { color: colors.general }]}>GC: vs. Project Management Software</Text>
        <Text style={styles.templateText}>
          "Buildertrend is great—if you have time to update it.{'\n\n'}
          Reality: You're on the job site, not at a computer. Subs don't log in. Clients forget their passwords.{'\n\n'}
          Aura works through the phone. Subs text updates. Clients get automatic notifications. Everything syncs without anyone logging into anything. Project management that actually gets used."
        </Text>
      </View>

      <Footer />
    </Page>
  </Document>
);

export default IndustryMarketingKitPDF;
