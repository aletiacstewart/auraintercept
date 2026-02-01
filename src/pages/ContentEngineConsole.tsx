import { useState } from 'react';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { PageContainer } from '@/components/ui/page-container';
import { PageHeader } from '@/components/ui/page-header';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
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

const CHANNEL_STATS = [
  { channel: 'Website', icon: Globe, count: 0, color: 'text-blue-400' },
  { channel: 'Social', icon: Share2, count: 0, color: 'text-pink-400' },
  { channel: 'Campaign', icon: Mail, count: 0, color: 'text-amber-400' },
  { channel: 'Blog', icon: FileText, count: 0, color: 'text-green-400' },
  { channel: 'SMS', icon: MessageSquare, count: 0, color: 'text-purple-400' },
];

export default function ContentEngineConsole() {
  const [activeTab, setActiveTab] = useState('generator');

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
            {CHANNEL_STATS.map(({ channel, icon: Icon, count, color }) => (
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
              <TabsTrigger value="settings" className="flex items-center gap-1.5">
                <Settings className="h-3.5 w-3.5" />
                Brand Voice
              </TabsTrigger>
            </TabsList>

            <TabsContent value="generator" className="space-y-6">
              <MultiChannelGenerator />
            </TabsContent>

            <TabsContent value="dashboard" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Content Dashboard</CardTitle>
                  <CardDescription>Overview of generated content across all channels</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-12 text-muted-foreground">
                    <TrendingUp className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>Start generating content to see analytics here</p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="calendar" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Content Calendar</CardTitle>
                  <CardDescription>Unified view of scheduled content across channels</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-12 text-muted-foreground">
                    <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No scheduled content yet</p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="settings" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Brand Voice Settings</CardTitle>
                  <CardDescription>Configure your AI Content Profile for consistent messaging</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-12 text-muted-foreground">
                    <Settings className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>Brand voice settings coming soon</p>
                    <p className="text-sm mt-2">Configure via Knowledge Base → AI Content Profile</p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </PageContainer>
    </DashboardLayout>
  );
}
