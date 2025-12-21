import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useEmployeeJobRole } from '@/hooks/useEmployeeJobRole';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { PlatformAdminDashboard } from '@/components/dashboard/PlatformAdminDashboard';
import { CompanyAdminDashboard } from '@/components/dashboard/CompanyAdminDashboard';
import { EmployeeDashboard } from '@/components/dashboard/EmployeeDashboard';
import { Skeleton } from '@/components/ui/skeleton';

export default function Dashboard() {
  const { user, loading, userRole } = useAuth();
  const { hasJobType, loading: jobRoleLoading } = useEmployeeJobRole();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && !user) {
      navigate('/auth');
    }
  }, [user, loading, navigate]);

  // Redirect technicians to their dedicated dashboard
  useEffect(() => {
    if (!loading && !jobRoleLoading && userRole === 'employee' && hasJobType('technician')) {
      navigate('/technician', { replace: true });
    }
  }, [loading, jobRoleLoading, userRole, hasJobType, navigate]);

  if (loading) {
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

  const renderDashboard = () => {
    switch (userRole) {
      case 'platform_admin':
        return <PlatformAdminDashboard />;
      case 'company_admin':
        return <CompanyAdminDashboard />;
      case 'employee':
        return <EmployeeDashboard />;
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
