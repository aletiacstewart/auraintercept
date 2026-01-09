import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { BusinessOpsConsole } from '@/components/businessops';

export default function BusinessOperations() {
  return (
    <DashboardLayout>
      <BusinessOpsConsole />
    </DashboardLayout>
  );
}
