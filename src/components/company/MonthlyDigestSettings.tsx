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
import { Mail, Calendar, Info, Eye, Send, Loader2, Globe } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useState, useEffect, useMemo } from 'react';
import { format, subMonths } from 'date-fns';
import { DigestMetricsSelector } from './DigestMetricsSelector';

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

const DAYS_OF_MONTH = Array.from({ length: 28 }, (_, i) => ({
  value: String(i + 1),
  label: `${i + 1}${getOrdinalSuffix(i + 1)}`,
}));

function getOrdinalSuffix(n: number): string {
  const s = ['th', 'st', 'nd', 'rd'];
  const v = n % 100;
  return s[(v - 20) % 10] || s[v] || s[0];
}

export function MonthlyDigestSettings() {
  const { companyId } = useAuth();
  const queryClient = useQueryClient();
  
  const [enabled, setEnabled] = useState<boolean>(false);
  const [email, setEmail] = useState<string>('');
  const [day, setDay] = useState<string>('1');
  const [time, setTime] = useState<string>('09:00');
  const [timezone, setTimezone] = useState<string>('America/New_York');
  const [includeAppointments, setIncludeAppointments] = useState(true);
  const [includeReminders, setIncludeReminders] = useState(true);
  const [includeSubscriptions, setIncludeSubscriptions] = useState(true);
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
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!companyId,
  });

  const { data: company, isLoading } = useQuery({
    queryKey: ['company-monthly-digest', companyId],
    queryFn: async () => {
      if (!companyId) return null;
      const { data, error } = await supabase
        .from('companies')
        .select('monthly_digest_enabled, monthly_digest_email, monthly_digest_day, monthly_digest_time, monthly_digest_timezone, monthly_digest_include_appointments, monthly_digest_include_reminders, monthly_digest_include_subscriptions, last_monthly_digest_at')
        .eq('id', companyId)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!companyId,
  });

  useEffect(() => {
    if (company) {
      setEnabled(company.monthly_digest_enabled || false);
      setEmail(company.monthly_digest_email || '');
      setDay(String(company.monthly_digest_day ?? 1));
      setTime(company.monthly_digest_time?.slice(0, 5) || '09:00');
      setTimezone(company.monthly_digest_timezone || browserTimezone || 'America/New_York');
      setIncludeAppointments(company.monthly_digest_include_appointments ?? true);
      setIncludeReminders(company.monthly_digest_include_reminders ?? true);
      setIncludeSubscriptions(company.monthly_digest_include_subscriptions ?? true);
    }
  }, [company, browserTimezone]);

  const updateMutation = useMutation({
    mutationFn: async (updates: {
      monthly_digest_enabled?: boolean;
      monthly_digest_email?: string | null;
      monthly_digest_day?: number;
      monthly_digest_time?: string;
      monthly_digest_timezone?: string;
      monthly_digest_include_appointments?: boolean;
      monthly_digest_include_reminders?: boolean;
      monthly_digest_include_subscriptions?: boolean;
    }) => {
      if (!companyId) throw new Error('No company ID');
      const { error } = await supabase
        .from('companies')
        .update(updates)
        .eq('id', companyId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['company-monthly-digest', companyId] });
      toast.success('Monthly digest settings updated');
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
    if (enabled && !includeAppointments && !includeReminders && !includeSubscriptions) {
      toast.error('Please select at least one metric to include');
      return;
    }
    updateMutation.mutate({
      monthly_digest_enabled: enabled,
      monthly_digest_email: email || null,
      monthly_digest_day: parseInt(day),
      monthly_digest_time: time,
      monthly_digest_timezone: timezone,
      monthly_digest_include_appointments: includeAppointments,
      monthly_digest_include_reminders: includeReminders,
      monthly_digest_include_subscriptions: includeSubscriptions,
    });
  };

  const handleSendTest = async () => {
    if (!email) {
      toast.error('Please enter a recipient email first');
      return;
    }
    
    if (email !== company?.monthly_digest_email) {
      await supabase
        .from('companies')
        .update({ monthly_digest_email: email })
        .eq('id', companyId);
    }
    
    setSendingTest(true);
    try {
      const { data, error } = await supabase.functions.invoke('monthly-digest', {
        body: { test: true, company_id: companyId }
      });
      
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      
      toast.success(`Test monthly digest sent to ${email}`);
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
          <Calendar className="h-5 w-5 text-primary" />
          Monthly Performance Report
        </CardTitle>
        <CardDescription>
          Receive a comprehensive monthly summary with trends and insights
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <Alert>
          <Info className="h-4 w-4" />
          <AlertDescription>
            Get a detailed monthly report with appointment trends, reminder performance,
            subscription analytics, and month-over-month comparisons.
          </AlertDescription>
        </Alert>

        <div className="flex items-center justify-between p-4 rounded-lg border bg-card">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-full bg-primary/10">
              <Mail className="h-5 w-5 text-primary" />
            </div>
            <div>
              <Label htmlFor="monthly-digest-enabled" className="text-base font-medium">
                Enable Monthly Report
              </Label>
              <p className="text-sm text-muted-foreground">
                Receive comprehensive monthly analytics
              </p>
            </div>
          </div>
          <Switch
            id="monthly-digest-enabled"
            checked={enabled}
            onCheckedChange={setEnabled}
          />
        </div>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="monthly-digest-email">Recipient Email</Label>
            <div className="flex items-center gap-2">
              <Mail className="h-4 w-4 text-muted-foreground" />
              <Input
                id="monthly-digest-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@company.com"
                disabled={!enabled}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="monthly-digest-day">Day of Month</Label>
              <Select value={day} onValueChange={setDay} disabled={!enabled}>
                <SelectTrigger id="monthly-digest-day">
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
            <div className="space-y-2">
              <Label htmlFor="monthly-digest-time">Time</Label>
              <Input
                id="monthly-digest-time"
                type="time"
                value={time}
                onChange={(e) => setTime(e.target.value)}
                disabled={!enabled}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="monthly-digest-timezone" className="flex items-center gap-1">
                <Globe className="h-3.5 w-3.5" />
                Timezone
              </Label>
              <Select value={timezone} onValueChange={setTimezone} disabled={!enabled}>
                <SelectTrigger id="monthly-digest-timezone">
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
            Report will be sent on the {DAYS_OF_MONTH.find(d => d.value === day)?.label} of each month at {time} ({COMMON_TIMEZONES.find(tz => tz.value === timezone)?.label || timezone})
          </p>
        </div>

        <DigestMetricsSelector
          includeAppointments={includeAppointments}
          includeReminders={includeReminders}
          includeSubscriptions={includeSubscriptions}
          onChangeAppointments={setIncludeAppointments}
          onChangeReminders={setIncludeReminders}
          onChangeSubscriptions={setIncludeSubscriptions}
          disabled={!enabled}
        />

        {company?.last_monthly_digest_at && (
          <p className="text-sm text-muted-foreground">
            Last report sent: {new Date(company.last_monthly_digest_at).toLocaleString()}
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
                <DialogTitle>Monthly Report Preview</DialogTitle>
                <DialogDescription>
                  This is how your monthly report email will appear
                </DialogDescription>
              </DialogHeader>
              <MonthlyDigestPreview companyName={companyDetails?.name || 'Your Company'} />
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

function MonthlyDigestPreview({ companyName }: { companyName: string }) {
  const periodEnd = new Date();
  const periodStart = subMonths(periodEnd, 1);
  const formatDateStr = (d: Date) => format(d, 'MMM yyyy');

  const thisMonth = {
    appointments: { total: 96, completed: 78, cancelled: 8, noShow: 10 },
    reminders: { total: 288, successRate: 97, sms: 160, email: 100, call: 28 },
    subscriptions: { unsubscribes: 12, resubscribes: 4, netChange: -8 }
  };

  const lastMonth = {
    appointments: { total: 82, completed: 65, cancelled: 10, noShow: 7 },
    reminders: { total: 250, successRate: 94 },
    subscriptions: { unsubscribes: 15, resubscribes: 2 }
  };

  const calcChange = (current: number, previous: number) => {
    if (previous === 0) return { value: current > 0 ? 100 : 0, direction: current > 0 ? 'up' : 'same' };
    const change = Math.round(((current - previous) / previous) * 100);
    return { value: Math.abs(change), direction: change > 0 ? 'up' : change < 0 ? 'down' : 'same' };
  };

  const changes = {
    appointments: calcChange(thisMonth.appointments.total, lastMonth.appointments.total),
    completed: calcChange(thisMonth.appointments.completed, lastMonth.appointments.completed),
    reminders: calcChange(thisMonth.reminders.total, lastMonth.reminders.total),
    successRate: calcChange(thisMonth.reminders.successRate, lastMonth.reminders.successRate),
    unsubscribes: calcChange(thisMonth.subscriptions.unsubscribes, lastMonth.subscriptions.unsubscribes)
  };

  const ChangeIndicator = ({ change, positiveIsGood = true }: { change: { value: number; direction: string }; positiveIsGood?: boolean }) => {
    if (change.direction === 'same' || change.value === 0) return null;
    const isGood = (change.direction === 'up') === positiveIsGood;
    return (
      <span className={`text-xs ml-1 ${isGood ? 'text-green-600' : 'text-red-600'}`}>
        {change.direction === 'up' ? '↑' : '↓'}{change.value}%
      </span>
    );
  };

  return (
    <div className="border rounded-lg overflow-hidden">
      <div className="bg-gradient-to-r from-primary to-emerald-500 p-6 text-center text-primary-foreground">
        <h2 className="text-xl font-bold mb-1">📈 Monthly Report</h2>
        <p className="text-sm opacity-90">{companyName}</p>
        <p className="text-xs opacity-70">{formatDateStr(periodStart)}</p>
      </div>

      <div className="bg-muted/30 p-6 space-y-4">
        {/* Summary Stats */}
        <div className="bg-card border rounded-lg p-4">
          <h3 className="font-semibold mb-3">📊 Monthly Summary</h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold text-primary">
                {thisMonth.appointments.total}
                <ChangeIndicator change={changes.appointments} />
              </div>
              <div className="text-xs text-muted-foreground">Appointments</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-green-600">
                {thisMonth.appointments.completed}
                <ChangeIndicator change={changes.completed} />
              </div>
              <div className="text-xs text-muted-foreground">Completed</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-primary">
                {thisMonth.reminders.total}
                <ChangeIndicator change={changes.reminders} />
              </div>
              <div className="text-xs text-muted-foreground">Reminders</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-green-600">
                {thisMonth.reminders.successRate}%
                <ChangeIndicator change={changes.successRate} />
              </div>
              <div className="text-xs text-muted-foreground">Success Rate</div>
            </div>
          </div>
        </div>

        {/* Appointment Breakdown */}
        <div className="bg-card border rounded-lg p-4">
          <h3 className="font-semibold mb-3">📅 Appointment Breakdown</h3>
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <div className="text-xl font-bold text-green-600">{thisMonth.appointments.completed}</div>
              <div className="text-xs text-muted-foreground">Completed</div>
            </div>
            <div>
              <div className="text-xl font-bold text-red-600">{thisMonth.appointments.cancelled}</div>
              <div className="text-xs text-muted-foreground">Cancelled</div>
            </div>
            <div>
              <div className="text-xl font-bold text-amber-600">{thisMonth.appointments.noShow}</div>
              <div className="text-xs text-muted-foreground">No-Show</div>
            </div>
          </div>
          <div className="mt-3 pt-3 border-t">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Completion Rate</span>
              <span className="font-medium">{Math.round((thisMonth.appointments.completed / thisMonth.appointments.total) * 100)}%</span>
            </div>
          </div>
        </div>

        {/* Reminder Performance */}
        <div className="bg-card border rounded-lg p-4">
          <h3 className="font-semibold mb-3">🔔 Reminder Performance</h3>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>📱 SMS Reminders</span>
              <span className="font-medium">{thisMonth.reminders.sms}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span>✉️ Email Reminders</span>
              <span className="font-medium">{thisMonth.reminders.email}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span>📞 Voice Reminders</span>
              <span className="font-medium">{thisMonth.reminders.call}</span>
            </div>
          </div>
        </div>

        {/* Subscription Health */}
        <div className="bg-card border rounded-lg p-4">
          <h3 className="font-semibold mb-3">📈 Subscription Health</h3>
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <div className="text-xl font-bold text-red-600">
                {thisMonth.subscriptions.unsubscribes}
                <ChangeIndicator change={changes.unsubscribes} positiveIsGood={false} />
              </div>
              <div className="text-xs text-muted-foreground">Unsubscribes</div>
            </div>
            <div>
              <div className="text-xl font-bold text-green-600">{thisMonth.subscriptions.resubscribes}</div>
              <div className="text-xs text-muted-foreground">Re-subscribes</div>
            </div>
            <div>
              <div className={`text-xl font-bold ${thisMonth.subscriptions.netChange >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {thisMonth.subscriptions.netChange >= 0 ? '+' : ''}{thisMonth.subscriptions.netChange}
              </div>
              <div className="text-xs text-muted-foreground">Net Change</div>
            </div>
          </div>
        </div>

        {/* Insights */}
        <div className="bg-blue-50 dark:bg-blue-950/30 border border-blue-500/30 rounded-lg p-4">
          <p className="text-sm text-blue-700 dark:text-blue-400">
            💡 <strong>Insight:</strong> Appointments increased by 17% this month. Your reminder success rate improved to 97%, contributing to fewer no-shows.
          </p>
        </div>

        <p className="text-xs text-center text-muted-foreground pt-2">
          This is an automated monthly report from {companyName}.
        </p>
      </div>
    </div>
  );
}