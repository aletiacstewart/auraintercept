import { useState, useEffect } from 'react';
import { ThirdPartyCostDisclosureDialog } from '@/components/subscription/ThirdPartyCostDisclosureDialog';
import { useQuery } from '@tanstack/react-query';
import { useSearchParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { PageContainer } from '@/components/ui/page-container';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Progress } from '@/components/ui/progress';
import { toast } from 'sonner';
import { Check, X, Crown, ExternalLink, Loader2, Clock, Sparkles, Users, Mail, MessageSquare, Mic, Info, Building } from 'lucide-react';
import { PageHeader } from '@/components/ui/page-header';
import { cn } from '@/lib/utils';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface SubscriptionStatus {
  subscribed: boolean;
  tier: string | null;
  product_id: string | null;
  subscription_end: string | null;
  in_trial?: boolean;
  trial_ends_at?: string | null;
}

// Feature definitions with tooltips
const featureDescriptions: Record<string, string> = {
  'AI Receptionist (Triage)': 'Your 24/7 virtual receptionist that answers calls, qualifies leads, and routes inquiries to the right team member or agent.',
  'Follow-up Agent': 'Automatically follows up with leads and customers via email and SMS to ensure no opportunity is missed.',
  'Review Agent': 'Requests reviews from satisfied customers and monitors your online reputation across platforms.',
  'Scheduling Agent (Booking)': 'Handles appointment scheduling, rescheduling, and cancellations with smart calendar management.',
  'Dispatch Agent': 'Intelligently assigns technicians to jobs based on skills, location, and availability.',
  'Route Agent': 'Optimizes daily routes for field technicians to minimize drive time and maximize productivity.',
  'ETA Agent': 'Provides real-time arrival estimates to customers and updates them automatically on delays.',
  'Check-in Agent': 'Manages technician check-ins and check-outs, tracking job progress in real-time.',
  'Quote Agent': 'Generates professional quotes instantly based on job requirements and pricing rules.',
  'Invoice Agent': 'Creates and sends invoices automatically, with payment tracking and reminders.',
  'Inventory Agent': 'Tracks parts and materials, manages stock levels, and alerts on low inventory.',
  'Campaign Agent': 'Creates and manages marketing campaigns with automated targeting and scheduling.',
  'Lead Agent': 'Qualifies and scores leads, assigns to sales reps, and tracks conversion progress.',
  'Marketing Agent': 'Manages customer segments, promo codes, referral tracking, and win-back targeting for inactive customers.',
  'Performance Agent': 'Analyzes team and individual performance metrics with actionable insights.',
  'Revenue Agent': 'Tracks revenue trends, forecasts income, and identifies growth opportunities.',
  'Insights Agent': 'Generates business intelligence reports and identifies patterns in your data.',
  'Forecast Agent': 'Predicts demand, resource needs, and revenue based on historical data.',
  'Social Media Agent': 'Creates, schedules, and publishes social media content to grow your online presence.',
  'Creative Agent': 'Unified AI content generation for all channels. Creates on-brand content for web presence, social media, campaigns, and blogs.',
  'Web Presence Agent': 'AI-powered website and blog management. Auto-optimizes SEO, monitors site performance, and auto-publishes blog posts from the Content Engine.',
  'Customer Portal Console': 'Self-service portal where customers can book appointments, view history, and communicate with your team.',
  'Field Operations Console': 'Real-time dashboard for dispatchers to manage technicians, routes, and job assignments.',
  'Business Management Console': 'Central hub for quotes, invoices, inventory, and customer relationship management.',
  'Outreach & Sales Ops Console': 'Tools for campaigns, lead management, and sales pipeline tracking.',
  'Analytics & Reports Console': 'Comprehensive dashboards with KPIs, performance metrics, and business insights.',
  'Social Media Console': 'Unified dashboard to manage all your social media accounts and content calendar.',
  // Communication Channels - Chat vs Voice distinction
  'Message Aura (Text)': 'Text-based chat interface using keyboard input. Available on ALL tiers including Core. No external dependencies required (no ElevenLabs or SignalWire needed).',
  'Talk to Aura (Voice)': 'Speech-based AI conversations using microphone and speakers. Available on Aura Express and above (where enabled). Requires ElevenLabs for voice synthesis and SignalWire for telephony.',
  // 3rd Party Integrations
  'ElevenLabs (Voice)': 'Required for Talk to Aura (Voice) features only (speech-based). NOT required for Message Aura (Text).',
  'SignalWire (SMS & Voice)': 'Required for SMS reminders and Talk to Aura (Voice) calls. NOT required for Message Aura (Text). 40% cheaper SMS than alternatives.',
};

