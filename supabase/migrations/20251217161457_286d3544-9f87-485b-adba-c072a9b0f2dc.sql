-- Ensure every appointment has a corresponding job_assignment and keep appointment.status in sync

-- 1) Create job_assignment automatically when an appointment is created
CREATE OR REPLACE FUNCTION public.ensure_job_assignment_for_appointment()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Create a job assignment if one doesn't already exist for this appointment
  IF NOT EXISTS (
    SELECT 1 FROM public.job_assignments ja WHERE ja.appointment_id = NEW.id
  ) THEN
    INSERT INTO public.job_assignments (
      appointment_id,
      company_id,
      status,
      assigned_at,
      customer_address
    ) VALUES (
      NEW.id,
      NEW.company_id,
      'pending_acceptance',
      now(),
      NEW.customer_address
    );
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_ensure_job_assignment_for_appointment ON public.appointments;
CREATE TRIGGER trg_ensure_job_assignment_for_appointment
AFTER INSERT ON public.appointments
FOR EACH ROW
EXECUTE FUNCTION public.ensure_job_assignment_for_appointment();


-- 2) Keep appointments.status aligned with job_assignments.status (so tracking always reflects reality)
CREATE OR REPLACE FUNCTION public.sync_appointment_status_from_job_assignment()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  new_appt_status text;
BEGIN
  -- Only act when status actually changes
  IF NEW.status IS NOT DISTINCT FROM OLD.status THEN
    RETURN NEW;
  END IF;

  -- Map job status -> appointment status
  IF NEW.status = 'cancelled' THEN
    new_appt_status := 'cancelled';
  ELSIF NEW.status = 'completed' THEN
    new_appt_status := 'completed';
  ELSE
    -- For all other job states, the appointment remains scheduled
    new_appt_status := 'scheduled';
  END IF;

  UPDATE public.appointments a
  SET status = new_appt_status,
      updated_at = now()
  WHERE a.id = NEW.appointment_id
    AND a.status IS DISTINCT FROM new_appt_status;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_sync_appointment_status_from_job_assignment ON public.job_assignments;
CREATE TRIGGER trg_sync_appointment_status_from_job_assignment
AFTER UPDATE OF status ON public.job_assignments
FOR EACH ROW
EXECUTE FUNCTION public.sync_appointment_status_from_job_assignment();
