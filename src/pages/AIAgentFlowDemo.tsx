import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Play, Pause, SkipForward, RotateCcw, Download, ChevronLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface AgentNode {
  id: string;
  label: string;
  emoji: string;
  color: string;
  x: number;
  y: number;
}

interface Connection {
  from: string;
  to: string;
  label: string;
}

interface Scene {
  id: string;
  title: string;
  narration: string;
  agents: AgentNode[];
  connections: Connection[];
  highlightAgents: string[];
  highlightConnections: number[];
}

// Console color palette (HSL)
const C = {
  customer: 'hsl(200, 80%, 50%)',
  customerDim: 'hsl(200, 60%, 40%)',
  field: 'hsl(150, 70%, 45%)',
  fieldDim: 'hsl(150, 50%, 35%)',
  business: 'hsl(270, 70%, 60%)',
  businessDim: 'hsl(270, 50%, 45%)',
  marketing: 'hsl(30, 80%, 55%)',
  marketingDim: 'hsl(30, 60%, 42%)',
  creative: 'hsl(280, 70%, 60%)',
  creativeDim: 'hsl(280, 50%, 45%)',
  analytics: 'hsl(190, 80%, 50%)',
  analyticsDim: 'hsl(190, 60%, 38%)',
  person: 'hsl(220, 70%, 55%)',
  benefit: 'hsl(260, 60%, 50%)',
};

