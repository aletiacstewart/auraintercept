import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { WarrantiesManager } from '@/components/knowledge/WarrantiesManager';
import { Shield } from 'lucide-react';
import { PageHeader } from '@/components/ui/page-header';

export default function Warranties() {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <PageHeader
          icon={Shield}
          title="Warranties"
          description="Manage warranty records, claims, and policies"
        />
        <WarrantiesManager />
      </div>
    </DashboardLayout>
  );
}
