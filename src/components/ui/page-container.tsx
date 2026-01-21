import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface PageContainerProps {
  children: React.ReactNode;
  className?: string;
}

export function PageContainer({ children, className }: PageContainerProps) {
  return (
    <Card className="min-h-[600px] flex flex-col overflow-hidden shadow-xl border-slate-600/50 bg-slate-800">
      <div className={cn("flex-1 overflow-y-auto p-4 bg-white rounded-lg", className)}>
        {children}
      </div>
    </Card>
  );
}
