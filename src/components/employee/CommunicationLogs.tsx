import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { MessageSquare, Phone, Mail, Search, Filter, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface CommunicationLog {
  id: string;
  type: 'call' | 'sms' | 'email';
  direction: 'inbound' | 'outbound';
  customerName: string;
  customerPhone?: string;
  summary: string;
  timestamp: Date;
  duration?: number;
  status: 'completed' | 'missed' | 'pending' | 'sent' | 'failed';
}

export function CommunicationLogs() {
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('all');

  // Fetch call logs for this employee
  const { data: callLogs, isLoading: callsLoading } = useQuery({
    queryKey: ['employee-call-logs', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      const { data } = await supabase
        .from('call_logs')
        .select('*')
        .eq('employee_id', user.id)
        .order('created_at', { ascending: false })
        .limit(50);
      return data ?? [];
    },
    enabled: !!user?.id,
  });

  // Fetch reminder logs (SMS/email) for appointments assigned to this employee
  const { data: reminderLogs, isLoading: remindersLoading } = useQuery({
    queryKey: ['employee-reminder-logs', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      
      // Get appointments for this employee
      const { data: appointments } = await supabase
        .from('appointments')
        .select('id')
        .eq('employee_id', user.id);
      
      if (!appointments || appointments.length === 0) return [];
      
      const appointmentIds = appointments.map(a => a.id);
      
      const { data } = await supabase
        .from('reminder_logs')
        .select('*, appointments(customer_name, customer_phone, customer_email)')
        .in('appointment_id', appointmentIds)
        .order('created_at', { ascending: false })
        .limit(50);
      
      return data ?? [];
    },
    enabled: !!user?.id,
  });

  const isLoading = callsLoading || remindersLoading;

  // Transform data into unified format
  const communicationLogs: CommunicationLog[] = [
    // Call logs
    ...(callLogs ?? []).map((log): CommunicationLog => ({
      id: log.id,
      type: 'call',
      direction: log.direction as 'inbound' | 'outbound',
      customerName: log.customer_name || 'Unknown',
      customerPhone: log.customer_phone || log.from_number || log.to_number || undefined,
      summary: log.summary || `${log.direction} call - ${log.status}`,
      timestamp: new Date(log.created_at),
      duration: log.duration_seconds || undefined,
      status: log.status === 'completed' ? 'completed' : log.status === 'missed' ? 'missed' : 'pending',
    })),
    // Reminder logs (SMS and email)
    ...(reminderLogs ?? []).map((log): CommunicationLog => ({
      id: log.id,
      type: log.channel as 'sms' | 'email',
      direction: 'outbound',
      customerName: (log.appointments as any)?.customer_name || 'Unknown',
      customerPhone: log.recipient || (log.appointments as any)?.customer_phone || undefined,
      summary: log.message_preview || `${log.reminder_type} reminder sent`,
      timestamp: new Date(log.created_at),
      status: log.status === 'sent' ? 'sent' : log.status === 'failed' ? 'failed' : 'pending',
    })),
  ].sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());

  const filteredLogs = communicationLogs.filter((log) => {
    const matchesSearch =
      log.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.summary.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesTab =
      activeTab === 'all' ||
      (activeTab === 'calls' && log.type === 'call') ||
      (activeTab === 'sms' && log.type === 'sms') ||
      (activeTab === 'email' && log.type === 'email');
    return matchesSearch && matchesTab;
  });

  const getTypeIcon = (type: CommunicationLog['type']) => {
    switch (type) {
      case 'call':
        return Phone;
      case 'sms':
        return MessageSquare;
      case 'email':
        return Mail;
    }
  };

  const getStatusStyle = (status: CommunicationLog['status']) => {
    switch (status) {
      case 'completed':
      case 'sent':
        return 'bg-green-500/10 text-green-600 border-green-500/30';
      case 'missed':
      case 'failed':
        return 'bg-red-500/10 text-red-600 border-red-500/30';
      case 'pending':
        return 'bg-yellow-500/10 text-yellow-600 border-yellow-500/30';
    }
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const formatTimeAgo = (date: Date) => {
    const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
    if (seconds < 60) return 'Just now';
    const mins = Math.floor(seconds / 60);
    if (mins < 60) return `${mins}m ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  };

  return (
    <Card className="border-border/50">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <MessageSquare className="w-5 h-5" />
              Communication Logs
            </CardTitle>
            <CardDescription className="text-white/70">
              View your call, SMS, and email history with customers
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Search and Filter */}
        <div className="flex gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search by customer or message..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
          <Button variant="outline" size="icon">
            <Filter className="w-4 h-4" />
          </Button>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="calls" className="gap-1">
              <Phone className="w-3 h-3" />
              Calls
            </TabsTrigger>
            <TabsTrigger value="sms" className="gap-1">
              <MessageSquare className="w-3 h-3" />
              SMS
            </TabsTrigger>
            <TabsTrigger value="email" className="gap-1">
              <Mail className="w-3 h-3" />
              Email
            </TabsTrigger>
          </TabsList>

          <TabsContent value={activeTab} className="mt-4">
            {isLoading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-24 w-full" />
                ))}
              </div>
            ) : filteredLogs.length > 0 ? (
              <div className="space-y-3">
                {filteredLogs.map((log) => {
                  const Icon = getTypeIcon(log.type);
                  return (
                    <div
                      key={log.id}
                      className="p-4 rounded-lg border bg-card hover:bg-muted/30 transition-colors"
                    >
                      <div className="flex items-start gap-4">
                        <div
                          className={cn(
                            'w-10 h-10 rounded-full flex items-center justify-center',
                            log.direction === 'inbound'
                              ? 'bg-secondary/10 text-secondary'
                              : 'bg-secondary/10 text-secondary'
                          )}
                        >
                          <Icon className="w-5 h-5" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2">
                            <div className="flex items-center gap-2">
                              <p className="font-medium truncate">{log.customerName}</p>
                              <Badge variant="outline" className={getStatusStyle(log.status)}>
                                {log.status}
                              </Badge>
                            </div>
                            <span className="text-xs text-muted-foreground flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {formatTimeAgo(log.timestamp)}
                            </span>
                          </div>
                          {log.customerPhone && (
                            <p className="text-sm text-muted-foreground">{log.customerPhone}</p>
                          )}
                          <p className="text-sm mt-1">{log.summary}</p>
                          {log.duration && (
                            <p className="text-xs text-muted-foreground mt-1">
                              Duration: {formatDuration(log.duration)}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-12">
                <MessageSquare className="w-12 h-12 mx-auto text-white/50 mb-3" />
                <p className="text-white/70">No communication logs found</p>
                <p className="text-sm text-white/60">
                  Your calls, SMS, and emails will appear here
                </p>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