const scenes: Scene[] = [
  // Scene 1 — Customer Reaches Out
  {
    id: 'scene-1',
    title: 'Customer Reaches Out',
    narration: 'A customer calls, chats, or texts your business. The AI Receptionist answers instantly — 24/7, no hold times, no missed calls. It greets visitors, understands their needs, and routes them to the right operative.',
    agents: [
      { id: 'customer', label: 'Customer', emoji: '👤', color: C.person, x: 15, y: 50 },
      { id: 'call', label: 'Phone Call', emoji: '📞', color: C.customerDim, x: 38, y: 20 },
      { id: 'chat', label: 'Live Chat', emoji: '💬', color: C.customerDim, x: 38, y: 50 },
      { id: 'sms', label: 'SMS Text', emoji: '📱', color: C.customerDim, x: 38, y: 80 },
      { id: 'triage', label: 'AI Receptionist', emoji: '🤖', color: C.customer, x: 72, y: 50 },
    ],
    connections: [
      { from: 'customer', to: 'call', label: '' },
      { from: 'customer', to: 'chat', label: '' },
      { from: 'customer', to: 'sms', label: '' },
      { from: 'call', to: 'triage', label: '' },
      { from: 'chat', to: 'triage', label: '' },
      { from: 'sms', to: 'triage', label: '' },
    ],
    highlightAgents: ['customer', 'call', 'chat', 'sms', 'triage'],
    highlightConnections: [0, 1, 2, 3, 4, 5],
  },

  // Scene 2 — Customer Portal Console
  {
    id: 'scene-2',
    title: 'Customer Portal Console',
    narration: 'The Customer Journey operative handles the full lifecycle: AI Receptionist qualifies requests, Scheduling books appointments with calendar sync, then Follow-up sends reminders and checks in after service, and Review collects Google/Yelp ratings — all in one unified operative.',
    agents: [
      { id: 'triage', label: 'AI Receptionist', emoji: '🤖', color: C.customer, x: 18, y: 50 },
      { id: 'customer_journey', label: 'Customer\nJourney', emoji: '🔄', color: C.customer, x: 52, y: 50 },
      { id: 'f1', label: 'Calendar Sync\n& Confirmations', emoji: '✅', color: C.customerDim, x: 82, y: 18 },
      { id: 'f2', label: 'SMS Reminders\n& Check-ins', emoji: '📱', color: C.customerDim, x: 82, y: 50 },
      { id: 'f3', label: 'Google / Yelp\nReview Links', emoji: '🌟', color: C.customerDim, x: 82, y: 82 },
    ],
    connections: [
      { from: 'triage', to: 'customer_journey', label: 'Route' },
      { from: 'customer_journey', to: 'f1', label: 'Book' },
      { from: 'customer_journey', to: 'f2', label: 'Remind' },
      { from: 'customer_journey', to: 'f3', label: 'Review' },
    ],
    highlightAgents: ['triage', 'customer_journey', 'f1', 'f2', 'f3'],
    highlightConnections: [0, 1, 2, 3],
  },

  // Scene 3 — Outreach & Sales Console
  {
    id: 'scene-3',
    title: 'Outreach & Sales Console',
    narration: 'The Outreach operative drives growth across the full funnel: lead scoring and qualification, email/SMS campaign creation, audience segmentation, promo codes, referral tracking, and win-back targeting — all unified in a single powerhouse operative.',
    agents: [
      { id: 'outreach', label: 'Outreach\nOperative', emoji: '📣', color: C.marketing, x: 25, y: 50 },
      { id: 'f1', label: 'Lead Scoring\n& Nurturing', emoji: '🎯', color: C.marketingDim, x: 58, y: 15 },
      { id: 'f2', label: 'Email / SMS\nCampaigns', emoji: '📧', color: C.marketingDim, x: 58, y: 40 },
      { id: 'f3', label: 'Promo Codes\n& Referrals', emoji: '🏷️', color: C.marketingDim, x: 58, y: 65 },
      { id: 'f4', label: 'Win-Back\nTargeting', emoji: '🔄', color: C.marketingDim, x: 58, y: 88 },
    ],
    connections: [
      { from: 'outreach', to: 'f1', label: '' },
      { from: 'outreach', to: 'f2', label: '' },
      { from: 'outreach', to: 'f3', label: '' },
      { from: 'outreach', to: 'f4', label: '' },
    ],
    highlightAgents: ['outreach', 'f1', 'f2', 'f3', 'f4'],
    highlightConnections: [0, 1, 2, 3],
  },

  // Scene 4 — Creative & Web Presence Console
  {
    id: 'scene-4',
    title: 'Creative & Web Presence',
    narration: 'Two operatives cover all content and web: Creative Content generates on-brand copy for social, email, blog, and SMS — for Instagram, Facebook, LinkedIn, TikTok, Google Business, and more. Web Presence manages SEO optimization, blog publishing, and site performance.',
    agents: [
      { id: 'creative_content', label: 'Creative\nContent', emoji: '🎨', color: C.creative, x: 25, y: 35 },
      { id: 'web_presence', label: 'Web Presence', emoji: '🌐', color: C.creative, x: 25, y: 70 },
      { id: 'f1', label: 'Social Media\nContent', emoji: '📱', color: C.creativeDim, x: 60, y: 12 },
      { id: 'f2', label: 'Email / SMS\nCopy', emoji: '📧', color: C.creativeDim, x: 60, y: 35 },
      { id: 'f3', label: 'Blog Posts', emoji: '📝', color: C.creativeDim, x: 60, y: 58 },
      { id: 'f4', label: 'SEO\nOptimization', emoji: '🔍', color: C.creativeDim, x: 60, y: 80 },
      { id: 'f5', label: 'Auto-Publish\n& Monitor', emoji: '🚀', color: C.creativeDim, x: 85, y: 70 },
    ],
    connections: [
      { from: 'creative_content', to: 'f1', label: '' },
      { from: 'creative_content', to: 'f2', label: '' },
      { from: 'creative_content', to: 'f3', label: '' },
      { from: 'web_presence', to: 'f3', label: 'Publish' },
      { from: 'web_presence', to: 'f4', label: '' },
      { from: 'web_presence', to: 'f5', label: '' },
      { from: 'creative_content', to: 'web_presence', label: 'Content' },
    ],
    highlightAgents: ['creative_content', 'web_presence', 'f1', 'f2', 'f3', 'f4', 'f5'],
    highlightConnections: [0, 1, 2, 3, 4, 5, 6],
  },

  // Scene 5 — Field Operations Console
  {
    id: 'scene-5',
    title: 'Field Operations Console',
    narration: 'Two operatives optimize all field work: Dispatch assigns technicians by skills, proximity, and workload. Field Navigation combines route planning, traffic-aware driving paths, real-time ETA updates, arrival check-ins, and job progress logging — all unified for maximum efficiency.',
    agents: [
      { id: 'dispatch', label: 'Dispatch', emoji: '🚛', color: C.field, x: 20, y: 50 },
      { id: 'field_navigation', label: 'Field\nNavigation', emoji: '🗺️', color: C.field, x: 55, y: 50 },
      { id: 'f1', label: 'Skills-Based\nAssignment', emoji: '🎯', color: C.fieldDim, x: 20, y: 15 },
      { id: 'f2', label: 'Traffic-Aware\nRouting', emoji: '🛣️', color: C.fieldDim, x: 82, y: 20 },
      { id: 'f3', label: 'Real-Time\nETA Updates', emoji: '📱', color: C.fieldDim, x: 82, y: 50 },
      { id: 'f4', label: 'Job Progress\nLogging', emoji: '✅', color: C.fieldDim, x: 82, y: 80 },
    ],
    connections: [
      { from: 'dispatch', to: 'f1', label: '' },
      { from: 'dispatch', to: 'field_navigation', label: 'Route' },
      { from: 'field_navigation', to: 'f2', label: '' },
      { from: 'field_navigation', to: 'f3', label: '' },
      { from: 'field_navigation', to: 'f4', label: '' },
    ],
    highlightAgents: ['dispatch', 'field_navigation', 'f1', 'f2', 'f3', 'f4'],
    highlightConnections: [0, 1, 2, 3, 4],
  },

  // Scene 6 — Business Operations Console
  {
    id: 'scene-6',
    title: 'Business Operations Console',
    narration: 'Two operatives run the back office: Business Finance unifies quoting, invoicing, and inventory — creating multi-line estimates, generating bills, tracking payments, and monitoring stock with low-supply alerts. Admin manages settings, users, and all operations.',
    agents: [
      { id: 'admin', label: 'Admin', emoji: '⚙️', color: C.business, x: 50, y: 50 },
      { id: 'business_finance', label: 'Business\nFinance', emoji: '💰', color: C.business, x: 20, y: 50 },
      { id: 'f1', label: 'Multi-Line\nEstimates', emoji: '📋', color: C.businessDim, x: 50, y: 15 },
      { id: 'f2', label: 'Payment\nTracking', emoji: '💳', color: C.businessDim, x: 82, y: 30 },
      { id: 'f3', label: 'Low-Stock\nAlerts', emoji: '🔔', color: C.businessDim, x: 50, y: 85 },
    ],
    connections: [
      { from: 'business_finance', to: 'f1', label: 'Quote' },
      { from: 'business_finance', to: 'f2', label: 'Invoice' },
      { from: 'business_finance', to: 'f3', label: 'Stock' },
      { from: 'admin', to: 'business_finance', label: 'Config' },
    ],
    highlightAgents: ['admin', 'business_finance', 'f1', 'f2', 'f3'],
    highlightConnections: [0, 1, 2, 3],
  },

  // Scene 7 — Analytics & Reports Console
  {
    id: 'scene-7',
    title: 'Analytics & Reports Console',
    narration: 'The Analytics Intelligence operative delivers full business intelligence: natural language queries, KPI dashboards, revenue analysis by service and technician, financial trend tracking, demand forecasting, and seasonal resource planning — all in one command.',
    agents: [
      { id: 'analytics_intelligence', label: 'Analytics\nIntelligence', emoji: '💡', color: C.analytics, x: 30, y: 50 },
      { id: 'f1', label: 'Natural Language\nQueries', emoji: '🗣️', color: C.analyticsDim, x: 70, y: 15 },
      { id: 'f2', label: 'KPI\nDashboards', emoji: '📊', color: C.analyticsDim, x: 70, y: 38 },
      { id: 'f3', label: 'Revenue\nTrends', emoji: '📈', color: C.analyticsDim, x: 70, y: 62 },
      { id: 'f4', label: 'Demand\nPrediction', emoji: '🔮', color: C.analyticsDim, x: 70, y: 85 },
    ],
    connections: [
      { from: 'analytics_intelligence', to: 'f1', label: '' },
      { from: 'analytics_intelligence', to: 'f2', label: '' },
      { from: 'analytics_intelligence', to: 'f3', label: '' },
      { from: 'analytics_intelligence', to: 'f4', label: '' },
    ],
    highlightAgents: ['analytics_intelligence', 'f1', 'f2', 'f3', 'f4'],
    highlightConnections: [0, 1, 2, 3],
  },

  // Scene 8 — Cross-Console Handoffs
  {
    id: 'scene-8',
    title: 'Intelligent Cross-Console Handoffs',
    narration: 'Operatives communicate automatically across consoles. Customer Journey triggers Dispatch on booking. Field Navigation feeds Business Finance on job completion. Outreach activates Analytics Intelligence for performance insights. Every action triggers the next.',
    agents: [
      { id: 'triage', label: 'AI\nReceptionist', emoji: '🤖', color: C.customer, x: 12, y: 25 },
      { id: 'customer_journey', label: 'Customer\nJourney', emoji: '🔄', color: C.customer, x: 30, y: 25 },
      { id: 'dispatch', label: 'Dispatch', emoji: '🚛', color: C.field, x: 55, y: 25 },
      { id: 'field_navigation', label: 'Field\nNavigation', emoji: '🗺️', color: C.field, x: 78, y: 25 },
      { id: 'business_finance', label: 'Business\nFinance', emoji: '💰', color: C.business, x: 78, y: 65 },
      { id: 'outreach', label: 'Outreach', emoji: '📣', color: C.marketing, x: 30, y: 65 },
      { id: 'analytics_intelligence', label: 'Analytics\nIntelligence', emoji: '💡', color: C.analytics, x: 55, y: 65 },
      { id: 'admin', label: 'Admin', emoji: '⚙️', color: C.business, x: 12, y: 65 },
    ],
    connections: [
      { from: 'triage', to: 'customer_journey', label: 'Route' },
      { from: 'customer_journey', to: 'dispatch', label: 'Book → Assign' },
      { from: 'dispatch', to: 'field_navigation', label: 'Deploy' },
      { from: 'field_navigation', to: 'business_finance', label: 'Complete → Invoice' },
      { from: 'business_finance', to: 'analytics_intelligence', label: 'Revenue Data' },
      { from: 'outreach', to: 'analytics_intelligence', label: 'Campaign Data' },
      { from: 'customer_journey', to: 'outreach', label: 'Post-Service' },
      { from: 'admin', to: 'business_finance', label: 'Config' },
    ],
    highlightAgents: ['triage', 'customer_journey', 'dispatch', 'field_navigation', 'business_finance', 'outreach', 'analytics_intelligence', 'admin'],
    highlightConnections: [0, 1, 2, 3, 4, 5, 6, 7],
  },

  // Scene 9 — The Full Network
  {
    id: 'scene-9',
    title: 'The Full Aura Network',
    narration: 'All 24 Smart AI Agents work as one intelligent network across 7 consoles. AI Receptionist and Triage form the entry point. Customer Journey, Field Navigation, Business Finance, and Analytics Intelligence handle the core. Outreach, Creative Content, Web Presence, and Admin complete the ecosystem.',
    agents: [
      // Customer Portal (top-left)
      { id: 'triage', label: 'AI\nReceptionist', emoji: '🤖', color: C.customer, x: 12, y: 20 },
      { id: 'customer_journey', label: 'Customer\nJourney', emoji: '🔄', color: C.customer, x: 28, y: 20 },
      // Outreach (top-center)
      { id: 'outreach', label: 'Outreach', emoji: '📣', color: C.marketing, x: 50, y: 12 },
      // Creative (top-right)
      { id: 'creative_content', label: 'Creative\nContent', emoji: '🎨', color: C.creative, x: 72, y: 12 },
      { id: 'web_presence', label: 'Web\nPresence', emoji: '🌐', color: C.creative, x: 88, y: 20 },
      // Field Ops (middle-right)
      { id: 'dispatch', label: 'Dispatch', emoji: '🚛', color: C.field, x: 78, y: 48 },
      { id: 'field_navigation', label: 'Field\nNavigation', emoji: '🗺️', color: C.field, x: 90, y: 62 },
      // Business Ops (bottom)
      { id: 'admin', label: 'Admin', emoji: '⚙️', color: C.business, x: 12, y: 78 },
      { id: 'business_finance', label: 'Business\nFinance', emoji: '💰', color: C.business, x: 30, y: 78 },
      // Analytics (bottom-right)
      { id: 'analytics_intelligence', label: 'Analytics\nIntelligence', emoji: '💡', color: C.analytics, x: 65, y: 80 },
    ],
    connections: [
      // Customer Portal
      { from: 'triage', to: 'customer_journey', label: '' },
      // Customer → Field
      { from: 'customer_journey', to: 'dispatch', label: '' },
      // Customer → Outreach
      { from: 'customer_journey', to: 'outreach', label: '' },
      // Outreach → Creative
      { from: 'outreach', to: 'creative_content', label: '' },
      // Creative → Web
      { from: 'creative_content', to: 'web_presence', label: '' },
      // Field internal
      { from: 'dispatch', to: 'field_navigation', label: '' },
      // Field → Business Finance
      { from: 'field_navigation', to: 'business_finance', label: '' },
      // Business → Analytics
      { from: 'business_finance', to: 'analytics_intelligence', label: '' },
      // Admin ties it together
      { from: 'admin', to: 'business_finance', label: '' },
      // Outreach → Analytics
      { from: 'outreach', to: 'analytics_intelligence', label: '' },
    ],
    highlightAgents: ['triage', 'customer_journey', 'outreach', 'creative_content', 'web_presence', 'dispatch', 'field_navigation', 'admin', 'business_finance', 'analytics_intelligence'],
    highlightConnections: [0,1,2,3,4,5,6,7,8,9],
  },

  // Scene 10 — Everyone Benefits
  {
    id: 'scene-10',
    title: 'Everyone Benefits',
    narration: 'With 24 Smart AI Agents across 7 consoles, the company gets 24/7 coverage with zero missed leads. Customers get instant, professional service across every channel. Employees receive pre-qualified jobs with clear instructions.',
    agents: [
      { id: 'company', label: 'Company', emoji: '🏢', color: C.benefit, x: 50, y: 15 },
      { id: 'b1', label: '24/7 Coverage\n24 AI Agents', emoji: '🌙', color: 'hsl(260, 50%, 42%)', x: 15, y: 12 },
      { id: 'b2', label: 'Automated\n7 Consoles', emoji: '⚡', color: 'hsl(260, 50%, 42%)', x: 85, y: 12 },
      { id: 'customer', label: 'Customer', emoji: '👤', color: C.person, x: 50, y: 50 },
      { id: 'b3', label: 'Instant Service\nEvery Channel', emoji: '🚀', color: 'hsl(220, 50%, 42%)', x: 15, y: 50 },
      { id: 'b4', label: 'Real-Time\nTracking & ETA', emoji: '📊', color: 'hsl(220, 50%, 42%)', x: 85, y: 50 },
      { id: 'employee', label: 'Employee', emoji: '👷', color: C.field, x: 50, y: 85 },
      { id: 'b5', label: 'Pre-Qualified\nJobs & Routes', emoji: '✅', color: C.fieldDim, x: 15, y: 85 },
      { id: 'b6', label: 'AI-Powered\nSchedule & Tools', emoji: '🗺️', color: C.fieldDim, x: 85, y: 85 },
    ],
    connections: [
      { from: 'b1', to: 'company', label: '' },
      { from: 'company', to: 'b2', label: '' },
      { from: 'b3', to: 'customer', label: '' },
      { from: 'customer', to: 'b4', label: '' },
      { from: 'b5', to: 'employee', label: '' },
      { from: 'employee', to: 'b6', label: '' },
    ],
    highlightAgents: ['company', 'customer', 'employee', 'b1', 'b2', 'b3', 'b4', 'b5', 'b6'],
    highlightConnections: [0, 1, 2, 3, 4, 5],
  },
];

