import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { BusinessOpsConsole } from '@/components/businessops';

export default function BusinessOperations() {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Business Operations</h1>
          <p className="text-muted-foreground">
            Business ops overview, quotes, inventory, and payment management
          </p>
        </div>
        <BusinessOpsConsole />
      </div>
    </DashboardLayout>
  );
}
