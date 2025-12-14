import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { EmployeeManagement } from '@/components/company/EmployeeManagement';

export default function Employees() {
  return (
    <DashboardLayout>
      <EmployeeManagement />
    </DashboardLayout>
  );
}
