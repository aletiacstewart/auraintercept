import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Briefcase } from 'lucide-react';
import { useCompanyBusinessType } from '@/hooks/useCompanyBusinessType';
import { getConsoleContext } from '@/lib/businessTypeConsoleContext';

interface Props {
  /** Optional sub-headline (e.g. "Field workflow tuned for your business type"). */
  subtitle?: string;
  /** When true, list the recommended AI operatives (always-on + default-on). */
  showOperatives?: boolean;
  /** When true, include matrix key notes / content hints. */
  showNotes?: boolean;
}

/**
 * Compact per-business-type context card. Renders on any console that wants
 * to surface "what this looks like for your specific business type" from
 * the 185-row spec — profile, top channels, group benchmarks, and
 * (optionally) recommended operatives + key notes.
 */
export function BusinessTypeContextStrip({ subtitle, showOperatives, showNotes }: Props) {
  const { businessType, industryVertical, loading } = useCompanyBusinessType();
  if (loading) return null;
  const ctx = getConsoleContext(businessType, industryVertical, 3);
  const { profileSpec, matrixRow, groupSummary, topChannels: top, displayLabel } = ctx;

  // Avoid rendering the same label twice when the business type name and the
  // profile category resolve to the same string (e.g. "Solo / Appointment-Only
  // Services"). Normalize whitespace/case for the comparison so trivial
  // formatting differences don't trigger a duplicate badge.
  const normalize = (v: string) => v.trim().toLowerCase().replace(/\s+/g, ' ');
  const showProfileBadge =
    !!profileSpec.label &&
    normalize(profileSpec.label) !== normalize(displayLabel);

  // Always render — even without a matrix row we can show profile + label so
  // the user sees we know their business type.
  return (
    <Card className="border-primary/20 bg-card/60">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <CardTitle className="text-sm flex items-center gap-2">
            <Briefcase className="h-4 w-4 text-primary" />
            {subtitle ?? 'Tuned for your business type'}
          </CardTitle>
          <div className="flex gap-1.5 flex-wrap">
            <Badge variant="outline" className="border-primary/30 text-xs capitalize">
              {displayLabel}
            </Badge>
            {showProfileBadge && (
              <Badge variant="secondary" className="text-[10px] font-normal">
                {profileSpec.label}
              </Badge>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-2 text-xs">
        {top.length > 0 && (
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-muted-foreground">Lead channels:</span>
            {top.map((c) => (
              <Badge key={c.key} variant="outline" className="border-primary/40 text-primary">
                {c.label}
              </Badge>
            ))}
            {groupSummary && (
              <span className="ml-auto text-muted-foreground">
                Top paid <span className="text-foreground">{groupSummary.topPaid}</span> · Top organic{' '}
                <span className="text-foreground">{groupSummary.topOrganic}</span>
              </span>
            )}
          </div>
        )}
        {showOperatives && (
          <div>
            <div className="text-muted-foreground mb-1">Recommended operatives</div>
            <div className="flex flex-wrap gap-1">
              {[...profileSpec.agentsAlwaysOn, ...profileSpec.agentsDefaultOn]
                .slice(0, 10)
                .map((a) => (
                  <Badge key={a} variant="secondary" className="text-[10px] font-normal capitalize">
                    {a.replace(/_/g, ' ')}
                  </Badge>
                ))}
            </div>
          </div>
        )}
        {showNotes && matrixRow?.keyNotes && (
          <div className="text-muted-foreground leading-snug pt-1 border-t border-border/40">
            <span className="font-medium text-foreground">Notes:</span> {matrixRow.keyNotes}
          </div>
        )}
      </CardContent>
    </Card>
  );
}