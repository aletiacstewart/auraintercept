# Memory: features/testing/ai-agent-test-suite-performance-thresholds
Updated: now

The AI Agent Test Suite uses dual-mode testing with different thresholds:

## Standard Mode (Simulated via Orchestrator)
- Uses `ai-orchestrator` with `action: test_agent` for fast pattern-matched responses
- Pass threshold: < 500ms
- Slow warning: 500ms-2s  
- Timeout: > 5s
- Tests agent routing logic and tool call simulation without real AI inference

## Comprehensive Mode (Real AI)
- Uses real `ai-agent` endpoint with agent_type hints for biased behavior
- Pass threshold: < 10 seconds
- Slow warning: 10-25 seconds
- Timeout/Fail: > 30 seconds
- Tests actual AI inference with multiple prompts per agent

## Quick Health Mode
- Uses `ai-agent-health` endpoint for connectivity checks
- Tests DB connectivity, agent configs, and API key presence
- No AI inference - returns in ~500ms

Tests execute in parallel batches of 5 agents to optimize total execution time.
