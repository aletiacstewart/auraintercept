import { useState, useEffect } from 'react';
import { ThirdPartyCostDisclosureDialog } from '@/components/subscription/ThirdPartyCostDisclosureDialog';
import { BetaCodeInput, type BetaCodeResult } from '@/components/billing/BetaCodeInput';
import { ThirdPartyFeeNotice } from '@/components/billing/ThirdPartyFeeNotice';
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
  'Booking Agent': 'Handles appointment scheduling, rescheduling, and cancellations with smart calendar management.',
  'Follow-Up Agent': 'Automatically follows up with leads and customers via email and SMS to ensure no opportunity is missed.',
  'Review Agent': 'Automated Google & Yelp review requests with sentiment tracking after completed jobs.',
  'Creative Content Agent': 'Unified AI content generation for all channels. Creates on-brand content for web presence, social media, campaigns, and blogs.',
  'Campaign Agent': 'Multi-channel email/SMS campaign creation, scheduling, and performance tracking.',
  'Lead Agent': 'Lead scoring, pipeline management, and conversion tracking to close more deals.',
  'Outreach Agent': 'Automated outbound sequences and prospect engagement for new business development.',
  'Dispatch/GPS Console': 'Intelligently assigns technicians to jobs based on skills, location, and availability.',
  'Route Agent': 'Optimizes daily routes for field technicians to minimize drive time and maximize productivity.',
  'ETA Agent': 'Real-time arrival estimates and automatic customer notification updates.',
  'Check-In Agent': 'Job progress logging, time tracking, and on-site status updates for field teams.',
  'Marketing Agent': 'Manages customer segments, promo codes, referral tracking, and win-back targeting.',
  'Web Presence Agent': 'AI-powered website and blog management. Auto-optimizes SEO, monitors site performance, and auto-publishes blog posts.',
  'Social Scheduler Agent': 'Cross-platform scheduling, optimal timing, and auto-publishing across 6 social platforms.',
  'Social Analytics Agent': 'Engagement metrics, audience insights, and growth tracking across all social channels.',
  'Admin Agent': 'Platform administration, user management, and system configuration.',
  'Quoting Agent': 'Generates professional quotes instantly based on job requirements and pricing rules.',
  'Invoice Agent': 'Creates and sends invoices automatically, with payment tracking and reminders.',
  'Inventory Agent': 'Tracks parts and materials, manages stock levels, and alerts on low inventory.',
  'Insights Agent': 'Generates business intelligence reports and identifies patterns in your data.',
  'Performance Agent': 'Analyzes team and individual performance metrics with actionable insights.',
  'Revenue Agent': 'Revenue analytics, profitability reports, and financial trend analysis.',
  'Forecast Agent': 'Demand prediction, seasonal trends, and capacity planning for your business.',
  
  'Customer Portal Console': 'Self-service portal where customers can book appointments, view history, and communicate with your team.',
  'Field Operations Console': 'Real-time dashboard for dispatchers to manage technicians, routes, and job assignments.',
  'Business Management Console': 'Central hub for quotes, invoices, inventory, and customer relationship management.',
  'Marketing & Sales Console': 'Tools for campaigns, lead management, and sales pipeline tracking.',
  'Analytics & Reports Console': 'Comprehensive dashboards with KPIs, performance metrics, and business insights.',
  'Social Media Console': 'Unified dashboard to manage all your social media accounts and content calendar.',
  'AI Operatives Hub': 'Central control center for managing and monitoring all AI operatives.',
  'Message Aura (Text)': 'Text-based chat interface using keyboard input. Available on ALL tiers. No external dependencies required.',
  'Talk to Aura (Voice)': 'Speech-based AI conversations using microphone and speakers. Requires ElevenLabs for voice synthesis and SignalWire for telephony.',
  'ElevenLabs (Voice)': 'Required for Talk to Aura (Voice) features only (speech-based). NOT required for Message Aura (Text).',
  'SignalWire (SMS & Voice)': 'Required for SMS reminders and Talk to Aura (Voice) calls. NOT required for Message Aura (Text). 40% cheaper SMS than alternatives.',
};

