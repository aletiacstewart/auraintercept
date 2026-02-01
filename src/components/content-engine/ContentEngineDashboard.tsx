import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  TrendingUp, 
  Globe, 
  Share2, 
  Mail, 
  FileText, 
  MessageSquare,
  Clock,
  CheckCircle2,
  XCircle
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useQuery } from '@tanstack/react-query';
import { format, formatDistanceToNow } from 'date-fns';

const CHANNEL_CONFIG: Record<string, { icon: React.ElementType; color: string; label: string }> = {
  website: { icon: Globe, color: 'text-blue-400', label: 'Website' },
  social: { icon: Share2, color: 'text-pink-400', label: 'Social' },
  campaign: { icon: Mail, color: 'text-amber-400', label: 'Campaign' },
  blog: { icon: FileText, color: 'text-green-400', label: 'Blog' },
  sms: { icon: MessageSquare, color: 'text-purple-400', label: 'SMS' },
};

interface ContentHistoryItem {
  id: string;
  channel: string;
  topic: string;
  content: Record<string, unknown>;
  saved_to: string | null;
  saved_id: string | null;
  created_at: string;
}

export function ContentEngineDashboard() {
  const { companyId } = useAuth();

  // Fetch content generation history
  const { data: history, isLoading } = useQuery({
    queryKey: ['content-engine-history', companyId],
    queryFn: async () => {
      if (!companyId) return [];
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data, error } = await (supabase.from('content_engine_history') as any)
        .select('*')
        .eq('company_id', companyId)
        .order('created_at', { ascending: false })
        .limit(50);
      
      if (error) throw error;
      return data as ContentHistoryItem[];
    },
    enabled: !!companyId,
  });

  // Calculate stats
  const stats = history?.reduce((acc, item) => {
    acc.total++;
    acc.byChannel[item.channel] = (acc.byChannel[item.channel] || 0) + 1;
    if (item.saved_to) acc.saved++;
    return acc;
  }, { total: 0, saved: 0, byChannel: {} as Record<string, number> }) || { total: 0, saved: 0, byChannel: {} };

  const channelStats = Object.entries(CHANNEL_CONFIG).map(([key, config]) => ({
    ...config,
    key,
    count: stats.byChannel[key] || 0,
  }));

  if (isLoading) {
    return (
      <Card>
        <CardContent className="py-12 text-center text-muted-foreground">
          Loading content history...
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-sidebar/50">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold">{stats.total}</p>
                <p className="text-xs text-muted-foreground">Total Generated</p>
              </div>
              <TrendingUp className="h-8 w-8 text-muted-foreground/50" />
            </div>
          </CardContent>
        </Card>
        <Card className="bg-sidebar/50">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold">{stats.saved}</p>
                <p className="text-xs text-muted-foreground">Saved/Scheduled</p>
              </div>
              <CheckCircle2 className="h-8 w-8 text-green-500/50" />
            </div>
          </CardContent>
        </Card>
        <Card className="bg-sidebar/50">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold">{stats.total - stats.saved}</p>
                <p className="text-xs text-muted-foreground">Not Used</p>
              </div>
              <XCircle className="h-8 w-8 text-muted-foreground/50" />
            </div>
          </CardContent>
        </Card>
        <Card className="bg-sidebar/50">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold">
                  {stats.total > 0 ? Math.round((stats.saved / stats.total) * 100) : 0}%
                </p>
                <p className="text-xs text-muted-foreground">Usage Rate</p>
              </div>
              <div className="h-8 w-8 rounded-full bg-primary/20 flex items-center justify-center">
                <span className="text-xs font-bold text-primary">%</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Channel Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle>Content by Channel</CardTitle>
          <CardDescription>Distribution of generated content across channels</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            {channelStats.map(({ key, icon: Icon, color, label, count }) => (
              <div
                key={key}
                className="flex items-center gap-3 p-3 rounded-lg bg-background/50 border"
              >
                <div className={`p-2 rounded-lg bg-sidebar ${color}`}>
                  <Icon className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-xl font-bold">{count}</p>
                  <p className="text-xs text-muted-foreground">{label}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Recent History */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Generations</CardTitle>
          <CardDescription>Your latest content generation activity</CardDescription>
        </CardHeader>
        <CardContent>
          {!history || history.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <TrendingUp className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No content generated yet</p>
              <p className="text-sm mt-1">Use the Generator tab to create content</p>
            </div>
          ) : (
            <ScrollArea className="h-[300px]">
              <div className="space-y-3">
                {history.map((item) => {
                  const config = CHANNEL_CONFIG[item.channel] || CHANNEL_CONFIG.website;
                  const Icon = config.icon;
                  return (
                    <div
                      key={item.id}
                      className="flex items-start gap-3 p-3 rounded-lg bg-background/50 border"
                    >
                      <div className={`p-2 rounded-lg bg-sidebar ${config.color}`}>
                        <Icon className="h-4 w-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="font-medium text-sm truncate">{item.topic}</p>
                          {item.saved_to && (
                            <Badge variant="secondary" className="text-xs shrink-0">
                              <CheckCircle2 className="h-3 w-3 mr-1" />
                              Saved
                            </Badge>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {config.label} • {formatDistanceToNow(new Date(item.created_at), { addSuffix: true })}
                        </p>
                      </div>
                      <div className="flex items-center gap-1 text-muted-foreground">
                        <Clock className="h-3 w-3" />
                        <span className="text-xs">{format(new Date(item.created_at), 'MMM d')}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </ScrollArea>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
