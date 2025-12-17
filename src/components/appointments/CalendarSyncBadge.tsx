import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Calendar, Check, AlertCircle, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';

interface CalendarSyncBadgeProps {
  syncStatus?: string | null;
  lastSyncedAt?: string | null;
  googleEventId?: string | null;
  compact?: boolean;
}

export function CalendarSyncBadge({ 
  syncStatus, 
  lastSyncedAt, 
  googleEventId,
  compact = false 
}: CalendarSyncBadgeProps) {
  // Not synced to Google Calendar
  if (!googleEventId) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Badge 
              variant="outline" 
              className={cn(
                "gap-1 text-muted-foreground border-border/50",
                compact && "px-1.5"
              )}
            >
              <Calendar className="w-3 h-3" />
              {!compact && "Not synced"}
            </Badge>
          </TooltipTrigger>
          <TooltipContent>
            <p>Not synced to Google Calendar</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  // Synced successfully
  if (syncStatus === 'synced') {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Badge 
              variant="outline" 
              className={cn(
                "gap-1 bg-green-500/10 text-green-600 border-green-500/30",
                compact && "px-1.5"
              )}
            >
              <Check className="w-3 h-3" />
              {!compact && "Synced"}
            </Badge>
          </TooltipTrigger>
          <TooltipContent>
            <p>Synced to Google Calendar</p>
            {lastSyncedAt && (
              <p className="text-xs text-muted-foreground">
                Last synced: {format(new Date(lastSyncedAt), 'MMM d, h:mm a')}
              </p>
            )}
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  // Sync pending
  if (syncStatus === 'pending') {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Badge 
              variant="outline" 
              className={cn(
                "gap-1 bg-yellow-500/10 text-yellow-600 border-yellow-500/30",
                compact && "px-1.5"
              )}
            >
              <Clock className="w-3 h-3" />
              {!compact && "Syncing..."}
            </Badge>
          </TooltipTrigger>
          <TooltipContent>
            <p>Sync in progress</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  // Sync failed
  if (syncStatus === 'failed') {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Badge 
              variant="outline" 
              className={cn(
                "gap-1 bg-red-500/10 text-red-600 border-red-500/30",
                compact && "px-1.5"
              )}
            >
              <AlertCircle className="w-3 h-3" />
              {!compact && "Sync failed"}
            </Badge>
          </TooltipTrigger>
          <TooltipContent>
            <p>Failed to sync to Google Calendar</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  // Default synced state
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Badge 
            variant="outline" 
            className={cn(
              "gap-1 bg-green-500/10 text-green-600 border-green-500/30",
              compact && "px-1.5"
            )}
          >
            <Check className="w-3 h-3" />
            {!compact && "Synced"}
          </Badge>
        </TooltipTrigger>
        <TooltipContent>
          <p>Synced to Google Calendar</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