// 4-Tier configuration
const TIERS = [
  {
    id: 'starter',
    name: 'Aura Core',
    originalMonthlyPrice: '$697',
    monthlyPrice: '$497',
    annualPrice: '$4,771',
    annualSavings: 'Save ~$994',
    description: 'Solo operators, restaurants, single-location',
    popular: false,
    agentCount: 8,
    consoleCount: 7,
    highlights: [
      '8 Smart AI Agents + Industry Specialists',
      'Voice + SMS + Email + Web Chat (your provider accounts)',
      '7 Control Centers',
      'Triage + Booking + Follow-Up + Review',
      'Creative Content + Web Presence + Social Media',
      '10 Employee Accounts',
    ],
  },
  {
    id: 'connect',
    name: 'Aura Boost',
    originalMonthlyPrice: '$1,394',
    monthlyPrice: '$994',
    annualPrice: '$9,542',
    annualSavings: 'Save ~$2,386',
    description: 'HVAC, plumbing, field service teams',
    popular: true,
    agentCount: 12,
    consoleCount: 7,
    highlights: [
      '12 Smart AI Agents + Industry Specialists',
      'Voice + SMS + Email + Web Chat (your provider accounts)',
      '7 Control Centers',
      'Dispatch + Route + ETA + Check-In',
      'Field Operations + Social Media + Analytics',
      '25 Employee Accounts',
    ],
  },
  {
    id: 'performance',
    name: 'Aura Pro',
    originalMonthlyPrice: '$2,788',
    monthlyPrice: '$1,988',
    annualPrice: '$19,085',
    annualSavings: 'Save ~$4,771',
    description: 'Growing companies with field teams',
    popular: false,
    agentCount: 16,
    consoleCount: 8,
    highlights: [
      '16 Smart AI Agents + Industry Specialists',
      'All 8 Control Centers (Business Mgmt unlocked)',
      'Quoting + Invoicing + Inventory',
      'Insights + Performance Agents',
      '50 Employee Accounts',
    ],
  },
  {
    id: 'command',
    name: 'Aura Elite',
    originalMonthlyPrice: '$5,576',
    monthlyPrice: '$3,979',
    annualPrice: '$38,198',
    annualSavings: 'Save ~$9,550',
    description: 'Full suite, enterprise',
    popular: false,
    agentCount: 24,
    consoleCount: 8,
    highlights: [
      '10 AI Operatives (Full Suite)',
      'All 8 Control Centers + AI Hub',
      'Revenue + Forecast Agents',
      'Priority Support',
      'Unlimited Employees',
    ],
  },
];

// Employee limits per tier
export const TIER_EMPLOYEE_LIMITS: Record<string, number> = {
  starter: 10,
  connect: 25,
  performance: 50,
  command: 999,
};

type FeatureValue = 'check' | 'x' | string;

