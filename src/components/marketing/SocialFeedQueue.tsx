import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { SocialContentCard, SocialContentDraft } from './SocialContentCard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { AuraEmptyState } from '@/components/ui/aura-empty-state';
import {
  Share2,
  RefreshCw,
  Filter,
  Instagram,
  MapPin,
  Facebook,
  MessageSquare,
  Linkedin,
  Video,
  Inbox,
  CheckCircle,
  Clock,
} from 'lucide-react';

interface SocialFeedQueueProps {
  companyId: string;
  initialFilter?: 'pending' | 'scheduled' | 'published' | 'all';
}

type FilterStatus = 'all' | 'pending' | 'published' | 'scheduled';
type FilterPlatform = 'all' | 'instagram' | 'google_business' | 'facebook' | 'sms' | 'tiktok' | 'linkedin';

// Platform colors matching feature color system
const PLATFORM_COLORS = {
  instagram: { bg: 'bg-[hsl(330,70%,50%)]/15', text: 'text-[hsl(330,70%,60%)]', border: 'border-[hsl(330,70%,50%)]/30' },
  google_business: { bg: 'bg-[hsl(210,80%,50%)]/15', text: 'text-[hsl(210,80%,60%)]', border: 'border-[hsl(210,80%,50%)]/30' },
  facebook: { bg: 'bg-[hsl(220,70%,50%)]/15', text: 'text-[hsl(220,70%,60%)]', border: 'border-[hsl(220,70%,50%)]/30' },
  sms: { bg: 'bg-[hsl(145,60%,45%)]/15', text: 'text-[hsl(145,60%,55%)]', border: 'border-[hsl(145,60%,45%)]/30' },
  tiktok: { bg: 'bg-[hsl(340,82%,52%)]/15', text: 'text-[hsl(340,82%,60%)]', border: 'border-[hsl(340,82%,52%)]/30' },
  linkedin: { bg: 'bg-[hsl(210,90%,45%)]/15', text: 'text-[hsl(210,90%,55%)]', border: 'border-[hsl(210,90%,45%)]/30' },
};

