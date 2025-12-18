import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { TechnicianDashboardLayout } from '@/components/dashboard/TechnicianDashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
  Phone
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

  const stats = [
    { label: 'Pending', value: pendingJobs.length, icon: Clock, color: 'text-yellow-500' },
    { label: 'Active', value: activeJobs.length, icon: Navigation, color: 'text-blue-500' },
    { label: 'Completed', value: completedJobs.length, icon: CheckCircle2, color: 'text-green-500' },
  ];

  return (
    <TechnicianDashboardLayout>
      <div className="p-4 md:p-6 space-y-6">
        {/* Welcome Header */}
        <div>
          <h1 className="text-2xl font-bold">Good {getGreeting()}!</h1>
          <p className="text-muted-foreground">Here's your day at a glance</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-3 gap-3">
          {stats.map((stat) => (
            <Card key={stat.label} className="text-center">
              <CardContent className="pt-4 pb-3">
                <stat.icon className={`h-6 w-6 mx-auto mb-1 ${stat.color}`} />
                <p className="text-2xl font-bold">{isLoading ? '-' : stat.value}</p>
                <p className="text-xs text-muted-foreground">{stat.label}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Next Job Card */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <ClipboardList className="h-5 w-5" />
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
                <CheckCircle2 className="h-10 w-10 mx-auto text-muted-foreground/50 mb-2" />
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
        </Card>

        {/* Quick Actions */}
        <div className="grid grid-cols-2 gap-3">
          <Button 
            variant="outline" 
            className="h-auto py-4 flex-col gap-2"
            onClick={() => navigate('/technician/ai-console')}
          >
            <Bot className="h-6 w-6" />
            <span>AI Assistant</span>
          </Button>
          <Button 
            variant="outline" 
            className="h-auto py-4 flex-col gap-2"
            onClick={() => navigate('/technician/jobs')}
          >
            <ClipboardList className="h-6 w-6" />
            <span>My Jobs</span>
          </Button>
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
