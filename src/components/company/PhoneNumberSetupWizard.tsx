import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { 
  PhoneForwarded, 
  ArrowRightLeft, 
  Phone, 
  Sparkles, 
  CheckCircle2, 
  Info, 
  Copy, 
  Check,
  Globe,
  Shield,
  AlertTriangle
} from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

type SetupOption = 'conditional_forwarding' | 'ported' | 'unconditional_forwarding' | 'new_number';

interface PhoneNumberSetupWizardProps {
  signalWireNumber?: string;
  onSelect?: (option: SetupOption) => void;
  selectedOption?: SetupOption | null;
}

const SETUP_OPTIONS = [
  {
    id: 'conditional_forwarding' as SetupOption,
    title: 'Conditional Call Forwarding',
    subtitle: 'Most Popular',
    description: 'Keep your number. Your phone rings first — unanswered calls forward to AI.',
    icon: PhoneForwarded,
    bestFor: 'Companies who want to answer calls themselves first',
    routingMode: 'ai_direct' as const,
    routingExplanation: 'Your carrier already rang your phone, so the AI answers immediately when the call arrives.',
    badge: 'Recommended',
    badgeColor: 'bg-green-500',
  },
  {
    id: 'ported' as SetupOption,
    title: 'Port Number to SignalWire',
    subtitle: 'Cleanest Setup',
    description: 'Transfer your existing number permanently for full control over call routing and SMS.',
    icon: ArrowRightLeft,
    bestFor: 'Companies wanting full Ring First control + SMS from their number',
    routingMode: 'ring_first' as const,
    routingExplanation: 'SignalWire controls the number directly, enabling Ring First with custom timeout.',
    badge: 'Full Control',
    badgeColor: 'bg-blue-500',
  },
  {
    id: 'unconditional_forwarding' as SetupOption,
    title: 'Unconditional Forwarding',
    subtitle: 'Forward All Calls',
    description: 'Keep your carrier — all calls forward to AI immediately without ringing your phone.',
    icon: Phone,
    bestFor: 'Companies okay with AI handling 100% of calls',
    routingMode: 'ai_direct' as const,
    routingExplanation: 'All calls go straight to AI since your carrier forwards everything.',
    badge: null,
    badgeColor: '',
  },
  {
    id: 'new_number' as SetupOption,
    title: 'Use New AI Number',
    subtitle: 'Fresh Start',
    description: 'Use the SignalWire number as your primary business line. Update your listings.',
    icon: Sparkles,
    bestFor: 'New businesses or those okay with a new number',
    routingMode: 'ring_first' as const,
    routingExplanation: 'Choose either AI Direct or Ring First — full flexibility with a new number.',
    badge: null,
    badgeColor: '',
  },
];

