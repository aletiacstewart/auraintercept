import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { InventoryManager } from '@/components/knowledge/InventoryManager';
import { Package } from 'lucide-react';
import { PageHeader } from '@/components/ui/page-header';
import { PageContainer } from '@/components/ui/page-container';
import { HowToUseModal } from '@/components/ui/HowToUseModal';
import { HOW_TO_USE } from '@/lib/howToUseContent';

export default function Inventory() {
  return (
    <DashboardLayout>
      <PageContainer>
        <div className="space-y-6">
          <PageHeader
            icon={Package}
            title="Inventory"
            description="Manage parts, supplies, and stock levels"
            featureColor="inventory"
            showAuraBar
            action={<HowToUseModal {...HOW_TO_USE.inventoryTab} />}
          />
          <InventoryManager />
        </div>
      </PageContainer>
    </DashboardLayout>
  );
}

