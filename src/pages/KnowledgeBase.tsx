import { useSearchParams } from 'react-router-dom';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ServicesManager } from '@/components/knowledge/ServicesManager';
import { FAQsManager } from '@/components/knowledge/FAQsManager';
import { BusinessHoursManager } from '@/components/knowledge/BusinessHoursManager';
import { DocumentsManager } from '@/components/knowledge/DocumentsManager';
import { InventoryManager } from '@/components/knowledge/InventoryManager';
import { WarrantiesManager } from '@/components/knowledge/WarrantiesManager';
import { AIContentProfileManager } from '@/components/knowledge/AIContentProfileManager';
import { Briefcase, HelpCircle, Clock, FileText, Package, Shield, BookOpen, Sparkles } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { PageHeader } from '@/components/ui/page-header';
import { PageContainer } from '@/components/ui/page-container';

export default function KnowledgeBase() {
  const [searchParams] = useSearchParams();
  const { userRole } = useAuth();
  const defaultTab = searchParams.get('tab') || 'services';
  
  const isPlatformAdmin = userRole === 'platform_admin';
  
  // Determine grid columns based on whether platform admin tabs are shown
  const gridColsClass = isPlatformAdmin 
    ? 'grid-cols-3 lg:grid-cols-7' 
    : 'grid-cols-3 lg:grid-cols-5';
  
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
        />

        <Tabs defaultValue={defaultTab} className="space-y-6">
          <TabsList className="inline-flex flex-wrap h-auto p-1.5 bg-muted/30 rounded-full border border-border/50 gap-1">
            <TabsTrigger 
              value="ai-profile" 
              className="flex items-center gap-2 px-4 py-2 rounded-full data-[state=active]:bg-background data-[state=active]:shadow-sm data-[state=active]:border data-[state=active]:border-border/50 transition-all"
            >
              <Sparkles className="w-4 h-4 hidden sm:block" />
              AI Profile
            </TabsTrigger>
            <TabsTrigger 
              value="services" 
              className="flex items-center gap-2 px-4 py-2 rounded-full data-[state=active]:bg-background data-[state=active]:shadow-sm data-[state=active]:border data-[state=active]:border-border/50 transition-all"
            >
              <Briefcase className="w-4 h-4 hidden sm:block" />
              Services
            </TabsTrigger>
            <TabsTrigger 
              value="faqs" 
              className="flex items-center gap-2 px-4 py-2 rounded-full data-[state=active]:bg-background data-[state=active]:shadow-sm data-[state=active]:border data-[state=active]:border-border/50 transition-all"
            >
              <HelpCircle className="w-4 h-4 hidden sm:block" />
              FAQs
            </TabsTrigger>
            <TabsTrigger 
              value="hours" 
              className="flex items-center gap-2 px-4 py-2 rounded-full data-[state=active]:bg-background data-[state=active]:shadow-sm data-[state=active]:border data-[state=active]:border-border/50 transition-all"
            >
              <Clock className="w-4 h-4 hidden sm:block" />
              Hours
            </TabsTrigger>
            <TabsTrigger 
              value="documents" 
              className="flex items-center gap-2 px-4 py-2 rounded-full data-[state=active]:bg-background data-[state=active]:shadow-sm data-[state=active]:border data-[state=active]:border-border/50 transition-all"
            >
              <FileText className="w-4 h-4 hidden sm:block" />
              Documents
            </TabsTrigger>
            {isPlatformAdmin && (
              <TabsTrigger 
                value="inventory" 
                className="flex items-center gap-2 px-4 py-2 rounded-full data-[state=active]:bg-background data-[state=active]:shadow-sm data-[state=active]:border data-[state=active]:border-border/50 transition-all"
              >
                <Package className="w-4 h-4 hidden sm:block" />
                Inventory
              </TabsTrigger>
            )}
            {isPlatformAdmin && (
              <TabsTrigger 
                value="warranties" 
                className="flex items-center gap-2 px-4 py-2 rounded-full data-[state=active]:bg-background data-[state=active]:shadow-sm data-[state=active]:border data-[state=active]:border-border/50 transition-all"
              >
                <Shield className="w-4 h-4 hidden sm:block" />
                Warranties
              </TabsTrigger>
            )}
          </TabsList>

          <TabsContent value="ai-profile">
            <AIContentProfileManager />
          </TabsContent>

          <TabsContent value="services">
            <ServicesManager />
          </TabsContent>

          <TabsContent value="faqs">
            <FAQsManager />
          </TabsContent>

          <TabsContent value="hours">
            <BusinessHoursManager />
          </TabsContent>

          <TabsContent value="documents">
            <DocumentsManager />
          </TabsContent>

          {isPlatformAdmin && (
            <TabsContent value="inventory">
              <InventoryManager />
            </TabsContent>
          )}

          {isPlatformAdmin && (
            <TabsContent value="warranties">
              <WarrantiesManager />
            </TabsContent>
          )}
        </Tabs>
      </div>
      </PageContainer>
    </DashboardLayout>
  );
}
