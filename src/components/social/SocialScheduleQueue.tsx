import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { FormShell } from '@/components/ui/form-shell';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { toast } from 'sonner';
import { 
  Check, 
  X, 
  Clock, 
  Edit, 
  Trash2, 
  Eye,
  CalendarIcon,
  Share2,
  CheckCircle,
  XCircle,
  AlertCircle,
  Search,
  Instagram,
  Facebook,
  Linkedin,
  Twitter,
  Video,
  MapPin,
  MessageSquare,
  ExternalLink,
} from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { SocialPublishBridge } from './SocialPublishBridge';

interface PlatformContent {
  content: string;
  hashtags: string[];
  characterCount: number;
}

interface ScheduledSocialPost {
  id: string;
  company_id: string;
  topic: string;
  keywords: string[] | null;
  platforms: string[];
  content_json: Record<string, PlatformContent>;
  image_url: string | null;
  scheduled_for: string;
  timezone: string;
  status: 'pending' | 'approved' | 'ready_to_post' | 'published' | 'rejected' | 'failed';
  batch_id: string | null;
  ai_research_used: boolean | null;
  publish_error: string | null;
  created_at: string;
  approved_at: string | null;
}

const STATUS_CONFIG = {
  pending: { label: 'Pending', color: 'bg-warning text-warning-foreground', icon: Clock },
  approved: { label: 'Approved', color: 'bg-primary text-primary-foreground', icon: CheckCircle },
  ready_to_post: { label: 'Ready to Post', color: 'bg-amber-500 text-white', icon: Share2 },
  published: { label: 'Published', color: 'bg-success text-success-foreground', icon: Check },
  rejected: { label: 'Rejected', color: 'bg-destructive text-destructive-foreground', icon: XCircle },
  failed: { label: 'Failed', color: 'bg-destructive text-destructive-foreground', icon: AlertCircle },
};

const PLATFORM_ICONS: Record<string, React.ComponentType<any>> = {
  instagram: Instagram,
  facebook: Facebook,
  linkedin: Linkedin,
  twitter: Twitter,
  tiktok: Video,
  google_business: MapPin,
  sms: MessageSquare,
};

const PLATFORM_LIMITS: Record<string, number> = {
  instagram: 2200,
  facebook: 63206,
  linkedin: 3000,
  twitter: 280,
  tiktok: 2200,
  google_business: 1500,
  sms: 160,
};

interface SocialScheduleQueueProps {
  companyId?: string;
  onClose?: () => void;
}

