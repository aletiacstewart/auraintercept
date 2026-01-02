import { HelpCircle, Mail, MessageSquare, Phone, DollarSign, Lightbulb, Star } from 'lucide-react';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface CostCalculatorHelpProps {
  totalReminders: number;
  appointments: number;
  avgTransactionValue: number;
  costs: {
    email: number;
    sms: number;
    voice: number;
    stripe: number;
    total: number;
    perReminder: { email: number; sms: number; voice: number };
  };
}

export function CostCalculatorHelp({ totalReminders, appointments, avgTransactionValue, costs }: CostCalculatorHelpProps) {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  };

  return (
    <Accordion type="single" collapsible className="w-full">
      <AccordionItem value="help" className="border rounded-lg bg-muted/30">
        <AccordionTrigger className="px-4 hover:no-underline">
          <div className="flex items-center gap-2 text-sm font-medium">
            <HelpCircle className="w-4 h-4 text-primary" />
            What am I paying for?
          </div>
        </AccordionTrigger>
        <AccordionContent className="px-4 pb-4">
          <div className="space-y-4">
            {/* Email Explanation */}
            <div className="p-3 rounded-lg bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-200/50 dark:border-emerald-900/30">
              <div className="flex items-center gap-2 mb-2">
                <Mail className="w-4 h-4 text-emerald-600" />
                <span className="font-medium">Email Reminders</span>
                {totalReminders <= 3000 && (
                  <Badge variant="secondary" className="text-xs bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-300">
                    FREE
                  </Badge>
                )}
              </div>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• <strong>First 3,000 emails/month are FREE</strong> (about 1,500 appointments with 2 reminders each)</li>
                <li>• Above 3,000: $20/month flat fee for up to 50,000 emails</li>
                <li>• Your current estimate: {totalReminders} emails = <strong>{formatCurrency(costs.email)}</strong></li>
              </ul>
            </div>

            {/* SMS Explanation */}
            <div className="p-3 rounded-lg bg-red-50/50 dark:bg-red-950/20 border border-red-200/50 dark:border-red-900/30">
              <div className="flex items-center gap-2 mb-2">
                <MessageSquare className="w-4 h-4 text-red-600" />
                <span className="font-medium">SMS Text Reminders</span>
                <Badge variant="outline" className="text-xs">~1¢ per text</Badge>
              </div>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Phone number rental: <strong>$1.15/month</strong> (required for sending texts)</li>
                <li>• Each text message: <strong>~$0.0079</strong> (less than a penny)</li>
                <li>• Your current estimate: {totalReminders} texts = <strong>{formatCurrency(costs.sms)}</strong></li>
              </ul>
            </div>

            {/* Voice Explanation */}
            <div className="p-3 rounded-lg bg-blue-50/50 dark:bg-blue-950/20 border border-blue-200/50 dark:border-blue-900/30">
              <div className="flex items-center gap-2 mb-2">
                <Phone className="w-4 h-4 text-blue-600" />
                <span className="font-medium">Voice Call Reminders</span>
                <Badge variant="outline" className="text-xs">~12¢ per call</Badge>
              </div>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Phone number rental: <strong>$1.15/month</strong></li>
                <li>• Call time: <strong>$0.014/minute</strong> (avg call is 30 seconds)</li>
                <li>• AI Voice generation: <strong>varies by provider</strong> (see comparison below)</li>
                <li>• Your current estimate: {totalReminders} calls = <strong>{formatCurrency(costs.voice)}</strong></li>
              </ul>
            </div>

            {/* Stripe Explanation */}
            {avgTransactionValue > 0 && (
              <div className="p-3 rounded-lg bg-purple-50/50 dark:bg-purple-950/20 border border-purple-200/50 dark:border-purple-900/30">
                <div className="flex items-center gap-2 mb-2">
                  <DollarSign className="w-4 h-4 text-purple-600" />
                  <span className="font-medium">Payment Processing (Stripe)</span>
                </div>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• Stripe charges: <strong>2.9% + $0.30</strong> per transaction</li>
                  <li>• Example: On a ${avgTransactionValue} service, you pay <strong>{formatCurrency(avgTransactionValue * 0.029 + 0.30)}</strong> to Stripe</li>
                  <li>• Your current estimate: {appointments} transactions = <strong>{formatCurrency(costs.stripe)}</strong></li>
                </ul>
              </div>
            )}

            {/* Tip */}
            <div className="p-3 rounded-lg bg-amber-50/50 dark:bg-amber-950/20 border border-amber-200/50 dark:border-amber-900/30">
              <div className="flex items-start gap-2">
                <Lightbulb className="w-4 h-4 text-amber-600 mt-0.5" />
                <div className="text-sm">
                  <strong className="text-amber-700 dark:text-amber-400">Pro Tip:</strong>
                  <span className="text-muted-foreground"> Email is free for most businesses. Use SMS for high-priority reminders and voice for premium customer experience.</span>
                </div>
              </div>
            </div>
          </div>
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  );
}

