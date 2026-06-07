import React from 'react';
import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer';
import { sanitizePdfText } from './pdfSanitize';
import { sections } from '@/lib/videoPromptsData';

const colors = {
  primary: '#00E5FF',
  secondary: '#6366f1',
  dark: '#0f172a',
  light: '#f8fafc',
  gray: '#64748b',
  muted: '#e2e8f0',
  accent: '#a78bfa',
};

const styles = StyleSheet.create({
  page: { padding: 36, backgroundColor: colors.light, fontFamily: 'Helvetica' },
  coverPage: { padding: 40, backgroundColor: colors.dark, justifyContent: 'center', alignItems: 'center', height: '100%' },
  coverTitle: { fontSize: 34, fontWeight: 'bold', color: colors.primary, marginBottom: 14, textAlign: 'center' },
  coverSubtitle: { fontSize: 14, color: 'white', opacity: 0.85, textAlign: 'center', marginBottom: 28, paddingHorizontal: 30, lineHeight: 1.5 },
  coverBadge: { backgroundColor: colors.primary, paddingHorizontal: 18, paddingVertical: 8, borderRadius: 20, marginBottom: 10 },
  coverBadgeText: { color: colors.dark, fontSize: 12, fontWeight: 'bold' },
  coverMeta: { color: 'white', opacity: 0.7, fontSize: 10, marginTop: 24, textAlign: 'center' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, paddingBottom: 10, borderBottomWidth: 2, borderBottomColor: colors.secondary },
  headerTitle: { fontSize: 16, fontWeight: 'bold', color: colors.secondary },
  headerPage: { fontSize: 9, color: colors.gray },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', color: colors.dark, marginBottom: 4 },
  sectionMeta: { fontSize: 10, color: colors.gray, marginBottom: 12 },
  clipCard: { borderWidth: 1, borderColor: colors.muted, borderRadius: 6, padding: 10, marginBottom: 10, backgroundColor: 'white' },
  clipHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  clipNum: { fontSize: 10, fontWeight: 'bold', color: colors.secondary },
  clipName: { fontSize: 12, fontWeight: 'bold', color: colors.dark, flex: 1, marginLeft: 8 },
  clipDuration: { fontSize: 9, color: colors.gray },
  fieldLabel: { fontSize: 8, fontWeight: 'bold', color: colors.secondary, marginTop: 6, marginBottom: 2, textTransform: 'uppercase', letterSpacing: 0.5 },
  fieldText: { fontSize: 9, color: colors.dark, lineHeight: 1.45 },
  audioText: { fontSize: 9, color: colors.dark, lineHeight: 1.45, fontStyle: 'italic' },
  toc: { marginTop: 10 },
  tocRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 4, borderBottomWidth: 0.5, borderBottomColor: colors.muted },
  tocTitle: { fontSize: 10, color: colors.dark, flex: 1 },
  tocCount: { fontSize: 10, color: colors.gray },
  intro: { fontSize: 10, color: colors.dark, lineHeight: 1.5, marginBottom: 10 },
});

const txt = (s: string) => sanitizePdfText(s);

const VideoPromptsPDF: React.FC = () => {
  const totalClips = sections.reduce((n, s) => n + s.clips.length, 0);
  const today = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });

  return (
    <Document title="AI Promo Video Prompts" author="Aura Intercept">
      {/* Cover */}
      <Page size="A4" style={{ padding: 0 }}>
        <View style={styles.coverPage}>
          <View style={styles.coverBadge}><Text style={styles.coverBadgeText}>AURA INTERCEPT</Text></View>
          <Text style={styles.coverTitle}>AI Promo Video Prompts</Text>
          <Text style={styles.coverSubtitle}>
            {totalClips} prompts for Runway, Sora, Kling. Each ships with video prompt, 8s audio, and image prompt.
          </Text>
          <Text style={styles.coverMeta}>Generated {today}</Text>
        </View>
      </Page>

      {/* TOC + intro */}
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>AI Promo Video Prompts</Text>
          <Text style={styles.headerPage}>Overview</Text>
        </View>
        <Text style={styles.intro}>
          {totalClips} clips across {sections.length} sections. Runtime ~4:32. Use 0.5s dissolves within a console, 1s glitches between consoles.
        </Text>
        <Text style={styles.sectionTitle}>Contents</Text>
        <View style={styles.toc}>
          {sections.map((s, i) => (
            <View key={i} style={styles.tocRow}>
              <Text style={styles.tocTitle}>{txt(s.title)}</Text>
              <Text style={styles.tocCount}>{s.clips.length} clip{s.clips.length === 1 ? '' : 's'}</Text>
            </View>
          ))}
        </View>
      </Page>

      {/* Sections */}
      {sections.map((section, sIdx) => (
        <Page key={sIdx} size="A4" style={styles.page} wrap>
          <View style={styles.header} fixed>
            <Text style={styles.headerTitle}>AI Promo Video Prompts</Text>
            <Text style={styles.headerPage} render={({ pageNumber, totalPages }) => `${pageNumber} / ${totalPages}`} />
          </View>
          <Text style={styles.sectionTitle}>{txt(section.title)}</Text>
          <Text style={styles.sectionMeta}>{section.clips.length} clip{section.clips.length === 1 ? '' : 's'} - 8s each</Text>
          {section.clips.map((clip) => (
            <View key={clip.num} style={styles.clipCard} wrap={false}>
              <View style={styles.clipHeader}>
                <Text style={styles.clipNum}>#{clip.num}</Text>
                <Text style={styles.clipName}>{txt(clip.name)}</Text>
                <Text style={styles.clipDuration}>8s</Text>
              </View>
              <Text style={styles.fieldLabel}>Video Prompt</Text>
              <Text style={styles.fieldText}>{txt(clip.prompt)}</Text>
              <Text style={styles.fieldLabel}>Audio Script</Text>
              <Text style={styles.audioText}>{txt(clip.audioScript)}</Text>
              <Text style={styles.fieldLabel}>Graphic / Image Prompt</Text>
              <Text style={styles.fieldText}>{txt(clip.imagePrompt)}</Text>
            </View>
          ))}
        </Page>
      ))}
    </Document>
  );
};

export default VideoPromptsPDF;