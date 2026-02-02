import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { ArrowLeft, Calendar, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { format } from 'date-fns';

interface BlogPost {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  featured_image_url: string | null;
  published_at: string | null;
  created_at: string;
  author: {
    full_name: string | null;
  } | null;
}

interface WebsiteData {
  id: string;
  company_id: string;
  company_name: string;
  company_logo_url: string | null;
  primary_color: string | null;
  show_blog?: boolean | null;
}

export default function CompanyBlog() {
  const { subdomain } = useParams<{ subdomain: string }>();

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

  // Fetch blog posts for this company
  const { data: posts, isLoading: postsLoading } = useQuery({
    queryKey: ['company-blog-posts', website?.company_id],
    queryFn: async () => {
      // Get profiles belonging to this company
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('id')
        .eq('company_id', website!.company_id);
      
      if (profilesError) throw profilesError;
      if (!profiles || profiles.length === 0) return [];
      
      const authorIds = profiles.map(p => p.id);
      
      // Fetch published blog posts by these authors
      const { data: blogPosts, error: postsError } = await supabase
        .from('blog_posts')
        .select(`
          id,
          title,
          slug,
          excerpt,
          featured_image_url,
          published_at,
          created_at,
          author_id
        `)
        .in('author_id', authorIds)
        .eq('published', true)
        .order('published_at', { ascending: false });
      
      if (postsError) throw postsError;
      
      // Get author names
      const postsWithAuthors = await Promise.all(
        (blogPosts || []).map(async (post) => {
          const { data: author } = await supabase
            .from('profiles')
            .select('full_name')
            .eq('id', post.author_id)
            .single();
          
          return {
            ...post,
            author: author || null,
          };
        })
      );
      
      return postsWithAuthors as BlogPost[];
    },
    enabled: !!website?.company_id && website?.show_blog !== false,
  });

  const isLoading = websiteLoading || postsLoading;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8">
          <Skeleton className="h-8 w-48 mb-8" />
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-64 rounded-lg" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!website) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center p-8">
          <h1 className="text-2xl font-bold mb-2">Blog Not Found</h1>
          <p className="text-muted-foreground">This blog doesn't exist or isn't published yet.</p>
        </div>
      </div>
    );
  }

  if (website.show_blog === false) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center p-8">
          <h1 className="text-2xl font-bold mb-2">Blog Not Available</h1>
          <p className="text-muted-foreground">This company's blog is not currently available.</p>
          <Button asChild className="mt-4">
            <Link to={`/site/${subdomain}`}>Back to Website</Link>
          </Button>
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
            <Link to={`/site/${subdomain}`}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Site
            </Link>
          </Button>
        </div>
      </header>

      {/* Blog Content */}
      <main className="container mx-auto px-4 py-12">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-4xl font-bold mb-2">Blog</h1>
          <p className="text-muted-foreground mb-10">
            Insights and updates from {website.company_name}
          </p>

          {posts && posts.length > 0 ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {posts.map((post) => (
                <Link key={post.id} to={`/site/${subdomain}/blog/${post.slug}`}>
                  <Card className="h-full hover:shadow-lg transition-shadow overflow-hidden group">
                    {post.featured_image_url && (
                      <div className="aspect-video overflow-hidden">
                        <img 
                          src={post.featured_image_url} 
                          alt={post.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      </div>
                    )}
                    <CardHeader>
                      <CardTitle className="line-clamp-2 group-hover:text-primary transition-colors">
                        {post.title}
                      </CardTitle>
                      {post.excerpt && (
                        <CardDescription className="line-clamp-3">
                          {post.excerpt}
                        </CardDescription>
                      )}
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        {post.author?.full_name && (
                          <span className="flex items-center gap-1">
                            <User className="w-3 h-3" />
                            {post.author.full_name}
                          </span>
                        )}
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {format(new Date(post.published_at || post.created_at), 'MMM d, yyyy')}
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          ) : (
            <Card className="text-center py-12">
              <CardContent>
                <p className="text-muted-foreground">No blog posts yet. Check back soon!</p>
              </CardContent>
            </Card>
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t py-8">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
          <p>© {new Date().getFullYear()} {website.company_name}. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
