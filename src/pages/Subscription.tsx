import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useSearchParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Progress } from '@/components/ui/progress';
import { toast } from 'sonner';
import { Check, X, Crown, ExternalLink, Loader2, Clock, Sparkles, Users, Mail, MessageSquare, Mic, Info, Phone, Calendar, Truck, BarChart3, Megaphone } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SubscriptionStatus {
  subscribed: boolean;
  tier: string | null;
  product_id: string | null;
  subscription_end: string | null;
  in_trial?: boolean;
  trial_ends_at?: string | null;
}

// Tier configuration with features
const TIERS = [
  {
    id: 'single_point',
    name: 'Single-Point',
    price: '$497',
    description: 'Customer engagement + AI Voice',
    popular: false,
    features: {
      // AI Agents
      triage: true,
      booking: false,
      followup: true,
      review: true,
      dispatch: false,
      fieldOps: false,
      quoting: false,
      invoice: false,
      inventory: false,
      warranty: false,
      campaign: false,
      analytics: false,
      // Features
      voiceChat: true,
      outboundCalls: true,
      chatWidget: true,
      onlineBooking: false,
      employees: '10 included',
    },
  },
  {
    id: 'multi_track',
    name: 'Multi-Track',
    price: '$897',
    description: 'Customer + Field Operations + Online Booking',
    popular: true,
    features: {
      triage: true,
      booking: true,
      followup: true,
      review: true,
      dispatch: true,
      fieldOps: true,
      quoting: true,
      invoice: true,
      inventory: false,
      warranty: false,
      campaign: false,
      analytics: false,
      voiceChat: true,
      outboundCalls: true,
      chatWidget: true,
      onlineBooking: true,
      employees: '20 included',
    },
  },
  {
    id: 'command',
    name: 'Command',
    price: '$1,497',
    description: 'Full business automation suite',
    popular: false,
    features: {
      triage: true,
      booking: true,
      followup: true,
      review: true,
      dispatch: true,
      fieldOps: true,
      quoting: true,
      invoice: true,
      inventory: true,
      warranty: true,
      campaign: true,
      analytics: true,
      voiceChat: true,
      outboundCalls: true,
      chatWidget: true,
      onlineBooking: true,
      employees: '50 included',
    },
  },
];

