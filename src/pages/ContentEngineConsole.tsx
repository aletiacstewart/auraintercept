import { useState } from 'react';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { PageContainer } from '@/components/ui/page-container';
import { PageHeader } from '@/components/ui/page-header';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Sparkles, 
  Globe, 
  Share2, 
  Mail, 
  FileText, 
  MessageSquare,
  TrendingUp,
  Calendar,
  Settings
} from 'lucide-react';
import { MultiChannelGenerator } from '@/components/content-engine/MultiChannelGenerator';
import { ContentEngineDashboard } from '@/components/content-engine/ContentEngineDashboard';
import { ContentEngineCalendar } from '@/components/content-engine/ContentEngineCalendar';
import { AIContentProfileManager } from '@/components/knowledge/AIContentProfileManager';
import { useAuth } from '@/contexts/AuthContext';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

const CHANNEL_STATS_CONFIG = [
  { channel: 'Website', icon: Globe, key: 'website', color: 'text-cyan-400' },
  { channel: 'Social', icon: Share2, key: 'social', color: 'text-pink-400' },
  { channel: 'Campaign', icon: Mail, key: 'campaign', color: 'text-amber-400' },
  { channel: 'Blog', icon: FileText, key: 'blog', color: 'text-green-400' },
  { channel: 'SMS', icon: MessageSquare, key: 'sms', color: 'text-purple-400' },
];

export default function ContentEngineConsole() {
  const [activeTab, setActiveTab] = useState('settings');
  const { companyId } = useAuth();

  // Fetch content history stats
  const { data: historyStats } = useQuery({
    queryKey: ['content-engine-stats', companyId],
    queryFn: async () => {
      if (!companyId) return {};
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data, error } = await (supabase.from('content_engine_history') as any)
        .select('channel')
        .eq('company_id', companyId);
      
      if (error) throw error;
      
      // Count by channel
      const counts: Record<string, number> = {};
      (data || []).forEach((item: { channel: string }) => {
        counts[item.channel] = (counts[item.channel] || 0) + 1;
      });
      return counts;
    },
    enabled: !!companyId,
  });

  const channelStats = CHANNEL_STATS_CONFIG.map(config => ({
    ...config,
    count: historyStats?.[config.key] || 0,
  }));

  return (
    <DashboardLayout>
      <PageContainer>
        <div className="space-y-6">
          <PageHeader
            icon={Sparkles}
            title="Content Engine"
            description="Unified AI content generation for all marketing channels"
            featureColor="marketing"
            action={
              <Badge variant="outline" className="border-primary/30 text-primary">
                <Sparkles className="h-3 w-3 mr-1" />
                Creative Agent
              </Badge>
            }
          />

          {/* Quick Stats */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            {channelStats.map(({ channel, icon: Icon, count, color }) => (
              <Card key={channel} className="bg-sidebar/50">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg bg-background/50 ${color}`}>
                      <Icon className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold">{count}</p>
                      <p className="text-xs text-muted-foreground">{channel}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Main Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList>
              <TabsTrigger value="settings" className="flex items-center gap-1.5">
                <Settings className="h-3.5 w-3.5" />
                Brand Voice
              </TabsTrigger>
              <TabsTrigger value="generator" className="flex items-center gap-1.5">
                <Sparkles className="h-3.5 w-3.5" />
                Generate
              </TabsTrigger>
              <TabsTrigger value="dashboard" className="flex items-center gap-1.5">
                <TrendingUp className="h-3.5 w-3.5" />
                Dashboard
              </TabsTrigger>
              <TabsTrigger value="calendar" className="flex items-center gap-1.5">
                <Calendar className="h-3.5 w-3.5" />
                Calendar
              </TabsTrigger>
            </TabsList>

            <TabsContent value="settings" className="space-y-6">
              <AIContentProfileManager />
            </TabsContent>

            <TabsContent value="generator" className="space-y-6">
              <MultiChannelGenerator />
            </TabsContent>

            <TabsContent value="dashboard" className="space-y-6">
              <ContentEngineDashboard />
            </TabsContent>

            <TabsContent value="calendar" className="space-y-6">
              <ContentEngineCalendar />
            </TabsContent>
          </Tabs>
        </div>
      </PageContainer>
    </DashboardLayout>
  );
}
