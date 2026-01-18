import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { PlatformAnalytics } from '@/components/analytics/PlatformAnalytics';
import { CompanyAnalytics } from '@/components/analytics/CompanyAnalytics';
import { useAuth } from '@/contexts/AuthContext';
import { useSearchParams } from 'react-router-dom';
import { PageHeader } from '@/components/ui/page-header';
import { PageContainer } from '@/components/ui/page-container';
import { BarChart3 } from 'lucide-react';

export default function Analytics() {
  const { userRole, companyId } = useAuth();
  const [searchParams] = useSearchParams();
  const selectedCompanyId = searchParams.get('company');

  // If platform admin with a company query param, show company analytics
  const showCompanyView = selectedCompanyId && userRole === 'platform_admin';

  return (
    <DashboardLayout>
      <PageContainer>
        <div className="space-y-6">
        <PageHeader
          icon={BarChart3}
          title="Analytics"
          description="View insights and performance metrics"
        />
        {showCompanyView ? (
          <CompanyAnalytics companyId={selectedCompanyId} showCompanyName />
        ) : userRole === 'platform_admin' ? (
          <PlatformAnalytics />
        ) : companyId ? (
          <CompanyAnalytics companyId={companyId} />
        ) : (
          <div className="flex items-center justify-center h-64">
            <p className="text-white/70">No company associated with your account.</p>
          </div>
        )}
      </div>
      </PageContainer>
    </DashboardLayout>
  );
}