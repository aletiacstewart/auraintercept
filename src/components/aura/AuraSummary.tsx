import { Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';

interface AuraSummaryProps {
  content: string;
  isLoading?: boolean;
  className?: string;
}

export function AuraSummary({ content, isLoading = false, className }: AuraSummaryProps) {
  return (
    <div className={cn('flex gap-3', className)}>
      {/* Aura avatar */}
      <div className="flex-shrink-0 w-10 h-10 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center">
        <Sparkles className="h-5 w-5 text-white" />
      </div>
      
      {/* Summary content */}
      <div className="flex-1 bg-muted/50 rounded-2xl rounded-tl-sm p-4 border border-border">
        {isLoading ? (
          <div className="flex items-center gap-2">
            <div className="flex gap-1">
              <span className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
              <span className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
              <span className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
            </div>
            <span className="text-sm text-muted-foreground">Aura is analyzing...</span>
          </div>
        ) : (
          <div className="prose prose-sm dark:prose-invert max-w-none">
            <p className="text-card-foreground whitespace-pre-wrap leading-relaxed m-0">
              {content}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
