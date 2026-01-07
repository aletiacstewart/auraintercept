import { useSearchParams } from 'react-router-dom';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ServicesManager } from '@/components/knowledge/ServicesManager';
import { FAQsManager } from '@/components/knowledge/FAQsManager';
import { BusinessHoursManager } from '@/components/knowledge/BusinessHoursManager';
import { DocumentsManager } from '@/components/knowledge/DocumentsManager';
import { InventoryManager } from '@/components/knowledge/InventoryManager';
import { WarrantiesManager } from '@/components/knowledge/WarrantiesManager';
import { PlatformAnalytics } from '@/components/analytics/PlatformAnalytics';
import { useAuth } from '@/contexts/AuthContext';
import { Briefcase, HelpCircle, Clock, FileText, Package, Shield, BarChart3 } from 'lucide-react';

export default function KnowledgeBase() {
  const [searchParams] = useSearchParams();
  const { userRole } = useAuth();
  const defaultTab = searchParams.get('tab') || 'services';
  const isPlatformAdmin = userRole === 'platform_admin';
  
  return (
    <DashboardLayout>
      <div className="space-y-6 animate-fade-in">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Knowledge Base</h1>
          <p className="text-muted-foreground">
            Train your AI agent with your business information
          </p>
        </div>

        <Tabs defaultValue={defaultTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-3 lg:grid-cols-7 lg:w-auto lg:inline-grid">
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
            <TabsTrigger value="inventory" className="gap-2">
              <Package className="w-4 h-4 hidden sm:block" />
              Inventory
            </TabsTrigger>
            <TabsTrigger value="warranties" className="gap-2">
              <Shield className="w-4 h-4 hidden sm:block" />
              Warranties
            </TabsTrigger>
            {isPlatformAdmin && (
              <TabsTrigger value="analytics" className="gap-2">
                <BarChart3 className="w-4 h-4 hidden sm:block" />
                Analytics
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

          <TabsContent value="inventory">
            <InventoryManager />
          </TabsContent>

          <TabsContent value="warranties">
            <WarrantiesManager />
          </TabsContent>

          {isPlatformAdmin && (
            <TabsContent value="analytics">
              <PlatformAnalytics />
            </TabsContent>
          )}
        </Tabs>
      </div>
    </DashboardLayout>
  );
}
