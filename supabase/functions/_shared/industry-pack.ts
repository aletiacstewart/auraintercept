/**
 * Shared helpers for injecting industry pack context (terminology + agent
 * prompt deltas) into runtime system prompts for voice / SMS / chat agents.
 *
 * The full pack lives in the `industry_template_packs` table and is keyed by
 * `industry_id`. Each company stores its `industry_vertical` on `companies`.
 *
 * Edge functions should call `loadIndustryPackForCompany` once per request
 * (it's a single small SELECT) and then `applyIndustryPackToPrompt(...)` to
 * decorate the base agent prompt before sending to the model.
 */

export interface IndustryPackLite {
  industry_id: string;
  label: string | null;
  terminology: Record<string, string>;
  agent_prompt_deltas: Record<string, string>;
}

/** Map free-form agent identifiers to the short keys used in pack deltas. */
function normalizeAgentKey(agent?: string | null): string {
  if (!agent) return 'aura';
  const a = agent.toLowerCase();
  if (a.includes('voice') || a.includes('phone') || a.includes('reception')) return 'voice';
  if (a.includes('sms') || a.includes('text')) return 'sms';
  if (a.includes('book') || a.includes('schedul')) return 'booking';
  if (a.includes('dispatch')) return 'dispatch';
  if (a.includes('billing') || a.includes('invoice')) return 'billing';
  if (a.includes('chat') || a.includes('message')) return 'chat';
  return a.replace(/[^a-z0-9_-]/g, '');
}

export async function loadIndustryPackForCompany(
  supabase: { from: (t: string) => any },
  companyId: string,
): Promise<IndustryPackLite | null> {
  if (!companyId) return null;
  try {
    const { data: company } = await supabase
      .from('companies')
      .select('industry_vertical')
      .eq('id', companyId)
      .maybeSingle();
    const industryId = company?.industry_vertical;
    if (!industryId) return null;
    const { data: pack } = await supabase
      .from('industry_template_packs')
      .select('industry_id, label, terminology, agent_prompt_deltas')
      .eq('industry_id', industryId)
      .eq('is_active', true)
      .maybeSingle();
    if (!pack) return null;
    return {
      industry_id: pack.industry_id,
      label: pack.label ?? null,
      terminology:
        pack.terminology && typeof pack.terminology === 'object'
          ? (pack.terminology as Record<string, string>)
          : {},
      agent_prompt_deltas:
        pack.agent_prompt_deltas && typeof pack.agent_prompt_deltas === 'object'
          ? (pack.agent_prompt_deltas as Record<string, string>)
          : {},
    };
  } catch (err) {
    console.error('[industry-pack] load failed:', err);
    return null;
  }
}

/**
 * Append a "INDUSTRY CONTEXT" + "PREFERRED TERMINOLOGY" block to the base
 * system prompt. Safe to call with a null pack (returns the prompt as-is).
 */
export function applyIndustryPackToPrompt(
  basePrompt: string,
  pack: IndustryPackLite | null,
  agentType?: string,
): string {
  if (!pack) return basePrompt;
  const key = normalizeAgentKey(agentType);
  const deltas = pack.agent_prompt_deltas || {};
  const delta =
    deltas[key] ||
    deltas[agentType ?? ''] ||
    deltas['aura'] ||
    '';
  const termEntries = Object.entries(pack.terminology || {}).filter(
    ([k, v]) => k && v && k !== v,
  );

  let suffix = '';
  if (delta) {
    suffix += `\n\nINDUSTRY CONTEXT (${pack.label || pack.industry_id}):\n${delta}`;
  }
  if (termEntries.length > 0) {
    suffix += `\n\nPREFERRED TERMINOLOGY (use these words verbatim):\n${termEntries
      .map(([k, v]) => `- "${k}" → "${v}"`)
      .join('\n')}`;
  }
  return suffix ? `${basePrompt}${suffix}` : basePrompt;
}