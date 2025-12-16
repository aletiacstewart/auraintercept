import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
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
  Save,
  History,
  ArrowUpRight,
  ArrowDownRight,
  Minus,
  Trash2,
  Bell,
  AlertTriangle,
  Info,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { format, startOfMonth, endOfMonth, subMonths } from 'date-fns';
import { CostCalculatorHelp, TTSComparisonTable, ExampleBreakdown } from './CostCalculatorHelp';

// Pricing constants (approximate)
const PRICING = {
  twilio: {
    phoneNumber: 1.15,
    smsOutbound: 0.0079,
    voiceOutbound: 0.014,
    avgCallDuration: 0.5,
  },
  elevenlabs: {
    charsPerMinute: 1000,
    freeChars: 10000,
    starterPrice: 5,
    starterChars: 30000,
    creatorPrice: 22,
    creatorChars: 100000,
  },
  openaiTts: {
    pricePerThousandChars: 0.015,
    hdPricePerThousandChars: 0.030,
  },
  googleTts: {
    freeChars: 1000000,
    standardPricePerMillion: 4,
    wavenetPricePerMillion: 16,
    neural2PricePerMillion: 16,
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

const EFFECTIVENESS = {
  email: { openRate: 0.45, responseRate: 0.15 },
  sms: { openRate: 0.98, responseRate: 0.45 },
  voice: { openRate: 0.85, responseRate: 0.65 },
};

export function CostCalculator() {
  const { companyId } = useAuth();
  const queryClient = useQueryClient();
  const [appointments, setAppointments] = useState(100);
  const [avgTransactionValue, setAvgTransactionValue] = useState(50);
  const [channels, setChannels] = useState({
    email: true,
    sms: false,
    voice: false,
  });
  const [remindersPerAppointment, setRemindersPerAppointment] = useState(2);

  const currentMonth = format(new Date(), 'yyyy-MM');

  // Fetch saved estimates
  const { data: savedEstimates, isLoading: loadingEstimates } = useQuery({
    queryKey: ['cost-estimates', companyId],
    queryFn: async () => {
      if (!companyId) return [];
      const { data, error } = await supabase
        .from('cost_estimates')
        .select('*')
        .eq('company_id', companyId)
        .order('month_year', { ascending: false })
        .limit(12);
      if (error) throw error;
      return data || [];
    },
    enabled: !!companyId,
  });

  // Fetch company alert settings
  const { data: alertSettings, isLoading: loadingAlerts } = useQuery({
    queryKey: ['cost-alert-settings', companyId],
    queryFn: async () => {
      if (!companyId) return null;
      const { data, error } = await supabase
        .from('companies')
        .select('cost_alert_enabled, cost_alert_threshold, cost_alert_email, last_cost_alert_at')
        .eq('id', companyId)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!companyId,
  });

  // Fetch actual costs from reminder_logs
  const { data: actualCosts, isLoading: loadingActual } = useQuery({
    queryKey: ['actual-costs', companyId],
    queryFn: async () => {
      if (!companyId) return [];
      
      // Get last 6 months of data
      const months: { month: string; email: number; sms: number; voice: number; appointments: number }[] = [];
      
      for (let i = 0; i < 6; i++) {
        const date = subMonths(new Date(), i);
        const monthStr = format(date, 'yyyy-MM');
        const start = startOfMonth(date).toISOString();
        const end = endOfMonth(date).toISOString();
        
        // Get reminder counts
        const { data: reminders } = await supabase
          .from('reminder_logs')
          .select('channel')
          .eq('company_id', companyId)
          .gte('created_at', start)
          .lte('created_at', end);
        
        // Get appointment count
        const { count: apptCount } = await supabase
          .from('appointments')
          .select('id', { count: 'exact', head: true })
          .eq('company_id', companyId)
          .gte('datetime', start)
          .lte('datetime', end);
        
        const emailCount = reminders?.filter(r => r.channel === 'email').length || 0;
        const smsCount = reminders?.filter(r => r.channel === 'sms').length || 0;
        const voiceCount = reminders?.filter(r => r.channel === 'voice' || r.channel === 'call').length || 0;
        
        // Calculate actual costs
        let emailCost = emailCount > PRICING.resend.freeEmails ? PRICING.resend.proPrice : 0;
        let smsCost = smsCount > 0 ? PRICING.twilio.phoneNumber + (smsCount * PRICING.twilio.smsOutbound) : 0;
        let voiceCost = voiceCount > 0 
          ? PRICING.twilio.phoneNumber + (voiceCount * PRICING.twilio.avgCallDuration * PRICING.twilio.voiceOutbound)
          : 0;
        
        // Add ElevenLabs cost for voice
        if (voiceCount > 0) {
          const chars = voiceCount * PRICING.twilio.avgCallDuration * PRICING.elevenlabs.charsPerMinute;
          if (chars > PRICING.elevenlabs.freeChars) {
            if (chars <= PRICING.elevenlabs.starterChars) voiceCost += PRICING.elevenlabs.starterPrice;
            else if (chars <= PRICING.elevenlabs.creatorChars) voiceCost += PRICING.elevenlabs.creatorPrice;
            else voiceCost += 99;
          }
        }
        
        months.push({
          month: monthStr,
          email: emailCost,
          sms: smsCost,
          voice: voiceCost,
          appointments: apptCount || 0,
        });
      }
      
      return months;
    },
    enabled: !!companyId,
  });

  // Save estimate mutation
  const saveMutation = useMutation({
    mutationFn: async () => {
      if (!companyId) throw new Error('No company ID');
      
      const { error } = await supabase
        .from('cost_estimates')
        .upsert({
          company_id: companyId,
          month_year: currentMonth,
          appointments_count: appointments,
          reminders_per_appointment: remindersPerAppointment,
          avg_transaction_value: avgTransactionValue,
          channels_email: channels.email,
          channels_sms: channels.sms,
          channels_voice: channels.voice,
          estimated_email_cost: costs.email,
          estimated_sms_cost: costs.sms,
          estimated_voice_cost: costs.voice,
          estimated_stripe_cost: costs.stripe,
          estimated_total_cost: costs.total,
        }, {
          onConflict: 'company_id,month_year',
        });
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cost-estimates'] });
      toast.success('Estimate saved for ' + format(new Date(), 'MMMM yyyy'));
    },
    onError: () => {
      toast.error('Failed to save estimate');
    },
  });

  // Delete estimate mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('cost_estimates')
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cost-estimates'] });
      toast.success('Estimate deleted');
    },
  });

  // Update alert settings mutation
  const updateAlertsMutation = useMutation({
    mutationFn: async (settings: { 
      cost_alert_enabled: boolean;
      cost_alert_threshold: number;
      cost_alert_email: string | null;
    }) => {
      if (!companyId) throw new Error('No company ID');
      const { error } = await supabase
        .from('companies')
        .update(settings)
        .eq('id', companyId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cost-alert-settings'] });
      toast.success('Alert settings saved');
    },
    onError: () => {
      toast.error('Failed to save alert settings');
    },
  });

  const costs = useMemo(() => {
    const totalReminders = appointments * remindersPerAppointment;
    
    const calculateEmailCost = (reminders: number) => {
      if (reminders > PRICING.resend.freeEmails) return PRICING.resend.proPrice;
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
        if (totalChars <= PRICING.elevenlabs.starterChars) elevenLabsCost = PRICING.elevenlabs.starterPrice;
        else if (totalChars <= PRICING.elevenlabs.creatorChars) elevenLabsCost = PRICING.elevenlabs.creatorPrice;
        else elevenLabsCost = 99;
      }
      return twilioCost + elevenLabsCost;
    };

    // Calculate voice costs for different TTS providers
    const calculateVoiceCostByProvider = (reminders: number, provider: 'elevenlabs' | 'openai' | 'google') => {
      const totalMinutes = reminders * PRICING.twilio.avgCallDuration;
      const twilioCost = PRICING.twilio.phoneNumber + (totalMinutes * PRICING.twilio.voiceOutbound);
      const totalChars = totalMinutes * PRICING.elevenlabs.charsPerMinute;

      let ttsCost = 0;
      switch (provider) {
        case 'elevenlabs':
          if (totalChars > PRICING.elevenlabs.freeChars) {
            if (totalChars <= PRICING.elevenlabs.starterChars) ttsCost = PRICING.elevenlabs.starterPrice;
            else if (totalChars <= PRICING.elevenlabs.creatorChars) ttsCost = PRICING.elevenlabs.creatorPrice;
            else ttsCost = 99;
          }
          break;
        case 'openai':
          ttsCost = (totalChars / 1000) * PRICING.openaiTts.pricePerThousandChars;
          break;
        case 'google':
          if (totalChars > PRICING.googleTts.freeChars) {
            ttsCost = ((totalChars - PRICING.googleTts.freeChars) / 1000000) * PRICING.googleTts.neural2PricePerMillion;
          }
          break;
      }
      return { twilioCost, ttsCost, total: twilioCost + ttsCost };
    };

    const emailCost = channels.email ? calculateEmailCost(totalReminders) : 0;
    const smsCost = channels.sms ? calculateSmsCost(totalReminders) : 0;
    const voiceCost = channels.voice ? calculateVoiceCost(totalReminders) : 0;

    const stripeRevenue = appointments * avgTransactionValue;
    const stripeCost = stripeRevenue > 0 
      ? (stripeRevenue * PRICING.stripe.percentFee) + (appointments * PRICING.stripe.fixedFee)
      : 0;

    const comparisonCosts = {
      email: calculateEmailCost(totalReminders),
      sms: calculateSmsCost(totalReminders),
      voice: calculateVoiceCost(totalReminders),
    };

    // TTS provider comparison
    const ttsComparison = channels.voice ? {
      elevenlabs: calculateVoiceCostByProvider(totalReminders, 'elevenlabs'),
      openai: calculateVoiceCostByProvider(totalReminders, 'openai'),
      google: calculateVoiceCostByProvider(totalReminders, 'google'),
    } : null;

    const perAppointment = {
      email: comparisonCosts.email / appointments,
      sms: comparisonCosts.sms / appointments,
      voice: comparisonCosts.voice / appointments,
      stripe: stripeCost / appointments,
    };

    const perReminder = {
      email: comparisonCosts.email / totalReminders,
      sms: comparisonCosts.sms / totalReminders,
      voice: comparisonCosts.voice / totalReminders,
    };

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
      ttsComparison,
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

  const getBestValue = () => {
    const scores = [
      { channel: 'email', score: costs.costEffectiveness.email, cost: costs.comparison.email },
      { channel: 'sms', score: costs.costEffectiveness.sms, cost: costs.comparison.sms },
      { channel: 'voice', score: costs.costEffectiveness.voice, cost: costs.comparison.voice },
    ].filter(s => s.cost > 0 || s.channel === 'email');
    
    if (costs.comparison.email === 0 && costs.totalReminders <= PRICING.resend.freeEmails) {
      return 'email';
    }
    
    return scores.sort((a, b) => a.score - b.score)[0]?.channel || 'email';
  };

  const bestValue = getBestValue();

  const channelConfig = [
    { key: 'email', label: 'Email', icon: Mail, color: 'emerald', bgClass: 'bg-emerald-50/50 dark:bg-emerald-950/20', borderClass: 'border-emerald-200 dark:border-emerald-900/50', textClass: 'text-emerald-600 dark:text-emerald-400' },
    { key: 'sms', label: 'SMS', icon: MessageSquare, color: 'red', bgClass: 'bg-red-50/50 dark:bg-red-950/20', borderClass: 'border-red-200 dark:border-red-900/50', textClass: 'text-red-600 dark:text-red-400' },
    { key: 'voice', label: 'Voice', icon: Phone, color: 'blue', bgClass: 'bg-blue-50/50 dark:bg-blue-950/20', borderClass: 'border-blue-200 dark:border-blue-900/50', textClass: 'text-blue-600 dark:text-blue-400' },
  ];

  // Calculate variance for comparison
  const getVariance = (estimated: number, actual: number) => {
    if (estimated === 0 && actual === 0) return { value: 0, percent: 0, direction: 'same' as const };
    if (estimated === 0) return { value: actual, percent: 100, direction: 'over' as const };
    const diff = actual - estimated;
    const percent = Math.abs((diff / estimated) * 100);
    return {
      value: Math.abs(diff),
      percent,
      direction: diff > 0 ? 'over' as const : diff < 0 ? 'under' as const : 'same' as const,
    };
  };

  return (
    <div className="space-y-6">
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
            <Label className="flex items-center justify-between">
              <span>Avg. Service Price</span>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button className="text-muted-foreground hover:text-foreground">
                      <Info className="w-3 h-3" />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent className="max-w-xs">
                    <p className="text-xs">Used to estimate Stripe payment processing fees (2.9% + $0.30/transaction). Set to $0 if customers don't pay online.</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </Label>
            <div className="relative">
              <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                type="number"
                value={avgTransactionValue}
                onChange={(e) => setAvgTransactionValue(Number(e.target.value))}
                className="pl-9"
                placeholder="0 = no Stripe fees"
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
          <TabsList className="grid w-full grid-cols-5">
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
            <TabsTrigger value="history" className="flex items-center gap-1">
              <History className="w-4 h-4" />
              History
            </TabsTrigger>
            <TabsTrigger value="alerts" className="flex items-center gap-1">
              <Bell className="w-4 h-4" />
              Alerts
            </TabsTrigger>
          </TabsList>

          {/* Summary Tab */}
          <TabsContent value="summary" className="space-y-4 mt-4">
            {/* What Am I Paying For? Help Section */}
            <CostCalculatorHelp 
              totalReminders={costs.totalReminders}
              appointments={appointments}
              avgTransactionValue={avgTransactionValue}
              costs={{
                email: costs.email,
                sms: costs.sms,
                voice: costs.voice,
                stripe: costs.stripe,
                total: costs.total,
                perReminder: costs.perReminder,
              }}
            />

            {/* Per-Reminder Cost Cards */}
            <div className="grid gap-3 md:grid-cols-3">
              <TooltipProvider>
                {channelConfig.map((ch) => {
                  const cost = costs.comparison[ch.key as keyof typeof costs.comparison];
                  const perReminder = costs.perReminder[ch.key as keyof typeof costs.perReminder];
                  const isEnabled = channels[ch.key as keyof typeof channels];
                  const isFree = ch.key === 'email' && costs.totalReminders <= 3000 && cost === 0;
                  
                  return (
                    <div 
                      key={ch.key}
                      className={cn(
                        'p-4 rounded-lg border transition-all',
                        isEnabled ? `${ch.bgClass} ${ch.borderClass}` : 'bg-muted/20 opacity-50'
                      )}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <ch.icon className={cn('w-4 h-4', ch.textClass)} />
                          <span className="font-medium text-sm">{ch.label}</span>
                        </div>
                        <Tooltip>
                          <TooltipTrigger>
                            <Info className="w-3.5 h-3.5 text-muted-foreground" />
                          </TooltipTrigger>
                          <TooltipContent>
                            {ch.key === 'email' && 'Free up to 3,000/month via Resend'}
                            {ch.key === 'sms' && 'Sent via Twilio with delivery confirmation'}
                            {ch.key === 'voice' && 'AI-generated calls via your TTS provider'}
                          </TooltipContent>
                        </Tooltip>
                      </div>
                      <div className="space-y-1">
                        <div className="flex items-baseline gap-1">
                          <span className="text-2xl font-bold">
                            {isFree ? 'FREE' : `~${Math.round(perReminder * 100)}¢`}
                          </span>
                          {!isFree && <span className="text-xs text-muted-foreground">per reminder</span>}
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {formatCurrencyShort(cost)}/month total
                        </p>
                      </div>
                    </div>
                  );
                })}
              </TooltipProvider>
            </div>

            {/* Stripe Fees Card */}
            {avgTransactionValue > 0 && (
              <div className="p-4 rounded-lg border bg-purple-50/50 dark:bg-purple-950/20 border-purple-200/50 dark:border-purple-900/30">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <DollarSign className="w-4 h-4 text-purple-600" />
                    <span className="font-medium text-sm">Payment Processing (Stripe)</span>
                  </div>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger>
                        <Info className="w-3.5 h-3.5 text-muted-foreground" />
                      </TooltipTrigger>
                      <TooltipContent>
                        2.9% + $0.30 per transaction
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl font-bold text-purple-700 dark:text-purple-400">
                    {formatCurrencyShort(costs.stripe / appointments)}
                  </span>
                  <span className="text-xs text-muted-foreground">per transaction</span>
                  <span className="text-sm text-muted-foreground ml-auto">
                    {formatCurrencyShort(costs.stripe)}/month total
                  </span>
                </div>
              </div>
            )}

            {/* Example Breakdown */}
            <ExampleBreakdown 
              appointments={appointments}
              remindersPerAppointment={remindersPerAppointment}
              avgTransactionValue={avgTransactionValue}
              costs={{
                email: costs.email,
                sms: costs.sms,
                voice: costs.voice,
                stripe: costs.stripe,
                total: costs.total,
              }}
              channels={channels}
            />

            {/* TTS Provider Comparison (only show if voice is enabled) */}
            {channels.voice && (
              <TTSComparisonTable 
                totalReminders={costs.totalReminders}
                ttsComparison={costs.ttsComparison}
              />
            )}
          </TabsContent>

          {/* Comparison Tab */}
          <TabsContent value="comparison" className="space-y-4 mt-4">
            <p className="text-sm text-muted-foreground">
              Compare cost, reach, and effectiveness across all reminder channels
            </p>
            <div className="grid gap-4 md:grid-cols-3">
              {channelConfig.map((ch) => {
                const perAppt = costs.perAppointment[ch.key as keyof typeof costs.perAppointment];
                const perReminder = costs.perReminder[ch.key as keyof typeof costs.perReminder];
                const monthly = costs.comparison[ch.key as keyof typeof costs.comparison];
                const effectiveness = EFFECTIVENESS[ch.key as keyof typeof EFFECTIVENESS];
                const isBest = bestValue === ch.key;
                const isFree = ch.key === 'email' && costs.totalReminders <= 3000 && monthly === 0;
                
                return (
                  <div 
                    key={ch.key}
                    className={cn(
                      'p-4 rounded-lg border relative',
                      ch.bgClass, ch.borderClass,
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
                      {/* Per Reminder Cost - Made Prominent */}
                      <div className="p-2 rounded bg-background/50">
                        <p className="text-xs text-muted-foreground">Cost per Reminder</p>
                        <p className="text-xl font-bold">
                          {isFree ? (
                            <span className="text-emerald-600">FREE</span>
                          ) : (
                            <>~{Math.round(perReminder * 100)}¢</>
                          )}
                        </p>
                      </div>

                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <div>
                          <p className="text-xs text-muted-foreground">Per Appointment</p>
                          <p className="font-medium">{formatCurrency(perAppt)}</p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">Monthly Total</p>
                          <p className="font-medium">{formatCurrencyShort(monthly)}</p>
                        </div>
                      </div>

                      <div className="pt-2 border-t space-y-2">
                        <p className="text-xs font-medium text-muted-foreground">Effectiveness</p>
                        <div>
                          <div className="flex justify-between text-xs mb-1">
                            <span className="text-muted-foreground">Open Rate</span>
                            <span className="font-medium">{(effectiveness.openRate * 100).toFixed(0)}%</span>
                          </div>
                          <Progress value={effectiveness.openRate * 100} className="h-1.5" />
                        </div>
                        <div>
                          <div className="flex justify-between text-xs mb-1">
                            <span className="text-muted-foreground">Response Rate</span>
                            <span className="font-medium">{(effectiveness.responseRate * 100).toFixed(0)}%</span>
                          </div>
                          <Progress value={effectiveness.responseRate * 100} className="h-1.5" />
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
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
                  </ul>
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
                  </ul>
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
              </div>
            </div>
          </TabsContent>

          {/* History Tab */}
          <TabsContent value="history" className="space-y-4 mt-4">
            {loadingEstimates || loadingActual ? (
              <div className="space-y-3">
                <Skeleton className="h-20 w-full" />
                <Skeleton className="h-20 w-full" />
              </div>
            ) : savedEstimates && savedEstimates.length > 0 ? (
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  Compare your saved estimates with actual costs tracked from reminder logs.
                </p>
                
                <div className="space-y-3">
                  {savedEstimates.map((estimate) => {
                    const actual = actualCosts?.find(a => a.month === estimate.month_year);
                    const actualTotal = actual ? (actual.email + actual.sms + actual.voice) : 0;
                    const variance = getVariance(Number(estimate.estimated_total_cost), actualTotal);
                    
                    return (
                      <div key={estimate.id} className="p-4 rounded-lg border bg-card">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-2">
                            <span className="font-semibold">
                              {format(new Date(estimate.month_year + '-01'), 'MMMM yyyy')}
                            </span>
                            <div className="flex gap-1">
                              {estimate.channels_email && <Mail className="w-3 h-3 text-emerald-500" />}
                              {estimate.channels_sms && <MessageSquare className="w-3 h-3 text-red-500" />}
                              {estimate.channels_voice && <Phone className="w-3 h-3 text-blue-500" />}
                            </div>
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-muted-foreground hover:text-destructive"
                            onClick={() => deleteMutation.mutate(estimate.id)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                        
                        <div className="grid grid-cols-4 gap-4 text-sm">
                          <div>
                            <p className="text-xs text-muted-foreground">Estimated</p>
                            <p className="font-medium">{formatCurrencyShort(Number(estimate.estimated_total_cost))}</p>
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground">Actual</p>
                            <p className="font-medium">
                              {actual ? formatCurrencyShort(actualTotal) : '—'}
                            </p>
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground">Variance</p>
                            {actual ? (
                              <div className={cn(
                                'flex items-center gap-1 font-medium',
                                variance.direction === 'over' && 'text-red-600',
                                variance.direction === 'under' && 'text-green-600',
                                variance.direction === 'same' && 'text-muted-foreground'
                              )}>
                                {variance.direction === 'over' && <ArrowUpRight className="w-3 h-3" />}
                                {variance.direction === 'under' && <ArrowDownRight className="w-3 h-3" />}
                                {variance.direction === 'same' && <Minus className="w-3 h-3" />}
                                {variance.percent.toFixed(0)}%
                              </div>
                            ) : (
                              <span className="text-muted-foreground">—</span>
                            )}
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground">Appointments</p>
                            <p className="font-medium">
                              {estimate.appointments_count} est / {actual?.appointments || 0} actual
                            </p>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <History className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p className="font-medium">No saved estimates yet</p>
                <p className="text-sm">Save your first estimate to start tracking accuracy over time.</p>
              </div>
            )}
          </TabsContent>

          {/* Alerts Tab */}
          <TabsContent value="alerts" className="space-y-4 mt-4">
            {loadingAlerts ? (
              <Skeleton className="h-40 w-full" />
            ) : (
              <div className="space-y-6">
                <div className="p-4 rounded-lg border bg-gradient-to-br from-amber-50/50 to-amber-100/30 dark:from-amber-950/20 dark:to-amber-900/10 border-amber-200/50 dark:border-amber-900/30">
                  <div className="flex items-start gap-3">
                    <AlertTriangle className="w-5 h-5 text-amber-600 mt-0.5" />
                    <div className="flex-1">
                      <h4 className="font-medium mb-1">Cost Overage Alerts</h4>
                      <p className="text-sm text-muted-foreground">
                        Get notified via email when your actual costs exceed your saved estimates by a configurable threshold.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <Label className="text-base">Enable Cost Alerts</Label>
                      <p className="text-sm text-muted-foreground">
                        Receive email notifications when costs exceed estimates
                      </p>
                    </div>
                    <Switch
                      checked={alertSettings?.cost_alert_enabled || false}
                      onCheckedChange={(checked) => {
                        updateAlertsMutation.mutate({
                          cost_alert_enabled: checked,
                          cost_alert_threshold: alertSettings?.cost_alert_threshold || 20,
                          cost_alert_email: alertSettings?.cost_alert_email || null,
                        });
                      }}
                    />
                  </div>

                  <div className="space-y-3">
                    <Label className="flex items-center justify-between">
                      <span>Alert Threshold</span>
                      <span className="text-sm font-semibold text-primary">
                        {alertSettings?.cost_alert_threshold || 20}% over estimate
                      </span>
                    </Label>
                    <Slider
                      value={[alertSettings?.cost_alert_threshold || 20]}
                      onValueChange={(v) => {
                        updateAlertsMutation.mutate({
                          cost_alert_enabled: alertSettings?.cost_alert_enabled || false,
                          cost_alert_threshold: v[0],
                          cost_alert_email: alertSettings?.cost_alert_email || null,
                        });
                      }}
                      min={5}
                      max={100}
                      step={5}
                      disabled={!alertSettings?.cost_alert_enabled}
                    />
                    <p className="text-xs text-muted-foreground">
                      You'll be notified when actual costs exceed your estimate by more than this percentage
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label>Alert Email</Label>
                    <div className="flex gap-2">
                      <Input
                        type="email"
                        placeholder="alerts@company.com"
                        defaultValue={alertSettings?.cost_alert_email || ''}
                        disabled={!alertSettings?.cost_alert_enabled}
                        onBlur={(e) => {
                          if (e.target.value !== alertSettings?.cost_alert_email) {
                            updateAlertsMutation.mutate({
                              cost_alert_enabled: alertSettings?.cost_alert_enabled || false,
                              cost_alert_threshold: alertSettings?.cost_alert_threshold || 20,
                              cost_alert_email: e.target.value || null,
                            });
                          }
                        }}
                      />
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Email address where cost alerts will be sent (requires Resend API key)
                    </p>
                  </div>

                  {alertSettings?.last_cost_alert_at && (
                    <div className="pt-4 border-t">
                      <p className="text-sm text-muted-foreground">
                        Last alert sent: {format(new Date(alertSettings.last_cost_alert_at), 'PPp')}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
  );
}