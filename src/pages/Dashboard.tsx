import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { PlatformAdminDashboard } from '@/components/dashboard/PlatformAdminDashboard';
import { CompanyAdminDashboard } from '@/components/dashboard/CompanyAdminDashboard';
import { Skeleton } from '@/components/ui/skeleton';
import { useEmployeeJobRole } from '@/hooks/useEmployeeJobRole';
import { JOB_ROLE_ROUTES } from '@/config/jobRoleDashboards';

export default function Dashboard() {
  const { user, loading, userRole } = useAuth();
  const navigate = useNavigate();
  const { primaryJobType, loading: jobRoleLoading } = useEmployeeJobRole();

  useEffect(() => {
    if (!loading && !user) {
      navigate('/auth');
    }
  }, [user, loading, navigate]);

  // Redirect employees to their role-specific dashboard
  useEffect(() => {
    if (!loading && !jobRoleLoading && userRole === 'employee' && primaryJobType) {
      const route = JOB_ROLE_ROUTES[primaryJobType];
      if (route) {
        navigate(route, { replace: true });
      }
    }
  }, [loading, jobRoleLoading, userRole, primaryJobType, navigate]);

  if (loading || (userRole === 'employee' && jobRoleLoading)) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="space-y-4 w-full max-w-md p-8">
          <Skeleton className="h-8 w-3/4 mx-auto" />
          <Skeleton className="h-4 w-1/2 mx-auto" />
          <Skeleton className="h-32 w-full" />
        </div>
      </div>
    );
  }

  if (!user) return null;

  // Employees are redirected above, so only render for admins
  const renderDashboard = () => {
    switch (userRole) {
      case 'platform_admin':
        return <PlatformAdminDashboard />;
      case 'company_admin':
        return <CompanyAdminDashboard />;
      default:
        return (
          <div className="flex items-center justify-center h-full">
            <p className="text-muted-foreground">Loading your dashboard...</p>
          </div>
        );
    }
  };

  return (
    <DashboardLayout>
      {renderDashboard()}
    </DashboardLayout>
  );
}
