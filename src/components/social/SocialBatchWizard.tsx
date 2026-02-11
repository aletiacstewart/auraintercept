import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Progress } from '@/components/ui/progress';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';
import { 
  Sparkles, 
  Loader2, 
  ArrowLeft, 
  ArrowRight, 
  CalendarIcon,
  Plus,
  Trash2,
  Search,
  Instagram,
  Facebook,
  Linkedin,
  Video,
  MapPin,
  MessageSquare,
  X,
  ImageIcon,
} from 'lucide-react';
import { format, addDays } from 'date-fns';
import { TavilyStatusBadge } from '@/components/ai/TavilyStatusBadge';

interface SocialBatchWizardProps {
  companyId: string;
  onCancel: () => void;
  onSuccess?: () => void;
}

interface TopicEntry {
  id: string;
  topic: string;
  keywords: string;
  scheduledFor: Date;
  platforms?: string[];
}

const FREQUENCY_OPTIONS = [
  { value: 'daily', label: 'Daily', days: 1 },
  { value: 'twice_weekly', label: 'Twice Weekly', days: 3 },
  { value: 'three_weekly', label: '3x Weekly', days: 2 },
  { value: 'weekly', label: 'Weekly', days: 7 },
  { value: 'biweekly', label: 'Bi-weekly', days: 14 },
];

const PLATFORM_OPTIONS = [
  { value: 'instagram', label: 'Instagram', icon: Instagram },
  { value: 'facebook', label: 'Facebook', icon: Facebook },
  { value: 'linkedin', label: 'LinkedIn', icon: Linkedin },
  { value: 'tiktok', label: 'TikTok', icon: Video },
  { value: 'google_business', label: 'Google Business', icon: MapPin },
  { value: 'sms', label: 'SMS', icon: MessageSquare },
];

