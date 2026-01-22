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
  RefreshCw,
  Check,
  Calendar,
} from 'lucide-react';
import { SchedulePostDialog } from '@/components/marketing/SchedulePostDialog';

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
  { id: 'instagram', label: 'Instagram', icon: Instagram, charLimit: 2200, color: 'text-pink-500', bgColor: 'bg-pink-500/10', hasHashtags: true },
  { id: 'facebook', label: 'Facebook', icon: Facebook, charLimit: 500, color: 'text-blue-600', bgColor: 'bg-blue-600/10', hasHashtags: false },
  { id: 'linkedin', label: 'LinkedIn', icon: Linkedin, charLimit: 3000, color: 'text-sky-600', bgColor: 'bg-sky-600/10', hasHashtags: false },
  { id: 'tiktok', label: 'TikTok', icon: Video, charLimit: 2200, color: 'text-fuchsia-500', bgColor: 'bg-fuchsia-500/10', hasHashtags: true },
  { id: 'google_business', label: 'Google Business', icon: MapPin, charLimit: 1500, color: 'text-teal-500', bgColor: 'bg-teal-500/10', hasHashtags: false },
  { id: 'sms', label: 'SMS', icon: MessageSquare, charLimit: 160, color: 'text-emerald-500', bgColor: 'bg-emerald-500/10', hasHashtags: false },
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

  // Copy current content to all platforms
  const copyToAll = () => {
    const currentContent = state.variations[activeTab].content;
    const currentHashtags = state.variations[activeTab].hashtags;
    
    setState(prev => {
      const newVariations = { ...prev.variations };
      for (const platform of prev.selectedPlatforms) {
        newVariations[platform] = {
          content: currentContent,
          hashtags: PLATFORMS.find(p => p.id === platform)?.hasHashtags ? currentHashtags : [],
        };
      }
      return { ...prev, variations: newVariations };
    });
    
    toast.success('Content copied to all platforms');
  };

  // Regenerate content for current platform
  const regeneratePlatform = async () => {
    toast.info(`Regenerating ${activeTab}...`);
    
    try {
      const { data, error } = await supabase.functions.invoke('generate-social-variations', {
        body: {
          topic: state.topic,
          platforms: [activeTab],
          companyId,
          includeImage: !!state.imageUrl,
        },
      });

      if (error) throw error;
      
      if (data.variations[activeTab]) {
        setState(prev => ({
          ...prev,
          variations: {
            ...prev.variations,
            [activeTab]: {
              content: data.variations[activeTab].content || '',
              hashtags: data.variations[activeTab].hashtags || [],
            },
          },
        }));
        toast.success(`${activeTab} content regenerated`);
      }
    } catch {
      toast.error('Failed to regenerate content');
    }
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
      {/* Topic Input */}
      <div className="space-y-2">
        <Label className="text-card-foreground/70">What would you like to post about?</Label>
        <Textarea
          value={state.topic}
          onChange={(e) => setState(prev => ({ ...prev, topic: e.target.value }))}
          placeholder="e.g., Summer AC maintenance special, completed HVAC installation, holiday promotion..."
          className="min-h-[100px] bg-muted/30 border-card-foreground/20 text-card-foreground resize-none"
        />
      </div>

      {/* Image Upload */}
      <div className="space-y-2">
        <Label className="text-card-foreground/70 flex items-center gap-1.5">
          <ImageIcon className="h-3.5 w-3.5" />
          Post Image (optional)
        </Label>
        <p className="text-xs text-card-foreground/50">
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
        <Label className="text-card-foreground/70">Select Platforms *</Label>
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
                    : 'bg-muted/30 border-card-foreground/10 text-card-foreground/60 hover:bg-muted/50'
                }`}
              >
                <Checkbox checked={isSelected} className="pointer-events-none" />
                <Icon className={`h-4 w-4 ${isSelected ? platform.color : 'opacity-70'}`} />
                <span className="text-sm font-medium">{platform.label}</span>
              </button>
            );
          })}
        </div>
      </div>

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

  // Render Step 3: Review & Edit
  const renderStep3 = () => {
    const activePlatform = PLATFORMS.find(p => p.id === activeTab);

    return (
      <div className="space-y-4">
        {/* Platform Tabs */}
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as Platform)}>
          <TabsList className="w-full flex flex-wrap h-auto gap-1 bg-muted/30 p-1">
            {state.selectedPlatforms.map(platform => {
              const config = PLATFORMS.find(p => p.id === platform);
              if (!config) return null;
              const Icon = config.icon;
              return (
                <TabsTrigger
                  key={platform}
                  value={platform}
                  className={`flex-1 min-w-[80px] gap-1.5 data-[state=active]:${config.bgColor}`}
                >
                  <Icon className={`h-3.5 w-3.5 ${activeTab === platform ? config.color : ''}`} />
                  <span className="text-xs">{config.label}</span>
                </TabsTrigger>
              );
            })}
          </TabsList>

          {state.selectedPlatforms.map(platform => {
            const config = PLATFORMS.find(p => p.id === platform);
            if (!config) return null;
            
            return (
              <TabsContent key={platform} value={platform} className="mt-4 space-y-4">
                {/* Content Editor */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label className="text-card-foreground/70">Content</Label>
                    <span className={`text-xs ${getCharCountColor(state.variations[platform].content.length, config.charLimit)}`}>
                      {state.variations[platform].content.length} / {config.charLimit}
                    </span>
                  </div>
                  <Textarea
                    value={state.variations[platform].content}
                    onChange={(e) => updatePlatformContent(platform, e.target.value)}
                    className="min-h-[120px] bg-muted/30 border-card-foreground/20 text-card-foreground resize-none"
                    placeholder={`Enter ${config.label} content...`}
                  />
                </div>

                {/* Hashtags (for platforms that support them) */}
                {config.hasHashtags && (
                  <div className="space-y-2">
                    <Label className="text-card-foreground/70 flex items-center gap-1.5">
                      <Hash className="h-3.5 w-3.5" />
                      Hashtags
                    </Label>
                    <Input
                      value={state.variations[platform].hashtags.join(', ')}
                      onChange={(e) => updatePlatformHashtags(platform, e.target.value)}
                      placeholder="summer, hvac, service (comma-separated)"
                      className="bg-muted/30 border-card-foreground/20 text-card-foreground"
                    />
                  </div>
                )}

                {/* Image Preview */}
                {state.imageUrl && (
                  <div className="space-y-2">
                    <Label className="text-card-foreground/70">Image</Label>
                    <div className="relative w-full h-24 rounded-lg overflow-hidden bg-muted/30 border border-card-foreground/20">
                      <img 
                        src={state.imageUrl} 
                        alt="Preview" 
                        className="w-full h-full object-cover"
                      />
                    </div>
                  </div>
                )}
              </TabsContent>
            );
          })}
        </Tabs>

        {/* Quick Actions */}
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={copyToAll}
            className="flex-1"
          >
            <Copy className="h-3.5 w-3.5 mr-1.5" />
            Copy to All
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={regeneratePlatform}
            className="flex-1"
          >
            <RefreshCw className="h-3.5 w-3.5 mr-1.5" />
            Regenerate
          </Button>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2 pt-2">
          <Button
            variant="outline"
            onClick={() => setState(prev => ({ ...prev, step: 1 }))}
            className="flex-1"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <Button
            variant="outline"
            onClick={() => setShowScheduleDialog(true)}
            className="flex-1"
          >
            <Calendar className="h-4 w-4 mr-2" />
            Schedule
          </Button>
          <Button
            onClick={() => saveDraftsMutation.mutate()}
            disabled={saveDraftsMutation.isPending}
            className="flex-1"
          >
            {saveDraftsMutation.isPending ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Check className="h-4 w-4 mr-2" />
            )}
            Save Drafts
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
              {state.step === 3 && 'Review & Edit'}
            </CardTitle>
            <Button variant="ghost" size="icon" onClick={onCancel} className="text-card-foreground/60 hover:text-card-foreground">
              <X className="h-4 w-4" />
            </Button>
          </div>
          {/* Step Indicator */}
          <div className="flex items-center gap-2 pt-2">
            {[1, 2, 3].map((step) => (
              <div key={step} className="flex items-center">
                <div
                  className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium transition-colors ${
                    state.step >= step
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted text-muted-foreground'
                  }`}
                >
                  {state.step > step ? <Check className="h-3 w-3" /> : step}
                </div>
                {step < 3 && (
                  <div className={`w-8 h-0.5 mx-1 ${state.step > step ? 'bg-primary' : 'bg-muted'}`} />
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
