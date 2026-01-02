import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Card } from '@/components/ui/card';
import { 
  Rocket, 
  ArrowRight, 
  ArrowLeft,
  DollarSign,
  Users,
  Mail,
  MessageSquare,
  Phone,
  CheckCircle2,
  ExternalLink,
  Sparkles,
  Target,
  Copy,
  Check,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

export interface QuickStartWizardProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onComplete: () => void;
  hasResend: boolean;
  hasTwilio: boolean;
  hasElevenLabs: boolean;
}

type Step = 'welcome' | 'business-info' | 'recommendation' | 'setup-email' | 'setup-sms' | 'setup-voice' | 'complete';

interface BusinessInfo {
  monthlyAppointments: number;
  avgServiceValue: number;
  noShowRate: number;
  budget: number;
}

type RecommendedPlan = 'email' | 'email-sms' | 'all-channels';

const PLANS = {
  email: {
    name: 'Email Only',
    description: 'Free and effective for most businesses',
    channels: ['email'],
    monthlyCost: 0,
    noShowReduction: 10,
  },
  'email-sms': {
    name: 'Email + SMS',
    description: 'Best value for most businesses',
    channels: ['email', 'sms'],
    monthlyCost: 5,
    noShowReduction: 32,
  },
  'all-channels': {
    name: 'All Channels',
    description: 'Maximum impact for high-value services',
    channels: ['email', 'sms', 'voice'],
    monthlyCost: 30,
    noShowReduction: 45,
  },
};

