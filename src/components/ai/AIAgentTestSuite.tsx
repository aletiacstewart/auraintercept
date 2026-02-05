import { useState, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Checkbox } from '@/components/ui/checkbox';
import { useAuth } from '@/contexts/AuthContext';
import { useAIAgentOrchestrator } from '@/hooks/useAIAgentOrchestrator';
import { 
  Play, 
  Square, 
  Download, 
  CheckCircle2, 
  XCircle, 
  AlertTriangle, 
  Clock,
  RotateCcw,
  Bot
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface TestScenario {
  id: string;
  name: string;
  description: string;
  agentTypes: string[];
  prompts: string[];
  expectedBehaviors: string[];
}

interface TestResult {
  agentType: string;
  agentName: string;
  scenario: string;
  status: 'pending' | 'running' | 'passed' | 'failed' | 'slow';
  responseTime?: number;
  response?: string;
  error?: string;
  timestamp: Date;
}

// Predefined test scenarios
const TEST_SCENARIOS: TestScenario[] = [
  {
    id: 'triage',
    name: 'Triage Flow',
    description: 'Test AI receptionist greeting and service inquiry',
    agentTypes: ['triage'],
    prompts: ['What services do you offer?', 'Hello, I need help'],
    expectedBehaviors: ['Lists services', 'Provides greeting'],
  },
  {
    id: 'booking',
    name: 'Booking Flow',
    description: 'Test appointment scheduling capabilities',
    agentTypes: ['triage', 'booking'],
    prompts: ["I'd like to schedule an appointment for Tuesday", 'Book me for next week'],
    expectedBehaviors: ['Checks availability', 'Collects customer info'],
  },
  {
    id: 'followup',
    name: 'Follow-up Flow',
    description: 'Test appointment lookup and status check',
    agentTypes: ['followup'],
    prompts: ['When is my next appointment?', 'Can you check my booking status?'],
    expectedBehaviors: ['Retrieves appointment', 'Provides status'],
  },
  {
    id: 'review',
    name: 'Review Collection',
    description: 'Test feedback collection and review prompts',
    agentTypes: ['review'],
    prompts: ['How can I leave a review?', 'I want to share my feedback'],
    expectedBehaviors: ['Provides review links', 'Collects feedback'],
  },
  {
    id: 'quoting',
    name: 'Quote Generation',
    description: 'Test price quote functionality',
    agentTypes: ['quoting'],
    prompts: ['How much does service X cost?', 'Can I get a quote?'],
    expectedBehaviors: ['Provides pricing', 'Generates quote'],
  },
  {
    id: 'dispatch',
    name: 'Dispatch Operations',
    description: 'Test technician dispatch and job tracking',
    agentTypes: ['dispatch', 'eta'],
    prompts: ['Who is assigned to my job?', 'When will the technician arrive?'],
    expectedBehaviors: ['Shows technician info', 'Provides ETA'],
  },
];

// Agent names mapping
const AGENT_NAMES: Record<string, string> = {
  triage: 'AI Receptionist',
  booking: 'Scheduling Agent',
  followup: 'Follow-up Agent',
  review: 'Review Agent',
  dispatch: 'Dispatch Agent',
  route: 'Route Agent',
  eta: 'ETA Agent',
  checkin: 'Check-in Agent',
  admin: 'Admin Agent',
  quoting: 'Quoting Agent',
  invoice: 'Invoice Agent',
  inventory: 'Inventory Agent',
  campaign: 'Campaign Agent',
  lead: 'Lead Agent',
  marketing: 'Marketing Agent',
  social_content: 'Social Media Agent',
  social_scheduler: 'Social Media Scheduler',
  social_analytics: 'Social Media Analytics',
  insights: 'Insights Agent',
  performance: 'Performance Agent',
  revenue: 'Revenue Agent',
  forecast: 'Forecast Agent',
  creative: 'Creative Agent',
  web_presence: 'Web Presence Agent',
};

export function AIAgentTestSuite() {
  const { companyId } = useAuth();
  const { agents } = useAIAgentOrchestrator();
  const [selectedScenario, setSelectedScenario] = useState<string>('all');
  const [selectedAgents, setSelectedAgents] = useState<string[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [results, setResults] = useState<TestResult[]>([]);
  const [progress, setProgress] = useState(0);

  const enabledAgents = agents.filter(a => a.is_enabled);

  const runTest = useCallback(async (agentType: string, prompt: string, scenario: string): Promise<TestResult> => {
    const startTime = Date.now();
    
    try {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-agent`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
          body: JSON.stringify({
            messages: [{ role: 'user', content: prompt }],
            company_id: companyId,
            stream: false,
          }),
        }
      );

      const responseTime = Date.now() - startTime;
      
      if (!response.ok) {
        return {
          agentType,
          agentName: AGENT_NAMES[agentType] || agentType,
          scenario,
          status: 'failed',
          responseTime,
          error: `HTTP ${response.status}`,
          timestamp: new Date(),
        };
      }

      const data = await response.json();
      const content = data.content || '';
      
      // Determine status based on response time
      const status = responseTime > 3000 ? 'slow' : 'passed';
      
      return {
        agentType,
        agentName: AGENT_NAMES[agentType] || agentType,
        scenario,
        status,
        responseTime,
        response: content.slice(0, 200) + (content.length > 200 ? '...' : ''),
        timestamp: new Date(),
      };
    } catch (error) {
      return {
        agentType,
        agentName: AGENT_NAMES[agentType] || agentType,
        scenario,
        status: 'failed',
        responseTime: Date.now() - startTime,
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date(),
      };
    }
  }, [companyId]);

  const runAllTests = useCallback(async () => {
    if (!companyId) return;
    
    setIsRunning(true);
    setResults([]);
    setProgress(0);

    const agentsToTest = selectedAgents.length > 0 
      ? enabledAgents.filter(a => selectedAgents.includes(a.type))
      : enabledAgents;
    
    const scenariosToRun = selectedScenario === 'all' 
      ? TEST_SCENARIOS 
      : TEST_SCENARIOS.filter(s => s.id === selectedScenario);
    
    const totalTests = agentsToTest.length;
    let completed = 0;
    const newResults: TestResult[] = [];

    for (const agent of agentsToTest) {
      // Find relevant scenario for this agent
      const relevantScenario = scenariosToRun.find(s => s.agentTypes.includes(agent.type));
      const prompt = relevantScenario?.prompts[0] || 'Hello, what can you help me with?';
      const scenarioName = relevantScenario?.name || 'General Test';

      // Set running status
      setResults(prev => [...prev, {
        agentType: agent.type,
        agentName: AGENT_NAMES[agent.type] || agent.name,
        scenario: scenarioName,
        status: 'running',
        timestamp: new Date(),
      }]);

      const result = await runTest(agent.type, prompt, scenarioName);
      newResults.push(result);
      
      // Update with actual result
      setResults(prev => {
        const updated = [...prev];
        const idx = updated.findIndex(r => r.agentType === agent.type && r.status === 'running');
        if (idx >= 0) {
          updated[idx] = result;
        }
        return updated;
      });

      completed++;
      setProgress((completed / totalTests) * 100);
      
      // Small delay between tests to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 500));
    }

    setIsRunning(false);
  }, [companyId, enabledAgents, selectedAgents, selectedScenario, runTest]);

  const stopTests = useCallback(() => {
    setIsRunning(false);
  }, []);

  const exportResults = useCallback(() => {
    const exportData = {
      timestamp: new Date().toISOString(),
      companyId,
      results: results.map(r => ({
        agent: r.agentName,
        scenario: r.scenario,
        status: r.status,
        responseTime: r.responseTime,
        error: r.error,
      })),
      summary: {
        total: results.length,
        passed: results.filter(r => r.status === 'passed').length,
        failed: results.filter(r => r.status === 'failed').length,
        slow: results.filter(r => r.status === 'slow').length,
      },
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ai-agent-test-results-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, [results, companyId]);

  const toggleAgent = (agentType: string) => {
    setSelectedAgents(prev => 
      prev.includes(agentType) 
        ? prev.filter(a => a !== agentType)
        : [...prev, agentType]
    );
  };

  const passedCount = results.filter(r => r.status === 'passed').length;
  const failedCount = results.filter(r => r.status === 'failed').length;
  const slowCount = results.filter(r => r.status === 'slow').length;

  return (
    <div className="space-y-6">
      {/* Controls Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bot className="h-5 w-5" />
            AI Agent Test Suite
          </CardTitle>
          <CardDescription>
            Automated testing for your AI operatives. Run predefined scenarios to verify agent functionality.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Scenario Selection */}
          <div className="flex flex-wrap gap-4">
            <div className="flex-1 min-w-[200px]">
              <label className="text-sm font-medium mb-2 block">Test Scenario</label>
              <Select value={selectedScenario} onValueChange={setSelectedScenario}>
                <SelectTrigger>
                  <SelectValue placeholder="Select scenario" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Scenarios</SelectItem>
                  {TEST_SCENARIOS.map(s => (
                    <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-end gap-2">
              {!isRunning ? (
                <Button onClick={runAllTests} disabled={enabledAgents.length === 0}>
                  <Play className="h-4 w-4 mr-2" />
                  Run Tests
                </Button>
              ) : (
                <Button variant="destructive" onClick={stopTests}>
                  <Square className="h-4 w-4 mr-2" />
                  Stop
                </Button>
              )}
              
              <Button variant="outline" onClick={() => setResults([])}>
                <RotateCcw className="h-4 w-4 mr-2" />
                Reset
              </Button>
              
              {results.length > 0 && (
                <Button variant="outline" onClick={exportResults}>
                  <Download className="h-4 w-4 mr-2" />
                  Export
                </Button>
              )}
            </div>
          </div>

          {/* Agent Selection */}
          <div>
            <label className="text-sm font-medium mb-2 block">
              Select Agents to Test ({selectedAgents.length === 0 ? 'All' : selectedAgents.length} selected)
            </label>
            <div className="flex flex-wrap gap-2">
              {enabledAgents.map(agent => (
                <Badge
                  key={agent.type}
                  variant={selectedAgents.includes(agent.type) ? "default" : "outline"}
                  className="cursor-pointer"
                  onClick={() => toggleAgent(agent.type)}
                >
                  <Checkbox
                    checked={selectedAgents.length === 0 || selectedAgents.includes(agent.type)}
                    className="mr-1.5 h-3 w-3"
                  />
                  {AGENT_NAMES[agent.type] || agent.name}
                </Badge>
              ))}
            </div>
          </div>

          {/* Progress */}
          {isRunning && (
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Running tests...</span>
                <span>{Math.round(progress)}%</span>
              </div>
              <Progress value={progress} />
            </div>
          )}
        </CardContent>
      </Card>

      {/* Results Summary */}
      {results.length > 0 && (
        <div className="grid grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold">{results.length}</div>
              <p className="text-sm text-muted-foreground">Total Tests</p>
            </CardContent>
          </Card>
          <Card className="border-green-500/30 bg-green-500/5">
            <CardContent className="pt-6">
              <div className="text-2xl font-bold text-green-500">{passedCount}</div>
              <p className="text-sm text-muted-foreground">Passed</p>
            </CardContent>
          </Card>
          <Card className="border-red-500/30 bg-red-500/5">
            <CardContent className="pt-6">
              <div className="text-2xl font-bold text-red-500">{failedCount}</div>
              <p className="text-sm text-muted-foreground">Failed</p>
            </CardContent>
          </Card>
          <Card className="border-amber-500/30 bg-amber-500/5">
            <CardContent className="pt-6">
              <div className="text-2xl font-bold text-amber-500">{slowCount}</div>
              <p className="text-sm text-muted-foreground">Slow (&gt;3s)</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Results List */}
      {results.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Test Results</CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[400px]">
              <div className="space-y-2">
                {results.map((result, idx) => (
                  <div
                    key={`${result.agentType}-${idx}`}
                    className={cn(
                      "flex items-center justify-between p-3 rounded-lg border",
                      result.status === 'passed' && "bg-green-500/5 border-green-500/20",
                      result.status === 'failed' && "bg-red-500/5 border-red-500/20",
                      result.status === 'slow' && "bg-amber-500/5 border-amber-500/20",
                      result.status === 'running' && "bg-blue-500/5 border-blue-500/20",
                      result.status === 'pending' && "bg-muted"
                    )}
                  >
                    <div className="flex items-center gap-3">
                      {result.status === 'passed' && <CheckCircle2 className="h-5 w-5 text-green-500" />}
                      {result.status === 'failed' && <XCircle className="h-5 w-5 text-red-500" />}
                      {result.status === 'slow' && <AlertTriangle className="h-5 w-5 text-amber-500" />}
                      {result.status === 'running' && <Clock className="h-5 w-5 text-blue-500 animate-pulse" />}
                      {result.status === 'pending' && <Clock className="h-5 w-5 text-muted-foreground" />}
                      
                      <div>
                        <p className="font-medium">{result.agentName}</p>
                        <p className="text-sm text-muted-foreground">{result.scenario}</p>
                        {result.error && (
                          <p className="text-xs text-red-500 mt-1">{result.error}</p>
                        )}
                      </div>
                    </div>
                    
                    <div className="text-right">
                      {result.responseTime && (
                        <Badge variant={result.status === 'slow' ? 'destructive' : 'secondary'}>
                          {(result.responseTime / 1000).toFixed(2)}s
                        </Badge>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      )}

      {/* Empty State */}
      {results.length === 0 && !isRunning && (
        <Card>
          <CardContent className="py-12 text-center">
            <Bot className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
            <p className="text-muted-foreground">
              {enabledAgents.length === 0 
                ? 'No agents enabled. Enable agents from the Operatives tab to run tests.'
                : 'Click "Run Tests" to start automated testing of your AI agents.'}
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
