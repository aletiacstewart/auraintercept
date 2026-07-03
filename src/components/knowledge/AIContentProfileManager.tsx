import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from '@/components/ui/accordion';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { X, Plus, Save, Sparkles, Building2, Tags, Target, MessageSquare, Ban, Loader2, Lightbulb, FlaskConical } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from 'sonner';
// Common industry categories (similar to Google My Business)
const INDUSTRY_OPTIONS = [
  // Food & Hospitality (Aura Core)
  'Restaurant',
  'Cafe & Coffee Shop',
  'Fine Dining',
  'Fast Casual Restaurant',
  'Food Truck',
  'Bakery & Pastry Shop',
  'Bar & Lounge',
  'Catering Services',
  'Brewery & Taproom',
  'Ice Cream & Dessert Shop',
  // Beauty & Wellness (Aura Halo)
  'Hair Salon',
  'Barbershop',
  'Nail Salon',
  'Day Spa',
  'Med Spa & Aesthetics',
  'Massage Therapy',
  'Skincare & Facials',
  'Lash & Brow Studio',
  'Makeup Artist',
  'Tanning Salon',
  'Wellness Center',
  'Yoga & Pilates Studio',
  'Fitness & Personal Training',
  // Personal Services (Aura Flow)
  'Life Coaching',
  'Business Coaching',
  'Personal Assistant Services',
  'Concierge Services',
  'Travel Planning',
  'Executive Assistant',
  'Virtual Assistant',
  'Personal Styling',
  'Personal Shopper',
  'Career Counseling',
  // Home Services
  'HVAC & Air Conditioning',
  'Plumbing',
  'Electrical Services',
  'Roofing',
  'Landscaping & Lawn Care',
  'Cleaning Services',
  'Pest Control',
  'Home Renovation',
  'Painting',
  'Flooring',
  'Appliance Repair',
  'Pool & Spa Services',
  'Garage Door Services',
  'Handyman Services',
  'Moving & Storage',
  // Professional Services
  'Legal Services',
  'Accounting & Tax',
  'Real Estate',
  'Insurance',
  'Financial Services',
  'Consulting',
  'Marketing & Advertising',
  'IT Services',
  'Web Design & Development',
  'SaaS (Software as a Service)',
  'DaaS (Data as a Service)',
  // Automotive
  'Auto Repair',
  'Auto Detailing',
  'Towing Services',
  'Car Dealership',
  // Retail
  'Retail Store',
  'E-commerce',
  'Boutique',
  // Other
  'Photography',
  'Event Planning',
  'Pet Services',
  'Education & Tutoring',
  'Construction',
  'Other'
];

const TONE_OPTIONS = [
  { value: 'professional', label: 'Professional', description: 'Formal and business-like' },
  { value: 'friendly', label: 'Friendly', description: 'Warm and approachable' },
  { value: 'casual', label: 'Casual', description: 'Relaxed and conversational' },
  { value: 'formal', label: 'Formal', description: 'Traditional and sophisticated' },
  { value: 'energetic', label: 'Energetic', description: 'Dynamic and exciting' },
  { value: 'empathetic', label: 'Empathetic', description: 'Understanding and caring' },
  { value: 'authoritative', label: 'Authoritative', description: 'Expert and confident' },
];

interface AIContentProfile {
  id: string;
  company_id: string;
  primary_industry: string | null;
  secondary_industries: string[];
  keywords: string[];
  business_description: string | null;
  unique_selling_points: string[];
  target_audience: string | null;
  tone: string;
  brand_voice: string | null;
  avoid_keywords: string[];
  avoid_topics: string[];
  content_topics: string[];
  created_at: string;
  updated_at: string;
}

