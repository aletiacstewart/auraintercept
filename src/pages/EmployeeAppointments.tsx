import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useEmployeeJobRole } from '@/hooks/useEmployeeJobRole';
import { JOB_ROLE_ROUTES } from '@/config/jobRoleDashboards';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { AppointmentCalendar } from '@/components/employee/AppointmentCalendar';
import { TechnicianJobQueue } from '@/components/employee/TechnicianJobQueue';
import { CompletedJobsHistory } from '@/components/employee/CompletedJobsHistory';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Calendar, ClipboardList, History } from 'lucide-react';

export default function EmployeeAppointments() {
  const { userRole } = useAuth();
  const { primaryJobType, loading } = useEmployeeJobRole();
  const navigate = useNavigate();

  // Redirect employees to their role-specific calendar page
  useEffect(() => {
    if (userRole === 'employee' && !loading && primaryJobType) {
      const roleRoute = JOB_ROLE_ROUTES[primaryJobType];
      if (roleRoute) {
        navigate(`${roleRoute}/calendar`, { replace: true });
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

  // For admins, show the full appointments page
  return (
    <DashboardLayout>
      <div className="space-y-6 animate-fade-in">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Appointments</h1>
          <p className="text-muted-foreground">
            View and manage all scheduled appointments
          </p>
        </div>

        <Tabs defaultValue="calendar" className="w-full">
          <TabsList>
            <TabsTrigger value="calendar" className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Calendar
            </TabsTrigger>
            <TabsTrigger value="jobs" className="flex items-center gap-2">
              <ClipboardList className="h-4 w-4" />
              Job Queue
            </TabsTrigger>
            <TabsTrigger value="history" className="flex items-center gap-2">
              <History className="h-4 w-4" />
              History
            </TabsTrigger>
          </TabsList>
          <TabsContent value="calendar" className="mt-4">
            <AppointmentCalendar />
          </TabsContent>
          <TabsContent value="jobs" className="mt-4">
            <TechnicianJobQueue />
          </TabsContent>
          <TabsContent value="history" className="mt-4">
            <CompletedJobsHistory />
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}
