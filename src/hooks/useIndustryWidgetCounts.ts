import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

/**
 * Returns a partial map of widget id → numeric count for the current company.
 * Only widgets with a known live data source produce a count; others are
 * left undefined and render as label-only tiles.
 *
 * Cheap parallel reads using `head: true, count: 'exact'` — no row data
 * is transferred, only counts. Refreshes every 60s.
 */
export function useIndustryWidgetCounts(widgetIds: string[]) {
  const { companyId } = useAuth();
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!companyId || widgetIds.length === 0) return;
    let cancelled = false;
    const ids = new Set(widgetIds);

    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const weekStart = new Date();
    weekStart.setDate(weekStart.getDate() - 7);

    type Task = [string, () => Promise<number | null>];
    const tasks: Task[] = [];

    const safeCount = async (
      table: string,
      build: (q: any) => any,
    ): Promise<number | null> => {
      try {
        const q = build(
          supabase.from(table as any).select('*', { count: 'exact', head: true }),
        );
        const { count, error } = await q;
        if (error) return null;
        return count ?? 0;
      } catch {
        return null;
      }
    };

    // Field-ops queues
    if (ids.has('emergency_queue') || ids.has('emergency_queue_24_7')) {
      const key = ids.has('emergency_queue_24_7') ? 'emergency_queue_24_7' : 'emergency_queue';
      tasks.push([key, () =>
        safeCount('job_assignments', (q) =>
          q.eq('company_id', companyId)
            .in('priority', ['urgent', 'high', 'p0', 'p1'])
            .in('status', ['pending', 'assigned', 'dispatched', 'in_progress'])),
      ]);
    }
    if (ids.has('dispatch_map')) {
      tasks.push(['dispatch_map', () =>
        safeCount('job_assignments', (q) =>
          q.eq('company_id', companyId).in('status', ['assigned', 'dispatched', 'in_progress'])),
      ]);
    }
    if (ids.has('parts_inventory')) {
      tasks.push(['parts_inventory', () =>
        safeCount('inventory_items', (q) => q.eq('company_id', companyId)),
      ]);
    }
    if (ids.has('permit_tracker')) {
      tasks.push(['permit_tracker', () =>
        safeCount('company_compliance_documents', (q) =>
          q.eq('company_id', companyId).eq('document_type', 'permit')),
      ]);
    }
    if (ids.has('water_damage_alerts') || ids.has('storm_map') || ids.has('infestation_map')) {
      const key = ids.has('water_damage_alerts')
        ? 'water_damage_alerts'
        : ids.has('storm_map') ? 'storm_map' : 'infestation_map';
      tasks.push([key, () =>
        safeCount('leads', (q) =>
          q.eq('company_id', companyId).gte('created_at', weekStart.toISOString())),
      ]);
    }
    if (ids.has('quote_pipeline')) {
      tasks.push(['quote_pipeline', () =>
        safeCount('quotes', (q) =>
          q.eq('company_id', companyId).in('status', ['draft', 'sent', 'viewed'])),
      ]);
    }
    if (ids.has('site_survey_queue')) {
      tasks.push(['site_survey_queue', () =>
        safeCount('appointments', (q) =>
          q.eq('company_id', companyId).gte('start_time', todayStart.toISOString())),
      ]);
    }
    if (ids.has('insurance_claim_tracker')) {
      tasks.push(['insurance_claim_tracker', () =>
        safeCount('insurance_verification_requests', (q) =>
          q.eq('company_id', companyId).in('status', ['pending', 'in_review'])),
      ]);
    }
    if (ids.has('crew_scheduler') || ids.has('bay_scheduler')) {
      const key = ids.has('crew_scheduler') ? 'crew_scheduler' : 'bay_scheduler';
      tasks.push([key, () =>
        safeCount('appointments', (q) =>
          q.eq('company_id', companyId)
            .gte('start_time', todayStart.toISOString())
            .lt('start_time', new Date(todayStart.getTime() + 86400000).toISOString())),
      ]);
    }
    if (ids.has('equipment_tracker')) {
      tasks.push(['equipment_tracker', () =>
        safeCount('inventory_items', (q) =>
          q.eq('company_id', companyId).eq('category', 'equipment')),
      ]);
    }
    if (ids.has('installation_queue')) {
      tasks.push(['installation_queue', () =>
        safeCount('job_assignments', (q) =>
          q.eq('company_id', companyId).in('status', ['pending', 'assigned'])),
      ]);
    }
    if (ids.has('multi_phase_tracker')) {
      tasks.push(['multi_phase_tracker', () =>
        safeCount('job_assignments', (q) =>
          q.eq('company_id', companyId).eq('status', 'in_progress')),
      ]);
    }

    // Booking-first widgets
    if (ids.has('receptionist_queue')) {
      tasks.push(['receptionist_queue', () =>
        safeCount('call_logs', (q) =>
          q.eq('company_id', companyId).gte('created_at', todayStart.toISOString())),
      ]);
    }
    if (ids.has('missed_calls')) {
      tasks.push(['missed_calls', () =>
        safeCount('missed_call_callbacks', (q) =>
          q.eq('company_id', companyId).eq('status', 'pending')),
      ]);
    }
    if (ids.has('smart_link_clicks')) {
      tasks.push(['smart_link_clicks', () =>
        safeCount('smart_links', (q) => q.eq('company_id', companyId)),
      ]);
    }
    if (ids.has('review_pulse')) {
      tasks.push(['review_pulse', () =>
        safeCount('customer_feedback', (q) =>
          q.eq('company_id', companyId).gte('created_at', weekStart.toISOString())),
      ]);
    }
    if (ids.has('appointment_calendar') || ids.has('showings_calendar')) {
      const key = ids.has('appointment_calendar') ? 'appointment_calendar' : 'showings_calendar';
      tasks.push([key, () =>
        safeCount('appointments', (q) =>
          q.eq('company_id', companyId)
            .gte('start_time', todayStart.toISOString())
            .lt('start_time', new Date(todayStart.getTime() + 86400000).toISOString())),
      ]);
    }
    if (ids.has('lead_scoring')) {
      tasks.push(['lead_scoring', () =>
        safeCount('leads', (q) =>
          q.eq('company_id', companyId).in('status', ['new', 'qualified', 'hot'])),
      ]);
    }
    if (ids.has('listing_tracker')) {
      tasks.push(['listing_tracker', () =>
        safeCount('customers', (q) =>
          q.eq('company_id', companyId).eq('customer_type', 'listing')),
      ]);
    }
    if (ids.has('task_queue')) {
      tasks.push(['task_queue', () =>
        safeCount('lead_follow_ups', (q) =>
          q.eq('company_id', companyId).eq('status', 'pending')),
      ]);
    }
    if (ids.has('client_portal') || ids.has('monitoring_status')) {
      const key = ids.has('client_portal') ? 'client_portal' : 'monitoring_status';
      tasks.push([key, () =>
        safeCount('customers', (q) => q.eq('company_id', companyId)),
      ]);
    }
    if (ids.has('calendar_sync')) {
      tasks.push(['calendar_sync', () =>
        safeCount('google_calendar_connections', (q) =>
          q.eq('company_id', companyId).eq('is_active', true)),
      ]);
    }
    if (ids.has('stylist_schedule')) {
      tasks.push(['stylist_schedule', () =>
        safeCount('employee_availability', (q) => q.eq('company_id', companyId)),
      ]);
    }

    setLoading(true);
    Promise.all(tasks.map(async ([k, fn]) => [k, await fn()] as const)).then(
      (rows) => {
        if (cancelled) return;
        const next: Record<string, number> = {};
        for (const [k, v] of rows) if (typeof v === 'number') next[k] = v;
        setCounts(next);
        setLoading(false);
      },
    );

    return () => {
      cancelled = true;
    };
  }, [companyId, widgetIds.join(',')]);

  return { counts, loading };
}