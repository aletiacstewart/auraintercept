import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Lightbulb, TrendingUp, AlertTriangle, CheckCircle, Calendar, BarChart3 } from 'lucide-react';
import { subDays } from 'date-fns';

interface InsightsReportFormProps {
  companyId: string;
  onCancel: () => void;
  onAnalyze?: (data: Record<string, unknown>) => void;
}

type InsightView = 'summary' | 'trends' | 'anomalies' | 'recommendations';

export const InsightsReportForm: React.FC<InsightsReportFormProps> = ({ companyId, onCancel, onAnalyze: _onAnalyze }) => {
  const [insightView, setInsightView] = useState<InsightView>('summary');
  const [dateRange, setDateRange] = useState('7');

  const getDateRange = () => {
    const days = parseInt(dateRange);
    const endDate = new Date();
    const startDate = subDays(endDate, days);
    return { startDate, endDate };
  };

  const { startDate, endDate } = getDateRange();

  // Fetch key metrics
  const { data: metrics, isLoading } = useQuery({
    queryKey: ['insights-metrics', companyId, dateRange],
    queryFn: async () => {
      const [appointments, invoices, feedback] = await Promise.all([
        supabase
          .from('appointments')
          .select('id, status, datetime')
          .eq('company_id', companyId)
          .gte('datetime', startDate.toISOString())
          .lte('datetime', endDate.toISOString()),
        supabase
          .from('invoices')
          .select('id, total, status')
          .eq('company_id', companyId)
          .gte('created_at', startDate.toISOString())
          .lte('created_at', endDate.toISOString()),
        supabase
          .from('customer_feedback')
          .select('id, rating, sentiment')
          .eq('company_id', companyId)
          .gte('created_at', startDate.toISOString())
          .lte('created_at', endDate.toISOString()),
      ]);

      const totalAppointments = appointments.data?.length || 0;
      const completedAppointments = appointments.data?.filter(a => a.status === 'completed').length || 0;
      const cancelledAppointments = appointments.data?.filter(a => a.status === 'cancelled').length || 0;
      const totalRevenue = invoices.data?.filter(i => i.status === 'paid').reduce((sum, i) => sum + (i.total || 0), 0) || 0;
      const avgRating = feedback.data?.length ? feedback.data.reduce((sum, f) => sum + (f.rating || 0), 0) / feedback.data.length : 0;
      const positiveCount = feedback.data?.filter(f => f.sentiment === 'positive').length || 0;
      const negativeCount = feedback.data?.filter(f => f.sentiment === 'negative').length || 0;

      // Generate insights
      const insights: Array<{ type: 'positive' | 'warning' | 'info'; message: string }> = [];
      
      if (completedAppointments / totalAppointments > 0.9) {
        insights.push({ type: 'positive', message: `Excellent completion rate: ${((completedAppointments / totalAppointments) * 100).toFixed(0)}%` });
      }
      if (cancelledAppointments / totalAppointments > 0.15) {
        insights.push({ type: 'warning', message: `High cancellation rate: ${((cancelledAppointments / totalAppointments) * 100).toFixed(0)}%. Review scheduling practices.` });
      }
      if (avgRating >= 4) {
        insights.push({ type: 'positive', message: `Strong customer satisfaction with ${avgRating.toFixed(1)} average rating` });
      }
      if (negativeCount > positiveCount && feedback.data?.length) {
        insights.push({ type: 'warning', message: 'More negative than positive feedback received. Consider follow-up actions.' });
      }
      if (totalRevenue > 0) {
        insights.push({ type: 'info', message: `Generated $${totalRevenue.toLocaleString()} in revenue this period` });
      }

      return {
        totalAppointments,
        completedAppointments,
        cancelledAppointments,
        completionRate: totalAppointments > 0 ? (completedAppointments / totalAppointments) * 100 : 0,
        totalRevenue,
        avgRating,
        feedbackCount: feedback.data?.length || 0,
        positiveCount,
        negativeCount,
        insights,
      };
    },
  });

  const renderSummary = () => (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <div className="p-4 rounded-lg bg-muted/50 border border-border">
          <div className="flex items-center gap-2 text-foreground/70 mb-1">
            <Calendar className="h-4 w-4" />
            <span className="text-sm">Appointments</span>
          </div>
          <p className="text-2xl font-bold text-foreground">{metrics?.totalAppointments || 0}</p>
          <p className="text-xs text-foreground/50">{metrics?.completedAppointments || 0} completed</p>
        </div>

        <div className="p-4 rounded-lg bg-muted/50 border border-border">
          <div className="flex items-center gap-2 text-foreground/70 mb-1">
            <TrendingUp className="h-4 w-4" />
            <span className="text-sm">Revenue</span>
          </div>
          <p className="text-2xl font-bold text-secondary">${(metrics?.totalRevenue || 0).toLocaleString()}</p>
        </div>

        <div className="p-4 rounded-lg bg-muted/50 border border-border">
          <div className="flex items-center gap-2 text-foreground/70 mb-1">
            <CheckCircle className="h-4 w-4" />
            <span className="text-sm">Completion Rate</span>
          </div>
          <p className="text-2xl font-bold text-foreground">{(metrics?.completionRate || 0).toFixed(0)}%</p>
        </div>

        <div className="p-4 rounded-lg bg-muted/50 border border-border">
          <div className="flex items-center gap-2 text-foreground/70 mb-1">
            <BarChart3 className="h-4 w-4" />
            <span className="text-sm">Avg Rating</span>
          </div>
          <p className="text-2xl font-bold text-foreground">{(metrics?.avgRating || 0).toFixed(1)} ⭐</p>
          <p className="text-xs text-foreground/50">{metrics?.feedbackCount || 0} reviews</p>
        </div>
      </div>
    </div>
  );

  const renderTrends = () => (
    <div className="space-y-4">
      <h4 className="font-medium flex items-center gap-2 text-foreground">
        <TrendingUp className="h-4 w-4 text-secondary" />
        Key Trends
      </h4>
      <div className="space-y-3">
        <div className="p-4 rounded-lg bg-muted/50 border border-border">
          <p className="font-medium text-foreground">Appointment Volume</p>
          <p className="text-sm text-foreground/70 mt-1">
            {metrics?.totalAppointments || 0} appointments scheduled in the last {dateRange} days.
            {(metrics?.completionRate || 0) > 85 && ' Completion rate is above target.'}
          </p>
        </div>
        <div className="p-4 rounded-lg bg-muted/50 border border-border">
          <p className="font-medium text-foreground">Customer Satisfaction</p>
          <p className="text-sm text-foreground/70 mt-1">
            {metrics?.positiveCount || 0} positive vs {metrics?.negativeCount || 0} negative reviews.
            Average rating: {(metrics?.avgRating || 0).toFixed(1)} out of 5.
          </p>
        </div>
        <div className="p-4 rounded-lg bg-muted/50 border border-border">
          <p className="font-medium text-foreground">Revenue Performance</p>
          <p className="text-sm text-foreground/70 mt-1">
            Total revenue of ${(metrics?.totalRevenue || 0).toLocaleString()} generated from completed jobs.
          </p>
        </div>
      </div>
    </div>
  );

  const renderAnomalies = () => (
    <div className="space-y-4">
      <h4 className="font-medium flex items-center gap-2 text-foreground">
        <AlertTriangle className="h-4 w-4 text-warning" />
        Anomalies & Alerts
      </h4>
      <div className="space-y-3">
        {(metrics?.cancelledAppointments || 0) > (metrics?.totalAppointments || 1) * 0.1 ? (
          <div className="p-4 rounded-lg bg-warning/10 border border-warning/20">
            <p className="font-medium text-warning">Elevated Cancellation Rate</p>
            <p className="text-sm text-warning/80 mt-1">
              {metrics?.cancelledAppointments} cancellations ({((metrics?.cancelledAppointments || 0) / (metrics?.totalAppointments || 1) * 100).toFixed(0)}%).
              Consider reviewing booking confirmation process.
            </p>
          </div>
        ) : null}
        {(metrics?.negativeCount || 0) > 2 ? (
          <div className="p-4 rounded-lg bg-destructive/10 border border-destructive/20">
            <p className="font-medium text-destructive">Negative Feedback Spike</p>
            <p className="text-sm text-destructive/80 mt-1">
              {metrics?.negativeCount} negative reviews received. Review recent service quality.
            </p>
          </div>
        ) : null}
        {!(metrics?.cancelledAppointments || 0) && !(metrics?.negativeCount || 0) ? (
          <div className="p-4 rounded-lg bg-secondary/10 border border-secondary/20">
            <p className="font-medium text-secondary">No Anomalies Detected</p>
            <p className="text-sm text-secondary/80 mt-1">
              All metrics are within normal ranges. Great work!
            </p>
          </div>
        ) : null}
      </div>
    </div>
  );

  const renderRecommendations = () => (
    <div className="space-y-4">
      <h4 className="font-medium flex items-center gap-2 text-foreground">
        <Lightbulb className="h-4 w-4 text-warning" />
        Recommendations
      </h4>
      <div className="space-y-3">
        {metrics?.insights?.map((insight, idx) => (
          <div 
            key={idx} 
            className={`p-4 rounded-lg border ${
              insight.type === 'positive' ? 'bg-secondary/10 border-secondary/20' :
              insight.type === 'warning' ? 'bg-warning/10 border-warning/20' :
              'bg-secondary/10 border-secondary/20'
            }`}
          >
            <div className="flex items-start gap-2">
              {insight.type === 'positive' ? <CheckCircle className="h-4 w-4 text-secondary mt-0.5" /> :
               insight.type === 'warning' ? <AlertTriangle className="h-4 w-4 text-warning mt-0.5" /> :
               <Lightbulb className="h-4 w-4 text-secondary mt-0.5" />}
              <p className={`text-sm ${
                insight.type === 'positive' ? 'text-secondary' :
                insight.type === 'warning' ? 'text-warning' :
                'text-secondary'
              }`}>
                {insight.message}
              </p>
            </div>
          </div>
        ))}
        {(!metrics?.insights || metrics.insights.length === 0) && (
          <p className="text-foreground/70 text-sm">No specific recommendations at this time.</p>
        )}
      </div>
    </div>
  );

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-2">
          <Label className="text-sm font-medium text-muted-foreground">Date Range</Label>
          <Select value={dateRange} onValueChange={setDateRange}>
            <SelectTrigger className="h-9 text-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7">Last 7 days</SelectItem>
              <SelectItem value="14">Last 14 days</SelectItem>
              <SelectItem value="30">Last 30 days</SelectItem>
              <SelectItem value="90">Last quarter</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label className="text-sm font-medium text-muted-foreground">View</Label>
          <Select value={insightView} onValueChange={(v) => setInsightView(v as InsightView)}>
            <SelectTrigger className="h-9 text-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="summary">Summary</SelectItem>
              <SelectItem value="trends">Trends</SelectItem>
              <SelectItem value="anomalies">Anomalies</SelectItem>
              <SelectItem value="recommendations">Recommendations</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="grid grid-cols-2 gap-3">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="p-4 rounded-lg bg-muted animate-pulse h-20" />
          ))}
        </div>
      ) : (
        <>
          {insightView === 'summary' && renderSummary()}
          {insightView === 'trends' && renderTrends()}
          {insightView === 'anomalies' && renderAnomalies()}
          {insightView === 'recommendations' && renderRecommendations()}
        </>
      )}

      {/* Actions */}
      <div className="flex gap-2 pt-2">
        <Button variant="outline" onClick={onCancel} className="flex-1">
          Close
        </Button>
      </div>
    </div>
  );
};