interface TTSComparisonTableProps {
  totalReminders: number;
  ttsComparison: {
    elevenlabs: { twilioCost: number; ttsCost: number; total: number };
    google: { twilioCost: number; ttsCost: number; total: number };
  } | null;
}

export function TTSComparisonTable({ totalReminders, ttsComparison }: TTSComparisonTableProps) {
  if (!ttsComparison) return null;

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  };

  const providers = [
    { 
      name: 'ElevenLabs', 
      data: ttsComparison.elevenlabs, 
      quality: 5, 
      description: 'Premium quality, most natural',
      perReminder: totalReminders > 0 ? ttsComparison.elevenlabs.total / totalReminders : 0,
    },
    { 
      name: 'Google TTS', 
      data: ttsComparison.google, 
      quality: 4, 
      description: 'Good quality, most affordable',
      perReminder: totalReminders > 0 ? ttsComparison.google.total / totalReminders : 0,
    },
  ];

  return (
    <div className="mt-4 p-4 rounded-lg border bg-card">
      <h4 className="text-sm font-medium mb-3 flex items-center gap-2">
        <Phone className="w-4 h-4 text-primary" />
        Voice AI Provider Comparison
      </h4>
      <p className="text-xs text-muted-foreground mb-3">
        Compare the cost per voice reminder across different AI voice providers
      </p>
      <div className="space-y-2">
        {providers.map((provider) => (
          <div 
            key={provider.name}
            className={cn(
              "flex items-center justify-between p-3 rounded-lg border",
              provider.quality === 5 && "bg-blue-50/50 dark:bg-blue-950/20 border-blue-200/50 dark:border-blue-900/30",
              provider.quality === 4 && "bg-slate-50/50 dark:bg-slate-950/20",
              provider.quality === 3 && "bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-200/50 dark:border-emerald-900/30"
            )}
          >
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="font-medium text-sm">{provider.name}</span>
                <div className="flex">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star 
                      key={i} 
                      className={cn(
                        "w-3 h-3",
                        i < provider.quality ? "text-amber-400 fill-amber-400" : "text-muted-foreground/30"
                      )} 
                    />
                  ))}
                </div>
              </div>
              <p className="text-xs text-muted-foreground">{provider.description}</p>
            </div>
            <div className="text-right">
              <p className="text-sm font-semibold">{formatCurrency(provider.perReminder)}</p>
              <p className="text-xs text-muted-foreground">per reminder</p>
              <p className="text-xs text-muted-foreground mt-1">{formatCurrency(provider.data.total)}/mo</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

interface ExampleBreakdownProps {
  appointments: number;
  remindersPerAppointment: number;
  avgTransactionValue: number;
  costs: {
    email: number;
    sms: number;
    voice: number;
    stripe: number;
    total: number;
  };
  channels: { email: boolean; sms: boolean; voice: boolean };
}

export function ExampleBreakdown({ appointments, remindersPerAppointment, avgTransactionValue, costs, channels }: ExampleBreakdownProps) {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  };

  const totalReminders = appointments * remindersPerAppointment;
  const costPerAppointment = costs.total / appointments;

  return (
    <div className="p-4 rounded-lg border bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20">
      <h4 className="text-sm font-medium mb-2 flex items-center gap-2">
        <DollarSign className="w-4 h-4 text-primary" />
        Your Monthly Cost Breakdown
      </h4>
      <p className="text-xs text-muted-foreground mb-3">
        {appointments} appointments × {remindersPerAppointment} reminders = {totalReminders} total reminders
      </p>
      
      <div className="space-y-1 text-sm font-mono bg-background/50 rounded p-3 border">
        {channels.email && (
          <div className="flex justify-between">
            <span className="text-muted-foreground">├── Email Reminders:</span>
            <span className="text-emerald-600">{costs.email === 0 ? 'FREE' : formatCurrency(costs.email)}</span>
          </div>
        )}
        {channels.sms && (
          <div className="flex justify-between">
            <span className="text-muted-foreground">├── SMS Reminders:</span>
            <span>{formatCurrency(costs.sms)}</span>
          </div>
        )}
        {channels.voice && (
          <div className="flex justify-between">
            <span className="text-muted-foreground">├── Voice Reminders:</span>
            <span>{formatCurrency(costs.voice)}</span>
          </div>
        )}
        {avgTransactionValue > 0 && (
          <div className="flex justify-between">
            <span className="text-muted-foreground">├── Stripe Fees:</span>
            <span className="text-purple-600">{formatCurrency(costs.stripe)}</span>
          </div>
        )}
        <div className="flex justify-between pt-2 border-t border-border/50 font-semibold">
          <span>└── TOTAL:</span>
          <span className="text-primary">{formatCurrency(costs.total)}/month</span>
        </div>
      </div>

      <div className="mt-3 p-2 rounded bg-primary/10 text-center">
        <span className="text-sm">That's </span>
        <span className="text-lg font-bold text-primary">{formatCurrency(costPerAppointment)}</span>
        <span className="text-sm"> per appointment to remind & collect payment</span>
      </div>
    </div>
  );
}
