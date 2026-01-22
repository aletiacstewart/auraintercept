import React from 'react';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { PageHeader } from '@/components/ui/page-header';
import { BookOpen, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useNavigate } from 'react-router-dom';
import AgentDependencyDiagram from '@/components/agents/AgentDependencyDiagram';
import AgentRequirementCalculator from '@/components/agents/AgentRequirementCalculator';
import TierComparisonCards from '@/components/agents/TierComparisonCards';
import ConsoleRequirementsDiagram from '@/components/agents/ConsoleRequirementsDiagram';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

const QUICK_REFERENCE_DATA = [
  { 
    agent: 'Scheduling Agent', 
    requires: ['AI Receptionist'], 
    tier: 'Multi-Track', 
    cost: '$897', 
    notes: 'Enables online booking' 
  },
  { 
    agent: 'ETA Agent', 
    requires: ['Dispatch Agent', 'Route Agent'], 
    tier: 'Multi-Track', 
    cost: '$897', 
    notes: 'Full field ops chain' 
  },
  { 
    agent: 'Invoice Agent', 
    requires: ['Quoting Agent'], 
    tier: 'Multi-Track', 
    cost: '$897', 
    notes: 'Billing automation' 
  },
  { 
    agent: 'Forecast Agent', 
    requires: ['Insights Agent', 'Revenue Agent'], 
    tier: 'Command', 
    cost: '$1,497', 
    notes: 'Full analytics suite' 
  },
  { 
    agent: 'Social Scheduler', 
    requires: ['Social Content'], 
    tier: 'Command', 
    cost: '$1,497', 
    notes: 'Social media automation' 
  },
  { 
    agent: 'Performance Agent', 
    requires: ['Insights Agent'], 
    tier: 'Command', 
    cost: '$1,497', 
    notes: 'KPI tracking' 
  },
  { 
    agent: 'Social Analytics', 
    requires: ['Social Content'], 
    tier: 'Command', 
    cost: '$1,497', 
    notes: 'Engagement metrics' 
  },
];

const TIER_BADGE_COLORS: Record<string, string> = {
  'Single-Point': 'bg-amber-600',
  'Multi-Track': 'bg-sky-600',
  'Command': 'bg-violet-600',
};

const AIAgentGuide: React.FC = () => {
  const navigate = useNavigate();

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <PageHeader
          icon={BookOpen}
          title="AI Agent Dependency Guide"
          description="Understand how AI agents work together and what you need for each capability"
          featureColor="platform"
          action={
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                onClick={() => navigate('/dashboard/ai-agents-hub')}
              >
                <ExternalLink className="h-4 w-4 mr-2" />
                AI Agents Hub
              </Button>
              <Button 
                variant="outline"
                onClick={() => navigate('/dashboard/subscription')}
              >
                View Pricing
              </Button>
            </div>
          }
        />

        <Tabs defaultValue="diagram" className="space-y-6">
          <TabsList className="bg-card border border-border">
            <TabsTrigger value="diagram" className="data-[state=inactive]:text-card-foreground">Dependency Flow</TabsTrigger>
            <TabsTrigger value="consoles" className="data-[state=inactive]:text-card-foreground">Console Requirements</TabsTrigger>
            <TabsTrigger value="calculator" className="data-[state=inactive]:text-card-foreground">What Do I Need?</TabsTrigger>
            <TabsTrigger value="reference" className="data-[state=inactive]:text-card-foreground">Quick Reference</TabsTrigger>
            <TabsTrigger value="tiers" className="data-[state=inactive]:text-card-foreground">Tier Comparison</TabsTrigger>
          </TabsList>

          <TabsContent value="diagram" className="space-y-6">
            <AgentDependencyDiagram />
            
            <Card className="bg-card border-border">
              <CardHeader className="pb-2">
                <CardTitle className="text-base text-card-foreground">How to Read This Diagram</CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-card-foreground/80 space-y-2">
                <p>
                  <strong className="text-card-foreground">Arrows show dependencies:</strong> An arrow from Agent A to Agent B means Agent A must be active for Agent B to function.
                </p>
                <p>
                  <strong className="text-card-foreground">Color coding:</strong> Agents are grouped by their minimum required tier.{' '}
                  <Badge className="bg-amber-600 text-white ml-1">Orange = Single-Point</Badge>{' '}
                  <Badge className="bg-sky-600 text-white">Blue = Multi-Track</Badge>{' '}
                  <Badge className="bg-violet-600 text-white">Purple = Command</Badge>
                </p>
                <p>
                  <strong className="text-card-foreground">Dotted lines:</strong> Indicate optional/enhancing dependencies that improve functionality but aren't strictly required.
                </p>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="consoles" className="space-y-6">
            <ConsoleRequirementsDiagram />
            
            <Card className="bg-card border-border">
              <CardHeader className="pb-2">
                <CardTitle className="text-base text-card-foreground">Understanding Control Centers</CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-card-foreground/80 space-y-2">
                <p>
                  Control Centers are unified interfaces that group related agents together. Each center requires an "anchor agent" to unlock.
                </p>
                <p>
                  For example, enabling the <strong className="text-card-foreground">Dispatch Agent</strong> automatically unlocks access to the <strong className="text-card-foreground">Field Operations</strong> console, which includes Route, ETA, and Check-in agents.
                </p>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="calculator">
            <AgentRequirementCalculator />
          </TabsContent>

          <TabsContent value="reference">
            <Card className="bg-card border-border">
              <CardHeader>
                <CardTitle className="text-card-foreground">Quick Reference: Agent Dependencies</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow className="border-border">
                      <TableHead className="text-card-foreground">Agent You Want</TableHead>
                      <TableHead className="text-card-foreground">Requires These Agents</TableHead>
                      <TableHead className="text-card-foreground">Minimum Tier</TableHead>
                      <TableHead className="text-card-foreground">Monthly Cost</TableHead>
                      <TableHead className="text-card-foreground">Notes</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {QUICK_REFERENCE_DATA.map((row, idx) => (
                      <TableRow 
                        key={row.agent} 
                        className={`border-border ${idx % 2 === 0 ? 'bg-slate-800/30' : ''}`}
                      >
                        <TableCell className="font-medium text-card-foreground">
                          {row.agent}
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-wrap gap-1">
                            {row.requires.map(req => (
                              <Badge key={req} variant="secondary" className="text-xs bg-slate-700 text-card-foreground border-slate-600">
                                {req}
                              </Badge>
                            ))}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge className={`${TIER_BADGE_COLORS[row.tier]} text-white`}>
                            {row.tier}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-primary font-semibold">
                          {row.cost}
                        </TableCell>
                        <TableCell className="text-card-foreground/70 text-sm">
                          {row.notes}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="tiers">
            <TierComparisonCards />
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
};

export default AIAgentGuide;
