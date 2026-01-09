import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { X, BarChart3, TrendingUp, TrendingDown, Minus, Calendar, Users, Clock, CheckCircle, Target, Award, AlertTriangle } from 'lucide-react';
import { format, subDays } from 'date-fns';

interface PerformanceReportFormProps {
  companyId: string;
  onCancel: () => void;
  onAnalyze?: (data: Record<string, unknown>) => void;
  mode?: 'ai' | 'direct';
  initialView?: 'team' | 'top_performers' | 'goals' | 'improvements' | 'individual';
}

type ReportView = 'team' | 'top_performers' | 'goals' | 'improvements' | 'individual';

export const PerformanceReportForm: React.FC<PerformanceReportFormProps> = ({ 
  companyId, 
  onCancel,
  onAnalyze,
  mode = 'direct',
  initialView = 'team'
}) => {
  const [reportView, setReportView] = useState<ReportView>(initialView);
  const [dateRange, setDateRange] = useState('30');
  const [department, setDepartment] = useState('all');
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

  // Fetch employees/technicians for the company
  const { data: employees } = useQuery({
    queryKey: ['employees', companyId],
    queryFn: async () => {
      const { data } = await supabase
        .from('profiles')
        .select('id, full_name')
        .eq('company_id', companyId);
      return data || [];
    },
    enabled: !!companyId,
  });

  // Fetch current period metrics
  const { data: currentMetrics, isLoading } = useQuery({
    queryKey: ['performance-metrics', companyId, dateRange, department],
    queryFn: async () => {
      const [appointments, completedJobs, invoices] = await Promise.all([
        supabase
          .from('appointments')
          .select('id, status, datetime, employee_id, service_type')
          .eq('company_id', companyId)
          .gte('datetime', startDate.toISOString())
          .lte('datetime', endDate.toISOString()),
        supabase
          .from('job_assignments')
          .select('id, status, completed_at, employee_id')
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

      // Calculate per-employee stats
      const employeeStats = (employees || []).map(emp => {
        const empAppointments = appointments.data?.filter(a => a.employee_id === emp.id) || [];
        const empCompleted = empAppointments.filter(a => a.status === 'completed').length;
        const empJobs = completedJobs.data?.filter(j => j.employee_id === emp.id).length || 0;
        return {
          id: emp.id,
          name: emp.full_name,
          appointments: empAppointments.length,
          completed: empCompleted,
          completionRate: empAppointments.length > 0 ? (empCompleted / empAppointments.length) * 100 : 0,
          jobs: empJobs,
        };
      }).sort((a, b) => b.completed - a.completed);

      return {
        totalAppointments,
        completedAppointments,
        completionRate: totalAppointments > 0 ? (completedAppointments / totalAppointments) * 100 : 0,
        totalJobs,
        totalRevenue,
        paidInvoices,
        avgRevenuePerJob: totalJobs > 0 ? totalRevenue / totalJobs : 0,
        employeeStats,
        topPerformers: employeeStats.slice(0, 5),
      };
    },
    enabled: !!companyId,
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

  const handleExport = () => {
    if (onAnalyze) {
      onAnalyze({
        reportView,
        dateRange,
        department,
        metrics: currentMetrics,
        previousMetrics,
      });
    }
    toast.success('Report data ready for export');
  };

  const renderTeamOverview = () => (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <div className="p-4 rounded-lg bg-background border">
          <div className="flex items-center gap-2 text-muted-foreground mb-1">
            <Calendar className="h-4 w-4" />
            <span className="text-sm">Appointments</span>
          </div>
          <p className="text-2xl font-bold">{currentMetrics?.totalAppointments || 0}</p>
          {compareRange === 'previous' && renderTrend(appointmentChange)}
        </div>

        <div className="p-4 rounded-lg bg-background border">
          <div className="flex items-center gap-2 text-muted-foreground mb-1">
            <CheckCircle className="h-4 w-4" />
            <span className="text-sm">Completed Jobs</span>
          </div>
          <p className="text-2xl font-bold">{currentMetrics?.totalJobs || 0}</p>
          {compareRange === 'previous' && renderTrend(jobChange)}
        </div>

        <div className="p-4 rounded-lg bg-background border">
          <div className="flex items-center gap-2 text-muted-foreground mb-1">
            <TrendingUp className="h-4 w-4" />
            <span className="text-sm">Revenue</span>
          </div>
          <p className="text-2xl font-bold">${(currentMetrics?.totalRevenue || 0).toLocaleString()}</p>
          {compareRange === 'previous' && renderTrend(revenueChange)}
        </div>

        <div className="p-4 rounded-lg bg-background border">
          <div className="flex items-center gap-2 text-muted-foreground mb-1">
            <Users className="h-4 w-4" />
            <span className="text-sm">Completion Rate</span>
          </div>
          <p className="text-2xl font-bold">{(currentMetrics?.completionRate || 0).toFixed(1)}%</p>
        </div>
      </div>
    </div>
  );

  const renderTopPerformers = () => (
    <div className="space-y-3">
      <h4 className="font-medium flex items-center gap-2">
        <Award className="h-4 w-4 text-yellow-500" />
        Top Performers
      </h4>
      {currentMetrics?.topPerformers?.length ? (
        <div className="space-y-2">
          {currentMetrics.topPerformers.map((performer, index) => (
            <div key={performer.id} className="flex items-center justify-between p-3 rounded-lg bg-background border">
              <div className="flex items-center gap-3">
                <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                  index === 0 ? 'bg-yellow-100 text-yellow-700' :
                  index === 1 ? 'bg-gray-100 text-gray-700' :
                  index === 2 ? 'bg-orange-100 text-orange-700' :
                  'bg-muted text-muted-foreground'
                }`}>
                  {index + 1}
                </span>
                <div>
                  <p className="font-medium">{performer.name || 'Unknown'}</p>
                  <p className="text-xs text-muted-foreground">Team Member</p>
                </div>
              </div>
              <div className="text-right">
                <p className="font-semibold">{performer.completed} completed</p>
                <p className="text-xs text-muted-foreground">{performer.completionRate.toFixed(0)}% rate</p>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-muted-foreground text-sm">No performance data available for this period.</p>
      )}
    </div>
  );

  const renderGoalProgress = () => (
    <div className="space-y-4">
      <h4 className="font-medium flex items-center gap-2">
        <Target className="h-4 w-4 text-cyan-500" />
        Goal Progress
      </h4>
      <div className="space-y-3">
        <div className="p-4 rounded-lg bg-background border">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-medium">Monthly Revenue Target</span>
            <span className="text-sm text-muted-foreground">$10,000</span>
          </div>
          <div className="w-full bg-muted rounded-full h-2">
            <div 
              className="bg-cyan-500 h-2 rounded-full transition-all" 
              style={{ width: `${Math.min(((currentMetrics?.totalRevenue || 0) / 10000) * 100, 100)}%` }}
            />
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            ${currentMetrics?.totalRevenue?.toLocaleString() || 0} of $10,000 ({Math.round(((currentMetrics?.totalRevenue || 0) / 10000) * 100)}%)
          </p>
        </div>

        <div className="p-4 rounded-lg bg-background border">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-medium">Completion Rate Target</span>
            <span className="text-sm text-muted-foreground">95%</span>
          </div>
          <div className="w-full bg-muted rounded-full h-2">
            <div 
              className={`h-2 rounded-full transition-all ${(currentMetrics?.completionRate || 0) >= 95 ? 'bg-green-500' : 'bg-yellow-500'}`}
              style={{ width: `${Math.min(currentMetrics?.completionRate || 0, 100)}%` }}
            />
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            {(currentMetrics?.completionRate || 0).toFixed(1)}% of 95% target
          </p>
        </div>

        <div className="p-4 rounded-lg bg-background border">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-medium">Jobs Completed Target</span>
            <span className="text-sm text-muted-foreground">50 jobs</span>
          </div>
          <div className="w-full bg-muted rounded-full h-2">
            <div 
              className="bg-purple-500 h-2 rounded-full transition-all" 
              style={{ width: `${Math.min(((currentMetrics?.totalJobs || 0) / 50) * 100, 100)}%` }}
            />
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            {currentMetrics?.totalJobs || 0} of 50 jobs ({Math.round(((currentMetrics?.totalJobs || 0) / 50) * 100)}%)
          </p>
        </div>
      </div>
    </div>
  );

  const renderImprovementAreas = () => (
    <div className="space-y-4">
      <h4 className="font-medium flex items-center gap-2">
        <AlertTriangle className="h-4 w-4 text-amber-500" />
        Areas for Improvement
      </h4>
      <div className="space-y-3">
        {(currentMetrics?.completionRate || 0) < 90 && (
          <div className="p-4 rounded-lg bg-amber-50 border border-amber-200">
            <p className="font-medium text-amber-800">Low Completion Rate</p>
            <p className="text-sm text-amber-700 mt-1">
              Completion rate is at {(currentMetrics?.completionRate || 0).toFixed(1)}%. Consider reviewing scheduling processes and technician capacity.
            </p>
          </div>
        )}
        {(currentMetrics?.totalAppointments || 0) < 20 && (
          <div className="p-4 rounded-lg bg-blue-50 border border-blue-200">
            <p className="font-medium text-blue-800">Low Appointment Volume</p>
            <p className="text-sm text-blue-700 mt-1">
              Only {currentMetrics?.totalAppointments || 0} appointments in this period. Consider marketing efforts to increase bookings.
            </p>
          </div>
        )}
        {revenueChange < 0 && (
          <div className="p-4 rounded-lg bg-red-50 border border-red-200">
            <p className="font-medium text-red-800">Revenue Decline</p>
            <p className="text-sm text-red-700 mt-1">
              Revenue is down {Math.abs(revenueChange).toFixed(1)}% compared to the previous period. Review pricing and service mix.
            </p>
          </div>
        )}
        {(currentMetrics?.completionRate || 0) >= 90 && (currentMetrics?.totalAppointments || 0) >= 20 && revenueChange >= 0 && (
          <div className="p-4 rounded-lg bg-green-50 border border-green-200">
            <p className="font-medium text-green-800">Great Performance!</p>
            <p className="text-sm text-green-700 mt-1">
              All key metrics are on track. Keep up the excellent work!
            </p>
          </div>
        )}
      </div>
    </div>
  );

  const renderIndividualMetrics = () => (
    <div className="space-y-4">
      <h4 className="font-medium flex items-center gap-2">
        <Users className="h-4 w-4 text-indigo-500" />
        Individual Performance
      </h4>
      {currentMetrics?.employeeStats?.length ? (
        <div className="space-y-2 max-h-64 overflow-y-auto">
          {currentMetrics.employeeStats.map((emp) => (
            <div key={emp.id} className="p-3 rounded-lg bg-background border">
              <div className="flex justify-between items-start">
                <div>
                  <p className="font-medium">{emp.name || 'Unknown'}</p>
                  <p className="text-xs text-muted-foreground">Team Member</p>
                </div>
                <Badge variant={emp.completionRate >= 90 ? 'default' : emp.completionRate >= 70 ? 'secondary' : 'destructive'}>
                  {emp.completionRate.toFixed(0)}%
                </Badge>
              </div>
              <div className="grid grid-cols-3 gap-2 mt-2 text-xs">
                <div>
                  <p className="text-muted-foreground">Appointments</p>
                  <p className="font-medium">{emp.appointments}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Completed</p>
                  <p className="font-medium">{emp.completed}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Jobs</p>
                  <p className="font-medium">{emp.jobs}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-muted-foreground text-sm">No employee data available.</p>
      )}
    </div>
  );

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
        {/* Report Type Selector */}
        <div className="space-y-2">
          <Label>Report View</Label>
          <Select value={reportView} onValueChange={(v) => setReportView(v as ReportView)}>
            <SelectTrigger className="bg-background">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-background z-50">
              <SelectItem value="team">Team Overview</SelectItem>
              <SelectItem value="top_performers">Top Performers</SelectItem>
              <SelectItem value="goals">Goal Progress</SelectItem>
              <SelectItem value="improvements">Improvement Areas</SelectItem>
              <SelectItem value="individual">Individual Metrics</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Filters */}
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-2">
            <Label className="flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              Date Range
            </Label>
            <Select value={dateRange} onValueChange={setDateRange}>
              <SelectTrigger className="bg-background">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-background z-50">
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
              <SelectTrigger className="bg-background">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-background z-50">
                <SelectItem value="previous">Previous period</SelectItem>
                <SelectItem value="none">No comparison</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Department Filter */}
        <div className="space-y-2">
          <Label className="flex items-center gap-1">
            <Users className="h-3 w-3" />
            Department / Team
          </Label>
          <Select value={department} onValueChange={setDepartment}>
            <SelectTrigger className="bg-background">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-background z-50">
              <SelectItem value="all">All Teams</SelectItem>
              <SelectItem value="technicians">Technicians</SelectItem>
              <SelectItem value="dispatch">Dispatch</SelectItem>
              <SelectItem value="sales">Sales</SelectItem>
              <SelectItem value="support">Customer Support</SelectItem>
            </SelectContent>
          </Select>
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

        {/* Dynamic Content Based on Report View */}
        {isLoading ? (
          <div className="grid grid-cols-2 gap-3">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="p-4 rounded-lg bg-background animate-pulse h-24" />
            ))}
          </div>
        ) : (
          <>
            {reportView === 'team' && renderTeamOverview()}
            {reportView === 'top_performers' && renderTopPerformers()}
            {reportView === 'goals' && renderGoalProgress()}
            {reportView === 'improvements' && renderImprovementAreas()}
            {reportView === 'individual' && renderIndividualMetrics()}
          </>
        )}

        {/* Actions */}
        <div className="flex gap-2 pt-2">
          <Button variant="outline" className="flex-1" onClick={handleExport}>
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
