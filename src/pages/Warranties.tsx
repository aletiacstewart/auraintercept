import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { WarrantiesManager } from '@/components/knowledge/WarrantiesManager';
import { ShieldCheck } from 'lucide-react';
import { PageHeader } from '@/components/ui/page-header';
import { PageContainer } from '@/components/ui/page-container';

export default function Warranties() {
  return (
    <DashboardLayout>
      <PageContainer>
        <div className="space-y-6">
        <PageHeader
          icon={ShieldCheck}
          title="Warranties"
          description="Manage warranty records, claims, and policies"
          featureColor="warranties"
          showAuraBar
        />
        <WarrantiesManager />
      </div>
      </PageContainer>
    </DashboardLayout>
  );
}
