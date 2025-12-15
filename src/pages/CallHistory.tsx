import { useState, useRef, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
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
  Calendar,
  Play,
  Pause,
  Volume2
} from 'lucide-react';
import { format, formatDistanceToNow } from 'date-fns';
import { cn } from '@/lib/utils';

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
  'initiated': { label: 'Initiated', icon: Clock, color: 'text-blue-500 bg-blue-500/10' },
  'ringing': { label: 'Ringing', icon: Phone, color: 'text-yellow-500 bg-yellow-500/10' },
  'in-progress': { label: 'In Progress', icon: Phone, color: 'text-green-500 bg-green-500/10' },
  'answered': { label: 'Answered', icon: CheckCircle2, color: 'text-green-500 bg-green-500/10' },
  'completed': { label: 'Completed', icon: CheckCircle2, color: 'text-green-500 bg-green-500/10' },
  'busy': { label: 'Busy', icon: AlertCircle, color: 'text-orange-500 bg-orange-500/10' },
  'no-answer': { label: 'No Answer', icon: XCircle, color: 'text-red-500 bg-red-500/10' },
  'failed': { label: 'Failed', icon: XCircle, color: 'text-red-500 bg-red-500/10' },
  'canceled': { label: 'Canceled', icon: XCircle, color: 'text-muted-foreground bg-muted' },
};

