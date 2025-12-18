import { RoleDashboardLayout } from '@/components/dashboard/RoleDashboardLayout';
import { CommunicationLogs } from '@/components/employee/CommunicationLogs';

const TechnicianMessages = () => {
  return (
    <RoleDashboardLayout jobRole="technician">
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Communication Logs</h1>
          <p className="text-muted-foreground">
            View your message history and notifications
          </p>
        </div>
        <CommunicationLogs />
      </div>
    </RoleDashboardLayout>
  );
};

export default TechnicianMessages;
