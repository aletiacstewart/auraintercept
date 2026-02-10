import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { useToast } from '@/hooks/use-toast';
import { 
  User, 
  MessageSquare, 
  MapPin, 
  Clock, 
  DollarSign, 
  Zap, 
  ShieldAlert, 
  Smile, 
  Code,
  Copy,
  Download,
  ExternalLink,
  Check,
  X,
  Mic
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Alert, AlertDescription } from '@/components/ui/alert';

type BrandTone = 'professional' | 'friendly' | 'technical';

interface AuraConfig {
  brand_tone: BrandTone;
  contact_phone: string | null;
  service_area_zip_codes: string[] | null;
  emergency_surcharge: number | null;
  emergency_phone: string | null;
  emergency_sms_enabled: boolean | null;
  emergency_keywords: string[] | null;
  emergency_notification_emails: string[] | null;
  manager_name: string | null;
  de_escalation_manager_contact: string | null;
  de_escalation_auto_ticket: boolean | null;
}

interface SmartLink {
  id: string;
  name: string;
  category: string;
  url: string | null;
}

export function AuraIntelligenceSettings() {
  const { companyId } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  
  const [smartLinks, setSmartLinks] = useState<SmartLink[]>([]);
  const [config, setConfig] = useState<AuraConfig>({
    brand_tone: 'professional',
    contact_phone: null,
    service_area_zip_codes: null,
    emergency_surcharge: null,
    emergency_phone: null,
    emergency_sms_enabled: false,
    emergency_keywords: null,
    emergency_notification_emails: null,
    manager_name: null,
    de_escalation_manager_contact: null,
    de_escalation_auto_ticket: false,
  });
  
  const [zipInput, setZipInput] = useState('');
  const [keywordInput, setKeywordInput] = useState('');
  const [emailInput, setEmailInput] = useState('');
  const [copied, setCopied] = useState(false);

  // Fetch company data
  const { data: company, isLoading } = useQuery({
    queryKey: ['aura-intelligence-company', companyId],
    queryFn: async () => {
      if (!companyId) return null;
      const { data, error } = await supabase
        .from('companies')
        .select(`
          id, name, slug,
          brand_tone, contact_phone, service_area_zip_codes,
          emergency_surcharge, emergency_phone, emergency_sms_enabled,
          emergency_keywords, emergency_notification_emails,
          manager_name, de_escalation_manager_contact, de_escalation_auto_ticket
        `)
        .eq('id', companyId)
        .single();
      
      if (error) throw error;
      return data;
    },
    enabled: !!companyId,
  });

  // Fetch smart links
  const { data: smartLinksData } = useQuery({
    queryKey: ['aura-intelligence-smart-links', companyId],
    queryFn: async () => {
      if (!companyId) return [];
      const { data, error } = await supabase
        .from('smart_links')
        .select('id, name, category, url')
        .eq('company_id', companyId);
      
      if (error) throw error;
      return data || [];
    },
    enabled: !!companyId,
  });

  useEffect(() => {
    if (company) {
      setConfig({
        brand_tone: (company.brand_tone as BrandTone) || 'professional',
        contact_phone: company.contact_phone,
        service_area_zip_codes: company.service_area_zip_codes,
        emergency_surcharge: company.emergency_surcharge,
        emergency_phone: company.emergency_phone,
        emergency_sms_enabled: company.emergency_sms_enabled,
        emergency_keywords: company.emergency_keywords,
        emergency_notification_emails: company.emergency_notification_emails,
        manager_name: company.manager_name,
        de_escalation_manager_contact: company.de_escalation_manager_contact,
        de_escalation_auto_ticket: company.de_escalation_auto_ticket,
      });
    }
  }, [company]);

  useEffect(() => {
    if (smartLinksData) {
      setSmartLinks(smartLinksData);
    }
  }, [smartLinksData]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (!companyId) throw new Error('No company ID');
      
      const { error } = await supabase
        .from('companies')
        .update({
          brand_tone: config.brand_tone,
          contact_phone: config.contact_phone,
          service_area_zip_codes: config.service_area_zip_codes,
          emergency_surcharge: config.emergency_surcharge,
          emergency_phone: config.emergency_phone,
          emergency_sms_enabled: config.emergency_sms_enabled,
          emergency_keywords: config.emergency_keywords,
          emergency_notification_emails: config.emergency_notification_emails,
          manager_name: config.manager_name,
          de_escalation_manager_contact: config.de_escalation_manager_contact,
          de_escalation_auto_ticket: config.de_escalation_auto_ticket,
        })
        .eq('id', companyId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['aura-intelligence-company', companyId] });
      toast({
        title: 'Settings saved',
        description: 'Aura Intelligence configuration has been updated.',
      });
    },
    onError: (error) => {
      console.error('Error saving settings:', error);
      toast({
        title: 'Error',
        description: 'Failed to save settings. Please try again.',
        variant: 'destructive',
      });
    },
  });

  const handleSave = () => {
    saveMutation.mutate();
  };

  const addZipCode = () => {
    if (!zipInput.trim()) return;
    const zips = zipInput.split(',').map(z => z.trim()).filter(z => z);
    setConfig(prev => ({
      ...prev,
      service_area_zip_codes: [...(prev.service_area_zip_codes || []), ...zips],
    }));
    setZipInput('');
  };

  const removeZipCode = (zip: string) => {
    setConfig(prev => ({
      ...prev,
      service_area_zip_codes: (prev.service_area_zip_codes || []).filter(z => z !== zip),
    }));
  };

  const addKeyword = () => {
    if (!keywordInput.trim()) return;
    const keywords = keywordInput.split(',').map(k => k.trim().toLowerCase()).filter(k => k);
    setConfig(prev => ({
      ...prev,
      emergency_keywords: [...(prev.emergency_keywords || []), ...keywords],
    }));
    setKeywordInput('');
  };

  const removeKeyword = (keyword: string) => {
    setConfig(prev => ({
      ...prev,
      emergency_keywords: (prev.emergency_keywords || []).filter(k => k !== keyword),
    }));
  };

  const addEmail = () => {
    if (!emailInput.trim() || !emailInput.includes('@')) return;
    setConfig(prev => ({
      ...prev,
      emergency_notification_emails: [...(prev.emergency_notification_emails || []), emailInput.trim()],
    }));
    setEmailInput('');
  };

  const removeEmail = (email: string) => {
    setConfig(prev => ({
      ...prev,
      emergency_notification_emails: (prev.emergency_notification_emails || []).filter(e => e !== email),
    }));
  };

  const configuredLinksCount = smartLinks.filter(l => l.url).length;
  const totalLinksCount = smartLinks.length;
  const [elevenLabsPromptCopied, setElevenLabsPromptCopied] = useState(false);

  // Generate the JSON export
  const generateExport = () => {
    const masterLogic = {
      safety_first: {
        keywords: config.emergency_keywords || ['smoke', 'fire', 'gas', 'flood', 'spark', 'emergency'],
        action: 'emergency_response_mode',
        description: 'Bypass scheduling and trigger emergency response',
      },
      sentiment_guard: {
        triggers: ['cancel', 'not happy', 'manager', 'frustrated', 'upset', 'complaint'],
        action: 'de_escalation_mode',
        description: 'Suppress sales scripts and provide escalation path',
      },
      proactive_link: {
        triggers: ['pricing', 'booking', 'reviews', 'schedule', 'quote'],
        action: 'send_smart_link',
        description: 'Send relevant smart link via SMS',
      },
    };

    const customVariables = {
      company_name: company?.name || '',
      brand_tone: config.brand_tone,
      primary_office_phone: config.contact_phone || '',
      service_zips: config.service_area_zip_codes || [],
      emergency_surcharge: config.emergency_surcharge || 0,
      booking_url: smartLinks.find(l => l.category === 'booking')?.url || '',
      quote_request_url: smartLinks.find(l => l.category === 'quote')?.url || '',
      review_url: smartLinks.find(l => l.category === 'review')?.url || '',
      payment_portal_url: smartLinks.find(l => l.category === 'payment')?.url || '',
      emergency_dispatch_line: config.emergency_phone || '',
      emergency_sms_enabled: config.emergency_sms_enabled || false,
      emergency_notification_emails: config.emergency_notification_emails || [],
      manager_name: config.manager_name || '',
      manager_direct_line: config.de_escalation_manager_contact || '',
      auto_create_ticket: config.de_escalation_auto_ticket || false,
    };

    return {
      masterLogic,
      customVariables,
      generatedAt: new Date().toISOString(),
    };
  };

  // Generate company-specific ElevenLabs prompt
  const generateElevenLabsPrompt = () => {
    const brandToneInstructions = {
      professional: 'Use a formal, business-appropriate tone. Be courteous and precise.',
      friendly: 'Use a warm, conversational tone. Be personable and approachable.',
      technical: 'Use concise, industry-specific terminology. Be direct and efficient.',
    };

    const emergencyKeywords = config.emergency_keywords?.length 
      ? config.emergency_keywords.join(', ')
      : 'smoke, fire, gas, flood, spark, emergency, water damage';

    const serviceZips = config.service_area_zip_codes?.length
      ? config.service_area_zip_codes.join(', ')
      : 'All service areas';

    const bookingUrl = smartLinks.find(l => l.category === 'booking')?.url;
    const paymentUrl = smartLinks.find(l => l.category === 'payment')?.url;
    const reviewUrl = smartLinks.find(l => l.category === 'review')?.url;

    return `You are Aura, the AI voice assistant for ${company?.name || '[Company Name]'}.

PERSONALITY & TONE:
- ${brandToneInstructions[config.brand_tone] || brandToneInstructions.professional}
- Be patient when collecting customer information - never rush callers
- When asking for name, phone number, or address, WAIT for the complete response
- If the caller pauses to think, say "Take your time" before continuing

CRITICAL - CONVERSATIONAL PAUSES:
- After asking any question, wait at least 3-4 seconds for a response
- Never interrupt the caller while they're providing information
- For phone numbers and addresses, wait for them to finish completely
- NEVER ask for multiple pieces of information in one question (e.g., don't say "Can I get your name, phone, and address?")
- Ask for ONE piece of info at a time, wait for the answer, then ask for the next

CRITICAL - DATE & TIME HANDLING:
- NEVER ask for dates in a specific format like "mm/dd/yyyy"
- NEVER say "please provide the date in month day year format"
- ALWAYS accept natural language dates: "tomorrow", "next Monday", "this Friday", "in 2 days"
- Examples you MUST understand:
  • "tomorrow at 4pm" → Calculate tomorrow's date
  • "next Tuesday around 3" → Next week's Tuesday, 15:00
  • "this Thursday afternoon" → This week's Thursday
  • "Wednesday" → If unclear, ask "this Wednesday or next?"
- Convert times naturally: "4pm" = 16:00, "9am" = 09:00, "noon" = 12:00

COMPANY CONTEXT:
- Business Name: ${company?.name || '[Company Name]'}
- Primary Phone: ${config.contact_phone || '[Not configured]'}
- Service Area ZIP Codes: ${serviceZips}
${config.emergency_surcharge ? `- Emergency/After-Hours Surcharge: $${config.emergency_surcharge}` : ''}

EMERGENCY PROTOCOL:
If the caller mentions any of these keywords: ${emergencyKeywords}
→ IMMEDIATELY ask: "This sounds like an emergency situation. Are you in immediate danger?"
→ If yes, tell them to call 911
→ If not life-threatening but urgent:${config.emergency_phone ? `
  • Provide our emergency dispatch line: ${config.emergency_phone}` : ''}
  • Do NOT proceed with regular booking
  • Offer to have someone call them back immediately

DE-ESCALATION PROTOCOL:
If the caller sounds upset, frustrated, or asks for a manager:
→ Stay calm and empathetic
→ Say: "I completely understand your frustration, and I want to make sure we resolve this for you."${config.manager_name ? `
→ Offer to connect them with ${config.manager_name}${config.de_escalation_manager_contact ? ` at ${config.de_escalation_manager_contact}` : ''}` : ''}

BOOKING FLOW:
1. Greet warmly: "Hi! Thanks for calling ${company?.name || 'us'}. I'm Aura, your scheduling assistant."
2. Ask what service they need (call get_services first)
3. Ask: "Can I get your full name?" — WAIT for their complete answer before continuing
4. Ask: "And a good phone number to reach you?" — WAIT for the full number
5. Ask: "What's the address for the service?" — WAIT for complete address
6. Ask "What day works best for you?" - accept natural language
7. Check available times (get_available_times)
8. Confirm ALL details before booking

${bookingUrl || paymentUrl || reviewUrl ? `SMART LINKS (send via SMS when relevant):${bookingUrl ? `
- Online Booking: ${bookingUrl}` : ''}${paymentUrl ? `
- Payment Portal: ${paymentUrl}` : ''}${reviewUrl ? `
- Leave a Review: ${reviewUrl}` : ''}` : ''}

GUIDELINES:
- Be conversational, patient, and natural
- Never ask for formatted dates - always accept natural language
- Always confirm details before booking
- If no times available, offer the next available alternatives`;
  };

  const handleCopyElevenLabsPrompt = async () => {
    const prompt = generateElevenLabsPrompt();
    await navigator.clipboard.writeText(prompt);
    setElevenLabsPromptCopied(true);
    setTimeout(() => setElevenLabsPromptCopied(false), 2000);
    toast({
      title: 'ElevenLabs Prompt Copied',
      description: 'Paste this into your ElevenLabs agent\'s System Prompt field.',
    });
  };

  const handleCopyJson = async () => {
    const json = JSON.stringify(generateExport(), null, 2);
    await navigator.clipboard.writeText(json);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast({
      title: 'Copied to clipboard',
      description: 'Configuration JSON has been copied.',
    });
  };

  const handleDownloadJson = () => {
    const json = JSON.stringify(generateExport(), null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `aura-config-${company?.slug || 'export'}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <Accordion type="multiple" defaultValue={['identity', 'operations', 'emergency']} className="space-y-4">
        {/* Section 1: Identity */}
        <AccordionItem value="identity" className="border rounded-lg bg-card">
          <AccordionTrigger className="px-4 hover:no-underline">
            <div className="flex items-center gap-2">
              <User className="h-4 w-4 text-primary" />
              <span className="font-semibold">Identity</span>
              <Badge variant="secondary" className="ml-2">The Who</Badge>
            </div>
          </AccordionTrigger>
          <AccordionContent className="px-4 pb-4">
            <div className="space-y-4">
              <div className="grid gap-2">
                <Label>Company Name</Label>
                <Input value={company?.name || ''} disabled className="bg-muted" />
                <p className="text-xs text-muted-foreground">Update in Branding settings</p>
              </div>

              <div className="grid gap-2">
                <Label className="flex items-center gap-2">
                  <MessageSquare className="h-4 w-4" />
                  Brand Tone
                </Label>
                <Select 
                  value={config.brand_tone} 
                  onValueChange={(v: BrandTone) => setConfig(prev => ({ ...prev, brand_tone: v }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="professional">
                      <div className="flex flex-col">
                        <span>Professional / Polite</span>
                        <span className="text-xs text-muted-foreground">Formal, business-appropriate language</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="friendly">
                      <div className="flex flex-col">
                        <span>Friendly / Casual</span>
                        <span className="text-xs text-muted-foreground">Warm, conversational style</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="technical">
                      <div className="flex flex-col">
                        <span>Technical / Direct</span>
                        <span className="text-xs text-muted-foreground">Concise, industry-specific terminology</span>
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid gap-2">
                <Label>Primary Office Phone</Label>
                <Input 
                  type="tel"
                  value={config.contact_phone || ''}
                  onChange={(e) => setConfig(prev => ({ ...prev, contact_phone: e.target.value }))}
                  placeholder="(555) 123-4567"
                />
              </div>
            </div>
          </AccordionContent>
        </AccordionItem>

        {/* Section 2: Operations */}
        <AccordionItem value="operations" className="border rounded-lg bg-card">
          <AccordionTrigger className="px-4 hover:no-underline">
            <div className="flex items-center gap-2">
              <MapPin className="h-4 w-4 text-primary" />
              <span className="font-semibold">Operations</span>
              <Badge variant="secondary" className="ml-2">The Where & When</Badge>
            </div>
          </AccordionTrigger>
          <AccordionContent className="px-4 pb-4">
            <div className="space-y-4">
              <div className="grid gap-2">
                <Label className="flex items-center gap-2">
                  <MapPin className="h-4 w-4" />
                  Service ZIP Codes
                </Label>
                <div className="flex gap-2">
                  <Input 
                    value={zipInput}
                    onChange={(e) => setZipInput(e.target.value)}
                    placeholder="Enter ZIP codes (comma-separated)"
                    onKeyDown={(e) => e.key === 'Enter' && addZipCode()}
                  />
                  <Button type="button" onClick={addZipCode} variant="secondary">Add</Button>
                </div>
                <div className="flex flex-wrap gap-2 mt-2">
                  {(config.service_area_zip_codes || []).map((zip) => (
                    <Badge key={zip} variant="outline" className="flex items-center gap-1">
                      {zip}
                      <button onClick={() => removeZipCode(zip)} className="ml-1 hover:text-destructive">
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              </div>

              <div className="grid gap-2">
                <Label className="flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  Business Hours
                </Label>
                <Button 
                  variant="outline" 
                  onClick={() => navigate('/settings?tab=contact')}
                  className="w-fit"
                >
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Configure in Contact Settings
                </Button>
              </div>

              <div className="grid gap-2">
                <Label className="flex items-center gap-2">
                  <DollarSign className="h-4 w-4" />
                  Emergency Surcharge
                </Label>
                <div className="relative w-48">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
                  <Input 
                    type="number"
                    value={config.emergency_surcharge || ''}
                    onChange={(e) => setConfig(prev => ({ ...prev, emergency_surcharge: e.target.value ? parseFloat(e.target.value) : null }))}
                    placeholder="0.00"
                    className="pl-7"
                    min={0}
                    step={0.01}
                  />
                </div>
                <p className="text-xs text-muted-foreground">After-hours/emergency service fee displayed by AI</p>
              </div>
            </div>
          </AccordionContent>
        </AccordionItem>

        {/* Section 3: Smart Links */}
        <AccordionItem value="smart-links" className="border rounded-lg bg-card">
          <AccordionTrigger className="px-4 hover:no-underline">
            <div className="flex items-center gap-2">
              <Zap className="h-4 w-4 text-primary" />
              <span className="font-semibold">Smart Links</span>
              <Badge variant="secondary" className="ml-2">The How</Badge>
            </div>
          </AccordionTrigger>
          <AccordionContent className="px-4 pb-4">
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${configuredLinksCount === totalLinksCount ? 'bg-green-100 text-green-600' : 'bg-amber-100 text-amber-600'}`}>
                    {configuredLinksCount === totalLinksCount ? (
                      <Check className="h-5 w-5" />
                    ) : (
                      <span className="text-sm font-bold">{configuredLinksCount}</span>
                    )}
                  </div>
                  <div>
                    <p className="font-medium">{configuredLinksCount} of {totalLinksCount} links configured</p>
                    <p className="text-sm text-muted-foreground">
                      {configuredLinksCount === totalLinksCount 
                        ? 'All smart links are ready for Aura'
                        : 'Configure more links for better AI responses'}
                    </p>
                  </div>
                </div>
              </div>
              
              <Button 
                variant="outline" 
                onClick={() => navigate('/knowledge-base?tab=smart-links')}
                className="w-full"
              >
                <Zap className="h-4 w-4 mr-2" />
                Manage Smart Links in Knowledge Base
              </Button>
            </div>
          </AccordionContent>
        </AccordionItem>

        {/* Section 4: Emergency & Escalation */}
        <AccordionItem value="emergency" className="border rounded-lg bg-card">
          <AccordionTrigger className="px-4 hover:no-underline">
            <div className="flex items-center gap-2">
              <ShieldAlert className="h-4 w-4 text-destructive" />
              <span className="font-semibold">Emergency & Escalation</span>
              <Badge variant="destructive" className="ml-2">Critical</Badge>
            </div>
          </AccordionTrigger>
          <AccordionContent className="px-4 pb-4">
            <div className="space-y-6">
              {/* Emergency Section */}
              <div className="space-y-4">
                <h4 className="font-medium flex items-center gap-2">
                  <ShieldAlert className="h-4 w-4" />
                  Emergency Response
                </h4>
                
                <div className="grid gap-2">
                  <Label>Emergency Dispatch Line</Label>
                  <Input 
                    type="tel"
                    value={config.emergency_phone || ''}
                    onChange={(e) => setConfig(prev => ({ ...prev, emergency_phone: e.target.value }))}
                    placeholder="(555) 123-4567"
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label>Emergency SMS Enabled</Label>
                    <p className="text-xs text-muted-foreground">Send SMS alerts for emergency situations</p>
                  </div>
                  <Switch 
                    checked={config.emergency_sms_enabled || false}
                    onCheckedChange={(checked) => setConfig(prev => ({ ...prev, emergency_sms_enabled: checked }))}
                  />
                </div>

                <div className="grid gap-2">
                  <Label>Custom Emergency Keywords</Label>
                  <div className="flex gap-2">
                    <Input 
                      value={keywordInput}
                      onChange={(e) => setKeywordInput(e.target.value)}
                      placeholder="fire, flood, gas leak..."
                      onKeyDown={(e) => e.key === 'Enter' && addKeyword()}
                    />
                    <Button type="button" onClick={addKeyword} variant="secondary">Add</Button>
                  </div>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {(config.emergency_keywords || []).map((kw) => (
                      <Badge key={kw} variant="destructive" className="flex items-center gap-1">
                        {kw}
                        <button onClick={() => removeKeyword(kw)} className="ml-1 hover:opacity-70">
                          <X className="h-3 w-3" />
                        </button>
                      </Badge>
                    ))}
                  </div>
                </div>

                <div className="grid gap-2">
                  <Label>Notification Emails</Label>
                  <div className="flex gap-2">
                    <Input 
                      type="email"
                      value={emailInput}
                      onChange={(e) => setEmailInput(e.target.value)}
                      placeholder="manager@company.com"
                      onKeyDown={(e) => e.key === 'Enter' && addEmail()}
                    />
                    <Button type="button" onClick={addEmail} variant="secondary">Add</Button>
                  </div>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {(config.emergency_notification_emails || []).map((email) => (
                      <Badge key={email} variant="outline" className="flex items-center gap-1">
                        {email}
                        <button onClick={() => removeEmail(email)} className="ml-1 hover:text-destructive">
                          <X className="h-3 w-3" />
                        </button>
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>

              <hr />

              {/* De-escalation Section */}
              <div className="space-y-4">
                <h4 className="font-medium flex items-center gap-2">
                  <Smile className="h-4 w-4" />
                  De-escalation Settings
                </h4>

                <div className="grid gap-2">
                  <Label>Manager Name</Label>
                  <Input 
                    value={config.manager_name || ''}
                    onChange={(e) => setConfig(prev => ({ ...prev, manager_name: e.target.value }))}
                    placeholder="John Smith"
                  />
                </div>

                <div className="grid gap-2">
                  <Label>Manager Direct Line</Label>
                  <Input 
                    type="tel"
                    value={config.de_escalation_manager_contact || ''}
                    onChange={(e) => setConfig(prev => ({ ...prev, de_escalation_manager_contact: e.target.value }))}
                    placeholder="(555) 123-4567"
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label>Auto-Create Support Ticket</Label>
                    <p className="text-xs text-muted-foreground">Automatically create ticket when escalation occurs</p>
                  </div>
                  <Switch 
                    checked={config.de_escalation_auto_ticket || false}
                    onCheckedChange={(checked) => setConfig(prev => ({ ...prev, de_escalation_auto_ticket: checked }))}
                  />
                </div>
              </div>
            </div>
          </AccordionContent>
        </AccordionItem>

        {/* Section 5: ElevenLabs Voice Agent Export */}
        <AccordionItem value="elevenlabs-export" className="border rounded-lg bg-card border-primary/30">
          <AccordionTrigger className="px-4 hover:no-underline">
            <div className="flex items-center gap-2">
              <Mic className="h-4 w-4 text-primary" />
              <span className="font-semibold">ElevenLabs Voice Agent Prompt</span>
              <Badge className="ml-2 bg-primary text-primary-foreground">Recommended</Badge>
            </div>
          </AccordionTrigger>
          <AccordionContent className="px-4 pb-4">
            <div className="space-y-4">
              <Alert>
                <Mic className="h-4 w-4" />
                <AlertDescription>
                  This generates a <strong>company-customized prompt</strong> for your ElevenLabs voice agent, including your brand tone, emergency protocols, and smart links.
                </AlertDescription>
              </Alert>

              <div className="bg-muted rounded-lg p-4 overflow-x-auto max-h-80">
                <pre className="text-xs font-mono whitespace-pre-wrap">
                  {generateElevenLabsPrompt()}
                </pre>
              </div>

              <div className="flex gap-2">
                <Button onClick={handleCopyElevenLabsPrompt} className="gap-2">
                  {elevenLabsPromptCopied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                  {elevenLabsPromptCopied ? 'Copied!' : 'Copy ElevenLabs Prompt'}
                </Button>
              </div>

              <div className="text-xs text-muted-foreground space-y-1">
                <p><strong>Next steps:</strong></p>
                <ol className="list-decimal list-inside space-y-1">
                  <li>Copy the prompt above</li>
                  <li>Go to ElevenLabs Dashboard → Your Agent → Settings</li>
                  <li>Paste into the "System Prompt" field</li>
                  <li>Configure conversation timing (see Integration guide for settings)</li>
                </ol>
              </div>
            </div>
          </AccordionContent>
        </AccordionItem>

        {/* Section 6: Developer Export */}
        <AccordionItem value="developer" className="border rounded-lg bg-card">
          <AccordionTrigger className="px-4 hover:no-underline">
            <div className="flex items-center gap-2">
              <Code className="h-4 w-4 text-primary" />
              <span className="font-semibold">Developer Export</span>
              <Badge variant="outline" className="ml-2">JSON</Badge>
            </div>
          </AccordionTrigger>
          <AccordionContent className="px-4 pb-4">
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Export your Aura configuration as JSON for use in custom integrations or AI system prompts.
              </p>
              
              <div className="bg-muted rounded-lg p-4 overflow-x-auto max-h-80">
                <pre className="text-xs font-mono">
                  {JSON.stringify(generateExport(), null, 2)}
                </pre>
              </div>

              <div className="flex gap-2">
                <Button variant="outline" onClick={handleCopyJson}>
                  {copied ? <Check className="h-4 w-4 mr-2" /> : <Copy className="h-4 w-4 mr-2" />}
                  {copied ? 'Copied!' : 'Copy to Clipboard'}
                </Button>
                <Button variant="outline" onClick={handleDownloadJson}>
                  <Download className="h-4 w-4 mr-2" />
                  Download JSON
                </Button>
              </div>
            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>

      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={saveMutation.isPending || isLoading}>
          {saveMutation.isPending ? 'Saving...' : 'Save Configuration'}
        </Button>
      </div>
    </div>
  );
}
