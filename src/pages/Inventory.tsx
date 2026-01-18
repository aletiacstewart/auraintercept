import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { InventoryManager } from '@/components/knowledge/InventoryManager';
import { Package } from 'lucide-react';
import { PageHeader } from '@/components/ui/page-header';

export default function Inventory() {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <PageHeader
          icon={Package}
          title="Inventory"
          description="Manage parts, supplies, and stock levels"
        />
        <InventoryManager />
      </div>
    </DashboardLayout>
  );
}
