import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import type { Database } from '@/integrations/supabase/types';

type StaffNotificationPreferencesRow = Database['public']['Tables']['staff_notification_preferences']['Row'];

export interface NotificationPreferences extends Omit<StaffNotificationPreferencesRow, 'company_id' | 'created_at' | 'updated_at' | 'in_app_enabled'> {
  company_id?: string;
}

export function useNotificationPreferences() {
  const { user, companyId } = useAuth();
  const [preferences, setPreferences] = useState<NotificationPreferences | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (!user?.id) {
      setIsLoading(false);
      return;
    }

    fetchPreferences();
  }, [user?.id, companyId]);

  const fetchPreferences = async () => {
    if (!user?.id || !companyId) return;

    try {
      const { data, error } = await supabase
        .from('staff_notification_preferences')
        .select('*')
        .eq('user_id', user.id)
        .eq('company_id', companyId)
        .maybeSingle();

      if (error) throw error;

      if (data) {
        setPreferences(data);
      } else {
        // Create default preferences
        const { data: newPrefs, error: createError } = await supabase
          .from('staff_notification_preferences')
          .insert({
            user_id: user.id,
            company_id: companyId,
            browser_push_enabled: true,
            email_alerts_enabled: true,
            sms_alerts_enabled: false,
            in_app_enabled: true,
            notify_new_bookings: true,
            notify_missed_calls: true,
            notify_new_sms: true,
            notify_new_email: true,
            notify_job_updates: true,
          })
          .select()
          .single();

        if (createError) throw createError;
        setPreferences(newPrefs);
      }
    } catch (error) {
      console.error('Error fetching notification preferences:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const updatePreferences = async (updates: Partial<NotificationPreferences>) => {
    if (!user?.id || !preferences?.id) return;

    setIsSaving(true);
    try {
      const { error } = await supabase
        .from('staff_notification_preferences')
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
        })
        .eq('id', preferences.id);

      if (error) throw error;

      setPreferences(prev => prev ? { ...prev, ...updates } : null);
      toast.success('Notification preferences updated');
    } catch (error) {
      console.error('Error updating preferences:', error);
      toast.error('Failed to update preferences');
    } finally {
      setIsSaving(false);
    }
  };

  return {
    preferences,
    isLoading,
    isSaving,
    updatePreferences,
    refetch: fetchPreferences,
  };
}
