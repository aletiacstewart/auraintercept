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
import { Check, Crown, ExternalLink, Loader2, Clock, Sparkles, Users, Mail, MessageSquare, Mic, Info } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SubscriptionStatus {
  subscribed: boolean;
  tier: string | null;
  product_id: string | null;
  subscription_end: string | null;
  in_trial?: boolean;
  trial_ends_at?: string | null;
}

const ENTERPRISE_FEATURES = [
  'Unlimited appointments',
  'Email reminders (included)',
  'SMS reminders (usage-based)',
  'AI Voice calls (usage-based)',
  '10 employee accounts included',
  'Additional employees: $25/mo per 10',
  'Premium AI Agent with custom voice',
  'Embeddable chat widget',
  'Customized dashboard branding',
  'Dedicated priority support',
  'All analytics & digest reports',
  'API access',
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

  return (
    <DashboardLayout>
      <div className="space-y-6 animate-fade-in">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Subscription</h1>
            <p className="text-muted-foreground">
              {isInTrial ? 'Subscribe to continue after your trial' : 'Unlock full access to all platform features'}
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
                    You're on the <span className="text-amber-600 font-semibold">Enterprise</span> plan
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

        {/* Enterprise Plan Card */}
        <Card className={cn(
          "relative overflow-hidden transition-all max-w-2xl mx-auto",
          isSubscribed && "border-amber-500 ring-2 ring-amber-500/20",
          isInTrial && "border-primary ring-2 ring-primary/20"
        )}>
          {isSubscribed && (
            <div className="absolute top-0 right-0 bg-amber-500 text-white text-xs font-medium px-3 py-1 rounded-bl-lg">
              Your Plan
            </div>
          )}
          {isInTrial && !isSubscribed && (
            <div className="absolute top-0 right-0 bg-primary text-white text-xs font-medium px-3 py-1 rounded-bl-lg">
              Trial Active
            </div>
          )}
          
          <CardHeader className="text-center pb-2">
            <div className="mx-auto w-16 h-16 rounded-2xl bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center mb-4">
              <Crown className="w-8 h-8 text-white" />
            </div>
            <CardTitle className="text-2xl">Enterprise Company Subscription</CardTitle>
            <CardDescription className="text-base">
              Full access to all AI appointment platform features
            </CardDescription>
          </CardHeader>
          
          <CardContent className="space-y-6">
            <div className="text-center">
              <div className="flex items-baseline justify-center gap-1">
                <span className="text-5xl font-bold">$497</span>
                <span className="text-muted-foreground text-lg">/month</span>
              </div>
              <p className="text-sm text-muted-foreground mt-1">Starting at Single-Point tier • Billed monthly</p>
            </div>

            {/* Usage-based pricing info */}
            <div className="p-4 rounded-lg bg-muted/50 border">
              <h4 className="font-medium text-sm mb-3 flex items-center gap-2">
                <Info className="w-4 h-4 text-primary" />
                What's Included in Base Price
              </h4>
              <div className="grid gap-2 text-sm">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Mail className="w-4 h-4 text-muted-foreground" />
                    <span>Email reminders</span>
                  </div>
                  <span className="text-green-600 font-medium">Included</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <MessageSquare className="w-4 h-4 text-muted-foreground" />
                    <span>SMS reminders</span>
                  </div>
                  <span className="text-muted-foreground text-xs">Usage-based</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Mic className="w-4 h-4 text-muted-foreground" />
                    <span>AI Voice calls</span>
                  </div>
                  <span className="text-muted-foreground text-xs">Usage-based</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4 text-muted-foreground" />
                    <span>Employee accounts</span>
                  </div>
                  <span className="text-muted-foreground text-xs">10 free, +$10/mo each</span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {ENTERPRISE_FEATURES.map((feature, i) => (
                <div key={i} className="flex items-center gap-2 text-sm">
                  <Check className="w-4 h-4 text-amber-500 shrink-0" />
                  {feature}
                </div>
              ))}
            </div>

            <div className="pt-4">
              {isSubscribed ? (
                <Button variant="outline" className="w-full" disabled>
                  <Crown className="w-4 h-4 mr-2" />
                  Current Plan
                </Button>
              ) : (
                <>
                  <Button 
                    className="w-full bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white" 
                    size="lg"
                    onClick={handleSubscribe}
                    disabled={loading}
                  >
                    {loading ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Loading...
                      </>
                    ) : (
                      <>
                        <Crown className="w-4 h-4 mr-2" />
                        {isInTrial ? 'Subscribe to Continue' : 'Subscribe Now'}
                      </>
                    )}
                  </Button>
                  {isInTrial && (
                    <p className="text-xs text-center text-muted-foreground mt-2">
                      Subscribe now to ensure uninterrupted access when your trial ends
                    </p>
                  )}
                </>
              )}
            </div>
          </CardContent>
        </Card>

        {/* FAQ */}
        <Card className="border-border/50 max-w-2xl mx-auto">
          <CardHeader>
            <CardTitle>Frequently Asked Questions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h4 className="font-medium">What happens when my trial ends?</h4>
              <p className="text-sm text-muted-foreground">
                When your 30-day trial ends, you'll need to subscribe to continue using premium features like AI voice calling, SMS reminders, and the chat widget. Your data will be preserved.
              </p>
            </div>
            <div>
              <h4 className="font-medium">How does employee pricing work?</h4>
              <p className="text-sm text-muted-foreground">
                Your subscription includes employee accounts based on your tier. Additional employees beyond the included amount cost $25/month per 10 employees. You can add employees from your dashboard, and billing adjusts automatically.
              </p>
            </div>
            <div>
              <h4 className="font-medium">What are usage-based charges?</h4>
              <p className="text-sm text-muted-foreground">
                SMS and AI voice calls are billed based on actual usage. Email reminders are included at no extra cost. You can view your estimated costs in the Integrations section.
              </p>
            </div>
            <div>
              <h4 className="font-medium">Can I subscribe during my trial?</h4>
              <p className="text-sm text-muted-foreground">
                Yes! You can subscribe at any time. Your billing will start immediately, and you won't be charged again until your subscription renews.
              </p>
            </div>
            <div>
              <h4 className="font-medium">Will I be charged during the trial?</h4>
              <p className="text-sm text-muted-foreground">
                No! The 30-day trial is completely free with no credit card required. You only pay when you choose to subscribe.
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