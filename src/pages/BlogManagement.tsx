import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { Plus, Edit, Trash2, Eye, EyeOff, FileText, Sparkles } from 'lucide-react';
import { format } from 'date-fns';
import { BlogContentWizard } from '@/components/blog/BlogContentWizard';
import { AIContentButton } from '@/components/ai/AIContentButton';
import { TavilyStatusBadge } from '@/components/ai/TavilyStatusBadge';

interface BlogPost {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  content: string;
  featured_image_url: string | null;
  published: boolean;
  published_at: string | null;
  created_at: string;
  updated_at: string;
  author_id: string;
}

export default function BlogManagement() {
  const { user, companyId } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isWizardOpen, setIsWizardOpen] = useState(false);
  const [editingPost, setEditingPost] = useState<BlogPost | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    slug: '',
    excerpt: '',
    content: '',
    featured_image_url: '',
    published: false,
  });

  const handleWizardSuccess = (data: { title: string; slug: string; excerpt: string; content: string }) => {
    setFormData({
      title: data.title,
      slug: data.slug,
      excerpt: data.excerpt,
      content: data.content,
      featured_image_url: '',
      published: false,
    });
    setEditingPost(null);
    setIsDialogOpen(true);
  };

  const { data: posts, isLoading } = useQuery({
    queryKey: ['blog-posts-admin'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('blog_posts')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as BlogPost[];
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const { error } = await supabase.from('blog_posts').insert({
        ...data,
        author_id: user?.id,
        published_at: data.published ? new Date().toISOString() : null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['blog-posts-admin'] });
      toast({ title: 'Success', description: 'Blog post created!' });
      resetForm();
    },
    onError: (error: Error) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: typeof formData }) => {
      const updateData: any = { ...data };
      if (data.published && !editingPost?.published_at) {
        updateData.published_at = new Date().toISOString();
      }
      
      const { error } = await supabase
        .from('blog_posts')
        .update(updateData)
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['blog-posts-admin'] });
      toast({ title: 'Success', description: 'Blog post updated!' });
      resetForm();
    },
    onError: (error: Error) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('blog_posts').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['blog-posts-admin'] });
      toast({ title: 'Success', description: 'Blog post deleted!' });
    },
    onError: (error: Error) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    },
  });

  const resetForm = () => {
    setFormData({
      title: '',
      slug: '',
      excerpt: '',
      content: '',
      featured_image_url: '',
      published: false,
    });
    setEditingPost(null);
    setIsDialogOpen(false);
  };

  const handleEdit = (post: BlogPost) => {
    setEditingPost(post);
    setFormData({
      title: post.title,
      slug: post.slug,
      excerpt: post.excerpt || '',
      content: post.content,
      featured_image_url: post.featured_image_url || '',
      published: post.published || false,
    });
    setIsDialogOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingPost) {
      updateMutation.mutate({ id: editingPost.id, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const generateSlug = (title: string) => {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <FileText className="h-6 w-6" />
              Blog Management
            </h1>
            <p className="text-muted-foreground">
              Create and manage blog articles for the public website.
            </p>
          </div>
          
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setIsWizardOpen(true)}>
              <Sparkles className="mr-2 h-4 w-4" />
              AI Generate
            </Button>
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button onClick={() => resetForm()}>
                  <Plus className="mr-2 h-4 w-4" />
                  New Post
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                <DialogTitle>
                  {editingPost ? 'Edit Post' : 'Create New Post'}
                </DialogTitle>
              </DialogHeader>
              
              <form onSubmit={handleSubmit} className="space-y-4">
                {companyId && (
                  <TavilyStatusBadge companyId={companyId} showDisconnected />
                )}
                
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <Label htmlFor="title">Title</Label>
                    <AIContentButton
                      contentType="blog_title"
                      existingContent={formData.title}
                      onGenerate={(content) => setFormData({ 
                        ...formData, 
                        title: content,
                        slug: editingPost ? formData.slug : generateSlug(content),
                      })}
                    />
                  </div>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => {
                      setFormData({ 
                        ...formData, 
                        title: e.target.value,
                        slug: editingPost ? formData.slug : generateSlug(e.target.value),
                      });
                    }}
                    placeholder="Article title"
                    required
                  />
                </div>
                
                <div>
                  <Label htmlFor="slug">URL Slug</Label>
                  <Input
                    id="slug"
                    value={formData.slug}
                    onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                    placeholder="article-url-slug"
                    required
                  />
                </div>
                
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <Label htmlFor="excerpt">Excerpt</Label>
                    <AIContentButton
                      contentType="blog_excerpt"
                      existingContent={formData.excerpt}
                      onGenerate={(content) => setFormData({ ...formData, excerpt: content })}
                    />
                  </div>
                  <Textarea
                    id="excerpt"
                    value={formData.excerpt}
                    onChange={(e) => setFormData({ ...formData, excerpt: e.target.value })}
                    placeholder="Brief summary of the article..."
                    rows={2}
                  />
                </div>
                
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <Label htmlFor="content">Content (HTML)</Label>
                    <AIContentButton
                      contentType="blog_content"
                      existingContent={formData.content}
                      onGenerate={(content) => setFormData({ ...formData, content: content })}
                    />
                  </div>
                  <Textarea
                    id="content"
                    value={formData.content}
                    onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                    placeholder="<p>Article content goes here...</p>"
                    rows={10}
                    required
                  />
                </div>
                
                <div>
                  <Label htmlFor="featured_image_url">Featured Image URL</Label>
                  <Input
                    id="featured_image_url"
                    value={formData.featured_image_url}
                    onChange={(e) => setFormData({ ...formData, featured_image_url: e.target.value })}
                    placeholder="https://example.com/image.jpg"
                  />
                </div>
                
                <div className="flex items-center space-x-2">
                  <Switch
                    id="published"
                    checked={formData.published}
                    onCheckedChange={(checked) => setFormData({ ...formData, published: checked })}
                  />
                  <Label htmlFor="published">Published</Label>
                </div>
                
                <div className="flex justify-end gap-2">
                  <Button type="button" variant="outline" onClick={resetForm}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending}>
                    {editingPost ? 'Update' : 'Create'}
                  </Button>
                </div>
              </form>
              </DialogContent>
            </Dialog>
          </div>

          <BlogContentWizard
            open={isWizardOpen}
            onOpenChange={setIsWizardOpen}
            onSuccess={handleWizardSuccess}
          />
        </div>

        {isLoading ? (
          <div className="text-center py-12 text-muted-foreground">Loading...</div>
        ) : posts?.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No Blog Posts</h3>
              <p className="text-muted-foreground mb-4">
                Create your first blog post to get started.
              </p>
              <Button onClick={() => setIsDialogOpen(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Create Post
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {posts?.map((post) => (
              <Card key={post.id}>
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-lg">{post.title}</CardTitle>
                      <p className="text-sm text-muted-foreground mt-1">
                        /{post.slug}
                      </p>
                    </div>
                    <Badge variant={post.published ? 'default' : 'secondary'}>
                      {post.published ? (
                        <><Eye className="h-3 w-3 mr-1" /> Published</>
                      ) : (
                        <><EyeOff className="h-3 w-3 mr-1" /> Draft</>
                      )}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  {post.excerpt && (
                    <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                      {post.excerpt}
                    </p>
                  )}
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">
                      Updated {format(new Date(post.updated_at), 'MMM d, yyyy')}
                    </span>
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline" onClick={() => handleEdit(post)}>
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button 
                        size="sm" 
                        variant="outline" 
                        className="text-destructive"
                        onClick={() => {
                          if (confirm('Are you sure you want to delete this post?')) {
                            deleteMutation.mutate(post.id);
                          }
                        }}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
