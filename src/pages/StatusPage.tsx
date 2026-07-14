import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { supabase } from '@/integrations/supabase/client';
import { PublicHeader } from '@/components/layout/PublicHeader';
import { PublicFooter } from '@/components/layout/PublicFooter';
import { SEO } from '@/components/seo/SEO';
import { CheckCircle2, AlertTriangle, XCircle, Loader2 } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

type ServiceStatus = {
  id: string;
  component: string;
  display_name: string;
  status: 'operational' | 'degraded' | 'down';
  note: string | null;
  updated_at: string;
};

type StatusIncident = {
  id: string;
  title: string;
  description: string | null;
  severity: 'minor' | 'major' | 'critical';
  component: string | null;
  started_at: string;
  resolved_at: string | null;
};

function statusMeta(status: ServiceStatus['status'], t: (k: string) => string) {
  switch (status) {
    case 'operational':
      return { label: t('marketing:status.operational'), icon: CheckCircle2, cls: 'text-emerald-500 bg-emerald-500/10 border-emerald-500/30' };
    case 'degraded':
      return { label: t('marketing:status.degraded'), icon: AlertTriangle, cls: 'text-amber-500 bg-amber-500/10 border-amber-500/30' };
    case 'down':
      return { label: t('marketing:status.down'), icon: XCircle, cls: 'text-rose-500 bg-rose-500/10 border-rose-500/30' };
  }
}

export default function StatusPage() {
  const { t } = useTranslation(['marketing']);
  const [services, setServices] = useState<ServiceStatus[] | null>(null);
  const [incidents, setIncidents] = useState<StatusIncident[] | null>(null);

  useEffect(() => {
    (async () => {
      const [{ data: svc }, { data: inc }] = await Promise.all([
        supabase.from('service_status').select('*').order('display_name'),
        supabase
          .from('status_incidents')
          .select('*')
          .gte('started_at', new Date(Date.now() - 30 * 86400_000).toISOString())
          .order('started_at', { ascending: false })
          .limit(10),
      ]);
      setServices((svc as ServiceStatus[]) || []);
      setIncidents((inc as StatusIncident[]) || []);
    })();
  }, []);

  const anyDown = services?.some((s) => s.status !== 'operational');

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <SEO
        title={t('marketing:status.pageTitle')}
        description={t('marketing:status.metaDescription')}
        path="/status"
      />
      <PublicHeader />
      <main className="flex-1 container max-w-3xl mx-auto px-4 py-10">
        <header className="mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-2">
            {t('marketing:status.heading')}
          </h1>
          <p className="text-sm text-muted-foreground">{t('marketing:status.subheading')}</p>
          {services && (
            <div
              className={`mt-4 inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-semibold ${
                anyDown
                  ? 'text-amber-500 bg-amber-500/10 border-amber-500/30'
                  : 'text-emerald-500 bg-emerald-500/10 border-emerald-500/30'
              }`}
            >
              {anyDown ? <AlertTriangle className="w-3.5 h-3.5" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
              {anyDown ? t('marketing:status.degraded') : t('marketing:status.operational')}
            </div>
          )}
        </header>

        <section className="mb-10">
          <h2 className="text-lg font-semibold text-foreground mb-3">
            {t('marketing:status.componentsHeading')}
          </h2>
          {!services ? (
            <div className="flex items-center gap-2 text-muted-foreground text-sm">
              <Loader2 className="w-4 h-4 animate-spin" /> …
            </div>
          ) : (
            <ul className="space-y-2">
              {services.map((s) => {
                const meta = statusMeta(s.status, (k) => t(k));
                const Icon = meta.icon;
                return (
                  <li
                    key={s.id}
                    className="flex items-center justify-between gap-3 rounded-lg border border-border bg-card p-3"
                  >
                    <div className="min-w-0">
                      <div className="text-sm font-medium text-foreground">{s.display_name}</div>
                      {s.note && <div className="text-xs text-muted-foreground truncate">{s.note}</div>}
                    </div>
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-xs font-semibold ${meta.cls}`}>
                      <Icon className="w-3.5 h-3.5" />
                      {meta.label}
                    </span>
                  </li>
                );
              })}
            </ul>
          )}
        </section>

        <section>
          <h2 className="text-lg font-semibold text-foreground mb-3">
            {t('marketing:status.incidentsHeading')}
          </h2>
          {!incidents ? (
            <div className="flex items-center gap-2 text-muted-foreground text-sm">
              <Loader2 className="w-4 h-4 animate-spin" /> …
            </div>
          ) : incidents.length === 0 ? (
            <div className="rounded-lg border border-dashed border-border bg-muted/30 p-6 text-center text-sm text-muted-foreground">
              {t('marketing:status.noIncidents')}
            </div>
          ) : (
            <ul className="space-y-3">
              {incidents.map((i) => (
                <li key={i.id} className="rounded-lg border border-border bg-card p-4">
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <h3 className="text-sm font-semibold text-foreground">{i.title}</h3>
                    <span
                      className={`text-[10px] font-semibold uppercase tracking-wide px-2 py-0.5 rounded-full border ${
                        i.resolved_at
                          ? 'text-emerald-500 bg-emerald-500/10 border-emerald-500/30'
                          : 'text-amber-500 bg-amber-500/10 border-amber-500/30'
                      }`}
                    >
                      {i.resolved_at ? t('marketing:status.resolved') : t('marketing:status.ongoing')}
                    </span>
                  </div>
                  {i.description && (
                    <p className="text-xs text-muted-foreground mb-2 whitespace-pre-wrap">{i.description}</p>
                  )}
                  <div className="text-[11px] text-muted-foreground">
                    {formatDistanceToNow(new Date(i.started_at), { addSuffix: true })}
                    {i.resolved_at && ` · ${t('marketing:status.resolved')} ${formatDistanceToNow(new Date(i.resolved_at), { addSuffix: true })}`}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      </main>
      <PublicFooter />
    </div>
  );
}