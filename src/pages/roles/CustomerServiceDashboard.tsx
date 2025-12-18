import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { RoleDashboardLayout } from '@/components/dashboard/RoleDashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Inbox, Phone, MessageSquare, Calendar, Star, Bot } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export default function CustomerServiceDashboard() {
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
    queryKey: ['customer-service-stats', companyId],
    queryFn: async () => {
      if (!companyId) return null;
      
      const [calls, feedback, avgRating] = await Promise.all([
        supabase
          .from('call_logs')
          .select('id', { count: 'exact' })
          .eq('company_id', companyId)
          .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()),
        supabase
          .from('customer_feedback')
          .select('id', { count: 'exact' })
          .eq('company_id', companyId)
          .gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()),
        supabase
          .from('customer_feedback')
          .select('rating')
          .eq('company_id', companyId)
          .not('rating', 'is', null)
          .gte('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()),
      ]);
      
      const ratings = avgRating.data?.map(f => f.rating).filter(Boolean) || [];
      const averageRating = ratings.length > 0 
        ? (ratings.reduce((a, b) => a + b, 0) / ratings.length).toFixed(1)
        : 0;
      
      return {
        todayCalls: calls.count || 0,
        weeklyFeedback: feedback.count || 0,
        averageRating,
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
    <RoleDashboardLayout jobRole="customer_service">
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
                Welcome, {profile?.full_name || 'Support Agent'}
              </h1>
              <p className="text-muted-foreground mt-1">
                {profile?.companies?.name || 'Customer Service Dashboard'}
              </p>
            </>
          )}
        </div>

        {/* Quick Stats */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
          <Card className="border-border/50">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Today's Calls
              </CardTitle>
              <Phone className="w-5 h-5 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{stats?.todayCalls ?? 0}</div>
              <p className="text-xs text-muted-foreground mt-1">Handled today</p>
            </CardContent>
          </Card>

          <Card className="border-border/50">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Weekly Feedback
              </CardTitle>
              <Inbox className="w-5 h-5 text-secondary" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{stats?.weeklyFeedback ?? 0}</div>
              <p className="text-xs text-muted-foreground mt-1">Received this week</p>
            </CardContent>
          </Card>

          <Card className="border-border/50">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Avg. Rating
              </CardTitle>
              <Star className="w-5 h-5 text-yellow-500" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-yellow-600">{stats?.averageRating ?? 0}</div>
              <p className="text-xs text-muted-foreground mt-1">Out of 5 stars</p>
            </CardContent>
          </Card>

          <Card className="border-border/50">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Calls
              </CardTitle>
              <MessageSquare className="w-5 h-5 text-accent" />
            </CardHeader>
            <CardContent>
              <Button size="sm" className="w-full" onClick={() => navigate('/dashboard/calls')}>
                View History
              </Button>
            </CardContent>
          </Card>

          <Card className="border-border/50">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Appointments
              </CardTitle>
              <Calendar className="w-5 h-5 text-primary" />
            </CardHeader>
            <CardContent>
              <Button size="sm" className="w-full" onClick={() => navigate('/dashboard/appointments')}>
                Manage
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Support AI Console Card */}
        <Card className="border-border/50">
          <CardHeader>
            <CardTitle>Support AI Console</CardTitle>
            <p className="text-sm text-muted-foreground">Use AI to handle customer inquiries, schedule appointments, and manage follow-ups</p>
          </CardHeader>
          <CardContent>
            <Button onClick={() => navigate('/dashboard/ai-agent')}>
              Open AI Console
            </Button>
          </CardContent>
        </Card>

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
            onClick={() => navigate('/dashboard/calls')}
          >
            <Phone className="w-6 h-6 text-secondary" />
            <span>Call History</span>
          </Button>
          <Button
            variant="outline"
            className="h-auto py-6 flex flex-col items-center gap-2"
            onClick={() => navigate('/dashboard/appointments')}
          >
            <Calendar className="w-6 h-6 text-accent" />
            <span>Appointments</span>
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
            <Inbox className="w-6 h-6 text-secondary" />
            <span>AI Agents Hub</span>
          </Button>
        </div>
      </div>
    </RoleDashboardLayout>
  );
}