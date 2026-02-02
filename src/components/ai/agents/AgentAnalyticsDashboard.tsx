import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  Activity, 
  TrendingUp, 
  Clock, 
  ArrowRightLeft, 
  CheckCircle2, 
  AlertCircle,
  BarChart3,
  Zap
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from 'recharts';
import { format, subDays, startOfDay, endOfDay } from 'date-fns';

interface AgentStats {
  agentType: string;
  totalEvents: number;
  successCount: number;
  failedCount: number;
  avgResponseTimeMs: number;
}

interface DailyMetric {
  date: string;
  events: number;
  successes: number;
  failures: number;
}

interface AgentAnalyticsDashboardProps {
  companyId: string;
}

const AGENT_DISPLAY_NAMES: Record<string, string> = {
  triage: 'AI Receptionist',
  booking: 'Scheduling Agent',
  followup: 'Follow-up Agent',
  review: 'Review Agent',
  dispatch: 'Dispatch Agent',
  route: 'Route Agent',
  eta: 'ETA Agent',
  checkin: 'Check-in Agent',
  quoting: 'Quoting Agent',
  invoice: 'Invoice Agent',
  inventory: 'Inventory Agent',
  campaign: 'Campaign Agent',
  lead: 'Lead Agent',
  marketing: 'Marketing Agent',
  social_content: 'Social Media Signal Agent',
  social_scheduler: 'Social Media Signal Scheduler',
  social_analytics: 'Social Media Signal Analytics',
  insights: 'Insights Agent',
  performance: 'Performance Agent',
  revenue: 'Revenue Agent',
  forecast: 'Forecast Agent',
};

const CHART_COLORS = {
  primary: 'hsl(var(--primary))',
  secondary: 'hsl(var(--secondary))',
  success: '#10b981',
  warning: '#f59e0b',
  error: '#ef4444',
  muted: 'hsl(var(--muted-foreground))',
};

