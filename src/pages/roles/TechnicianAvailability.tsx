import { RoleDashboardLayout } from '@/components/dashboard/RoleDashboardLayout';
import { AvailabilityEditor } from '@/components/employee/AvailabilityEditor';

const TechnicianAvailability = () => {
  return (
    <RoleDashboardLayout jobRole="technician">
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">My Availability</h1>
          <p className="text-muted-foreground">
            Set your field hours, emergency on-call hours, and time off
          </p>
        </div>
        <AvailabilityEditor />
      </div>
    </RoleDashboardLayout>
  );
};

export default TechnicianAvailability;
