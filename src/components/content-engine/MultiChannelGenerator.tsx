import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Sparkles, 
  Globe, 
  Share2, 
  Mail, 
  FileText, 
  MessageSquare,
  Loader2,
  Copy,
  Check,
  Wand2,
  Calendar,
  ArrowRight,
  Save,
  ImageIcon,
  Download,
  Lightbulb,
  LayoutTemplate,
} from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { IndustryTemplateSelector } from '@/components/social/IndustryTemplateSelector';

type Channel = 'website' | 'social' | 'campaign' | 'blog' | 'sms';

interface ChannelConfig {
  id: Channel;
  label: string;
  icon: React.ElementType;
  color: string;
  description: string;
}

const CHANNELS: ChannelConfig[] = [
  { id: 'website', label: 'Website', icon: Globe, color: 'text-cyan-400', description: 'Headlines, copy, CTAs' },
  { id: 'social', label: 'Social Media', icon: Share2, color: 'text-pink-400', description: '6 platform variations' },
  { id: 'campaign', label: 'Email Campaign', icon: Mail, color: 'text-amber-400', description: 'Subject, body, CTA' },
  { id: 'blog', label: 'Blog Post', icon: FileText, color: 'text-green-400', description: 'SEO-optimized article' },
  { id: 'sms', label: 'SMS Templates', icon: MessageSquare, color: 'text-purple-400', description: '160-char messages' },
];

