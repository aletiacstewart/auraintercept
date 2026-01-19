import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { SocialContentCard, SocialContentDraft } from './SocialContentCard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import {
  Share2,
  RefreshCw,
  Filter,
  Instagram,
  MapPin,
  Facebook,
  MessageSquare,
  Inbox,
  CheckCircle,
  Send,
} from 'lucide-react';

interface SocialFeedQueueProps {
  companyId: string;
}

type FilterStatus = 'all' | 'pending' | 'published';
type FilterPlatform = 'all' | 'instagram' | 'google_business' | 'facebook' | 'sms';

const PLATFORM_ICONS = {
  instagram: Instagram,
  google_business: MapPin,
  facebook: Facebook,
  sms: MessageSquare,
};

export function SocialFeedQueue({ companyId }: SocialFeedQueueProps) {
  const queryClient = useQueryClient();
  const [statusFilter, setStatusFilter] = useState<FilterStatus>('pending');
  const [platformFilter, setPlatformFilter] = useState<FilterPlatform>('all');
  const [publishingId, setPublishingId] = useState<string | null>(null);

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

  // Filter drafts by platform
  const filteredDrafts = drafts?.filter((draft) => {
    if (platformFilter === 'all') return true;
    return draft.platform === platformFilter;
  });

  // Count by status
  const pendingCount = drafts?.filter((d) => d.status === 'pending').length || 0;
  const publishedCount = drafts?.filter((d) => d.status === 'published').length || 0;

  return (
    <Card className="border-slate-700 bg-slate-800/50">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-gradient-to-br from-pink-500/20 to-purple-500/20 border border-pink-500/30">
              <Share2 className="h-5 w-5 text-pink-400" />
            </div>
            <div>
              <CardTitle className="text-lg text-slate-100">Social Feed Queue</CardTitle>
              <p className="text-sm text-slate-400">
                AI-generated content from job completions
              </p>
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => refetch()}
            disabled={isLoading}
            className="border-slate-600 text-slate-300"
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
            <TabsList className="bg-slate-900/50">
              <TabsTrigger value="pending" className="data-[state=active]:bg-yellow-500/20 data-[state=active]:text-yellow-400">
                <Inbox className="h-4 w-4 mr-1.5" />
                Pending
                {pendingCount > 0 && (
                  <Badge variant="secondary" className="ml-1.5 bg-yellow-500/30 text-yellow-300 text-xs">
                    {pendingCount}
                  </Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="published" className="data-[state=active]:bg-green-500/20 data-[state=active]:text-green-400">
                <CheckCircle className="h-4 w-4 mr-1.5" />
                Published
                {publishedCount > 0 && (
                  <Badge variant="secondary" className="ml-1.5 bg-green-500/30 text-green-300 text-xs">
                    {publishedCount}
                  </Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="all" className="data-[state=active]:bg-slate-600">
                All
              </TabsTrigger>
            </TabsList>
          </Tabs>

          {/* Platform Filter */}
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-slate-500" />
            <div className="flex gap-1">
              {(['all', 'instagram', 'google_business', 'facebook', 'sms'] as const).map((platform) => {
                const Icon = platform === 'all' ? null : PLATFORM_ICONS[platform];
                const isActive = platformFilter === platform;
                return (
                  <Button
                    key={platform}
                    variant="ghost"
                    size="sm"
                    className={`px-2 ${isActive ? 'bg-slate-700 text-slate-100' : 'text-slate-400'}`}
                    onClick={() => setPlatformFilter(platform)}
                  >
                    {Icon ? <Icon className="h-4 w-4" /> : 'All'}
                  </Button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Content Grid */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-64 rounded-lg bg-slate-900/50 animate-pulse" />
            ))}
          </div>
        ) : filteredDrafts && filteredDrafts.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredDrafts.map((draft) => (
              <SocialContentCard
                key={draft.id}
                draft={draft}
                onEdit={handleEdit}
                onDelete={handleDelete}
                onApprove={handleApprove}
                isPublishing={publishingId === draft.id}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <Share2 className="h-12 w-12 mx-auto text-slate-600 mb-3" />
            <h3 className="text-lg font-medium text-slate-300 mb-1">No content yet</h3>
            <p className="text-sm text-slate-500">
              {statusFilter === 'pending' 
                ? "When technicians complete jobs with photos, AI-generated social content will appear here."
                : statusFilter === 'published'
                ? "No published content yet. Approve pending content to see it here."
                : "No social content drafts found."}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
