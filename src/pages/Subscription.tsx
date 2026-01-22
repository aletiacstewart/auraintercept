import { useState, useEffect } from 'react';
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
import { Check, X, Crown, ExternalLink, Loader2, Clock, Sparkles, Users, Mail, MessageSquare, Mic, Info, Globe, Share2, Building } from 'lucide-react';
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
  'Warranty Agent': 'Manages warranty claims, tracks coverage periods, and automates claim processing.',
  'Campaign Agent': 'Creates and manages marketing campaigns with automated targeting and scheduling.',
  'Lead Agent': 'Qualifies and scores leads, assigns to sales reps, and tracks conversion progress.',
  'Promo Agent': 'Manages promotional codes, discounts, and special offers across channels.',
  'Performance Agent': 'Analyzes team and individual performance metrics with actionable insights.',
  'Revenue Agent': 'Tracks revenue trends, forecasts income, and identifies growth opportunities.',
  'Insights Agent': 'Generates business intelligence reports and identifies patterns in your data.',
  'Forecast Agent': 'Predicts demand, resource needs, and revenue based on historical data.',
  'Social Media Agent': 'Creates, schedules, and publishes social media content to grow your online presence.',
  'Customer Portal Console': 'Self-service portal where customers can book appointments, view history, and communicate with your team.',
  'Field Operations Console': 'Real-time dashboard for dispatchers to manage technicians, routes, and job assignments.',
  'Business Management Console': 'Central hub for quotes, invoices, inventory, and customer relationship management.',
  'Marketing & Sales Console': 'Tools for campaigns, lead management, and sales pipeline tracking.',
  'Analytics & Reports Console': 'Comprehensive dashboards with KPIs, performance metrics, and business insights.',
  'Social Media Console': 'Unified dashboard to manage all your social media accounts and content calendar.',
};

// Tier configuration matching homepage
const TIERS = [
  {
    id: 'single_point',
    name: 'Single-Point',
    monthlyPrice: '$497',
    annualPrice: '$4,970',
    annualSavings: 'Save $994',
    description: 'Lead intake & reputation management',
    popular: false,
    agentCount: 3,
    consoleCount: 1,
    highlights: [
      '3 AI Agents',
      'Customer Portal Console',
      'AI Voice Chat & Calling',
      '5 Employee Accounts',
    ],
  },
  {
    id: 'multi_track',
    name: 'Multi-Track',
    monthlyPrice: '$897',
    annualPrice: '$8,970',
    annualSavings: 'Save $1,794',
    description: 'Customer + Field Operations + Booking',
    popular: true,
    agentCount: 10,
    consoleCount: 2,
    highlights: [
      '10 AI Agents',
      '2 Control Centers',
      'Online Booking & Scheduling',
      '10 Employee Accounts',
    ],
  },
  {
    id: 'command',
    name: 'Command',
    monthlyPrice: '$1,497',
    annualPrice: '$14,970',
    annualSavings: 'Save $2,994',
    description: 'Full business automation suite',
    popular: false,
    agentCount: 19,
    consoleCount: 5,
    highlights: [
      'All 19 AI Agents',
      'All 5 Control Centers',
      'White-Label Branding',
      'Unlimited Employees',
    ],
  },
];

// Add-ons configuration
const ADDONS = [
  {
    id: 'social_media',
    name: 'Social Media AI Content',
    price: '$150',
    period: '/mo',
    icon: Share2,
    features: [
      '6-platform content generation',
      'Automated scheduling',
      'Brand voice consistency',
      'Analytics dashboard',
    ],
  },
  {
    id: 'smart_website',
    name: '1-Page Smart Website',
    price: '$150',
    period: '/mo',
    icon: Globe,
    features: [
      'AI-powered website',
      'Integrated chat & voice',
      'Lead capture forms',
      'Mobile responsive',
    ],
  },
];

type FeatureValue = 'check' | 'x' | string;

interface FeatureRow {
  name: string;
  singlePoint: FeatureValue;
  multiTrack: FeatureValue;
  command: FeatureValue;
}

