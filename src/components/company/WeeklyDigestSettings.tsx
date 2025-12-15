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
import { Mail, CalendarDays, Info, Eye, Send, Loader2, Globe } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useState, useEffect, useMemo } from 'react';
import { format, subDays } from 'date-fns';

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

const DAYS_OF_WEEK = [
  { value: '0', label: 'Sunday' },
  { value: '1', label: 'Monday' },
  { value: '2', label: 'Tuesday' },
  { value: '3', label: 'Wednesday' },
  { value: '4', label: 'Thursday' },
  { value: '5', label: 'Friday' },
  { value: '6', label: 'Saturday' },
];

export function WeeklyDigestSettings() {
  const { companyId } = useAuth();
  const queryClient = useQueryClient();
  
  const [enabled, setEnabled] = useState<boolean>(false);
  const [email, setEmail] = useState<string>('');
  const [day, setDay] = useState<string>('1');
  const [time, setTime] = useState<string>('09:00');
  const [timezone, setTimezone] = useState<string>('America/New_York');
  const [previewOpen, setPreviewOpen] = useState(false);
  const [sendingTest, setSendingTest] = useState(false);

  // Get user's browser timezone as a suggestion
  const browserTimezone = useMemo(() => Intl.DateTimeFormat().resolvedOptions().timeZone, []);

  // Fetch company name for preview
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
    queryKey: ['company-weekly-digest', companyId],
    queryFn: async () => {
      if (!companyId) return null;
      const { data, error } = await supabase
        .from('companies')
        .select('weekly_digest_enabled, weekly_digest_email, weekly_digest_day, weekly_digest_time, weekly_digest_timezone, last_weekly_digest_at')
        .eq('id', companyId)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!companyId,
  });

  useEffect(() => {
    if (company) {
      setEnabled(company.weekly_digest_enabled || false);
      setEmail(company.weekly_digest_email || '');
      setDay(String(company.weekly_digest_day ?? 1));
      setTime(company.weekly_digest_time?.slice(0, 5) || '09:00');
      setTimezone(company.weekly_digest_timezone || browserTimezone || 'America/New_York');
    }
  }, [company, browserTimezone]);

  const updateMutation = useMutation({
    mutationFn: async (updates: {
      weekly_digest_enabled?: boolean;
      weekly_digest_email?: string | null;
      weekly_digest_day?: number;
      weekly_digest_time?: string;
      weekly_digest_timezone?: string;
    }) => {
      if (!companyId) throw new Error('No company ID');
      const { error } = await supabase
        .from('companies')
        .update(updates)
        .eq('id', companyId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['company-weekly-digest', companyId] });
      toast.success('Digest settings updated');
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
      weekly_digest_enabled: enabled,
      weekly_digest_email: email || null,
      weekly_digest_day: parseInt(day),
      weekly_digest_time: time,
      weekly_digest_timezone: timezone,
    });
  };

  const handleSendTest = async () => {
    if (!email) {
      toast.error('Please enter a recipient email first');
      return;
    }
    
    // Save settings first if needed
    if (email !== company?.weekly_digest_email) {
      await supabase
        .from('companies')
        .update({ weekly_digest_email: email })
        .eq('id', companyId);
    }
    
    setSendingTest(true);
    try {
      const { data, error } = await supabase.functions.invoke('weekly-digest', {
        body: { test: true, company_id: companyId }
      });
      
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      
      toast.success(`Test digest sent to ${email}`);
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
          <CalendarDays className="h-5 w-5 text-primary" />
          Weekly Performance Digest
        </CardTitle>
        <CardDescription>
          Receive a weekly summary of appointments, reminders, and subscription trends
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <Alert>
          <Info className="h-4 w-4" />
          <AlertDescription>
            Get a comprehensive weekly report including appointment stats, reminder delivery rates,
            and customer subscription trends sent directly to your inbox.
          </AlertDescription>
        </Alert>

        <div className="flex items-center justify-between p-4 rounded-lg border bg-card">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-full bg-primary/10">
              <Mail className="h-5 w-5 text-primary" />
            </div>
            <div>
              <Label htmlFor="digest-enabled" className="text-base font-medium">
                Enable Weekly Digest
              </Label>
              <p className="text-sm text-muted-foreground">
                Receive performance reports via email
              </p>
            </div>
          </div>
          <Switch
            id="digest-enabled"
            checked={enabled}
            onCheckedChange={setEnabled}
          />
        </div>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="digest-email">Recipient Email</Label>
            <div className="flex items-center gap-2">
              <Mail className="h-4 w-4 text-muted-foreground" />
              <Input
                id="digest-email"
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
              <Label htmlFor="digest-day">Day</Label>
              <Select value={day} onValueChange={setDay} disabled={!enabled}>
                <SelectTrigger id="digest-day">
                  <SelectValue placeholder="Select day" />
                </SelectTrigger>
                <SelectContent>
                  {DAYS_OF_WEEK.map((d) => (
                    <SelectItem key={d.value} value={d.value}>
                      {d.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="digest-time">Time</Label>
              <Input
                id="digest-time"
                type="time"
                value={time}
                onChange={(e) => setTime(e.target.value)}
                disabled={!enabled}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="digest-timezone" className="flex items-center gap-1">
                <Globe className="h-3.5 w-3.5" />
                Timezone
              </Label>
              <Select value={timezone} onValueChange={setTimezone} disabled={!enabled}>
                <SelectTrigger id="digest-timezone">
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
            Digest will be sent every {DAYS_OF_WEEK.find(d => d.value === day)?.label} at {time} ({COMMON_TIMEZONES.find(tz => tz.value === timezone)?.label || timezone})
          </p>
        </div>

        {company?.last_weekly_digest_at && (
          <p className="text-sm text-muted-foreground">
            Last digest sent: {new Date(company.last_weekly_digest_at).toLocaleString()}
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
                <DialogTitle>Weekly Digest Preview</DialogTitle>
                <DialogDescription>
                  This is how your weekly digest email will appear
                </DialogDescription>
              </DialogHeader>
              <DigestEmailPreview companyName={companyDetails?.name || 'Your Company'} />
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

// Preview component showing sample email with week-over-week comparison
function DigestEmailPreview({ companyName }: { companyName: string }) {
  const periodEnd = new Date();
  const periodStart = subDays(periodEnd, 7);
  const formatDateStr = (d: Date) => format(d, 'MMM d');

  // Sample data for preview (this week vs last week)
  const thisWeek = {
    appointments: { total: 24, completed: 18, cancelled: 2 },
    reminders: { total: 72, successRate: 96, sms: 40, email: 25, call: 7 },
    subscriptions: { unsubscribes: 3, resubscribes: 1, smsSubs: 1, emailSubs: 2, callSubs: 0 }
  };

  const lastWeek = {
    appointments: { total: 20, completed: 15, cancelled: 3 },
    reminders: { total: 65, successRate: 94 },
    subscriptions: { unsubscribes: 5, resubscribes: 0 }
  };

  // Calculate changes
  const calcChange = (current: number, previous: number) => {
    if (previous === 0) return { value: current > 0 ? 100 : 0, direction: current > 0 ? 'up' : 'same' };
    const change = Math.round(((current - previous) / previous) * 100);
    return { value: Math.abs(change), direction: change > 0 ? 'up' : change < 0 ? 'down' : 'same' };
  };

  const changes = {
    appointments: calcChange(thisWeek.appointments.total, lastWeek.appointments.total),
    completed: calcChange(thisWeek.appointments.completed, lastWeek.appointments.completed),
    cancelled: calcChange(thisWeek.appointments.cancelled, lastWeek.appointments.cancelled),
    reminders: calcChange(thisWeek.reminders.total, lastWeek.reminders.total),
    successRate: calcChange(thisWeek.reminders.successRate, lastWeek.reminders.successRate),
    unsubscribes: calcChange(thisWeek.subscriptions.unsubscribes, lastWeek.subscriptions.unsubscribes),
    resubscribes: calcChange(thisWeek.subscriptions.resubscribes, lastWeek.subscriptions.resubscribes)
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
      {/* Email Header */}
      <div className="bg-gradient-to-r from-primary to-purple-500 p-6 text-center text-primary-foreground">
        <h2 className="text-xl font-bold mb-1">📊 Weekly Digest</h2>
        <p className="text-sm opacity-90">{companyName}</p>
        <p className="text-xs opacity-70">{formatDateStr(periodStart)} - {formatDateStr(periodEnd)}</p>
      </div>

      <div className="bg-muted/30 p-6 space-y-4">
        {/* Appointments */}
        <div className="bg-card border rounded-lg p-4">
          <h3 className="font-semibold mb-3">📅 Appointments</h3>
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold text-primary">
                {thisWeek.appointments.total}
                <ChangeIndicator change={changes.appointments} />
              </div>
              <div className="text-xs text-muted-foreground">Total</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-green-600">
                {thisWeek.appointments.completed}
                <ChangeIndicator change={changes.completed} />
              </div>
              <div className="text-xs text-muted-foreground">Completed</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-red-600">
                {thisWeek.appointments.cancelled}
                <ChangeIndicator change={changes.cancelled} positiveIsGood={false} />
              </div>
              <div className="text-xs text-muted-foreground">Cancelled</div>
            </div>
          </div>
          <div className="mt-3 pt-3 border-t text-xs text-muted-foreground">
            vs previous week: {lastWeek.appointments.total} total, {lastWeek.appointments.completed} completed
          </div>
        </div>

        {/* Reminders */}
        <div className="bg-card border rounded-lg p-4">
          <h3 className="font-semibold mb-3">🔔 Reminders Sent</h3>
          <div className="grid grid-cols-2 gap-4 text-center mb-3">
            <div>
              <div className="text-2xl font-bold text-primary">
                {thisWeek.reminders.total}
                <ChangeIndicator change={changes.reminders} />
              </div>
              <div className="text-xs text-muted-foreground">Total</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-green-600">
                {thisWeek.reminders.successRate}%
                <ChangeIndicator change={changes.successRate} />
              </div>
              <div className="text-xs text-muted-foreground">Success Rate</div>
            </div>
          </div>
          <div className="border-t pt-3 text-sm space-y-1">
            <p>📱 SMS: {thisWeek.reminders.sms}</p>
            <p>✉️ Email: {thisWeek.reminders.email}</p>
            <p>📞 Voice: {thisWeek.reminders.call}</p>
          </div>
          <div className="mt-3 pt-3 border-t text-xs text-muted-foreground">
            vs previous week: {lastWeek.reminders.total} reminders, {lastWeek.reminders.successRate}% success
          </div>
        </div>

        {/* Subscription Trends */}
        <div className="bg-card border rounded-lg p-4">
          <h3 className="font-semibold mb-3">📈 Subscription Trends</h3>
          <div className="grid grid-cols-2 gap-4 text-center mb-3">
            <div>
              <div className="text-2xl font-bold text-red-600">
                {thisWeek.subscriptions.unsubscribes}
                <ChangeIndicator change={changes.unsubscribes} positiveIsGood={false} />
              </div>
              <div className="text-xs text-muted-foreground">Unsubscribes</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-green-600">
                {thisWeek.subscriptions.resubscribes}
                <ChangeIndicator change={changes.resubscribes} />
              </div>
              <div className="text-xs text-muted-foreground">Re-subscribes</div>
            </div>
          </div>
          <div className="border-t pt-3 text-sm space-y-1">
            <p className="font-medium mb-1">Unsubscribes by channel:</p>
            <p>📱 SMS: {thisWeek.subscriptions.smsSubs}</p>
            <p>✉️ Email: {thisWeek.subscriptions.emailSubs}</p>
            <p>📞 Voice: {thisWeek.subscriptions.callSubs}</p>
          </div>
          <div className="mt-3 pt-3 border-t text-xs text-muted-foreground">
            vs previous week: {lastWeek.subscriptions.unsubscribes} unsubscribes, {lastWeek.subscriptions.resubscribes} re-subscribes
          </div>
        </div>

        {/* Positive callout example */}
        <div className="bg-green-50 dark:bg-green-950/30 border border-green-500/30 rounded-lg p-4">
          <p className="text-sm text-green-700 dark:text-green-400">
            🎉 <strong>Great news!</strong> Appointments are up 20% compared to last week!
          </p>
        </div>

        <p className="text-xs text-center text-muted-foreground pt-2">
          This is an automated weekly digest from {companyName}.
        </p>
      </div>
    </div>
  );
}
