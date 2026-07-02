import { useSearchParams } from 'react-router-dom';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { PageContainer } from '@/components/ui/page-container';
import { PageHeader } from '@/components/ui/page-header';
import { SubscriptionAnalytics as SubscriptionAnalyticsComponent } from '@/components/company/SubscriptionAnalytics';
import { Crown, Send } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import OnboardingInvites from './admin/OnboardingInvites';

export default function SubscriptionAnalytics() {
  const [searchParams, setSearchParams] = useSearchParams();
  const tab = searchParams.get('tab') === 'invites' ? 'invites' : 'analytics';
  const setTab = (v: string) => {
    const p = new URLSearchParams(searchParams);
    if (v === 'analytics') p.delete('tab'); else p.set('tab', v);
    setSearchParams(p, { replace: true });
  };
  return (
    <DashboardLayout>
      <PageContainer>
        <div className="space-y-6">
          <PageHeader
            icon={Crown}
            title="Subscription Analytics"
            description="Track customer opt-in and opt-out trends"
            featureColor="overview"
          />
          <Tabs value={tab} onValueChange={setTab}>
            <TabsList>
              <TabsTrigger value="analytics"><Crown className="h-3.5 w-3.5 mr-1.5" />Analytics</TabsTrigger>
              <TabsTrigger value="invites"><Send className="h-3.5 w-3.5 mr-1.5" />Onboarding Invites</TabsTrigger>
            </TabsList>
            <TabsContent value="analytics" className="mt-4">
              <SubscriptionAnalyticsComponent />
            </TabsContent>
            <TabsContent value="invites" className="mt-4">
              <OnboardingInvites embedded />
            </TabsContent>
          </Tabs>
        </div>
      </PageContainer>
    </DashboardLayout>
  );
}