export function AgentAnalyticsDashboard({ companyId }: AgentAnalyticsDashboardProps) {
  const [loading, setLoading] = useState(true);
  const [agentStats, setAgentStats] = useState<AgentStats[]>([]);
  const [dailyMetrics, setDailyMetrics] = useState<DailyMetric[]>([]);
  const [totalStats, setTotalStats] = useState({
    totalRequests: 0,
    successRate: 0,
    avgResponseTime: 0,
    totalHandoffs: 0,
  });

  useEffect(() => {
    fetchAnalytics();
  }, [companyId]);

  const fetchAnalytics = async () => {
    setLoading(true);
    
    try {
      // Fetch last 7 days of events
      const sevenDaysAgo = subDays(new Date(), 7);
      
      const { data: events, error } = await supabase
        .from('ai_agent_events')
        .select('*')
        .eq('company_id', companyId)
        .gte('created_at', sevenDaysAgo.toISOString())
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Process agent stats
      const agentMap = new Map<string, AgentStats>();
      const dailyMap = new Map<string, DailyMetric>();
      let totalHandoffs = 0;

      events?.forEach(event => {
        // Agent stats
        const agentType = event.source_agent;
        if (!agentMap.has(agentType)) {
          agentMap.set(agentType, {
            agentType,
            totalEvents: 0,
            successCount: 0,
            failedCount: 0,
            avgResponseTimeMs: 0,
          });
        }
        const stats = agentMap.get(agentType)!;
        stats.totalEvents++;
        if (event.status === 'processed') stats.successCount++;
        if (event.status === 'failed') stats.failedCount++;

        // Daily metrics
        const dateKey = format(new Date(event.created_at), 'MMM dd');
        if (!dailyMap.has(dateKey)) {
          dailyMap.set(dateKey, { date: dateKey, events: 0, successes: 0, failures: 0 });
        }
        const daily = dailyMap.get(dateKey)!;
        daily.events++;
        if (event.status === 'processed') daily.successes++;
        if (event.status === 'failed') daily.failures++;

        // Count handoffs
        if (event.target_agent) totalHandoffs++;
      });

      const statsArray = Array.from(agentMap.values())
        .sort((a, b) => b.totalEvents - a.totalEvents);

      const dailyArray = Array.from(dailyMap.values())
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

      // Calculate totals
      const totalRequests = statsArray.reduce((sum, s) => sum + s.totalEvents, 0);
      const totalSuccesses = statsArray.reduce((sum, s) => sum + s.successCount, 0);
      const successRate = totalRequests > 0 ? (totalSuccesses / totalRequests) * 100 : 0;

      setAgentStats(statsArray);
      setDailyMetrics(dailyArray);
      setTotalStats({
        totalRequests,
        successRate,
        avgResponseTime: 1.2, // Placeholder - would need actual timing data
        totalHandoffs,
      });
    } catch (err) {
      console.error('Error fetching analytics:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => (
            <Skeleton key={i} className="h-24" />
          ))}
        </div>
        <Skeleton className="h-[300px]" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <Activity className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{totalStats.totalRequests.toLocaleString()}</p>
                <p className="text-xs text-muted-foreground">Total Requests (7d)</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-emerald-500/10">
                <CheckCircle2 className="h-5 w-5 text-emerald-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{totalStats.successRate.toFixed(1)}%</p>
                <p className="text-xs text-muted-foreground">Success Rate</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-amber-500/10">
                <Clock className="h-5 w-5 text-amber-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{totalStats.avgResponseTime}s</p>
                <p className="text-xs text-muted-foreground">Avg Response</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-violet-500/10">
                <ArrowRightLeft className="h-5 w-5 text-violet-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{totalStats.totalHandoffs}</p>
                <p className="text-xs text-muted-foreground">Handoffs</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <Tabs defaultValue="activity">
        <TabsList>
          <TabsTrigger value="activity">Activity Trends</TabsTrigger>
          <TabsTrigger value="agents">Top Operatives</TabsTrigger>
        </TabsList>

        <TabsContent value="activity" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <TrendingUp className="h-4 w-4" />
                Request Volume (Last 7 Days)
              </CardTitle>
            </CardHeader>
            <CardContent>
              {dailyMetrics.length > 0 ? (
                <ResponsiveContainer width="100%" height={250}>
                  <LineChart data={dailyMetrics}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                    <XAxis dataKey="date" className="text-xs fill-muted-foreground" />
                    <YAxis className="text-xs fill-muted-foreground" />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'hsl(var(--card))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px'
                      }}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="events" 
                      stroke={CHART_COLORS.primary} 
                      strokeWidth={2}
                      dot={{ fill: CHART_COLORS.primary }}
                      name="Total Events"
                    />
                    <Line 
                      type="monotone" 
                      dataKey="successes" 
                      stroke={CHART_COLORS.success} 
                      strokeWidth={2}
                      dot={{ fill: CHART_COLORS.success }}
                      name="Successes"
                    />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-[250px] flex items-center justify-center text-muted-foreground">
                  <div className="text-center">
                    <BarChart3 className="h-8 w-8 mx-auto mb-2" />
                    <p>No data available yet</p>
                    <p className="text-sm">Events will appear here as operatives process requests</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="agents" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Zap className="h-4 w-4" />
                Most Active Operatives
              </CardTitle>
            </CardHeader>
            <CardContent>
              {agentStats.length > 0 ? (
                <div className="space-y-3">
                  {agentStats.slice(0, 5).map((agent, index) => (
                    <div key={agent.agentType} className="flex items-center gap-4">
                      <span className="text-lg font-bold text-muted-foreground w-6">{index + 1}</span>
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-medium">
                            {AGENT_DISPLAY_NAMES[agent.agentType] || agent.agentType}
                          </span>
                          <span className="text-sm text-muted-foreground">{agent.totalEvents} events</span>
                        </div>
                        <div className="h-2 bg-muted rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-primary rounded-full"
                            style={{ 
                              width: `${(agent.totalEvents / agentStats[0].totalEvents) * 100}%` 
                            }}
                          />
                        </div>
                      </div>
                      <Badge 
                        variant={agent.failedCount > 0 ? 'destructive' : 'default'}
                        className="text-xs"
                      >
                        {((agent.successCount / agent.totalEvents) * 100).toFixed(0)}% success
                      </Badge>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="h-[200px] flex items-center justify-center text-muted-foreground">
                  <div className="text-center">
                    <Zap className="h-8 w-8 mx-auto mb-2" />
                    <p>No operative activity yet</p>
                    <p className="text-sm">Enable operatives to see analytics</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}