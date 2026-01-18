import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { WarrantiesManager } from '@/components/knowledge/WarrantiesManager';
import { Shield } from 'lucide-react';
import { PageHeader } from '@/components/ui/page-header';
import { PageContainer } from '@/components/ui/page-container';

export default function Warranties() {
  return (
    <DashboardLayout>
      <PageContainer>
        <div className="space-y-6">
        <PageHeader
          icon={Shield}
          title="Warranties"
          description="Manage warranty records, claims, and policies"
        />
        <WarrantiesManager />
      </div>
      </PageContainer>
    </DashboardLayout>
  );
}
