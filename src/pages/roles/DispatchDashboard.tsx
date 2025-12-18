import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { RoleDashboardLayout } from '@/components/dashboard/RoleDashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Map, Users, ClipboardList, AlertTriangle } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { JobStatusMonitor } from '@/components/ai/agents/JobStatusMonitor';

export default function DispatchDashboard() {
  const { user, loading: authLoading, companyId } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth');
    }
  }, [user, authLoading, navigate]);

  const { data: stats } = useQuery({
    queryKey: ['dispatch-stats', companyId],
    queryFn: async () => {
      if (!companyId) return null;
      
      const [unassigned, enRoute, active] = await Promise.all([
        supabase
          .from('job_assignments')
          .select('id', { count: 'exact' })
          .eq('company_id', companyId)
          .is('employee_id', null),
        supabase
          .from('job_assignments')
          .select('id', { count: 'exact' })
          .eq('company_id', companyId)
          .eq('status', 'en_route'),
        supabase
          .from('job_assignments')
          .select('id', { count: 'exact' })
          .eq('company_id', companyId)
          .in('status', ['accepted', 'en_route', 'arrived', 'in_progress']),
      ]);
      
      return {
        unassignedJobs: unassigned.count || 0,
        techsEnRoute: enRoute.count || 0,
        activeJobs: active.count || 0,
      };
    },
    enabled: !!companyId,
  });

  if (authLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Skeleton className="h-32 w-64" />
      </div>
    );
  }

  return (
    <RoleDashboardLayout jobRole="dispatch">
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Dispatch Dashboard</h1>
          <p className="text-muted-foreground">Assign technicians and manage routes</p>
        </div>

        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Unassigned Jobs</CardTitle>
              <AlertTriangle className="h-4 w-4 text-orange-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.unassignedJobs || 0}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Techs En Route</CardTitle>
              <Map className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.techsEnRoute || 0}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Active Jobs</CardTitle>
              <ClipboardList className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.activeJobs || 0}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Technicians</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <Button size="sm" className="w-full" onClick={() => navigate('/dashboard/employees')}>
                View All
              </Button>
            </CardContent>
          </Card>
        </div>

        {companyId && (
          <Card>
            <CardHeader>
              <CardTitle>Job Status Monitor</CardTitle>
            </CardHeader>
            <CardContent>
              <JobStatusMonitor companyId={companyId} />
            </CardContent>
          </Card>
        )}
      </div>
    </RoleDashboardLayout>
  );
}
