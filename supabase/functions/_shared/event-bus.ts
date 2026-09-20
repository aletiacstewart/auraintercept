/**
 * Durable, non-blocking event bus for agent-to-agent communication.
 *
 * emit() writes one row per subscriber (plus a broadcast row) into
 * `ai_agent_events` and returns immediately — it never waits for agent work and
 * never throws into the caller's request path. Delivery happens in the
 * ai-orchestrator `process_pending_events` worker, which runs every 2 minutes
 * and retries failures.
 *
 * Subscriptions are declared in event-subscriptions.ts.
 */

import type { AgentContext } from './agent-context.ts';
import {
  AgentEventName,
  normalizeEventName,
  subscribersForEvent,
  subscriptionsForAgent,
} from './event-subscriptions.ts';

/** Max delivery attempts before an event is parked as failed. */
export const MAX_EVENT_ATTEMPTS = 3;

export interface AppointmentEventPayload {
  appointmentId: string;
  customerId?: string | null;
  scheduledAt?: string | null;
  serviceName?: string | null;
  address?: string | null;
  status?: string | null;
}

export interface TechnicianEventPayload {
  technicianId: string;
  technicianName?: string | null;
  appointmentId?: string | null;
  jobAssignmentId?: string | null;
  scheduledAt?: string | null;
}

export interface JobEventPayload {
  jobAssignmentId: string;
  appointmentId?: string | null;
  technicianId?: string | null;
  customerId?: string | null;
  completedAt?: string | null;
  outcome?: string | null;
}

export type AgentEventPayload =
  | AppointmentEventPayload
  | TechnicianEventPayload
  | JobEventPayload
  | Record<string, unknown>;

export interface AgentEvent {
  /** Canonical or legacy event name. */
  name: AgentEventName | string;
  companyId: string;
  /** Agent (or system component) that produced the event. */
  sourceAgent: string;
  payload?: AgentEventPayload;
  /** Structured handoff context carried alongside the event, when available. */
  agentContext?: AgentContext | null;
  /** Shared conversation context id, when the event came from a conversation. */
  contextId?: string | null;
}

export interface EmitResult {
  event: string;
  targets: string[];
  eventsCreated: number;
  /** Set when the durable write failed; emit never throws. */
  error?: string;
}

/** Decides which agents may receive an event for this company. */
export type SubscriberFilter = (agentType: string) => boolean;

export class EventBus {
  private readonly supabase: any;
  /** Runtime subscriptions layered on top of the declarative ones. */
  private readonly extra = new Map<string, Set<string>>();

  constructor(supabase: any) {
    this.supabase = supabase;
  }

  /** Register an extra subscriber at runtime (declarative list stays the default). */
  subscribe(eventName: AgentEventName | string, agentType: string): void {
    const canonical = normalizeEventName(eventName);
    const set = this.extra.get(canonical) ?? new Set<string>();
    set.add(agentType);
    this.extra.set(canonical, set);
  }

  /** Remove a runtime subscription. */
  unsubscribe(eventName: AgentEventName | string, agentType: string): void {
    this.extra.get(normalizeEventName(eventName))?.delete(agentType);
  }

  /** All agents subscribed to an event — declarative plus runtime. */
  subscribers(eventName: AgentEventName | string): string[] {
    const canonical = normalizeEventName(eventName);
    const declared = subscribersForEvent(canonical);
    const runtime = Array.from(this.extra.get(canonical) ?? []);
    return Array.from(new Set([...declared, ...runtime]));
  }

  /** What an agent listens for, with plain-English reasons (service discovery). */
  subscriptionsOf(agentType: string) {
    return subscriptionsForAgent(agentType);
  }

  /**
   * Emit an event. Durable and async: rows are written for each eligible
   * subscriber and delivered later by the worker. Returns without waiting for
   * any agent to run, and resolves with an `error` string instead of throwing.
   */
  async emit(event: AgentEvent, filter?: SubscriberFilter): Promise<EmitResult> {
    const canonical = normalizeEventName(event.name);
    const allSubscribers = this.subscribers(canonical)
      .filter((agent) => agent !== event.sourceAgent);
    const targets = filter ? allSubscribers.filter(filter) : allSubscribers;

    const payload = {
      ...(event.payload || {}),
      ...(event.contextId ? { context_id: event.contextId } : {}),
      ...(event.agentContext ? { agent_context: event.agentContext } : {}),
    };

    const rows = targets.map((targetAgent) => ({
      company_id: event.companyId,
      source_agent: event.sourceAgent,
      target_agent: targetAgent,
      event_type: canonical,
      payload,
      status: 'pending',
      attempt_count: 0,
      next_attempt_at: new Date().toISOString(),
    }));

    // Broadcast row: the durable audit record, already "processed".
    rows.push({
      company_id: event.companyId,
      source_agent: event.sourceAgent,
      target_agent: null as any,
      event_type: canonical,
      payload,
      status: 'processed',
      attempt_count: 0,
      next_attempt_at: null as any,
    });

    try {
      const { data, error } = await this.supabase
        .from('ai_agent_events')
        .insert(rows)
        .select('id');
      if (error) throw error;
      return { event: canonical, targets, eventsCreated: data?.length ?? 0 };
    } catch (err: any) {
      // Never break the caller's request because an event could not be logged.
      console.error(`[EventBus] Failed to emit ${canonical}:`, err?.message || err);
      return { event: canonical, targets, eventsCreated: 0, error: err?.message || 'emit failed' };
    }
  }

  /**
   * Fire-and-forget emit for request paths that must not wait at all
   * (e.g. a booking confirmation returning to the customer).
   */
  emitDetached(event: AgentEvent, filter?: SubscriberFilter): void {
    void this.emit(event, filter);
  }
}

/** Convenience factory. */
export function createEventBus(supabase: any): EventBus {
  return new EventBus(supabase);
}

/** Back-off between delivery attempts (minutes): 2, 10, 30. */
export function nextAttemptDelayMs(attemptCount: number): number {
  const minutes = [2, 10, 30][Math.min(attemptCount, 2)];
  return minutes * 60 * 1000;
}
