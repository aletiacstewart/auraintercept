import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Mail, Search, Clock, CheckCircle, XCircle, AlertCircle, ExternalLink } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { format } from 'date-fns';

export default function EmailLogs() {
  const { companyId } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');

  // Fetch email reminder logs
  const { data: emailLogs, isLoading } = useQuery({
    queryKey: ['email-logs', companyId],
    queryFn: async () => {
      if (!companyId) return [];
      
      const { data } = await supabase
        .from('reminder_logs')
        .select('*, appointments(customer_name, customer_email, service_type)')
        .eq('company_id', companyId)
        .eq('channel', 'email')
        .order('created_at', { ascending: false })
        .limit(100);
      
      return data ?? [];
    },
    enabled: !!companyId,
  });

  const filteredLogs = emailLogs?.filter((log) => {
    const customerName = (log.appointments as any)?.customer_name || '';
    const customerEmail = (log.appointments as any)?.customer_email || log.recipient || '';
    const messagePreview = log.message_preview || '';
    
    return (
      customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      customerEmail.toLowerCase().includes(searchQuery.toLowerCase()) ||
      messagePreview.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }) ?? [];

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'sent':
      case 'delivered':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'failed':
      case 'bounced':
        return <XCircle className="h-4 w-4 text-destructive" />;
      default:
        return <AlertCircle className="h-4 w-4 text-yellow-500" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'sent':
      case 'delivered':
        return <Badge variant="outline" className="bg-green-500/10 text-green-600 border-green-500/30">Sent</Badge>;
      case 'failed':
        return <Badge variant="outline" className="bg-destructive/10 text-destructive border-destructive/30">Failed</Badge>;
      case 'bounced':
        return <Badge variant="outline" className="bg-orange-500/10 text-orange-600 border-orange-500/30">Bounced</Badge>;
      default:
        return <Badge variant="outline" className="bg-yellow-500/10 text-yellow-600 border-yellow-500/30">Pending</Badge>;
    }
  };

  const formatReminderType = (type: string) => {
    return type?.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()) || 'Email';
  };

  // Stats
  const totalEmails = emailLogs?.length ?? 0;
  const sentEmails = emailLogs?.filter(l => l.status === 'sent' || l.status === 'delivered').length ?? 0;
  const failedEmails = emailLogs?.filter(l => l.status === 'failed' || l.status === 'bounced').length ?? 0;

  return (
    <DashboardLayout>
      <div className="space-y-6 animate-fade-in">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Email Logs</h1>
          <p className="text-muted-foreground">
            View email communication history with customers
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-3 gap-4">
          <Card className="bg-gradient-to-br from-slate-700 to-slate-800 border-slate-600/50">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/20">
                  <Mail className="h-5 w-5 text-white" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-accent">{totalEmails}</p>
                  <p className="text-xs text-white/70">Total Emails</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-br from-slate-700 to-slate-800 border-slate-600/50">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-green-500/20">
                  <CheckCircle className="h-5 w-5 text-green-400" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-accent">{sentEmails}</p>
                  <p className="text-xs text-white/70">Delivered</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-br from-slate-700 to-slate-800 border-slate-600/50">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-destructive/20">
                  <XCircle className="h-5 w-5 text-destructive" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-accent">{failedEmails}</p>
                  <p className="text-xs text-white/70">Failed</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Email Logs Card */}
        <Card className="border-border/50">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Mail className="w-5 h-5" />
                  Email History
                </CardTitle>
                <CardDescription>
                  All email reminders and notifications sent to customers
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search by customer, email, or message..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>

            {/* Email List */}
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
                        <div className="w-10 h-10 rounded-full flex items-center justify-center bg-primary/10 text-primary">
                          <Mail className="w-5 h-5" />
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
                            {(log.appointments as any)?.customer_email || log.recipient}
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
                  <Mail className="w-12 h-12 mx-auto text-muted-foreground mb-3" />
                  <p className="text-muted-foreground">No email logs found</p>
                  <p className="text-sm text-muted-foreground">
                    Email reminders and notifications will appear here
                  </p>
                </div>
              )}
            </ScrollArea>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
