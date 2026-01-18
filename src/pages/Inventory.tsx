import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { InventoryManager } from '@/components/knowledge/InventoryManager';
import { Package } from 'lucide-react';
import { PageHeader } from '@/components/ui/page-header';
import { PageContainer } from '@/components/ui/page-container';

export default function Inventory() {
  return (
    <DashboardLayout>
      <PageContainer>
        <div className="space-y-6">
        <PageHeader
          icon={Package}
          title="Inventory"
          description="Manage parts, supplies, and stock levels"
        />
        <InventoryManager />
      </div>
      </PageContainer>
    </DashboardLayout>
  );
}
