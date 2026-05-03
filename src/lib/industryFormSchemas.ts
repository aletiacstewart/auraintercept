import type { IndustryPack } from '@/hooks/useIndustryPack';
import type { ServiceCatalogEntry } from '@/hooks/useIndustryPack';

export type IntakeFieldType =
  | 'text'
  | 'textarea'
  | 'number'
  | 'select'
  | 'date'
  | 'checkbox';

/**
 * Conditional visibility rule. A field is rendered only when the referenced
 * field's current value satisfies one of the listed predicates. All entries
 * in `show_if` must pass (logical AND). Use multiple operators on the same
 * `field` to compose ranges. Backward compatible: when `show_if` is absent,
 * the field is always shown.
 */
export interface ShowIfRule {
  field: string;
  /** Defaults to "equals". */
  op?:
    | 'equals'
    | 'not_equals'
    | 'in'
    | 'not_in'
    | 'truthy'
    | 'falsy'
    | 'gt'
    | 'gte'
    | 'lt'
    | 'lte';
  value?: unknown;
  /** For `in` / `not_in`. */
  values?: unknown[];
}

export interface IntakeFieldDef {
  name: string;
  label: string;
  type: IntakeFieldType;
  required?: boolean;
  options?: string[];
  placeholder?: string;
  helper?: string;
  /** Optional grouping for multi-step intake. Fields without a step belong
   *  to the implicit first step. */
  step?: string;
  /** Validation: regex pattern (string applied via `new RegExp`). */
  pattern?: string;
  /** Friendly message shown when `pattern` fails. */
  patternMessage?: string;
  /** Numeric / length bounds. For text/textarea these apply to `length`. */
  min?: number;
  max?: number;
  /** Conditional visibility — field hides when rules don't pass. */
  show_if?: ShowIfRule[];
}

export interface IntakeFormSchema {
  fields: IntakeFieldDef[];
  title?: string;
  /** Optional ordered step definitions for multi-step intake. When omitted
   *  but fields carry `step`, steps are inferred in order of first appearance. */
  steps?: Array<{ id: string; label: string; description?: string }>;
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
 * Evaluate a single show_if rule against the current intake values.
 */
function evalRule(rule: ShowIfRule, value: Record<string, unknown>): boolean {
  const v = value?.[rule.field];
  const op = rule.op || 'equals';
  switch (op) {
    case 'equals':
      return v === rule.value;
    case 'not_equals':
      return v !== rule.value;
    case 'in':
      return Array.isArray(rule.values) && rule.values.includes(v as never);
    case 'not_in':
      return Array.isArray(rule.values) && !rule.values.includes(v as never);
    case 'truthy':
      return !!v;
    case 'falsy':
      return !v;
    case 'gt':
      return Number(v) > Number(rule.value);
    case 'gte':
      return Number(v) >= Number(rule.value);
    case 'lt':
      return Number(v) < Number(rule.value);
    case 'lte':
      return Number(v) <= Number(rule.value);
    default:
      return true;
  }
}

/**
 * Returns true when the field should be rendered given current intake values.
 * Fields without a `show_if` rule are always visible.
 */
export function isFieldVisible(
  field: IntakeFieldDef,
  value: Record<string, unknown>,
): boolean {
  if (!field.show_if || field.show_if.length === 0) return true;
  return field.show_if.every((rule) => evalRule(rule, value || {}));
}

/**
 * Returns the ordered list of step ids declared on a schema. If the schema
 * has no `steps`, infer them from the order fields first appear with a
 * `step` value. Fields without any step are bucketed into "default".
 */
export function getSchemaSteps(
  schema: IntakeFormSchema | null,
): Array<{ id: string; label: string; description?: string }> {
  if (!schema) return [];
  if (schema.steps && schema.steps.length) return schema.steps;
  const seen = new Set<string>();
  const inferred: Array<{ id: string; label: string }> = [];
  let hasUnstepped = false;
  for (const f of schema.fields) {
    if (!f.step) {
      hasUnstepped = true;
      continue;
    }
    if (!seen.has(f.step)) {
      seen.add(f.step);
      inferred.push({ id: f.step, label: f.step });
    }
  }
  if (inferred.length === 0) return [];
  if (hasUnstepped) inferred.unshift({ id: 'default', label: 'Details' });
  return inferred;
}

/**
 * Validate a single field's value, returning a friendly error message or null.
 * Includes required-check, regex pattern, and min/max (numeric or length).
 */
function validateField(
  field: IntakeFieldDef,
  value: unknown,
): string | null {
  const isBlank =
    value === undefined ||
    value === null ||
    (typeof value === 'string' && value.trim() === '');
  if (isBlank) {
    return field.required ? `${field.label} is required` : null;
  }
  if (field.pattern && typeof value === 'string') {
    try {
      const re = new RegExp(field.pattern);
      if (!re.test(value)) {
        return field.patternMessage || `${field.label} format is invalid`;
      }
    } catch {
      // Bad pattern in schema — silently skip.
    }
  }
  if (field.type === 'number') {
    const n = Number(value);
    if (Number.isFinite(n)) {
      if (typeof field.min === 'number' && n < field.min) {
        return `${field.label} must be at least ${field.min}`;
      }
      if (typeof field.max === 'number' && n > field.max) {
        return `${field.label} must be at most ${field.max}`;
      }
    }
  } else if (
    (field.type === 'text' || field.type === 'textarea') &&
    typeof value === 'string'
  ) {
    if (typeof field.min === 'number' && value.length < field.min) {
      return `${field.label} must be at least ${field.min} characters`;
    }
    if (typeof field.max === 'number' && value.length > field.max) {
      return `${field.label} must be at most ${field.max} characters`;
    }
  }
  return null;
}

/**
 * Returns an array of human-readable error strings for any required fields
 * that are missing/blank, plus pattern + min/max errors. Hidden fields
 * (failing their `show_if`) are skipped entirely.
 */
export function validateIntake(
  schema: IntakeFormSchema | null,
  value: Record<string, unknown>,
): string[] {
  if (!schema) return [];
  const errors: string[] = [];
  for (const field of schema.fields) {
    if (!isFieldVisible(field, value || {})) continue;
    const err = validateField(field, value?.[field.name]);
    if (err) errors.push(err);
  }
  return errors;
}

/**
 * Per-field error map keyed by field name. Useful for inline UI errors
 * (vs. the flat string list returned by {@link validateIntake}).
 */
export function validateIntakeFieldErrors(
  schema: IntakeFormSchema | null,
  value: Record<string, unknown>,
): Record<string, string> {
  const out: Record<string, string> = {};
  if (!schema) return out;
  for (const field of schema.fields) {
    if (!isFieldVisible(field, value || {})) continue;
    const err = validateField(field, value?.[field.name]);
    if (err) out[field.name] = err;
  }
  return out;
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