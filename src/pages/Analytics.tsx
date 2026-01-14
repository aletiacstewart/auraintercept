import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { PlatformAnalytics } from '@/components/analytics/PlatformAnalytics';
import { CompanyAnalytics } from '@/components/analytics/CompanyAnalytics';
import { useAuth } from '@/contexts/AuthContext';
import { useSearchParams } from 'react-router-dom';

export default function Analytics() {
  const { userRole, companyId } = useAuth();
  const [searchParams] = useSearchParams();
  const selectedCompanyId = searchParams.get('company');

  // If platform admin with a company query param, show company analytics
  const showCompanyView = selectedCompanyId && userRole === 'platform_admin';

  return (
    <DashboardLayout>
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
    </DashboardLayout>
  );
}