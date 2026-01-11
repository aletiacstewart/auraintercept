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
import { X, TrendingUp, Calendar, DollarSign, Users, Target } from 'lucide-react';
import { subDays } from 'date-fns';

interface ForecastFormProps {
  companyId: string;
  onCancel: () => void;
  onAnalyze?: (data: Record<string, unknown>) => void;
}

type ForecastType = 'demand' | 'revenue' | 'staffing';

export const ForecastForm: React.FC<ForecastFormProps> = ({ companyId, onCancel, onAnalyze }) => {
  const [forecastType, setForecastType] = useState<ForecastType>('demand');
  const [forecastPeriod, setForecastPeriod] = useState('7');

  // Fetch historical data for forecasting
  const { data: historicalData, isLoading } = useQuery({
    queryKey: ['forecast-historical', companyId],
    queryFn: async () => {
      const thirtyDaysAgo = subDays(new Date(), 30);
      
      const appointmentsResult = await supabase
        .from('appointments')
        .select('id, datetime, status, employee_id')
        .eq('company_id', companyId)
        .gte('datetime', thirtyDaysAgo.toISOString());
        
      const invoicesResult = await supabase
        .from('invoices')
        .select('id, total, status, created_at')
        .eq('company_id', companyId)
        .eq('status', 'paid')
        .gte('created_at', thirtyDaysAgo.toISOString());
        
      const { data: employeesData } = await supabase
        .from('profiles')
        .select('id')
        .match({ company_id: companyId, role: 'employee' });

      const appointments = appointmentsResult.data || [];
      const invoices = invoicesResult.data || [];
      const employees = employeesData || [];

      const avgDailyAppointments = appointments.length / 30;
      const avgDailyRevenue = invoices.reduce((sum, i) => sum + (i.total || 0), 0) / 30;
      const totalEmployees = employees.length || 1;

      return {
        avgDailyAppointments,
        avgDailyRevenue,
        totalEmployees,
        historicalAppointments: appointments.length,
        historicalRevenue: invoices.reduce((sum, i) => sum + (i.total || 0), 0),
      };
    },
  });

  const forecastDays = parseInt(forecastPeriod);
  
  // Simple forecasts based on historical averages
  const demandForecast = Math.round((historicalData?.avgDailyAppointments || 0) * forecastDays * 1.05); // 5% growth assumption
  const revenueForecast = Math.round((historicalData?.avgDailyRevenue || 0) * forecastDays * 1.05);
  const staffingNeed = Math.ceil(demandForecast / 5); // Assuming 5 appointments per employee per day

  const renderDemandForecast = () => (
    <div className="space-y-4">
      <div className="p-4 rounded-lg bg-white/5 border border-white/10">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-blue-500" />
            <span className="font-medium text-card-foreground">Demand Forecast</span>
          </div>
          <Badge variant="secondary" className="text-xs">Next {forecastDays} days</Badge>
        </div>
        <p className="text-3xl font-bold text-blue-400">{demandForecast}</p>
        <p className="text-sm text-card-foreground/70">Expected appointments</p>
        
        <div className="mt-4 space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-card-foreground/70">Confidence Level</span>
            <span className="text-card-foreground/70">75%</span>
          </div>
          <Progress value={75} className="h-2" />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="p-3 rounded-lg bg-white/5 border border-white/10">
          <p className="text-xs text-card-foreground/70">Daily Average</p>
          <p className="text-xl font-bold text-card-foreground">{(historicalData?.avgDailyAppointments || 0).toFixed(1)}</p>
        </div>
        <div className="p-3 rounded-lg bg-white/5 border border-white/10">
          <p className="text-xs text-card-foreground/70">Peak Day Expected</p>
          <p className="text-xl font-bold text-card-foreground">{Math.round((historicalData?.avgDailyAppointments || 0) * 1.4)}</p>
        </div>
      </div>

      <div className="p-4 rounded-lg bg-blue-500/10 border border-blue-500/20">
        <p className="text-sm text-blue-300">
          <strong>Forecast Insight:</strong> Based on the last 30 days, expect approximately {demandForecast} appointments. 
          Consider having {staffingNeed} technicians available during peak hours.
        </p>
      </div>
    </div>
  );

  const renderRevenueForecast = () => (
    <div className="space-y-4">
      <div className="p-4 rounded-lg bg-white/5 border border-white/10">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <DollarSign className="h-5 w-5 text-green-500" />
            <span className="font-medium text-card-foreground">Revenue Forecast</span>
          </div>
          <Badge variant="secondary" className="text-xs">Next {forecastDays} days</Badge>
        </div>
        <p className="text-3xl font-bold text-green-400">${revenueForecast.toLocaleString()}</p>
        <p className="text-sm text-card-foreground/70">Projected revenue</p>
        
        <div className="mt-4 space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-card-foreground/70">Confidence Level</span>
            <span className="text-card-foreground/70">70%</span>
          </div>
          <Progress value={70} className="h-2" />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="p-3 rounded-lg bg-white/5 border border-white/10">
          <p className="text-xs text-card-foreground/70">Daily Average</p>
          <p className="text-xl font-bold text-card-foreground">${(historicalData?.avgDailyRevenue || 0).toFixed(0)}</p>
        </div>
        <div className="p-3 rounded-lg bg-white/5 border border-white/10">
          <p className="text-xs text-card-foreground/70">Last 30 Days</p>
          <p className="text-xl font-bold text-card-foreground">${(historicalData?.historicalRevenue || 0).toLocaleString()}</p>
        </div>
      </div>

      <div className="p-4 rounded-lg bg-green-500/10 border border-green-500/20">
        <p className="text-sm text-green-300">
          <strong>Revenue Insight:</strong> Maintaining current booking rates should generate approximately ${revenueForecast.toLocaleString()} 
          over the next {forecastDays} days.
        </p>
      </div>
    </div>
  );

  const renderStaffingForecast = () => (
    <div className="space-y-4">
      <div className="p-4 rounded-lg bg-white/5 border border-white/10">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Users className="h-5 w-5 text-purple-500" />
            <span className="font-medium text-card-foreground">Staffing Forecast</span>
          </div>
          <Badge variant="secondary" className="text-xs">Next {forecastDays} days</Badge>
        </div>
        <p className="text-3xl font-bold text-purple-400">{staffingNeed}</p>
        <p className="text-sm text-card-foreground/70">Recommended staff</p>
        
        <div className="mt-4 flex items-center gap-2">
          <span className="text-sm text-card-foreground/70">Current team:</span>
          <Badge>{historicalData?.totalEmployees || 0} employees</Badge>
          {staffingNeed > (historicalData?.totalEmployees || 0) ? (
            <Badge variant="destructive" className="gap-1">
              <TrendingUp className="h-3 w-3" />
              Need {staffingNeed - (historicalData?.totalEmployees || 0)} more
            </Badge>
          ) : (
            <Badge variant="secondary" className="gap-1 bg-green-500/20 text-green-300">
              Sufficient capacity
            </Badge>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="p-3 rounded-lg bg-white/5 border border-white/10">
          <p className="text-xs text-card-foreground/70">Jobs per Employee</p>
          <p className="text-xl font-bold text-card-foreground">{Math.round(demandForecast / (historicalData?.totalEmployees || 1))}</p>
        </div>
        <div className="p-3 rounded-lg bg-white/5 border border-white/10">
          <p className="text-xs text-card-foreground/70">Utilization Rate</p>
          <p className="text-xl font-bold text-card-foreground">{Math.min(100, Math.round((demandForecast / ((historicalData?.totalEmployees || 1) * forecastDays * 5)) * 100))}%</p>
        </div>
      </div>

      <div className="p-4 rounded-lg bg-purple-500/10 border border-purple-500/20">
        <p className="text-sm text-purple-300">
          <strong>Staffing Insight:</strong> With {demandForecast} expected appointments over {forecastDays} days, 
          {staffingNeed <= (historicalData?.totalEmployees || 0) 
            ? ` your current team of ${historicalData?.totalEmployees} should handle the workload well.`
            : ` consider adding ${staffingNeed - (historicalData?.totalEmployees || 0)} temporary staff or overtime hours.`
          }
        </p>
      </div>
    </div>
  );

  return (
    <Card className="border-white/10 bg-card">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2 text-card-foreground">
            <Target className="h-5 w-5 text-secondary" />
            Forecast Report
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
            <Label className="text-card-foreground/70">Forecast Type</Label>
            <Select value={forecastType} onValueChange={(v) => setForecastType(v as ForecastType)}>
              <SelectTrigger className="bg-white text-slate-900 border-white/20">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="demand">Demand</SelectItem>
                <SelectItem value="revenue">Revenue</SelectItem>
                <SelectItem value="staffing">Staffing</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label className="text-card-foreground/70">Time Period</Label>
            <Select value={forecastPeriod} onValueChange={setForecastPeriod}>
              <SelectTrigger className="bg-white text-slate-900 border-white/20">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7">Next 7 days</SelectItem>
                <SelectItem value="14">Next 2 weeks</SelectItem>
                <SelectItem value="30">Next month</SelectItem>
                <SelectItem value="90">Next quarter</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Content */}
        {isLoading ? (
          <div className="space-y-3">
            <div className="p-4 rounded-lg bg-background animate-pulse h-32" />
            <div className="grid grid-cols-2 gap-3">
              <div className="p-4 rounded-lg bg-background animate-pulse h-20" />
              <div className="p-4 rounded-lg bg-background animate-pulse h-20" />
            </div>
          </div>
        ) : (
          <>
            {forecastType === 'demand' && renderDemandForecast()}
            {forecastType === 'revenue' && renderRevenueForecast()}
            {forecastType === 'staffing' && renderStaffingForecast()}
          </>
        )}

        {/* Actions */}
        <div className="flex gap-2 pt-2">
          <Button variant="outline" className="flex-1" onClick={() => toast.info('Advanced forecasting coming soon!')}>
            Advanced Options
          </Button>
          <Button variant="outline" onClick={onCancel}>
            Close
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
