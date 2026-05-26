import { useEffect, useMemo, useRef, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Upload, FileText, CheckCircle2, X, Download } from 'lucide-react';
import { CarrierForwardingGuide } from '@/components/integrations/CarrierForwardingGuide';
import { supabase } from '@/integrations/supabase/client';
import jsPDF from 'jspdf';

type InviteState = {
  status: 'loading' | 'invalid' | 'expired' | 'submitted' | 'ready';
  company_name?: string;
  recipient_email?: string;
};

type UploadRow = {
  id: string;
  section: string;
  file_name: string;
  mime_type?: string | null;
  size_bytes?: number | null;
};

const FN_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1`;
const APIKEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

const SECTIONS = [
  { id: 'company', title: 'Company Profile' },
  { id: 'brand', title: 'Brand & Voice' },
  { id: 'contact_routing', title: 'Contact Routing' },
  { id: 'integrations', title: '3rd-Party Accounts' },
  { id: 'a2p', title: 'A2P 10DLC (SMS Compliance)' },
  { id: 'employees', title: 'Employees / Technicians' },
  { id: 'booking', title: 'Booking Rules' },
  { id: 'industry', title: 'Industry-Specific Intake' },
  { id: 'website', title: 'Smart Website Inputs' },
  { id: 'goals', title: 'Goals & Notes' },
  { id: 'uploads', title: 'Document & Image Uploads' },
  { id: 'terms', title: 'Terms of Service & Signature' },
] as const;

const UPLOAD_SECTIONS = [
  { key: 'logo', label: 'Company logo (PNG/SVG)', example: 'Ex: acme-logo.svg, 512×512, transparent background' },
  { key: 'brand_assets', label: 'Additional brand assets (color guide, fonts, photos)', example: 'Ex: brand-guide.pdf, hero photos, team headshots' },
  { key: 'ein_w9', label: 'EIN letter / W-9', example: 'Ex: IRS CP-575 confirmation letter or signed W-9 PDF' },
  { key: 'customer_csv', label: 'Customer list (CSV)', example: 'Ex: customers.csv — name, email, phone, last service date' },
  { key: 'employee_csv', label: 'Employee / technician list (CSV)', example: 'Ex: techs.csv — name, role, phone, email, service area' },
  { key: 'price_sheet', label: 'Price sheet / service catalog', example: 'Ex: 2025-price-sheet.pdf or services.xlsx with SKU + price' },
  { key: 'misc', label: 'Other documents', example: 'Ex: insurance cert, prior contracts, SOPs, training docs' },
];

const PLAN_OPTIONS = [
  { id: 'core',  name: 'Aura Core',  monthly: 497,  annual: 4970,  onboarding: 497 },
  { id: 'boost', name: 'Aura Boost', monthly: 697,  annual: 6970,  onboarding: 697 },
  { id: 'pro',   name: 'Aura Pro',   monthly: 1197, annual: 11970, onboarding: 1197 },
  { id: 'elite', name: 'Aura Elite', monthly: 2197, annual: 21970, onboarding: 2197 },
] as const;

const INTEGRATION_PROVIDERS = [
  { key: 'signalwire', label: 'SignalWire (voice/SMS)' },
  { key: 'elevenlabs', label: 'ElevenLabs (voice)' },
  { key: 'resend', label: 'Resend (email)' },
  { key: 'tavily', label: 'Tavily (research)' },
  { key: 'stripe', label: 'Stripe (payments)' },
  { key: 'google', label: 'Google Workspace' },
  { key: 'a2p_10dlc', label: 'A2P 10DLC (SMS registration)' },
  { key: 'social', label: 'Social Media (Meta/X/LinkedIn OAuth)' },
];
const STATUS_OPTIONS = ['None', 'In progress', 'Active'] as const;

export default function PublicOnboardingIntake() {
  const { token = '' } = useParams();
  const { toast } = useToast();
  const [state, setState] = useState<InviteState>({ status: 'loading' });
  const [step, setStep] = useState(0);
  const [data, setData] = useState<Record<string, any>>({});
  const [uploads, setUploads] = useState<UploadRow[]>([]);
  const [saving, setSaving] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const saveTimer = useRef<number | null>(null);
  const [industryPacks, setIndustryPacks] = useState<Array<{ industry_id: string; label: string; cluster: string }>>([]);
  const [signedPdfUrl, setSignedPdfUrl] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const { data: packs } = await supabase
        .from('industry_template_packs')
        .select('industry_id, label, cluster')
        .eq('is_active', true)
        .order('label');
      setIndustryPacks((packs as any) || []);
    })();
  }, []);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(`${FN_URL}/get-onboarding-invite?token=${encodeURIComponent(token)}`, { headers: { apikey: APIKEY } });
        if (res.status === 404) return setState({ status: 'invalid' });
        if (res.status === 410) return setState({ status: 'expired' });
        const json = await res.json();
        if (json.invite?.status === 'submitted') {
          return setState({ status: 'submitted', company_name: json.invite.company_name });
        }
        setState({ status: 'ready', company_name: json.invite.company_name, recipient_email: json.invite.recipient_email });
        setData(json.form_data || {});
        setUploads(json.uploads || []);
      } catch {
        setState({ status: 'invalid' });
      }
    })();
  }, [token]);

  // Debounced autosave
  useEffect(() => {
    if (state.status !== 'ready') return;
    if (saveTimer.current) window.clearTimeout(saveTimer.current);
    saveTimer.current = window.setTimeout(async () => {
      setSaving(true);
      await fetch(`${FN_URL}/save-onboarding-progress`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', apikey: APIKEY },
        body: JSON.stringify({ token, form_data: data }),
      }).catch(() => {});
      setSaving(false);
    }, 1200);
    return () => { if (saveTimer.current) window.clearTimeout(saveTimer.current); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data, state.status]);

  const set = (section: string, key: string, val: any) =>
    setData((d) => ({ ...d, [section]: { ...(d[section] || {}), [key]: val } }));
  const get = (section: string, key: string, fallback: any = '') => data?.[section]?.[key] ?? fallback;

  const progress = useMemo(() => ((step + 1) / SECTIONS.length) * 100, [step]);

  async function uploadFile(section: string, file: File) {
    const fd = new FormData();
    fd.append('token', token);
    fd.append('section', section);
    fd.append('file', file);
    const res = await fetch(`${FN_URL}/upload-onboarding-file`, { method: 'POST', body: fd, headers: { apikey: APIKEY } });
    const json = await res.json();
    if (!res.ok) {
      toast({ title: 'Upload failed', description: json.error || 'Try again', variant: 'destructive' });
      return;
    }
    setUploads((u) => [...u, json.upload]);
    toast({ title: 'Uploaded', description: file.name });
  }

  async function submit() {
    const sig = data.terms || {};
    const emailOk = typeof sig.invoice_email === 'string' && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(sig.invoice_email);
    if (!sig.plan || !emailOk || !sig.agree_tos || !sig.agree_privacy || !sig.agree_third_party || !sig.signer_name || !sig.signer_title) {
      toast({ title: 'Missing info', description: 'Please select a plan, enter a valid invoice email, and complete all acknowledgements.', variant: 'destructive' });
      setStep(SECTIONS.length - 1);
      return;
    }
    setSubmitting(true);
    // Generate a simple signed PDF receipt of the workbook and upload it
    // so it's archived alongside customer uploads and emailed back to them.
    try {
      const pdfBlob = buildSubmissionPdfBlob({
        companyName: state.company_name || '',
        recipient: state.recipient_email || '',
        data,
        signature: sig,
      });
      const fd = new FormData();
      fd.append('token', token);
      fd.append('section', 'signed_workbook');
      fd.append('file', new File([pdfBlob], `onboarding-workbook-${Date.now()}.pdf`, { type: 'application/pdf' }));
      await fetch(`${FN_URL}/upload-onboarding-file`, { method: 'POST', body: fd, headers: { apikey: APIKEY } });
    } catch (e) {
      console.warn('[onboarding] pdf upload failed (non-fatal)', e);
    }
    const res = await fetch(`${FN_URL}/submit-onboarding`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', apikey: APIKEY },
      body: JSON.stringify({ token, form_data: data, signature: { signer_name: sig.signer_name, signer_title: sig.signer_title, signer_email: sig.signer_email } }),
    });
    const json = await res.json();
    setSubmitting(false);
    if (!res.ok) {
      toast({ title: 'Submission failed', description: json.error || 'Try again', variant: 'destructive' });
      return;
    }
    if (json.signed_pdf_url) setSignedPdfUrl(json.signed_pdf_url);
    setState((s) => ({ ...s, status: 'submitted' }));
  }

  if (state.status === 'loading') {
    return <div className="min-h-screen flex items-center justify-center bg-background"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>;
  }
  if (state.status === 'invalid') {
    return <CenteredMessage title="Invalid link" body="This onboarding link is not recognized. Please contact your Aura Intercept rep." />;
  }
  if (state.status === 'expired') {
    return <CenteredMessage title="Link expired" body="Please request a fresh onboarding link from Aura Intercept." />;
  }
  if (state.status === 'submitted') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-6">
        <Card className="max-w-lg w-full">
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><CheckCircle2 className="h-5 w-5 text-primary" />Workbook submitted</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-muted-foreground">
            <p>Thanks{state.company_name ? `, ${state.company_name}` : ''}! Your onboarding workbook is on its way to the Aura Intercept team.</p>
            <p>A confirmation email with a copy of your signed workbook is on its way to <span className="font-medium text-foreground">{state.recipient_email}</span>.</p>
            <p>We'll be in touch within 1 business day to schedule your Concierge Onboarding kickoff call.</p>
            {signedPdfUrl && (
              <a
                href={signedPdfUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 text-sm text-primary hover:underline pt-2"
              >
                <Download className="h-4 w-4" /> Download your signed workbook (PDF)
              </a>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  const sec = SECTIONS[step];

  return (
    <div className="min-h-screen bg-background py-8 px-4">
      <div className="max-w-3xl mx-auto">
        <header className="mb-6">
          <p className="text-xs uppercase tracking-wider text-muted-foreground">Aura Intercept · Onboarding Workbook</p>
          <h1 className="text-2xl font-semibold text-foreground mt-1">{state.company_name}</h1>
          <div className="mt-3 flex items-center gap-3">
            <Progress value={progress} className="flex-1" />
            <span className="text-xs text-muted-foreground whitespace-nowrap">Step {step + 1} of {SECTIONS.length}</span>
          </div>
          <p className="text-[11px] text-muted-foreground mt-1">{saving ? 'Saving…' : 'Progress autosaves'}</p>
        </header>

        <Card>
          <CardHeader><CardTitle>{sec.title}</CardTitle></CardHeader>
          <CardContent className="space-y-5">
            {sec.id === 'company' && (
              <>
                <Field label="Legal business name"><Input value={get('company','legal_name')} onChange={(e) => set('company','legal_name', e.target.value)} /></Field>
                <Field label="DBA / brand name"><Input value={get('company','dba')} onChange={(e) => set('company','dba', e.target.value)} /></Field>
                <Field label="EIN"><Input value={get('company','ein')} onChange={(e) => set('company','ein', e.target.value)} /></Field>
                <Field label="Business address"><Textarea value={get('company','address')} onChange={(e) => set('company','address', e.target.value)} /></Field>
                <div className="grid grid-cols-2 gap-3">
                  <Field label="Main phone"><Input value={get('company','phone')} onChange={(e) => set('company','phone', e.target.value)} /></Field>
                  <Field label="Main email"><Input value={get('company','email')} onChange={(e) => set('company','email', e.target.value)} /></Field>
                </div>
                <Field label="Website URL"><Input value={get('company','website')} onChange={(e) => set('company','website', e.target.value)} /></Field>
                <Field label="Service area (cities/ZIPs)"><Textarea value={get('company','service_area')} onChange={(e) => set('company','service_area', e.target.value)} /></Field>
                <Field label="Industry vertical"><Input value={get('company','industry')} onChange={(e) => set('company','industry', e.target.value)} placeholder="e.g. HVAC, Med Spa, Real Estate" /></Field>
              </>
            )}
            {sec.id === 'brand' && (
              <>
                <Field label="Brand tone (3 adjectives)"><Input value={get('brand','tone')} onChange={(e) => set('brand','tone', e.target.value)} placeholder="e.g. Friendly, professional, confident" /></Field>
                <Field label="Words / phrases to NEVER use"><Textarea value={get('brand','never_say')} onChange={(e) => set('brand','never_say', e.target.value)} placeholder="e.g. 'cheap', 'guaranteed', competitor names, slang" /></Field>
                <Field label="Sample greeting (how should Aura answer?)"><Textarea value={get('brand','greeting')} onChange={(e) => set('brand','greeting', e.target.value)} placeholder="e.g. Thanks for calling Acme Plumbing, this is Aura — how can I help today?" /></Field>
                <Field label="Primary brand color (hex)"><Input value={get('brand','primary_color')} onChange={(e) => set('brand','primary_color', e.target.value)} placeholder="#0ea5a4" /></Field>
                <Field label="Secondary color (hex)"><Input value={get('brand','secondary_color')} onChange={(e) => set('brand','secondary_color', e.target.value)} placeholder="#0f172a" /></Field>
              </>
            )}
            {sec.id === 'contact_routing' && (
              <>
                <Field label="Inbound voice number to forward"><Input value={get('contact_routing','voice_number')} onChange={(e) => set('contact_routing','voice_number', e.target.value)} /></Field>
                <Field label="After-hours behavior"><Textarea value={get('contact_routing','after_hours')} onChange={(e) => set('contact_routing','after_hours', e.target.value)} /></Field>
                <Field label="SMS forwarding number"><Input value={get('contact_routing','sms_number')} onChange={(e) => set('contact_routing','sms_number', e.target.value)} /></Field>
                <Field label="Email inbox for new leads"><Input value={get('contact_routing','lead_email')} onChange={(e) => set('contact_routing','lead_email', e.target.value)} /></Field>
                <Field label="Escalation phone (urgent)"><Input value={get('contact_routing','escalation_phone')} onChange={(e) => set('contact_routing','escalation_phone', e.target.value)} /></Field>
                <CarrierForwardingGuide
                  withCard={false}
                  carrier={get('contact_routing','carrier','')}
                  auraNumber={get('contact_routing','aura_number','')}
                  onCarrierChange={(v) => set('contact_routing','carrier', v)}
                  onAuraNumberChange={(v) => set('contact_routing','aura_number', v)}
                />
              </>
            )}
            {sec.id === 'integrations' && (
              <>
                <p className="text-xs text-muted-foreground">All 3rd-party providers require your own account + valid credit card on file. Each invoices you directly and separately from your Aura plan fee. If you don't have an account yet, leave it blank — Concierge Onboarding will create it on your behalf using your login + card.</p>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm border border-border rounded-md">
                    <thead className="bg-muted/40 text-xs text-muted-foreground">
                      <tr>
                        <th className="text-left p-2">Provider</th>
                        <th className="text-left p-2">Account email</th>
                        <th className="text-left p-2">Status</th>
                        <th className="text-left p-2">Card on file</th>
                      </tr>
                    </thead>
                    <tbody>
                      {INTEGRATION_PROVIDERS.map((p) => (
                        <tr key={p.key} className="border-t border-border">
                          <td className="p-2 font-medium">{p.label}</td>
                          <td className="p-2">
                            <Input
                              className="h-8 text-xs"
                              value={get('integrations', `${p.key}_email`)}
                              onChange={(e) => set('integrations', `${p.key}_email`, e.target.value)}
                              placeholder="account@yourcompany.com"
                            />
                          </td>
                          <td className="p-2">
                            <select
                              value={get('integrations', `${p.key}_status`, 'None')}
                              onChange={(e) => set('integrations', `${p.key}_status`, e.target.value)}
                              className="h-8 rounded border border-input bg-background px-2 text-xs"
                            >
                              {STATUS_OPTIONS.map((s) => <option key={s} value={s}>{s}</option>)}
                            </select>
                          </td>
                          <td className="p-2">
                            <Checkbox
                              checked={!!get('integrations', `${p.key}_card`, false)}
                              onCheckedChange={(v) => set('integrations', `${p.key}_card`, !!v)}
                            />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            )}
            {sec.id === 'a2p' && (
              <>
                <Field label="Legal entity type"><Input value={get('a2p','entity_type')} onChange={(e) => set('a2p','entity_type', e.target.value)} placeholder="LLC, Corp, Sole Prop" /></Field>
                <Field label="EIN (for SMS brand registration)"><Input value={get('a2p','ein')} onChange={(e) => set('a2p','ein', e.target.value)} /></Field>
                <Field label="Authorized representative name + email"><Input value={get('a2p','rep')} onChange={(e) => set('a2p','rep', e.target.value)} /></Field>
                <Field label="Sample SMS messages (3-5 examples)"><Textarea rows={5} value={get('a2p','samples')} onChange={(e) => set('a2p','samples', e.target.value)} /></Field>
                <Field label="Opt-in mechanism (how do customers consent?)"><Textarea value={get('a2p','opt_in')} onChange={(e) => set('a2p','opt_in', e.target.value)} /></Field>
              </>
            )}
            {sec.id === 'employees' && (
              <>
                <p className="text-xs text-muted-foreground">List your team (name · role · email · phone). Upload a CSV in the Uploads step if easier.</p>
                <Textarea rows={8} value={get('employees','roster')} onChange={(e) => set('employees','roster', e.target.value)} placeholder="Jane Doe · Lead Tech · jane@... · 555-1234" />
              </>
            )}
            {sec.id === 'booking' && (
              <>
                <Field label="Business hours"><Textarea value={get('booking','hours')} onChange={(e) => set('booking','hours', e.target.value)} placeholder="Mon-Fri 8a-6p, Sat 9a-1p" /></Field>
                <Field label="Default appointment length"><Input value={get('booking','default_length')} onChange={(e) => set('booking','default_length', e.target.value)} placeholder="60 minutes" /></Field>
                <Field label="Buffer between appointments"><Input value={get('booking','buffer')} onChange={(e) => set('booking','buffer', e.target.value)} /></Field>
                <Field label="Services offered (list, with duration + price)"><Textarea rows={6} value={get('booking','services')} onChange={(e) => set('booking','services', e.target.value)} /></Field>
                <Field label="Booking confirmation policy"><Textarea value={get('booking','confirmation')} onChange={(e) => set('booking','confirmation', e.target.value)} /></Field>
              </>
            )}
            {sec.id === 'industry' && (
              <>
                <Field label="Industry vertical (pick the closest match)">
                  <select
                    value={get('industry','vertical')}
                    onChange={(e) => set('industry','vertical', e.target.value)}
                    className="w-full h-9 rounded-md border border-input bg-background px-2 text-sm"
                  >
                    <option value="">— Select industry —</option>
                    {industryPacks.map((p) => (
                      <option key={p.industry_id} value={p.industry_id}>{p.label} · {p.cluster}</option>
                    ))}
                    <option value="__custom__">Other / custom (describe below)</option>
                  </select>
                </Field>
                <p className="text-[11px] text-muted-foreground -mt-3">Picking an industry pre-loads agent prompts, dashboard widgets, and intake forms tuned for that vertical.</p>
                <Field label="Custom intake questions to ask every new lead"><Textarea rows={6} value={get('industry','intake_questions')} onChange={(e) => set('industry','intake_questions', e.target.value)} placeholder={"e.g.\n• What's the address of the property?\n• Is this a repair or new install?\n• When did the issue start?\n• Preferred appointment window?"} /></Field>
                <Field label="Industry-specific terminology / jargon to use"><Textarea value={get('industry','terminology')} onChange={(e) => set('industry','terminology', e.target.value)} placeholder="e.g. 'condenser', 'evaporator coil', 'SEER rating', 'split system'" /></Field>
                <Field label="Compliance / licensing notes"><Textarea value={get('industry','compliance')} onChange={(e) => set('industry','compliance', e.target.value)} placeholder="e.g. EPA 608 certified, state contractor license #12345, HIPAA if medical, insured up to $1M" /></Field>
              </>
            )}
            {sec.id === 'website' && (
              <>
                <Field label="Preferred subdomain or custom domain"><Input value={get('website','domain')} onChange={(e) => set('website','domain', e.target.value)} placeholder="acme.auraintercept.ai or www.acme.com" /></Field>
                <Field label="Hero headline"><Input value={get('website','headline')} onChange={(e) => set('website','headline', e.target.value)} placeholder="e.g. 24/7 HVAC repair across Phoenix — answered in 6 seconds" /></Field>
                <Field label="Hero subheadline"><Textarea value={get('website','subheadline')} onChange={(e) => set('website','subheadline', e.target.value)} placeholder="e.g. Licensed techs, upfront pricing, same-day appointments." /></Field>
                <Field label="Service blurbs (1 short paragraph per service)"><Textarea rows={6} value={get('website','services_copy')} onChange={(e) => set('website','services_copy', e.target.value)} placeholder={"e.g.\nAC Repair — Fast diagnostics, transparent quotes, most jobs done same day.\nFurnace Tune-Up — Seasonal maintenance to prevent breakdowns and lower bills.\nIndoor Air Quality — Filtration and humidity control for healthier homes."} /></Field>
              </>
            )}
            {sec.id === 'goals' && (
              <>
                <Field label="What does success look like in 90 days?"><Textarea rows={4} value={get('goals','success_90')} onChange={(e) => set('goals','success_90', e.target.value)} /></Field>
                <Field label="Top 3 pain points Aura should solve"><Textarea rows={4} value={get('goals','pain_points')} onChange={(e) => set('goals','pain_points', e.target.value)} /></Field>
                <Field label="Anything else we should know"><Textarea rows={4} value={get('goals','notes')} onChange={(e) => set('goals','notes', e.target.value)} /></Field>
              </>
            )}
            {sec.id === 'uploads' && (
              <div className="space-y-4">
                {UPLOAD_SECTIONS.map((u) => (
                  <div key={u.key} className="border border-border rounded-md p-3">
                    <div className="flex items-center justify-between gap-3">
                      <div className="min-w-0">
                        <Label className="text-sm">{u.label}</Label>
                        <p className="text-[11px] text-muted-foreground mt-0.5">{u.example}</p>
                      </div>
                      <label className="inline-flex items-center gap-1.5 text-sm text-primary cursor-pointer hover:underline whitespace-nowrap">
                        <Upload className="h-4 w-4" /> Add file
                        <input type="file" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) uploadFile(u.key, f); e.target.value = ''; }} />
                      </label>
                    </div>
                    <ul className="mt-2 space-y-1">
                      {uploads.filter((x) => x.section === u.key).map((x) => (
                        <li key={x.id} className="flex items-center gap-2 text-xs text-muted-foreground">
                          <FileText className="h-3.5 w-3.5" /> {x.file_name} <span className="text-[10px]">({Math.round((x.size_bytes || 0) / 1024)} KB)</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
                <p className="text-[11px] text-muted-foreground">Max 20 MB per file, 100 MB total. PDF, images, CSV, Excel, Word accepted.</p>
              </div>
            )}
            {sec.id === 'terms' && (
              <div className="space-y-4">
                <div className="space-y-3 border border-border rounded-md p-3 bg-muted/20">
                  <div>
                    <Label className="text-sm font-semibold">Choose your onboarding plan</Label>
                    <p className="text-[11px] text-muted-foreground mt-0.5">One-time onboarding fee is due at the start of the 90-Day Live Trial. Subscription begins after the trial.</p>
                  </div>
                  <div className="grid sm:grid-cols-2 gap-2">
                    {PLAN_OPTIONS.map((p) => {
                      const selected = get('terms','plan') === p.id;
                      return (
                        <button
                          type="button"
                          key={p.id}
                          onClick={() => set('terms','plan', p.id)}
                          className={`text-left rounded-md border p-3 transition ${selected ? 'border-primary bg-primary/10' : 'border-border hover:border-primary/50'}`}
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-semibold text-foreground">{p.name}</span>
                            {selected && <CheckCircle2 className="h-4 w-4 text-primary" />}
                          </div>
                          <div className="text-xs text-muted-foreground mt-1">
                            ${p.monthly.toLocaleString()}/mo · ${p.annual.toLocaleString()}/yr
                          </div>
                          <div className="text-xs text-foreground mt-1">
                            One-time onboarding: <span className="font-semibold">${p.onboarding.toLocaleString()}</span>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                  <div className="flex items-center gap-2 text-xs">
                    <span className="text-muted-foreground">Subscription billing after trial:</span>
                    {(['monthly','annual'] as const).map((c) => {
                      const selected = (get('terms','billing_cycle','monthly')) === c;
                      return (
                        <button
                          type="button"
                          key={c}
                          onClick={() => set('terms','billing_cycle', c)}
                          className={`px-2 py-1 rounded border text-xs ${selected ? 'border-primary bg-primary/10 text-foreground' : 'border-border text-muted-foreground'}`}
                        >
                          {c === 'monthly' ? 'Monthly' : 'Annual (save ~20%)'}
                        </button>
                      );
                    })}
                  </div>
                  {(() => {
                    const planId = get('terms','plan');
                    const plan = PLAN_OPTIONS.find((p) => p.id === planId);
                    const cycle = get('terms','billing_cycle','monthly');
                    if (!plan) return null;
                    const recurring = cycle === 'annual'
                      ? `$${plan.annual.toLocaleString()}/yr`
                      : `$${plan.monthly.toLocaleString()}/mo`;
                    return (
                      <div className="text-xs text-foreground bg-background border border-border rounded p-2">
                        Due at start of trial: <span className="font-semibold">${plan.onboarding.toLocaleString()}</span>. Then <span className="font-semibold">{recurring}</span> after the 90-Day Live Trial.
                      </div>
                    );
                  })()}
                  <Field label="Invoice email for onboarding fee">
                    <Input
                      type="email"
                      value={get('terms','invoice_email')}
                      onChange={(e) => set('terms','invoice_email', e.target.value)}
                      placeholder="billing@yourcompany.com"
                    />
                  </Field>
                  <p className="text-[11px] text-muted-foreground -mt-2">We'll send the one-time onboarding invoice here. Subscription billing starts after the 90-Day Live Trial.</p>
                </div>

                <p className="text-sm text-muted-foreground">Review the full <a className="text-primary underline" href="https://auraintercept.ai/terms-of-service" target="_blank" rel="noreferrer">Terms of Service</a> and <a className="text-primary underline" href="https://auraintercept.ai/privacy-policy" target="_blank" rel="noreferrer">Privacy Policy</a>.</p>
                {[
                  ['agree_tos', 'I agree to the Aura Intercept Terms of Service.'],
                  ['agree_privacy', 'I have read and agree to the Privacy Policy.'],
                  ['agree_third_party', 'I understand each 3rd-party provider (SignalWire, ElevenLabs, Resend, Tavily, Stripe, A2P 10DLC) bills me directly with my own account + credit card on file. Aura Intercept does not resell or mark up usage.'],
                  ['agree_onboarding_fee', 'I understand the one-time onboarding fee is due at the start of the 90-Day Live Trial and is non-refundable once onboarding has been completed.'],
                  ['agree_authority', 'I am authorized to sign this agreement on behalf of the company.'],
                ].map(([key, label]) => (
                  <label key={key} className="flex items-start gap-2 text-sm">
                    <Checkbox checked={!!get('terms', key, false)} onCheckedChange={(v) => set('terms', key, !!v)} className="mt-0.5" />
                    <span>{label}</span>
                  </label>
                ))}
                <div className="grid grid-cols-2 gap-3 pt-2 border-t border-border">
                  <Field label="Authorized signer (full name)"><Input value={get('terms','signer_name')} onChange={(e) => set('terms','signer_name', e.target.value)} /></Field>
                  <Field label="Title"><Input value={get('terms','signer_title')} onChange={(e) => set('terms','signer_title', e.target.value)} /></Field>
                </div>
                <Field label="Signer email"><Input value={get('terms','signer_email')} onChange={(e) => set('terms','signer_email', e.target.value)} /></Field>
                <Field label="Type your full name to sign"><Input value={get('terms','typed_signature')} onChange={(e) => set('terms','typed_signature', e.target.value)} placeholder="Same as authorized signer name" /></Field>
                <p className="text-[11px] text-muted-foreground">Your IP address and timestamp will be recorded with this signature.</p>
              </div>
            )}
          </CardContent>
        </Card>

        <div className="flex items-center justify-between mt-6">
          <Button variant="outline" disabled={step === 0} onClick={() => setStep((s) => Math.max(0, s - 1))}>Back</Button>
          {step < SECTIONS.length - 1 ? (
            <Button onClick={() => setStep((s) => Math.min(SECTIONS.length - 1, s + 1))}>Next</Button>
          ) : (
            <Button onClick={submit} disabled={submitting}>{submitting ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Submitting…</> : 'Submit workbook'}</Button>
          )}
        </div>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-sm">{label}</Label>
      {children}
    </div>
  );
}

function CenteredMessage({ title, body }: { title: string; body: string }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-6">
      <Card className="max-w-md w-full">
        <CardHeader><CardTitle className="flex items-center gap-2"><X className="h-5 w-5 text-destructive" />{title}</CardTitle></CardHeader>
        <CardContent className="text-sm text-muted-foreground">{body}</CardContent>
      </Card>
    </div>
  );
}
