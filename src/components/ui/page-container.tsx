import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface PageContainerProps {
  children: React.ReactNode;
  className?: string;
  /** Container variant: 'default' uses dark frame with light content, 'console' uses console-surface */
  variant?: 'default' | 'console' | 'transparent';
}

export function PageContainer({ children, className, variant = 'default' }: PageContainerProps) {
  if (variant === 'transparent') {
    return (
      <div className={cn("flex-1 overflow-y-auto", className)}>
        {children}
      </div>
    );
  }

  return (
    <Card className="min-h-[600px] flex flex-col overflow-hidden shadow-xl surface-elevated-dark border-border/50">
      <div className={cn(
        "flex-1 overflow-y-auto p-4 rounded-lg",
        variant === 'console' ? 'console-surface' : 'console-surface',
        className
      )}>
        {children}
      </div>
    </Card>
  );
}
