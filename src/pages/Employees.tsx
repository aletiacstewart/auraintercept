import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { EmployeeManagement } from '@/components/company/EmployeeManagement';
import { CreateTestAccounts } from '@/components/admin/CreateTestAccounts';
import { useAuth } from '@/contexts/AuthContext';

export default function Employees() {
  const { companyId, userRole } = useAuth();

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <EmployeeManagement />
        {(userRole === 'platform_admin' || userRole === 'company_admin') && companyId && (
          <CreateTestAccounts companyId={companyId} />
        )}
      </div>
    </DashboardLayout>
  );
}
