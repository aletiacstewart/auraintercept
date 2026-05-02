import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { EmployeeManagement } from '@/components/company/EmployeeManagement';
import { PageHeader } from '@/components/ui/page-header';
import { PageContainer } from '@/components/ui/page-container';
import { UserCheck } from 'lucide-react';
import { useIndustryPack } from '@/hooks/useIndustryPack';
import { getPageHeader } from '@/lib/industryNavLabels';

export default function Employees() {
  const { pack } = useIndustryPack();
  const header = getPageHeader('employees', pack);
  return (
    <DashboardLayout>
      <PageContainer>
        <div className="space-y-6">
          <PageHeader
            icon={UserCheck}
            title={header.title}
            description={header.description}
            featureColor="employees"
            showAuraBar
          />
          <EmployeeManagement />
        </div>
      </PageContainer>
    </DashboardLayout>
  );
}
