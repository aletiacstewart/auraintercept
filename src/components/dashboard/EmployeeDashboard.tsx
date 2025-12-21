import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Calendar, MessageSquare, Clock, CheckCircle2, Bot, Settings, User } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { useNavigate } from 'react-router-dom';
import { useEmployeeJobRole } from '@/hooks/useEmployeeJobRole';
import { format, startOfMonth, endOfMonth } from 'date-fns';

export function EmployeeDashboard() {
  const { user, companyId } = useAuth();
  const { jobTypes, primaryJobType } = useEmployeeJobRole();
  const navigate = useNavigate();

  const { data: profile, isLoading: profileLoading } = useQuery({
    queryKey: ['profile', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      const { data } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();
      return data;
    },
    enabled: !!user?.id,
  });

  const { data: company, isLoading: companyLoading } = useQuery({
    queryKey: ['company', companyId],
    queryFn: async () => {
      if (!companyId) return null;
      const { data } = await supabase
        .from('companies')
        .select('name, primary_color, secondary_color, logo_url')
        .eq('id', companyId)
        .single();
      return data;
    },
    enabled: !!companyId,
  });

  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ['employee-stats', user?.id, companyId],
    queryFn: async () => {
      if (!user?.id || !companyId) return null;

      const now = new Date();
      const monthStart = startOfMonth(now).toISOString();
      const monthEnd = endOfMonth(now).toISOString();

      const [appointments, completedJobs] = await Promise.all([
        supabase
          .from('appointments')
          .select('id', { count: 'exact', head: true })
          .eq('employee_id', user.id)
          .eq('status', 'scheduled')
          .gte('datetime', now.toISOString()),
        supabase
          .from('job_assignments')
          .select('id', { count: 'exact', head: true })
          .eq('employee_id', user.id)
          .eq('status', 'completed')
          .gte('completed_at', monthStart)
          .lte('completed_at', monthEnd),
      ]);

      return {
        upcomingAppointments: appointments.count ?? 0,
        completedThisMonth: completedJobs.count ?? 0,
      };
    },
    enabled: !!user?.id && !!companyId,
  });

  const isLoading = profileLoading || companyLoading || statsLoading;

  const statCards = [
    {
      title: 'Upcoming Tasks',
      value: stats?.upcomingAppointments ?? 0,
      icon: Calendar,
      description: 'Scheduled for you',
      gradient: 'from-primary to-primary/80',
    },
    {
      title: 'Completed',
      value: stats?.completedThisMonth ?? 0,
      icon: CheckCircle2,
      description: format(new Date(), 'MMMM yyyy'),
      gradient: 'from-green-500 to-green-600',
    },
  ];

  const quickActions = [
    { label: 'View Schedule', icon: Calendar, href: '/dashboard/appointments', gradient: 'from-primary to-primary/80' },
    { label: 'AI Assistant', icon: Bot, href: '/dashboard/ai-agent', gradient: 'from-purple-500 to-purple-600' },
    { label: 'My Availability', icon: Clock, href: '/dashboard/availability', gradient: 'from-secondary to-secondary/80' },
    { label: 'Profile', icon: User, href: '/dashboard/settings', gradient: 'from-accent to-accent/80' },
  ];

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          {isLoading ? (
            <>
              <Skeleton className="h-8 w-48 mb-2" />
              <Skeleton className="h-4 w-64" />
            </>
          ) : (
            <>
              <h1 className="text-3xl font-bold tracking-tight">
                Welcome, {profile?.full_name?.split(' ')[0] || 'Team Member'}
              </h1>
              <p className="text-muted-foreground mt-1">
                {company?.name} • {primaryJobType ? primaryJobType.replace('_', ' ').replace(/\b\w/g, c => c.toUpperCase()) : 'Employee'}
              </p>
            </>
          )}
        </div>
        <div
          className="w-16 h-16 rounded-xl border-2 overflow-hidden"
          style={{ borderColor: company?.primary_color || 'hsl(var(--primary))' }}
        >
          {company?.logo_url ? (
            <img src={company.logo_url} alt="Company Logo" className="w-full h-full object-cover" />
          ) : (
            <div
              className="w-full h-full flex items-center justify-center text-2xl font-bold"
              style={{
                background: `linear-gradient(135deg, ${company?.primary_color || '#0EA5E9'}, ${company?.secondary_color || '#8B5CF6'})`,
                color: 'white',
              }}
            >
              {company?.name?.charAt(0) || 'C'}
            </div>
          )}
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {statCards.map((stat) => (
          <Card key={stat.title} className="relative overflow-hidden border-border/50">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">{stat.title}</CardTitle>
              <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${stat.gradient} flex items-center justify-center`}>
                <stat.icon className="w-5 h-5 text-primary-foreground" />
              </div>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Skeleton className="h-8 w-20" />
              ) : (
                <div className="text-3xl font-bold">{stat.value}</div>
              )}
              <p className="text-xs text-muted-foreground mt-1">{stat.description}</p>
            </CardContent>
            <div className={`absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r ${stat.gradient}`} />
          </Card>
        ))}
      </div>

      {/* Quick Actions */}
      <Card className="border-border/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="w-5 h-5 text-primary" />
            Quick Actions
          </CardTitle>
          <CardDescription>Access your most used features</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 grid-cols-2 lg:grid-cols-4">
            {quickActions.map((action) => (
              <Button
                key={action.label}
                variant="outline"
                className="h-auto py-4 flex flex-col items-center gap-2 hover:border-primary"
                onClick={() => navigate(action.href)}
              >
                <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${action.gradient} flex items-center justify-center`}>
                  <action.icon className="w-5 h-5 text-primary-foreground" />
                </div>
                <span className="font-medium text-xs">{action.label}</span>
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Job Types */}
      {jobTypes.length > 0 && (
        <Card className="border-border/50">
          <CardHeader>
            <CardTitle>Your Roles</CardTitle>
            <CardDescription>Your assigned job responsibilities</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {jobTypes.map((type) => (
                <div
                  key={type}
                  className="px-3 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-medium"
                >
                  {type.replace('_', ' ').replace(/\b\w/g, (c) => c.toUpperCase())}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
