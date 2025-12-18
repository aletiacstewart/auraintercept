import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useEmployeeJobRole } from '@/hooks/useEmployeeJobRole';
import { RoleDashboardLayout } from '@/components/dashboard/RoleDashboardLayout';
import { TechnicianJobQueue } from '@/components/employee/TechnicianJobQueue';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { ClipboardList, MapPin, Clock, CheckCircle, Wrench, Bot, Calendar, Package } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { startOfWeek, endOfWeek, differenceInMinutes } from 'date-fns';

export default function TechnicianDashboard() {
  const { user, loading: authLoading } = useAuth();
  const { hasJobType, loading: roleLoading } = useEmployeeJobRole();
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

  // Fetch technician stats
  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ['technician-stats', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      
      const today = new Date().toISOString().split('T')[0];
      const weekStart = startOfWeek(new Date()).toISOString();
      const weekEnd = endOfWeek(new Date()).toISOString();
      
      const [pending, todayJobs, completedJobs] = await Promise.all([
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
          .select('id, arrived_at, completed_at')
          .eq('employee_id', user.id)
          .eq('status', 'completed')
          .gte('completed_at', weekStart)
          .lte('completed_at', weekEnd),
      ]);

      let totalWorkMinutes = 0;
      completedJobs.data?.forEach(job => {
        if (job.arrived_at && job.completed_at) {
          totalWorkMinutes += differenceInMinutes(new Date(job.completed_at), new Date(job.arrived_at));
        }
      });
      
      return {
        pendingJobs: pending.count || 0,
        todayJobs: todayJobs.count || 0,
        weeklyCompleted: completedJobs.data?.length || 0,
        totalWorkMinutes,
      };
    },
    enabled: !!user?.id,
  });

  const isLoading = profileLoading || statsLoading;

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours === 0) return `${mins}m`;
    return `${hours}h ${mins}m`;
  };

  if (authLoading || roleLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Skeleton className="h-32 w-64" />
      </div>
    );
  }

  return (
    <RoleDashboardLayout jobRole="technician">
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
                Welcome, {profile?.full_name || 'Technician'}
              </h1>
              <p className="text-muted-foreground mt-1">
                {profile?.companies?.name || 'Technician Dashboard'}
              </p>
            </>
          )}
        </div>

        {/* Quick Stats */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
          <Card className="border-border/50">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Pending Jobs
              </CardTitle>
              <ClipboardList className="w-5 h-5 text-yellow-500" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-yellow-600">{stats?.pendingJobs ?? 0}</div>
              <p className="text-xs text-muted-foreground mt-1">Awaiting acceptance</p>
            </CardContent>
          </Card>

          <Card className="border-border/50">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Today's Jobs
              </CardTitle>
              <MapPin className="w-5 h-5 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{stats?.todayJobs ?? 0}</div>
              <p className="text-xs text-muted-foreground mt-1">Assigned today</p>
            </CardContent>
          </Card>

          <Card className="border-border/50">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Completed (Week)
              </CardTitle>
              <CheckCircle className="w-5 h-5 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-green-600">{stats?.weeklyCompleted ?? 0}</div>
              <p className="text-xs text-muted-foreground mt-1">Jobs finished</p>
            </CardContent>
          </Card>

          <Card className="border-border/50">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Work Time
              </CardTitle>
              <Clock className="w-5 h-5 text-secondary" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{formatDuration(stats?.totalWorkMinutes ?? 0)}</div>
              <p className="text-xs text-muted-foreground mt-1">This week</p>
            </CardContent>
          </Card>

          <Card className="border-border/50">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Field Ops
              </CardTitle>
              <Wrench className="w-5 h-5 text-accent" />
            </CardHeader>
            <CardContent>
              <Button size="sm" className="w-full" onClick={() => navigate('/dashboard/field-ops')}>
                Open Console
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Job Queue */}
        <Card className="border-border/50">
          <CardHeader>
            <CardTitle>Active Jobs</CardTitle>
            <p className="text-sm text-muted-foreground">Your current job assignments</p>
          </CardHeader>
          <CardContent>
            <TechnicianJobQueue />
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <div className="grid gap-4 md:grid-cols-5">
          <Button
            variant="outline"
            className="h-auto py-6 flex flex-col items-center gap-2"
            onClick={() => navigate('/dashboard/field-ops')}
          >
            <Wrench className="w-6 h-6 text-primary" />
            <span>Field Ops Console</span>
          </Button>
          <Button
            variant="outline"
            className="h-auto py-6 flex flex-col items-center gap-2"
            onClick={() => navigate('/dashboard/availability')}
          >
            <Clock className="w-6 h-6 text-secondary" />
            <span>Availability</span>
          </Button>
          <Button
            variant="outline"
            className="h-auto py-6 flex flex-col items-center gap-2"
            onClick={() => navigate('/dashboard/appointments')}
          >
            <Calendar className="w-6 h-6 text-accent" />
            <span>Calendar</span>
          </Button>
          <Button
            variant="outline"
            className="h-auto py-6 flex flex-col items-center gap-2"
            onClick={() => navigate('/dashboard/inventory')}
          >
            <Package className="w-6 h-6 text-primary" />
            <span>Inventory</span>
          </Button>
          <Button
            variant="outline"
            className="h-auto py-6 flex flex-col items-center gap-2"
            onClick={() => navigate('/dashboard/ai-agents')}
          >
            <Bot className="w-6 h-6 text-secondary" />
            <span>AI Agents Hub</span>
          </Button>
        </div>
      </div>
    </RoleDashboardLayout>
  );
}