// Tier configuration matching homepage
const TIERS = [
  {
    id: 'connect',
    name: 'Aura Connect',
    monthlyPrice: '$297',
    annualPrice: '$2,970',
    annualSavings: 'Save $594',
    description: 'Solo operators, salons, consultants',
    popular: false,
    agentCount: 5,
    consoleCount: 4,
    highlights: [
      '5 AI Operatives',
      '4 Control Centers',
      'Triage + Customer Journey',
      'Outreach & Creative Content',
      'Web Presence Agent',
      '5 Employee Accounts',
    ],
  },
  {
    id: 'performance',
    name: 'Aura Performance',
    monthlyPrice: '$497',
    annualPrice: '$4,970',
    annualSavings: 'Save $994',
    description: 'HVAC, plumbing, field service',
    popular: true,
    agentCount: 8,
    consoleCount: 6,
    highlights: [
      '8 AI Operatives',
      '6 Control Centers',
      'Dispatch & Field Navigation',
      'Business Finance (Quotes/Invoices)',
      'Field Operations Console',
      '15 Employee Accounts',
    ],
  },
  {
    id: 'command',
    name: 'Aura Command',
    monthlyPrice: '$697',
    annualPrice: '$6,970',
    annualSavings: 'Save $1,394',
    description: 'Multi-location, enterprise',
    popular: false,
    agentCount: 10,
    consoleCount: 7,
    highlights: [
      'All 10 AI Operatives',
      'All 7 Control Centers + AI Hub',
      'Admin & Analytics Intelligence',
      'Revenue & Forecast',
      'Priority Support',
      'Unlimited Employees',
    ],
  },
];

// Employee limits per tier
export const TIER_EMPLOYEE_LIMITS: Record<string, number> = {
  connect: 5,
  performance: 15,
  command: 50,
};

type FeatureValue = 'check' | 'x' | string;

interface FeatureRow {
  name: string;
  connect: FeatureValue;
  performance: FeatureValue;
  command: FeatureValue;
}

interface FeatureSection {
  title: string;
  features: FeatureRow[];
}

const sections: FeatureSection[] = [
  {
    title: 'AI Operatives (5 / 8 / 10)',
    features: [
      { name: 'AI Receptionist (Triage)', connect: 'check', performance: 'check', command: 'check' },
      { name: 'Customer Journey (Booking, Follow-up, Review)', connect: 'check', performance: 'check', command: 'check' },
      { name: 'Outreach (Campaign, Lead, Marketing)', connect: 'check', performance: 'check', command: 'check' },
      { name: 'Creative Content Agent', connect: 'check', performance: 'check', command: 'check' },
      { name: 'Web Presence Agent', connect: 'check', performance: 'check', command: 'check' },
      { name: 'Dispatch Agent', connect: 'x', performance: 'check', command: 'check' },
      { name: 'Field Navigation (Route, ETA, Check-in)', connect: 'x', performance: 'check', command: 'check' },
      { name: 'Business Finance (Quote, Invoice, Inventory)', connect: 'x', performance: 'check', command: 'check' },
      { name: 'Admin Agent', connect: 'x', performance: 'x', command: 'check' },
      { name: 'Analytics Intelligence (Insights, Performance, Revenue, Forecast)', connect: 'x', performance: 'x', command: 'check' },
    ],
  },
  {
    title: 'Control Centers (4 / 6 / 7+)',
    features: [
      { name: 'Customer Portal Console', connect: 'check', performance: 'check', command: 'check' },
      { name: 'Marketing & Sales Console', connect: 'check', performance: 'check', command: 'check' },
      { name: 'Social Media Console', connect: 'check', performance: 'check', command: 'check' },
      { name: 'Creative & Web Presence Console', connect: 'check', performance: 'check', command: 'check' },
      { name: 'Field Operations Console', connect: 'x', performance: 'check', command: 'check' },
      { name: 'Business Management Console', connect: 'x', performance: 'check', command: 'check' },
      { name: 'Analytics & Reports Console', connect: 'x', performance: 'x', command: 'check' },
      { name: 'AI Operatives Hub', connect: 'x', performance: 'x', command: 'check' },
    ],
  },
  {
    title: 'Communication Channels',
    features: [
      { name: 'Message Aura (Text)', connect: 'check', performance: 'check', command: 'check' },
      { name: 'Talk to Aura (Voice)', connect: 'check', performance: 'check', command: 'check' },
      { name: 'Email Reminders', connect: 'check', performance: 'check', command: 'check' },
      { name: 'SMS Reminders', connect: 'check', performance: 'check', command: 'check' },
    ],
  },
  {
    title: 'Platform Limits & Features',
    features: [
      { name: 'Appointments', connect: 'Unlimited', performance: 'Unlimited', command: 'Unlimited' },
      { name: 'Employee Accounts', connect: '5 included', performance: '15 included', command: 'Unlimited' },
      { name: 'Additional Employees', connect: '$25/10 employees', performance: '$25/10 employees', command: 'Included' },
      { name: 'White-Label Branding', connect: 'check', performance: 'check', command: 'check' },
      { name: 'Embeddable Chat Widget', connect: 'check', performance: 'check', command: 'check' },
    ],
  },
  {
    title: 'Integration & Support',
    features: [
      { name: 'Calendar Sync', connect: 'check', performance: 'check', command: 'check' },
      { name: 'API Access', connect: 'check', performance: 'check', command: 'check' },
      { name: 'Priority Support', connect: 'x', performance: 'x', command: 'check' },
    ],
  },
  {
    title: 'Required 3rd Party Integrations',
    features: [
      { name: 'Resend (Email)', connect: 'Required', performance: 'Required', command: 'Required' },
      { name: 'SignalWire (SMS & Voice)', connect: 'Required', performance: 'Required', command: 'Required' },
      { name: 'ElevenLabs (Voice)', connect: 'Required', performance: 'Required', command: 'Required' },
      { name: 'A2P 10DLC Compliance', connect: 'Required', performance: 'Required', command: 'Required' },
      { name: 'Stripe (Payments)', connect: 'Optional', performance: 'Required', command: 'Required' },
      { name: 'Social Media Accounts', connect: 'Optional', performance: 'Required', command: 'Required' },
    ],
  },
  {
    title: 'Pricing',
    features: [
      { name: 'Monthly Price', connect: '$297', performance: '$497', command: '$697' },
      { name: 'Annual Price', connect: '$2,970/year', performance: '$4,970/year', command: '$6,970/year' },
      { name: 'Annual Savings', connect: 'Save $594', performance: 'Save $994', command: 'Save $1,394' },
    ],
  },
];
    annualPrice: '$3,970',
    annualSavings: 'Save $794',
    description: 'AI booking with calendar sync',
    popular: false,
    agentCount: 3,
    consoleCount: 1,
    highlights: [
      'AI Receptionist (Triage)',
      'Scheduling Agent',
      'Follow-up Agent',
      'Customer Portal Console',
      'Talk to Aura (Voice)',
      'Direct calendar sync',
    ],
  },
  {
    id: 'halo',
    name: 'Aura Growth',
    monthlyPrice: '$597',
    annualPrice: '$5,970',
    annualSavings: 'Save $1,194',
    description: '11 AI agents + Marketing Automation',
    popular: false,
    agentCount: 11,
    consoleCount: 3,
    highlights: [
      '11 AI Operatives',
      '3 Control Centers',
      'Marketing Automation',
      'Outreach & Sales Ops',
      'Social Media Console',
      'Talk to Aura (Voice)',
    ],
  },
  {
    id: 'core',
    name: 'Aura Presence',
    monthlyPrice: '$797',
    annualPrice: '$7,970',
    annualSavings: 'Save $1,594',
    description: 'Creative & Web Presence Focus',
    popular: false,
    agentCount: 12,
    consoleCount: 4,
    highlights: [
      '12 AI Operatives',
      '4 Control Centers',
      'Creative & Web Presence',
      'Voice, SMS & Email',
      'Content Engine',
      '8 Employee Accounts',
    ],
  },
  {
    id: 'single_point',
    name: 'Aura Logistics',
    monthlyPrice: '$1,497',
    annualPrice: '$14,970',
    annualSavings: 'Save $2,994',
    description: 'Field Operations + Business Management',
    popular: true,
    agentCount: 18,
    consoleCount: 6,
    highlights: [
      '18 AI Operatives',
      '6 Control Centers',
      'Field Operations Console',
      'Business Management Console',
      'Talk to Aura (Voice) & Calling',
      '15 Employee Accounts',
    ],
  },
  {
    id: 'multi_track',
    name: 'Aura Performance',
    monthlyPrice: '$497',
    annualPrice: '$4,970',
    annualSavings: 'Save $994',
    description: 'Full automation + Analytics & Reports',
    popular: false,
    agentCount: 22,
    consoleCount: 7,
    highlights: [
      '22 AI Operatives',
      'All 7 Control Centers',
      'Analytics & Reports Console',
      'Customer Support',
      '25 Employee Accounts',
    ],
  },
  {
    id: 'command',
    name: 'Aura Command',
    monthlyPrice: '$697',
    annualPrice: '$6,970',
    annualSavings: 'Save $1,394',
    description: 'Full business automation suite',
    popular: false,
    agentCount: 24,
    consoleCount: 7,
    highlights: [
      'All 24 AI Operatives',
      'All 7 Control Centers',
      'AI Operatives Hub',
      'Revenue & Forecast Agents',
      'Customer Support',
      '50 Employee Accounts',
    ],
  },
];

