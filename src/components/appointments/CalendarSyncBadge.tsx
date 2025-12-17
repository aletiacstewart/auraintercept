import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Calendar, Check, AlertCircle, Clock, RefreshCw } from 'lucide-react';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface CalendarSyncBadgeProps {
  syncStatus?: string | null;
  lastSyncedAt?: string | null;
  googleEventId?: string | null;
  appointmentId?: string;
  companyId?: string;
  compact?: boolean;
  onRetrySuccess?: () => void;
}

export function CalendarSyncBadge({ 
  syncStatus, 
  lastSyncedAt, 
  googleEventId,
  appointmentId,
  companyId,
  compact = false,
  onRetrySuccess
}: CalendarSyncBadgeProps) {
  const [isSyncing, setIsSyncing] = useState(false);
  const { toast } = useToast();

  const handleSync = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!appointmentId || !companyId) return;
    
    setIsSyncing(true);
    try {
      const { error } = await supabase.functions.invoke('google-calendar-sync', {
        body: {
          action: 'sync_appointment',
          companyId,
          appointmentId
        }
      });

      if (error) throw error;

      toast({
        title: 'Sync initiated',
        description: 'Calendar sync has been queued.'
      });
      
      onRetrySuccess?.();
    } catch (error) {
      toast({
        title: 'Sync failed',
        description: 'Could not sync to calendar.',
        variant: 'destructive'
      });
    } finally {
      setIsSyncing(false);
    }
  };

  const canSync = appointmentId && companyId;

  const SyncButton = () => canSync ? (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6 text-muted-foreground hover:text-foreground"
            onClick={handleSync}
            disabled={isSyncing}
          >
            <RefreshCw className={cn("w-3 h-3", isSyncing && "animate-spin")} />
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          <p>{googleEventId ? 'Sync now' : 'Sync to Google Calendar'}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  ) : null;

  // Not synced to Google Calendar
  if (!googleEventId) {
    return (
      <div className="flex items-center gap-1">
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
        <SyncButton />
      </div>
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
      <div className="flex items-center gap-1">
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
        <SyncButton />
      </div>
    );
  }

  // Synced successfully (includes 'synced' status and default)
  return (
    <div className="flex items-center gap-1">
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
      <SyncButton />
    </div>
  );
}
