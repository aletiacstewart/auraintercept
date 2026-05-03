import { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { QRCodeSVG } from 'qrcode.react';
import {
  ChevronLeft,
  ChevronRight,
  Rocket,
  Building2,
  Link2,
  CheckCircle2,
  Sparkles,
  Globe,
  FileText,
  Loader2,
  Bot,
  Smartphone,
  Copy,
  ExternalLink,
} from 'lucide-react';
import { BusinessTypeSelector, BUSINESS_TEMPLATES } from './BusinessTypeSelector';
import { useAuth } from '@/contexts/AuthContext';
import { useSubscription } from '@/hooks/useSubscription';
import { useOnboardingState } from '@/hooks/useOnboardingState';
import { supabase } from '@/integrations/supabase/client';
import {
  getFastStartQuestions,
  formatFastStartAnswers,
} from '@/lib/industryFastStartQuestions';
import { getIndustryVoiceGreeting } from '@/lib/industryVoiceGreetings';

const STEPS = [
  { label: 'Welcome', icon: Building2 },
  { label: 'Auto-Import', icon: Globe },
  { label: 'Connect', icon: Link2 },
  { label: 'Activate', icon: Bot },
  { label: 'Launch', icon: Rocket },
];

const DAY_INDEX: Record<string, number> = {
  sunday: 0, monday: 1, tuesday: 2, wednesday: 3, thursday: 4, friday: 5, saturday: 6,
};

interface ImportedKB {
  services?: Array<{ name: string; description?: string; price?: number | null }>;
  business_hours?: Array<{ day: string; open?: string; close?: string; is_closed: boolean }>;
  faqs?: Array<{ question: string; answer: string }>;
  smart_links?: Array<{ label: string; url: string }>;
  content_profile?: Record<string, any>;
  company_info?: { name?: string; phone?: string; email?: string; address?: string };
}

interface FastStartData {
  businessType: string | null;
  companyName: string;
  phone: string;
  address: string;
  importUrl: string;
  importText: string;
  importedKB: ImportedKB | null;
  stripeConnected: boolean;
  calendarConnected: boolean;
  agentsActivated: boolean;
  agentsActivatedCount: number;
  verticalAnswers: Record<string, string>;
}

export function FastStartWizard() {
  const navigate = useNavigate();
  const { companyId } = useAuth();
  const { subscriptionTier, getAvailableAgents, getTierInfo } = useSubscription();
  const { markOnboardingCompleted } = useOnboardingState();

  const [step, setStep] = useState(0);

  // Phase 8: lightweight onboarding funnel telemetry. Best-effort only.
  const logEvent = (
    stepName: string,
    action: 'view' | 'complete' | 'skip' | 'launch',
    metadata: Record<string, unknown> = {},
  ) => {
    try {
      void supabase.from('onboarding_step_events' as any).insert({
        company_id: companyId ?? null,
        user_id: undefined,
        step: stepName,
        action,
        metadata,
      } as any);
    } catch {
      /* swallow — never block UX on analytics */
    }
  };
  const [isSubmitting, setIsSubmitting] = useState(false);
  // Step view telemetry — fires once per visible step.
  // (declared after logEvent below via effect)
  const [isImporting, setIsImporting] = useState(false);
  const [companySlug, setCompanySlug] = useState<string | null>(null);

  const [data, setData] = useState<FastStartData>({
    businessType: null,
    companyName: '',
    phone: '',
    address: '',
    importUrl: '',
    importText: '',
    importedKB: null,
    stripeConnected: false,
    calendarConnected: false,
    agentsActivated: false,
    agentsActivatedCount: 0,
    verticalAnswers: {},
  });

  // Fire a `view` event whenever the visible step changes.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    logEvent(STEPS[step]?.label?.toLowerCase() ?? `step-${step}`, 'view');
  }, [step]);

  const template = useMemo(
    () => BUSINESS_TEMPLATES.find((t) => t.id === data.businessType),
    [data.businessType]
  );

  const verticalQuestions = useMemo(
    () => getFastStartQuestions(data.businessType),
    [data.businessType],
  );

  const tierInfo = getTierInfo(subscriptionTier);
  const availableAgents = getAvailableAgents();
  const progress = ((step + 1) / STEPS.length) * 100;

  const portalUrl = companySlug
    ? `${window.location.origin}/customer-portal/${companySlug}`
    : `${window.location.origin}/customer-portal`;

  const embedSnippet = `<!-- Aura Intercept Smart Widget -->
<script src="${window.location.origin}/widget.js" data-company="${companySlug ?? 'YOUR_COMPANY_SLUG'}" defer></script>`;

  const canAdvance = () => {
    if (step === 0) return !!data.businessType && data.companyName.trim().length > 0;
    return true; // all later steps are optional
  };

  // ─── Step 1: Auto-import ───────────────────────────────────────────
  const handleAutoImport = async () => {
    if (!data.importUrl && !data.importText) {
      toast.error('Add a website URL or paste some text to import.');
      return;
    }
    setIsImporting(true);
    try {
      const { data: result, error } = await supabase.functions.invoke('kb-auto-import', {
        body: data.importUrl
          ? { url: data.importUrl }
          : { text: data.importText },
      });
      if (error) throw error;
      if (!result?.extracted) throw new Error('No data extracted');
      setData((prev) => ({ ...prev, importedKB: result.extracted }));
      const counts = [
        `${result.extracted.services?.length ?? 0} services`,
        `${result.extracted.faqs?.length ?? 0} FAQs`,
        `${result.extracted.business_hours?.length ?? 0} hours`,
      ];
      toast.success(`Imported ${counts.join(' · ')}`, { icon: '✨' });
    } catch (err) {
      console.error('KB import error:', err);
      toast.error(err instanceof Error ? err.message : 'Import failed. You can skip and add manually later.');
    } finally {
      setIsImporting(false);
    }
  };

  // ─── Step 3: Activate agents ───────────────────────────────────────
  const handleActivateAgents = async () => {
    if (!companyId) return;
    try {
      const rows = availableAgents.map((agent_type) => ({
        company_id: companyId,
        agent_type,
        is_enabled: true,
      }));
      await supabase
        .from('ai_agent_configs')
        .upsert(rows, { onConflict: 'company_id,agent_type' });
      setData((prev) => ({
        ...prev,
        agentsActivated: true,
        agentsActivatedCount: rows.length,
      }));
      toast.success(`Activated ${rows.length} AI agents in your ${tierInfo.label} plan`, { icon: '🤖' });
    } catch (err) {
      console.error('Agent activation error:', err);
      toast.error('Could not activate agents. You can do this later in AI Operatives Hub.');
    }
  };

  // ─── Final launch ──────────────────────────────────────────────────
  const handleLaunch = async () => {
    setIsSubmitting(true);
    try {
      if (!companyId) {
        toast.error('No company found. Redirecting to dashboard.');
        navigate('/dashboard');
        return;
      }

      const kb = data.importedKB;
      const promptParts: string[] = [];
      if (template && template.id !== 'other') promptParts.push(`Industry: ${template.label}`);
      if (kb?.content_profile?.business_description) {
        promptParts.push(kb.content_profile.business_description);
      }
      const answersBlock = formatFastStartAnswers(data.businessType, data.verticalAnswers);
      if (answersBlock) promptParts.push(answersBlock);

      // 1. Update company basics
      const { data: companyRow } = await supabase
        .from('companies')
        .update({
          name: data.companyName,
          phone: data.phone || kb?.company_info?.phone || undefined,
          address: data.address || kb?.company_info?.address || undefined,
          email: kb?.company_info?.email || undefined,
          ai_agent_prompt: promptParts.join('\n\n') || undefined,
          industry_vertical: data.businessType || undefined,
          ai_voice_greeting: getIndustryVoiceGreeting(data.businessType, data.companyName),
        })
        .eq('id', companyId)
        .select('slug')
        .maybeSingle();
      if (companyRow?.slug) setCompanySlug(companyRow.slug);

      // 2. Services — merge template + imported
      const serviceMap = new Map<string, any>();
      template?.services.forEach((name) => serviceMap.set(name.toLowerCase(), { name, is_active: true }));
      kb?.services?.forEach((s) => {
        if (!s?.name) return;
        serviceMap.set(s.name.toLowerCase(), {
          name: s.name,
          description: s.description,
          price: s.price ?? null,
          is_active: true,
        });
      });
      if (serviceMap.size > 0) {
        const rows = Array.from(serviceMap.values()).map((s) => ({ ...s, company_id: companyId }));
        await supabase.from('services').upsert(rows, { onConflict: 'company_id,name', ignoreDuplicates: false });
      }

      // 3. Business hours — prefer imported KB; otherwise prefill from the
      // industry template (Phase 6 task 4). Skip entirely if neither is set.
      const parseRange = (range: string): { open: string; close: string; closed: boolean } | null => {
        const r = range?.trim();
        if (!r || /closed|on-call|monitoring/i.test(r)) return { open: '', close: '', closed: true };
        const m = r.match(/(\d{1,2}):?(\d{2})?\s*[-–]\s*(\d{1,2}):?(\d{2})?/);
        if (!m) return null;
        const pad = (h: string, mm?: string) => `${h.padStart(2, '0')}:${(mm ?? '00').padStart(2, '0')}`;
        return { open: pad(m[1], m[2]), close: pad(m[3], m[4]), closed: false };
      };
      let hourRows: any[] = [];
      if (kb?.business_hours?.length) {
        hourRows = kb.business_hours
          .filter((h) => DAY_INDEX[h.day?.toLowerCase()] !== undefined)
          .map((h) => ({
            company_id: companyId,
            day_of_week: DAY_INDEX[h.day.toLowerCase()],
            is_closed: h.is_closed,
            open_time: h.is_closed ? null : (h.open || '09:00'),
            close_time: h.is_closed ? null : (h.close || '17:00'),
            hour_type: 'regular',
          }));
      } else if (template?.hours) {
        const wk = parseRange(template.hours.weekday);
        const we = parseRange(template.hours.weekend);
        const make = (d: number, r: typeof wk) => r ? ({
          company_id: companyId,
          day_of_week: d,
          is_closed: r.closed,
          open_time: r.closed ? null : r.open,
          close_time: r.closed ? null : r.close,
          hour_type: 'regular',
        }) : null;
        hourRows = [1,2,3,4,5].map(d => make(d, wk))
          .concat([0, 6].map(d => make(d, we)))
          .filter(Boolean);
      }
      if (hourRows.length) {
        await supabase.from('business_hours').upsert(hourRows as any, { onConflict: 'company_id,day_of_week,hour_type' });
      }

      // 4. FAQs
      if (kb?.faqs?.length) {
        const rows = kb.faqs.map((f, i) => ({
          company_id: companyId,
          question: f.question,
          answer: f.answer,
          is_active: true,
          sort_order: i,
        }));
        await supabase.from('faqs').insert(rows);
      }

      // 5. Content profile
      if (kb?.content_profile && Object.keys(kb.content_profile).length) {
        await supabase
          .from('company_ai_content_profiles')
          .upsert(
            { company_id: companyId, ...kb.content_profile, updated_at: new Date().toISOString() },
            { onConflict: 'company_id' },
          );
      }

      // 6. Mark onboarding complete
      await markOnboardingCompleted();

      logEvent('launch', 'launch', { agentsActivated: data.agentsActivated, importedKB: !!data.importedKB });
      toast.success('Your 24 AI agents are now live 24/7', { duration: 6000, icon: '🚀' });
      navigate('/dashboard?welcome=true');
    } catch (err) {
      console.error('Launch error:', err);
      toast.error('Something went wrong saving your setup. You can finish in Settings.');
      navigate('/dashboard');
    } finally {
      setIsSubmitting(false);
    }
  };

  // ─── Step renderers ────────────────────────────────────────────────
  const renderStep0 = () => (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Building2 className="h-5 w-5 text-primary" />
          Welcome to Aura Intercept
        </CardTitle>
        <CardDescription>
          You're on the <span className="font-semibold text-primary">{tierInfo.label}</span> plan with a 90-day free trial. Pick your business type so Aura can tailor everything.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        <BusinessTypeSelector
          selected={data.businessType}
          onSelect={(id) => setData((prev) => ({ ...prev, businessType: id }))}
        />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
          <div className="space-y-1.5">
            <Label htmlFor="fs-name">Company Name *</Label>
            <Input id="fs-name" value={data.companyName} onChange={(e) => setData((p) => ({ ...p, companyName: e.target.value }))} placeholder="Acme HVAC" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="fs-phone">Phone</Label>
            <Input id="fs-phone" value={data.phone} onChange={(e) => setData((p) => ({ ...p, phone: e.target.value }))} placeholder="(555) 123-4567" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="fs-addr">Address</Label>
            <Input id="fs-addr" value={data.address} onChange={(e) => setData((p) => ({ ...p, address: e.target.value }))} placeholder="123 Main St, Dallas TX" />
          </div>
        </div>
        {data.businessType && verticalQuestions.length > 0 && (
          <div className="rounded-lg border border-primary/20 bg-primary/5 p-4 space-y-3">
            <div className="flex items-center gap-2 text-sm font-medium text-primary">
              <Sparkles className="h-4 w-4" />
              A few quick {template?.label ?? 'industry'} questions
              <span className="ml-auto text-[10px] font-normal text-muted-foreground uppercase tracking-wider">Optional</span>
            </div>
            <p className="text-xs text-muted-foreground">
              Answers go straight into your AI agents' context so they sound like an expert from day one.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {verticalQuestions.map((q) => (
                <div key={q.key} className="space-y-1">
                  <Label htmlFor={`fs-q-${q.key}`} className="text-xs">{q.label}</Label>
                  <Input
                    id={`fs-q-${q.key}`}
                    value={data.verticalAnswers[q.key] ?? ''}
                    onChange={(e) =>
                      setData((p) => ({
                        ...p,
                        verticalAnswers: { ...p.verticalAnswers, [q.key]: e.target.value },
                      }))
                    }
                    placeholder={q.placeholder}
                  />
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );

  const renderStep1 = () => (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-primary" />
          Auto-Build Your Knowledge Base
        </CardTitle>
        <CardDescription>
          Aura reads your website (or pasted service menu) and auto-populates Services, Hours, FAQs, and Content Profile. Skippable — you can add things later.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="space-y-2">
          <Label htmlFor="fs-url" className="flex items-center gap-1.5">
            <Globe className="h-3.5 w-3.5 text-primary" /> Your website URL
          </Label>
          <div className="flex gap-2">
            <Input
              id="fs-url"
              value={data.importUrl}
              onChange={(e) => setData((p) => ({ ...p, importUrl: e.target.value, importText: '' }))}
              placeholder="https://acmehvac.com"
              type="url"
              disabled={isImporting}
            />
            <Button onClick={handleAutoImport} disabled={isImporting || (!data.importUrl && !data.importText)}>
              {isImporting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
              <span className="ml-1.5 hidden sm:inline">Import</span>
            </Button>
          </div>
        </div>

        <div className="relative">
          <div className="absolute inset-0 flex items-center"><span className="w-full border-t border-border/50" /></div>
          <div className="relative flex justify-center text-xs uppercase"><span className="bg-card px-2 text-muted-foreground">or paste from a PDF / menu</span></div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="fs-text" className="flex items-center gap-1.5">
            <FileText className="h-3.5 w-3.5 text-primary" /> Paste service menu, brochure, or any business description
          </Label>
          <Textarea
            id="fs-text"
            value={data.importText}
            onChange={(e) => setData((p) => ({ ...p, importText: e.target.value, importUrl: '' }))}
            rows={5}
            placeholder="We're a 5-person HVAC company in Dallas. Services: AC repair $150, furnace install $2,500, duct cleaning $300..."
            disabled={isImporting}
          />
        </div>

        {data.importedKB && (
          <div className="rounded-lg border border-primary/30 bg-primary/5 p-4 space-y-2">
            <div className="flex items-center gap-2 text-sm font-medium text-primary">
              <CheckCircle2 className="h-4 w-4" /> Imported successfully
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
              <Badge variant="outline" className="justify-center">{data.importedKB.services?.length ?? 0} Services</Badge>
              <Badge variant="outline" className="justify-center">{data.importedKB.faqs?.length ?? 0} FAQs</Badge>
              <Badge variant="outline" className="justify-center">{data.importedKB.business_hours?.length ?? 0} Hours</Badge>
              <Badge variant="outline" className="justify-center">{data.importedKB.content_profile ? '✓' : '—'} Profile</Badge>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );

  const renderStep2 = () => (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Link2 className="h-5 w-5 text-primary" /> Connect Your Tools
        </CardTitle>
        <CardDescription>Optional — full setup is always available in Settings → Integrations.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card
            className={`p-4 cursor-pointer transition-all ${data.calendarConnected ? 'border-primary bg-primary/5' : 'hover:border-primary/30'}`}
            onClick={() => setData((p) => ({ ...p, calendarConnected: !p.calendarConnected }))}
          >
            <div className="flex items-center gap-3">
              <div className="rounded-full bg-muted p-2">
                <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" /></svg>
              </div>
              <div className="flex-1">
                <h4 className="font-medium text-sm">Google Calendar</h4>
                <p className="text-xs text-muted-foreground">Sync appointments automatically</p>
              </div>
              {data.calendarConnected && <CheckCircle2 className="h-5 w-5 text-primary" />}
            </div>
          </Card>
          <Card
            className={`p-4 cursor-pointer transition-all ${data.stripeConnected ? 'border-primary bg-primary/5' : 'hover:border-primary/30'}`}
            onClick={() => setData((p) => ({ ...p, stripeConnected: !p.stripeConnected }))}
          >
            <div className="flex items-center gap-3">
              <div className="rounded-full bg-muted p-2">
                <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="1" y="4" width="22" height="16" rx="2" /><line x1="1" y1="10" x2="23" y2="10" /></svg>
              </div>
              <div className="flex-1">
                <h4 className="font-medium text-sm">Stripe Payments</h4>
                <p className="text-xs text-muted-foreground">Accept payments & send invoices</p>
              </div>
              {data.stripeConnected && <CheckCircle2 className="h-5 w-5 text-primary" />}
            </div>
          </Card>
        </div>
        <p className="text-xs text-muted-foreground text-center pt-2">
          Click to mark as connected. Real OAuth flows live in Settings → Integrations.
        </p>
      </CardContent>
    </Card>
  );

  const renderStep3 = () => (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bot className="h-5 w-5 text-primary" /> Activate Your AI Team
        </CardTitle>
        <CardDescription>
          Turn on every AI agent included in your <span className="font-semibold text-primary">{tierInfo.label}</span> plan with one click.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="rounded-lg border border-border bg-muted/30 p-4">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-medium">{availableAgents.length} agents in your plan</span>
            <Badge variant="outline" className="text-primary border-primary/40">{tierInfo.label}</Badge>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {availableAgents.map((agent) => (
              <Badge key={agent} variant="secondary" className="text-xs">
                {agent.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())}
              </Badge>
            ))}
          </div>
        </div>

        {!data.agentsActivated ? (
          <Button onClick={handleActivateAgents} className="w-full" size="lg">
            <Sparkles className="h-4 w-4 mr-2" />
            Enable All {availableAgents.length} Agents in My Plan
          </Button>
        ) : (
          <div className="rounded-lg border border-primary/40 bg-primary/5 p-4 flex items-center gap-3">
            <CheckCircle2 className="h-5 w-5 text-primary shrink-0" />
            <div className="text-sm">
              <p className="font-medium text-foreground">{data.agentsActivatedCount} agents activated</p>
              <p className="text-xs text-muted-foreground">They will run 24/7 using your Knowledge Base as the source of truth.</p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );

  const renderStep4 = () => (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Smartphone className="h-5 w-5 text-primary" /> Install & Launch
        </CardTitle>
        <CardDescription>
          Share your Customer Portal and (optionally) embed the smart widget on your website.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="grid grid-cols-1 md:grid-cols-[auto_1fr] gap-4 items-center">
          <div className="bg-white p-3 rounded-lg shrink-0 mx-auto">
            <QRCodeSVG value={portalUrl} size={120} level="M" />
          </div>
          <div className="space-y-2">
            <p className="text-sm font-medium">Customer Portal URL</p>
            <div className="flex gap-2">
              <Input value={portalUrl} readOnly className="text-xs font-mono" />
              <Button
                size="icon"
                variant="outline"
                onClick={() => { navigator.clipboard.writeText(portalUrl); toast.success('Portal URL copied'); }}
              >
                <Copy className="h-3.5 w-3.5" />
              </Button>
              <Button
                size="icon"
                variant="outline"
                onClick={() => window.open(portalUrl, '_blank')}
              >
                <ExternalLink className="h-3.5 w-3.5" />
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">Customers scan the QR or visit the URL to book, chat with Aura, and view appointments.</p>
          </div>
        </div>

        <div className="space-y-2">
          <Label className="text-xs">Embed widget on your website (paste before <code>&lt;/body&gt;</code>)</Label>
          <div className="relative">
            <pre className="text-[10px] bg-muted/40 border border-border rounded p-3 overflow-x-auto font-mono">{embedSnippet}</pre>
            <Button
              size="icon"
              variant="outline"
              className="absolute top-2 right-2 h-7 w-7"
              onClick={() => { navigator.clipboard.writeText(embedSnippet); toast.success('Embed code copied'); }}
            >
              <Copy className="h-3 w-3" />
            </Button>
          </div>
        </div>

        <div className="rounded-lg border border-primary/30 bg-primary/5 p-4 text-center">
          <Rocket className="h-8 w-8 text-primary mx-auto mb-2" />
          <p className="text-sm font-medium text-foreground">Ready to go live</p>
          <p className="text-xs text-muted-foreground mt-1">Click "Launch" — your 24 AI agents will start running 24/7.</p>
        </div>
      </CardContent>
    </Card>
  );

  const stepRenderers = [renderStep0, renderStep1, renderStep2, renderStep3, renderStep4];

  return (
    <div className="max-w-2xl mx-auto p-4 md:p-6 space-y-6">
      <div className="text-center space-y-1">
        <h1 className="text-2xl font-bold text-foreground">Fast Start Setup</h1>
        <p className="text-sm text-muted-foreground">5 quick steps. Under 10 minutes. Mostly automated.</p>
      </div>

      <div className="flex items-center justify-between gap-1 px-2">
        {STEPS.map((s, i) => {
          const Icon = s.icon;
          const isActive = i === step;
          const isDone = i < step;
          return (
            <div key={s.label} className="flex flex-col items-center gap-1 flex-1">
              <div
                className={`rounded-full p-2 transition-colors ${
                  isActive
                    ? 'bg-primary text-primary-foreground'
                    : isDone
                    ? 'bg-primary/20 text-primary'
                    : 'bg-muted text-muted-foreground'
                }`}
              >
                {isDone ? <CheckCircle2 className="h-4 w-4" /> : <Icon className="h-4 w-4" />}
              </div>
              <span className={`text-[10px] sm:text-xs ${isActive ? 'text-primary font-medium' : 'text-muted-foreground'}`}>
                {s.label}
              </span>
            </div>
          );
        })}
      </div>
      <Progress value={progress} className="h-1.5" />

      {stepRenderers[step]()}

      <div className="flex justify-between pt-2">
        <Button variant="outline" onClick={() => setStep((s) => Math.max(0, s - 1))} disabled={step === 0} size="sm">
          <ChevronLeft className="mr-1 h-4 w-4" /> Back
        </Button>

        {step < STEPS.length - 1 ? (
          <Button onClick={() => setStep((s) => s + 1)} disabled={!canAdvance()} size="sm">
            {step === 1 && !data.importedKB ? 'Skip' : 'Next'}
            <ChevronRight className="ml-1 h-4 w-4" />
          </Button>
        ) : (
          <Button onClick={handleLaunch} disabled={isSubmitting} size="sm" className="gap-1.5">
            {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Rocket className="h-4 w-4" />}
            {isSubmitting ? 'Launching...' : 'Launch My 24 AI Agents'}
          </Button>
        )}
      </div>
    </div>
  );
}
