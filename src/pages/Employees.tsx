import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { EmployeeManagement } from '@/components/company/EmployeeManagement';
import { CreateTestEmployees } from '@/components/admin/CreateTestEmployees';
import { useAuth } from '@/contexts/AuthContext';
import { PageHeader } from '@/components/ui/page-header';
import { Users } from 'lucide-react';

export default function Employees() {
  const { companyId, userRole } = useAuth();

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <PageHeader
          icon={Users}
          title="Employees"
          description="Manage team members and their roles"
        />
        <EmployeeManagement />
        {(userRole === 'platform_admin' || userRole === 'company_admin') && companyId && (
          <CreateTestEmployees companyId={companyId} />
        )}
      </div>
    </DashboardLayout>
  );
}
