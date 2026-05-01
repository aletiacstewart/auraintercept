import React from 'react';
import { useIndustryPack } from '@/hooks/useIndustryPack';
import {
  resolveFormSchema,
  summarizeIntake,
} from '@/lib/industryFormSchemas';

interface IntakeSummaryProps {
  /** The raw `intake_data` JSONB from an appointment or lead row. */
  intakeData: Record<string, unknown> | null | undefined;
  /** Used to resolve the matching pack form schema for prettier labels. */
  serviceType?: string | null;
  /** Optional override label for the section. */
  title?: string;
  /** Compact = inline chips; default = label/value rows. */
  variant?: 'default' | 'compact';
}

/**
 * Read-only summary of industry-pack intake answers captured at booking time.
 * Renders nothing when there is no data, so it is safe to drop into any
 * appointment/lead detail view regardless of vertical.
 */
export const IntakeSummary: React.FC<IntakeSummaryProps> = ({
  intakeData,
  serviceType,
  title = 'Job Details',
  variant = 'default',
}) => {
  const { pack } = useIndustryPack();
  const schema = resolveFormSchema(pack, serviceType || '');
  const rows = summarizeIntake(schema, intakeData ?? null);
  if (rows.length === 0) return null;

  if (variant === 'compact') {
    return (
      <div className="flex flex-wrap gap-1.5">
        {rows.map((r) => (
          <span
            key={r.label}
            className="inline-flex items-center gap-1 rounded-full border border-border/60 bg-muted/40 px-2 py-0.5 text-[11px] text-foreground/80"
          >
            <span className="text-muted-foreground">{r.label}:</span>
            <span className="font-medium">{r.value}</span>
          </span>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
        {title}
      </p>
      <dl className="grid grid-cols-1 gap-1.5 rounded-lg bg-muted/40 p-3 text-sm sm:grid-cols-2">
        {rows.map((r) => (
          <div key={r.label} className="flex flex-col">
            <dt className="text-xs text-muted-foreground">{r.label}</dt>
            <dd className="font-medium text-foreground">{r.value}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
};