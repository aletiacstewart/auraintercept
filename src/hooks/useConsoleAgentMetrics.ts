import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { startOfMonth } from 'date-fns';
import { INDUSTRY_SPECIALIST_OPERATIVES } from '@/lib/subscriptionAgentConfig';

interface BusinessOpsMetrics {
  quotesTotal: number;
  quotesConverted: number;
  invoicesTotal: number;
  invoicesPaid: number;
  leadsTotal: number;
  leadsConverted: number;
  apptsTotal: number;
  apptsConfirmed: number;
  inventoryTotal: number;
  inventoryLowStock: number;
  companiesTotal: number;
  companiesActive: number;
  employeesTotal: number;
  employeesActive: number;
  customersTotal: number;
  customersNew: number;
}

interface FieldOpsMetrics {
  jobsTotal: number;
  jobsEnRoute: number;
  jobsCompletedToday: number;
  jobsPending: number;
  checkInsToday: number;
  // Reconciled slices — all derived from the same job_assignments query
  // Dispatch/GPS Console uses `jobsActive` as its "Active" badge, so
  // jobsActive === jobsAssigned + jobsUnassigned and
  // jobsActive >= jobsPending + jobsInProgress at all times.
  jobsActive: number;
  jobsAssigned: number;
  jobsUnassigned: number;
  jobsInProgress: number;
  feedbackCount: number;
  avgRating: number;
}

interface MarketingMetrics {
  campaignsTotal: number;
  campaignsActive: number;
  leadsTotal: number;
  leadsConverted: number;
  customersTotal: number;
}

interface AnalyticsMetrics {
  requestsThisMonth: number;
  successRate: number;
  revenueTotal: number;
  revenueLastMonth: number;
  appointmentsTotal: number;
  feedbackTotal: number;
}

interface SocialMetrics {
  campaignsTotal: number;
  campaignsActive: number;
  postsScheduled: number;
  postsPublished: number;
  customersReached: number;
}

export function useBusinessOpsMetrics(companyId: string | null | undefined) {
  return useQuery<BusinessOpsMetrics>({
    queryKey: ['bops-metrics', companyId],
    queryFn: async () => {
      if (!companyId) return getDefaultBopsMetrics();

      const monthStart = startOfMonth(new Date()).toISOString();

      const [
        quotesRes,
        quotesConvRes,
        invoicesRes,
        invoicesPaidRes,
        leadsRes,
        leadsConvRes,
        apptsRes,
        apptsConfRes,
        inventoryRes,
        inventoryLowRes,
        companiesRes,
        employeesRes,
        customersRes,
        customersNewRes,
      ] = await Promise.all([
        supabase.from('quotes').select('id', { count: 'exact', head: true }).eq('company_id', companyId),
        supabase.from('quotes').select('id', { count: 'exact', head: true }).eq('company_id', companyId).eq('status', 'accepted'),
        supabase.from('invoices').select('id', { count: 'exact', head: true }).eq('company_id', companyId),
        supabase.from('invoices').select('id', { count: 'exact', head: true }).eq('company_id', companyId).eq('status', 'paid'),
        supabase.from('leads').select('id', { count: 'exact', head: true }).eq('company_id', companyId),
        supabase.from('leads').select('id', { count: 'exact', head: true }).eq('company_id', companyId).eq('status', 'converted'),
        supabase.from('appointments').select('id', { count: 'exact', head: true }).eq('company_id', companyId),
        supabase.from('appointments').select('id', { count: 'exact', head: true }).eq('company_id', companyId).in('status', ['confirmed', 'completed']),
        supabase.from('inventory_items').select('id', { count: 'exact', head: true }).eq('company_id', companyId),
        supabase.from('inventory_items').select('id', { count: 'exact', head: true }).eq('company_id', companyId).lt('quantity', 5),
        supabase.from('companies').select('id', { count: 'exact', head: true }),
        supabase.from('profiles').select('id', { count: 'exact', head: true }).eq('company_id', companyId),
        supabase.from('customer_profiles').select('id', { count: 'exact', head: true }).eq('company_id', companyId),
        supabase.from('customer_profiles').select('id', { count: 'exact', head: true }).eq('company_id', companyId).gte('created_at', monthStart),
      ]);

      return {
        quotesTotal: quotesRes.count ?? 0,
        quotesConverted: quotesConvRes.count ?? 0,
        invoicesTotal: invoicesRes.count ?? 0,
        invoicesPaid: invoicesPaidRes.count ?? 0,
        leadsTotal: leadsRes.count ?? 0,
        leadsConverted: leadsConvRes.count ?? 0,
        apptsTotal: apptsRes.count ?? 0,
        apptsConfirmed: apptsConfRes.count ?? 0,
        inventoryTotal: inventoryRes.count ?? 0,
        inventoryLowStock: inventoryLowRes.count ?? 0,
        companiesTotal: companiesRes.count ?? 0,
        companiesActive: companiesRes.count ?? 0,
        employeesTotal: employeesRes.count ?? 0,
        employeesActive: employeesRes.count ?? 0,
        customersTotal: customersRes.count ?? 0,
        customersNew: customersNewRes.count ?? 0,
      };
    },
    enabled: !!companyId,
    staleTime: 60_000,
  });
}

