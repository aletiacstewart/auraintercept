import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { EmployeeManagement } from '@/components/company/EmployeeManagement';
import { CreateTestEmployees } from '@/components/admin/CreateTestEmployees';
import { useAuth } from '@/contexts/AuthContext';
import { PageHeader } from '@/components/ui/page-header';
import { PageContainer } from '@/components/ui/page-container';
import { UserCheck } from 'lucide-react';

export default function Employees() {
  const { companyId, userRole } = useAuth();

  return (
    <DashboardLayout>
      <PageContainer>
        <div className="space-y-6">
        <PageHeader
          icon={UserCheck}
          title="Employees"
          description="Manage team members and their roles"
          featureColor="employees"
        />
        <EmployeeManagement />
        {(userRole === 'platform_admin' || userRole === 'company_admin') && companyId && (
          <CreateTestEmployees companyId={companyId} />
        )}
      </div>
      </PageContainer>
    </DashboardLayout>
  );
}
