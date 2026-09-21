/**
 * Distributed tracing for agent requests.
 *
 * One trace per inbound request; one span per unit of work (model call, tool
 * call, handoff, event emission). Spans buffer in memory and flush in a single
 * batched insert into `ai_agent_logs` so tracing never blocks a response.
 *
 * Usage:
 *   const tracer = startTrace(supabase, { companyId, agentType, channel: 'chat' });
 *   const span = tracer.span('agent.model', { model });
 *   ... span.end('ok', { tokens }) / span.end('error', { error: e.message })
 *   await tracer.finish();
 */

export type SpanStatus = 'ok' | 'error';

export interface SpanAttributes {
  [key: string]: unknown;
}

export interface Span {
  /** Span id, so children can nest under it. */
  id: string;
  /** Close the span and record its duration. Safe to call twice (second is a no-op). */
  end(status?: SpanStatus, attrs?: SpanAttributes): void;
  /** Open a child span nested under this one. */
  child(name: string, attrs?: SpanAttributes): Span;
}

export interface TraceOptions {
  companyId?: string | null;
  agentType?: string | null;
  /** Reuse an existing trace id (handoffs and workflow runs share one trace). */
  traceId?: string | null;
  /** Span this trace hangs off, when it was started by another function. */
  parentSpanId?: string | null;
  channel?: string | null;
  contextId?: string | null;
}

interface BufferedSpan {
  company_id: string | null;
  agent_type: string | null;
  context_id: string | null;
  action: string;
  span_name: string;
  trace_id: string;
  span_id: string;
  parent_span_id: string | null;
  input_data: Record<string, unknown>;
  output_data: Record<string, unknown>;
  duration_ms: number | null;
  success: boolean;
  status: SpanStatus;
  error_message: string | null;
  created_at: string;
}

export interface RequestTracer {
  traceId: string;
  rootSpanId: string;
  /** Open a span at the root of this trace. */
  span(name: string, attrs?: SpanAttributes): Span;
  /** Close the root span and write every buffered span. Never throws. */
  finish(status?: SpanStatus, attrs?: SpanAttributes): Promise<void>;
  /** Ids to hand to the next function/agent so its spans join this trace. */
  propagation(): { traceId: string; parentSpanId: string };
}

const uuid = () => crypto.randomUUID();

/** Keep span attributes small — logs are read by humans, not a warehouse. */
function trim(attrs: SpanAttributes | undefined): Record<string, unknown> {
  if (!attrs) return {};
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(attrs)) {
    if (v === undefined) continue;
    if (typeof v === 'string' && v.length > 500) out[k] = `${v.slice(0, 500)}…`;
    else out[k] = v;
  }
  return out;
}

export function startTrace(supabase: any, options: TraceOptions = {}): RequestTracer {
  const traceId = options.traceId || uuid();
  const rootSpanId = uuid();
  const rootStart = Date.now();
  const buffer: BufferedSpan[] = [];
  const companyId = options.companyId ?? null;

  const makeSpan = (name: string, parentSpanId: string, attrs?: SpanAttributes): Span => {
    const id = uuid();
    const started = Date.now();
    let closed = false;

    return {
      id,
      end(status: SpanStatus = 'ok', endAttrs?: SpanAttributes) {
        if (closed) return;
        closed = true;
        const merged = { ...trim(attrs), ...trim(endAttrs) };
        buffer.push({
          company_id: companyId,
          agent_type: (merged.agent as string) || options.agentType || null,
          context_id: options.contextId ?? null,
          action: 'span',
          span_name: name,
          trace_id: traceId,
          span_id: id,
          parent_span_id: parentSpanId,
          input_data: { attrs: merged },
          output_data: {},
          duration_ms: Date.now() - started,
          success: status === 'ok',
          status,
          error_message: typeof merged.error === 'string' ? merged.error.slice(0, 500) : null,
          created_at: new Date(started).toISOString(),
        });
      },
      child(childName: string, childAttrs?: SpanAttributes) {
        return makeSpan(childName, id, childAttrs);
      },
    };
  };

  return {
    traceId,
    rootSpanId,
    span: (name, attrs) => makeSpan(name, rootSpanId, attrs),
    propagation: () => ({ traceId, parentSpanId: rootSpanId }),
    async finish(status: SpanStatus = 'ok', attrs?: SpanAttributes) {
      const merged = trim(attrs);
      buffer.push({
        company_id: companyId,
        agent_type: options.agentType ?? null,
        context_id: options.contextId ?? null,
        action: 'request',
        span_name: `request.${options.channel || 'chat'}`,
        trace_id: traceId,
        span_id: rootSpanId,
        parent_span_id: options.parentSpanId ?? null,
        input_data: { channel: options.channel || 'chat' },
        output_data: merged,
        duration_ms: Date.now() - rootStart,
        success: status === 'ok',
        status,
        error_message: typeof merged.error === 'string' ? merged.error.slice(0, 500) : null,
        created_at: new Date(rootStart).toISOString(),
      });

      try {
        const { error } = await supabase.from('ai_agent_logs').insert(buffer);
        if (error) console.error('[Tracing] Span flush failed:', error.message);
      } catch (e) {
        // Never let observability break the request it is observing.
        console.error('[Tracing] Span flush threw:', e);
      } finally {
        buffer.length = 0;
      }
    },
  };
}

/**
 * Run `fn` inside a span, closing it with the right status either way.
 */
export async function traced<T>(span: Span, fn: () => Promise<T>): Promise<T> {
  try {
    const result = await fn();
    span.end('ok');
    return result;
  } catch (e: any) {
    span.end('error', { error: e?.message ?? String(e) });
    throw e;
  }
}
