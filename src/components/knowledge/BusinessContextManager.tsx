import { useEffect, useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { Save, Sparkles, Loader2 } from 'lucide-react';
import {
  getFastStartQuestions,
  parseFastStartAnswers,
  formatFastStartAnswers,
  upsertFastStartBlock,
} from '@/lib/industryFastStartQuestions';

/**
 * Phase F follow-up: surface the Fast Start answer block from
 * `companies.ai_agent_prompt` as an editable card. Admin's free-form
 * prompt above the block is preserved on save.
 */
export function BusinessContextManager() {
  const { companyId } = useAuth();
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  const { data: company, refetch, isLoading } = useQuery({
    queryKey: ['business-context', companyId],
    queryFn: async () => {
      if (!companyId) return null;
      const { data, error } = await supabase
        .from('companies')
        .select('industry_vertical, ai_agent_prompt')
        .eq('id', companyId)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!companyId,
  });

  const industryId = company?.industry_vertical ?? null;
  const questions = useMemo(() => getFastStartQuestions(industryId), [industryId]);

  useEffect(() => {
    if (company) {
      setAnswers(parseFastStartAnswers(industryId, company.ai_agent_prompt));
    }
  }, [company, industryId]);

  const handleSave = async () => {
    if (!companyId) return;
    setSaving(true);
    try {
      const block = formatFastStartAnswers(industryId, answers);
      const next = upsertFastStartBlock(company?.ai_agent_prompt ?? '', block);
      const { error } = await supabase
        .from('companies')
        .update({ ai_agent_prompt: next })
        .eq('id', companyId);
      if (error) throw error;
      toast.success('Business context updated. Aura will use it on the next call.');
      await refetch();
    } catch (err) {
      console.error(err);
      toast.error('Could not save business context.');
    } finally {
      setSaving(false);
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="py-10 flex items-center justify-center text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin mr-2" /> Loading…
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-primary" />
          Business Context
          {industryId && (
            <Badge variant="outline" className="ml-2 text-[10px] uppercase tracking-wider">
              {industryId.replace(/_/g, ' ')}
            </Badge>
          )}
        </CardTitle>
        <CardDescription>
          These answers — first captured during Fast Start — are appended to your AI agent's
          system prompt so every operative knows them. Edit any time; changes apply on the
          next interaction.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {questions.map((q) => (
            <div key={q.key} className="space-y-1">
              <Label htmlFor={`bc-${q.key}`} className="text-xs">{q.label}</Label>
              <Input
                id={`bc-${q.key}`}
                value={answers[q.key] ?? ''}
                onChange={(e) => setAnswers((p) => ({ ...p, [q.key]: e.target.value }))}
                placeholder={q.placeholder}
              />
            </div>
          ))}
        </div>
        <div className="flex justify-end">
          <Button onClick={handleSave} disabled={saving} size="sm">
            {saving ? <Loader2 className="h-4 w-4 mr-1.5 animate-spin" /> : <Save className="h-4 w-4 mr-1.5" />}
            Save context
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

export default BusinessContextManager;
