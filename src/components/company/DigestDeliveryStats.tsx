import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { BarChart3, CheckCircle2, XCircle, Mail, Calendar, FileText, TrendingUp, Ban, AlertTriangle } from 'lucide-react';
import { subDays, format, startOfDay } from 'date-fns';

interface DeliveryLog {
  id: string;
  digest_type: string;
  status: string;
  sent_at: string;
}

interface DailyStats {
  date: string;
  sent: number;
  failed: number;
  bounced: number;
  complained: number;
}

export function DigestDeliveryStats() {
  const { companyId } = useAuth();

  const { data: stats, isLoading } = useQuery({
    queryKey: ['digest-delivery-stats', companyId],
    queryFn: async () => {
      if (!companyId) return null;

      const thirtyDaysAgo = subDays(new Date(), 30).toISOString();

      const { data, error } = await supabase
        .from('digest_delivery_logs')
        .select('id, digest_type, status, sent_at')
        .eq('company_id', companyId)
        .gte('sent_at', thirtyDaysAgo)
        .order('sent_at', { ascending: true });

      if (error) throw error;

      const logs = data as DeliveryLog[];

      // Calculate totals
      const total = logs.length;
      const sent = logs.filter(l => l.status === 'sent').length;
      const failed = logs.filter(l => l.status === 'failed').length;
      const bounced = logs.filter(l => l.status === 'bounced').length;
      const complained = logs.filter(l => l.status === 'complained').length;
      const deliveryIssues = failed + bounced + complained;
      const successRate = total > 0 ? Math.round((sent / total) * 100) : 0;

      // Breakdown by type
      const byType = {
        weekly: { sent: 0, failed: 0, bounced: 0, complained: 0 },
        monthly: { sent: 0, failed: 0, bounced: 0, complained: 0 },
        quarterly: { sent: 0, failed: 0, bounced: 0, complained: 0 },
      };

      logs.forEach(log => {
        const type = log.digest_type as keyof typeof byType;
        if (byType[type]) {
          if (log.status === 'sent') {
            byType[type].sent++;
          } else if (log.status === 'bounced') {
            byType[type].bounced++;
          } else if (log.status === 'complained') {
            byType[type].complained++;
          } else {
            byType[type].failed++;
          }
        }
      });

      // Daily trend (last 7 days)
      const dailyStats: DailyStats[] = [];
      for (let i = 6; i >= 0; i--) {
        const date = startOfDay(subDays(new Date(), i));
        const dateStr = format(date, 'yyyy-MM-dd');
        const dayLogs = logs.filter(l => format(new Date(l.sent_at), 'yyyy-MM-dd') === dateStr);
        dailyStats.push({
          date: format(date, 'EEE'),
          sent: dayLogs.filter(l => l.status === 'sent').length,
          failed: dayLogs.filter(l => l.status === 'failed').length,
          bounced: dayLogs.filter(l => l.status === 'bounced').length,
          complained: dayLogs.filter(l => l.status === 'complained').length,
        });
      }

      return { total, sent, failed, bounced, complained, deliveryIssues, successRate, byType, dailyStats };
    },
    enabled: !!companyId,
  });

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-64" />
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-4 gap-4">
            {[1, 2, 3, 4].map(i => (
              <Skeleton key={i} className="h-20" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!stats || stats.total === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Delivery Analytics
          </CardTitle>
          <CardDescription>Last 30 days performance</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-6 text-muted-foreground">
            <Mail className="h-10 w-10 mx-auto mb-2 opacity-50" />
            <p>No delivery data yet</p>
            <p className="text-sm">Analytics will appear once digests are sent</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const maxDailyValue = Math.max(...stats.dailyStats.map(d => d.sent + d.failed + d.bounced + d.complained), 1);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BarChart3 className="h-5 w-5" />
          Delivery Analytics
        </CardTitle>
        <CardDescription>Last 30 days performance</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Summary Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center p-4 bg-muted/50 rounded-lg">
            <div className="text-3xl font-bold text-foreground">{stats.total}</div>
            <div className="text-sm text-muted-foreground">Total Sent</div>
          </div>
          <div className="text-center p-4 bg-green-500/10 rounded-lg">
            <div className="text-3xl font-bold text-green-600">{stats.successRate}%</div>
            <div className="text-sm text-muted-foreground">Success Rate</div>
          </div>
          <div className="text-center p-4 bg-green-500/10 rounded-lg">
            <div className="flex items-center justify-center gap-1">
              <CheckCircle2 className="h-5 w-5 text-green-600" />
              <span className="text-3xl font-bold text-green-600">{stats.sent}</span>
            </div>
            <div className="text-sm text-muted-foreground">Delivered</div>
          </div>
          <div className="text-center p-4 bg-red-500/10 rounded-lg">
            <div className="flex items-center justify-center gap-1">
              <XCircle className="h-5 w-5 text-red-600" />
              <span className="text-3xl font-bold text-red-600">{stats.deliveryIssues}</span>
            </div>
            <div className="text-sm text-muted-foreground">
              Issues
              {(stats.bounced > 0 || stats.complained > 0) && (
                <span className="block text-xs">
                  {stats.bounced > 0 && `${stats.bounced} bounced`}
                  {stats.bounced > 0 && stats.complained > 0 && ', '}
                  {stats.complained > 0 && `${stats.complained} spam`}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Breakdown by Type */}
        <div>
          <h4 className="text-sm font-medium mb-3">By Report Type</h4>
          <div className="grid grid-cols-3 gap-3">
            <div className="flex items-center gap-3 p-3 border border-border rounded-lg">
              <Calendar className="h-5 w-5 text-cyan-400" />
              <div>
                <div className="font-semibold">{stats.byType.weekly.sent + stats.byType.weekly.failed + stats.byType.weekly.bounced + stats.byType.weekly.complained}</div>
                <div className="text-xs text-muted-foreground">Weekly</div>
              </div>
              {(stats.byType.weekly.failed + stats.byType.weekly.bounced + stats.byType.weekly.complained) > 0 && (
                <span className="text-xs text-red-500 ml-auto">{stats.byType.weekly.failed + stats.byType.weekly.bounced + stats.byType.weekly.complained} issues</span>
              )}
            </div>
            <div className="flex items-center gap-3 p-3 border border-border rounded-lg">
              <FileText className="h-5 w-5 text-purple-500" />
              <div>
                <div className="font-semibold">{stats.byType.monthly.sent + stats.byType.monthly.failed + stats.byType.monthly.bounced + stats.byType.monthly.complained}</div>
                <div className="text-xs text-muted-foreground">Monthly</div>
              </div>
              {(stats.byType.monthly.failed + stats.byType.monthly.bounced + stats.byType.monthly.complained) > 0 && (
                <span className="text-xs text-red-500 ml-auto">{stats.byType.monthly.failed + stats.byType.monthly.bounced + stats.byType.monthly.complained} issues</span>
              )}
            </div>
            <div className="flex items-center gap-3 p-3 border border-border rounded-lg">
              <TrendingUp className="h-5 w-5 text-cyan-400" />
              <div>
                <div className="font-semibold">{stats.byType.quarterly.sent + stats.byType.quarterly.failed + stats.byType.quarterly.bounced + stats.byType.quarterly.complained}</div>
                <div className="text-xs text-muted-foreground">Quarterly</div>
              </div>
              {(stats.byType.quarterly.failed + stats.byType.quarterly.bounced + stats.byType.quarterly.complained) > 0 && (
                <span className="text-xs text-red-500 ml-auto">{stats.byType.quarterly.failed + stats.byType.quarterly.bounced + stats.byType.quarterly.complained} issues</span>
              )}
            </div>
          </div>
        </div>

        {/* 7-Day Trend Chart */}
        <div>
          <h4 className="text-sm font-medium mb-3">Last 7 Days</h4>
          <div className="flex items-end gap-2 h-24">
            {stats.dailyStats.map((day, idx) => {
              const totalIssues = day.failed + day.bounced + day.complained;
              return (
                <div key={idx} className="flex-1 flex flex-col items-center gap-1">
                  <div className="w-full flex flex-col gap-0.5" style={{ height: '80px' }}>
                    {totalIssues > 0 && (
                      <div
                        className="w-full bg-red-400 rounded-t"
                        style={{ height: `${(totalIssues / maxDailyValue) * 80}px` }}
                        title={`${day.failed} failed, ${day.bounced} bounced, ${day.complained} spam`}
                      />
                    )}
                    {day.sent > 0 && (
                      <div
                        className="w-full bg-green-500 rounded-t"
                        style={{ height: `${(day.sent / maxDailyValue) * 80}px` }}
                      />
                    )}
                    {day.sent === 0 && totalIssues === 0 && (
                      <div className="w-full bg-muted rounded-t" style={{ height: '4px', marginTop: 'auto' }} />
                    )}
                  </div>
                  <span className="text-xs text-muted-foreground">{day.date}</span>
                </div>
              );
            })}
          </div>
          <div className="flex items-center justify-center gap-4 mt-2 text-xs text-muted-foreground">
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 bg-green-500 rounded" />
              <span>Delivered</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 bg-red-400 rounded" />
              <span>Failed/Bounced/Spam</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