export default function CallHistory() {
  const { companyId, userRole } = useAuth();
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
      <div className="space-y-6 animate-fade-in">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Call History</h1>
          <p className="text-muted-foreground">
            View and analyze all AI agent call activity
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card className="border-border/50">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Calls</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{stats.total}</div>
            </CardContent>
          </Card>
          <Card className="border-border/50">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <PhoneIncoming className="w-4 h-4" /> Inbound
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-green-600">{stats.inbound}</div>
            </CardContent>
          </Card>
          <Card className="border-border/50">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <PhoneOutgoing className="w-4 h-4" /> Outbound
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-blue-600">{stats.outbound}</div>
            </CardContent>
          </Card>
          <Card className="border-border/50">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Avg Duration</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{formatDuration(Math.round(stats.avgDuration))}</div>
            </CardContent>
          </Card>
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
                                <PhoneIncoming className="w-4 h-4 text-green-600" />
                              ) : (
                                <PhoneOutgoing className="w-4 h-4 text-blue-600" />
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
              <div className="text-center py-12">
                <Phone className="w-12 h-12 mx-auto text-muted-foreground mb-3" />
                <p className="text-muted-foreground">No calls found</p>
                <p className="text-sm text-muted-foreground">
                  {searchQuery || directionFilter !== 'all' || statusFilter !== 'all'
                    ? 'Try adjusting your filters'
                    : 'Call history will appear here once calls are made'}
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Call Details Dialog */}
      <Dialog open={!!selectedCall} onOpenChange={() => setSelectedCall(null)}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {selectedCall?.direction === 'inbound' ? (
                <PhoneIncoming className="w-5 h-5 text-green-600" />
              ) : (
                <PhoneOutgoing className="w-5 h-5 text-blue-600" />
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
                <div>
                  <h4 className="font-medium mb-3 flex items-center gap-2">
                    <MessageSquare className="w-4 h-4" />
                    Transcript
                  </h4>
                  <div className="space-y-3 max-h-64 overflow-y-auto p-3 bg-muted/50 rounded-lg">
                    {(selectedCall.transcript as TranscriptMessage[]).map((msg, i) => (
                      <div 
                        key={i} 
                        className={cn(
                          'p-3 rounded-lg max-w-[85%]',
                          msg.role === 'user' 
                            ? 'bg-primary/10 ml-auto' 
                            : 'bg-background border'
                        )}
                      >
                        <p className="text-xs text-muted-foreground mb-1 capitalize">
                          {msg.role === 'user' ? 'Customer' : 'AI Agent'}
                        </p>
                        <p className="text-sm">{msg.content}</p>
                      </div>
                    ))}
                  </div>
                </div>
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

// Audio Player Component
interface AudioPlayerProps {
  url: string;
  duration: number | null;
}

function AudioPlayer({ url, duration }: AudioPlayerProps) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [audioDuration, setAudioDuration] = useState(duration || 0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleTimeUpdate = () => setCurrentTime(audio.currentTime);
    const handleLoadedMetadata = () => {
      setIsLoading(false);
      if (audio.duration && !isNaN(audio.duration)) {
        setAudioDuration(audio.duration);
      }
    };
    const handleEnded = () => setIsPlaying(false);
    const handleCanPlay = () => setIsLoading(false);
    const handleError = () => {
      setIsLoading(false);
      setError('Unable to load recording');
    };

    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('loadedmetadata', handleLoadedMetadata);
    audio.addEventListener('ended', handleEnded);
    audio.addEventListener('canplay', handleCanPlay);
    audio.addEventListener('error', handleError);

    return () => {
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
      audio.removeEventListener('ended', handleEnded);
      audio.removeEventListener('canplay', handleCanPlay);
      audio.removeEventListener('error', handleError);
    };
  }, []);

  const togglePlayPause = () => {
    const audio = audioRef.current;
    if (!audio || isLoading || error) return;

    if (isPlaying) {
      audio.pause();
    } else {
      audio.play().catch(() => setError('Unable to play recording'));
    }
    setIsPlaying(!isPlaying);
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const audio = audioRef.current;
    if (!audio) return;
    
    const newTime = parseFloat(e.target.value);
    audio.currentTime = newTime;
    setCurrentTime(newTime);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const progress = audioDuration > 0 ? (currentTime / audioDuration) * 100 : 0;

  return (
    <div className="space-y-2">
      <h4 className="font-medium flex items-center gap-2">
        <Volume2 className="w-4 h-4 text-primary" />
        Call Recording
        {audioDuration > 0 && (
          <span className="text-xs text-muted-foreground font-normal">
            ({formatTime(audioDuration)})
          </span>
        )}
      </h4>
      <div className="bg-gradient-to-r from-primary/5 to-primary/10 rounded-lg p-4 border border-primary/20">
        <audio ref={audioRef} src={url} preload="metadata" />
        
        {error ? (
          <div className="flex items-center gap-2 text-destructive text-sm">
            <XCircle className="w-4 h-4" />
            {error}
          </div>
        ) : (
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={togglePlayPause}
              disabled={isLoading}
              className={cn(
                "h-12 w-12 rounded-full transition-all shadow-md",
                isPlaying 
                  ? "bg-primary text-primary-foreground hover:bg-primary/90 scale-105" 
                  : "bg-primary text-primary-foreground hover:bg-primary/90"
              )}
            >
              {isLoading ? (
                <div className="h-4 w-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
              ) : isPlaying ? (
                <Pause className="h-5 w-5" />
              ) : (
                <Play className="h-5 w-5 ml-0.5" />
              )}
            </Button>
            
            <div className="flex-1 space-y-2">
              {/* Custom progress bar */}
              <div 
                className="relative h-2 bg-muted rounded-full overflow-hidden cursor-pointer group"
                onClick={(e) => {
                  const rect = e.currentTarget.getBoundingClientRect();
                  const x = e.clientX - rect.left;
                  const percentage = x / rect.width;
                  const newTime = percentage * audioDuration;
                  if (audioRef.current) {
                    audioRef.current.currentTime = newTime;
                    setCurrentTime(newTime);
                  }
                }}
              >
                <div 
                  className="absolute h-full bg-primary rounded-full transition-all"
                  style={{ width: `${progress}%` }}
                />
                <div 
                  className="absolute h-4 w-4 bg-primary rounded-full -top-1 shadow-md opacity-0 group-hover:opacity-100 transition-opacity"
                  style={{ left: `calc(${progress}% - 8px)` }}
                />
              </div>
              
              <div className="flex justify-between text-xs text-muted-foreground">
                <span className="font-mono">{formatTime(currentTime)}</span>
                <span className="font-mono">{formatTime(audioDuration)}</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
