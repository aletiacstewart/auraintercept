import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Check, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useIndustryConfig } from '@/hooks/useIndustryConfig';
import { getPromptTemplates, renderAgentPrompt, type PromptTemplate } from '@/lib/agentPrompts';

interface AgentPromptLibraryProps {
  jobTypeId?: string | null;
  companyId: string | null;
  /** Called with the finished text when the user applies a template. */
  onApply: (prompt: string) => void;
  disabled?: boolean;
}

/** Ready-made wording people can pick instead of writing instructions from scratch. */
export function AgentPromptLibrary({ jobTypeId, companyId, onApply, disabled }: AgentPromptLibraryProps) {
  const [selected, setSelected] = useState<PromptTemplate | null>(null);
  const { label: industryLabel } = useIndustryConfig(companyId);

  const { data: company } = useQuery({
    queryKey: ['prompt-library-company', companyId],
    enabled: !!companyId,
    queryFn: async () => {
      const [{ data: c }, { data: s }] = await Promise.all([
        supabase.from('companies').select('name').eq('id', companyId!).maybeSingle(),
        supabase.from('services').select('name').eq('company_id', companyId!).limit(12),
      ]);
      return { name: c?.name as string | undefined, services: (s ?? []).map((x) => x.name as string) };
    },
  });

  const templates = useMemo(() => getPromptTemplates(jobTypeId), [jobTypeId]);

  const render = (t: PromptTemplate) =>
    renderAgentPrompt(t.prompt, {
      companyName: company?.name,
      industry: industryLabel,
      services: company?.services,
    });

  return (
    <Card className="border-border/60 p-4 space-y-3">
      <div className="flex items-center gap-2">
        <Sparkles className="h-4 w-4 text-primary" />
        <p className="text-sm font-semibold">Start from ready-made wording</p>
      </div>
      <p className="text-xs text-muted-foreground">
        Pick a tone, preview it, then apply it. Your business name, industry and services are filled
        in automatically — you can edit everything afterwards.
      </p>

      <div className="grid gap-2 sm:grid-cols-2">
        {templates.map((t) => (
          <button
            key={t.tone}
            type="button"
            onClick={() => setSelected(t)}
            className={cn(
              'rounded-lg border p-3 text-left transition-colors',
              selected?.tone === t.tone
                ? 'border-primary bg-primary/5'
                : 'border-border/60 hover:border-primary/40',
            )}
          >
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">{t.label}</span>
              {selected?.tone === t.tone && <Check className="h-4 w-4 text-primary" />}
            </div>
            <p className="mt-1 text-xs text-muted-foreground">{t.summary}</p>
          </button>
        ))}
      </div>

      {selected && (
        <div className="space-y-2">
          <Badge variant="outline" className="text-[11px]">Preview</Badge>
          <pre className="max-h-48 overflow-y-auto whitespace-pre-wrap rounded-md bg-muted/50 p-3 text-xs text-muted-foreground">
            {render(selected)}
          </pre>
          <Button size="sm" disabled={disabled} onClick={() => onApply(render(selected))}>
            Use this wording
          </Button>
        </div>
      )}
    </Card>
  );
}

export default AgentPromptLibrary;
