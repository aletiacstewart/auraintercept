import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { ArrowLeft, Calendar, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { format } from 'date-fns';
import DOMPurify from 'dompurify';
import { FloatingChatWidget } from '@/components/landing/FloatingChatWidget';

interface BlogPost {
  id: string;
  title: string;
  slug: string;
  content: string;
  excerpt: string | null;
  featured_image_url: string | null;
  published_at: string | null;
  created_at: string;
  author_id: string;
}

interface WebsiteData {
  id: string;
  company_id: string;
  company_name: string;
  company_logo_url: string | null;
  primary_color: string | null;
  show_blog?: boolean | null;
}

export default function CompanyBlogPost() {
  const { subdomain, slug } = useParams<{ subdomain: string; slug: string }>();

  // Fetch website data
  const { data: website, isLoading: websiteLoading } = useQuery({
    queryKey: ['company-blog-website', subdomain],
    queryFn: async () => {
      const { data, error } = await supabase
        .rpc('get_website_public_data', { website_subdomain: subdomain });
      
      if (error) throw error;
      if (!data || data.length === 0) return null;
      
      return data[0] as WebsiteData;
    },
    enabled: !!subdomain,
  });

  // Fetch blog post
  const { data: post, isLoading: postLoading } = useQuery({
    queryKey: ['company-blog-post', slug, website?.company_id],
    queryFn: async () => {
      // Get profiles belonging to this company
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('id')
        .eq('company_id', website!.company_id);
      
      if (profilesError) throw profilesError;
      if (!profiles || profiles.length === 0) return null;
      
      const authorIds = profiles.map(p => p.id);
      
      // Fetch the blog post
      const { data: blogPost, error: postError } = await supabase
        .from('blog_posts')
        .select('*')
        .eq('slug', slug)
        .in('author_id', authorIds)
        .eq('published', true)
        .single();
      
      if (postError) throw postError;
      
      return blogPost as BlogPost;
    },
    enabled: !!slug && !!website?.company_id && website?.show_blog !== false,
  });

  // Fetch author
  const { data: author } = useQuery({
    queryKey: ['blog-post-author', post?.author_id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('full_name, avatar_url')
        .eq('id', post!.author_id)
        .single();
      
      if (error) throw error;
      return data;
    },
    enabled: !!post?.author_id,
  });

  const isLoading = websiteLoading || postLoading;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8">
          <Skeleton className="h-8 w-48 mb-8" />
          <Skeleton className="h-96 rounded-lg mb-8" />
          <Skeleton className="h-6 w-3/4 mb-4" />
          <Skeleton className="h-4 w-full mb-2" />
          <Skeleton className="h-4 w-full mb-2" />
          <Skeleton className="h-4 w-2/3" />
        </div>
      </div>
    );
  }

  if (!website || !post) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center p-8">
          <h1 className="text-2xl font-bold mb-2">Post Not Found</h1>
          <p className="text-muted-foreground mb-4">This blog post doesn't exist or isn't published yet.</p>
          {subdomain && (
            <Button asChild>
              <Link to={`/site/${subdomain}/blog`}>Back to Blog</Link>
            </Button>
          )}
        </div>
      </div>
    );
  }

  const primaryColor = website.primary_color || '#214ebb';

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-background/95 backdrop-blur border-b">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link to={`/site/${subdomain}`} className="flex items-center gap-3">
              {website.company_logo_url ? (
                <img 
                  src={website.company_logo_url} 
                  alt={website.company_name} 
                  className="h-10 w-auto object-contain"
                />
              ) : (
                <div 
                  className="h-10 w-10 rounded-lg flex items-center justify-center text-white font-bold"
                  style={{ backgroundColor: primaryColor }}
                >
                  {website.company_name.charAt(0)}
                </div>
              )}
              <span className="font-semibold text-lg">{website.company_name}</span>
            </Link>
          </div>
          <Button variant="ghost" asChild>
            <Link to={`/site/${subdomain}/blog`}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              All Posts
            </Link>
          </Button>
        </div>
      </header>

      {/* Article */}
      <article className="container mx-auto px-4 py-12">
        <div className="max-w-3xl mx-auto">
          {/* Featured Image */}
          {post.featured_image_url && (
            <div className="aspect-video rounded-xl overflow-hidden mb-8">
              <img 
                src={post.featured_image_url} 
                alt={post.title}
                className="w-full h-full object-cover"
              />
            </div>
          )}

          {/* Title & Meta */}
          <header className="mb-8">
            <h1 className="text-4xl md:text-5xl font-bold mb-4">{post.title}</h1>
            <div className="flex items-center gap-4 text-muted-foreground">
              {author?.full_name && (
                <span className="flex items-center gap-2">
                  <User className="w-4 h-4" />
                  {author.full_name}
                </span>
              )}
              <span className="flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                {format(new Date(post.published_at || post.created_at), 'MMMM d, yyyy')}
              </span>
            </div>
          </header>

          {/* Content */}
          <div 
            className="prose prose-lg dark:prose-invert max-w-none"
            dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(post.content) }}
          />

          {/* Back to Blog */}
          <div className="mt-12 pt-8 border-t">
            <Button variant="outline" asChild>
              <Link to={`/site/${subdomain}/blog`}>
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to All Posts
              </Link>
            </Button>
          </div>
        </div>
      </article>

      {/* Footer */}
      <footer className="border-t py-8">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
          <p>© {new Date().getFullYear()} {website.company_name}. All rights reserved.</p>
        </div>
      </footer>

      {/* Chat Widget */}
      <FloatingChatWidget
        websiteId={website.id}
        companyId={website.company_id}
        primaryColor={primaryColor}
      />
    </div>
  );
}