// Content topic suggestions grouped by industry cluster
const TOPICS_BY_CLUSTER: Record<string, string[]> = {
  general: [
    'Customer success stories',
    'Behind the scenes',
    'Team spotlights',
    'Industry news and trends',
    'Seasonal promotions',
  ],
  food_hospitality: [
    'Daily specials & menu highlights',
    'Chef features & recipes',
    'Local sourcing & ingredients',
    'Happy hour promotions',
    'Private events & catering',
  ],
  beauty_wellness: [
    'Beauty tips & tutorials',
    'Skincare routines',
    'Treatment spotlights',
    'Before & after transformations',
    'Self-care & wellness tips',
    'Seasonal beauty trends',
  ],
  personal_services: [
    'Productivity tips',
    'Work-life balance',
    'Time management strategies',
    'Goal setting & achievement',
    'Professional development',
  ],
  home_services: [
    'Home maintenance tips',
    'DIY tips for homeowners',
    'Safety tips',
    'Energy saving tips',
    'Seasonal reminders',
    'Product/equipment highlights',
  ],
  professional_services: [
    'Client case studies',
    'Regulatory & compliance updates',
    'Expert tips & insights',
    'FAQ & common questions',
    'Process walkthroughs',
  ],
  automotive: [
    'Vehicle care tips',
    'Seasonal maintenance reminders',
    'Before & after detailing',
    'New arrivals & inventory',
    'Safety & recall alerts',
  ],
  retail: [
    'New arrivals & product drops',
    'Style & how-to guides',
    'Sales & promotions',
    'Customer favorites',
    'Gift guides',
  ],
};

const INDUSTRY_TO_CLUSTER: Record<string, keyof typeof TOPICS_BY_CLUSTER> = {
  // Food & Hospitality
  'Restaurant': 'food_hospitality',
  'Cafe & Coffee Shop': 'food_hospitality',
  'Fine Dining': 'food_hospitality',
  'Fast Casual Restaurant': 'food_hospitality',
  'Food Truck': 'food_hospitality',
  'Bakery & Pastry Shop': 'food_hospitality',
  'Bar & Lounge': 'food_hospitality',
  'Catering Services': 'food_hospitality',
  'Brewery & Taproom': 'food_hospitality',
  'Ice Cream & Dessert Shop': 'food_hospitality',
  // Beauty & Wellness
  'Hair Salon': 'beauty_wellness',
  'Barbershop': 'beauty_wellness',
  'Nail Salon': 'beauty_wellness',
  'Day Spa': 'beauty_wellness',
  'Med Spa & Aesthetics': 'beauty_wellness',
  'Massage Therapy': 'beauty_wellness',
  'Skincare & Facials': 'beauty_wellness',
  'Lash & Brow Studio': 'beauty_wellness',
  'Makeup Artist': 'beauty_wellness',
  'Tanning Salon': 'beauty_wellness',
  'Wellness Center': 'beauty_wellness',
  'Yoga & Pilates Studio': 'beauty_wellness',
  'Fitness & Personal Training': 'beauty_wellness',
  // Personal Services
  'Life Coaching': 'personal_services',
  'Business Coaching': 'personal_services',
  'Personal Assistant Services': 'personal_services',
  'Concierge Services': 'personal_services',
  'Travel Planning': 'personal_services',
  'Executive Assistant': 'personal_services',
  'Virtual Assistant': 'personal_services',
  'Personal Styling': 'personal_services',
  'Personal Shopper': 'personal_services',
  'Career Counseling': 'personal_services',
  // Home Services
  'HVAC & Air Conditioning': 'home_services',
  'Plumbing': 'home_services',
  'Electrical Services': 'home_services',
  'Roofing': 'home_services',
  'Landscaping & Lawn Care': 'home_services',
  'Cleaning Services': 'home_services',
  'Pest Control': 'home_services',
  'Home Renovation': 'home_services',
  'Painting': 'home_services',
  'Flooring': 'home_services',
  'Appliance Repair': 'home_services',
  'Pool & Spa Services': 'home_services',
  'Garage Door Services': 'home_services',
  'Handyman Services': 'home_services',
  'Moving & Storage': 'home_services',
  'Construction': 'home_services',
  // Professional Services
  'Legal Services': 'professional_services',
  'Accounting & Tax': 'professional_services',
  'Real Estate': 'professional_services',
  'Insurance': 'professional_services',
  'Financial Services': 'professional_services',
  'Consulting': 'professional_services',
  'Marketing & Advertising': 'professional_services',
  'IT Services': 'professional_services',
  'Web Design & Development': 'professional_services',
  'SaaS (Software as a Service)': 'professional_services',
  'DaaS (Data as a Service)': 'professional_services',
  // Automotive
  'Auto Repair': 'automotive',
  'Auto Detailing': 'automotive',
  'Towing Services': 'automotive',
  'Car Dealership': 'automotive',
  // Retail
  'Retail Store': 'retail',
  'E-commerce': 'retail',
  'Boutique': 'retail',
};

