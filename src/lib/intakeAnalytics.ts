import type { IndustryPack } from '@/hooks/useIndustryPack';
import type { IntakeFieldDef, IntakeFieldType, IntakeFormSchema } from '@/lib/industryFormSchemas';

export interface ReportableIntakeField {
  name: string;
  label: string;
  type: IntakeFieldType;
  options?: string[];
  sourceFormIds: string[];
}

/** Field types that are not useful as a chart axis. */
const UNCHARTABLE: ReadonlyArray<IntakeFieldType> = ['textarea'];

/**
 * Walk an industry pack's `form_schemas` and return one entry per unique
 * field name, deduped across forms. Free-text `textarea` fields are skipped
 * because they are not useful as a chart axis.
 */
export function getReportableIntakeFields(
  pack: IndustryPack | null | undefined,
): ReportableIntakeField[] {
  if (!pack) return [];
  const schemas = (pack.form_schemas || {}) as Record<string, IntakeFormSchema>;
  const byName = new Map<string, ReportableIntakeField>();

  for (const [formId, schema] of Object.entries(schemas)) {
    if (!schema || !Array.isArray(schema.fields)) continue;
    for (const f of schema.fields as IntakeFieldDef[]) {
      if (!f?.name) continue;
      if (UNCHARTABLE.includes(f.type)) continue;
      const existing = byName.get(f.name);
      if (existing) {
        if (!existing.sourceFormIds.includes(formId)) {
          existing.sourceFormIds.push(formId);
        }
        continue;
      }
      byName.set(f.name, {
        name: f.name,
        label: f.label || f.name,
        type: f.type,
        options: Array.isArray(f.options) ? [...f.options] : undefined,
        sourceFormIds: [formId],
      });
    }
  }

  return Array.from(byName.values()).sort((a, b) =>
    a.label.localeCompare(b.label),
  );
}

/** Pick a sensible default field for the initial chart render. */
export function pickDefaultIntakeField(
  fields: ReportableIntakeField[],
): ReportableIntakeField | null {
  if (fields.length === 0) return null;
  return (
    fields.find((f) => f.type === 'select' || f.type === 'checkbox') ?? fields[0]
  );
}

export type IntakeChartKind = 'bar' | 'donut' | 'histogram' | 'timeseries' | 'table';

export function chartKindForField(type: IntakeFieldType): IntakeChartKind {
  switch (type) {
    case 'select':
    case 'checkbox':
      return 'donut';
    case 'number':
      return 'histogram';
    case 'date':
      return 'timeseries';
    case 'text':
    default:
      return 'table';
  }
}