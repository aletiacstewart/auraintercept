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
        .select('quarterly_digest_enabled, quarterly_digest_email, quarterly_digest_month, quarterly_digest_day, quarterly_digest_time, quarterly_digest_timezone, quarterly_digest_include_appointments, quarterly_digest_include_reminders, quarterly_digest_include_subscriptions, last_quarterly_digest_at')
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
      setIncludeAppointments(company.quarterly_digest_include_appointments ?? true);
      setIncludeReminders(company.quarterly_digest_include_reminders ?? true);
      setIncludeSubscriptions(company.quarterly_digest_include_subscriptions ?? true);
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
      quarterly_digest_include_appointments?: boolean;
      quarterly_digest_include_reminders?: boolean;
      quarterly_digest_include_subscriptions?: boolean;
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
    if (enabled && !includeAppointments && !includeReminders && !includeSubscriptions) {
      toast.error('Please select at least one metric to include');
      return;
    }
    updateMutation.mutate({
      quarterly_digest_enabled: enabled,
      quarterly_digest_email: email || null,
      quarterly_digest_month: parseInt(month),
      quarterly_digest_day: parseInt(day),
      quarterly_digest_time: time,
      quarterly_digest_timezone: timezone,
      quarterly_digest_include_appointments: includeAppointments,
      quarterly_digest_include_reminders: includeReminders,
      quarterly_digest_include_subscriptions: includeSubscriptions,
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
              <Label htmlFor="quarterly-digest-enabled" className="text-base font-medium text-card-foreground">
                Enable Quarterly Report
              </Label>
              <p className="text-sm text-card-foreground/70">
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
            <Label htmlFor="quarterly-digest-email" className="text-card-foreground">Recipient Email</Label>
            <div className="flex items-center gap-2">
              <Mail className="h-4 w-4 text-card-foreground/60" />
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
              <Label htmlFor="quarterly-digest-month" className="text-card-foreground">Month of Quarter</Label>
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
              <Label htmlFor="quarterly-digest-day" className="text-card-foreground">Day of Month</Label>
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
              <Label htmlFor="quarterly-digest-time" className="text-card-foreground">Time</Label>
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
          <p className="text-xs text-card-foreground/70">
            Report will be sent on the {DAYS_OF_MONTH.find(d => d.value === day)?.label} of the {QUARTER_MONTHS.find(m => m.value === month)?.label.toLowerCase()} at {time}
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

        {company?.last_quarterly_digest_at && (
          <p className="text-sm text-card-foreground/70">
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
              <DigestEmailPreview 
                type="quarterly"
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