export function SocialBatchWizard({ companyId, onCancel, onSuccess }: SocialBatchWizardProps) {
  const queryClient = useQueryClient();
  const [step, setStep] = useState(1);
  
  // Step 1: Schedule settings
  const [frequency, setFrequency] = useState('twice_weekly');
  const [startDate, setStartDate] = useState<Date>(addDays(new Date(), 1));
  const [postCount, setPostCount] = useState('6');
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>(['instagram', 'facebook']);
  
  // Step 2: Topics
  const [topics, setTopics] = useState<TopicEntry[]>([]);
  const [bulkTopics, setBulkTopics] = useState('');
  
  // Generation state
  const [generationProgress, setGenerationProgress] = useState(0);
  const [generationPhase, setGenerationPhase] = useState('');
  const [generateImages, setGenerateImages] = useState(false);
  // Check Tavily status
  const { data: hasTavily } = useQuery({
    queryKey: ['tavily-configured', companyId],
    queryFn: async () => {
      if (!companyId) return false;
      const { data } = await supabase
        .from('tenant_integrations')
        .select('tavily_api_key')
        .eq('company_id', companyId)
        .single();
      return !!data?.tavily_api_key;
    },
    enabled: !!companyId,
  });

  // Generate topics based on frequency and count
  const generateScheduledDates = () => {
    const count = parseInt(postCount);
    const freq = FREQUENCY_OPTIONS.find(f => f.value === frequency);
    const days = freq?.days || 7;
    
    const newTopics: TopicEntry[] = [];
    for (let i = 0; i < count; i++) {
      newTopics.push({
        id: crypto.randomUUID(),
        topic: '',
        keywords: '',
        scheduledFor: addDays(startDate, i * days),
      });
    }
    setTopics(newTopics);
  };

  // Apply bulk topics
  const applyBulkTopics = () => {
    const topicLines = bulkTopics.split('\n').filter(t => t.trim());
    const count = Math.min(topicLines.length, topics.length);
    
    setTopics(prev => prev.map((t, i) => ({
      ...t,
      topic: i < count ? topicLines[i].trim() : t.topic,
    })));
    
    toast.success(`Applied ${count} topics`);
  };

  // Update single topic
  const updateTopic = (id: string, field: keyof TopicEntry, value: string | Date | string[]) => {
    setTopics(prev => prev.map(t => 
      t.id === id ? { ...t, [field]: value } : t
    ));
  };

  // Add topic
  const addTopic = () => {
    const lastDate = topics.length > 0 
      ? topics[topics.length - 1].scheduledFor 
      : startDate;
    const freq = FREQUENCY_OPTIONS.find(f => f.value === frequency);
    
    setTopics(prev => [...prev, {
      id: crypto.randomUUID(),
      topic: '',
      keywords: '',
      scheduledFor: addDays(lastDate, freq?.days || 7),
    }]);
  };

  // Remove topic
  const removeTopic = (id: string) => {
    setTopics(prev => prev.filter(t => t.id !== id));
  };

  // Toggle platform selection
  const togglePlatform = (platform: string) => {
    setSelectedPlatforms(prev => 
      prev.includes(platform) 
        ? prev.filter(p => p !== platform)
        : [...prev, platform]
    );
  };

  // Generation mutation
  const generateMutation = useMutation({
    mutationFn: async () => {
      const validTopics = topics.filter(t => t.topic.trim());
      
      if (validTopics.length === 0) {
        throw new Error('No topics provided');
      }

      if (selectedPlatforms.length === 0) {
        throw new Error('At least one platform must be selected');
      }

      setGenerationPhase('Preparing batch generation...');
      setGenerationProgress(10);

      if (hasTavily) {
        setGenerationPhase('Researching trending topics...');
        setGenerationProgress(20);
      }

      setGenerationPhase(`Generating ${validTopics.length} posts across ${selectedPlatforms.length} platforms...`);
      
      const { data, error } = await supabase.functions.invoke('generate-social-batch', {
        body: {
          topics: validTopics.map(t => ({
            topic: t.topic,
            keywords: t.keywords.split(',').map(k => k.trim()).filter(Boolean),
            scheduledFor: t.scheduledFor.toISOString(),
            platforms: t.platforms?.length ? t.platforms : undefined,
          })),
          defaultPlatforms: selectedPlatforms,
          companyId,
          timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        },
      });

      if (error) throw error;

      // Generate images for each topic if enabled
      if (generateImages && data?.posts?.length) {
        setGenerationPhase('Generating AI images for posts...');
        setGenerationProgress(75);

        const imagePromises = validTopics.map(async (t) => {
          try {
            const { data: imgData } = await supabase.functions.invoke('generate-content-image', {
              body: { topic: t.topic, companyId, style: 'social media graphic' },
            });
            return { topic: t.topic, image_url: imgData?.image_url || null };
          } catch {
            return { topic: t.topic, image_url: null };
          }
        });

        const imageResults = await Promise.allSettled(imagePromises);
        
        // Update posts with image URLs
        for (const result of imageResults) {
          if (result.status === 'fulfilled' && result.value.image_url) {
            const matchingPost = data.posts?.find((p: any) => p.topic === result.value.topic);
            if (matchingPost) {
              await supabase
                .from('scheduled_social_posts')
                .update({ image_url: result.value.image_url })
                .eq('id', matchingPost.id);
            }
          }
        }
      }
      
      setGenerationProgress(100);
      return data;
    },
    onSuccess: (data) => {
      toast.success(`Generated ${data.generatedCount} social posts for approval!`);
      queryClient.invalidateQueries({ queryKey: ['scheduled-social-posts'] });
      onSuccess?.();
      onCancel();
    },
    onError: (error: any) => {
      console.error('Generation error:', error);
      toast.error(error.message || 'Failed to generate posts');
      setStep(2);
      setGenerationProgress(0);
      setGenerationPhase('');
    },
  });

  const handleNext = () => {
    if (step === 1) {
      if (selectedPlatforms.length === 0) {
        toast.error('Please select at least one platform');
        return;
      }
      generateScheduledDates();
      setStep(2);
    } else if (step === 2) {
      const validCount = topics.filter(t => t.topic.trim()).length;
      if (validCount === 0) {
        toast.error('Please add at least one topic');
        return;
      }
      setStep(3);
      generateMutation.mutate();
    }
  };

  const getStepTitle = () => {
    switch (step) {
      case 1: return 'Schedule & Platforms';
      case 2: return 'Topics & Keywords';
      case 3: return 'Generating Batch';
      default: return '';
    }
  };

  return (
    <Card className="border-border/50">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Sparkles className="h-5 w-5 text-pink-500" />
            Batch Posts Generator
          </CardTitle>
          <div className="flex items-center gap-3">
            <span className="text-sm text-muted-foreground">
              Step {step} of 3: {getStepTitle()}
            </span>
            <Button variant="ghost" size="icon" onClick={onCancel} className="h-8 w-8">
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
        <Progress value={(step / 3) * 100} className="h-1 mt-2" />
      </CardHeader>

      <CardContent>
        {/* Step 1: Schedule Settings */}
        {step === 1 && (
          <div className="space-y-6">
            <TavilyStatusBadge companyId={companyId} showDisconnected />
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Start Date</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-full justify-start text-left">
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {format(startDate, 'PPP')}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={startDate}
                      onSelect={(date) => date && setStartDate(date)}
                      disabled={(date) => date < new Date()}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>

              <div className="space-y-2">
                <Label>Posting Frequency</Label>
                <Select value={frequency} onValueChange={setFrequency}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {FREQUENCY_OPTIONS.map(opt => (
                      <SelectItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2 col-span-2">
                <Label>Number of Posts</Label>
                <Select value={postCount} onValueChange={setPostCount}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {[2, 3, 4, 5, 6, 8, 10, 12].map(n => (
                      <SelectItem key={n} value={n.toString()}>
                        {n} posts
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Platform Selection */}
            <div className="space-y-3">
              <Label>Target Platforms</Label>
              <div className="grid grid-cols-2 gap-3">
                {PLATFORM_OPTIONS.map(({ value, label, icon: Icon }) => (
                  <div
                    key={value}
                    className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                      selectedPlatforms.includes(value)
                        ? 'border-primary bg-primary/5'
                        : 'border-border hover:border-primary/50'
                    }`}
                    onClick={() => togglePlatform(value)}
                  >
                    <Checkbox
                      checked={selectedPlatforms.includes(value)}
                      onCheckedChange={() => togglePlatform(value)}
                    />
                    <Icon className="h-5 w-5" />
                    <span className="font-medium">{label}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* AI Image Generation Toggle */}
            <div className="flex items-center justify-between p-3 rounded-lg border border-border">
              <div className="flex items-center gap-3">
                <ImageIcon className="h-4 w-4 text-pink-400" />
                <div>
                  <p className="text-sm font-medium">Generate AI Images</p>
                  <p className="text-xs text-muted-foreground">Create matching visuals for each post topic</p>
                </div>
              </div>
              <Switch checked={generateImages} onCheckedChange={setGenerateImages} />
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <Button variant="outline" onClick={onCancel}>Cancel</Button>
              <Button onClick={handleNext} disabled={selectedPlatforms.length === 0}>
                Configure Topics
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </div>
          </div>
        )}

        {/* Step 2: Topics */}
        {step === 2 && (
          <div className="space-y-4">
            {/* Bulk entry */}
            <div className="space-y-2">
              <Label>Bulk Topics (one per line)</Label>
              <Textarea
                placeholder="Enter topics separated by new lines...&#10;e.g. Tips for home maintenance&#10;5 ways to save energy&#10;Spring cleaning checklist"
                value={bulkTopics}
                onChange={(e) => setBulkTopics(e.target.value)}
                rows={3}
              />
              <Button 
                variant="outline" 
                size="sm" 
                onClick={applyBulkTopics}
                disabled={!bulkTopics.trim()}
              >
                Apply to Schedule
              </Button>
            </div>

            <div className="border-t pt-4">
              <div className="flex items-center justify-between mb-4">
                <Label className="text-base">Scheduled Topics</Label>
                <Button variant="outline" size="sm" onClick={addTopic}>
                  <Plus className="h-4 w-4 mr-1" />
                  Add Topic
                </Button>
              </div>

              <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2">
                {topics.map((topic, index) => (
                  <div 
                    key={topic.id} 
                    className="grid grid-cols-12 gap-2 items-start p-3 bg-muted/50 rounded-lg"
                  >
                    <div className="col-span-5">
                      <Label className="text-xs text-muted-foreground">Topic {index + 1}</Label>
                      <Input
                        placeholder="Post topic..."
                        value={topic.topic}
                        onChange={(e) => updateTopic(topic.id, 'topic', e.target.value)}
                      />
                    </div>
                    <div className="col-span-3">
                      <Label className="text-xs text-muted-foreground">Keywords</Label>
                      <Input
                        placeholder="keyword1, keyword2"
                        value={topic.keywords}
                        onChange={(e) => updateTopic(topic.id, 'keywords', e.target.value)}
                      />
                    </div>
                    <div className="col-span-3">
                      <Label className="text-xs text-muted-foreground">Scheduled</Label>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button variant="outline" size="sm" className="w-full justify-start text-xs">
                            <CalendarIcon className="mr-1 h-3 w-3" />
                            {format(topic.scheduledFor, 'MMM d, yyyy')}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={topic.scheduledFor}
                            onSelect={(date) => date && updateTopic(topic.id, 'scheduledFor', date)}
                            disabled={(date) => date < new Date()}
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                    </div>
                    <div className="col-span-1 pt-5">
                      <Button 
                        variant="ghost" 
                        size="icon"
                        onClick={() => removeTopic(topic.id)}
                        disabled={topics.length <= 1}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex justify-between gap-2 pt-4">
              <Button variant="outline" onClick={() => setStep(1)}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
              </Button>
              <div className="flex gap-2">
                <Button variant="outline" onClick={onCancel}>Cancel</Button>
                <Button 
                  onClick={handleNext}
                  disabled={topics.filter(t => t.topic.trim()).length === 0}
                  className="bg-gradient-to-r from-pink-500 to-purple-500 text-white"
                >
                  Generate {topics.filter(t => t.topic.trim()).length} Posts
                  <Sparkles className="h-4 w-4 ml-2" />
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Step 3: Generating */}
        {step === 3 && (
          <div className="flex flex-col items-center justify-center py-12 space-y-6">
            <div className="relative">
              <Loader2 className="h-16 w-16 animate-spin text-pink-500" />
              {hasTavily && generationPhase.includes('Research') && (
                <Search className="h-6 w-6 absolute -top-1 -right-1 text-pink-500 animate-pulse" />
              )}
            </div>
            
            <div className="text-center space-y-2">
              <p className="text-lg font-medium">{generationPhase || 'Preparing...'}</p>
              <p className="text-sm text-muted-foreground">
                {hasTavily 
                  ? 'AI is researching trends and generating platform-optimized content...'
                  : 'AI is generating platform-optimized social content...'}
              </p>
            </div>

            <div className="w-full max-w-md">
              <Progress value={generationProgress} className="h-2" />
              <p className="text-xs text-muted-foreground text-center mt-2">
                {generationProgress}% complete
              </p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