const CARRIER_INSTRUCTIONS = {
  conditional_forwarding: [
    {
      carrier: 'AT&T',
      activateCode: '*61*{NUMBER}*11*20#',
      deactivateCode: '##61#',
      notes: 'Replace {NUMBER} with your SignalWire number in E.164 format (no + sign). 20 = seconds before forwarding.',
    },
    {
      carrier: 'Verizon',
      activateCode: '*71{NUMBER}',
      deactivateCode: '*73',
      notes: 'Forwards on no-answer. Default timeout is ~25 seconds.',
    },
    {
      carrier: 'T-Mobile',
      activateCode: '**61*{NUMBER}*11*20#',
      deactivateCode: '##61#',
      notes: 'Replace {NUMBER} with full number. 20 = ring delay in seconds.',
    },
    {
      carrier: 'Comcast / Xfinity',
      activateCode: '*92{NUMBER}',
      deactivateCode: '*93',
      notes: 'Business Voice — forwards on no-answer.',
    },
    {
      carrier: 'Spectrum',
      activateCode: 'Account Portal → Call Forwarding → No Answer',
      deactivateCode: 'Account Portal → Disable',
      notes: 'Configure via the Spectrum Business online portal or call support.',
    },
    {
      carrier: 'RingCentral',
      activateCode: 'Admin Portal → Call Handling → Forwarding Rules → No Answer',
      deactivateCode: 'Admin Portal → Remove Rule',
      notes: 'Set up via the RingCentral admin web interface.',
    },
    {
      carrier: 'Grasshopper',
      activateCode: 'Settings → Call Forwarding → Add Rule → If No Answer',
      deactivateCode: 'Settings → Remove Rule',
      notes: 'Configure in Grasshopper web or mobile app.',
    },
    {
      carrier: 'Generic VoIP / PBX',
      activateCode: 'PBX Admin → Inbound Routes → No Answer → Forward to {NUMBER}',
      deactivateCode: 'PBX Admin → Remove Route',
      notes: 'Most VoIP systems support no-answer forwarding. Check your provider docs.',
    },
  ],
  unconditional_forwarding: [
    {
      carrier: 'AT&T',
      activateCode: '*21*{NUMBER}#',
      deactivateCode: '##21#',
      notes: 'All calls forward immediately. Your phone will not ring.',
    },
    {
      carrier: 'Verizon',
      activateCode: '*72{NUMBER}',
      deactivateCode: '*73',
      notes: 'All calls forward. Dial *73 to cancel.',
    },
    {
      carrier: 'T-Mobile',
      activateCode: '**21*{NUMBER}#',
      deactivateCode: '##21#',
      notes: 'Unconditional forward — all calls go to the forwarding number.',
    },
    {
      carrier: 'Comcast / Xfinity',
      activateCode: '*72{NUMBER}',
      deactivateCode: '*73',
      notes: 'Standard call forwarding code for Comcast Business Voice.',
    },
    {
      carrier: 'Spectrum',
      activateCode: 'Account Portal → Call Forwarding → Always',
      deactivateCode: 'Account Portal → Disable',
      notes: 'Use the online portal or contact support.',
    },
    {
      carrier: 'Generic VoIP / PBX',
      activateCode: 'PBX Admin → Inbound Routes → Forward All to {NUMBER}',
      deactivateCode: 'PBX Admin → Remove Route',
      notes: 'Check your provider\'s documentation for unconditional forwarding setup.',
    },
  ],
};

