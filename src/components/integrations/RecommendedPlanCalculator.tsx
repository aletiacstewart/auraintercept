import { useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { 
  Target, 
  DollarSign, 
  Mail, 
  MessageSquare, 
  Phone, 
  Sparkles,
  CheckCircle2,
  TrendingUp,
  Users,
  ArrowRight,
  Star,
} from 'lucide-react';
import { cn } from '@/lib/utils';

// Pricing constants
const PRICING = {
  email: { free: 3000, paidThreshold: 20 },
  sms: { phoneNumber: 1.15, perMessage: 0.0079 },
  voice: { phoneNumber: 1.15, perMinute: 0.014, ttsPerReminder: 0.11 },
};

const EFFECTIVENESS = {
  email: { openRate: 0.45, responseRate: 0.15, noShowReduction: 0.10 },
  sms: { openRate: 0.98, responseRate: 0.45, noShowReduction: 0.25 },
  voice: { openRate: 0.85, responseRate: 0.65, noShowReduction: 0.35 },
};

interface RecommendedPlan {
  name: string;
  description: string;
  channels: { email: boolean; sms: boolean; voice: boolean };
  monthlyCost: number;
  costPerAppointment: number;
  estimatedNoShowReduction: number;
  estimatedSavings: number;
  roi: number;
  pros: string[];
  cons: string[];
  bestFor: string;
}

export function RecommendedPlanCalculator() {
  const [monthlyAppointments, setMonthlyAppointments] = useState(100);
  const [avgServiceValue, setAvgServiceValue] = useState(50);
  const [currentNoShowRate, setCurrentNoShowRate] = useState(15);
  const [monthlyBudget, setMonthlyBudget] = useState(50);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatCurrencyDecimal = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  };

  const calculateCost = (channels: { email: boolean; sms: boolean; voice: boolean }, reminders: number) => {
    let cost = 0;
    if (channels.email) {
      cost += reminders > PRICING.email.free ? PRICING.email.paidThreshold : 0;
    }
    if (channels.sms) {
      cost += PRICING.sms.phoneNumber + (reminders * PRICING.sms.perMessage);
    }
    if (channels.voice) {
      cost += PRICING.voice.phoneNumber + (reminders * 0.5 * PRICING.voice.perMinute) + (reminders * PRICING.voice.ttsPerReminder);
    }
    return cost;
  };

  const calculateNoShowReduction = (channels: { email: boolean; sms: boolean; voice: boolean }) => {
    let reduction = 0;
    if (channels.email) reduction += EFFECTIVENESS.email.noShowReduction;
    if (channels.sms) reduction += EFFECTIVENESS.sms.noShowReduction;
    if (channels.voice) reduction += EFFECTIVENESS.voice.noShowReduction;
    // Cap at 50% reduction
    return Math.min(reduction, 0.50);
  };

  const plans = useMemo<RecommendedPlan[]>(() => {
    const remindersPerAppointment = 2;
    const totalReminders = monthlyAppointments * remindersPerAppointment;
    const currentLostRevenue = monthlyAppointments * (currentNoShowRate / 100) * avgServiceValue;

    const generatePlan = (
      name: string, 
      description: string, 
      channels: { email: boolean; sms: boolean; voice: boolean },
      pros: string[],
      cons: string[],
      bestFor: string
    ): RecommendedPlan => {
      const monthlyCost = calculateCost(channels, totalReminders);
      const noShowReduction = calculateNoShowReduction(channels);
      const newNoShowRate = Math.max(0, currentNoShowRate - (currentNoShowRate * noShowReduction));
      const estimatedSavings = currentLostRevenue * noShowReduction;
      const roi = monthlyCost > 0 ? ((estimatedSavings - monthlyCost) / monthlyCost) * 100 : 0;

      return {
        name,
        description,
        channels,
        monthlyCost,
        costPerAppointment: monthlyCost / monthlyAppointments,
        estimatedNoShowReduction: noShowReduction * 100,
        estimatedSavings,
        roi,
        pros,
        cons,
        bestFor,
      };
    };

    return [
      generatePlan(
        'Budget Starter',
        'Email only - perfect for getting started',
        { email: true, sms: false, voice: false },
        ['Free up to 3,000 emails/month', 'No phone number required', 'Easy to set up'],
        ['Lower open rates (~45%)', 'May land in spam', 'Less urgent feel'],
        'New businesses with tight budgets'
      ),
      generatePlan(
        'Smart Value',
        'Email + SMS - best bang for your buck',
        { email: true, sms: true, voice: false },
        ['98% SMS open rate', 'Dual touchpoints', 'Affordable'],
        ['Requires phone number ($1.15/mo)', 'SMS costs add up at scale'],
        'Growing businesses with 50-500 appointments/month'
      ),
      generatePlan(
        'Maximum Impact',
        'All channels - premium customer experience',
        { email: true, sms: true, voice: true },
        ['Highest show rates', 'Premium feel', 'Multiple touchpoints'],
        ['Highest cost', 'Requires all integrations'],
        'High-value services ($100+) or high no-show rates'
      ),
      generatePlan(
        'Voice Priority',
        'Email + Voice - personal touch without SMS',
        { email: true, sms: false, voice: true },
        ['Very personal feel', 'High engagement', 'Great for older demographics'],
        ['Higher cost than SMS', 'Some prefer text'],
        'Medical, legal, or senior-focused businesses'
      ),
    ];
  }, [monthlyAppointments, avgServiceValue, currentNoShowRate]);

  const recommendedPlan = useMemo(() => {
    // Filter plans within budget
    const affordablePlans = plans.filter(p => p.monthlyCost <= monthlyBudget);
    
    if (affordablePlans.length === 0) {
      // If no plan fits budget, return Budget Starter
      return plans[0];
    }

    // For high-value services, prefer more channels
    if (avgServiceValue >= 100 && affordablePlans.some(p => p.name === 'Maximum Impact')) {
      return affordablePlans.find(p => p.name === 'Maximum Impact')!;
    }

    // For high no-show rates, prefer more channels
    if (currentNoShowRate >= 20 && affordablePlans.some(p => p.channels.sms)) {
      const smsPlans = affordablePlans.filter(p => p.channels.sms);
      return smsPlans.sort((a, b) => b.roi - a.roi)[0];
    }

    // Otherwise, pick the one with best ROI within budget
    return affordablePlans.sort((a, b) => b.roi - a.roi)[0];
  }, [plans, monthlyBudget, avgServiceValue, currentNoShowRate]);

  const currentLostRevenue = monthlyAppointments * (currentNoShowRate / 100) * avgServiceValue;

  return (
    <Card className="border-border/50">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Target className="w-5 h-5 text-primary" />
          Recommended Plan Calculator
        </CardTitle>
        <CardDescription>
          Tell us about your business to get a personalized communication strategy recommendation
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Input Section */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          <div className="space-y-3">
            <Label className="flex items-center gap-2">
              <Users className="w-4 h-4 text-muted-foreground" />
              Monthly Appointments
            </Label>
            <div className="flex items-center gap-2">
              <Slider
                value={[monthlyAppointments]}
                onValueChange={(v) => setMonthlyAppointments(v[0])}
                min={10}
                max={1000}
                step={10}
                className="flex-1"
              />
              <span className="text-sm font-semibold w-12 text-right">{monthlyAppointments}</span>
            </div>
          </div>

          <div className="space-y-3">
            <Label className="flex items-center gap-2">
              <DollarSign className="w-4 h-4 text-muted-foreground" />
              Avg. Service Value
            </Label>
            <div className="relative">
              <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                type="number"
                value={avgServiceValue}
                onChange={(e) => setAvgServiceValue(Number(e.target.value))}
                className="pl-9"
                min={10}
              />
            </div>
          </div>

          <div className="space-y-3">
            <Label className="flex items-center gap-2">
              Current No-Show Rate
            </Label>
            <div className="flex items-center gap-2">
              <Slider
                value={[currentNoShowRate]}
                onValueChange={(v) => setCurrentNoShowRate(v[0])}
                min={1}
                max={50}
                step={1}
                className="flex-1"
              />
              <span className="text-sm font-semibold w-12 text-right">{currentNoShowRate}%</span>
            </div>
          </div>

          <div className="space-y-3">
            <Label className="flex items-center gap-2">
              Monthly Budget
            </Label>
            <div className="relative">
              <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                type="number"
                value={monthlyBudget}
                onChange={(e) => setMonthlyBudget(Number(e.target.value))}
                className="pl-9"
                min={0}
              />
            </div>
          </div>
        </div>

        {/* Current Loss Display */}
        <div className="p-4 rounded-lg bg-red-50/50 dark:bg-red-950/20 border border-red-200/50 dark:border-red-900/30">
          <p className="text-sm text-muted-foreground">
            With a {currentNoShowRate}% no-show rate, you're currently losing approximately:
          </p>
          <p className="text-2xl font-bold text-red-600 dark:text-red-400">
            {formatCurrency(currentLostRevenue)}/month
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            ({Math.round(monthlyAppointments * (currentNoShowRate / 100))} missed appointments × {formatCurrency(avgServiceValue)} avg value)
          </p>
        </div>

        {/* Recommended Plan Highlight */}
        <div className="relative">
          <div className="absolute -top-3 left-4">
            <Badge className="bg-primary text-primary-foreground">
              <Sparkles className="w-3 h-3 mr-1" />
              Recommended for You
            </Badge>
          </div>
          <div className="p-6 rounded-lg border-2 border-primary bg-primary/5">
            <div className="flex flex-col lg:flex-row lg:items-start gap-6">
              <div className="flex-1 space-y-4">
                <div>
                  <h3 className="text-xl font-bold">{recommendedPlan.name}</h3>
                  <p className="text-muted-foreground">{recommendedPlan.description}</p>
                </div>

                <div className="flex items-center gap-3">
                  {recommendedPlan.channels.email && (
                    <div className="flex items-center gap-1 px-2 py-1 rounded bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 text-sm">
                      <Mail className="w-3.5 h-3.5" />
                      Email
                    </div>
                  )}
                  {recommendedPlan.channels.sms && (
                    <div className="flex items-center gap-1 px-2 py-1 rounded bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 text-sm">
                      <MessageSquare className="w-3.5 h-3.5" />
                      SMS
                    </div>
                  )}
                  {recommendedPlan.channels.voice && (
                    <div className="flex items-center gap-1 px-2 py-1 rounded bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 text-sm">
                      <Phone className="w-3.5 h-3.5" />
                      Voice
                    </div>
                  )}
                </div>

                <div className="space-y-1">
                  <p className="text-sm font-medium">Why this plan?</p>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    {recommendedPlan.pros.slice(0, 2).map((pro, i) => (
                      <li key={i} className="flex items-center gap-2">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                        {pro}
                      </li>
                    ))}
                  </ul>
                </div>

                <p className="text-xs text-muted-foreground">
                  <strong>Best for:</strong> {recommendedPlan.bestFor}
                </p>
              </div>

              <div className="lg:w-64 space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 rounded-lg bg-background border">
                    <p className="text-xs text-muted-foreground">Monthly Cost</p>
                    <p className="text-lg font-bold">
                      {recommendedPlan.monthlyCost === 0 ? 'FREE' : formatCurrencyDecimal(recommendedPlan.monthlyCost)}
                    </p>
                  </div>
                  <div className="p-3 rounded-lg bg-background border">
                    <p className="text-xs text-muted-foreground">Per Appointment</p>
                    <p className="text-lg font-bold">
                      {recommendedPlan.costPerAppointment === 0 ? 'FREE' : formatCurrencyDecimal(recommendedPlan.costPerAppointment)}
                    </p>
                  </div>
                </div>

                <div className="p-3 rounded-lg bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200/50 dark:border-emerald-900/30">
                  <div className="flex items-center gap-2 mb-1">
                    <TrendingUp className="w-4 h-4 text-emerald-600" />
                    <p className="text-xs text-muted-foreground">Estimated Monthly Savings</p>
                  </div>
                  <p className="text-xl font-bold text-emerald-600">
                    {formatCurrency(recommendedPlan.estimatedSavings)}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    ~{recommendedPlan.estimatedNoShowReduction.toFixed(0)}% fewer no-shows
                  </p>
                </div>

                {recommendedPlan.roi > 0 && (
                  <div className="text-center p-2 rounded bg-primary/10">
                    <p className="text-sm">
                      <strong className="text-primary">{recommendedPlan.roi.toFixed(0)}% ROI</strong>
                      <span className="text-muted-foreground"> expected return</span>
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* All Plans Comparison */}
        <div className="space-y-3">
          <h4 className="font-medium text-sm text-muted-foreground">Compare All Plans</h4>
          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
            {plans.map((plan) => {
              const isRecommended = plan.name === recommendedPlan.name;
              const isWithinBudget = plan.monthlyCost <= monthlyBudget;

              return (
                <div
                  key={plan.name}
                  className={cn(
                    'p-4 rounded-lg border transition-all',
                    isRecommended && 'border-primary bg-primary/5',
                    !isWithinBudget && 'opacity-50'
                  )}
                >
                  <div className="flex items-start justify-between mb-2">
                    <h5 className="font-semibold text-sm">{plan.name}</h5>
                    {isRecommended && <Star className="w-4 h-4 text-primary fill-primary" />}
                  </div>

                  <div className="flex items-center gap-1 mb-3">
                    {plan.channels.email && <Mail className="w-3.5 h-3.5 text-emerald-500" />}
                    {plan.channels.sms && <MessageSquare className="w-3.5 h-3.5 text-red-500" />}
                    {plan.channels.voice && <Phone className="w-3.5 h-3.5 text-blue-500" />}
                  </div>

                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Cost</span>
                      <span className={cn('font-medium', !isWithinBudget && 'text-red-500')}>
                        {plan.monthlyCost === 0 ? 'FREE' : formatCurrencyDecimal(plan.monthlyCost)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Savings</span>
                      <span className="font-medium text-emerald-600">{formatCurrency(plan.estimatedSavings)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">ROI</span>
                      <span className="font-medium">{plan.roi > 0 ? `${plan.roi.toFixed(0)}%` : 'N/A'}</span>
                    </div>
                  </div>

                  {!isWithinBudget && (
                    <p className="text-xs text-red-500 mt-2">Over budget</p>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
