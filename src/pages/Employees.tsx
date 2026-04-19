import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { EmployeeManagement } from '@/components/company/EmployeeManagement';
import { PageHeader } from '@/components/ui/page-header';
import { PageContainer } from '@/components/ui/page-container';
import { UserCheck } from 'lucide-react';

export default function Employees() {
  return (
    <DashboardLayout>
      <PageContainer>
        <div className="space-y-6">
          <PageHeader
            icon={UserCheck}
            title="Employees"
            description="Manage team members and their roles"
            featureColor="employees"
            showAuraBar
          />
          <EmployeeManagement />
        </div>
      </PageContainer>
    </DashboardLayout>
  );
}
