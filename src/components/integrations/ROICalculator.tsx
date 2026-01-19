import { useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  TrendingUp, 
  DollarSign, 
  Calendar,
  PiggyBank,
  ArrowRight,
  CheckCircle2,
  AlertTriangle,
  BarChart3,
  Percent,
} from 'lucide-react';
import { cn } from '@/lib/utils';

// Effectiveness data based on industry research
const REMINDER_EFFECTIVENESS = {
  none: { noShowReduction: 0, name: 'No Reminders' },
  emailOnly: { noShowReduction: 0.10, name: 'Email Only' },
  smsOnly: { noShowReduction: 0.25, name: 'SMS Only' },
  emailSms: { noShowReduction: 0.32, name: 'Email + SMS' },
  emailVoice: { noShowReduction: 0.35, name: 'Email + Voice' },
  emailSmsVoice: { noShowReduction: 0.45, name: 'All Channels' },
};

// Monthly costs for each strategy
const STRATEGY_COSTS = {
  none: 0,
  emailOnly: 0, // Free tier
  smsOnly: (appointments: number, reminders: number) => 1.15 + (appointments * reminders * 0.0079),
  emailSms: (appointments: number, reminders: number) => 1.15 + (appointments * reminders * 0.0079),
  emailVoice: (appointments: number, reminders: number) => 1.15 + (appointments * reminders * 0.5 * 0.014) + (appointments * reminders * 0.11),
  emailSmsVoice: (appointments: number, reminders: number) => {
    const sms = 1.15 + (appointments * reminders * 0.0079);
    const voice = 1.15 + (appointments * reminders * 0.5 * 0.014) + (appointments * reminders * 0.11);
    return sms + voice;
  },
};

