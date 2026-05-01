import { useState, useCallback, useRef } from 'react';
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
  Bot,
  Zap,
  Activity
} from 'lucide-react';
import { cn } from '@/lib/utils';

// Performance thresholds (in milliseconds)
// Standard mode uses orchestrator simulation (<500ms expected)
// Comprehensive mode uses real AI (10-30s expected)
const THRESHOLDS = {
  // Standard mode (simulated) thresholds
  SIMULATED_PASS: 500,    // Under 500ms = passed
  SIMULATED_SLOW: 2000,   // 500ms-2s = slow warning
  SIMULATED_TIMEOUT: 5000, // 5s timeout for simulated tests
  
  // Comprehensive mode (real AI) thresholds
  PASS: 10000,     // Under 10s = passed
  SLOW: 25000,     // 10-25s = slow warning
  TIMEOUT: 30000   // 30s timeout for real AI
};

const BATCH_SIZE = 5; // Process 5 agents concurrently

type TestMode = 'quick' | 'standard' | 'comprehensive';

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
  status: 'pending' | 'running' | 'passed' | 'failed' | 'slow' | 'timeout';
  responseTime?: number;
  response?: string;
  error?: string;
  timestamp: Date;
}

interface HealthCheckResult {
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: string;
  checks: {
    database: { status: 'ok' | 'error'; latency_ms: number; error?: string };
    agents: { total: number; enabled: number; configured: number };
    api_keys: { openai: boolean; elevenlabs: boolean };
  };
}

// Agent-specific test prompts for targeted testing
const AGENT_TEST_PROMPTS: Record<string, string[]> = {
  triage: ['Hello, what services do you offer?', 'I need help with my HVAC system'],
  booking: ['I want to schedule an appointment for next Tuesday at 2pm', 'Can you reschedule my appointment?'],
  followup: ['When is my next appointment?', 'Can you check my booking status?'],
  review: ['The service was excellent, 5 stars!', 'How can I leave a review?'],
  dispatch: ['Emergency: customer at 123 Main St has a water leak, dispatch nearest tech', 'Who is assigned to my job?'],
  route: ['Optimize today\'s route for the team', 'What\'s the best route for 8 stops?'],
  eta: ['When will the technician arrive?', 'How far away is the tech?'],
  checkin: ['I\'ve arrived at the job site, check me in', 'Job complete, customer satisfied'],
  admin: ['Show me today\'s schedule overview', 'What\'s our capacity for next week?'],
  quoting: ['I need a quote for AC repair and filter replacement - labor 2 hours, parts $245', 'How much does a tune-up cost?'],
  invoice: ['Generate invoice for job #123 with labor $190 and parts $245', 'Send payment reminder for overdue invoice'],
  inventory: ['Check stock levels for HVAC filters', 'What items are running low?'],
  campaign: ['Create a spring promotion campaign', 'What campaigns are active?'],
  lead: ['New lead from website: John Smith, interested in AC repair', 'Show me unqualified leads'],
  marketing: ['Generate a promotional offer for inactive customers', 'What\'s our customer retention rate?'],
  social_content: ['Create a social media post about our AC maintenance special', 'Generate content for Instagram'],
  social_scheduler: ['Schedule posts for the next week', 'When should I post for maximum engagement?'],
  social_analytics: ['How did our last campaign perform?', 'Show me our social media metrics'],
  insights: ['Give me this week\'s performance summary', 'What are our top performing services?'],
  performance: ['Show technician performance metrics', 'Who has the highest ratings?'],
  revenue: ['What\'s our revenue this month?', 'Compare this month to last month'],
  forecast: ['Predict demand for next month', 'When will we need extra capacity?'],
  creative: ['Design a promotional flyer for spring', 'Create marketing copy for our website'],
  web_presence: ['How is our website performing?', 'What are our SEO opportunities?'],
};

