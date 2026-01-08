import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { WidgetPreview } from '@/components/widget/WidgetPreview';

const Widget = () => {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Customer App Widget</h1>
          <p className="text-muted-foreground">
            Embed the AI-powered customer engagement app on your website
          </p>
        </div>
        <WidgetPreview />
      </div>
    </DashboardLayout>
  );
};

export default Widget;
