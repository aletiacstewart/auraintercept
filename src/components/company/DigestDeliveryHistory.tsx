import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { format, formatDistanceToNow } from 'date-fns';
import { History, Mail, CheckCircle2, XCircle, Calendar, FileText, TrendingUp, Download, RotateCcw, Loader2, AlertTriangle, Ban } from 'lucide-react';

interface DeliveryLog {
  id: string;
  digest_type: string;
  recipient_email: string;
  status: string;
  error_message: string | null;
  sent_at: string;
}

export function DigestDeliveryHistory() {
  const { companyId } = useAuth();
  const queryClient = useQueryClient();
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [retrying, setRetrying] = useState<string | null>(null);

  const { data: logs, isLoading } = useQuery({
    queryKey: ['digest-delivery-logs', companyId, typeFilter],
    queryFn: async () => {
      if (!companyId) return [];
      
      let query = supabase
        .from('digest_delivery_logs')
        .select('*')
        .eq('company_id', companyId)
        .order('sent_at', { ascending: false })
        .limit(100);
      
      if (typeFilter !== 'all') {
        query = query.eq('digest_type', typeFilter);
      }
      
      const { data, error } = await query;
      if (error) throw error;
      return data as DeliveryLog[];
    },
    enabled: !!companyId,
  });

  const retryDelivery = async (log: DeliveryLog) => {
    if (!companyId) return;

    setRetrying(log.id);

    try {
      const functionName = `${log.digest_type}-digest`;
      const { data, error } = await supabase.functions.invoke(functionName, {
        body: { test: true, company_id: companyId }
      });

      if (error) throw error;

      if (data?.success) {
        toast.success(`${log.digest_type} digest resent successfully`, {
          description: `Email sent to ${log.recipient_email}`
        });
        // Refresh the logs
        queryClient.invalidateQueries({ queryKey: ['digest-delivery-logs'] });
      } else if (data?.error) {
        toast.error(`Retry failed: ${data.error}`);
      }
    } catch (error: any) {
      console.error('Error retrying digest:', error);
      toast.error(`Failed to retry ${log.digest_type} digest`, {
        description: error.message || 'Please try again later.'
      });
    } finally {
      setRetrying(null);
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'weekly': return <Calendar className="h-4 w-4 text-blue-500" />;
      case 'monthly': return <FileText className="h-4 w-4 text-purple-500" />;
      case 'quarterly': return <TrendingUp className="h-4 w-4 text-indigo-500" />;
      default: return <FileText className="h-4 w-4" />;
    }
  };

  const getTypeBadge = (type: string) => {
    const colors: Record<string, string> = {
      weekly: 'bg-blue-500/20 text-blue-700 border-blue-500/30',
      monthly: 'bg-purple-500/20 text-purple-700 border-purple-500/30',
      quarterly: 'bg-indigo-500/20 text-indigo-700 border-indigo-500/30',
    };
    return (
      <Badge variant="outline" className={`capitalize ${colors[type] || ''}`}>
        {type}
      </Badge>
    );
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'sent':
        return (
          <Badge className="gap-1 bg-green-500/20 text-green-700 border-green-500/30">
            <CheckCircle2 className="h-3 w-3" /> Sent
          </Badge>
        );
      case 'bounced':
        return (
          <Badge className="gap-1 bg-orange-500/20 text-orange-700 border-orange-500/30">
            <Ban className="h-3 w-3" /> Bounced
          </Badge>
        );
      case 'complained':
        return (
          <Badge className="gap-1 bg-yellow-500/20 text-yellow-700 border-yellow-500/30">
            <AlertTriangle className="h-3 w-3" /> Spam
          </Badge>
        );
      case 'failed':
      default:
        return (
          <Badge variant="destructive" className="gap-1">
            <XCircle className="h-3 w-3" /> Failed
          </Badge>
        );
    }
  };

  const exportToCSV = () => {
    if (!logs || logs.length === 0) return;

    const headers = ['Date', 'Type', 'Recipient', 'Status', 'Error'];
    const rows = logs.map(log => [
      format(new Date(log.sent_at), 'yyyy-MM-dd HH:mm:ss'),
      log.digest_type,
      log.recipient_email,
      log.status,
      log.error_message || ''
    ]);

    const csvContent = [headers, ...rows].map(row => row.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `digest-delivery-history-${format(new Date(), 'yyyy-MM-dd')}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-64" />
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[1, 2, 3, 4, 5].map(i => (
              <Skeleton key={i} className="h-16 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <History className="h-5 w-5" />
              Delivery History
            </CardTitle>
            <CardDescription>
              Track when each report was sent and to whom
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="Filter by type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="weekly">Weekly</SelectItem>
                <SelectItem value="monthly">Monthly</SelectItem>
                <SelectItem value="quarterly">Quarterly</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" size="sm" onClick={exportToCSV} disabled={!logs?.length}>
              <Download className="h-4 w-4 mr-1" />
              Export
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {!logs || logs.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Mail className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p>No digest emails have been sent yet.</p>
            <p className="text-sm mt-1">Delivery history will appear here once reports are sent.</p>
          </div>
        ) : (
          <ScrollArea className="h-[400px]">
            <div className="space-y-3">
              {logs.map(log => (
                <div
                  key={log.id}
                  className="flex items-center justify-between p-3 border border-border rounded-lg hover:bg-muted/30 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    {getTypeIcon(log.digest_type)}
                    <div>
                      <div className="flex items-center gap-2">
                        {getTypeBadge(log.digest_type)}
                        {getStatusBadge(log.status)}
                      </div>
                      <div className="flex items-center gap-2 mt-1 text-sm text-muted-foreground">
                        <Mail className="h-3 w-3" />
                        <span>{log.recipient_email}</span>
                      </div>
                      {log.error_message && (
                        <p className="text-xs text-destructive mt-1">{log.error_message}</p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    {(log.status === 'failed' || log.status === 'bounced') && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => retryDelivery(log)}
                        disabled={retrying === log.id}
                        className="text-xs"
                      >
                        {retrying === log.id ? (
                          <Loader2 className="h-3 w-3 animate-spin mr-1" />
                        ) : (
                          <RotateCcw className="h-3 w-3 mr-1" />
                        )}
                        Retry
                      </Button>
                    )}
                    <div className="text-right text-sm text-muted-foreground">
                      <div>{format(new Date(log.sent_at), 'MMM d, yyyy')}</div>
                      <div className="text-xs">{formatDistanceToNow(new Date(log.sent_at), { addSuffix: true })}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
}
