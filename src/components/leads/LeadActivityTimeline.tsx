import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';
import { 
  Phone, 
  Mail, 
  MessageSquare, 
  FileText, 
  RefreshCw, 
  TrendingUp,
  User,
  Clock
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { ScrollArea } from '@/components/ui/scroll-area';

interface LeadActivity {
  id: string;
  lead_id: string;
  activity_type: string;
  description: string | null;
  metadata: Record<string, any>;
  performed_by: string | null;
  created_at: string;
}

interface LeadActivityTimelineProps {
  leadId: string;
  maxHeight?: string;
}

const ACTIVITY_CONFIG: Record<string, { icon: any; color: string; label: string }> = {
  call: { icon: Phone, color: 'text-channel-voice', label: 'Call' },
  email: { icon: Mail, color: 'text-channel-email', label: 'Email' },
  sms: { icon: MessageSquare, color: 'text-channel-sms', label: 'SMS' },
  note: { icon: FileText, color: 'text-yellow-400', label: 'Note' },
  status_change: { icon: RefreshCw, color: 'text-orange-400', label: 'Status Change' },
  score_update: { icon: TrendingUp, color: 'text-secondary', label: 'Score Update' },
  follow_up_scheduled: { icon: Clock, color: 'text-accent', label: 'Follow-up Scheduled' },
  follow_up_sent: { icon: MessageSquare, color: 'text-channel-sms', label: 'Follow-up Sent' },
};

export function LeadActivityTimeline({ leadId, maxHeight = '300px' }: LeadActivityTimelineProps) {
  const { data: activities = [], isLoading } = useQuery({
    queryKey: ['lead-activities', leadId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('lead_activities')
        .select('*')
        .eq('lead_id', leadId)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as LeadActivity[];
    },
    enabled: !!leadId,
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-4">
        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-primary" />
      </div>
    );
  }

  if (activities.length === 0) {
    return (
      <div className="text-center py-4 text-muted-foreground text-sm">
        No activity recorded yet
      </div>
    );
  }

  return (
    <ScrollArea style={{ maxHeight }}>
      <div className="relative pl-6 space-y-4">
        {/* Timeline line */}
        <div className="absolute left-2 top-2 bottom-2 w-0.5 bg-border" />
        
        {activities.map((activity) => {
          const config = ACTIVITY_CONFIG[activity.activity_type] || {
            icon: FileText,
            color: 'text-muted-foreground',
            label: activity.activity_type,
          };
          const Icon = config.icon;

          return (
            <div key={activity.id} className="relative">
              {/* Timeline dot */}
              <div className={cn(
                'absolute -left-4 w-4 h-4 rounded-full bg-background border-2 flex items-center justify-center',
                config.color.replace('text-', 'border-')
              )}>
                <Icon className={cn('h-2 w-2', config.color)} />
              </div>

              <div className="bg-white/5 rounded-lg p-3 border border-white/10">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className={cn('text-sm font-medium', config.color)}>
                      {config.label}
                    </span>
                  </div>
                  <span className="text-xs text-muted-foreground whitespace-nowrap">
                    {format(new Date(activity.created_at), 'MMM d, h:mm a')}
                  </span>
                </div>
                {activity.description && (
                  <p className="text-sm text-muted-foreground mt-1">
                    {activity.description}
                  </p>
                )}
                {activity.metadata && Object.keys(activity.metadata).length > 0 && (
                  <div className="mt-2 text-xs text-muted-foreground">
                    {activity.metadata.from_status && activity.metadata.to_status && (
                      <span>
                        {activity.metadata.from_status} → {activity.metadata.to_status}
                      </span>
                    )}
                    {activity.metadata.old_score !== undefined && activity.metadata.new_score !== undefined && (
                      <span>
                        Score: {activity.metadata.old_score} → {activity.metadata.new_score}
                      </span>
                    )}
                  </div>
                )}
                {activity.performed_by && (
                  <div className="mt-2 flex items-center gap-1 text-xs text-muted-foreground">
                    <User className="h-3 w-3" />
                    <span>by team member</span>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </ScrollArea>
  );
}
