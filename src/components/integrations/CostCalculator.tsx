import { useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { 
  Calculator, 
  Mail, 
  Phone, 
  MessageSquare, 
  DollarSign, 
  TrendingUp,
  Award,
  BarChart3,
  Zap,
} from 'lucide-react';
import { cn } from '@/lib/utils';

// Pricing constants (approximate)
const PRICING = {
  twilio: {
    phoneNumber: 1.15, // per month
    smsOutbound: 0.0079,
    voiceOutbound: 0.014, // per minute
    avgCallDuration: 0.5, // assume 30 seconds per reminder call
  },
  elevenlabs: {
    charsPerMinute: 1000, // approximate
    freeChars: 10000,
    starterPrice: 5,
    starterChars: 30000,
    creatorPrice: 22,
    creatorChars: 100000,
  },
  resend: {
    freeEmails: 3000,
    proPrice: 20,
    proEmails: 50000,
  },
  stripe: {
    percentFee: 0.029,
    fixedFee: 0.30,
  },
};

// Effectiveness ratings (approximate based on industry data)
const EFFECTIVENESS = {
  email: { openRate: 0.45, responseRate: 0.15 },
  sms: { openRate: 0.98, responseRate: 0.45 },
  voice: { openRate: 0.85, responseRate: 0.65 },
};

export function CostCalculator() {
  const [appointments, setAppointments] = useState(100);
  const [avgTransactionValue, setAvgTransactionValue] = useState(50);
  const [channels, setChannels] = useState({
    email: true,
    sms: false,
    voice: false,
  });
  const [remindersPerAppointment, setRemindersPerAppointment] = useState(2);

  const costs = useMemo(() => {
    const totalReminders = appointments * remindersPerAppointment;
    
    // Calculate costs for ALL channels (for comparison)
    const calculateEmailCost = (reminders: number) => {
      if (reminders > PRICING.resend.freeEmails) {
        return PRICING.resend.proPrice;
      }
      return 0;
    };

    const calculateSmsCost = (reminders: number) => {
      return PRICING.twilio.phoneNumber + (reminders * PRICING.twilio.smsOutbound);
    };

    const calculateVoiceCost = (reminders: number) => {
      const totalMinutes = reminders * PRICING.twilio.avgCallDuration;
      let twilioCost = PRICING.twilio.phoneNumber + (totalMinutes * PRICING.twilio.voiceOutbound);
      
      const totalChars = totalMinutes * PRICING.elevenlabs.charsPerMinute;
      let elevenLabsCost = 0;
      if (totalChars > PRICING.elevenlabs.freeChars) {
        if (totalChars <= PRICING.elevenlabs.starterChars) {
          elevenLabsCost = PRICING.elevenlabs.starterPrice;
        } else if (totalChars <= PRICING.elevenlabs.creatorChars) {
          elevenLabsCost = PRICING.elevenlabs.creatorPrice;
        } else {
          elevenLabsCost = 99;
        }
      }
      return twilioCost + elevenLabsCost;
    };

    // Costs for enabled channels
    const emailCost = channels.email ? calculateEmailCost(totalReminders) : 0;
    const smsCost = channels.sms ? calculateSmsCost(totalReminders) : 0;
    const voiceCost = channels.voice ? calculateVoiceCost(totalReminders) : 0;

    // Stripe costs
    const stripeRevenue = appointments * avgTransactionValue;
    const stripeCost = stripeRevenue > 0 
      ? (stripeRevenue * PRICING.stripe.percentFee) + (appointments * PRICING.stripe.fixedFee)
      : 0;

    // Comparison costs (all channels at current volume)
    const comparisonCosts = {
      email: calculateEmailCost(totalReminders),
      sms: calculateSmsCost(totalReminders),
      voice: calculateVoiceCost(totalReminders),
    };

    // Per-appointment costs
    const perAppointment = {
      email: comparisonCosts.email / appointments,
      sms: comparisonCosts.sms / appointments,
      voice: comparisonCosts.voice / appointments,
      stripe: stripeCost / appointments,
    };

    // Per-reminder costs
    const perReminder = {
      email: comparisonCosts.email / totalReminders,
      sms: comparisonCosts.sms / totalReminders,
      voice: comparisonCosts.voice / totalReminders,
    };

    // Cost-effectiveness score (lower cost per effective reach = better)
    const costEffectiveness = {
      email: perReminder.email > 0 ? perReminder.email / EFFECTIVENESS.email.responseRate : 0,
      sms: perReminder.sms / EFFECTIVENESS.sms.responseRate,
      voice: perReminder.voice / EFFECTIVENESS.voice.responseRate,
    };

    return {
      email: emailCost,
      sms: smsCost,
      voice: voiceCost,
      stripe: stripeCost,
      total: emailCost + smsCost + voiceCost + stripeCost,
      totalReminders,
      comparison: comparisonCosts,
      perAppointment,
      perReminder,
      costEffectiveness,
    };
  }, [appointments, avgTransactionValue, channels, remindersPerAppointment]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 4,
    }).format(amount);
  };

  const formatCurrencyShort = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  };

  // Determine best value channel
  const getBestValue = () => {
    const scores = [
      { channel: 'email', score: costs.costEffectiveness.email, cost: costs.comparison.email },
      { channel: 'sms', score: costs.costEffectiveness.sms, cost: costs.comparison.sms },
      { channel: 'voice', score: costs.costEffectiveness.voice, cost: costs.comparison.voice },
    ].filter(s => s.cost > 0 || s.channel === 'email');
    
    // Email is free under 3K, so it's best value at low volume
    if (costs.comparison.email === 0 && costs.totalReminders <= PRICING.resend.freeEmails) {
      return 'email';
    }
    
    return scores.sort((a, b) => a.score - b.score)[0]?.channel || 'email';
  };

  const bestValue = getBestValue();

  const channelConfig = [
    { 
      key: 'email', 
      label: 'Email', 
      icon: Mail, 
      color: 'emerald',
      bgClass: 'bg-emerald-50/50 dark:bg-emerald-950/20',
      borderClass: 'border-emerald-200 dark:border-emerald-900/50',
      textClass: 'text-emerald-600 dark:text-emerald-400',
    },
    { 
      key: 'sms', 
      label: 'SMS', 
      icon: MessageSquare, 
      color: 'red',
      bgClass: 'bg-red-50/50 dark:bg-red-950/20',
      borderClass: 'border-red-200 dark:border-red-900/50',
      textClass: 'text-red-600 dark:text-red-400',
    },
    { 
      key: 'voice', 
      label: 'Voice', 
      icon: Phone, 
      color: 'blue',
      bgClass: 'bg-blue-50/50 dark:bg-blue-950/20',
      borderClass: 'border-blue-200 dark:border-blue-900/50',
      textClass: 'text-blue-600 dark:text-blue-400',
    },
  ];

  return (
    <Card className="border-border/50">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calculator className="w-5 h-5 text-primary" />
          Cost Calculator & Comparison
        </CardTitle>
        <CardDescription>
          Estimate costs and compare channel effectiveness to optimize your reminder strategy
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Input Controls */}
        <div className="grid gap-6 md:grid-cols-4">
          <div className="space-y-3">
            <Label className="flex items-center justify-between">
              <span>Monthly Appointments</span>
              <span className="text-sm font-semibold text-primary">{appointments}</span>
            </Label>
            <Slider
              value={[appointments]}
              onValueChange={(v) => setAppointments(v[0])}
              min={10}
              max={1000}
              step={10}
            />
          </div>

          <div className="space-y-3">
            <Label className="flex items-center justify-between">
              <span>Reminders / Appt</span>
              <span className="text-sm font-semibold text-primary">{remindersPerAppointment}</span>
            </Label>
            <Slider
              value={[remindersPerAppointment]}
              onValueChange={(v) => setRemindersPerAppointment(v[0])}
              min={1}
              max={4}
              step={1}
            />
          </div>

          <div className="space-y-2">
            <Label>Avg. Transaction</Label>
            <div className="relative">
              <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                type="number"
                value={avgTransactionValue}
                onChange={(e) => setAvgTransactionValue(Number(e.target.value))}
                className="pl-9"
                min={0}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Active Channels</Label>
            <div className="flex gap-2">
              {channelConfig.map((ch) => (
                <button
                  key={ch.key}
                  onClick={() => setChannels((c) => ({ ...c, [ch.key]: !c[ch.key as keyof typeof c] }))}
                  className={cn(
                    'flex-1 p-2 rounded-lg border transition-all',
                    channels[ch.key as keyof typeof channels]
                      ? `${ch.bgClass} ${ch.borderClass}`
                      : 'bg-muted/30 border-border opacity-50'
                  )}
                >
                  <ch.icon className={cn('w-4 h-4 mx-auto', channels[ch.key as keyof typeof channels] ? ch.textClass : 'text-muted-foreground')} />
                </button>
              ))}
            </div>
          </div>
        </div>

        <Tabs defaultValue="summary" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="summary" className="flex items-center gap-1">
              <DollarSign className="w-4 h-4" />
              Summary
            </TabsTrigger>
            <TabsTrigger value="comparison" className="flex items-center gap-1">
              <BarChart3 className="w-4 h-4" />
              Compare
            </TabsTrigger>
            <TabsTrigger value="optimization" className="flex items-center gap-1">
              <Zap className="w-4 h-4" />
              Optimize
            </TabsTrigger>
          </TabsList>

          {/* Summary Tab */}
          <TabsContent value="summary" className="space-y-4 mt-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="p-4 rounded-lg bg-gradient-to-br from-primary/10 to-primary/5 border border-primary/20">
                <p className="text-sm text-muted-foreground mb-1">Estimated Monthly Cost</p>
                <p className="text-3xl font-bold text-primary">{formatCurrencyShort(costs.total)}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  {appointments} appointments × {remindersPerAppointment} reminders = {costs.totalReminders} total
                </p>
              </div>

              <div className="p-4 rounded-lg border bg-card">
                <p className="text-sm text-muted-foreground mb-1">Cost per Appointment</p>
                <p className="text-3xl font-bold">{formatCurrencyShort(costs.total / appointments)}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Including all selected channels + payment processing
                </p>
              </div>
            </div>

            <div className="space-y-2">
              {channelConfig.map((ch) => {
                const cost = costs[ch.key as keyof typeof costs.comparison] as number;
                const isEnabled = channels[ch.key as keyof typeof channels];
                if (!isEnabled && cost === 0) return null;
                
                return (
                  <div 
                    key={ch.key}
                    className={cn(
                      'flex items-center justify-between p-3 rounded-lg border',
                      isEnabled ? ch.bgClass : 'bg-muted/20',
                      !isEnabled && 'opacity-50'
                    )}
                  >
                    <div className="flex items-center gap-2">
                      <ch.icon className={cn('w-4 h-4', ch.textClass)} />
                      <span className="text-sm">{ch.label}</span>
                      {!isEnabled && <Badge variant="outline" className="text-xs">Not active</Badge>}
                    </div>
                    <span className="font-medium">{formatCurrencyShort(cost)}</span>
                  </div>
                );
              })}

              {avgTransactionValue > 0 && (
                <div className="flex items-center justify-between p-3 rounded-lg border bg-purple-50/50 dark:bg-purple-950/20">
                  <div className="flex items-center gap-2">
                    <DollarSign className="w-4 h-4 text-purple-500" />
                    <span className="text-sm">Stripe Fees</span>
                  </div>
                  <span className="font-medium">{formatCurrencyShort(costs.stripe)}</span>
                </div>
              )}
            </div>
          </TabsContent>

          {/* Comparison Tab */}
          <TabsContent value="comparison" className="space-y-4 mt-4">
            <div className="grid gap-4 md:grid-cols-3">
              {channelConfig.map((ch) => {
                const perAppt = costs.perAppointment[ch.key as keyof typeof costs.perAppointment];
                const perReminder = costs.perReminder[ch.key as keyof typeof costs.perReminder];
                const monthly = costs.comparison[ch.key as keyof typeof costs.comparison];
                const effectiveness = EFFECTIVENESS[ch.key as keyof typeof EFFECTIVENESS];
                const isBest = bestValue === ch.key;
                
                return (
                  <div 
                    key={ch.key}
                    className={cn(
                      'p-4 rounded-lg border relative',
                      ch.bgClass,
                      ch.borderClass,
                      isBest && 'ring-2 ring-primary'
                    )}
                  >
                    {isBest && (
                      <Badge className="absolute -top-2 -right-2 bg-primary">
                        <Award className="w-3 h-3 mr-1" />
                        Best Value
                      </Badge>
                    )}
                    
                    <div className="flex items-center gap-2 mb-3">
                      <ch.icon className={cn('w-5 h-5', ch.textClass)} />
                      <span className="font-semibold">{ch.label}</span>
                    </div>

                    <div className="space-y-3">
                      <div>
                        <p className="text-xs text-muted-foreground">Monthly Cost</p>
                        <p className="text-xl font-bold">{formatCurrencyShort(monthly)}</p>
                      </div>

                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <div>
                          <p className="text-xs text-muted-foreground">Per Appt</p>
                          <p className="font-medium">{formatCurrency(perAppt)}</p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">Per Reminder</p>
                          <p className="font-medium">{formatCurrency(perReminder)}</p>
                        </div>
                      </div>

                      <div className="pt-2 border-t space-y-2">
                        <div>
                          <div className="flex justify-between text-xs mb-1">
                            <span className="text-muted-foreground">Open Rate</span>
                            <span>{(effectiveness.openRate * 100).toFixed(0)}%</span>
                          </div>
                          <Progress value={effectiveness.openRate * 100} className="h-1.5" />
                        </div>
                        <div>
                          <div className="flex justify-between text-xs mb-1">
                            <span className="text-muted-foreground">Response Rate</span>
                            <span>{(effectiveness.responseRate * 100).toFixed(0)}%</span>
                          </div>
                          <Progress value={effectiveness.responseRate * 100} className="h-1.5" />
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="p-3 rounded-lg bg-muted/50 border border-dashed">
              <p className="text-xs text-muted-foreground">
                <strong className="text-foreground">Note:</strong> Open and response rates are industry averages. 
                Actual rates depend on message quality, timing, and your customer base.
              </p>
            </div>
          </TabsContent>

          {/* Optimization Tab */}
          <TabsContent value="optimization" className="space-y-4 mt-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="p-4 rounded-lg border bg-gradient-to-br from-emerald-50 to-emerald-100/50 dark:from-emerald-950/30 dark:to-emerald-900/20 border-emerald-200 dark:border-emerald-900/50">
                <div className="flex items-center gap-2 mb-3">
                  <TrendingUp className="w-5 h-5 text-emerald-600" />
                  <span className="font-semibold">Budget-Friendly Strategy</span>
                </div>
                <div className="space-y-2 text-sm">
                  <p className="text-muted-foreground">For {appointments} appointments/month:</p>
                  <ul className="space-y-1.5">
                    <li className="flex items-center gap-2">
                      <Mail className="w-4 h-4 text-emerald-500" />
                      <span>Email only: <strong>{formatCurrencyShort(costs.comparison.email)}/mo</strong></span>
                      {costs.totalReminders <= PRICING.resend.freeEmails && (
                        <Badge variant="secondary" className="text-xs">FREE</Badge>
                      )}
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="text-muted-foreground ml-6">→ {formatCurrency(costs.perAppointment.email)} per appointment</span>
                    </li>
                  </ul>
                  <p className="text-xs text-muted-foreground pt-2">
                    Best for businesses with email-responsive customers and tight budgets.
                  </p>
                </div>
              </div>

              <div className="p-4 rounded-lg border bg-gradient-to-br from-blue-50 to-blue-100/50 dark:from-blue-950/30 dark:to-blue-900/20 border-blue-200 dark:border-blue-900/50">
                <div className="flex items-center gap-2 mb-3">
                  <Zap className="w-5 h-5 text-blue-600" />
                  <span className="font-semibold">Maximum Reach Strategy</span>
                </div>
                <div className="space-y-2 text-sm">
                  <p className="text-muted-foreground">All channels combined:</p>
                  <ul className="space-y-1.5">
                    <li className="flex items-center gap-2">
                      <span>Email + SMS + Voice:</span>
                      <strong>{formatCurrencyShort(costs.comparison.email + costs.comparison.sms + costs.comparison.voice)}/mo</strong>
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="text-muted-foreground">→ {formatCurrency((costs.comparison.email + costs.comparison.sms + costs.comparison.voice) / appointments)} per appointment</span>
                    </li>
                  </ul>
                  <p className="text-xs text-muted-foreground pt-2">
                    Maximizes show rates with ~98% reach. Best for high-value appointments.
                  </p>
                </div>
              </div>
            </div>

            <div className="p-4 rounded-lg border bg-gradient-to-br from-amber-50 to-amber-100/50 dark:from-amber-950/30 dark:to-amber-900/20 border-amber-200 dark:border-amber-900/50">
              <div className="flex items-center gap-2 mb-3">
                <Award className="w-5 h-5 text-amber-600" />
                <span className="font-semibold">Recommended: Balanced Strategy</span>
              </div>
              <div className="space-y-2 text-sm">
                <p className="text-muted-foreground">Email + SMS for optimal cost-effectiveness:</p>
                <div className="grid grid-cols-3 gap-4 py-2">
                  <div>
                    <p className="text-xs text-muted-foreground">Monthly Cost</p>
                    <p className="text-lg font-bold">{formatCurrencyShort(costs.comparison.email + costs.comparison.sms)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Per Appointment</p>
                    <p className="text-lg font-bold">{formatCurrency((costs.comparison.email + costs.comparison.sms) / appointments)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Est. Reach</p>
                    <p className="text-lg font-bold">~98%</p>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground">
                  Email catches most customers, SMS ensures critical reminders get through. 
                  Add voice calls only for high-value appointments or chronic no-shows.
                </p>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}