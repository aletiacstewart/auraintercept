import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { PublicHeader } from '@/components/layout/PublicHeader';
import { PublicFooter } from '@/components/layout/PublicFooter';
import { IndustryDropdownPicker } from '@/components/marketing/IndustryDropdownPicker';
import { IntegrationStatusPanel } from '@/components/marketing/IntegrationStatusPanel';
import { IndustryHero } from '@/components/marketing/IndustryHero';
import { IndustryValueProps } from '@/components/marketing/IndustryValueProps';
import { RolePreviewRow } from '@/components/marketing/RolePreviewRow';
import { StartDemoDialog } from '@/components/marketing/StartDemoDialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Sparkles, Phone, AlertCircle, Zap, ArrowRight } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { getIndustryContent } from '@/lib/industryMarketingContent';
import { Link } from 'react-router-dom';

const STORAGE_KEY = 'aura.forbusiness.industry';

const PRICING_TIERS = [
  { name: 'Aura Core', price: '$197', tagline: '8 agents · 3 consoles', tier: 'starter' },
  { name: 'Aura Boost', price: '$497', tagline: '12 agents · 5 consoles', tier: 'connect' },
  { name: 'Aura Pro', price: '$997', tagline: '16 agents · 5 consoles', tier: 'performance' },
  { name: 'Aura Elite', price: '$1,997', tagline: '24 agents · 7 consoles + AI Hub', tier: 'command' },
] as const;

export default function ForBusiness() {
  const [searchParams, setSearchParams] = useSearchParams();
  // Always default to generic Aura Intercept content. Only honor an explicit
  // ?industry= query param (e.g. from marketing links). Never read from
  // localStorage on load — that caused returning visitors to skip the default.
  const initial = searchParams.get('industry') || 'default';
  const [industry, setIndustry] = useState<string>(initial);
  const [demoOpen, setDemoOpen] = useState(false);

  const expired = searchParams.get('expired') === '1';

  useEffect(() => {
    const current = searchParams.get('industry');
    const next = new URLSearchParams(searchParams);
    if (industry === 'default') {
      // Don't pollute URL or storage with the placeholder value.
      if (current) {
        next.delete('industry');
        setSearchParams(next, { replace: true });
      }
      localStorage.removeItem(STORAGE_KEY);
      return;
    }
    localStorage.setItem(STORAGE_KEY, industry);
    if (current !== industry) {
      next.set('industry', industry);
      setSearchParams(next, { replace: true });
    }
  }, [industry, searchParams, setSearchParams]);

  const content = useMemo(() => getIndustryContent(industry), [industry]);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <PublicHeader />
      {/* Dynamic Demo Page header */}
      <div className="sticky top-[64px] z-40 bg-background/95 backdrop-blur border-b border-border/40">
        <div className="container max-w-6xl mx-auto px-4 py-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="flex items-center gap-3 flex-wrap">
            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-primary/15 text-primary text-[10px] font-semibold uppercase tracking-wider">
              <Zap className="w-3 h-3" /> Dynamic Demo Page
            </span>
            <span className="text-xs text-muted-foreground">
              Pick your industry — page & 48-hour demo update instantly.
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-muted-foreground whitespace-nowrap">I am a:</span>
            <IndustryDropdownPicker value={industry} onChange={setIndustry} />
          </div>
        </div>
      </div>

      {expired && (
        <div className="container max-w-5xl mx-auto px-4 mt-4">
          <Alert>
            <AlertCircle className="w-4 h-4" />
            <AlertDescription>
              Your demo has ended. Start a paid plan to keep your data, or launch a fresh demo below.
            </AlertDescription>
          </Alert>
        </div>
      )}

      <main className="flex-1">
        <IndustryHero content={content} onStartDemo={() => setDemoOpen(true)} />
        <IndustryValueProps content={content} />
        <RolePreviewRow industryId={industry} onTryDemo={() => setDemoOpen(true)} />
        <IntegrationStatusPanel />

        {/* Pricing snapshot */}
        <section className="py-10 bg-background">
          <div className="container max-w-6xl mx-auto px-4">
            <div className="text-center mb-6">
              <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-2">
                Simple, transparent pricing
              </h2>
              <p className="text-sm text-muted-foreground">Pick the tier that fits. Cancel anytime.</p>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 max-w-4xl mx-auto">
              {PRICING_TIERS.map((t) => (
                <Link
                  key={t.name}
                  to={`/auth?mode=company&tab=signup&tier=${t.tier}&industry=${industry}`}
                  className="group"
                >
                  <Card className="border-border/60 hover:border-primary/60 hover:shadow-md transition-all h-full">
                    <CardContent className="p-3 text-center flex flex-col items-center gap-1">
                      <h3 className="text-sm font-semibold text-foreground">{t.name}</h3>
                      <div className="text-xl font-bold text-primary leading-tight">
                        {t.price}
                        <span className="text-[10px] font-normal text-muted-foreground">/mo</span>
                      </div>
                      <p className="text-[10px] text-muted-foreground leading-tight min-h-[24px]">
                        {t.tagline}
                      </p>
                      <span className="mt-1 inline-flex items-center gap-1 text-[10px] font-semibold text-primary group-hover:underline">
                        Choose plan <ArrowRight className="w-3 h-3" />
                      </span>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          </div>
        </section>

        {/* Final CTA */}
        <section className="py-10 bg-gradient-to-br from-primary/15 via-background to-secondary/15">
          <div className="container max-w-3xl mx-auto px-4 text-center">
            <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-3">
              See it in action — for {content.label.toLowerCase()}.
            </h2>
            <p className="text-sm text-muted-foreground mb-4">
              48 hours. Full access. Owner, technician, and customer views — all yours.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button size="lg" variant="gradient" onClick={() => setDemoOpen(true)}>
                <Sparkles className="w-5 h-5" /> Start your 48-hour demo
              </Button>
              <Button size="lg" variant="outline" asChild>
                <a href="tel:+15127372424">
                  <Phone className="w-5 h-5" /> Talk to a human
                </a>
              </Button>
            </div>
          </div>
        </section>
      </main>

      <PublicFooter />

      <StartDemoDialog open={demoOpen} onOpenChange={setDemoOpen} industryId={industry} />
    </div>
  );
}
