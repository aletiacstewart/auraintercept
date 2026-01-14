import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { SubscriptionAnalytics as SubscriptionAnalyticsComponent } from '@/components/company/SubscriptionAnalytics';
import { Crown } from 'lucide-react';

export default function SubscriptionAnalytics() {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <Crown className="h-8 w-8 text-primary" />
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Subscription Analytics</h1>
            <p className="text-muted-foreground">Track customer opt-in and opt-out trends</p>
          </div>
        </div>
        <SubscriptionAnalyticsComponent />
      </div>
    </DashboardLayout>
  );
}