interface FeatureSection {
  title: string;
  features: FeatureRow[];
}

const sections: FeatureSection[] = [
  {
    title: 'AI Agents (3 / 10 / 19)',
    features: [
      { name: 'AI Receptionist (Triage)', singlePoint: 'check', multiTrack: 'check', command: 'check' },
      { name: 'Follow-up Agent', singlePoint: 'check', multiTrack: 'check', command: 'check' },
      { name: 'Review Agent', singlePoint: 'check', multiTrack: 'check', command: 'check' },
      { name: 'Scheduling Agent (Booking)', singlePoint: 'x', multiTrack: 'check', command: 'check' },
      { name: 'Dispatch Agent', singlePoint: 'x', multiTrack: 'check', command: 'check' },
      { name: 'Route Agent', singlePoint: 'x', multiTrack: 'check', command: 'check' },
      { name: 'ETA Agent', singlePoint: 'x', multiTrack: 'check', command: 'check' },
      { name: 'Check-in Agent', singlePoint: 'x', multiTrack: 'check', command: 'check' },
      { name: 'Quote Agent', singlePoint: 'x', multiTrack: 'check', command: 'check' },
      { name: 'Invoice Agent', singlePoint: 'x', multiTrack: 'check', command: 'check' },
      { name: 'Inventory Agent', singlePoint: 'x', multiTrack: 'x', command: 'check' },
      { name: 'Warranty Agent', singlePoint: 'x', multiTrack: 'x', command: 'check' },
      { name: 'Campaign Agent', singlePoint: 'x', multiTrack: 'x', command: 'check' },
      { name: 'Lead Agent', singlePoint: 'x', multiTrack: 'x', command: 'check' },
      { name: 'Promo Agent', singlePoint: 'x', multiTrack: 'x', command: 'check' },
      { name: 'Performance Agent', singlePoint: 'x', multiTrack: 'x', command: 'check' },
      { name: 'Revenue Agent', singlePoint: 'x', multiTrack: 'x', command: 'check' },
      { name: 'Insights Agent', singlePoint: 'x', multiTrack: 'x', command: 'check' },
      { name: 'Forecast Agent', singlePoint: 'x', multiTrack: 'x', command: 'check' },
      { name: 'Social Media Agent', singlePoint: 'Add-on', multiTrack: 'Add-on', command: 'Add-on' },
    ],
  },
  {
    title: 'Control Centers (Consoles)',
    features: [
      { name: 'Customer Portal Console', singlePoint: 'check', multiTrack: 'check', command: 'check' },
      { name: 'Field Operations Console', singlePoint: 'x', multiTrack: 'check', command: 'check' },
      { name: 'Business Management Console', singlePoint: 'x', multiTrack: 'x', command: 'check' },
      { name: 'Marketing & Sales Console', singlePoint: 'x', multiTrack: 'x', command: 'check' },
      { name: 'Analytics & Reports Console', singlePoint: 'x', multiTrack: 'x', command: 'check' },
      { name: 'Social Media Console', singlePoint: 'Add-on', multiTrack: 'Add-on', command: 'Add-on' },
    ],
  },
  {
    title: 'Communication Channels',
    features: [
      { name: 'Email Reminders', singlePoint: 'check', multiTrack: 'check', command: 'check' },
      { name: 'SMS Reminders', singlePoint: 'check', multiTrack: 'check', command: 'check' },
      { name: 'AI Voice (Chat & Outbound Calls)', singlePoint: 'check', multiTrack: 'check', command: 'check' },
    ],
  },
  {
    title: 'Platform Limits & Features',
    features: [
      { name: 'Appointments', singlePoint: 'Unlimited', multiTrack: 'Unlimited', command: 'Unlimited' },
      { name: 'Employee Accounts', singlePoint: '5 included', multiTrack: '10 included', command: 'Unlimited' },
      { name: 'Additional Employees', singlePoint: '$25/mo per 10', multiTrack: '$25/mo per 10', command: 'Included' },
      { name: 'White-Label Branding', singlePoint: 'x', multiTrack: 'x', command: 'check' },
      { name: 'Smart Website', singlePoint: '+$150/mo', multiTrack: '+$150/mo', command: '+$150/mo' },
      { name: 'Social Media Integration', singlePoint: '+$150/mo', multiTrack: '+$150/mo', command: '+$150/mo' },
      { name: 'Embeddable Chat Widget', singlePoint: 'check', multiTrack: 'check', command: 'check' },
    ],
  },
  {
    title: 'Integration & Support',
    features: [
      { name: 'Calendar Sync', singlePoint: 'check', multiTrack: 'check', command: 'check' },
      { name: 'CRM Integration', singlePoint: 'x', multiTrack: 'check', command: 'check' },
      { name: 'API Access', singlePoint: 'x', multiTrack: 'x', command: 'check' },
      { name: 'Priority Support', singlePoint: 'x', multiTrack: 'check', command: 'check' },
      { name: 'Dedicated Account Manager', singlePoint: 'x', multiTrack: 'x', command: 'check' },
    ],
  },
  {
    title: 'Required 3rd Party Integrations',
    features: [
      { name: 'Resend (Email)', singlePoint: 'Required', multiTrack: 'Required', command: 'Required' },
      { name: 'Stripe (Payments)', singlePoint: 'Required', multiTrack: 'Required', command: 'Required' },
      { name: 'Twilio (SMS & Voice)', singlePoint: 'Required', multiTrack: 'Required', command: 'Required' },
      { name: 'ElevenLabs (AI Voice)', singlePoint: 'Required', multiTrack: 'Required', command: 'Required' },
      { name: 'Calendar Sync', singlePoint: 'Optional', multiTrack: 'Optional', command: 'Optional' },
      { name: 'Social Media Accounts', singlePoint: 'Optional', multiTrack: 'Optional', command: 'Optional' },
    ],
  },
  {
    title: 'Pricing',
    features: [
      { name: 'Monthly Price', singlePoint: '$497', multiTrack: '$897', command: '$1,497' },
      { name: 'Annual Price', singlePoint: '$4,970/year', multiTrack: '$8,970/year', command: '$14,970/year' },
      { name: 'Annual Savings', singlePoint: 'Save $994', multiTrack: 'Save $1,794', command: 'Save $2,994' },
    ],
  },
];

