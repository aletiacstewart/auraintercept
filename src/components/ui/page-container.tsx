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
    <div 
      className={cn("min-h-[600px] flex flex-col overflow-hidden rounded-xl relative", className)}
      style={{
        background: 'rgba(2,8,18,0.97)',
        border: '1px solid rgba(0,229,255,0.12)',
        boxShadow: '0 0 40px rgba(0,0,0,0.5), 0 0 80px rgba(0,229,255,0.04)',
        borderTop: '3px solid rgba(0,229,255,0.5)',
      }}
    >
      <div className="flex-1 overflow-y-auto p-4">
        {children}
      </div>
    </div>
  );
}
