import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Calendar, Clock, MessageSquare, CheckCircle, Settings, Wrench, AlertCircle, Package, Timer } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { format, startOfWeek, endOfWeek, differenceInMinutes } from 'date-fns';
import { TechnicianJobQueue } from '@/components/employee/TechnicianJobQueue';

export function EmployeeDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();

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

  const { data: appointments, isLoading: appointmentsLoading } = useQuery({
    queryKey: ['my-appointments', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      const { data } = await supabase
        .from('appointments')
        .select('*')
        .eq('employee_id', user.id)
        .gte('datetime', new Date().toISOString())
        .order('datetime', { ascending: true })
        .limit(5);
      return data ?? [];
    },
    enabled: !!user?.id,
  });

  const { data: pendingJobs } = useQuery({
    queryKey: ['pending-jobs', user?.id],
    queryFn: async () => {
      if (!user?.id) return 0;
      const { count } = await supabase
        .from('job_assignments')
        .select('id', { count: 'exact', head: true })
        .eq('employee_id', user.id)
        .eq('status', 'pending_acceptance');
      return count ?? 0;
    },
    enabled: !!user?.id,
  });

  const { data: completedStats } = useQuery({
    queryKey: ['completed-stats', user?.id],
    queryFn: async () => {
      if (!user?.id) return { completedJobs: 0, totalWorkMinutes: 0, partsUsedValue: 0 };
      
      const weekStart = startOfWeek(new Date()).toISOString();
      const weekEnd = endOfWeek(new Date()).toISOString();

      const { data: jobs } = await supabase
        .from('job_assignments')
        .select('id, arrived_at, completed_at')
        .eq('employee_id', user.id)
        .eq('status', 'completed')
        .gte('completed_at', weekStart)
        .lte('completed_at', weekEnd);

      const completedJobs = jobs?.length ?? 0;
      let totalWorkMinutes = 0;
      
      jobs?.forEach(job => {
        if (job.arrived_at && job.completed_at) {
          totalWorkMinutes += differenceInMinutes(new Date(job.completed_at), new Date(job.arrived_at));
        }
      });

      // Get parts used value this week
      const { data: transactions } = await supabase
        .from('inventory_transactions')
        .select('quantity, item_id, inventory_items(unit_cost)')
        .eq('employee_id', user.id)
        .eq('transaction_type', 'used')
        .gte('created_at', weekStart)
        .lte('created_at', weekEnd);

      const partsUsedValue = (transactions ?? []).reduce((sum, t) => {
        const cost = (t.inventory_items as any)?.unit_cost ?? 0;
        return sum + (Math.abs(t.quantity) * cost);
      }, 0);

      return { completedJobs, totalWorkMinutes, partsUsedValue };
    },
    enabled: !!user?.id,
  });

  const isLoading = profileLoading || appointmentsLoading;

  // Check if availability is set
  const hasAvailability = profile?.availability_json && 
    Object.values(profile.availability_json as Record<string, unknown[]>).some(arr => arr.length > 0);

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours === 0) return `${mins}m`;
    return `${hours}h ${mins}m`;
  };

  return (
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
              Welcome, {profile?.full_name || 'Employee'}
            </h1>
            <p className="text-muted-foreground mt-1">
              {profile?.companies?.name || 'Your Dashboard'}
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
            <AlertCircle className="w-5 h-5 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-yellow-600">{pendingJobs ?? 0}</div>
            <p className="text-xs text-muted-foreground mt-1">Awaiting your response</p>
          </CardContent>
        </Card>

        <Card className="border-border/50">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Today's Jobs
            </CardTitle>
            <Calendar className="w-5 h-5 text-primary" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <div className="text-3xl font-bold">
                {appointments?.filter(a => 
                  format(new Date(a.datetime), 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd')
                ).length ?? 0}
              </div>
            )}
            <p className="text-xs text-muted-foreground mt-1">Scheduled for today</p>
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
            <div className="text-3xl font-bold text-green-600">{completedStats?.completedJobs ?? 0}</div>
            <p className="text-xs text-muted-foreground mt-1">Jobs finished this week</p>
          </CardContent>
        </Card>

        <Card className="border-border/50">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Work Time
            </CardTitle>
            <Timer className="w-5 h-5 text-secondary" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {formatDuration(completedStats?.totalWorkMinutes ?? 0)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">This week</p>
          </CardContent>
        </Card>

        <Card className="border-border/50">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Parts Used
            </CardTitle>
            <Package className="w-5 h-5 text-accent" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              ${(completedStats?.partsUsedValue ?? 0).toFixed(0)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Value this week</p>
          </CardContent>
        </Card>
      </div>

      {/* Setup Availability Banner */}
      {!isLoading && !hasAvailability && (
        <Card className="border-primary/50 bg-primary/5">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full gradient-primary flex items-center justify-center">
                  <Settings className="w-6 h-6 text-primary-foreground" />
                </div>
                <div>
                  <p className="font-semibold">Set Your Availability</p>
                  <p className="text-sm text-muted-foreground">
                    Let customers know when you're available for appointments
                  </p>
                </div>
              </div>
              <Button onClick={() => navigate('/dashboard/availability')}>
                Set Up Now
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Job Queue - Primary Focus */}
      <TechnicianJobQueue />

      {/* Upcoming Appointments */}
      <Card className="border-border/50">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Upcoming Appointments</CardTitle>
            <CardDescription>Your scheduled appointments</CardDescription>
          </div>
          <Button variant="outline" size="sm" onClick={() => navigate('/dashboard/appointments')}>
            View All
          </Button>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          ) : appointments && appointments.length > 0 ? (
            <div className="space-y-3">
              {appointments.map((appointment) => (
                <div
                  key={appointment.id}
                  className="flex items-center justify-between p-4 rounded-lg bg-muted/50 hover:bg-muted transition-colors cursor-pointer"
                  onClick={() => navigate('/dashboard/appointments')}
                >
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-lg gradient-primary flex items-center justify-center text-primary-foreground">
                      <Calendar className="w-6 h-6" />
                    </div>
                    <div>
                      <p className="font-medium">{appointment.customer_name}</p>
                      <p className="text-sm text-muted-foreground">{appointment.service_type}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-medium">{format(new Date(appointment.datetime), 'MMM d, yyyy')}</p>
                    <p className="text-sm text-muted-foreground">{format(new Date(appointment.datetime), 'h:mm a')}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <CheckCircle className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
              <p className="text-muted-foreground">No upcoming appointments</p>
              <p className="text-sm text-muted-foreground">Your schedule is clear!</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <div className="grid gap-4 md:grid-cols-5">
        <Button
          variant="outline"
          className="h-auto py-6 flex flex-col items-center gap-2"
          onClick={() => navigate('/dashboard/ai-agent')}
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
          <span>Manage Availability</span>
        </Button>
        <Button
          variant="outline"
          className="h-auto py-6 flex flex-col items-center gap-2"
          onClick={() => navigate('/dashboard/appointments')}
        >
          <Calendar className="w-6 h-6 text-accent" />
          <span>View Calendar</span>
        </Button>
        <Button
          variant="outline"
          className="h-auto py-6 flex flex-col items-center gap-2"
          onClick={() => navigate('/dashboard/inventory')}
        >
          <Package className="w-6 h-6 text-primary" />
          <span>View Inventory</span>
        </Button>
        <Button
          variant="outline"
          className="h-auto py-6 flex flex-col items-center gap-2"
          onClick={() => navigate('/dashboard/messages')}
        >
          <MessageSquare className="w-6 h-6 text-secondary" />
          <span>View Messages</span>
        </Button>
      </div>
    </div>
  );
}