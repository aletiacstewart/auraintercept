import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { MessageSquare, Phone, Mail, Search, Filter, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';

interface CommunicationLog {
  id: string;
  type: 'call' | 'sms' | 'email';
  direction: 'inbound' | 'outbound';
  customerName: string;
  customerPhone?: string;
  summary: string;
  timestamp: Date;
  duration?: number;
  status: 'completed' | 'missed' | 'pending';
}

// Mock data - will be replaced with real data when integrations are built
const MOCK_LOGS: CommunicationLog[] = [
  {
    id: '1',
    type: 'call',
    direction: 'inbound',
    customerName: 'John Smith',
    customerPhone: '+1 (555) 123-4567',
    summary: 'Inquired about appointment rescheduling',
    timestamp: new Date(Date.now() - 1000 * 60 * 30),
    duration: 180,
    status: 'completed',
  },
  {
    id: '2',
    type: 'sms',
    direction: 'outbound',
    customerName: 'Sarah Johnson',
    customerPhone: '+1 (555) 987-6543',
    summary: 'Appointment reminder sent for tomorrow at 2:00 PM',
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2),
    status: 'completed',
  },
  {
    id: '3',
    type: 'call',
    direction: 'inbound',
    customerName: 'Michael Brown',
    customerPhone: '+1 (555) 456-7890',
    summary: 'Missed call - follow-up SMS sent automatically',
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 4),
    status: 'missed',
  },
];

export function CommunicationLogs() {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('all');

  const filteredLogs = MOCK_LOGS.filter((log) => {
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
        return 'bg-green-500/10 text-green-600 border-green-500/30';
      case 'missed':
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
            <CardDescription>
              View call, SMS, and email history with customers
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
            {filteredLogs.length > 0 ? (
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
                              ? 'bg-primary/10 text-primary'
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
                <MessageSquare className="w-12 h-12 mx-auto text-muted-foreground mb-3" />
                <p className="text-muted-foreground">No communication logs found</p>
                <p className="text-sm text-muted-foreground">
                  Logs will appear here once integrations are connected
                </p>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
