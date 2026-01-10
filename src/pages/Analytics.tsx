import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { PlatformAnalytics } from '@/components/analytics/PlatformAnalytics';
import { CompanyAnalytics } from '@/components/analytics/CompanyAnalytics';
import { useAuth } from '@/contexts/AuthContext';

export default function Analytics() {
  const { userRole, companyId } = useAuth();

  return (
    <DashboardLayout>
      {userRole === 'platform_admin' ? (
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