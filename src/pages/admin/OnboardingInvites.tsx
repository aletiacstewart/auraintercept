import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Copy, Loader2, Send, ExternalLink, FlaskConical } from 'lucide-react';

type Invite = {
  id: string;
  token: string;
  company_name: string;
  recipient_email: string;
  status: string;
  expires_at: string;
  submitted_at: string | null;
  created_at: string;
};

export default function OnboardingInvites() {
  const { toast } = useToast();
  const [rows, setRows] = useState<Invite[]>([]);
  const [loading, setLoading] = useState(true);
  const [company, setCompany] = useState('');
  const [email, setEmail] = useState('');
  const [sending, setSending] = useState(false);

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
    const token = (data as any)?.token;
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

  function openLink(token: string) {
    window.open(`/intake/${token}`, '_blank');
  }

  return (
    <div className="max-w-5xl mx-auto p-6 space-y-6">
      <header>
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold text-foreground">Onboarding Invites</h1>
            <p className="text-sm text-muted-foreground">Send the fillable workbook to a company. They get a private link; completed submissions are emailed to ai@auraintercept.ai.</p>
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
                    <TableCell><Badge variant={r.status === 'submitted' ? 'default' : 'secondary'}>{r.status}</Badge></TableCell>
                    <TableCell className="text-xs text-muted-foreground">{new Date(r.created_at).toLocaleDateString()}</TableCell>
                    <TableCell className="text-xs text-muted-foreground">{r.submitted_at ? new Date(r.submitted_at).toLocaleString() : '—'}</TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button variant="ghost" size="sm" onClick={() => copyLink(r.token)}><Copy className="h-3.5 w-3.5 mr-1" />Copy</Button>
                        <Button variant="ghost" size="sm" onClick={() => openLink(r.token)}><ExternalLink className="h-3.5 w-3.5 mr-1" />Open</Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
                {rows.length === 0 && (
                  <TableRow><TableCell colSpan={6} className="text-center text-sm text-muted-foreground py-8">
                    No invites yet. Fill in a company + email above and click <span className="font-medium">Send invite</span>, or use <span className="font-medium">Generate test link</span> to preview the form.
                  </TableCell></TableRow>
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}