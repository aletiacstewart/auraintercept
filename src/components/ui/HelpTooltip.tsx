import { HelpCircle } from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { getTooltip } from '@/lib/onboardingTooltips';
import { cn } from '@/lib/utils';

interface HelpTooltipProps {
  term: string;
  children?: React.ReactNode;
  className?: string;
  iconClassName?: string;
  showIcon?: boolean;
}

export function HelpTooltip({ 
  term, 
  children, 
  className,
  iconClassName,
  showIcon = true 
}: HelpTooltipProps) {
  const tooltip = getTooltip(term);
  
  if (!tooltip) {
    return <span className={className}>{children || term}</span>;
  }

  return (
    <TooltipProvider>
      <Tooltip delayDuration={300}>
        <TooltipTrigger asChild>
          <span className={cn('inline-flex items-center gap-1 cursor-help', className)}>
            {children || term}
            {showIcon && (
              <HelpCircle className={cn('w-3.5 h-3.5 text-muted-foreground', iconClassName)} />
            )}
          </span>
        </TooltipTrigger>
        <TooltipContent 
          side="top" 
          className="max-w-[280px] text-sm"
        >
          <p>{tooltip}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
