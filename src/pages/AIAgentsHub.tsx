import { useState } from 'react';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { useAIAgentOrchestrator, AgentInfo } from '@/hooks/useAIAgentOrchestrator';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Bot, 
  Users, 
  Truck, 
  Briefcase, 
  Megaphone, 
  BarChart3,
  Settings,
  Play,
  ChevronRight,
  Zap
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const CATEGORY_INFO: Record<string, { label: string; icon: React.ElementType; color: string }> = {
  customer_engagement: { label: 'Customer Engagement', icon: Users, color: 'text-blue-500' },
  field_operations: { label: 'Field Operations', icon: Truck, color: 'text-green-500' },
  business_operations: { label: 'Business Operations', icon: Briefcase, color: 'text-purple-500' },
  marketing_sales: { label: 'Marketing & Sales', icon: Megaphone, color: 'text-orange-500' },
  analytics: { label: 'Analytics & Insights', icon: BarChart3, color: 'text-cyan-500' },
};

const PHASE_LABELS: Record<number, string> = {
  1: 'Phase 1',
  2: 'Phase 2',
  3: 'Phase 3',
  4: 'Phase 4',
  5: 'Phase 5',
};

export default function AIAgentsHub() {
  const { agents, groupedAgents, loading, toggleAgent } = useAIAgentOrchestrator();
  const navigate = useNavigate();
  const [activeCategory, setActiveCategory] = useState<string>('all');

  const enabledCount = agents.filter(a => a.is_enabled).length;
  const totalCount = agents.length;

  const filteredAgents = activeCategory === 'all' 
    ? agents 
    : agents.filter(a => a.category === activeCategory);

  const handleAgentClick = (agentType: string) => {
    navigate(`/dashboard/ai-agents/${agentType}`);
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="space-y-6 p-6">
          <Skeleton className="h-8 w-64" />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3, 4, 5, 6].map(i => (
              <Skeleton key={i} className="h-48" />
            ))}
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6 p-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-3">
              <Bot className="h-8 w-8 text-primary" />
              AI Agents Hub
            </h1>
            <p className="text-muted-foreground mt-1">
              Manage and monitor your AI-powered automation agents
            </p>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right">
              <p className="text-2xl font-bold">{enabledCount}/{totalCount}</p>
              <p className="text-sm text-muted-foreground">Agents Active</p>
            </div>
            <Button variant="outline" onClick={() => navigate('/dashboard/ai-agent')}>
              <Settings className="h-4 w-4 mr-2" />
              Global Settings
            </Button>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          {Object.entries(CATEGORY_INFO).map(([key, { label, icon: Icon, color }]) => {
            const categoryAgents = groupedAgents[key] || [];
            const enabled = categoryAgents.filter(a => a.is_enabled).length;
            return (
              <Card 
                key={key} 
                className={`cursor-pointer transition-all hover:shadow-md ${activeCategory === key ? 'ring-2 ring-primary' : ''}`}
                onClick={() => setActiveCategory(activeCategory === key ? 'all' : key)}
              >
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <Icon className={`h-5 w-5 ${color}`} />
                    <div>
                      <p className="text-sm font-medium">{label}</p>
                      <p className="text-xs text-muted-foreground">
                        {enabled}/{categoryAgents.length} active
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Category Filter Tabs */}
        <Tabs value={activeCategory} onValueChange={setActiveCategory}>
          <TabsList>
            <TabsTrigger value="all">All Agents</TabsTrigger>
            {Object.entries(CATEGORY_INFO).map(([key, { label }]) => (
              <TabsTrigger key={key} value={key}>{label}</TabsTrigger>
            ))}
          </TabsList>

          <TabsContent value={activeCategory} className="mt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredAgents.map((agent) => (
                <AgentCard
                  key={agent.type}
                  agent={agent}
                  onToggle={(enabled) => toggleAgent(agent.type, enabled)}
                  onClick={() => handleAgentClick(agent.type)}
                />
              ))}
            </div>
          </TabsContent>
        </Tabs>

        {/* Empty State */}
        {filteredAgents.length === 0 && (
          <Card className="p-12 text-center">
            <Bot className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Agents Found</h3>
            <p className="text-muted-foreground">
              Select a different category to view available agents.
            </p>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
}

function AgentCard({ 
  agent, 
  onToggle, 
  onClick 
}: { 
  agent: AgentInfo; 
  onToggle: (enabled: boolean) => void;
  onClick: () => void;
}) {
  const categoryInfo = CATEGORY_INFO[agent.category];
  const Icon = categoryInfo?.icon || Bot;

  return (
    <Card className="hover:shadow-lg transition-all">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg bg-muted`}>
              <Icon className={`h-5 w-5 ${categoryInfo?.color || 'text-primary'}`} />
            </div>
            <div>
              <CardTitle className="text-lg">{agent.name}</CardTitle>
              <CardDescription className="text-xs">
                {PHASE_LABELS[agent.phase]}
              </CardDescription>
            </div>
          </div>
          <Switch 
            checked={agent.is_enabled} 
            onCheckedChange={onToggle}
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Badge variant={agent.is_enabled ? 'default' : 'secondary'}>
              {agent.is_enabled ? (
                <>
                  <Zap className="h-3 w-3 mr-1" />
                  Active
                </>
              ) : (
                'Disabled'
              )}
            </Badge>
            <Badge variant="outline">{agent.category.replace('_', ' ')}</Badge>
          </div>
          
          <div className="flex items-center justify-between pt-2">
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={onClick}
              className="text-primary"
            >
              Configure
              <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
            {agent.is_enabled && (
              <Button variant="outline" size="sm" onClick={onClick}>
                <Play className="h-3 w-3 mr-1" />
                Test
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
