import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Download, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { useAuth } from '@/contexts/AuthContext';

type Dataset = {
  key: string;
  label: string;
  description: string;
  fetch: (companyId: string) => Promise<any[]>;
};

function toCsv(rows: any[]): string {
  if (!rows.length) return '';
  const cols = Object.keys(rows[0]).filter((k) => k !== 'company_id');
  const escape = (v: any) => {
    if (v === null || v === undefined) return '';
    const s = typeof v === 'object' ? JSON.stringify(v) : String(v);
    return `"${s.replace(/"/g, '""')}"`;
  };
  return [cols.join(','), ...rows.map((r) => cols.map((c) => escape(r[c])).join(','))].join('\r\n');
}

function download(name: string, csv: string) {
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = name;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

const DATASETS: Dataset[] = [
  {
    key: 'customers',
    label: 'Customers & leads',
    description: 'All customer profiles and leads attached to your company.',
    fetch: async (companyId) => {
      const [{ data: customers = [] }, { data: leads = [] }] = await Promise.all([
        supabase.from('customers').select('*').eq('company_id', companyId),
        supabase.from('leads').select('*').eq('company_id', companyId),
      ]);
      return [
        ...(customers || []).map((r: any) => ({ _record_type: 'customer', ...r })),
        ...(leads || []).map((r: any) => ({ _record_type: 'lead', ...r })),
      ];
    },
  },
  {
    key: 'appointments',
    label: 'Appointments',
    description: 'Every booking and appointment logged to your company.',
    fetch: async (companyId) => {
      const { data } = await supabase.from('appointments').select('*').eq('company_id', companyId).order('datetime', { ascending: false });
      return data || [];
    },
  },
  {
    key: 'invoices',
    label: 'Invoices',
    description: 'All invoices and their totals.',
    fetch: async (companyId) => {
      const { data } = await supabase.from('invoices').select('*').eq('company_id', companyId).order('created_at', { ascending: false });
      return data || [];
    },
  },
  {
    key: 'logs',
    label: 'Call & chat logs',
    description: 'Voice call transcripts and AI chat interactions.',
    fetch: async (companyId) => {
      const [{ data: calls = [] }, { data: chats = [] }] = await Promise.all([
        supabase.from('call_logs').select('*').eq('company_id', companyId).order('created_at', { ascending: false }),
        supabase.from('ai_agent_logs').select('*').eq('company_id', companyId).order('created_at', { ascending: false }),
      ]);
      return [
        ...(calls || []).map((r: any) => ({ _record_type: 'call', ...r })),
        ...(chats || []).map((r: any) => ({ _record_type: 'chat', ...r })),
      ];
    },
  },
];

export function DataExportPanel() {
  const { profile } = useAuth() as any;
  const companyId: string | undefined = profile?.company_id;
  const [busy, setBusy] = useState<string | null>(null);

  const handleExport = async (ds: Dataset) => {
    if (!companyId) return toast.error('No company on your profile.');
    setBusy(ds.key);
    try {
      const rows = await ds.fetch(companyId);
      if (!rows.length) {
        toast.info(`No ${ds.label.toLowerCase()} to export.`);
        return;
      }
      download(`aura-${ds.key}-${format(new Date(), 'yyyy-MM-dd')}.csv`, toCsv(rows));
      toast.success(`Exported ${rows.length} ${ds.label.toLowerCase()} rows.`);
    } catch (e: any) {
      toast.error(e?.message || 'Export failed');
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="space-y-3">
      <p className="text-sm text-muted-foreground">
        Download a full CSV of your own company data any time — no waiting, no requests. Files include every row your account can read today.
      </p>
      <div className="grid gap-2 sm:grid-cols-2">
        {DATASETS.map((ds) => (
          <div id={ds.key === 'customers' ? 'export' : undefined} key={ds.key} className="flex items-center justify-between gap-3 border border-border rounded-lg p-3 bg-card">
            <div className="min-w-0">
              <div className="text-sm font-medium text-foreground">{ds.label}</div>
              <div className="text-xs text-muted-foreground">{ds.description}</div>
            </div>
            <Button size="sm" variant="outline" onClick={() => handleExport(ds)} disabled={busy !== null}>
              {busy === ds.key ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
              <span className="ml-1.5">CSV</span>
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
}