// Union of all preset topics — used to detect "custom" topics added by the user
const DEFAULT_CONTENT_TOPICS = Array.from(
  new Set(Object.values(TOPICS_BY_CLUSTER).flat())
);

export function AIContentProfileManager() {
  const { companyId } = useAuth();
  const queryClient = useQueryClient();
  
  // Form state
  const [primaryIndustry, setPrimaryIndustry] = useState('');
  const [secondaryIndustries, setSecondaryIndustries] = useState<string[]>([]);
  const [keywords, setKeywords] = useState<string[]>([]);
  const [keywordInput, setKeywordInput] = useState('');
  const [businessDescription, setBusinessDescription] = useState('');
  const [uniqueSellingPoints, setUniqueSellingPoints] = useState<string[]>([]);
  const [uspInput, setUspInput] = useState('');
  const [targetAudience, setTargetAudience] = useState('');
  const [tone, setTone] = useState('professional');
  const [brandVoice, setBrandVoice] = useState('');
  const [avoidKeywords, setAvoidKeywords] = useState<string[]>([]);
  const [avoidKeywordInput, setAvoidKeywordInput] = useState('');
  const [contentTopics, setContentTopics] = useState<string[]>([]);
  const [customTopicInput, setCustomTopicInput] = useState('');
  const [hasChanges, setHasChanges] = useState(false);
  
  // Keyword suggestions state
  const [suggestedKeywords, setSuggestedKeywords] = useState<string[]>([]);
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false);

  // Test Content state
  const [testOpen, setTestOpen] = useState(false);
  const [testLoading, setTestLoading] = useState(false);
  const [testResult, setTestResult] = useState<string | null>(null);
  const [testError, setTestError] = useState<string | null>(null);

  const handleTestContent = async () => {
    if (!companyId) return;
    setTestOpen(true);
    setTestLoading(true);
    setTestResult(null);
    setTestError(null);
    try {
      const { data, error } = await supabase.functions.invoke('generate-social-content', {
        body: {
          companyId,
          platform: 'facebook',
          topic: contentTopics[0] || 'Customer success story',
          tone,
          industry: primaryIndustry || 'Home Services',
          uniqueSellingPoints,
          avoidKeywords,
          previewOnly: true,
        },
      });
      if (error) throw error;
      const text =
        (data as any)?.content ||
        (data as any)?.text ||
        (data as any)?.post ||
        (typeof data === 'string' ? data : JSON.stringify(data, null, 2));
      setTestResult(text);
    } catch (err: any) {
      console.error('Test content error', err);
      setTestError(err?.message || 'Could not generate sample content. Make sure your profile has at least an industry and tone set.');
    } finally {
      setTestLoading(false);
    }
  };

  // Fetch existing profile
  const { data: profile, isLoading } = useQuery({
    queryKey: ['ai-content-profile', companyId],
    queryFn: async () => {
      if (!companyId) return null;
      const { data, error } = await supabase
        .from('company_ai_content_profiles')
        .select('*')
        .eq('company_id', companyId)
        .maybeSingle();
      
      if (error && error.code !== 'PGRST116') throw error;
      return data as AIContentProfile | null;
    },
    enabled: !!companyId,
  });

  // Initialize form from profile
  useEffect(() => {
    if (profile) {
      setPrimaryIndustry(profile.primary_industry || '');
      setSecondaryIndustries(profile.secondary_industries || []);
      setKeywords(profile.keywords || []);
      setBusinessDescription(profile.business_description || '');
      setUniqueSellingPoints(profile.unique_selling_points || []);
      setTargetAudience(profile.target_audience || '');
      setTone(profile.tone || 'professional');
      setBrandVoice(profile.brand_voice || '');
      setAvoidKeywords(profile.avoid_keywords || []);
      setContentTopics(profile.content_topics || []);
      setHasChanges(false);
    }
  }, [profile]);

  // Save mutation
  const saveMutation = useMutation({
    mutationFn: async () => {
      if (!companyId) throw new Error('No company selected');
      
      const data = {
        company_id: companyId,
        primary_industry: primaryIndustry || null,
        secondary_industries: secondaryIndustries,
        keywords,
        business_description: businessDescription || null,
        unique_selling_points: uniqueSellingPoints,
        target_audience: targetAudience || null,
        tone,
        brand_voice: brandVoice || null,
        avoid_keywords: avoidKeywords,
        avoid_topics: [],
        content_topics: contentTopics,
      };

      if (profile?.id) {
        const { error } = await supabase
          .from('company_ai_content_profiles')
          .update(data)
          .eq('id', profile.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('company_ai_content_profiles')
          .insert(data);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ai-content-profile', companyId] });
      toast.success('AI Content Profile saved!');
      setHasChanges(false);
    },
    onError: (error) => {
      console.error('Error saving AI content profile:', error);
      toast.error('Failed to save profile');
    },
  });

  const markChanged = () => setHasChanges(true);

  // Helper functions for array fields
  const addKeyword = () => {
    const trimmed = keywordInput.trim();
    if (trimmed && !keywords.includes(trimmed)) {
      setKeywords([...keywords, trimmed]);
      setKeywordInput('');
      markChanged();
    }
  };

  const removeKeyword = (keyword: string) => {
    setKeywords(keywords.filter(k => k !== keyword));
    markChanged();
  };

  const addUSP = () => {
    const trimmed = uspInput.trim();
    if (trimmed && !uniqueSellingPoints.includes(trimmed)) {
      setUniqueSellingPoints([...uniqueSellingPoints, trimmed]);
      setUspInput('');
      markChanged();
    }
  };

  const removeUSP = (usp: string) => {
    setUniqueSellingPoints(uniqueSellingPoints.filter(u => u !== usp));
    markChanged();
  };

  const addAvoidKeyword = () => {
    const trimmed = avoidKeywordInput.trim();
    if (trimmed && !avoidKeywords.includes(trimmed)) {
      setAvoidKeywords([...avoidKeywords, trimmed]);
      setAvoidKeywordInput('');
      markChanged();
    }
  };

  const removeAvoidKeyword = (keyword: string) => {
    setAvoidKeywords(avoidKeywords.filter(k => k !== keyword));
    markChanged();
  };

  const toggleContentTopic = (topic: string) => {
    if (contentTopics.includes(topic)) {
      setContentTopics(contentTopics.filter(t => t !== topic));
    } else {
      setContentTopics([...contentTopics, topic]);
    }
    markChanged();
  };

  const addCustomTopic = () => {
    const trimmed = customTopicInput.trim();
    if (trimmed && !contentTopics.includes(trimmed)) {
      setContentTopics([...contentTopics, trimmed]);
      setCustomTopicInput('');
      markChanged();
    }
  };

  const removeCustomTopic = (topic: string) => {
    setContentTopics(contentTopics.filter(t => t !== topic));
    markChanged();
  };

  const toggleSecondaryIndustry = (industry: string) => {
    if (secondaryIndustries.includes(industry)) {
      setSecondaryIndustries(secondaryIndustries.filter(i => i !== industry));
    } else if (secondaryIndustries.length < 5) {
      setSecondaryIndustries([...secondaryIndustries, industry]);
    } else {
      toast.error('Maximum 5 secondary industries allowed');
      return;
    }
    markChanged();
  };

  // Suggest keywords based on selected industries
  const suggestKeywords = async () => {
    if (!primaryIndustry) {
      toast.error('Please select a primary industry first');
      return;
    }
    
    setIsLoadingSuggestions(true);
    setSuggestedKeywords([]);
    
    try {
      const industries = [primaryIndustry, ...secondaryIndustries].filter(Boolean).join(', ');
      
      const response = await supabase.functions.invoke('generate-website-content', {
        body: {
          contentType: 'keywords_suggestion',
          action: 'generate',
          companyId,
          context: {
            industries,
            existingKeywords: keywords,
          }
        }
      });
      
      if (response.error) {
        throw new Error(response.error.message || 'Failed to generate suggestions');
      }
      
      const suggestionsText = response.data?.content || '';
      
      // Parse the JSON array from the response
      let parsed: string[] = [];
      try {
        // Try to extract JSON array from response
        const jsonMatch = suggestionsText.match(/\[[\s\S]*\]/);
        if (jsonMatch) {
          parsed = JSON.parse(jsonMatch[0]);
        }
      } catch (e) {
        // If JSON parsing fails, try splitting by comma or newline
        parsed = suggestionsText
          .split(/[,\n]/)
          .map((s: string) => s.trim().replace(/^["'\-\d.]+\s*/, '').replace(/["']$/g, ''))
          .filter((s: string) => s.length > 0 && s.length < 50);
      }
      
      // Filter out keywords already added
      const newSuggestions = parsed.filter(
        (k: string) => !keywords.includes(k) && k.trim().length > 0
      );
      
      if (newSuggestions.length === 0) {
        toast.info('No new keyword suggestions found');
      } else {
        setSuggestedKeywords(newSuggestions.slice(0, 15));
        toast.success(`Generated ${newSuggestions.length} keyword suggestions`);
      }
    } catch (error) {
      console.error('Error getting keyword suggestions:', error);
      toast.error('Failed to generate suggestions');
    } finally {
      setIsLoadingSuggestions(false);
    }
  };

  const addSuggestedKeyword = (keyword: string) => {
    if (!keywords.includes(keyword)) {
      setKeywords([...keywords, keyword]);
      setSuggestedKeywords(suggestedKeywords.filter(k => k !== keyword));
      markChanged();
    }
  };

  const addAllSuggestions = () => {
    const newKeywords = [...keywords, ...suggestedKeywords.filter(k => !keywords.includes(k))];
    setKeywords(newKeywords);
    setSuggestedKeywords([]);
    markChanged();
  };

  if (isLoading) {
    return (
      <Card className="scroll-mt-[128px]">
        <CardContent className="py-8 text-center text-muted-foreground">
          Loading AI Content Profile...
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-primary/10">
            <Sparkles className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-foreground">AI Content Profile</h3>
            <p className="text-sm text-muted-foreground">
              Configure context for AI-generated website and marketing content
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={handleTestContent}
            disabled={!primaryIndustry}
            title={!primaryIndustry ? 'Set a primary industry first' : 'Generate a sample post in your voice'}
          >
            <FlaskConical className="h-4 w-4 mr-2" />
            Test Content
          </Button>
          <Button
            onClick={() => saveMutation.mutate()}
            disabled={!hasChanges || saveMutation.isPending}
          >
            <Save className="h-4 w-4 mr-2" />
            {saveMutation.isPending ? 'Saving...' : 'Save Profile'}
          </Button>
        </div>
      </div>

      {/* Industry Selection */}
      <Card className="scroll-mt-[128px]">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <Building2 className="h-4 w-4 text-muted-foreground" />
            <CardTitle className="text-base">Industry Categories</CardTitle>
          </div>
          <CardDescription>
            Select your primary industry and up to 5 secondary categories (like Google My Business)
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>Primary Industry</Label>
            <Select 
              value={primaryIndustry} 
              onValueChange={(v) => { setPrimaryIndustry(v); markChanged(); }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select your main industry..." />
              </SelectTrigger>
              <SelectContent className="max-h-64">
                {INDUSTRY_OPTIONS.map(industry => (
                  <SelectItem key={industry} value={industry}>
                    {industry}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div>
            <Label>Secondary Industries (optional, max 5)</Label>
            <div className="mt-2 flex flex-wrap gap-2">
              {secondaryIndustries.map(industry => (
                <Badge key={industry} variant="secondary" className="gap-1">
                  {industry}
                  <button onClick={() => toggleSecondaryIndustry(industry)}>
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              ))}
            </div>
            <Select 
              value="" 
              onValueChange={(v) => toggleSecondaryIndustry(v)}
            >
              <SelectTrigger className="mt-2">
                <SelectValue placeholder="Add secondary industry..." />
              </SelectTrigger>
              <SelectContent className="max-h-64">
                {INDUSTRY_OPTIONS.filter(i => i !== primaryIndustry && !secondaryIndustries.includes(i)).map(industry => (
                  <SelectItem key={industry} value={industry}>
                    {industry}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Keywords */}
      <Card className="scroll-mt-[128px]">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Tags className="h-4 w-4 text-muted-foreground" />
              <CardTitle className="text-base">Keywords & Terms</CardTitle>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={suggestKeywords}
              disabled={!primaryIndustry || isLoadingSuggestions}
            >
              {isLoadingSuggestions ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Sparkles className="h-4 w-4 mr-2" />
              )}
              {isLoadingSuggestions ? 'Generating...' : 'Suggest Keywords'}
            </Button>
          </div>
          <CardDescription>
            Add keywords that should be incorporated into generated content
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Current keywords */}
          <div className="flex flex-wrap gap-2">
            {keywords.map(keyword => (
              <Badge key={keyword} variant="outline" className="gap-1">
                {keyword}
                <button onClick={() => removeKeyword(keyword)}>
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            ))}
            {keywords.length === 0 && (
              <span className="text-sm text-muted-foreground">No keywords added yet</span>
            )}
          </div>

          {/* Suggested keywords section */}
          {suggestedKeywords.length > 0 && (
            <div className="p-3 bg-muted/50 rounded-lg space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-sm text-muted-foreground">
                  Suggested keywords (click to add)
                </Label>
                <Button variant="ghost" size="sm" onClick={addAllSuggestions}>
                  Add All
                </Button>
              </div>
              <div className="flex flex-wrap gap-2">
                {suggestedKeywords.map(keyword => (
                  <Badge
                    key={keyword}
                    variant="secondary"
                    className="cursor-pointer hover:bg-primary hover:text-primary-foreground transition-colors"
                    onClick={() => addSuggestedKeyword(keyword)}
                  >
                    <Plus className="h-3 w-3 mr-1" />
                    {keyword}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Manual keyword input */}
          <div className="flex gap-2">
            <Input
              placeholder="Add a keyword (e.g., 'emergency service', '24/7 support')..."
              value={keywordInput}
              onChange={(e) => setKeywordInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addKeyword())}
            />
            <Button variant="outline" size="icon" onClick={addKeyword}>
              <Plus className="h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Business Description */}
      <Card className="scroll-mt-[128px]">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
            <CardTitle className="text-base">Business Description</CardTitle>
          </div>
          <CardDescription>
            Describe your business, services, and what makes you unique
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>Business Overview</Label>
            <Textarea
              placeholder="Describe your business, what you do, and your core services..."
              value={businessDescription}
              onChange={(e) => { setBusinessDescription(e.target.value); markChanged(); }}
              className="min-h-[100px]"
            />
          </div>
          
          <div>
            <Label>Target Audience</Label>
            <Input
              placeholder="e.g., Homeowners in the greater Phoenix area, Small business owners..."
              value={targetAudience}
              onChange={(e) => { setTargetAudience(e.target.value); markChanged(); }}
            />
          </div>

          <div>
            <Label>Unique Selling Points</Label>
            <div className="flex flex-wrap gap-2 mb-2">
              {uniqueSellingPoints.map(usp => (
                <Badge key={usp} variant="secondary" className="gap-1">
                  {usp}
                  <button onClick={() => removeUSP(usp)}>
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              ))}
            </div>
            <div className="flex gap-2">
              <Input
                placeholder="Add a USP (e.g., 'Licensed & Insured', 'Same-Day Service')..."
                value={uspInput}
                onChange={(e) => setUspInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addUSP())}
              />
              <Button variant="outline" size="icon" onClick={addUSP}>
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Content Tone */}
      <Card className="scroll-mt-[128px]">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <Target className="h-4 w-4 text-muted-foreground" />
            <CardTitle className="text-base">Content Tone & Voice</CardTitle>
          </div>
          <CardDescription>
            Set the preferred tone and style for generated content
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>Tone</Label>
            <Select 
              value={tone} 
              onValueChange={(v) => { setTone(v); markChanged(); }}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {TONE_OPTIONS.map(option => (
                  <SelectItem key={option.value} value={option.value}>
                    <div className="flex flex-col">
                      <span>{option.label}</span>
                      <span className="text-xs text-muted-foreground">{option.description}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>Brand Voice (optional)</Label>
            <Textarea
              placeholder="Describe your brand's unique voice and personality in more detail..."
              value={brandVoice}
              onChange={(e) => { setBrandVoice(e.target.value); markChanged(); }}
              className="min-h-[80px]"
            />
          </div>
        </CardContent>
      </Card>

      {/* Content Topics */}
      <Card className="scroll-mt-[128px]">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <Lightbulb className="h-4 w-4 text-muted-foreground" />
            <CardTitle className="text-base">Content Topics</CardTitle>
          </div>
          <CardDescription>
            Define themes for automated social content generation. The AI will rotate through these topics when creating batch content.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Preset topic checkboxes — filtered by selected industries */}
          {(() => {
            const selected = [primaryIndustry, ...secondaryIndustries].filter(Boolean);
            const clusters = new Set<string>(['general']);
            selected.forEach(ind => {
              const c = INDUSTRY_TO_CLUSTER[ind];
              if (c) clusters.add(c);
            });
            const visibleTopics = Array.from(
              new Set(Array.from(clusters).flatMap(c => TOPICS_BY_CLUSTER[c] || []))
            );
            return (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {visibleTopics.map(topic => (
              <div key={topic} className="flex items-center space-x-2">
                <Checkbox
                  id={`topic-${topic}`}
                  checked={contentTopics.includes(topic)}
                  onCheckedChange={() => toggleContentTopic(topic)}
                />
                <Label 
                  htmlFor={`topic-${topic}`}
                  className="text-sm font-normal cursor-pointer"
                >
                  {topic}
                </Label>
              </div>
            ))}
          </div>
            );
          })()}

          {/* Custom topics */}
          {contentTopics.filter(t => !DEFAULT_CONTENT_TOPICS.includes(t)).length > 0 && (
            <div className="pt-2 border-t">
              <Label className="text-sm text-muted-foreground mb-2 block">Custom Topics</Label>
              <div className="flex flex-wrap gap-2">
                {contentTopics
                  .filter(t => !DEFAULT_CONTENT_TOPICS.includes(t))
                  .map(topic => (
                    <Badge key={topic} variant="secondary" className="gap-1">
                      {topic}
                      <button onClick={() => removeCustomTopic(topic)}>
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
              </div>
            </div>
          )}

          {/* Add custom topic input */}
          <div className="flex gap-2">
            <Input
              placeholder="Add a custom topic..."
              value={customTopicInput}
              onChange={(e) => setCustomTopicInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addCustomTopic())}
            />
            <Button variant="outline" size="icon" onClick={addCustomTopic}>
              <Plus className="h-4 w-4" />
            </Button>
          </div>

          {contentTopics.length === 0 && (
            <p className="text-sm text-muted-foreground">
              Select at least one topic to enable intelligent content variety in batch generation.
            </p>
          )}
        </CardContent>
      </Card>

      {/* Avoid Keywords */}
      <Card className="scroll-mt-[128px]">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <Ban className="h-4 w-4 text-muted-foreground" />
            <CardTitle className="text-base">Content Restrictions</CardTitle>
          </div>
          <CardDescription>
            Specify words or phrases to avoid in generated content
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-2">
            {avoidKeywords.map(keyword => (
              <Badge key={keyword} variant="destructive" className="gap-1">
                {keyword}
                <button onClick={() => removeAvoidKeyword(keyword)}>
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            ))}
          </div>
          <div className="flex gap-2">
            <Input
              placeholder="Add a word/phrase to avoid (e.g., 'cheap', 'discount')..."
              value={avoidKeywordInput}
              onChange={(e) => setAvoidKeywordInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addAvoidKeyword())}
            />
            <Button variant="outline" size="icon" onClick={addAvoidKeyword}>
              <Plus className="h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Test Content Dialog */}
      <Dialog open={testOpen} onOpenChange={setTestOpen}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FlaskConical className="h-5 w-5 text-primary" />
              Sample Content Preview
            </DialogTitle>
            <DialogDescription>
              A sample Facebook post the AI would generate using your current profile.
            </DialogDescription>
          </DialogHeader>
          <div className="min-h-[200px] py-2">
            {testLoading && (
              <div className="flex flex-col items-center justify-center py-12 gap-3 text-muted-foreground">
                <Loader2 className="h-6 w-6 animate-spin" />
                <p className="text-sm">Generating in your brand voice...</p>
              </div>
            )}
            {testError && (
              <div className="rounded-md border border-destructive/40 bg-destructive/10 p-4 text-sm text-destructive">
                {testError}
              </div>
            )}
            {testResult && (
              <div className="rounded-md border bg-muted/30 p-4 text-sm whitespace-pre-wrap leading-relaxed">
                {testResult}
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setTestOpen(false)}>
              Close
            </Button>
            <Button onClick={handleTestContent} disabled={testLoading}>
              <FlaskConical className="h-4 w-4 mr-2" />
              {testLoading ? 'Generating...' : 'Regenerate'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}