export function PhoneNumberSetupWizard({ signalWireNumber, onSelect, selectedOption }: PhoneNumberSetupWizardProps) {
  const [copiedItems, setCopiedItems] = useState<Record<string, boolean>>({});
  const [expandedOption, setExpandedOption] = useState<SetupOption | null>(selectedOption || null);

  const copyToClipboard = async (text: string, itemId: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedItems(prev => ({ ...prev, [itemId]: true }));
      toast.success('Copied to clipboard!');
      setTimeout(() => setCopiedItems(prev => ({ ...prev, [itemId]: false })), 2000);
    } catch {
      toast.error('Failed to copy');
    }
  };

  const displayNumber = signalWireNumber || '[Your SignalWire Number]';

  const renderCode = (code: string) => {
    return code.replace('{NUMBER}', signalWireNumber?.replace('+', '') || '[NUMBER]');
  };

  const handleSelectOption = (optionId: SetupOption) => {
    setExpandedOption(optionId);
    onSelect?.(optionId);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="space-y-2">
        <h3 className="text-lg font-semibold text-card-foreground">Connect Your Business Phone Number</h3>
        <p className="text-sm text-muted-foreground">
          Choose how to connect your existing phone number to the AI receptionist. No number change required for most options.
        </p>
        {signalWireNumber && (
          <div className="flex items-center gap-2 mt-2">
            <Badge variant="outline" className="gap-1">
              <Phone className="h-3 w-3" />
              AI Number: {signalWireNumber}
            </Badge>
          </div>
        )}
      </div>

      {/* Option Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {SETUP_OPTIONS.map((option) => {
          const Icon = option.icon;
          const isSelected = expandedOption === option.id;
          return (
            <Card
              key={option.id}
              className={cn(
                'cursor-pointer transition-all hover:shadow-md border-2',
                isSelected ? 'border-primary shadow-md' : 'border-border/50 hover:border-primary/30'
              )}
              onClick={() => handleSelectOption(option.id)}
            >
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <div className={cn(
                      'w-10 h-10 rounded-lg flex items-center justify-center',
                      isSelected ? 'bg-primary/20' : 'bg-muted'
                    )}>
                      <Icon className={cn('h-5 w-5', isSelected ? 'text-primary' : 'text-muted-foreground')} />
                    </div>
                    <div>
                      <CardTitle className="text-sm">{option.title}</CardTitle>
                      <p className="text-xs text-muted-foreground">{option.subtitle}</p>
                    </div>
                  </div>
                  {option.badge && (
                    <Badge className={cn('text-[10px] text-white', option.badgeColor)}>
                      {option.badge}
                    </Badge>
                  )}
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <p className="text-xs text-muted-foreground">{option.description}</p>
                <div className="mt-2 flex items-center gap-1">
                  <CheckCircle2 className="h-3 w-3 text-green-500" />
                  <span className="text-xs text-muted-foreground">Best for: {option.bestFor}</span>
                </div>
                {isSelected && (
                  <div className="mt-3 p-2 rounded bg-primary/5 border border-primary/10">
                    <div className="flex items-center gap-1.5 text-xs">
                      <Info className="h-3 w-3 text-primary" />
                      <span className="font-medium text-card-foreground">Auto-routing:</span>
                      <Badge variant="outline" className="text-[10px]">
                        {option.routingMode === 'ai_direct' ? 'AI Direct' : 'Ring First'}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">{option.routingExplanation}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Expanded Instructions */}
      {expandedOption === 'conditional_forwarding' && (
        <Card className="border-border/50">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <PhoneForwarded className="h-5 w-5 text-primary" />
              Conditional Call Forwarding Setup
            </CardTitle>
            <CardDescription>
              Dial these codes from your business phone to forward unanswered calls to your AI number: <strong>{displayNumber}</strong>
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Accordion type="multiple" className="w-full">
              {CARRIER_INSTRUCTIONS.conditional_forwarding.map((carrier, idx) => (
                <AccordionItem key={idx} value={`cfna-${idx}`}>
                  <AccordionTrigger className="text-sm">{carrier.carrier}</AccordionTrigger>
                  <AccordionContent className="space-y-3">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between bg-muted p-3 rounded-lg">
                        <div>
                          <p className="text-xs font-medium text-foreground">Activate</p>
                          <code className="text-sm text-foreground/80">{renderCode(carrier.activateCode)}</code>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          onClick={(e) => { e.stopPropagation(); copyToClipboard(renderCode(carrier.activateCode), `cfna-activate-${idx}`); }}
                        >
                          {copiedItems[`cfna-activate-${idx}`] ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                        </Button>
                      </div>
                      <div className="flex items-center justify-between bg-muted p-3 rounded-lg">
                        <div>
                          <p className="text-xs font-medium text-foreground">Deactivate</p>
                          <code className="text-sm text-foreground/80">{carrier.deactivateCode}</code>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          onClick={(e) => { e.stopPropagation(); copyToClipboard(carrier.deactivateCode, `cfna-deactivate-${idx}`); }}
                        >
                          {copiedItems[`cfna-deactivate-${idx}`] ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                        </Button>
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground">{carrier.notes}</p>
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
            <Alert className="mt-4 border-amber-500/50 bg-amber-500/10">
              <AlertTriangle className="h-4 w-4 text-amber-500" />
              <AlertDescription className="text-xs">
                <strong>Important:</strong> After activating, test by calling your business number and letting it ring. 
                The call should forward to the AI after the timeout period.
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>
      )}

      {expandedOption === 'ported' && (
        <Card className="border-border/50">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <ArrowRightLeft className="h-5 w-5 text-primary" />
              Number Porting Guide
            </CardTitle>
            <CardDescription>Transfer your existing number to SignalWire for full control.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <Badge className="rounded-full bg-primary text-primary-foreground text-xs px-2 py-0.5">1</Badge>
                <div>
                  <p className="text-sm font-medium text-card-foreground">Contact SignalWire Support</p>
                  <p className="text-xs text-muted-foreground">Email support@signalwire.com or use the dashboard to initiate a port-in request.</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Badge className="rounded-full bg-primary text-primary-foreground text-xs px-2 py-0.5">2</Badge>
                <div>
                  <p className="text-sm font-medium text-card-foreground">Provide Required Information</p>
                  <ul className="text-xs text-muted-foreground list-disc list-inside mt-1 space-y-0.5">
                    <li>Current carrier name</li>
                    <li>Account number and PIN</li>
                    <li>Authorized name on the account</li>
                    <li>Service address on file</li>
                    <li>Phone number(s) to port</li>
                  </ul>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Badge className="rounded-full bg-primary text-primary-foreground text-xs px-2 py-0.5">3</Badge>
                <div>
                  <p className="text-sm font-medium text-card-foreground">Wait for Completion</p>
                  <p className="text-xs text-muted-foreground">Porting typically takes 7–14 business days for landlines, 2–5 days for mobile numbers.</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Badge className="rounded-full bg-primary text-primary-foreground text-xs px-2 py-0.5">4</Badge>
                <div>
                  <p className="text-sm font-medium text-card-foreground">Configure Webhooks</p>
                  <p className="text-xs text-muted-foreground">Once ported, set up voice and SMS webhooks on the number (see SignalWire Setup Guide).</p>
                </div>
              </div>
            </div>
            <Alert className="border-blue-500/50 bg-blue-500/10">
              <Shield className="h-4 w-4 text-cyan-400" />
              <AlertDescription className="text-xs">
                <strong>Keep your carrier active</strong> until the port completes. Canceling early may cause the number to be lost.
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>
      )}

      {expandedOption === 'unconditional_forwarding' && (
        <Card className="border-border/50">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Phone className="h-5 w-5 text-primary" />
              Unconditional Forwarding Setup
            </CardTitle>
            <CardDescription>
              Forward ALL calls to your AI number: <strong>{displayNumber}</strong>
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Accordion type="multiple" className="w-full">
              {CARRIER_INSTRUCTIONS.unconditional_forwarding.map((carrier, idx) => (
                <AccordionItem key={idx} value={`ucf-${idx}`}>
                  <AccordionTrigger className="text-sm">{carrier.carrier}</AccordionTrigger>
                  <AccordionContent className="space-y-3">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between bg-muted p-3 rounded-lg">
                        <div>
                          <p className="text-xs font-medium text-foreground">Activate</p>
                          <code className="text-sm text-foreground/80">{renderCode(carrier.activateCode)}</code>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          onClick={(e) => { e.stopPropagation(); copyToClipboard(renderCode(carrier.activateCode), `ucf-activate-${idx}`); }}
                        >
                          {copiedItems[`ucf-activate-${idx}`] ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                        </Button>
                      </div>
                      <div className="flex items-center justify-between bg-muted p-3 rounded-lg">
                        <div>
                          <p className="text-xs font-medium text-foreground">Deactivate</p>
                          <code className="text-sm text-foreground/80">{carrier.deactivateCode}</code>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          onClick={(e) => { e.stopPropagation(); copyToClipboard(carrier.deactivateCode, `ucf-deactivate-${idx}`); }}
                        >
                          {copiedItems[`ucf-deactivate-${idx}`] ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                        </Button>
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground">{carrier.notes}</p>
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
            <Alert className="mt-4 border-amber-500/50 bg-amber-500/10">
              <AlertTriangle className="h-4 w-4 text-amber-500" />
              <AlertDescription className="text-xs">
                <strong>Your phone will NOT ring.</strong> All calls go directly to the AI. 
                Make sure to deactivate forwarding if you want to receive calls on your phone again.
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>
      )}

      {expandedOption === 'new_number' && (
        <Card className="border-border/50">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              Using Your New AI Number
            </CardTitle>
            <CardDescription>
              Update your public-facing profiles with: <strong>{displayNumber}</strong>
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Update your business number in these key places:
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {[
                { name: 'Google Business Profile', icon: Globe, url: 'https://business.google.com' },
                { name: 'Yelp Business Page', icon: Globe, url: 'https://biz.yelp.com' },
                { name: 'Facebook Business', icon: Globe, url: 'https://business.facebook.com' },
                { name: 'Website Contact Page', icon: Globe, url: null },
                { name: 'Business Cards', icon: Globe, url: null },
                { name: 'Email Signatures', icon: Globe, url: null },
                { name: 'Vehicle Wraps / Signage', icon: Globe, url: null },
                { name: 'Industry Directories', icon: Globe, url: null },
              ].map((item, idx) => (
                <div key={idx} className="flex items-center gap-2 p-2 rounded-lg bg-muted/50">
                  <CheckCircle2 className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                  <span className="text-xs text-card-foreground">{item.name}</span>
                </div>
              ))}
            </div>
            <Alert className="border-blue-500/50 bg-blue-500/10">
              <Info className="h-4 w-4 text-cyan-400" />
              <AlertDescription className="text-xs">
                <strong>Tip:</strong> Update Google Business Profile first — it's the most impactful for local search and call volume.
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
