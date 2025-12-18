import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { TechnicianDashboardLayout } from '@/components/dashboard/TechnicianDashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  ClipboardList, 
  Navigation, 
  CheckCircle2, 
  Clock, 
  MapPin,
  Bot,
  ArrowRight,
  Phone,
  Activity,
  TrendingUp
} from 'lucide-react';
import { format } from 'date-fns';

export default function TechnicianDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();

  // Fetch today's jobs
  const { data: jobs, isLoading } = useQuery({
    queryKey: ['technician-today-jobs', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      const { data, error } = await supabase
        .from('job_assignments')
        .select(`
          *,
          appointment:appointments(*)
        `)
        .eq('employee_id', user.id)
        .gte('created_at', today.toISOString())
        .lt('created_at', tomorrow.toISOString())
        .order('created_at', { ascending: true });

      if (error) throw error;
      return data || [];
    },
    enabled: !!user?.id,
  });

  const pendingJobs = jobs?.filter(j => j.status === 'pending_acceptance') || [];
  const activeJobs = jobs?.filter(j => ['accepted', 'en_route', 'arrived', 'in_progress'].includes(j.status)) || [];
  const completedJobs = jobs?.filter(j => j.status === 'completed') || [];
  const nextJob = activeJobs[0] || pendingJobs[0];

  const statCards = [
    { 
      label: 'Pending', 
      value: pendingJobs.length, 
      icon: Clock, 
      description: 'Awaiting action',
      gradient: 'from-yellow-500 to-yellow-600'
    },
    { 
      label: 'Active', 
      value: activeJobs.length, 
      icon: Navigation, 
      description: 'In progress',
      gradient: 'from-blue-500 to-blue-600'
    },
    { 
      label: 'Completed', 
      value: completedJobs.length, 
      icon: CheckCircle2, 
      description: 'Done today',
      gradient: 'from-green-500 to-green-600'
    },
  ];

  const quickActions = [
    { label: 'AI Assistant', icon: Bot, href: '/technician/ai-console', gradient: 'from-purple-500 to-purple-600' },
    { label: 'My Jobs', icon: ClipboardList, href: '/technician/jobs', gradient: 'from-primary to-primary/80' },
  ];

  return (
    <TechnicianDashboardLayout>
      <div className="p-4 md:p-6 space-y-6 animate-fade-in">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground mt-1">Good {getGreeting()}! Here's your day at a glance</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-3 gap-3">
          {statCards.map((stat) => (
            <Card key={stat.label} className="relative overflow-hidden border-border/50">
              <CardContent className="pt-4 pb-3">
                <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${stat.gradient} flex items-center justify-center mx-auto mb-2`}>
                  <stat.icon className="w-5 h-5 text-primary-foreground" />
                </div>
                <p className="text-2xl font-bold text-center">{isLoading ? '-' : stat.value}</p>
                <p className="text-xs text-muted-foreground text-center">{stat.label}</p>
              </CardContent>
              <div className={`absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r ${stat.gradient}`} />
            </Card>
          ))}
        </div>

        {/* Next Job Card */}
        <Card className="relative overflow-hidden border-border/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center">
                <ClipboardList className="h-4 w-4 text-primary-foreground" />
              </div>
              Next Job
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-2">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
              </div>
            ) : nextJob ? (
              <div className="space-y-3">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-medium">{nextJob.appointment?.customer_name}</p>
                    <p className="text-sm text-muted-foreground">{nextJob.appointment?.service_type}</p>
                  </div>
                  <Badge variant={nextJob.status === 'pending_acceptance' ? 'secondary' : 'default'}>
                    {nextJob.status.replace('_', ' ')}
                  </Badge>
                </div>
                
                {nextJob.customer_address && (
                  <div className="flex items-start gap-2 text-sm text-muted-foreground">
                    <MapPin className="h-4 w-4 mt-0.5 shrink-0" />
                    <span>{nextJob.customer_address}</span>
                  </div>
                )}

                {nextJob.appointment?.datetime && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Clock className="h-4 w-4" />
                    <span>{format(new Date(nextJob.appointment.datetime), 'h:mm a')}</span>
                  </div>
                )}

                <div className="flex gap-2 pt-2">
                  <Button 
                    className="flex-1" 
                    onClick={() => navigate('/technician/ai-console')}
                  >
                    <Navigation className="h-4 w-4 mr-2" />
                    Get Directions
                  </Button>
                  {nextJob.appointment?.customer_phone && (
                    <Button 
                      variant="outline"
                      onClick={() => window.open(`tel:${nextJob.appointment.customer_phone}`)}
                    >
                      <Phone className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>
            ) : (
              <div className="text-center py-4">
                <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-muted to-muted/80 flex items-center justify-center mx-auto mb-2">
                  <CheckCircle2 className="h-6 w-6 text-muted-foreground" />
                </div>
                <p className="text-muted-foreground">No jobs scheduled</p>
                <Button 
                  variant="link" 
                  className="mt-2"
                  onClick={() => navigate('/technician/jobs')}
                >
                  View all jobs
                </Button>
              </div>
            )}
          </CardContent>
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-primary to-primary/80" />
        </Card>

        {/* Quick Actions */}
        <div className="grid gap-4 md:grid-cols-2">
          <Card className="border-border/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="w-5 h-5 text-primary" />
                Quick Actions
              </CardTitle>
              <CardDescription>Fast access to key features</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-3">
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

          <Card className="border-border/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-secondary" />
                Today's Progress
              </CardTitle>
              <CardDescription>Your performance overview</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span>Jobs Completed</span>
                    <span className="font-medium">{completedJobs.length}/{jobs?.length || 0}</span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-muted">
                    <div 
                      className="h-full rounded-full bg-gradient-to-r from-green-500 to-green-600" 
                      style={{ width: jobs?.length ? `${(completedJobs.length / jobs.length) * 100}%` : '0%' }} 
                    />
                  </div>
                </div>
                <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                  <span className="text-sm">Status</span>
                  <span className="text-sm font-medium text-green-500 flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-green-500" />
                    On Track
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* View All Jobs Link */}
        <Button 
          variant="ghost" 
          className="w-full justify-between"
          onClick={() => navigate('/technician/jobs')}
        >
          View all jobs
          <ArrowRight className="h-4 w-4" />
        </Button>
      </div>
    </TechnicianDashboardLayout>
  );
}

function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return 'Morning';
  if (hour < 17) return 'Afternoon';
  return 'Evening';
}