// Predefined test scenarios
const TEST_SCENARIOS: TestScenario[] = [
  {
    id: 'triage',
    name: 'Triage Flow',
    description: 'Test AI receptionist greeting and service inquiry',
    agentTypes: ['triage'],
    prompts: AGENT_TEST_PROMPTS.triage,
    expectedBehaviors: ['Lists services', 'Provides greeting'],
  },
  {
    id: 'booking',
    name: 'Booking Flow',
    description: 'Test appointment scheduling capabilities',
    agentTypes: ['booking'],
    prompts: AGENT_TEST_PROMPTS.booking,
    expectedBehaviors: ['Checks availability', 'Collects customer info'],
  },
  {
    id: 'followup',
    name: 'Follow-up Flow',
    description: 'Test appointment lookup and status check',
    agentTypes: ['followup'],
    prompts: AGENT_TEST_PROMPTS.followup,
    expectedBehaviors: ['Retrieves appointment', 'Provides status'],
  },
  {
    id: 'review',
    name: 'Review Collection',
    description: 'Test feedback collection and review prompts',
    agentTypes: ['review'],
    prompts: AGENT_TEST_PROMPTS.review,
    expectedBehaviors: ['Provides review links', 'Collects feedback'],
  },
  {
    id: 'quoting',
    name: 'Quote Generation',
    description: 'Test price quote functionality',
    agentTypes: ['quoting'],
    prompts: AGENT_TEST_PROMPTS.quoting,
    expectedBehaviors: ['Provides pricing', 'Generates quote'],
  },
  {
    id: 'dispatch',
    name: 'Dispatch Operations',
    description: 'Test technician dispatch and job tracking',
    agentTypes: ['dispatch', 'eta'],
    prompts: AGENT_TEST_PROMPTS.dispatch,
    expectedBehaviors: ['Shows technician info', 'Provides ETA'],
  },
  {
    id: 'invoice',
    name: 'Invoice Generation',
    description: 'Test invoice creation and payment processing',
    agentTypes: ['invoice'],
    prompts: AGENT_TEST_PROMPTS.invoice,
    expectedBehaviors: ['Creates invoice', 'Sends payment link'],
  },
  {
    id: 'inventory',
    name: 'Inventory Management',
    description: 'Test inventory tracking and alerts',
    agentTypes: ['inventory'],
    prompts: AGENT_TEST_PROMPTS.inventory,
    expectedBehaviors: ['Shows stock levels', 'Triggers reorders'],
  },
  {
    id: 'analytics',
    name: 'Business Analytics',
    description: 'Test insights and performance reporting',
    agentTypes: ['insights', 'performance', 'revenue', 'forecast'],
    prompts: AGENT_TEST_PROMPTS.insights,
    expectedBehaviors: ['Generates reports', 'Shows metrics'],
  },
];

