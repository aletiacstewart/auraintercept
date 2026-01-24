import React from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Clock, Eye, MoreHorizontal } from 'lucide-react';
import { DecisionModeBadge, DecisionMode } from './DecisionModeBadge';
import { ConfidenceIndicator } from './ConfidenceIndicator';
import { formatDistanceToNow } from 'date-fns';
import { cn } from '@/lib/utils';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface AgentStatusIndicatorProps {
  agentName: string;
  decisionMode: DecisionMode;
  confidenceScore: number | null;
  lastAction?: string;
  lastActionTime?: string;
  requiresReview?: boolean;
  onOverride?: () => void;
  onViewDetails?: () => void;
  onViewLogs?: () => void;
  className?: string;
  compact?: boolean;
}

export const AgentStatusIndicator: React.FC<AgentStatusIndicatorProps> = ({
  agentName,
  decisionMode,
  confidenceScore,
  lastAction,
  lastActionTime,
  requiresReview = false,
  onOverride,
  onViewDetails,
  onViewLogs,
  className,
  compact = false
}) => {
  const timeAgo = lastActionTime 
    ? formatDistanceToNow(new Date(lastActionTime), { addSuffix: true })
    : null;

  if (compact) {
    return (
      <div className={cn('flex items-center gap-3', className)}>
        <DecisionModeBadge mode={decisionMode} size="sm" />
        <ConfidenceIndicator score={confidenceScore} size="sm" />
        {requiresReview && (
          <Button 
            size="sm" 
            variant="outline" 
            onClick={onOverride}
            className="h-6 text-xs border-amber-500/50 text-amber-400 hover:bg-amber-500/20"
          >
            <Eye className="h-3 w-3 mr-1" />
            Review
          </Button>
        )}
      </div>
    );
  }

  return (
    <Card className={cn(
      'p-4 bg-card/50 border-border/50',
      requiresReview && 'border-amber-500/30 bg-amber-500/5',
      className
    )}>
      <div className="flex items-start justify-between mb-3">
        <div>
          <h4 className="font-medium text-foreground">{agentName}</h4>
          <div className="flex items-center gap-2 mt-1">
            <DecisionModeBadge mode={decisionMode} />
            <ConfidenceIndicator score={confidenceScore} showValue />
          </div>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {onViewDetails && (
              <DropdownMenuItem onClick={onViewDetails}>
                View Details
              </DropdownMenuItem>
            )}
            {onViewLogs && (
              <DropdownMenuItem onClick={onViewLogs}>
                View Logs
              </DropdownMenuItem>
            )}
            {onOverride && (
              <DropdownMenuItem onClick={onOverride}>
                Override Decision
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {lastAction && (
        <div className="border-t border-border/50 pt-3 mt-3">
          <p className="text-sm text-foreground/80 line-clamp-2">
            "{lastAction}"
          </p>
          {timeAgo && (
            <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {timeAgo}
            </p>
          )}
        </div>
      )}

      {requiresReview && (
        <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-3 mt-3 flex items-center justify-between">
          <span className="text-xs text-amber-400 font-medium">
            Needs your review
          </span>
          <Button 
            size="sm" 
            variant="outline" 
            onClick={onOverride}
            className="h-7 text-xs border-amber-500/50 text-amber-400 hover:bg-amber-500/20"
          >
            Review Now
          </Button>
        </div>
      )}
    </Card>
  );
};

export default AgentStatusIndicator;
