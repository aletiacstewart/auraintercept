import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

interface ScoreFactors {
  contact?: number;
  intent?: number;
  source?: number;
  service?: number;
  recency?: number;
}

interface LeadScoreBadgeProps {
  score: number;
  scoreFactors?: ScoreFactors;
  size?: 'sm' | 'md' | 'lg';
}

export function LeadScoreBadge({ score, scoreFactors, size = 'md' }: LeadScoreBadgeProps) {
  const getScoreColor = (score: number) => {
    if (score >= 80) return 'bg-green-500/20 text-green-400 border-green-500/30';
    if (score >= 60) return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
    if (score >= 40) return 'bg-orange-500/20 text-orange-400 border-orange-500/30';
    return 'bg-muted text-muted-foreground border-border';
  };

  const getScoreLabel = (score: number) => {
    if (score >= 80) return 'Excellent';
    if (score >= 60) return 'Good';
    if (score >= 40) return 'Fair';
    return 'Low';
  };

  const sizeClasses = {
    sm: 'text-xs px-1.5 py-0.5 min-w-[32px]',
    md: 'text-sm px-2 py-1 min-w-[40px]',
    lg: 'text-base px-3 py-1.5 min-w-[48px]',
  };

  const factorLabels = {
    contact: { label: 'Contact Info', max: 25 },
    intent: { label: 'Intent', max: 20 },
    source: { label: 'Source Quality', max: 15 },
    service: { label: 'Service Interest', max: 20 },
    recency: { label: 'Recency', max: 20 },
  };

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div
            className={cn(
              'inline-flex items-center justify-center font-semibold rounded border cursor-help',
              getScoreColor(score),
              sizeClasses[size]
            )}
          >
            {score}
          </div>
        </TooltipTrigger>
        <TooltipContent side="top" className="w-64">
          <div className="space-y-2">
            <div className="flex items-center justify-between border-b border-border pb-2">
              <span className="font-medium">Lead Score</span>
              <span className={cn('font-bold', getScoreColor(score).split(' ')[1])}>
                {score}/100 ({getScoreLabel(score)})
              </span>
            </div>
            {scoreFactors && (
              <div className="space-y-1.5">
                {Object.entries(factorLabels).map(([key, { label, max }]) => {
                  const value = scoreFactors[key as keyof ScoreFactors] || 0;
                  const percentage = (value / max) * 100;
                  return (
                    <div key={key} className="space-y-0.5">
                      <div className="flex justify-between text-xs">
                        <span className="text-muted-foreground">{label}</span>
                        <span>{value}/{max}</span>
                      </div>
                      <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                        <div
                          className="h-full bg-primary rounded-full transition-all"
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