// Agent names mapping
const AGENT_NAMES: Record<string, string> = {
  triage: 'AI Receptionist',
  booking: 'Booking Agent',
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
  social_content: 'Creative Content Agent',
  social_scheduler: 'Social Scheduler Agent',
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
  const [testMode, setTestMode] = useState<TestMode>('standard');
  const [isRunning, setIsRunning] = useState(false);
  const [results, setResults] = useState<TestResult[]>([]);
  const [progress, setProgress] = useState(0);
  const [healthStatus, setHealthStatus] = useState<HealthCheckResult | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const enabledAgents = agents.filter(a => a.is_enabled);

  // Health check function (quick mode)
  const runHealthCheck = useCallback(async (): Promise<HealthCheckResult | null> => {
    if (!companyId) return null;
    
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000); // 5s timeout for health check
      
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-agent-health`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
          body: JSON.stringify({ company_id: companyId }),
          signal: controller.signal,
        }
      );
      
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        return {
          status: 'unhealthy',
          timestamp: new Date().toISOString(),
          checks: {
            database: { status: 'error', latency_ms: 0, error: `HTTP ${response.status}` },
            agents: { total: 0, enabled: 0, configured: 0 },
            api_keys: { openai: false, elevenlabs: false },
          },
        };
      }
      
      return await response.json();
    } catch (error) {
      return {
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        checks: {
          database: { status: 'error', latency_ms: 0, error: error instanceof Error ? error.message : 'Unknown error' },
          agents: { total: 0, enabled: 0, configured: 0 },
          api_keys: { openai: false, elevenlabs: false },
        },
      };
    }
  }, [companyId]);

  // Simulated test using orchestrator (fast, <500ms) - used for Standard mode
  const runSimulatedTest = useCallback(async (
    agentType: string,
    prompt: string,
    scenario: string,
    signal?: AbortSignal
  ): Promise<TestResult> => {
    const startTime = Date.now();
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), THRESHOLDS.SIMULATED_TIMEOUT);
    
    if (signal) {
      signal.addEventListener('abort', () => controller.abort());
    }
    
    try {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-orchestrator`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
          body: JSON.stringify({
            action: 'test_agent',
            companyId,
            agentType,
            payload: { message: prompt }
          }),
          signal: controller.signal,
        }
      );

      clearTimeout(timeoutId);
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
      const content = data.response || '';
      const toolCalls = data.tool_calls || [];
      
      // Determine status based on simulated thresholds
      let status: TestResult['status'] = 'passed';
      if (responseTime >= THRESHOLDS.SIMULATED_SLOW) {
        status = 'slow';
      }
      
      // Check if agent actually processed the request
      if (!content && toolCalls.length === 0) {
        status = 'failed';
      }
      
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
      clearTimeout(timeoutId);
      const responseTime = Date.now() - startTime;
      
      if (error instanceof Error && error.name === 'AbortError') {
        return {
          agentType,
          agentName: AGENT_NAMES[agentType] || agentType,
          scenario,
          status: 'timeout',
          responseTime,
          error: 'Simulated test timed out',
          timestamp: new Date(),
        };
      }
      
      return {
        agentType,
        agentName: AGENT_NAMES[agentType] || agentType,
        scenario,
        status: 'failed',
        responseTime,
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date(),
      };
    }
  }, [companyId]);

  // Real AI test with timeout - used for Comprehensive mode
  const runRealAITest = useCallback(async (
    agentType: string, 
    prompt: string, 
    scenario: string,
    signal?: AbortSignal
  ): Promise<TestResult> => {
    const startTime = Date.now();
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), THRESHOLDS.TIMEOUT);
    
    if (signal) {
      signal.addEventListener('abort', () => controller.abort());
    }
    
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
            agent_type: agentType, // Hint for agent-specific behavior
            stream: false,
          }),
          signal: controller.signal,
        }
      );

      clearTimeout(timeoutId);
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
      
      // Determine status based on response time with comprehensive thresholds
      let status: TestResult['status'] = 'passed';
      if (responseTime >= THRESHOLDS.SLOW) {
        status = 'timeout';
      } else if (responseTime >= THRESHOLDS.PASS) {
        status = 'slow';
      }
      
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
      clearTimeout(timeoutId);
      const responseTime = Date.now() - startTime;
      
      if (error instanceof Error && error.name === 'AbortError') {
        return {
          agentType,
          agentName: AGENT_NAMES[agentType] || agentType,
          scenario,
          status: 'timeout',
          responseTime,
          error: 'Request timed out',
          timestamp: new Date(),
        };
      }
      
      return {
        agentType,
        agentName: AGENT_NAMES[agentType] || agentType,
        scenario,
        status: 'failed',
        responseTime,
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date(),
      };
    }
  }, [companyId]);

  // Run tests in parallel batches
  const runAllTests = useCallback(async () => {
    if (!companyId) return;
    
    setIsRunning(true);
    setResults([]);
    setProgress(0);
    setHealthStatus(null);
    
    abortControllerRef.current = new AbortController();
    const signal = abortControllerRef.current.signal;

    // Quick mode: just run health check
    if (testMode === 'quick') {
      const health = await runHealthCheck();
      setHealthStatus(health);
      
      // Generate results based on health check
      const healthResults: TestResult[] = enabledAgents.map(agent => ({
        agentType: agent.type,
        agentName: AGENT_NAMES[agent.type] || agent.name,
        scenario: 'Health Check',
        status: health?.status === 'healthy' ? 'passed' : 
                health?.status === 'degraded' ? 'slow' : 'failed',
        responseTime: health?.checks.database.latency_ms || 0,
        timestamp: new Date(),
      }));
      
      setResults(healthResults);
      setProgress(100);
      setIsRunning(false);
      return;
    }

    const agentsToTest = selectedAgents.length > 0 
      ? enabledAgents.filter(a => selectedAgents.includes(a.type))
      : enabledAgents;
    
    const scenariosToRun = selectedScenario === 'all' 
      ? TEST_SCENARIOS 
      : TEST_SCENARIOS.filter(s => s.id === selectedScenario);
    
    const totalTests = agentsToTest.length;
    let completed = 0;
    
    // Initialize all results as pending
    const initialResults: TestResult[] = agentsToTest.map(agent => {
      const relevantScenario = scenariosToRun.find(s => s.agentTypes.includes(agent.type));
      return {
        agentType: agent.type,
        agentName: AGENT_NAMES[agent.type] || agent.name,
        scenario: relevantScenario?.name || 'General Test',
        status: 'pending' as const,
        timestamp: new Date(),
      };
    });
    setResults(initialResults);

    // Process in batches
    for (let i = 0; i < agentsToTest.length; i += BATCH_SIZE) {
      if (signal.aborted) break;
      
      const batch = agentsToTest.slice(i, i + BATCH_SIZE);
      
      // Mark batch as running
      setResults(prev => prev.map(r => 
        batch.some(a => a.type === r.agentType) && r.status === 'pending'
          ? { ...r, status: 'running' as const }
          : r
      ));
      
      // Run batch in parallel - use appropriate test function based on mode
      const batchPromises = batch.map(async agent => {
        const relevantScenario = scenariosToRun.find(s => s.agentTypes.includes(agent.type));
        // Use agent-specific prompts or fall back to scenario prompts
        const agentPrompts = AGENT_TEST_PROMPTS[agent.type] || relevantScenario?.prompts || ['Hello, what can you help me with?'];
        const scenarioName = relevantScenario?.name || 'General Test';
        
        // Standard mode: Use simulated tests via orchestrator (fast)
        if (testMode === 'standard') {
          return runSimulatedTest(agent.type, agentPrompts[0], scenarioName, signal);
        }
        
        // Comprehensive mode: Use real AI with multiple prompts
        if (testMode === 'comprehensive' && agentPrompts.length > 1) {
          const results: TestResult[] = [];
          for (const prompt of agentPrompts) {
            if (signal.aborted) break;
            const result = await runRealAITest(agent.type, prompt, scenarioName, signal);
            results.push(result);
          }
          // Use worst result for comprehensive mode
          const worstStatus = results.some(r => r.status === 'failed') ? 'failed' :
                             results.some(r => r.status === 'timeout') ? 'timeout' :
                             results.some(r => r.status === 'slow') ? 'slow' : 'passed';
          const avgTime = results.reduce((sum, r) => sum + (r.responseTime || 0), 0) / results.length;
          return { ...results[0], status: worstStatus, responseTime: avgTime } as TestResult;
        }
        
        // Comprehensive mode with single prompt
        return runRealAITest(agent.type, agentPrompts[0], scenarioName, signal);
      });
      
      const batchResults = await Promise.all(batchPromises);
      
      // Update results with batch outcomes
      setResults(prev => prev.map(r => {
        const batchResult = batchResults.find(br => br.agentType === r.agentType);
        return batchResult || r;
      }));
      
      completed += batch.length;
      setProgress((completed / totalTests) * 100);
    }

    setIsRunning(false);
    abortControllerRef.current = null;
  }, [companyId, enabledAgents, selectedAgents, selectedScenario, testMode, runSimulatedTest, runRealAITest, runHealthCheck]);

  const stopTests = useCallback(() => {
    abortControllerRef.current?.abort();
    setIsRunning(false);
  }, []);

  const exportResults = useCallback(() => {
    const exportData = {
      timestamp: new Date().toISOString(),
      companyId,
      testMode,
      healthStatus,
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
        timeout: results.filter(r => r.status === 'timeout').length,
      },
      thresholds: THRESHOLDS,
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
  }, [results, companyId, testMode, healthStatus]);

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
  const timeoutCount = results.filter(r => r.status === 'timeout').length;

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
          {/* Test Mode & Scenario Selection */}
          <div className="flex flex-wrap gap-4">
            <div className="min-w-[150px]">
              <label className="text-sm font-medium mb-2 block">Test Mode</label>
              <Select value={testMode} onValueChange={(v) => setTestMode(v as TestMode)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="quick">
                    <div className="flex items-center gap-2">
                      <Zap className="h-4 w-4" />
                      Quick Health
                    </div>
                  </SelectItem>
                  <SelectItem value="standard">
                    <div className="flex items-center gap-2">
                      <Activity className="h-4 w-4" />
                      Standard
                    </div>
                  </SelectItem>
                  <SelectItem value="comprehensive">
                    <div className="flex items-center gap-2">
                      <Bot className="h-4 w-4" />
                      Comprehensive
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex-1 min-w-[200px]">
              <label className="text-sm font-medium mb-2 block">Test Scenario</label>
              <Select 
                value={selectedScenario} 
                onValueChange={setSelectedScenario}
                disabled={testMode === 'quick'}
              >
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
                  {testMode === 'quick' ? 'Run Health Check' : 'Run Tests'}
                </Button>
              ) : (
                <Button variant="destructive" onClick={stopTests}>
                  <Square className="h-4 w-4 mr-2" />
                  Stop
                </Button>
              )}
              
              <Button variant="outline" onClick={() => { setResults([]); setHealthStatus(null); }}>
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

          {/* Mode description */}
          <div className="text-sm text-muted-foreground bg-muted/50 p-3 rounded-lg">
            {testMode === 'quick' && (
              <span><strong>Quick Health:</strong> Fast connectivity check (~500ms). Tests DB, agent configs, and API keys without invoking AI.</span>
            )}
            {testMode === 'standard' && (
              <span><strong>Standard (Simulated):</strong> Fast agent-specific tests via orchestrator (~200ms per agent). Tests agent routing, tool calls, and response patterns without real AI inference.</span>
            )}
            {testMode === 'comprehensive' && (
              <span><strong>Comprehensive (Real AI):</strong> Full AI inference with agent hints. Pass: &lt;{THRESHOLDS.PASS/1000}s, Slow: {THRESHOLDS.PASS/1000}-{THRESHOLDS.SLOW/1000}s, Timeout: &gt;{THRESHOLDS.TIMEOUT/1000}s</span>
            )}
          </div>

          {/* Agent Selection (hidden in quick mode) */}
          {testMode !== 'quick' && (
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
          )}

          {/* Progress */}
          {isRunning && (
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Running tests... (batch size: {BATCH_SIZE})</span>
                <span>{Math.round(progress)}%</span>
              </div>
              <Progress value={progress} />
            </div>
          )}
        </CardContent>
      </Card>

      {/* Health Status Card (quick mode) */}
      {healthStatus && (
        <Card className={cn(
          healthStatus.status === 'healthy' && "border-green-500/30 bg-green-500/5",
          healthStatus.status === 'degraded' && "border-amber-500/30 bg-amber-500/5",
          healthStatus.status === 'unhealthy' && "border-red-500/30 bg-red-500/5"
        )}>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-lg">
              {healthStatus.status === 'healthy' && <CheckCircle2 className="h-5 w-5 text-green-500" />}
              {healthStatus.status === 'degraded' && <AlertTriangle className="h-5 w-5 text-amber-500" />}
              {healthStatus.status === 'unhealthy' && <XCircle className="h-5 w-5 text-red-500" />}
              System Health: {healthStatus.status.charAt(0).toUpperCase() + healthStatus.status.slice(1)}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-4 text-sm">
              <div>
                <p className="font-medium">Database</p>
                <p className={healthStatus.checks.database.status === 'ok' ? 'text-green-500' : 'text-red-500'}>
                  {healthStatus.checks.database.status === 'ok' 
                    ? `OK (${healthStatus.checks.database.latency_ms}ms)` 
                    : healthStatus.checks.database.error}
                </p>
              </div>
              <div>
                <p className="font-medium">Agents</p>
                <p>{healthStatus.checks.agents.enabled}/{healthStatus.checks.agents.total} enabled</p>
              </div>
              <div>
                <p className="font-medium">API Keys</p>
                <p>
                  OpenAI: {healthStatus.checks.api_keys.openai ? '✓' : '✗'} | 
                  ElevenLabs: {healthStatus.checks.api_keys.elevenlabs ? '✓' : '✗'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Results Summary */}
      {results.length > 0 && testMode !== 'quick' && (
        <div className="grid grid-cols-5 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold">{results.length}</div>
              <p className="text-sm text-muted-foreground">Total Tests</p>
            </CardContent>
          </Card>
          <Card className="border-green-500/30 bg-green-500/5">
            <CardContent className="pt-6">
              <div className="text-2xl font-bold text-green-500">{passedCount}</div>
              <p className="text-sm text-muted-foreground">Passed (&lt;{THRESHOLDS.PASS/1000}s)</p>
            </CardContent>
          </Card>
          <Card className="border-amber-500/30 bg-amber-500/5">
            <CardContent className="pt-6">
              <div className="text-2xl font-bold text-amber-500">{slowCount}</div>
              <p className="text-sm text-muted-foreground">Slow ({THRESHOLDS.PASS/1000}-{THRESHOLDS.SLOW/1000}s)</p>
            </CardContent>
          </Card>
          <Card className="border-orange-500/30 bg-orange-500/5">
            <CardContent className="pt-6">
              <div className="text-2xl font-bold text-orange-500">{timeoutCount}</div>
              <p className="text-sm text-muted-foreground">Timeout (&gt;{THRESHOLDS.TIMEOUT/1000}s)</p>
            </CardContent>
          </Card>
          <Card className="border-red-500/30 bg-red-500/5">
            <CardContent className="pt-6">
              <div className="text-2xl font-bold text-red-500">{failedCount}</div>
              <p className="text-sm text-muted-foreground">Failed</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Results List */}
      {results.length > 0 && testMode !== 'quick' && (
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
                      result.status === 'timeout' && "bg-orange-500/5 border-orange-500/20",
                      result.status === 'running' && "bg-blue-500/5 border-blue-500/20",
                      result.status === 'pending' && "bg-muted"
                    )}
                  >
                    <div className="flex items-center gap-3">
                      {result.status === 'passed' && <CheckCircle2 className="h-5 w-5 text-green-500" />}
                      {result.status === 'failed' && <XCircle className="h-5 w-5 text-red-500" />}
                      {result.status === 'slow' && <AlertTriangle className="h-5 w-5 text-amber-500" />}
                      {result.status === 'timeout' && <Clock className="h-5 w-5 text-orange-500" />}
                      {result.status === 'running' && <Clock className="h-5 w-5 text-cyan-400 animate-pulse" />}
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
                      {result.responseTime !== undefined && (
                        <Badge variant={
                          result.status === 'passed' ? 'secondary' :
                          result.status === 'slow' ? 'outline' : 'destructive'
                        }>
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
