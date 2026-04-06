import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { PageContainer } from '@/components/ui/page-container';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Users, 
  Building2, 
  Key, 
  Copy, 
  CheckCircle2, 
  PlayCircle, 
  Settings, 
  Bot, 
  Puzzle, 
  Smartphone,
  LayoutDashboard,
  Calendar,
  Clock,
  UserCheck
} from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

const DEMO_PASSWORD = 'aidemo*!';

const demoAccounts = [
  {
    tier: 'Aura Core',
    tierColor: 'bg-teal-500/20 text-teal-600',
    price: '$197/mo',
    companyAdmin: 'companyconnect@demo.com',
    employee: 'employeeconnect@demo.com',
    customer: 'customerconnect@demo.com',
    businessType: 'Salon & Wellness',
    agents: 8,
    consoles: 3,
  },
  {
    tier: 'Aura Boost',
    tierColor: 'bg-sky-500/20 text-sky-600',
    price: '$497/mo',
    companyAdmin: 'companyperformance@demo.com',
    employee: 'employeeperformance@demo.com',
    customer: 'customerperformance@demo.com',
    businessType: 'HVAC & Plumbing',
    agents: 12,
    consoles: 5,
  },
  {
    tier: 'Aura Pro',
    tierColor: 'bg-purple-500/20 text-purple-600',
    price: '$997/mo',
    companyAdmin: 'companypro@demo.com',
    employee: 'employeepro@demo.com',
    customer: 'customerpro@demo.com',
    businessType: 'Growing Field Service',
    agents: 16,
    consoles: 6,
  },
  {
    tier: 'Aura Elite',
    tierColor: 'bg-amber-500/20 text-amber-600',
    price: '$1,997/mo',
    companyAdmin: 'companycommand@demo.com',
    employee: 'employeecommand@demo.com',
    customer: 'customercommand@demo.com',
    businessType: 'Multi-Location Enterprise',
    agents: 24,
    consoles: 7,
  },
];

const companyOnboardingSteps = [
  {
    step: 1,
    title: 'Login Setup',
    icon: Key,
    details: [
      'Navigate to /auth',
      'Select "Company Admin" login type',
      'Use demo credentials for the tier being demonstrated',
    ],
  },
  {
    step: 2,
    title: 'Dashboard Overview',
    icon: LayoutDashboard,
    details: [
      'Show main dashboard with KPIs and stats',
      'Highlight the DashboardSetupNav progress bar',
      'Explain tier-specific features available',
    ],
  },
  {
    step: 3,
    title: 'Quick Setup Walkthrough',
    icon: Settings,
    details: [
      'Branding configuration (logo, colors)',
      'Business hours setup',
      'Service catalog creation',
      'FAQ setup for AI accuracy',
    ],
  },
  {
    step: 4,
    title: 'AI Agents Demonstration',
    icon: Bot,
    details: [
      'Navigate to AI Operatives Hub',
      'Show enabled vs locked agents based on tier',
      'Demonstrate Talk to Aura voice interaction',
      'Show Message Aura text interaction',
    ],
  },
  {
    step: 5,
    title: 'Integration Points',
    icon: Puzzle,
    details: [
      'Review 3rd party integration requirements',
      'Show Twilio, ElevenLabs, Stripe setup areas',
      'Calendar sync demonstration (if applicable)',
    ],
  },
];

const employeeOnboardingSteps = [
  {
    step: 1,
    title: 'Employee Login',
    icon: UserCheck,
    details: [
      'Use employee demo credentials',
      'Show limited dashboard view vs admin',
      'Explain role-based access controls',
    ],
  },
  {
    step: 2,
    title: 'Mobile App Experience',
    icon: Smartphone,
    details: [
      'Demonstrate technician dashboard',
      'Show job assignments and calendar',
      'Field operations check-in flow',
    ],
  },
  {
    step: 3,
    title: 'Role-Specific Features',
    icon: Calendar,
    details: [
      'Availability management',
      'Appointment viewing',
      'Customer interaction tools',
    ],
  },
];

