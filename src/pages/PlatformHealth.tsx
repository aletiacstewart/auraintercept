import { Activity } from 'lucide-react';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { PageContainer } from '@/components/ui/page-container';
import { PageHeader } from '@/components/ui/page-header';
import { AutonomyStatusPanel } from '@/components/admin/AutonomyStatusPanel';

export default function PlatformHealth() {
  return (
    <DashboardLayout>
      <PageContainer>
        <PageHeader
          icon={Activity}
          title="Platform Health"
          description="Real-time view of autonomous background operations across the platform."
        />
        <AutonomyStatusPanel />
      </PageContainer>
    </DashboardLayout>
  );
}
