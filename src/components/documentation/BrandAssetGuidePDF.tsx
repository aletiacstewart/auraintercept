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
  error: '#ef4444',
  // Tier colors
  singlePoint: '#3b82f6',
  multiTrack: '#8b5cf6',
  command: '#f59e0b',
  // Social colors
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
    marginBottom: 25,
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
  colorCard: {
    backgroundColor: 'white',
    padding: 15,
    borderRadius: 10,
    marginBottom: 15,
  },
  colorCardTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: colors.dark,
    marginBottom: 15,
  },
  colorRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 10,
  },
  colorSwatch: {
    width: 60,
    height: 60,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  colorInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  colorName: {
    fontSize: 12,
    fontWeight: 'bold',
    color: colors.dark,
    marginBottom: 4,
  },
  colorHex: {
    fontSize: 10,
    color: colors.gray,
    fontFamily: 'Courier',
  },
  colorUsage: {
    fontSize: 9,
    color: colors.gray,
    marginTop: 4,
  },
  threeColumn: {
    flexDirection: 'row',
    gap: 10,
  },
  columnThird: {
    flex: 1,
  },
  iconCard: {
    backgroundColor: 'white',
    padding: 12,
    borderRadius: 8,
    marginBottom: 10,
    borderLeftWidth: 4,
  },
  iconName: {
    fontSize: 10,
    fontWeight: 'bold',
    color: colors.dark,
    marginBottom: 4,
  },
  iconDesc: {
    fontSize: 8,
    color: colors.gray,
    lineHeight: 1.4,
  },
  typographyCard: {
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 10,
    marginBottom: 15,
  },
  fontSample: {
    marginBottom: 15,
    paddingBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  fontName: {
    fontSize: 12,
    fontWeight: 'bold',
    color: colors.dark,
    marginBottom: 8,
  },
  fontDisplay: {
    fontSize: 24,
    color: colors.dark,
    marginBottom: 8,
  },
  fontMeta: {
    fontSize: 9,
    color: colors.gray,
  },
  guidelinesCard: {
    backgroundColor: '#eef2ff',
    padding: 15,
    borderRadius: 8,
    marginTop: 15,
  },
  guidelinesTitle: {
    fontSize: 11,
    fontWeight: 'bold',
    color: colors.secondary,
    marginBottom: 8,
  },
  guidelinesText: {
    fontSize: 9,
    color: colors.dark,
    lineHeight: 1.5,
  },
  mockupCard: {
    backgroundColor: 'white',
    padding: 15,
    borderRadius: 10,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  mockupTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    color: colors.dark,
    marginBottom: 10,
  },
  mockupSpecs: {
    backgroundColor: colors.light,
    padding: 12,
    borderRadius: 6,
    marginBottom: 10,
  },
  specRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  specLabel: {
    fontSize: 9,
    color: colors.gray,
  },
  specValue: {
    fontSize: 9,
    color: colors.dark,
    fontWeight: 'bold',
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
  paletteGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 10,
  },
  paletteItem: {
    width: '30%',
    alignItems: 'center',
    marginBottom: 10,
  },
  paletteSwatch: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginBottom: 6,
  },
  paletteLabel: {
    fontSize: 8,
    color: colors.dark,
    textAlign: 'center',
  },
  paletteHex: {
    fontSize: 7,
    color: colors.gray,
    fontFamily: 'Courier',
  },
  twoColumn: {
    flexDirection: 'row',
    gap: 15,
  },
  column: {
    flex: 1,
  },
  categoryCard: {
    backgroundColor: 'white',
    padding: 12,
    borderRadius: 8,
    marginBottom: 10,
  },
  categoryTitle: {
    fontSize: 11,
    fontWeight: 'bold',
    color: colors.dark,
    marginBottom: 8,
  },
  agentRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 4,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  agentName: {
    fontSize: 9,
    color: colors.dark,
  },
  agentColor: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  infographicCard: {
    backgroundColor: 'white',
    padding: 15,
    borderRadius: 10,
    marginBottom: 15,
  },
  infographicTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    color: colors.dark,
    marginBottom: 10,
  },
  dataPoint: {
    backgroundColor: colors.light,
    padding: 10,
    borderRadius: 6,
    marginBottom: 8,
  },
  dataPointValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.primary,
    marginBottom: 4,
  },
  dataPointLabel: {
    fontSize: 9,
    color: colors.gray,
  },
  dataPointContext: {
    fontSize: 8,
    color: colors.dark,
    marginTop: 4,
    fontStyle: 'italic',
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
    <Text style={styles.footerText}>Aura Intercept Brand Asset Guide</Text>
    <Text style={styles.footerText}>© 2026 Aura Intercept</Text>
  </View>
);

