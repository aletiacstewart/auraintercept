import { useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { PublicHeader } from '@/components/layout/PublicHeader';
import { PublicFooter } from '@/components/layout/PublicFooter';
import { IndustryDropdownPicker } from '@/components/marketing/IndustryDropdownPicker';
import { IntegrationStatusPanel } from '@/components/marketing/IntegrationStatusPanel';
import { IndustryHero } from '@/components/marketing/IndustryHero';
import { IndustryValueProps } from '@/components/marketing/IndustryValueProps';
import { RolePreviewRow } from '@/components/marketing/RolePreviewRow';
import { IndustryROICalculator } from '@/components/marketing/IndustryROICalculator';
import { TestimonialSection } from '@/components/marketing/TestimonialSection';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Sparkles, Phone, AlertCircle, Zap, ArrowRight, ChevronDown, ChevronUp } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Collapsible, CollapsibleContent } from '@/components/ui/collapsible';
import { supabase } from '@/integrations/supabase/client';
import { getIndustryContent } from '@/lib/industryMarketingContent';
import { getPackIdForBusinessType } from '@/lib/businessTypeRegistry';
import { MedicalComplianceNotice } from '@/components/marketing/MedicalComplianceNotice';
import { Link } from 'react-router-dom';
import { SEO } from '@/components/seo/SEO';
import { LandingAIChat } from '@/components/landing/LandingAIChat';
import { trackFunnelEvent } from '@/lib/funnelTracking';

const STORAGE_KEY = 'aura.forbusiness.industry';

const PRICING_TIERS = [
  { name: 'Aura Core',  originalPrice: '$697',   price: '$497',   tagline: '3 consoles',            tier: 'starter' },
  { name: 'Aura Boost', originalPrice: '$1,394', price: '$994',   tagline: '5 consoles',            tier: 'connect' },
  { name: 'Aura Pro',   originalPrice: '$2,788', price: '$1,988', tagline: '5 consoles',            tier: 'performance' },
  { name: 'Aura Elite', originalPrice: '$5,576', price: '$3,979', tagline: '7 consoles + AI Hub',   tier: 'command' },
] as const;

