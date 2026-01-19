import { useAuth } from '@/contexts/AuthContext';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { PageContainer } from '@/components/ui/page-container';
import { PageHeader } from '@/components/ui/page-header';
import { BusinessOpsHubTabs } from '@/components/businessops/BusinessOpsHubTabs';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Briefcase, ShieldAlert } from 'lucide-react';

export default function BusinessOpsHub() {
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
                You don't have permission to access the Business Ops Hub. 
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
            title="Business Ops Hub"
            description="Manage leads, appointments, quotes, invoices, inventory, and warranties in one place."
            featureColor="platform"
            showAuraBar
          />

          <BusinessOpsHubTabs />
        </div>
      </PageContainer>
    </DashboardLayout>
  );
}
