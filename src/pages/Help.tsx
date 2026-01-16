import { useState, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
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
  HeadphonesIcon,
  Truck,
  Briefcase,
  Megaphone
} from 'lucide-react';

type ConsoleType = 'customer' | 'fieldops' | 'businessops' | 'marketing';
type MainTabType = 'ai-agents' | 'company-employee' | 'faq';

const consoleInfo: Record<ConsoleType, { title: string; icon: React.ElementType; description: string; agents: string[]; features: string[]; useCases: string[]; platformAdminFeatures?: string[]; platformAdminUseCases?: string[] }> = {
  customer: {
    title: 'Customer Portal',
    icon: HeadphonesIcon,
    description: 'Powered by 4 specialized AI agents: Receptionist (Phase 1), Scheduling (Phase 2), Follow-up (Phase 3), and Review (Phase 4).',
    agents: ['Receptionist Agent', 'Scheduling Agent', 'Follow-up Agent', 'Review Agent'],
    features: [
      'Intelligent triage and routing of customer inquiries',
      'Book and manage appointments with smart scheduling',
      'Provide instant quotes for services',
      'Answer customer questions using your knowledge base',
      'Track existing appointments and send reminders',
      'Collect customer feedback and request reviews',
      'Voice and SMS support via Twilio integration'
    ],
    useCases: [
      '"Book an appointment for AC repair tomorrow at 2pm"',
      '"How much does a water heater installation cost?"',
      '"What are your business hours?"',
      '"I need to reschedule my appointment"',
      '"Can I get a quote for a full home inspection?"'
    ]
  },
  fieldops: {
    title: 'Field Operations',
    icon: Truck,
    description: 'Powered by 4 specialized AI agents: Dispatch (Phase 1), Route (Phase 2), ETA (Phase 3), and Check-in (Phase 4).',
    agents: ['Dispatch Agent', 'Route Agent', 'ETA Agent', 'Check-in Agent'],
    features: [
      'Accept assigned jobs and notify customers automatically',
      'Get turn-by-turn directions to customer locations',
      'Mark en route status with automatic customer notifications',
      'Update and communicate real-time ETA to customers',
      'Arrive & Start job with one-tap status updates',
      'Complete jobs and trigger follow-up workflows',
      'Generate quotes and invoices directly from the field',
      'Contact dispatch with one tap for support',
      'View job queue with customer details and service info'
    ],
    useCases: [
      '"Accept Job" - Accept your next assigned job and notify the customer',
      '"Get Directions" - Open navigation to the customer address',
      '"Mark En Route" - Update status and notify customer you\'re on the way',
      '"Update ETA" - Send an updated arrival time to the customer',
      '"Arrive & Start" - Mark arrival and begin the job in one action',
      '"Complete Job" - Finish the job and trigger completion notifications',
      '"Generate Quote" - Create a quote for additional services',
      '"Generate Invoice" - Bill the customer for completed work',
      '"Contact Dispatch" - Call dispatch directly for support'
    ]
  },
  businessops: {
    title: 'Business Operations',
    icon: Briefcase,
    description: 'Powered by 5 specialized AI agents: Admin (Phase 1), Quoting (Phase 2), Invoice (Phase 3), Inventory (Phase 4), and Warranty (Phase 5).',
    agents: ['Admin Agent', 'Quoting Agent', 'Invoice Agent', 'Inventory Agent', 'Warranty Agent'],
    features: [
      'Create and send invoices to customers',
      'Generate detailed quotes for services',
      'Look up pricing for parts and services',
      'Process billing and payment tracking',
      'View KPI dashboards and metrics',
      'Analyze revenue trends and forecasts',
      'Generate performance reports',
      'Get customer behavior insights'
    ],
    useCases: [
      '"Create an invoice for John Smith\'s repair"',
      '"Generate a quote for a new HVAC installation"',
      '"Look up the price for a compressor replacement"',
      '"Show me this month\'s revenue"',
      '"Generate a performance report for last quarter"'
    ],
    // Platform admin only features
    platformAdminFeatures: [
      'Track inventory levels and reorder alerts',
      'Manage warranty claims and policies'
    ],
    platformAdminUseCases: [
      '"Check warranty status for order #12345"',
      '"What\'s the current stock level for air filters?"'
    ]
  },
  marketing: {
    title: 'Marketing & Sales',
    icon: Megaphone,
    description: 'Powered by the Campaign Agent (Phase 1) for creating and managing marketing campaigns.',
    agents: ['Campaign Agent'],
    features: [
      'Create targeted marketing campaigns',
      'Segment customers for personalized outreach',
      'Generate promotional codes and discounts',
      'Track referrals and reward programs',
      'Win back lapsed customers with special offers',
      'Manage leads and sales pipeline'
    ],
    useCases: [
      '"Create a 20% off campaign for HVAC maintenance"',
      '"Generate a promo code for first-time customers"',
      '"Find customers who haven\'t booked in 6 months"',
      '"Set up a referral reward program"',
      '"Create a summer AC tune-up promotion"'
    ]
  }
};

