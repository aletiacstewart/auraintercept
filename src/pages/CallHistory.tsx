import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { AuraEmptyState } from '@/components/ui/aura-empty-state';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { 
  Phone, 
  PhoneIncoming, 
  PhoneOutgoing, 
  Search, 
  Clock, 
  CheckCircle2, 
  XCircle, 
  AlertCircle,
  MessageSquare,
  Volume2
} from 'lucide-react';
import { format, formatDistanceToNow } from 'date-fns';
import { cn } from '@/lib/utils';
import { AudioPlayer } from '@/components/calls/AudioPlayer';
import { TranscriptViewer } from '@/components/calls/TranscriptViewer';
import { PageHeader } from '@/components/ui/page-header';
import { MetricCard } from '@/components/ui/metric-card';
import { PageContainer } from '@/components/ui/page-container';
import { useIndustryPack } from '@/hooks/useIndustryPack';
import { getPageHeader } from '@/lib/industryNavLabels';

interface CallLog {
  id: string;
  company_id: string;
  direction: 'inbound' | 'outbound';
  status: string;
  from_number: string | null;
  to_number: string | null;
  customer_name: string | null;
  customer_phone: string | null;
  call_sid: string | null;
  started_at: string;
  answered_at: string | null;
  ended_at: string | null;
  duration_seconds: number | null;
  purpose: string | null;
  transcript: unknown;
  summary: string | null;
  metadata: unknown;
  recording_url: string | null;
  recording_duration_seconds: number | null;
}

interface TranscriptMessage {
  role: string;
  content: string;
}

const statusConfig: Record<string, { label: string; icon: React.ElementType; color: string }> = {
  'initiated': { label: 'Initiated', icon: Clock, color: 'text-secondary bg-secondary/10' },
  'ringing': { label: 'Ringing', icon: Phone, color: 'text-warning bg-warning/10' },
  'in-progress': { label: 'In Progress', icon: Phone, color: 'text-secondary bg-secondary/10' },
  'answered': { label: 'Answered', icon: CheckCircle2, color: 'text-secondary bg-secondary/10' },
  'completed': { label: 'Completed', icon: CheckCircle2, color: 'text-secondary bg-secondary/10' },
  'busy': { label: 'Busy', icon: AlertCircle, color: 'text-warning bg-warning/10' },
  'no-answer': { label: 'No Answer', icon: XCircle, color: 'text-destructive bg-destructive/10' },
  'failed': { label: 'Failed', icon: XCircle, color: 'text-destructive bg-destructive/10' },
  'canceled': { label: 'Canceled', icon: XCircle, color: 'text-muted-foreground bg-muted' },
};

