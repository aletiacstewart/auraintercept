import { useState, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { PageContainer } from '@/components/ui/page-container';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { 
  Building2, 
  Users, 
  Palette, 
  UserPlus, 
  Key, 
  Globe, 
  HelpCircle,
  CheckCircle2,
  ArrowRight,
  Shield,
  Bot,
  MessageCircle,
  Mic,
  ArrowLeft,
  Trash2,
  Check,
  LogOut,
  Keyboard,
  AlertCircle,
  Lock,
  Sparkles,
  Share2,
  Calendar,
  BarChart3
} from 'lucide-react';
import { PageHeader } from '@/components/ui/page-header';
import { useSubscription } from '@/hooks/useSubscription';
import { 
  CONSOLE_HELP_CONFIG, 
  TIER_HELP_DESCRIPTIONS,
  getConsolesForTier,
  getFilteredFeatures,
  getFilteredAgents
} from '@/lib/helpContentConfig';
import { SubscriptionTier, TIER_AGENT_CONFIG } from '@/lib/subscriptionAgentConfig';
import { useIndustryPack } from '@/hooks/useIndustryPack';
import { getIndustryUseCases } from '@/lib/industryHelpPrompts';
import { getIndustryConsoleConfig } from '@/lib/industryHelpContent';
import { getNavLabels } from '@/lib/industryNavLabels';

type MainTabType = 'ai-agents' | 'voice' | 'company-employee' | 'faq';

export default function Help() {
  const { userRole } = useAuth();
  const { subscriptionTier, inTrial } = useSubscription();
  const { pack: industryPack } = useIndustryPack();
  const isPlatformAdmin = userRole === 'platform_admin';
  const navLabels = getNavLabels(industryPack);
  const teamMember = navLabels.teamMemberNoun;
  const teamMembersLower = `${teamMember.toLowerCase()}s`;
  const jobNounLower = navLabels.jobNoun.toLowerCase();
  const customerNoun = (industryPack?.terminology?.customer as string) || 'Customer';
  const [searchParams, setSearchParams] = useSearchParams();
  
  // Effective tier for display: platform admin sees all; everyone else (including
  // trial users) sees the help content for their selected plan.
  const effectiveTier: SubscriptionTier = isPlatformAdmin ? 'command' : (subscriptionTier || 'starter');
  
  // Get available consoles based on tier
  const availableConsoles = useMemo(() => {
    return getConsolesForTier(effectiveTier);
  }, [effectiveTier]);
  
  const consoleParam = searchParams.get('console');
  const [selectedConsoleId, setSelectedConsoleId] = useState(
    consoleParam && availableConsoles.some(c => c.id === consoleParam) 
      ? consoleParam 
      : availableConsoles[0]?.id || 'customer_portal'
  );
  
  const mainTabParam = searchParams.get('tab') as MainTabType | null;
  const [mainTab, setMainTab] = useState<MainTabType>(mainTabParam || 'ai-agents');

  const handleConsoleChange = (consoleId: string) => {
    setSelectedConsoleId(consoleId);
    setSearchParams({ console: consoleId, tab: 'ai-agents' });
  };

  const handleMainTabChange = (value: MainTabType) => {
    setMainTab(value);
    const newParams = new URLSearchParams(searchParams);
    newParams.set('tab', value);
    setSearchParams(newParams);
  };

  // Get current console config
  const currentConsole = useMemo(() => {
    return CONSOLE_HELP_CONFIG.find(c => c.id === selectedConsoleId) || CONSOLE_HELP_CONFIG[0];
  }, [selectedConsoleId]);
  
  const ConsoleIcon = currentConsole.icon;
  
  // Get filtered content for current tier
  const filteredFeatures = useMemo(() => {
    const industryOverride = getIndustryConsoleConfig(currentConsole, industryPack);
    if (industryOverride.features) return industryOverride.features;
    return getFilteredFeatures(currentConsole, effectiveTier);
  }, [currentConsole, effectiveTier, industryPack]);

  // Industry-aware description + tabs
  const consoleOverride = useMemo(() => {
    return getIndustryConsoleConfig(currentConsole, industryPack);
  }, [currentConsole, industryPack]);
  
  const filteredAgents = useMemo(() => {
    return getFilteredAgents(currentConsole, effectiveTier);
  }, [currentConsole, effectiveTier]);

  // Industry-aware example prompts
  const industryUseCases = useMemo(() => {
    return getIndustryUseCases(currentConsole.id, industryPack, currentConsole.useCases);
  }, [currentConsole, industryPack]);

  // Tier display info
  const tierInfo = TIER_HELP_DESCRIPTIONS[effectiveTier];

  return (
    <DashboardLayout>
      <PageContainer>
        <div className="space-y-8">
          {/* Header */}
          <PageHeader
            icon={HelpCircle}
            title="Help & Documentation"
            description="Quick guide to your AI agents, consoles, and platform features"
            featureColor="overview"
          />

          {/* Tier Badge */}
          <div className="flex items-center gap-3">
            <Badge variant="outline" className="px-3 py-1.5 text-sm font-medium bg-primary/10 border-primary/30">
              <Sparkles className="w-3.5 h-3.5 mr-1.5" />
              {tierInfo.title}
            </Badge>
            {inTrial && (
              <Badge variant="secondary" className="px-3 py-1.5 text-sm">
                Trial: Full Access
              </Badge>
            )}
            <span className="text-sm text-muted-foreground">{tierInfo.description}</span>
          </div>

          {/* Main Tabs */}
          <Tabs value={mainTab} onValueChange={(v) => handleMainTabChange(v as MainTabType)}>
            <TabsList>
              <TabsTrigger value="ai-agents" className="flex items-center gap-1.5">
                <Bot className="h-3.5 w-3.5" />
                AI Agents
              </TabsTrigger>
              <TabsTrigger value="voice" className="flex items-center gap-1.5">
                <Mic className="h-3.5 w-3.5" />
                Ask Aura
              </TabsTrigger>
              <TabsTrigger value="company-employee" className="flex items-center gap-1.5">
                <Building2 className="h-3.5 w-3.5" />
                Company & Employees
              </TabsTrigger>
              <TabsTrigger value="faq" className="flex items-center gap-1.5">
                <HelpCircle className="h-3.5 w-3.5" />
                FAQs
              </TabsTrigger>
            </TabsList>

            {/* AI Agents Tab */}
            <TabsContent value="ai-agents" className="space-y-6 mt-6">
              {/* Console Type Selector */}
              <Tabs value={selectedConsoleId} onValueChange={handleConsoleChange}>
                <TabsList className="justify-start flex-wrap h-auto gap-1">
                  {availableConsoles.map((console) => {
                    const Icon = console.icon;
                    return (
                      <TabsTrigger key={console.id} value={console.id}>
                        <Icon className="h-4 w-4 mr-2" />
                        {console.title}
                      </TabsTrigger>
                    );
                  })}
                </TabsList>
              </Tabs>

              {/* Console-Specific Guide */}
              <Card>
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                      <ConsoleIcon className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <CardTitle>{currentConsole.title}</CardTitle>
                      <CardDescription className="text-card-foreground/70">{consoleOverride.description}</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Quick Action Tabs */}
                  {consoleOverride.tabs && consoleOverride.tabs.length > 0 && (
                    <div>
                      <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
                        <Keyboard className="w-5 h-5 text-amber-500" />
                        Quick Action Tabs
                      </h3>
                      <div className="flex flex-wrap gap-2 ml-7">
                        {consoleOverride.tabs.map((tab, index) => (
                          <Badge key={index} variant="outline" className="text-xs px-2 py-1 text-foreground border-foreground/30">
                            {tab}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Agents */}
                  <div>
                    <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
                      <Bot className="w-5 h-5 text-primary" />
                      AI Agents in this Console
                    </h3>
                    <div className="flex flex-wrap gap-2 ml-7">
                      {filteredAgents.map((agent, index) => (
                        <Badge key={index} variant="secondary" className="text-sm">
                          {agent}
                        </Badge>
                      ))}
                      {filteredAgents.length === 0 && (
                        <p className="text-sm text-muted-foreground">No agents available for your current plan.</p>
                      )}
                    </div>
                  </div>

                  {/* Features */}
                  <div>
                    <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
                      <CheckCircle2 className="w-5 h-5 text-green-500" />
                      What This Console Can Do
                    </h3>
                    <ul className="space-y-2 ml-7">
                      {filteredFeatures.map((feature, index) => (
                        <li key={index} className="flex items-start gap-2 text-sm text-card-foreground/80">
                          <ArrowRight className="w-4 h-4 mt-0.5 text-card-foreground/50 flex-shrink-0" />
                          <span>{feature}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Example Prompts */}
                  <div>
                    <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
                      <MessageCircle className="w-5 h-5 text-cyan-400" />
                      Example Prompts
                    </h3>
                    <div className="ml-7 space-y-2">
                      {industryUseCases.map((useCase, index) => (
                        <div key={index} className="bg-muted/50 px-3 py-2 rounded-lg text-sm">
                          {useCase}
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>

            </TabsContent>

            {/* Aura Voice Tab - Available for ALL tiers */}
            <TabsContent value="voice" className="space-y-6 mt-6">
              <Card>
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-aura-emerald/20 flex items-center justify-center">
                      <Mic className="w-5 h-5 text-aura-emerald" />
                    </div>
                    <div>
                      <CardTitle>Ask Aura - Hands-Free Mode</CardTitle>
                      <CardDescription className="text-card-foreground/70">Control the platform with your voice using the Web Speech API</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Activation */}
                  <div>
                    <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
                      <CheckCircle2 className="w-5 h-5 text-green-500" />
                      How to Activate
                    </h3>
                    <div className="ml-7 space-y-3">
                      <div className="flex items-start gap-3">
                        <Badge variant="outline" className="h-6 w-6 rounded-full p-0 flex items-center justify-center flex-shrink-0">1</Badge>
                        <div>
                          <p className="font-medium text-card-foreground">Toggle in Sidebar</p>
                          <p className="text-sm text-card-foreground/70">Look for the <strong className="text-aura-emerald">Ask Aura</strong> panel at the top of the sidebar and flip the switch.</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-3">
                        <Badge variant="outline" className="h-6 w-6 rounded-full p-0 flex items-center justify-center flex-shrink-0">2</Badge>
                        <div>
                          <p className="font-medium text-card-foreground">Keyboard Shortcut</p>
                          <p className="text-sm text-card-foreground/70">Press <kbd className="px-1.5 py-0.5 rounded bg-muted font-mono text-xs">Ctrl</kbd> + <kbd className="px-1.5 py-0.5 rounded bg-muted font-mono text-xs">Shift</kbd> + <kbd className="px-1.5 py-0.5 rounded bg-muted font-mono text-xs">V</kbd> from anywhere.</p>
                        </div>
                      </div>
                      <p className="text-sm text-card-foreground/70 mt-2">When enabled, a <strong className="text-aura-emerald">green pulsing indicator</strong> appears and a live transcription overlay shows at the bottom of the screen.</p>
                    </div>
                  </div>

                  {/* Navigation Commands */}
                  <div>
                    <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
                      <Mic className="w-5 h-5 text-aura-emerald" />
                      Navigation Commands
                    </h3>
                    <div className="ml-7 grid gap-2">
                      {[
                        { say: '"Next" or "Tab"', action: 'Move to next input field', icon: ArrowRight, color: 'text-cyan-400' },
                        { say: '"Back" or "Previous"', action: 'Move to previous field', icon: ArrowLeft, color: 'text-purple-500' },
                        { say: '"Clear" or "Erase"', action: 'Clear current field', icon: Trash2, color: 'text-orange-500' },
                        { say: '"Save Job" or "Submit"', action: 'Submit the current form', icon: Check, color: 'text-green-500' },
                        { say: '"Clock Out" or "Logout"', action: 'End your session', icon: LogOut, color: 'text-red-500' },
                      ].map((cmd) => {
                        const Icon = cmd.icon;
                        return (
                          <div key={cmd.say} className="flex items-center gap-3 p-2 rounded-lg bg-muted/50">
                            <Icon className={`w-4 h-4 ${cmd.color}`} />
                            <span className="font-mono text-sm">{cmd.say}</span>
                            <ArrowRight className="w-3 h-3 text-muted-foreground" />
                            <span className="text-sm text-card-foreground/70">{cmd.action}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Dictation Mode */}
                  <div>
                    <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
                      <MessageCircle className="w-5 h-5 text-cyan-400" />
                      Dictation Mode
                    </h3>
                    <div className="ml-7 space-y-2 text-sm text-card-foreground/80">
                      <p>Click into any text field to start dictating:</p>
                      <ul className="space-y-2 mt-2">
                        <li className="flex items-start gap-2">
                          <ArrowRight className="w-4 h-4 mt-0.5 text-card-foreground/50 flex-shrink-0" />
                          <span>Field glows with a <strong className="text-aura-emerald">green pulse</strong> to show it's listening</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <ArrowRight className="w-4 h-4 mt-0.5 text-card-foreground/50 flex-shrink-0" />
                          <span>Speak naturally - text appears in real-time</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <ArrowRight className="w-4 h-4 mt-0.5 text-card-foreground/50 flex-shrink-0" />
                          <span>Mix dictation with commands: <code className="bg-muted px-1.5 py-0.5 rounded text-xs">"123 Main Street next"</code></span>
                        </li>
                      </ul>
                    </div>
                  </div>

                  {/* Pro Tips */}
                  <div>
                    <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
                      <Keyboard className="w-5 h-5 text-amber-500" />
                      Pro Tips
                    </h3>
                    <ul className="ml-7 space-y-2 text-sm text-card-foreground/80">
                      <li className="flex items-start gap-2">
                        <CheckCircle2 className="w-4 h-4 mt-0.5 text-aura-emerald flex-shrink-0" />
                        <span>Pause briefly after commands for better recognition</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <CheckCircle2 className="w-4 h-4 mt-0.5 text-aura-emerald flex-shrink-0" />
                        <span>Speak clearly at a natural pace - no need to slow down</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <CheckCircle2 className="w-4 h-4 mt-0.5 text-aura-emerald flex-shrink-0" />
                        <span>Works in all forms across the platform</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <CheckCircle2 className="w-4 h-4 mt-0.5 text-aura-emerald flex-shrink-0" />
                        <span>Perfect for {teamMembersLower} on the go</span>
                      </li>
                    </ul>
                  </div>

                  {/* Troubleshooting */}
                  <div>
                    <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
                      <AlertCircle className="w-5 h-5 text-destructive" />
                      Troubleshooting
                    </h3>
                    <Accordion type="single" collapsible className="ml-7">
                      <AccordionItem value="mic-permissions">
                        <AccordionTrigger>Microphone not working?</AccordionTrigger>
                        <AccordionContent>
                          <p className="text-card-foreground/70">Check that your browser has microphone permissions. Click the lock icon in your browser's address bar and ensure microphone access is allowed for this site.</p>
                        </AccordionContent>
                      </AccordionItem>
                      <AccordionItem value="browser-support">
                        <AccordionTrigger>Voice toggle not appearing?</AccordionTrigger>
                        <AccordionContent>
                          <p className="text-card-foreground/70">Ask Aura requires the Web Speech API. Please use <strong className="text-card-foreground">Chrome</strong>, <strong className="text-card-foreground">Edge</strong>, or <strong className="text-card-foreground">Safari</strong>. Firefox is not supported.</p>
                        </AccordionContent>
                      </AccordionItem>
                      <AccordionItem value="commands-not-recognized">
                        <AccordionTrigger>Commands not recognized?</AccordionTrigger>
                        <AccordionContent>
                          <p className="text-card-foreground/70">Speak slightly slower and use the exact command phrases listed above. Ensure you're in a quiet environment with minimal background noise.</p>
                        </AccordionContent>
                      </AccordionItem>
                    </Accordion>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Company & Employees Tab - Available for ALL company dashboards and platform admin */}
            <TabsContent value="company-employee" className="space-y-6 mt-6">
              {/* For Company Admins */}
              <Card>
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                      <Building2 className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <CardTitle>For Company Admins</CardTitle>
                      <CardDescription className="text-card-foreground/70">Getting started and managing your company</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Getting Started */}
                  <div>
                    <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
                      <CheckCircle2 className="w-5 h-5 text-green-500" />
                      Getting Started
                    </h3>
                    <div className="space-y-4 ml-7">
                      <div className="flex gap-3">
                        <Badge variant="outline" className="h-6 w-6 rounded-full p-0 flex items-center justify-center flex-shrink-0">1</Badge>
                        <div>
                          <p className="font-medium text-card-foreground">Sign Up</p>
                          <p className="text-sm text-card-foreground/70">Visit the sign-in page and select "Company Sign Up" to create your company account. You'll receive a 60-Day Live Trial with full access to all features.</p>
                        </div>
                      </div>
                      <div className="flex gap-3">
                        <Badge variant="outline" className="h-6 w-6 rounded-full p-0 flex items-center justify-center flex-shrink-0">2</Badge>
                        <div>
                          <p className="font-medium text-card-foreground">Access Your Dashboard</p>
                          <p className="text-sm text-card-foreground/70">After signing in, you'll be automatically redirected to your dashboard. This is your central hub for managing appointments, AI agents, and more.</p>
                        </div>
                      </div>
                      <div className="flex gap-3">
                        <Badge variant="outline" className="h-6 w-6 rounded-full p-0 flex items-center justify-center flex-shrink-0">3</Badge>
                        <div>
                          <p className="font-medium text-card-foreground">Complete Quick Setup</p>
                          <p className="text-sm text-card-foreground/70">Follow the Quick Setup wizard to configure your knowledge base, business hours, services, and AI agents.</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Branding */}
                  <div>
                    <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
                      <Palette className="w-5 h-5 text-purple-500" />
                      Setting Up Your Brand
                    </h3>
                    <div className="ml-7 space-y-3">
                      <p className="text-sm text-card-foreground/70">Navigate to <strong className="text-card-foreground">Settings → Branding</strong> to customize:</p>
                      <ul className="space-y-2 text-sm">
                        <li className="flex items-start gap-2 text-card-foreground/80">
                          <ArrowRight className="w-4 h-4 mt-0.5 text-card-foreground/50 flex-shrink-0" />
                          <span><strong className="text-card-foreground">Company Logo:</strong> Upload your logo (recommended size: 200x200px).</span>
                        </li>
                        <li className="flex items-start gap-2 text-card-foreground/80">
                          <ArrowRight className="w-4 h-4 mt-0.5 text-card-foreground/50 flex-shrink-0" />
                          <span><strong className="text-card-foreground">Primary Color:</strong> Set your brand's main color for buttons and accents.</span>
                        </li>
                        <li className="flex items-start gap-2 text-card-foreground/80">
                          <ArrowRight className="w-4 h-4 mt-0.5 text-card-foreground/50 flex-shrink-0" />
                          <span><strong className="text-card-foreground">Secondary Color:</strong> A complementary color for additional UI elements.</span>
                        </li>
                      </ul>
                    </div>
                  </div>

                  {/* Inviting Team */}
                  <div>
                    <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
                      <UserPlus className="w-5 h-5 text-cyan-400" />
                      Inviting Your Team
                    </h3>
                    <div className="ml-7 space-y-3">
                      <p className="text-sm text-card-foreground/70">To add employees to your company:</p>
                      <div className="space-y-4">
                        <div className="flex gap-3">
                          <Badge variant="outline" className="h-6 w-6 rounded-full p-0 flex items-center justify-center flex-shrink-0">1</Badge>
                          <div>
                            <p className="font-medium text-card-foreground">Generate Registration Code</p>
                            <p className="text-sm text-card-foreground/70">Go to <strong className="text-card-foreground">Employees</strong> page and click "Add Employee" to generate a unique registration code.</p>
                          </div>
                        </div>
                        <div className="flex gap-3">
                          <Badge variant="outline" className="h-6 w-6 rounded-full p-0 flex items-center justify-center flex-shrink-0">2</Badge>
                          <div>
                            <p className="font-medium text-card-foreground">Share with Employee</p>
                            <p className="text-sm text-card-foreground/70">Share the code with your employee. They'll need this to register.</p>
                          </div>
                        </div>
                        <div className="flex gap-3">
                          <Badge variant="outline" className="h-6 w-6 rounded-full p-0 flex items-center justify-center flex-shrink-0">3</Badge>
                          <div>
                            <p className="font-medium text-card-foreground">Employee Signs Up</p>
                            <p className="text-sm text-card-foreground/70">Employee visits the sign-in page, selects "Employee Sign Up", and enters the registration code to join your company.</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* For Employees */}
              <Card>
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-secondary/10 flex items-center justify-center">
                      <Users className="w-5 h-5 text-secondary" />
                    </div>
                    <div>
                      <CardTitle>For Employees & Technicians</CardTitle>
                      <CardDescription className="text-card-foreground/70">How to join your company and access your dashboard</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Signing Up */}
                  <div>
                    <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
                      <Key className="w-5 h-5 text-amber-500" />
                      Signing Up with a Registration Code
                    </h3>
                    <div className="space-y-4 ml-7">
                      <div className="flex gap-3">
                        <Badge variant="outline" className="h-6 w-6 rounded-full p-0 flex items-center justify-center flex-shrink-0">1</Badge>
                        <div>
                          <p className="font-medium text-card-foreground">Get Your Code</p>
                          <p className="text-sm text-card-foreground/70">Your company admin will provide you with a unique registration code. This code links your account to your company.</p>
                        </div>
                      </div>
                      <div className="flex gap-3">
                        <Badge variant="outline" className="h-6 w-6 rounded-full p-0 flex items-center justify-center flex-shrink-0">2</Badge>
                        <div>
                          <p className="font-medium text-card-foreground">Visit the Sign Up Page</p>
                          <p className="text-sm text-card-foreground/70">Go to the sign-in page and select "Employee Sign Up" at the bottom of the form.</p>
                        </div>
                      </div>
                      <div className="flex gap-3">
                        <Badge variant="outline" className="h-6 w-6 rounded-full p-0 flex items-center justify-center flex-shrink-0">3</Badge>
                        <div>
                          <p className="font-medium text-card-foreground">Enter Your Details</p>
                          <p className="text-sm text-card-foreground/70">Fill in your email, password, full name, and the registration code provided by your admin.</p>
                        </div>
                      </div>
                      <div className="flex gap-3">
                        <Badge variant="outline" className="h-6 w-6 rounded-full p-0 flex items-center justify-center flex-shrink-0">4</Badge>
                        <div>
                          <p className="font-medium text-card-foreground">Access Your Dashboard</p>
                          <p className="text-sm text-card-foreground/70">Once registered, you'll be redirected to your dashboard. {teamMember}s go to the mobile-optimized {navLabels.techView}.</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Technician Features */}
                  <div>
                    <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
                      <Shield className="w-5 h-5 text-green-500" />
                      {teamMember} Dashboard Features
                    </h3>
                    <div className="ml-7 space-y-2 text-sm">
                      <p className="text-card-foreground/70">As a {teamMember.toLowerCase()}, your mobile-optimized dashboard includes:</p>
                      <ul className="space-y-2 mt-2">
                        <li className="flex items-start gap-2 text-card-foreground/80">
                          <ArrowRight className="w-4 h-4 mt-0.5 text-card-foreground/50 flex-shrink-0" />
                          <span><strong className="text-card-foreground">{navLabels.jobNoun} Queue:</strong> View and manage assigned {jobNounLower}s, update status</span>
                        </li>
                        <li className="flex items-start gap-2 text-card-foreground/80">
                          <ArrowRight className="w-4 h-4 mt-0.5 text-card-foreground/50 flex-shrink-0" />
                          <span><strong className="text-card-foreground">AI Console:</strong> Access the {navLabels.techView} AI agent for support</span>
                        </li>
                        <li className="flex items-start gap-2 text-card-foreground/80">
                          <ArrowRight className="w-4 h-4 mt-0.5 text-card-foreground/50 flex-shrink-0" />
                          <span><strong className="text-card-foreground">Calendar:</strong> View your schedule and upcoming appointments</span>
                        </li>
                        <li className="flex items-start gap-2 text-card-foreground/80">
                          <ArrowRight className="w-4 h-4 mt-0.5 text-card-foreground/50 flex-shrink-0" />
                          <span><strong className="text-card-foreground">Availability:</strong> Set your working hours and time off</span>
                        </li>
                      </ul>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* FAQ Tab - Available for ALL company dashboards and platform admin */}
            <TabsContent value="faq" className="space-y-6 mt-6">
              <Card>
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center">
                      <HelpCircle className="w-5 h-5 text-accent" />
                    </div>
                    <div>
                      <CardTitle>Frequently Asked Questions</CardTitle>
                      <CardDescription className="text-card-foreground/70">Common questions and answers</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <Accordion type="single" collapsible className="w-full">
                    {/* Getting Started */}
                    <AccordionItem value="trial">
                      <AccordionTrigger>
                        <div className="flex items-center gap-2">
                          <Sparkles className="w-4 h-4" />
                          What's included in the free trial?
                        </div>
                      </AccordionTrigger>
                      <AccordionContent>
                        <p className="text-card-foreground/70">
                          Your 60-Day Live Trial includes <strong className="text-card-foreground">full access to all Aura Elite tier features</strong>. This means all 10 AI Operatives, all 7 consoles, and all platform features. After your trial ends, you'll be prompted to select a subscription plan.
                        </p>
                      </AccordionContent>
                    </AccordionItem>

                    <AccordionItem value="chat-widget">
                      <AccordionTrigger>
                        <div className="flex items-center gap-2">
                          <MessageCircle className="w-4 h-4" />
                          How do customers access my AI chat?
                        </div>
                      </AccordionTrigger>
                      <AccordionContent>
                        <div className="text-card-foreground/70 space-y-2">
                          <p>There are three ways customers can interact with your AI agent:</p>
                          <ul className="list-disc ml-5 space-y-1">
                            <li><strong className="text-card-foreground">Embeddable Widget:</strong> Get the embed code from <strong>Chat Widget</strong> in your dashboard. Add this to your website.</li>
                            <li><strong className="text-card-foreground">Public Chat Link:</strong> Share your unique public chat URL directly with customers.</li>
                            <li><strong className="text-card-foreground">AI Voice:</strong> Customers can speak with your AI via the voice button in the chat widget.</li>
                          </ul>
                        </div>
                      </AccordionContent>
                    </AccordionItem>

                    {/* AI Agents & Features */}
                    <AccordionItem value="ai-agents">
                      <AccordionTrigger>
                        <div className="flex items-center gap-2">
                          <Bot className="w-4 h-4" />
                          What AI agents are included in each plan?
                        </div>
                      </AccordionTrigger>
                      <AccordionContent>
                        <div className="text-card-foreground/70 space-y-3">
                          <ul className="space-y-3 text-sm">
                            <li>
                              <strong className="text-card-foreground">Aura Core (<span className="line-through text-muted-foreground">$697</span> $497/mo · Beta Pricing):</strong>
                              <p className="mt-1">5 AI Operatives: Receptionist, Customer Journey, Outreach, Creative Content, Web Presence. Perfect for solo operators.</p>
                            </li>
                            <li>
                              <strong className="text-card-foreground">Aura Boost (<span className="line-through text-muted-foreground">$1,394</span> $994/mo · Beta Pricing):</strong>
                              <p className="mt-1">7 AI Operatives: All Core operatives + Dispatch + Field Navigation. Adds field operations and advanced scheduling.</p>
                            </li>
                            <li>
                              <strong className="text-card-foreground">Aura Pro (<span className="line-through text-muted-foreground">$2,788</span> $1,988/mo · Beta Pricing):</strong>
                              <p className="mt-1">10 AI Operatives: All Boost operatives + Business Finance, Analytics Intelligence, Admin. Full business management automation.</p>
                            </li>
                            <li>
                              <strong className="text-card-foreground">Aura Elite (<span className="line-through text-muted-foreground">$5,576</span> $3,979/mo · Beta Pricing):</strong>
                              <p className="mt-1">All 10 AI Operatives (24 agents) — full suite including Invoice, Inventory, Insights, Revenue, Forecast + Predictive AI Hub.</p>
                            </li>
                          </ul>
                        </div>
                      </AccordionContent>
                    </AccordionItem>

                    <AccordionItem value="voice-calling">
                      <AccordionTrigger>
                        <div className="flex items-center gap-2">
                          <Mic className="w-4 h-4" />
                          How does AI Voice work?
                        </div>
                      </AccordionTrigger>
                      <AccordionContent>
                        <div className="text-card-foreground/70 space-y-2">
                          <p>AI Voice is included in all paid tiers and provides:</p>
                          <ul className="list-disc ml-5 space-y-1">
                            <li><strong className="text-card-foreground">Voice Chat:</strong> Customers speak with your AI via the chat widget microphone</li>
                            <li><strong className="text-card-foreground">Outbound Calls:</strong> AI makes reminder calls, follow-ups, and review requests automatically</li>
                            <li><strong className="text-card-foreground">Natural Voice:</strong> Powered by ElevenLabs for human-like conversations</li>
                          </ul>
                          <p className="mt-2">Configure voice settings in <strong className="text-card-foreground">Settings → Integrations → ElevenLabs</strong>.</p>
                        </div>
                      </AccordionContent>
                    </AccordionItem>

                    {/* Knowledge Base */}
                    <AccordionItem value="knowledge-base">
                      <AccordionTrigger>
                        <div className="flex items-center gap-2">
                          <Globe className="w-4 h-4" />
                          How do I train my AI agents?
                        </div>
                      </AccordionTrigger>
                      <AccordionContent>
                        <div className="text-card-foreground/70 space-y-2">
                          <p>Your AI agents learn from your Knowledge Base. Go to <strong className="text-card-foreground">Knowledge Base</strong> in the sidebar:</p>
                          <ul className="list-disc ml-5 space-y-1">
                            <li><strong className="text-card-foreground">Services:</strong> Add your service catalog with descriptions, pricing, and duration</li>
                            <li><strong className="text-card-foreground">FAQs:</strong> Common questions your customers ask</li>
                            <li><strong className="text-card-foreground">Business Hours:</strong> Your operating schedule</li>
                            <li><strong className="text-card-foreground">Documents:</strong> Upload PDFs, manuals, or policies for AI reference</li>
                            <li><strong className="text-card-foreground">AI Profile:</strong> Set your brand voice, industry, and target audience</li>
                          </ul>
                        </div>
                      </AccordionContent>
                    </AccordionItem>

                    {/* Social Media */}
                    <AccordionItem value="social-media">
                      <AccordionTrigger>
                        <div className="flex items-center gap-2">
                          <Share2 className="w-4 h-4" />
                          What social platforms are supported?
                        </div>
                      </AccordionTrigger>
                      <AccordionContent>
                        <div className="text-card-foreground/70 space-y-2">
                          <p>Social Media Ops (Aura Elite tier) supports 6 platforms:</p>
                          <ul className="list-disc ml-5 space-y-1">
                            <li><strong className="text-card-foreground">Instagram</strong> - Posts with character optimization</li>
                            <li><strong className="text-card-foreground">Facebook</strong> - Posts and business updates</li>
                            <li><strong className="text-card-foreground">LinkedIn</strong> - Professional content</li>
                            <li><strong className="text-card-foreground">TikTok</strong> - With automatic AI disclosure</li>
                            <li><strong className="text-card-foreground">Google My Business</strong> - Business posts and updates</li>
                            <li><strong className="text-card-foreground">SMS</strong> - Marketing text messages</li>
                          </ul>
                        </div>
                      </AccordionContent>
                    </AccordionItem>

                    {/* Account Management */}
                    <AccordionItem value="reset-password">
                      <AccordionTrigger>
                        <div className="flex items-center gap-2">
                          <Key className="w-4 h-4" />
                          How do I reset my password?
                        </div>
                      </AccordionTrigger>
                      <AccordionContent>
                        <p className="text-card-foreground/70">
                          On the login page, click "Forgot Password" below the sign-in button. Enter your email address and you'll receive a password reset link within a few minutes.
                        </p>
                      </AccordionContent>
                    </AccordionItem>

                    {/* Integrations */}
                    <AccordionItem value="integrations">
                      <AccordionTrigger>
                        <div className="flex items-center gap-2">
                          <Building2 className="w-4 h-4" />
                          What integrations are available?
                        </div>
                      </AccordionTrigger>
                      <AccordionContent>
                        <div className="text-card-foreground/70 space-y-2">
                          <p>The platform integrates with:</p>
                          <ul className="list-disc ml-5 space-y-1">
                            <li><strong className="text-card-foreground">SignalWire:</strong> SMS and Voice calls</li>
                            <li><strong className="text-card-foreground">ElevenLabs:</strong> AI Voice synthesis</li>
                            <li><strong className="text-card-foreground">Stripe:</strong> Payment processing</li>
                            <li><strong className="text-card-foreground">Resend:</strong> Email delivery</li>
                            <li><strong className="text-card-foreground">Google Calendar:</strong> Calendar sync</li>
                          </ul>
                          <p className="mt-2">Configure integrations in <strong className="text-card-foreground">Settings → Integrations</strong>.</p>
                        </div>
                      </AccordionContent>
                    </AccordionItem>

                    {/* Booking Differences */}
                    <AccordionItem value="booking-differences">
                      <AccordionTrigger>
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4" />
                          What's the difference between "Call to Book" and "Online Booking"?
                        </div>
                      </AccordionTrigger>
                      <AccordionContent>
                        <div className="text-card-foreground/70 space-y-2">
                          <ul className="space-y-2">
                            <li>
                              <strong className="text-card-foreground">Call to Book (Core):</strong>
                              <p>Customers click a button that opens their phone dialer to call your business. The AI handles questions but scheduling is done by phone.</p>
                            </li>
                            <li>
                              <strong className="text-card-foreground">Online Booking (Boost+):</strong>
                              <p>Customers book appointments directly through the AI chat. The Booking Agent checks availability and confirms bookings automatically.</p>
                            </li>
                          </ul>
                        </div>
                      </AccordionContent>
                    </AccordionItem>

                    {/* Reports */}
                    <AccordionItem value="reports">
                      <AccordionTrigger>
                        <div className="flex items-center gap-2">
                          <BarChart3 className="w-4 h-4" />
                          What reports can I generate?
                        </div>
                      </AccordionTrigger>
                      <AccordionContent>
                        <div className="text-card-foreground/70 space-y-2">
                          <p>The Analytics & Reports console (Aura Elite tier) includes:</p>
                          <ul className="list-disc ml-5 space-y-1">
                            <li><strong className="text-card-foreground">Performance:</strong> Team and service performance metrics</li>
                            <li><strong className="text-card-foreground">Revenue:</strong> Income trends and projections</li>
                            <li><strong className="text-card-foreground">Customer Insights:</strong> Behavior patterns and segments</li>
                            <li><strong className="text-card-foreground">Forecasting:</strong> AI-powered demand predictions</li>
                            <li><strong className="text-card-foreground">KPIs:</strong> Real-time business metrics</li>
                            <li><strong className="text-card-foreground">Social:</strong> Engagement across all platforms</li>
                            <li><strong className="text-card-foreground">Reminders:</strong> Delivery rates for SMS, Email, Voice</li>
                            <li><strong className="text-card-foreground">Export:</strong> Download CSV or PDF reports</li>
                          </ul>
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  </Accordion>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </PageContainer>
    </DashboardLayout>
  );
}
