import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { WarrantiesManager } from '@/components/knowledge/WarrantiesManager';
import { Shield } from 'lucide-react';

export default function Warranties() {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <Shield className="h-8 w-8 text-primary" />
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Warranties</h1>
            <p className="text-muted-foreground">Manage warranty records, claims, and policies</p>
          </div>
        </div>
        <WarrantiesManager />
      </div>
    </DashboardLayout>
  );
}