// Employee limits per tier
export const TIER_EMPLOYEE_LIMITS: Record<string, number> = {
  express: 2,
  aura_flow: 3,
  halo: 5,
  core: 8,
  single_point: 15,
  multi_track: 25,
  command: 50,
};

type FeatureValue = 'check' | 'x' | string;

interface FeatureRow {
  name: string;
  starter: FeatureValue;
  scheduling: FeatureValue;
  growth: FeatureValue;
  business: FeatureValue;
  fieldOps: FeatureValue;
  performance: FeatureValue;
  command: FeatureValue;
}

interface FeatureSection {
  title: string;
  features: FeatureRow[];
}

const sections: FeatureSection[] = [
  {
    title: 'AI Agents (1 / 3 / 11 / 12 / 18 / 22 / 24)',
    features: [
      { name: 'AI Receptionist (Triage)', starter: 'check', scheduling: 'check', growth: 'check', business: 'check', fieldOps: 'check', performance: 'check', command: 'check' },
      { name: 'Scheduling Agent (Booking)', starter: 'x', scheduling: 'check', growth: 'check', business: 'check', fieldOps: 'check', performance: 'check', command: 'check' },
      { name: 'Follow-up Agent', starter: 'x', scheduling: 'check', growth: 'check', business: 'check', fieldOps: 'check', performance: 'check', command: 'check' },
      { name: 'Review Agent', starter: 'x', scheduling: 'x', growth: 'check', business: 'check', fieldOps: 'check', performance: 'check', command: 'check' },
      { name: 'Campaign Agent', starter: 'x', scheduling: 'x', growth: 'check', business: 'check', fieldOps: 'check', performance: 'check', command: 'check' },
      { name: 'Lead Agent', starter: 'x', scheduling: 'x', growth: 'check', business: 'check', fieldOps: 'check', performance: 'check', command: 'check' },
      { name: 'Marketing Agent', starter: 'x', scheduling: 'x', growth: 'check', business: 'check', fieldOps: 'check', performance: 'check', command: 'check' },
      { name: 'Social Media Agent', starter: 'x', scheduling: 'x', growth: 'check', business: 'check', fieldOps: 'check', performance: 'check', command: 'check' },
      { name: 'Social Media Scheduler', starter: 'x', scheduling: 'x', growth: 'check', business: 'check', fieldOps: 'check', performance: 'check', command: 'check' },
      { name: 'Social Media Analytics', starter: 'x', scheduling: 'x', growth: 'check', business: 'check', fieldOps: 'check', performance: 'check', command: 'check' },
      { name: 'Creative Agent', starter: 'x', scheduling: 'x', growth: 'check', business: 'check', fieldOps: 'check', performance: 'check', command: 'check' },
      { name: 'Web Presence Agent', starter: 'x', scheduling: 'x', growth: 'x', business: 'check', fieldOps: 'check', performance: 'check', command: 'check' },
      { name: 'Dispatch Agent', starter: 'x', scheduling: 'x', growth: 'x', business: 'x', fieldOps: 'check', performance: 'check', command: 'check' },
      { name: 'Route Agent', starter: 'x', scheduling: 'x', growth: 'x', business: 'x', fieldOps: 'check', performance: 'check', command: 'check' },
      { name: 'ETA Agent', starter: 'x', scheduling: 'x', growth: 'x', business: 'x', fieldOps: 'check', performance: 'check', command: 'check' },
      { name: 'Check-in Agent', starter: 'x', scheduling: 'x', growth: 'x', business: 'x', fieldOps: 'check', performance: 'check', command: 'check' },
      { name: 'Quote Agent', starter: 'x', scheduling: 'x', growth: 'x', business: 'x', fieldOps: 'check', performance: 'check', command: 'check' },
      { name: 'Invoice Agent', starter: 'x', scheduling: 'x', growth: 'x', business: 'x', fieldOps: 'check', performance: 'check', command: 'check' },
      { name: 'Admin Agent', starter: 'x', scheduling: 'x', growth: 'x', business: 'x', fieldOps: 'x', performance: 'check', command: 'check' },
      { name: 'Inventory Agent', starter: 'x', scheduling: 'x', growth: 'x', business: 'x', fieldOps: 'x', performance: 'check', command: 'check' },
      { name: 'Performance Agent', starter: 'x', scheduling: 'x', growth: 'x', business: 'x', fieldOps: 'x', performance: 'check', command: 'check' },
      { name: 'Insights Agent', starter: 'x', scheduling: 'x', growth: 'x', business: 'x', fieldOps: 'x', performance: 'check', command: 'check' },
      { name: 'Revenue Agent', starter: 'x', scheduling: 'x', growth: 'x', business: 'x', fieldOps: 'x', performance: 'x', command: 'check' },
      { name: 'Forecast Agent', starter: 'x', scheduling: 'x', growth: 'x', business: 'x', fieldOps: 'x', performance: 'x', command: 'check' },
    ],
  },
  {
    title: 'Control Centers (0 / 1 / 3 / 4 / 6 / 7 / 7)',
    features: [
      { name: 'Customer Portal Console', starter: 'x', scheduling: 'check', growth: 'check', business: 'check', fieldOps: 'check', performance: 'check', command: 'check' },
      { name: 'Outreach & Sales Ops Console', starter: 'x', scheduling: 'x', growth: 'check', business: 'check', fieldOps: 'check', performance: 'check', command: 'check' },
      { name: 'Social Media Console', starter: 'x', scheduling: 'x', growth: 'check', business: 'check', fieldOps: 'check', performance: 'check', command: 'check' },
      { name: 'Creative & Web Presence Console', starter: 'x', scheduling: 'x', growth: 'x', business: 'check', fieldOps: 'check', performance: 'check', command: 'check' },
      { name: 'Field Operations Console', starter: 'x', scheduling: 'x', growth: 'x', business: 'x', fieldOps: 'check', performance: 'check', command: 'check' },
      { name: 'Business Management Console', starter: 'x', scheduling: 'x', growth: 'x', business: 'x', fieldOps: 'check', performance: 'check', command: 'check' },
      { name: 'Analytics & Reports Console', starter: 'x', scheduling: 'x', growth: 'x', business: 'x', fieldOps: 'x', performance: 'check', command: 'check' },
    ],
  },
  {
    title: 'Communication Channels',
    features: [
      { name: 'Message Aura (Text)', starter: 'check', scheduling: 'check', growth: 'check', business: 'check', fieldOps: 'check', performance: 'check', command: 'check' },
      { name: 'Talk to Aura (Voice)', starter: 'check', scheduling: 'check', growth: 'check', business: 'check', fieldOps: 'check', performance: 'check', command: 'check' },
      { name: 'Email Reminders', starter: 'check', scheduling: 'check', growth: 'check', business: 'check', fieldOps: 'check', performance: 'check', command: 'check' },
      { name: 'SMS Reminders', starter: 'check', scheduling: 'check', growth: 'check', business: 'check', fieldOps: 'check', performance: 'check', command: 'check' },
    ],
  },
  {
    title: 'Platform Limits & Features',
    features: [
      { name: 'Appointments', starter: 'x', scheduling: 'Unlimited', growth: 'Unlimited', business: 'Unlimited', fieldOps: 'Unlimited', performance: 'Unlimited', command: 'Unlimited' },
      { name: 'Employee Accounts', starter: '2 included', scheduling: '3 included', growth: '5 included', business: '8 included', fieldOps: '15 included', performance: '25 included', command: '50 included' },
      { name: 'Additional Employees', starter: '$25/10 employees', scheduling: '$25/10 employees', growth: '$25/10 employees', business: '$25/10 employees', fieldOps: '$25/10 employees', performance: '$25/10 employees', command: '$25/10 employees' },
      { name: 'White-Label Branding', starter: 'check', scheduling: 'check', growth: 'check', business: 'check', fieldOps: 'check', performance: 'check', command: 'check' },
      { name: 'Embeddable Chat Widget', starter: 'check', scheduling: 'check', growth: 'check', business: 'check', fieldOps: 'check', performance: 'check', command: 'check' },
    ],
  },
  {
    title: 'Integration & Support',
    features: [
      { name: 'Calendar Sync', starter: 'x', scheduling: 'check', growth: 'check', business: 'check', fieldOps: 'check', performance: 'check', command: 'check' },
      { name: 'API Access', starter: 'check', scheduling: 'check', growth: 'check', business: 'check', fieldOps: 'check', performance: 'check', command: 'check' },
      { name: 'Customer Support', starter: 'check', scheduling: 'check', growth: 'check', business: 'check', fieldOps: 'check', performance: 'check', command: 'check' },
    ],
  },
  {
    title: 'Required 3rd Party Integrations',
    features: [
      { name: 'Resend (Email)', starter: 'Required', scheduling: 'Required', growth: 'Required', business: 'Required', fieldOps: 'Required', performance: 'Required', command: 'Required' },
      { name: 'Stripe (Payments)', starter: 'Optional', scheduling: 'Optional', growth: 'Optional', business: 'Optional', fieldOps: 'Required', performance: 'Required', command: 'Required' },
      { name: 'SignalWire (SMS & Voice)', starter: 'Required', scheduling: 'Required', growth: 'Required', business: 'Required', fieldOps: 'Required', performance: 'Required', command: 'Required' },
      { name: 'ElevenLabs (Voice)', starter: 'Required', scheduling: 'Required', growth: 'Required', business: 'Required', fieldOps: 'Required', performance: 'Required', command: 'Required' },
      { name: 'A2P 10DLC Compliance', starter: 'Required', scheduling: 'Required', growth: 'Required', business: 'Required', fieldOps: 'Required', performance: 'Required', command: 'Required' },
      { name: 'Calendar Sync', starter: 'Optional', scheduling: 'Required', growth: 'Required', business: 'Required', fieldOps: 'Required', performance: 'Required', command: 'Required' },
      { name: 'Social Media Accounts', starter: 'Optional', scheduling: 'Optional', growth: 'Required', business: 'Required', fieldOps: 'Required', performance: 'Required', command: 'Required' },
    ],
  },
  {
    title: 'Pricing',
    features: [
      { name: 'Monthly Price', starter: '$197', scheduling: '$397', growth: '$597', business: '$797', fieldOps: '$1,497', performance: '$497', command: '$697' },
      { name: 'Annual Price', starter: '$1,970/year', scheduling: '$3,970/year', growth: '$5,970/year', business: '$7,970/year', fieldOps: '$14,970/year', performance: '$4,970/year', command: '$6,970/year' },
      { name: 'Annual Savings', starter: 'Save $394', scheduling: 'Save $794', growth: 'Save $1,194', business: 'Save $1,594', fieldOps: 'Save $2,994', performance: 'Save $994', command: 'Save $1,394' },
    ],
  },
];