function getDefaultBopsMetrics(): BusinessOpsMetrics {
  return {
    quotesTotal: 0, quotesConverted: 0,
    invoicesTotal: 0, invoicesPaid: 0,
    leadsTotal: 0, leadsConverted: 0,
    apptsTotal: 0, apptsConfirmed: 0,
    inventoryTotal: 0, inventoryLowStock: 0,
    companiesTotal: 0, companiesActive: 0,
    employeesTotal: 0, employeesActive: 0,
    customersTotal: 0, customersNew: 0,
  };
}

export function useFieldOpsMetrics(companyId: string | null | undefined) {
  return useQuery<FieldOpsMetrics>({
    queryKey: ['fieldops-metrics', companyId],
    queryFn: async () => {
      if (!companyId) return {
        jobsTotal: 0, jobsEnRoute: 0, jobsCompletedToday: 0, jobsPending: 0, checkInsToday: 0,
        jobsActive: 0, jobsAssigned: 0, jobsUnassigned: 0, jobsInProgress: 0,
        feedbackCount: 0, avgRating: 0,
      };

      const todayStart = new Date();
      todayStart.setHours(0, 0, 0, 0);

      // Mirrors Dispatch/GPS Console definitions (see FieldOpsManager: activeJobs =
      // status NOT IN ('completed','cancelled')). Single source of truth is
      // job_assignments filtered by company_id — same for both consoles.
      const [
        activeRes,
        assignedRes,
        unassignedRes,
        pendingRes,
        inProgressRes,
        completedTodayRes,
        feedbackRes,
      ] = await Promise.all([
        supabase.from('job_assignments').select('id', { count: 'exact', head: true }).eq('company_id', companyId).not('status', 'in', '("completed","cancelled")'),
        supabase.from('job_assignments').select('id', { count: 'exact', head: true }).eq('company_id', companyId).not('status', 'in', '("completed","cancelled")').not('employee_id', 'is', null),
        supabase.from('job_assignments').select('id', { count: 'exact', head: true }).eq('company_id', companyId).not('status', 'in', '("completed","cancelled")').is('employee_id', null),
        supabase.from('job_assignments').select('id', { count: 'exact', head: true }).eq('company_id', companyId).in('status', ['pending_acceptance', 'accepted']),
        supabase.from('job_assignments').select('id', { count: 'exact', head: true }).eq('company_id', companyId).in('status', ['en_route', 'arrived', 'in_progress']),
        supabase.from('job_assignments').select('id', { count: 'exact', head: true }).eq('company_id', companyId).eq('status', 'completed').gte('completed_at', todayStart.toISOString()),
        supabase.from('customer_feedback').select('rating').eq('company_id', companyId).not('rating', 'is', null),
      ]);

      const jobsActive = activeRes.count ?? 0;
      const jobsAssigned = assignedRes.count ?? 0;
      const jobsUnassigned = unassignedRes.count ?? 0;
      const jobsPending = pendingRes.count ?? 0;
      const jobsInProgress = inProgressRes.count ?? 0;
      const jobsCompletedToday = completedTodayRes.count ?? 0;

      const ratings = (feedbackRes.data ?? []).map((r: any) => Number(r.rating)).filter((n) => Number.isFinite(n));
      const feedbackCount = ratings.length;
      const avgRating = feedbackCount > 0 ? ratings.reduce((s, r) => s + r, 0) / feedbackCount : 0;

      if (import.meta.env.DEV) {
        // Guardrail — if this ever trips, the two consoles will disagree again.
        console.assert(
          jobsAssigned + jobsUnassigned === jobsActive,
          '[useFieldOpsMetrics] assigned + unassigned !== active',
          { jobsAssigned, jobsUnassigned, jobsActive },
        );
        console.assert(
          jobsPending + jobsInProgress <= jobsActive,
          '[useFieldOpsMetrics] pending + inProgress > active',
          { jobsPending, jobsInProgress, jobsActive },
        );
      }

      return {
        // Aliases kept for backward compatibility with any external callers.
        jobsTotal: jobsActive,
        jobsEnRoute: jobsInProgress,
        jobsCompletedToday,
        jobsPending,
        checkInsToday: jobsCompletedToday,
        // Canonical fields — prefer these going forward.
        jobsActive,
        jobsAssigned,
        jobsUnassigned,
        jobsInProgress,
        feedbackCount,
        avgRating,
      };
    },
    enabled: !!companyId,
    staleTime: 30_000,
  });
}