interface FeatureRow {
  name: string;
  starter: FeatureValue;
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
    title: 'Smart AI Agents (8 / 12 / 16 / 24)',
    features: [
      { name: 'AI Receptionist (Triage)', starter: 'check', connect: 'check', performance: 'check', command: 'check' },
      { name: 'Booking Agent', starter: 'check', connect: 'check', performance: 'check', command: 'check' },
      { name: 'Follow-Up Agent', starter: 'check', connect: 'check', performance: 'check', command: 'check' },
      { name: 'Review Agent', starter: 'check', connect: 'check', performance: 'check', command: 'check' },
      { name: 'Creative Content Agent', starter: 'check', connect: 'check', performance: 'check', command: 'check' },
      { name: 'Campaign Agent', starter: 'check', connect: 'check', performance: 'check', command: 'check' },
      { name: 'Lead Agent', starter: 'check', connect: 'check', performance: 'check', command: 'check' },
      { name: 'Outreach Agent', starter: 'check', connect: 'check', performance: 'check', command: 'check' },
      { name: 'Dispatch/GPS Console', starter: 'x', connect: 'check', performance: 'check', command: 'check' },
      { name: 'Route Agent', starter: 'x', connect: 'check', performance: 'check', command: 'check' },
      { name: 'ETA Agent', starter: 'x', connect: 'check', performance: 'check', command: 'check' },
      { name: 'Check-In Agent', starter: 'x', connect: 'check', performance: 'check', command: 'check' },
      { name: 'Marketing Agent', starter: 'check', connect: 'check', performance: 'check', command: 'check' },
      { name: 'Web Presence Agent', starter: 'check', connect: 'check', performance: 'check', command: 'check' },
      { name: 'Social Scheduler Agent', starter: 'x', connect: 'x', performance: 'check', command: 'check' },
      { name: 'Social Analytics Agent', starter: 'x', connect: 'x', performance: 'check', command: 'check' },
      { name: 'Campaign Agent', starter: 'x', connect: 'x', performance: 'check', command: 'check' },
      { name: 'Outreach Agent', starter: 'x', connect: 'x', performance: 'check', command: 'check' },
      { name: 'Admin Agent', starter: 'x', connect: 'x', performance: 'x', command: 'check' },
      { name: 'Quoting Agent', starter: 'x', connect: 'x', performance: 'x', command: 'check' },
      { name: 'Invoice Agent', starter: 'x', connect: 'x', performance: 'x', command: 'check' },
      { name: 'Inventory Agent', starter: 'x', connect: 'x', performance: 'x', command: 'check' },
      { name: 'Insights Agent', starter: 'x', connect: 'x', performance: 'x', command: 'check' },
      { name: 'Performance Agent', starter: 'x', connect: 'x', performance: 'x', command: 'check' },
    ],
  },
  {
    title: 'Control Centers (7 / 7 / 8 / 8)',
    features: [
      { name: 'Customer Portal Console', starter: 'check', connect: 'check', performance: 'check', command: 'check' },
      { name: 'Marketing & Sales Console', starter: 'check', connect: 'check', performance: 'check', command: 'check' },
      { name: 'Creative & Web Presence Console', starter: 'check', connect: 'check', performance: 'check', command: 'check' },
      { name: 'Social Media Console', starter: 'check', connect: 'check', performance: 'check', command: 'check' },
      { name: 'Field Operations Console', starter: 'check', connect: 'check', performance: 'check', command: 'check' },
      { name: 'Analytics & Reports Console', starter: 'check', connect: 'check', performance: 'check', command: 'check' },
      { name: 'AI Operatives Hub', starter: 'check', connect: 'check', performance: 'check', command: 'check' },
      { name: 'Business Management Console', starter: 'x', connect: 'x', performance: 'check', command: 'check' },
    ],
  },
  {
    title: 'Communication Channels (your provider accounts — billed separately)',
    features: [
      { name: 'Message Aura (Text)', starter: 'check', connect: 'check', performance: 'check', command: 'check' },
      { name: 'Talk to Aura (Voice)', starter: 'check', connect: 'check', performance: 'check', command: 'check' },
      { name: 'Email Reminders', starter: 'check', connect: 'check', performance: 'check', command: 'check' },
      { name: 'SMS Reminders', starter: 'check', connect: 'check', performance: 'check', command: 'check' },
    ],
  },
  {
    title: 'Platform Limits & Features',
    features: [
      { name: 'Appointments', starter: 'Unlimited', connect: 'Unlimited', performance: 'Unlimited', command: 'Unlimited' },
      { name: 'Employee Accounts', starter: '10 included', connect: '25 included', performance: '50 included', command: 'Unlimited' },
      { name: 'Additional Employees', starter: '$25/10 employees', connect: '$25/10 employees', performance: '$25/10 employees', command: 'Included' },
      { name: 'Embeddable Chat Widget', starter: 'check', connect: 'check', performance: 'check', command: 'check' },
    ],
  },
  {
    title: 'Support',
    features: [
      { name: 'API Access', starter: 'check', connect: 'check', performance: 'check', command: 'check' },
      { name: 'Priority Support', starter: 'x', connect: 'x', performance: 'check', command: 'check' },
    ],
  },
  {
    title: 'Required 3rd-Party Accounts (billed separately by each provider)',
    features: [
      { name: 'Resend (Email)', starter: 'Your account', connect: 'Your account', performance: 'Your account', command: 'Your account' },
      { name: 'SignalWire (SMS & Voice)', starter: 'Your account', connect: 'Your account', performance: 'Your account', command: 'Your account' },
      { name: 'ElevenLabs (Voice)', starter: 'Your account', connect: 'Your account', performance: 'Your account', command: 'Your account' },
      { name: 'A2P 10DLC Compliance', starter: 'Your SignalWire acct', connect: 'Your SignalWire acct', performance: 'Your SignalWire acct', command: 'Your SignalWire acct' },
      { name: 'Tavily (AI Research)', starter: 'Your account', connect: 'Your account', performance: 'Your account', command: 'Your account' },
      { name: 'Stripe (Payments)', starter: 'Your account', connect: 'Your account', performance: 'Your account', command: 'Your account' },
      { name: 'Calendar Sync (Google / iCal)', starter: 'Connect yours', connect: 'Connect yours', performance: 'Connect yours', command: 'Connect yours' },
      { name: 'Social Media Accounts', starter: 'Connect yours', connect: 'Connect yours', performance: 'Connect yours', command: 'Connect yours' },
    ],
  },
  {
    title: 'Pricing',
    features: [
      { name: 'Monthly Price (Beta Pricing)', starter: '~~$697~~ $497', connect: '~~$1,394~~ $994', performance: '~~$2,788~~ $1,988', command: '~~$5,576~~ $3,979' },
      { name: 'Annual Price', starter: '$4,771/year', connect: '$9,542/year', performance: '$19,085/year', command: '$38,198/year' },
      { name: 'Annual Savings', starter: 'Save ~$994', connect: 'Save ~$2,386', performance: 'Save ~$4,771', command: 'Save ~$9,550' },
      { name: 'Onboarding Fee (Beta Pricing)', starter: '~~$497~~ $497', connect: '~~$497~~ $497', performance: '~~$497~~ $497', command: '~~$497~~ $497' },
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
  const [betaCode, setBetaCode] = useState<BetaCodeResult | null>(null);

  // Determine if user can manage subscriptions
  const canManageSubscription = userRole === 'company_admin' || userRole === 'platform_admin';
  const isEmployee = userRole === 'employee';
  const isCustomer = userRole === 'customer';

  // Calculate trial days remaining
  const trialDaysRemaining = trialEndsAt 
    ? Math.max(0, Math.ceil((new Date(trialEndsAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24)))
    : 0;
  const trialProgressPercent = Math.min(((90 - trialDaysRemaining) / 90) * 100, 100);

  // Check for success/canceled params
  useEffect(() => {
    if (searchParams.get('success') === 'true') {
      toast.success('Subscription activated successfully!');
    } else if (searchParams.get('canceled') === 'true') {
      toast.info('Checkout was canceled.');
    }
  }, [searchParams]);

  // Auto-apply ?beta_code=... when arriving from signup or a shared link.
  useEffect(() => {
    const code = searchParams.get('beta_code');
    if (!code || betaCode) return;
    (async () => {
      const { data, error } = await supabase.rpc('validate_beta_code', { p_code: code });
      const row = Array.isArray(data) ? data[0] : data;
      if (error || !row?.valid) return;
      setBetaCode({
        code: code.toUpperCase(),
        label: row.label ?? null,
        trial_days: row.trial_days ?? 60,
        waive_onboarding_fee: !!row.waive_onboarding_fee,
        onboarding_fee_cap_cents: row.onboarding_fee_cap_cents ?? null,
        onboarding_cap_expires_at: row.onboarding_cap_expires_at ?? null,
      });
      toast.success(`Beta code ${code.toUpperCase()} applied`);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
        body: { tier: tierId, beta_code: betaCode?.code ?? null },
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
    
    const isPricing = featureName === 'Monthly Price' || featureName.startsWith('Monthly Price') || featureName.startsWith('Onboarding Fee');
    const isSavings = value.includes('Save');
    const isAddon = value.includes('Add-on') || value.startsWith('+$');
    const isOptional = value === 'Optional';
    // Support `~~old~~ new` markdown-style strikethrough for Beta Pricing rows.
    const strikeMatch = typeof value === 'string' ? value.match(/^~~(.+?)~~\s+(.+)$/) : null;
    
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
        {strikeMatch ? (
          <span className="inline-flex items-baseline gap-1.5 flex-wrap justify-center">
            <span className="text-muted-foreground line-through decoration-destructive/70 text-[11px]">{strikeMatch[1]}</span>
            <span className="text-primary font-semibold">{strikeMatch[2]}</span>
          </span>
        ) : (
          value
        )}
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
                      Live Trial
                    </span>
                    {trialDaysRemaining <= 3 && (
                      <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-600">
                        Ending Soon
                      </span>
                    )}
                  </div>
                  <p className="font-medium text-card-foreground">
                    {trialDaysRemaining} day{trialDaysRemaining !== 1 ? 's' : ''} remaining in your 60-day live trial
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
                    Current plan: <span className="font-semibold text-primary capitalize">{currentTier?.replace('_', '-') || 'None'}</span>
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

        {/* Beta invite code redemption (admins only, pre-subscribe) */}
        {!isSubscribed && canManageSubscription && (
          <Card className="border-primary/30 bg-card">
            <CardContent className="py-4 space-y-3">
              <div className="flex items-center justify-between gap-3 flex-wrap">
                <div>
                  <p className="font-medium text-card-foreground flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-primary" />
                    Beta tester? Apply your invite code
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Unlocks a 60-day free trial (14–30 days concierge onboarding, then 30 days
                    full live use) and waives the one-time onboarding fee.
                  </p>
                </div>
              </div>
              <BetaCodeInput applied={betaCode} onApplied={setBetaCode} />
              <ThirdPartyFeeNotice />
            </CardContent>
          </Card>
        )}

        {/* Tier Cards */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
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
                  <div className="flex items-baseline justify-center gap-2">
                    {tier.originalMonthlyPrice && (
                      <span className="text-base text-muted-foreground line-through decoration-2 decoration-destructive/70">{tier.originalMonthlyPrice}</span>
                    )}
                    <span className="text-4xl font-bold text-primary">{tier.monthlyPrice}</span>
                    <span className="text-muted-foreground">/mo</span>
                  </div>
                  <div className="mt-1 flex justify-center">
                    <span className="inline-flex items-center rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-primary border border-primary/20">
                      Beta Pricing
                    </span>
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
                        <div>Core</div>
                        <div className="text-[10px] font-normal"><span className="line-through text-muted-foreground">$697</span> <span className="text-primary font-semibold">$497</span>/mo</div>
                      </th>
                      <th className="text-center py-2.5 px-2 font-semibold bg-primary/20 border-x border-primary/30 text-xs">
                        <div className="text-primary">Boost</div>
                        <div className="text-[10px] font-normal"><span className="line-through text-muted-foreground">$1,394</span> <span className="text-primary font-semibold">$994</span>/mo</div>
                      </th>
                      <th className="text-center py-2.5 px-2 font-semibold text-card-foreground text-xs">
                        <div>Pro</div>
                        <div className="text-[10px] font-normal"><span className="line-through text-muted-foreground">$2,788</span> <span className="text-primary font-semibold">$1,988</span>/mo</div>
                      </th>
                      <th className="text-center py-2.5 px-2 font-semibold text-card-foreground text-xs">
                        <div>Elite</div>
                        <div className="text-[10px] font-normal"><span className="line-through text-muted-foreground">$5,576</span> <span className="text-primary font-semibold">$3,979</span>/mo</div>
                      </th>
                    </tr>
                  </thead>
                  <tbody className="text-sm">
                    {sections.map((section) => (
                      <>
                        <tr key={`section-${section.title}`} className="bg-muted/30">
                          <td colSpan={5} className="py-1.5 px-4 font-semibold text-primary">
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
                                {renderFeatureValue(feature.starter, false, feature.name)}
                                {renderFeatureValue(feature.connect, currentTier === 'connect', feature.name)}
                                {renderFeatureValue(feature.performance, false, feature.name)}
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
                <span className="text-card-foreground font-medium">60-Day Live Trial</span>
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
                <span className="text-muted-foreground">
                  Onboarding Fee (one-time, due at start of 60-Day Live Trial) — <span className="text-primary font-semibold">Beta Pricing:</span>{' '}
                  Core <span className="line-through">$497</span> <span className="text-foreground font-semibold">$497</span> ·{' '}
                  Boost <span className="line-through">$497</span> <span className="text-foreground font-semibold">$497</span> ·{' '}
                  Pro <span className="line-through">$497</span> <span className="text-foreground font-semibold">$497</span> ·{' '}
                  Elite <span className="line-through">$497</span> <span className="text-foreground font-semibold">$497</span>
                </span>
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
                <MessageSquare className="w-5 h-5 text-cyan-400 mt-0.5" />
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
              <h4 className="font-medium text-card-foreground">What's the difference between Core, Boost, Pro, and Elite?</h4>
              <p className="text-sm text-muted-foreground">
                <span className="text-primary font-semibold">Beta Pricing:</span> Core (was $697 → <span className="font-semibold">$497/mo</span>) includes 8 AI agents ideal for solo operators and restaurants. Boost (was $1,394 → <span className="font-semibold">$994/mo</span>) adds dispatch, routing, and field operations — perfect for HVAC, plumbing, and field service. Pro (was $2,788 → <span className="font-semibold">$1,988/mo</span>) adds campaign, outreach, and social media. Elite (was $5,576 → <span className="font-semibold">$3,979/mo</span>) includes all 24 agents plus admin, quoting, invoicing, inventory, predictive analytics, and AI Hub for enterprise teams. Industry Specialist Operatives (Diagnostic, Permit & Code, Site Survey, Insurance Claim, Listing Writer, Recall, Menu Writer, etc.) auto-activate based on your industry on every plan — including the 60-Day Live Trial.
              </p>
            </div>
            <div>
              <h4 className="font-medium text-card-foreground">What happens when my trial ends?</h4>
              <p className="text-sm text-muted-foreground">
                When your 60-day trial ends, you'll need to subscribe to continue using AI features. Your data will be preserved.
              </p>
            </div>
            <div>
              <h4 className="font-medium text-card-foreground">How does employee pricing work?</h4>
              <p className="text-sm text-muted-foreground">
                Core includes 10 employees, Boost includes 25, Pro includes 50, and Elite includes unlimited. Additional employees beyond your tier's limit cost $25/month per 10 employees.
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
      tierId={pendingTierId ?? undefined}
      onConfirm={handleCheckoutConfirmed}
      onCancel={() => { setDisclosureOpen(false); setPendingTierId(null); }}
    />
    </>
  );
}
