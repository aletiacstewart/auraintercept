import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Skeleton } from '@/components/ui/skeleton';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { Calendar, Clock, Mail, CheckCircle2, XCircle, AlertCircle, FileText, TrendingUp, Send, Loader2 } from 'lucide-react';
import { format, formatDistanceToNow, addDays, setHours, setMinutes, setDate } from 'date-fns';
import { DigestDeliveryHistory } from './DigestDeliveryHistory';
import { DigestDeliveryStats } from './DigestDeliveryStats';

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
}

const DAYS_OF_WEEK = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

export function ReportsDashboard() {
  const { companyId } = useAuth();
  const [reports, setReports] = useState<ReportConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const [toggling, setToggling] = useState<string | null>(null);
  const [sendingTest, setSendingTest] = useState<string | null>(null);

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
        weekly_digest_enabled,
        weekly_digest_email,
        weekly_digest_day,
        weekly_digest_time,
        weekly_digest_timezone,
        weekly_digest_include_appointments,
        weekly_digest_include_reminders,
        weekly_digest_include_subscriptions,
        last_weekly_digest_at,
        monthly_digest_enabled,
        monthly_digest_email,
        monthly_digest_day,
        monthly_digest_time,
        monthly_digest_timezone,
        monthly_digest_include_appointments,
        monthly_digest_include_reminders,
        monthly_digest_include_subscriptions,
        last_monthly_digest_at,
        quarterly_digest_enabled,
        quarterly_digest_email,
        quarterly_digest_month,
        quarterly_digest_day,
        quarterly_digest_time,
        quarterly_digest_timezone,
        quarterly_digest_include_appointments,
        quarterly_digest_include_reminders,
        quarterly_digest_include_subscriptions,
        last_quarterly_digest_at
      `)
      .eq('id', companyId)
      .single();

    if (error) {
      console.error('Error fetching report configs:', error);
      setLoading(false);
      return;
    }

    const now = new Date();

    // Calculate next weekly
    const weeklyDay = data.weekly_digest_day || 1;
    const weeklyTime = data.weekly_digest_time || '09:00';
    const [weeklyHour, weeklyMin] = weeklyTime.split(':').map(Number);
    let nextWeekly = new Date(now);
    const daysUntilWeekly = (weeklyDay - now.getDay() + 7) % 7 || 7;
    nextWeekly = addDays(nextWeekly, daysUntilWeekly);
    nextWeekly = setHours(setMinutes(nextWeekly, weeklyMin), weeklyHour);

    // Calculate next monthly
    const monthlyDay = data.monthly_digest_day || 1;
    const monthlyTime = data.monthly_digest_time || '09:00';
    const [monthlyHour, monthlyMin] = monthlyTime.split(':').map(Number);
    let nextMonthly = setDate(new Date(now), monthlyDay);
    nextMonthly = setHours(setMinutes(nextMonthly, monthlyMin), monthlyHour);
    if (nextMonthly <= now) {
      nextMonthly = setDate(new Date(now.getFullYear(), now.getMonth() + 1, 1), monthlyDay);
      nextMonthly = setHours(setMinutes(nextMonthly, monthlyMin), monthlyHour);
    }

    // Calculate next quarterly
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

    const quarterMonthNames = ['1st month', '2nd month', '3rd month'];

    setReports([
      {
        id: 'weekly',
        type: 'weekly',
        enabled: data.weekly_digest_enabled || false,
        email: data.weekly_digest_email,
        lastSentAt: data.last_weekly_digest_at,
        nextScheduled: data.weekly_digest_enabled ? nextWeekly : null,
        timezone: data.weekly_digest_timezone || 'America/New_York',
        includeAppointments: data.weekly_digest_include_appointments !== false,
        includeReminders: data.weekly_digest_include_reminders !== false,
        includeSubscriptions: data.weekly_digest_include_subscriptions !== false,
        scheduleDescription: `Every ${DAYS_OF_WEEK[weeklyDay]} at ${weeklyTime}`
      },
      {
        id: 'monthly',
        type: 'monthly',
        enabled: data.monthly_digest_enabled || false,
        email: data.monthly_digest_email,
        lastSentAt: data.last_monthly_digest_at,
        nextScheduled: data.monthly_digest_enabled ? nextMonthly : null,
        timezone: data.monthly_digest_timezone || 'America/New_York',
        includeAppointments: data.monthly_digest_include_appointments !== false,
        includeReminders: data.monthly_digest_include_reminders !== false,
        includeSubscriptions: data.monthly_digest_include_subscriptions !== false,
        scheduleDescription: `Day ${monthlyDay} of each month at ${monthlyTime}`
      },
      {
        id: 'quarterly',
        type: 'quarterly',
        enabled: data.quarterly_digest_enabled || false,
        email: data.quarterly_digest_email,
        lastSentAt: data.last_quarterly_digest_at,
        nextScheduled: data.quarterly_digest_enabled ? nextQuarterly : null,
        timezone: data.quarterly_digest_timezone || 'America/New_York',
        includeAppointments: data.quarterly_digest_include_appointments !== false,
        includeReminders: data.quarterly_digest_include_reminders !== false,
        includeSubscriptions: data.quarterly_digest_include_subscriptions !== false,
        scheduleDescription: `${quarterMonthNames[quarterlyMonth - 1]} of quarter, day ${quarterlyDay} at ${quarterlyTime}`
      }
    ]);
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
      console.error(error);
    } else {
      toast.success(`${reportType.charAt(0).toUpperCase() + reportType.slice(1)} digest ${enabled ? 'enabled' : 'disabled'}`);
      fetchReportConfigs();
    }
    setToggling(null);
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
        toast.success(`Test ${reportType} digest sent to ${email}`, {
          description: 'Check your inbox for the email with real company data.'
        });
      } else if (data?.error) {
        toast.error(`Failed to send test digest: ${data.error}`);
      }
    } catch (error: any) {
      console.error('Error sending test digest:', error);
      toast.error(`Failed to send test ${reportType} digest`, {
        description: error.message || 'Please try again later.'
      });
    } finally {
      setSendingTest(null);
    }
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
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Scheduled Reports
          </CardTitle>
          <CardDescription>
            Overview of all automated digest reports and their status
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {reports.map(report => (
              <div 
                key={report.id}
                className="border border-border rounded-lg p-4 space-y-3 hover:bg-muted/30 transition-colors"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    {getReportIcon(report.type)}
                    <div>
                      <h3 className="font-semibold capitalize">{report.type} Digest</h3>
                      <p className="text-sm text-muted-foreground">{report.scheduleDescription}</p>
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
                        <Loader2 className="h-4 w-4 animate-spin mr-1" />
                      ) : (
                        <Send className="h-4 w-4 mr-1" />
                      )}
                      Send Test
                    </Button>
                    {getStatusBadge(report)}
                    <Switch
                      checked={report.enabled}
                      onCheckedChange={(checked) => toggleReport(report.type, checked)}
                      disabled={toggling === report.type}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Mail className="h-4 w-4" />
                    <span>{report.email || 'No recipient set'}</span>
                  </div>
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Clock className="h-4 w-4" />
                    <span>
                      {report.lastSentAt 
                        ? `Last sent ${formatDistanceToNow(new Date(report.lastSentAt), { addSuffix: true })}`
                        : 'Never sent'
                      }
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-muted-foreground">
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
                  <span className="text-xs text-muted-foreground">Includes:</span>
                  {getIncludedMetrics(report).map(metric => (
                    <Badge key={metric} variant="outline" className="text-xs">
                      {metric}
                    </Badge>
                  ))}
                  {getIncludedMetrics(report).length === 0 && (
                    <span className="text-xs text-destructive">No metrics selected</span>
                  )}
                </div>
              </div>
            ))}
          </div>

          <div className="mt-6 p-4 bg-muted/50 rounded-lg">
            <h4 className="font-medium text-sm mb-2">Quick Tips</h4>
            <ul className="text-sm text-muted-foreground space-y-1">
              <li>• Configure individual report settings in the Opt-in/Out tab</li>
              <li>• Ensure each report has a valid recipient email</li>
              <li>• Reports are sent based on your configured timezone</li>
            </ul>
          </div>
        </CardContent>
      </Card>

      <div className="mt-6">
        <DigestDeliveryStats />
      </div>

      <div className="mt-6">
        <DigestDeliveryHistory />
      </div>
    </>
  );
}
