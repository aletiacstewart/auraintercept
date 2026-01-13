import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { format, addHours, addDays } from 'date-fns';
import { 
  Plus, 
  Clock, 
  Phone, 
  Mail, 
  MessageSquare, 
  CheckCircle, 
  XCircle,
  Calendar,
  Trash2
} from 'lucide-react';

interface FollowUp {
  id: string;
  lead_id: string;
  scheduled_at: string;
  follow_up_type: string;
  message_template: string | null;
  status: string;
  completed_at: string | null;
  created_at: string;
}

interface LeadFollowUpManagerProps {
  leadId: string;
  leadName: string | null;
  leadPhone: string | null;
  leadEmail: string | null;
}

const FOLLOW_UP_TYPES = [
  { value: 'sms', label: 'SMS', icon: MessageSquare },
  { value: 'email', label: 'Email', icon: Mail },
  { value: 'call', label: 'Call Reminder', icon: Phone },
  { value: 'task', label: 'Task', icon: CheckCircle },
];

const QUICK_SCHEDULES = [
  { label: 'In 1 hour', hours: 1 },
  { label: 'In 4 hours', hours: 4 },
  { label: 'Tomorrow', hours: 24 },
  { label: 'In 3 days', hours: 72 },
  { label: 'In 1 week', hours: 168 },
];

