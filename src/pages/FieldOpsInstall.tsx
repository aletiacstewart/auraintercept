import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { FieldOpsAppCard } from '@/components/company/FieldOpsAppCard';

export default function FieldOpsInstall() {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Field Ops App Installation</h1>
          <p className="text-muted-foreground">
            Deploy the Field Ops mobile app to your technicians' devices
          </p>
        </div>
        
        <FieldOpsAppCard />
      </div>
    </DashboardLayout>
  );
}
