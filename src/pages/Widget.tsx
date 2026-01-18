import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { WidgetPreview } from '@/components/widget/WidgetPreview';
import { PageHeader } from '@/components/ui/page-header';
import { PageContainer } from '@/components/ui/page-container';
import { Globe } from 'lucide-react';

const Widget = () => {
  return (
    <DashboardLayout>
      <PageContainer>
        <div className="space-y-6">
          <PageHeader
            icon={Globe}
            title="Customer Website App"
            description="Embed the AI Agent Virtual Assistant on your website"
            featureColor="customers"
          />
          <WidgetPreview />
        </div>
      </PageContainer>
    </DashboardLayout>
  );
};

export default Widget;