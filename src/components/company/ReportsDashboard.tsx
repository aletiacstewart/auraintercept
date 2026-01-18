import { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Skeleton } from '@/components/ui/skeleton';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { Calendar, Clock, Mail, CheckCircle2, XCircle, AlertCircle, FileText, TrendingUp, Send, Loader2, ChevronDown, Settings2, Globe, Activity, DollarSign } from 'lucide-react';
import { format, formatDistanceToNow, addDays, setHours, setMinutes, setDate } from 'date-fns';
import { DigestDeliveryHistory } from './DigestDeliveryHistory';
import { DigestDeliveryStats } from './DigestDeliveryStats';
import { SuppressedEmailsManager } from './SuppressedEmailsManager';
import { DigestMetricsSelector } from './DigestMetricsSelector';
import { FinancialReports } from './FinancialReports';
import { AutomationOverview } from './AutomationOverview';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface ReportConfig {
  id: string;
  type: 'weekly' | 'monthly' | 'quarterly';
  enabled: boolean;
  email: string | null;
  lastSentAt: string | null;
  nextScheduled: Date | null;
  timezone: string;
  includeAppointments: boolean;
  includeReminders: boolean;
  includeSubscriptions: boolean;
  scheduleDescription: string;
  day: number;
  time: string;
  month?: number;
}

const DAYS_OF_WEEK = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const DAYS_OF_MONTH = Array.from({ length: 28 }, (_, i) => i + 1);
const QUARTER_MONTHS = [
  { value: 1, label: '1st month (Jan, Apr, Jul, Oct)' },
  { value: 2, label: '2nd month (Feb, May, Aug, Nov)' },
  { value: 3, label: '3rd month (Mar, Jun, Sep, Dec)' },
];

const COMMON_TIMEZONES = [
  { value: 'America/New_York', label: 'Eastern Time (ET)' },
  { value: 'America/Chicago', label: 'Central Time (CT)' },
  { value: 'America/Denver', label: 'Mountain Time (MT)' },
  { value: 'America/Los_Angeles', label: 'Pacific Time (PT)' },
  { value: 'Europe/London', label: 'London (GMT/BST)' },
  { value: 'Europe/Paris', label: 'Paris (CET/CEST)' },
  { value: 'Asia/Tokyo', label: 'Tokyo (JST)' },
  { value: 'Australia/Sydney', label: 'Sydney (AEST/AEDT)' },
  { value: 'UTC', label: 'UTC' },
];