const tierFeatures: Record<string, string[]> = {
  'Aura Core': [
    '8 Smart AI Agents',
    'AI Receptionist (Triage)',
    'Booking, Follow-Up, Review Agents',
    'Creative Content & Web Presence',
    'Lead & Marketing Agents',
    '3 Control Centers',
    '10 Employees',
  ],
  'Aura Boost': [
    'All Core features',
    '12 Smart AI Agents',
    'Dispatch, Route, ETA, Check-In Agents',
    '5 Control Centers',
    'Field Operations Console',
    '25 Employees',
  ],
  'Aura Pro': [
    'All Boost features',
    '16 Smart AI Agents',
    'Campaign & Outreach Agents',
    'Social Feed Queue & Social Analytics',
    '5 Control Centers',
    'White-Label Branding',
    '50 Employees',
  ],
  'Aura Elite': [
    'All Pro features',
    '24 Smart AI Agents (Full Suite)',
    'Admin, Quoting, Invoice, Inventory Agents',
    'Insights, Performance, Revenue, Forecast Agents',
    'All 7 Control Centers + AI Operatives Hub',
    'Analytics & Reports Console',
    'Predictive Analytics',
    'Unlimited Employees',
  ],
};

export default function DemoAccounts() {
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const copyToClipboard = async (text: string, field: string) => {
    try {
      // Clipboard API can be blocked in iframes / some browser contexts.
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(text);
      } else {
        // Fallback for older browsers
        const textarea = document.createElement('textarea');
        textarea.value = text;
        textarea.style.position = 'fixed';
        textarea.style.opacity = '0';
        document.body.appendChild(textarea);
        textarea.focus();
        textarea.select();
        const ok = document.execCommand('copy');
        document.body.removeChild(textarea);
        if (!ok) throw new Error('Copy command failed');
      }

      setCopiedField(field);
      toast.success('Copied to clipboard');
      setTimeout(() => setCopiedField(null), 2000);
    } catch (err) {
      console.warn('Copy to clipboard failed', err);
      toast.error('Could not copy. Please copy manually.');
    }
  };

  const CopyButton = ({ text, field }: { text: string; field: string }) => (
    <Button
      variant="ghost"
      size="sm"
      className="h-6 w-6 p-0 ml-1"
      onClick={() => void copyToClipboard(text, field)}
    >
      {copiedField === field ? (
        <CheckCircle2 className="h-3.5 w-3.5 text-green-500" />
      ) : (
        <Copy className="h-3.5 w-3.5 text-muted-foreground" />
      )}
    </Button>
  );

  return (
    <DashboardLayout>
      <PageContainer>
        <ScrollArea className="h-full">
          <div className="space-y-6 p-2">
            {/* Header */}
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <Users className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h1 className="text-2xl font-bold">Demo Accounts</h1>
                <p className="text-muted-foreground">
                  Credentials and guides for conducting product demonstrations
                </p>
              </div>
            </div>

            {/* Demo Credentials Card */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Key className="h-5 w-5" />
                  Demo Account Credentials
                </CardTitle>
                <CardDescription>
                  All demo accounts use the password: <code className="bg-muted px-2 py-0.5 rounded font-mono text-sm">{DEMO_PASSWORD}</code>
                  <CopyButton text={DEMO_PASSWORD} field="password" />
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Tier</TableHead>
                      <TableHead>Business Type</TableHead>
                      <TableHead>Company Admin</TableHead>
                      <TableHead>Employee</TableHead>
                      <TableHead>Customer</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {demoAccounts.map((account) => (
                      <TableRow key={account.tier}>
                        <TableCell>
                          <div className="flex flex-col gap-1">
                            <Badge className={account.tierColor} variant="secondary">
                              {account.tier}
                            </Badge>
                            <span className="text-xs text-muted-foreground">{account.price}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <span className="text-sm font-medium">{account.businessType}</span>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center">
                            <code className="text-xs bg-muted px-1.5 py-0.5 rounded">
                              {account.companyAdmin}
                            </code>
                            <CopyButton text={account.companyAdmin} field={`${account.tier}-admin`} />
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center">
                            <code className="text-xs bg-muted px-1.5 py-0.5 rounded">
                              {account.employee}
                            </code>
                            <CopyButton text={account.employee} field={`${account.tier}-employee`} />
                          </div>
                        </TableCell>
                        <TableCell>
                          {account.customer ? (
                            <div className="flex items-center">
                              <code className="text-xs bg-muted px-1.5 py-0.5 rounded">
                                {account.customer}
                              </code>
                              <CopyButton text={account.customer} field={`${account.tier}-customer`} />
                            </div>
                          ) : (
                            <span className="text-muted-foreground text-xs">—</span>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>

            {/* Tier Features Reference */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building2 className="h-5 w-5" />
                  Tier Features Quick Reference
                </CardTitle>
                <CardDescription>
                  Key features to highlight for each subscription tier
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {demoAccounts.map((account) => (
                    <div key={account.tier} className="border rounded-lg p-4">
                      <Badge className={account.tierColor} variant="secondary">
                        {account.tier}
                      </Badge>
                      <ul className="mt-3 space-y-1.5">
                        {tierFeatures[account.tier]?.map((feature, idx) => (
                          <li key={idx} className="text-sm text-muted-foreground flex items-start gap-2">
                            <CheckCircle2 className="h-3.5 w-3.5 mt-0.5 text-green-500 flex-shrink-0" />
                            {feature}
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Separator />

            {/* Demo Guide Section */}
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-secondary/10">
                <PlayCircle className="h-6 w-6 text-secondary" />
              </div>
              <div>
                <h2 className="text-xl font-bold">Demo Guide</h2>
                <p className="text-muted-foreground">
                  Step-by-step instructions for conducting effective demos
                </p>
              </div>
            </div>

            {/* Company Onboarding Demo */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building2 className="h-5 w-5" />
                  Company Onboarding Demo
                </CardTitle>
                <CardDescription>
                  Walk through the company admin experience
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {companyOnboardingSteps.map((step) => {
                    const Icon = step.icon;
                    return (
                      <div key={step.step} className="flex gap-4">
                        <div className="flex-shrink-0">
                          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                            <span className="text-sm font-bold text-primary">{step.step}</span>
                          </div>
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <Icon className="h-4 w-4 text-muted-foreground" />
                            <h4 className="font-semibold">{step.title}</h4>
                          </div>
                          <ul className="space-y-1">
                            {step.details.map((detail, idx) => (
                              <li key={idx} className="text-sm text-muted-foreground flex items-start gap-2">
                                <span className="text-primary">•</span>
                                {detail}
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            {/* Employee Onboarding Demo */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Employee Onboarding Demo
                </CardTitle>
                <CardDescription>
                  Demonstrate the employee/technician experience
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {employeeOnboardingSteps.map((step) => {
                    const Icon = step.icon;
                    return (
                      <div key={step.step} className="flex gap-4">
                        <div className="flex-shrink-0">
                          <div className="w-10 h-10 rounded-full bg-secondary/10 flex items-center justify-center">
                            <span className="text-sm font-bold text-secondary">{step.step}</span>
                          </div>
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <Icon className="h-4 w-4 text-muted-foreground" />
                            <h4 className="font-semibold">{step.title}</h4>
                          </div>
                          <ul className="space-y-1">
                            {step.details.map((detail, idx) => (
                              <li key={idx} className="text-sm text-muted-foreground flex items-start gap-2">
                                <span className="text-secondary">•</span>
                                {detail}
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            {/* Demo Tips */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5" />
                  Demo Tips & Best Practices
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  <li className="text-sm flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 mt-0.5 text-green-500 flex-shrink-0" />
                    <span><strong>Start with value:</strong> Begin with the AI voice/chat interaction to wow them immediately</span>
                  </li>
                  <li className="text-sm flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 mt-0.5 text-green-500 flex-shrink-0" />
                    <span><strong>Match tier to business:</strong> Focus on features relevant to their business size and needs</span>
                  </li>
                  <li className="text-sm flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 mt-0.5 text-green-500 flex-shrink-0" />
                    <span><strong>Show the progress bar:</strong> Highlight the guided setup experience that simplifies onboarding</span>
                  </li>
                  <li className="text-sm flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 mt-0.5 text-green-500 flex-shrink-0" />
                    <span><strong>Demonstrate mobile:</strong> Show the PWA install process for technicians</span>
                  </li>
                  <li className="text-sm flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 mt-0.5 text-green-500 flex-shrink-0" />
                    <span><strong>End with ROI:</strong> Use the calculators to show potential cost savings and efficiency gains</span>
                  </li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </ScrollArea>
      </PageContainer>
    </DashboardLayout>
  );
}
