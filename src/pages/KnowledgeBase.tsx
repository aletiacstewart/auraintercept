import { useSearchParams } from 'react-router-dom';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ServicesManager } from '@/components/knowledge/ServicesManager';
import { FAQsManager } from '@/components/knowledge/FAQsManager';
import { BusinessHoursManager } from '@/components/knowledge/BusinessHoursManager';
import { DocumentsManager } from '@/components/knowledge/DocumentsManager';
import { InventoryManager } from '@/components/knowledge/InventoryManager';
import { WarrantiesManager } from '@/components/knowledge/WarrantiesManager';
import { Briefcase, HelpCircle, Clock, FileText, Package, Shield, BookOpen } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { PageHeader } from '@/components/ui/page-header';

export default function KnowledgeBase() {
  const [searchParams] = useSearchParams();
  const { userRole } = useAuth();
  const defaultTab = searchParams.get('tab') || 'services';
  
  const isPlatformAdmin = userRole === 'platform_admin';
  
  // Determine grid columns based on whether platform admin tabs are shown
  const gridColsClass = isPlatformAdmin 
    ? 'grid-cols-2 lg:grid-cols-6' 
    : 'grid-cols-2 lg:grid-cols-4';
  
  return (
    <DashboardLayout>
      <div className="space-y-6 animate-fade-in">
        <PageHeader
          icon={BookOpen}
          title="Knowledge Base"
          description="Train your AI agent with your business information"
        />

        <Tabs defaultValue={defaultTab} className="space-y-6">
          <TabsList className={`grid w-full ${gridColsClass} lg:w-auto lg:inline-grid`}>
            <TabsTrigger value="services" className="gap-2">
              <Briefcase className="w-4 h-4 hidden sm:block" />
              Services
            </TabsTrigger>
            <TabsTrigger value="faqs" className="gap-2">
              <HelpCircle className="w-4 h-4 hidden sm:block" />
              FAQs
            </TabsTrigger>
            <TabsTrigger value="hours" className="gap-2">
              <Clock className="w-4 h-4 hidden sm:block" />
              Hours
            </TabsTrigger>
            <TabsTrigger value="documents" className="gap-2">
              <FileText className="w-4 h-4 hidden sm:block" />
              Documents
            </TabsTrigger>
            {isPlatformAdmin && (
              <TabsTrigger value="inventory" className="gap-2">
                <Package className="w-4 h-4 hidden sm:block" />
                Inventory
              </TabsTrigger>
            )}
            {isPlatformAdmin && (
              <TabsTrigger value="warranties" className="gap-2">
                <Shield className="w-4 h-4 hidden sm:block" />
                Warranties
              </TabsTrigger>
            )}
          </TabsList>

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
    </DashboardLayout>
  );
}