export function useMarketingMetrics(companyId: string | null | undefined) {
  return useQuery<MarketingMetrics>({
    queryKey: ['marketing-metrics', companyId],
    queryFn: async () => {
      if (!companyId) return { campaignsTotal: 0, campaignsActive: 0, leadsTotal: 0, leadsConverted: 0, customersTotal: 0 };

      const [campaignsRes, campaignsActiveRes, leadsRes, leadsConvRes, customersRes] = await Promise.all([
        supabase.from('marketing_campaigns').select('id', { count: 'exact', head: true }).eq('company_id', companyId),
        supabase.from('marketing_campaigns').select('id', { count: 'exact', head: true }).eq('company_id', companyId).eq('status', 'active'),
        supabase.from('leads').select('id', { count: 'exact', head: true }).eq('company_id', companyId),
        supabase.from('leads').select('id', { count: 'exact', head: true }).eq('company_id', companyId).eq('status', 'converted'),
        supabase.from('customer_profiles').select('id', { count: 'exact', head: true }).eq('company_id', companyId),
      ]);

      return {
        campaignsTotal: campaignsRes.count ?? 0,
        campaignsActive: campaignsActiveRes.count ?? 0,
        leadsTotal: leadsRes.count ?? 0,
        leadsConverted: leadsConvRes.count ?? 0,
        customersTotal: customersRes.count ?? 0,
      };
    },
    enabled: !!companyId,
    staleTime: 60_000,
  });
}

export function useAnalyticsMetrics(companyId: string | null | undefined) {
  return useQuery<AnalyticsMetrics>({
    queryKey: ['analytics-metrics', companyId],
    queryFn: async () => {
      if (!companyId) return { requestsThisMonth: 0, successRate: 0, revenueTotal: 0, revenueLastMonth: 0, appointmentsTotal: 0, feedbackTotal: 0 };

      const monthStart = startOfMonth(new Date()).toISOString();

      const [perfRes, invoicesPaidRes, apptsRes, feedbackRes] = await Promise.all([
        supabase.from('agent_performance_metrics').select('requests_handled, success_rate').eq('company_id', companyId).gte('date', monthStart.slice(0, 10)),
        supabase.from('invoices').select('total').eq('company_id', companyId).eq('status', 'paid'),
        supabase.from('appointments').select('id', { count: 'exact', head: true }).eq('company_id', companyId),
        supabase.from('customer_feedback').select('id', { count: 'exact', head: true }).eq('company_id', companyId),
      ]);

      const requestsThisMonth = (perfRes.data ?? []).reduce((s, r) => s + (r.requests_handled ?? 0), 0);
      const rates = (perfRes.data ?? []).filter(r => r.success_rate != null).map(r => r.success_rate!);
      const successRate = rates.length > 0 ? Math.round(rates.reduce((s, r) => s + r, 0) / rates.length) : 0;
      const revenueTotal = (invoicesPaidRes.data ?? []).reduce((s, r) => s + (r.total ?? 0), 0);

      return {
        requestsThisMonth,
        successRate,
        revenueTotal: Math.round(revenueTotal),
        revenueLastMonth: 0,
        appointmentsTotal: apptsRes.count ?? 0,
        feedbackTotal: feedbackRes.count ?? 0,
      };
    },
    enabled: !!companyId,
    staleTime: 60_000,
  });
}

