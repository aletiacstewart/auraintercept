import { useState, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from 'sonner';
import { 
  X, 
  Share2, 
  Send, 
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
  Calendar,
  Upload,
  Trash2,
} from 'lucide-react';
import { SchedulePostDialog } from '../SchedulePostDialog';

const MAX_FILE_SIZE_MB = 2;
const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_WIDTH = 1200;

interface SocialPostFormProps {
  companyId: string;
  onCancel: () => void;
  onSuccess?: (data: { platform: string; status: string }) => void;
}

type Platform = 'instagram' | 'facebook' | 'linkedin' | 'tiktok' | 'google_business' | 'sms';

const PLATFORMS: { id: Platform; label: string; icon: React.ComponentType<{ className?: string }>; charLimit: number; color: string }[] = [
  { id: 'instagram', label: 'Instagram', icon: Instagram, charLimit: 2200, color: 'hsl(330, 70%, 55%)' },
  { id: 'facebook', label: 'Facebook', icon: Facebook, charLimit: 500, color: 'hsl(220, 70%, 55%)' },
  { id: 'linkedin', label: 'LinkedIn', icon: Linkedin, charLimit: 3000, color: 'hsl(210, 90%, 45%)' },
  { id: 'tiktok', label: 'TikTok', icon: Video, charLimit: 2200, color: 'hsl(340, 82%, 52%)' },
  { id: 'google_business', label: 'Google Business', icon: MapPin, charLimit: 1500, color: 'hsl(210, 80%, 55%)' },
  { id: 'sms', label: 'SMS', icon: MessageSquare, charLimit: 160, color: 'hsl(145, 60%, 50%)' },
];

// Fetch company name for AI context
const useCompanyName = (companyId: string) => {
  return useQuery({
    queryKey: ['company-name', companyId],
    queryFn: async () => {
      const { data } = await supabase
        .from('companies')
        .select('name')
        .eq('id', companyId)
        .single();
      return data?.name || '';
    },
  });
};

export const SocialPostForm: React.FC<SocialPostFormProps> = ({ companyId, onCancel, onSuccess }) => {
  const queryClient = useQueryClient();
  const { data: companyName } = useCompanyName(companyId);
  const [isGenerating, setIsGenerating] = useState(false);
  const [showScheduleDialog, setShowScheduleDialog] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [formData, setFormData] = useState({
    platforms: [] as Platform[],
    content: '',
    hashtags: '',
    imageUrl: '',
  });

  // Validate and resize image if needed
  const validateAndResizeImage = (file: File): Promise<Blob> => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.src = URL.createObjectURL(file);
      
      img.onload = () => {
        URL.revokeObjectURL(img.src);
        
        // If image is within limits, use original
        if (img.width <= MAX_WIDTH) {
          resolve(file);
          return;
        }

        // Resize image
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
            if (blob) {
              resolve(blob);
            } else {
              reject(new Error('Failed to resize image'));
            }
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

    // Validate file type
    if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
      toast.error('Please upload a JPG, PNG, or WEBP image');
      return;
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE_MB * 1024 * 1024) {
      toast.error(`Image must be less than ${MAX_FILE_SIZE_MB}MB`);
      return;
    }

    setIsUploading(true);
    try {
      const processedBlob = await validateAndResizeImage(file);
      const fileExt = file.name.split('.').pop();
      const filePath = `${companyId}/social-post-${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('smart-website-images')
        .upload(filePath, processedBlob, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('smart-website-images')
        .getPublicUrl(filePath);

      setFormData(prev => ({ ...prev, imageUrl: publicUrl }));
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
    if (formData.imageUrl) {
      // Extract path from URL and delete from storage
      const path = formData.imageUrl.split('/smart-website-images/')[1];
      if (path) {
        await supabase.storage.from('smart-website-images').remove([path]);
      }
    }
    setFormData(prev => ({ ...prev, imageUrl: '' }));
    toast.success('Image removed');
  };

  const generateContent = async () => {
    if (formData.platforms.length === 0) {
      toast.error('Please select at least one platform');
      return;
    }
    
    setIsGenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke('generate-social-content', {
        body: {
          platform: formData.platforms[0],
          companyName: companyName || 'our company',
          topic: 'general business update',
          includeHashtags: true,
        },
      });

      if (error) throw error;
      
      if (data?.content) {
        setFormData(prev => ({ 
          ...prev, 
          content: data.content,
          hashtags: data.hashtags?.join(', ') || '',
        }));
        toast.success('Content generated!');
      }
    } catch (error) {
      console.error('Error generating content:', error);
      toast.error('Failed to generate content. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handlePlatformToggle = (platform: Platform) => {
    setFormData(prev => ({
      ...prev,
      platforms: prev.platforms.includes(platform)
        ? prev.platforms.filter(p => p !== platform)
        : [...prev.platforms, platform],
    }));
  };

  // Create draft mutation
  const createDraft = useMutation({
    mutationFn: async () => {
      const hashtags = formData.hashtags
        .split(',')
        .map(h => h.trim().replace(/^#/, ''))
        .filter(Boolean);

      // Create a draft for each selected platform
      const drafts = formData.platforms.map(platform => ({
        company_id: companyId,
        platform,
        generated_content: formData.content,
        hashtags,
        image_url: formData.imageUrl || null,
        status: 'pending' as const,
        api_metadata: {
          caption: formData.content,
          hashtags,
          is_aigc: false,
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
      onSuccess?.({ platform: formData.platforms.join(', '), status: 'draft' });
      onCancel();
    },
    onError: (error) => {
      toast.error('Failed to create draft: ' + error.message);
    },
  });

  // Schedule post mutation
  const schedulePost = useMutation({
    mutationFn: async ({ scheduledFor, timezone }: { scheduledFor: Date; timezone: string }) => {
      const hashtags = formData.hashtags
        .split(',')
        .map(h => h.trim().replace(/^#/, ''))
        .filter(Boolean);

      const contentJson = {
        content: formData.content,
        hashtags,
        imageUrl: formData.imageUrl || null,
      };

      const { data, error } = await supabase
        .from('scheduled_posts')
        .insert({
          company_id: companyId,
          content_json: contentJson,
          scheduled_for: scheduledFor.toISOString(),
          timezone,
          platforms: formData.platforms,
          status: 'scheduled',
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast.success('Post scheduled successfully!');
      queryClient.invalidateQueries({ queryKey: ['scheduled-posts'] });
      queryClient.invalidateQueries({ queryKey: ['social-content-drafts'] });
      onSuccess?.({ platform: formData.platforms.join(', '), status: 'scheduled' });
      setShowScheduleDialog(false);
      onCancel();
    },
    onError: (error) => {
      toast.error('Failed to schedule post: ' + error.message);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (formData.platforms.length === 0) {
      toast.error('Please select at least one platform');
      return;
    }
    
    if (!formData.content.trim()) {
      toast.error('Please enter content for your post');
      return;
    }
    
    createDraft.mutate();
  };

  const handleSchedule = (scheduledFor: Date, timezone: string) => {
    if (formData.platforms.length === 0) {
      toast.error('Please select at least one platform');
      return;
    }
    
    if (!formData.content.trim()) {
      toast.error('Please enter content for your post');
      return;
    }

    schedulePost.mutate({ scheduledFor, timezone });
  };

  // Get the minimum char limit from selected platforms
  const minCharLimit = formData.platforms.length > 0
    ? Math.min(...formData.platforms.map(p => PLATFORMS.find(pl => pl.id === p)?.charLimit || 2200))
    : 2200;
  
  const isOverLimit = formData.content.length > minCharLimit;

  return (
    <>
      <Card className="border-card-foreground/20 bg-card shadow-sm">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg flex items-center gap-2 text-card-foreground">
              <div className="p-2 rounded-lg bg-feature-marketing/15 border border-feature-marketing/30">
                <Share2 className="h-4 w-4 text-feature-marketing" />
              </div>
              Create Social Post
            </CardTitle>
            <Button variant="ghost" size="icon" onClick={onCancel} className="text-card-foreground/60 hover:text-card-foreground">
              <X className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Platform Selection */}
            <div className="space-y-2">
              <Label className="text-card-foreground/70">Platforms *</Label>
              <div className="grid grid-cols-3 gap-2">
                {PLATFORMS.map(platform => {
                  const Icon = platform.icon;
                  const isSelected = formData.platforms.includes(platform.id);
                  return (
                    <button
                      key={platform.id}
                      type="button"
                      onClick={() => handlePlatformToggle(platform.id)}
                      className={`flex items-center gap-2 p-2.5 rounded-lg border transition-all ${
                        isSelected
                          ? 'bg-[hsl(var(--primary))]/10 border-[hsl(var(--primary))]/40 text-card-foreground'
                          : 'bg-muted/30 border-card-foreground/10 text-card-foreground/60 hover:bg-muted/50'
                      }`}
                    >
                      <Checkbox checked={isSelected} className="pointer-events-none" />
                      <Icon className={`h-4 w-4 ${isSelected ? '' : 'opacity-70'}`} />
                      <span className="text-sm">{platform.label}</span>
                    </button>
                  );
                })}
              </div>
              {formData.platforms.length > 0 && (
                <p className="text-xs text-card-foreground/50">
                  Character limit: {minCharLimit.toLocaleString()} (based on {
                    PLATFORMS.find(p => p.charLimit === minCharLimit)?.label
                  })
                </p>
              )}
            </div>

            {/* Content */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-card-foreground/70">Content *</Label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={generateContent}
                  disabled={isGenerating || formData.platforms.length === 0}
                  className="text-xs border-card-foreground/20"
                >
                  {isGenerating ? (
                    <>
                      <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-3 w-3 mr-1" />
                      Generate with AI
                    </>
                  )}
                </Button>
              </div>
              <Textarea
                value={formData.content}
                onChange={(e) => setFormData(prev => ({ ...prev, content: e.target.value }))}
                placeholder="Write your post content..."
                className="min-h-[120px] bg-muted/30 border-card-foreground/20 text-card-foreground resize-none"
              />
              <div className="flex items-center justify-between text-xs">
                <span className={isOverLimit ? 'text-destructive' : 'text-card-foreground/50'}>
                  {formData.content.length} / {minCharLimit}
                </span>
              </div>
            </div>

            {/* Hashtags */}
            <div className="space-y-2">
              <Label className="text-card-foreground/70 flex items-center gap-1.5">
                <Hash className="h-3.5 w-3.5" />
                Hashtags
              </Label>
              <Input
                value={formData.hashtags}
                onChange={(e) => setFormData(prev => ({ ...prev, hashtags: e.target.value }))}
                placeholder="summer, hvac, service (comma-separated)"
                className="bg-muted/30 border-card-foreground/20 text-card-foreground"
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
              
              {formData.imageUrl ? (
                <div className="relative">
                  <div className="relative w-full h-32 rounded-lg overflow-hidden bg-muted/30 border border-card-foreground/20">
                    <img 
                      src={formData.imageUrl} 
                      alt="Preview" 
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = 'none';
                      }}
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
                  className="w-full border-dashed border-card-foreground/30 text-card-foreground/70 hover:bg-muted/30"
                >
                  {isUploading ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Uploading...
                    </>
                  ) : (
                    <>
                      <Upload className="h-4 w-4 mr-2" />
                      Upload Image
                    </>
                  )}
                </Button>
              )}
            </div>

            {/* Actions */}
            <div className="flex gap-2 pt-2 border-t border-card-foreground/10">
              <Button
                type="button"
                variant="outline"
                onClick={onCancel}
                className="flex-1 border-card-foreground/20 text-card-foreground/70"
              >
                Cancel
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowScheduleDialog(true)}
                disabled={formData.platforms.length === 0 || !formData.content.trim()}
                className="flex-1 border-card-foreground/20 text-card-foreground"
              >
                <Calendar className="h-4 w-4 mr-1.5" />
                Schedule
              </Button>
              <Button
                type="submit"
                disabled={createDraft.isPending || formData.platforms.length === 0 || !formData.content.trim()}
                className="flex-1 bg-feature-marketing text-white hover:bg-feature-marketing/90"
              >
                {createDraft.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4 mr-1.5" />
                    Save Draft
                  </>
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <SchedulePostDialog
        open={showScheduleDialog}
        onOpenChange={setShowScheduleDialog}
        onSchedule={handleSchedule}
        isScheduling={schedulePost.isPending}
        platforms={formData.platforms}
      />
    </>
  );
};
