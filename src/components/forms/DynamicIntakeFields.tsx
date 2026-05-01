import React, { useMemo, useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  isFieldVisible,
  getSchemaSteps,
  validateIntakeFieldErrors,
  type IntakeFieldDef,
  type IntakeFormSchema,
} from '@/lib/industryFormSchemas';

interface DynamicIntakeFieldsProps {
  schema: IntakeFormSchema | null;
  value: Record<string, unknown>;
  onChange: (next: Record<string, unknown>) => void;
  disabled?: boolean;
  /** Optional heading shown above the dynamic block. */
  title?: string;
  /** Show a step-by-step wizard when the schema declares (or implies) steps.
   *  Defaults to true. Set false to render every visible field at once. */
  multiStep?: boolean;
  /** Show inline per-field error messages (pattern, min/max, required).
   *  When false, only validity is enforced via parent's validateIntake. */
  showInlineErrors?: boolean;
}

/**
 * Renders intake fields driven by an industry pack form schema. Returns null
 * when the schema has no fields so generic verticals get no extra UI.
 */
export const DynamicIntakeFields: React.FC<DynamicIntakeFieldsProps> = ({
  schema,
  value,
  onChange,
  disabled,
  title,
  multiStep = true,
  showInlineErrors = true,
}) => {
  if (!schema || !schema.fields?.length) return null;

  const set = (name: string, v: unknown) =>
    onChange({ ...(value || {}), [name]: v });

  const steps = useMemo(() => getSchemaSteps(schema), [schema]);
  const useWizard = multiStep && steps.length > 1;
  const [stepIndex, setStepIndex] = useState(0);
  useEffect(() => {
    if (stepIndex >= steps.length) setStepIndex(0);
  }, [steps.length, stepIndex]);

  const errors = useMemo(
    () => validateIntakeFieldErrors(schema, value || {}),
    [schema, value],
  );

  const visibleFields = useMemo(
    () => schema.fields.filter((f) => isFieldVisible(f, value || {})),
    [schema, value],
  );

  const fieldsForStep: IntakeFieldDef[] = useWizard
    ? visibleFields.filter((f) => {
        const sid = f.step || 'default';
        return sid === steps[stepIndex]?.id;
      })
    : visibleFields;

  const stepHasErrors = fieldsForStep.some((f) => !!errors[f.name]);

  return (
    <div className="space-y-3 rounded-md border border-border/60 bg-background/40 p-3">
      <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
        {title || schema.title || 'Job Details'}
      </div>
      {useWizard && (
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          {steps.map((s, i) => (
            <React.Fragment key={s.id}>
              <button
                type="button"
                disabled={disabled}
                onClick={() => setStepIndex(i)}
                className={`rounded-full px-2 py-0.5 transition-colors ${
                  i === stepIndex
                    ? 'bg-primary/15 text-primary'
                    : 'bg-muted/40 hover:bg-muted'
                }`}
              >
                {i + 1}. {s.label}
              </button>
              {i < steps.length - 1 && <span className="opacity-40">›</span>}
            </React.Fragment>
          ))}
        </div>
      )}
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
        {fieldsForStep.map((field) => {
          const current = value?.[field.name];
          const id = `intake-${field.name}`;
          const fieldError = showInlineErrors ? errors[field.name] : undefined;
          const labelEl = (
            <Label htmlFor={id} className="text-foreground/70">
              {field.label}
              {field.required ? ' *' : ''}
            </Label>
          );
          const errorEl = fieldError ? (
            <p className="text-xs text-destructive">{fieldError}</p>
          ) : field.helper ? (
            <p className="text-xs text-muted-foreground">{field.helper}</p>
          ) : null;
          if (field.type === 'textarea') {
            return (
              <div key={field.name} className="space-y-2 md:col-span-2">
                {labelEl}
                <Textarea
                  id={id}
                  rows={2}
                  disabled={disabled}
                  value={(current as string) ?? ''}
                  placeholder={field.placeholder}
                  minLength={field.min}
                  maxLength={field.max}
                  onChange={(e) => set(field.name, e.target.value)}
                  className="bg-white text-slate-900 border-border placeholder:text-slate-400"
                />
                {errorEl}
              </div>
            );
          }
          if (field.type === 'select') {
            return (
              <div key={field.name} className="space-y-2">
                {labelEl}
                <Select
                  disabled={disabled}
                  value={(current as string) ?? ''}
                  onValueChange={(v) => set(field.name, v)}
                >
                  <SelectTrigger
                    id={id}
                    className="bg-white text-slate-900 border-border"
                  >
                    <SelectValue placeholder="Select…" />
                  </SelectTrigger>
                  <SelectContent>
                    {(field.options || []).map((opt) => (
                      <SelectItem key={opt} value={opt}>
                        {opt}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errorEl}
              </div>
            );
          }
          if (field.type === 'checkbox') {
            return (
              <div
                key={field.name}
                className="flex items-center gap-2 md:col-span-2"
              >
                <Checkbox
                  id={id}
                  checked={!!current}
                  disabled={disabled}
                  onCheckedChange={(v) => set(field.name, !!v)}
                />
                <Label
                  htmlFor={id}
                  className="cursor-pointer text-sm text-foreground/70"
                >
                  {field.label}
                  {field.required ? ' *' : ''}
                </Label>
                {errorEl}
              </div>
            );
          }
          // text | number | date
          return (
            <div key={field.name} className="space-y-2">
              {labelEl}
              <Input
                id={id}
                type={
                  field.type === 'number'
                    ? 'number'
                    : field.type === 'date'
                      ? 'date'
                      : 'text'
                }
                disabled={disabled}
                value={(current as string | number | undefined) ?? ''}
                placeholder={field.placeholder}
                pattern={field.type === 'text' ? field.pattern : undefined}
                min={field.type === 'number' ? field.min : undefined}
                max={field.type === 'number' ? field.max : undefined}
                minLength={field.type === 'text' ? field.min : undefined}
                maxLength={field.type === 'text' ? field.max : undefined}
                onChange={(e) =>
                  set(
                    field.name,
                    field.type === 'number'
                      ? e.target.value === ''
                        ? ''
                        : Number(e.target.value)
                      : e.target.value,
                  )
                }
                className="bg-white text-slate-900 border-border placeholder:text-slate-400"
              />
              {errorEl}
            </div>
          );
        })}
      </div>
      {useWizard && (
        <div className="flex items-center justify-between pt-1">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            disabled={disabled || stepIndex === 0}
            onClick={() => setStepIndex((i) => Math.max(0, i - 1))}
          >
            Back
          </Button>
          <span className="text-xs text-muted-foreground">
            Step {stepIndex + 1} of {steps.length}
          </span>
          <Button
            type="button"
            variant="secondary"
            size="sm"
            disabled={
              disabled || stepHasErrors || stepIndex >= steps.length - 1
            }
            onClick={() =>
              setStepIndex((i) => Math.min(steps.length - 1, i + 1))
            }
          >
            Next
          </Button>
        </div>
      )}
    </div>
  );
};