export function useSocialMetrics(companyId: string | null | undefined) {
  return useQuery<SocialMetrics>({
    queryKey: ['social-metrics', companyId],
    queryFn: async () => {
      if (!companyId) return { campaignsTotal: 0, campaignsActive: 0, postsScheduled: 0, postsPublished: 0, customersReached: 0 };

      const [campaignsRes, campaignsActiveRes, contentRes, contentPublishedRes, customersRes] = await Promise.all([
        supabase.from('marketing_campaigns').select('id', { count: 'exact', head: true }).eq('company_id', companyId),
        supabase.from('marketing_campaigns').select('id', { count: 'exact', head: true }).eq('company_id', companyId).eq('status', 'active'),
        supabase.from('content_engine_history').select('id', { count: 'exact', head: true }).eq('company_id', companyId),
        supabase.from('content_engine_history').select('id', { count: 'exact', head: true }).eq('company_id', companyId).not('saved_to', 'is', null),
        supabase.from('campaign_recipients').select('id', { count: 'exact', head: true }).eq('company_id', companyId),
      ]);

      return {
        campaignsTotal: campaignsRes.count ?? 0,
        campaignsActive: campaignsActiveRes.count ?? 0,
        postsScheduled: contentRes.count ?? 0,
        postsPublished: contentPublishedRes.count ?? 0,
        customersReached: customersRes.count ?? 0,
      };
    },
    enabled: !!companyId,
    staleTime: 60_000,
  });
}

interface SpecialistMetrics {
  totalInvocations: number;
  successCount: number;
  errorCount: number;
  activeSpecialists: number;
  perSpecialist: Record<string, number>;
}

/**
 * Metrics for the 14 industry specialist operatives.
 * Derived from ai_agent_logs filtered to specialist agent_types.
 * Used by SpecialistOperativesConsole to surface per-specialist activity.
 */
export function useSpecialistMetrics(companyId: string | null | undefined) {
  return useQuery<SpecialistMetrics>({
    queryKey: ['specialist-metrics', companyId],
    queryFn: async () => {
      const empty: SpecialistMetrics = {
        totalInvocations: 0,
        successCount: 0,
        errorCount: 0,
        activeSpecialists: 0,
        perSpecialist: {},
      };
      if (!companyId) return empty;

      const specialists = INDUSTRY_SPECIALIST_OPERATIVES as unknown as string[];
      const monthStart = startOfMonth(new Date()).toISOString();

      const { data, error } = await supabase
        .from('ai_agent_logs')
        .select('agent_type, status')
        .eq('company_id', companyId)
        .in('agent_type', specialists)
        .gte('created_at', monthStart)
        .limit(5000);

      if (error || !data) return empty;

      const perSpecialist: Record<string, number> = {};
      let success = 0;
      let errors = 0;
      for (const row of data as Array<{ agent_type: string; status: string | null }>) {
        perSpecialist[row.agent_type] = (perSpecialist[row.agent_type] ?? 0) + 1;
        if (row.status === 'error' || row.status === 'failed') errors += 1;
        else success += 1;
      }

      return {
        totalInvocations: data.length,
        successCount: success,
        errorCount: errors,
        activeSpecialists: Object.keys(perSpecialist).length,
        perSpecialist,
      };
    },
    enabled: !!companyId,
    staleTime: 60_000,
  });
}
