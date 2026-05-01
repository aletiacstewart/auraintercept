import { z } from 'zod';

/**
 * Zod mirror of `IntakeFieldDef` (Phase H) for the Industry Pack authoring UI.
 * Mirrors `src/lib/industryFormSchemas.ts` — keep in sync if that file changes.
 */
export const intakeFieldTypeSchema = z.enum([
  'text',
  'textarea',
  'number',
  'select',
  'date',
  'checkbox',
]);

export const showIfRuleSchema = z.object({
  field: z.string().min(1, 'Reference field is required'),
  op: z
    .enum([
      'equals',
      'not_equals',
      'in',
      'not_in',
      'truthy',
      'falsy',
      'gt',
      'gte',
      'lt',
      'lte',
    ])
    .default('equals'),
  value: z.unknown().optional(),
  values: z.array(z.unknown()).optional(),
});

export const intakeFieldDefSchema = z
  .object({
    name: z
      .string()
      .min(1, 'name required')
      .max(64, 'name max 64 chars')
      .regex(/^[a-z][a-z0-9_]*$/i, 'lowercase letters, digits, underscores'),
    label: z.string().min(1, 'label required').max(120),
    type: intakeFieldTypeSchema,
    required: z.boolean().optional(),
    options: z.array(z.string().min(1)).optional(),
    placeholder: z.string().max(200).optional(),
    helper: z.string().max(240).optional(),
    step: z.string().max(64).optional(),
    pattern: z
      .string()
      .max(500)
      .optional()
      .refine(
        (v) => {
          if (!v) return true;
          try {
            new RegExp(v);
            return true;
          } catch {
            return false;
          }
        },
        { message: 'Invalid regex pattern' },
      ),
    patternMessage: z.string().max(200).optional(),
    min: z.number().finite().optional(),
    max: z.number().finite().optional(),
    show_if: z.array(showIfRuleSchema).optional(),
  })
  .refine(
    (f) => f.type !== 'select' || (f.options && f.options.length > 0),
    { message: 'select fields require at least one option', path: ['options'] },
  );

export const intakeFormSchemaSchema = z.object({
  title: z.string().max(120).optional(),
  steps: z
    .array(
      z.object({
        id: z.string().min(1).max(64),
        label: z.string().min(1).max(120),
        description: z.string().max(240).optional(),
      }),
    )
    .optional(),
  fields: z.array(intakeFieldDefSchema),
});

export const jobTemplateSchema = z.object({
  id: z.string().min(1).max(64),
  label: z.string().min(1).max(120),
  form_id: z.string().max(64).optional().nullable(),
  duration_minutes: z.number().int().positive().max(24 * 60).optional(),
});

export const terminologySchema = z.record(z.string().min(1), z.string().min(1).max(120));

export const promptDeltasSchema = z.record(z.string().min(1), z.string().max(8000));

export const packEditableSchema = z.object({
  label: z.string().min(1).max(120),
  description: z.string().max(500).nullable().optional(),
  cluster: z.enum(['trades', 'outdoor', 'repair', 'booking']),
  is_active: z.boolean(),
  job_templates: z.array(jobTemplateSchema),
  form_schemas: z.record(z.string().min(1), intakeFormSchemaSchema),
  terminology: terminologySchema,
  agent_prompt_deltas: promptDeltasSchema,
  extra_operatives: z.array(z.string().min(1)),
  dashboard_widgets: z.array(z.string().min(1)).optional(),
});

export type PackEditable = z.infer<typeof packEditableSchema>;
export type JobTemplateInput = z.infer<typeof jobTemplateSchema>;
export type IntakeFieldInput = z.infer<typeof intakeFieldDefSchema>;
export type IntakeFormSchemaInput = z.infer<typeof intakeFormSchemaSchema>;

/**
 * Strip a pack row down to the editable fields the authoring UI manages.
 * Falls back to safe defaults so existing rows with NULL JSON columns don't
 * break the editor.
 */
export function pickEditable(row: Record<string, unknown>): PackEditable {
  return {
    label: String(row.label ?? ''),
    description: (row.description as string | null) ?? null,
    cluster: (row.cluster as PackEditable['cluster']) ?? 'trades',
    is_active: row.is_active !== false,
    job_templates: Array.isArray(row.job_templates)
      ? (row.job_templates as PackEditable['job_templates'])
      : [],
    form_schemas:
      row.form_schemas && typeof row.form_schemas === 'object'
        ? (row.form_schemas as PackEditable['form_schemas'])
        : {},
    terminology:
      row.terminology && typeof row.terminology === 'object'
        ? (row.terminology as PackEditable['terminology'])
        : {},
    agent_prompt_deltas:
      row.agent_prompt_deltas && typeof row.agent_prompt_deltas === 'object'
        ? (row.agent_prompt_deltas as PackEditable['agent_prompt_deltas'])
        : {},
    extra_operatives: Array.isArray(row.extra_operatives)
      ? (row.extra_operatives as string[])
      : [],
    dashboard_widgets: Array.isArray(row.dashboard_widgets)
      ? (row.dashboard_widgets as string[])
      : [],
  };
}