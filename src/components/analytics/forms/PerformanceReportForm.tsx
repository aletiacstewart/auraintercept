import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { X, BarChart3, TrendingUp, TrendingDown, Minus, Calendar, Users, Clock, CheckCircle } from 'lucide-react';
import { format, subDays, subMonths, startOfMonth, endOfMonth } from 'date-fns';

interface PerformanceReportFormProps {
  companyId: string;
  onCancel: () => void;
  onAnalyze?: (data: Record<string, unknown>) => void;
}

export const PerformanceReportForm: React.FC<PerformanceReportFormProps> = ({ companyId, onCancel }) => {
  const [dateRange, setDateRange] = useState('30');
  const [compareRange, setCompareRange] = useState('previous');

  const getDateRanges = () => {
    const days = parseInt(dateRange);
    const endDate = new Date();
    const startDate = subDays(endDate, days);
    const prevEndDate = subDays(startDate, 1);
    const prevStartDate = subDays(prevEndDate, days);
    return { startDate, endDate, prevStartDate, prevEndDate };
  };

  const { startDate, endDate, prevStartDate, prevEndDate } = getDateRanges();

  // Fetch current period metrics
  const { data: currentMetrics, isLoading } = useQuery({
    queryKey: ['performance-metrics', companyId, dateRange],
    queryFn: async () => {
      const [appointments, completedJobs, invoices] = await Promise.all([
        supabase
          .from('appointments')
          .select('id, status, datetime')
          .eq('company_id', companyId)
          .gte('datetime', startDate.toISOString())
          .lte('datetime', endDate.toISOString()),
        supabase
          .from('job_assignments')
          .select('id, status, completed_at')
          .eq('company_id', companyId)
          .not('completed_at', 'is', null)
          .gte('completed_at', startDate.toISOString())
          .lte('completed_at', endDate.toISOString()),
        supabase
          .from('invoices')
          .select('id, total, status, paid_at')
          .eq('company_id', companyId)
          .gte('created_at', startDate.toISOString())
          .lte('created_at', endDate.toISOString()),
      ]);

      const totalAppointments = appointments.data?.length || 0;
      const completedAppointments = appointments.data?.filter(a => a.status === 'completed').length || 0;
      const totalJobs = completedJobs.data?.length || 0;
      const totalRevenue = invoices.data?.filter(i => i.status === 'paid').reduce((sum, i) => sum + (i.total || 0), 0) || 0;
      const paidInvoices = invoices.data?.filter(i => i.status === 'paid').length || 0;

      return {
        totalAppointments,
        completedAppointments,
        completionRate: totalAppointments > 0 ? (completedAppointments / totalAppointments) * 100 : 0,
        totalJobs,
        totalRevenue,
        paidInvoices,
        avgRevenuePerJob: totalJobs > 0 ? totalRevenue / totalJobs : 0,
      };
    },
  });

  // Fetch previous period metrics for comparison
  const { data: previousMetrics } = useQuery({
    queryKey: ['performance-metrics-prev', companyId, dateRange],
    queryFn: async () => {
      const [appointments, completedJobs, invoices] = await Promise.all([
        supabase
          .from('appointments')
          .select('id, status')
          .eq('company_id', companyId)
          .gte('datetime', prevStartDate.toISOString())
          .lte('datetime', prevEndDate.toISOString()),
        supabase
          .from('job_assignments')
          .select('id')
          .eq('company_id', companyId)
          .not('completed_at', 'is', null)
          .gte('completed_at', prevStartDate.toISOString())
          .lte('completed_at', prevEndDate.toISOString()),
        supabase
          .from('invoices')
          .select('total, status')
          .eq('company_id', companyId)
          .gte('created_at', prevStartDate.toISOString())
          .lte('created_at', prevEndDate.toISOString()),
      ]);

      const totalAppointments = appointments.data?.length || 0;
      const totalJobs = completedJobs.data?.length || 0;
      const totalRevenue = invoices.data?.filter(i => i.status === 'paid').reduce((sum, i) => sum + (i.total || 0), 0) || 0;

      return { totalAppointments, totalJobs, totalRevenue };
    },
    enabled: compareRange === 'previous',
  });

  const getChange = (current: number, previous: number) => {
    if (previous === 0) return current > 0 ? 100 : 0;
    return ((current - previous) / previous) * 100;
  };

  const renderTrend = (change: number) => {
    if (change > 0) {
      return (
        <span className="flex items-center gap-1 text-green-600 text-sm">
          <TrendingUp className="h-4 w-4" />
          +{change.toFixed(1)}%
        </span>
      );
    }
    if (change < 0) {
      return (
        <span className="flex items-center gap-1 text-red-600 text-sm">
          <TrendingDown className="h-4 w-4" />
          {change.toFixed(1)}%
        </span>
      );
    }
    return (
      <span className="flex items-center gap-1 text-muted-foreground text-sm">
        <Minus className="h-4 w-4" />
        0%
      </span>
    );
  };

  const appointmentChange = previousMetrics ? getChange(currentMetrics?.totalAppointments || 0, previousMetrics.totalAppointments) : 0;
  const jobChange = previousMetrics ? getChange(currentMetrics?.totalJobs || 0, previousMetrics.totalJobs) : 0;
  const revenueChange = previousMetrics ? getChange(currentMetrics?.totalRevenue || 0, previousMetrics.totalRevenue) : 0;

  return (
    <Card className="border-cyan-200 bg-cyan-50/50">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-cyan-600" />
            Performance Report
          </CardTitle>
          <Button variant="ghost" size="icon" onClick={onCancel}>
            <X className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Filters */}
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-2">
            <Label className="flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              Date Range
            </Label>
            <Select value={dateRange} onValueChange={setDateRange}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7">Last 7 days</SelectItem>
                <SelectItem value="30">Last 30 days</SelectItem>
                <SelectItem value="90">Last 90 days</SelectItem>
                <SelectItem value="365">Last year</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Compare To</Label>
            <Select value={compareRange} onValueChange={setCompareRange}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="previous">Previous period</SelectItem>
                <SelectItem value="none">No comparison</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Period Badge */}
        <div className="flex items-center gap-2">
          <Badge variant="outline">
            {format(startDate, 'MMM d')} - {format(endDate, 'MMM d, yyyy')}
          </Badge>
          {compareRange === 'previous' && previousMetrics && (
            <Badge variant="secondary" className="text-xs">
              vs {format(prevStartDate, 'MMM d')} - {format(prevEndDate, 'MMM d')}
            </Badge>
          )}
        </div>

        {/* Metrics Grid */}
        {isLoading ? (
          <div className="grid grid-cols-2 gap-3">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="p-4 rounded-lg bg-background animate-pulse h-24" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {/* Appointments */}
            <div className="p-4 rounded-lg bg-background border">
              <div className="flex items-center gap-2 text-muted-foreground mb-1">
                <Calendar className="h-4 w-4" />
                <span className="text-sm">Appointments</span>
              </div>
              <p className="text-2xl font-bold">{currentMetrics?.totalAppointments || 0}</p>
              {compareRange === 'previous' && renderTrend(appointmentChange)}
            </div>

            {/* Completed Jobs */}
            <div className="p-4 rounded-lg bg-background border">
              <div className="flex items-center gap-2 text-muted-foreground mb-1">
                <CheckCircle className="h-4 w-4" />
                <span className="text-sm">Completed Jobs</span>
              </div>
              <p className="text-2xl font-bold">{currentMetrics?.totalJobs || 0}</p>
              {compareRange === 'previous' && renderTrend(jobChange)}
            </div>

            {/* Revenue */}
            <div className="p-4 rounded-lg bg-background border">
              <div className="flex items-center gap-2 text-muted-foreground mb-1">
                <TrendingUp className="h-4 w-4" />
                <span className="text-sm">Revenue</span>
              </div>
              <p className="text-2xl font-bold">${(currentMetrics?.totalRevenue || 0).toLocaleString()}</p>
              {compareRange === 'previous' && renderTrend(revenueChange)}
            </div>

            {/* Completion Rate */}
            <div className="p-4 rounded-lg bg-background border">
              <div className="flex items-center gap-2 text-muted-foreground mb-1">
                <Users className="h-4 w-4" />
                <span className="text-sm">Completion Rate</span>
              </div>
              <p className="text-2xl font-bold">{(currentMetrics?.completionRate || 0).toFixed(1)}%</p>
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-2 pt-2">
          <Button variant="outline" className="flex-1" onClick={() => toast.info('Export coming soon!')}>
            Export Report
          </Button>
          <Button variant="outline" onClick={onCancel}>
            Close
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