export default function Help() {
  const { userRole } = useAuth();
  const isPlatformAdmin = userRole === 'platform_admin';
  const [searchParams, setSearchParams] = useSearchParams();
  
  // Available console types based on role
  const availableConsoleTypes: ConsoleType[] = isPlatformAdmin 
    ? ['customer', 'fieldops', 'businessops', 'marketing']
    : ['customer', 'fieldops', 'businessops'];
  
  const consoleParam = searchParams.get('console') as ConsoleType | null;
  const consoleType: ConsoleType = consoleParam && availableConsoleTypes.includes(consoleParam) 
    ? consoleParam 
    : 'customer';
  
  const mainTabParam = searchParams.get('tab') as MainTabType | null;
  const [mainTab, setMainTab] = useState<MainTabType>(mainTabParam || 'ai-agents');

  const handleConsoleTypeChange = (value: ConsoleType) => {
    setSearchParams({ console: value, tab: 'ai-agents' });
  };

  const handleMainTabChange = (value: MainTabType) => {
    setMainTab(value);
    const newParams = new URLSearchParams(searchParams);
    newParams.set('tab', value);
    setSearchParams(newParams);
  };

  // Dynamically adjust console content based on role
  const currentConsole = useMemo(() => {
    const baseConsole = consoleInfo[consoleType];
    
    if (consoleType === 'businessops') {
      if (isPlatformAdmin) {
        // Platform admin sees all agents including full Business Ops
        return {
          ...baseConsole,
          features: [...baseConsole.features, ...(baseConsole.platformAdminFeatures || [])],
          useCases: [...baseConsole.useCases, ...(baseConsole.platformAdminUseCases || [])]
        };
      } else {
        // Company admin/employee sees standard Business Management description
        return {
          ...baseConsole,
          description: 'Powered by 5 specialized AI agents: Admin (Phase 1), Quoting (Phase 2), Invoice (Phase 3), Inventory (Phase 4), and Warranty (Phase 5).'
        };
      }
    }
    
    return baseConsole;
  }, [consoleType, isPlatformAdmin]);
  
  const ConsoleIcon = currentConsole.icon;

  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold">Help & Documentation</h1>
          <p className="text-white/70 mt-2">
            Learn how to use your AI agents, set up your dashboard, and manage your team.
          </p>
        </div>

        {/* Main Tabs */}
        <Tabs value={mainTab} onValueChange={(v) => handleMainTabChange(v as MainTabType)}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="ai-agents">
              <Bot className="h-4 w-4 mr-2" />
              AI Agents
            </TabsTrigger>
            <TabsTrigger value="company-employee">
              <Building2 className="h-4 w-4 mr-2" />
              Company & Employees
            </TabsTrigger>
            <TabsTrigger value="faq">
              <HelpCircle className="h-4 w-4 mr-2" />
              FAQs
            </TabsTrigger>
          </TabsList>

          {/* AI Agents Tab */}
          <TabsContent value="ai-agents" className="space-y-6 mt-6">
            {/* Console Type Selector */}
            <Tabs value={consoleType} onValueChange={(v) => handleConsoleTypeChange(v as ConsoleType)}>
              <TabsList className="flex-wrap h-auto gap-1">
                <TabsTrigger value="customer">
                  <HeadphonesIcon className="h-4 w-4 mr-2" />
                  Customer Portal
                </TabsTrigger>
                <TabsTrigger value="fieldops">
                  <Truck className="h-4 w-4 mr-2" />
                  Field Operations
                </TabsTrigger>
                <TabsTrigger value="businessops">
                  <Briefcase className="h-4 w-4 mr-2" />
                  Business Operations
                </TabsTrigger>
                {isPlatformAdmin && (
                  <TabsTrigger value="marketing">
                    <Megaphone className="h-4 w-4 mr-2" />
                    Marketing & Sales
                  </TabsTrigger>
                )}
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
                    <CardDescription className="text-card-foreground/70">{currentConsole.description}</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Agents */}
                <div>
                  <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
                    <Bot className="w-5 h-5 text-primary" />
                    AI Agents in this Console
                  </h3>
                  <div className="flex flex-wrap gap-2 ml-7">
                    {currentConsole.agents.map((agent, index) => (
                      <Badge key={index} variant="secondary" className="text-sm">
                        {agent}
                      </Badge>
                    ))}
                  </div>
                </div>

                {/* Features */}
                <div>
                  <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
                    <CheckCircle2 className="w-5 h-5 text-green-500" />
                    What This Console Can Do
                  </h3>
                  <ul className="space-y-2 ml-7">
                    {currentConsole.features.map((feature, index) => (
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
                    <MessageCircle className="w-5 h-5 text-blue-500" />
                    Example Prompts
                  </h3>
                  <div className="ml-7 space-y-2">
                    {currentConsole.useCases.map((useCase, index) => (
                      <div key={index} className="bg-muted/50 px-3 py-2 rounded-lg text-sm">
                        {useCase}
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Company & Employees Tab */}
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
                        <p className="text-sm text-card-foreground/70">Visit <code className="bg-white text-slate-800 px-1.5 py-0.5 rounded text-xs">/auth</code> and select "Company Sign Up" to create your company account. You'll receive a 30-day free trial with full access to all features.</p>
                      </div>
                    </div>
                    <div className="flex gap-3">
                      <Badge variant="outline" className="h-6 w-6 rounded-full p-0 flex items-center justify-center flex-shrink-0">2</Badge>
                      <div>
                        <p className="font-medium text-card-foreground">Access Your Dashboard</p>
                        <p className="text-sm text-card-foreground/70">After signing in, you'll be automatically redirected to your dashboard at <code className="bg-white text-slate-800 px-1.5 py-0.5 rounded text-xs">/dashboard</code>. This is your central hub for managing appointments, AI agents, and more.</p>
                      </div>
                    </div>
                    <div className="flex gap-3">
                      <Badge variant="outline" className="h-6 w-6 rounded-full p-0 flex items-center justify-center flex-shrink-0">3</Badge>
                      <div>
                        <p className="font-medium text-card-foreground">Complete Onboarding</p>
                        <p className="text-sm text-card-foreground/70">Follow the onboarding checklist to set up integrations (Twilio, ElevenLabs), configure your knowledge base, and customize your AI agents.</p>
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
                        <span><strong className="text-card-foreground">Company Logo:</strong> Upload your logo (recommended size: 200x200px). This appears in your chat widget and customer-facing interfaces.</span>
                      </li>
                      <li className="flex items-start gap-2 text-card-foreground/80">
                        <ArrowRight className="w-4 h-4 mt-0.5 text-card-foreground/50 flex-shrink-0" />
                        <span><strong className="text-card-foreground">Primary Color:</strong> Set your brand's main color for buttons, accents, and the chat widget.</span>
                      </li>
                      <li className="flex items-start gap-2 text-card-foreground/80">
                        <ArrowRight className="w-4 h-4 mt-0.5 text-card-foreground/50 flex-shrink-0" />
                        <span><strong className="text-card-foreground">Secondary Color:</strong> A complementary color for additional UI elements.</span>
                      </li>
                    </ul>
                    <p className="text-sm text-card-foreground/70 mt-2">Your branding automatically applies to the embeddable chat widget your customers see on your website.</p>
                  </div>
                </div>

                {/* Inviting Team */}
                <div>
                  <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
                    <UserPlus className="w-5 h-5 text-blue-500" />
                    Inviting Your Team
                  </h3>
                  <div className="ml-7 space-y-3">
                    <p className="text-sm text-card-foreground/70">To add employees (technicians, scheduling agents, etc.) to your company:</p>
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
                          <p className="text-sm text-card-foreground/70">Employee visits <code className="bg-white text-slate-800 px-1.5 py-0.5 rounded text-xs">/auth</code>, selects "Employee Sign Up", and enters the registration code to join your company.</p>
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
                        <p className="text-sm text-card-foreground/70">Go to <code className="bg-white text-slate-800 px-1.5 py-0.5 rounded text-xs">/auth</code> and select "Employee Sign Up" at the bottom of the form.</p>
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
                        <p className="text-sm text-card-foreground/70">Once registered, you'll be redirected to your dashboard. Technicians go to the mobile-optimized <code className="bg-white text-slate-800 px-1.5 py-0.5 rounded text-xs">/technician</code> dashboard.</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Technician Features */}
                <div>
                  <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
                    <Shield className="w-5 h-5 text-green-500" />
                    Technician Dashboard Features
                  </h3>
                  <div className="ml-7 space-y-2 text-sm">
                    <p className="text-card-foreground/70">As a technician, your mobile-optimized dashboard includes:</p>
                    <ul className="space-y-2 mt-2">
                      <li className="flex items-start gap-2 text-card-foreground/80">
                        <ArrowRight className="w-4 h-4 mt-0.5 text-card-foreground/50 flex-shrink-0" />
                        <span><strong className="text-card-foreground">Job Queue:</strong> View and manage assigned jobs, update status (en route, arrived, completed)</span>
                      </li>
                      <li className="flex items-start gap-2 text-card-foreground/80">
                        <ArrowRight className="w-4 h-4 mt-0.5 text-card-foreground/50 flex-shrink-0" />
                        <span><strong className="text-card-foreground">AI Console:</strong> Access the Field Operations AI agent for navigation and support</span>
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

          {/* FAQ Tab */}
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
                  <AccordionItem value="custom-domain">
                    <AccordionTrigger>
                      <div className="flex items-center gap-2">
                        <Globe className="w-4 h-4" />
                        Can I use a custom domain for my dashboard?
                      </div>
                    </AccordionTrigger>
                    <AccordionContent>
                      <p className="text-card-foreground/70">
                        Custom domains are planned as an enterprise feature. Currently, all companies access their dashboards through the main platform URL. Your branding (logo, colors) is applied throughout the interface to maintain your company identity. Contact us if you're interested in custom domain support.
                      </p>
                    </AccordionContent>
                  </AccordionItem>

                  <AccordionItem value="chat-widget">
                    <AccordionTrigger>
                      <div className="flex items-center gap-2">
                        <MessageCircle className="w-4 h-4" />
                        How do my customers access the chat widget?
                      </div>
                    </AccordionTrigger>
                    <AccordionContent>
                      <div className="text-card-foreground/70 space-y-2">
                        <p>There are two ways customers can interact with your AI agent:</p>
                        <ul className="list-disc ml-5 space-y-1">
                          <li><strong className="text-card-foreground">Embeddable Widget:</strong> Go to <strong className="text-card-foreground">Chat Widget</strong> in your dashboard to get the embed code. Add this to your website and customers can chat directly on your site.</li>
                          <li><strong className="text-card-foreground">Public Chat Link:</strong> Share your public chat URL: <code className="bg-white text-slate-800 px-1.5 py-0.5 rounded text-xs">/chat/your-company-slug</code> - customers can access this directly without visiting your website.</li>
                        </ul>
                      </div>
                    </AccordionContent>
                  </AccordionItem>

                  <AccordionItem value="reset-password">
                    <AccordionTrigger>
                      <div className="flex items-center gap-2">
                        <Key className="w-4 h-4" />
                        How do I reset my password?
                      </div>
                    </AccordionTrigger>
                    <AccordionContent>
                      <p className="text-card-foreground/70">
                        On the login page (<code className="bg-white text-slate-800 px-1.5 py-0.5 rounded text-xs">/auth</code>), click "Forgot Password" below the sign-in button. Enter your email address and you'll receive a password reset link.
                      </p>
                    </AccordionContent>
                  </AccordionItem>

                  <AccordionItem value="ai-agents">
                    <AccordionTrigger>
                      <div className="flex items-center gap-2">
                        <Bot className="w-4 h-4" />
                        How do I configure my AI agents?
                      </div>
                    </AccordionTrigger>
                    <AccordionContent>
                      <div className="text-card-foreground/70 space-y-2">
                        <p>All AI agent configuration is done within the platform:</p>
                        <ul className="list-disc ml-5 space-y-1">
                          <li><strong className="text-card-foreground">AI Agent:</strong> Test and interact with your main AI assistant</li>
                          <li><strong className="text-card-foreground">AI Agents Hub:</strong> Enable/disable specific agents, configure settings, and test each agent individually</li>
                          <li><strong className="text-card-foreground">Knowledge Base:</strong> Add FAQs, services, business hours, and documents that your AI uses to answer questions</li>
                          <li><strong className="text-card-foreground">Integrations:</strong> Connect your Twilio (SMS/calls), ElevenLabs (voice), and other services</li>
                        </ul>
                      </div>
                    </AccordionContent>
                  </AccordionItem>

                  <AccordionItem value="trial">
                    <AccordionTrigger>
                      <div className="flex items-center gap-2">
                        <Shield className="w-4 h-4" />
                        What happens when my trial ends?
                      </div>
                    </AccordionTrigger>
                    <AccordionContent>
                      <p className="text-card-foreground/70">
                        Your 30-day trial includes full access to all Enterprise features. You'll receive email reminders 7 days, 3 days, and 1 day before expiration. To continue using all features after your trial, subscribe through the <strong className="text-card-foreground">Subscription</strong> page in your dashboard. If you don't subscribe, some features will become restricted.
                      </p>
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}
