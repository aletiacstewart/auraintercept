import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Copy, Loader2, Send, ExternalLink, FlaskConical, FileDown, Eye, Download } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import jsPDF from 'jspdf';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';

type Invite = {
  id: string;
  token: string;
  company_name: string;
  recipient_email: string;
  status: string;
  expires_at: string;
  submitted_at: string | null;
  created_at: string;
  source?: string | null;
};

type SubmissionPayload = {
  invite: { company_name: string; recipient_email: string; status: string; submitted_at: string | null };
  form_data: Record<string, any>;
  uploads: Array<{ id: string; section: string; file_name: string; mime_type: string | null; size_bytes: number | null; signed_url: string | null }>;
  signature: { signer_name?: string; signer_title?: string; signed_at?: string; ip?: string } | null;
};

export default function OnboardingInvites({ embedded }: { embedded?: boolean } = {}) {
  const { toast } = useToast();
  const [rows, setRows] = useState<Invite[]>([]);
  const [loading, setLoading] = useState(true);
  const [company, setCompany] = useState('');
  const [email, setEmail] = useState('');
  const [sending, setSending] = useState(false);
  const [viewing, setViewing] = useState<{ row: Invite; data: SubmissionPayload } | null>(null);
  const [loadingView, setLoadingView] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    const { data } = await supabase.from('onboarding_invites').select('*').order('created_at', { ascending: false });
    setRows((data as Invite[]) || []);
    setLoading(false);
  }
  useEffect(() => { load(); }, []);

  async function createInvite() {
    if (!company || !email) return;
    setSending(true);
    const { data, error } = await supabase.functions.invoke('create-onboarding-invite', {
      body: { company_name: company, recipient_email: email },
    });
    setSending(false);
    if (error || (data as any)?.error) {
      toast({ title: 'Failed to send', description: (data as any)?.error || error?.message, variant: 'destructive' });
      return;
    }
    toast({ title: 'Invite sent', description: `Email delivered to ${email}` });
    setCompany(''); setEmail('');
    load();
  }

  async function createTestInvite() {
    setSending(true);
    const { data, error } = await supabase.functions.invoke('create-onboarding-invite', {
      body: { company_name: 'Test Company (preview)', recipient_email: 'ai@auraintercept.ai' },
    });
    setSending(false);
    if (error || (data as any)?.error) {
      toast({ title: 'Test invite failed', description: (data as any)?.error || error?.message, variant: 'destructive' });
      return;
    }
    const token = (data as any)?.invite?.token;
    await load();
    if (token) {
      window.open(`/intake/${token}`, '_blank');
      toast({ title: 'Test invite created', description: 'Opening intake form in a new tab.' });
    } else {
      toast({ title: 'Test invite created', description: 'Use the Copy button to grab the link.' });
    }
  }

  function copyLink(token: string) {
    const url = `${window.location.origin}/intake/${token}`;
    navigator.clipboard.writeText(url);
    toast({ title: 'Link copied' });
  }

  function pathFor(row: Invite) {
    return row.source === 'signup' ? `/onboarding?token=${row.token}` : `/intake/${row.token}`;
  }
  function openLink(row: Invite) {
    window.open(pathFor(row), '_blank');
  }
  function copyRowLink(row: Invite) {
    navigator.clipboard.writeText(`${window.location.origin}${pathFor(row)}`);
    toast({ title: 'Link copied' });
  }

  async function fetchSubmission(token: string): Promise<SubmissionPayload | null> {
    const { data, error } = await supabase.functions.invoke('get-onboarding-invite', { body: { token } });
    if (error || (data as any)?.error) {
      toast({ title: 'Failed to load submission', description: (data as any)?.error || error?.message, variant: 'destructive' });
      return null;
    }
    return data as SubmissionPayload;
  }

  async function viewSubmission(row: Invite) {
    setLoadingView(row.id);
    const data = await fetchSubmission(row.token);
    setLoadingView(null);
    if (data) setViewing({ row, data });
  }

  async function downloadPdf(row: Invite) {
    setLoadingView(row.id);
    const data = await fetchSubmission(row.token);
    setLoadingView(null);
    if (!data) return;
    buildPdf(row, data).save(`${slug(row.company_name)}-onboarding.pdf`);
  }

  function slug(s: string) { return s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'submission'; }

  function buildPdf(row: Invite, payload: SubmissionPayload): jsPDF {
    const doc = new jsPDF({ unit: 'pt', format: 'letter' });
    const margin = 48;
    const pageW = doc.internal.pageSize.getWidth();
    const pageH = doc.internal.pageSize.getHeight();
    let y = margin;
    const line = (txt: string, opts: { size?: number; bold?: boolean; color?: [number, number, number] } = {}) => {
      const size = opts.size ?? 10;
      doc.setFont('helvetica', opts.bold ? 'bold' : 'normal');
      doc.setFontSize(size);
      if (opts.color) doc.setTextColor(...opts.color); else doc.setTextColor(20, 20, 20);
      const wrapped = doc.splitTextToSize(txt, pageW - margin * 2);
      for (const w of wrapped) {
        if (y > pageH - margin) { doc.addPage(); y = margin; }
        doc.text(w, margin, y);
        y += size + 4;
      }
    };
    const hr = () => { if (y > pageH - margin) { doc.addPage(); y = margin; } doc.setDrawColor(200); doc.line(margin, y, pageW - margin, y); y += 10; };

    line('Aura Intercept — Onboarding Submission', { size: 18, bold: true });
    y += 4;
    line(row.company_name, { size: 13, bold: true });
    line(row.recipient_email, { size: 10, color: [90, 90, 90] });
    if (payload.invite.submitted_at) line(`Submitted: ${new Date(payload.invite.submitted_at).toLocaleString()}`, { size: 9, color: [100, 100, 100] });
    if (payload.signature) {
      line(`Signed by: ${payload.signature.signer_name ?? '—'} (${payload.signature.signer_title ?? '—'})`, { size: 9, color: [100, 100, 100] });
      if (payload.signature.signed_at) line(`Signed at: ${new Date(payload.signature.signed_at).toLocaleString()}  ·  IP: ${payload.signature.ip ?? '—'}`, { size: 9, color: [100, 100, 100] });
    }
    y += 6; hr();

    const renderValue = (v: any, indent = 0): void => {
      if (v === null || v === undefined || v === '') { line('—', { size: 10, color: [120, 120, 120] }); return; }
      if (Array.isArray(v)) { line(v.map((x) => (typeof x === 'object' ? JSON.stringify(x) : String(x))).join(', '), { size: 10 }); return; }
      if (typeof v === 'object') {
        for (const [k, vv] of Object.entries(v)) {
          line(`${'  '.repeat(indent)}${k.replace(/_/g, ' ')}:`, { size: 10, bold: true });
          renderValue(vv, indent + 1);
        }
        return;
      }
      line(String(v), { size: 10 });
    };

    for (const [sectionKey, sectionVal] of Object.entries(payload.form_data ?? {})) {
      line(sectionKey.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()), { size: 13, bold: true, color: [14, 165, 164] });
      y += 2;
      if (sectionVal && typeof sectionVal === 'object' && !Array.isArray(sectionVal)) {
        for (const [k, v] of Object.entries(sectionVal as Record<string, unknown>)) {
          line(k.replace(/_/g, ' '), { size: 10, bold: true });
          renderValue(v, 1);
          y += 2;
        }
      } else {
        renderValue(sectionVal);
      }
      y += 6; hr();
    }

    if (payload.uploads.length) {
      line(`Uploaded Files (${payload.uploads.length})`, { size: 13, bold: true, color: [14, 165, 164] });
      for (const u of payload.uploads) {
        line(`• [${u.section}] ${u.file_name}  (${Math.round((u.size_bytes || 0) / 1024)} KB)`, { size: 10 });
      }
      line('Files must be downloaded from the admin Onboarding Invites page (signed links expire after 1 hour).', { size: 8, color: [120, 120, 120] });
    }

    return doc;
  }

  return (
    <DashboardLayout>
      <div className="max-w-5xl mx-auto p-6 space-y-6">
      <header>
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold text-foreground">Onboarding Invites</h1>
            <p className="text-sm text-muted-foreground">All onboarding codes — both admin-sent and auto-sent at company signup — and their completed submissions. Submissions are emailed to ai@auraintercept.ai and viewable here.</p>
          </div>
          <Button variant="outline" size="sm" onClick={createTestInvite} disabled={sending}>
            <FlaskConical className="h-4 w-4 mr-2" />Generate test link
          </Button>
        </div>
      </header>

      <Card>
        <CardHeader><CardTitle className="text-base">New invite</CardTitle></CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-3 items-end">
          <div className="space-y-1.5">
            <Label>Company name</Label>
            <Input value={company} onChange={(e) => setCompany(e.target.value)} placeholder="Acme HVAC" />
          </div>
          <div className="space-y-1.5">
            <Label>Recipient email</Label>
            <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="owner@acme.com" />
          </div>
          <Button onClick={createInvite} disabled={!company || !email || sending}>
            {sending ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Sending…</> : <><Send className="h-4 w-4 mr-2" />Send invite</>}
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-base">All invites</CardTitle></CardHeader>
        <CardContent>
          {loading ? <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /> : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Company</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Source</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Sent</TableHead>
                  <TableHead>Submitted</TableHead>
                  <TableHead>Link</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((r) => (
                  <TableRow key={r.id}>
                    <TableCell className="font-medium">{r.company_name}</TableCell>
                    <TableCell className="text-muted-foreground text-sm">{r.recipient_email}</TableCell>
                    <TableCell><Badge variant="outline" className="text-xs">{r.source === 'signup' ? 'signup' : 'admin'}</Badge></TableCell>
                    <TableCell><Badge variant={r.status === 'submitted' ? 'default' : 'secondary'}>{r.status}</Badge></TableCell>
                    <TableCell className="text-xs text-muted-foreground">{new Date(r.created_at).toLocaleDateString()}</TableCell>
                    <TableCell className="text-xs text-muted-foreground">{r.submitted_at ? new Date(r.submitted_at).toLocaleString() : '—'}</TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button variant="ghost" size="sm" onClick={() => copyRowLink(r)}><Copy className="h-3.5 w-3.5 mr-1" />Copy</Button>
                        <Button variant="ghost" size="sm" onClick={() => openLink(r)}><ExternalLink className="h-3.5 w-3.5 mr-1" />Open</Button>
                        {r.status === 'submitted' && (
                          <>
                            <Button variant="ghost" size="sm" disabled={loadingView === r.id} onClick={() => viewSubmission(r)}>
                              {loadingView === r.id ? <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" /> : <Eye className="h-3.5 w-3.5 mr-1" />}View
                            </Button>
                            <Button variant="ghost" size="sm" disabled={loadingView === r.id} onClick={() => downloadPdf(r)}>
                              <FileDown className="h-3.5 w-3.5 mr-1" />PDF
                            </Button>
                          </>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
                {rows.length === 0 && (
                  <TableRow><TableCell colSpan={7} className="text-center text-sm text-muted-foreground py-8">
                    No invites yet. Fill in a company + email above and click <span className="font-medium">Send invite</span>, or use <span className="font-medium">Generate test link</span> to preview the form.
                  </TableCell></TableRow>
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog open={!!viewing} onOpenChange={(o) => { if (!o) setViewing(null); }}>
        <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{viewing?.row.company_name} — Submission</DialogTitle>
          </DialogHeader>
          {viewing && (
            <div className="space-y-4 text-sm">
              <div className="flex flex-wrap gap-2">
                <Button size="sm" onClick={() => buildPdf(viewing.row, viewing.data).save(`${slug(viewing.row.company_name)}-onboarding.pdf`)}>
                  <FileDown className="h-4 w-4 mr-1" />Download PDF
                </Button>
              </div>

              <div className="rounded-md border border-border p-3 bg-muted/30">
                <div className="text-xs text-muted-foreground">Signed by</div>
                <div className="font-medium">
                  {viewing.data.signature?.signer_name ?? '—'} <span className="text-muted-foreground">({viewing.data.signature?.signer_title ?? '—'})</span>
                </div>
                {viewing.data.signature?.signed_at && (
                  <div className="text-xs text-muted-foreground mt-1">{new Date(viewing.data.signature.signed_at).toLocaleString()} · IP {viewing.data.signature.ip ?? '—'}</div>
                )}
              </div>

              <div>
                <h3 className="font-semibold mb-2">Uploaded files ({viewing.data.uploads.length})</h3>
                {viewing.data.uploads.length === 0 ? (
                  <p className="text-muted-foreground text-xs">No files uploaded.</p>
                ) : (
                  <ul className="space-y-1.5">
                    {viewing.data.uploads.map((u) => (
                      <li key={u.id} className="flex items-center justify-between gap-2 rounded border border-border px-3 py-2">
                        <div className="min-w-0">
                          <div className="text-xs uppercase tracking-wide text-muted-foreground">{u.section}</div>
                          <div className="font-medium truncate">{u.file_name}</div>
                          <div className="text-xs text-muted-foreground">{Math.round((u.size_bytes || 0) / 1024)} KB</div>
                        </div>
                        {u.signed_url ? (
                          <a href={u.signed_url} target="_blank" rel="noopener noreferrer" download={u.file_name}>
                            <Button size="sm" variant="outline"><Download className="h-3.5 w-3.5 mr-1" />Download</Button>
                          </a>
                        ) : (
                          <span className="text-xs text-muted-foreground">unavailable</span>
                        )}
                      </li>
                    ))}
                  </ul>
                )}
                {viewing.data.uploads.length > 0 && (
                  <p className="text-[11px] text-muted-foreground mt-2">Download links expire after 1 hour. Reopen this dialog to regenerate.</p>
                )}
              </div>

              <details className="rounded-md border border-border p-3">
                <summary className="cursor-pointer font-semibold">Raw form data</summary>
                <pre className="text-xs mt-2 overflow-x-auto whitespace-pre-wrap">{JSON.stringify(viewing.data.form_data, null, 2)}</pre>
              </details>
            </div>
          )}
        </DialogContent>
      </Dialog>
      </div>
    </DashboardLayout>
  );
}