

# Automated Testing System for Aura Intercept AI Platform

## Current State
- No testing infrastructure exists
- No vitest/jest configuration
- No test files for components or edge functions
- Manual testing only via AIAgentChat console

---

## Proposed Testing Architecture

### Three Testing Layers

```text
+---------------------------+
|   E2E Integration Tests   |  ← Full user flows
+---------------------------+
|   Edge Function Tests     |  ← Backend AI logic (Deno)
+---------------------------+
|   Component Unit Tests    |  ← React components (Vitest)
+---------------------------+
```

---

## Layer 1: Frontend Component Tests

### Setup Requirements

| Package | Purpose |
|---------|---------|
| vitest | Test runner |
| @testing-library/react | Component rendering |
| @testing-library/jest-dom | DOM matchers |
| jsdom | Browser environment |

### Files to Create

| File | Purpose |
|------|---------|
| `vitest.config.ts` | Vitest configuration |
| `src/test/setup.ts` | Test environment setup |
| `src/test/mocks/supabase.ts` | Supabase client mock |

### Test Files

| Component | Test File |
|-----------|-----------|
| AIAgentChat | `src/components/ai/AIAgentChat.test.tsx` |
| useAIAgent hook | `src/hooks/useAIAgent.test.ts` |
| useAIAgentOrchestrator | `src/hooks/useAIAgentOrchestrator.test.ts` |

### Example Test Scenarios - AI Agent Chat
- Renders empty state with suggestions
- Sends user message and shows loading
- Displays assistant response
- Handles error states
- Clears message history

---

## Layer 2: Edge Function Tests (Deno)

### Test Files to Create

| Edge Function | Test File |
|---------------|-----------|
| ai-agent | `supabase/functions/ai-agent/index_test.ts` |
| ai-orchestrator | `supabase/functions/ai-orchestrator/index_test.ts` |
| ai-agent-chat | `supabase/functions/ai-agent-chat/index_test.ts` |

### Test Scenarios - AI Agent

| Scenario | What it Tests |
|----------|---------------|
| Rate limiting | 30 requests/min per IP |
| Message validation | Required fields, sanitization |
| Company context loading | Knowledge base retrieval |
| Response streaming | SSE format compliance |
| Error handling | 400/401/429/500 responses |

### Test Scenarios - AI Orchestrator

| Scenario | What it Tests |
|----------|---------------|
| Agent handoff | Triage → Booking flow |
| Context creation | Session persistence |
| Event emission | Database logging |
| Settings retrieval | Agent configuration |

---

## Layer 3: AI Agent Test Suite

### Automated Test Console Component

Create `src/components/ai/AIAgentTestSuite.tsx` - A dedicated test runner UI that:

1. **Predefined Test Scenarios**: Common conversation flows
2. **Batch Testing**: Run all 24 agents with standard prompts
3. **Response Validation**: Check for expected intents/actions
4. **Performance Metrics**: Response time tracking
5. **Export Results**: JSON/CSV test reports

### Test Scenario Categories

| Category | Example Prompts |
|----------|-----------------|
| Triage | "What services do you offer?" |
| Booking | "I'd like to schedule an appointment for Tuesday" |
| Follow-up | "When is my next appointment?" |
| Review | "How can I leave a review?" |
| Lead | "I'm interested in your premium package" |
| Dispatch | "Who is assigned to my job?" |

### Console Features

```text
+-------------------------------------------+
|  AI Agent Test Suite                  [▶] |
+-------------------------------------------+
| Agent: [Dropdown - All 24 agents]         |
| Scenario: [Dropdown - Test categories]    |
+-------------------------------------------+
| [ ] Triage Agent           ✓ Pass (1.2s) |
| [ ] Scheduling Agent       ✓ Pass (0.8s) |
| [ ] Follow-up Agent        ⚠ Slow (3.5s) |
| [ ] Review Agent           ✗ Fail        |
+-------------------------------------------+
| Total: 24 | Pass: 21 | Fail: 1 | Skip: 2 |
+-------------------------------------------+
```

---

## Implementation Plan

### Phase 1: Testing Infrastructure
1. Install testing dependencies (vitest, testing-library)
2. Create vitest.config.ts
3. Create test setup file with mocks
4. Update tsconfig for test types

### Phase 2: Component Tests
1. Create Supabase mock utilities
2. Write AIAgentChat tests
3. Write useAIAgent hook tests
4. Write useAIAgentOrchestrator tests

### Phase 3: Edge Function Tests
1. Create ai-agent test file
2. Create ai-orchestrator test file
3. Add test scenarios for each endpoint

### Phase 4: AI Test Suite Console
1. Create AIAgentTestSuite component
2. Define test scenarios per agent
3. Add to AI Operatives Hub as new tab
4. Implement result export

---

## Files to Create/Modify

| File | Action |
|------|--------|
| `package.json` | ADD - Testing dependencies |
| `vitest.config.ts` | CREATE - Vitest configuration |
| `tsconfig.app.json` | MODIFY - Add vitest types |
| `src/test/setup.ts` | CREATE - Test setup |
| `src/test/mocks/supabase.ts` | CREATE - Supabase mocks |
| `src/components/ai/AIAgentChat.test.tsx` | CREATE - Chat tests |
| `src/hooks/useAIAgent.test.ts` | CREATE - Hook tests |
| `supabase/functions/ai-agent/index_test.ts` | CREATE - Edge function tests |
| `src/components/ai/AIAgentTestSuite.tsx` | CREATE - Test console UI |
| `src/pages/AIOperativesHub.tsx` | MODIFY - Add Testing tab |

---

## Test Commands

After implementation:
- **Frontend tests**: Run via Vitest tool
- **Edge function tests**: Run via Deno test tool
- **Manual AI tests**: Use AIAgentTestSuite in dashboard

