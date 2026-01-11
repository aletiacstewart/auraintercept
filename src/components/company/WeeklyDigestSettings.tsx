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
import { DigestMetricsSelector } from './DigestMetricsSelector';
import { DigestEmailPreview } from './DigestEmailPreview';

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
  const [includeAppointments, setIncludeAppointments] = useState(true);
  const [includeReminders, setIncludeReminders] = useState(true);
  const [includeSubscriptions, setIncludeSubscriptions] = useState(true);
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
        .select('weekly_digest_enabled, weekly_digest_email, weekly_digest_day, weekly_digest_time, weekly_digest_timezone, weekly_digest_include_appointments, weekly_digest_include_reminders, weekly_digest_include_subscriptions, last_weekly_digest_at')
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
      setIncludeAppointments(company.weekly_digest_include_appointments ?? true);
      setIncludeReminders(company.weekly_digest_include_reminders ?? true);
      setIncludeSubscriptions(company.weekly_digest_include_subscriptions ?? true);
    }
  }, [company, browserTimezone]);

  const updateMutation = useMutation({
    mutationFn: async (updates: {
      weekly_digest_enabled?: boolean;
      weekly_digest_email?: string | null;
      weekly_digest_day?: number;
      weekly_digest_time?: string;
      weekly_digest_timezone?: string;
      weekly_digest_include_appointments?: boolean;
      weekly_digest_include_reminders?: boolean;
      weekly_digest_include_subscriptions?: boolean;
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
    if (enabled && !includeAppointments && !includeReminders && !includeSubscriptions) {
      toast.error('Please select at least one metric to include');
      return;
    }
    updateMutation.mutate({
      weekly_digest_enabled: enabled,
      weekly_digest_email: email || null,
      weekly_digest_day: parseInt(day),
      weekly_digest_time: time,
      weekly_digest_timezone: timezone,
      weekly_digest_include_appointments: includeAppointments,
      weekly_digest_include_reminders: includeReminders,
      weekly_digest_include_subscriptions: includeSubscriptions,
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
              <Label htmlFor="digest-enabled" className="text-base font-medium text-card-foreground">
                Enable Weekly Digest
              </Label>
              <p className="text-sm text-card-foreground/70">
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
            <Label htmlFor="digest-email" className="text-card-foreground">Recipient Email</Label>
            <div className="flex items-center gap-2">
              <Mail className="h-4 w-4 text-card-foreground/60" />
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
              <Label htmlFor="digest-day" className="text-card-foreground">Day</Label>
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
              <Label htmlFor="digest-time" className="text-card-foreground">Time</Label>
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
          <p className="text-xs text-card-foreground/70">
            Digest will be sent every {DAYS_OF_WEEK.find(d => d.value === day)?.label} at {time} ({COMMON_TIMEZONES.find(tz => tz.value === timezone)?.label || timezone})
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

        {company?.last_weekly_digest_at && (
          <p className="text-sm text-card-foreground/70">
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
              <DigestEmailPreview 
                type="weekly"
                companyName={companyDetails?.name || 'Your Company'}
                includeAppointments={includeAppointments}
                includeReminders={includeReminders}
                includeSubscriptions={includeSubscriptions}
              />
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

