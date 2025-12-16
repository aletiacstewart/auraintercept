import { useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { Calculator, Mail, Phone, Mic, MessageSquare, DollarSign } from 'lucide-react';

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

export function CostCalculator() {
  const [appointments, setAppointments] = useState(100);
  const [avgTransactionValue, setAvgTransactionValue] = useState(50);
  const [channels, setChannels] = useState({
    email: true,
    sms: false,
    voice: false,
  });
  const [remindersPerAppointment, setRemindersPerAppointment] = useState(2); // 24h + 1h

  const costs = useMemo(() => {
    const totalReminders = appointments * remindersPerAppointment;
    
    // Email costs (Resend)
    let emailCost = 0;
    if (channels.email) {
      if (totalReminders > PRICING.resend.freeEmails) {
        emailCost = PRICING.resend.proPrice;
      }
    }

    // SMS costs (Twilio)
    let smsCost = 0;
    if (channels.sms) {
      smsCost = PRICING.twilio.phoneNumber + (totalReminders * PRICING.twilio.smsOutbound);
    }

    // Voice costs (Twilio + ElevenLabs)
    let voiceCost = 0;
    let elevenLabsCost = 0;
    if (channels.voice) {
      // Twilio voice
      const totalMinutes = totalReminders * PRICING.twilio.avgCallDuration;
      voiceCost = PRICING.twilio.phoneNumber + (totalMinutes * PRICING.twilio.voiceOutbound);
      
      // ElevenLabs (characters for TTS)
      const totalChars = totalMinutes * PRICING.elevenlabs.charsPerMinute;
      if (totalChars > PRICING.elevenlabs.freeChars) {
        if (totalChars <= PRICING.elevenlabs.starterChars) {
          elevenLabsCost = PRICING.elevenlabs.starterPrice;
        } else if (totalChars <= PRICING.elevenlabs.creatorChars) {
          elevenLabsCost = PRICING.elevenlabs.creatorPrice;
        } else {
          elevenLabsCost = 99; // Pro plan
        }
      }
    }

    // Stripe costs (if processing payments)
    const stripeRevenue = appointments * avgTransactionValue;
    const stripeCost = stripeRevenue > 0 
      ? (stripeRevenue * PRICING.stripe.percentFee) + (appointments * PRICING.stripe.fixedFee)
      : 0;

    return {
      email: emailCost,
      sms: smsCost,
      voice: voiceCost + elevenLabsCost,
      stripe: stripeCost,
      total: emailCost + smsCost + voiceCost + elevenLabsCost + stripeCost,
    };
  }, [appointments, avgTransactionValue, channels, remindersPerAppointment]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
    }).format(amount);
  };

  return (
    <Card className="border-border/50">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calculator className="w-5 h-5 text-primary" />
          Cost Calculator
        </CardTitle>
        <CardDescription>
          Estimate your monthly integration costs based on appointment volume
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid gap-6 md:grid-cols-2">
          {/* Input Section */}
          <div className="space-y-5">
            <div className="space-y-3">
              <Label className="flex items-center justify-between">
                <span>Monthly Appointments</span>
                <span className="text-sm font-normal text-muted-foreground">{appointments}</span>
              </Label>
              <Slider
                value={[appointments]}
                onValueChange={(v) => setAppointments(v[0])}
                min={10}
                max={1000}
                step={10}
              />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>10</span>
                <span>1,000</span>
              </div>
            </div>

            <div className="space-y-3">
              <Label className="flex items-center justify-between">
                <span>Reminders per Appointment</span>
                <span className="text-sm font-normal text-muted-foreground">{remindersPerAppointment}</span>
              </Label>
              <Slider
                value={[remindersPerAppointment]}
                onValueChange={(v) => setRemindersPerAppointment(v[0])}
                min={1}
                max={4}
                step={1}
              />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>1</span>
                <span>4</span>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Avg. Transaction Value (for Stripe estimate)</Label>
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

            <div className="space-y-3 pt-2">
              <Label>Reminder Channels</Label>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 rounded-lg border bg-card">
                  <div className="flex items-center gap-2">
                    <Mail className="w-4 h-4 text-emerald-500" />
                    <span className="text-sm">Email (Resend)</span>
                  </div>
                  <Switch
                    checked={channels.email}
                    onCheckedChange={(checked) => setChannels((c) => ({ ...c, email: checked }))}
                  />
                </div>
                <div className="flex items-center justify-between p-3 rounded-lg border bg-card">
                  <div className="flex items-center gap-2">
                    <MessageSquare className="w-4 h-4 text-red-500" />
                    <span className="text-sm">SMS (Twilio)</span>
                  </div>
                  <Switch
                    checked={channels.sms}
                    onCheckedChange={(checked) => setChannels((c) => ({ ...c, sms: checked }))}
                  />
                </div>
                <div className="flex items-center justify-between p-3 rounded-lg border bg-card">
                  <div className="flex items-center gap-2">
                    <Phone className="w-4 h-4 text-blue-500" />
                    <span className="text-sm">Voice (Twilio + ElevenLabs)</span>
                  </div>
                  <Switch
                    checked={channels.voice}
                    onCheckedChange={(checked) => setChannels((c) => ({ ...c, voice: checked }))}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Results Section */}
          <div className="space-y-4">
            <div className="p-4 rounded-lg bg-gradient-to-br from-primary/10 to-primary/5 border border-primary/20">
              <p className="text-sm text-muted-foreground mb-1">Estimated Monthly Cost</p>
              <p className="text-3xl font-bold text-primary">{formatCurrency(costs.total)}</p>
              <p className="text-xs text-muted-foreground mt-1">
                For {appointments} appointments × {remindersPerAppointment} reminders = {appointments * remindersPerAppointment} total reminders
              </p>
            </div>

            <div className="space-y-2">
              <p className="text-sm font-medium">Cost Breakdown</p>
              
              {channels.email && (
                <div className="flex items-center justify-between p-3 rounded-lg border bg-emerald-50/50 dark:bg-emerald-950/20">
                  <div className="flex items-center gap-2">
                    <Mail className="w-4 h-4 text-emerald-500" />
                    <span className="text-sm">Resend (Email)</span>
                  </div>
                  <span className="font-medium">{formatCurrency(costs.email)}</span>
                </div>
              )}

              {channels.sms && (
                <div className="flex items-center justify-between p-3 rounded-lg border bg-red-50/50 dark:bg-red-950/20">
                  <div className="flex items-center gap-2">
                    <MessageSquare className="w-4 h-4 text-red-500" />
                    <span className="text-sm">Twilio (SMS)</span>
                  </div>
                  <span className="font-medium">{formatCurrency(costs.sms)}</span>
                </div>
              )}

              {channels.voice && (
                <div className="flex items-center justify-between p-3 rounded-lg border bg-blue-50/50 dark:bg-blue-950/20">
                  <div className="flex items-center gap-2">
                    <Phone className="w-4 h-4 text-blue-500" />
                    <span className="text-sm">Voice (Twilio + ElevenLabs)</span>
                  </div>
                  <span className="font-medium">{formatCurrency(costs.voice)}</span>
                </div>
              )}

              {avgTransactionValue > 0 && (
                <div className="flex items-center justify-between p-3 rounded-lg border bg-purple-50/50 dark:bg-purple-950/20">
                  <div className="flex items-center gap-2">
                    <DollarSign className="w-4 h-4 text-purple-500" />
                    <span className="text-sm">Stripe (Payment Processing)</span>
                  </div>
                  <span className="font-medium">{formatCurrency(costs.stripe)}</span>
                </div>
              )}
            </div>

            <div className="p-3 rounded-lg bg-muted/50 border border-dashed">
              <p className="text-xs text-muted-foreground">
                <strong className="text-foreground">Note:</strong> These are estimates based on approximate pricing. 
                Actual costs may vary. Email is free up to 3,000/month, ElevenLabs is free up to 10K characters/month.
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}