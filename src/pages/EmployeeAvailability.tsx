import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { AvailabilityEditor } from '@/components/employee/AvailabilityEditor';
import { PageHeader } from '@/components/ui/page-header';
import { PageContainer } from '@/components/ui/page-container';
import { Clock } from 'lucide-react';

export default function EmployeeAvailability() {
  return (
    <DashboardLayout>
      <PageContainer>
        <div className="space-y-6 animate-fade-in">
          <PageHeader
            icon={Clock}
            title="Employee Availability"
            description="Manage employee schedules and time off"
          />
          <AvailabilityEditor />
        </div>
      </PageContainer>
    </DashboardLayout>
  );
}