export default function ForBusiness() {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  // Always default to generic Aura Intercept content. Only honor an explicit
  // ?industry= query param (e.g. from marketing links). Never read from
  // localStorage on load — that caused returning visitors to skip the default.
  const initial = searchParams.get('industry') || 'default';
  const [industry, setIndustry] = useState<string>(initial);

  const expired = searchParams.get('expired') === '1';

  const [showComparison, setShowComparison] = useState(false);
  const pricingExpandedLogged = useRef(false);
  const pricingViewedLogged = useRef(false);
  const pricingSectionRef = useRef<HTMLElement | null>(null);

  const handleToggleComparison = () => {
    setShowComparison(prev => {
      const next = !prev;
      if (next && !pricingExpandedLogged.current) {
        pricingExpandedLogged.current = true;
        try {
          const fp = localStorage.getItem('aura_visitor_fingerprint');
          if (fp) {
            supabase.functions.invoke('log-site-event', {
              body: {
                interaction_type: 'pricing_expanded',
                visitor_fingerprint: fp,
              },
            }).catch(() => {});
          }
        } catch {
          /* ignore */
        }
        try { trackFunnelEvent('pricing_expanded', { industry: industry !== 'default' ? industry : undefined, pagePath: '/for-business' }); } catch { /* ignore */ }
      }
      return next;
    });
  };

  const startLiveDemo = () => {
    try { trackFunnelEvent('demo_cta_clicked', { industry: industry !== 'default' ? industry : undefined, pagePath: '/for-business' }); } catch { /* ignore */ }
    const ind = industry && industry !== 'default' ? industry : '';
    const qs = new URLSearchParams({ mode: 'company', tab: 'signup', tier: 'command' });
    if (ind) qs.set('industry', ind);
    navigate(`/auth?${qs.toString()}`);
  };

  const scrollToLiveDemo = () => {
    const el = document.getElementById('live-demo');
    if (!el) return;
    el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    // Focus the chat input after the scroll settles.
    window.setTimeout(() => {
      const input = el.querySelector<HTMLInputElement>('input[type="text"], input:not([type])');
      input?.focus();
    }, 500);
  };

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

  // Fire page_view on mount and whenever industry changes.
  useEffect(() => {
    try {
      trackFunnelEvent('page_view', {
        pagePath: '/for-business',
        industry: industry !== 'default' ? industry : undefined,
      });
    } catch { /* ignore */ }
  }, [industry]);

  // Fire pricing_viewed once when pricing section scrolls into view.
  useEffect(() => {
    const el = pricingSectionRef.current;
    if (!el || pricingViewedLogged.current) return;
    if (typeof IntersectionObserver === 'undefined') {
      pricingViewedLogged.current = true;
      try { trackFunnelEvent('pricing_viewed', { industry: industry !== 'default' ? industry : undefined, pagePath: '/for-business' }); } catch { /* ignore */ }
      return;
    }
    const io = new IntersectionObserver((entries) => {
      for (const entry of entries) {
        if (entry.isIntersecting && !pricingViewedLogged.current) {
          pricingViewedLogged.current = true;
          try { trackFunnelEvent('pricing_viewed', { industry: industry !== 'default' ? industry : undefined, pagePath: '/for-business' }); } catch { /* ignore */ }
          io.disconnect();
          break;
        }
      }
    }, { threshold: 0.25 });
    io.observe(el);
    return () => io.disconnect();
  }, [industry]);

  // `industry` may be either a canonical pack id (e.g. 'hvac') or a raw
  // business-type key from the 185-type registry (e.g. 'hvac contractor').
  // Resolve to the nearest pack before rendering demo content.
  const packId = useMemo(() => getPackIdForBusinessType(industry) || industry, [industry]);
  const content = useMemo(() => getIndustryContent(packId), [packId]);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <SEO
        title="Aura Intercept for Your Industry | Live Demo"
        description="Pick your industry to preview a tailored AI receptionist, dispatcher, and marketer with a 60-day Live Demo."
        path="/for-business"
      />
      <PublicHeader />
      {/* Dynamic Demo Page header */}
      <div className="sticky top-[64px] z-40 bg-background/95 backdrop-blur border-b border-border/40">
        <div className="container max-w-6xl mx-auto px-4 py-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="flex items-center gap-3 flex-wrap">
            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-primary/15 text-primary text-[10px] font-semibold uppercase tracking-wider">
              <Zap className="w-3 h-3" /> Dynamic Demo Page
            </span>
            <span className="text-xs text-muted-foreground">
              Pick your industry and start your 60-Day Live Demo on Aura Elite. Onboarding fee is invoiced on day 31; your first monthly fee is charged on day 61. Downgrade or cancel anytime before day 60.
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

      <div className="container max-w-5xl mx-auto px-4 mt-4">
        <MedicalComplianceNotice industryId={industry} />
      </div>

      <main className="flex-1">
        <IndustryHero
          content={content}
          onStartDemo={scrollToLiveDemo}
          rightSlot={
            <div
              id="live-demo"
              className="rounded-xl border border-border/60 bg-card shadow-lg p-4 h-[520px] lg:h-[560px] flex flex-col"
            >
              <div className="pb-3">
                <h2 className="text-sm font-semibold text-foreground">
                  Talk to Aura right now
                </h2>
                <p className="text-xs text-muted-foreground">
                  See how she'd handle a real customer for a {content.label.toLowerCase()} business.
                </p>
              </div>
              <div className="flex-1 min-h-0">
                <LandingAIChat industryHint={content.label} />
              </div>
            </div>
          }
        />
        <IndustryValueProps content={content} />
        <RolePreviewRow industryId={industry} onTryDemo={startLiveDemo} />
        <IntegrationStatusPanel />

        {/* Industry ROI calculator */}
        <section className="py-10 bg-background">
          <div className="container max-w-6xl mx-auto px-4">
            <IndustryROICalculator industryId={industry} industryLabel={content.label} />
          </div>
        </section>

        {/* Social proof */}
        <TestimonialSection />

        {/* Pricing snapshot */}
        <section ref={pricingSectionRef} className="py-10 bg-background">
          <div className="container max-w-6xl mx-auto px-4">
            <div className="text-center mb-6">
              <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-2">
                Simple, transparent pricing
              </h2>
              <p className="text-sm text-muted-foreground">Pick the tier that fits. Cancel anytime.</p>
            </div>

            {/* Primary CTA — one clear choice for first-time visitors */}
            <div className="max-w-2xl mx-auto">
              <Card className="border-2 border-primary/60 bg-gradient-to-br from-primary/10 via-background to-secondary/10 shadow-lg">
                <CardContent className="p-6 md:p-8 text-center flex flex-col items-center gap-3">
                  <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-primary/15 text-primary text-[10px] font-semibold uppercase tracking-wider">
                    Recommended
                  </span>
                  <h3 className="text-xl md:text-2xl font-bold text-foreground">
                    Start your 60-day Live Demo on Aura Elite
                  </h3>
                  <p className="text-sm text-muted-foreground max-w-md">
                    Onboarding fee invoiced on day 31. First monthly fee charged on day 61. Cancel anytime before day 60.
                  </p>
                  <Button size="lg" variant="gradient" onClick={startLiveDemo} className="mt-1">
                    <Sparkles className="w-5 h-5" />
                    Start 60-day Live Demo
                  </Button>
                  <p className="text-xs text-muted-foreground max-w-md">
                    You'll get every feature during the demo. Downgrade to any tier before day 60.
                  </p>
                </CardContent>
              </Card>

              <div className="flex justify-center mt-4">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={handleToggleComparison}
                  className="text-muted-foreground hover:text-primary gap-1.5"
                >
                  {showComparison ? 'Hide plan comparison' : 'Compare all 4 plans'}
                  {showComparison ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </Button>
              </div>
            </div>

            <Collapsible open={showComparison} onOpenChange={setShowComparison}>
              <CollapsibleContent className="mt-6">
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
                          <div className="leading-tight">
                            <div className="text-[11px] text-muted-foreground line-through decoration-destructive/70">{t.originalPrice}</div>
                            <div className="text-xl font-bold text-primary">
                              {t.price}
                              <span className="text-[10px] font-normal text-muted-foreground">/mo</span>
                            </div>
                            <div className="text-[9px] uppercase tracking-wide font-semibold text-primary">Beta Pricing</div>
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
              </CollapsibleContent>
            </Collapsible>
          </div>
        </section>

        {/* Final CTA */}
        <section className="py-10 bg-gradient-to-br from-primary/15 via-background to-secondary/15">
          <div className="container max-w-3xl mx-auto px-4 text-center">
            <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-3">
              See it in action — for {content.label.toLowerCase()}.
            </h2>
            <p className="text-sm text-muted-foreground mb-4">
              60 days. Full access. Owner, technician, and customer views — all yours.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button size="lg" variant="gradient" onClick={scrollToLiveDemo}>
                <Sparkles className="w-5 h-5" /> Talk to Aura now
              </Button>
              <Button size="lg" variant="outline" asChild>
                <a href="tel:+15127372424">
                  <Phone className="w-5 h-5" /> Talk to a human
                </a>
              </Button>
            </div>
            <div className="mt-3">
              <button
                type="button"
                onClick={startLiveDemo}
                className="text-xs text-muted-foreground hover:text-primary underline underline-offset-4"
              >
                Skip demo — start signup
              </button>
            </div>
          </div>
        </section>
      </main>

      <PublicFooter />
    </div>
  );
}
