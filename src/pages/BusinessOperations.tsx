import { useAuth } from '@/contexts/AuthContext';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { PageContainer } from '@/components/ui/page-container';
import { PageHeader } from '@/components/ui/page-header';
import { BusinessOpsConsole } from '@/components/businessops';
import { BusinessOpsHubTabs } from '@/components/businessops/BusinessOpsHubTabs';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Briefcase, LayoutDashboard, FolderKanban, ShieldAlert } from 'lucide-react';

export default function BusinessOperations() {
  const { companyId, userRole } = useAuth();

  // Role-based access
  const hasAccess = userRole === 'platform_admin' || userRole === 'company_admin';

  // Access denied
  if (!hasAccess) {
    return (
      <DashboardLayout>
        <PageContainer>
          <div className="flex items-center justify-center h-[60vh]">
            <Alert variant="destructive" className="max-w-md">
              <ShieldAlert className="h-5 w-5" />
              <AlertTitle>Access Denied</AlertTitle>
              <AlertDescription>
                You don't have permission to access the Business Mgt Ops. 
                This feature is available to Company and Platform Administrators only.
              </AlertDescription>
            </Alert>
          </div>
        </PageContainer>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <PageContainer>
        <div className="space-y-6">
          <PageHeader
            icon={Briefcase}
            title="Business Mgt Ops Overview"
            description="Monitor financial metrics, manage sales, appointments, inventory, and people in one place"
            featureColor="analytics"
            showAuraBar
          />

          <Tabs defaultValue="overview" className="w-full">
            <TabsList>
              <TabsTrigger value="overview" className="flex items-center gap-1.5">
                <LayoutDashboard className="h-3.5 w-3.5" />
                <span>Overview</span>
              </TabsTrigger>
              <TabsTrigger value="operations" className="flex items-center gap-1.5">
                <FolderKanban className="h-3.5 w-3.5" />
                <span>Operations Hub</span>
              </TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="mt-6">
              <BusinessOpsConsole />
            </TabsContent>

            <TabsContent value="operations" className="mt-6">
              <BusinessOpsHubTabs />
            </TabsContent>
          </Tabs>
        </div>
      </PageContainer>
    </DashboardLayout>
  );
}
