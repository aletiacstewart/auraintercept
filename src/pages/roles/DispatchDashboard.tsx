import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { RoleDashboardLayout } from '@/components/dashboard/RoleDashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Map, Users, ClipboardList, AlertTriangle, Truck, Bot } from 'lucide-react';
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

  const { data: profile, isLoading: profileLoading } = useQuery({
    queryKey: ['profile', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      const { data } = await supabase
        .from('profiles')
        .select('*, companies(*)')
        .eq('id', user.id)
        .maybeSingle();
      return data;
    },
    enabled: !!user?.id,
  });

  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ['dispatch-stats', companyId],
    queryFn: async () => {
      if (!companyId) return null;
      
      const [unassigned, enRoute, active, techs] = await Promise.all([
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
        supabase
          .from('profiles')
          .select('id', { count: 'exact' })
          .eq('company_id', companyId),
      ]);
      
      return {
        unassignedJobs: unassigned.count || 0,
        techsEnRoute: enRoute.count || 0,
        activeJobs: active.count || 0,
        totalTechs: techs.count || 0,
      };
    },
    enabled: !!companyId,
  });

  const isLoading = profileLoading || statsLoading;

  if (authLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Skeleton className="h-32 w-64" />
      </div>
    );
  }

  return (
    <RoleDashboardLayout jobRole="dispatch">
      <div className="space-y-8 animate-fade-in">
        {/* Header */}
        <div>
          {isLoading ? (
            <>
              <Skeleton className="h-8 w-48 mb-2" />
              <Skeleton className="h-4 w-64" />
            </>
          ) : (
            <>
              <h1 className="text-3xl font-bold tracking-tight">
                Welcome, {profile?.full_name || 'Dispatcher'}
              </h1>
              <p className="text-muted-foreground mt-1">
                {profile?.companies?.name || 'Dispatch Dashboard'}
              </p>
            </>
          )}
        </div>

        {/* Quick Stats */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
          <Card className="border-border/50">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Unassigned Jobs
              </CardTitle>
              <AlertTriangle className="w-5 h-5 text-orange-500" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-orange-600">{stats?.unassignedJobs ?? 0}</div>
              <p className="text-xs text-muted-foreground mt-1">Need assignment</p>
            </CardContent>
          </Card>

          <Card className="border-border/50">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Techs En Route
              </CardTitle>
              <Truck className="w-5 h-5 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-blue-600">{stats?.techsEnRoute ?? 0}</div>
              <p className="text-xs text-muted-foreground mt-1">Currently traveling</p>
            </CardContent>
          </Card>

          <Card className="border-border/50">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Active Jobs
              </CardTitle>
              <ClipboardList className="w-5 h-5 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-green-600">{stats?.activeJobs ?? 0}</div>
              <p className="text-xs text-muted-foreground mt-1">In progress</p>
            </CardContent>
          </Card>

          <Card className="border-border/50">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Technicians
              </CardTitle>
              <Users className="w-5 h-5 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{stats?.totalTechs ?? 0}</div>
              <p className="text-xs text-muted-foreground mt-1">Available</p>
            </CardContent>
          </Card>

          <Card className="border-border/50">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Live Map
              </CardTitle>
              <Map className="w-5 h-5 text-secondary" />
            </CardHeader>
            <CardContent>
              <Button size="sm" className="w-full" onClick={() => navigate('/dashboard/field-ops')}>
                Open Map
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Job Status Monitor */}
        {companyId && (
          <Card className="border-border/50">
            <CardHeader>
              <CardTitle>Job Status Monitor</CardTitle>
              <p className="text-sm text-muted-foreground">Real-time job tracking</p>
            </CardHeader>
            <CardContent>
              <JobStatusMonitor companyId={companyId} />
            </CardContent>
          </Card>
        )}

        {/* Quick Actions */}
        <div className="grid gap-4 md:grid-cols-5">
          <Button
            variant="outline"
            className="h-auto py-6 flex flex-col items-center gap-2"
            onClick={() => navigate('/dashboard/ai-agent')}
          >
            <Bot className="w-6 h-6 text-primary" />
            <span>AI Console</span>
          </Button>
          <Button
            variant="outline"
            className="h-auto py-6 flex flex-col items-center gap-2"
            onClick={() => navigate('/dashboard/field-ops')}
          >
            <Map className="w-6 h-6 text-secondary" />
            <span>Live Map</span>
          </Button>
          <Button
            variant="outline"
            className="h-auto py-6 flex flex-col items-center gap-2"
            onClick={() => navigate('/dashboard/employees')}
          >
            <Users className="w-6 h-6 text-accent" />
            <span>Technicians</span>
          </Button>
          <Button
            variant="outline"
            className="h-auto py-6 flex flex-col items-center gap-2"
            onClick={() => navigate('/dashboard/appointments')}
          >
            <ClipboardList className="w-6 h-6 text-primary" />
            <span>Appointments</span>
          </Button>
          <Button
            variant="outline"
            className="h-auto py-6 flex flex-col items-center gap-2"
            onClick={() => navigate('/dashboard/ai-agents')}
          >
            <Truck className="w-6 h-6 text-secondary" />
            <span>AI Agents Hub</span>
          </Button>
        </div>
      </div>
    </RoleDashboardLayout>
  );
}