export function ROICalculator() {
  const [monthlyAppointments, setMonthlyAppointments] = useState(100);
  const [avgServiceValue, setAvgServiceValue] = useState(75);
  const [currentNoShowRate, setCurrentNoShowRate] = useState(18);
  const [remindersPerAppointment, setRemindersPerAppointment] = useState(2);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const calculations = useMemo(() => {
    const monthlyRevenuePotential = monthlyAppointments * avgServiceValue;
    const currentNoShows = Math.round(monthlyAppointments * (currentNoShowRate / 100));
    const currentLostRevenue = currentNoShows * avgServiceValue;
    const annualLostRevenue = currentLostRevenue * 12;

    // Calculate ROI for each strategy
    const strategies = Object.entries(REMINDER_EFFECTIVENESS).map(([key, data]) => {
      const costFn = STRATEGY_COSTS[key as keyof typeof STRATEGY_COSTS];
      const monthlyCost = typeof costFn === 'function' 
        ? costFn(monthlyAppointments, remindersPerAppointment) 
        : costFn;

      const reducedNoShowRate = currentNoShowRate * (1 - data.noShowReduction);
      const newNoShows = Math.round(monthlyAppointments * (reducedNoShowRate / 100));
      const appointmentsSaved = currentNoShows - newNoShows;
      const monthlyRevenueSaved = appointmentsSaved * avgServiceValue;
      const monthlyNetSavings = monthlyRevenueSaved - monthlyCost;
      const annualNetSavings = monthlyNetSavings * 12;
      const roi = monthlyCost > 0 ? ((monthlyNetSavings / monthlyCost) * 100) : (monthlyRevenueSaved > 0 ? Infinity : 0);
      const paybackDays = monthlyCost > 0 && monthlyNetSavings > 0 
        ? Math.ceil((monthlyCost / monthlyNetSavings) * 30) 
        : 0;

      return {
        key,
        name: data.name,
        noShowReduction: data.noShowReduction * 100,
        newNoShowRate: reducedNoShowRate,
        monthlyCost,
        appointmentsSaved,
        monthlyRevenueSaved,
        monthlyNetSavings,
        annualNetSavings,
        roi,
        paybackDays,
      };
    });

    // Best strategy (highest net savings)
    const bestStrategy = strategies
      .filter(s => s.key !== 'none')
      .sort((a, b) => b.monthlyNetSavings - a.monthlyNetSavings)[0];

    return {
      monthlyRevenuePotential,
      currentNoShows,
      currentLostRevenue,
      annualLostRevenue,
      strategies,
      bestStrategy,
    };
  }, [monthlyAppointments, avgServiceValue, currentNoShowRate, remindersPerAppointment]);

  return (
    <div className="space-y-6">
        {/* Input Section */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <div className="space-y-2">
            <Label className="text-sm">Monthly Appointments</Label>
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

          <div className="space-y-2">
            <Label className="text-sm">Average Service Value</Label>
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

          <div className="space-y-2">
            <Label className="text-sm">Current No-Show Rate</Label>
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

          <div className="space-y-2">
            <Label className="text-sm">Reminders per Appointment</Label>
            <div className="flex items-center gap-2">
              <Slider
                value={[remindersPerAppointment]}
                onValueChange={(v) => setRemindersPerAppointment(v[0])}
                min={1}
                max={4}
                step={1}
                className="flex-1"
              />
              <span className="text-sm font-semibold w-12 text-right">{remindersPerAppointment}</span>
            </div>
          </div>
        </div>

        {/* Current Loss Highlight */}
        <div className="grid gap-4 md:grid-cols-3">
          <div className="p-4 rounded-lg bg-red-50 dark:bg-red-950/30 border border-red-200/50 dark:border-red-900/30">
            <div className="flex items-center gap-2 mb-2">
              <AlertTriangle className="w-4 h-4 text-red-500" />
              <p className="text-sm font-medium text-red-700 dark:text-red-400">Current Monthly Loss</p>
            </div>
            <p className="text-3xl font-bold text-red-600 dark:text-red-400">
              {formatCurrency(calculations.currentLostRevenue)}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              {calculations.currentNoShows} no-shows × {formatCurrency(avgServiceValue)}
            </p>
          </div>

          <div className="p-4 rounded-lg bg-amber-50 dark:bg-amber-950/30 border border-amber-200/50 dark:border-amber-900/30">
            <div className="flex items-center gap-2 mb-2">
              <Calendar className="w-4 h-4 text-amber-500" />
              <p className="text-sm font-medium text-amber-700 dark:text-amber-400">Annual Loss</p>
            </div>
            <p className="text-3xl font-bold text-amber-600 dark:text-amber-400">
              {formatCurrency(calculations.annualLostRevenue)}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              If no action is taken
            </p>
          </div>

          <div className="p-4 rounded-lg bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200/50 dark:border-emerald-900/30">
            <div className="flex items-center gap-2 mb-2">
              <PiggyBank className="w-4 h-4 text-emerald-500" />
              <p className="text-sm font-medium text-emerald-700 dark:text-emerald-400">Recoverable (Best Strategy)</p>
            </div>
            <p className="text-3xl font-bold text-emerald-600 dark:text-emerald-400">
              {formatCurrency(calculations.bestStrategy?.annualNetSavings || 0)}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Per year with {calculations.bestStrategy?.name}
            </p>
          </div>
        </div>

        <Tabs defaultValue="comparison" className="w-full">
          <TabsList className="inline-flex h-auto p-1.5 bg-muted/30 rounded-full border border-border/50 gap-1">
            <TabsTrigger value="comparison" className="flex items-center gap-1 px-4 py-2 rounded-full data-[state=active]:bg-background data-[state=active]:shadow-sm data-[state=active]:border data-[state=active]:border-border/50 transition-all">
              <BarChart3 className="w-4 h-4" />
              Strategy Comparison
            </TabsTrigger>
            <TabsTrigger value="breakdown" className="flex items-center gap-1 px-4 py-2 rounded-full data-[state=active]:bg-background data-[state=active]:shadow-sm data-[state=active]:border data-[state=active]:border-border/50 transition-all">
              <Percent className="w-4 h-4" />
              ROI Breakdown
            </TabsTrigger>
          </TabsList>


          {/* Strategy Comparison Tab */}
          <TabsContent value="comparison" className="mt-4 space-y-4">
            <div className="space-y-3">
              {calculations.strategies.filter(s => s.key !== 'none').map((strategy) => {
                const isBest = strategy.key === calculations.bestStrategy?.key;
                const savingsPercent = calculations.currentLostRevenue > 0 
                  ? (strategy.monthlyRevenueSaved / calculations.currentLostRevenue) * 100 
                  : 0;

                return (
                  <div
                    key={strategy.key}
                    className={cn(
                      'p-4 rounded-lg border transition-all',
                      isBest 
                        ? 'border-primary bg-primary/5 ring-1 ring-primary' 
                        : 'border-border bg-card hover:bg-muted/30'
                    )}
                  >
                    <div className="flex flex-col lg:flex-row lg:items-center gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-semibold">{strategy.name}</h4>
                          {isBest && (
                            <Badge className="bg-primary text-primary-foreground text-xs">
                              Best ROI
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground">
                          Reduces no-shows by ~{strategy.noShowReduction.toFixed(0)}%
                          {' → '}{strategy.newNoShowRate.toFixed(1)}% no-show rate
                        </p>
                      </div>

                      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
                        <div>
                          <p className="text-xs text-muted-foreground">Monthly Cost</p>
                          <p className="font-semibold">
                            {strategy.monthlyCost === 0 ? 'FREE' : formatCurrency(strategy.monthlyCost)}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">Revenue Saved</p>
                          <p className="font-semibold text-emerald-600">
                            +{formatCurrency(strategy.monthlyRevenueSaved)}/mo
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">Net Profit</p>
                          <p className={cn(
                            'font-semibold',
                            strategy.monthlyNetSavings > 0 ? 'text-emerald-600' : 'text-muted-foreground'
                          )}>
                            {formatCurrency(strategy.monthlyNetSavings)}/mo
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">ROI</p>
                          <p className="font-semibold text-primary">
                            {strategy.roi === Infinity ? '∞' : `${strategy.roi.toFixed(0)}%`}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Visual progress bar */}
                    <div className="mt-3">
                      <div className="flex justify-between text-xs text-muted-foreground mb-1">
                        <span>Revenue recovered</span>
                        <span>{savingsPercent.toFixed(0)}% of lost revenue</span>
                      </div>
                      <Progress value={savingsPercent} className="h-2" />
                    </div>
                  </div>
                );
              })}
            </div>
          </TabsContent>

          {/* ROI Breakdown Tab */}
          <TabsContent value="breakdown" className="mt-4 space-y-4">
            {calculations.bestStrategy && (
              <div className="space-y-4">
                <div className="p-4 rounded-lg border bg-gradient-to-br from-primary/5 to-primary/10">
                  <h4 className="font-semibold mb-4 flex items-center gap-2">
                    <CheckCircle2 className="w-5 h-5 text-primary" />
                    ROI Analysis: {calculations.bestStrategy.name}
                  </h4>

                  <div className="grid gap-4 md:grid-cols-2">
                    {/* Monthly Breakdown */}
                    <div className="space-y-3">
                      <h5 className="text-sm font-medium text-muted-foreground">Monthly Breakdown</h5>
                      <div className="space-y-2 text-sm font-mono bg-background/50 rounded p-3 border">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Current no-shows:</span>
                          <span>{calculations.currentNoShows}/month</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">After reminders:</span>
                          <span>{calculations.currentNoShows - calculations.bestStrategy.appointmentsSaved}/month</span>
                        </div>
                        <div className="flex justify-between text-emerald-600">
                          <span>Appointments saved:</span>
                          <span>+{calculations.bestStrategy.appointmentsSaved}/month</span>
                        </div>
                        <div className="border-t pt-2 flex justify-between">
                          <span className="text-muted-foreground">Revenue recovered:</span>
                          <span className="text-emerald-600 font-semibold">
                            +{formatCurrency(calculations.bestStrategy.monthlyRevenueSaved)}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Reminder costs:</span>
                          <span className="text-red-500">
                            -{formatCurrency(calculations.bestStrategy.monthlyCost)}
                          </span>
                        </div>
                        <div className="border-t pt-2 flex justify-between font-bold">
                          <span>Net monthly profit:</span>
                          <span className="text-primary">
                            {formatCurrency(calculations.bestStrategy.monthlyNetSavings)}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Annual Projection */}
                    <div className="space-y-3">
                      <h5 className="text-sm font-medium text-muted-foreground">Annual Projection</h5>
                      <div className="space-y-4">
                        <div className="p-3 rounded-lg bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200/50 dark:border-emerald-900/30">
                          <p className="text-sm text-muted-foreground">Annual Net Savings</p>
                          <p className="text-2xl font-bold text-emerald-600">
                            {formatCurrency(calculations.bestStrategy.annualNetSavings)}
                          </p>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                          <div className="p-3 rounded-lg border bg-card">
                            <p className="text-xs text-muted-foreground">ROI</p>
                            <p className="text-xl font-bold text-primary">
                              {calculations.bestStrategy.roi === Infinity 
                                ? '∞%' 
                                : `${calculations.bestStrategy.roi.toFixed(0)}%`}
                            </p>
                          </div>
                          <div className="p-3 rounded-lg border bg-card">
                            <p className="text-xs text-muted-foreground">Payback Period</p>
                            <p className="text-xl font-bold">
                              {calculations.bestStrategy.paybackDays === 0 
                                ? 'Instant' 
                                : `${calculations.bestStrategy.paybackDays} days`}
                            </p>
                          </div>
                        </div>

                        <div className="p-3 rounded-lg border bg-muted/30">
                          <p className="text-sm">
                            <strong>Bottom line:</strong> For every $1 spent on reminders, you recover{' '}
                            <strong className="text-primary">
                              ${((calculations.bestStrategy.monthlyRevenueSaved / calculations.bestStrategy.monthlyCost) || 0).toFixed(2)}
                            </strong>
                            {' '}in revenue.
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Time-based projection */}
                <div className="p-4 rounded-lg border bg-card">
                  <h5 className="text-sm font-medium mb-3">Projected Savings Timeline</h5>
                  <div className="grid grid-cols-4 gap-3">
                    {[1, 3, 6, 12].map((months) => (
                      <div key={months} className="text-center p-3 rounded-lg bg-muted/30">
                        <p className="text-xs text-muted-foreground mb-1">
                          {months} {months === 1 ? 'Month' : 'Months'}
                        </p>
                        <p className="font-bold text-emerald-600">
                          {formatCurrency(calculations.bestStrategy!.monthlyNetSavings * months)}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
  );
}
