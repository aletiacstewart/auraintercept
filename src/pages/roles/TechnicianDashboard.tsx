import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useEmployeeJobRole } from '@/hooks/useEmployeeJobRole';
import { RoleDashboardLayout } from '@/components/dashboard/RoleDashboardLayout';
import { TechnicianJobQueue } from '@/components/employee/TechnicianJobQueue';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { ClipboardList, MapPin, Clock, CheckCircle } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export default function TechnicianDashboard() {
  const { user, loading: authLoading } = useAuth();
  const { hasJobType, loading: roleLoading } = useEmployeeJobRole();
  const navigate = useNavigate();

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth');
    }
  }, [user, authLoading, navigate]);

  // Fetch technician stats
  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ['technician-stats', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      
      const today = new Date().toISOString().split('T')[0];
      
      const [pending, todayJobs, completed] = await Promise.all([
        supabase
          .from('job_assignments')
          .select('id', { count: 'exact' })
          .eq('employee_id', user.id)
          .eq('status', 'pending_acceptance'),
        supabase
          .from('job_assignments')
          .select('id', { count: 'exact' })
          .eq('employee_id', user.id)
          .gte('assigned_at', today),
        supabase
          .from('job_assignments')
          .select('id', { count: 'exact' })
          .eq('employee_id', user.id)
          .eq('status', 'completed')
          .gte('completed_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()),
      ]);
      
      return {
        pendingJobs: pending.count || 0,
        todayJobs: todayJobs.count || 0,
        weeklyCompleted: completed.count || 0,
      };
    },
    enabled: !!user?.id,
  });

  if (authLoading || roleLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Skeleton className="h-32 w-64" />
      </div>
    );
  }

  return (
    <RoleDashboardLayout jobRole="technician">
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Technician Dashboard</h1>
          <p className="text-muted-foreground">Manage your jobs and field operations</p>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Pending Jobs</CardTitle>
              <ClipboardList className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.pendingJobs || 0}</div>
              <p className="text-xs text-muted-foreground">Awaiting acceptance</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Today's Jobs</CardTitle>
              <MapPin className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.todayJobs || 0}</div>
              <p className="text-xs text-muted-foreground">Assigned today</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">This Week</CardTitle>
              <CheckCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.weeklyCompleted || 0}</div>
              <p className="text-xs text-muted-foreground">Completed</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Quick Actions</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <Button size="sm" className="w-full" onClick={() => navigate('/dashboard/ai-agent')}>
                Open AI Console
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Job Queue */}
        <Card>
          <CardHeader>
            <CardTitle>Active Jobs</CardTitle>
          </CardHeader>
          <CardContent>
            <TechnicianJobQueue />
          </CardContent>
        </Card>
      </div>
    </RoleDashboardLayout>
  );
}
