import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useSearchParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import { Check, Crown, ExternalLink, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SubscriptionStatus {
  subscribed: boolean;
  tier: string | null;
  product_id: string | null;
  subscription_end: string | null;
}

const ENTERPRISE_FEATURES = [
  'Unlimited appointments',
  'Email, SMS & Voice reminders',
  'Premium AI Agent with custom voice',
  'Embeddable chat widget',
  'Full white-label branding',
  'Dedicated priority support',
  'All analytics & digest reports',
  'API access',
];

export default function Subscription() {
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const [loading, setLoading] = useState(false);
  const [portalLoading, setPortalLoading] = useState(false);

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

  const isSubscribed = subscription?.subscribed;

  return (
    <DashboardLayout>
      <div className="space-y-6 animate-fade-in">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Subscription</h1>
            <p className="text-muted-foreground">
              Unlock full access to all platform features
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
                  {subscription.subscription_end && (
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
          isSubscribed && "border-amber-500 ring-2 ring-amber-500/20"
        )}>
          {isSubscribed && (
            <div className="absolute top-0 right-0 bg-amber-500 text-white text-xs font-medium px-3 py-1 rounded-bl-lg">
              Your Plan
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
                <span className="text-5xl font-bold">$250</span>
                <span className="text-muted-foreground text-lg">/month</span>
              </div>
              <p className="text-sm text-muted-foreground mt-1">Billed monthly</p>
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
                      Subscribe Now
                    </>
                  )}
                </Button>
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
              <h4 className="font-medium">What's included in the subscription?</h4>
              <p className="text-sm text-muted-foreground">
                Everything! Unlimited appointments, all reminder channels (email, SMS, voice), AI agent, chat widget, white-label branding, and priority support.
              </p>
            </div>
            <div>
              <h4 className="font-medium">What payment methods do you accept?</h4>
              <p className="text-sm text-muted-foreground">
                We accept all major credit cards through Stripe, including Visa, Mastercard, and American Express.
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