export default function Subscription() {
  const { user, userRole, inTrial, trialEndsAt } = useAuth();
  const [searchParams] = useSearchParams();
  const [loading, setLoading] = useState(false);
  const [portalLoading, setPortalLoading] = useState(false);
  const [disclosureOpen, setDisclosureOpen] = useState(false);
  const [pendingTierId, setPendingTierId] = useState<string | null>(null);

  // Determine if user can manage subscriptions
  const canManageSubscription = userRole === 'company_admin' || userRole === 'platform_admin';
  const isEmployee = userRole === 'employee';
  const isCustomer = userRole === 'customer';

  // Calculate trial days remaining
  const trialDaysRemaining = trialEndsAt 
    ? Math.max(0, Math.ceil((new Date(trialEndsAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24)))
    : 0;
  const trialProgressPercent = Math.min(((30 - trialDaysRemaining) / 30) * 100, 100);

  // Check for success/canceled params
  useEffect(() => {
    if (searchParams.get('success') === 'true') {
      toast.success('Subscription activated successfully!');
    } else if (searchParams.get('canceled') === 'true') {
      toast.info('Checkout was canceled.');
    }
  }, [searchParams]);

  // Fetch subscription status
  const { data: subscription, isLoading, refetch } = useQuery({
    queryKey: ['subscription-status', user?.id],
    queryFn: async (): Promise<SubscriptionStatus> => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        return { subscribed: false, tier: null, product_id: null, subscription_end: null };
      }

      const { data, error } = await supabase.functions.invoke('check-subscription', {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (error) throw error;
      return data;
    },
    enabled: !!user,
    refetchInterval: 30000,
  });

  const handleSubscribe = (tierId: string) => {
    setPendingTierId(tierId);
    setDisclosureOpen(true);
  };

  const handleCheckoutConfirmed = async (_wantsConcierge?: boolean) => {
    if (!pendingTierId) return;
    setDisclosureOpen(false);
    const tierId = pendingTierId;
    setPendingTierId(null);
    try {
      setLoading(true);
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        toast.error('Please log in to subscribe');
        return;
      }
      const { data, error } = await supabase.functions.invoke('create-checkout', {
        headers: { Authorization: `Bearer ${session.access_token}` },
        body: { tier: tierId },
      });
      if (error) throw error;
      if (data?.url) window.open(data.url, '_blank');
    } catch (error) {
      console.error('Error creating checkout:', error);
      toast.error('Failed to start checkout');
    } finally {
      setLoading(false);
    }
  };

  const handleManageSubscription = async () => {
    try {
      setPortalLoading(true);
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session?.access_token) {
        toast.error('Please log in to manage subscription');
        return;
      }

      const { data, error } = await supabase.functions.invoke('stripe-customer-portal', {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (error) throw error;
      if (data?.url) {
        window.open(data.url, '_blank');
      }
    } catch (error) {
      console.error('Error opening customer portal:', error);
      toast.error('Failed to open billing portal');
    } finally {
      setPortalLoading(false);
    }
  };

  const isSubscribed = subscription?.subscribed && !subscription?.in_trial;
  const isInTrial = subscription?.in_trial || inTrial;
  const currentTier = subscription?.tier || 'free';

  const renderFeatureValue = (value: FeatureValue, isHighlighted: boolean, featureName: string) => {
    const baseClass = isHighlighted 
      ? 'py-2 px-3 text-center bg-primary/10 border-x border-primary/30' 
      : 'py-2 px-3 text-center';

    if (value === 'check') {
      return (
        <td className={baseClass}>
          <Check className="w-4 h-4 text-emerald-500 mx-auto" />
        </td>
      );
    }
    if (value === 'x') {
      return (
        <td className={baseClass}>
          <X className="w-4 h-4 text-muted-foreground mx-auto" />
        </td>
      );
    }
    
    const isPricing = featureName === 'Monthly Price';
    const isSavings = value.includes('Save');
    const isAddon = value.includes('Add-on') || value.startsWith('+$');
    const isOptional = value === 'Optional';
    
    let textClass = 'text-card-foreground text-xs';
    if (isPricing) {
      textClass = isHighlighted ? 'text-primary font-semibold' : 'text-card-foreground font-semibold';
    } else if (isSavings) {
      textClass = 'text-emerald-500 text-xs';
    } else if (isAddon) {
      textClass = 'text-amber-500 text-xs';
    } else if (isOptional) {
      textClass = 'text-muted-foreground text-xs';
    }
    
    return (
      <td className={`${baseClass} ${textClass}`}>
        {value}
      </td>
    );
  };

  const FeatureNameCell = ({ name, rowIndex }: { name: string; rowIndex: number }) => {
    const description = featureDescriptions[name];
    const isEven = rowIndex % 2 === 0;
    const baseClass = `py-2 px-4 text-card-foreground ${isEven ? 'bg-muted/30' : ''}`;
    
    if (description) {
      return (
        <td className={baseClass}>
          <TooltipTrigger asChild>
            <span className="cursor-help border-b border-dotted border-muted-foreground/40 hover:border-primary hover:text-primary transition-colors">
              {name}
            </span>
          </TooltipTrigger>
          <TooltipContent 
            side="right" 
            className="max-w-xs bg-card text-card-foreground border-border z-50"
          >
            <p className="text-sm">{description}</p>
          </TooltipContent>
        </td>
      );
    }
    
    return <td className={baseClass}>{name}</td>;
  };

  let globalRowIndex = 0;

  return (
    <>
    <DashboardLayout>
      <PageContainer>
        <div className="space-y-6 animate-fade-in">
        <PageHeader
          icon={Crown}
          title="Subscription"
          description={
            isEmployee || isCustomer 
              ? "Your company's subscription plan" 
              : isInTrial 
                ? 'Subscribe to continue after your trial' 
                : 'Choose the plan that fits your business'
          }
          showAuraBar
          action={
            isSubscribed && canManageSubscription ? (
              <Button 
                variant="outline" 
                onClick={handleManageSubscription}
                disabled={portalLoading}
              >
                {portalLoading ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <ExternalLink className="w-4 h-4 mr-2" />
                )}
                Manage Billing
              </Button>
            ) : undefined
          }
        />

        {/* Trial Status Banner */}
        {isInTrial && (
          <Card className="border-primary/30 bg-primary/5">
            <CardContent className="py-4">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center">
                  <Sparkles className="w-6 h-6 text-primary" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-primary/20 text-primary">
                      Free Trial
                    </span>
                    {trialDaysRemaining <= 3 && (
                      <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-600">
                        Ending Soon
                      </span>
                    )}
                  </div>
                  <p className="font-medium text-card-foreground">
                    {trialDaysRemaining} day{trialDaysRemaining !== 1 ? 's' : ''} remaining in your free trial
                  </p>
                  <div className="mt-2 space-y-1">
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        <span>Trial ends {trialEndsAt ? new Date(trialEndsAt).toLocaleDateString() : ''}</span>
                      </div>
                      <span>{Math.round(trialProgressPercent)}% used</span>
                    </div>
                    <Progress value={trialProgressPercent} className="h-2" />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Role-based Info Banner for Employees and Customers */}
        {(isEmployee || isCustomer) && !isLoading && (
          <Card className="border-primary/30 bg-primary/5">
            <CardContent className="py-4">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center">
                  <Building className="w-6 h-6 text-primary" />
                </div>
                <div className="flex-1">
                  <p className="font-medium text-card-foreground">
                    {isEmployee 
                      ? "Your access is provided through your company's subscription"
                      : "You have access through the company you work with"
                    }
                  </p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Current plan: <span className="font-semibold text-primary capitalize">{currentTier?.replace('_', '-') || 'Free'}</span>
                    {isEmployee && ' • Contact your company administrator for billing questions'}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Current Status - Only show for admins */}
        {isLoading ? (
          <Skeleton className="h-20 w-full" />
        ) : isSubscribed && canManageSubscription ? (
          <Card className="border-amber-500/30 bg-amber-500/5">
            <CardContent className="flex items-center justify-between py-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-amber-500/20 flex items-center justify-center">
                  <Crown className="w-5 h-5 text-amber-500" />
                </div>
                <div>
                  <p className="font-medium text-card-foreground">
                    Your company is on the <span className="text-amber-500 font-semibold capitalize">{currentTier?.replace('_', '-')}</span> plan
                  </p>
                  {subscription?.subscription_end && (
                    <p className="text-sm text-muted-foreground">
                      Renews on {new Date(subscription.subscription_end).toLocaleDateString()}
                    </p>
                  )}
                </div>
              </div>
              <Button variant="ghost" size="sm" onClick={() => refetch()}>
                Refresh Status
              </Button>
            </CardContent>
          </Card>
        ) : null}

        {/* Tier Cards */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {TIERS.map((tier) => (
            <Card 
              key={tier.id}
              className={cn(
                "relative overflow-hidden transition-all bg-card",
                tier.popular && "border-primary ring-2 ring-primary/20",
                currentTier === tier.id && isSubscribed && "border-amber-500 ring-2 ring-amber-500/20"
              )}
            >
              {tier.popular && (
                <div className="absolute top-0 right-0 bg-primary text-primary-foreground text-xs font-medium px-3 py-1 rounded-bl-lg">
                  Most Popular
                </div>
              )}
              {currentTier === tier.id && isSubscribed && (
                <div className="absolute top-0 right-0 bg-amber-500 text-white text-xs font-medium px-3 py-1 rounded-bl-lg">
                  Your Plan
                </div>
              )}
              
              <CardHeader className="text-center pb-2">
                <CardTitle className="text-xl text-card-foreground">{tier.name}</CardTitle>
                <CardDescription className="text-sm">{tier.description}</CardDescription>
              </CardHeader>
              
              <CardContent className="space-y-4">
                <div className="text-center">
                  <div className="flex items-baseline justify-center gap-1">
                    <span className="text-4xl font-bold text-card-foreground">{tier.monthlyPrice}</span>
                    <span className="text-muted-foreground">/mo</span>
                  </div>
                  <div className="mt-1 text-sm">
                    <span className="text-muted-foreground">{tier.annualPrice}/year</span>
                    <span className="ml-2 text-emerald-500 font-medium">{tier.annualSavings}</span>
                  </div>
                </div>

                {/* Key highlights */}
                <div className="space-y-2 text-sm">
                  {tier.highlights.map((highlight, idx) => (
                    <div key={idx} className="flex items-center gap-2 text-card-foreground">
                      <Check className="w-4 h-4 text-emerald-500" />
                      <span>{highlight}</span>
                    </div>
                  ))}
                </div>

                {canManageSubscription ? (
                  <Button 
                    className={cn(
                      "w-full",
                      tier.popular && "bg-primary hover:bg-primary/90"
                    )}
                    variant={tier.popular ? "default" : "outline"}
                    onClick={() => handleSubscribe(tier.id)}
                    disabled={loading || (currentTier === tier.id && isSubscribed)}
                  >
                    {loading ? (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : currentTier === tier.id && isSubscribed ? (
                      'Current Plan'
                    ) : (
                      'Subscribe'
                    )}
                  </Button>
                ) : (
                  <div className="text-center text-sm text-muted-foreground py-2">
                    {currentTier === tier.id ? (
                      <span className="text-primary font-medium">Your Current Plan</span>
                    ) : (
                      <span>Contact your admin to upgrade</span>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Feature Comparison Table */}
        <Card className="bg-card">
          <CardHeader>
            <CardTitle className="text-card-foreground">Feature Comparison</CardTitle>
            <CardDescription>See what's included in each plan</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <TooltipProvider delayDuration={200}>
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border bg-muted/50">
                      <th className="text-left py-2.5 px-4 font-semibold text-card-foreground text-sm">Feature</th>
                      <th className="text-center py-2.5 px-2 font-semibold text-card-foreground text-xs">
                        <div>Connect</div>
                        <div className="text-[10px] font-normal text-muted-foreground">$297/mo</div>
                      </th>
                      <th className="text-center py-2.5 px-2 font-semibold bg-primary/20 border-x border-primary/30 text-xs">
                        <div className="text-primary">Performance</div>
                        <div className="text-[10px] font-normal text-muted-foreground">$497/mo</div>
                      </th>
                      <th className="text-center py-2.5 px-2 font-semibold text-card-foreground text-xs">
                        <div>Command</div>
                        <div className="text-[10px] font-normal text-muted-foreground">$697/mo</div>
                      </th>
                    </tr>
                  </thead>
                  <tbody className="text-sm">
                    {sections.map((section) => (
                      <>
                        <tr key={`section-${section.title}`} className="bg-muted/30">
                          <td colSpan={4} className="py-1.5 px-4 font-semibold text-primary">
                            {section.title}
                          </td>
                        </tr>
                        {section.features.map((feature) => {
                          const rowIndex = globalRowIndex++;
                          const isEven = rowIndex % 2 === 0;
                          const rowBg = isEven ? 'bg-muted/10' : '';
                          
                          return (
                            <Tooltip key={feature.name}>
                              <tr className={`border-b border-border/50 hover:bg-muted/20 ${rowBg}`}>
                                <FeatureNameCell name={feature.name} rowIndex={rowIndex} />
                                {renderFeatureValue(feature.connect, false, feature.name)}
                                {renderFeatureValue(feature.performance, true, feature.name)}
                                {renderFeatureValue(feature.command, false, feature.name)}
                              </tr>
                            </Tooltip>
                          );
                        })}
                      </>
                    ))}
                  </tbody>
                </table>
              </TooltipProvider>
            </div>
          </CardContent>
        </Card>

        {/* Implementation Fees Notice */}
        <Card className="bg-muted/20 border-border/50">
          <CardContent className="py-4">
            <div className="flex flex-wrap items-center justify-center gap-4 text-sm text-center">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-primary" />
                <span className="text-card-foreground font-medium">30-day free trial</span>
                <span className="text-muted-foreground">No credit card required</span>
              </div>
              <span className="text-muted-foreground">•</span>
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-primary" />
                <span className="text-muted-foreground">Additional employees: $25 per 10 employees</span>
              </div>
              <span className="text-muted-foreground">•</span>
              <div className="flex items-center gap-2">
                <Building className="w-4 h-4 text-primary" />
                <span className="text-muted-foreground">One-Time Implementation Fee: starting at $299</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Usage-based pricing info */}
        <Card className="border-border/50 bg-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-card-foreground">
              <Info className="w-5 h-5 text-primary" />
              Usage-Based Pricing
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-3 gap-4 text-sm">
              <div className="flex items-start gap-3">
                <Mail className="w-5 h-5 text-emerald-500 mt-0.5" />
                <div>
                  <p className="font-medium text-card-foreground">Email Reminders</p>
                  <p className="text-muted-foreground">Included at no extra cost</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <MessageSquare className="w-5 h-5 text-sky-500 mt-0.5" />
                <div>
                  <p className="font-medium text-card-foreground">SMS Reminders</p>
                  <p className="text-muted-foreground">Usage-based via SignalWire</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Mic className="w-5 h-5 text-violet-500 mt-0.5" />
                <div>
                  <p className="font-medium text-card-foreground">AI Voice Calls</p>
                  <p className="text-muted-foreground">Usage-based via ElevenLabs + SignalWire</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* FAQ */}
        <Card className="border-border/50 bg-card">
          <CardHeader>
            <CardTitle className="text-card-foreground">Frequently Asked Questions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h4 className="font-medium text-card-foreground">What's the difference between Field Ops and Performance?</h4>
              <p className="text-sm text-muted-foreground">
                Field Ops ($1,497/mo) includes 18 agents for field operations and business management. Performance ($497/mo) adds Analytics & Reports with 22 agents and advanced reporting capabilities.
              </p>
            </div>
            <div>
              <h4 className="font-medium text-card-foreground">What happens when my trial ends?</h4>
              <p className="text-sm text-muted-foreground">
                When your 30-day trial ends, you'll need to subscribe to continue using AI features. Your data will be preserved.
              </p>
            </div>
            <div>
              <h4 className="font-medium text-card-foreground">How does employee pricing work?</h4>
              <p className="text-sm text-muted-foreground">
                Each tier includes a set number of employee accounts (2-50). Additional employees beyond your tier's limit cost $10/month each.
              </p>
            </div>
            <div>
              <h4 className="font-medium text-card-foreground">Can I upgrade or downgrade my plan?</h4>
              <p className="text-sm text-muted-foreground">
                Yes! You can change your plan at any time through the billing portal. Changes take effect on your next billing cycle.
              </p>
            </div>
            <div>
              <h4 className="font-medium text-card-foreground">Can I cancel my subscription?</h4>
              <p className="text-sm text-muted-foreground">
                Yes, you can cancel your subscription at any time through the billing portal. You'll retain access until the end of your billing period.
              </p>
            </div>
          </CardContent>
        </Card>
        </div>
      </PageContainer>
    </DashboardLayout>
    <ThirdPartyCostDisclosureDialog
      open={disclosureOpen}
      tierName={pendingTierId ?? ''}
      onConfirm={handleCheckoutConfirmed}
      onCancel={() => { setDisclosureOpen(false); setPendingTierId(null); }}
    />
    </>
  );
}
