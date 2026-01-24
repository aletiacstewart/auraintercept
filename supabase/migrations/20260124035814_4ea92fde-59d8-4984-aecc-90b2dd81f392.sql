-- Create staff notifications table for in-app notification bell
CREATE TABLE public.staff_notifications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  recipient_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  recipient_role TEXT, -- 'owner', 'dispatcher', 'technician', 'all'
  notification_type TEXT NOT NULL, -- 'new_booking', 'missed_call', 'new_sms', 'new_email', 'job_update'
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  metadata JSONB DEFAULT '{}',
  is_read BOOLEAN DEFAULT false,
  read_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create staff notification preferences table
CREATE TABLE public.staff_notification_preferences (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  -- Channel preferences
  browser_push_enabled BOOLEAN DEFAULT true,
  email_alerts_enabled BOOLEAN DEFAULT true,
  sms_alerts_enabled BOOLEAN DEFAULT false,
  in_app_enabled BOOLEAN DEFAULT true,
  -- Event preferences
  notify_new_bookings BOOLEAN DEFAULT true,
  notify_missed_calls BOOLEAN DEFAULT true,
  notify_new_sms BOOLEAN DEFAULT true,
  notify_new_email BOOLEAN DEFAULT true,
  notify_job_updates BOOLEAN DEFAULT true,
  -- Contact info for SMS
  sms_phone_number TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, company_id)
);

-- Create push subscription table for browser notifications
CREATE TABLE public.push_subscriptions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  endpoint TEXT NOT NULL,
  p256dh_key TEXT NOT NULL,
  auth_key TEXT NOT NULL,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, endpoint)
);

-- Enable RLS
ALTER TABLE public.staff_notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.staff_notification_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.push_subscriptions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for staff_notifications
CREATE POLICY "Users can view their own notifications"
  ON public.staff_notifications FOR SELECT
  USING (
    recipient_id = auth.uid() OR 
    (recipient_role = 'all' AND company_id IN (
      SELECT company_id FROM public.profiles WHERE id = auth.uid()
    ))
  );

CREATE POLICY "Users can update their own notifications"
  ON public.staff_notifications FOR UPDATE
  USING (recipient_id = auth.uid() OR recipient_role = 'all');

CREATE POLICY "Service role can insert notifications"
  ON public.staff_notifications FOR INSERT
  WITH CHECK (true);

-- RLS Policies for staff_notification_preferences
CREATE POLICY "Users can view their own preferences"
  ON public.staff_notification_preferences FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert their own preferences"
  ON public.staff_notification_preferences FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own preferences"
  ON public.staff_notification_preferences FOR UPDATE
  USING (user_id = auth.uid());

-- RLS Policies for push_subscriptions
CREATE POLICY "Users can manage their own subscriptions"
  ON public.push_subscriptions FOR ALL
  USING (user_id = auth.uid());

-- Enable realtime for notifications
ALTER PUBLICATION supabase_realtime ADD TABLE public.staff_notifications;

-- Create indexes for performance
CREATE INDEX idx_staff_notifications_recipient ON public.staff_notifications(recipient_id, is_read);
CREATE INDEX idx_staff_notifications_company ON public.staff_notifications(company_id, created_at DESC);
CREATE INDEX idx_push_subscriptions_user ON public.push_subscriptions(user_id);

-- Trigger to update updated_at
CREATE TRIGGER update_staff_notification_preferences_updated_at
  BEFORE UPDATE ON public.staff_notification_preferences
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();