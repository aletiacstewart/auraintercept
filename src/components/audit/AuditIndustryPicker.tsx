import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { INDUSTRY_GROUPS, INDUSTRY_CONTENT, getIndustryContent } from '@/lib/industryMarketingContent';
import { ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';

interface AuditIndustryPickerProps {
  onSelect: (industryId: string) => void;
}

export function AuditIndustryPicker({ onSelect }: AuditIndustryPickerProps) {
  const [selected, setSelected] = useState<string | null>(null);

  return (
    <div className="min-h-screen py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <span
              className="inline-flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.2em] px-3 py-1 rounded-full border"
              style={{
                borderColor: 'rgba(0,229,255,0.3)',
                background: 'rgba(0,229,255,0.06)',
                color: '#7ef0ff',
              }}
            >
              <span className="h-1.5 w-1.5 rounded-full bg-cyan-300 shadow-[0_0_8px_rgba(0,229,255,0.8)]" />
              Step 1 of 2 • Pick Your Industry
            </span>
          </div>
          <h1
            className="text-4xl sm:text-5xl font-brand uppercase tracking-tight mb-3"
            style={{
              background:
                'linear-gradient(135deg, #00F2FF 0%, #FFFFFF 45%, #00E5FF 70%, #00E5FF 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
            }}
          >
            AI Opportunity Audit
          </h1>
          <p className="text-muted-foreground max-w-xl mx-auto">
            Pick the industry that fits you best. We'll tailor the audit and your
            personalized setup PDF to your business.
          </p>
        </div>

        <Card className="border-border bg-card">
          <CardContent className="p-6 space-y-6">
            {INDUSTRY_GROUPS.map((group) => (
              <div key={group.group}>
                <h3 className="text-xs uppercase tracking-[0.18em] font-semibold text-cyan-300/80 mb-3 flex items-center gap-2">
                  <span>{group.emoji}</span>
                  <span>{group.group}</span>
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
                  {group.ids.map((id) => {
                    const c = INDUSTRY_CONTENT[id];
                    if (!c) return null;
                    const isSelected = selected === id;
                    return (
                      <button
                        key={id}
                        type="button"
                        onClick={() => setSelected(id)}
                        className={cn(
                          'flex items-center gap-2 px-3 py-2.5 rounded-lg border text-sm text-left transition-all',
                          isSelected
                            ? 'border-primary bg-primary/10 text-foreground shadow-sm'
                            : 'border-border bg-muted/30 text-foreground/80 hover:border-primary/50 hover:bg-muted/50'
                        )}
                      >
                        <span className="text-base shrink-0">{c.emoji}</span>
                        <span className="truncate">{c.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}

            {/* Catch-all */}
            <div>
              <button
                type="button"
                onClick={() => setSelected('other')}
                className={cn(
                  'w-full flex items-center gap-2 px-3 py-2.5 rounded-lg border text-sm transition-all',
                  selected === 'other'
                    ? 'border-primary bg-primary/10 text-foreground'
                    : 'border-border bg-muted/30 text-foreground/80 hover:border-primary/50 hover:bg-muted/50'
                )}
              >
                <span className="text-base">🏢</span>
                <span>Not listed / Other</span>
              </button>
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end mt-6">
          <Button
            size="lg"
            disabled={!selected}
            onClick={() => selected && onSelect(selected)}
            className="gap-2"
          >
            Start {selected ? `${getIndustryContent(selected).label} ` : ''}Audit
            <ArrowRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}