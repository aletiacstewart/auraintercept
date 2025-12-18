import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { RoleDashboardLayout } from '@/components/dashboard/RoleDashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Calendar, Phone, MessageSquare, Bot, Users, Clock } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';

export default function BookingAgentDashboard() {
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
    queryKey: ['booking-agent-stats', companyId],
    queryFn: async () => {
      if (!companyId) return null;
      
      const today = new Date().toISOString().split('T')[0];
      const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      
      const [todayAppts, pendingCalls, messages, upcoming] = await Promise.all([
        supabase
          .from('appointments')
          .select('id', { count: 'exact' })
          .eq('company_id', companyId)
          .gte('datetime', today)
          .lt('datetime', tomorrow),
        supabase
          .from('call_logs')
          .select('id', { count: 'exact' })
          .eq('company_id', companyId)
          .eq('status', 'missed'),
        supabase
          .from('reminder_logs')
          .select('id', { count: 'exact' })
          .eq('company_id', companyId)
          .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()),
        supabase
          .from('appointments')
          .select('*')
          .eq('company_id', companyId)
          .gte('datetime', new Date().toISOString())
          .order('datetime', { ascending: true })
          .limit(5),
      ]);
      
      return {
        todayAppointments: todayAppts.count || 0,
        missedCalls: pendingCalls.count || 0,
        recentMessages: messages.count || 0,
        upcomingAppointments: upcoming.data || [],
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
    <RoleDashboardLayout jobRole="booking_agent">
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
                Welcome, {profile?.full_name || 'Booking Agent'}
              </h1>
              <p className="text-muted-foreground mt-1">
                {profile?.companies?.name || 'Booking Dashboard'}
              </p>
            </>
          )}
        </div>

        {/* Quick Stats */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card className="border-border/50">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Today's Appointments
              </CardTitle>
              <Calendar className="w-5 h-5 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{stats?.todayAppointments ?? 0}</div>
              <p className="text-xs text-muted-foreground mt-1">Scheduled for today</p>
            </CardContent>
          </Card>

          <Card className="border-border/50">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Missed Calls
              </CardTitle>
              <Phone className="w-5 h-5 text-destructive" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-destructive">{stats?.missedCalls ?? 0}</div>
              <p className="text-xs text-muted-foreground mt-1">Need callback</p>
            </CardContent>
          </Card>

          <Card className="border-border/50">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Recent Messages
              </CardTitle>
              <MessageSquare className="w-5 h-5 text-secondary" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{stats?.recentMessages ?? 0}</div>
              <p className="text-xs text-muted-foreground mt-1">Last 24 hours</p>
            </CardContent>
          </Card>

          <Card className="border-border/50">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                AI Console
              </CardTitle>
              <Bot className="w-5 h-5 text-accent" />
            </CardHeader>
            <CardContent>
              <Button size="sm" className="w-full" onClick={() => navigate('/dashboard/booking-agent/console')}>
                Open Console
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Upcoming Appointments */}
        <Card className="border-border/50">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Upcoming Appointments</CardTitle>
              <p className="text-sm text-muted-foreground">Next scheduled appointments</p>
            </div>
            <Button variant="outline" size="sm" onClick={() => navigate('/dashboard/appointments')}>
              View All
            </Button>
          </CardHeader>
          <CardContent>
            {stats?.upcomingAppointments && stats.upcomingAppointments.length > 0 ? (
              <div className="space-y-3">
                {stats.upcomingAppointments.map((appointment: any) => (
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
                <Calendar className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
                <p className="text-muted-foreground">No upcoming appointments</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <div className="grid gap-4 md:grid-cols-5">
          <Button
            variant="outline"
            className="h-auto py-6 flex flex-col items-center gap-2"
            onClick={() => navigate('/dashboard/booking-agent/console')}
          >
            <Bot className="w-6 h-6 text-primary" />
            <span>Booking Console</span>
          </Button>
          <Button
            variant="outline"
            className="h-auto py-6 flex flex-col items-center gap-2"
            onClick={() => navigate('/dashboard/appointments')}
          >
            <Calendar className="w-6 h-6 text-secondary" />
            <span>Appointments</span>
          </Button>
          <Button
            variant="outline"
            className="h-auto py-6 flex flex-col items-center gap-2"
            onClick={() => navigate('/dashboard/calls')}
          >
            <Phone className="w-6 h-6 text-accent" />
            <span>Call History</span>
          </Button>
          <Button
            variant="outline"
            className="h-auto py-6 flex flex-col items-center gap-2"
            onClick={() => navigate('/dashboard/messages')}
          >
            <MessageSquare className="w-6 h-6 text-primary" />
            <span>Messages</span>
          </Button>
          <Button
            variant="outline"
            className="h-auto py-6 flex flex-col items-center gap-2"
            onClick={() => navigate('/dashboard/ai-agents')}
          >
            <Users className="w-6 h-6 text-secondary" />
            <span>AI Agents Hub</span>
          </Button>
        </div>
      </div>
    </RoleDashboardLayout>
  );
}