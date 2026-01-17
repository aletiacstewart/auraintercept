import { cn } from '@/lib/utils';
import { HelpTooltip } from '@/components/ui/HelpTooltip';
import { CheckCircle2, Circle, Zap } from 'lucide-react';

interface ComplexityScoreProps {
  score: number; // 0-100, where 0 is complete
  className?: string;
  showLabel?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export function ComplexityScore({ 
  score, 
  className, 
  showLabel = true,
  size = 'md' 
}: ComplexityScoreProps) {
  // Clamp score between 0 and 100
  const clampedScore = Math.max(0, Math.min(100, score));
  
  // Calculate progress (inverted - lower score = more progress)
  const progress = 100 - clampedScore;
  
  // Determine color based on score
  const getColor = () => {
    if (clampedScore <= 0) return 'text-green-500';
    if (clampedScore <= 30) return 'text-green-400';
    if (clampedScore <= 60) return 'text-amber-400';
    if (clampedScore <= 80) return 'text-orange-400';
    return 'text-red-400';
  };

  const getBgColor = () => {
    if (clampedScore <= 0) return 'stroke-green-500';
    if (clampedScore <= 30) return 'stroke-green-400';
    if (clampedScore <= 60) return 'stroke-amber-400';
    if (clampedScore <= 80) return 'stroke-orange-400';
    return 'stroke-red-400';
  };

  const sizeConfig = {
    sm: { container: 'w-12 h-12', text: 'text-sm', stroke: 3, radius: 18 },
    md: { container: 'w-16 h-16', text: 'text-lg', stroke: 4, radius: 26 },
    lg: { container: 'w-20 h-20', text: 'text-xl', stroke: 5, radius: 34 },
  };

  const config = sizeConfig[size];
  const circumference = 2 * Math.PI * config.radius;
  const strokeDashoffset = circumference - (progress / 100) * circumference;

  const isComplete = clampedScore <= 0;

  return (
    <div className={cn('flex items-center gap-3', className)}>
      {/* Circular Progress */}
      <div className={cn('relative', config.container)}>
        <svg className="w-full h-full -rotate-90" viewBox="0 0 80 80">
          {/* Background circle */}
          <circle
            cx="40"
            cy="40"
            r={config.radius}
            fill="none"
            stroke="currentColor"
            strokeWidth={config.stroke}
            className="text-muted/30"
          />
          {/* Progress circle */}
          <circle
            cx="40"
            cy="40"
            r={config.radius}
            fill="none"
            strokeWidth={config.stroke}
            strokeLinecap="round"
            className={cn('transition-all duration-500', getBgColor())}
            style={{
              strokeDasharray: circumference,
              strokeDashoffset,
            }}
          />
        </svg>
        
        {/* Center content */}
        <div className="absolute inset-0 flex items-center justify-center">
          {isComplete ? (
            <CheckCircle2 className={cn('text-green-500', size === 'sm' ? 'w-5 h-5' : size === 'md' ? 'w-6 h-6' : 'w-8 h-8')} />
          ) : (
            <span className={cn('font-bold', config.text, getColor())}>
              {clampedScore}
            </span>
          )}
        </div>
      </div>

      {/* Label */}
      {showLabel && (
        <div className="flex flex-col">
          <HelpTooltip term="Complexity Score" showIcon={false}>
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              {isComplete ? 'Complete!' : 'Complexity'}
            </span>
          </HelpTooltip>
          <span className={cn('text-sm font-semibold', getColor())}>
            {isComplete ? (
              <span className="flex items-center gap-1">
                <Zap className="w-3 h-3" />
                Ready to go
              </span>
            ) : (
              `${progress}% done`
            )}
          </span>
        </div>
      )}
    </div>
  );
}

// Helper to calculate complexity score based on completed tasks
export function calculateComplexityScore(tasks: {
  hasBusinessProfile?: boolean;
  hasLogo?: boolean;
  hasBrandColors?: boolean;
  hasServices?: boolean;
  hasBusinessHours?: boolean;
  hasFAQs?: boolean;
  hasActiveAgents?: boolean;
}): number {
  let score = 100;
  
  // Business Profile: -30 points total
  if (tasks.hasBusinessProfile) score -= 10;
  if (tasks.hasLogo) score -= 10;
  if (tasks.hasBrandColors) score -= 10;
  
  // Knowledge Base: -40 points total
  if (tasks.hasServices) score -= 15;
  if (tasks.hasBusinessHours) score -= 15;
  if (tasks.hasFAQs) score -= 10;
  
  // Agent Activation: -30 points
  if (tasks.hasActiveAgents) score -= 30;
  
  return Math.max(0, score);
}
