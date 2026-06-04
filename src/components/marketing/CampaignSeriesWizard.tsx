import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Sparkles, X, Loader2, Check, ChevronRight, ChevronLeft, Mail, MessageSquare, Calendar } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { addDays, format } from 'date-fns';

interface CampaignSeriesWizardProps {
  companyId: string;
  onCancel: () => void;
  onSuccess?: () => void;
}

interface Touchpoint {
  week: number;
  day: number;
  channel: 'email' | 'sms';
  purpose: string;
  subject?: string;
  message: string;
}

interface GeneratedSeries {
  touchpoints: Touchpoint[];
}

const CAMPAIGN_TYPES = [
  { value: 'promotional', label: 'Promotional', description: 'Drive sales with special offers' },
  { value: 'winback', label: 'Win-back', description: 'Re-engage inactive customers' },
  { value: 'seasonal', label: 'Seasonal', description: 'Holiday or seasonal promotions' },
  { value: 'onboarding', label: 'Onboarding', description: 'Welcome new customers' },
  { value: 'nurture', label: 'Nurture', description: 'Build relationships over time' },
];

const DURATIONS = [
  { value: '2', label: '2 Weeks', touchpoints: 4 },
  { value: '4', label: '4 Weeks', touchpoints: 8 },
  { value: '6', label: '6 Weeks', touchpoints: 10 },
  { value: '8', label: '8 Weeks', touchpoints: 12 },
];

