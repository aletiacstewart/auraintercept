import React from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { IntakeFormSchema } from '@/lib/industryFormSchemas';

interface DynamicIntakeFieldsProps {
  schema: IntakeFormSchema | null;
  value: Record<string, unknown>;
  onChange: (next: Record<string, unknown>) => void;
  disabled?: boolean;
  /** Optional heading shown above the dynamic block. */
  title?: string;
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
}) => {
  if (!schema || !schema.fields?.length) return null;

  const set = (name: string, v: unknown) =>
    onChange({ ...(value || {}), [name]: v });

  return (
    <div className="space-y-3 rounded-md border border-border/60 bg-background/40 p-3">
      <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
        {title || schema.title || 'Job Details'}
      </div>
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
        {schema.fields.map((field) => {
          const current = value?.[field.name];
          const id = `intake-${field.name}`;
          const labelEl = (
            <Label htmlFor={id} className="text-foreground/70">
              {field.label}
              {field.required ? ' *' : ''}
            </Label>
          );
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
                  onChange={(e) => set(field.name, e.target.value)}
                  className="bg-white text-slate-900 border-border placeholder:text-slate-400"
                />
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
            </div>
          );
        })}
      </div>
    </div>
  );
};