const ColorSwatch = ({ color, name, hex, usage }: { color: string; name: string; hex: string; usage: string }) => (
  <View style={styles.colorRow}>
    <View style={[styles.colorSwatch, { backgroundColor: color }]}>
      <Text style={{ color: 'white', fontSize: 8, fontWeight: 'bold' }}>{hex}</Text>
    </View>
    <View style={styles.colorInfo}>
      <Text style={styles.colorName}>{name}</Text>
      <Text style={styles.colorHex}>{hex}</Text>
      <Text style={styles.colorUsage}>{usage}</Text>
    </View>
  </View>
);

export const BrandAssetGuidePDF: React.FC = () => (
  <Document>
    {/* Cover Page */}
    <Page size="A4" style={styles.coverPage}>
      <Text style={styles.coverTitle}>Brand Asset{'\n'}Guide</Text>
      <Text style={styles.coverSubtitle}>
        Complete Visual Identity System{'\n'}
        Colors • Typography • Icons • Templates{'\n'}
        For Designers & Marketers
      </Text>
      <View style={styles.coverBadge}>
        <Text style={styles.coverBadgeText}>Official Brand Standards</Text>
      </View>
    </Page>

    {/* Primary Color Palette */}
    <Page size="A4" style={styles.page}>
      <Header title="Primary Color Palette" pageNum={2} />
      
      <Text style={styles.sectionTitle}>Core Brand Colors</Text>
      <Text style={styles.sectionSubtitle}>Use these colors consistently across all materials</Text>

      <View style={styles.colorCard}>
        <Text style={styles.colorCardTitle}>Primary Colors</Text>
        <ColorSwatch 
          color="#214ebb" 
          name="Aura Blue" 
          hex="#214ebb" 
          usage="Primary brand color. Use for headers, CTAs, and key UI elements."
        />
        <ColorSwatch 
          color="#6366f1" 
          name="Indigo" 
          hex="#6366f1" 
          usage="Secondary brand color. Use for accents, hover states, and gradients."
        />
        <ColorSwatch 
          color="#06b6d4" 
          name="Cyan" 
          hex="#06b6d4" 
          usage="Accent color. Use for highlights, links, and interactive elements."
        />
      </View>

      <View style={styles.colorCard}>
        <Text style={styles.colorCardTitle}>Neutral Colors</Text>
        <ColorSwatch 
          color="#1e293b" 
          name="Slate Dark" 
          hex="#1e293b" 
          usage="Primary text, headings, and dark backgrounds."
        />
        <ColorSwatch 
          color="#64748b" 
          name="Slate Gray" 
          hex="#64748b" 
          usage="Secondary text, captions, and muted elements."
        />
        <ColorSwatch 
          color="#f8fafc" 
          name="Slate Light" 
          hex="#f8fafc" 
          usage="Backgrounds, cards, and light surfaces."
        />
      </View>

      <View style={styles.guidelinesCard}>
        <Text style={styles.guidelinesTitle}>COLOR USAGE GUIDELINES</Text>
        <Text style={styles.guidelinesText}>
          - Always maintain a 4.5:1 contrast ratio for text accessibility{'\n'}
          - Use Aura Blue (#214ebb) as the dominant brand color (60-70%){'\n'}
          - Indigo and Cyan should be used sparingly (20-30%){'\n'}
          - Never use more than 3 colors in a single composition{'\n'}
          - For gradients, always go from Aura Blue to Indigo (left-to-right or top-to-bottom)
        </Text>
      </View>

      <Footer />
    </Page>

    {/* Status & Tier Colors */}
    <Page size="A4" style={styles.page}>
      <Header title="Status & Tier Colors" pageNum={3} />
      
      <Text style={styles.sectionTitle}>Functional Colors</Text>
      <Text style={styles.sectionSubtitle}>Colors for status indicators and user feedback</Text>

      <View style={styles.twoColumn}>
        <View style={styles.column}>
          <View style={styles.colorCard}>
            <Text style={styles.colorCardTitle}>Status Colors</Text>
            <ColorSwatch 
              color="#10b981" 
              name="Success Green" 
              hex="#10b981" 
              usage="Confirmations, completed states"
            />
            <ColorSwatch 
              color="#f59e0b" 
              name="Warning Amber" 
              hex="#f59e0b" 
              usage="Alerts, pending states"
            />
            <ColorSwatch 
              color="#ef4444" 
              name="Error Red" 
              hex="#ef4444" 
              usage="Errors, destructive actions"
            />
          </View>
        </View>
        <View style={styles.column}>
          <View style={styles.colorCard}>
            <Text style={styles.colorCardTitle}>Subscription Tiers</Text>
            <ColorSwatch 
              color="#14b8a6" 
              name="Aura Core Teal" 
              hex="#14b8a6" 
              usage="Aura Core tier ($197/mo)"
            />
            <ColorSwatch 
              color="#3b82f6" 
              name="Aura Boost Blue" 
              hex="#3b82f6" 
              usage="Aura Boost tier ($497/mo)"
            />
            <ColorSwatch 
              color="#8b5cf6" 
              name="Aura Pro Purple" 
              hex="#8b5cf6" 
              usage="Aura Pro tier ($997/mo)"
            />
            <ColorSwatch 
              color="#f59e0b" 
              name="Aura Elite Gold" 
              hex="#f59e0b" 
              usage="Aura Elite tier ($1,997/mo)"
            />
          </View>
        </View>
      </View>

      <View style={styles.colorCard}>
        <Text style={styles.colorCardTitle}>Social Platform Colors</Text>
        <View style={styles.paletteGrid}>
          <View style={styles.paletteItem}>
            <View style={[styles.paletteSwatch, { backgroundColor: '#E4405F' }]} />
            <Text style={styles.paletteLabel}>Instagram</Text>
            <Text style={styles.paletteHex}>#E4405F</Text>
          </View>
          <View style={styles.paletteItem}>
            <View style={[styles.paletteSwatch, { backgroundColor: '#1877F2' }]} />
            <Text style={styles.paletteLabel}>Facebook</Text>
            <Text style={styles.paletteHex}>#1877F2</Text>
          </View>
          <View style={styles.paletteItem}>
            <View style={[styles.paletteSwatch, { backgroundColor: '#0A66C2' }]} />
            <Text style={styles.paletteLabel}>LinkedIn</Text>
            <Text style={styles.paletteHex}>#0A66C2</Text>
          </View>
          <View style={styles.paletteItem}>
            <View style={[styles.paletteSwatch, { backgroundColor: '#000000' }]} />
            <Text style={styles.paletteLabel}>TikTok</Text>
            <Text style={styles.paletteHex}>#000000</Text>
          </View>
          <View style={styles.paletteItem}>
            <View style={[styles.paletteSwatch, { backgroundColor: '#4285F4' }]} />
            <Text style={styles.paletteLabel}>Google</Text>
            <Text style={styles.paletteHex}>#4285F4</Text>
          </View>
          <View style={styles.paletteItem}>
            <View style={[styles.paletteSwatch, { backgroundColor: '#22c55e' }]} />
            <Text style={styles.paletteLabel}>SMS</Text>
            <Text style={styles.paletteHex}>#22c55e</Text>
          </View>
        </View>
      </View>

      <Footer />
    </Page>

    {/* Typography */}
    <Page size="A4" style={styles.page}>
      <Header title="Typography System" pageNum={4} />
      
      <Text style={styles.sectionTitle}>Font Families</Text>
      <Text style={styles.sectionSubtitle}>Typography guidelines for digital and print</Text>

      <View style={styles.typographyCard}>
        <View style={styles.fontSample}>
          <Text style={styles.fontName}>Primary: Inter</Text>
          <Text style={[styles.fontDisplay, { fontFamily: 'Helvetica' }]}>Aura Intercept</Text>
          <Text style={styles.fontMeta}>Weights: 400 (Regular), 500 (Medium), 600 (Semibold), 700 (Bold){'\n'}Use for: Body text, UI elements, general content</Text>
        </View>
        <View style={styles.fontSample}>
          <Text style={styles.fontName}>Display: Outfit</Text>
          <Text style={[styles.fontDisplay, { fontFamily: 'Helvetica', fontWeight: 'bold' }]}>AI-POWERED</Text>
          <Text style={styles.fontMeta}>Weights: 500 (Medium), 600 (Semibold), 700 (Bold){'\n'}Use for: Headlines, hero text, marketing materials</Text>
        </View>
        <View style={{ marginBottom: 0 }}>
          <Text style={styles.fontName}>Monospace: JetBrains Mono</Text>
          <Text style={[styles.fontDisplay, { fontFamily: 'Courier', fontSize: 18 }]}>$197-$1,997/month</Text>
          <Text style={styles.fontMeta}>Weights: 400 (Regular), 500 (Medium){'\n'}Use for: Code, data, pricing, technical specs</Text>
        </View>
      </View>

      <View style={styles.colorCard}>
        <Text style={styles.colorCardTitle}>Type Scale</Text>
        <View style={styles.specRow}>
          <Text style={styles.specLabel}>Hero/Display</Text>
          <Text style={styles.specValue}>48-72px / Bold</Text>
        </View>
        <View style={styles.specRow}>
          <Text style={styles.specLabel}>H1</Text>
          <Text style={styles.specValue}>36-40px / Semibold</Text>
        </View>
        <View style={styles.specRow}>
          <Text style={styles.specLabel}>H2</Text>
          <Text style={styles.specValue}>28-32px / Semibold</Text>
        </View>
        <View style={styles.specRow}>
          <Text style={styles.specLabel}>H3</Text>
          <Text style={styles.specValue}>22-24px / Medium</Text>
        </View>
        <View style={styles.specRow}>
          <Text style={styles.specLabel}>Body Large</Text>
          <Text style={styles.specValue}>18px / Regular</Text>
        </View>
        <View style={styles.specRow}>
          <Text style={styles.specLabel}>Body</Text>
          <Text style={styles.specValue}>16px / Regular</Text>
        </View>
        <View style={styles.specRow}>
          <Text style={styles.specLabel}>Small/Caption</Text>
          <Text style={styles.specValue}>14px / Regular</Text>
        </View>
      </View>

      <Footer />
    </Page>

    {/* Agent Icons */}
    <Page size="A4" style={styles.page}>
      <Header title="AI Agent Icon Concepts" pageNum={5} />
      
      <Text style={styles.sectionTitle}>24 Agent Icon System</Text>
      <Text style={styles.sectionSubtitle}>Visual concepts for agent identification across 7 consoles</Text>

      <View style={styles.threeColumn}>
        <View style={styles.columnThird}>
          <View style={[styles.iconCard, { borderLeftColor: colors.primary }]}>
            <Text style={styles.iconName}>AI Receptionist</Text>
            <Text style={styles.iconDesc}>Headset + soundwave icon. Represents voice communication.</Text>
          </View>
          <View style={[styles.iconCard, { borderLeftColor: colors.secondary }]}>
            <Text style={styles.iconName}>Follow-up Agent</Text>
            <Text style={styles.iconDesc}>Clock + arrow loop. Represents scheduled outreach.</Text>
          </View>
          <View style={[styles.iconCard, { borderLeftColor: colors.accent }]}>
            <Text style={styles.iconName}>Review Agent</Text>
            <Text style={styles.iconDesc}>Star badge icon. Represents reputation management.</Text>
          </View>
          <View style={[styles.iconCard, { borderLeftColor: colors.success }]}>
            <Text style={styles.iconName}>Triage Agent</Text>
            <Text style={styles.iconDesc}>Filter/funnel icon. Represents sorting inquiries.</Text>
          </View>
          <View style={[styles.iconCard, { borderLeftColor: colors.warning }]}>
            <Text style={styles.iconName}>Scheduling Agent</Text>
            <Text style={styles.iconDesc}>Calendar + checkmark. Represents bookings.</Text>
          </View>
          <View style={[styles.iconCard, { borderLeftColor: colors.primary }]}>
            <Text style={styles.iconName}>Dispatch Agent</Text>
            <Text style={styles.iconDesc}>Radio tower + person. Represents job assignment.</Text>
          </View>
          <View style={[styles.iconCard, { borderLeftColor: colors.secondary }]}>
            <Text style={styles.iconName}>Route Agent</Text>
            <Text style={styles.iconDesc}>Map pin + path. Represents route optimization.</Text>
          </View>
        </View>

        <View style={styles.columnThird}>
          <View style={[styles.iconCard, { borderLeftColor: colors.accent }]}>
            <Text style={styles.iconName}>ETA Agent</Text>
            <Text style={styles.iconDesc}>Clock + location. Represents arrival time.</Text>
          </View>
          <View style={[styles.iconCard, { borderLeftColor: colors.success }]}>
            <Text style={styles.iconName}>Check-in Agent</Text>
            <Text style={styles.iconDesc}>Clipboard + checkmark. Represents job status.</Text>
          </View>
          <View style={[styles.iconCard, { borderLeftColor: colors.warning }]}>
            <Text style={styles.iconName}>Quoting Agent</Text>
            <Text style={styles.iconDesc}>Document + dollar. Represents estimates.</Text>
          </View>
          <View style={[styles.iconCard, { borderLeftColor: colors.primary }]}>
            <Text style={styles.iconName}>Invoicing Agent</Text>
            <Text style={styles.iconDesc}>Receipt icon. Represents billing.</Text>
          </View>
          <View style={[styles.iconCard, { borderLeftColor: colors.secondary }]}>
            <Text style={styles.iconName}>Inventory Agent</Text>
            <Text style={styles.iconDesc}>Box + barcode. Represents stock management.</Text>
          </View>
          <View style={[styles.iconCard, { borderLeftColor: colors.success }]}>
            <Text style={styles.iconName}>Lead Agent</Text>
            <Text style={styles.iconDesc}>Magnet icon. Represents lead capture.</Text>
          </View>
        </View>

        <View style={styles.columnThird}>
          <View style={[styles.iconCard, { borderLeftColor: colors.warning }]}>
            <Text style={styles.iconName}>Campaign Agent</Text>
            <Text style={styles.iconDesc}>Megaphone icon. Represents marketing.</Text>
          </View>
          <View style={[styles.iconCard, { borderLeftColor: colors.primary }]}>
            <Text style={styles.iconName}>Social Content</Text>
            <Text style={styles.iconDesc}>Pen + hashtag. Represents content creation.</Text>
          </View>
          <View style={[styles.iconCard, { borderLeftColor: colors.secondary }]}>
            <Text style={styles.iconName}>Social Feed Queue</Text>
            <Text style={styles.iconDesc}>Calendar + share. Represents posting.</Text>
          </View>
          <View style={[styles.iconCard, { borderLeftColor: colors.accent }]}>
            <Text style={styles.iconName}>Social Analytics</Text>
            <Text style={styles.iconDesc}>Chart + heart. Represents engagement.</Text>
          </View>
          <View style={[styles.iconCard, { borderLeftColor: colors.success }]}>
            <Text style={styles.iconName}>Performance Agent</Text>
            <Text style={styles.iconDesc}>Speedometer icon. Represents metrics.</Text>
          </View>
          <View style={[styles.iconCard, { borderLeftColor: colors.warning }]}>
            <Text style={styles.iconName}>Revenue Agent</Text>
            <Text style={styles.iconDesc}>Trending up + dollar. Represents growth.</Text>
          </View>
          <View style={[styles.iconCard, { borderLeftColor: colors.primary }]}>
            <Text style={styles.iconName}>Customer Agent</Text>
            <Text style={styles.iconDesc}>People + chart. Represents insights.</Text>
          </View>
          <View style={[styles.iconCard, { borderLeftColor: colors.secondary }]}>
            <Text style={styles.iconName}>Report Agent</Text>
            <Text style={styles.iconDesc}>Document + chart. Represents analysis.</Text>
          </View>
          <View style={[styles.iconCard, { borderLeftColor: colors.accent }]}>
            <Text style={styles.iconName}>Admin Agent</Text>
            <Text style={styles.iconDesc}>Cog + shield. Back-office automation.</Text>
          </View>
          <View style={[styles.iconCard, { borderLeftColor: colors.success }]}>
            <Text style={styles.iconName}>Forecast Agent</Text>
            <Text style={styles.iconDesc}>Crystal ball + chart. Demand prediction.</Text>
          </View>
          <View style={[styles.iconCard, { borderLeftColor: colors.warning }]}>
            <Text style={styles.iconName}>Creative Agent</Text>
            <Text style={styles.iconDesc}>Palette + sparkle. Content generation.</Text>
          </View>
          <View style={[styles.iconCard, { borderLeftColor: colors.primary }]}>
            <Text style={styles.iconName}>Web Presence</Text>
            <Text style={styles.iconDesc}>Globe + code. Website management.</Text>
          </View>
          <View style={[styles.iconCard, { borderLeftColor: colors.secondary }]}>
            <Text style={styles.iconName}>Marketing Agent</Text>
            <Text style={styles.iconDesc}>Tag + gift. Promos and referrals.</Text>
          </View>
        </View>
      </View>

      <View style={styles.guidelinesCard}>
        <Text style={styles.guidelinesTitle}>24 SMART AI AGENTS ACROSS 7 CONSOLES</Text>
        <Text style={styles.guidelinesText}>
          The complete Aura Intelligence Network includes 24 Smart AI Agents organized across 7 Control Centers: Customer Portal, Field Operations, Business Management, Outreach and Sales, Social Media, Creative and Web Presence, and Analytics and Reports. Each agent has a unique icon combining a primary symbol with a secondary indicator.
        </Text>
      </View>

      <Footer />
    </Page>

    {/* Logo Usage */}
    <Page size="A4" style={styles.page}>
      <Header title="Logo Usage Guidelines" pageNum={6} />
      
      <Text style={styles.sectionTitle}>Logo Specifications</Text>
      <Text style={styles.sectionSubtitle}>Proper logo usage across all applications</Text>

      <View style={styles.twoColumn}>
        <View style={styles.column}>
          <View style={styles.mockupCard}>
            <Text style={styles.mockupTitle}>Primary Logo</Text>
            <View style={[styles.mockupSpecs, { backgroundColor: colors.primary, padding: 20, alignItems: 'center' }]}>
              <Text style={{ color: 'white', fontSize: 24, fontWeight: 'bold' }}>Aura Intercept</Text>
            </View>
            <View style={styles.mockupSpecs}>
              <View style={styles.specRow}>
                <Text style={styles.specLabel}>Clear Space</Text>
                <Text style={styles.specValue}>1x logo height</Text>
              </View>
              <View style={styles.specRow}>
                <Text style={styles.specLabel}>Min Width (Digital)</Text>
                <Text style={styles.specValue}>120px</Text>
              </View>
              <View style={styles.specRow}>
                <Text style={styles.specLabel}>Min Width (Print)</Text>
                <Text style={styles.specValue}>1.5 inches</Text>
              </View>
            </View>
          </View>
        </View>
        <View style={styles.column}>
          <View style={styles.mockupCard}>
            <Text style={styles.mockupTitle}>Alternate Versions</Text>
            <View style={styles.mockupSpecs}>
              <View style={styles.specRow}>
                <Text style={styles.specLabel}>Light Background</Text>
                <Text style={styles.specValue}>Aura Blue (#214ebb)</Text>
              </View>
              <View style={styles.specRow}>
                <Text style={styles.specLabel}>Dark Background</Text>
                <Text style={styles.specValue}>White (#FFFFFF)</Text>
              </View>
              <View style={styles.specRow}>
                <Text style={styles.specLabel}>One-Color</Text>
                <Text style={styles.specValue}>Black or White</Text>
              </View>
            </View>
          </View>
        </View>
      </View>

      <View style={styles.guidelinesCard}>
        <Text style={styles.guidelinesTitle}>[WARNING] LOGO DON'TS</Text>
        <Text style={styles.guidelinesText}>
          - Don't stretch, skew, or distort the logo{'\n'}
          - Don't change the logo colors outside brand palette{'\n'}
          - Don't add effects (shadows, glows, outlines){'\n'}
          - Don't place on busy backgrounds without contrast{'\n'}
          - Don't recreate or approximate the logo
        </Text>
      </View>

      <Footer />
    </Page>

    {/* Template Sizes */}
    <Page size="A4" style={styles.page}>
      <Header title="Template Specifications" pageNum={7} />
      
      <Text style={styles.sectionTitle}>Design Template Sizes</Text>
      <Text style={styles.sectionSubtitle}>Standard dimensions for marketing materials</Text>

      <View style={styles.twoColumn}>
        <View style={styles.column}>
          <View style={styles.mockupCard}>
            <Text style={styles.mockupTitle}>Social Media</Text>
            <View style={styles.mockupSpecs}>
              <View style={styles.specRow}>
                <Text style={styles.specLabel}>Instagram Post</Text>
                <Text style={styles.specValue}>1080 × 1080px</Text>
              </View>
              <View style={styles.specRow}>
                <Text style={styles.specLabel}>Instagram Story</Text>
                <Text style={styles.specValue}>1080 × 1920px</Text>
              </View>
              <View style={styles.specRow}>
                <Text style={styles.specLabel}>Facebook Post</Text>
                <Text style={styles.specValue}>1200 × 630px</Text>
              </View>
              <View style={styles.specRow}>
                <Text style={styles.specLabel}>LinkedIn Post</Text>
                <Text style={styles.specValue}>1200 × 627px</Text>
              </View>
              <View style={styles.specRow}>
                <Text style={styles.specLabel}>TikTok Video</Text>
                <Text style={styles.specValue}>1080 × 1920px</Text>
              </View>
            </View>
          </View>

          <View style={styles.mockupCard}>
            <Text style={styles.mockupTitle}>Email</Text>
            <View style={styles.mockupSpecs}>
              <View style={styles.specRow}>
                <Text style={styles.specLabel}>Header Image</Text>
                <Text style={styles.specValue}>600 × 200px</Text>
              </View>
              <View style={styles.specRow}>
                <Text style={styles.specLabel}>Email Width</Text>
                <Text style={styles.specValue}>600px max</Text>
              </View>
            </View>
          </View>
        </View>

        <View style={styles.column}>
          <View style={styles.mockupCard}>
            <Text style={styles.mockupTitle}>Web Assets</Text>
            <View style={styles.mockupSpecs}>
              <View style={styles.specRow}>
                <Text style={styles.specLabel}>Hero Banner</Text>
                <Text style={styles.specValue}>1920 × 1080px</Text>
              </View>
              <View style={styles.specRow}>
                <Text style={styles.specLabel}>OG Image</Text>
                <Text style={styles.specValue}>1200 × 630px</Text>
              </View>
              <View style={styles.specRow}>
                <Text style={styles.specLabel}>Favicon</Text>
                <Text style={styles.specValue}>32 × 32px</Text>
              </View>
              <View style={styles.specRow}>
                <Text style={styles.specLabel}>App Icon</Text>
                <Text style={styles.specValue}>512 × 512px</Text>
              </View>
            </View>
          </View>

          <View style={styles.mockupCard}>
            <Text style={styles.mockupTitle}>Print</Text>
            <View style={styles.mockupSpecs}>
              <View style={styles.specRow}>
                <Text style={styles.specLabel}>Business Card</Text>
                <Text style={styles.specValue}>3.5 × 2 inches</Text>
              </View>
              <View style={styles.specRow}>
                <Text style={styles.specLabel}>Flyer</Text>
                <Text style={styles.specValue}>8.5 × 11 inches</Text>
              </View>
              <View style={styles.specRow}>
                <Text style={styles.specLabel}>Resolution</Text>
                <Text style={styles.specValue}>300 DPI minimum</Text>
              </View>
            </View>
          </View>
        </View>
      </View>

      <Footer />
    </Page>

    {/* Infographic Data Points */}
    <Page size="A4" style={styles.page}>
      <Header title="Infographic Data Points" pageNum={8} />
      
      <Text style={styles.sectionTitle}>Key Stats for Graphics</Text>
      <Text style={styles.sectionSubtitle}>Verified data points for marketing infographics</Text>

      <View style={styles.twoColumn}>
        <View style={styles.column}>
          <View style={styles.infographicCard}>
            <Text style={styles.infographicTitle}>Platform Stats</Text>
            <View style={styles.dataPoint}>
              <Text style={styles.dataPointValue}>24</Text>
              <Text style={styles.dataPointLabel}>AI Agents</Text>
              <Text style={styles.dataPointContext}>Specialized agents across 7 Control Centers</Text>
            </View>
            <View style={styles.dataPoint}>
              <Text style={styles.dataPointValue}>7</Text>
              <Text style={styles.dataPointLabel}>Control Centers</Text>
              <Text style={styles.dataPointContext}>Customer, Field, Business, Marketing, Social, Creative, Analytics</Text>
            </View>
            <View style={styles.dataPoint}>
              <Text style={styles.dataPointValue}>6</Text>
              <Text style={styles.dataPointLabel}>Social Platforms</Text>
              <Text style={styles.dataPointContext}>IG, FB, LI, TikTok, GMB, SMS</Text>
            </View>
          </View>
        </View>

        <View style={styles.column}>
          <View style={styles.infographicCard}>
            <Text style={styles.infographicTitle}>Performance Stats</Text>
            <View style={styles.dataPoint}>
              <Text style={styles.dataPointValue}>100%</Text>
              <Text style={styles.dataPointLabel}>Call Answer Rate</Text>
              <Text style={styles.dataPointContext}>vs. industry average of 38%</Text>
            </View>
            <View style={styles.dataPoint}>
              <Text style={styles.dataPointValue}>23x</Text>
              <Text style={styles.dataPointLabel}>Average ROI</Text>
              <Text style={styles.dataPointContext}>In the first month of use</Text>
            </View>
            <View style={styles.dataPoint}>
              <Text style={styles.dataPointValue}>49+</Text>
              <Text style={styles.dataPointLabel}>Hours Saved Weekly</Text>
              <Text style={styles.dataPointContext}>On administrative tasks</Text>
            </View>
          </View>
        </View>
      </View>

      <View style={styles.infographicCard}>
        <Text style={styles.infographicTitle}>Revenue Impact Numbers</Text>
        <View style={styles.twoColumn}>
          <View style={styles.column}>
            <View style={styles.dataPoint}>
              <Text style={styles.dataPointValue}>$11,500</Text>
              <Text style={styles.dataPointLabel}>Month 1 Revenue Recovery</Text>
              <Text style={styles.dataPointContext}>Average for Pro tier</Text>
            </View>
          </View>
          <View style={styles.column}>
            <View style={styles.dataPoint}>
              <Text style={styles.dataPointValue}>$165K</Text>
              <Text style={styles.dataPointLabel}>Annual Value Created</Text>
              <Text style={styles.dataPointContext}>Time savings + revenue recovery</Text>
            </View>
          </View>
        </View>
        <View style={styles.twoColumn}>
          <View style={styles.column}>
            <View style={styles.dataPoint}>
              <Text style={styles.dataPointValue}>$500</Text>
              <Text style={styles.dataPointLabel}>Avg. Job Value</Text>
              <Text style={styles.dataPointContext}>Per missed call recovered</Text>
            </View>
          </View>
          <View style={styles.column}>
            <View style={styles.dataPoint}>
              <Text style={styles.dataPointValue}>7 days</Text>
              <Text style={styles.dataPointLabel}>Time to ROI</Text>
              <Text style={styles.dataPointContext}>Average payback period</Text>
            </View>
          </View>
        </View>
      </View>

      <Footer />
    </Page>
  </Document>
);

export default BrandAssetGuidePDF;
