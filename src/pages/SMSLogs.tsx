import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { ScrollArea } from '@/components/ui/scroll-area';
import { MessageSquare, Search, Clock, CheckCircle, XCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { format } from 'date-fns';
import { PageHeader } from '@/components/ui/page-header';
import { MetricCard } from '@/components/ui/metric-card';
import { PageContainer } from '@/components/ui/page-container';

export default function SMSLogs() {
  const { companyId } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');

  // Fetch SMS reminder logs
  const { data: smsLogs, isLoading } = useQuery({
    queryKey: ['sms-logs', companyId],
    queryFn: async () => {
      if (!companyId) return [];
      
      const { data } = await supabase
        .from('reminder_logs')
        .select('*, appointments(customer_name, customer_phone, service_type)')
        .eq('company_id', companyId)
        .eq('channel', 'sms')
        .order('created_at', { ascending: false })
        .limit(100);
      
      return data ?? [];
    },
    enabled: !!companyId,
  });

  const filteredLogs = smsLogs?.filter((log) => {
    const customerName = (log.appointments as any)?.customer_name || '';
    const customerPhone = (log.appointments as any)?.customer_phone || log.recipient || '';
    const messagePreview = log.message_preview || '';
    
    return (
      customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      customerPhone.toLowerCase().includes(searchQuery.toLowerCase()) ||
      messagePreview.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }) ?? [];

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'sent':
      case 'delivered':
        return <Badge variant="outline" className="bg-green-500/10 text-green-600 border-green-500/30">Sent</Badge>;
      case 'failed':
        return <Badge variant="outline" className="bg-destructive/10 text-destructive border-destructive/30">Failed</Badge>;
      default:
        return <Badge variant="outline" className="bg-yellow-500/10 text-yellow-600 border-yellow-500/30">Pending</Badge>;
    }
  };

  const formatReminderType = (type: string) => {
    return type?.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()) || 'SMS';
  };

  // Stats
  const totalSMS = smsLogs?.length ?? 0;
  const sentSMS = smsLogs?.filter(l => l.status === 'sent' || l.status === 'delivered').length ?? 0;
  const failedSMS = smsLogs?.filter(l => l.status === 'failed').length ?? 0;

  return (
    <DashboardLayout>
      <PageContainer>
        <div className="space-y-6 animate-fade-in">
        <PageHeader
          icon={MessageSquare}
          title="SMS / Text Logs"
          description="View SMS and text message history with customers"
          showAuraBar
        />

        {/* Stats Cards */}
        <div className="grid grid-cols-3 gap-4">
          <MetricCard
            icon={MessageSquare}
            value={totalSMS}
            label="Total Messages"
            iconColor="text-channel-sms"
          />
          <MetricCard
            icon={CheckCircle}
            value={sentSMS}
            label="Delivered"
            valueColor="success"
            iconColor="text-green-400"
          />
          <MetricCard
            icon={XCircle}
            value={failedSMS}
            label="Failed"
            valueColor="destructive"
            iconColor="text-destructive"
          />
        </div>

        {/* SMS Logs Card */}
        <Card className="border-border/50">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <MessageSquare className="w-5 h-5" />
                  SMS History
                </CardTitle>
                <CardDescription className="text-muted-foreground">
                  All text messages and SMS reminders sent to customers
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search by customer, phone, or message..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>

            {/* SMS List */}
            <ScrollArea className="h-[500px]">
              {isLoading ? (
                <div className="space-y-3">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <Skeleton key={i} className="h-24 w-full" />
                  ))}
                </div>
              ) : filteredLogs.length > 0 ? (
                <div className="space-y-3 pr-4">
                  {filteredLogs.map((log) => (
                    <div
                      key={log.id}
                      className="p-4 rounded-lg border bg-card hover:bg-muted/30 transition-colors"
                    >
                        <div className="flex items-start gap-4">
                        <div className="w-10 h-10 rounded-full flex items-center justify-center bg-channel-sms/10 text-channel-sms">
                          <MessageSquare className="w-5 h-5" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2">
                            <div className="flex items-center gap-2">
                              <p className="font-medium truncate">
                                {(log.appointments as any)?.customer_name || 'Unknown Customer'}
                              </p>
                              {getStatusBadge(log.status)}
                            </div>
                            <span className="text-xs text-muted-foreground flex items-center gap-1 whitespace-nowrap">
                              <Clock className="w-3 h-3" />
                              {format(new Date(log.created_at), 'MMM d, h:mm a')}
                            </span>
                          </div>
                          <p className="text-sm text-muted-foreground">
                            {(log.appointments as any)?.customer_phone || log.recipient}
                          </p>
                          <div className="flex items-center gap-2 mt-1">
                            <Badge variant="secondary" className="text-xs">
                              {formatReminderType(log.reminder_type)}
                            </Badge>
                            {(log.appointments as any)?.service_type && (
                              <span className="text-xs text-muted-foreground">
                                • {(log.appointments as any).service_type}
                              </span>
                            )}
                          </div>
                          {log.message_preview && (
                            <p className="text-sm mt-2 text-muted-foreground line-clamp-2">
                              {log.message_preview}
                            </p>
                          )}
                          {log.error_message && (
                            <p className="text-sm mt-2 text-destructive">
                              Error: {log.error_message}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <MessageSquare className="w-12 h-12 mx-auto text-white/50 mb-3" />
                  <p className="text-white/70">No SMS logs found</p>
                  <p className="text-sm text-white/60">
                    Text message reminders and notifications will appear here
                  </p>
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
