import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { PageContainer } from '@/components/ui/page-container';
import { PageHeader } from '@/components/ui/page-header';
import { SubscriptionAnalytics as SubscriptionAnalyticsComponent } from '@/components/company/SubscriptionAnalytics';
import { Crown } from 'lucide-react';

export default function SubscriptionAnalytics() {
  return (
    <DashboardLayout>
      <PageContainer>
        <div className="space-y-6">
          <PageHeader
            icon={Crown}
            title="Subscription Analytics"
            description="Track customer opt-in and opt-out trends"
            featureColor="dashboard"
          />
          <SubscriptionAnalyticsComponent />
        </div>
      </PageContainer>
    </DashboardLayout>
  );
}
