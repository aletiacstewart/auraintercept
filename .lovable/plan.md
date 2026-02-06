

# AI Agent Functionality Investigation & Fix Plan

## Executive Summary
The AI Agent Test Suite has fundamental issues beyond simple timeout thresholds. The tests call a unified `ai-agent` endpoint without agent-specific routing, meaning the "Invoice Agent" test doesn't actually test the invoice agent - it just sends a generic message and hopes the AI figures out what to do.

## Root Cause Analysis

### Current Architecture Issues

| Issue | Impact | Current Behavior |
|-------|--------|------------------|
| No Agent Routing | Tests don't target specific agents | All tests call same unified endpoint |
| Double AI Calls | 7-18s latency for tool-based agents | Initial call + follow-up after tool execution |
| Unused Test Endpoint | Faster testing option exists but isn't used | `ai-orchestrator/test_agent` provides quick simulated tests |
| No Agent Type Hints | AI must infer intent from message | No way to force specific agent behavior |

### How Tests Currently Work

```text
Current Flow (SLOW - 7-18 seconds):
┌──────────────────────┐
│   Test Suite         │
│   (Invoice Agent)    │
└──────────┬───────────┘
           │ Generic message: "Can I get an invoice?"
           ▼
┌──────────────────────┐
│   ai-agent function  │
│   (unified endpoint) │
└──────────┬───────────┘
           │
           ├──► Fetch knowledge base (4-5 DB calls)
           │
           ├──► 1st AI API call (3-8 sec)
           │    "What tools should I use?"
           │
           ├──► Execute tool calls (0.5-2 sec)
           │    (create_invoice, generate_payment_link)
           │
           └──► 2nd AI API call (3-8 sec)
                "Format response with tool results"
                
Total: 7-18 seconds per test
```

### Why Invoice Agent Times Out
The Invoice Agent test prompt triggers tool calls (`create_invoice`, `generate_payment_link`), requiring:
- 1st AI call to detect intent
- Tool execution
- 2nd AI call to format response
- Total: ~12-18 seconds, exceeding previous 15s timeout

## Proposed Solution

### Dual-Mode Testing Architecture

```text
Option 1: Quick Functional Tests (< 500ms)
┌──────────────────────┐
│   Test Suite         │
│   Mode: Quick/Standard│
└──────────┬───────────┘
           │
           ▼
┌──────────────────────┐
│  ai-orchestrator     │
│  action: test_agent  │
│  (simulated response)│
└──────────────────────┘
- Pattern matching, no AI inference
- Tests agent routing logic
- Tests tool call simulation


Option 2: Full AI Tests (10-30 sec)
┌──────────────────────┐
│   Test Suite         │
│   Mode: Comprehensive│
└──────────┬───────────┘
           │ Include agent_type hint
           ▼
┌──────────────────────┐
│   ai-agent function  │
│   (with agent hint)  │
└──────────────────────┘
- Real AI inference
- Tests actual AI behavior
- Used sparingly for validation
```

## Implementation Steps

### Step 1: Update Test Suite to Use Orchestrator for Quick Tests
Modify `AIAgentTestSuite.tsx` to call `ai-orchestrator` with `action: test_agent` for Quick and Standard modes, which provides fast simulated responses (< 500ms) without real AI inference.

Changes:
- Add new `runSimulatedTest` function that calls orchestrator
- Use simulated tests for Quick/Standard modes
- Reserve real `ai-agent` calls for Comprehensive mode only

### Step 2: Add Agent-Type Hints to ai-agent Function
Modify the `ai-agent` edge function to accept an optional `agent_type` parameter that biases the AI toward specific tool usage and response patterns.

Changes:
- Accept `agent_type` parameter in request body
- Add agent-specific system prompt sections
- Prioritize relevant tools for the specified agent

### Step 3: Optimize ai-agent Performance
Reduce latency for real AI tests:

| Optimization | Expected Savings |
|--------------|------------------|
| Cache knowledge base per company (5 min TTL) | 1-2 seconds |
| Use lighter model for simple queries | 2-4 seconds |
| Parallel tool execution | 0.5-1 second |

### Step 4: Add Agent-Specific Test Scenarios
Enhance test scenarios with agent-targeted prompts that better match each agent's capabilities.

| Agent Type | Current Prompt | Improved Prompt |
|------------|----------------|-----------------|
| invoice | "Can I get an invoice?" | "Generate invoice for job #123 with labor $190 and parts $245" |
| dispatch | "Who is assigned?" | "Emergency: customer at 123 Main St has a water leak, dispatch nearest tech" |
| quoting | "How much?" | "I need a quote for AC repair and filter replacement" |

## Files to Modify

| File | Changes |
|------|---------|
| `src/components/ai/AIAgentTestSuite.tsx` | Add orchestrator-based simulated testing for Quick/Standard modes |
| `supabase/functions/ai-agent/index.ts` | Add agent_type parameter support and optimizations |
| `supabase/functions/ai-orchestrator/index.ts` | Add more comprehensive test_agent scenarios |

## Technical Details

### AIAgentTestSuite.tsx Changes

```text
New runSimulatedTest function:
- Calls: supabase.functions.invoke('ai-orchestrator', {
    body: {
      action: 'test_agent',
      companyId,
      agentType,
      payload: { message: prompt }
    }
  })
- Returns in < 500ms with simulated response
- Tests agent routing and tool call logic

Mode routing:
- Quick mode: Health check only (existing)
- Standard mode: Use simulated tests via orchestrator
- Comprehensive mode: Use real AI tests via ai-agent
```

### ai-agent/index.ts Changes

```text
New agent_type parameter handling:
- Add to request body parsing
- Create agent-specific system prompt additions
- Bias tool_choice toward agent-relevant tools

Example for invoice agent:
- Append to system prompt: "Focus on invoice generation, payment processing"
- Set tool_choice preference for: create_invoice, generate_payment_link
```

### Test Scenarios Enhancement

```text
Invoice Agent scenarios:
1. "Create an invoice for the completed job" 
   - Expected: Uses create_invoice tool
   - Validates: Invoice number returned

2. "Send payment reminder for overdue invoice #123"
   - Expected: Uses send_reminder tool  
   - Validates: Reminder confirmation

Dispatch Agent scenarios:
1. "Emergency dispatch needed at 456 Oak St"
   - Expected: Uses find_nearest_tech, assign_job tools
   - Validates: Tech assignment confirmation

2. "What technician is closest to downtown?"
   - Expected: Uses find_nearest_tech tool
   - Validates: Distance/ETA information
```

## Expected Results After Implementation

| Mode | Test Count | Time per Test | Total Time |
|------|------------|---------------|------------|
| Quick Health | 24 agents | ~50ms | ~2 seconds |
| Standard (simulated) | 24 agents | ~200ms | ~5 seconds |
| Comprehensive (real AI) | 24 agents | ~8-15s | ~3-6 minutes |

## Verification Steps
After implementation:
1. Run Quick Health tests - all should pass in < 5 seconds
2. Run Standard tests - all should pass with simulated responses in < 30 seconds  
3. Run Comprehensive tests - validates real AI behavior, allows 30s per agent
4. Verify Invoice Agent specifically returns proper invoice generation response
5. Check that agent-type hints improve response relevance

