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
  social: 'hsl(330, 70%, 55%)',
  socialDim: 'hsl(330, 50%, 42%)',
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
    narration: 'A customer calls, chats, or texts your business. The AI Receptionist answers instantly — 24/7, no hold times, no missed calls. It greets visitors, understands their needs, and routes them to the right agent.',
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
    narration: '4 agents power your customer portal: AI Receptionist qualifies requests, Scheduling books appointments with calendar sync, Follow-up sends reminders and checks in after service, and Review collects Google/Yelp ratings.',
    agents: [
      { id: 'triage', label: 'AI Receptionist', emoji: '🤖', color: C.customer, x: 20, y: 50 },
      { id: 'booking', label: 'Scheduling', emoji: '📅', color: C.customer, x: 55, y: 18 },
      { id: 'followup', label: 'Follow-up', emoji: '📋', color: C.customer, x: 55, y: 50 },
      { id: 'review', label: 'Review', emoji: '⭐', color: C.customer, x: 55, y: 82 },
      { id: 'f1', label: 'Calendar Sync\n& Confirmations', emoji: '✅', color: C.customerDim, x: 85, y: 18 },
      { id: 'f2', label: 'SMS Reminders\n& Check-ins', emoji: '📱', color: C.customerDim, x: 85, y: 50 },
      { id: 'f3', label: 'Google / Yelp\nReview Links', emoji: '🌟', color: C.customerDim, x: 85, y: 82 },
    ],
    connections: [
      { from: 'triage', to: 'booking', label: 'Schedule' },
      { from: 'triage', to: 'followup', label: 'Check-in' },
      { from: 'followup', to: 'review', label: 'After Service' },
      { from: 'booking', to: 'f1', label: '' },
      { from: 'followup', to: 'f2', label: '' },
      { from: 'review', to: 'f3', label: '' },
    ],
    highlightAgents: ['triage', 'booking', 'followup', 'review', 'f1', 'f2', 'f3'],
    highlightConnections: [0, 1, 2, 3, 4, 5],
  },

  // Scene 3 — Outreach & Sales Console
  {
    id: 'scene-3',
    title: 'Outreach & Sales Console',
    narration: '3 agents drive growth: Campaign creates and sends email/SMS outreach, Lead qualifies and scores prospects with automated nurturing, and Marketing manages segments, promo codes, referral tracking, and win-back targeting.',
    agents: [
      { id: 'campaign', label: 'Campaign', emoji: '📣', color: C.marketing, x: 25, y: 20 },
      { id: 'lead', label: 'Lead', emoji: '🎯', color: C.marketing, x: 25, y: 50 },
      { id: 'marketing_ag', label: 'Marketing', emoji: '📊', color: C.marketing, x: 25, y: 80 },
      { id: 'f1', label: 'Email / SMS\nCampaigns', emoji: '📧', color: C.marketingDim, x: 58, y: 15 },
      { id: 'f2', label: 'Lead Scoring\n& Nurturing', emoji: '🔥', color: C.marketingDim, x: 58, y: 42 },
      { id: 'f3', label: 'Promo Codes\n& Referrals', emoji: '🏷️', color: C.marketingDim, x: 58, y: 70 },
      { id: 'f4', label: 'Win-Back\nTargeting', emoji: '🔄', color: C.marketingDim, x: 85, y: 50 },
    ],
    connections: [
      { from: 'campaign', to: 'f1', label: '' },
      { from: 'lead', to: 'f2', label: '' },
      { from: 'marketing_ag', to: 'f3', label: '' },
      { from: 'marketing_ag', to: 'f4', label: '' },
      { from: 'lead', to: 'campaign', label: 'Qualified' },
    ],
    highlightAgents: ['campaign', 'lead', 'marketing_ag', 'f1', 'f2', 'f3', 'f4'],
    highlightConnections: [0, 1, 2, 3, 4],
  },

  // Scene 4 — Social Media Console
  {
    id: 'scene-4',
    title: 'Social Media Console',
    narration: '3 agents manage your social presence: Social Media Agent creates posts for Instagram, Facebook, LinkedIn, TikTok, Google Business & SMS. Scheduler queues the content calendar. Analytics tracks engagement and audience growth.',
    agents: [
      { id: 'social_content', label: 'Social Media\nAgent', emoji: '✍️', color: C.social, x: 20, y: 50 },
      { id: 'social_scheduler', label: 'Scheduler', emoji: '🗓️', color: C.social, x: 50, y: 22 },
      { id: 'social_analytics', label: 'Analytics', emoji: '📈', color: C.social, x: 50, y: 78 },
      { id: 'ig', label: 'Instagram', emoji: '📸', color: C.socialDim, x: 80, y: 12 },
      { id: 'fb', label: 'Facebook', emoji: '👍', color: C.socialDim, x: 80, y: 32 },
      { id: 'li', label: 'LinkedIn', emoji: '💼', color: C.socialDim, x: 80, y: 52 },
      { id: 'tt', label: 'TikTok', emoji: '🎵', color: C.socialDim, x: 80, y: 72 },
      { id: 'gmb', label: 'Google Biz', emoji: '📍', color: C.socialDim, x: 80, y: 90 },
    ],
    connections: [
      { from: 'social_content', to: 'social_scheduler', label: 'Content' },
      { from: 'social_content', to: 'social_analytics', label: 'Metrics' },
      { from: 'social_scheduler', to: 'ig', label: '' },
      { from: 'social_scheduler', to: 'fb', label: '' },
      { from: 'social_scheduler', to: 'li', label: '' },
      { from: 'social_scheduler', to: 'tt', label: '' },
      { from: 'social_scheduler', to: 'gmb', label: '' },
    ],
    highlightAgents: ['social_content', 'social_scheduler', 'social_analytics', 'ig', 'fb', 'li', 'tt', 'gmb'],
    highlightConnections: [0, 1, 2, 3, 4, 5, 6],
  },

  // Scene 5 — Creative & Web Presence Console
  {
    id: 'scene-5',
    title: 'Creative & Web Presence',
    narration: '2 agents handle content and web: Creative generates on-brand content for all channels — social, email, blog, and lead nurturing with consistent voice. Web Presence manages SEO optimization, blog publishing, and site performance.',
    agents: [
      { id: 'creative', label: 'Creative Agent', emoji: '🎨', color: C.creative, x: 25, y: 35 },
      { id: 'web_presence', label: 'Web Presence', emoji: '🌐', color: C.creative, x: 25, y: 70 },
      { id: 'f1', label: 'Social Media\nContent', emoji: '📱', color: C.creativeDim, x: 60, y: 12 },
      { id: 'f2', label: 'Email / SMS\nCopy', emoji: '📧', color: C.creativeDim, x: 60, y: 35 },
      { id: 'f3', label: 'Blog Posts', emoji: '📝', color: C.creativeDim, x: 60, y: 58 },
      { id: 'f4', label: 'SEO\nOptimization', emoji: '🔍', color: C.creativeDim, x: 60, y: 82 },
      { id: 'f5', label: 'Auto-Publish\n& Monitor', emoji: '🚀', color: C.creativeDim, x: 85, y: 70 },
    ],
    connections: [
      { from: 'creative', to: 'f1', label: '' },
      { from: 'creative', to: 'f2', label: '' },
      { from: 'creative', to: 'f3', label: '' },
      { from: 'web_presence', to: 'f4', label: '' },
      { from: 'web_presence', to: 'f5', label: '' },
      { from: 'creative', to: 'web_presence', label: 'Content' },
    ],
    highlightAgents: ['creative', 'web_presence', 'f1', 'f2', 'f3', 'f4', 'f5'],
    highlightConnections: [0, 1, 2, 3, 4, 5],
  },

  // Scene 6 — Field Operations Console
  {
    id: 'scene-6',
    title: 'Field Operations Console',
    narration: '4 agents optimize field work: Dispatch assigns technicians by skills, proximity & workload. Route plans traffic-aware driving paths. ETA calculates and updates arrival times for customers. Check-in logs arrivals and job progress.',
    agents: [
      { id: 'dispatch', label: 'Dispatch', emoji: '🚛', color: C.field, x: 18, y: 50 },
      { id: 'route', label: 'Route', emoji: '🗺️', color: C.field, x: 45, y: 20 },
      { id: 'eta', label: 'ETA', emoji: '⏱️', color: C.field, x: 45, y: 80 },
      { id: 'checkin', label: 'Check-in', emoji: '📍', color: C.field, x: 72, y: 50 },
      { id: 'f1', label: 'Skills-Based\nAssignment', emoji: '🎯', color: C.fieldDim, x: 18, y: 15 },
      { id: 'f2', label: 'Traffic-Aware\nRouting', emoji: '🛣️', color: C.fieldDim, x: 72, y: 20 },
      { id: 'f3', label: 'Real-Time\nETA Updates', emoji: '📱', color: C.fieldDim, x: 72, y: 80 },
      { id: 'f4', label: 'Job Progress\nLogging', emoji: '✅', color: C.fieldDim, x: 92, y: 50 },
    ],
    connections: [
      { from: 'dispatch', to: 'route', label: 'Optimize' },
      { from: 'dispatch', to: 'eta', label: 'Calculate' },
      { from: 'dispatch', to: 'checkin', label: 'Track' },
      { from: 'route', to: 'f2', label: '' },
      { from: 'eta', to: 'f3', label: '' },
      { from: 'checkin', to: 'f4', label: '' },
    ],
    highlightAgents: ['dispatch', 'route', 'eta', 'checkin', 'f1', 'f2', 'f3', 'f4'],
    highlightConnections: [0, 1, 2, 3, 4, 5],
  },

  // Scene 7 — Business Operations Console
  {
    id: 'scene-7',
    title: 'Business Operations Console',
    narration: '4 agents run the back office: Quoting creates multi-line estimates. Invoice generates bills and tracks payments. Inventory monitors stock and alerts on low supplies. Admin manages settings, users, and operations.',
    agents: [
      { id: 'admin', label: 'Admin', emoji: '⚙️', color: C.business, x: 50, y: 50 },
      { id: 'quoting', label: 'Quoting', emoji: '💰', color: C.business, x: 18, y: 20 },
      { id: 'invoice', label: 'Invoice', emoji: '🧾', color: C.business, x: 82, y: 20 },
      { id: 'inventory', label: 'Inventory', emoji: '📦', color: C.business, x: 18, y: 82 },
      { id: 'f1', label: 'Multi-Line\nEstimates', emoji: '📋', color: C.businessDim, x: 50, y: 15 },
      { id: 'f2', label: 'Payment\nTracking', emoji: '💳', color: C.businessDim, x: 82, y: 50 },
      { id: 'f3', label: 'Low-Stock\nAlerts', emoji: '🔔', color: C.businessDim, x: 50, y: 85 },
    ],
    connections: [
      { from: 'quoting', to: 'f1', label: '' },
      { from: 'quoting', to: 'invoice', label: 'Approved' },
      { from: 'invoice', to: 'f2', label: '' },
      { from: 'inventory', to: 'f3', label: '' },
      { from: 'admin', to: 'quoting', label: '' },
      { from: 'admin', to: 'invoice', label: '' },
      { from: 'admin', to: 'inventory', label: '' },
    ],
    highlightAgents: ['admin', 'quoting', 'invoice', 'inventory', 'f1', 'f2', 'f3'],
    highlightConnections: [0, 1, 2, 3, 4, 5, 6],
  },

  // Scene 8 — Analytics & Reports Console
  {
    id: 'scene-8',
    title: 'Analytics & Reports Console',
    narration: '4 agents deliver business intelligence: Insights answers questions in natural language. Performance tracks KPIs and efficiency. Revenue analyzes financial trends by service, technician, and period. Forecast predicts demand and staffing needs.',
    agents: [
      { id: 'insights', label: 'Insights', emoji: '💡', color: C.analytics, x: 20, y: 25 },
      { id: 'performance', label: 'Performance', emoji: '📊', color: C.analytics, x: 80, y: 25 },
      { id: 'revenue', label: 'Revenue', emoji: '💵', color: C.analytics, x: 20, y: 75 },
      { id: 'forecast', label: 'Forecast', emoji: '🔮', color: C.analytics, x: 80, y: 75 },
      { id: 'f1', label: 'Natural Language\nQueries', emoji: '🗣️', color: C.analyticsDim, x: 50, y: 12 },
      { id: 'f2', label: 'KPI\nDashboards', emoji: '📈', color: C.analyticsDim, x: 50, y: 42 },
      { id: 'f3', label: 'Revenue\nTrends', emoji: '📉', color: C.analyticsDim, x: 50, y: 60 },
      { id: 'f4', label: 'Demand\nPrediction', emoji: '🎯', color: C.analyticsDim, x: 50, y: 88 },
    ],
    connections: [
      { from: 'insights', to: 'f1', label: '' },
      { from: 'performance', to: 'f2', label: '' },
      { from: 'revenue', to: 'f3', label: '' },
      { from: 'forecast', to: 'f4', label: '' },
      { from: 'insights', to: 'performance', label: '' },
      { from: 'revenue', to: 'forecast', label: '' },
    ],
    highlightAgents: ['insights', 'performance', 'revenue', 'forecast', 'f1', 'f2', 'f3', 'f4'],
    highlightConnections: [0, 1, 2, 3, 4, 5],
  },

  // Scene 9 — The Full Network
  {
    id: 'scene-9',
    title: 'The Full Aura Network',
    narration: 'All 24 AI operatives work as one intelligent network across 7 consoles. Cross-console handoffs happen automatically — Follow-up triggers Review, Review triggers Campaign, Dispatch feeds Check-in, Quoting flows to Invoice.',
    agents: [
      // Customer Portal (top-left cluster)
      { id: 'triage', label: 'Receptionist', emoji: '🤖', color: C.customer, x: 12, y: 15 },
      { id: 'booking', label: 'Scheduling', emoji: '📅', color: C.customer, x: 25, y: 10 },
      { id: 'followup', label: 'Follow-up', emoji: '📋', color: C.customer, x: 25, y: 25 },
      { id: 'review', label: 'Review', emoji: '⭐', color: C.customer, x: 12, y: 30 },
      // Outreach (top-center)
      { id: 'campaign', label: 'Campaign', emoji: '📣', color: C.marketing, x: 42, y: 10 },
      { id: 'lead', label: 'Lead', emoji: '🎯', color: C.marketing, x: 55, y: 10 },
      { id: 'marketing_ag', label: 'Marketing', emoji: '📊', color: C.marketing, x: 48, y: 25 },
      // Social (top-right)
      { id: 'social_content', label: 'Social', emoji: '✍️', color: C.social, x: 72, y: 10 },
      { id: 'social_scheduler', label: 'Scheduler', emoji: '🗓️', color: C.social, x: 85, y: 10 },
      { id: 'social_analytics', label: 'Social Analytics', emoji: '📈', color: C.social, x: 78, y: 25 },
      // Creative (middle-left)
      { id: 'creative', label: 'Creative', emoji: '🎨', color: C.creative, x: 10, y: 52 },
      { id: 'web_presence', label: 'Web Presence', emoji: '🌐', color: C.creative, x: 25, y: 52 },
      // Field Ops (middle-right)
      { id: 'dispatch', label: 'Dispatch', emoji: '🚛', color: C.field, x: 72, y: 48 },
      { id: 'route_ag', label: 'Route', emoji: '🗺️', color: C.field, x: 85, y: 42 },
      { id: 'eta', label: 'ETA', emoji: '⏱️', color: C.field, x: 85, y: 58 },
      { id: 'checkin', label: 'Check-in', emoji: '📍', color: C.field, x: 72, y: 62 },
      // Business Ops (bottom-left)
      { id: 'admin', label: 'Admin', emoji: '⚙️', color: C.business, x: 12, y: 78 },
      { id: 'quoting', label: 'Quoting', emoji: '💰', color: C.business, x: 25, y: 72 },
      { id: 'invoice_ag', label: 'Invoice', emoji: '🧾', color: C.business, x: 25, y: 88 },
      { id: 'inventory', label: 'Inventory', emoji: '📦', color: C.business, x: 12, y: 92 },
      // Analytics (bottom-right)
      { id: 'insights', label: 'Insights', emoji: '💡', color: C.analytics, x: 62, y: 78 },
      { id: 'performance', label: 'Performance', emoji: '📊', color: C.analytics, x: 75, y: 78 },
      { id: 'revenue', label: 'Revenue', emoji: '💵', color: C.analytics, x: 62, y: 92 },
      { id: 'forecast', label: 'Forecast', emoji: '🔮', color: C.analytics, x: 75, y: 92 },
    ],
    connections: [
      // Cross-console flows
      { from: 'triage', to: 'booking', label: '' },
      { from: 'triage', to: 'followup', label: '' },
      { from: 'followup', to: 'review', label: '' },
      { from: 'review', to: 'campaign', label: '' },
      { from: 'creative', to: 'social_content', label: '' },
      { from: 'creative', to: 'campaign', label: '' },
      { from: 'dispatch', to: 'route_ag', label: '' },
      { from: 'dispatch', to: 'eta', label: '' },
      { from: 'dispatch', to: 'checkin', label: '' },
      { from: 'quoting', to: 'invoice_ag', label: '' },
      { from: 'creative', to: 'web_presence', label: '' },
      { from: 'social_content', to: 'social_scheduler', label: '' },
      { from: 'social_content', to: 'social_analytics', label: '' },
    ],
    highlightAgents: [
      'triage', 'booking', 'followup', 'review',
      'campaign', 'lead', 'marketing_ag',
      'social_content', 'social_scheduler', 'social_analytics',
      'creative', 'web_presence',
      'dispatch', 'route_ag', 'eta', 'checkin',
      'admin', 'quoting', 'invoice_ag', 'inventory',
      'insights', 'performance', 'revenue', 'forecast',
    ],
    highlightConnections: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
  },

  // Scene 10 — Everyone Benefits
  {
    id: 'scene-10',
    title: 'Everyone Benefits',
    narration: 'With 24 AI operatives across 7 consoles, the company gets 24/7 coverage with zero missed leads. Customers get instant, professional service across every channel. Employees receive pre-qualified jobs with clear instructions.',
    agents: [
      { id: 'company', label: 'Company', emoji: '🏢', color: C.benefit, x: 50, y: 15 },
      { id: 'b1', label: '24/7 Coverage\n24 AI Operatives', emoji: '🌙', color: 'hsl(260, 50%, 42%)', x: 15, y: 12 },
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
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.7 }}
      animate={{ opacity: isHighlighted ? 1 : 0.3, scale: isHighlighted ? 1 : 0.85 }}
      transition={{ duration: 0.5, delay }}
      className="absolute flex flex-col items-center"
      style={{ left: `${agent.x}%`, top: `${agent.y}%`, transform: 'translate(-50%, -50%)' }}
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
    const header = '=== AURA INTELLIGENCE NETWORK — AGENT FLOW DEMO SCRIPT ===\n24 AI Operatives across 7 Consoles\n\n';
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
