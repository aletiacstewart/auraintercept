import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useEmployeeJobRole } from '@/hooks/useEmployeeJobRole';
import { RoleDashboardLayout } from '@/components/dashboard/RoleDashboardLayout';
import { BookingAgentConsole } from '@/components/booking/BookingAgentConsole';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Bot, Calendar, Phone, Users } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export default function BookingAgentAIConsole() {
  const { user, loading: authLoading, companyId } = useAuth();
  const { loading: roleLoading } = useEmployeeJobRole();
  const navigate = useNavigate();

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth');
    }
  }, [user, authLoading, navigate]);

  // Fetch quick stats
  const { data: stats } = useQuery({
    queryKey: ['booking-console-stats', companyId],
    queryFn: async () => {
      if (!companyId) return null;
      
      const today = new Date();
      const startOfDay = new Date(today.setHours(0, 0, 0, 0)).toISOString();
      const endOfDay = new Date(today.setHours(23, 59, 59, 999)).toISOString();
      
      const [todayAppts, pending, missedCalls] = await Promise.all([
        supabase
          .from('appointments')
          .select('id', { count: 'exact' })
          .eq('company_id', companyId)
          .gte('datetime', startOfDay)
          .lte('datetime', endOfDay),
        supabase
          .from('appointments')
          .select('id', { count: 'exact' })
          .eq('company_id', companyId)
          .eq('status', 'pending'),
        supabase
          .from('call_logs')
          .select('id', { count: 'exact' })
          .eq('company_id', companyId)
          .eq('status', 'missed')
          .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()),
      ]);
      
      return {
        todayCount: todayAppts.count || 0,
        pendingCount: pending.count || 0,
        missedCalls: missedCalls.count || 0,
      };
    },
    enabled: !!companyId,
    refetchInterval: 30000,
  });

  if (authLoading || roleLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Skeleton className="h-32 w-64" />
      </div>
    );
  }

  return (
    <RoleDashboardLayout jobRole="booking_agent">
      <div className="space-y-6 animate-fade-in">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
              <Bot className="w-8 h-8 text-primary" />
              Booking AI Console
            </h1>
            <p className="text-muted-foreground mt-1">
              AI-powered appointment scheduling and customer engagement
            </p>
          </div>
          <div className="flex items-center gap-3">
            {stats && (
              <>
                <Badge variant="outline" className="flex items-center gap-1">
                  <Calendar className="w-3 h-3" />
                  {stats.todayCount} Today
                </Badge>
                <Badge variant="secondary" className="flex items-center gap-1">
                  <Users className="w-3 h-3" />
                  {stats.pendingCount} Pending
                </Badge>
                {stats.missedCalls > 0 && (
                  <Badge variant="destructive" className="flex items-center gap-1">
                    <Phone className="w-3 h-3" />
                    {stats.missedCalls} Missed
                  </Badge>
                )}
              </>
            )}
          </div>
        </div>

        {/* Main Content */}
        <Tabs defaultValue="console" className="space-y-4">
          <TabsList className="grid w-full grid-cols-2 max-w-md">
            <TabsTrigger value="console" className="flex items-center gap-2">
              <Bot className="w-4 h-4" />
              AI Console
            </TabsTrigger>
            <TabsTrigger value="agents" className="flex items-center gap-2">
              <Users className="w-4 h-4" />
              Active Agents
            </TabsTrigger>
          </TabsList>

          <TabsContent value="console" className="space-y-4">
            <Card className="border-border/50">
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2">
                  <Bot className="w-5 h-5 text-primary" />
                  Booking AI Assistant
                </CardTitle>
                <p className="text-sm text-muted-foreground">
                  Schedule appointments, manage bookings, follow up with customers, and request reviews
                </p>
              </CardHeader>
              <CardContent className="p-0">
                <BookingAgentConsole 
                  companyId={companyId || undefined}
                  className="h-[600px]"
                />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="agents" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <AgentInfoCard
                name="Triage Agent"
                description="Routes customer inquiries to the appropriate specialist"
                color="bg-blue-500"
                capabilities={['Classify requests', 'Collect customer info', 'Route to specialists']}
              />
              <AgentInfoCard
                name="Booking Agent"
                description="Handles appointment scheduling and management"
                color="bg-green-500"
                capabilities={['Schedule appointments', 'Check availability', 'Send confirmations']}
              />
              <AgentInfoCard
                name="Follow-up Agent"
                description="Manages post-service customer communications"
                color="bg-orange-500"
                capabilities={['Service follow-ups', 'Satisfaction checks', 'Issue resolution']}
              />
              <AgentInfoCard
                name="Review Agent"
                description="Requests and manages customer reviews"
                color="bg-purple-500"
                capabilities={['Request reviews', 'Send review links', 'Track feedback']}
              />
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </RoleDashboardLayout>
  );
}

function AgentInfoCard({ 
  name, 
  description, 
  color, 
  capabilities 
}: { 
  name: string; 
  description: string; 
  color: string; 
  capabilities: string[];
}) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center gap-2">
          <div className={`w-3 h-3 rounded-full ${color}`} />
          <CardTitle className="text-lg">{name}</CardTitle>
        </div>
        <p className="text-sm text-muted-foreground">{description}</p>
      </CardHeader>
      <CardContent>
        <ul className="text-sm space-y-1">
          {capabilities.map((cap, i) => (
            <li key={i} className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-primary" />
              {cap}
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}
