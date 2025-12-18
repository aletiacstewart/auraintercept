import { RoleDashboardLayout } from '@/components/dashboard/RoleDashboardLayout';
import { TechnicianJobQueue } from '@/components/employee/TechnicianJobQueue';

const TechnicianJobs = () => {
  return (
    <RoleDashboardLayout jobRole="technician">
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Job Queue</h1>
          <p className="text-muted-foreground">Manage your assigned jobs and update status</p>
        </div>
        <TechnicianJobQueue />
      </div>
    </RoleDashboardLayout>
  );
};

export default TechnicianJobs;
