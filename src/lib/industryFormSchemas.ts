import type { IndustryPack } from '@/hooks/useIndustryPack';

export type IntakeFieldType =
  | 'text'
  | 'textarea'
  | 'number'
  | 'select'
  | 'date'
  | 'checkbox';

export interface IntakeFieldDef {
  name: string;
  label: string;
  type: IntakeFieldType;
  required?: boolean;
  options?: string[];
  placeholder?: string;
  helper?: string;
}

export interface IntakeFormSchema {
  fields: IntakeFieldDef[];
  title?: string;
}

interface JobTemplate {
  id?: string;
  label?: string;
  form_id?: string;
  duration_minutes?: number;
}

/**
 * Look up a job template inside a pack. The selected service value coming
 * from <AddAppointmentForm> is either:
 *  - "pack:<jobTemplateId>" when no DB services exist (we synthesised it)
 *  - the literal job template label when a match is desired
 *  - a real DB service name (no template match → null)
 */
export function getJobTemplate(
  pack: IndustryPack | null | undefined,
  serviceSelection: string,
): JobTemplate | null {
  if (!pack || !serviceSelection) return null;
  const templates = (pack.job_templates || []) as JobTemplate[];
  if (!templates.length) return null;

  if (serviceSelection.startsWith('pack:')) {
    const key = serviceSelection.slice('pack:'.length);
    return (
      templates.find((t) => t?.id === key || t?.label === key) ?? null
    );
  }
  return templates.find((t) => t?.label === serviceSelection) ?? null;
}

/**
 * Resolve which form_schemas entry should drive the dynamic intake form for
 * the currently-selected service. Returns null when there is no industry-
 * specific intake to render, in which case the form behaves exactly as the
 * pre-industry-pack baseline.
 */
export function resolveFormSchema(
  pack: IndustryPack | null | undefined,
  serviceSelection: string,
): IntakeFormSchema | null {
  if (!pack) return null;
  const schemas = (pack.form_schemas || {}) as Record<string, IntakeFormSchema>;
  const template = getJobTemplate(pack, serviceSelection);
  const formId = template?.form_id;
  if (!formId) return null;
  const schema = schemas[formId];
  if (!schema || !Array.isArray(schema.fields) || schema.fields.length === 0) {
    return null;
  }
  return schema;
}

/**
 * Returns an array of human-readable error strings for any required fields
 * that are missing or blank in `value`.
 */
export function validateIntake(
  schema: IntakeFormSchema | null,
  value: Record<string, unknown>,
): string[] {
  if (!schema) return [];
  const errors: string[] = [];
  for (const field of schema.fields) {
    if (!field.required) continue;
    const v = value?.[field.name];
    const isBlank =
      v === undefined ||
      v === null ||
      (typeof v === 'string' && v.trim() === '');
    if (isBlank) errors.push(field.label);
  }
  return errors;
}

/**
 * Convert raw intake_data JSON (from DB) into [label, displayValue] pairs
 * for read-only summary panels. Unknown field names are passed through.
 */
export function summarizeIntake(
  schema: IntakeFormSchema | null,
  value: Record<string, unknown> | null | undefined,
): Array<{ label: string; value: string }> {
  if (!value || typeof value !== 'object') return [];
  const fieldByName = new Map<string, IntakeFieldDef>();
  if (schema) {
    for (const f of schema.fields) fieldByName.set(f.name, f);
  }
  const out: Array<{ label: string; value: string }> = [];
  for (const [k, raw] of Object.entries(value)) {
    if (raw === null || raw === undefined || raw === '') continue;
    const field = fieldByName.get(k);
    const label =
      field?.label ||
      k.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
    const display =
      typeof raw === 'boolean' ? (raw ? 'Yes' : 'No') : String(raw);
    out.push({ label, value: display });
  }
  return out;
}