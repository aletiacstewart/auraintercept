import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, Sparkles, Calendar, FileText } from 'lucide-react';
import { toast } from 'sonner';
import { MAIN_INDUSTRY_CATEGORIES } from '@/lib/mainIndustryCategories';

interface TopicRow {
  topic: string;
  keywords: string;
  scheduledFor: string; // yyyy-mm-ddThh:mm
}

function toLocalInputValue(d: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

/**
 * Generate a 2x/week schedule of buyer-intent topics across the top 10 industries.
 * Rotates 3 topic templates so we don't publish 10 near-identical titles.
 */
function buildSeedTopics(): TopicRow[] {
  const templates = [
    (industry: string) => ({
      topic: `How much a missed call actually costs a ${industry} business`,
      keywords: [`${industry} missed calls`, `${industry} lead loss`, 'AI receptionist ROI'],
    }),
    (industry: string) => ({
      topic: `AI receptionist vs. traditional answering service for ${industry}`,
      keywords: [`${industry} answering service`, 'AI receptionist', `${industry} phone automation`],
    }),
    (industry: string) => ({
      topic: `${industry} scheduling software: what to look for in 2026`,
      keywords: [`${industry} scheduling software`, `${industry} booking`, 'appointment automation'],
    }),
  ];

  const industries = MAIN_INDUSTRY_CATEGORIES.slice(0, 10).map((c) => c.name);
  const start = new Date();
  start.setDate(start.getDate() + 1);
  start.setHours(9, 0, 0, 0);

  return industries.map((industry, i) => {
    const tpl = templates[i % templates.length](industry);
    // Two per week — Tue & Thu cadence approx. i.e. every ~3-4 days
    const publishAt = new Date(start);
    publishAt.setDate(publishAt.getDate() + Math.floor(i * 3.5));
    return {
      topic: tpl.topic,
      keywords: tpl.keywords.join(', '),
      scheduledFor: toLocalInputValue(publishAt),
    };
  });
}

export function PlatformBlogPanel() {
  const [rows, setRows] = useState<TopicRow[]>([
    { topic: '', keywords: '', scheduledFor: toLocalInputValue(new Date()) },
  ]);
  const [wordCount, setWordCount] = useState(900);
  const [isGenerating, setIsGenerating] = useState(false);

  const updateRow = (i: number, patch: Partial<TopicRow>) => {
    setRows((r) => r.map((row, idx) => (idx === i ? { ...row, ...patch } : row)));
  };
  const addRow = () => setRows((r) => [...r, { topic: '', keywords: '', scheduledFor: toLocalInputValue(new Date()) }]);
  const removeRow = (i: number) => setRows((r) => r.filter((_, idx) => idx !== i));
  const seed = () => setRows(buildSeedTopics());

  const generate = async () => {
    const clean = rows
      .filter((r) => r.topic.trim())
      .map((r) => ({
        topic: r.topic.trim(),
        keywords: r.keywords.split(',').map((k) => k.trim()).filter(Boolean),
        scheduledFor: new Date(r.scheduledFor).toISOString(),
      }));
    if (!clean.length) {
      toast.error('Add at least one topic');
      return;
    }

    setIsGenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke('generate-platform-blog', {
        body: { topics: clean, wordCount },
      });
      if (error) throw error;
      const ok = data?.okCount ?? 0;
      const fail = data?.failCount ?? 0;
      if (ok > 0) toast.success(`Generated ${ok} post${ok === 1 ? '' : 's'}${fail ? ` (${fail} failed)` : ''}`);
      if (ok === 0) toast.error('No posts were generated');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to generate');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Platform blog generator
          </CardTitle>
          <CardDescription>
            Generate posts for the Aura Intercept blog. Future publish dates are stored as scheduled and go live automatically.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap items-end gap-3">
            <div className="space-y-1">
              <Label htmlFor="word-count">Target word count</Label>
              <Input
                id="word-count"
                type="number"
                min={300}
                max={2500}
                step={100}
                value={wordCount}
                onChange={(e) => setWordCount(Number(e.target.value) || 900)}
                className="w-32"
              />
            </div>
            <Button variant="outline" onClick={seed} disabled={isGenerating}>
              <Sparkles className="h-4 w-4 mr-1" />
              Load 10-post seed calendar
            </Button>
          </div>

          <div className="space-y-3">
            {rows.map((row, i) => (
              <div key={i} className="rounded-md border border-border p-3 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">Topic {i + 1}</span>
                  {rows.length > 1 && (
                    <Button variant="ghost" size="sm" onClick={() => removeRow(i)} disabled={isGenerating}>Remove</Button>
                  )}
                </div>
                <Textarea
                  value={row.topic}
                  onChange={(e) => updateRow(i, { topic: e.target.value })}
                  placeholder="e.g. How much a missed call costs an HVAC business"
                  rows={2}
                  className="resize-none"
                  disabled={isGenerating}
                />
                <Input
                  value={row.keywords}
                  onChange={(e) => updateRow(i, { keywords: e.target.value })}
                  placeholder="Comma-separated keywords (optional)"
                  disabled={isGenerating}
                />
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <Input
                    type="datetime-local"
                    value={row.scheduledFor}
                    onChange={(e) => updateRow(i, { scheduledFor: e.target.value })}
                    disabled={isGenerating}
                    className="w-64"
                  />
                </div>
              </div>
            ))}
          </div>

          <div className="flex items-center gap-3">
            <Button variant="outline" onClick={addRow} disabled={isGenerating}>+ Add topic</Button>
            <Button onClick={generate} disabled={isGenerating}>
              {isGenerating ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <Sparkles className="h-4 w-4 mr-1" />}
              Generate {rows.filter((r) => r.topic.trim()).length || ''} post{rows.filter((r) => r.topic.trim()).length === 1 ? '' : 's'}
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">
            A cron job checks every 15 minutes and flips scheduled posts to published when their publish time is reached.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}