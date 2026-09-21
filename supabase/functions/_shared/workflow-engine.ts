/**
 * Workflow engine: runs the multi-step agent sequences declared in
 * workflow-definitions.ts.
 *
 * Design rules:
 * - non-blocking: startWorkflow() creates the run and returns immediately; the
 *   ai-orchestrator background worker advances due runs.
 * - durable: every step outcome is persisted on `workflow_runs.steps`.
 * - safe: a failing step retries up to MAX_STEP_ATTEMPTS with growing delays,
 *   then either skips (optional steps) or escalates the run to a human.
 */

import {
  AgentContext,
  buildAgentContext,
  mergeAgentContext,
  parseAgentContext,
} from './agent-context.ts';
import { MAX_EVENT_ATTEMPTS, nextAttemptDelayMs } from './event-bus.ts';
import {
  WorkflowDefinition,
  WorkflowStepDefinition,
  getWorkflowDefinition,
} from './workflow-definitions.ts';

/** Attempts per step before it is skipped or escalated. */
export const MAX_STEP_ATTEMPTS = MAX_EVENT_ATTEMPTS;

export type WorkflowRunStatus =
  | 'running'
  | 'waiting'
  | 'escalated'
  | 'completed'
  | 'cancelled';

export type WorkflowStepStatus =
  | 'pending'
  | 'running'
  | 'completed'
  | 'skipped'
  | 'failed';

export interface WorkflowStepState {
  key: string;
  label: string;
  agent: string;
  status: WorkflowStepStatus;
  attempts: number;
  startedAt?: string | null;
  finishedAt?: string | null;
  error?: string | null;
  /** Short summary of what the agent reported. */
  result?: string | null;
}

export interface WorkflowRun {
  id: string;
  company_id: string;
  workflow_key: string;
  title: string | null;
  status: WorkflowRunStatus;
  current_step: number;
  context: Record<string, unknown>;
  steps: WorkflowStepState[];
  attempt_count: number;
  next_attempt_at: string | null;
  error_message: string | null;
  escalated_at: string | null;
  completed_at: string | null;
}

export interface WorkflowEngineOptions {
  supabase: any;
  supabaseUrl: string;
  serviceKey: string;
}

/** Fill `{{dotted.path}}` placeholders from the run context. */
export function renderInstruction(template: string, ctx: AgentContext): string {
  return template.replace(/\{\{([\w.]+)\}\}/g, (_match, path: string) => {
    const value = path
      .split('.')
      .reduce<any>((acc, key) => (acc == null ? acc : acc[key]), ctx as any);
    if (value === undefined || value === null || value === '') return 'not provided';
    return String(value);
  });
}

function initialSteps(definition: WorkflowDefinition): WorkflowStepState[] {
  return definition.steps.map((step) => ({
    key: step.key,
    label: step.label,
    agent: step.agent,
    status: 'pending' as WorkflowStepStatus,
    attempts: 0,
  }));
}

export class WorkflowEngine {
  private supabase: any;
  private supabaseUrl: string;
  private serviceKey: string;

  constructor(options: WorkflowEngineOptions) {
    this.supabase = options.supabase;
    this.supabaseUrl = options.supabaseUrl;
    this.serviceKey = options.serviceKey;
  }

  /** Create a run and return straight away. Never throws into the caller. */
  async startWorkflow(
    workflowKey: string,
    companyId: string,
    contextInput: Partial<AgentContext> & Record<string, unknown> = {},
    startedBy?: string | null,
  ): Promise<{ ok: boolean; runId?: string; error?: string }> {
    const definition = getWorkflowDefinition(workflowKey);
    if (!definition) return { ok: false, error: `Unknown workflow: ${workflowKey}` };

    const context = buildAgentContext({
      companyId,
      fromAgent: 'workflow_orchestrator',
      toAgent: definition.steps[0]?.agent ?? 'triage',
      reason: definition.name,
      appointmentId: (contextInput as any).appointmentId ?? null,
      customerId: (contextInput as any).customerId ?? null,
      jobId: (contextInput as any).jobId ?? null,
      customer: (contextInput as any).customer ?? null,
      metadata: (contextInput as any).metadata ?? null,
    });

    const { data, error } = await this.supabase
      .from('workflow_runs')
      .insert({
        company_id: companyId,
        workflow_key: definition.key,
        title: definition.name,
        status: 'running',
        current_step: 0,
        context: { ...context, workflowId: null },
        steps: initialSteps(definition),
        next_attempt_at: new Date().toISOString(),
        started_by: startedBy ?? null,
      })
      .select('id')
      .maybeSingle();

    if (error) {
      console.error('[Workflow] Failed to start run:', error);
      return { ok: false, error: error.message };
    }

    // The run id doubles as the workflow id carried in the agent context.
    await this.supabase
      .from('workflow_runs')
      .update({ context: { ...context, workflowId: data.id } })
      .eq('id', data.id);

    console.log(`[Workflow] Started ${definition.key} run ${data.id}`);
    return { ok: true, runId: data.id };
  }

