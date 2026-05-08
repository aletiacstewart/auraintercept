import { ReactNode, useEffect, useRef } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useInlineForms } from '@/components/ui/inline-form-tabs';

interface FormShellProps {
  /** Stable id used as the inline tab key. */
  id: string;
  /** Tab/dialog title text. */
  title: ReactNode;
  /** Short description shown beneath the title. */
  description?: ReactNode;
  /** Controlled open state from the parent (matches old Dialog API). */
  open: boolean;
  /** Called when the form is closed (× tab close, submit success, cancel). */
  onOpenChange: (open: boolean) => void;
  /** Optional class for the dialog/inline body. */
  className?: string;
  /** Form body. */
  children: ReactNode;
}

/**
 * FormShell — a drop-in replacement for <Dialog> wrappers around forms.
 * - When rendered inside an <InlineFormProvider>, opens as an inline console tab.
 * - Otherwise, falls back to a standard centered Dialog (back-compat).
 */
export function FormShell({ id, title, description, open, onOpenChange, className, children }: FormShellProps) {
  const inline = useInlineForms();
  const wasOpen = useRef(false);

  // Inline mode: push/pop the form into the host as `open` toggles.
  useEffect(() => {
    if (!inline) return;
    if (open && !wasOpen.current) {
      inline.openForm({
        id,
        title: typeof title === 'string' ? title : id,
        node: <div className={className}>{children}</div>,
      });
      wasOpen.current = true;
    } else if (open && wasOpen.current) {
      // Re-render content when children change.
      inline.openForm({
        id,
        title: typeof title === 'string' ? title : id,
        node: <div className={className}>{children}</div>,
      });
    } else if (!open && wasOpen.current) {
      inline.closeForm(id);
      wasOpen.current = false;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, children]);

  // Sync external close (× on tab) back to parent.
  useEffect(() => {
    if (!inline) return;
    if (wasOpen.current && !inline.forms.some((f) => f.id === id)) {
      wasOpen.current = false;
      onOpenChange(false);
    }
  }, [inline?.forms, id, onOpenChange, inline]);

  if (inline) {
    // Body is rendered via the InlineFormHost; nothing to mount here.
    return null;
  }

  // Fallback: classic dialog
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className={className}>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          {description && <DialogDescription>{description}</DialogDescription>}
        </DialogHeader>
        {children}
      </DialogContent>
    </Dialog>
  );
}