export function QuickStartWizard({ 
  open, 
  onOpenChange, 
  onComplete,
  hasResend,
  hasTwilio,
  hasElevenLabs,
}: QuickStartWizardProps) {
  const [currentStep, setCurrentStep] = useState<Step>('welcome');
  const [businessInfo, setBusinessInfo] = useState<BusinessInfo>({
    monthlyAppointments: 100,
    avgServiceValue: 75,
    noShowRate: 15,
    budget: 50,
  });
  const [recommendedPlan, setRecommendedPlan] = useState<RecommendedPlan>('email-sms');
  const [copiedWebhook, setCopiedWebhook] = useState(false);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const calculateRecommendation = (): RecommendedPlan => {
    const { avgServiceValue, budget, noShowRate } = businessInfo;
    
    // High-value services or high no-show rates benefit from all channels
    if (avgServiceValue >= 150 && budget >= 30) return 'all-channels';
    if (noShowRate >= 25 && budget >= 30) return 'all-channels';
    
    // Medium budget or medium service value
    if (budget >= 5 && avgServiceValue >= 50) return 'email-sms';
    
    // Default to email only (free)
    return 'email';
  };

  const handleNext = () => {
    const steps: Step[] = ['welcome', 'business-info', 'recommendation'];
    const plan = PLANS[recommendedPlan];
    
    // Add setup steps based on plan
    if (plan.channels.includes('email')) steps.push('setup-email');
    if (plan.channels.includes('sms')) steps.push('setup-sms');
    if (plan.channels.includes('voice')) steps.push('setup-voice');
    steps.push('complete');

    const currentIndex = steps.indexOf(currentStep);
    
    if (currentStep === 'business-info') {
      const plan = calculateRecommendation();
      setRecommendedPlan(plan);
    }
    
    if (currentIndex < steps.length - 1) {
      setCurrentStep(steps[currentIndex + 1]);
    }
  };

  const handleBack = () => {
    const steps: Step[] = ['welcome', 'business-info', 'recommendation'];
    const plan = PLANS[recommendedPlan];
    if (plan.channels.includes('email')) steps.push('setup-email');
    if (plan.channels.includes('sms')) steps.push('setup-sms');
    if (plan.channels.includes('voice')) steps.push('setup-voice');
    steps.push('complete');

    const currentIndex = steps.indexOf(currentStep);
    if (currentIndex > 0) {
      setCurrentStep(steps[currentIndex - 1]);
    }
  };

  const handleCopyWebhook = () => {
    navigator.clipboard.writeText('https://zwlcwtgjvesbevheknbk.supabase.co/functions/v1/voice-handler?action=incoming');
    setCopiedWebhook(true);
    toast.success('Webhook URL copied!');
    setTimeout(() => setCopiedWebhook(false), 2000);
  };

  const handleComplete = () => {
    onComplete();
    onOpenChange(false);
    setCurrentStep('welcome');
  };

  const getProgress = () => {
    const allSteps: Step[] = ['welcome', 'business-info', 'recommendation', 'setup-email', 'setup-sms', 'setup-voice', 'complete'];
    const currentIndex = allSteps.indexOf(currentStep);
    return ((currentIndex + 1) / allSteps.length) * 100;
  };

  const plan = PLANS[recommendedPlan];
  const currentLoss = businessInfo.monthlyAppointments * (businessInfo.noShowRate / 100) * businessInfo.avgServiceValue;
  const potentialSavings = currentLoss * (plan.noShowReduction / 100);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl">
        <Progress value={getProgress()} className="h-1 mb-2" />
        
        {/* Welcome Step */}
        {currentStep === 'welcome' && (
          <>
            <DialogHeader className="text-center">
              <div className="mx-auto w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                <Rocket className="w-8 h-8 text-primary" />
              </div>
              <DialogTitle className="text-2xl">Welcome to Quick Start</DialogTitle>
              <DialogDescription className="text-base">
                Let's set up your first reminder channel in just a few minutes. We'll help you choose the best strategy for your business.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-3 gap-3">
                <div className="text-center p-3 rounded-lg bg-muted/50">
                  <Target className="w-6 h-6 mx-auto mb-2 text-primary" />
                  <p className="text-xs font-medium">Assess</p>
                  <p className="text-xs text-muted-foreground">Your needs</p>
                </div>
                <div className="text-center p-3 rounded-lg bg-muted/50">
                  <Sparkles className="w-6 h-6 mx-auto mb-2 text-primary" />
                  <p className="text-xs font-medium">Recommend</p>
                  <p className="text-xs text-muted-foreground">Best plan</p>
                </div>
                <div className="text-center p-3 rounded-lg bg-muted/50">
                  <CheckCircle2 className="w-6 h-6 mx-auto mb-2 text-primary" />
                  <p className="text-xs font-medium">Setup</p>
                  <p className="text-xs text-muted-foreground">Step by step</p>
                </div>
              </div>
            </div>
            <div className="flex justify-end">
              <Button onClick={handleNext}>
                Get Started
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </>
        )}

        {/* Business Info Step */}
        {currentStep === 'business-info' && (
          <>
            <DialogHeader>
              <DialogTitle>Tell us about your business</DialogTitle>
              <DialogDescription>
                This helps us recommend the best reminder strategy for you
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-6 py-4">
              <div className="space-y-3">
                <Label className="flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <Users className="w-4 h-4 text-muted-foreground" />
                    Monthly Appointments
                  </span>
                  <span className="font-semibold">{businessInfo.monthlyAppointments}</span>
                </Label>
                <Slider
                  value={[businessInfo.monthlyAppointments]}
                  onValueChange={(v) => setBusinessInfo(prev => ({ ...prev, monthlyAppointments: v[0] }))}
                  min={10}
                  max={500}
                  step={10}
                />
              </div>

              <div className="space-y-3">
                <Label className="flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <DollarSign className="w-4 h-4 text-muted-foreground" />
                    Average Service Value
                  </span>
                  <span className="font-semibold">{formatCurrency(businessInfo.avgServiceValue)}</span>
                </Label>
                <Slider
                  value={[businessInfo.avgServiceValue]}
                  onValueChange={(v) => setBusinessInfo(prev => ({ ...prev, avgServiceValue: v[0] }))}
                  min={20}
                  max={500}
                  step={10}
                />
              </div>

              <div className="space-y-3">
                <Label className="flex items-center justify-between">
                  <span>Current No-Show Rate</span>
                  <span className="font-semibold">{businessInfo.noShowRate}%</span>
                </Label>
                <Slider
                  value={[businessInfo.noShowRate]}
                  onValueChange={(v) => setBusinessInfo(prev => ({ ...prev, noShowRate: v[0] }))}
                  min={5}
                  max={40}
                  step={1}
                />
              </div>

              <div className="space-y-3">
                <Label className="flex items-center justify-between">
                  <span>Monthly Budget for Reminders</span>
                  <span className="font-semibold">{formatCurrency(businessInfo.budget)}</span>
                </Label>
                <Slider
                  value={[businessInfo.budget]}
                  onValueChange={(v) => setBusinessInfo(prev => ({ ...prev, budget: v[0] }))}
                  min={0}
                  max={100}
                  step={5}
                />
              </div>
            </div>
            <div className="flex justify-between">
              <Button variant="outline" onClick={handleBack}>
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back
              </Button>
              <Button onClick={handleNext}>
                See Recommendation
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </>
        )}

        {/* Recommendation Step */}
        {currentStep === 'recommendation' && (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-primary" />
                Our Recommendation
              </DialogTitle>
              <DialogDescription>
                Based on your business profile, here's what we suggest
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              {/* Recommended Plan Card */}
              <Card className="p-4 border-primary bg-primary/5">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="font-semibold text-lg">{plan.name}</h3>
                    <p className="text-sm text-muted-foreground">{plan.description}</p>
                  </div>
                  <Badge className="bg-primary">Recommended</Badge>
                </div>
                
                <div className="flex items-center gap-2 mb-4">
                  {plan.channels.includes('email') && (
                    <div className="flex items-center gap-1 px-2 py-1 rounded bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 text-sm">
                      <Mail className="w-3.5 h-3.5" />
                      Email
                    </div>
                  )}
                  {plan.channels.includes('sms') && (
                    <div className="flex items-center gap-1 px-2 py-1 rounded bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 text-sm">
                      <MessageSquare className="w-3.5 h-3.5" />
                      SMS
                    </div>
                  )}
                  {plan.channels.includes('voice') && (
                    <div className="flex items-center gap-1 px-2 py-1 rounded bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 text-sm">
                      <Phone className="w-3.5 h-3.5" />
                      Voice
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-3 gap-3 text-center">
                  <div className="p-2 rounded bg-background">
                    <p className="text-xs text-muted-foreground">Est. Cost</p>
                    <p className="font-semibold">
                      {plan.monthlyCost === 0 ? 'FREE' : `~${formatCurrency(plan.monthlyCost)}/mo`}
                    </p>
                  </div>
                  <div className="p-2 rounded bg-background">
                    <p className="text-xs text-muted-foreground">No-Show Reduction</p>
                    <p className="font-semibold text-emerald-600">~{plan.noShowReduction}%</p>
                  </div>
                  <div className="p-2 rounded bg-background">
                    <p className="text-xs text-muted-foreground">Monthly Savings</p>
                    <p className="font-semibold text-emerald-600">{formatCurrency(potentialSavings)}</p>
                  </div>
                </div>
              </Card>

              {/* Current Loss */}
              <div className="p-3 rounded-lg bg-amber-50 dark:bg-amber-950/30 border border-amber-200/50 dark:border-amber-900/30">
                <p className="text-sm">
                  <span className="text-muted-foreground">You're currently losing </span>
                  <span className="font-semibold text-amber-600">{formatCurrency(currentLoss)}/month</span>
                  <span className="text-muted-foreground"> to no-shows. This plan could recover </span>
                  <span className="font-semibold text-emerald-600">{formatCurrency(potentialSavings)}</span>
                  <span className="text-muted-foreground"> monthly.</span>
                </p>
              </div>
            </div>
            <div className="flex justify-between">
              <Button variant="outline" onClick={handleBack}>
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back
              </Button>
              <Button onClick={handleNext}>
                Start Setup
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </>
        )}

        {/* Setup Email Step */}
        {currentStep === 'setup-email' && (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Mail className="w-5 h-5 text-emerald-500" />
                Set Up Email Reminders
              </DialogTitle>
              <DialogDescription>
                Connect Resend to send beautiful email reminders
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              {hasResend ? (
                <div className="p-4 rounded-lg bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900/50">
                  <div className="flex items-center gap-3">
                    <CheckCircle2 className="w-8 h-8 text-emerald-500" />
                    <div>
                      <p className="font-semibold text-emerald-700 dark:text-emerald-400">Resend is Connected!</p>
                      <p className="text-sm text-muted-foreground">Email reminders are ready to go</p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="p-4 rounded-lg border bg-muted/30">
                    <h4 className="font-medium mb-2">Quick Setup Steps:</h4>
                    <ol className="list-decimal list-inside text-sm text-muted-foreground space-y-2">
                      <li>Create a free account at <a href="https://resend.com" target="_blank" rel="noopener noreferrer" className="text-primary underline">resend.com</a></li>
                      <li>Go to API Keys and create a new key</li>
                      <li>Copy the key (starts with <code className="bg-muted px-1 rounded">re_</code>)</li>
                      <li>Paste it in the Resend integration above</li>
                    </ol>
                  </div>
                  <Button variant="outline" className="w-full" asChild>
                    <a href="https://resend.com/signup" target="_blank" rel="noopener noreferrer">
                      <ExternalLink className="w-4 h-4 mr-2" />
                      Open Resend Signup
                    </a>
                  </Button>
                  <p className="text-xs text-center text-muted-foreground">
                    Free tier includes 3,000 emails/month
                  </p>
                </div>
              )}
            </div>
            <div className="flex justify-between">
              <Button variant="outline" onClick={handleBack}>
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back
              </Button>
              <Button onClick={handleNext}>
                {plan.channels.includes('sms') ? 'Next: SMS Setup' : 'Complete Setup'}
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </>
        )}

        {/* Setup SMS Step */}
        {currentStep === 'setup-sms' && (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <MessageSquare className="w-5 h-5 text-red-500" />
                Set Up SMS Reminders
              </DialogTitle>
              <DialogDescription>
                Connect Twilio to send text message reminders
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              {hasTwilio ? (
                <div className="p-4 rounded-lg bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900/50">
                  <div className="flex items-center gap-3">
                    <CheckCircle2 className="w-8 h-8 text-emerald-500" />
                    <div>
                      <p className="font-semibold text-emerald-700 dark:text-emerald-400">Twilio is Connected!</p>
                      <p className="text-sm text-muted-foreground">SMS reminders are ready to go</p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="p-4 rounded-lg border bg-muted/30">
                    <h4 className="font-medium mb-2">Quick Setup Steps:</h4>
                    <ol className="list-decimal list-inside text-sm text-muted-foreground space-y-2">
                      <li>Create account at <a href="https://www.twilio.com/try-twilio" target="_blank" rel="noopener noreferrer" className="text-primary underline">twilio.com</a> (free $15 credit)</li>
                      <li>Get your Account SID and Auth Token from Console</li>
                      <li>Purchase a phone number (~$1.15/mo)</li>
                      <li>Enter credentials in Twilio integration above</li>
                    </ol>
                  </div>
                  <Button variant="outline" className="w-full" asChild>
                    <a href="https://www.twilio.com/try-twilio" target="_blank" rel="noopener noreferrer">
                      <ExternalLink className="w-4 h-4 mr-2" />
                      Open Twilio Signup
                    </a>
                  </Button>
                  <p className="text-xs text-center text-muted-foreground">
                    Free trial includes $15.50 credit
                  </p>
                </div>
              )}
            </div>
            <div className="flex justify-between">
              <Button variant="outline" onClick={handleBack}>
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back
              </Button>
              <Button onClick={handleNext}>
                {plan.channels.includes('voice') ? 'Next: Voice Setup' : 'Complete Setup'}
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </>
        )}

        {/* Setup Voice Step */}
        {currentStep === 'setup-voice' && (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Phone className="w-5 h-5 text-blue-500" />
                Set Up Voice Reminders
              </DialogTitle>
              <DialogDescription>
                Add AI voice calls with ElevenLabs
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              {hasElevenLabs && hasTwilio ? (
                <div className="space-y-4">
                  <div className="p-4 rounded-lg bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900/50">
                    <div className="flex items-center gap-3">
                      <CheckCircle2 className="w-8 h-8 text-emerald-500" />
                      <div>
                        <p className="font-semibold text-emerald-700 dark:text-emerald-400">Voice is Ready!</p>
                        <p className="text-sm text-muted-foreground">ElevenLabs & Twilio connected</p>
                      </div>
                    </div>
                  </div>
                  
                  {/* Webhook configuration */}
                  <div className="p-4 rounded-lg border bg-muted/30">
                    <h4 className="font-medium mb-2">Final Step: Configure Webhook</h4>
                    <p className="text-sm text-muted-foreground mb-3">
                      Copy this URL and set it as your Twilio phone number's voice webhook:
                    </p>
                    <div className="flex gap-2">
                      <Input 
                        readOnly 
                        value="https://zwlcwtgjvesbevheknbk.supabase.co/functions/v1/voice-handler?action=incoming"
                        className="font-mono text-xs"
                      />
                      <Button variant="outline" size="icon" onClick={handleCopyWebhook}>
                        {copiedWebhook ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                      </Button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  {!hasTwilio && (
                    <div className="p-3 rounded-lg bg-amber-50 dark:bg-amber-950/30 border border-amber-200/50">
                      <p className="text-sm text-amber-700 dark:text-amber-400">
                        ⚠️ Twilio must be set up first for voice calls
                      </p>
                    </div>
                  )}
                  
                  <div className="p-4 rounded-lg border bg-muted/30">
                    <h4 className="font-medium mb-2">ElevenLabs Setup:</h4>
                    <ol className="list-decimal list-inside text-sm text-muted-foreground space-y-2">
                      <li>Create account at <a href="https://elevenlabs.io" target="_blank" rel="noopener noreferrer" className="text-primary underline">elevenlabs.io</a></li>
                      <li>Go to Settings → API Keys</li>
                      <li>Generate and copy your API key</li>
                      <li>Enter it in ElevenLabs integration above</li>
                    </ol>
                  </div>
                  <Button variant="outline" className="w-full" asChild>
                    <a href="https://elevenlabs.io/app/settings/api-keys" target="_blank" rel="noopener noreferrer">
                      <ExternalLink className="w-4 h-4 mr-2" />
                      Open ElevenLabs
                    </a>
                  </Button>
                  <p className="text-xs text-center text-muted-foreground">
                    Free tier includes 10,000 characters/month (~10 min)
                  </p>
                </div>
              )}
            </div>
            <div className="flex justify-between">
              <Button variant="outline" onClick={handleBack}>
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back
              </Button>
              <Button onClick={handleNext}>
                Complete Setup
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </>
        )}

        {/* Complete Step */}
        {currentStep === 'complete' && (
          <>
            <DialogHeader className="text-center">
              <div className="mx-auto w-16 h-16 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center mb-4">
                <CheckCircle2 className="w-8 h-8 text-emerald-500" />
              </div>
              <DialogTitle className="text-2xl">You're All Set!</DialogTitle>
              <DialogDescription className="text-base">
                Your reminder system is configured and ready to reduce no-shows
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="p-4 rounded-lg bg-primary/5 border border-primary/20">
                <h4 className="font-medium mb-2">What happens next?</h4>
                <ul className="text-sm text-muted-foreground space-y-2">
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-primary mt-0.5" />
                    Reminders will be sent automatically 24h and 1h before appointments
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-primary mt-0.5" />
                    Customers can confirm, reschedule, or cancel via the reminder
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-primary mt-0.5" />
                    Track performance in Analytics → Reminders
                  </li>
                </ul>
              </div>

              <div className="grid grid-cols-2 gap-3 text-center">
                <div className="p-3 rounded-lg bg-muted/50">
                  <p className="text-xs text-muted-foreground">Expected Savings</p>
                  <p className="text-lg font-bold text-emerald-600">{formatCurrency(potentialSavings)}/mo</p>
                </div>
                <div className="p-3 rounded-lg bg-muted/50">
                  <p className="text-xs text-muted-foreground">Annual Impact</p>
                  <p className="text-lg font-bold text-emerald-600">{formatCurrency(potentialSavings * 12)}/yr</p>
                </div>
              </div>
            </div>
            <div className="flex justify-center">
              <Button onClick={handleComplete} size="lg">
                <Rocket className="w-4 h-4 mr-2" />
                Start Reducing No-Shows
              </Button>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