export function ReportsDashboard() {
  const { companyId } = useAuth();
  const [reports, setReports] = useState<ReportConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const [toggling, setToggling] = useState<string | null>(null);
  const [sendingTest, setSendingTest] = useState<string | null>(null);
  const [saving, setSaving] = useState<string | null>(null);
  const [expandedReport, setExpandedReport] = useState<string | null>(null);
  const [editState, setEditState] = useState<Record<string, ReportConfig>>({});

  const browserTimezone = useMemo(() => Intl.DateTimeFormat().resolvedOptions().timeZone, []);

  useEffect(() => {
    if (companyId) {
      fetchReportConfigs();
    }
  }, [companyId]);

  const fetchReportConfigs = async () => {
    if (!companyId) return;

    const { data, error } = await supabase
      .from('companies')
      .select(`
        weekly_digest_enabled, weekly_digest_email, weekly_digest_day, weekly_digest_time, weekly_digest_timezone,
        weekly_digest_include_appointments, weekly_digest_include_reminders, weekly_digest_include_subscriptions, last_weekly_digest_at,
        monthly_digest_enabled, monthly_digest_email, monthly_digest_day, monthly_digest_time, monthly_digest_timezone,
        monthly_digest_include_appointments, monthly_digest_include_reminders, monthly_digest_include_subscriptions, last_monthly_digest_at,
        quarterly_digest_enabled, quarterly_digest_email, quarterly_digest_month, quarterly_digest_day, quarterly_digest_time, quarterly_digest_timezone,
        quarterly_digest_include_appointments, quarterly_digest_include_reminders, quarterly_digest_include_subscriptions, last_quarterly_digest_at
      `)
      .eq('id', companyId)
      .single();

    if (error) {
      console.error('Error fetching report configs:', error);
      setLoading(false);
      return;
    }

    const now = new Date();

    const weeklyDay = data.weekly_digest_day || 1;
    const weeklyTime = data.weekly_digest_time || '09:00';
    const [weeklyHour, weeklyMin] = weeklyTime.split(':').map(Number);
    let nextWeekly = new Date(now);
    const daysUntilWeekly = (weeklyDay - now.getDay() + 7) % 7 || 7;
    nextWeekly = addDays(nextWeekly, daysUntilWeekly);
    nextWeekly = setHours(setMinutes(nextWeekly, weeklyMin), weeklyHour);

    const monthlyDay = data.monthly_digest_day || 1;
    const monthlyTime = data.monthly_digest_time || '09:00';
    const [monthlyHour, monthlyMin] = monthlyTime.split(':').map(Number);
    let nextMonthly = setDate(new Date(now), monthlyDay);
    nextMonthly = setHours(setMinutes(nextMonthly, monthlyMin), monthlyHour);
    if (nextMonthly <= now) {
      nextMonthly = setDate(new Date(now.getFullYear(), now.getMonth() + 1, 1), monthlyDay);
      nextMonthly = setHours(setMinutes(nextMonthly, monthlyMin), monthlyHour);
    }

    const quarterlyMonth = data.quarterly_digest_month || 1;
    const quarterlyDay = data.quarterly_digest_day || 1;
    const quarterlyTime = data.quarterly_digest_time || '09:00';
    const [quarterlyHour, quarterlyMin] = quarterlyTime.split(':').map(Number);
    const currentQuarter = Math.floor(now.getMonth() / 3);
    const quarterStartMonth = currentQuarter * 3;
    let nextQuarterly = new Date(now.getFullYear(), quarterStartMonth + quarterlyMonth - 1, quarterlyDay);
    nextQuarterly = setHours(setMinutes(nextQuarterly, quarterlyMin), quarterlyHour);
    if (nextQuarterly <= now) {
      nextQuarterly = new Date(now.getFullYear(), quarterStartMonth + 3 + quarterlyMonth - 1, quarterlyDay);
      nextQuarterly = setHours(setMinutes(nextQuarterly, quarterlyMin), quarterlyHour);
    }

    const reportConfigs: ReportConfig[] = [
      {
        id: 'weekly',
        type: 'weekly',
        enabled: data.weekly_digest_enabled || false,
        email: data.weekly_digest_email,
        lastSentAt: data.last_weekly_digest_at,
        nextScheduled: data.weekly_digest_enabled ? nextWeekly : null,
        timezone: data.weekly_digest_timezone || browserTimezone || 'America/New_York',
        includeAppointments: data.weekly_digest_include_appointments !== false,
        includeReminders: data.weekly_digest_include_reminders !== false,
        includeSubscriptions: data.weekly_digest_include_subscriptions !== false,
        scheduleDescription: `Every ${DAYS_OF_WEEK[weeklyDay]} at ${weeklyTime}`,
        day: weeklyDay,
        time: weeklyTime.slice(0, 5),
      },
      {
        id: 'monthly',
        type: 'monthly',
        enabled: data.monthly_digest_enabled || false,
        email: data.monthly_digest_email,
        lastSentAt: data.last_monthly_digest_at,
        nextScheduled: data.monthly_digest_enabled ? nextMonthly : null,
        timezone: data.monthly_digest_timezone || browserTimezone || 'America/New_York',
        includeAppointments: data.monthly_digest_include_appointments !== false,
        includeReminders: data.monthly_digest_include_reminders !== false,
        includeSubscriptions: data.monthly_digest_include_subscriptions !== false,
        scheduleDescription: `Day ${monthlyDay} of each month at ${monthlyTime}`,
        day: monthlyDay,
        time: monthlyTime.slice(0, 5),
      },
      {
        id: 'quarterly',
        type: 'quarterly',
        enabled: data.quarterly_digest_enabled || false,
        email: data.quarterly_digest_email,
        lastSentAt: data.last_quarterly_digest_at,
        nextScheduled: data.quarterly_digest_enabled ? nextQuarterly : null,
        timezone: data.quarterly_digest_timezone || browserTimezone || 'America/New_York',
        includeAppointments: data.quarterly_digest_include_appointments !== false,
        includeReminders: data.quarterly_digest_include_reminders !== false,
        includeSubscriptions: data.quarterly_digest_include_subscriptions !== false,
        scheduleDescription: `${QUARTER_MONTHS[quarterlyMonth - 1]?.label.split(' ')[0]} month of quarter, day ${quarterlyDay} at ${quarterlyTime}`,
        day: quarterlyDay,
        time: quarterlyTime.slice(0, 5),
        month: quarterlyMonth,
      }
    ];

    setReports(reportConfigs);
    const editInit: Record<string, ReportConfig> = {};
    reportConfigs.forEach(r => { editInit[r.id] = { ...r }; });
    setEditState(editInit);
    setLoading(false);
  };

  const toggleReport = async (reportType: string, enabled: boolean) => {
    if (!companyId) return;
    setToggling(reportType);

    const updateField = `${reportType}_digest_enabled`;
    const { error } = await supabase
      .from('companies')
      .update({ [updateField]: enabled })
      .eq('id', companyId);

    if (error) {
      toast.error('Failed to update report status');
    } else {
      toast.success(`${reportType.charAt(0).toUpperCase() + reportType.slice(1)} report ${enabled ? 'enabled' : 'disabled'}`);
      fetchReportConfigs();
    }
    setToggling(null);
  };

  const saveReportSettings = async (reportType: string) => {
    if (!companyId) return;
    const edit = editState[reportType];
    if (!edit) return;

    if (edit.enabled && !edit.email) {
      toast.error('Please enter a recipient email');
      return;
    }

    setSaving(reportType);

    const updates: Record<string, unknown> = {
      [`${reportType}_digest_enabled`]: edit.enabled,
      [`${reportType}_digest_email`]: edit.email || null,
      [`${reportType}_digest_day`]: edit.day,
      [`${reportType}_digest_time`]: edit.time,
      [`${reportType}_digest_timezone`]: edit.timezone,
      [`${reportType}_digest_include_appointments`]: edit.includeAppointments,
      [`${reportType}_digest_include_reminders`]: edit.includeReminders,
      [`${reportType}_digest_include_subscriptions`]: edit.includeSubscriptions,
    };

    if (reportType === 'quarterly' && edit.month) {
      updates['quarterly_digest_month'] = edit.month;
    }

    const { error } = await supabase
      .from('companies')
      .update(updates)
      .eq('id', companyId);

    if (error) {
      toast.error('Failed to save settings');
    } else {
      toast.success('Settings saved');
      fetchReportConfigs();
      setExpandedReport(null);
    }
    setSaving(null);
  };

  const sendTestDigest = async (reportType: string, email: string | null) => {
    if (!companyId) return;
    if (!email) {
      toast.error('Please configure a recipient email first');
      return;
    }

    setSendingTest(reportType);

    try {
      const functionName = `${reportType}-digest`;
      const { data, error } = await supabase.functions.invoke(functionName, {
        body: { test: true, company_id: companyId }
      });

      if (error) throw error;
      if (data?.success) {
        toast.success(`Test ${reportType} report sent to ${email}`);
      } else if (data?.error) {
        toast.error(`Failed to send: ${data.error}`);
      }
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Failed to send test digest';
      toast.error(message);
    } finally {
      setSendingTest(null);
    }
  };

  const updateEditState = (reportId: string, updates: Partial<ReportConfig>) => {
    setEditState(prev => ({
      ...prev,
      [reportId]: { ...prev[reportId], ...updates }
    }));
  };

  const getStatusBadge = (report: ReportConfig) => {
    if (!report.enabled) {
      return <Badge variant="secondary" className="gap-1"><XCircle className="h-3 w-3" /> Disabled</Badge>;
    }
    if (!report.email) {
      return <Badge variant="destructive" className="gap-1"><AlertCircle className="h-3 w-3" /> No Email</Badge>;
    }
    return <Badge className="gap-1 bg-green-500/20 text-green-700 border-green-500/30"><CheckCircle2 className="h-3 w-3" /> Active</Badge>;
  };

  const getIncludedMetrics = (report: ReportConfig) => {
    const metrics = [];
    if (report.includeAppointments) metrics.push('Appointments');
    if (report.includeReminders) metrics.push('Reminders');
    if (report.includeSubscriptions) metrics.push('Subscriptions');
    return metrics;
  };

  const getReportIcon = (type: string) => {
    switch (type) {
      case 'weekly': return <Calendar className="h-5 w-5 text-blue-500" />;
      case 'monthly': return <FileText className="h-5 w-5 text-purple-500" />;
      case 'quarterly': return <TrendingUp className="h-5 w-5 text-indigo-500" />;
      default: return <FileText className="h-5 w-5" />;
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-64" />
        </CardHeader>
        <CardContent className="space-y-4">
          {[1, 2, 3].map(i => (
            <Skeleton key={i} className="h-32 w-full" />
          ))}
        </CardContent>
      </Card>
    );
  }

  return (
    <Tabs defaultValue="overview" className="space-y-6">
      <TabsList>
        <TabsTrigger value="overview" className="gap-1">
          <Activity className="h-4 w-4" />
          All Automations
        </TabsTrigger>
        <TabsTrigger value="scheduled" className="gap-1">
          <FileText className="h-4 w-4" />
          Digest Reports
        </TabsTrigger>
        <TabsTrigger value="financial" className="gap-1">
          <DollarSign className="h-4 w-4" />
          Financial
        </TabsTrigger>
      </TabsList>
      
      <TabsContent value="overview">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              All Platform Automations
            </CardTitle>
            <CardDescription>
              Overview of all automated reports, reminders, and notifications configured for your company
            </CardDescription>
          </CardHeader>
          <CardContent>
            <AutomationOverview />
          </CardContent>
        </Card>
      </TabsContent>
      
      <TabsContent value="scheduled">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Scheduled Reports
            </CardTitle>
            <CardDescription>
              Configure automated digest reports for performance insights
            </CardDescription>
          </CardHeader>
          <CardContent>
          <div className="space-y-4">
            {reports.map(report => {
              const edit = editState[report.id] || report;
              const isExpanded = expandedReport === report.id;

              return (
                <Collapsible
                  key={report.id}
                  open={isExpanded}
                  onOpenChange={(open) => setExpandedReport(open ? report.id : null)}
                >
                  <div className="border border-border rounded-lg overflow-hidden">
                    <div className="p-4 space-y-3 hover:bg-muted/30 transition-colors">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                          {getReportIcon(report.type)}
                          <div>
                            <h3 className="font-semibold capitalize text-card-foreground">{report.type} Report</h3>
                            <p className="text-sm text-card-foreground/70">{report.scheduleDescription}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => sendTestDigest(report.type, report.email)}
                            disabled={sendingTest === report.type || !report.email}
                          >
                            {sendingTest === report.type ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <Send className="h-4 w-4" />
                            )}
                            <span className="ml-1 hidden sm:inline">Test</span>
                          </Button>
                          {getStatusBadge(report)}
                          <Switch
                            checked={report.enabled}
                            onCheckedChange={(checked) => toggleReport(report.type, checked)}
                            disabled={toggling === report.type}
                          />
                          <CollapsibleTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <Settings2 className="h-4 w-4" />
                              <ChevronDown className={`h-4 w-4 ml-1 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                            </Button>
                          </CollapsibleTrigger>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                        <div className="flex items-center gap-2 text-card-foreground/70">
                          <Mail className="h-4 w-4" />
                          <span>{report.email || 'No recipient set'}</span>
                        </div>
                        <div className="flex items-center gap-2 text-card-foreground/70">
                          <Clock className="h-4 w-4" />
                          <span>
                            {report.lastSentAt 
                              ? `Last sent ${formatDistanceToNow(new Date(report.lastSentAt), { addSuffix: true })}`
                              : 'Never sent'
                            }
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-card-foreground/70">
                          <Calendar className="h-4 w-4" />
                          <span>
                            {report.nextScheduled && report.enabled
                              ? `Next: ${format(report.nextScheduled, 'MMM d, yyyy')}`
                              : 'Not scheduled'
                            }
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs text-card-foreground/70">Includes:</span>
                        {getIncludedMetrics(report).map(metric => (
                          <Badge key={metric} variant="outline" className="text-xs text-card-foreground border-card-foreground/30">
                            {metric}
                          </Badge>
                        ))}
                      </div>
                    </div>

                    <CollapsibleContent>
                      <div className="p-4 pt-0 border-t border-border bg-muted/20 space-y-4">
                        <div className="space-y-2">
                          <Label>Recipient Email</Label>
                          <div className="flex items-center gap-2">
                            <Mail className="h-4 w-4 text-muted-foreground" />
                            <Input
                              type="email"
                              value={edit.email || ''}
                              onChange={(e) => updateEditState(report.id, { email: e.target.value })}
                              placeholder="admin@company.com"
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                          {report.type === 'weekly' && (
                            <div className="space-y-2">
                              <Label>Day of Week</Label>
                              <Select value={String(edit.day)} onValueChange={(v) => updateEditState(report.id, { day: parseInt(v) })}>
                                <SelectTrigger>
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  {DAYS_OF_WEEK.map((d, i) => (
                                    <SelectItem key={i} value={String(i)}>{d}</SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                          )}

                          {report.type === 'monthly' && (
                            <div className="space-y-2">
                              <Label>Day of Month</Label>
                              <Select value={String(edit.day)} onValueChange={(v) => updateEditState(report.id, { day: parseInt(v) })}>
                                <SelectTrigger>
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  {DAYS_OF_MONTH.map((d) => (
                                    <SelectItem key={d} value={String(d)}>{d}</SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                          )}

                          {report.type === 'quarterly' && (
                            <>
                              <div className="space-y-2">
                                <Label>Month of Quarter</Label>
                                <Select value={String(edit.month || 1)} onValueChange={(v) => updateEditState(report.id, { month: parseInt(v) })}>
                                  <SelectTrigger>
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {QUARTER_MONTHS.map((m) => (
                                      <SelectItem key={m.value} value={String(m.value)}>{m.label}</SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </div>
                              <div className="space-y-2">
                                <Label>Day of Month</Label>
                                <Select value={String(edit.day)} onValueChange={(v) => updateEditState(report.id, { day: parseInt(v) })}>
                                  <SelectTrigger>
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {DAYS_OF_MONTH.map((d) => (
                                      <SelectItem key={d} value={String(d)}>{d}</SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </div>
                            </>
                          )}

                          <div className="space-y-2">
                            <Label>Time</Label>
                            <Input
                              type="time"
                              value={edit.time}
                              onChange={(e) => updateEditState(report.id, { time: e.target.value })}
                            />
                          </div>

                          <div className="space-y-2">
                            <Label className="flex items-center gap-1">
                              <Globe className="h-3.5 w-3.5" />
                              Timezone
                            </Label>
                            <Select value={edit.timezone} onValueChange={(v) => updateEditState(report.id, { timezone: v })}>
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {COMMON_TIMEZONES.map((tz) => (
                                  <SelectItem key={tz.value} value={tz.value}>{tz.label}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                        </div>

                        <DigestMetricsSelector
                          includeAppointments={edit.includeAppointments}
                          includeReminders={edit.includeReminders}
                          includeSubscriptions={edit.includeSubscriptions}
                          onChangeAppointments={(v) => updateEditState(report.id, { includeAppointments: v })}
                          onChangeReminders={(v) => updateEditState(report.id, { includeReminders: v })}
                          onChangeSubscriptions={(v) => updateEditState(report.id, { includeSubscriptions: v })}
                          disabled={false}
                        />

                        <div className="flex justify-end gap-2">
                          <Button variant="outline" onClick={() => setExpandedReport(null)}>Cancel</Button>
                          <Button onClick={() => saveReportSettings(report.type)} disabled={saving === report.type}>
                            {saving === report.type ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : null}
                            Save
                          </Button>
                        </div>
                      </div>
                    </CollapsibleContent>
                  </div>
                </Collapsible>
              );
            })}
          </div>
        </CardContent>
      </Card>

      <div className="mt-6">
        <DigestDeliveryStats />
      </div>

      <div className="mt-6">
        <SuppressedEmailsManager />
      </div>

      <div className="mt-6">
        <DigestDeliveryHistory />
      </div>
      </TabsContent>
      
      <TabsContent value="financial">
        <FinancialReports />
      </TabsContent>
    </Tabs>
  );
}