export function MultiChannelGenerator() {
  const { user, companyId } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [topic, setTopic] = useState('');
  const [selectedChannels, setSelectedChannels] = useState<Channel[]>(['social']);
  const [generating, setGenerating] = useState(false);
  const [suggestingTopics, setSuggestingTopics] = useState(false);
  const [topicSuggestions, setTopicSuggestions] = useState<string[]>([]);
  const [results, setResults] = useState<Record<string, unknown>>({});
  const [activeResultTab, setActiveResultTab] = useState<string>('');
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [savingChannel, setSavingChannel] = useState<string | null>(null);
  const [generateImage, setGenerateImage] = useState(false);
  const [generatedImageUrl, setGeneratedImageUrl] = useState<string | null>(null);
  const [generatingImage, setGeneratingImage] = useState(false);

  // Get company ID from profile if not in context
  const { data: profile } = useQuery({
    queryKey: ['profile-company', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      const { data } = await supabase
        .from('profiles')
        .select('company_id')
        .eq('id', user.id)
        .single();
      return data;
    },
    enabled: !!user?.id && !companyId,
  });

  const effectiveCompanyId = companyId || profile?.company_id;

  // Track content generation in history
  const trackGeneration = useMutation({
    mutationFn: async ({ channel, content }: { channel: string; content: unknown }) => {
      if (!effectiveCompanyId) return;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error } = await (supabase.from('content_engine_history') as any).insert({
        company_id: effectiveCompanyId,
        channel,
        topic: topic.trim(),
        content: content as Record<string, unknown>,
        created_by: user?.id,
      });
      if (error) console.error('Error tracking generation:', error);
    },
  });

  const handleSuggestTopics = async () => {
    setSuggestingTopics(true);
    setTopicSuggestions([]);
    try {
      const { data, error } = await supabase.functions.invoke('content-engine', {
        body: {
          channel: 'suggestions',
          contentType: 'suggestions',
          topic: topic.trim() || 'general business',
          companyId: effectiveCompanyId,
        },
      });
      if (error) throw error;
      const suggestions = data?.content;
      if (Array.isArray(suggestions)) {
        setTopicSuggestions(suggestions);
      }
    } catch (e) {
      console.error('Topic suggestion failed:', e);
      toast({ title: 'Could not generate suggestions', variant: 'destructive' });
    } finally {
      setSuggestingTopics(false);
    }
  };

  const toggleChannel = (channel: Channel) => {
    setSelectedChannels(prev => 
      prev.includes(channel) 
        ? prev.filter(c => c !== channel)
        : [...prev, channel]
    );
  };

  const handleGenerate = async () => {
    if (!topic.trim()) {
      toast({ title: 'Enter a topic', description: 'Please provide a topic for content generation', variant: 'destructive' });
      return;
    }
    if (selectedChannels.length === 0) {
      toast({ title: 'Select channels', description: 'Please select at least one channel', variant: 'destructive' });
      return;
    }
    if (!effectiveCompanyId) {
      toast({ title: 'No company', description: 'You must be associated with a company', variant: 'destructive' });
      return;
    }

    setGenerating(true);
    setResults({});
    setGeneratedImageUrl(null);

    try {
      // Generate image in parallel if enabled
      const imagePromise = generateImage ? (async () => {
        setGeneratingImage(true);
        try {
          const { data, error } = await supabase.functions.invoke('generate-content-image', {
            body: { topic: topic.trim(), companyId: effectiveCompanyId, style: 'professional social media graphic' },
          });
          if (error) throw error;
          if (data?.image_url) setGeneratedImageUrl(data.image_url);
        } catch (e) {
          console.error('Image generation failed:', e);
        } finally {
          setGeneratingImage(false);
        }
      })() : Promise.resolve();

      // Generate content for each selected channel in parallel
      const promises = selectedChannels.map(async (channel) => {
        const { data, error } = await supabase.functions.invoke('content-engine', {
          body: {
            channel,
            contentType: 'general',
            topic: topic.trim(),
            companyId: effectiveCompanyId,
          },
        });

        if (error) throw new Error(`${channel}: ${error.message}`);
        return { channel, data };
      });

      const responses = await Promise.allSettled(promises);
      
      const newResults: Record<string, unknown> = {};
      let successCount = 0;

      responses.forEach((response, index) => {
        const channel = selectedChannels[index];
        if (response.status === 'fulfilled') {
          newResults[channel] = response.value.data.content;
          successCount++;
          // Track generation
          trackGeneration.mutate({ channel, content: response.value.data.content });
        } else {
          console.error(`Failed to generate ${channel}:`, response.reason);
          newResults[channel] = { error: response.reason.message };
        }
      });

      await imagePromise;
      setResults(newResults);
      setActiveResultTab(selectedChannels[0]);

      // Invalidate history queries
      queryClient.invalidateQueries({ queryKey: ['content-engine-history'] });

      toast({
        title: 'Content Generated',
        description: `Successfully generated content for ${successCount}/${selectedChannels.length} channels`,
      });
    } catch (error) {
      console.error('Generation error:', error);
      toast({
        title: 'Generation Failed',
        description: error instanceof Error ? error.message : 'Unknown error',
        variant: 'destructive',
      });
    } finally {
      setGenerating(false);
    }
  };

  const copyToClipboard = async (text: string, field: string) => {
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(text);
      } else {
        // Fallback for iframe/non-secure contexts
        const el = document.createElement('textarea');
        el.value = text;
        el.style.position = 'fixed';
        el.style.opacity = '0';
        document.body.appendChild(el);
        el.focus();
        el.select();
        document.execCommand('copy');
        document.body.removeChild(el);
      }
    } catch {
      console.warn('Clipboard copy failed');
    }
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
    toast({ title: 'Copied!', description: 'Content copied to clipboard' });
  };

  const PLATFORM_LINKS: Record<string, string> = {
    facebook: 'https://www.facebook.com',
    instagram: 'https://www.instagram.com/create/story/',
    linkedin: 'https://www.linkedin.com/feed/',
    tiktok: 'https://www.tiktok.com/upload',
    google_business: 'https://business.google.com/create-post',
    twitter: 'https://twitter.com/compose/tweet',
    x: 'https://twitter.com/compose/tweet',
  };

  const copyAndOpenPlatform = async (platform: string, post: string, hashtags: string[] = []) => {
    const fullText = hashtags.length > 0 ? `${post}\n\n${hashtags.map(t => `#${t}`).join(' ')}` : post;
    await copyToClipboard(fullText, `${platform}-open`);
    const url = PLATFORM_LINKS[platform.toLowerCase()] || 'https://www.facebook.com';
    // Use anchor element to bypass popup blockers
    const a = document.createElement('a');
    a.href = url;
    a.target = '_blank';
    a.rel = 'noopener noreferrer';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  // Save actions for each channel
  const saveToSocialPosts = async (content: Record<string, { post?: string; hashtags?: string[] }>) => {
    setSavingChannel('social');
    try {
      // Build content_json from all platforms
      const platforms = Object.keys(content);
      
      const scheduledDate = new Date();
      scheduledDate.setDate(scheduledDate.getDate() + 1);
      scheduledDate.setHours(10, 0, 0, 0);

      const { error } = await supabase.from('scheduled_social_posts').insert({
        company_id: effectiveCompanyId!,
        topic: topic.trim(),
        platforms: platforms,
        content_json: content,
        scheduled_for: scheduledDate.toISOString(),
        status: 'pending',
      });

      if (error) throw error;
      toast({ title: 'Saved!', description: 'Post added to scheduled social posts' });
      queryClient.invalidateQueries({ queryKey: ['scheduled-social-posts'] });
    } catch (error) {
      console.error('Error saving social post:', error);
      toast({ title: 'Error', description: 'Failed to save post', variant: 'destructive' });
    } finally {
      setSavingChannel(null);
    }
  };

  const saveToCampaign = async (content: Record<string, string>) => {
    setSavingChannel('campaign');
    try {
      const { error } = await supabase.from('marketing_campaigns').insert({
        company_id: effectiveCompanyId!,
        name: topic.trim(),
        campaign_type: 'email',
        subject: content.subject || topic,
        email_template: content.body || '',
        status: 'draft',
        created_by: user?.id,
      });

      if (error) throw error;
      toast({ title: 'Saved!', description: 'Campaign draft created' });
      navigate('/dashboard/campaigns');
    } catch (error) {
      console.error('Error saving campaign:', error);
      toast({ title: 'Error', description: 'Failed to create campaign', variant: 'destructive' });
    } finally {
      setSavingChannel(null);
    }
  };

  const saveToBlogDraft = async (content: Record<string, string>) => {
    setSavingChannel('blog');
    try {
      const blogTitle = content.title || topic;
      const slug = blogTitle.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
      
      const scheduledDate = new Date();
      scheduledDate.setDate(scheduledDate.getDate() + 7);
      scheduledDate.setHours(9, 0, 0, 0);

      const { error } = await supabase.from('scheduled_blog_posts').insert({
        company_id: effectiveCompanyId!,
        title: blogTitle,
        slug: slug,
        content: content.body || content.content || '',
        excerpt: content.excerpt || content.meta_description || '',
        scheduled_for: scheduledDate.toISOString(),
        status: 'draft',
        created_by: user?.id,
      });

      if (error) throw error;
      toast({ title: 'Saved!', description: 'Blog post draft created' });
      queryClient.invalidateQueries({ queryKey: ['scheduled-blog-posts'] });
    } catch (error) {
      console.error('Error saving blog post:', error);
      toast({ title: 'Error', description: 'Failed to create draft', variant: 'destructive' });
    } finally {
      setSavingChannel(null);
    }
  };

  const saveToSmsTemplates = async (content: Record<string, string> | string) => {
    setSavingChannel('sms');
    try {
      const messageContent = typeof content === 'string' ? content : (content.message || content.template || Object.values(content)[0] || '');
      
      const { error } = await supabase.from('sms_templates').insert({
        company_id: effectiveCompanyId!,
        template_type: 'marketing',
        message: String(messageContent),
      });

      if (error) throw error;
      toast({ title: 'Saved!', description: 'SMS template created' });
      queryClient.invalidateQueries({ queryKey: ['sms-templates'] });
    } catch (error) {
      console.error('Error saving SMS template:', error);
      toast({ title: 'Error', description: 'Failed to save template', variant: 'destructive' });
    } finally {
      setSavingChannel(null);
    }
  };

  const saveToWebPresence = async (content: Record<string, string>) => {
    setSavingChannel('website');
    try {
      // Map content keys to smart_websites fields
      const updates: Record<string, string> = {};
      
      if (content.headline) updates.hero_headline = content.headline;
      if (content.subheadline) updates.hero_subheadline = content.subheadline;
      if (content.cta || content.cta_text) updates.cta_button_text = content.cta || content.cta_text;
      if (content.about_header) updates.about_header = content.about_header;
      if (content.about_subheader) updates.about_subheader = content.about_subheader;
      if (content.about_paragraph) updates.about_paragraph = content.about_paragraph;

      // Check if website exists, create or update
      const { data: existing } = await supabase
        .from('smart_websites')
        .select('id')
        .eq('company_id', effectiveCompanyId!)
        .single();

      if (existing) {
        const { error } = await supabase
          .from('smart_websites')
          .update(updates)
          .eq('company_id', effectiveCompanyId!);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('smart_websites')
          .insert({
            company_id: effectiveCompanyId!,
            ...updates,
          });
        if (error) throw error;
      }

      toast({ title: 'Saved!', description: 'Web Presence updated with new content' });
      queryClient.invalidateQueries({ queryKey: ['smart-website'] });
    } catch (error) {
      console.error('Error saving to Web Presence:', error);
      toast({ title: 'Error', description: 'Failed to update Web Presence', variant: 'destructive' });
    } finally {
      setSavingChannel(null);
    }
  };

  const renderSaveAction = (channel: string, content: unknown) => {
    if (!content || (typeof content === 'object' && 'error' in (content as Record<string, unknown>))) return null;

    const isSaving = savingChannel === channel;
    
    switch (channel) {
      case 'social':
        return (
          <Button
            size="sm"
            variant="outline"
            onClick={() => saveToSocialPosts(content as Record<string, { post?: string; hashtags?: string[] }>)}
            disabled={isSaving}
            className="gap-2"
          >
            {isSaving ? <Loader2 className="h-3 w-3 animate-spin" /> : <Calendar className="h-3 w-3" />}
            Schedule Post
          </Button>
        );
      case 'campaign':
        return (
          <Button
            size="sm"
            variant="outline"
            onClick={() => saveToCampaign(content as Record<string, string>)}
            disabled={isSaving}
            className="gap-2"
          >
            {isSaving ? <Loader2 className="h-3 w-3 animate-spin" /> : <ArrowRight className="h-3 w-3" />}
            Create Campaign
          </Button>
        );
      case 'blog':
        return (
          <Button
            size="sm"
            variant="outline"
            onClick={() => saveToBlogDraft(content as Record<string, string>)}
            disabled={isSaving}
            className="gap-2"
          >
            {isSaving ? <Loader2 className="h-3 w-3 animate-spin" /> : <Save className="h-3 w-3" />}
            Save as Draft
          </Button>
        );
      case 'sms':
        return (
          <Button
            size="sm"
            variant="outline"
            onClick={() => saveToSmsTemplates(content as Record<string, string>)}
            disabled={isSaving}
            className="gap-2"
          >
            {isSaving ? <Loader2 className="h-3 w-3 animate-spin" /> : <Save className="h-3 w-3" />}
            Save Template
          </Button>
        );
      case 'website':
        return (
          <Button
            size="sm"
            variant="outline"
            onClick={() => saveToWebPresence(content as Record<string, string>)}
            disabled={isSaving}
            className="gap-2"
          >
            {isSaving ? <Loader2 className="h-3 w-3 animate-spin" /> : <Globe className="h-3 w-3" />}
            Push to Web Presence
          </Button>
        );
      default:
        return null;
    }
  };

  const renderContent = (content: unknown, channel: string) => {
    if (!content) return <p className="text-muted-foreground">No content generated</p>;
    
    if (typeof content === 'object' && content !== null && 'error' in content) {
      return <p className="text-destructive">{String((content as { error: string }).error)}</p>;
    }

    // Render based on channel type
    if (channel === 'social' && typeof content === 'object') {
      const socialContent = content as Record<string, { post?: string; hashtags?: string[]; character_count?: number }>;
      return (
        <div className="space-y-4">
          {Object.entries(socialContent).map(([platform, data]) => (
            <Card key={platform} className="bg-background/50">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm capitalize">{platform.replace(/_/g, ' ')}</CardTitle>
                  <div className="flex items-center gap-1">
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-6 w-6"
                      title="Copy post"
                      onClick={() => copyToClipboard(
                        data.hashtags && data.hashtags.length > 0
                          ? `${data.post}\n\n${data.hashtags.map(t => `#${t}`).join(' ')}`
                          : (data.post || ''),
                        `${platform}-post`
                      )}
                    >
                      {copiedField === `${platform}-post` ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-6 text-xs px-2 gap-1"
                      onClick={() => copyAndOpenPlatform(platform, data.post || '', data.hashtags)}
                    >
                      {copiedField === `${platform}-open` ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                      Copy &amp; Open
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-2">
                {data.post && (
                  <p className="text-sm whitespace-pre-wrap">{data.post}</p>
                )}
                {data.hashtags && data.hashtags.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {data.hashtags.map((tag, i) => (
                      <Badge key={i} variant="secondary" className="text-xs">#{tag}</Badge>
                    ))}
                  </div>
                )}
                {data.character_count && (
                  <p className="text-xs text-muted-foreground">{data.character_count} characters</p>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      );
    }

    // Generic JSON display for other channels
    if (typeof content === 'object') {
      return (
        <div className="space-y-4">
          {Object.entries(content as Record<string, unknown>).map(([key, value]) => (
            <div key={key} className="space-y-1">
              <Label className="text-xs text-muted-foreground capitalize">{key.replace(/_/g, ' ')}</Label>
              <div className="relative">
                <div className="bg-background/50 rounded-md p-3 pr-10">
                  <p className="text-sm whitespace-pre-wrap">{String(value)}</p>
                </div>
                <Button
                  size="icon"
                  variant="ghost"
                  className="absolute top-2 right-2 h-6 w-6"
                  onClick={() => copyToClipboard(String(value), `${channel}-${key}`)}
                >
                  {copiedField === `${channel}-${key}` ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                </Button>
              </div>
            </div>
          ))}
        </div>
      );
    }

    return <p className="text-sm whitespace-pre-wrap">{String(content)}</p>;
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Input Panel */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Wand2 className="h-5 w-5 text-primary" />
            Multi-Channel Generator
          </CardTitle>
          <CardDescription>
            Generate on-brand content for multiple platforms from a single topic
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="topic">Topic or Campaign Theme</Label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="gap-1.5 h-7 text-xs"
                disabled={suggestingTopics || !effectiveCompanyId}
                onClick={handleSuggestTopics}
              >
                {suggestingTopics ? (
                  <Loader2 className="h-3 w-3 animate-spin" />
                ) : (
                  <Lightbulb className="h-3 w-3" />
                )}
                AI Suggest
              </Button>
            </div>
            <Textarea
              id="topic"
              placeholder="e.g., Spring AC Maintenance Special - 20% off tune-ups"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              className="min-h-[100px]"
            />
            {topicSuggestions.length > 0 && (
              <div className="space-y-1.5">
                <p className="text-xs text-muted-foreground">Click a suggestion to use it:</p>
                <div className="flex flex-wrap gap-1.5">
                  {topicSuggestions.map((s, i) => (
                    <Badge
                      key={i}
                      variant="outline"
                      className="cursor-pointer hover:bg-primary/10 hover:border-primary transition-colors text-xs py-1 px-2"
                      onClick={() => { setTopic(s); setTopicSuggestions([]); }}
                    >
                      {s}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
            <div className="pt-1">
              <div className="flex items-center gap-2 mb-2">
                <LayoutTemplate className="h-3.5 w-3.5 text-muted-foreground" />
                <span className="text-xs text-muted-foreground font-medium">Industry Templates</span>
              </div>
              <IndustryTemplateSelector
                onSelectTemplate={(template) => {
                  setTopic(template);
                  setTopicSuggestions([]);
                }}
              />
            </div>
          </div>

          <div className="space-y-3">
            <Label>Select Channels</Label>
            <div className="grid grid-cols-1 gap-2">
              {CHANNELS.map(({ id, label, icon: Icon, color, description }) => (
                <div
                  key={id}
                  className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                    selectedChannels.includes(id) 
                      ? 'border-primary bg-primary/5' 
                      : 'border-border hover:border-primary/50'
                  }`}
                  onClick={() => toggleChannel(id)}
                >
                  <Checkbox
                    checked={selectedChannels.includes(id)}
                    onCheckedChange={() => toggleChannel(id)}
                  />
                  <Icon className={`h-4 w-4 ${color}`} />
                  <div className="flex-1">
                    <p className="text-sm font-medium">{label}</p>
                    <p className="text-xs text-muted-foreground">{description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-between p-3 rounded-lg border border-border">
            <div className="flex items-center gap-3">
              <ImageIcon className="h-4 w-4 text-pink-400" />
              <div>
                <p className="text-sm font-medium">Generate AI Image</p>
                <p className="text-xs text-muted-foreground">Create a matching visual for the topic</p>
              </div>
            </div>
            <Switch checked={generateImage} onCheckedChange={setGenerateImage} />
          </div>

          <Button 
            className="w-full" 
            onClick={handleGenerate}
            disabled={generating || !topic.trim() || selectedChannels.length === 0}
          >
            {generating ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4 mr-2" />
                Generate Content
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Results Panel */}
      <Card>
        <CardHeader>
          <CardTitle>Generated Content</CardTitle>
          <CardDescription>
          {Object.keys(results).length > 0 
              ? `${Object.keys(results).length} channel(s) generated${generatedImageUrl ? ' + image' : ''}`
              : 'Results will appear here'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {Object.keys(results).length > 0 ? (
            <div className="space-y-4">
              {/* Generated Image */}
              {(generatingImage || generatedImageUrl) && (
                <div className="rounded-lg border border-border overflow-hidden">
                  {generatingImage ? (
                    <div className="flex items-center justify-center h-48 bg-muted/50">
                      <div className="flex flex-col items-center gap-2">
                        <Loader2 className="h-6 w-6 animate-spin text-pink-400" />
                        <p className="text-xs text-muted-foreground">Generating image...</p>
                      </div>
                    </div>
                  ) : generatedImageUrl ? (
                    <div className="relative group">
                      <img src={generatedImageUrl} alt="Generated content" className="w-full h-48 object-cover" />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                        <Button size="sm" variant="secondary" onClick={() => window.open(generatedImageUrl, '_blank')} className="gap-1">
                          <Download className="h-3 w-3" /> Download
                        </Button>
                        <Button size="sm" variant="secondary" onClick={() => copyToClipboard(generatedImageUrl, 'image-url')} className="gap-1">
                          {copiedField === 'image-url' ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />} URL
                        </Button>
                      </div>
                    </div>
                  ) : null}
                </div>
              )}

            <Tabs value={activeResultTab} onValueChange={setActiveResultTab}>
              <TabsList className="mb-4">
                {selectedChannels.map((channel) => {
                  const config = CHANNELS.find(c => c.id === channel);
                  if (!config) return null;
                  const Icon = config.icon;
                  return (
                    <TabsTrigger key={channel} value={channel} className="flex items-center gap-1.5">
                      <Icon className={`h-3.5 w-3.5 ${config.color}`} />
                      {config.label}
                    </TabsTrigger>
                  );
                })}
              </TabsList>

              {selectedChannels.map((channel) => (
                <TabsContent key={channel} value={channel}>
                  <div className="flex justify-end mb-3">
                    {renderSaveAction(channel, results[channel])}
                  </div>
                  <ScrollArea className="h-[350px] pr-4">
                    {renderContent(results[channel], channel)}
                  </ScrollArea>
                </TabsContent>
              ))}
            </Tabs>
            </div>
          ) : (
            <div className="text-center py-12 text-muted-foreground">
              <Sparkles className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Enter a topic and select channels to generate content</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
