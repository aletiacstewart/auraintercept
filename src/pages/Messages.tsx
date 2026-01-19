import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { CommunicationLogs } from '@/components/employee/CommunicationLogs';
import { PageHeader } from '@/components/ui/page-header';
import { PageContainer } from '@/components/ui/page-container';
import { MessageSquare } from 'lucide-react';

export default function Messages() {
  return (
    <DashboardLayout>
      <PageContainer>
        <div className="space-y-6 animate-fade-in">
        <PageHeader
          icon={MessageSquare}
          title="Messages & Calls"
          description="View your communication history with customers"
          showAuraBar
        />

        <CommunicationLogs />
      </div>
      </PageContainer>
    </DashboardLayout>
  );
}