const FEATURE_ROWS = [
  { key: 'header_agents', label: 'AI Agents', isHeader: true },
  { key: 'triage', label: 'AI Receptionist (Triage)', icon: Phone },
  { key: 'booking', label: 'Online Booking Agent', icon: Calendar },
  { key: 'followup', label: 'Follow-up Agent', icon: MessageSquare },
  { key: 'review', label: 'Review Request Agent', icon: Check },
  { key: 'dispatch', label: 'Emergency Dispatch', icon: Truck },
  { key: 'fieldOps', label: 'Field Operations (Route, ETA, Check-in)', icon: Truck },
  { key: 'quoting', label: 'Quoting Agent', icon: Mail },
  { key: 'invoice', label: 'Invoice Agent', icon: Mail },
  { key: 'inventory', label: 'Inventory Agent', icon: BarChart3 },
  { key: 'warranty', label: 'Warranty Agent', icon: Check },
  { key: 'campaign', label: 'Campaign Agent', icon: Megaphone },
  { key: 'analytics', label: 'Analytics Agents (Insights, Revenue, Forecast)', icon: BarChart3 },
  { key: 'header_features', label: 'Voice & Communication', isHeader: true },
  { key: 'voiceChat', label: 'AI Voice Chat (ElevenLabs)', icon: Mic },
  { key: 'outboundCalls', label: 'AI Outbound Calling', icon: Phone },
  { key: 'chatWidget', label: 'Embeddable Chat Widget', icon: MessageSquare },
  { key: 'onlineBooking', label: 'Online Appointment Booking', icon: Calendar },
  { key: 'header_limits', label: 'Platform Limits', isHeader: true },
  { key: 'employees', label: 'Employee Accounts', icon: Users },
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

  const renderFeatureValue = (tier: typeof TIERS[0], featureKey: string) => {
    const value = tier.features[featureKey as keyof typeof tier.features];
    
    if (typeof value === 'string') {
      return <span className="text-sm text-foreground">{value}</span>;
    }
    
    if (value === true) {
      return <Check className="w-5 h-5 text-green-500" />;
    }
    
    return <X className="w-5 h-5 text-slate-400" />;
  };

  return (
    <DashboardLayout>
      <div className="space-y-6 animate-fade-in">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Subscription</h1>
            <p className="text-muted-foreground">
              {isInTrial ? 'Subscribe to continue after your trial' : 'Choose the plan that fits your business'}
            </p>
          </div>
          {isSubscribed && (
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
          )}
        </div>

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
                  <p className="font-medium">
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
                  <p className="font-medium">
                    You're on the <span className="text-amber-600 font-semibold capitalize">{currentTier?.replace('_', '-')}</span> plan
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
                "relative overflow-hidden transition-all",
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
                <CardTitle className="text-xl">{tier.name}</CardTitle>
                <CardDescription className="text-sm">{tier.description}</CardDescription>
              </CardHeader>
              
              <CardContent className="space-y-4">
                <div className="text-center">
                  <div className="flex items-baseline justify-center gap-1">
                    <span className="text-4xl font-bold">{tier.price}</span>
                    <span className="text-muted-foreground">/mo</span>
                  </div>
                </div>

                {/* Key highlights */}
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2">
                    <Mic className="w-4 h-4 text-primary" />
                    <span>AI Voice Chat & Calling</span>
                  </div>
                  {tier.features.booking ? (
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-primary" />
                      <span>Online Booking</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Phone className="w-4 h-4" />
                      <span>Call to Book</span>
                    </div>
                  )}
                  {tier.features.dispatch && (
                    <div className="flex items-center gap-2">
                      <Truck className="w-4 h-4 text-primary" />
                      <span>Field Operations</span>
                    </div>
                  )}
                  {tier.features.analytics && (
                    <div className="flex items-center gap-2">
                      <BarChart3 className="w-4 h-4 text-primary" />
                      <span>Full Analytics Suite</span>
                    </div>
                  )}
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Users className="w-4 h-4" />
                    <span>{tier.features.employees}</span>
                  </div>
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

        {/* Feature Comparison Table */}
        <Card>
          <CardHeader>
            <CardTitle>Feature Comparison</CardTitle>
            <CardDescription>See what's included in each plan</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-4 font-medium">Feature</th>
                    {TIERS.map((tier) => (
                      <th key={tier.id} className="text-center py-3 px-4 font-medium">
                        {tier.name}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {FEATURE_ROWS.map((row) => (
                    <tr 
                      key={row.key} 
                      className={cn(
                        "border-b last:border-b-0",
                        row.isHeader && "bg-muted/50"
                      )}
                    >
                      <td className={cn(
                        "py-3 px-4",
                        row.isHeader ? "font-semibold text-foreground" : "text-sm"
                      )}>
                        <div className="flex items-center gap-2">
                          {row.icon && !row.isHeader && <row.icon className="w-4 h-4 text-muted-foreground" />}
                          {row.label}
                        </div>
                      </td>
                      {!row.isHeader && TIERS.map((tier) => (
                        <td key={tier.id} className="text-center py-3 px-4">
                          {renderFeatureValue(tier, row.key)}
                        </td>
                      ))}
                      {row.isHeader && TIERS.map((tier) => (
                        <td key={tier.id} className="text-center py-3 px-4"></td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* Usage-based pricing info */}
        <Card className="border-border/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Info className="w-5 h-5 text-primary" />
              Usage-Based Pricing
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-3 gap-4 text-sm">
              <div className="flex items-start gap-3">
                <Mail className="w-5 h-5 text-green-500 mt-0.5" />
                <div>
                  <p className="font-medium">Email Reminders</p>
                  <p className="text-muted-foreground">Included at no extra cost</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <MessageSquare className="w-5 h-5 text-blue-500 mt-0.5" />
                <div>
                  <p className="font-medium">SMS Reminders</p>
                  <p className="text-muted-foreground">Usage-based via Twilio</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Mic className="w-5 h-5 text-purple-500 mt-0.5" />
                <div>
                  <p className="font-medium">AI Voice Calls</p>
                  <p className="text-muted-foreground">Usage-based via ElevenLabs + Twilio</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* FAQ */}
        <Card className="border-border/50">
          <CardHeader>
            <CardTitle>Frequently Asked Questions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h4 className="font-medium">What's the difference between Single-Point and Multi-Track?</h4>
              <p className="text-sm text-muted-foreground">
                Single-Point includes AI Voice (chat & calling) for customer engagement, but customers must call to book appointments. Multi-Track adds online booking, field operations, and quoting/invoicing capabilities.
              </p>
            </div>
            <div>
              <h4 className="font-medium">What happens when my trial ends?</h4>
              <p className="text-sm text-muted-foreground">
                When your 30-day trial ends, you'll need to subscribe to continue using AI features. Your data will be preserved.
              </p>
            </div>
            <div>
              <h4 className="font-medium">How does employee pricing work?</h4>
              <p className="text-sm text-muted-foreground">
                Each tier includes a set number of employee accounts. Additional employees beyond your tier's limit cost $25/month per 10 employees.
              </p>
            </div>
            <div>
              <h4 className="font-medium">Can I upgrade or downgrade my plan?</h4>
              <p className="text-sm text-muted-foreground">
                Yes! You can change your plan at any time through the billing portal. Changes take effect on your next billing cycle.
              </p>
            </div>
            <div>
              <h4 className="font-medium">Can I cancel my subscription?</h4>
              <p className="text-sm text-muted-foreground">
                Yes, you can cancel your subscription at any time through the billing portal. You'll retain access until the end of your billing period.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}