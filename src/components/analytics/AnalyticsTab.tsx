import type { ReactNode } from 'react';
import { AlertCircle } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent } from '@/components/ui/card';

interface AnalyticsTabProps {
  /** Optional heading rendered above the panel content. */
  title?: string;
  description?: string;
  /** Right-aligned slot for actions such as an export button. */
  actions?: ReactNode;
  isLoading?: boolean;
  error?: unknown;
  children: ReactNode;
}

/**
 * Shared wrapper for every panel inside the unified analytics dashboard.
 * Gives each tab consistent spacing, loading skeletons and error handling.
 */
export function AnalyticsTab({
  title,
  description,
  actions,
  isLoading = false,
  error,
  children,
}: AnalyticsTabProps) {
  return (
    <div className="space-y-4 animate-fade-in">
      {(title || actions) && (
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            {title && <h2 className="text-lg font-semibold text-foreground">{title}</h2>}
            {description && (
              <p className="text-sm text-muted-foreground">{description}</p>
            )}
          </div>
          {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
        </div>
      )}

      {error ? (
        <Card className="border-destructive/40">
          <CardContent className="flex items-center gap-3 py-6 text-sm text-muted-foreground">
            <AlertCircle className="h-4 w-4 text-destructive shrink-0" />
            <span>
              We couldn&apos;t load this report right now. Refresh the page or try again in a
              moment.
            </span>
          </CardContent>
        </Card>
      ) : isLoading ? (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-32 rounded-lg" />
          ))}
        </div>
      ) : (
        children
      )}
    </div>
  );
}

export default AnalyticsTab;
