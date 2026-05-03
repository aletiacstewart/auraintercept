// Edge-function helper: load a company's industry blueprint and produce
// the prompt-override snippet to inject into agent system prompts.
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

export interface CompanyWorkspaceContext {
  industrySlug: string | null;
  operatingModel: string;
  promptOverrides: Record<string, unknown>;
  agentActions: Record<string, string[]>;
  restrictions: Record<string, unknown>;
}

export async function loadCompanyWorkspace(
  companyId: string,
): Promise<CompanyWorkspaceContext | null> {
  if (!companyId) return null;
  const supabase = createClient(SUPABASE_URL, SERVICE_KEY);

  const { data: company } = await supabase
    .from('companies')
    .select('industry_vertical, operating_model, industry_config')
    .eq('id', companyId)
    .maybeSingle();
  if (!company) return null;

  let blueprint: any = null;
  if (company.industry_vertical) {
    const { data: bp } = await supabase
      .from('industry_blueprints')
      .select('prompt_overrides, agent_actions, restrictions, operating_model')
      .eq('slug', company.industry_vertical)
      .eq('is_active', true)
      .maybeSingle();
    blueprint = bp;
  }

  const overrides = (company.industry_config as Record<string, unknown>) ?? {};
  return {
    industrySlug: company.industry_vertical ?? null,
    operatingModel:
      (overrides.operating_model as string) ||
      company.operating_model ||
      blueprint?.operating_model ||
      'custom',
    promptOverrides: {
      ...(blueprint?.prompt_overrides ?? {}),
      ...((overrides.prompt_overrides as Record<string, unknown>) ?? {}),
    },
    agentActions: {
      ...(blueprint?.agent_actions ?? {}),
      ...((overrides.agent_actions as Record<string, string[]>) ?? {}),
    },
    restrictions: {
      ...(blueprint?.restrictions ?? {}),
      ...((overrides.restrictions as Record<string, unknown>) ?? {}),
    },
  };
}

export function buildIndustryPromptSnippet(
  ctx: CompanyWorkspaceContext | null,
  agentKey?: string,
): string {
  if (!ctx) return '';
  const lines: string[] = [];
  if (ctx.industrySlug) {
    lines.push(`Industry context: ${ctx.industrySlug} (operating model: ${ctx.operatingModel}).`);
  }
  const term = (ctx.promptOverrides as { terminology?: Record<string, string> })?.terminology;
  if (term) {
    const pairs = Object.entries(term)
      .map(([k, v]) => `"${k}" → "${v}"`)
      .join(', ');
    if (pairs) lines.push(`Use these terms: ${pairs}.`);
  }
  const scripts = (ctx.promptOverrides as { scripts?: Record<string, string> })?.scripts;
  if (scripts) {
    Object.entries(scripts).forEach(([topic, line]) => {
      lines.push(`When the customer asks about ${topic}: ${line}`);
    });
  }
  if (agentKey && ctx.agentActions[agentKey]?.length) {
    lines.push(
      `Available industry-specific actions for this agent: ${ctx.agentActions[agentKey].join(', ')}.`,
    );
  }
  if (ctx.restrictions && Object.keys(ctx.restrictions).length) {
    const r = ctx.restrictions as Record<string, unknown>;
    if (r.booking === false) {
      lines.push(
        'IMPORTANT: Do NOT offer to book appointments or reservations. Send a Smart Link to the website/booking page instead.',
      );
    }
    if (r.dispatch === false) {
      lines.push('Do NOT discuss dispatch, technicians, or service trucks for this business.');
    }
  }
  return lines.length ? `\n\n# Industry Adaptation\n${lines.join('\n')}\n` : '';
}