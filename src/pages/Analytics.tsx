import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { PlatformAnalytics } from '@/components/analytics/PlatformAnalytics';

export default function Analytics() {
  return (
    <DashboardLayout>
      <PlatformAnalytics />
    </DashboardLayout>
  );
}