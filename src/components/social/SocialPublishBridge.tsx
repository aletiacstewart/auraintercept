import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import {
  Instagram,
  Facebook,
  Linkedin,
  Video,
  MapPin,
  MessageSquare,
  Copy,
  ExternalLink,
  CheckCircle2,
  Check,
} from 'lucide-react';
import { cn } from '@/lib/utils';

type Platform = 'instagram' | 'facebook' | 'linkedin' | 'tiktok' | 'google_business' | 'sms';

interface PlatformContent {
  content: string;
  hashtags: string[];
  characterCount?: number;
}

interface SocialPublishBridgeProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  postId: string;
  topic: string;
  platforms: Platform[];
  contentJson: Record<string, PlatformContent>;
  imageUrl?: string | null;
}

const PLATFORM_CONFIG: Record<Platform, {
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  bgColor: string;
  deepLink: (content: string) => string;
  instructions: string;
}> = {
  facebook: {
    label: 'Facebook',
    icon: Facebook,
    color: 'text-cyan-400',
    bgColor: 'bg-blue-600',
    deepLink: () => 'https://www.facebook.com',
    instructions: 'Paste your copied content into the "What\'s on your mind?" box on Facebook.',
  },
  instagram: {
    label: 'Instagram',
    icon: Instagram,
    color: 'text-pink-600',
    bgColor: 'bg-gradient-to-br from-purple-600 to-pink-500',
    deepLink: () => 'https://www.instagram.com/create/story/',
    instructions: 'Paste your content into the Instagram caption field after uploading your media.',
  },
  linkedin: {
    label: 'LinkedIn',
    icon: Linkedin,
    color: 'text-cyan-700',
    bgColor: 'bg-blue-700',
    deepLink: (content) => `https://www.linkedin.com/sharing/share-offsite/?mini=true&summary=${encodeURIComponent(content)}`,
    instructions: 'Your content will be pre-filled. Review and click Post.',
  },
  tiktok: {
    label: 'TikTok',
    icon: Video,
    color: 'text-rose-600',
    bgColor: 'bg-black',
    deepLink: () => 'https://www.tiktok.com/upload',
    instructions: 'Upload your video on TikTok, then paste your caption in the description field.',
  },
  google_business: {
    label: 'Google Business',
    icon: MapPin,
    color: 'text-green-600',
    bgColor: 'bg-green-600',
    deepLink: () => 'https://business.google.com/create-post',
    instructions: 'Paste your content into the Google Business post editor.',
  },
  sms: {
    label: 'SMS',
    icon: MessageSquare,
    color: 'text-emerald-600',
    bgColor: 'bg-emerald-600',
    deepLink: (content) => `sms:?body=${encodeURIComponent(content)}`,
    instructions: 'Opens your SMS app with the message pre-filled. Send to your contact list.',
  },
};

