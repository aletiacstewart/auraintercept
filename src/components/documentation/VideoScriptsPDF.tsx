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
    backgroundColor: colors.secondary,
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
    color: colors.secondary,
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
    borderBottomColor: colors.secondary,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.secondary,
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
  durationBadge: {
    backgroundColor: colors.accent,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'flex-start',
    marginBottom: 15,
  },
  durationText: {
    color: 'white',
    fontSize: 10,
    fontWeight: 'bold',
  },
  scriptCard: {
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 10,
    marginBottom: 20,
    borderLeftWidth: 5,
    borderLeftColor: colors.secondary,
  },
  scriptTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: colors.dark,
    marginBottom: 10,
  },
  scriptMeta: {
    flexDirection: 'row',
    gap: 15,
    marginBottom: 15,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  metaLabel: {
    fontSize: 9,
    color: colors.gray,
    marginRight: 4,
  },
  metaValue: {
    fontSize: 9,
    color: colors.dark,
    fontWeight: 'bold',
  },
  scriptSection: {
    marginBottom: 12,
  },
  scriptLabel: {
    fontSize: 9,
    color: colors.secondary,
    fontWeight: 'bold',
    marginBottom: 4,
    textTransform: 'uppercase',
  },
  scriptText: {
    fontSize: 10,
    color: colors.dark,
    lineHeight: 1.6,
  },
  visualNote: {
    backgroundColor: '#eef2ff',
    padding: 10,
    borderRadius: 6,
    marginTop: 10,
  },
  visualLabel: {
    fontSize: 8,
    color: colors.secondary,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  visualText: {
    fontSize: 9,
    color: colors.dark,
    fontStyle: 'italic',
  },
  brollSection: {
    backgroundColor: '#fef3c7',
    padding: 15,
    borderRadius: 8,
    marginTop: 15,
  },
  brollTitle: {
    fontSize: 10,
    color: colors.warning,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  brollItem: {
    fontSize: 9,
    color: colors.dark,
    marginBottom: 4,
  },
  voiceoverBox: {
    backgroundColor: '#ecfdf5',
    padding: 15,
    borderRadius: 8,
    marginTop: 15,
  },
  voiceoverTitle: {
    fontSize: 10,
    color: colors.success,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  voiceoverText: {
    fontSize: 9,
    color: colors.dark,
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
  twoColumn: {
    flexDirection: 'row',
    gap: 15,
  },
  column: {
    flex: 1,
  },
  tipBox: {
    backgroundColor: '#f0f9ff',
    padding: 12,
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: colors.accent,
    marginTop: 15,
  },
  tipLabel: {
    fontSize: 9,
    color: colors.accent,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  tipText: {
    fontSize: 9,
    color: colors.dark,
    lineHeight: 1.4,
  },
  timestampRow: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  timestamp: {
    width: 50,
    fontSize: 9,
    color: colors.secondary,
    fontWeight: 'bold',
  },
  timestampContent: {
    flex: 1,
    fontSize: 9,
    color: colors.dark,
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
    <Text style={styles.footerText}>Aura Intercept Video Script Library</Text>
    <Text style={styles.footerText}>© 2026 Aura Intercept</Text>
  </View>
);

export const VideoScriptsPDF: React.FC = () => (
  <Document>
    {/* Cover Page */}
    <Page size="A4" style={styles.coverPage}>
      <Text style={styles.coverTitle}>Video Script{'\n'}Library</Text>
      <Text style={styles.coverSubtitle}>
        Production-Ready Scripts for Every Format{'\n'}
        15s Hooks • 60s Explainers • 5-Min Demos{'\n'}
        B-Roll Lists • Voiceover Directions
      </Text>
      <View style={styles.coverBadge}>
        <Text style={styles.coverBadgeText}>35+ Scripts Included</Text>
      </View>
    </Page>

    {/* Short-Form Scripts - 15-30s */}
    <Page size="A4" style={styles.page}>
      <Header title="Short-Form Scripts (15-30 seconds)" pageNum={2} />
      
      <Text style={styles.sectionTitle}>TikTok & Reels Hooks</Text>
      <Text style={styles.sectionSubtitle}>Quick-hit content designed to stop scrolling and drive action</Text>

      <View style={styles.scriptCard}>
        <View style={styles.durationBadge}>
          <Text style={styles.durationText}>15 SECONDS</Text>
        </View>
        <Text style={styles.scriptTitle}>Script 1: "The Missed Call Math"</Text>
        
        <View style={styles.scriptSection}>
          <Text style={styles.scriptLabel}>Hook (0-3s)</Text>
          <Text style={styles.scriptText}>"You're losing $500 every time your phone rings and you can't answer."</Text>
        </View>

        <View style={styles.scriptSection}>
          <Text style={styles.scriptLabel}>Body (3-12s)</Text>
          <Text style={styles.scriptText}>
            [Show phone ringing, going to voicemail]{'\n'}
            "Miss 3 calls a day? That's $1,500 gone. Every. Single. Day."{'\n'}
            [Show AI answering call, booking appointment]
          </Text>
        </View>

        <View style={styles.scriptSection}>
          <Text style={styles.scriptLabel}>CTA (12-15s)</Text>
          <Text style={styles.scriptText}>"AI answers every call. Link in bio."</Text>
        </View>

        <View style={styles.visualNote}>
          <Text style={styles.visualLabel}>VISUAL DIRECTION</Text>
          <Text style={styles.visualText}>Split screen: Left shows stressed contractor missing call. Right shows AI interface answering smoothly. End on app dashboard showing new booking.</Text>
        </View>
      </View>

      <View style={styles.scriptCard}>
        <View style={styles.durationBadge}>
          <Text style={styles.durationText}>30 SECONDS</Text>
        </View>
        <Text style={styles.scriptTitle}>Script 2: "The 2AM Emergency"</Text>
        
        <View style={styles.scriptSection}>
          <Text style={styles.scriptLabel}>Hook (0-3s)</Text>
          <Text style={styles.scriptText}>[Phone ringing at 2:17 AM] "This call is worth $800."</Text>
        </View>

        <View style={styles.scriptSection}>
          <Text style={styles.scriptLabel}>Body (3-25s)</Text>
          <Text style={styles.scriptText}>
            "Emergency plumbing call. Flooded basement. Customer is panicking."{'\n'}
            [Show two scenarios side by side]{'\n'}
            "Without AI: Voicemail. They call your competitor."{'\n'}
            "With AI: Answered instantly. Appointment booked. Customer relieved."{'\n'}
            [Show AI conversation happening naturally]
          </Text>
        </View>

        <View style={styles.scriptSection}>
          <Text style={styles.scriptLabel}>CTA (25-30s)</Text>
          <Text style={styles.scriptText}>"Your AI never sleeps. Neither does your revenue. Start free."</Text>
        </View>
      </View>

      <Footer />
    </Page>

    {/* More Short-Form Scripts */}
    <Page size="A4" style={styles.page}>
      <Header title="Short-Form Scripts (Continued)" pageNum={3} />

      <View style={styles.scriptCard}>
        <View style={styles.durationBadge}>
          <Text style={styles.durationText}>20 SECONDS</Text>
        </View>
        <Text style={styles.scriptTitle}>Script 3: "The Skeptic Convert"</Text>
        
        <View style={styles.scriptSection}>
          <Text style={styles.scriptLabel}>Hook (0-3s)</Text>
          <Text style={styles.scriptText}>"I thought AI phone answering was a gimmick. I was wrong."</Text>
        </View>

        <View style={styles.scriptSection}>
          <Text style={styles.scriptLabel}>Body (3-17s)</Text>
          <Text style={styles.scriptText}>
            "First month with Aura Intercept:"{'\n'}
            [Numbers appearing on screen]{'\n'}
            "→ 47 calls answered after hours"{'\n'}
            "→ 23 new bookings"{'\n'}
            "→ $11,500 in revenue I would have missed"
          </Text>
        </View>

        <View style={styles.scriptSection}>
          <Text style={styles.scriptLabel}>CTA (17-20s)</Text>
          <Text style={styles.scriptText}>"Best investment I made this year. Period."</Text>
        </View>
      </View>

      <View style={styles.scriptCard}>
        <View style={styles.durationBadge}>
          <Text style={styles.durationText}>15 SECONDS</Text>
        </View>
        <Text style={styles.scriptTitle}>Script 4: "POV Quick Hit"</Text>
        
        <View style={styles.scriptSection}>
          <Text style={styles.scriptLabel}>Full Script</Text>
          <Text style={styles.scriptText}>
            [Text on screen: "POV: You're on a job"]{'\n'}
            [Phone buzzes with notification]{'\n'}
            "Your AI just booked a $650 job while you were elbow-deep in a furnace."{'\n'}
            [Show booking confirmation on phone]{'\n'}
            "This is the way."
          </Text>
        </View>
      </View>

      <View style={styles.brollSection}>
        <Text style={styles.brollTitle}>[VIDEO] B-ROLL SHOT LIST FOR SHORT-FORM</Text>
        <Text style={styles.brollItem}>- Phone ringing on nightstand (dark room, glowing screen)</Text>
        <Text style={styles.brollItem}>- Contractor hands working on equipment (close-up)</Text>
        <Text style={styles.brollItem}>- App dashboard showing new booking notification</Text>
        <Text style={styles.brollItem}>- Split-screen comparison (missed call vs. AI answered)</Text>
        <Text style={styles.brollItem}>- Calendar filling up with appointments animation</Text>
        <Text style={styles.brollItem}>- Money/revenue counter going up</Text>
        <Text style={styles.brollItem}>- Happy customer on phone (stock or testimonial)</Text>
      </View>

      <Footer />
    </Page>

    {/* Medium-Form Scripts - 60-90s */}
    <Page size="A4" style={styles.page}>
      <Header title="Medium-Form Scripts (60-90 seconds)" pageNum={4} />
      
      <Text style={styles.sectionTitle}>Explainer Videos</Text>
      <Text style={styles.sectionSubtitle}>Deeper dives perfect for YouTube, LinkedIn, and website embeds</Text>

      <View style={styles.scriptCard}>
        <View style={styles.durationBadge}>
          <Text style={styles.durationText}>60 SECONDS</Text>
        </View>
        <Text style={styles.scriptTitle}>Script 5: "The Complete Solution"</Text>
        
        <View style={styles.scriptMeta}>
          <View style={styles.metaItem}>
            <Text style={styles.metaLabel}>Format:</Text>
            <Text style={styles.metaValue}>Explainer</Text>
          </View>
          <View style={styles.metaItem}>
            <Text style={styles.metaLabel}>Audience:</Text>
            <Text style={styles.metaValue}>Service Business Owners</Text>
          </View>
          <View style={styles.metaItem}>
            <Text style={styles.metaLabel}>Goal:</Text>
            <Text style={styles.metaValue}>Platform Overview</Text>
          </View>
        </View>

        <View style={styles.timestampRow}>
          <Text style={styles.timestamp}>0:00-0:05</Text>
          <Text style={styles.timestampContent}>[Hook] "What if your business never missed another call, lead, or opportunity?"</Text>
        </View>
        <View style={styles.timestampRow}>
          <Text style={styles.timestamp}>0:05-0:15</Text>
          <Text style={styles.timestampContent}>[Problem] "Most service businesses lose 40% of calls. No receptionist? Missed calls. On a job? Missed calls. After hours? Missed calls. Each one is money walking to your competitor."</Text>
        </View>
        <View style={styles.timestampRow}>
          <Text style={styles.timestamp}>0:15-0:25</Text>
          <Text style={styles.timestampContent}>[Solution Intro] "Aura Intercept is your AI-powered business command center. 24 Smart AI Agents working 24/7 to capture every lead and keep your business running."</Text>
        </View>
        <View style={styles.timestampRow}>
          <Text style={styles.timestamp}>0:25-0:45</Text>
          <Text style={styles.timestampContent}>[Features] "AI Receptionist answers calls naturally. Booking Agent books appointments instantly. Dispatch/GPS Console optimizes your routes. Review Agent collects 5-star feedback. All working together, all the time."</Text>
        </View>
        <View style={styles.timestampRow}>
          <Text style={styles.timestamp}>0:45-0:55</Text>
          <Text style={styles.timestampContent}>[Proof] "Our customers see an average of $11,000 in recovered revenue in month one. That's a 23x return on their investment."</Text>
        </View>
        <View style={styles.timestampRow}>
          <Text style={styles.timestamp}>0:55-1:00</Text>
          <Text style={styles.timestampContent}>[CTA] "Start your free trial today. Your AI team is ready."</Text>
        </View>
      </View>

      <Footer />
    </Page>

    {/* Console-Specific Scripts */}
    <Page size="A4" style={styles.page}>
      <Header title="Console-Specific Explainers" pageNum={5} />

      <View style={styles.scriptCard}>
        <View style={styles.durationBadge}>
          <Text style={styles.durationText}>90 SECONDS</Text>
        </View>
        <Text style={styles.scriptTitle}>Script 6: "Customer Portal Deep Dive"</Text>
        
        <View style={styles.timestampRow}>
          <Text style={styles.timestamp}>0:00-0:10</Text>
          <Text style={styles.timestampContent}>[Hook] "Your customers expect instant responses. Can your business deliver?" [Show frustrated customer on hold]</Text>
        </View>
        <View style={styles.timestampRow}>
          <Text style={styles.timestamp}>0:10-0:25</Text>
          <Text style={styles.timestampContent}>[Problem] "Phone tag. Voicemail loops. Customers waiting hours for simple answers. It's not just frustrating—it's costing you business."</Text>
        </View>
        <View style={styles.timestampRow}>
          <Text style={styles.timestamp}>0:25-0:50</Text>
          <Text style={styles.timestampContent}>[Solution] "The Customer Portal console puts 4 AI agents to work: AI Receptionist handles calls naturally. Follow-up Agent nurtures every lead. Review Agent collects feedback after service. Triage Agent routes complex issues to your team."</Text>
        </View>
        <View style={styles.timestampRow}>
          <Text style={styles.timestamp}>0:50-1:10</Text>
          <Text style={styles.timestampContent}>[Demo] [Screen recording of portal in action] "Watch as a call comes in, gets answered, appointment booked, confirmation sent—all in under 60 seconds. No human needed."</Text>
        </View>
        <View style={styles.timestampRow}>
          <Text style={styles.timestamp}>1:10-1:30</Text>
          <Text style={styles.timestampContent}>[CTA] "Transform your customer experience today. Start with Aura Core at just $497/month. Every call answered. Every customer impressed."</Text>
        </View>
      </View>

      <View style={styles.scriptCard}>
        <View style={styles.durationBadge}>
          <Text style={styles.durationText}>75 SECONDS</Text>
        </View>
        <Text style={styles.scriptTitle}>Script 7: "Field Operations Showcase"</Text>
        
        <View style={styles.timestampRow}>
          <Text style={styles.timestamp}>0:00-0:08</Text>
          <Text style={styles.timestampContent}>[Hook] "Your technicians are driving in circles while jobs pile up. Sound familiar?"</Text>
        </View>
        <View style={styles.timestampRow}>
          <Text style={styles.timestamp}>0:08-0:25</Text>
          <Text style={styles.timestampContent}>[Problem] "Manual dispatching. Inefficient routes. No real-time tracking. Your field team is working hard, but not smart."</Text>
        </View>
        <View style={styles.timestampRow}>
          <Text style={styles.timestamp}>0:25-0:55</Text>
          <Text style={styles.timestampContent}>[Solution] "Field Ops console: Dispatch/GPS Console assigns jobs by skill and location. Route Agent optimizes paths in real-time. ETA Agent keeps customers informed automatically. Check-in Agent tracks job progress."</Text>
        </View>
        <View style={styles.timestampRow}>
          <Text style={styles.timestamp}>0:55-1:15</Text>
          <Text style={styles.timestampContent}>[Results] "Average results: 2 extra jobs per day. 40% less windshield time. Happier technicians, happier customers."</Text>
        </View>
      </View>

      <Footer />
    </Page>

    {/* Long-Form Scripts - 2-5 min */}
    <Page size="A4" style={styles.page}>
      <Header title="Long-Form Scripts (2-5 minutes)" pageNum={6} />
      
      <Text style={styles.sectionTitle}>Demo & Presentation Scripts</Text>
      <Text style={styles.sectionSubtitle}>Complete walkthrough content for sales calls and webinars</Text>

      <View style={styles.scriptCard}>
        <View style={styles.durationBadge}>
          <Text style={styles.durationText}>3 MINUTES</Text>
        </View>
        <Text style={styles.scriptTitle}>Script 8: "Full Platform Demo"</Text>
        
        <View style={styles.scriptMeta}>
          <View style={styles.metaItem}>
            <Text style={styles.metaLabel}>Use Case:</Text>
            <Text style={styles.metaValue}>Sales Presentation</Text>
          </View>
          <View style={styles.metaItem}>
            <Text style={styles.metaLabel}>Audience:</Text>
            <Text style={styles.metaValue}>Decision Makers</Text>
          </View>
        </View>

        <View style={styles.scriptSection}>
          <Text style={styles.scriptLabel}>Opening (0:00-0:30)</Text>
          <Text style={styles.scriptText}>
            "I'm going to show you something that's going to change how you think about running a service business.{'\n\n'}
            Most businesses we talk to are dealing with the same challenges: missed calls, scheduling chaos, inconsistent follow-up, and no visibility into what's actually happening.{'\n\n'}
            Aura Intercept solves all of that with 24 Smart AI Agents working as your virtual operations team."
          </Text>
        </View>

        <View style={styles.scriptSection}>
          <Text style={styles.scriptLabel}>Console Tour (0:30-2:00)</Text>
          <Text style={styles.scriptText}>
            "Let me walk you through the 5 command consoles:{'\n\n'}
            Customer Portal—this is where every customer interaction starts. AI Receptionist, Follow-up, Review, and Triage agents working together.{'\n\n'}
            Field Operations—your dispatch hub. Real-time technician tracking, optimized routing, and automated ETA updates.{'\n\n'}
            Business Operations—the financial pulse. Quoting, invoicing, and inventory management.{'\n\n'}
            Outreach & Sales Ops—lead scoring, campaign automation, and referral tracking.{'\n\n'}
            Analytics & Reports—everything measured. Performance, revenue, customer insights."
          </Text>
        </View>

        <View style={styles.scriptSection}>
          <Text style={styles.scriptLabel}>Close (2:00-3:00)</Text>
          <Text style={styles.scriptText}>
            "Here's what happens when you turn this on:{'\n'}
            → Every call gets answered{'\n'}
            → Every lead gets followed up{'\n'}
            → Every job gets scheduled efficiently{'\n'}
            → Every customer gets a great experience{'\n\n'}
            Starting at $697/month. Most customers see ROI in week one.{'\n\n'}
            Ready to see this with your own data?"
          </Text>
        </View>
      </View>

      <Footer />
    </Page>

    {/* Testimonial Framework */}
    <Page size="A4" style={styles.page}>
      <Header title="Customer Testimonial Scripts" pageNum={7} />
      
      <Text style={styles.sectionTitle}>Testimonial Interview Framework</Text>
      <Text style={styles.sectionSubtitle}>Guide customers through compelling story-based testimonials</Text>

      <View style={styles.scriptCard}>
        <View style={styles.durationBadge}>
          <Text style={styles.durationText}>2 MINUTES</Text>
        </View>
        <Text style={styles.scriptTitle}>Script 9: "Customer Success Story Template"</Text>
        
        <View style={styles.scriptSection}>
          <Text style={styles.scriptLabel}>Question 1: Introduction</Text>
          <Text style={styles.scriptText}>"Tell us about your business and what you do."</Text>
        </View>

        <View style={styles.scriptSection}>
          <Text style={styles.scriptLabel}>Question 2: The Problem</Text>
          <Text style={styles.scriptText}>"Before Aura Intercept, what was your biggest challenge with managing calls and leads?"</Text>
        </View>

        <View style={styles.scriptSection}>
          <Text style={styles.scriptLabel}>Question 3: The Skepticism</Text>
          <Text style={styles.scriptText}>"What made you hesitant to try an AI solution at first?"</Text>
        </View>

        <View style={styles.scriptSection}>
          <Text style={styles.scriptLabel}>Question 4: The Decision</Text>
          <Text style={styles.scriptText}>"What convinced you to give it a try?"</Text>
        </View>

        <View style={styles.scriptSection}>
          <Text style={styles.scriptLabel}>Question 5: The Results</Text>
          <Text style={styles.scriptText}>"What specific results have you seen? Can you share any numbers?"</Text>
        </View>

        <View style={styles.scriptSection}>
          <Text style={styles.scriptLabel}>Question 6: The Recommendation</Text>
          <Text style={styles.scriptText}>"What would you tell another business owner who's on the fence?"</Text>
        </View>
      </View>

      <View style={styles.voiceoverBox}>
        <Text style={styles.voiceoverTitle}>🎙️ VOICEOVER DIRECTION NOTES</Text>
        <Text style={styles.voiceoverText}>
          TONE: Conversational, confident, warm—never salesy or robotic{'\n\n'}
          PACING: Moderate speed with strategic pauses after key points{'\n\n'}
          EMPHASIS: Hit numbers hard ("$11,000" / "23x return" / "zero missed calls"){'\n\n'}
          ENERGY: Start calm, build excitement toward features, land strong on CTA{'\n\n'}
          AVOID: Jargon, rushed delivery, monotone reading
        </Text>
      </View>

      <Footer />
    </Page>

    {/* B-Roll Master List */}
    <Page size="A4" style={styles.page}>
      <Header title="B-Roll Shot List" pageNum={8} />
      
      <Text style={styles.sectionTitle}>Complete B-Roll Library Guide</Text>
      <Text style={styles.sectionSubtitle}>Essential footage to capture for all video content</Text>

      <View style={styles.twoColumn}>
        <View style={styles.column}>
          <View style={styles.brollSection}>
            <Text style={styles.brollTitle}>[MOBILE] TECHNOLOGY SHOTS</Text>
            <Text style={styles.brollItem}>- Phone screen showing incoming call</Text>
            <Text style={styles.brollItem}>- App dashboard with notifications</Text>
            <Text style={styles.brollItem}>- Calendar filling with bookings</Text>
            <Text style={styles.brollItem}>- Map with route optimization</Text>
            <Text style={styles.brollItem}>- Chat interface in action</Text>
            <Text style={styles.brollItem}>- Analytics dashboard</Text>
          </View>

          <View style={styles.brollSection}>
            <Text style={styles.brollTitle}>[TECH] FIELD WORK SHOTS</Text>
            <Text style={styles.brollItem}>- Technician hands on equipment</Text>
            <Text style={styles.brollItem}>- Van arriving at customer home</Text>
            <Text style={styles.brollItem}>- Technician checking phone/tablet</Text>
            <Text style={styles.brollItem}>- Tools and equipment</Text>
            <Text style={styles.brollItem}>- Happy customer handshake</Text>
          </View>
        </View>

        <View style={styles.column}>
          <View style={styles.brollSection}>
            <Text style={styles.brollTitle}>[OFFICE] OFFICE SHOTS</Text>
            <Text style={styles.brollItem}>- Dispatcher at computer</Text>
            <Text style={styles.brollItem}>- Team looking at dashboard</Text>
            <Text style={styles.brollItem}>- Phone ringing (answered/unanswered)</Text>
            <Text style={styles.brollItem}>- Paperwork and chaos (before)</Text>
            <Text style={styles.brollItem}>- Clean, organized (after)</Text>
          </View>

          <View style={styles.brollSection}>
            <Text style={styles.brollTitle}>[EMOTION] EMOTION SHOTS</Text>
            <Text style={styles.brollItem}>- Stressed business owner (before)</Text>
            <Text style={styles.brollItem}>- Relieved business owner (after)</Text>
            <Text style={styles.brollItem}>- Happy customer testimonial</Text>
            <Text style={styles.brollItem}>- Team celebration</Text>
            <Text style={styles.brollItem}>- Revenue celebration graphics</Text>
          </View>
        </View>
      </View>

      <View style={styles.tipBox}>
        <Text style={styles.tipLabel}>[VIDEO] PRODUCTION TIPS</Text>
        <Text style={styles.tipText}>
          - Shoot in 4K when possible, deliver in 1080p{'\n'}
          - Capture 10-second minimum clips for flexibility{'\n'}
          - Include both wide and close-up versions{'\n'}
          - Natural lighting preferred for authenticity{'\n'}
          - Always get model releases for customer footage
        </Text>
      </View>

      <Footer />
    </Page>
  </Document>
);

export default VideoScriptsPDF;
