
-- 1) Add preference columns
ALTER TABLE public.staff_notification_preferences
  ADD COLUMN IF NOT EXISTS notify_integration_disconnected boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS notify_low_inventory            boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS notify_agent_escalation         boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS notify_a2p_status               boolean NOT NULL DEFAULT true;

-- 2) Low inventory trigger
CREATE OR REPLACE FUNCTION public.tg_notify_low_inventory()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.is_active
     AND NEW.min_quantity IS NOT NULL
     AND NEW.quantity IS NOT NULL
     AND NEW.quantity <= NEW.min_quantity
     AND (TG_OP = 'INSERT' OR OLD.quantity IS NULL OR OLD.quantity > NEW.min_quantity)
  THEN
    INSERT INTO public.staff_notifications (company_id, recipient_role, notification_type, title, message, metadata)
    VALUES (
      NEW.company_id,
      'all',
      'low_inventory',
      'Low inventory: ' || NEW.name,
      NEW.name || ' is at ' || NEW.quantity || ' (reorder at ' || NEW.min_quantity || ').',
      jsonb_build_object('item_id', NEW.id, 'sku', NEW.sku, 'quantity', NEW.quantity, 'min_quantity', NEW.min_quantity)
    );
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_inventory_low_stock ON public.inventory_items;
CREATE TRIGGER trg_inventory_low_stock
AFTER INSERT OR UPDATE OF quantity, min_quantity, is_active ON public.inventory_items
FOR EACH ROW EXECUTE FUNCTION public.tg_notify_low_inventory();

-- 3) Agent escalation trigger (on agent_proposed_actions)
CREATE OR REPLACE FUNCTION public.tg_notify_agent_escalation()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.status = 'pending' AND NEW.risk_tier IN ('high', 'critical') THEN
    INSERT INTO public.staff_notifications (company_id, recipient_role, notification_type, title, message, metadata)
    VALUES (
      NEW.company_id,
      'all',
      'agent_escalation',
      'AI operative needs review',
      COALESCE(NEW.agent_id, 'An operative') || ' escalated a ' || NEW.risk_tier || '-risk ' || NEW.action_type || ' action for approval.',
      jsonb_build_object('action_id', NEW.id, 'agent_id', NEW.agent_id, 'action_type', NEW.action_type, 'risk_tier', NEW.risk_tier)
    );
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_agent_escalation ON public.agent_proposed_actions;
CREATE TRIGGER trg_agent_escalation
AFTER INSERT ON public.agent_proposed_actions
FOR EACH ROW EXECUTE FUNCTION public.tg_notify_agent_escalation();

-- 4) A2P 10DLC + integration-disconnect trigger on tenant_integrations
CREATE OR REPLACE FUNCTION public.tg_notify_tenant_integration_changes()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  bad_a2p_statuses text[] := ARRAY['REJECTED', 'FAILED', 'EXPIRED', 'SUSPENDED'];
BEGIN
  -- A2P 10DLC status change into a problem state
  IF NEW.signalwire_campaign_status IS DISTINCT FROM OLD.signalwire_campaign_status
     AND upper(COALESCE(NEW.signalwire_campaign_status, '')) = ANY(bad_a2p_statuses)
  THEN
    INSERT INTO public.staff_notifications (company_id, recipient_role, notification_type, title, message, metadata)
    VALUES (
      NEW.company_id,
      'all',
      'a2p_status_change',
      'A2P 10DLC status: ' || NEW.signalwire_campaign_status,
      'Your SMS campaign is now ' || NEW.signalwire_campaign_status || '. Outbound SMS may be blocked until this is resolved.',
      jsonb_build_object('status', NEW.signalwire_campaign_status, 'error', NEW.signalwire_campaign_last_error)
    );
  END IF;

  -- Integration disconnect: a credential transitions from present to NULL/empty
  IF (COALESCE(OLD.signalwire_phone_number, '') <> '' AND COALESCE(NEW.signalwire_phone_number, '') = '') THEN
    INSERT INTO public.staff_notifications (company_id, recipient_role, notification_type, title, message)
    VALUES (NEW.company_id, 'all', 'integration_disconnected', 'Voice/SMS integration disconnected', 'Your SignalWire number was removed. Inbound calls and SMS are offline until you reconnect.');
  END IF;
  IF (COALESCE(OLD.resend_api_key, '') <> '' AND COALESCE(NEW.resend_api_key, '') = '') THEN
    INSERT INTO public.staff_notifications (company_id, recipient_role, notification_type, title, message)
    VALUES (NEW.company_id, 'all', 'integration_disconnected', 'Email integration disconnected', 'Your Resend API key was removed. Transactional email is offline until you reconnect.');
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_tenant_integration_changes ON public.tenant_integrations;
CREATE TRIGGER trg_tenant_integration_changes
AFTER UPDATE ON public.tenant_integrations
FOR EACH ROW EXECUTE FUNCTION public.tg_notify_tenant_integration_changes();