export function SocialPublishBridge({
  open,
  onOpenChange,
  postId,
  topic,
  platforms,
  contentJson,
  imageUrl,
}: SocialPublishBridgeProps) {
  const queryClient = useQueryClient();
  const [activePlatform, setActivePlatform] = useState<Platform>(platforms[0]);
  const [postedPlatforms, setPostedPlatforms] = useState<Set<Platform>>(new Set());
  const [copiedPlatform, setCopiedPlatform] = useState<Platform | null>(null);

  const markPostedMutation = useMutation({
    mutationFn: async (platform: Platform) => {
      // Mark individual platform posted — update overall post as published when all done
      const newPosted = new Set([...postedPlatforms, platform]);
      const allDone = platforms.every(p => newPosted.has(p));

      if (allDone) {
        const { error } = await supabase
          .from('scheduled_social_posts')
          .update({
            status: 'published',
            published_at: new Date().toISOString(),
          })
          .eq('id', postId);
        if (error) throw error;
      }

      return { platform, allDone, newPosted };
    },
    onSuccess: ({ platform, allDone, newPosted }) => {
      setPostedPlatforms(newPosted);
      if (allDone) {
        toast.success('All platforms posted! Post marked as published.');
        queryClient.invalidateQueries({ queryKey: ['scheduled-social-posts'] });
        onOpenChange(false);
      } else {
        toast.success(`${PLATFORM_CONFIG[platform]?.label} marked as posted!`);
      }
    },
    onError: () => toast.error('Failed to update post status'),
  });

  const handleCopy = async (platform: Platform) => {
    const platformContent = contentJson[platform];
    if (!platformContent) return;

    const text = platformContent.hashtags?.length
      ? `${platformContent.content}\n\n${platformContent.hashtags.map(h => `#${h}`).join(' ')}`
      : platformContent.content;

    try {
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
      setCopiedPlatform(platform);
      toast.success('Copied to clipboard!');
      setTimeout(() => setCopiedPlatform(null), 2000);
    } catch {
      toast.error('Failed to copy. Please select and copy manually.');
    }
  };

  const handleOpenPlatform = (platform: Platform) => {
    const content = contentJson[platform]?.content || '';
    const url = PLATFORM_CONFIG[platform]?.deepLink(content);
    if (!url) return;
    const a = document.createElement('a');
    a.href = url;
    a.target = '_blank';
    a.rel = 'noopener noreferrer';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const handleCopyAndOpen = async (platform: Platform) => {
    await handleCopy(platform);
    setTimeout(() => handleOpenPlatform(platform), 300);
  };

  const allPosted = platforms.every(p => postedPlatforms.has(p));

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-feature-marketing/15 border border-feature-marketing/30">
              <ExternalLink className="h-4 w-4 text-feature-marketing" />
            </div>
            Post This Content
          </DialogTitle>
          <p className="text-sm text-muted-foreground">
            Copy your content and open each platform to post manually.
          </p>
        </DialogHeader>

        {/* Topic */}
        <div className="px-1">
          <p className="text-xs text-muted-foreground">Topic</p>
          <p className="text-sm font-medium truncate">{topic}</p>
        </div>

        {/* Platform Tabs */}
        <Tabs value={activePlatform} onValueChange={(v) => setActivePlatform(v as Platform)}>
          <TabsList className="w-full flex flex-wrap h-auto gap-1 bg-muted/30 p-1">
            {platforms.map((platform) => {
              const config = PLATFORM_CONFIG[platform];
              if (!config) return null;
              const Icon = config.icon;
              const isPosted = postedPlatforms.has(platform);
              return (
                <TabsTrigger
                  key={platform}
                  value={platform}
                  className="flex-1 min-w-[80px] gap-1.5 relative"
                >
                  <Icon className="h-3.5 w-3.5" />
                  <span className="text-xs">{config.label}</span>
                  {isPosted && (
                    <CheckCircle2 className="h-3 w-3 text-success absolute -top-1 -right-1" />
                  )}
                </TabsTrigger>
              );
            })}
          </TabsList>

          {platforms.map((platform) => {
            const config = PLATFORM_CONFIG[platform];
            if (!config) return null;
            const Icon = config.icon;
            const platformContent = contentJson[platform];
            const isPosted = postedPlatforms.has(platform);
            const isCopied = copiedPlatform === platform;

            return (
              <TabsContent key={platform} value={platform} className="space-y-4 mt-4">
                {/* Platform header */}
                <div className="flex items-center gap-3">
                  <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center', config.bgColor)}>
                    <Icon className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <p className="font-medium">{config.label}</p>
                    <p className="text-xs text-muted-foreground">{config.instructions}</p>
                  </div>
                  {isPosted && (
                    <Badge variant="secondary" className="ml-auto text-success border-success/30">
                      <Check className="h-3 w-3 mr-1" />
                      Posted
                    </Badge>
                  )}
                </div>

                {/* Content preview */}
                <div className="rounded-lg border bg-muted/30 p-4 space-y-2">
                  <p className="text-sm whitespace-pre-wrap">{platformContent?.content || 'No content generated for this platform.'}</p>
                  {platformContent?.hashtags && platformContent.hashtags.length > 0 && (
                    <div className="flex flex-wrap gap-1 pt-1 border-t border-border/50">
                      {platformContent.hashtags.map((tag, i) => (
                        <Badge key={i} variant="secondary" className="text-xs">#{tag}</Badge>
                      ))}
                    </div>
                  )}
                </div>

                {/* Image notice */}
                {imageUrl && (
                  <div className="flex items-center gap-2 p-2 rounded-lg bg-warning/10 border border-warning/20 text-xs text-warning-foreground">
                    <span>📷</span>
                    <span>This post has an image — you'll need to attach it manually when posting.</span>
                  </div>
                )}

                {/* PRIMARY: Copy & Open combined */}
                <Button
                  onClick={() => handleCopyAndOpen(platform)}
                  className={cn('w-full gap-2 font-semibold', isCopied && 'bg-success hover:bg-success/90 text-success-foreground')}
                  size="default"
                >
                  {isCopied ? (
                    <><Check className="h-4 w-4" /> Copied! Opening {config.label}...</>
                  ) : (
                    <><Copy className="h-4 w-4" /> Copy & Open {config.label} <ExternalLink className="h-3.5 w-3.5 ml-1" /></>
                  )}
                </Button>

                {/* Secondary actions */}
                <div className="grid grid-cols-2 gap-2">
                  <Button
                    variant="outline"
                    onClick={() => handleCopy(platform)}
                    className="gap-2 text-sm"
                  >
                    <Copy className="h-3.5 w-3.5" /> Copy Only
                  </Button>
                  <Button
                    onClick={() => markPostedMutation.mutate(platform)}
                    disabled={markPostedMutation.isPending || isPosted}
                    variant={isPosted ? 'secondary' : 'outline'}
                    className="gap-2 text-sm"
                  >
                    {isPosted ? (
                      <><CheckCircle2 className="h-3.5 w-3.5 text-success" /> Posted</>
                    ) : (
                      <><Check className="h-3.5 w-3.5" /> Mark Posted</>
                    )}
                  </Button>
                </div>
              </TabsContent>
            );
          })}
        </Tabs>

        {/* Progress summary */}
        <div className="flex items-center justify-between p-3 rounded-lg bg-muted/30 border text-sm">
          <span className="text-muted-foreground">
            {postedPlatforms.size} of {platforms.length} platform{platforms.length > 1 ? 's' : ''} posted
          </span>
          {allPosted ? (
            <Badge variant="secondary" className="text-success border-success/30">
              <CheckCircle2 className="h-3 w-3 mr-1" />
              All Done!
            </Badge>
          ) : (
            <span className="text-muted-foreground text-xs">
              Mark each platform as posted after publishing
            </span>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
