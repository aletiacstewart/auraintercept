import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Sparkles, 
  Send, 
  TrendingUp, 
  TrendingDown,
  Users,
  Calendar,
  DollarSign,
  MessageSquare,
  Lightbulb,
  RefreshCw
} from 'lucide-react';
import { format, subDays, subMonths } from 'date-fns';

interface InsightsAnalyticsProps {
  companyId: string;
}

interface InsightCard {
  title: string;
  value: string;
  change?: number;
  icon: React.ElementType;
  description: string;
}

export function InsightsAnalytics({ companyId }: InsightsAnalyticsProps) {
  const [query, setQuery] = useState('');
  const [conversationHistory, setConversationHistory] = useState<{ role: 'user' | 'assistant'; content: string }[]>([]);

  // Fetch quick insights
  const { data: insights, isLoading, refetch } = useQuery({
    queryKey: ['insights-analytics', companyId],
    queryFn: async () => {
      const now = new Date();
      const thirtyDaysAgo = subDays(now, 30);
      const sixtyDaysAgo = subDays(now, 60);

      const [
        currentAppointments,
        previousAppointments,
        currentRevenue,
        previousRevenue,
        customers,
        feedback
      ] = await Promise.all([
        supabase
          .from('appointments')
          .select('id, status')
          .eq('company_id', companyId)
          .gte('datetime', thirtyDaysAgo.toISOString()),
        supabase
          .from('appointments')
          .select('id')
          .eq('company_id', companyId)
          .gte('datetime', sixtyDaysAgo.toISOString())
          .lt('datetime', thirtyDaysAgo.toISOString()),
        supabase
          .from('invoices')
          .select('total')
          .eq('company_id', companyId)
          .eq('status', 'paid')
          .gte('paid_at', thirtyDaysAgo.toISOString()),
        supabase
          .from('invoices')
          .select('total')
          .eq('company_id', companyId)
          .eq('status', 'paid')
          .gte('paid_at', sixtyDaysAgo.toISOString())
          .lt('paid_at', thirtyDaysAgo.toISOString()),
        supabase
          .from('customer_profiles')
          .select('id')
          .eq('company_id', companyId),
        supabase
          .from('customer_feedback')
          .select('rating, sentiment')
          .eq('company_id', companyId)
          .gte('created_at', thirtyDaysAgo.toISOString()),
      ]);

      const currentAptCount = currentAppointments.data?.length ?? 0;
      const previousAptCount = previousAppointments.data?.length ?? 0;
      const aptChange = previousAptCount > 0 
        ? ((currentAptCount - previousAptCount) / previousAptCount) * 100 
        : 0;

      const currentRevenueTotal = currentRevenue.data?.reduce((sum, i) => sum + (i.total || 0), 0) ?? 0;
      const previousRevenueTotal = previousRevenue.data?.reduce((sum, i) => sum + (i.total || 0), 0) ?? 0;
      const revenueChange = previousRevenueTotal > 0 
        ? ((currentRevenueTotal - previousRevenueTotal) / previousRevenueTotal) * 100 
        : 0;

      const completionRate = currentAptCount > 0
        ? (currentAppointments.data?.filter(a => a.status === 'completed').length ?? 0) / currentAptCount * 100
        : 0;

      const avgRating = feedback.data && feedback.data.length > 0
        ? feedback.data.reduce((sum, f) => sum + (f.rating || 0), 0) / feedback.data.length
        : 0;

      const positiveRatio = feedback.data && feedback.data.length > 0
        ? (feedback.data.filter(f => f.sentiment === 'positive').length / feedback.data.length) * 100
        : 0;

      // Generate AI insights based on data
      const aiInsights: string[] = [];
      
      if (aptChange > 10) {
        aiInsights.push(`📈 Appointments are up ${aptChange.toFixed(0)}% compared to last month. Great momentum!`);
      } else if (aptChange < -10) {
        aiInsights.push(`📉 Appointments are down ${Math.abs(aptChange).toFixed(0)}%. Consider running a promotional campaign.`);
      }

      if (revenueChange > 15) {
        aiInsights.push(`💰 Revenue growth of ${revenueChange.toFixed(0)}% shows strong business performance.`);
      }

      if (completionRate < 70) {
        aiInsights.push(`⚠️ Completion rate is ${completionRate.toFixed(0)}%. Review cancellation reasons to improve.`);
      }

      if (avgRating >= 4.5) {
        aiInsights.push(`⭐ Excellent customer satisfaction with ${avgRating.toFixed(1)} average rating!`);
      } else if (avgRating > 0 && avgRating < 3.5) {
        aiInsights.push(`📊 Customer ratings averaging ${avgRating.toFixed(1)}. Focus on service quality improvements.`);
      }

      if (positiveRatio > 80) {
        aiInsights.push(`😊 ${positiveRatio.toFixed(0)}% positive feedback - customers love your service!`);
      }

      return {
        cards: [
          {
            title: 'Appointments',
            value: currentAptCount.toString(),
            change: aptChange,
            icon: Calendar,
            description: 'Last 30 days',
          },
          {
            title: 'Revenue',
            value: `$${currentRevenueTotal.toLocaleString()}`,
            change: revenueChange,
            icon: DollarSign,
            description: 'Collected',
          },
          {
            title: 'Customers',
            value: (customers.data?.length ?? 0).toString(),
            change: undefined,
            icon: Users,
            description: 'Total profiles',
          },
          {
            title: 'Satisfaction',
            value: avgRating > 0 ? `${avgRating.toFixed(1)}/5` : 'N/A',
            change: undefined,
            icon: Sparkles,
            description: 'Avg rating',
          },
        ] as InsightCard[],
        aiInsights,
        completionRate,
        positiveRatio,
      };
    },
    enabled: !!companyId,
  });

  // Natural language query mutation
  const queryMutation = useMutation({
    mutationFn: async (userQuery: string) => {
      // In a real implementation, this would call an AI endpoint
      // For now, we'll provide pattern-matched responses
      const lowerQuery = userQuery.toLowerCase();
      
      let response = '';
      
      if (lowerQuery.includes('revenue') || lowerQuery.includes('money') || lowerQuery.includes('earned')) {
        const { data } = await supabase
          .from('invoices')
          .select('total')
          .eq('company_id', companyId)
          .eq('status', 'paid');
        
        const total = data?.reduce((sum, i) => sum + (i.total || 0), 0) ?? 0;
        response = `Your total collected revenue is $${total.toLocaleString()}. This includes all paid invoices on record.`;
      } else if (lowerQuery.includes('appointment') || lowerQuery.includes('booking')) {
        const { data } = await supabase
          .from('appointments')
          .select('id, status')
          .eq('company_id', companyId);
        
        const total = data?.length ?? 0;
        const completed = data?.filter(a => a.status === 'completed').length ?? 0;
        response = `You have ${total} total appointments on record. ${completed} have been completed (${total > 0 ? ((completed / total) * 100).toFixed(0) : 0}% completion rate).`;
      } else if (lowerQuery.includes('customer') || lowerQuery.includes('client')) {
        const { data } = await supabase
          .from('customer_profiles')
          .select('id')
          .eq('company_id', companyId);
        
        response = `You have ${data?.length ?? 0} customer profiles in your database.`;
      } else if (lowerQuery.includes('best') || lowerQuery.includes('top') || lowerQuery.includes('popular')) {
        const { data } = await supabase
          .from('appointments')
          .select('service_type')
          .eq('company_id', companyId)
          .eq('status', 'completed');
        
        const serviceCounts = new Map<string, number>();
        data?.forEach(apt => {
          const service = apt.service_type || 'Other';
          serviceCounts.set(service, (serviceCounts.get(service) || 0) + 1);
        });
        
        const sorted = Array.from(serviceCounts.entries()).sort((a, b) => b[1] - a[1]);
        if (sorted.length > 0) {
          response = `Your top services are: ${sorted.slice(0, 3).map(([name, count]) => `${name} (${count} bookings)`).join(', ')}.`;
        } else {
          response = `No service data available yet. Complete some appointments to see your top services.`;
        }
      } else {
        response = `I can help you understand your business data. Try asking about:
• Revenue and earnings
• Appointment statistics
• Customer count
• Top performing services`;
      }
      
      return response;
    },
    onSuccess: (response) => {
      setConversationHistory(prev => [
        ...prev,
        { role: 'user', content: query },
        { role: 'assistant', content: response },
      ]);
      setQuery('');
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      queryMutation.mutate(query);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Business Insights</h3>
          <p className="text-sm text-muted-foreground">AI-powered analytics and natural language queries</p>
        </div>
        <Button onClick={() => refetch()} variant="outline" size="sm">
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Quick Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {isLoading ? (
          Array(4).fill(0).map((_, i) => (
            <Card key={i} className="border-border/50">
              <CardHeader className="pb-2">
                <Skeleton className="h-4 w-20" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-24" />
              </CardContent>
            </Card>
          ))
        ) : (
          insights?.cards.map((card) => (
            <Card key={card.title} className="border-border/50">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">{card.title}</CardTitle>
                <card.icon className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{card.value}</div>
                {card.change !== undefined && (
                  <div className={`flex items-center text-xs ${card.change >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                    {card.change >= 0 ? <TrendingUp className="h-3 w-3 mr-1" /> : <TrendingDown className="h-3 w-3 mr-1" />}
                    {Math.abs(card.change).toFixed(1)}% vs last period
                  </div>
                )}
                <p className="text-xs text-muted-foreground mt-1">{card.description}</p>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {/* AI Insights */}
        <Card className="border-border/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Lightbulb className="h-5 w-5 text-amber-500" />
              AI Insights
            </CardTitle>
            <CardDescription>Automated observations from your data</CardDescription>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[250px]">
              {isLoading ? (
                <div className="space-y-3">
                  {Array(3).fill(0).map((_, i) => (
                    <Skeleton key={i} className="h-16 w-full" />
                  ))}
                </div>
              ) : insights?.aiInsights && insights.aiInsights.length > 0 ? (
                <div className="space-y-3">
                  {insights.aiInsights.map((insight, index) => (
                    <div 
                      key={index} 
                      className="p-3 rounded-lg bg-muted/50 border border-border/50"
                    >
                      <p className="text-sm">{insight}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="h-full flex items-center justify-center text-muted-foreground">
                  <div className="text-center">
                    <Sparkles className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p>No insights available yet</p>
                    <p className="text-xs">Generate more data to see AI insights</p>
                  </div>
                </div>
              )}
            </ScrollArea>
          </CardContent>
        </Card>

        {/* Natural Language Query */}
        <Card className="border-border/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5 text-primary" />
              Ask About Your Business
            </CardTitle>
            <CardDescription>Query your data in natural language</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <ScrollArea className="h-[180px] pr-4">
              {conversationHistory.length > 0 ? (
                <div className="space-y-3">
                  {conversationHistory.map((msg, index) => (
                    <div 
                      key={index} 
                      className={`p-3 rounded-lg ${
                        msg.role === 'user' 
                          ? 'bg-primary/10 ml-8' 
                          : 'bg-muted/50 mr-8'
                      }`}
                    >
                      <p className="text-sm">{msg.content}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="h-full flex items-center justify-center text-muted-foreground">
                  <div className="text-center">
                    <MessageSquare className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">Ask a question about your business</p>
                    <p className="text-xs mt-1">Try: "How much revenue did I make?"</p>
                  </div>
                </div>
              )}
            </ScrollArea>
            
            <form onSubmit={handleSubmit} className="flex gap-2">
              <Input 
                placeholder="Ask about revenue, appointments, customers..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                disabled={queryMutation.isPending}
              />
              <Button type="submit" size="icon" disabled={queryMutation.isPending || !query.trim()}>
                <Send className="h-4 w-4" />
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>

      {/* Performance Summary */}
      <Card className="border-border/50">
        <CardHeader>
          <CardTitle>Quick Performance Summary</CardTitle>
          <CardDescription>Key metrics at a glance</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="p-4 rounded-lg bg-muted/50 border border-border/50">
              <div className="text-sm text-muted-foreground mb-1">Completion Rate</div>
              <div className="text-2xl font-bold">{(insights?.completionRate ?? 0).toFixed(0)}%</div>
              <div className="mt-2 h-2 rounded-full bg-muted overflow-hidden">
                <div 
                  className="h-full bg-primary transition-all" 
                  style={{ width: `${insights?.completionRate ?? 0}%` }}
                />
              </div>
            </div>
            <div className="p-4 rounded-lg bg-muted/50 border border-border/50">
              <div className="text-sm text-muted-foreground mb-1">Positive Feedback</div>
              <div className="text-2xl font-bold">{(insights?.positiveRatio ?? 0).toFixed(0)}%</div>
              <div className="mt-2 h-2 rounded-full bg-muted overflow-hidden">
                <div 
                  className="h-full bg-green-500 transition-all" 
                  style={{ width: `${insights?.positiveRatio ?? 0}%` }}
                />
              </div>
            </div>
            <div className="p-4 rounded-lg bg-muted/50 border border-border/50">
              <div className="text-sm text-muted-foreground mb-1">AI Insights Generated</div>
              <div className="text-2xl font-bold">{insights?.aiInsights?.length ?? 0}</div>
              <p className="text-xs text-muted-foreground mt-2">Based on your current data</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