  async getRun(runId: string): Promise<WorkflowRun | null> {
    const { data } = await this.supabase
      .from('workflow_runs')
      .select('*')
      .eq('id', runId)
      .maybeSingle();
    return (data as WorkflowRun) ?? null;
  }

  /** Runs due for their next step (used by the background worker). */
  async dueRuns(companyId?: string, limit = 20): Promise<WorkflowRun[]> {
    let query = this.supabase
      .from('workflow_runs')
      .select('*')
      .in('status', ['running', 'waiting'])
      .or(`next_attempt_at.is.null,next_attempt_at.lte.${new Date().toISOString()}`)
      .order('created_at', { ascending: true })
      .limit(limit);
    if (companyId) query = query.eq('company_id', companyId);
    const { data, error } = await query;
    if (error) {
      console.error('[Workflow] Failed to load due runs:', error);
      return [];
    }
    return (data as WorkflowRun[]) || [];
  }

  /**
   * Execute the run's current step and record the outcome. One step per call so
   * a single invocation never blocks for long.
   */
  async advanceWorkflow(runId: string): Promise<{ status: WorkflowRunStatus; step?: string }> {
    const run = await this.getRun(runId);
    if (!run) return { status: 'cancelled' };
    if (run.status === 'completed' || run.status === 'cancelled') {
      return { status: run.status };
    }

    const definition = getWorkflowDefinition(run.workflow_key);
    if (!definition) {
      await this.escalate(run, 'This workflow no longer exists.');
      return { status: 'escalated' };
    }

    const stepDef: WorkflowStepDefinition | undefined = definition.steps[run.current_step];
    if (!stepDef) return await this.complete(run);

    const steps = [...(run.steps || [])];
    const state = steps[run.current_step] ?? {
      key: stepDef.key,
      label: stepDef.label,
      agent: stepDef.agent,
      status: 'pending' as WorkflowStepStatus,
      attempts: 0,
    };
    const attempt = (state.attempts || 0) + 1;
    steps[run.current_step] = {
      ...state,
      status: 'running',
      attempts: attempt,
      startedAt: state.startedAt || new Date().toISOString(),
    };
    await this.supabase
      .from('workflow_runs')
      .update({ steps, status: 'running' })
      .eq('id', run.id);

    const context = parseAgentContext(run.context) ??
      buildAgentContext({ companyId: run.company_id, fromAgent: 'workflow_orchestrator', toAgent: stepDef.agent });

    try {
      const result = await this.runStep(run, stepDef, context);
      steps[run.current_step] = {
        ...steps[run.current_step],
        status: 'completed',
        finishedAt: new Date().toISOString(),
        error: null,
        result: result.summary,
      };
      const nextContext = mergeAgentContext(context, {
        companyId: run.company_id,
        fromAgent: stepDef.agent,
        toAgent: definition.steps[run.current_step + 1]?.agent ?? stepDef.agent,
        reason: definition.name,
        workflowId: run.id,
        metadata: { [`${stepDef.key}_result`]: result.summary, ...result.extracted },
        appointmentId: (result.extracted.appointmentId as string) ?? null,
      });

      const isLast = run.current_step + 1 >= definition.steps.length;
      await this.supabase
        .from('workflow_runs')
        .update({
          steps,
          context: nextContext,
          current_step: run.current_step + 1,
          attempt_count: 0,
          status: isLast ? 'completed' : 'running',
          completed_at: isLast ? new Date().toISOString() : null,
          next_attempt_at: isLast ? null : new Date().toISOString(),
          error_message: null,
        })
        .eq('id', run.id);

      console.log(`[Workflow] ${run.workflow_key}/${stepDef.key} completed (run ${run.id})`);
      return { status: isLast ? 'completed' : 'running', step: stepDef.key };
    } catch (err: any) {
      const message = err?.message || 'Unknown error';
      console.error(`[Workflow] ${run.workflow_key}/${stepDef.key} failed:`, message);
      const exhausted = attempt >= MAX_STEP_ATTEMPTS;

      if (!exhausted) {
        steps[run.current_step] = {
          ...steps[run.current_step],
          status: 'pending',
          error: message,
        };
        await this.supabase
          .from('workflow_runs')
          .update({
            steps,
            status: 'waiting',
            attempt_count: attempt,
            error_message: message,
            next_attempt_at: new Date(Date.now() + nextAttemptDelayMs(attempt)).toISOString(),
          })
          .eq('id', run.id);
        return { status: 'waiting', step: stepDef.key };
      }

      const skip = (stepDef.onFailure ?? (stepDef.required === false ? 'skip' : 'escalate')) === 'skip';
      if (skip) {
        steps[run.current_step] = {
          ...steps[run.current_step],
          status: 'skipped',
          finishedAt: new Date().toISOString(),
          error: message,
        };
        const isLast = run.current_step + 1 >= definition.steps.length;
        await this.supabase
          .from('workflow_runs')
          .update({
            steps,
            current_step: run.current_step + 1,
            attempt_count: 0,
            status: isLast ? 'completed' : 'running',
            completed_at: isLast ? new Date().toISOString() : null,
            next_attempt_at: isLast ? null : new Date().toISOString(),
          })
          .eq('id', run.id);
        return { status: isLast ? 'completed' : 'running', step: stepDef.key };
      }

      steps[run.current_step] = {
        ...steps[run.current_step],
        status: 'failed',
        finishedAt: new Date().toISOString(),
        error: message,
      };
      await this.supabase.from('workflow_runs').update({ steps }).eq('id', run.id);
      await this.escalate(run, `${stepDef.label}: ${message}`);
      return { status: 'escalated', step: stepDef.key };
    }
  }

