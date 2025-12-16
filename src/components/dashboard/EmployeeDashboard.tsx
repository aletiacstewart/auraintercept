import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Calendar, Clock, MessageSquare, CheckCircle, Settings, Wrench, AlertCircle } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
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

  const isLoading = profileLoading || appointmentsLoading;

  // Check if availability is set
  const hasAvailability = profile?.availability_json && 
    Object.values(profile.availability_json as Record<string, unknown[]>).some(arr => arr.length > 0);

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
      <div className="grid gap-4 md:grid-cols-4">
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
              This Week
            </CardTitle>
            <Clock className="w-5 h-5 text-secondary" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <div className="text-3xl font-bold">{appointments?.length ?? 0}</div>
            )}
            <p className="text-xs text-muted-foreground mt-1">Upcoming appointments</p>
          </CardContent>
        </Card>

        <Card className="border-border/50">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Messages
            </CardTitle>
            <MessageSquare className="w-5 h-5 text-accent" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">0</div>
            <p className="text-xs text-muted-foreground mt-1">Unread messages</p>
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
      <div className="grid gap-4 md:grid-cols-3">
        <Button
          variant="outline"
          className="h-auto py-6 flex flex-col items-center gap-2"
          onClick={() => navigate('/dashboard/availability')}
        >
          <Clock className="w-6 h-6 text-primary" />
          <span>Manage Availability</span>
        </Button>
        <Button
          variant="outline"
          className="h-auto py-6 flex flex-col items-center gap-2"
          onClick={() => navigate('/dashboard/appointments')}
        >
          <Calendar className="w-6 h-6 text-secondary" />
          <span>View Calendar</span>
        </Button>
        <Button
          variant="outline"
          className="h-auto py-6 flex flex-col items-center gap-2"
          onClick={() => navigate('/dashboard/messages')}
        >
          <MessageSquare className="w-6 h-6 text-accent" />
          <span>View Messages</span>
        </Button>
      </div>
    </div>
  );
}
