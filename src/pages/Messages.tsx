import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { CommunicationLogs } from '@/components/employee/CommunicationLogs';
import { PageHeader } from '@/components/ui/page-header';
import { PageContainer } from '@/components/ui/page-container';
import { MessageSquare } from 'lucide-react';
import { useIndustryPack } from '@/hooks/useIndustryPack';
import { getPageHeader } from '@/lib/industryNavLabels';

export default function Messages() {
  const { pack } = useIndustryPack();
  const header = getPageHeader('messages', pack);
  return (
    <DashboardLayout>
      <PageContainer>
        <div className="space-y-6 animate-fade-in">
        <PageHeader
          icon={MessageSquare}
          title={header.title}
          description={header.description}
          showAuraBar
        />

        <CommunicationLogs />
      </div>
      </PageContainer>
    </DashboardLayout>
  );
}