export default function CallHistory() {
  const { companyId, userRole } = useAuth();
  const { pack } = useIndustryPack();
  const callsHeader = getPageHeader('calls', pack);
  const [searchQuery, setSearchQuery] = useState('');
  const [directionFilter, setDirectionFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedCall, setSelectedCall] = useState<CallLog | null>(null);

  const { data: calls, isLoading } = useQuery({
    queryKey: ['call-logs', companyId, userRole],
    queryFn: async () => {
      let query = supabase
        .from('call_logs')
        .select('*')
        .order('started_at', { ascending: false })
        .limit(100);

      // Company admins see their company's calls
      if (userRole === 'company_admin' && companyId) {
        query = query.eq('company_id', companyId);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as CallLog[];
    },
    enabled: !!companyId || userRole === 'platform_admin',
  });

  // Calculate stats
  const stats = {
    total: calls?.length || 0,
    inbound: calls?.filter(c => c.direction === 'inbound').length || 0,
    outbound: calls?.filter(c => c.direction === 'outbound').length || 0,
    completed: calls?.filter(c => c.status === 'completed').length || 0,
    avgDuration: calls?.filter(c => c.duration_seconds)
      .reduce((acc, c) => acc + (c.duration_seconds || 0), 0) / 
      (calls?.filter(c => c.duration_seconds).length || 1) || 0,
  };

  // Filter calls
  const filteredCalls = calls?.filter(call => {
    const matchesSearch = 
      !searchQuery ||
      call.customer_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      call.customer_phone?.includes(searchQuery) ||
      call.from_number?.includes(searchQuery) ||
      call.to_number?.includes(searchQuery);
    
    const matchesDirection = directionFilter === 'all' || call.direction === directionFilter;
    const matchesStatus = statusFilter === 'all' || call.status === statusFilter;

    return matchesSearch && matchesDirection && matchesStatus;
  });

  const formatDuration = (seconds: number | null) => {
    if (!seconds) return '-';
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <DashboardLayout>
      <PageContainer>
        <div className="space-y-6 animate-fade-in">
        <PageHeader
          icon={Phone}
          title={callsHeader.title}
          description={callsHeader.description}
          showAuraBar
        />

        {/* Stats Cards */}
        <div className="grid gap-4 grid-cols-2 md:grid-cols-4">
          <MetricCard
            icon={Phone}
            value={stats.total}
            label="Total Calls"
          />
          <MetricCard
            icon={PhoneIncoming}
            value={stats.inbound}
            label="Inbound"
            valueColor="success"
            iconColor="text-green-400"
          />
          <MetricCard
            icon={PhoneOutgoing}
            value={stats.outbound}
            label="Outbound"
            iconColor="text-secondary"
          />
          <MetricCard
            icon={Clock}
            value={formatDuration(Math.round(stats.avgDuration))}
            label="Avg Duration"
          />
        </div>

        {/* Filters and Table */}
        <Card className="border-border/50">
          <CardHeader>
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search by name or phone..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>
              <Select value={directionFilter} onValueChange={setDirectionFilter}>
                <SelectTrigger className="w-[150px]">
                  <SelectValue placeholder="Direction" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Directions</SelectItem>
                  <SelectItem value="inbound">Inbound</SelectItem>
                  <SelectItem value="outbound">Outbound</SelectItem>
                </SelectContent>
              </Select>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[150px]">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="no-answer">No Answer</SelectItem>
                  <SelectItem value="busy">Busy</SelectItem>
                  <SelectItem value="failed">Failed</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-3">
                {[1, 2, 3, 4, 5].map((i) => (
                  <Skeleton key={i} className="h-16 w-full" />
                ))}
              </div>
            ) : filteredCalls && filteredCalls.length > 0 ? (
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Direction</TableHead>
                      <TableHead>Customer</TableHead>
                      <TableHead>Phone</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Duration</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredCalls.map((call) => {
                      const status = statusConfig[call.status] || statusConfig['initiated'];
                      const StatusIcon = status.icon;

                      return (
                        <TableRow 
                          key={call.id} 
                          className="cursor-pointer hover:bg-muted/50"
                          onClick={() => setSelectedCall(call)}
                        >
                          <TableCell>
                            <div className="flex items-center gap-2">
                              {call.direction === 'inbound' ? (
                                <PhoneIncoming className="w-4 h-4 text-channel-voice" />
                              ) : (
                                <PhoneOutgoing className="w-4 h-4 text-channel-voice" />
                              )}
                              <span className="capitalize text-sm">{call.direction}</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <span className="font-medium">
                              {call.customer_name || 'Unknown'}
                            </span>
                          </TableCell>
                          <TableCell className="text-muted-foreground">
                            {call.customer_phone || call.from_number || call.to_number}
                          </TableCell>
                          <TableCell>
                            <Badge className={cn('gap-1', status.color)}>
                              <StatusIcon className="w-3 h-3" />
                              {status.label}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {formatDuration(call.duration_seconds)}
                          </TableCell>
                          <TableCell className="text-muted-foreground text-sm">
                            {formatDistanceToNow(new Date(call.started_at), { addSuffix: true })}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              {call.recording_url && (
                                <Volume2 className="w-4 h-4 text-primary" />
                              )}
                              {Array.isArray(call.transcript) && call.transcript.length > 0 && (
                                <MessageSquare className="w-4 h-4 text-muted-foreground" />
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <AuraEmptyState
                icon={Phone}
                title="No calls found"
                description={
                  searchQuery || directionFilter !== 'all' || statusFilter !== 'all'
                    ? 'Try adjusting your filters.'
                    : 'Call history will appear here once calls are made.'
                }
              />
            )}
          </CardContent>
        </Card>
      </div>
      </PageContainer>
      {/* Call Details Dialog */}
      <Dialog open={!!selectedCall} onOpenChange={() => setSelectedCall(null)}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {selectedCall?.direction === 'inbound' ? (
                <PhoneIncoming className="w-5 h-5 text-channel-voice" />
              ) : (
                <PhoneOutgoing className="w-5 h-5 text-channel-voice" />
              )}
              Call Details
            </DialogTitle>
            <DialogDescription>
              {selectedCall && format(new Date(selectedCall.started_at), 'PPpp')}
            </DialogDescription>
          </DialogHeader>

          {selectedCall && (
            <div className="space-y-6">
              {/* Call Info Grid */}
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">Customer</p>
                  <p className="font-medium">{selectedCall.customer_name || 'Unknown'}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Phone</p>
                  <p className="font-medium">{selectedCall.customer_phone || selectedCall.from_number}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Direction</p>
                  <p className="font-medium capitalize">{selectedCall.direction}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Status</p>
                  <Badge className={cn('gap-1', statusConfig[selectedCall.status]?.color)}>
                    {statusConfig[selectedCall.status]?.label || selectedCall.status}
                  </Badge>
                </div>
                <div>
                  <p className="text-muted-foreground">Duration</p>
                  <p className="font-medium">{formatDuration(selectedCall.duration_seconds)}</p>
                </div>
                {selectedCall.purpose && (
                  <div>
                    <p className="text-muted-foreground">Purpose</p>
                    <p className="font-medium capitalize">{selectedCall.purpose}</p>
                  </div>
                )}
              </div>

              {/* Call Recording */}
              {selectedCall.recording_url && (
                <AudioPlayer 
                  url={selectedCall.recording_url} 
                  duration={selectedCall.recording_duration_seconds}
                />
              )}

              {/* Transcript */}
              {Array.isArray(selectedCall.transcript) && selectedCall.transcript.length > 0 && (
                <TranscriptViewer 
                  transcript={selectedCall.transcript as TranscriptMessage[]}
                  customerName={selectedCall.customer_name || 'Customer'}
                />
              )}

              {/* Summary */}
              {selectedCall.summary && (
                <div>
                  <h4 className="font-medium mb-2">Summary</h4>
                  <p className="text-sm text-muted-foreground">{selectedCall.summary}</p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