export default function Subscription() {
  const { user, inTrial, trialEndsAt } = useAuth();
  const [searchParams] = useSearchParams();
  const [loading, setLoading] = useState(false);
  const [portalLoading, setPortalLoading] = useState(false);

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

  const handleSubscribe = async () => {
    try {
      setLoading(true);
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session?.access_token) {
        toast.error('Please log in to subscribe');
        return;
      }

      const { data, error } = await supabase.functions.invoke('create-checkout', {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (error) throw error;
      if (data?.url) {
        window.open(data.url, '_blank');
      }
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
    <DashboardLayout>
      <PageContainer>
        <div className="space-y-6 animate-fade-in">
        <PageHeader
          icon={Crown}
          title="Subscription"
          description={isInTrial ? 'Subscribe to continue after your trial' : 'Choose the plan that fits your business'}
          showAuraBar
          action={
            isSubscribed ? (
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

        {/* Current Status */}
        {isLoading ? (
          <Skeleton className="h-20 w-full" />
        ) : isSubscribed ? (
          <Card className="border-amber-500/30 bg-amber-500/5">
            <CardContent className="flex items-center justify-between py-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-amber-500/20 flex items-center justify-center">
                  <Crown className="w-5 h-5 text-amber-500" />
                </div>
                <div>
                  <p className="font-medium text-card-foreground">
                    You're on the <span className="text-amber-500 font-semibold capitalize">{currentTier?.replace('_', '-')}</span> plan
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
        <div className="grid md:grid-cols-3 gap-6">
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

                <Button 
                  className={cn(
                    "w-full",
                    tier.popular && "bg-primary hover:bg-primary/90"
                  )}
                  variant={tier.popular ? "default" : "outline"}
                  onClick={handleSubscribe}
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
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Premium Add-Ons */}
        <div className="space-y-4">
          <h3 className="text-xl font-semibold text-card-foreground">Premium Add-Ons</h3>
          <div className="grid md:grid-cols-2 gap-6">
            {ADDONS.map((addon) => (
              <Card key={addon.id} className="bg-card border-amber-500/30">
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-amber-500/20 flex items-center justify-center">
                        <addon.icon className="w-5 h-5 text-amber-500" />
                      </div>
                      <div>
                        <CardTitle className="text-lg text-card-foreground">{addon.name}</CardTitle>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="text-2xl font-bold text-amber-500">{addon.price}</span>
                      <span className="text-muted-foreground">{addon.period}</span>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    {addon.features.map((feature, idx) => (
                      <div key={idx} className="flex items-center gap-2 text-card-foreground">
                        <Check className="w-3 h-3 text-emerald-500" />
                        <span>{feature}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
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
                <table className="w-full text-sm table-fixed">
                  <colgroup>
                    <col className="w-[45%]" />
                    <col className="w-[18%]" />
                    <col className="w-[19%]" />
                    <col className="w-[18%]" />
                  </colgroup>
                  <thead>
                    <tr className="border-b border-border bg-muted/50">
                      <th className="text-left py-2.5 px-4 font-semibold text-card-foreground text-sm">Feature</th>
                      <th className="text-center py-2.5 px-3 font-semibold text-card-foreground text-sm">
                        <div>Single-Point</div>
                        <div className="text-xs font-normal text-muted-foreground">$497/mo</div>
                      </th>
                      <th className="text-center py-2.5 px-3 font-semibold bg-primary/20 border-x border-primary/30 text-sm">
                        <div className="text-primary">Multi-Track</div>
                        <div className="text-xs font-normal text-muted-foreground">$897/mo</div>
                      </th>
                      <th className="text-center py-2.5 px-3 font-semibold text-card-foreground text-sm">
                        <div>Command</div>
                        <div className="text-xs font-normal text-muted-foreground">$1,497/mo</div>
                      </th>
                    </tr>
                  </thead>
                  <tbody className="text-sm">
                    {sections.map((section) => (
                      <>
                        {/* Section Header */}
                        <tr key={`section-${section.title}`} className="bg-muted/30">
                          <td colSpan={4} className="py-1.5 px-4 font-semibold text-primary">
                            {section.title}
                          </td>
                        </tr>
                        
                        {/* Section Rows */}
                        {section.features.map((feature) => {
                          const rowIndex = globalRowIndex++;
                          const isEven = rowIndex % 2 === 0;
                          const rowBg = isEven ? 'bg-muted/10' : '';
                          
                          return (
                            <Tooltip key={feature.name}>
                              <tr className={`border-b border-border/50 hover:bg-muted/20 ${rowBg}`}>
                                <FeatureNameCell name={feature.name} rowIndex={rowIndex} />
                                {renderFeatureValue(feature.singlePoint, false, feature.name)}
                                {renderFeatureValue(feature.multiTrack, true, feature.name)}
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
                <span className="text-muted-foreground">Additional employees: $25/month per 10</span>
              </div>
              <span className="text-muted-foreground">•</span>
              <div className="flex items-center gap-2">
                <Building className="w-4 h-4 text-primary" />
                <span className="text-muted-foreground">One-Time Implementation Fee: $499 - $999</span>
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
                  <p className="text-muted-foreground">Usage-based via Twilio</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Mic className="w-5 h-5 text-violet-500 mt-0.5" />
                <div>
                  <p className="font-medium text-card-foreground">AI Voice Calls</p>
                  <p className="text-muted-foreground">Usage-based via ElevenLabs + Twilio</p>
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
              <h4 className="font-medium text-card-foreground">What's the difference between Single-Point and Multi-Track?</h4>
              <p className="text-sm text-muted-foreground">
                Single-Point includes AI Voice (chat & calling) for customer engagement, but customers must call to book appointments. Multi-Track adds online booking, field operations, and quoting/invoicing capabilities.
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
                Each tier includes a set number of employee accounts. Additional employees beyond your tier's limit cost $25/month per 10 employees.
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
  );
}