export function SocialScheduleQueue({ companyId: propCompanyId, onClose }: SocialScheduleQueueProps) {
  const { companyId: authCompanyId, user } = useAuth();
  const effectiveCompanyId = propCompanyId || authCompanyId;
  const queryClient = useQueryClient();
  
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [selectedPost, setSelectedPost] = useState<ScheduledSocialPost | null>(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editData, setEditData] = useState<{
    topic: string;
    content_json: Record<string, PlatformContent>;
    scheduled_for: Date;
  } | null>(null);
  const [editPlatform, setEditPlatform] = useState<string>('');
  const [bridgePost, setBridgePost] = useState<ScheduledSocialPost | null>(null);
  const [isBridgeOpen, setIsBridgeOpen] = useState(false);

  // Fetch scheduled posts
  const { data: posts, isLoading } = useQuery({
    queryKey: ['scheduled-social-posts', effectiveCompanyId, filterStatus],
    queryFn: async () => {
      let query = supabase
        .from('scheduled_social_posts')
        .select('*')
        .eq('company_id', effectiveCompanyId!)
        .order('scheduled_for', { ascending: true });
      
      if (filterStatus !== 'all') {
        query = query.eq('status', filterStatus);
      }
      
      const { data, error } = await query;
      if (error) throw error;
      return (data || []).map(post => ({
        ...post,
        content_json: post.content_json as unknown as Record<string, PlatformContent>,
      })) as ScheduledSocialPost[];
    },
    enabled: !!effectiveCompanyId,
  });

  // Approve mutation
  const approveMutation = useMutation({
    mutationFn: async (postId: string) => {
      const { error } = await supabase
        .from('scheduled_social_posts')
        .update({ 
          status: 'approved',
          approved_by: user?.id,
          approved_at: new Date().toISOString(),
        })
        .eq('id', postId);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Post approved for publishing');
      queryClient.invalidateQueries({ queryKey: ['scheduled-social-posts'] });
    },
    onError: () => toast.error('Failed to approve post'),
  });

  // Reject mutation
  const rejectMutation = useMutation({
    mutationFn: async (postId: string) => {
      const { error } = await supabase
        .from('scheduled_social_posts')
        .update({ status: 'rejected' })
        .eq('id', postId);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Post rejected');
      queryClient.invalidateQueries({ queryKey: ['scheduled-social-posts'] });
    },
    onError: () => toast.error('Failed to reject post'),
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async (postId: string) => {
      const { error } = await supabase
        .from('scheduled_social_posts')
        .delete()
        .eq('id', postId);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Post deleted');
      queryClient.invalidateQueries({ queryKey: ['scheduled-social-posts'] });
    },
    onError: () => toast.error('Failed to delete post'),
  });

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: async ({ postId, data }: { postId: string; data: typeof editData }) => {
      if (!data) return;
      const { error } = await supabase
        .from('scheduled_social_posts')
        .update({
          topic: data.topic,
          content_json: JSON.parse(JSON.stringify(data.content_json)),
          scheduled_for: data.scheduled_for.toISOString(),
        })
        .eq('id', postId);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Post updated');
      queryClient.invalidateQueries({ queryKey: ['scheduled-social-posts'] });
      setIsEditOpen(false);
      setSelectedPost(null);
      setEditData(null);
    },
    onError: () => toast.error('Failed to update post'),
  });

  // Publish now mutation - creates drafts in social_content_drafts as scheduled
  const publishNowMutation = useMutation({
    mutationFn: async (post: ScheduledSocialPost) => {
      // Insert each platform's content as a separate draft
      const drafts = Object.entries(post.content_json).map(([platform, content]) => ({
        company_id: effectiveCompanyId!,
        topic: post.topic,
        platform,
        generated_content: content.content,
        edited_content: content.content,
        hashtags: content.hashtags,
        status: 'scheduled' as const,
        scheduled_for: new Date().toISOString(),
      }));

      const { error: insertError } = await supabase
        .from('social_content_drafts')
        .insert(drafts);
      
      if (insertError) throw insertError;
      
      // Update scheduled post status
      const { error: updateError } = await supabase
        .from('scheduled_social_posts')
        .update({ 
          status: 'published',
          published_at: new Date().toISOString(),
        })
        .eq('id', post.id);
      
      if (updateError) throw updateError;
    },
    onSuccess: () => {
      toast.success('Post queued for publishing!');
      queryClient.invalidateQueries({ queryKey: ['scheduled-social-posts'] });
      queryClient.invalidateQueries({ queryKey: ['social-content-drafts'] });
    },
    onError: (error: any) => toast.error(error.message || 'Failed to publish post'),
  });

  const openPreview = (post: ScheduledSocialPost) => {
    setSelectedPost(post);
    setIsPreviewOpen(true);
  };

  const openEdit = (post: ScheduledSocialPost) => {
    setSelectedPost(post);
    setEditData({
      topic: post.topic,
      content_json: { ...post.content_json },
      scheduled_for: parseISO(post.scheduled_for),
    });
    setEditPlatform(post.platforms[0] || '');
    setIsEditOpen(true);
  };

  const updatePlatformContent = (platform: string, field: 'content' | 'hashtags', value: string | string[]) => {
    if (!editData) return;
    setEditData({
      ...editData,
      content_json: {
        ...editData.content_json,
        [platform]: {
          ...editData.content_json[platform],
          [field]: value,
          characterCount: field === 'content' ? (value as string).length : editData.content_json[platform].characterCount,
        },
      },
    });
  };

  const getStatusBadge = (status: ScheduledSocialPost['status']) => {
    const config = STATUS_CONFIG[status];
    const Icon = config.icon;
    return (
      <Badge variant="outline" className={`${config.color} text-white border-0`}>
        <Icon className="h-3 w-3 mr-1" />
        {config.label}
      </Badge>
    );
  };

  const pendingCount = posts?.filter(p => p.status === 'pending').length || 0;
  const approvedCount = posts?.filter(p => p.status === 'approved').length || 0;

  return (
    <div className="space-y-6">
      {/* Header with close button */}
      {onClose && (
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold">Scheduled Posts</h2>
          <Button variant="outline" size="sm" onClick={onClose}>
            Back to Home
          </Button>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Pending</p>
                <p className="text-2xl font-bold">{pendingCount}</p>
              </div>
              <Clock className="h-8 w-8 text-warning" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Approved</p>
                <p className="text-2xl font-bold">{approvedCount}</p>
              </div>
              <CheckCircle className="h-8 w-8 text-primary" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Published</p>
                <p className="text-2xl font-bold">{posts?.filter(p => p.status === 'published').length || 0}</p>
              </div>
              <Check className="h-8 w-8 text-success" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total</p>
                <p className="text-2xl font-bold">{posts?.length || 0}</p>
              </div>
              <Share2 className="h-8 w-8 text-pink-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-4">
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Posts</SelectItem>
            <SelectItem value="pending">Pending Review</SelectItem>
            <SelectItem value="approved">Approved</SelectItem>
            <SelectItem value="ready_to_post">Ready to Post</SelectItem>
            <SelectItem value="published">Published</SelectItem>
            <SelectItem value="rejected">Rejected</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Posts List */}
      {isLoading ? (
        <div className="text-center py-12 text-muted-foreground">Loading...</div>
      ) : posts?.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <CalendarIcon className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Scheduled Posts</h3>
            <p className="text-muted-foreground">
              Use Single Post or Batch Posts to create scheduled content.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {posts?.map((post) => (
            <Card key={post.id} className="hover:shadow-md transition-shadow">
              <CardContent className="py-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2 flex-wrap">
                      {getStatusBadge(post.status)}
                      <Badge variant="outline" className={`text-xs ${post.batch_id ? 'border-pink-500/30 bg-pink-500/10 text-pink-600' : 'border-blue-500/30 bg-blue-500/10 text-cyan-400'}`}>
                        {post.batch_id ? 'Batch' : 'Single'}
                      </Badge>
                      {post.ai_research_used && (
                        <Badge variant="outline" className="text-xs">
                          <Search className="h-3 w-3 mr-1" />
                          Tavily
                        </Badge>
                      )}
                      {post.platforms.map(p => {
                        const Icon = PLATFORM_ICONS[p];
                        return Icon ? (
                          <Badge key={p} variant="secondary" className="text-xs">
                            <Icon className="h-3 w-3 mr-1" />
                            {p}
                          </Badge>
                        ) : null;
                      })}
                    </div>
                    <h3 className="font-semibold truncate">{post.topic}</h3>
                    {post.keywords && post.keywords.length > 0 && (
                      <p className="text-sm text-muted-foreground truncate">
                        Keywords: {post.keywords.join(', ')}
                      </p>
                    )}
                  </div>
                  
                  <div className="flex flex-col items-end gap-2">
                    <div className="text-right">
                      <p className="text-sm font-medium">
                        {format(parseISO(post.scheduled_for), 'MMM d, yyyy')}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {format(parseISO(post.scheduled_for), 'h:mm a')}
                      </p>
                    </div>
                    
                    <div className="flex gap-1">
                      <Button 
                        size="sm" 
                        variant="ghost"
                        onClick={() => openPreview(post)}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      
                      {post.status !== 'published' && (
                        <>
                          <Button 
                            size="sm" 
                            variant="ghost"
                            onClick={() => openEdit(post)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          
                          {post.status === 'pending' && (
                            <>
                              <Button 
                                size="sm" 
                                variant="ghost"
                                className="text-success hover:text-success"
                                onClick={() => approveMutation.mutate(post.id)}
                              >
                                <Check className="h-4 w-4" />
                              </Button>
                              <Button 
                                size="sm" 
                                variant="ghost"
                                className="text-destructive"
                                onClick={() => rejectMutation.mutate(post.id)}
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            </>
                          )}
                          
                          {(post.status === 'approved' || post.status === 'ready_to_post') && (
                            <Button 
                              size="sm" 
                              variant="default"
                              onClick={() => {
                                setBridgePost(post);
                                setIsBridgeOpen(true);
                              }}
                              className="bg-gradient-to-r from-pink-500 to-purple-500 text-white gap-1"
                            >
                              <ExternalLink className="h-3 w-3" />
                              Post This →
                            </Button>
                          )}
                          
                          <Button 
                            size="sm" 
                            variant="ghost"
                            className="text-destructive"
                            onClick={() => {
                              if (confirm('Delete this scheduled post?')) {
                                deleteMutation.mutate(post.id);
                              }
                            }}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Preview Dialog */}
      <Dialog open={isPreviewOpen} onOpenChange={setIsPreviewOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Preview: {selectedPost?.topic}</DialogTitle>
          </DialogHeader>
          {selectedPost && (
            <div className="space-y-4">
              <div className="flex gap-2 flex-wrap">
                {getStatusBadge(selectedPost.status)}
                <Badge variant="outline">
                  Scheduled: {format(parseISO(selectedPost.scheduled_for), 'PPP')}
                </Badge>
              </div>
              
              <Tabs defaultValue={selectedPost.platforms[0]} className="w-full">
                <TabsList className="grid w-full" style={{ gridTemplateColumns: `repeat(${selectedPost.platforms.length}, 1fr)` }}>
                  {selectedPost.platforms.map(platform => {
                    const Icon = PLATFORM_ICONS[platform];
                    return (
                      <TabsTrigger key={platform} value={platform} className="flex items-center gap-1">
                        {Icon && <Icon className="h-4 w-4" />}
                        {platform}
                      </TabsTrigger>
                    );
                  })}
                </TabsList>
                {selectedPost.platforms.map(platform => {
                  const content = selectedPost.content_json[platform];
                  const limit = PLATFORM_LIMITS[platform] || 2000;
                  return (
                    <TabsContent key={platform} value={platform} className="space-y-3">
                      <div className="border rounded-lg p-4 bg-muted/30">
                        <p className="whitespace-pre-wrap">{content?.content || 'No content'}</p>
                      </div>
                      {content?.hashtags && content.hashtags.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          {content.hashtags.map((tag, i) => (
                            <Badge key={i} variant="secondary" className="text-xs">
                              #{tag}
                            </Badge>
                          ))}
                        </div>
                      )}
                      <p className="text-xs text-muted-foreground">
                        {content?.characterCount || 0} / {limit} characters
                      </p>
                    </TabsContent>
                  );
                })}
              </Tabs>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Edit Form */}
      <FormShell
        id="social-edit-scheduled-post"
        title="Edit Scheduled Post"
        open={isEditOpen}
        onOpenChange={setIsEditOpen}
        className="max-w-2xl max-h-[90vh] overflow-y-auto"
      >
          {editData && selectedPost && (
            <div className="space-y-4">
              <div>
                <Label>Topic</Label>
                <Input
                  value={editData.topic}
                  onChange={(e) => setEditData({ ...editData, topic: e.target.value })}
                />
              </div>
              
              <div>
                <Label>Scheduled Date</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-full justify-start text-left">
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {format(editData.scheduled_for, 'PPP')}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={editData.scheduled_for}
                      onSelect={(date) => date && setEditData({ ...editData, scheduled_for: date })}
                      disabled={(date) => date < new Date()}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>

              <Tabs value={editPlatform} onValueChange={setEditPlatform} className="w-full">
                <TabsList className="grid w-full" style={{ gridTemplateColumns: `repeat(${selectedPost.platforms.length}, 1fr)` }}>
                  {selectedPost.platforms.map(platform => {
                    const Icon = PLATFORM_ICONS[platform];
                    return (
                      <TabsTrigger key={platform} value={platform} className="flex items-center gap-1">
                        {Icon && <Icon className="h-4 w-4" />}
                        {platform}
                      </TabsTrigger>
                    );
                  })}
                </TabsList>
                {selectedPost.platforms.map(platform => {
                  const content = editData.content_json[platform];
                  const limit = PLATFORM_LIMITS[platform] || 2000;
                  return (
                    <TabsContent key={platform} value={platform} className="space-y-3">
                      <div>
                        <Label>Content</Label>
                        <Textarea
                          value={content?.content || ''}
                          onChange={(e) => updatePlatformContent(platform, 'content', e.target.value)}
                          rows={6}
                          maxLength={limit}
                        />
                        <p className="text-xs text-muted-foreground mt-1">
                          {content?.characterCount || 0} / {limit} characters
                        </p>
                      </div>
                      <div>
                        <Label>Hashtags (comma separated)</Label>
                        <Input
                          value={content?.hashtags?.join(', ') || ''}
                          onChange={(e) => updatePlatformContent(
                            platform, 
                            'hashtags', 
                            e.target.value.split(',').map(t => t.trim()).filter(Boolean)
                          )}
                          placeholder="hashtag1, hashtag2"
                        />
                      </div>
                    </TabsContent>
                  );
                })}
              </Tabs>
            </div>
          )}
          <div className="flex justify-end gap-2 pt-4">
            <Button variant="outline" onClick={() => setIsEditOpen(false)}>
              Cancel
            </Button>
            <Button 
              onClick={() => selectedPost && updateMutation.mutate({ postId: selectedPost.id, data: editData })}
              disabled={updateMutation.isPending}
            >
              Save Changes
            </Button>
          </div>
      </FormShell>

      {/* Publish Bridge Dialog */}
      {bridgePost && (
        <SocialPublishBridge
          open={isBridgeOpen}
          onOpenChange={(open) => {
            setIsBridgeOpen(open);
            if (!open) setBridgePost(null);
          }}
          postId={bridgePost.id}
          topic={bridgePost.topic}
          platforms={bridgePost.platforms as any}
          contentJson={bridgePost.content_json}
          imageUrl={bridgePost.image_url}
        />
      )}
    </div>
  );
}
