import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export interface StaffNotification {
  id: string;
  company_id: string;
  recipient_id: string | null;
  recipient_role: string | null;
  notification_type: string;
  title: string;
  message: string;
  metadata: Record<string, unknown>;
  is_read: boolean;
  read_at: string | null;
  created_at: string;
}

export function useStaffNotifications() {
  const { user, companyId } = useAuth();
  const [notifications, setNotifications] = useState<StaffNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  const fetchNotifications = useCallback(async () => {
    if (!user || !companyId) return;

    try {
      const { data, error } = await supabase
        .from('staff_notifications')
        .select('*')
        .or(`recipient_id.eq.${user.id},recipient_role.eq.all`)
        .eq('company_id', companyId)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;

      const typedData = (data || []) as StaffNotification[];
      setNotifications(typedData);
      setUnreadCount(typedData.filter(n => !n.is_read).length);
    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      setIsLoading(false);
    }
  }, [user, companyId]);

  const markAsRead = useCallback(async (notificationId: string) => {
    try {
      const { error } = await supabase
        .from('staff_notifications')
        .update({ is_read: true, read_at: new Date().toISOString() })
        .eq('id', notificationId);

      if (error) throw error;

      setNotifications(prev => 
        prev.map(n => n.id === notificationId ? { ...n, is_read: true, read_at: new Date().toISOString() } : n)
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  }, []);

  const markAllAsRead = useCallback(async () => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('staff_notifications')
        .update({ is_read: true, read_at: new Date().toISOString() })
        .eq('recipient_id', user.id)
        .eq('is_read', false);

      if (error) throw error;

      setNotifications(prev => 
        prev.map(n => ({ ...n, is_read: true, read_at: new Date().toISOString() }))
      );
      setUnreadCount(0);
    } catch (error) {
      console.error('Error marking all as read:', error);
    }
  }, [user]);

  // Set up real-time subscription
  useEffect(() => {
    if (!user || !companyId) return;

    fetchNotifications();

    const channel = supabase
      .channel('staff-notifications')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'staff_notifications',
          filter: `company_id=eq.${companyId}`,
        },
        (payload) => {
          const newNotification = payload.new as StaffNotification;
          
          // Check if this notification is for the current user
          if (newNotification.recipient_id === user.id || newNotification.recipient_role === 'all') {
            setNotifications(prev => [newNotification, ...prev]);
            setUnreadCount(prev => prev + 1);
            
            // Show toast for new notification
            toast(newNotification.title, {
              description: newNotification.message,
              action: {
                label: 'View',
                onClick: () => markAsRead(newNotification.id),
              },
            });

            // Play notification sound
            try {
              const audio = new Audio('/notification-sound.mp3');
              audio.volume = 0.3;
              audio.play().catch(() => {});
            } catch {}
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, companyId, fetchNotifications, markAsRead]);

  return {
    notifications,
    unreadCount,
    isLoading,
    markAsRead,
    markAllAsRead,
    refetch: fetchNotifications,
  };
}
