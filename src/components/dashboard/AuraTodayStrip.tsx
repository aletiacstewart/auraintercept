import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { CalendarCheck, Wrench, DollarSign, Activity, Briefcase } from 'lucide-react';
import { startOfDay, endOfDay, startOfWeek, endOfWeek, subDays } from 'date-fns';
import { cn } from '@/lib/utils';
import { useIndustryPack } from '@/hooks/useIndustryPack';
import { getIndustryServiceConsoleConfig } from '@/lib/industryAgentMap';

interface AuraTodayStripProps {
  companyId: string;
}

/**
 * "Today" KPI hero strip — first thing the owner sees.
 * Order matches marketing site: Today's Bookings · Open Jobs · Revenue (Week) · AI Activity.
 * Each tile uses semantic green/yellow/red status colors based on real thresholds.
 */
export function AuraTodayStrip({ companyId }: AuraTodayStripProps) {
  const navigate = useNavigate();
  const { pack } = useIndustryPack();
  const cfg = pack ? getIndustryServiceConsoleConfig(pack) : null;
  const openWorkLabel = cfg?.openWorkLabel ?? 'Open Jobs';
  const openWorkRoute = cfg?.openWorkRoute ?? '/dashboard/dispatch-field-ops';
  const openWorkHint = cfg?.openWorkHint ?? 'In progress + upcoming';
  const todayLabel = cfg?.todayLabel ?? "Today's Bookings";
  const openWorkIcon = cfg?.fieldRouting === false
    ? (pack?.cluster === 'repair' ? Briefcase : CalendarCheck)
    : Wrench;

  const { data, isLoading } = useQuery({
    queryKey: ['aura-today-strip', companyId],
    queryFn: async () => {
      const now = new Date();
      const todayStart = startOfDay(now).toISOString();
      const todayEnd = endOfDay(now).toISOString();
      const weekStart = startOfWeek(now, { weekStartsOn: 1 }).toISOString();
      const weekEnd = endOfWeek(now, { weekStartsOn: 1 }).toISOString();
      const last24h = subDays(now, 1).toISOString();

      const [todaysBookings, openJobs, weekRevenue, aiActivity] = await Promise.all([
        supabase
          .from('appointments')
          .select('id', { count: 'exact', head: true })
          .eq('company_id', companyId)
          .gte('datetime', todayStart)
          .lte('datetime', todayEnd)
          .neq('status', 'cancelled'),
        supabase
          .from('appointments')
          .select('id', { count: 'exact', head: true })
          .eq('company_id', companyId)
          .in('status', ['scheduled', 'confirmed', 'in_progress']),
        supabase
          .from('invoices')
          .select('total')
          .eq('company_id', companyId)
          .eq('status', 'paid')
          .gte('paid_at', weekStart)
          .lte('paid_at', weekEnd),
        supabase
          .from('ai_agent_events')
          .select('id', { count: 'exact', head: true })
          .eq('company_id', companyId)
          .gte('created_at', last24h),
      ]);

      const revenue = (weekRevenue.data ?? []).reduce((sum, i) => sum + (i.total || 0), 0);

      return {
        todaysBookings: todaysBookings.count ?? 0,
        openJobs: openJobs.count ?? 0,
        weekRevenue: revenue,
        aiActivity: aiActivity.count ?? 0,
      };
    },
    enabled: !!companyId,
    refetchInterval: 60_000,
  });

  // Status color helper: emerald (good), amber (watch), rose (attention)
  const statusOf = (kind: 'bookings' | 'jobs' | 'revenue' | 'ai', value: number) => {
    if (kind === 'bookings') return value >= 3 ? 'good' : value >= 1 ? 'watch' : 'attention';
    if (kind === 'jobs') return value === 0 ? 'good' : value <= 10 ? 'watch' : 'attention';
    if (kind === 'revenue') return value >= 5000 ? 'good' : value >= 1000 ? 'watch' : 'attention';
    return value >= 20 ? 'good' : value >= 5 ? 'watch' : 'attention';
  };

  const statusClass = (s: 'good' | 'watch' | 'attention') => ({
    good: 'border-emerald-500/40 bg-emerald-500/5',
    watch: 'border-amber-500/40 bg-amber-500/5',
    attention: 'border-rose-500/40 bg-rose-500/5',
  }[s]);

  const statusDot = (s: 'good' | 'watch' | 'attention') => ({
    good: 'bg-emerald-500',
    watch: 'bg-amber-500',
    attention: 'bg-rose-500',
  }[s]);

  const tiles = [
    {
      label: todayLabel,
      value: data?.todaysBookings ?? 0,
      icon: CalendarCheck,
      href: '/dashboard/appointments',
      kind: 'bookings' as const,
      hint: 'Scheduled today',
    },
    {
      label: openWorkLabel,
      value: data?.openJobs ?? 0,
      icon: openWorkIcon,
      href: openWorkRoute,
      kind: 'jobs' as const,
      hint: openWorkHint,
    },
    {
      label: 'Revenue (Week)',
      value: `$${(data?.weekRevenue ?? 0).toLocaleString()}`,
      icon: DollarSign,
      href: '/dashboard/analytics',
      kind: 'revenue' as const,
      hint: 'Paid invoices this week',
      isString: true,
    },
    {
      label: 'AI Activity (24h)',
      value: data?.aiActivity ?? 0,
      icon: Activity,
      href: '/dashboard/ai-operatives-hub',
      kind: 'ai' as const,
      hint: 'Agent actions taken',
    },
  ];

  return (
    <div className="grid gap-3 grid-cols-2 lg:grid-cols-4">
      {tiles.map((tile) => {
        const numeric = typeof tile.value === 'number' ? tile.value : (data?.weekRevenue ?? 0);
        const status = statusOf(tile.kind, numeric);
        return (
          <Card
            key={tile.label}
            className={cn(
              'cursor-pointer transition-all border',
              statusClass(status),
              'hover:scale-[1.02] hover:shadow-md',
            )}
            onClick={() => navigate(tile.href)}
          >
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <tile.icon className="h-4 w-4 text-foreground/70" />
                <span className={cn('h-2 w-2 rounded-full animate-pulse', statusDot(status))} />
              </div>
              {isLoading ? (
                <Skeleton className="h-7 w-20" />
              ) : (
                <div className="text-2xl font-bold text-foreground">{tile.value}</div>
              )}
              <div className="text-[11px] text-white mt-0.5">{tile.label}</div>
              <div className="text-[10px] text-white/70">{tile.hint}</div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
