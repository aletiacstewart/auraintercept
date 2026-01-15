import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { WidgetPreview } from '@/components/widget/WidgetPreview';

const Widget = () => {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">AI Agent Virtual Assistant for Customers</h1>
          <p className="text-muted-foreground">
            Embed the AI Agent Virtual Assistant on your website
          </p>
        </div>
        <WidgetPreview />
      </div>
    </DashboardLayout>
  );
};

export default Widget;
