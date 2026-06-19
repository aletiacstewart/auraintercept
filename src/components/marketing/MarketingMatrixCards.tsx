import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Sparkles, Target, FileText, Megaphone } from 'lucide-react';
import {
  CHANNELS,
  getMatrixRowForBusinessType,
  getGroupSummary,
  topChannels,
  type ChannelMeta,
  type Priority,
} from '@/lib/marketingPlatformMatrix';
import { useCompanyBusinessType } from '@/hooks/useCompanyBusinessType';

function priorityClasses(p: Priority): string {
  if (p === 'P') return 'bg-primary/15 text-primary border-primary/40';
  if (p === 'S') return 'bg-secondary/30 text-foreground border-secondary';
  if (p === 'O') return 'bg-muted text-muted-foreground border-border';
  return 'bg-muted/30 text-muted-foreground/60 border-border/40 line-through';
}

function priorityLabel(p: Priority): string {
  if (p === 'P') return 'Primary';
  if (p === 'S') return 'Secondary';
  if (p === 'O') return 'Optional';
  return 'Skip';
}

interface Props {
  /** When true, only render social-network channels. */
  socialOnly?: boolean;
}

export function MarketingMatrixCards({ socialOnly = false }: Props) {
  const { businessType, industryVertical, loading } = useCompanyBusinessType();
  if (loading) return null;
  const row =
    getMatrixRowForBusinessType(businessType) ??
    getMatrixRowForBusinessType(industryVertical);
  if (!row) return null;

  const group = getGroupSummary(row.category);
  const channels: ChannelMeta[] = socialOnly ? CHANNELS.filter((c) => c.social) : CHANNELS;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      <Card className="border-primary/20 bg-card/60">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <CardTitle className="text-base flex items-center gap-2">
              <Target className="h-4 w-4 text-primary" />
              Recommended {socialOnly ? 'Social' : 'Channel'} Mix
            </CardTitle>
            <Badge variant="outline" className="border-primary/30 text-xs">
              {row.name}
            </Badge>
          </div>
          {group && !socialOnly && (
            <div className="flex flex-wrap gap-2 pt-2 text-[11px]">
              <Badge variant="secondary" className="font-normal">
                Top paid: {group.topPaid}
              </Badge>
              <Badge variant="secondary" className="font-normal">
                Top organic: {group.topOrganic}
              </Badge>
            </div>
          )}
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-1.5">
            {channels.map((c) => {
              const p = row.priorities[c.key];
              return (
                <span
                  key={c.key}
                  title={priorityLabel(p)}
                  className={`text-[11px] px-2 py-1 rounded-md border ${priorityClasses(p)}`}
                >
                  <span className="font-medium">{c.label}</span>
                  <span className="ml-1 opacity-70">{p === '-' ? '—' : p}</span>
                </span>
              );
            })}
          </div>
          <div className="mt-3 flex flex-wrap gap-2 text-[11px] text-muted-foreground">
            <span className="inline-flex items-center gap-1"><span className="inline-block w-2 h-2 rounded-full bg-primary" /> Primary</span>
            <span className="inline-flex items-center gap-1"><span className="inline-block w-2 h-2 rounded-full bg-secondary" /> Secondary</span>
            <span className="inline-flex items-center gap-1"><span className="inline-block w-2 h-2 rounded-full bg-muted-foreground/50" /> Optional</span>
          </div>
        </CardContent>
      </Card>

      <Card className="border-primary/20 bg-card/60">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <FileText className="h-4 w-4 text-primary" />
            {socialOnly ? 'Content Pillars' : 'Content & Ad Guidance'}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          {!socialOnly && row.bestAdFormat && (
            <div>
              <div className="text-xs font-semibold text-muted-foreground flex items-center gap-1 mb-1">
                <Megaphone className="h-3.5 w-3.5" /> Best ad format
              </div>
              <div className="text-foreground leading-snug">{row.bestAdFormat}</div>
            </div>
          )}
          {row.topContentTypes && (
            <div>
              <div className="text-xs font-semibold text-muted-foreground flex items-center gap-1 mb-1">
                <Sparkles className="h-3.5 w-3.5" /> Top content types
              </div>
              <div className="text-foreground leading-snug">{row.topContentTypes}</div>
            </div>
          )}
          {row.keyNotes && (
            <div>
              <div className="text-xs font-semibold text-muted-foreground mb-1">Key notes</div>
              <div className="text-muted-foreground leading-snug">{row.keyNotes}</div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

/** Compact 3-channel strip for the main dashboard. */
export function MarketingFocusStrip() {
  const { businessType, industryVertical, loading } = useCompanyBusinessType();
  if (loading) return null;
  const row =
    getMatrixRowForBusinessType(businessType) ??
    getMatrixRowForBusinessType(industryVertical);
  if (!row) return null;
  const top = topChannels(row, 3);
  const group = getGroupSummary(row.category);
  if (!top.length) return null;

  return (
    <Card className="border-primary/20 bg-card/60">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm flex items-center gap-2">
          <Megaphone className="h-4 w-4 text-primary" />
          Marketing focus — {row.name}
        </CardTitle>
      </CardHeader>
      <CardContent className="flex flex-wrap items-center gap-2 text-xs">
        <span className="text-muted-foreground">Lead with:</span>
        {top.map((c) => (
          <Badge key={c.key} variant="outline" className="border-primary/40 text-primary">
            {c.label}
          </Badge>
        ))}
        {group && (
          <span className="ml-auto text-muted-foreground">
            Top paid <span className="text-foreground">{group.topPaid}</span> · Top organic{' '}
            <span className="text-foreground">{group.topOrganic}</span>
          </span>
        )}
      </CardContent>
    </Card>
  );
}