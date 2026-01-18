import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { CommunicationLogs } from '@/components/employee/CommunicationLogs';
import { PageHeader } from '@/components/ui/page-header';
import { MessageSquare } from 'lucide-react';

export default function Messages() {
  return (
    <DashboardLayout>
      <div className="space-y-6 animate-fade-in">
        <PageHeader
          icon={MessageSquare}
          title="Messages & Calls"
          description="View your communication history with customers"
        />

        <CommunicationLogs />
      </div>
    </DashboardLayout>
  );
}