export function CampaignSeriesWizard({ companyId, onCancel, onSuccess }: CampaignSeriesWizardProps) {
  const queryClient = useQueryClient();
  const [step, setStep] = useState(1);
  const [isGenerating, setIsGenerating] = useState(false);
  
  // Step 1: Series Config
  const [seriesName, setSeriesName] = useState('');
  const [campaignType, setCampaignType] = useState('promotional');
  const [duration, setDuration] = useState('4');
  const [targetSegment, setTargetSegment] = useState('all');
  
  // Step 2: Channels
  const [useEmail, setUseEmail] = useState(true);
  const [useSms, setUseSms] = useState(true);
  
  // Step 3 & 4: Generated Content
  const [generatedSeries, setGeneratedSeries] = useState<GeneratedSeries | null>(null);
  const [selectedTouchpoints, setSelectedTouchpoints] = useState<Set<number>>(new Set());
  const [startDate] = useState(new Date());

  const handleGenerate = async () => {
    setIsGenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke('generate-campaign-series', {
        body: {
          companyId,
          seriesName,
          campaignType,
          durationWeeks: parseInt(duration),
          targetSegment,
          channels: {
            email: useEmail,
            sms: useSms,
          },
        },
      });

      if (error) throw error;

      if (data) {
        setGeneratedSeries(data);
        setSelectedTouchpoints(new Set(data.touchpoints.map((_: unknown, i: number) => i)));
        setStep(4);
        toast.success('Campaign series generated!');
      }
    } catch (error: unknown) {
      console.error('Generation error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to generate';
      if (errorMessage.includes('429')) {
        toast.error('Rate limit exceeded. Please try again in a moment.');
      } else {
        toast.error('Failed to generate campaign series.');
      }
    } finally {
      setIsGenerating(false);
    }
  };

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (!generatedSeries) throw new Error('No content to save');

      const selectedItems = generatedSeries.touchpoints.filter((_, i) => selectedTouchpoints.has(i));
      if (selectedItems.length === 0) throw new Error('No touchpoints selected');

      // Create the parent/first campaign as the series anchor
      const firstTouchpoint = selectedItems[0];
      const { data: parentCampaign, error: parentError } = await supabase
        .from('marketing_campaigns')
        .insert({
          company_id: companyId,
          name: seriesName,
          campaign_type: campaignType,
          channels: [firstTouchpoint.channel],
          email_subject: firstTouchpoint.subject || null,
          message_template: firstTouchpoint.message,
          target_segment: targetSegment,
          status: 'draft',
          series_order: 1,
          scheduled_send_date: addDays(startDate, firstTouchpoint.day).toISOString(),
        })
        .select()
        .single();

      if (parentError) throw parentError;

      // Create remaining touchpoints linked to the series
      if (selectedItems.length > 1) {
        const childCampaigns = selectedItems.slice(1).map((tp, index) => ({
          company_id: companyId,
          name: `${seriesName} - ${tp.purpose}`,
          campaign_type: campaignType,
          channels: [tp.channel],
          email_subject: tp.subject || null,
          message_template: tp.message,
          target_segment: targetSegment,
          status: 'draft',
          series_id: parentCampaign.id,
          series_order: index + 2,
          scheduled_send_date: addDays(startDate, tp.day).toISOString(),
        }));

        const { error: childError } = await supabase
          .from('marketing_campaigns')
          .insert(childCampaigns);

        if (childError) throw childError;
      }

      return parentCampaign;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['campaigns'] });
      toast.success(`Campaign series "${seriesName}" created with ${selectedTouchpoints.size} touchpoints!`);
      onSuccess?.();
      onCancel();
    },
    onError: () => toast.error('Failed to save campaign series'),
  });

  const toggleTouchpoint = (index: number) => {
    const newSet = new Set(selectedTouchpoints);
    if (newSet.has(index)) {
      newSet.delete(index);
    } else {
      newSet.add(index);
    }
    setSelectedTouchpoints(newSet);
  };

  const getSchedulePreview = () => {
    const weeks = parseInt(duration);
    const touchpointsPerWeek = useEmail && useSms ? 2 : 1;
    const preview: { week: number; items: { day: number; channel: string; label: string }[] }[] = [];
    
    for (let w = 1; w <= weeks; w++) {
      const items: { day: number; channel: string; label: string }[] = [];
      const baseDay = (w - 1) * 7 + 1;
      
      if (useEmail) {
        items.push({ day: baseDay, channel: 'email', label: w === 1 ? 'Welcome Email' : `Week ${w} Email` });
      }
      if (useSms && w % 2 === 1) {
        items.push({ day: baseDay + 2, channel: 'sms', label: `Week ${w} SMS` });
      }
      
      preview.push({ week: w, items });
    }
    
    return preview;
  };

  return (
    <Card className="border-primary/20">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            <CardTitle className="text-lg">Campaign Series Generator</CardTitle>
          </div>
          <Button variant="ghost" size="icon" onClick={onCancel}>
            <X className="h-4 w-4" />
          </Button>
        </div>
        <p className="text-sm text-muted-foreground">
          Step {step} of 4: {
            step === 1 ? 'Series Configuration' : 
            step === 2 ? 'Channel Selection' : 
            step === 3 ? 'Schedule Preview' : 
            'Review & Save'
          }
        </p>
      </CardHeader>

      <CardContent className="space-y-6">
        {step === 1 && (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Series Name *</Label>
              <Input
                value={seriesName}
                onChange={(e) => setSeriesName(e.target.value)}
                placeholder="e.g., Summer 2024 Promotion"
              />
            </div>

            <div className="space-y-2">
              <Label>Campaign Type</Label>
              <Select value={campaignType} onValueChange={setCampaignType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CAMPAIGN_TYPES.map(type => (
                    <SelectItem key={type.value} value={type.value}>
                      <div className="flex flex-col">
                        <span>{type.label}</span>
                        <span className="text-xs text-muted-foreground">{type.description}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Duration</Label>
                <Select value={duration} onValueChange={setDuration}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {DURATIONS.map(d => (
                      <SelectItem key={d.value} value={d.value}>
                        {d.label} (~{d.touchpoints} messages)
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Target Segment</Label>
                <Select value={targetSegment} onValueChange={setTargetSegment}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Everyone (Customers + Leads)</SelectItem>
                    <SelectItem value="customers">Customers Only</SelectItem>
                    <SelectItem value="leads">Leads Only</SelectItem>
                    <SelectItem value="new">New Customers (last 30 days)</SelectItem>
                    <SelectItem value="inactive">Inactive Customers (90+ days)</SelectItem>
                    <SelectItem value="vip">VIP Customers</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <Button variant="outline" onClick={onCancel}>Cancel</Button>
              <Button onClick={() => setStep(2)} disabled={!seriesName}>
                Configure Channels <ChevronRight className="ml-1 h-4 w-4" />
              </Button>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Select which communication channels to include in your campaign series:
            </p>

            <div className="space-y-3">
              <label className="flex items-start gap-3 p-4 border rounded-lg cursor-pointer hover:bg-muted/50">
                <Checkbox checked={useEmail} onCheckedChange={(c) => setUseEmail(!!c)} />
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4 text-primary" />
                    <span className="font-medium">Email</span>
                    <Badge variant="secondary" className="text-xs">Primary</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">
                    Detailed messages with full content, images, and links
                  </p>
                </div>
              </label>

              <label className="flex items-start gap-3 p-4 border rounded-lg cursor-pointer hover:bg-muted/50">
                <Checkbox checked={useSms} onCheckedChange={(c) => setUseSms(!!c)} />
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <MessageSquare className="h-4 w-4 text-primary" />
                    <span className="font-medium">SMS</span>
                    <Badge variant="secondary" className="text-xs">Quick</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">
                    Short reminders and urgent calls-to-action
                  </p>
                </div>
              </label>
            </div>

            <div className="flex justify-between gap-2 pt-4">
              <Button variant="outline" onClick={() => setStep(1)}>
                <ChevronLeft className="mr-1 h-4 w-4" /> Back
              </Button>
              <Button onClick={() => setStep(3)} disabled={!useEmail && !useSms}>
                Preview Schedule <ChevronRight className="ml-1 h-4 w-4" />
              </Button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Here's the planned schedule for your {duration}-week campaign series:
            </p>

            <ScrollArea className="h-[300px] pr-4">
              <div className="space-y-4">
                {getSchedulePreview().map((week) => (
                  <div key={week.week} className="space-y-2">
                    <h4 className="font-medium text-sm">Week {week.week}</h4>
                    <div className="space-y-1 pl-4 border-l-2 border-primary/30">
                      {week.items.map((item, i) => (
                        <div key={i} className="flex items-center gap-2 text-sm">
                          {item.channel === 'email' ? (
                            <Mail className="h-3 w-3 text-muted-foreground" />
                          ) : (
                            <MessageSquare className="h-3 w-3 text-muted-foreground" />
                          )}
                          <span>Day {item.day}: {item.label}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>

            <div className="flex justify-between gap-2 pt-4">
              <Button variant="outline" onClick={() => setStep(2)}>
                <ChevronLeft className="mr-1 h-4 w-4" /> Back
              </Button>
              <Button onClick={handleGenerate} disabled={isGenerating}>
                {isGenerating ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Generating Content...
                  </>
                ) : (
                  <>
                    <Sparkles className="mr-2 h-4 w-4" />
                    Generate Content
                  </>
                )}
              </Button>
            </div>
          </div>
        )}

        {step === 4 && generatedSeries && (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Review the generated content. Uncheck any touchpoints you don't want to include.
            </p>

            <ScrollArea className="h-[350px] pr-4">
              <Accordion type="multiple" className="space-y-2">
                {generatedSeries.touchpoints.map((tp, index) => (
                  <AccordionItem key={index} value={`tp-${index}`} className="border rounded-lg">
                    <AccordionTrigger className="px-4 hover:no-underline">
                      <div className="flex items-center gap-3 flex-1">
                        <Checkbox 
                          checked={selectedTouchpoints.has(index)}
                          onCheckedChange={() => toggleTouchpoint(index)}
                          onClick={(e) => e.stopPropagation()}
                        />
                        <div className="flex items-center gap-2">
                          {tp.channel === 'email' ? (
                            <Mail className="h-4 w-4 text-primary" />
                          ) : (
                            <MessageSquare className="h-4 w-4 text-primary" />
                          )}
                          <span className="font-medium text-sm">Week {tp.week}, Day {tp.day}</span>
                          <Badge variant="outline" className="text-xs capitalize">{tp.channel}</Badge>
                        </div>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent className="px-4 pb-4">
                      <div className="space-y-2 text-sm">
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <Calendar className="h-3 w-3" />
                          <span>Scheduled: {format(addDays(startDate, tp.day), 'MMM d, yyyy')}</span>
                        </div>
                        <p className="text-xs text-muted-foreground">{tp.purpose}</p>
                        {tp.subject && (
                          <div className="p-2 bg-muted/50 rounded text-xs">
                            <span className="font-medium">Subject:</span> {tp.subject}
                          </div>
                        )}
                        <div className="p-2 bg-muted/50 rounded text-xs whitespace-pre-wrap">
                          {tp.message}
                        </div>
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </ScrollArea>

            <div className="flex justify-between gap-2 pt-4 border-t">
              <Button variant="outline" onClick={() => setStep(3)}>
                <ChevronLeft className="mr-1 h-4 w-4" /> Back
              </Button>
              <Button 
                onClick={() => saveMutation.mutate()} 
                disabled={saveMutation.isPending || selectedTouchpoints.size === 0}
              >
                {saveMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating Series...
                  </>
                ) : (
                  <>
                    <Check className="mr-2 h-4 w-4" />
                    Create {selectedTouchpoints.size} Campaigns
                  </>
                )}
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