  /** Put a failed step back in the queue for one more try. */
  async retryStep(runId: string): Promise<{ ok: boolean; error?: string }> {
    const run = await this.getRun(runId);
    if (!run) return { ok: false, error: 'Run not found' };
    const steps = [...(run.steps || [])];
    if (steps[run.current_step]) {
      steps[run.current_step] = { ...steps[run.current_step], status: 'pending', attempts: 0, error: null };
    }
    await this.supabase
      .from('workflow_runs')
      .update({
        steps,
        status: 'running',
        attempt_count: 0,
        error_message: null,
        escalated_at: null,
        next_attempt_at: new Date().toISOString(),
      })
      .eq('id', runId);
    return { ok: true };
  }

  async cancelWorkflow(runId: string, reason?: string): Promise<{ ok: boolean }> {
    await this.supabase
      .from('workflow_runs')
      .update({
        status: 'cancelled',
        next_attempt_at: null,
        error_message: reason ?? 'Cancelled by a person',
        completed_at: new Date().toISOString(),
      })
      .eq('id', runId);
    return { ok: true };
  }

  // --- internals -----------------------------------------------------------

  private async complete(run: WorkflowRun) {
    await this.supabase
      .from('workflow_runs')
      .update({ status: 'completed', completed_at: new Date().toISOString(), next_attempt_at: null })
      .eq('id', run.id);
    return { status: 'completed' as WorkflowRunStatus };
  }

  private async escalate(run: WorkflowRun, reason: string) {
    await this.supabase
      .from('workflow_runs')
      .update({
        status: 'escalated',
        escalated_at: new Date().toISOString(),
        error_message: reason,
        next_attempt_at: null,
      })
      .eq('id', run.id);

    await this.supabase.from('staff_notifications').insert({
      company_id: run.company_id,
      recipient_role: 'company_admin',
      notification_type: 'workflow_escalation',
      title: `${run.title || run.workflow_key} needs attention`,
      message: `Aura tried ${MAX_STEP_ATTEMPTS} times and could not finish this job. ${reason}`,
      metadata: { workflow_run_id: run.id, workflow_key: run.workflow_key },
    });
  }

  /** Execute one step by calling the agent behind it. */
  private async runStep(
    run: WorkflowRun,
    stepDef: WorkflowStepDefinition,
    context: AgentContext,
  ): Promise<{ summary: string; extracted: Record<string, unknown> }> {
    const message = renderInstruction(stepDef.instruction, context);
    const response = await fetch(`${this.supabaseUrl}/functions/v1/ai-agent-chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.serviceKey}`,
      },
      body: JSON.stringify({
        companyId: run.company_id,
        agentType: stepDef.agent,
        message,
        conversationHistory: [],
        systemEvent: true,
        agentContext: { ...context, workflowId: run.id, toAgent: stepDef.agent },
      }),
    });

    if (!response.ok) {
      const text = await response.text();
      throw new Error(text.slice(0, 300) || `Agent ${stepDef.agent} returned ${response.status}`);
    }

    const result = await response.json();
    const summary: string = result.response || result.message || 'Step completed.';
    const toolCalls: any[] = result.toolCalls || result.tool_calls || [];

    // Pull ids the step created so later steps can use them.
    const extracted: Record<string, unknown> = {};
    for (const call of toolCalls) {
      const raw = typeof call?.result === 'string' ? safeParse(call.result) : call?.result;
      if (raw && typeof raw === 'object') {
        const appointmentId = (raw as any).appointment_id || (raw as any).appointmentId;
        if (appointmentId) extracted.appointmentId = appointmentId;
        const technicianId = (raw as any).technician_id || (raw as any).technicianId;
        if (technicianId) extracted.technicianId = technicianId;
      }
    }
    return { summary, extracted };
  }
}

function safeParse(value: string): unknown {
  try {
    return JSON.parse(value);
  } catch {
    return null;
  }
}

export function createWorkflowEngine(options: WorkflowEngineOptions): WorkflowEngine {
  return new WorkflowEngine(options);
}
