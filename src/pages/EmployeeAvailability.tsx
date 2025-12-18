import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useEmployeeJobRole } from '@/hooks/useEmployeeJobRole';
import { JOB_ROLE_ROUTES } from '@/config/jobRoleDashboards';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { AvailabilityEditor } from '@/components/employee/AvailabilityEditor';

export default function EmployeeAvailability() {
  const { userRole } = useAuth();
  const { primaryJobType, loading } = useEmployeeJobRole();
  const navigate = useNavigate();

  // Redirect employees to their role-specific availability page
  useEffect(() => {
    if (userRole === 'employee' && !loading && primaryJobType) {
      const roleRoute = JOB_ROLE_ROUTES[primaryJobType];
      if (roleRoute) {
        navigate(`${roleRoute}/availability`, { replace: true });
      }
    }
  }, [userRole, primaryJobType, loading, navigate]);

  // Show loading while checking role
  if (userRole === 'employee' && loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
        </div>
      </DashboardLayout>
    );
  }

  // For admins, show the availability management page
  return (
    <DashboardLayout>
      <div className="space-y-6 animate-fade-in">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Employee Availability</h1>
          <p className="text-muted-foreground">
            Manage employee schedules and time off
          </p>
        </div>
        <AvailabilityEditor />
      </div>
    </DashboardLayout>
  );
}
