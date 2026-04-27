import { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Loader2, Sparkles, Mail, MessageSquare } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { INDUSTRY_LIST, getIndustryContent } from '@/lib/industryMarketingContent';
import { DemoCredentialsCard, DemoCredentialsResult } from './DemoCredentialsCard';

interface StartDemoDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  industryId: string;
}

export function StartDemoDialog({ open, onOpenChange, industryId }: StartDemoDialogProps) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [businessName, setBusinessName] = useState('');
  const [emailOptIn, setEmailOptIn] = useState(false);
  const [smsOptIn, setSmsOptIn] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<DemoCredentialsResult | null>(null);

  useEffect(() => {
    if (!phone && smsOptIn) setSmsOptIn(false);
  }, [phone, smsOptIn]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email || !businessName) {
      toast.error('Please fill in your name, email, and business name.');
      return;
    }
    setSubmitting(true);
    try {
      const { data, error } = await supabase.functions.invoke('create-demo-trial', {
        body: {
          name,
          email,
          phone: phone || null,
          business_name: businessName,
          industry: industryId,
          sms_opt_in: smsOptIn,
          email_opt_in: emailOptIn,
        },
      });
      if (error) throw error;
      if (!data?.success) throw new Error(data?.error || 'Failed to start demo');
      setResult(data as DemoCredentialsResult);
      toast.success('Demo ready! Your 48-hour trial just started.');
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to start demo';
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const handleClose = (next: boolean) => {
    if (!next) {
      setResult(null);
      setName('');
      setEmail('');
      setPhone('');
      setBusinessName('');
      setEmailOptIn(false);
      setSmsOptIn(false);
    }
    onOpenChange(next);
  };

  const industryLabel = INDUSTRY_LIST.find((i) => i.id === industryId)?.label || 'your business';
  const ind = getIndustryContent(industryId);

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-lg">
        {result ? (
          <>
            <DialogHeader>
              <DialogTitle>Your 48-hour demo is ready</DialogTitle>
              <DialogDescription>
                Three logins below — try Aura as the owner, a tech, and a customer.
              </DialogDescription>
            </DialogHeader>
            <DemoCredentialsCard result={result} />
          </>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-primary" />
                Start your 48-hour {industryLabel} demo
              </DialogTitle>
              <DialogDescription>
                We'll spin up a fully-loaded demo company in seconds. No credit card required.
              </DialogDescription>
            </DialogHeader>
            <div className="text-xs px-3 py-2 rounded-md bg-primary/10 text-foreground border border-primary/20">
              <span className="font-medium">{ind.emoji} {ind.label}</span> demo company in <span className="font-medium">{ind.serviceArea.cities[0]}</span> · pre-seeded with 6 appointments, 3 leads, and a sample customer.
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="name">Your name *</Label>
                  <Input id="name" value={name} onChange={(e) => setName(e.target.value)} required />
                </div>
                <div>
                  <Label htmlFor="businessName">Business name *</Label>
                  <Input id="businessName" value={businessName} onChange={(e) => setBusinessName(e.target.value)} required />
                </div>
              </div>
              <div>
                <Label htmlFor="email">Email *</Label>
                <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
              </div>
              <div>
                <Label htmlFor="phone">Phone (optional)</Label>
                <Input id="phone" type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+1 555 555 5555" />
              </div>
              <div className="space-y-2">
                <div className="flex items-start gap-2 p-3 rounded-lg border border-border/60 bg-muted/30">
                  <Checkbox
                    id="optEmail"
                    checked={emailOptIn}
                    onCheckedChange={(c) => setEmailOptIn(!!c)}
                    className="mt-0.5"
                  />
                  <div className="space-y-0.5 flex-1">
                    <Label htmlFor="optEmail" className="text-sm font-normal leading-tight cursor-pointer flex items-center gap-1.5">
                      <Mail className="w-3.5 h-3.5 text-primary" />
                      Email me Aura Intercept updates &amp; demo tips.
                    </Label>
                    <p className="text-[10px] text-muted-foreground leading-tight">
                      Occasional product updates &amp; tips. ~2 emails/mo. Unsubscribe anytime. Not required to use the demo.
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-2 p-3 rounded-lg border border-border/60 bg-muted/30">
                  <Checkbox
                    id="optSms"
                    checked={smsOptIn}
                    onCheckedChange={(c) => setSmsOptIn(!!c)}
                    disabled={!phone}
                    className="mt-0.5"
                  />
                  <div className="space-y-0.5 flex-1">
                    <Label htmlFor="optSms" className="text-sm font-normal leading-tight cursor-pointer flex items-center gap-1.5">
                      <MessageSquare className="w-3.5 h-3.5 text-primary" />
                      Text me Aura Intercept updates &amp; demo tips.
                    </Label>
                    <p className="text-[10px] text-muted-foreground leading-tight">
                      {!phone ? 'Add a phone number above to enable. ' : ''}Msg &amp; data rates may apply. ~2 msgs/mo. Reply STOP to opt out, HELP for help. Consent not required to use the demo.
                    </p>
                  </div>
                </div>
              </div>
              <Button type="submit" variant="gradient" size="lg" className="w-full" disabled={submitting}>
                {submitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" /> Spinning up your demo...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" /> Launch my demo
                  </>
                )}
              </Button>
            </form>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
