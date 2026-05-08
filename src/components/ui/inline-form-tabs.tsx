import { createContext, useContext, useState, useCallback, ReactNode, ComponentType } from 'react';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

/**
 * Inline form tabs primitive.
 *
 * Replaces pop-up Dialog/Sheet forms with inline tabs that open inside the
 * current console. Each console wraps its content in <InlineFormProvider>
 * and renders <InlineFormHost /> where the form panels should appear (after
 * the page header, before the static tabs).
 *
 * Existing form components keep their `open` / `onOpenChange` API. They just
 * swap their <Dialog> wrapper for <FormShell>, which routes to either
 * (a) an inline tab when an InlineFormProvider is present, or
 * (b) a regular Dialog when not (back-compat).
 */

export interface InlineFormSpec {
  id: string;
  title: string;
  /** Rendered body of the form (no Dialog wrapper). */
  node: ReactNode;
}

interface Ctx {
  forms: InlineFormSpec[];
  activeId: string | null;
  openForm: (spec: InlineFormSpec) => void;
  closeForm: (id: string) => void;
  setActive: (id: string | null) => void;
}

const InlineFormCtx = createContext<Ctx | null>(null);

export function InlineFormProvider({ children }: { children: ReactNode }) {
  const [forms, setForms] = useState<InlineFormSpec[]>([]);
  const [activeId, setActive] = useState<string | null>(null);

  const openForm = useCallback((spec: InlineFormSpec) => {
    setForms((prev) => {
      const idx = prev.findIndex((f) => f.id === spec.id);
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = spec;
        return next;
      }
      return [...prev, spec];
    });
    setActive(spec.id);
  }, []);

  const closeForm = useCallback((id: string) => {
    setForms((prev) => prev.filter((f) => f.id !== id));
    setActive((curr) => (curr === id ? null : curr));
  }, []);

  return (
    <InlineFormCtx.Provider value={{ forms, activeId, openForm, closeForm, setActive }}>
      {children}
    </InlineFormCtx.Provider>
  );
}

export function useInlineForms(): Ctx | null {
  return useContext(InlineFormCtx);
}

/**
 * Renders the active form panel inline (inside the console). Place this
 * above the static tabs in your console layout.
 */
export function InlineFormHost({ className }: { className?: string }) {
  const ctx = useContext(InlineFormCtx);
  if (!ctx || ctx.forms.length === 0 || !ctx.activeId) return null;
  return (
    <div className={cn('rounded-lg border border-border bg-card p-4 animate-fade-in', className)}>
      {/* Tab strip */}
      <div className="flex items-center gap-1 border-b border-border mb-4 -mx-4 px-4 pb-2 overflow-x-auto">
        {ctx.forms.map((f) => {
          const active = f.id === ctx.activeId;
          return (
            <div
              key={f.id}
              className={cn(
                'flex items-center gap-1 rounded-t-md px-3 py-1.5 text-sm cursor-pointer transition-colors',
                active
                  ? 'bg-primary/10 text-primary border-b-2 border-primary'
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted/40',
              )}
              onClick={() => ctx.setActive(f.id)}
            >
              <span className="font-medium whitespace-nowrap">{f.title}</span>
              <Button
                size="sm"
                variant="ghost"
                className="h-5 w-5 p-0 hover:bg-destructive/10 hover:text-destructive"
                onClick={(e) => {
                  e.stopPropagation();
                  ctx.closeForm(f.id);
                }}
                aria-label={`Close ${f.title}`}
              >
                <X className="h-3.5 w-3.5" />
              </Button>
            </div>
          );
        })}
      </div>
      {ctx.forms.map((f) => (
        <div key={f.id} className={f.id === ctx.activeId ? 'block' : 'hidden'}>
          {f.node}
        </div>
      ))}
    </div>
  );
}