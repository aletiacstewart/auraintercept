import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { PlatformAnalytics } from '@/components/analytics/PlatformAnalytics';
import { useAuth } from '@/contexts/AuthContext';
import { Navigate } from 'react-router-dom';

export default function Analytics() {
  const { userRole } = useAuth();

  if (userRole !== 'platform_admin') {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <DashboardLayout>
      <PlatformAnalytics />
    </DashboardLayout>
  );
}