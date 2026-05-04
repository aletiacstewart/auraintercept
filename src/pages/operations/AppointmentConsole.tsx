import { useEffect, useState } from 'react';
import { PageHeader } from '@/components/ui/page-header';
import { Card } from '@/components/ui/card';
import { CalendarDays, Users, Repeat, AlertCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import type { ResolvedWorkspace } from '@/lib/workspace/types';
import { useIndustryPack } from '@/hooks/useIndustryPack';
import { getIndustryServiceConsoleConfig } from '@/lib/industryAgentMap';

interface Props {
  workspace: ResolvedWorkspace;
  companyId: string;
}

export function AppointmentConsole({ workspace, companyId }: Props) {
  const [today, setToday] = useState<number | null>(null);
  const [week, setWeek] = useState<number | null>(null);
  const [noShows, setNoShows] = useState<number | null>(null);
  const { pack } = useIndustryPack();
  const cfg = pack ? getIndustryServiceConsoleConfig(pack) : null;

  useEffect(() => {
    const start = new Date(); start.setHours(0, 0, 0, 0);
    const end = new Date(start); end.setDate(end.getDate() + 1);
    const wkAgo = new Date(start); wkAgo.setDate(wkAgo.getDate() - 7);
    (async () => {
      const [tRes, wRes, nRes] = await Promise.all([
        supabase.from('appointments').select('id', { count: 'exact', head: true })
          .eq('company_id', companyId)
          .gte('datetime', start.toISOString())
          .lt('datetime', end.toISOString()),
        supabase.from('appointments').select('id', { count: 'exact', head: true })
          .eq('company_id', companyId)
          .gte('datetime', wkAgo.toISOString()),
        supabase.from('appointments').select('id', { count: 'exact', head: true })
          .eq('company_id', companyId)
          .eq('status', 'no_show')
          .gte('datetime', wkAgo.toISOString()),
      ]);
      setToday(tRes.count ?? 0);
      setWeek(wRes.count ?? 0);
      setNoShows(nRes.count ?? 0);
    })();
  }, [companyId]);

  const fmt = (v: number | null) => (v === null ? '…' : String(v));
  const resourceLabel = cfg?.providerNoun ??
    (workspace.promptOverrides as { terminology?: { resource?: string } })?.terminology
      ?.resource ?? 'Resource';
  const jobNounPlural = cfg?.jobNounPlural ?? 'Appointments';
  const consoleTitle = cfg?.consoleTitle ?? `${workspace.industryName} — Appointments`;
  const consoleDesc = cfg?.consoleDescription ?? `Calendar-first console for ${workspace.industryName.toLowerCase()} bookings`;
  const boardDesc = cfg?.appointmentBoardDescription ?? `${jobNounPlural} schedule, recurring bookings, deposit collection, and follow-up.`;
  return (
    <div className="space-y-6">
      <PageHeader
        icon={CalendarDays}
        title={consoleTitle}
        description={consoleDesc}
        featureColor="appointments"
      />
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="p-4 surface-elevated-dark">
          <div className="flex items-center gap-2 text-muted-foreground">
            <CalendarDays className="h-4 w-4" /> {jobNounPlural} today
          </div>
          <div className="mt-2 text-3xl font-semibold">{fmt(today)}</div>
        </Card>
        <Card className="p-4 surface-elevated-dark">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Users className="h-4 w-4" /> {resourceLabel}s in use
          </div>
          <div className="mt-2 text-3xl font-semibold">—</div>
        </Card>
        <Card className="p-4 surface-elevated-dark">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Repeat className="h-4 w-4" /> {jobNounPlural} (last 7d)
          </div>
          <div className="mt-2 text-3xl font-semibold">{fmt(week)}</div>
        </Card>
        <Card className="p-4 surface-elevated-dark">
          <div className="flex items-center gap-2 text-muted-foreground">
            <AlertCircle className="h-4 w-4" /> No-shows (7d)
          </div>
          <div className="mt-2 text-3xl font-semibold">{fmt(noShows)}</div>
        </Card>
      </div>
      <Card className="p-6 surface-elevated-dark">
        <p className="text-card-foreground/80">{boardDesc}</p>
      </Card>
    </div>
  );
}