import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { ScrollArea } from '@/components/ui/scroll-area';
import { MessageSquare, Search, Clock, CheckCircle, XCircle, ArrowDownLeft, ArrowUpRight, Send, Radio, ExternalLink } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { format } from 'date-fns';
import { PageHeader } from '@/components/ui/page-header';
import { MetricCard } from '@/components/ui/metric-card';
import { PageContainer } from '@/components/ui/page-container';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';

type UnifiedSmsRow = {
  id: string;
  created_at: string;
  direction: 'inbound' | 'outbound';
  status: string;
  from_number: string;
  to_number: string;
  message: string | null;
  error: string | null;
  source: 'sms_logs' | 'reminder' | 'campaign';
  source_tag?: string | null;
  metadata?: Record<string, any> | null;
  provider_message_id?: string | null;
};

export default function SMSLogs() {
  const { companyId } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [testOpen, setTestOpen] = useState(false);
  const [testTo, setTestTo] = useState('');
  const [testSending, setTestSending] = useState(false);

  const { data: smsRows, isLoading } = useQuery({
    queryKey: ['sms-unified', companyId],
    queryFn: async (): Promise<UnifiedSmsRow[]> => {
      if (!companyId) return [];

      const [logsRes, reminderRes, campaignRes] = await Promise.all([
        supabase
          .from('sms_logs' as any)
          .select('id, created_at, direction, status, from_number, to_number, message, error, source, metadata, provider_message_id')
          .eq('company_id', companyId)
          .order('created_at', { ascending: false })
          .limit(200),
        supabase
          .from('reminder_logs')
          .select('id, created_at, status, recipient, message_preview, error_message, appointments(customer_phone)')
          .eq('company_id', companyId)
          .eq('channel', 'sms')
          .order('created_at', { ascending: false })
          .limit(100),
        supabase
          .from('campaign_sends')
          .select('id, created_at, status, recipient, error')
          .eq('company_id', companyId)
          .eq('channel', 'sms')
          .order('created_at', { ascending: false })
          .limit(100),
      ]);

      const rows: UnifiedSmsRow[] = [];
      for (const r of (logsRes.data as any[]) || []) {
        rows.push({ ...r, source: 'sms_logs', source_tag: r.source || null });
      }
      for (const r of (reminderRes.data as any[]) || []) {
        rows.push({
          id: `rem-${r.id}`,
          created_at: r.created_at,
          direction: 'outbound',
          status: r.status || 'sent',
          from_number: '',
          to_number: r.recipient || r.appointments?.customer_phone || '',
          message: r.message_preview || null,
          error: r.error_message || null,
          source: 'reminder',
        });
      }
      for (const r of (campaignRes.data as any[]) || []) {
        rows.push({
          id: `camp-${r.id}`,
          created_at: r.created_at,
          direction: 'outbound',
          status: r.status || 'sent',
          from_number: '',
          to_number: r.recipient || '',
          message: null,
          error: r.error || null,
          source: 'campaign',
        });
      }
      rows.sort((a, b) => +new Date(b.created_at) - +new Date(a.created_at));
      return rows;
    },
    enabled: !!companyId,
  });

  const filtered = useMemo(() => {
    if (!smsRows) return [];
    const q = searchQuery.toLowerCase();
    if (!q) return smsRows;
    return smsRows.filter(r =>
      (r.from_number || '').toLowerCase().includes(q) ||
      (r.to_number || '').toLowerCase().includes(q) ||
      (r.message || '').toLowerCase().includes(q) ||
      (r.error || '').toLowerCase().includes(q)
    );
  }, [smsRows, searchQuery]);

  const total = smsRows?.length ?? 0;
  const sent = smsRows?.filter(r => r.status === 'sent' || r.status === 'delivered' || r.status === 'received').length ?? 0;
  const failed = smsRows?.filter(r => r.status === 'failed').length ?? 0;

  const statusBadge = (status: string) => {
    if (status === 'sent' || status === 'delivered' || status === 'received') {
      return <Badge variant="outline" className="bg-green-500/10 text-green-600 border-green-500/30">{status}</Badge>;
    }
    if (status === 'failed') {
      return <Badge variant="outline" className="bg-destructive/10 text-destructive border-destructive/30">Failed</Badge>;
    }
    if (status === 'blocked') {
      return <Badge variant="outline" className="bg-amber-500/10 text-amber-600 border-amber-500/30">Blocked</Badge>;
    }
    return <Badge variant="outline" className="bg-yellow-500/10 text-yellow-600 border-yellow-500/30">{status}</Badge>;
  };

  const reachedSignalWire = (row: UnifiedSmsRow) => {
    const m = row.metadata || {};
    return m.provider === 'signalwire' && (m.provider_status || m.provider_code || row.provider_message_id);
  };

  const sourceLabel = (row: UnifiedSmsRow) => {
    if (row.source === 'campaign') return 'Campaign';
    if (row.source === 'reminder') return 'Reminder';
    switch (row.source_tag) {
      case 'campaign': return 'Campaign';
      case 'reminder': return 'Reminder';
      case 'missed_call': return 'Missed Call';
      case 'staff': return 'Staff';
      case 'aura': return 'Aura';
      default: return 'Message';
    }
  };

  const handleTestSend = async () => {
    if (!companyId || !testTo) return;
    setTestSending(true);
    try {
      const { data, error } = await supabase.functions.invoke('sms-diagnostic', {
        body: { companyId, to: testTo },
      });
      if (error) throw error;
      if ((data as any)?.ok) {
        toast.success('Test SMS reached SignalWire', {
          description: `Message SID: ${(data as any).providerMessageId || 'sent'}`,
        });
      } else {
        const code = (data as any)?.providerCode;
        toast.error(code ? `SignalWire rejected (code ${code})` : 'Test failed', {
          description: (data as any)?.error || 'Unknown error',
        });
      }
      setTestOpen(false);
    } catch (e: any) {
      toast.error('Test failed', { description: e?.message || String(e) });
    } finally {
      setTestSending(false);
    }
  };

  return (
    <DashboardLayout>
      <PageContainer>
        <div className="space-y-6 animate-fade-in">
          <PageHeader
            icon={MessageSquare}
            title="SMS / Text Logs"
            description="Inbound texts, outbound campaigns, and appointment reminders"
            showAuraBar
          />

          <div className="grid grid-cols-3 gap-4">
            <MetricCard icon={MessageSquare} value={total} label="Total Messages" iconColor="text-channel-sms" />
            <MetricCard icon={CheckCircle} value={sent} label="Delivered" valueColor="success" iconColor="text-green-400" />
            <MetricCard icon={XCircle} value={failed} label="Failed" valueColor="destructive" iconColor="text-destructive" />
          </div>

          <Card className="border-border/50">
            <CardHeader>
              <div className="flex items-start justify-between gap-2">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <MessageSquare className="w-5 h-5" /> SMS History
                  </CardTitle>
                  <CardDescription>All SMS activity across messages, campaigns, and reminders</CardDescription>
                </div>
                <Dialog open={testOpen} onOpenChange={setTestOpen}>
                  <DialogTrigger asChild>
                    <Button size="sm" variant="outline" className="gap-1">
                      <Send className="w-3.5 h-3.5" /> Send test SMS
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Send a diagnostic SMS</DialogTitle>
                      <DialogDescription>
                        Sends a one-line test to confirm whether messages are reaching SignalWire. The recipient must already exist in your Leads or Customers.
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-2 py-2">
                      <Label htmlFor="test-to">Recipient phone (E.164 or 10-digit US)</Label>
                      <Input
                        id="test-to"
                        placeholder="+13615551234"
                        value={testTo}
                        onChange={(e) => setTestTo(e.target.value)}
                      />
                    </div>
                    <DialogFooter>
                      <Button variant="ghost" onClick={() => setTestOpen(false)}>Cancel</Button>
                      <Button onClick={handleTestSend} disabled={testSending || !testTo}>
                        {testSending ? 'Sending…' : 'Send test'}
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search by phone, message, or error..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>

              <ScrollArea className="h-[500px]">
                {isLoading ? (
                  <div className="space-y-3">
                    {[1, 2, 3, 4, 5].map(i => <Skeleton key={i} className="h-20 w-full" />)}
                  </div>
                ) : filtered.length > 0 ? (
                  <div className="space-y-3 pr-4">
                    {filtered.map(row => (
                      <div key={row.id} className="p-4 rounded-lg border bg-card hover:bg-muted/30 transition-colors">
                        <div className="flex items-start gap-4">
                          <div className="w-10 h-10 rounded-full flex items-center justify-center bg-channel-sms/10 text-channel-sms">
                            {row.direction === 'inbound'
                              ? <ArrowDownLeft className="w-5 h-5" />
                              : <ArrowUpRight className="w-5 h-5" />}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-2 flex-wrap">
                              <div className="flex items-center gap-2">
                                <Badge variant="secondary" className="text-xs capitalize">{row.direction}</Badge>
                                <Badge variant="outline" className="text-xs">{sourceLabel(row)}</Badge>
                                {statusBadge(row.status)}
                              </div>
                              <span className="text-xs text-muted-foreground flex items-center gap-1 whitespace-nowrap">
                                <Clock className="w-3 h-3" />
                                {format(new Date(row.created_at), 'MMM d, h:mm a')}
                              </span>
                            </div>
                            <p className="text-sm text-muted-foreground mt-1 font-mono">
                              {row.direction === 'inbound' ? `From ${row.from_number}` : `To ${row.to_number}`}
                            </p>
                            {row.message && (
                              <p className="text-sm mt-2 line-clamp-2">{row.message}</p>
                            )}
                            {row.error && (
                              <p className="text-sm mt-2 text-destructive">Error: {row.error}</p>
                            )}
                            {(reachedSignalWire(row) || row.provider_message_id) && (
                              <div className="mt-2 flex flex-wrap items-center gap-2 text-xs">
                                <Badge variant="outline" className="bg-green-500/10 text-green-600 border-green-500/30 gap-1">
                                  <Radio className="w-3 h-3" /> Reached SignalWire
                                </Badge>
                                {row.metadata?.provider_code && (
                                  <span className="text-muted-foreground">
                                    code <span className="font-mono">{row.metadata.provider_code}</span>
                                  </span>
                                )}
                                {row.metadata?.provider_status && (
                                  <span className="text-muted-foreground">
                                    HTTP <span className="font-mono">{row.metadata.provider_status}</span>
                                  </span>
                                )}
                                {row.provider_message_id && (
                                  <span className="text-muted-foreground">
                                    SID <span className="font-mono">{row.provider_message_id}</span>
                                  </span>
                                )}
                                {row.metadata?.provider_code && (
                                  <a
                                    href="https://developer.signalwire.com/rest/compatibility-api/overview/error-codes/"
                                    target="_blank"
                                    rel="noreferrer"
                                    className="inline-flex items-center gap-1 text-primary hover:underline"
                                  >
                                    docs <ExternalLink className="w-3 h-3" />
                                  </a>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <MessageSquare className="w-12 h-12 mx-auto text-muted-foreground/50 mb-3" />
                    <p className="text-muted-foreground">No SMS activity yet</p>
                  </div>
                )}
              </ScrollArea>
            </CardContent>
          </Card>
        </div>
      </PageContainer>
    </DashboardLayout>
  );
}
