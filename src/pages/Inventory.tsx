import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { InventoryManager } from '@/components/knowledge/InventoryManager';
import { Package } from 'lucide-react';
import { PageHeader } from '@/components/ui/page-header';
import { PageContainer } from '@/components/ui/page-container';
import { HowToUseModal } from '@/components/ui/HowToUseModal';
import { HOW_TO_USE } from '@/lib/howToUseContent';
import { useIndustryPack } from '@/hooks/useIndustryPack';
import { getPageHeader } from '@/lib/industryNavLabels';

export default function Inventory() {
  const { pack } = useIndustryPack();
  const header = getPageHeader('inventory', pack);
  return (
    <DashboardLayout>
      <PageContainer>
        <div className="space-y-6">
          <PageHeader
            icon={Package}
            title={header.title}
            description={header.description}
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

