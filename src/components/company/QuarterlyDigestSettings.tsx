import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { Skeleton } from '@/components/ui/skeleton';
import { Mail, TrendingUp, Info, Eye, Send, Loader2, Globe } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useState, useEffect, useMemo } from 'react';
import { format, subQuarters, subYears } from 'date-fns';

const COMMON_TIMEZONES = [
  { value: 'America/New_York', label: 'Eastern Time (ET)' },
  { value: 'America/Chicago', label: 'Central Time (CT)' },
  { value: 'America/Denver', label: 'Mountain Time (MT)' },
  { value: 'America/Los_Angeles', label: 'Pacific Time (PT)' },
  { value: 'America/Anchorage', label: 'Alaska Time (AKT)' },
  { value: 'Pacific/Honolulu', label: 'Hawaii Time (HT)' },
  { value: 'Europe/London', label: 'London (GMT/BST)' },
  { value: 'Europe/Paris', label: 'Paris (CET/CEST)' },
  { value: 'Europe/Berlin', label: 'Berlin (CET/CEST)' },
  { value: 'Asia/Tokyo', label: 'Tokyo (JST)' },
  { value: 'Asia/Shanghai', label: 'Shanghai (CST)' },
  { value: 'Asia/Dubai', label: 'Dubai (GST)' },
  { value: 'Australia/Sydney', label: 'Sydney (AEST/AEDT)' },
  { value: 'UTC', label: 'UTC' },
];

const QUARTER_MONTHS = [
  { value: '1', label: 'First month of quarter (Jan, Apr, Jul, Oct)' },
  { value: '2', label: 'Second month of quarter (Feb, May, Aug, Nov)' },
  { value: '3', label: 'Third month of quarter (Mar, Jun, Sep, Dec)' },
];

const DAYS_OF_MONTH = Array.from({ length: 28 }, (_, i) => ({
  value: String(i + 1),
  label: `${i + 1}${getOrdinalSuffix(i + 1)}`,
}));

function getOrdinalSuffix(n: number): string {
  const s = ['th', 'st', 'nd', 'rd'];
  const v = n % 100;
  return s[(v - 20) % 10] || s[v] || s[0];
}

