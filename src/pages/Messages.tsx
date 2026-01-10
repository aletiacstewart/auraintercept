import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { CommunicationLogs } from '@/components/employee/CommunicationLogs';

export default function Messages() {
  return (
    <DashboardLayout>
      <div className="space-y-6 animate-fade-in">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Messages & Calls</h1>
          <p className="text-white/70">
            View your communication history with customers
          </p>
        </div>

        <CommunicationLogs />
      </div>
    </DashboardLayout>
  );
}
