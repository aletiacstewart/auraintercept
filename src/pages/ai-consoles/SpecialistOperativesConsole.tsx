import { useState, useEffect, useRef, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { PageContainer } from '@/components/ui/page-container';
import { PageHeader } from '@/components/ui/page-header';
import { Card } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Stethoscope,
  FileCheck,
  Ruler,
  ShieldCheck,
  Send,
  Loader2,
  Bot,
  User,
  Sparkles,
  Lock,
  Info,
  Home,
  FileSignature,
  BarChart3,
  Scissors,
  Heart,
  UtensilsCrossed,
  CalendarClock,
  ListChecks,
  CalendarRange,
  MessageCircleHeart,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useSubscription } from '@/hooks/useSubscription';
import { useIndustryPack } from '@/hooks/useIndustryPack';
import { useMultiAgentChat } from '@/hooks/useMultiAgentChat';
import {
  INDUSTRY_SPECIALIST_OPERATIVES,
  SPECIALIST_LABELS,
  SPECIALIST_DESCRIPTIONS,
  tierAllowsSpecialists,
  type IndustrySpecialistOperative,
} from '@/lib/subscriptionAgentConfig';
import { cn } from '@/lib/utils';
import { HowToUseModal } from '@/components/ui/HowToUseModal';
import { HOW_TO_USE } from '@/lib/howToUseContent';

type SpecialistDef = {
  id: IndustrySpecialistOperative;
  icon: React.ElementType;
  examples: Record<string, string[]> & { default: string[] };
  usedBy: string;
};

const SPECIALISTS_RAW: SpecialistDef[] = [
  {
    id: 'diagnostic',
    icon: Stethoscope,
    usedBy: 'Customers (pre-visit triage), Technicians (on-site)',
    examples: {
      default: [
        'My AC is blowing warm air. What might be wrong?',
        'Here\'s a photo of the unit — what part do I likely need?',
        'Customer reports a burning smell from the panel. What should I check first?',
      ],
      saas_platform: [
        'A customer says the CSV export is failing halfway. What should I check first?',
        'Users report the dashboard is loading blank after login — walk me through triage.',
        'Webhook deliveries are silently failing for one tenant. Where do I start?',
      ],
    },
  },
  {
    id: 'permit_code',
    icon: FileCheck,
    usedBy: 'Dispatch, Technicians, Estimators',
    examples: {
      default: [
        'Do I need a permit to replace a 200A service panel in this jurisdiction?',
        'What code applies to a tankless water heater install in California?',
        'Walk me through pulling an HVAC permit for a residential job.',
      ],
      saas_platform: [
        'What compliance controls apply if we start processing EU customer data?',
        'Draft a SOC 2 evidence checklist for a change-management review.',
        'Which GDPR obligations kick in when we add a new subprocessor?',
      ],
    },
  },
  {
    id: 'site_survey',
    icon: Ruler,
    usedBy: 'Estimators, Sales, Customers (self-survey)',
    examples: {
      default: [
        'Generate a pre-install survey checklist for a roof replacement.',
        'What measurements do I need before quoting a mini-split install?',
        'Walk a homeowner through capturing photos for a remote estimate.',
      ],
      saas_platform: [
        'Build a discovery checklist for a new enterprise customer onboarding.',
        'What questions should I ask before scoping a custom integration?',
        'Draft a technical requirements survey for a prospect evaluating our API.',
      ],
    },
  },
  {
    id: 'insurance_claim',
    icon: ShieldCheck,
    usedBy: 'Customers (claim docs), Admins (claim review)',
    examples: {
      default: [
        'Help me document hail damage for my homeowner\'s claim.',
        'What information does the carrier need for a water-loss claim?',
        'Produce a claim-ready summary from these photos and dates.',
      ],
    },
  },
  // Real Estate
  { id: 'listing_writer', icon: Home, usedBy: 'Agents, Marketing',
    examples: { default: [
      'Write a 3-bullet listing description for a 4-bed colonial with a finished basement.',
      'Draft a punchy headline for an open house this Sunday at 2pm.',
      'Suggest 5 feature highlights from these photos and the MLS sheet.',
    ] } },
  { id: 'offer_drafter', icon: FileSignature, usedBy: 'Agents, Brokers',
    examples: { default: [
      'Draft an offer letter for a buyer at $625k with a 30-day close.',
      'Compose a counter-offer that splits the inspection credit.',
      'Add a financing contingency to this draft offer.',
    ] } },
  { id: 'comp_analyst', icon: BarChart3, usedBy: 'Agents, Pricing',
    examples: { default: [
      'Pull comps for 123 Maple St (3-bed, 1800 sqft) within 1 mile, last 90 days.',
      'Summarize how this listing prices vs. nearby actives and pendings.',
      'Show the price-per-sqft trend for this neighborhood over 12 months.',
    ] } },
  // Beauty & Wellness
  { id: 'style_consultant', icon: Scissors, usedBy: 'Stylists, Clients',
    examples: { default: [
      'Suggest 3 cuts that suit a heart-shaped face and fine hair.',
      'Recommend a color formula for a level 6 base going to honey-balayage.',
      'Build a 4-week treatment plan for damaged hair after bleach.',
    ] } },
  { id: 'loyalty_coach', icon: Heart, usedBy: 'Front desk, Marketing',
    examples: { default: [
      'Find clients who haven\'t rebooked in 8+ weeks and draft a personal note for each.',
      'Suggest a loyalty perk for a client on visit #10.',
      'Draft a friendly reminder for a client whose last color is fading.',
    ] } },
  // Restaurants
  { id: 'menu_writer', icon: UtensilsCrossed, usedBy: 'Owner, FOH manager',
    examples: { default: [
      'Write today\'s special: pan-seared halibut with lemon-caper butter.',
      'Draft dietary callouts (GF, V, DF) for these 6 menu items.',
      'Write a brunch menu intro in our brand voice.',
    ] } },
  { id: 'reservation_optimizer', icon: CalendarClock, usedBy: 'Host, Manager',
    examples: { default: [
      'Reshuffle tonight\'s 7pm bookings to seat the 6-top by the window.',
      'Find the best slot to add a 4-top tomorrow without breaking turn time.',
      'Suggest table moves to free a 2-top for a walk-in.',
    ] } },
  // Personal Assistant
  { id: 'task_triager', icon: ListChecks, usedBy: 'Assistants, Clients',
    examples: { default: [
      'Sort today\'s 12 inbound requests by urgency and owner.',
      'Flag anything past due and draft status update messages.',
      'Group these tasks into errands, calls, and research blocks.',
    ] } },
  { id: 'calendar_optimizer', icon: CalendarRange, usedBy: 'Assistants',
    examples: { default: [
      'Reshuffle this week to consolidate Tuesday meetings into one block.',
      'Find the best 90-min focus window for deep work tomorrow.',
      'Add 15-min travel buffers between in-person meetings.',
    ] } },
  // Universal booking-first
  { id: 'review_responder', icon: MessageCircleHeart, usedBy: 'Owner, Marketing',
    examples: { default: [
      'Draft a warm response to this 5-star Google review.',
      'Compose a professional reply to this 2-star review without sounding defensive.',
      'Respond to a Yelp review that mentions long wait times.',
    ] } },
];

