---
name: Workflow Cards Hybrid Action
description: End-to-End Workflow cards expose two actions — Run with Aura (AI prompt) and Open Page (navigate to working surface)
type: feature
---
The `WorkflowChainButtons` component renders **two buttons per card**:
1. **Run with Aura** (primary) — fires `onTrigger(chain.command)` which routes through `useAuraCommand` to `/dashboard/analytics-reports?q=…` for AI execution. This is the platform's AI-first promise.
2. **Open Page** (secondary, only when `targetRoute` is set) — `navigate(chain.targetRoute)` to the relevant working surface (Quotes, Jobs, Dispatch Field Ops, Lead Pipeline, etc.).

Whole-card click is intentionally removed to prevent accidental AI runs.

**Adding new chains**: in `src/lib/industryFieldOpsWorkflows.ts`, the `resolveTargetRoute(id)` helper auto-maps known chain ids to routes. To add a route for a new id, extend that function. Per-chain `targetRoute` overrides are honored (set the field directly on a `WorkflowChain` to bypass the resolver).
