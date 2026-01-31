import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Sparkles, X, Loader2, Check, ChevronRight, ChevronLeft, Briefcase, HelpCircle, Clock } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

interface KnowledgeBaseWizardProps {
  companyId: string;
  onCancel: () => void;
  onSuccess?: () => void;
}

interface GeneratedContent {
  faqs: { question: string; answer: string }[];
  services: { name: string; description: string; price: number | null }[];
  business_hours: { day_of_week: number; open_time: string; close_time: string; is_closed: boolean }[];
}

const INDUSTRIES = [
  'HVAC', 'Plumbing', 'Electrical', 'Roofing', 'Landscaping', 'Cleaning',
  'Pest Control', 'Pool Service', 'Appliance Repair', 'Home Security',
  'Painting', 'Flooring', 'General Contracting', 'Handyman', 'Locksmith',
  'Moving Services', 'Auto Repair', 'IT Services', 'Other'
];

const BUSINESS_TYPES = [
  { value: 'residential', label: 'Residential' },
  { value: 'commercial', label: 'Commercial' },
  { value: 'both', label: 'Residential & Commercial' },
];

export function KnowledgeBaseWizard({ companyId, onCancel, onSuccess }: KnowledgeBaseWizardProps) {
  const queryClient = useQueryClient();
  const [step, setStep] = useState(1);
  const [isGenerating, setIsGenerating] = useState(false);
  
  // Step 1: Business Info
  const [industry, setIndustry] = useState('');
  const [serviceArea, setServiceArea] = useState('');
  const [businessType, setBusinessType] = useState('residential');
  const [description, setDescription] = useState('');
  
  // Step 2: Content Selection
  const [generateFaqs, setGenerateFaqs] = useState(true);
  const [generateServices, setGenerateServices] = useState(true);
  const [generateHours, setGenerateHours] = useState(true);
  
  // Step 3: Generated Content
  const [generatedContent, setGeneratedContent] = useState<GeneratedContent | null>(null);
  const [selectedFaqs, setSelectedFaqs] = useState<Set<number>>(new Set());
  const [selectedServices, setSelectedServices] = useState<Set<number>>(new Set());
  const [useGeneratedHours, setUseGeneratedHours] = useState(true);

  const handleGenerate = async () => {
    setIsGenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke('generate-knowledge-base', {
        body: {
          companyId,
          industry,
          serviceArea,
          businessType,
          description,
          contentTypes: {
            faqs: generateFaqs,
            services: generateServices,
            business_hours: generateHours,
          },
        },
      });

      if (error) throw error;

      if (data) {
        setGeneratedContent(data);
        // Select all by default
        if (data.faqs) setSelectedFaqs(new Set(data.faqs.map((_: unknown, i: number) => i)));
        if (data.services) setSelectedServices(new Set(data.services.map((_: unknown, i: number) => i)));
        setStep(3);
        toast.success('Content generated successfully!');
      }
    } catch (error: unknown) {
      console.error('Generation error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to generate content';
      if (errorMessage.includes('429')) {
        toast.error('Rate limit exceeded. Please try again in a moment.');
      } else {
        toast.error('Failed to generate content. Please try again.');
      }
    } finally {
      setIsGenerating(false);
    }
  };

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (!generatedContent) throw new Error('No content to save');

      // Save selected FAQs
      if (generatedContent.faqs && selectedFaqs.size > 0) {
        const faqsToInsert = generatedContent.faqs
          .filter((_, i) => selectedFaqs.has(i))
          .map(faq => ({
            company_id: companyId,
            question: faq.question,
            answer: faq.answer,
            is_active: true,
          }));

        if (faqsToInsert.length > 0) {
          const { error } = await supabase.from('faqs').insert(faqsToInsert);
          if (error) throw error;
        }
      }

      // Save selected services
      if (generatedContent.services && selectedServices.size > 0) {
        const servicesToInsert = generatedContent.services
          .filter((_, i) => selectedServices.has(i))
          .map(service => ({
            company_id: companyId,
            name: service.name,
            description: service.description,
            price: service.price,
            is_active: true,
          }));

        if (servicesToInsert.length > 0) {
          const { error } = await supabase.from('services').insert(servicesToInsert);
          if (error) throw error;
        }
      }

      // Save business hours
      if (generatedContent.business_hours && useGeneratedHours) {
        // First delete existing hours
        await supabase
          .from('business_hours')
          .delete()
          .eq('company_id', companyId)
          .eq('hour_type', 'office');

        const hoursToInsert = generatedContent.business_hours.map(hour => ({
          company_id: companyId,
          day_of_week: hour.day_of_week,
          open_time: hour.open_time,
          close_time: hour.close_time,
          is_closed: hour.is_closed,
          hour_type: 'office',
        }));

        const { error } = await supabase.from('business_hours').insert(hoursToInsert);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['faqs'] });
      queryClient.invalidateQueries({ queryKey: ['services'] });
      queryClient.invalidateQueries({ queryKey: ['business-hours'] });
      toast.success('Knowledge base content saved!');
      onSuccess?.();
      onCancel();
    },
    onError: () => toast.error('Failed to save content'),
  });

  const toggleFaq = (index: number) => {
    const newSet = new Set(selectedFaqs);
    if (newSet.has(index)) {
      newSet.delete(index);
    } else {
      newSet.add(index);
    }
    setSelectedFaqs(newSet);
  };

  const toggleService = (index: number) => {
    const newSet = new Set(selectedServices);
    if (newSet.has(index)) {
      newSet.delete(index);
    } else {
      newSet.add(index);
    }
    setSelectedServices(newSet);
  };

  const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

  return (
    <Card className="border-primary/20">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            <CardTitle className="text-lg">Knowledge Base Generator</CardTitle>
          </div>
          <Button variant="ghost" size="icon" onClick={onCancel}>
            <X className="h-4 w-4" />
          </Button>
        </div>
        <p className="text-sm text-muted-foreground">
          Step {step} of 3: {step === 1 ? 'Business Information' : step === 2 ? 'Content Selection' : 'Review & Save'}
        </p>
      </CardHeader>

      <CardContent className="space-y-6">
        {step === 1 && (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Primary Industry *</Label>
              <Select value={industry} onValueChange={setIndustry}>
                <SelectTrigger>
                  <SelectValue placeholder="Select your industry" />
                </SelectTrigger>
                <SelectContent>
                  {INDUSTRIES.map(ind => (
                    <SelectItem key={ind} value={ind}>{ind}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Service Area</Label>
              <Input
                value={serviceArea}
                onChange={(e) => setServiceArea(e.target.value)}
                placeholder="e.g., Miami, FL or Greater Los Angeles Area"
              />
            </div>

            <div className="space-y-2">
              <Label>Business Type</Label>
              <Select value={businessType} onValueChange={setBusinessType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {BUSINESS_TYPES.map(type => (
                    <SelectItem key={type.value} value={type.value}>{type.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Brief Description (optional)</Label>
              <Textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Tell us a bit about your business, specializations, or unique offerings..."
                rows={3}
              />
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <Button variant="outline" onClick={onCancel}>Cancel</Button>
              <Button onClick={() => setStep(2)} disabled={!industry}>
                Next: Select Content <ChevronRight className="ml-1 h-4 w-4" />
              </Button>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Select what content you'd like to generate for your knowledge base:
            </p>

            <div className="space-y-3">
              <label className="flex items-start gap-3 p-4 border rounded-lg cursor-pointer hover:bg-muted/50">
                <Checkbox checked={generateFaqs} onCheckedChange={(c) => setGenerateFaqs(!!c)} />
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <HelpCircle className="h-4 w-4 text-primary" />
                    <span className="font-medium">FAQs</span>
                    <Badge variant="secondary" className="text-xs">10-15 items</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">
                    Common questions customers ask about {industry || 'your'} services
                  </p>
                </div>
              </label>

              <label className="flex items-start gap-3 p-4 border rounded-lg cursor-pointer hover:bg-muted/50">
                <Checkbox checked={generateServices} onCheckedChange={(c) => setGenerateServices(!!c)} />
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <Briefcase className="h-4 w-4 text-primary" />
                    <span className="font-medium">Services</span>
                    <Badge variant="secondary" className="text-xs">5-8 items</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">
                    Typical services offered by {industry || 'your'} businesses
                  </p>
                </div>
              </label>

              <label className="flex items-start gap-3 p-4 border rounded-lg cursor-pointer hover:bg-muted/50">
                <Checkbox checked={generateHours} onCheckedChange={(c) => setGenerateHours(!!c)} />
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-primary" />
                    <span className="font-medium">Business Hours</span>
                    <Badge variant="secondary" className="text-xs">Standard schedule</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">
                    Industry-standard operating hours for {businessType} businesses
                  </p>
                </div>
              </label>
            </div>

            <div className="flex justify-between gap-2 pt-4">
              <Button variant="outline" onClick={() => setStep(1)}>
                <ChevronLeft className="mr-1 h-4 w-4" /> Back
              </Button>
              <Button 
                onClick={handleGenerate} 
                disabled={isGenerating || (!generateFaqs && !generateServices && !generateHours)}
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Generating...
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

        {step === 3 && generatedContent && (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Review the generated content. Uncheck any items you don't want to save.
            </p>

            <ScrollArea className="h-[400px] pr-4">
              <div className="space-y-6">
                {/* FAQs Section */}
                {generatedContent.faqs && generatedContent.faqs.length > 0 && (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <HelpCircle className="h-4 w-4 text-primary" />
                      <span className="font-medium">FAQs ({selectedFaqs.size}/{generatedContent.faqs.length} selected)</span>
                    </div>
                    <div className="space-y-2">
                      {generatedContent.faqs.map((faq, i) => (
                        <label 
                          key={i} 
                          className={`flex items-start gap-2 p-3 border rounded-lg cursor-pointer transition-colors ${
                            selectedFaqs.has(i) ? 'bg-primary/5 border-primary/30' : 'opacity-60'
                          }`}
                        >
                          <Checkbox 
                            checked={selectedFaqs.has(i)} 
                            onCheckedChange={() => toggleFaq(i)}
                            className="mt-1"
                          />
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-sm">{faq.question}</p>
                            <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{faq.answer}</p>
                          </div>
                        </label>
                      ))}
                    </div>
                  </div>
                )}

                {/* Services Section */}
                {generatedContent.services && generatedContent.services.length > 0 && (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Briefcase className="h-4 w-4 text-primary" />
                      <span className="font-medium">Services ({selectedServices.size}/{generatedContent.services.length} selected)</span>
                    </div>
                    <div className="space-y-2">
                      {generatedContent.services.map((service, i) => (
                        <label 
                          key={i} 
                          className={`flex items-start gap-2 p-3 border rounded-lg cursor-pointer transition-colors ${
                            selectedServices.has(i) ? 'bg-primary/5 border-primary/30' : 'opacity-60'
                          }`}
                        >
                          <Checkbox 
                            checked={selectedServices.has(i)} 
                            onCheckedChange={() => toggleService(i)}
                            className="mt-1"
                          />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between">
                              <p className="font-medium text-sm">{service.name}</p>
                              {service.price && (
                                <Badge variant="outline" className="text-xs">${service.price}</Badge>
                              )}
                            </div>
                            <p className="text-xs text-muted-foreground mt-1">{service.description}</p>
                          </div>
                        </label>
                      ))}
                    </div>
                  </div>
                )}

                {/* Business Hours Section */}
                {generatedContent.business_hours && generatedContent.business_hours.length > 0 && (
                  <div className="space-y-2">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <Checkbox 
                        checked={useGeneratedHours} 
                        onCheckedChange={(c) => setUseGeneratedHours(!!c)}
                      />
                      <Clock className="h-4 w-4 text-primary" />
                      <span className="font-medium">Business Hours</span>
                    </label>
                    {useGeneratedHours && (
                      <div className="ml-6 p-3 border rounded-lg bg-muted/30">
                        <div className="grid grid-cols-2 gap-2 text-sm">
                          {generatedContent.business_hours.map((hour) => (
                            <div key={hour.day_of_week} className="flex justify-between">
                              <span className="text-muted-foreground">{DAY_NAMES[hour.day_of_week]}</span>
                              <span>{hour.is_closed ? 'Closed' : `${hour.open_time} - ${hour.close_time}`}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </ScrollArea>

            <div className="flex justify-between gap-2 pt-4 border-t">
              <Button variant="outline" onClick={() => setStep(2)}>
                <ChevronLeft className="mr-1 h-4 w-4" /> Back
              </Button>
              <Button 
                onClick={() => saveMutation.mutate()} 
                disabled={saveMutation.isPending || (selectedFaqs.size === 0 && selectedServices.size === 0 && !useGeneratedHours)}
              >
                {saveMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Check className="mr-2 h-4 w-4" />
                    Save to Knowledge Base
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
