import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  CheckCircle, 
  XCircle, 
  Clock, 
  ArrowUpDown,
  Users,
  Target,
  Briefcase,
  Activity,
} from 'lucide-react';
import { format, formatDistanceToNow } from 'date-fns';
import { cn } from '@/lib/utils';

interface SyncLog {
  id: string;
  company_id: string;
  connection_id: string;
  entity_type: string;
  direction: string;
  status: string;
  records_processed: number | null;
  records_created: number | null;
  records_updated: number | null;
  records_failed: number | null;
  error_message: string | null;
  started_at: string | null;
  completed_at: string | null;
  created_at: string;
}

const entityIcons: Record<string, React.ElementType> = {
  contact: Users,
  lead: Target,
  deal: Briefcase,
  activity: Activity,
};

const entityLabels: Record<string, string> = {
  contact: 'Contacts',
  lead: 'Leads',
  deal: 'Deals',
  activity: 'Activities',
};

export function CRMSyncHistory() {
  const { companyId } = useAuth();

  const { data: syncLogs, isLoading } = useQuery({
    queryKey: ['crm-sync-logs', companyId],
    queryFn: async () => {
      if (!companyId) return [];
      const { data, error } = await supabase
        .from('crm_sync_logs')
        .select('*')
        .eq('company_id', companyId)
        .order('created_at', { ascending: false })
        .limit(50);
      if (error) throw error;
      return data as SyncLog[];
    },
    enabled: !!companyId,
  });

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map(i => (
          <Skeleton key={i} className="h-16 w-full" />
        ))}
      </div>
    );
  }

  if (!syncLogs?.length) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <Clock className="w-8 h-8 mx-auto mb-2 opacity-50" />
        <p>No sync activity yet</p>
        <p className="text-sm">Sync operations will appear here</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {syncLogs.map(log => {
        const EntityIcon = entityIcons[log.entity_type] || Activity;
        const isSuccess = log.status === 'completed';
        const isFailed = log.status === 'failed';
        const isPending = log.status === 'pending' || log.status === 'in_progress';

        return (
          <div
            key={log.id}
            className={cn(
              "flex items-center gap-4 p-3 rounded-lg border",
              isSuccess && "bg-green-500/5 border-green-500/20",
              isFailed && "bg-destructive/5 border-destructive/20",
              isPending && "bg-muted/50 border-border"
            )}
          >
            {/* Status Icon */}
            <div className={cn(
              "w-8 h-8 rounded-full flex items-center justify-center",
              isSuccess && "bg-green-500/10 text-green-600",
              isFailed && "bg-destructive/10 text-destructive",
              isPending && "bg-muted text-muted-foreground"
            )}>
              {isSuccess && <CheckCircle className="w-4 h-4" />}
              {isFailed && <XCircle className="w-4 h-4" />}
              {isPending && <Clock className="w-4 h-4 animate-pulse" />}
            </div>

            {/* Details */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <EntityIcon className="w-4 h-4 text-muted-foreground" />
                <span className="font-medium text-sm">{entityLabels[log.entity_type] || log.entity_type}</span>
                <Badge variant="outline" className="text-xs">
                  <ArrowUpDown className="w-3 h-3 mr-1" />
                  {log.direction}
                </Badge>
              </div>
              
              {isSuccess && (
                <p className="text-xs text-muted-foreground mt-1">
                  {log.records_processed || 0} processed
                  {log.records_created ? `, ${log.records_created} created` : ''}
                  {log.records_updated ? `, ${log.records_updated} updated` : ''}
                </p>
              )}
              
              {isFailed && log.error_message && (
                <p className="text-xs text-destructive mt-1 truncate">
                  {log.error_message}
                </p>
              )}
            </div>

            {/* Timestamp */}
            <div className="text-right text-xs text-muted-foreground">
              <div>{formatDistanceToNow(new Date(log.created_at), { addSuffix: true })}</div>
              <div className="opacity-70">{format(new Date(log.created_at), 'HH:mm')}</div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
