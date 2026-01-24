import React from 'react';
import { cn } from '@/lib/utils';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface ConfidenceIndicatorProps {
  score: number | null | undefined;
  showLabel?: boolean;
  showValue?: boolean;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const getConfidenceLevel = (score: number): {
  label: string;
  color: string;
  bgColor: string;
} => {
  if (score >= 0.8) {
    return { label: 'High', color: 'bg-emerald-500', bgColor: 'bg-emerald-500/20' };
  } else if (score >= 0.5) {
    return { label: 'Medium', color: 'bg-amber-500', bgColor: 'bg-amber-500/20' };
  } else {
    return { label: 'Low', color: 'bg-red-500', bgColor: 'bg-red-500/20' };
  }
};

export const ConfidenceIndicator: React.FC<ConfidenceIndicatorProps> = ({
  score,
  showLabel = true,
  showValue = false,
  size = 'sm',
  className
}) => {
  if (score === null || score === undefined) {
    return (
      <span className="text-muted-foreground text-xs">--</span>
    );
  }

  const { label, color, bgColor } = getConfidenceLevel(score);
  const percentage = Math.round(score * 100);

  const barWidth = size === 'sm' ? 'w-16' : size === 'md' ? 'w-24' : 'w-32';
  const barHeight = size === 'sm' ? 'h-1.5' : size === 'md' ? 'h-2' : 'h-2.5';

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className={cn('flex items-center gap-2', className)}>
            <div className={cn('rounded-full overflow-hidden', barWidth, barHeight, bgColor)}>
              <div 
                className={cn('h-full rounded-full transition-all duration-300', color)}
                style={{ width: `${percentage}%` }}
              />
            </div>
            {showLabel && (
              <span className={cn(
                'font-medium',
                size === 'sm' ? 'text-xs' : 'text-sm',
                score >= 0.8 ? 'text-emerald-400' : score >= 0.5 ? 'text-amber-400' : 'text-red-400'
              )}>
                {label}
              </span>
            )}
            {showValue && (
              <span className="text-muted-foreground text-xs">
                ({percentage}%)
              </span>
            )}
          </div>
        </TooltipTrigger>
        <TooltipContent>
          <p>Confidence: {percentage}% ({label})</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

export default ConfidenceIndicator;
