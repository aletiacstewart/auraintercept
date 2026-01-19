import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { BusinessOpsConsole } from '@/components/businessops';
import { PageContainer } from '@/components/ui/page-container';
import { PageHeader } from '@/components/ui/page-header';
import { Briefcase } from 'lucide-react';

export default function BusinessOperations() {
  return (
    <DashboardLayout>
      <PageContainer>
        <div className="space-y-6">
          <PageHeader
            icon={Briefcase}
            title="Business Ops Overview"
            description="Monitor financial metrics, payments, and inventory at a glance"
            featureColor="analytics"
            showAuraBar
          />
          <BusinessOpsConsole />
        </div>
      </PageContainer>
    </DashboardLayout>
  );
}
