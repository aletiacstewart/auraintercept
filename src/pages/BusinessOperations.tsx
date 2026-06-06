import { useAuth } from '@/contexts/AuthContext';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { PageContainer } from '@/components/ui/page-container';
import { PageHeader } from '@/components/ui/page-header';
import { BusinessOpsConsole } from '@/components/businessops';
import { BusinessOpsHubTabs } from '@/components/businessops/BusinessOpsHubTabs';
import { AuraTabs } from '@/components/aura/AuraTabs';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Briefcase, LayoutDashboard, FolderKanban, BarChart3, ShieldAlert } from 'lucide-react';
import { useSearchParams } from 'react-router-dom';
import { useEffect } from 'react';
import { dispatchAuraRun } from '@/lib/auraRunBus';

export default function BusinessOperations() {
  const { companyId, userRole } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  
  // Get initial tab from URL parameter
  const tabParam = searchParams.get('tab');
  const defaultTab = tabParam === 'analytics' ? 'analytics' : 'overview';

  // Role-based access
  const hasAccess = userRole === 'platform_admin' || userRole === 'company_admin';

  // Safety net: if we landed here with `?q=<command>` (legacy deep links from
  // Run with Aura / InlineAuraBar before inline execution was wired), forward
  // the prompt into the page's InlineAuraBar so it actually runs.
  useEffect(() => {
    const q = searchParams.get('q');
    if (!q || !hasAccess) return;
    // Wait a tick so the InlineAuraBar in PageHeader has subscribed.
    const timer = setTimeout(() => {
      const handled = dispatchAuraRun(q);
      if (handled) {
        const next = new URLSearchParams(searchParams);
        next.delete('q');
        setSearchParams(next, { replace: true });
      }
    }, 50);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hasAccess]);

  // Handle tab change to update URL
  const handleTabChange = (value: string) => {
    if (value === 'analytics') {
      setSearchParams({ tab: 'analytics' });
    } else {
      setSearchParams({});
    }
  };

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
                You don't have permission to access the Business Management. 
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
            title="Business Management Overview"
            description="Monitor financial metrics, manage sales, appointments, inventory, and people in one place"
            featureColor="analytics"
            showAuraBar
          />

          <Tabs defaultValue={defaultTab} className="w-full" onValueChange={handleTabChange}>
            <TabsList>
              <TabsTrigger value="overview" className="flex items-center gap-1.5">
                <LayoutDashboard className="h-3.5 w-3.5" />
                <span>Overview</span>
              </TabsTrigger>
              <TabsTrigger value="operations" className="flex items-center gap-1.5">
                <FolderKanban className="h-3.5 w-3.5" />
                <span>Operations Hub</span>
              </TabsTrigger>
              <TabsTrigger value="analytics" className="flex items-center gap-1.5">
                <BarChart3 className="h-3.5 w-3.5" />
                <span>Analytics & Reports</span>
              </TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="mt-6">
              <BusinessOpsConsole />
            </TabsContent>

            <TabsContent value="operations" className="mt-6">
              <BusinessOpsHubTabs />
            </TabsContent>

            <TabsContent value="analytics" className="mt-6">
              <AuraTabs companyId={companyId} />
            </TabsContent>
          </Tabs>
        </div>
      </PageContainer>
    </DashboardLayout>
  );
}
