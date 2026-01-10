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
  TrendingUp,
  Camera,
  Play,
  ExternalLink
} from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

// Aura Intercept themed status styles
const STATUS_STYLES: Record<string, { bg: string; text: string; glow: string; label: string }> = {
  pending_acceptance: { bg: 'bg-yellow-500/20', text: 'text-yellow-400', glow: 'shadow-yellow-500/30', label: 'Pending' },
  accepted: { bg: 'bg-blue-500/20', text: 'text-blue-400', glow: 'shadow-blue-500/30', label: 'Accepted' },
  en_route: { bg: 'bg-accent/20', text: 'text-accent', glow: 'shadow-accent/50', label: 'En Route' },
  arrived: { bg: 'bg-accent/20', text: 'text-accent', glow: 'shadow-accent/50', label: 'On Site' },
  in_progress: { bg: 'bg-orange-500/20', text: 'text-orange-400', glow: 'shadow-orange-500/30', label: 'In Progress' },
  completed: { bg: 'bg-green-500/20', text: 'text-green-400', glow: 'shadow-green-500/30', label: 'Completed' },
};

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
  const currentJob = activeJobs.find(j => ['en_route', 'arrived', 'in_progress'].includes(j.status)) || activeJobs[0];
  const nextJob = currentJob || pendingJobs[0];

  const statCards = [
    { 
      label: 'Pending', 
      value: pendingJobs.length, 
      icon: Clock, 
      gradient: 'from-yellow-500/80 to-yellow-600/80',
      glow: 'shadow-yellow-500/20'
    },
    { 
      label: 'Active', 
      value: activeJobs.length, 
      icon: Navigation, 
      gradient: 'from-accent/80 to-accent/60',
      glow: 'shadow-accent/30'
    },
    { 
      label: 'Done', 
      value: completedJobs.length, 
      icon: CheckCircle2, 
      gradient: 'from-green-500/80 to-green-600/80',
      glow: 'shadow-green-500/20'
    },
  ];

  // Get next action for current job
  const getNextAction = () => {
    if (!currentJob) return null;
    switch (currentJob.status) {
      case 'accepted': return { label: 'Start Route', icon: Navigation };
      case 'en_route': return { label: 'Check In', icon: MapPin };
      case 'arrived': return { label: 'Start Job', icon: Play };
      case 'in_progress': return { label: 'Complete', icon: CheckCircle2 };
      default: return null;
    }
  };

  const nextAction = getNextAction();
  const currentStyles = currentJob ? STATUS_STYLES[currentJob.status] : null;

  return (
    <TechnicianDashboardLayout>
      <div className="p-4 md:p-6 space-y-5 animate-fade-in pb-24">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground text-sm mt-0.5">Good {getGreeting()}! Here's your day</p>
        </div>

        {/* Stats Grid - Compact for mobile */}
        <div className="grid grid-cols-3 gap-2">
          {statCards.map((stat) => (
            <Card key={stat.label} className="relative overflow-hidden border-border/50 bg-card/50">
              <CardContent className="pt-3 pb-2 px-2">
                <div className={cn(
                  "w-9 h-9 rounded-lg bg-gradient-to-br flex items-center justify-center mx-auto mb-1.5",
                  stat.gradient,
                  "shadow-lg",
                  stat.glow
                )}>
                  <stat.icon className="w-4 h-4 text-primary-foreground" />
                </div>
                <p className="text-xl font-bold text-center">{isLoading ? '-' : stat.value}</p>
                <p className="text-[10px] text-white/70 text-center uppercase tracking-wide">{stat.label}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Active Job Card with Large Check-In */}
        {currentJob ? (
          <Card className="relative overflow-hidden border-border/50 bg-gradient-to-b from-card to-card/80">
            <div className={cn("absolute top-0 left-0 right-0 h-1 bg-gradient-to-r", 
              currentJob.status === 'en_route' || currentJob.status === 'arrived' 
                ? "from-accent to-accent/60" 
                : "from-primary to-primary/60"
            )} />
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Badge className={cn("border-0 font-medium", currentStyles?.bg, currentStyles?.text)}>
                    {currentStyles?.label}
                  </Badge>
                  {currentJob.estimated_arrival_minutes && currentJob.status === 'en_route' && (
                    <span className="text-xs text-accent">ETA: {currentJob.estimated_arrival_minutes} min</span>
                  )}
                </div>
                {currentJob.appointment?.datetime && (
                  <span className="text-sm font-semibold text-accent">
                    {format(new Date(currentJob.appointment.datetime), 'h:mm a')}
                  </span>
                )}
              </div>
              <CardTitle className="text-base mt-2">
                {currentJob.appointment?.service_type || 'Service Call'}
              </CardTitle>
              <CardDescription className="text-white/70">
                {currentJob.appointment?.customer_name}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {/* Address */}
              {currentJob.customer_address && (
                <div className="flex items-start gap-2 p-2.5 rounded-lg bg-slate-700/50 border border-slate-600/50 text-sm">
                  <MapPin className="h-4 w-4 mt-0.5 shrink-0 text-accent" />
                  <span className="text-white/80">{currentJob.customer_address}</span>
                </div>
              )}

              {/* Quick Actions Row */}
              <div className="grid grid-cols-3 gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="h-11 flex-col gap-1 border-accent/30 text-accent hover:bg-accent/10"
                  onClick={() => {
                    if (currentJob.customer_address) {
                      window.open(`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(currentJob.customer_address)}`, '_blank');
                    }
                  }}
                >
                  <Navigation className="h-4 w-4" />
                  <span className="text-[10px]">Directions</span>
                </Button>
                {currentJob.appointment?.customer_phone && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-11 flex-col gap-1"
                    onClick={() => window.open(`tel:${currentJob.appointment?.customer_phone}`)}
                  >
                    <Phone className="h-4 w-4" />
                    <span className="text-[10px]">Call</span>
                  </Button>
                )}
                <Button
                  variant="outline"
                  size="sm"
                  className="h-11 flex-col gap-1"
                  onClick={() => navigate('/technician/jobs?job=' + currentJob.id + '&upload=before')}
                >
                  <Camera className="h-4 w-4" />
                  <span className="text-[10px]">Photos</span>
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : nextJob ? (
          // Pending Job Card
          <Card className="border-border/50">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <Badge className="bg-yellow-500/20 text-yellow-400 border-0">
                  Awaiting Acceptance
                </Badge>
                {nextJob.appointment?.datetime && (
                  <span className="text-sm text-white/70">
                    {format(new Date(nextJob.appointment.datetime), 'h:mm a')}
                  </span>
                )}
              </div>
              <CardTitle className="text-base mt-2">
                {nextJob.appointment?.service_type || 'Service Call'}
              </CardTitle>
              <CardDescription className="text-white/70">
                {nextJob.appointment?.customer_name}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button 
                className="w-full" 
                onClick={() => navigate('/technician/jobs')}
              >
                View & Accept Job
              </Button>
            </CardContent>
          </Card>
        ) : (
          // No Jobs
          <Card className="border-border/50">
            <CardContent className="flex flex-col items-center justify-center py-10">
              <div className="w-14 h-14 rounded-xl bg-slate-600 flex items-center justify-center mb-3">
                <CheckCircle2 className="h-7 w-7 text-white/70" />
              </div>
              <p className="font-medium">No Active Jobs</p>
              <p className="text-sm text-muted-foreground mt-1">You're all caught up!</p>
            </CardContent>
          </Card>
        )}

        {/* Large Check-In / Action Button */}
        {currentJob && nextAction && (
          <Button
            className={cn(
              "w-full h-14 text-base font-semibold rounded-xl shadow-lg transition-all",
              currentJob.status === 'en_route' || currentJob.status === 'arrived'
                ? "bg-accent hover:bg-accent/90 text-primary shadow-accent/30"
                : currentJob.status === 'in_progress'
                  ? "bg-green-500 hover:bg-green-600 text-white shadow-green-500/30"
                  : "bg-primary hover:bg-primary/90"
            )}
            onClick={() => navigate('/technician/ai-console')}
          >
            <nextAction.icon className="h-5 w-5 mr-3" />
            {nextAction.label}
          </Button>
        )}

        {/* Quick Actions */}
        <div className="grid grid-cols-2 gap-3">
          <Button
            variant="outline"
            className="h-16 flex-col gap-2 border-border/50 hover:border-primary/50"
            onClick={() => navigate('/technician/ai-console')}
          >
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center">
              <Bot className="w-4 h-4 text-white" />
            </div>
            <span className="text-xs font-medium">AI Assistant</span>
          </Button>
          <Button
            variant="outline"
            className="h-16 flex-col gap-2 border-border/50 hover:border-primary/50"
            onClick={() => navigate('/technician/jobs')}
          >
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center">
              <ClipboardList className="w-4 h-4 text-primary-foreground" />
            </div>
            <span className="text-xs font-medium">All Jobs</span>
          </Button>
        </div>

        {/* Today's Progress */}
        <Card className="border-border/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-accent" />
              Today's Progress
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-white/70">Completed</span>
                  <span className="font-semibold">{completedJobs.length}/{jobs?.length || 0}</span>
                </div>
                <div className="w-full h-2 rounded-full bg-slate-600 overflow-hidden">
                  <div 
                    className="h-full rounded-full bg-gradient-to-r from-accent to-accent/60 transition-all duration-500" 
                    style={{ width: jobs?.length ? `${(completedJobs.length / jobs.length) * 100}%` : '0%' }} 
                  />
                </div>
              </div>
              <div className="flex items-center justify-between p-2.5 rounded-lg bg-slate-700/50 border border-slate-600/50">
                <span className="text-sm text-white/80">Status</span>
                <span className="text-sm font-medium text-green-400 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                  On Track
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* View All Jobs Link */}
        <Button 
          variant="ghost" 
          className="w-full justify-between text-white/70"
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