export function SocialFeedQueue({ companyId, initialFilter = 'pending' }: SocialFeedQueueProps) {
  const queryClient = useQueryClient();
  const [statusFilter, setStatusFilter] = useState<FilterStatus>(initialFilter);
  const [platformFilter, setPlatformFilter] = useState<FilterPlatform>('all');
  const [publishingId, setPublishingId] = useState<string | null>(null);

  // Sync statusFilter when initialFilter prop changes from parent
  useEffect(() => {
    setStatusFilter(initialFilter);
  }, [initialFilter]);

  // Fetch drafts
  const { data: drafts, isLoading, refetch } = useQuery({
    queryKey: ['social-content-drafts', companyId, statusFilter],
    queryFn: async () => {
      let query = supabase
        .from('social_content_drafts')
        .select('*')
        .eq('company_id', companyId)
        .order('created_at', { ascending: false });

      if (statusFilter !== 'all') {
        query = query.eq('status', statusFilter);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as SocialContentDraft[];
    },
    enabled: !!companyId,
  });

  // Real-time subscription
  useEffect(() => {
    const channel = supabase
      .channel('social-content-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'social_content_drafts',
          filter: `company_id=eq.${companyId}`,
        },
        () => {
          refetch();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [companyId, refetch]);

  // Edit mutation
  const editMutation = useMutation({
    mutationFn: async ({ id, content }: { id: string; content: string }) => {
      const { error } = await supabase
        .from('social_content_drafts')
        .update({ edited_content: content })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['social-content-drafts'] });
      toast.success('Content updated');
    },
    onError: () => {
      toast.error('Failed to update content');
    },
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('social_content_drafts')
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['social-content-drafts'] });
      toast.success('Draft deleted');
    },
    onError: () => {
      toast.error('Failed to delete draft');
    },
  });

  // Publish mutation
  const publishMutation = useMutation({
    mutationFn: async (draftId: string) => {
      const { data, error } = await supabase.functions.invoke('publish-social-content', {
        body: { draftId },
      });
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['social-content-drafts'] });
      toast.success(`Published to ${data.platform.replace('_', ' ')}`);
      setPublishingId(null);
    },
    onError: (error) => {
      console.error('Publish error:', error);
      toast.error('Failed to publish content');
      setPublishingId(null);
    },
  });

  // Schedule mutation
  const scheduleMutation = useMutation({
    mutationFn: async ({ draft, scheduledFor, timezone }: { draft: SocialContentDraft; scheduledFor: Date; timezone: string }) => {
      const contentJson = {
        content: draft.edited_content || draft.generated_content,
        hashtags: draft.hashtags,
        imageUrl: draft.image_url,
      };

      const { data, error } = await supabase
        .from('scheduled_posts')
        .insert({
          company_id: companyId,
          draft_id: draft.id,
          content_json: contentJson,
          scheduled_for: scheduledFor.toISOString(),
          timezone,
          platforms: [draft.platform],
          status: 'scheduled',
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['social-content-drafts'] });
      queryClient.invalidateQueries({ queryKey: ['scheduled-posts'] });
      toast.success('Post scheduled successfully!');
    },
    onError: (error) => {
      console.error('Schedule error:', error);
      toast.error('Failed to schedule post');
    },
  });

  const handleEdit = (draft: SocialContentDraft, newContent: string) => {
    editMutation.mutate({ id: draft.id, content: newContent });
  };

  const handleDelete = (id: string) => {
    deleteMutation.mutate(id);
  };

  const handleApprove = (id: string) => {
    setPublishingId(id);
    publishMutation.mutate(id);
  };

  const handleSchedule = (draft: SocialContentDraft, scheduledFor: Date, timezone: string) => {
    scheduleMutation.mutate({ draft, scheduledFor, timezone });
  };

  // Filter drafts by platform
  const filteredDrafts = drafts?.filter((draft) => {
    if (platformFilter === 'all') return true;
    return draft.platform === platformFilter;
  });

  // Count by status
  const pendingCount = drafts?.filter((d) => d.status === 'pending').length || 0;
  const publishedCount = drafts?.filter((d) => d.status === 'published').length || 0;

  return (
    <Card className="border-card-foreground/20 bg-card">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-feature-marketing/15 border border-feature-marketing/30">
              <Share2 className="h-5 w-5 text-feature-marketing" />
            </div>
            <div>
              <CardTitle className="text-lg text-card-foreground">Social Feed Queue</CardTitle>
              <p className="text-sm text-card-foreground/60">
                AI-generated content for social media
              </p>
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => refetch()}
            disabled={isLoading}
            className="border-card-foreground/20 text-card-foreground hover:bg-card-foreground/10"
          >
            <RefreshCw className={`h-4 w-4 mr-1.5 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Status Tabs */}
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <Tabs value={statusFilter} onValueChange={(v) => setStatusFilter(v as FilterStatus)}>
            <TabsList className="bg-muted/30 border border-card-foreground/10">
              <TabsTrigger 
                value="pending" 
                className="data-[state=active]:bg-status-pending/20 data-[state=active]:text-status-pending data-[state=active]:border data-[state=active]:border-status-pending/40"
              >
                <Inbox className="h-4 w-4 mr-1.5" />
                Pending
                {pendingCount > 0 && (
                  <Badge variant="secondary" className="ml-1.5 bg-status-pending/30 text-status-pending text-xs">
                    {pendingCount}
                  </Badge>
                )}
              </TabsTrigger>
              <TabsTrigger 
                value="scheduled" 
                className="data-[state=active]:bg-blue-500/20 data-[state=active]:text-blue-400 data-[state=active]:border data-[state=active]:border-blue-500/40"
              >
                <Clock className="h-4 w-4 mr-1.5" />
                Scheduled
              </TabsTrigger>
              <TabsTrigger 
                value="published" 
                className="data-[state=active]:bg-success/20 data-[state=active]:text-success data-[state=active]:border data-[state=active]:border-success/40"
              >
                <CheckCircle className="h-4 w-4 mr-1.5" />
                Published
                {publishedCount > 0 && (
                  <Badge variant="secondary" className="ml-1.5 bg-success/30 text-success text-xs">
                    {publishedCount}
                  </Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="all" className="data-[state=active]:bg-card-foreground/15 data-[state=active]:text-card-foreground">
                All
              </TabsTrigger>
            </TabsList>
          </Tabs>

          {/* Platform Filter */}
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-card-foreground/50" />
            <div className="flex gap-1 p-1 rounded-lg bg-muted/30 border border-card-foreground/10">
              {([
                { id: 'all', label: 'All', icon: null },
                { id: 'instagram', label: 'IG', icon: Instagram },
                { id: 'google_business', label: 'GMB', icon: MapPin },
                { id: 'facebook', label: 'FB', icon: Facebook },
                { id: 'linkedin', label: 'LI', icon: Linkedin },
                { id: 'tiktok', label: 'TT', icon: Video },
                { id: 'sms', label: 'SMS', icon: MessageSquare },
              ] as const).map((platform) => {
                const colors = platform.id === 'all' ? null : PLATFORM_COLORS[platform.id];
                const isActive = platformFilter === platform.id;
                return (
                  <Button
                    key={platform.id}
                    variant="ghost"
                    size="sm"
                    className={`px-2.5 rounded-md transition-all ${
                      isActive 
                        ? colors 
                          ? `${colors.bg} ${colors.text} ${colors.border} border` 
                          : 'bg-card-foreground/15 text-card-foreground border border-card-foreground/20'
                        : 'text-card-foreground hover:text-card-foreground hover:bg-card-foreground/10'
                    }`}
                    onClick={() => setPlatformFilter(platform.id)}
                  >
                    {platform.icon && <platform.icon className="h-4 w-4 mr-1" />}
                    <span className="text-xs">{platform.label}</span>
                  </Button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Content Grid */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="h-64 rounded-xl bg-muted/30 animate-pulse" />
            ))}
          </div>
        ) : filteredDrafts && filteredDrafts.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredDrafts.map((draft) => (
              <SocialContentCard
                key={draft.id}
                draft={draft}
                onEdit={handleEdit}
                onDelete={handleDelete}
                onApprove={handleApprove}
                onSchedule={handleSchedule}
                isPublishing={publishingId === draft.id}
              />
            ))}
          </div>
        ) : (
          <AuraEmptyState
            icon={Share2}
            title="No content yet"
            description={
              statusFilter === 'pending' 
                ? "When technicians complete jobs with photos, AI-generated social content will appear here."
                : statusFilter === 'published'
                ? "No published content yet. Approve pending content to see it here."
                : "No social content drafts found."
            }
            actionLabel="Let Aura generate sample posts"
          />
        )}
      </CardContent>
    </Card>
  );
}