// Index for lookup. Any specialist in the enum without a hand-written entry
// gets a sensible auto-generated fallback so new specialists don't crash the UI.
const SPECIALISTS: SpecialistDef[] = (INDUSTRY_SPECIALIST_OPERATIVES as readonly IndustrySpecialistOperative[]).map((id) => {
  const found = SPECIALISTS_RAW.find((s) => s.id === id);
  if (found) return found;
  return {
    id,
    icon: Sparkles,
    usedBy: 'Industry-specific',
    examples: { default: [SPECIALIST_DESCRIPTIONS[id] ?? 'Ask the specialist a question.'] },
  };
});

function SpecialistChat({ specialist, industryKey }: { specialist: SpecialistDef; industryKey?: string }) {
  const { companyId, user } = useAuth();
  const { messages, isLoading, sendMessage, clearMessages } = useMultiAgentChat({
    companyId: companyId ?? undefined,
    userId: user?.id,
    initialAgent: specialist.id,
  });
  const [input, setInput] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  useEffect(() => {
    clearMessages();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [specialist.id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;
    const msg = input;
    setInput('');
    await sendMessage(msg);
  };

  const Icon = specialist.icon;
  const examples =
    (industryKey && specialist.examples[industryKey]) || specialist.examples.default;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
      {/* Chat panel */}
      <Card className="lg:col-span-2 flex flex-col h-[600px] overflow-hidden border-border/60">
        <div className="flex items-center justify-between p-4 border-b border-border/60">
          <div className="flex items-center gap-2">
            <Icon className="h-5 w-5 text-primary" />
            <div>
              <div className="text-sm font-semibold">{SPECIALIST_LABELS[specialist.id]} Specialist</div>
              <div className="text-xs text-muted-foreground">{SPECIALIST_DESCRIPTIONS[specialist.id]}</div>
            </div>
          </div>
          <Button variant="ghost" size="sm" onClick={clearMessages}>Clear</Button>
        </div>

        <ScrollArea className="flex-1 p-4 max-h-[60vh]" ref={scrollRef}>
          {messages.length === 0 ? (
            <div className="text-center text-muted-foreground py-8">
              <Icon className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p className="font-medium text-foreground">Start a conversation</p>
              <p className="text-sm mt-1">Try one of the example prompts on the right →</p>
            </div>
          ) : (
            <div className="space-y-3">
              {messages.map((m, i) => (
                <div
                  key={i}
                  className={cn(
                    'flex gap-3 p-3 rounded-lg',
                    m.role === 'user' ? 'bg-primary/10 ml-6' : 'bg-muted mr-6',
                  )}
                >
                  <div
                    className={cn(
                      'h-7 w-7 rounded-full flex items-center justify-center shrink-0',
                      m.role === 'user' ? 'bg-primary' : 'bg-secondary',
                    )}
                  >
                    {m.role === 'user' ? (
                      <User className="h-4 w-4 text-primary-foreground" />
                    ) : (
                      <Bot className="h-4 w-4 text-secondary-foreground" />
                    )}
                  </div>
                  <div className="flex-1 whitespace-pre-wrap text-sm">{m.content}</div>
                </div>
              ))}
              {isLoading && (
                <div className="flex gap-3 p-3 rounded-lg bg-muted mr-6">
                  <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">Thinking…</span>
                </div>
              )}
            </div>
          )}
        </ScrollArea>

        <form onSubmit={handleSubmit} className="p-3 border-t border-border/60 flex gap-2">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={`Ask the ${SPECIALIST_LABELS[specialist.id]} specialist…`}
            disabled={isLoading}
          />
          <Button type="submit" size="icon" disabled={!input.trim() || isLoading}>
            <Send className="h-4 w-4" />
          </Button>
        </form>
      </Card>

      {/* Side panel: examples + usage */}
      <Card className="p-4 space-y-4 border-border/60">
        <div>
          <div className="text-xs uppercase tracking-wide text-muted-foreground mb-1">Used By</div>
          <p className="text-sm">{specialist.usedBy}</p>
        </div>
        <div>
          <div className="text-xs uppercase tracking-wide text-muted-foreground mb-2">Try one of these</div>
          <div className="space-y-2">
            {examples.map((ex, i) => (
              <button
                key={i}
                onClick={() => setInput(ex)}
                className="w-full text-left text-sm p-2 rounded-md border border-border/60 hover:border-primary/60 hover:bg-primary/5 transition-colors"
              >
                {ex}
              </button>
            ))}
          </div>
        </div>
        <div className="rounded-md bg-muted/50 p-3 text-xs text-muted-foreground">
          <Sparkles className="h-3.5 w-3.5 inline mr-1 text-primary" />
          Specialist responses are guided by your company's industry pack and knowledge base.
        </div>
      </Card>
    </div>
  );
}

export default function SpecialistOperativesConsole() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { userRole } = useAuth();
  const { subscriptionTier } = useSubscription();
  const { pack } = useIndustryPack();

  const isPlatformAdmin = userRole === 'platform_admin';
  const tierUnlocked = isPlatformAdmin || tierAllowsSpecialists(subscriptionTier);

  const industrySpecialists = useMemo(
    () => new Set(pack?.extra_operatives ?? []),
    [pack],
  );

  // Show only specialists in the user's industry pack (platform admin sees all).
  const visibleSpecialists = useMemo(() => {
    if (isPlatformAdmin) return SPECIALISTS;
    return SPECIALISTS.filter((s) => industrySpecialists.has(s.id));
  }, [isPlatformAdmin, industrySpecialists]);

  const initialTab = searchParams.get('agent') as IndustrySpecialistOperative | null;
  const defaultTab: IndustrySpecialistOperative =
    initialTab && visibleSpecialists.some((s) => s.id === initialTab)
      ? initialTab
      : visibleSpecialists[0]?.id ?? 'diagnostic';
  const [activeTab, setActiveTab] = useState<IndustrySpecialistOperative>(defaultTab);

  useEffect(() => {
    const next = new URLSearchParams(searchParams);
    next.set('agent', activeTab);
    setSearchParams(next, { replace: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab]);

  const activeSpec = SPECIALISTS.find(s => s.id === activeTab)!;
  const inIndustry = isPlatformAdmin || industrySpecialists.has(activeTab);

  return (
    <DashboardLayout>
      <PageContainer>
        <div className="space-y-6">
          <PageHeader
            icon={Sparkles}
            title="Specialist Operatives"
            description="Specialists for diagnostics, permits, surveys, and claims."
            featureColor="platform"
            badge={
              <Badge variant="outline" className="text-[10px]">
                Aura Pro & Elite
              </Badge>
            }
            action={
              <div className="grid w-full min-w-0 grid-cols-1 gap-2 min-[420px]:grid-cols-2 sm:flex sm:w-auto sm:flex-wrap sm:justify-end">
                <HowToUseModal {...HOW_TO_USE.specialistOperativesConsole} />
                <Button variant="outline" size="sm" onClick={() => navigate('/dashboard/ai-agents')} className="w-full sm:w-auto">
                  <span className="truncate">Manage Operatives</span>
                </Button>
              </div>
            }
          />

          {!tierUnlocked && (
            <Alert>
              <Lock className="h-4 w-4" />
              <AlertDescription>
                Specialist Operatives require <strong>Aura Pro</strong> or <strong>Aura Elite</strong>.{' '}
                <button onClick={() => navigate('/subscription')} className="underline font-medium">
                  Upgrade your plan
                </button>
              </AlertDescription>
            </Alert>
          )}

          {tierUnlocked && !inIndustry && visibleSpecialists.length > 0 && (
            <Alert>
              <Info className="h-4 w-4" />
              <AlertDescription>
                The <strong>{SPECIALIST_LABELS[activeTab]}</strong> specialist isn't auto-enabled for your
                industry pack ({pack?.label ?? 'Generic'}). You can still test it here, but customers and
                technicians won't see it surfaced automatically until your industry includes it.
              </AlertDescription>
            </Alert>
          )}

          {tierUnlocked && visibleSpecialists.length === 0 ? (
            <Card className="p-12 text-center border-border/60">
              <Sparkles className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
              <h3 className="font-semibold mb-1">No specialist operatives for your industry</h3>
              <p className="text-sm text-muted-foreground max-w-md mx-auto">
                Your industry pack ({pack?.label ?? 'Generic'}) doesn't include specialist operatives.
                Specialists like Diagnostic, Permit &amp; Code, Site Survey, and Insurance Claim are tailored
                to field-service and trades industries and aren't enabled here.
              </p>
            </Card>
          ) : (
          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as IndustrySpecialistOperative)}>
            <TabsList
              className={cn(
                'grid w-full',
                visibleSpecialists.length <= 2 && 'grid-cols-2',
                visibleSpecialists.length === 3 && 'grid-cols-3',
                visibleSpecialists.length >= 4 && 'grid-cols-2 md:grid-cols-4',
              )}
            >
              {visibleSpecialists.map((s) => {
                const Icon = s.icon;
                return (
                  <TabsTrigger key={s.id} value={s.id} className="gap-1.5">
                    <Icon className="h-3.5 w-3.5" />
                    <span className="truncate">{SPECIALIST_LABELS[s.id]}</span>
                  </TabsTrigger>
                );
              })}
            </TabsList>

            {visibleSpecialists.map((s) => (
              <TabsContent key={s.id} value={s.id} className="mt-4">
                {tierUnlocked ? (
                  <SpecialistChat specialist={s} />
                ) : (
                  <Card className="p-12 text-center border-border/60">
                    <Lock className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
                    <h3 className="font-semibold mb-1">{SPECIALIST_LABELS[s.id]} Specialist</h3>
                    <p className="text-sm text-muted-foreground mb-4">{SPECIALIST_DESCRIPTIONS[s.id]}</p>
                    <Button onClick={() => navigate('/subscription')}>Upgrade to Aura Pro</Button>
                  </Card>
                )}
              </TabsContent>
            ))}
          </Tabs>
          )}

          {/* Where this shows up summary */}
          <Card className="p-4 border-border/60">
            <div className="flex items-start gap-3">
              <Info className="h-4 w-4 text-primary mt-0.5" />
              <div className="text-sm">
                <p className="font-medium mb-1">Where Specialist Operatives appear</p>
                <ul className="text-muted-foreground text-xs space-y-1 list-disc pl-4">
                  <li>Customer Portal — Diagnostic, Site Survey, Insurance Claim quick actions for customers</li>
                  <li>Field Ops Console — Permit & Code, Site Survey for dispatch and estimators</li>
                  <li>Technician AI Console — Diagnostic and Permit & Code for on-site lookups</li>
                  <li>Business Management — Insurance Claim review for admins</li>
                </ul>
              </div>
            </div>
          </Card>
        </div>
      </PageContainer>
    </DashboardLayout>
  );
}