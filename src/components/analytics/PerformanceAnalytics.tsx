import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { 
  Bot, 
  Clock, 
  CheckCircle2, 
  AlertTriangle,
  Download,
  Activity,
  Zap,
  MessageSquare
} from 'lucide-react';
import { 
  BarChart, 
  Bar,
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar
} from 'recharts';
import { format, subDays } from 'date-fns';

interface PerformanceAnalyticsProps {
  companyId: string;
}

export function PerformanceAnalytics({ companyId }: PerformanceAnalyticsProps) {
  // Fetch agent performance stats
  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ['performance-analytics-stats', companyId],
    queryFn: async () => {
      const thirtyDaysAgo = subDays(new Date(), 30);
      
      const [agentLogs, agentEvents] = await Promise.all([
        supabase
          .from('ai_agent_logs')
          .select('agent_type, action, success, duration_ms, created_at')
          .eq('company_id', companyId)
          .gte('created_at', thirtyDaysAgo.toISOString()),
        supabase
          .from('ai_agent_events')
          .select('source_agent, event_type, status, created_at, requires_human_review')
          .eq('company_id', companyId)
          .gte('created_at', thirtyDaysAgo.toISOString()),
      ]);

      const totalRequests = agentLogs.data?.length ?? 0;
      const successfulRequests = agentLogs.data?.filter(l => l.success).length ?? 0;
      const successRate = totalRequests > 0 ? (successfulRequests / totalRequests) * 100 : 0;

      const avgResponseTime = totalRequests > 0
        ? (agentLogs.data?.reduce((sum, l) => sum + (l.duration_ms || 0), 0) ?? 0) / totalRequests
        : 0;

      const humanEscalations = agentEvents.data?.filter(e => e.requires_human_review).length ?? 0;
      const escalationRate = totalRequests > 0 ? (humanEscalations / totalRequests) * 100 : 0;

      const processedEvents = agentEvents.data?.filter(e => e.status === 'processed').length ?? 0;
      const failedEvents = agentEvents.data?.filter(e => e.status === 'failed').length ?? 0;

      return {
        totalRequests,
        successRate,
        avgResponseTime,
        humanEscalations,
        escalationRate,
        processedEvents,
        failedEvents,
      };
    },
    enabled: !!companyId,
  });

  // Fetch performance by agent type
  const { data: agentPerformance, isLoading: chartLoading } = useQuery({
    queryKey: ['performance-analytics-by-agent', companyId],
    queryFn: async () => {
      const thirtyDaysAgo = subDays(new Date(), 30);
      
      const { data } = await supabase
        .from('ai_agent_logs')
        .select('agent_type, success, duration_ms')
        .eq('company_id', companyId)
        .gte('created_at', thirtyDaysAgo.toISOString());

      const byAgent = new Map<string, { total: number; success: number; totalTime: number }>();
      
      data?.forEach(log => {
        const agent = log.agent_type || 'unknown';
        const existing = byAgent.get(agent) || { total: 0, success: 0, totalTime: 0 };
        existing.total++;
        if (log.success) existing.success++;
        existing.totalTime += log.duration_ms || 0;
        byAgent.set(agent, existing);
      });

      return Array.from(byAgent.entries())
        .map(([agent, stats]) => ({
          agent: agent.charAt(0).toUpperCase() + agent.slice(1).replace('_', ' '),
          requests: stats.total,
          successRate: stats.total > 0 ? Math.round((stats.success / stats.total) * 100) : 0,
          avgTime: stats.total > 0 ? Math.round(stats.totalTime / stats.total) : 0,
        }))
        .sort((a, b) => b.requests - a.requests)
        .slice(0, 8);
    },
    enabled: !!companyId,
  });

  // Fetch daily request volume
  const { data: dailyVolume } = useQuery({
    queryKey: ['performance-analytics-daily', companyId],
    queryFn: async () => {
      const fourteenDaysAgo = subDays(new Date(), 14);
      
      const { data } = await supabase
        .from('ai_agent_logs')
        .select('created_at, success')
        .eq('company_id', companyId)
        .gte('created_at', fourteenDaysAgo.toISOString());

      const byDay = new Map<string, { total: number; success: number }>();
      
      for (let i = 0; i < 14; i++) {
        const date = format(subDays(new Date(), 13 - i), 'MMM dd');
        byDay.set(date, { total: 0, success: 0 });
      }

      data?.forEach(log => {
        const date = format(new Date(log.created_at!), 'MMM dd');
        if (byDay.has(date)) {
          const existing = byDay.get(date)!;
          existing.total++;
          if (log.success) existing.success++;
        }
      });

      return Array.from(byDay.entries()).map(([date, stats]) => ({
        date,
        total: stats.total,
        success: stats.success,
        failed: stats.total - stats.success,
      }));
    },
    enabled: !!companyId,
  });

  // Export function
  const handleExport = async () => {
    const thirtyDaysAgo = subDays(new Date(), 30);
    const { data } = await supabase
      .from('ai_agent_logs')
      .select('agent_type, action, success, duration_ms, created_at, error_message')
      .eq('company_id', companyId)
      .gte('created_at', thirtyDaysAgo.toISOString())
      .order('created_at', { ascending: false });

    if (!data) return;

    const csv = [
      ['Agent', 'Action', 'Success', 'Duration (ms)', 'Timestamp', 'Error'],
      ...data.map(l => [
        l.agent_type || 'N/A',
        l.action,
        l.success ? 'Yes' : 'No',
        l.duration_ms?.toString() || '0',
        l.created_at ? format(new Date(l.created_at), 'yyyy-MM-dd HH:mm:ss') : 'N/A',
        l.error_message || '',
      ])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `agent-performance-${format(new Date(), 'yyyy-MM-dd')}.csv`;
    a.click();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">AI Agent Performance</h3>
          <p className="text-sm text-muted-foreground">Monitor response times, success rates, and agent activity</p>
        </div>
        <Button onClick={handleExport} variant="outline" size="sm">
          <Download className="h-4 w-4 mr-2" />
          Export CSV
        </Button>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="border-border/50">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Requests</CardTitle>
            <Bot className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {statsLoading ? (
              <Skeleton className="h-8 w-24" />
            ) : (
              <>
                <div className="text-2xl font-bold">
                  {(stats?.totalRequests ?? 0).toLocaleString()}
                </div>
                <p className="text-xs text-muted-foreground">Last 30 days</p>
              </>
            )}
          </CardContent>
        </Card>

        <Card className="border-border/50">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Success Rate</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {statsLoading ? (
              <Skeleton className="h-8 w-24" />
            ) : (
              <>
                <div className="text-2xl font-bold text-green-500">
                  {(stats?.successRate ?? 0).toFixed(1)}%
                </div>
                <p className="text-xs text-muted-foreground">Successful completions</p>
              </>
            )}
          </CardContent>
        </Card>

        <Card className="border-border/50">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Avg Response Time</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {statsLoading ? (
              <Skeleton className="h-8 w-24" />
            ) : (
              <>
                <div className="text-2xl font-bold">
                  {(stats?.avgResponseTime ?? 0).toFixed(0)}ms
                </div>
                <p className="text-xs text-muted-foreground">Per request</p>
              </>
            )}
          </CardContent>
        </Card>

        <Card className="border-border/50">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Human Escalations</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {statsLoading ? (
              <Skeleton className="h-8 w-24" />
            ) : (
              <>
                <div className="text-2xl font-bold text-amber-500">
                  {stats?.humanEscalations ?? 0}
                </div>
                <p className="text-xs text-muted-foreground">
                  {(stats?.escalationRate ?? 0).toFixed(1)}% escalation rate
                </p>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card className="border-border/50">
          <CardHeader>
            <CardTitle>Daily Request Volume</CardTitle>
            <CardDescription>Agent activity over the last 14 days</CardDescription>
          </CardHeader>
          <CardContent>
            {chartLoading ? (
              <Skeleton className="h-[300px]" />
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={dailyVolume}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="date" className="text-xs" />
                  <YAxis className="text-xs" />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--card))', 
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px'
                    }}
                  />
                  <Bar dataKey="success" stackId="a" fill="hsl(var(--primary))" name="Success" />
                  <Bar dataKey="failed" stackId="a" fill="hsl(var(--destructive))" name="Failed" />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        <Card className="border-border/50">
          <CardHeader>
            <CardTitle>Agent Performance Matrix</CardTitle>
            <CardDescription>Success rates by agent type</CardDescription>
          </CardHeader>
          <CardContent>
            {agentPerformance && agentPerformance.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <RadarChart data={agentPerformance}>
                  <PolarGrid />
                  <PolarAngleAxis dataKey="agent" className="text-xs" />
                  <PolarRadiusAxis angle={30} domain={[0, 100]} />
                  <Radar
                    name="Success Rate"
                    dataKey="successRate"
                    stroke="hsl(var(--primary))"
                    fill="hsl(var(--primary))"
                    fillOpacity={0.3}
                  />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--card))', 
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px'
                    }}
                  />
                </RadarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                No agent performance data
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Agent Details Table */}
      <Card className="border-border/50">
        <CardHeader>
          <CardTitle>Agent Performance Details</CardTitle>
          <CardDescription>Breakdown by agent type</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-3 px-4 font-medium">Agent</th>
                  <th className="text-right py-3 px-4 font-medium">Requests</th>
                  <th className="text-right py-3 px-4 font-medium">Success Rate</th>
                  <th className="text-right py-3 px-4 font-medium">Avg Response</th>
                </tr>
              </thead>
              <tbody>
                {agentPerformance?.map((agent) => (
                  <tr key={agent.agent} className="border-b border-border/50">
                    <td className="py-3 px-4 flex items-center gap-2">
                      <Bot className="h-4 w-4 text-muted-foreground" />
                      {agent.agent}
                    </td>
                    <td className="text-right py-3 px-4">{agent.requests}</td>
                    <td className="text-right py-3 px-4">
                      <span className={agent.successRate >= 90 ? 'text-green-500' : agent.successRate >= 70 ? 'text-amber-500' : 'text-red-500'}>
                        {agent.successRate}%
                      </span>
                    </td>
                    <td className="text-right py-3 px-4">{agent.avgTime}ms</td>
                  </tr>
                ))}
                {(!agentPerformance || agentPerformance.length === 0) && (
                  <tr>
                    <td colSpan={4} className="py-8 text-center text-muted-foreground">
                      No agent activity recorded
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
