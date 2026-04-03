import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import {
  ChevronLeft,
  ChevronRight,
  Rocket,
  Building2,
  Link2,
  MessageSquare,
  CheckCircle2,
  Sparkles,
} from 'lucide-react';
import { BusinessTypeSelector, BUSINESS_TEMPLATES } from './BusinessTypeSelector';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';

const STEPS = [
  { label: 'Business Type', icon: Building2 },
  { label: 'Integrations', icon: Link2 },
  { label: 'Tell Aura', icon: MessageSquare },
  { label: 'Launch', icon: Rocket },
];

interface FastStartData {
  businessType: string | null;
  companyName: string;
  phone: string;
  address: string;
  stripeConnected: boolean;
  calendarConnected: boolean;
  businessDescription: string;
}

export function FastStartWizard() {
  const navigate = useNavigate();
  const { companyId } = useAuth();
  const [step, setStep] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [data, setData] = useState<FastStartData>({
    businessType: null,
    companyName: '',
    phone: '',
    address: '',
    stripeConnected: false,
    calendarConnected: false,
    businessDescription: '',
  });

  const template = useMemo(
    () => BUSINESS_TEMPLATES.find((t) => t.id === data.businessType),
    [data.businessType]
  );

  const progress = ((step + 1) / STEPS.length) * 100;

  const canAdvance = () => {
    if (step === 0) return !!data.businessType && data.companyName.trim().length > 0;
    if (step === 1) return true; // integrations are optional
    if (step === 2) return true; // description is optional
    return true;
  };

  const handleLaunch = async () => {
    setIsSubmitting(true);
    try {
      // Save company basics if we have a companyId
      if (companyId && data.companyName) {
        await supabase
          .from('companies')
          .update({
            name: data.companyName,
            phone: data.phone || undefined,
            address: data.address || undefined,
            ai_agent_prompt: data.businessDescription || undefined,
          })
          .eq('id', companyId);
      }

      toast.success('Your AI team is ready! Try a command to get started.', {
        duration: 5000,
        icon: '🚀',
      });
      navigate('/dashboard');
    } catch (err) {
      console.error('Fast Start error:', err);
      toast.error('Something went wrong. You can finish setup later.');
      navigate('/dashboard');
    } finally {
      setIsSubmitting(false);
    }
  };

  const prefillDescription = () => {
    if (!template || template.id === 'other') return;
    const desc = `We're a ${template.label.toLowerCase()} company offering ${template.services.slice(0, 3).join(', ')}. Our typical hours are ${template.hours.weekday} on weekdays. We serve residential and commercial customers in our local area.`;
    setData((prev) => ({ ...prev, businessDescription: desc }));
  };

  // --- Step renderers ---

  const renderStep0 = () => (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Building2 className="h-5 w-5 text-primary" />
          What type of business do you run?
        </CardTitle>
        <CardDescription>Pick your trade so Aura can tailor everything for you</CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        <BusinessTypeSelector
          selected={data.businessType}
          onSelect={(id) => setData((prev) => ({ ...prev, businessType: id }))}
        />

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
          <div className="space-y-1.5">
            <Label htmlFor="fs-name">Company Name *</Label>
            <Input
              id="fs-name"
              value={data.companyName}
              onChange={(e) => setData((prev) => ({ ...prev, companyName: e.target.value }))}
              placeholder="Acme HVAC"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="fs-phone">Phone</Label>
            <Input
              id="fs-phone"
              value={data.phone}
              onChange={(e) => setData((prev) => ({ ...prev, phone: e.target.value }))}
              placeholder="(555) 123-4567"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="fs-addr">Address</Label>
            <Input
              id="fs-addr"
              value={data.address}
              onChange={(e) => setData((prev) => ({ ...prev, address: e.target.value }))}
              placeholder="123 Main St, Dallas TX"
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );

  const renderStep1 = () => (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Link2 className="h-5 w-5 text-primary" />
          Connect Your Tools
        </CardTitle>
        <CardDescription>Optional — you can always do this later in Settings</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card
            className={`p-4 cursor-pointer transition-all ${data.calendarConnected ? 'border-primary bg-primary/5' : 'hover:border-primary/30'}`}
            onClick={() => setData((prev) => ({ ...prev, calendarConnected: !prev.calendarConnected }))}
          >
            <div className="flex items-center gap-3">
              <div className="rounded-full bg-muted p-2">
                <svg className="h-5 w-5 text-foreground" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" /></svg>
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
            onClick={() => setData((prev) => ({ ...prev, stripeConnected: !prev.stripeConnected }))}
          >
            <div className="flex items-center gap-3">
              <div className="rounded-full bg-muted p-2">
                <svg className="h-5 w-5 text-foreground" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="1" y="4" width="22" height="16" rx="2" /><line x1="1" y1="10" x2="23" y2="10" /></svg>
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
          Click a card to mark it as connected. Full integration setup is available in Settings.
        </p>
      </CardContent>
    </Card>
  );

  const renderStep2 = () => (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MessageSquare className="h-5 w-5 text-primary" />
          Tell Aura About Your Business
        </CardTitle>
        <CardDescription>Help Aura understand what you do so it can answer calls, create quotes, and handle leads</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Textarea
          value={data.businessDescription}
          onChange={(e) => setData((prev) => ({ ...prev, businessDescription: e.target.value }))}
          placeholder="We're a 5-person HVAC company in Dallas serving residential customers. We specialize in AC repair and furnace installation..."
          rows={5}
          className="resize-none"
        />
        {template && template.id !== 'other' && !data.businessDescription && (
          <Button
            variant="outline"
            size="sm"
            onClick={prefillDescription}
            className="gap-1.5"
          >
            <Sparkles className="h-3.5 w-3.5 text-primary" />
            Auto-fill from {template.label} template
          </Button>
        )}
      </CardContent>
    </Card>
  );

  const renderStep3 = () => (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Rocket className="h-5 w-5 text-primary" />
          Ready to Launch!
        </CardTitle>
        <CardDescription>Here's what Aura will set up for you</CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        {/* Summary */}
        <div className="rounded-lg border border-border bg-muted/30 p-4 space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-sm text-muted-foreground">Business</span>
            <span className="text-sm font-medium text-foreground">{data.companyName || '—'}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-muted-foreground">Type</span>
            <span className="text-sm font-medium text-foreground">{template?.label || 'Custom'}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-muted-foreground">Calendar</span>
            <Badge variant={data.calendarConnected ? 'default' : 'secondary'} className="text-xs">
              {data.calendarConnected ? 'Connected' : 'Skip for now'}
            </Badge>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-muted-foreground">Payments</span>
            <Badge variant={data.stripeConnected ? 'default' : 'secondary'} className="text-xs">
              {data.stripeConnected ? 'Connected' : 'Skip for now'}
            </Badge>
          </div>
        </div>

        {/* Core agents that will be enabled */}
        <div>
          <h4 className="text-sm font-medium text-foreground mb-2">Core AI Agents (auto-enabled)</h4>
          <div className="flex flex-wrap gap-2">
            {(template?.coreAgents || ['triage', 'customer_journey', 'dispatch', 'business_finance']).map((agent) => (
              <Badge key={agent} variant="outline" className="gap-1 border-primary/30 text-primary">
                <CheckCircle2 className="h-3 w-3" />
                {agent.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())}
              </Badge>
            ))}
          </div>
        </div>

        {template && template.services.length > 0 && (
          <div>
            <h4 className="text-sm font-medium text-foreground mb-2">Pre-loaded Services</h4>
            <div className="flex flex-wrap gap-1.5">
              {template.services.map((svc) => (
                <Badge key={svc} variant="secondary" className="text-xs">{svc}</Badge>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );

  const stepRenderers = [renderStep0, renderStep1, renderStep2, renderStep3];

  return (
    <div className="max-w-2xl mx-auto p-4 md:p-6 space-y-6">
      {/* Header */}
      <div className="text-center space-y-1">
        <h1 className="text-2xl font-bold text-foreground">Fast Start Setup</h1>
        <p className="text-sm text-muted-foreground">Get your AI team running in under 5 minutes</p>
      </div>

      {/* Step indicators */}
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
              <span className={`text-xs ${isActive ? 'text-primary font-medium' : 'text-muted-foreground'}`}>
                {s.label}
              </span>
            </div>
          );
        })}
      </div>
      <Progress value={progress} className="h-1.5" />

      {/* Current step */}
      {stepRenderers[step]()}

      {/* Navigation */}
      <div className="flex justify-between pt-2">
        <Button
          variant="outline"
          onClick={() => setStep((s) => Math.max(0, s - 1))}
          disabled={step === 0}
          size="sm"
        >
          <ChevronLeft className="mr-1 h-4 w-4" />
          Back
        </Button>

        {step < STEPS.length - 1 ? (
          <Button
            onClick={() => setStep((s) => s + 1)}
            disabled={!canAdvance()}
            size="sm"
          >
            Next
            <ChevronRight className="ml-1 h-4 w-4" />
          </Button>
        ) : (
          <Button
            onClick={handleLaunch}
            disabled={isSubmitting}
            size="sm"
            className="gap-1.5"
          >
            <Rocket className="h-4 w-4" />
            {isSubmitting ? 'Launching...' : 'Launch My AI Team'}
          </Button>
        )}
      </div>
    </div>
  );
}
