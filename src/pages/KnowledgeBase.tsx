import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { ServicesManager } from '@/components/knowledge/ServicesManager';
import { FAQsManager } from '@/components/knowledge/FAQsManager';
import { BusinessHoursManager } from '@/components/knowledge/BusinessHoursManager';
import { DocumentsManager } from '@/components/knowledge/DocumentsManager';
import { InventoryManager } from '@/components/knowledge/InventoryManager';
import { AIContentProfileManager } from '@/components/knowledge/AIContentProfileManager';
import { KnowledgeBaseWizard } from '@/components/knowledge/KnowledgeBaseWizard';
import { SmartLinksManager } from '@/components/knowledge/SmartLinksManager';
import { AuraIntelligenceSettings } from '@/components/settings/AuraIntelligenceSettings';
import { Briefcase, HelpCircle, Clock, FileText, Package, BookOpen, Sparkles, Link2, Brain } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { PageHeader } from '@/components/ui/page-header';
import { PageContainer } from '@/components/ui/page-container';
import { HowToUseModal } from '@/components/ui/HowToUseModal';
import { HOW_TO_USE } from '@/lib/howToUseContent';

export default function KnowledgeBase() {
  const [searchParams] = useSearchParams();
  const { userRole, companyId } = useAuth();
  const defaultTab = searchParams.get('tab') || 'ai-profile';
  const [showWizard, setShowWizard] = useState(false);
  
  const isPlatformAdmin = userRole === 'platform_admin';
  
  if (showWizard && companyId) {
    return (
      <DashboardLayout>
        <PageContainer>
          <KnowledgeBaseWizard 
            companyId={companyId} 
            onCancel={() => setShowWizard(false)}
            onSuccess={() => setShowWizard(false)}
          />
        </PageContainer>
      </DashboardLayout>
    );
  }
  
  return (
    <DashboardLayout>
      <PageContainer>
        <div className="space-y-6 animate-fade-in">
        <PageHeader
          icon={BookOpen}
          title="Knowledge Base"
          description="Train your AI agent with your business information"
          featureColor="config"
          showAuraBar
          action={
            <div className="flex items-center gap-2">
              <HowToUseModal {...HOW_TO_USE.knowledgeBase} />
              <Button onClick={() => setShowWizard(true)} variant="outline">
                <Sparkles className="h-4 w-4 mr-2" /> AI Generate
              </Button>
            </div>
          }
        />

        <Tabs defaultValue={defaultTab} className="space-y-6">
          <TabsList>
            <TabsTrigger value="ai-profile" className="flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 hidden sm:block" />
              AI Profile
            </TabsTrigger>
            <TabsTrigger value="aura-intelligence" className="flex items-center gap-1.5">
              <Brain className="w-3.5 h-3.5 hidden sm:block" />
              Aura Intelligence
            </TabsTrigger>
            <TabsTrigger value="services" className="flex items-center gap-1.5">
              <Briefcase className="w-3.5 h-3.5 hidden sm:block" />
              Services
            </TabsTrigger>
            <TabsTrigger value="faqs" className="flex items-center gap-1.5">
              <HelpCircle className="w-3.5 h-3.5 hidden sm:block" />
              FAQs
            </TabsTrigger>
            <TabsTrigger value="hours" className="flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 hidden sm:block" />
              Hours
            </TabsTrigger>
            <TabsTrigger value="documents" className="flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5 hidden sm:block" />
              Documents
            </TabsTrigger>
            <TabsTrigger value="smart-links" className="flex items-center gap-1.5">
              <Link2 className="w-3.5 h-3.5 hidden sm:block" />
              Smart Links
            </TabsTrigger>
            {isPlatformAdmin && (
              <TabsTrigger value="inventory" className="flex items-center gap-1.5">
                <Package className="w-3.5 h-3.5 hidden sm:block" />
                Inventory
              </TabsTrigger>
            )}
          </TabsList>

          <TabsContent value="ai-profile" className="space-y-3">
            <div className="flex justify-end">
              <HowToUseModal {...HOW_TO_USE.aiProfileTab} />
            </div>
            <AIContentProfileManager />
          </TabsContent>

          <TabsContent value="aura-intelligence">
            <AuraIntelligenceSettings />
          </TabsContent>

          <TabsContent value="services" className="space-y-3">
            <div className="flex justify-end">
              <HowToUseModal {...HOW_TO_USE.servicesTab} />
            </div>
            <ServicesManager />
          </TabsContent>

          <TabsContent value="faqs" className="space-y-3">
            <div className="flex justify-end">
              <HowToUseModal {...HOW_TO_USE.faqsTab} />
            </div>
            <FAQsManager />
          </TabsContent>

          <TabsContent value="hours" className="space-y-3">
            <div className="flex justify-end">
              <HowToUseModal {...HOW_TO_USE.hoursTab} />
            </div>
            <BusinessHoursManager />
          </TabsContent>

          <TabsContent value="documents" className="space-y-3">
            <div className="flex justify-end">
              <HowToUseModal {...HOW_TO_USE.documentsTab} />
            </div>
            <DocumentsManager />
          </TabsContent>

          <TabsContent value="smart-links" className="space-y-3">
            <div className="flex justify-end">
              <HowToUseModal {...HOW_TO_USE.smartLinksTab} />
            </div>
            <SmartLinksManager />
          </TabsContent>

          {isPlatformAdmin && (
            <TabsContent value="inventory" className="space-y-3">
              <div className="flex justify-end">
                <HowToUseModal {...HOW_TO_USE.inventoryTab} />
              </div>
              <InventoryManager />
            </TabsContent>
          )}
        </Tabs>
      </div>
      </PageContainer>
    </DashboardLayout>
  );
}