export function QuarterlyDigestSettings() {
  const { companyId } = useAuth();
  const queryClient = useQueryClient();
  
  const [enabled, setEnabled] = useState<boolean>(false);
  const [email, setEmail] = useState<string>('');
  const [month, setMonth] = useState<string>('1');
  const [day, setDay] = useState<string>('1');
  const [time, setTime] = useState<string>('09:00');
  const [timezone, setTimezone] = useState<string>('America/New_York');
  const [previewOpen, setPreviewOpen] = useState(false);
  const [sendingTest, setSendingTest] = useState(false);

  const browserTimezone = useMemo(() => Intl.DateTimeFormat().resolvedOptions().timeZone, []);

  const { data: companyDetails } = useQuery({
    queryKey: ['company-details', companyId],
    queryFn: async () => {
      if (!companyId) return null;
      const { data, error } = await supabase
        .from('companies')
        .select('name')
        .eq('id', companyId)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!companyId,
  });

  const { data: company, isLoading } = useQuery({
    queryKey: ['company-quarterly-digest', companyId],
    queryFn: async () => {
      if (!companyId) return null;
      const { data, error } = await supabase
        .from('companies')
        .select('quarterly_digest_enabled, quarterly_digest_email, quarterly_digest_month, quarterly_digest_day, quarterly_digest_time, quarterly_digest_timezone, last_quarterly_digest_at')
        .eq('id', companyId)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!companyId,
  });

  useEffect(() => {
    if (company) {
      setEnabled(company.quarterly_digest_enabled || false);
      setEmail(company.quarterly_digest_email || '');
      setMonth(String(company.quarterly_digest_month ?? 1));
      setDay(String(company.quarterly_digest_day ?? 1));
      setTime(company.quarterly_digest_time?.slice(0, 5) || '09:00');
      setTimezone(company.quarterly_digest_timezone || browserTimezone || 'America/New_York');
    }
  }, [company, browserTimezone]);

  const updateMutation = useMutation({
    mutationFn: async (updates: {
      quarterly_digest_enabled?: boolean;
      quarterly_digest_email?: string | null;
      quarterly_digest_month?: number;
      quarterly_digest_day?: number;
      quarterly_digest_time?: string;
      quarterly_digest_timezone?: string;
    }) => {
      if (!companyId) throw new Error('No company ID');
      const { error } = await supabase
        .from('companies')
        .update(updates)
        .eq('id', companyId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['company-quarterly-digest', companyId] });
      toast.success('Quarterly digest settings updated');
    },
    onError: () => {
      toast.error('Failed to update settings');
    },
  });

  const handleSave = () => {
    if (enabled && !email) {
      toast.error('Please enter an email address');
      return;
    }
    updateMutation.mutate({
      quarterly_digest_enabled: enabled,
      quarterly_digest_email: email || null,
      quarterly_digest_month: parseInt(month),
      quarterly_digest_day: parseInt(day),
      quarterly_digest_time: time,
      quarterly_digest_timezone: timezone,
    });
  };

  const handleSendTest = async () => {
    if (!email) {
      toast.error('Please enter a recipient email first');
      return;
    }
    
    if (email !== company?.quarterly_digest_email) {
      await supabase
        .from('companies')
        .update({ quarterly_digest_email: email })
        .eq('id', companyId);
    }
    
    setSendingTest(true);
    try {
      const { data, error } = await supabase.functions.invoke('quarterly-digest', {
        body: { test: true, company_id: companyId }
      });
      
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      
      toast.success(`Test quarterly report sent to ${email}`);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Failed to send test email';
      toast.error(message);
    } finally {
      setSendingTest(false);
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-72" />
        </CardHeader>
        <CardContent className="space-y-4">
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5 text-primary" />
          Quarterly Business Review
        </CardTitle>
        <CardDescription>
          Receive comprehensive quarterly reports with year-over-year comparisons
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <Alert>
          <Info className="h-4 w-4" />
          <AlertDescription>
            Get detailed quarterly analytics including YoY growth trends, seasonal patterns,
            and strategic insights to help plan your business.
          </AlertDescription>
        </Alert>

        <div className="flex items-center justify-between p-4 rounded-lg border bg-card">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-full bg-primary/10">
              <Mail className="h-5 w-5 text-primary" />
            </div>
            <div>
              <Label htmlFor="quarterly-digest-enabled" className="text-base font-medium">
                Enable Quarterly Report
              </Label>
              <p className="text-sm text-muted-foreground">
                Receive strategic quarterly analytics with YoY comparisons
              </p>
            </div>
          </div>
          <Switch
            id="quarterly-digest-enabled"
            checked={enabled}
            onCheckedChange={setEnabled}
          />
        </div>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="quarterly-digest-email">Recipient Email</Label>
            <div className="flex items-center gap-2">
              <Mail className="h-4 w-4 text-muted-foreground" />
              <Input
                id="quarterly-digest-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@company.com"
                disabled={!enabled}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="quarterly-digest-month">Month of Quarter</Label>
              <Select value={month} onValueChange={setMonth} disabled={!enabled}>
                <SelectTrigger id="quarterly-digest-month">
                  <SelectValue placeholder="Select month" />
                </SelectTrigger>
                <SelectContent>
                  {QUARTER_MONTHS.map((m) => (
                    <SelectItem key={m.value} value={m.value}>
                      {m.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="quarterly-digest-day">Day of Month</Label>
              <Select value={day} onValueChange={setDay} disabled={!enabled}>
                <SelectTrigger id="quarterly-digest-day">
                  <SelectValue placeholder="Select day" />
                </SelectTrigger>
                <SelectContent>
                  {DAYS_OF_MONTH.map((d) => (
                    <SelectItem key={d.value} value={d.value}>
                      {d.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="quarterly-digest-time">Time</Label>
              <Input
                id="quarterly-digest-time"
                type="time"
                value={time}
                onChange={(e) => setTime(e.target.value)}
                disabled={!enabled}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="quarterly-digest-timezone" className="flex items-center gap-1">
                <Globe className="h-3.5 w-3.5" />
                Timezone
              </Label>
              <Select value={timezone} onValueChange={setTimezone} disabled={!enabled}>
                <SelectTrigger id="quarterly-digest-timezone">
                  <SelectValue placeholder="Select timezone" />
                </SelectTrigger>
                <SelectContent>
                  {COMMON_TIMEZONES.map((tz) => (
                    <SelectItem key={tz.value} value={tz.value}>
                      {tz.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <p className="text-xs text-muted-foreground">
            Report will be sent on the {DAYS_OF_MONTH.find(d => d.value === day)?.label} of the {QUARTER_MONTHS.find(m => m.value === month)?.label.toLowerCase()} at {time}
          </p>
        </div>

        {company?.last_quarterly_digest_at && (
          <p className="text-sm text-muted-foreground">
            Last report sent: {new Date(company.last_quarterly_digest_at).toLocaleString()}
          </p>
        )}

        <div className="flex flex-col sm:flex-row gap-3">
          <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" className="flex-1 gap-2">
                <Eye className="h-4 w-4" />
                Preview
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Quarterly Report Preview</DialogTitle>
                <DialogDescription>
                  This is how your quarterly business review will appear
                </DialogDescription>
              </DialogHeader>
              <QuarterlyDigestPreview companyName={companyDetails?.name || 'Your Company'} />
            </DialogContent>
          </Dialog>

          <Button 
            variant="outline"
            onClick={handleSendTest}
            disabled={sendingTest || !email}
            className="flex-1 gap-2"
          >
            {sendingTest ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
            Send Test
          </Button>
          
          <Button 
            onClick={handleSave} 
            disabled={updateMutation.isPending}
            className="flex-1"
          >
            {updateMutation.isPending ? 'Saving...' : 'Save'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function QuarterlyDigestPreview({ companyName }: { companyName: string }) {
  const now = new Date();
  const currentQuarter = Math.floor(now.getMonth() / 3) + 1;
  const lastQuarter = subQuarters(now, 1);
  const lastYearSameQuarter = subYears(now, 1);
  
  const formatQuarter = (d: Date) => `Q${Math.floor(d.getMonth() / 3) + 1} ${format(d, 'yyyy')}`;

  const thisQuarter = {
    appointments: { total: 312, completed: 258, cancelled: 32, noShow: 22, avgPerWeek: 24 },
    reminders: { total: 936, successRate: 97 },
    subscriptions: { unsubscribes: 28, resubscribes: 12, netChange: -16 },
    revenue: { value: 45600, avgPerAppointment: 177 }
  };

  const lastQuarterData = {
    appointments: { total: 285, completed: 230 },
    reminders: { total: 855, successRate: 95 },
    subscriptions: { unsubscribes: 35, resubscribes: 8 }
  };

  const lastYearData = {
    appointments: { total: 245, completed: 198 },
    reminders: { total: 735, successRate: 92 },
    subscriptions: { unsubscribes: 22, resubscribes: 5 }
  };

  const calcChange = (current: number, previous: number) => {
    if (previous === 0) return { value: current > 0 ? 100 : 0, direction: current > 0 ? 'up' : 'same' };
    const change = Math.round(((current - previous) / previous) * 100);
    return { value: Math.abs(change), direction: change > 0 ? 'up' : change < 0 ? 'down' : 'same' };
  };

  const qoqChanges = {
    appointments: calcChange(thisQuarter.appointments.total, lastQuarterData.appointments.total),
    completed: calcChange(thisQuarter.appointments.completed, lastQuarterData.appointments.completed),
    reminders: calcChange(thisQuarter.reminders.total, lastQuarterData.reminders.total),
  };

  const yoyChanges = {
    appointments: calcChange(thisQuarter.appointments.total, lastYearData.appointments.total),
    completed: calcChange(thisQuarter.appointments.completed, lastYearData.appointments.completed),
    reminders: calcChange(thisQuarter.reminders.total, lastYearData.reminders.total),
  };

  const ChangeIndicator = ({ change, positiveIsGood = true, label }: { change: { value: number; direction: string }; positiveIsGood?: boolean; label?: string }) => {
    if (change.direction === 'same' || change.value === 0) return null;
    const isGood = (change.direction === 'up') === positiveIsGood;
    return (
      <span className={`text-xs ${isGood ? 'text-green-600' : 'text-red-600'}`}>
        {change.direction === 'up' ? '↑' : '↓'}{change.value}%{label && ` ${label}`}
      </span>
    );
  };

  return (
    <div className="border rounded-lg overflow-hidden">
      <div className="bg-gradient-to-r from-indigo-600 to-purple-600 p-6 text-center text-white">
        <h2 className="text-xl font-bold mb-1">📊 Quarterly Business Review</h2>
        <p className="text-sm opacity-90">{companyName}</p>
        <p className="text-xs opacity-70">{formatQuarter(lastQuarter)}</p>
      </div>

      <div className="bg-muted/30 p-6 space-y-4">
        {/* Executive Summary */}
        <div className="bg-card border rounded-lg p-4">
          <h3 className="font-semibold mb-3">📈 Executive Summary</h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold text-primary">{thisQuarter.appointments.total}</div>
              <div className="text-xs text-muted-foreground mb-1">Appointments</div>
              <div className="flex justify-center gap-2">
                <ChangeIndicator change={qoqChanges.appointments} label="QoQ" />
              </div>
            </div>
            <div>
              <div className="text-2xl font-bold text-green-600">{thisQuarter.appointments.completed}</div>
              <div className="text-xs text-muted-foreground mb-1">Completed</div>
              <div className="flex justify-center gap-2">
                <ChangeIndicator change={qoqChanges.completed} label="QoQ" />
              </div>
            </div>
            <div>
              <div className="text-2xl font-bold text-primary">{thisQuarter.reminders.total}</div>
              <div className="text-xs text-muted-foreground mb-1">Reminders</div>
              <div className="flex justify-center gap-2">
                <ChangeIndicator change={qoqChanges.reminders} label="QoQ" />
              </div>
            </div>
            <div>
              <div className="text-2xl font-bold text-green-600">{thisQuarter.reminders.successRate}%</div>
              <div className="text-xs text-muted-foreground">Success Rate</div>
            </div>
          </div>
        </div>

        {/* Year-over-Year Comparison */}
        <div className="bg-card border rounded-lg p-4">
          <h3 className="font-semibold mb-3">📅 Year-over-Year Comparison</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2">Metric</th>
                  <th className="text-center py-2">{formatQuarter(lastYearSameQuarter)}</th>
                  <th className="text-center py-2">{formatQuarter(lastQuarter)}</th>
                  <th className="text-center py-2">YoY Change</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b">
                  <td className="py-2">Appointments</td>
                  <td className="text-center">{lastYearData.appointments.total}</td>
                  <td className="text-center font-medium">{thisQuarter.appointments.total}</td>
                  <td className="text-center"><ChangeIndicator change={yoyChanges.appointments} /></td>
                </tr>
                <tr className="border-b">
                  <td className="py-2">Completed</td>
                  <td className="text-center">{lastYearData.appointments.completed}</td>
                  <td className="text-center font-medium">{thisQuarter.appointments.completed}</td>
                  <td className="text-center"><ChangeIndicator change={yoyChanges.completed} /></td>
                </tr>
                <tr className="border-b">
                  <td className="py-2">Reminders Sent</td>
                  <td className="text-center">{lastYearData.reminders.total}</td>
                  <td className="text-center font-medium">{thisQuarter.reminders.total}</td>
                  <td className="text-center"><ChangeIndicator change={yoyChanges.reminders} /></td>
                </tr>
                <tr>
                  <td className="py-2">Success Rate</td>
                  <td className="text-center">{lastYearData.reminders.successRate}%</td>
                  <td className="text-center font-medium">{thisQuarter.reminders.successRate}%</td>
                  <td className="text-center text-green-600">+5pp</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Quarterly Trends */}
        <div className="bg-card border rounded-lg p-4">
          <h3 className="font-semibold mb-3">📊 Quarterly Trends</h3>
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <div className="text-lg font-bold text-primary">{thisQuarter.appointments.avgPerWeek}</div>
              <div className="text-xs text-muted-foreground">Avg/Week</div>
            </div>
            <div>
              <div className="text-lg font-bold text-green-600">{Math.round((thisQuarter.appointments.completed / thisQuarter.appointments.total) * 100)}%</div>
              <div className="text-xs text-muted-foreground">Completion Rate</div>
            </div>
            <div>
              <div className="text-lg font-bold text-amber-600">{thisQuarter.appointments.noShow}</div>
              <div className="text-xs text-muted-foreground">No-Shows</div>
            </div>
          </div>
        </div>

        {/* Subscription Health */}
        <div className="bg-card border rounded-lg p-4">
          <h3 className="font-semibold mb-3">📈 Subscription Health</h3>
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <div className="text-xl font-bold text-red-600">{thisQuarter.subscriptions.unsubscribes}</div>
              <div className="text-xs text-muted-foreground">Unsubscribes</div>
            </div>
            <div>
              <div className="text-xl font-bold text-green-600">{thisQuarter.subscriptions.resubscribes}</div>
              <div className="text-xs text-muted-foreground">Re-subscribes</div>
            </div>
            <div>
              <div className={`text-xl font-bold ${thisQuarter.subscriptions.netChange >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {thisQuarter.subscriptions.netChange >= 0 ? '+' : ''}{thisQuarter.subscriptions.netChange}
              </div>
              <div className="text-xs text-muted-foreground">Net Change</div>
            </div>
          </div>
        </div>

        {/* Strategic Insights */}
        <div className="bg-indigo-50 dark:bg-indigo-950/30 border border-indigo-500/30 rounded-lg p-4">
          <h4 className="font-medium text-indigo-700 dark:text-indigo-400 mb-2">💡 Strategic Insights</h4>
          <ul className="text-sm text-indigo-700 dark:text-indigo-400 space-y-1">
            <li>• Appointments grew 27% year-over-year, indicating strong business growth</li>
            <li>• Reminder success rate improved by 5 percentage points vs last year</li>
            <li>• Consider reviewing communication frequency to reduce unsubscribes</li>
          </ul>
        </div>

        <p className="text-xs text-center text-muted-foreground pt-2">
          This is an automated quarterly report from {companyName}.
        </p>
      </div>
    </div>
  );
}