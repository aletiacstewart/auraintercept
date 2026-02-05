
# Fix AI Agent Test Suite Performance

## Problem Analysis

| Issue | Impact |
|-------|--------|
| Sequential test execution | Total time = N agents × (response time + 500ms delay) |
| 3-second "slow" threshold | AI with tool calls typically takes 4-6 seconds |
| Full edge function calls | Each test does: DB lookup → AI call → tool execution → AI follow-up |
| No test/health endpoint | Must invoke full AI pipeline for simple checks |

---

## Proposed Solution: Multi-Pronged Approach

### 1. Adjust Test Thresholds

| Threshold | Current | Proposed |
|-----------|---------|----------|
| Slow warning | 3 seconds | 8 seconds |
| Timeout/Fail | None | 15 seconds |
| Pass | < 3s | < 8s |

### 2. Add Parallel Test Execution

Run tests in batches of 3-5 concurrent requests instead of sequentially:
- Batch size: 5 agents at a time
- Reduces total test time by ~80%
- Respects rate limits (30 req/min)

### 3. Create Lightweight Health Check Endpoint

New edge function `ai-agent-health` that:
- Returns agent availability status without AI call
- Checks DB connectivity
- Verifies API key configuration
- Response time: < 500ms

### 4. Add Test Modes to Test Suite

| Mode | Description | Use Case |
|------|-------------|----------|
| Quick Health | Ping health endpoint only | Fast status check |
| Standard | Single prompt per agent | Normal testing |
| Comprehensive | Multiple scenarios per agent | Deep testing |

### 5. Implement Request Timeout

Add AbortController with 15-second timeout to prevent hanging tests.

---

## Technical Implementation

### Files to Modify

| File | Changes |
|------|---------|
| `src/components/ai/AIAgentTestSuite.tsx` | Parallel execution, adjusted thresholds, test modes, timeouts |
| `supabase/functions/ai-agent-health/index.ts` | CREATE - Lightweight health check endpoint |

### Key Code Changes

**Parallel Execution Pattern:**
```typescript
// Process in batches of 5
const BATCH_SIZE = 5;
for (let i = 0; i < agents.length; i += BATCH_SIZE) {
  const batch = agents.slice(i, i + BATCH_SIZE);
  await Promise.all(batch.map(agent => runTest(agent)));
}
```

**Timeout Pattern:**
```typescript
const controller = new AbortController();
const timeoutId = setTimeout(() => controller.abort(), 15000);
const response = await fetch(url, { signal: controller.signal });
clearTimeout(timeoutId);
```

**Threshold Constants:**
```typescript
const THRESHOLDS = {
  PASS: 8000,      // Under 8s = passed
  SLOW: 15000,     // 8-15s = slow warning
  TIMEOUT: 15000   // Over 15s = failed/timeout
};
```

---

## Expected Results

| Metric | Before | After |
|--------|--------|-------|
| Test time (24 agents) | ~3-4 minutes | ~30-45 seconds |
| Pass rate | ~5% | ~80%+ |
| False "slow" flags | ~90% | ~10% |

---

## Files to Create/Modify

| File | Action |
|------|--------|
| `src/components/ai/AIAgentTestSuite.tsx` | MODIFY - Add parallel execution, thresholds, timeouts |
| `supabase/functions/ai-agent-health/index.ts` | CREATE - Lightweight health endpoint |
