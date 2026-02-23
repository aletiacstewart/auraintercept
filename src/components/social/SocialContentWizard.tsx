import { useState, useRef } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';
import { 
  X, 
  Share2, 
  Instagram, 
  Facebook, 
  Linkedin, 
  Video, 
  MapPin, 
  MessageSquare,
  Sparkles,
  Loader2,
  Image as ImageIcon,
  Hash,
  ArrowRight,
  ArrowLeft,
  Upload,
  Trash2,
  Copy,
  Check,
  FileText,
  Wand2,
  ExternalLink,
  CheckCircle2,
  Save,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { SchedulePostDialog } from '@/components/marketing/SchedulePostDialog';
import { PostTemplates } from './PostTemplates';
import { TavilyStatusBadge } from '@/components/ai/TavilyStatusBadge';

const STEP_LABELS = ['Topic & Platforms', 'AI Generation', 'Review & Post'];

const PLATFORM_DEEP_LINKS: Record<Platform, (content: string) => string> = {
  facebook: () => 'https://www.facebook.com',
  instagram: () => 'https://www.instagram.com/create/story/',
  linkedin: (content) => `https://www.linkedin.com/sharing/share-offsite/?mini=true&summary=${encodeURIComponent(content)}`,
  tiktok: () => 'https://www.tiktok.com/upload',
  google_business: () => 'https://business.google.com/create-post',
  sms: (content) => `sms:?body=${encodeURIComponent(content)}`,
};

const MAX_FILE_SIZE_MB = 2;
const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_WIDTH = 1200;

interface SocialContentWizardProps {
  companyId: string;
  onCancel: () => void;
  onSuccess?: () => void;
}

type Platform = 'instagram' | 'facebook' | 'linkedin' | 'tiktok' | 'google_business' | 'sms';

interface PlatformConfig {
  id: Platform;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  charLimit: number;
  color: string;
  bgColor: string;
  hasHashtags: boolean;
}

const PLATFORMS: PlatformConfig[] = [
  { id: 'instagram', label: 'Instagram', icon: Instagram, charLimit: 2200, color: 'text-pink-600', bgColor: 'bg-pink-600/10', hasHashtags: true },
  { id: 'facebook', label: 'Facebook', icon: Facebook, charLimit: 500, color: 'text-indigo-600', bgColor: 'bg-indigo-600/10', hasHashtags: false },
  { id: 'linkedin', label: 'LinkedIn', icon: Linkedin, charLimit: 3000, color: 'text-sky-600', bgColor: 'bg-sky-600/10', hasHashtags: false },
  { id: 'tiktok', label: 'TikTok', icon: Video, charLimit: 2200, color: 'text-rose-600', bgColor: 'bg-rose-600/10', hasHashtags: true },
  { id: 'google_business', label: 'Google Business', icon: MapPin, charLimit: 1500, color: 'text-blue-600', bgColor: 'bg-blue-600/10', hasHashtags: false },
  { id: 'sms', label: 'SMS', icon: MessageSquare, charLimit: 160, color: 'text-green-600', bgColor: 'bg-green-600/10', hasHashtags: false },
];

interface PlatformVariation {
  content: string;
  hashtags: string[];
}

interface WizardState {
  step: 1 | 2 | 3;
  topic: string;
  imageUrl: string;
  selectedPlatforms: Platform[];
  variations: Record<Platform, PlatformVariation>;
}

const initialVariation: PlatformVariation = { content: '', hashtags: [] };

export const SocialContentWizard: React.FC<SocialContentWizardProps> = ({ companyId, onCancel, onSuccess }) => {
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [showScheduleDialog, setShowScheduleDialog] = useState(false);
  const [activeTab, setActiveTab] = useState<Platform>('instagram');
  const [generationProgress, setGenerationProgress] = useState<string>('');
  
  const [showTemplates, setShowTemplates] = useState(false);
  const [isRewordingPlatform, setIsRewordingPlatform] = useState<Platform | null>(null);
  const [postedPlatforms, setPostedPlatforms] = useState<Set<Platform>>(new Set());
  const [copiedPlatform, setCopiedPlatform] = useState<Platform | null>(null);
  
  const [state, setState] = useState<WizardState>({
    step: 1,
    topic: '',
    imageUrl: '',
    selectedPlatforms: [],
    variations: {
      instagram: { ...initialVariation },
      facebook: { ...initialVariation },
      linkedin: { ...initialVariation },
      tiktok: { ...initialVariation },
      google_business: { ...initialVariation },
      sms: { ...initialVariation },
    },
  });



  // Image handling functions
  const validateAndResizeImage = (file: File): Promise<Blob> => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.src = URL.createObjectURL(file);
      
      img.onload = () => {
        URL.revokeObjectURL(img.src);
        if (img.width <= MAX_WIDTH) {
          resolve(file);
          return;
        }

        const canvas = document.createElement('canvas');
        const ratio = MAX_WIDTH / img.width;
        canvas.width = MAX_WIDTH;
        canvas.height = img.height * ratio;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Could not get canvas context'));
          return;
        }

        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        canvas.toBlob(
          (blob) => {
            if (blob) resolve(blob);
            else reject(new Error('Failed to resize image'));
          },
          file.type,
          0.9
        );
      };

      img.onerror = () => {
        URL.revokeObjectURL(img.src);
        reject(new Error('Failed to load image'));
      };
    });
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
      toast.error('Please upload a JPG, PNG, or WEBP image');
      return;
    }

    if (file.size > MAX_FILE_SIZE_MB * 1024 * 1024) {
      toast.error(`Image must be less than ${MAX_FILE_SIZE_MB}MB`);
      return;
    }

    setIsUploading(true);
    try {
      const processedBlob = await validateAndResizeImage(file);
      const fileExt = file.name.split('.').pop();
      const filePath = `${companyId}/social-wizard-${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('smart-website-images')
        .upload(filePath, processedBlob, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('smart-website-images')
        .getPublicUrl(filePath);

      setState(prev => ({ ...prev, imageUrl: publicUrl }));
      toast.success('Image uploaded successfully');
    } catch (error: any) {
      console.error('Upload error:', error);
      toast.error(error.message || 'Failed to upload image');
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleRemoveImage = async () => {
    if (state.imageUrl) {
      const path = state.imageUrl.split('/smart-website-images/')[1];
      if (path) {
        await supabase.storage.from('smart-website-images').remove([path]);
      }
    }
    setState(prev => ({ ...prev, imageUrl: '' }));
    toast.success('Image removed');
  };

  // Platform toggle
  const handlePlatformToggle = (platform: Platform) => {
    setState(prev => ({
      ...prev,
      selectedPlatforms: prev.selectedPlatforms.includes(platform)
        ? prev.selectedPlatforms.filter(p => p !== platform)
        : [...prev.selectedPlatforms, platform],
    }));
  };

  // Generation mutation
  const generateMutation = useMutation({
    mutationFn: async () => {
      setGenerationProgress('Analyzing brand voice...');
      
      const { data, error } = await supabase.functions.invoke('generate-social-variations', {
        body: {
          topic: state.topic,
          platforms: state.selectedPlatforms,
          companyId,
          includeImage: !!state.imageUrl,
        },
      });

      if (error) throw error;
      return data.variations;
    },
    onSuccess: (variations) => {
      const newVariations = { ...state.variations };
      for (const platform of state.selectedPlatforms) {
        if (variations[platform]) {
          newVariations[platform] = {
            content: variations[platform].content || '',
            hashtags: variations[platform].hashtags || [],
          };
        }
      }
      
      setState(prev => ({
        ...prev,
        step: 3,
        variations: newVariations,
      }));
      setActiveTab(state.selectedPlatforms[0]);
      setGenerationProgress('');
    },
    onError: (error: any) => {
      console.error('Generation error:', error);
      toast.error(error.message || 'Failed to generate content');
      setGenerationProgress('');
      setState(prev => ({ ...prev, step: 1 }));
    },
  });

  // Start generation
  const handleGenerate = () => {
    if (!state.topic.trim()) {
      toast.error('Please enter a topic');
      return;
    }
    if (state.selectedPlatforms.length === 0) {
      toast.error('Please select at least one platform');
      return;
    }
    
    setState(prev => ({ ...prev, step: 2 }));
    generateMutation.mutate();
  };

  // Update content for a specific platform
  const updatePlatformContent = (platform: Platform, content: string) => {
    setState(prev => ({
      ...prev,
      variations: {
        ...prev.variations,
        [platform]: { ...prev.variations[platform], content },
      },
    }));
  };

  // Update hashtags for a specific platform
  const updatePlatformHashtags = (platform: Platform, hashtagsStr: string) => {
    const hashtags = hashtagsStr
      .split(',')
      .map(h => h.trim().replace(/^#/, ''))
      .filter(Boolean);
    
    setState(prev => ({
      ...prev,
      variations: {
        ...prev.variations,
        [platform]: { ...prev.variations[platform], hashtags },
      },
    }));
  };


  // Reword content for a specific platform using AI
  const rewordPlatformContent = async (platform: Platform) => {
    const currentContent = state.variations[platform].content;
    if (!currentContent.trim()) {
      toast.error('No content to reword');
      return;
    }

    setIsRewordingPlatform(platform);
    
    try {
      const { data, error } = await supabase.functions.invoke('generate-social-variations', {
        body: {
          topic: `Reword this content while keeping the same message and tone: "${currentContent}"`,
          platforms: [platform],
          companyId,
          includeImage: !!state.imageUrl,
        },
      });

      if (error) throw error;
      
      if (data.variations[platform]) {
        setState(prev => ({
          ...prev,
          variations: {
            ...prev.variations,
            [platform]: {
              content: data.variations[platform].content || currentContent,
              hashtags: data.variations[platform].hashtags || prev.variations[platform].hashtags,
            },
          },
        }));
        toast.success(`${PLATFORMS.find(p => p.id === platform)?.label} content reworded`);
      }
    } catch {
      toast.error('Failed to reword content');
    } finally {
      setIsRewordingPlatform(null);
    }
  };

  // Apply template to topic
  const handleTemplateSelect = (template: string) => {
    if (template) {
      setState(prev => ({ ...prev, topic: template }));
      toast.success('Template applied! Customize the placeholders then generate.');
    }
    setShowTemplates(false);
  };

  // Save all as drafts
  const saveDraftsMutation = useMutation({
    mutationFn: async () => {
      const drafts = state.selectedPlatforms.map(platform => ({
        company_id: companyId,
        platform,
        generated_content: state.variations[platform].content,
        hashtags: state.variations[platform].hashtags.length > 0 ? state.variations[platform].hashtags : null,
        image_url: state.imageUrl || null,
        status: 'pending' as const,
        api_metadata: {
          caption: state.variations[platform].content,
          hashtags: state.variations[platform].hashtags,
          is_aigc: platform === 'tiktok',
        },
      }));

      const { data, error } = await supabase
        .from('social_content_drafts')
        .insert(drafts)
        .select();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      toast.success(`Created ${data.length} draft${data.length > 1 ? 's' : ''}!`);
      queryClient.invalidateQueries({ queryKey: ['social-content-drafts'] });
      onSuccess?.();
      onCancel();
    },
    onError: (error: any) => {
      toast.error('Failed to save drafts: ' + error.message);
    },
  });

  // Schedule posts mutation
  const schedulePostsMutation = useMutation({
    mutationFn: async ({ scheduledFor, timezone }: { scheduledFor: Date; timezone: string }) => {
      const { data, error } = await supabase
        .from('scheduled_posts')
        .insert({
          company_id: companyId,
          content_json: {
            variations: state.selectedPlatforms.reduce((acc, platform) => ({
              ...acc,
              [platform]: {
                content: state.variations[platform].content,
                hashtags: state.variations[platform].hashtags,
              },
            }), {}),
            imageUrl: state.imageUrl || null,
          },
          scheduled_for: scheduledFor.toISOString(),
          timezone,
          platforms: state.selectedPlatforms,
          status: 'scheduled',
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast.success('Posts scheduled successfully!');
      queryClient.invalidateQueries({ queryKey: ['scheduled-posts'] });
      onSuccess?.();
      setShowScheduleDialog(false);
      onCancel();
    },
    onError: (error: any) => {
      toast.error('Failed to schedule posts: ' + error.message);
    },
  });

  // Get character count color
  const getCharCountColor = (current: number, limit: number) => {
    const ratio = current / limit;
    if (ratio > 1) return 'text-destructive';
    if (ratio > 0.8) return 'text-amber-500';
    return 'text-muted-foreground';
  };

  // Render Step 1: Input
  const renderStep1 = () => (
    <div className="space-y-5">
      {/* Topic Input with Templates */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label className="text-muted-foreground">What would you like to post about?</Label>
          <Dialog open={showTemplates} onOpenChange={setShowTemplates}>
            <DialogTrigger asChild>
              <Button variant="ghost" size="sm" className="h-7 text-xs">
                <FileText className="h-3.5 w-3.5 mr-1" />
                Templates
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md bg-background text-foreground">
              <DialogHeader>
                <DialogTitle>Post Templates</DialogTitle>
              </DialogHeader>
              <PostTemplates onSelect={handleTemplateSelect} onClose={() => setShowTemplates(false)} />
            </DialogContent>
          </Dialog>
        </div>
        <Textarea
          value={state.topic}
          onChange={(e) => setState(prev => ({ ...prev, topic: e.target.value }))}
          placeholder="e.g., Summer AC maintenance special, completed HVAC installation, holiday promotion..."
          className="min-h-[100px] bg-muted/30 border-card-foreground/20 text-card-foreground resize-none"
        />
      </div>

      {/* Image Upload */}
      <div className="space-y-2">
        <Label className="text-muted-foreground flex items-center gap-1.5">
          <ImageIcon className="h-3.5 w-3.5" />
          Post Image (optional)
        </Label>
        <p className="text-xs text-muted-foreground">
          Max 2MB • JPG, PNG, or WEBP • Auto-resized to 1200px width
        </p>
        
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          onChange={handleFileSelect}
          className="hidden"
        />
        
        {state.imageUrl ? (
          <div className="relative">
            <div className="relative w-full h-32 rounded-lg overflow-hidden bg-muted/30 border border-card-foreground/20">
              <img 
                src={state.imageUrl} 
                alt="Preview" 
                className="w-full h-full object-cover"
              />
            </div>
            <Button
              type="button"
              variant="destructive"
              size="sm"
              onClick={handleRemoveImage}
              className="absolute top-2 right-2 h-7 px-2"
            >
              <Trash2 className="h-3.5 w-3.5 mr-1" />
              Remove
            </Button>
          </div>
        ) : (
          <Button
            type="button"
            variant="outline"
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
            className="w-full h-20 border-dashed border-card-foreground/20"
          >
            {isUploading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Uploading...
              </>
            ) : (
              <>
                <Upload className="h-4 w-4 mr-2" />
                Click to upload an image
              </>
            )}
          </Button>
        )}
      </div>

      {/* Platform Selection */}
      <div className="space-y-2">
        <Label className="text-muted-foreground">Select Platforms *</Label>
        <div className="grid grid-cols-2 gap-2">
          {PLATFORMS.map(platform => {
            const Icon = platform.icon;
            const isSelected = state.selectedPlatforms.includes(platform.id);
            return (
              <button
                key={platform.id}
                type="button"
                onClick={() => handlePlatformToggle(platform.id)}
                className={`flex items-center gap-2 p-3 rounded-lg border transition-all ${
                  isSelected
                    ? `${platform.bgColor} border-current ${platform.color}`
                    : 'bg-muted/30 border-border text-foreground hover:bg-muted/50'
                }`}
              >
                <Checkbox checked={isSelected} className="pointer-events-none" />
                <Icon className={`h-4 w-4 ${isSelected ? platform.color : ''}`} />
                <span className="text-sm font-medium">{platform.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Tavily Status */}
      <TavilyStatusBadge companyId={companyId} showDisconnected />

      {/* Generate Button */}
      <Button
        onClick={handleGenerate}
        disabled={!state.topic.trim() || state.selectedPlatforms.length === 0}
        className="w-full"
      >
        <Sparkles className="h-4 w-4 mr-2" />
        Generate Content
        <ArrowRight className="h-4 w-4 ml-2" />
      </Button>
    </div>
  );

  // Render Step 2: Loading
  const renderStep2 = () => (
    <div className="flex flex-col items-center justify-center py-12 space-y-4">
      <div className="relative">
        <div className="w-16 h-16 rounded-full bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
          <Loader2 className="h-8 w-8 text-primary animate-spin" />
        </div>
      </div>
      <div className="text-center space-y-1">
        <h3 className="font-semibold text-card-foreground">Generating Content</h3>
        <p className="text-sm text-muted-foreground">
          {generationProgress || 'Creating platform-specific variations...'}
        </p>
      </div>
      <div className="flex gap-2">
        {state.selectedPlatforms.map((platform, idx) => {
          const config = PLATFORMS.find(p => p.id === platform);
          if (!config) return null;
          const Icon = config.icon;
          return (
            <div
              key={platform}
              className={`w-8 h-8 rounded-full ${config.bgColor} flex items-center justify-center animate-pulse`}
              style={{ animationDelay: `${idx * 0.15}s` }}
            >
              <Icon className={`h-4 w-4 ${config.color}`} />
            </div>
          );
        })}
      </div>
    </div>
  );

  // Clipboard copy with fallback for iframe contexts
  const copyToClipboard = async (text: string): Promise<void> => {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
    } else {
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
  };

  // Open platform using anchor click (bypasses popup blockers in iframes)
  const openPlatform = (platform: Platform) => {
    const content = state.variations[platform].content;
    const hashtags = state.variations[platform].hashtags;
    const fullText = hashtags.length ? `${content}\n\n${hashtags.map(h => `#${h}`).join(' ')}` : content;
    const url = PLATFORM_DEEP_LINKS[platform]?.(fullText);
    if (!url) return;
    const a = document.createElement('a');
    a.href = url;
    a.target = '_blank';
    a.rel = 'noopener noreferrer';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  // Copy content for a platform and open the platform in one action
  const handleCopyAndOpen = async (platform: Platform) => {
    const content = state.variations[platform].content;
    const hashtags = state.variations[platform].hashtags;
    const text = hashtags.length ? `${content}\n\n${hashtags.map(h => `#${h}`).join(' ')}` : content;
    try {
      await copyToClipboard(text);
      setCopiedPlatform(platform);
      toast.success('Content copied! Opening platform...');
      setTimeout(() => setCopiedPlatform(null), 3000);
    } catch {
      toast.error('Copy failed — please copy manually before opening.');
    }
    openPlatform(platform);
  };

  // Toggle a platform as posted
  const togglePosted = (platform: Platform) => {
    setPostedPlatforms(prev => {
      const next = new Set(prev);
      if (next.has(platform)) next.delete(platform);
      else next.add(platform);
      return next;
    });
  };

  // Render Step 3: Review & Post
  const renderStep3 = () => {
    const anyPosted = postedPlatforms.size > 0;

    return (
      <div className="space-y-4">
        {/* Instruction banner */}
        <div className="flex items-start gap-2 p-3 rounded-lg bg-primary/10 border border-primary/20 text-sm text-foreground">
          <Sparkles className="h-4 w-4 text-primary mt-0.5 shrink-0" />
          <span>For each platform: <strong>Copy & Open</strong> → paste on the platform → check <strong>Posted ✓</strong>. Then click <strong>Done</strong>.</span>
        </div>

        {/* Platform Tabs */}
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as Platform)}>
          <TabsList className="w-full flex flex-wrap h-auto gap-1 bg-muted/30 p-1">
            {state.selectedPlatforms.map(platform => {
              const config = PLATFORMS.find(p => p.id === platform);
              if (!config) return null;
              const Icon = config.icon;
              const isPosted = postedPlatforms.has(platform);
              return (
                <TabsTrigger
                  key={platform}
                  value={platform}
                  className="flex-1 min-w-[80px] gap-1.5 relative"
                >
                  <Icon className={cn('h-3.5 w-3.5', isPosted && 'text-success')} />
                  <span className="text-xs">{config.label}</span>
                  {isPosted && (
                    <CheckCircle2 className="h-3 w-3 text-success absolute -top-1 -right-1" />
                  )}
                </TabsTrigger>
              );
            })}
          </TabsList>

          {state.selectedPlatforms.map(platform => {
            const config = PLATFORMS.find(p => p.id === platform);
            if (!config) return null;
            const Icon = config.icon;
            const isPosted = postedPlatforms.has(platform);
            const isCopied = copiedPlatform === platform;
            
            return (
              <TabsContent key={platform} value={platform} className="mt-4 space-y-3">
                {/* Platform header */}
                <div className="flex items-center gap-3">
                  <div className={cn('w-9 h-9 rounded-lg flex items-center justify-center', config.bgColor)}>
                    <Icon className="h-4 w-4 text-white" />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-foreground">{config.label}</p>
                    <p className="text-xs text-muted-foreground">{config.charLimit} char limit</p>
                  </div>
                  {/* Mark as Posted toggle */}
                  <div className="flex items-center gap-2">
                    <Label htmlFor={`posted-${platform}`} className="text-sm text-muted-foreground cursor-pointer">
                      {isPosted ? (
                        <span className="text-success font-medium flex items-center gap-1">
                          <CheckCircle2 className="h-3.5 w-3.5" /> Posted
                        </span>
                      ) : 'Mark Posted'}
                    </Label>
                    <Switch
                      id={`posted-${platform}`}
                      checked={isPosted}
                      onCheckedChange={() => togglePosted(platform)}
                    />
                  </div>
                </div>

                {/* Content Editor */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <Label className="text-muted-foreground text-xs">Content</Label>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 text-xs px-2"
                        onClick={() => rewordPlatformContent(platform)}
                        disabled={isRewordingPlatform === platform}
                      >
                        {isRewordingPlatform === platform ? (
                          <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                        ) : (
                          <Wand2 className="h-3 w-3 mr-1" />
                        )}
                        Reword
                      </Button>
                      <span className={`text-xs ${getCharCountColor(state.variations[platform].content.length, config.charLimit)}`}>
                        {state.variations[platform].content.length}/{config.charLimit}
                      </span>
                    </div>
                  </div>
                  <Textarea
                    value={state.variations[platform].content}
                    onChange={(e) => updatePlatformContent(platform, e.target.value)}
                    className="min-h-[100px] bg-muted/30 resize-none text-foreground"
                    placeholder={`Enter ${config.label} content...`}
                  />
                </div>

                {/* Hashtags */}
                {config.hasHashtags && (
                  <div className="space-y-1.5">
                    <Label className="text-muted-foreground text-xs flex items-center gap-1.5">
                      <Hash className="h-3 w-3" />
                      Hashtags
                    </Label>
                    <Input
                      value={state.variations[platform].hashtags.join(', ')}
                      onChange={(e) => updatePlatformHashtags(platform, e.target.value)}
                      placeholder="summer, hvac, service (comma-separated)"
                      className="bg-muted/30 text-foreground"
                    />
                  </div>
                )}

                {/* Image */}
                {state.imageUrl && (
                  <div className="flex items-center gap-2 p-2 rounded-lg bg-warning/10 border border-warning/20 text-xs text-warning-foreground">
                    <span>📷</span>
                    <span>Attach this image manually when posting on {config.label}.</span>
                  </div>
                )}

                {/* PRIMARY ACTION: Copy & Open */}
                <Button
                  onClick={() => handleCopyAndOpen(platform)}
                  className={cn(
                    'w-full gap-2 font-semibold',
                    isCopied
                      ? 'bg-success hover:bg-success/90 text-success-foreground'
                      : ''
                  )}
                  variant={isCopied ? 'default' : 'default'}
                  size="lg"
                >
                  {isCopied ? (
                    <><Check className="h-4 w-4" /> Copied! Opening {config.label}...</>
                  ) : (
                    <><Copy className="h-4 w-4" /> Copy & Open {config.label}<ExternalLink className="h-3.5 w-3.5 ml-1" /></>
                  )}
                </Button>
              </TabsContent>
            );
          })}
        </Tabs>

        {/* Progress bar */}
        <div className="flex items-center justify-between p-3 rounded-lg bg-muted/30 border text-sm">
          <span className="text-muted-foreground">
            {postedPlatforms.size} of {state.selectedPlatforms.length} platform{state.selectedPlatforms.length > 1 ? 's' : ''} posted
          </span>
          {anyPosted && (
            <Badge variant="secondary" className="gap-1 text-success border-success/30">
              <CheckCircle2 className="h-3 w-3" />
              {postedPlatforms.size === state.selectedPlatforms.length ? 'All Done!' : 'In Progress'}
            </Badge>
          )}
        </div>

        {/* Bottom action bar */}
        <div className="flex gap-2 pt-1">
          <Button
            variant="outline"
            onClick={() => setState(prev => ({ ...prev, step: 1 }))}
          >
            <ArrowLeft className="h-4 w-4 mr-1" />
            Back
          </Button>
          <Button
            variant="secondary"
            onClick={() => saveDraftsMutation.mutate()}
            disabled={saveDraftsMutation.isPending}
            className="flex-1"
          >
            {saveDraftsMutation.isPending ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Save className="h-4 w-4 mr-2" />
            )}
            Save Draft
          </Button>
          <Button
            onClick={() => saveDraftsMutation.mutate()}
            disabled={!anyPosted || saveDraftsMutation.isPending}
            className="flex-1"
          >
            {saveDraftsMutation.isPending ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <CheckCircle2 className="h-4 w-4 mr-2" />
            )}
            Done — All Posted
          </Button>
        </div>
      </div>
    );
  };

  return (
    <>
      <Card className="border-card-foreground/20 bg-card shadow-sm">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg flex items-center gap-2 text-card-foreground">
              <div className="p-2 rounded-lg bg-feature-marketing/15 border border-feature-marketing/30">
                <Share2 className="h-4 w-4 text-feature-marketing" />
              </div>
              {state.step === 1 && 'Create Social Content'}
              {state.step === 2 && 'Generating...'}
              {state.step === 3 && 'Review & Post'}
            </CardTitle>
            <Button variant="ghost" size="icon" onClick={onCancel} className="text-card-foreground/60 hover:text-card-foreground">
              <X className="h-4 w-4" />
            </Button>
          </div>
          {/* Step Indicator with Labels */}
          <div className="flex items-center justify-between pt-3">
            {[1, 2, 3].map((step, idx) => (
              <div key={step} className="flex items-center flex-1">
                <div className="flex flex-col items-center gap-1">
                  <div
                    className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-medium transition-colors ${
                      state.step >= step
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted text-muted-foreground'
                    }`}
                  >
                    {state.step > step ? <Check className="h-3.5 w-3.5" /> : step}
                  </div>
                  <span className={`text-[10px] font-medium text-center ${
                    state.step >= step ? 'text-primary' : 'text-muted-foreground'
                  }`}>
                    {STEP_LABELS[idx]}
                  </span>
                </div>
                {step < 3 && (
                  <div className={`flex-1 h-0.5 mx-2 ${state.step > step ? 'bg-primary' : 'bg-muted'}`} />
                )}
              </div>
            ))}
          </div>
        </CardHeader>
        <CardContent>
          {state.step === 1 && renderStep1()}
          {state.step === 2 && renderStep2()}
          {state.step === 3 && renderStep3()}
        </CardContent>
      </Card>

      <SchedulePostDialog
        open={showScheduleDialog}
        onOpenChange={setShowScheduleDialog}
        onSchedule={(date, tz) => schedulePostsMutation.mutate({ scheduledFor: date, timezone: tz })}
        isScheduling={schedulePostsMutation.isPending}
      />
    </>
  );
};
