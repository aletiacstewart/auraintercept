import React from 'react';
import { Button } from '@/components/ui/button';

interface EmptyConsolePanelProps {
  title?: string;
  body?: string;
  ctaLabel?: string;
  onCta?: () => void;
}

/**
 * Generic empty/no-context state for console panels.
 * Used when a tab opens but the underlying data (company workspace,
 * jobs list, etc.) isn't available yet.
 */
export const EmptyConsolePanel: React.FC<EmptyConsolePanelProps> = ({
  title = 'Nothing to show yet',
  body = 'This panel will populate once data is available.',
  ctaLabel,
  onCta,
}) => {
  return (
    <div className="flex-1 flex items-center justify-center px-6 py-12">
      <div className="max-w-md text-center space-y-3">
        <h3 className="text-base font-semibold text-foreground">{title}</h3>
        <p className="text-sm text-muted-foreground">{body}</p>
        {ctaLabel && onCta && (
          <div className="pt-2">
            <Button size="sm" variant="outline" onClick={onCta}>
              {ctaLabel}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default EmptyConsolePanel;