function AgentCard({ agent, isHighlighted, delay }: { agent: AgentNode; isHighlighted: boolean; delay: number }) {
  // Position so the icon center (28px from top = half of 56px icon) sits exactly at the coordinate point.
  // This ensures SVG lines connect directly to the icon center.
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.7 }}
      animate={{ opacity: isHighlighted ? 1 : 0.3, scale: isHighlighted ? 1 : 0.85 }}
      transition={{ duration: 0.5, delay }}
      className="absolute flex flex-col items-center"
      style={{
        left: `${agent.x}%`,
        top: `${agent.y}%`,
        transform: 'translate(-50%, -28px)',
      }}
    >
      <motion.div
        animate={isHighlighted ? { boxShadow: `0 0 30px ${agent.color}40` } : {}}
        className="w-14 h-14 rounded-2xl flex items-center justify-center text-xl border-2"
        style={{
          backgroundColor: `${agent.color}20`,
          borderColor: isHighlighted ? agent.color : 'transparent',
        }}
      >
        {agent.emoji}
      </motion.div>
      <p className="mt-1 text-[10px] font-semibold text-center max-w-[100px] leading-tight whitespace-pre-line" style={{ color: agent.color }}>
        {agent.label}
      </p>
    </motion.div>
  );
}


export default function AIAgentFlowDemo() {
  const [currentScene, setCurrentScene] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const navigate = useNavigate();

  const scene = scenes[currentScene];

  // Auto-play timer
  useEffect(() => {
    if (!isPlaying) return;
    const timer = setTimeout(() => {
      if (currentScene < scenes.length - 1) {
        setCurrentScene(prev => prev + 1);
      } else {
        setIsPlaying(false);
      }
    }, 8000);
    return () => clearTimeout(timer);
  }, [isPlaying, currentScene]);

  const handleNext = useCallback(() => {
    if (currentScene < scenes.length - 1) setCurrentScene(prev => prev + 1);
  }, [currentScene]);

  const handleRestart = useCallback(() => {
    setCurrentScene(0);
    setIsPlaying(false);
  }, []);

  const downloadScript = useCallback(() => {
    const header = '=== AURA INTELLIGENCE NETWORK — AGENT FLOW DEMO SCRIPT ===\n24 Smart AI Agents across 7 Consoles\n\n';
    const script = scenes.map((s, i) =>
      `Scene ${i + 1}: ${s.title}\n${'─'.repeat(40)}\n${s.narration}\nAgents: ${s.agents.map(a => a.label.replace(/\n/g, ' ')).join(', ')}\n`
    ).join('\n---\n\n');
    const blob = new Blob([header + script], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'aura-ai-agent-flow-script.txt';
    a.click();
    URL.revokeObjectURL(url);
  }, []);

  return (
    <div className="min-h-screen bg-[#0a0e1a] text-white flex flex-col">
      {/* Top bar */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-white/10">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={() => navigate('/dashboard')} className="text-white/70 hover:text-white">
            <ChevronLeft className="w-4 h-4 mr-1" /> Back
          </Button>
          <h1 className="text-lg font-bold bg-gradient-to-r from-primary to-purple-400 bg-clip-text text-transparent">
            Aura Intelligence Network — Agent Flow Demo
          </h1>
        </div>
        <Button variant="outline" size="sm" onClick={downloadScript} className="border-white/20 text-white hover:text-white bg-white/10 hover:bg-white/20">
          <Download className="w-4 h-4 mr-1" /> <span className="text-white">Script</span>
        </Button>
      </div>

      {/* Main content - 16:9 aspect ratio */}
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-[1200px] aspect-video relative rounded-2xl border border-white/10 bg-[#0d1220] overflow-hidden">
          {/* Scene title */}
          <AnimatePresence mode="wait">
            <motion.div
              key={scene.id + '-title'}
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="absolute top-4 left-0 right-0 text-center z-10"
            >
              <span className="text-xs uppercase tracking-widest text-primary/70 font-medium">
                Scene {currentScene + 1} of {scenes.length}
              </span>
              <h2 className="text-2xl font-bold mt-1">{scene.title}</h2>
            </motion.div>
          </AnimatePresence>

          {/* Agent flow area */}
          <div className="absolute left-0 right-0 top-[16%] bottom-[20%]">
            <svg className="absolute inset-0 w-full h-full pointer-events-none overflow-visible">
              <AnimatePresence>
                {scene.connections.map((conn, i) => {
                  const fromAgent = scene.agents.find(a => a.id === conn.from);
                  const toAgent = scene.agents.find(a => a.id === conn.to);
                  if (!fromAgent || !toAgent) return null;
                  const isHighlighted = scene.highlightConnections.includes(i);
                  return (
                    <motion.line
                      key={`${scene.id}-conn-${i}`}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: isHighlighted ? 0.7 : 0.15 }}
                      transition={{ duration: 0.6, delay: i * 0.1 }}
                      x1={`${fromAgent.x}%`}
                      y1={`${fromAgent.y}%`}
                      x2={`${toAgent.x}%`}
                      y2={`${toAgent.y}%`}
                      stroke="hsl(var(--primary))"
                      strokeWidth="2"
                      strokeDasharray="6 4"
                    />
                  );
                })}
              </AnimatePresence>
            </svg>

            <AnimatePresence>
              {scene.agents.map((agent, i) => (
                <AgentCard
                  key={`${scene.id}-agent-${agent.id}`}
                  agent={agent}
                  isHighlighted={scene.highlightAgents.includes(agent.id)}
                  delay={i * 0.06}
                />
              ))}
            </AnimatePresence>
          </div>

          {/* Narration bar */}
          <AnimatePresence mode="wait">
            <motion.div
              key={scene.id + '-narration'}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              className="absolute bottom-4 left-0 right-0 px-8 z-10"
            >
              <p className="text-sm text-white/80 text-center max-w-2xl mx-auto leading-relaxed">
                {scene.narration}
              </p>
            </motion.div>
          </AnimatePresence>

          {/* Scene progress dots */}
          <div className="absolute bottom-1 left-0 right-0 flex justify-center gap-1.5 z-10">
            {scenes.map((_, i) => (
              <button
                key={i}
                onClick={() => setCurrentScene(i)}
                className={`w-2 h-2 rounded-full transition-all ${
                  i === currentScene ? 'bg-primary w-5' : 'bg-white/30 hover:bg-white/50'
                }`}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="flex items-center justify-center gap-3 pb-6">
        <Button variant="outline" size="sm" onClick={handleRestart} className="border-white/20 bg-white/10 text-white hover:bg-white/20">
          <RotateCcw className="w-4 h-4 mr-1" /> Restart
        </Button>
        <Button
          size="sm"
          onClick={() => setIsPlaying(!isPlaying)}
          className="gradient-primary min-w-[120px]"
        >
          {isPlaying ? <><Pause className="w-4 h-4 mr-1" /> Pause</> : <><Play className="w-4 h-4 mr-1" /> Auto-Play</>}
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={handleNext}
          disabled={currentScene >= scenes.length - 1}
          className="border-white/20 bg-white/10 text-white hover:bg-white/20 disabled:text-white/30"
        >
          Next <SkipForward className="w-4 h-4 ml-1" />
        </Button>
      </div>
    </div>
  );
}