export function LeadFollowUpManager({ leadId, leadName, leadPhone, leadEmail }: LeadFollowUpManagerProps) {
  const { companyId } = useAuth();
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [followUpType, setFollowUpType] = useState('sms');
  const [scheduledAt, setScheduledAt] = useState('');
  const [messageTemplate, setMessageTemplate] = useState('');

  const { data: followUps = [], isLoading } = useQuery({
    queryKey: ['lead-follow-ups', leadId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('lead_follow_ups')
        .select('*')
        .eq('lead_id', leadId)
        .order('scheduled_at', { ascending: true });
      
      if (error) throw error;
      return data as FollowUp[];
    },
    enabled: !!leadId,
  });

  const createFollowUp = useMutation({
    mutationFn: async (data: { follow_up_type: string; scheduled_at: string; message_template?: string }) => {
      const { error } = await supabase
        .from('lead_follow_ups')
        .insert({
          lead_id: leadId,
          company_id: companyId,
          follow_up_type: data.follow_up_type,
          scheduled_at: data.scheduled_at,
          message_template: data.message_template || null,
          status: 'pending',
        });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lead-follow-ups', leadId] });
      toast.success('Follow-up scheduled');
      setShowForm(false);
      setMessageTemplate('');
      setScheduledAt('');
    },
    onError: () => toast.error('Failed to schedule follow-up'),
  });

  const cancelFollowUp = useMutation({
    mutationFn: async (followUpId: string) => {
      const { error } = await supabase
        .from('lead_follow_ups')
        .update({ status: 'cancelled' })
        .eq('id', followUpId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lead-follow-ups', leadId] });
      toast.success('Follow-up cancelled');
    },
    onError: () => toast.error('Failed to cancel follow-up'),
  });

  const handleQuickSchedule = (hours: number) => {
    const scheduled = addHours(new Date(), hours);
    createFollowUp.mutate({
      follow_up_type: followUpType,
      scheduled_at: scheduled.toISOString(),
      message_template: messageTemplate || undefined,
    });
  };

  const handleCustomSchedule = () => {
    if (!scheduledAt) {
      toast.error('Please select a date and time');
      return;
    }
    createFollowUp.mutate({
      follow_up_type: followUpType,
      scheduled_at: new Date(scheduledAt).toISOString(),
      message_template: messageTemplate || undefined,
    });
  };

  const pendingFollowUps = followUps.filter(f => f.status === 'pending');
  const completedFollowUps = followUps.filter(f => f.status !== 'pending');

  const getDefaultMessage = () => {
    const name = leadName || 'there';
    switch (followUpType) {
      case 'sms':
        return `Hi ${name}, just following up on your inquiry. Is there anything I can help you with?`;
      case 'email':
        return `Hello ${name},\n\nI wanted to follow up on your recent inquiry. Please let me know if you have any questions or would like to schedule a service.\n\nBest regards`;
      default:
        return '';
    }
  };

  return (
    <div className="space-y-4">
      {/* Pending Follow-ups */}
      {pendingFollowUps.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-sm font-medium text-muted-foreground">Scheduled Follow-ups</h4>
          {pendingFollowUps.map((followUp) => {
            const typeConfig = FOLLOW_UP_TYPES.find(t => t.value === followUp.follow_up_type);
            const Icon = typeConfig?.icon || Clock;
            const isPast = new Date(followUp.scheduled_at) < new Date();

            return (
              <div
                key={followUp.id}
                className="flex items-center justify-between p-3 bg-white/5 rounded-lg border border-white/10"
              >
                <div className="flex items-center gap-3">
                  <Icon className="h-4 w-4 text-primary" />
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium capitalize">{followUp.follow_up_type}</span>
                      {isPast && (
                        <Badge variant="outline" className="text-yellow-400 border-yellow-400/30 text-xs">
                          Overdue
                        </Badge>
                      )}
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {format(new Date(followUp.scheduled_at), 'MMM d, yyyy h:mm a')}
                    </span>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => cancelFollowUp.mutate(followUp.id)}
                  disabled={cancelFollowUp.isPending}
                >
                  <XCircle className="h-4 w-4 text-muted-foreground" />
                </Button>
              </div>
            );
          })}
        </div>
      )}

      {/* Add Follow-up */}
      {!showForm ? (
        <Button
          variant="outline"
          className="w-full"
          onClick={() => setShowForm(true)}
        >
          <Plus className="h-4 w-4 mr-2" />
          Schedule Follow-up
        </Button>
      ) : (
        <div className="space-y-3 p-4 bg-white/5 rounded-lg border border-white/10">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-medium">New Follow-up</h4>
            <Button variant="ghost" size="sm" onClick={() => setShowForm(false)}>
              <XCircle className="h-4 w-4" />
            </Button>
          </div>

          <Select value={followUpType} onValueChange={setFollowUpType}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {FOLLOW_UP_TYPES.map((type) => (
                <SelectItem key={type.value} value={type.value}>
                  <div className="flex items-center gap-2">
                    <type.icon className="h-4 w-4" />
                    {type.label}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {(followUpType === 'sms' || followUpType === 'email') && (
            <Textarea
              placeholder="Message template (optional)"
              value={messageTemplate}
              onChange={(e) => setMessageTemplate(e.target.value)}
              rows={3}
            />
          )}

          <div className="space-y-2">
            <label className="text-xs text-muted-foreground">Quick Schedule</label>
            <div className="flex flex-wrap gap-2">
              {QUICK_SCHEDULES.map((schedule) => (
                <Button
                  key={schedule.hours}
                  variant="outline"
                  size="sm"
                  onClick={() => handleQuickSchedule(schedule.hours)}
                  disabled={createFollowUp.isPending}
                >
                  {schedule.label}
                </Button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs text-muted-foreground">Or pick a specific time</label>
            <div className="flex gap-2">
              <Input
                type="datetime-local"
                value={scheduledAt}
                onChange={(e) => setScheduledAt(e.target.value)}
                className="flex-1"
              />
              <Button
                onClick={handleCustomSchedule}
                disabled={createFollowUp.isPending || !scheduledAt}
              >
                <Calendar className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Completed Follow-ups */}
      {completedFollowUps.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-sm font-medium text-muted-foreground">Past Follow-ups</h4>
          {completedFollowUps.slice(0, 3).map((followUp) => {
            const typeConfig = FOLLOW_UP_TYPES.find(t => t.value === followUp.follow_up_type);
            const Icon = typeConfig?.icon || Clock;

            return (
              <div
                key={followUp.id}
                className="flex items-center gap-3 p-2 text-muted-foreground"
              >
                <Icon className="h-4 w-4" />
                <span className="text-sm capitalize">{followUp.follow_up_type}</span>
                <Badge variant="outline" className="text-xs">
                  {followUp.status}
                </Badge>
                <span className="text-xs ml-auto">
                  {format(new Date(followUp.scheduled_at), 'MMM d')}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
