import { useState } from 'react';
import DOMPurify from 'dompurify';
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
  FileText,
  CheckCircle,
  XCircle,
  AlertCircle,
  Search
} from 'lucide-react';
import { format, parseISO } from 'date-fns';

interface ScheduledBlogPost {
  id: string;
  company_id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  content: string;
  featured_image_url: string | null;
  keywords: string[] | null;
  tone: string | null;
  scheduled_for: string;
  timezone: string;
  status: 'pending' | 'approved' | 'published' | 'rejected' | 'failed';
  batch_id: string | null;
  ai_research_used: boolean | null;
  publish_error: string | null;
  created_at: string;
  approved_at: string | null;
}

const STATUS_CONFIG = {
  pending: { label: 'Pending', color: 'bg-warning text-warning-foreground', icon: Clock },
  approved: { label: 'Approved', color: 'bg-primary text-primary-foreground', icon: CheckCircle },
  published: { label: 'Published', color: 'bg-success text-success-foreground', icon: Check },
  rejected: { label: 'Rejected', color: 'bg-destructive text-destructive-foreground', icon: XCircle },
  failed: { label: 'Failed', color: 'bg-destructive text-destructive-foreground', icon: AlertCircle },
};

export function BlogScheduleQueue() {
  const { companyId, user } = useAuth();
  const queryClient = useQueryClient();
  
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [selectedPost, setSelectedPost] = useState<ScheduledBlogPost | null>(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editData, setEditData] = useState<{
    title: string;
    slug: string;
    excerpt: string;
    content: string;
    scheduled_for: Date;
  } | null>(null);

  // Fetch scheduled posts
  const { data: posts, isLoading } = useQuery({
    queryKey: ['scheduled-blog-posts', companyId, filterStatus],
    queryFn: async () => {
      let query = supabase
        .from('scheduled_blog_posts')
        .select('*')
        .eq('company_id', companyId!)
        .order('scheduled_for', { ascending: true });
      
      if (filterStatus !== 'all') {
        query = query.eq('status', filterStatus);
      }
      
      const { data, error } = await query;
      if (error) throw error;
      return data as ScheduledBlogPost[];
    },
    enabled: !!companyId,
  });

  // Approve mutation
  const approveMutation = useMutation({
    mutationFn: async (postId: string) => {
      const { error } = await supabase
        .from('scheduled_blog_posts')
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
      queryClient.invalidateQueries({ queryKey: ['scheduled-blog-posts'] });
    },
    onError: () => toast.error('Failed to approve post'),
  });

  // Reject mutation
  const rejectMutation = useMutation({
    mutationFn: async (postId: string) => {
      const { error } = await supabase
        .from('scheduled_blog_posts')
        .update({ status: 'rejected' })
        .eq('id', postId);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Post rejected');
      queryClient.invalidateQueries({ queryKey: ['scheduled-blog-posts'] });
    },
    onError: () => toast.error('Failed to reject post'),
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async (postId: string) => {
      const { error } = await supabase
        .from('scheduled_blog_posts')
        .delete()
        .eq('id', postId);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Post deleted');
      queryClient.invalidateQueries({ queryKey: ['scheduled-blog-posts'] });
    },
    onError: () => toast.error('Failed to delete post'),
  });

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: async ({ postId, data }: { postId: string; data: typeof editData }) => {
      if (!data) return;
      const { error } = await supabase
        .from('scheduled_blog_posts')
        .update({
          title: data.title,
          slug: data.slug,
          excerpt: data.excerpt,
          content: data.content,
          scheduled_for: data.scheduled_for.toISOString(),
        })
        .eq('id', postId);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Post updated');
      queryClient.invalidateQueries({ queryKey: ['scheduled-blog-posts'] });
      setIsEditOpen(false);
      setSelectedPost(null);
      setEditData(null);
    },
    onError: () => toast.error('Failed to update post'),
  });

  // Publish now mutation
  const publishNowMutation = useMutation({
    mutationFn: async (post: ScheduledBlogPost) => {
      // Insert into blog_posts table
      const { error: insertError } = await supabase
        .from('blog_posts')
        .insert({
          title: post.title,
          slug: post.slug,
          excerpt: post.excerpt,
          content: post.content,
          featured_image_url: post.featured_image_url,
          author_id: user?.id,
          published: true,
          published_at: new Date().toISOString(),
        });
      
      if (insertError) throw insertError;
      
      // Update scheduled post status
      const { error: updateError } = await supabase
        .from('scheduled_blog_posts')
        .update({ 
          status: 'published',
          published_at: new Date().toISOString(),
        })
        .eq('id', post.id);
      
      if (updateError) throw updateError;
    },
    onSuccess: () => {
      toast.success('Post published successfully!');
      queryClient.invalidateQueries({ queryKey: ['scheduled-blog-posts'] });
      queryClient.invalidateQueries({ queryKey: ['blog-posts-admin'] });
    },
    onError: (error: any) => toast.error(error.message || 'Failed to publish post'),
  });

  const openPreview = (post: ScheduledBlogPost) => {
    setSelectedPost(post);
    setIsPreviewOpen(true);
  };

  const openEdit = (post: ScheduledBlogPost) => {
    setSelectedPost(post);
    setEditData({
      title: post.title,
      slug: post.slug,
      excerpt: post.excerpt || '',
      content: post.content,
      scheduled_for: parseISO(post.scheduled_for),
    });
    setIsEditOpen(true);
  };

  const getStatusBadge = (status: ScheduledBlogPost['status']) => {
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
      {/* Stats */}
      <div className="grid grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Pending Review</p>
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
                <p className="text-sm text-muted-foreground">Total Scheduled</p>
                <p className="text-2xl font-bold">{posts?.length || 0}</p>
              </div>
              <FileText className="h-8 w-8 text-primary" />
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
              Use the Batch Generator to create scheduled blog posts.
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
                    <div className="flex items-center gap-2 mb-2">
                      {getStatusBadge(post.status)}
                      {post.ai_research_used && (
                        <Badge variant="outline" className="text-xs">
                          <Search className="h-3 w-3 mr-1" />
                          Tavily Research
                        </Badge>
                      )}
                    </div>
                    <h3 className="font-semibold truncate">{post.title}</h3>
                    <p className="text-sm text-muted-foreground truncate">/{post.slug}</p>
                    {post.excerpt && (
                      <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                        {post.excerpt}
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
                          
                          {post.status === 'approved' && (
                            <Button 
                              size="sm" 
                              variant="default"
                              onClick={() => publishNowMutation.mutate(post)}
                            >
                              Publish Now
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
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Preview: {selectedPost?.title}</DialogTitle>
          </DialogHeader>
          {selectedPost && (
            <div className="space-y-4">
              <div className="flex gap-2">
                {getStatusBadge(selectedPost.status)}
                <Badge variant="outline">
                  Scheduled: {format(parseISO(selectedPost.scheduled_for), 'PPP')}
                </Badge>
              </div>
              
              {selectedPost.excerpt && (
                <div>
                  <Label className="text-xs text-muted-foreground">Meta Description</Label>
                  <p className="text-sm">{selectedPost.excerpt}</p>
                </div>
              )}
              
              <div className="border rounded-lg p-4">
                <article 
                  className="prose prose-sm max-w-none dark:prose-invert"
                  dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(selectedPost.content) }}
                />
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Scheduled Post</DialogTitle>
          </DialogHeader>
          {editData && selectedPost && (
            <div className="space-y-4">
              <div>
                <Label>Title</Label>
                <Input
                  value={editData.title}
                  onChange={(e) => setEditData({ ...editData, title: e.target.value })}
                />
              </div>
              <div>
                <Label>Slug</Label>
                <Input
                  value={editData.slug}
                  onChange={(e) => setEditData({ ...editData, slug: e.target.value })}
                />
              </div>
              <div>
                <Label>Excerpt</Label>
                <Textarea
                  value={editData.excerpt}
                  onChange={(e) => setEditData({ ...editData, excerpt: e.target.value })}
                  rows={2}
                />
              </div>
              <div>
                <Label>Scheduled Date</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-full justify-start">
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {format(editData.scheduled_for, 'PPP')}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={editData.scheduled_for}
                      onSelect={(date) => date && setEditData({ ...editData, scheduled_for: date })}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
              <div>
                <Label>Content (HTML)</Label>
                <Textarea
                  value={editData.content}
                  onChange={(e) => setEditData({ ...editData, content: e.target.value })}
                  rows={10}
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditOpen(false)}>Cancel</Button>
            <Button 
              onClick={() => selectedPost && updateMutation.mutate({ postId: selectedPost.id, data: editData })}
              disabled={updateMutation.isPending}
            >
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
