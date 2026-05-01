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

type SpecialistDef = {
  id: IndustrySpecialistOperative;
  icon: React.ElementType;
  examples: string[];
  usedBy: string;
};

const SPECIALISTS: SpecialistDef[] = [
  {
    id: 'diagnostic',
    icon: Stethoscope,
    usedBy: 'Customers (pre-visit triage), Technicians (on-site)',
    examples: [
      'My AC is blowing warm air. What might be wrong?',
      'Here\'s a photo of the unit — what part do I likely need?',
      'Customer reports a burning smell from the panel. What should I check first?',
    ],
  },
  {
    id: 'permit_code',
    icon: FileCheck,
    usedBy: 'Dispatch, Technicians, Estimators',
    examples: [
      'Do I need a permit to replace a 200A service panel in this jurisdiction?',
      'What code applies to a tankless water heater install in California?',
      'Walk me through pulling an HVAC permit for a residential job.',
    ],
  },
  {
    id: 'site_survey',
    icon: Ruler,
    usedBy: 'Estimators, Sales, Customers (self-survey)',
    examples: [
      'Generate a pre-install survey checklist for a roof replacement.',
      'What measurements do I need before quoting a mini-split install?',
      'Walk a homeowner through capturing photos for a remote estimate.',
    ],
  },
  {
    id: 'insurance_claim',
    icon: ShieldCheck,
    usedBy: 'Customers (claim docs), Admins (claim review)',
    examples: [
      'Help me document hail damage for my homeowner\'s claim.',
      'What information does the carrier need for a water-loss claim?',
      'Produce a claim-ready summary from these photos and dates.',
    ],
  },
];

function SpecialistChat({ specialist }: { specialist: SpecialistDef }) {
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
            {specialist.examples.map((ex, i) => (
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
  const { tier } = useSubscription();
  const { pack } = useIndustryPack();

  const isPlatformAdmin = userRole === 'platform_admin';
  const tierUnlocked = isPlatformAdmin || tierAllowsSpecialists(tier);

  const industrySpecialists = useMemo(
    () => new Set(pack?.extra_operatives ?? []),
    [pack],
  );

  const initialTab = searchParams.get('agent') as IndustrySpecialistOperative | null;
  const [activeTab, setActiveTab] = useState<IndustrySpecialistOperative>(
    initialTab && (INDUSTRY_SPECIALIST_OPERATIVES as readonly string[]).includes(initialTab)
      ? initialTab
      : 'diagnostic',
  );

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
            description="Industry-specific AI specialists for diagnostics, permits, surveys, and claims"
            featureColor="config"
            badge={
              <Badge variant="outline" className="text-[10px]">
                Aura Pro & Elite
              </Badge>
            }
            action={
              <Button variant="outline" size="sm" onClick={() => navigate('/dashboard/ai-agents')}>
                Manage Operatives
              </Button>
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

          {tierUnlocked && !inIndustry && (
            <Alert>
              <Info className="h-4 w-4" />
              <AlertDescription>
                The <strong>{SPECIALIST_LABELS[activeTab]}</strong> specialist isn't auto-enabled for your
                industry pack ({pack?.label ?? 'Generic'}). You can still test it here, but customers and
                technicians won't see it surfaced automatically until your industry includes it.
              </AlertDescription>
            </Alert>
          )}

          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as IndustrySpecialistOperative)}>
            <TabsList className="grid grid-cols-2 md:grid-cols-4 w-full">
              {SPECIALISTS.map((s) => {
                const Icon = s.icon;
                return (
                  <TabsTrigger key={s.id} value={s.id} className="gap-1.5">
                    <Icon className="h-3.5 w-3.5" />
                    <span className="truncate">{SPECIALIST_LABELS[s.id]}</span>
                  </TabsTrigger>
                );
              })}
            </TabsList>

            {SPECIALISTS.map((s) => (
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