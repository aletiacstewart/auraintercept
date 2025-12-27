import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useCRMConnection } from '@/hooks/useCRMConnection';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Phone, Mail, Calendar, FileText, CheckSquare, MessageSquare } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface CRMActivityTimelineProps {
  crmContactId?: string;
  maxItems?: number;
  className?: string;
}

interface CRMActivity {
  id: string;
  type: 'call' | 'email' | 'meeting' | 'note' | 'task';
  subject?: string;
  body?: string;
  timestamp?: string;
}

const activityIcons: Record<string, React.ReactNode> = {
  call: <Phone className="h-4 w-4" />,
  email: <Mail className="h-4 w-4" />,
  meeting: <Calendar className="h-4 w-4" />,
  note: <FileText className="h-4 w-4" />,
  task: <CheckSquare className="h-4 w-4" />,
};

const activityColors: Record<string, string> = {
  call: 'bg-blue-500',
  email: 'bg-green-500',
  meeting: 'bg-purple-500',
  note: 'bg-yellow-500',
  task: 'bg-orange-500',
};

export const CRMActivityTimeline: React.FC<CRMActivityTimelineProps> = ({
  crmContactId,
  maxItems = 10,
  className = '',
}) => {
  const { isConnected, provider } = useCRMConnection();

  const { data: activities, isLoading } = useQuery({
    queryKey: ['crm-activities', crmContactId],
    queryFn: async () => {
      if (!crmContactId) return [];

      const { data, error } = await supabase.functions.invoke('crm-adapter', {
        body: {
          action: 'get_activities',
          contactId: crmContactId,
        },
      });

      if (error) throw error;
      return (data?.data as CRMActivity[]) || [];
    },
    enabled: !!isConnected && !!crmContactId,
    staleTime: 60000, // Cache for 1 minute
  });

  if (!isConnected) return null;

  if (isLoading) {
    return (
      <Card className={className}>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <MessageSquare className="h-4 w-4" />
            CRM Activity
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex gap-3">
              <Skeleton className="h-8 w-8 rounded-full" />
              <div className="flex-1 space-y-1">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-3 w-1/2" />
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    );
  }

  if (!activities || activities.length === 0) {
    return (
      <Card className={className}>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <MessageSquare className="h-4 w-4" />
            CRM Activity
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">No activities found</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <MessageSquare className="h-4 w-4" />
          CRM Activity
          <Badge variant="outline" className="ml-auto text-xs">
            {provider}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {activities.slice(0, maxItems).map((activity, index) => (
            <div key={activity.id || index} className="flex gap-3">
              <div
                className={`flex-shrink-0 h-8 w-8 rounded-full flex items-center justify-center text-white ${
                  activityColors[activity.type] || 'bg-gray-500'
                }`}
              >
                {activityIcons[activity.type] || <FileText className="h-4 w-4" />}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">
                  {activity.subject || `${activity.type.charAt(0).toUpperCase() + activity.type.slice(1)}`}
                </p>
                {activity.body && (
                  <p className="text-xs text-muted-foreground line-clamp-2">
                    {activity.body}
                  </p>
                )}
                {activity.timestamp && (
                  <p className="text-xs text-muted-foreground mt-1">
                    {formatDistanceToNow(new Date(activity.timestamp), { addSuffix: true })}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};
