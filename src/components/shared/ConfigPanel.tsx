import { ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ConfigPanelProps {
  title: ReactNode;
  description?: ReactNode;
  icon?: ReactNode;
  children: ReactNode;
  onSave?: () => void;
  saveLabel?: string;
  saving?: boolean;
  saveDisabled?: boolean;
  footerNote?: ReactNode;
  className?: string;
}

/**
 * Settings panel with a consistent header and a single save action.
 */
export function ConfigPanel({
  title,
  description,
  icon,
  children,
  onSave,
  saveLabel = 'Save',
  saving = false,
  saveDisabled = false,
  footerNote,
  className,
}: ConfigPanelProps) {
  return (
    <Card className={cn('border-border/50', className)}>
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2 text-base">
          {icon}
          {title}
        </CardTitle>
        {description && <CardDescription>{description}</CardDescription>}
      </CardHeader>
      <CardContent className="space-y-4">{children}</CardContent>
      {(onSave || footerNote) && (
        <CardFooter className="flex flex-wrap items-center justify-between gap-3 border-t border-border/50 pt-4">
          <div className="text-xs text-muted-foreground">{footerNote}</div>
          {onSave && (
            <Button onClick={onSave} disabled={saving || saveDisabled}>
              {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {saveLabel}
            </Button>
          )}
        </CardFooter>
      )}
    </Card>
  );
}
