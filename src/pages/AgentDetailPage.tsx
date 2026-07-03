import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { useAIAgentOrchestrator, AgentInfo } from '@/hooks/useAIAgentOrchestrator';
import { AgentSettingsPanel } from '@/components/ai/agents/AgentSettingsPanel';
import { AgentTestConsole } from '@/components/ai/agents/AgentTestConsole';
import { AgentEventLog } from '@/components/ai/agents/AgentEventLog';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Skeleton } from '@/components/ui/skeleton';
import {
  ArrowLeft,
  Settings,
  Play,
  Activity,
  Bot,
} from 'lucide-react';
import { AGENT_REGISTRY } from '@/lib/agentRegistry';

export default function AgentDetailPage() {
  const { agentId } = useParams<{ agentId: string }>();
  const navigate = useNavigate();
  const { agents, loading, toggleAgent, updateAgentSettings, companyId } = useAIAgentOrchestrator();
  const [activeTab, setActiveTab] = useState('settings');

  const agentDef = agentId ? AGENT_REGISTRY[agentId] : null;
  const agentData = agents.find(a => a.type === agentId);

  if (!agentId || !agentDef) {
    return (
      <DashboardLayout>
        <div className="p-6">
          <Card className="p-12 text-center">
            <Bot className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">Agent Not Found</h3>
            <p className="text-muted-foreground mb-4">The requested agent does not exist.</p>
            <Button onClick={() => navigate('/dashboard/ai-agents')}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Agents
            </Button>
          </Card>
        </div>
      </DashboardLayout>
    );
  }

  if (loading) {
    return (
      <DashboardLayout>
        <div className="space-y-6 p-6">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-48" />
        </div>
      </DashboardLayout>
    );
  }

  const Icon = agentDef.icon;

  return (
    <DashboardLayout>
      <div className="space-y-6 p-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={() => navigate('/dashboard/ai-agents')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
        </div>

        <div className="flex items-start justify-between">
          <div className="flex items-center gap-4">
            <div className={`p-3 rounded-xl bg-muted`}>
              <Icon className={`h-8 w-8 ${agentDef.color}`} />
            </div>
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-3xl font-bold">{agentDef.name}</h1>
                <Badge variant={agentData?.is_enabled ? 'default' : 'secondary'}>
                  {agentData?.is_enabled ? 'Active' : 'Disabled'}
                </Badge>
                <Badge variant="outline">Phase {agentDef.phase}</Badge>
              </div>
              <p className="text-muted-foreground mt-1 max-w-2xl">{agentDef.description}</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Enabled</span>
              <Switch
                checked={agentData?.is_enabled || false}
                onCheckedChange={(enabled) => toggleAgent(agentId, enabled)}
              />
            </div>
          </div>
        </div>

        {/* Capabilities */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Capabilities</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {agentDef.capabilities.map((cap) => (
                <Badge key={cap} variant="outline" className="py-1 px-3 text-white border-white/30">
                  {cap}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="settings">
              <Settings className="h-4 w-4 mr-2" />
              Settings
            </TabsTrigger>
            <TabsTrigger value="test">
              <Play className="h-4 w-4 mr-2" />
              Test Console
            </TabsTrigger>
            <TabsTrigger value="events">
              <Activity className="h-4 w-4 mr-2" />
              Event Log
            </TabsTrigger>
          </TabsList>

          <TabsContent value="settings" className="mt-6">
            <AgentSettingsPanel
              agentType={agentId}
              configFields={agentDef.configFields}
              currentSettings={agentData?.settings || {}}
              onSave={(settings) => updateAgentSettings(agentId, settings)}
            />
          </TabsContent>

          <TabsContent value="test" className="mt-6">
            <AgentTestConsole
              agentType={agentId}
              agentName={agentDef.name}
              isEnabled={agentData?.is_enabled || false}
              companyId={companyId}
            />
          </TabsContent>

          <TabsContent value="events" className="mt-6">
            <AgentEventLog 
              agentType={agentId}
              companyId={companyId}
            />
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}
