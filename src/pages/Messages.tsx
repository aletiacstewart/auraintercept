import { RoleAwareDashboardLayout } from '@/components/dashboard/RoleAwareDashboardLayout';
import { CommunicationLogs } from '@/components/employee/CommunicationLogs';

export default function Messages() {
  return (
    <RoleAwareDashboardLayout>
      <div className="space-y-6 animate-fade-in">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Messages & Calls</h1>
          <p className="text-muted-foreground">
            View your communication history with customers
          </p>
        </div>

        <CommunicationLogs />
      </div>
    </RoleAwareDashboardLayout>
  );
}
