import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Calendar, Clock, MessageSquare, CheckCircle } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { format } from 'date-fns';

export function EmployeeDashboard() {
  const { user } = useAuth();

  const { data: profile, isLoading: profileLoading } = useQuery({
    queryKey: ['profile', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      const { data } = await supabase
        .from('profiles')
        .select('*, companies(*)')
        .eq('id', user.id)
        .single();
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

  const isLoading = profileLoading || appointmentsLoading;

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
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="border-border/50">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Today's Appointments
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

      {/* Upcoming Appointments */}
      <Card className="border-border/50">
        <CardHeader>
          <CardTitle>Upcoming Appointments</CardTitle>
          <CardDescription>Your scheduled appointments</CardDescription>
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
                  className="flex items-center justify-between p-4 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
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

      {/* Availability Quick Edit */}
      <Card className="border-border/50">
        <CardHeader>
          <CardTitle>Your Availability</CardTitle>
          <CardDescription>Manage when you're available for appointments</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-7 gap-2">
            {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day) => (
              <div key={day} className="text-center">
                <div className="text-xs text-muted-foreground mb-2">{day}</div>
                <div className="w-full h-20 rounded-lg border border-dashed border-border flex items-center justify-center text-xs text-muted-foreground">
                  Set hours
                </div>
              </div>
            ))}
          </div>
          <Button variant="outline" className="w-full mt-4">
            <Clock className="w-4 h-4 mr-2" />
            Edit Availability
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
