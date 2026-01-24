import { Bell, CheckCheck, Calendar, Phone, MessageSquare, Mail, Briefcase, Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { useStaffNotifications, StaffNotification } from '@/hooks/useStaffNotifications';
import { formatDistanceToNow } from 'date-fns';
import { cn } from '@/lib/utils';
import { useNavigate } from 'react-router-dom';

const notificationIcons: Record<string, React.ElementType> = {
  new_booking: Calendar,
  missed_call: Phone,
  new_sms: MessageSquare,
  new_email: Mail,
  job_update: Briefcase,
};

const notificationColors: Record<string, string> = {
  new_booking: 'text-feature-appointments',
  missed_call: 'text-destructive',
  new_sms: 'text-feature-integrations',
  new_email: 'text-feature-marketing',
  job_update: 'text-feature-fieldops',
};

function NotificationItem({ 
  notification, 
  onMarkAsRead 
}: { 
  notification: StaffNotification; 
  onMarkAsRead: (id: string) => void;
}) {
  const Icon = notificationIcons[notification.notification_type] || Bell;
  const iconColor = notificationColors[notification.notification_type] || 'text-muted-foreground';

  return (
    <div 
      className={cn(
        "flex items-start gap-3 p-3 border-b border-border/50 hover:bg-muted/50 transition-colors cursor-pointer",
        !notification.is_read && "bg-primary/5"
      )}
      onClick={() => !notification.is_read && onMarkAsRead(notification.id)}
    >
      <div className={cn("mt-0.5", iconColor)}>
        <Icon className="w-4 h-4" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className={cn(
            "text-sm truncate",
            !notification.is_read ? "font-semibold" : "font-normal"
          )}>
            {notification.title}
          </p>
          {!notification.is_read && (
            <span className="w-2 h-2 rounded-full bg-primary flex-shrink-0" />
          )}
        </div>
        <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5">
          {notification.message}
        </p>
        <p className="text-[10px] text-muted-foreground/70 mt-1">
          {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true })}
        </p>
      </div>
    </div>
  );
}

export function NotificationBell() {
  const { notifications, unreadCount, isLoading, markAsRead, markAllAsRead } = useStaffNotifications();
  const navigate = useNavigate();

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <Badge 
              variant="destructive" 
              className="absolute -top-1 -right-1 h-5 min-w-[20px] px-1 text-[10px] flex items-center justify-center"
            >
              {unreadCount > 99 ? '99+' : unreadCount}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="end">
        <div className="flex items-center justify-between p-3 border-b">
          <h4 className="font-semibold text-sm">Notifications</h4>
          <div className="flex items-center gap-1">
            {unreadCount > 0 && (
              <Button 
                variant="ghost" 
                size="sm" 
                className="h-7 text-xs gap-1"
                onClick={markAllAsRead}
              >
                <CheckCheck className="w-3 h-3" />
                Mark all read
              </Button>
            )}
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={() => navigate('/dashboard/notification-settings')}
              title="Notification settings"
            >
              <Settings className="w-3.5 h-3.5" />
            </Button>
          </div>
        </div>
        
        <ScrollArea className="h-[300px]">
          {isLoading ? (
            <div className="p-4 text-center text-sm text-muted-foreground">
              Loading...
            </div>
          ) : notifications.length === 0 ? (
            <div className="p-8 text-center">
              <Bell className="w-8 h-8 mx-auto text-muted-foreground/50 mb-2" />
              <p className="text-sm text-muted-foreground">No notifications yet</p>
            </div>
          ) : (
            notifications.map(notification => (
              <NotificationItem 
                key={notification.id} 
                notification={notification} 
                onMarkAsRead={markAsRead}
              />
            ))
          )}
        </ScrollArea>
        
        {notifications.length > 0 && (
          <div className="p-2 border-t">
            <Button 
              variant="ghost" 
              size="sm" 
              className="w-full text-xs"
              onClick={() => navigate('/dashboard/notification-settings')}
            >
              Manage notification settings
            </Button>
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}
