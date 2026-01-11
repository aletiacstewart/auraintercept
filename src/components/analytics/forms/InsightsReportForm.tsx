import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { X, Lightbulb, TrendingUp, TrendingDown, AlertTriangle, CheckCircle, Calendar, BarChart3 } from 'lucide-react';
import { subDays, format } from 'date-fns';

interface InsightsReportFormProps {
  companyId: string;
  onCancel: () => void;
  onAnalyze?: (data: Record<string, unknown>) => void;
}

type InsightView = 'summary' | 'trends' | 'anomalies' | 'recommendations';

export const InsightsReportForm: React.FC<InsightsReportFormProps> = ({ companyId, onCancel, onAnalyze }) => {
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
        <div className="p-4 rounded-lg bg-white border">
          <div className="flex items-center gap-2 text-slate-600 mb-1">
            <Calendar className="h-4 w-4" />
            <span className="text-sm">Appointments</span>
          </div>
          <p className="text-2xl font-bold text-slate-800">{metrics?.totalAppointments || 0}</p>
          <p className="text-xs text-slate-500">{metrics?.completedAppointments || 0} completed</p>
        </div>

        <div className="p-4 rounded-lg bg-white border">
          <div className="flex items-center gap-2 text-slate-600 mb-1">
            <TrendingUp className="h-4 w-4" />
            <span className="text-sm">Revenue</span>
          </div>
          <p className="text-2xl font-bold text-green-600">${(metrics?.totalRevenue || 0).toLocaleString()}</p>
        </div>

        <div className="p-4 rounded-lg bg-white border">
          <div className="flex items-center gap-2 text-slate-600 mb-1">
            <CheckCircle className="h-4 w-4" />
            <span className="text-sm">Completion Rate</span>
          </div>
          <p className="text-2xl font-bold text-slate-800">{(metrics?.completionRate || 0).toFixed(0)}%</p>
        </div>

        <div className="p-4 rounded-lg bg-white border">
          <div className="flex items-center gap-2 text-slate-600 mb-1">
            <BarChart3 className="h-4 w-4" />
            <span className="text-sm">Avg Rating</span>
          </div>
          <p className="text-2xl font-bold text-slate-800">{(metrics?.avgRating || 0).toFixed(1)} ⭐</p>
          <p className="text-xs text-slate-500">{metrics?.feedbackCount || 0} reviews</p>
        </div>
      </div>
    </div>
  );

  const renderTrends = () => (
    <div className="space-y-4">
      <h4 className="font-medium flex items-center gap-2">
        <TrendingUp className="h-4 w-4 text-blue-500" />
        Key Trends
      </h4>
      <div className="space-y-3">
        <div className="p-4 rounded-lg bg-background border">
          <p className="font-medium">Appointment Volume</p>
          <p className="text-sm text-muted-foreground mt-1">
            {metrics?.totalAppointments || 0} appointments scheduled in the last {dateRange} days.
            {(metrics?.completionRate || 0) > 85 && ' Completion rate is above target.'}
          </p>
        </div>
        <div className="p-4 rounded-lg bg-background border">
          <p className="font-medium">Customer Satisfaction</p>
          <p className="text-sm text-muted-foreground mt-1">
            {metrics?.positiveCount || 0} positive vs {metrics?.negativeCount || 0} negative reviews.
            Average rating: {(metrics?.avgRating || 0).toFixed(1)} out of 5.
          </p>
        </div>
        <div className="p-4 rounded-lg bg-background border">
          <p className="font-medium">Revenue Performance</p>
          <p className="text-sm text-muted-foreground mt-1">
            Total revenue of ${(metrics?.totalRevenue || 0).toLocaleString()} generated from completed jobs.
          </p>
        </div>
      </div>
    </div>
  );

  const renderAnomalies = () => (
    <div className="space-y-4">
      <h4 className="font-medium flex items-center gap-2">
        <AlertTriangle className="h-4 w-4 text-amber-500" />
        Anomalies & Alerts
      </h4>
      <div className="space-y-3">
        {(metrics?.cancelledAppointments || 0) > (metrics?.totalAppointments || 1) * 0.1 ? (
          <div className="p-4 rounded-lg bg-amber-50 border border-amber-200">
            <p className="font-medium text-amber-800">Elevated Cancellation Rate</p>
            <p className="text-sm text-amber-700 mt-1">
              {metrics?.cancelledAppointments} cancellations ({((metrics?.cancelledAppointments || 0) / (metrics?.totalAppointments || 1) * 100).toFixed(0)}%).
              Consider reviewing booking confirmation process.
            </p>
          </div>
        ) : null}
        {(metrics?.negativeCount || 0) > 2 ? (
          <div className="p-4 rounded-lg bg-red-50 border border-red-200">
            <p className="font-medium text-red-800">Negative Feedback Spike</p>
            <p className="text-sm text-red-700 mt-1">
              {metrics?.negativeCount} negative reviews received. Review recent service quality.
            </p>
          </div>
        ) : null}
        {!(metrics?.cancelledAppointments || 0) && !(metrics?.negativeCount || 0) ? (
          <div className="p-4 rounded-lg bg-green-50 border border-green-200">
            <p className="font-medium text-green-800">No Anomalies Detected</p>
            <p className="text-sm text-green-700 mt-1">
              All metrics are within normal ranges. Great work!
            </p>
          </div>
        ) : null}
      </div>
    </div>
  );

  const renderRecommendations = () => (
    <div className="space-y-4">
      <h4 className="font-medium flex items-center gap-2">
        <Lightbulb className="h-4 w-4 text-yellow-500" />
        Recommendations
      </h4>
      <div className="space-y-3">
        {metrics?.insights?.map((insight, idx) => (
          <div 
            key={idx} 
            className={`p-4 rounded-lg border ${
              insight.type === 'positive' ? 'bg-green-50 border-green-200' :
              insight.type === 'warning' ? 'bg-amber-50 border-amber-200' :
              'bg-blue-50 border-blue-200'
            }`}
          >
            <div className="flex items-start gap-2">
              {insight.type === 'positive' ? <CheckCircle className="h-4 w-4 text-green-600 mt-0.5" /> :
               insight.type === 'warning' ? <AlertTriangle className="h-4 w-4 text-amber-600 mt-0.5" /> :
               <Lightbulb className="h-4 w-4 text-blue-600 mt-0.5" />}
              <p className={`text-sm ${
                insight.type === 'positive' ? 'text-green-800' :
                insight.type === 'warning' ? 'text-amber-800' :
                'text-blue-800'
              }`}>
                {insight.message}
              </p>
            </div>
          </div>
        ))}
        {(!metrics?.insights || metrics.insights.length === 0) && (
          <p className="text-muted-foreground text-sm">No specific recommendations at this time.</p>
        )}
      </div>
    </div>
  );

  return (
    <Card className="border-white/10 bg-card">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2 text-card-foreground">
            <Lightbulb className="h-5 w-5 text-secondary" />
            Business Insights
          </CardTitle>
          <Button variant="ghost" size="icon" onClick={onCancel} className="text-card-foreground/70 hover:text-card-foreground">
            <X className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Filters */}
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-2">
            <Label className="text-card-foreground/70">Date Range</Label>
            <Select value={dateRange} onValueChange={setDateRange}>
              <SelectTrigger className="bg-white text-slate-900 border-white/20">
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
            <Label className="text-card-foreground/70">View</Label>
            <Select value={insightView} onValueChange={(v) => setInsightView(v as InsightView)}>
              <SelectTrigger className="bg-white text-slate-900 border-white/20">
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
              <div key={i} className="p-4 rounded-lg bg-background animate-pulse h-20" />
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
          <Button variant="outline" className="flex-1" onClick={() => toast.info('Detailed insights coming soon!')}>
            View Full Report
          </Button>
          <Button variant="outline" onClick={onCancel}>
            Close
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
