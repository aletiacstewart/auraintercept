import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { X, TrendingUp, TrendingDown, Calendar, ArrowRight, Sparkles, Loader2 } from 'lucide-react';
import { format, subDays, addDays, subMonths } from 'date-fns';

interface TrendForecastFormProps {
  companyId: string;
  onCancel: () => void;
  onForecast?: (data: Record<string, unknown>) => void;
}

export const TrendForecastForm: React.FC<TrendForecastFormProps> = ({ companyId, onCancel, onForecast }) => {
  const [metric, setMetric] = useState('appointments');
  const [forecastDays, setForecastDays] = useState('30');
  const [isGeneratingForecast, setIsGeneratingForecast] = useState(false);
  const [aiForecast, setAiForecast] = useState<string | null>(null);

  // Fetch historical data for trends
  const { data: trendData, isLoading } = useQuery({
    queryKey: ['trend-data', companyId, metric],
    queryFn: async () => {
      const thirtyDaysAgo = subDays(new Date(), 30);
      const sixtyDaysAgo = subDays(new Date(), 60);
      const ninetyDaysAgo = subDays(new Date(), 90);

      let currentPeriod = 0;
      let previousPeriod = 0;
      let olderPeriod = 0;

      if (metric === 'appointments') {
        const [current, previous, older] = await Promise.all([
          supabase.from('appointments').select('id', { count: 'exact' }).eq('company_id', companyId).gte('datetime', thirtyDaysAgo.toISOString()),
          supabase.from('appointments').select('id', { count: 'exact' }).eq('company_id', companyId).gte('datetime', sixtyDaysAgo.toISOString()).lt('datetime', thirtyDaysAgo.toISOString()),
          supabase.from('appointments').select('id', { count: 'exact' }).eq('company_id', companyId).gte('datetime', ninetyDaysAgo.toISOString()).lt('datetime', sixtyDaysAgo.toISOString()),
        ]);
        currentPeriod = current.count || 0;
        previousPeriod = previous.count || 0;
        olderPeriod = older.count || 0;
      } else if (metric === 'revenue') {
        const [current, previous, older] = await Promise.all([
          supabase.from('invoices').select('total').eq('company_id', companyId).eq('status', 'paid').gte('created_at', thirtyDaysAgo.toISOString()),
          supabase.from('invoices').select('total').eq('company_id', companyId).eq('status', 'paid').gte('created_at', sixtyDaysAgo.toISOString()).lt('created_at', thirtyDaysAgo.toISOString()),
          supabase.from('invoices').select('total').eq('company_id', companyId).eq('status', 'paid').gte('created_at', ninetyDaysAgo.toISOString()).lt('created_at', sixtyDaysAgo.toISOString()),
        ]);
        currentPeriod = current.data?.reduce((sum, i) => sum + (i.total || 0), 0) || 0;
        previousPeriod = previous.data?.reduce((sum, i) => sum + (i.total || 0), 0) || 0;
        olderPeriod = older.data?.reduce((sum, i) => sum + (i.total || 0), 0) || 0;
      } else if (metric === 'jobs') {
        const [current, previous, older] = await Promise.all([
          supabase.from('job_assignments').select('id', { count: 'exact' }).eq('company_id', companyId).not('completed_at', 'is', null).gte('completed_at', thirtyDaysAgo.toISOString()),
          supabase.from('job_assignments').select('id', { count: 'exact' }).eq('company_id', companyId).not('completed_at', 'is', null).gte('completed_at', sixtyDaysAgo.toISOString()).lt('completed_at', thirtyDaysAgo.toISOString()),
          supabase.from('job_assignments').select('id', { count: 'exact' }).eq('company_id', companyId).not('completed_at', 'is', null).gte('completed_at', ninetyDaysAgo.toISOString()).lt('completed_at', sixtyDaysAgo.toISOString()),
        ]);
        currentPeriod = current.count || 0;
        previousPeriod = previous.count || 0;
        olderPeriod = older.count || 0;
      }

      // Calculate trends
      const recentChange = previousPeriod > 0 ? ((currentPeriod - previousPeriod) / previousPeriod) * 100 : 0;
      const olderChange = olderPeriod > 0 ? ((previousPeriod - olderPeriod) / olderPeriod) * 100 : 0;
      
      // Simple linear projection
      const avgGrowth = (recentChange + olderChange) / 2;
      const projectedValue = currentPeriod * (1 + (avgGrowth / 100) * (parseInt(forecastDays) / 30));

      return {
        currentPeriod,
        previousPeriod,
        olderPeriod,
        recentChange,
        avgGrowth,
        projectedValue,
        trend: recentChange > 0 ? 'up' : recentChange < 0 ? 'down' : 'stable',
      };
    },
  });

  const generateAIForecast = async () => {
    setIsGeneratingForecast(true);
    try {
      const { data, error } = await supabase.functions.invoke('generate-campaign-content', {
        body: {
          campaignType: 'analytics',
          targetSegment: 'business',
          companyName: 'the business',
          field: 'message',
          campaignName: `${metric} forecast for next ${forecastDays} days`,
          discountValue: trendData?.avgGrowth?.toFixed(1),
          discountType: 'percent growth trend',
        },
      });

      if (error) throw error;
      setAiForecast(data?.content || 'Unable to generate forecast at this time.');
    } catch (error) {
      console.error('Error generating forecast:', error);
      toast.error('Failed to generate AI forecast');
    } finally {
      setIsGeneratingForecast(false);
    }
  };

  const metricLabels = {
    appointments: 'Appointments',
    revenue: 'Revenue',
    jobs: 'Completed Jobs',
  };

  const formatValue = (value: number) => {
    if (metric === 'revenue') return `$${value.toLocaleString()}`;
    return value.toLocaleString();
  };

  return (
    <Card className="border-border bg-card">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2 text-foreground">
            <TrendingUp className="h-5 w-5 text-primary" />
            Trend Forecast
          </CardTitle>
          <Button variant="ghost" size="icon" onClick={onCancel} className="text-foreground/70 hover:text-foreground">
            <X className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4 bg-muted/50 rounded-b-lg">
        {/* Filters */}
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-2">
            <Label className="text-foreground/70">Metric</Label>
            <Select value={metric} onValueChange={setMetric}>
              <SelectTrigger className="bg-input text-foreground border-border">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="appointments">Appointments</SelectItem>
                <SelectItem value="revenue">Revenue</SelectItem>
                <SelectItem value="jobs">Completed Jobs</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label className="text-foreground/70">Forecast Period</Label>
            <Select value={forecastDays} onValueChange={setForecastDays}>
              <SelectTrigger className="bg-input text-foreground border-border">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7">Next 7 days</SelectItem>
                <SelectItem value="30">Next 30 days</SelectItem>
                <SelectItem value="90">Next 90 days</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Trend Display */}
        {isLoading ? (
          <div className="space-y-3">
            {[1, 2].map(i => (
              <div key={i} className="p-4 rounded-lg bg-background animate-pulse h-20" />
            ))}
          </div>
        ) : (
          <>
            {/* Historical Trend */}
            <div className="p-4 rounded-lg bg-muted/50 border border-border space-y-3">
              <h4 className="font-medium text-sm text-foreground">Historical Trend (90 days)</h4>
              <div className="flex items-center justify-between gap-2">
                <div className="text-center flex-1">
                  <p className="text-xs text-foreground/60">60-90 days ago</p>
                  <p className="font-semibold text-foreground">{formatValue(trendData?.olderPeriod || 0)}</p>
                </div>
                <ArrowRight className="h-4 w-4 text-foreground/40" />
                <div className="text-center flex-1">
                  <p className="text-xs text-foreground/60">30-60 days ago</p>
                  <p className="font-semibold text-foreground">{formatValue(trendData?.previousPeriod || 0)}</p>
                </div>
                <ArrowRight className="h-4 w-4 text-foreground/40" />
                <div className="text-center flex-1">
                  <p className="text-xs text-foreground/60">Last 30 days</p>
                  <p className="font-semibold text-foreground">{formatValue(trendData?.currentPeriod || 0)}</p>
                </div>
              </div>
              <div className="flex items-center justify-center gap-2 pt-2">
                {trendData?.trend === 'up' ? (
                  <Badge className="bg-secondary/10 text-secondary">
                    <TrendingUp className="h-3 w-3 mr-1" />
                    +{(trendData?.recentChange || 0).toFixed(1)}% growth
                  </Badge>
                ) : trendData?.trend === 'down' ? (
                  <Badge className="bg-destructive/10 text-destructive">
                    <TrendingDown className="h-3 w-3 mr-1" />
                    {(trendData?.recentChange || 0).toFixed(1)}% decline
                  </Badge>
                ) : (
                  <Badge variant="secondary">Stable</Badge>
                )}
              </div>
            </div>

            {/* Projection */}
            <div className="p-4 rounded-lg bg-muted/50 border border-border">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-foreground/70">Projected {metricLabels[metric as keyof typeof metricLabels]}</p>
                  <p className="text-xs text-foreground/60">Next {forecastDays} days</p>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold text-primary">
                    {formatValue(Math.round(trendData?.projectedValue || 0))}
                  </p>
                  <p className="text-xs text-foreground/60">
                    Based on {(trendData?.avgGrowth || 0).toFixed(1)}% avg trend
                  </p>
                </div>
              </div>
            </div>

            {/* AI Forecast */}
            <Button
              variant="outline"
              className="w-full gap-2"
              onClick={generateAIForecast}
              disabled={isGeneratingForecast}
            >
              {isGeneratingForecast ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Sparkles className="h-4 w-4" />
              )}
              Generate AI Insights
            </Button>

            {aiForecast && (
              <div className="p-4 rounded-lg bg-muted/50 border border-border">
                <div className="flex items-center gap-2 mb-2">
                  <Sparkles className="h-4 w-4 text-primary" />
                  <span className="font-medium text-sm text-foreground">AI Analysis</span>
                </div>
                <p className="text-sm text-foreground/70 whitespace-pre-wrap">{aiForecast}</p>
              </div>
            )}
          </>
        )}

        {/* Actions */}
        <div className="flex gap-2 pt-2">
          <Button variant="outline" onClick={onCancel}>
            Close
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
