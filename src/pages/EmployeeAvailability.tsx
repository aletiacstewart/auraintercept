import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { AvailabilityEditor } from '@/components/employee/AvailabilityEditor';

export default function EmployeeAvailability() {
  return (
    <DashboardLayout>
      <div className="space-y-6 animate-fade-in">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Employee Availability</h1>
          <p className="text-white/70">
            Manage employee schedules and time off
          </p>
        </div>
        <AvailabilityEditor />
      </div>
    </DashboardLayout>
  );
}
