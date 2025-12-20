import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { toast } from 'sonner';
import { X, Target, TrendingUp, TrendingDown, CheckCircle, Clock, DollarSign, Users, Calendar } from 'lucide-react';
import { format, subDays, startOfMonth, endOfMonth } from 'date-fns';

interface KpiDashboardFormProps {
  companyId: string;
  onCancel: () => void;
}

interface KpiItem {
  label: string;
  value: number;
  target: number;
  unit: string;
  icon: React.ElementType;
  color: string;
}

export const KpiDashboardForm: React.FC<KpiDashboardFormProps> = ({ companyId, onCancel }) => {
  const [dateRange, setDateRange] = useState('month');

  const getDateRange = () => {
    const now = new Date();
    if (dateRange === 'month') {
      return { startDate: startOfMonth(now), endDate: endOfMonth(now) };
    } else if (dateRange === 'week') {
      return { startDate: subDays(now, 7), endDate: now };
    } else {
      return { startDate: subDays(now, 90), endDate: now };
    }
  };

  const { startDate, endDate } = getDateRange();

  // Fetch KPI data
  const { data: kpis, isLoading } = useQuery({
    queryKey: ['kpi-dashboard', companyId, dateRange],
    queryFn: async () => {
      const [appointments, completedJobs, invoices, feedback] = await Promise.all([
        supabase
          .from('appointments')
          .select('id, status')
          .eq('company_id', companyId)
          .gte('datetime', startDate.toISOString())
          .lte('datetime', endDate.toISOString()),
        supabase
          .from('job_assignments')
          .select('id, estimated_arrival_minutes, actual_arrival_minutes')
          .eq('company_id', companyId)
          .not('completed_at', 'is', null)
          .gte('completed_at', startDate.toISOString())
          .lte('completed_at', endDate.toISOString()),
        supabase
          .from('invoices')
          .select('total, status')
          .eq('company_id', companyId)
          .gte('created_at', startDate.toISOString())
          .lte('created_at', endDate.toISOString()),
        supabase
          .from('customer_feedback')
          .select('rating')
          .eq('company_id', companyId)
          .gte('created_at', startDate.toISOString())
          .lte('created_at', endDate.toISOString()),
      ]);

      // Calculate KPIs
      const totalAppointments = appointments.data?.length || 0;
      const completedAppointments = appointments.data?.filter(a => a.status === 'completed').length || 0;
      const completionRate = totalAppointments > 0 ? (completedAppointments / totalAppointments) * 100 : 0;

      const totalRevenue = invoices.data?.filter(i => i.status === 'paid').reduce((sum, i) => sum + (i.total || 0), 0) || 0;
      const revenueTarget = dateRange === 'month' ? 10000 : dateRange === 'week' ? 2500 : 30000;

      const jobsCompleted = completedJobs.data?.length || 0;
      const jobTarget = dateRange === 'month' ? 50 : dateRange === 'week' ? 12 : 150;

      // Calculate average response/arrival time
      const jobsWithTimes = completedJobs.data?.filter(j => j.actual_arrival_minutes) || [];
      const avgResponseTime = jobsWithTimes.length > 0
        ? jobsWithTimes.reduce((sum, j) => sum + (j.actual_arrival_minutes || 0), 0) / jobsWithTimes.length
        : 0;
      const responseTimeTarget = 30; // 30 minutes target

      // Customer satisfaction
      const avgRating = feedback.data && feedback.data.length > 0
        ? feedback.data.reduce((sum, f) => sum + (f.rating || 0), 0) / feedback.data.length
        : 0;
      const ratingTarget = 4.5;

      return {
        completionRate: { value: completionRate, target: 90 },
        revenue: { value: totalRevenue, target: revenueTarget },
        jobsCompleted: { value: jobsCompleted, target: jobTarget },
        responseTime: { value: avgResponseTime, target: responseTimeTarget },
        satisfaction: { value: avgRating, target: ratingTarget },
        totalAppointments,
      };
    },
  });

  const getProgressColor = (value: number, target: number, inverse = false) => {
    const ratio = value / target;
    if (inverse) {
      if (ratio <= 1) return 'text-green-600';
      if (ratio <= 1.5) return 'text-yellow-600';
      return 'text-red-600';
    }
    if (ratio >= 1) return 'text-green-600';
    if (ratio >= 0.7) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getProgressValue = (value: number, target: number, inverse = false) => {
    if (inverse) return Math.min(100, (target / value) * 100);
    return Math.min(100, (value / target) * 100);
  };

  return (
    <Card className="border-indigo-200 bg-indigo-50/50">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <Target className="h-5 w-5 text-indigo-600" />
            KPI Dashboard
          </CardTitle>
          <Button variant="ghost" size="icon" onClick={onCancel}>
            <X className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Filters */}
        <div className="space-y-2">
          <Label className="flex items-center gap-1">
            <Calendar className="h-3 w-3" />
            Period
          </Label>
          <Select value={dateRange} onValueChange={setDateRange}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="week">This Week</SelectItem>
              <SelectItem value="month">This Month</SelectItem>
              <SelectItem value="quarter">This Quarter</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* KPI Grid */}
        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3, 4, 5].map(i => (
              <div key={i} className="p-4 rounded-lg bg-background animate-pulse h-20" />
            ))}
          </div>
        ) : (
          <div className="space-y-3">
            {/* Completion Rate */}
            <div className="p-4 rounded-lg bg-background border">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium">Job Completion Rate</span>
                </div>
                <span className={`font-bold ${getProgressColor(kpis?.completionRate.value || 0, kpis?.completionRate.target || 90)}`}>
                  {(kpis?.completionRate.value || 0).toFixed(1)}%
                </span>
              </div>
              <Progress value={getProgressValue(kpis?.completionRate.value || 0, kpis?.completionRate.target || 90)} className="h-2" />
              <p className="text-xs text-muted-foreground mt-1">Target: {kpis?.completionRate.target}%</p>
            </div>

            {/* Revenue */}
            <div className="p-4 rounded-lg bg-background border">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium">Revenue</span>
                </div>
                <span className={`font-bold ${getProgressColor(kpis?.revenue.value || 0, kpis?.revenue.target || 10000)}`}>
                  ${(kpis?.revenue.value || 0).toLocaleString()}
                </span>
              </div>
              <Progress value={getProgressValue(kpis?.revenue.value || 0, kpis?.revenue.target || 10000)} className="h-2" />
              <p className="text-xs text-muted-foreground mt-1">Target: ${(kpis?.revenue.target || 0).toLocaleString()}</p>
            </div>

            {/* Jobs Completed */}
            <div className="p-4 rounded-lg bg-background border">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium">Jobs Completed</span>
                </div>
                <span className={`font-bold ${getProgressColor(kpis?.jobsCompleted.value || 0, kpis?.jobsCompleted.target || 50)}`}>
                  {kpis?.jobsCompleted.value || 0}
                </span>
              </div>
              <Progress value={getProgressValue(kpis?.jobsCompleted.value || 0, kpis?.jobsCompleted.target || 50)} className="h-2" />
              <p className="text-xs text-muted-foreground mt-1">Target: {kpis?.jobsCompleted.target}</p>
            </div>

            {/* Response Time */}
            <div className="p-4 rounded-lg bg-background border">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium">Avg Response Time</span>
                </div>
                <span className={`font-bold ${getProgressColor(kpis?.responseTime.value || 0, kpis?.responseTime.target || 30, true)}`}>
                  {(kpis?.responseTime.value || 0).toFixed(0)} min
                </span>
              </div>
              <Progress value={getProgressValue(kpis?.responseTime.value || 0, kpis?.responseTime.target || 30, true)} className="h-2" />
              <p className="text-xs text-muted-foreground mt-1">Target: ≤{kpis?.responseTime.target} min</p>
            </div>

            {/* Customer Satisfaction */}
            <div className="p-4 rounded-lg bg-background border">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium">Customer Satisfaction</span>
                </div>
                <span className={`font-bold ${getProgressColor((kpis?.satisfaction.value || 0) * 20, (kpis?.satisfaction.target || 4.5) * 20)}`}>
                  {(kpis?.satisfaction.value || 0).toFixed(1)} / 5
                </span>
              </div>
              <Progress value={(kpis?.satisfaction.value || 0) * 20} className="h-2" />
              <p className="text-xs text-muted-foreground mt-1">Target: {kpis?.satisfaction.target}</p>
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-2 pt-2">
          <Button variant="outline" className="flex-1" onClick={() => toast.info('Custom KPIs coming soon!')}>
            Configure KPIs
          </Button>
          <Button variant="outline" onClick={onCancel}>
            Close
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
