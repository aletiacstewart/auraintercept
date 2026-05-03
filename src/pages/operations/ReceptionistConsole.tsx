import { useEffect, useState } from 'react';
import { PageHeader } from '@/components/ui/page-header';
import { Card } from '@/components/ui/card';
import { Phone, MessageSquare, LinkIcon, BookOpen } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import type { ResolvedWorkspace } from '@/lib/workspace/types';

interface Props {
  workspace: ResolvedWorkspace;
  companyId: string;
}

export function ReceptionistConsole({ workspace, companyId }: Props) {
  const [calls, setCalls] = useState<number | null>(null);
  const [msgs, setMsgs] = useState<number | null>(null);
  const [links, setLinks] = useState<number | null>(null);

  useEffect(() => {
    const todayIso = new Date(new Date().setHours(0, 0, 0, 0)).toISOString();
    (async () => {
      const [callsRes, msgsRes, linksRes] = await Promise.all([
        supabase
          .from('call_logs')
          .select('id', { count: 'exact', head: true })
          .eq('company_id', companyId)
          .gte('started_at', todayIso),
        supabase
          .from('sms_messages' as never)
          .select('id', { count: 'exact', head: true })
          .eq('company_id', companyId)
          .gte('created_at', todayIso),
        supabase
          .from('smart_links')
          .select('id', { count: 'exact', head: true })
          .eq('company_id', companyId)
          .eq('is_active', true),
      ]);
      setCalls(callsRes.count ?? 0);
      setMsgs(msgsRes.error ? 0 : msgsRes.count ?? 0);
      setLinks(linksRes.count ?? 0);
    })();
  }, [companyId]);

  const fmt = (v: number | null) => (v === null ? '…' : String(v));
  return (
    <div className="space-y-6">
      <PageHeader
        icon={Phone}
        title={`${workspace.industryName} — AI Receptionist`}
        description="Receptionist + Smart Links only. Booking is intentionally disabled for this industry."
        featureColor="customers"
      />
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="p-4 surface-elevated-dark">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Phone className="h-4 w-4" /> Calls today
          </div>
          <div className="mt-2 text-3xl font-semibold">{fmt(calls)}</div>
        </Card>
        <Card className="p-4 surface-elevated-dark">
          <div className="flex items-center gap-2 text-muted-foreground">
            <MessageSquare className="h-4 w-4" /> Messages today
          </div>
          <div className="mt-2 text-3xl font-semibold">{fmt(msgs)}</div>
        </Card>
        <Card className="p-4 surface-elevated-dark">
          <div className="flex items-center gap-2 text-muted-foreground">
            <LinkIcon className="h-4 w-4" /> Active Smart Links
          </div>
          <div className="mt-2 text-3xl font-semibold">{fmt(links)}</div>
        </Card>
      </div>
      <Card className="p-6 surface-elevated-dark">
        <div className="flex items-start gap-3">
          <BookOpen className="mt-1 h-5 w-5 text-primary" />
          <div>
            <p className="text-card-foreground/90 font-medium">
              Why no booking screen?
            </p>
            <p className="text-card-foreground/70 mt-1 text-sm">
              Aura Intercept does not connect to in-house reservation systems for restaurants.
              Aura answers calls and texts, then sends customers a Smart Link to your website or
              booking page. Manage your Smart Links and FAQ training from the menus above.
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
}