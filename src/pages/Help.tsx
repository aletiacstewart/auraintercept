import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
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
  Megaphone,
  BarChart3
} from 'lucide-react';

type ConsoleType = 'customer' | 'fieldops' | 'businessops' | 'marketing' | 'analytics';
type MainTabType = 'ai-agents' | 'company-employee' | 'faq';

const consoleInfo: Record<ConsoleType, { title: string; icon: React.ElementType; description: string; features: string[]; useCases: string[] }> = {
  customer: {
    title: 'Customer Engagement',
    icon: HeadphonesIcon,
    description: 'Handle customer inquiries, book appointments, provide quotes, and deliver exceptional customer service.',
    features: [
      'Book and manage appointments with smart scheduling',
      'Provide instant quotes for services',
      'Answer customer questions using your knowledge base',
      'Track existing appointments and send reminders',
      'Collect customer feedback and reviews',
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
    description: 'Optimize field technician workflows, route planning, job management, and real-time status updates.',
    features: [
      'Get directions and navigation to job sites',
      'Update job status (en route, arrived, completed)',
      'View daily job queue and schedule',
      'Upload before/after photos for documentation',
      'Log parts used and job notes',
      'Access customer and job details on the go'
    ],
    useCases: [
      '"Navigate to my next job"',
      '"Mark this job as completed"',
      '"What jobs do I have today?"',
      '"Log parts used: 2 filters and 1 thermostat"',
      '"Show me the customer details for this appointment"'
    ]
  },
  businessops: {
    title: 'Business Operations',
    icon: Briefcase,
    description: 'Manage invoices, quotes, inventory, warranties, and day-to-day business administration.',
    features: [
      'Create and send invoices to customers',
      'Generate detailed quotes for services',
      'Track inventory levels and reorder alerts',
      'Manage warranty claims and policies',
      'Look up pricing for parts and services',
      'Process billing and payment tracking'
    ],
    useCases: [
      '"Create an invoice for John Smith\'s repair"',
      '"Check warranty status for order #12345"',
      '"What\'s the current stock level for air filters?"',
      '"Generate a quote for a new HVAC installation"',
      '"Look up the price for a compressor replacement"'
    ]
  },
  marketing: {
    title: 'Marketing & Sales',
    icon: Megaphone,
    description: 'Create campaigns, manage leads, generate promo codes, and drive customer acquisition and retention.',
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
  },
  analytics: {
    title: 'Analytics & Insights',
    icon: BarChart3,
    description: 'Access performance reports, revenue analysis, customer insights, and business intelligence.',
    features: [
      'View KPI dashboards and metrics',
      'Analyze revenue trends and forecasts',
      'Generate performance reports',
      'Get customer behavior insights',
      'Export data for external analysis',
      'Track technician performance metrics'
    ],
    useCases: [
      '"Show me this month\'s revenue"',
      '"What\'s our customer satisfaction score?"',
      '"Generate a performance report for last quarter"',
      '"Which services are most profitable?"',
      '"Forecast next month\'s appointment volume"'
    ]
  }
};

export default function Help() {
  const [searchParams, setSearchParams] = useSearchParams();
  const consoleParam = searchParams.get('console') as ConsoleType | null;
  const consoleType: ConsoleType = consoleParam && Object.keys(consoleInfo).includes(consoleParam) ? consoleParam : 'customer';
  
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

  const currentConsole = consoleInfo[consoleType];
  const ConsoleIcon = currentConsole.icon;

  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold">Help & Documentation</h1>
          <p className="text-muted-foreground mt-2">
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
                  Customer Engagement
                </TabsTrigger>
                <TabsTrigger value="fieldops">
                  <Truck className="h-4 w-4 mr-2" />
                  Field Operations
                </TabsTrigger>
                <TabsTrigger value="businessops">
                  <Briefcase className="h-4 w-4 mr-2" />
                  Business Operations
                </TabsTrigger>
                <TabsTrigger value="marketing">
                  <Megaphone className="h-4 w-4 mr-2" />
                  Marketing & Sales
                </TabsTrigger>
                <TabsTrigger value="analytics">
                  <BarChart3 className="h-4 w-4 mr-2" />
                  Analytics & Insights
                </TabsTrigger>
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
                    <CardTitle>{currentConsole.title} AI Agent</CardTitle>
                    <CardDescription>{currentConsole.description}</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Features */}
                <div>
                  <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
                    <CheckCircle2 className="w-5 h-5 text-green-500" />
                    What This Agent Can Do
                  </h3>
                  <ul className="space-y-2 ml-7">
                    {currentConsole.features.map((feature, index) => (
                      <li key={index} className="flex items-start gap-2 text-sm">
                        <ArrowRight className="w-4 h-4 mt-0.5 text-muted-foreground flex-shrink-0" />
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
                    <CardDescription>Getting started and managing your company</CardDescription>
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
                        <p className="font-medium">Sign Up</p>
                        <p className="text-sm text-muted-foreground">Visit <code className="bg-muted px-1.5 py-0.5 rounded text-xs">/auth</code> and select "Company Sign Up" to create your company account. You'll receive a 30-day free trial with full access to all features.</p>
                      </div>
                    </div>
                    <div className="flex gap-3">
                      <Badge variant="outline" className="h-6 w-6 rounded-full p-0 flex items-center justify-center flex-shrink-0">2</Badge>
                      <div>
                        <p className="font-medium">Access Your Dashboard</p>
                        <p className="text-sm text-muted-foreground">After signing in, you'll be automatically redirected to your dashboard at <code className="bg-muted px-1.5 py-0.5 rounded text-xs">/dashboard</code>. This is your central hub for managing appointments, AI agents, and more.</p>
                      </div>
                    </div>
                    <div className="flex gap-3">
                      <Badge variant="outline" className="h-6 w-6 rounded-full p-0 flex items-center justify-center flex-shrink-0">3</Badge>
                      <div>
                        <p className="font-medium">Complete Onboarding</p>
                        <p className="text-sm text-muted-foreground">Follow the onboarding checklist to set up integrations (Twilio, ElevenLabs), configure your knowledge base, and customize your AI agents.</p>
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
                    <p className="text-sm text-muted-foreground">Navigate to <strong>Settings → Branding</strong> to customize:</p>
                    <ul className="space-y-2 text-sm">
                      <li className="flex items-start gap-2">
                        <ArrowRight className="w-4 h-4 mt-0.5 text-muted-foreground flex-shrink-0" />
                        <span><strong>Company Logo:</strong> Upload your logo (recommended size: 200x200px). This appears in your chat widget and customer-facing interfaces.</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <ArrowRight className="w-4 h-4 mt-0.5 text-muted-foreground flex-shrink-0" />
                        <span><strong>Primary Color:</strong> Set your brand's main color for buttons, accents, and the chat widget.</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <ArrowRight className="w-4 h-4 mt-0.5 text-muted-foreground flex-shrink-0" />
                        <span><strong>Secondary Color:</strong> A complementary color for additional UI elements.</span>
                      </li>
                    </ul>
                    <p className="text-sm text-muted-foreground mt-2">Your branding automatically applies to the embeddable chat widget your customers see on your website.</p>
                  </div>
                </div>

                {/* Inviting Team */}
                <div>
                  <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
                    <UserPlus className="w-5 h-5 text-blue-500" />
                    Inviting Your Team
                  </h3>
                  <div className="ml-7 space-y-3">
                    <p className="text-sm text-muted-foreground">To add employees (technicians, booking agents, etc.) to your company:</p>
                    <div className="space-y-4">
                      <div className="flex gap-3">
                        <Badge variant="outline" className="h-6 w-6 rounded-full p-0 flex items-center justify-center flex-shrink-0">1</Badge>
                        <div>
                          <p className="font-medium">Generate Registration Code</p>
                          <p className="text-sm text-muted-foreground">Go to <strong>Employees</strong> page and click "Add Employee" to generate a unique registration code.</p>
                        </div>
                      </div>
                      <div className="flex gap-3">
                        <Badge variant="outline" className="h-6 w-6 rounded-full p-0 flex items-center justify-center flex-shrink-0">2</Badge>
                        <div>
                          <p className="font-medium">Share with Employee</p>
                          <p className="text-sm text-muted-foreground">Share the code with your employee. They'll need this to register.</p>
                        </div>
                      </div>
                      <div className="flex gap-3">
                        <Badge variant="outline" className="h-6 w-6 rounded-full p-0 flex items-center justify-center flex-shrink-0">3</Badge>
                        <div>
                          <p className="font-medium">Employee Signs Up</p>
                          <p className="text-sm text-muted-foreground">Employee visits <code className="bg-muted px-1.5 py-0.5 rounded text-xs">/auth</code>, selects "Employee Sign Up", and enters the registration code to join your company.</p>
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
                    <CardDescription>How to join your company and access your dashboard</CardDescription>
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
                        <p className="font-medium">Get Your Code</p>
                        <p className="text-sm text-muted-foreground">Your company admin will provide you with a unique registration code. This code links your account to your company.</p>
                      </div>
                    </div>
                    <div className="flex gap-3">
                      <Badge variant="outline" className="h-6 w-6 rounded-full p-0 flex items-center justify-center flex-shrink-0">2</Badge>
                      <div>
                        <p className="font-medium">Visit the Sign Up Page</p>
                        <p className="text-sm text-muted-foreground">Go to <code className="bg-muted px-1.5 py-0.5 rounded text-xs">/auth</code> and select "Employee Sign Up" at the bottom of the form.</p>
                      </div>
                    </div>
                    <div className="flex gap-3">
                      <Badge variant="outline" className="h-6 w-6 rounded-full p-0 flex items-center justify-center flex-shrink-0">3</Badge>
                      <div>
                        <p className="font-medium">Enter Your Details</p>
                        <p className="text-sm text-muted-foreground">Fill in your email, password, full name, and the registration code provided by your admin.</p>
                      </div>
                    </div>
                    <div className="flex gap-3">
                      <Badge variant="outline" className="h-6 w-6 rounded-full p-0 flex items-center justify-center flex-shrink-0">4</Badge>
                      <div>
                        <p className="font-medium">Access Your Dashboard</p>
                        <p className="text-sm text-muted-foreground">Once registered, you'll be redirected to your dashboard. Technicians go to the mobile-optimized <code className="bg-muted px-1.5 py-0.5 rounded text-xs">/technician</code> dashboard.</p>
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
                    <p className="text-muted-foreground">As a technician, your mobile-optimized dashboard includes:</p>
                    <ul className="space-y-2 mt-2">
                      <li className="flex items-start gap-2">
                        <ArrowRight className="w-4 h-4 mt-0.5 text-muted-foreground flex-shrink-0" />
                        <span><strong>Job Queue:</strong> View and manage assigned jobs, update status (en route, arrived, completed)</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <ArrowRight className="w-4 h-4 mt-0.5 text-muted-foreground flex-shrink-0" />
                        <span><strong>AI Console:</strong> Access the Field Operations AI agent for navigation and support</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <ArrowRight className="w-4 h-4 mt-0.5 text-muted-foreground flex-shrink-0" />
                        <span><strong>Calendar:</strong> View your schedule and upcoming appointments</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <ArrowRight className="w-4 h-4 mt-0.5 text-muted-foreground flex-shrink-0" />
                        <span><strong>Availability:</strong> Set your working hours and time off</span>
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
                    <CardDescription>Common questions and answers</CardDescription>
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
                      <p className="text-muted-foreground">
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
                      <div className="text-muted-foreground space-y-2">
                        <p>There are two ways customers can interact with your AI agent:</p>
                        <ul className="list-disc ml-5 space-y-1">
                          <li><strong>Embeddable Widget:</strong> Go to <strong>Chat Widget</strong> in your dashboard to get the embed code. Add this to your website and customers can chat directly on your site.</li>
                          <li><strong>Public Chat Link:</strong> Share your public chat URL: <code className="bg-muted px-1.5 py-0.5 rounded text-xs">/chat/your-company-slug</code> - customers can access this directly without visiting your website.</li>
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
                      <p className="text-muted-foreground">
                        On the login page (<code className="bg-muted px-1.5 py-0.5 rounded text-xs">/auth</code>), click "Forgot Password" below the sign-in button. Enter your email address and you'll receive a password reset link.
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
                      <div className="text-muted-foreground space-y-2">
                        <p>All AI agent configuration is done within the platform:</p>
                        <ul className="list-disc ml-5 space-y-1">
                          <li><strong>AI Agent:</strong> Test and interact with your main AI assistant</li>
                          <li><strong>AI Agents Hub:</strong> Enable/disable specific agents, configure settings, and test each agent individually</li>
                          <li><strong>Knowledge Base:</strong> Add FAQs, services, business hours, and documents that your AI uses to answer questions</li>
                          <li><strong>Integrations:</strong> Connect your Twilio (SMS/calls), ElevenLabs (voice), and other services</li>
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
                      <p className="text-muted-foreground">
                        Your 30-day trial includes full access to all Enterprise features. You'll receive email reminders 7 days, 3 days, and 1 day before expiration. To continue using all features after your trial, subscribe through the <strong>Subscription</strong> page in your dashboard. If you don't subscribe, some features will become restricted.
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
