import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Eye, Code, Search } from 'lucide-react';
import DOMPurify from 'dompurify';

interface BlogPreviewProps {
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  featuredImageDescription?: string;
  usedTavily?: boolean;
  onTitleChange: (value: string) => void;
  onSlugChange: (value: string) => void;
  onExcerptChange: (value: string) => void;
  onContentChange: (value: string) => void;
}

export function BlogPreview({
  title,
  slug,
  excerpt,
  content,
  featuredImageDescription,
  usedTavily,
  onTitleChange,
  onSlugChange,
  onExcerptChange,
  onContentChange,
}: BlogPreviewProps) {
  const sanitizedContent = DOMPurify.sanitize(content);

  return (
    <div className="space-y-4">
      {usedTavily && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Search className="h-4 w-4 text-primary" />
          <span>Content enhanced with Tavily research</span>
        </div>
      )}

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="title">Title</Label>
          <Input
            id="title"
            value={title}
            onChange={(e) => onTitleChange(e.target.value)}
            placeholder="Article title"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="slug">URL Slug</Label>
          <Input
            id="slug"
            value={slug}
            onChange={(e) => onSlugChange(e.target.value)}
            placeholder="article-url-slug"
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="excerpt">Meta Description / Excerpt</Label>
        <Textarea
          id="excerpt"
          value={excerpt}
          onChange={(e) => onExcerptChange(e.target.value)}
          placeholder="Brief summary for SEO..."
          rows={2}
        />
        <p className="text-xs text-muted-foreground">
          {excerpt.length}/160 characters (recommended)
        </p>
      </div>

      {featuredImageDescription && (
        <div className="p-3 rounded-lg bg-muted/50 border">
          <Label className="text-xs text-muted-foreground">Suggested Featured Image</Label>
          <p className="text-sm mt-1">{featuredImageDescription}</p>
        </div>
      )}

      <Tabs defaultValue="preview" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="preview" className="gap-2">
            <Eye className="h-4 w-4" />
            Preview
          </TabsTrigger>
          <TabsTrigger value="html" className="gap-2">
            <Code className="h-4 w-4" />
            HTML
          </TabsTrigger>
        </TabsList>
        <TabsContent value="preview">
          <Card>
            <CardHeader className="pb-2">
              <h2 className="text-xl font-bold">{title || 'Article Title'}</h2>
              <p className="text-sm text-muted-foreground">/{slug || 'article-slug'}</p>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[300px] pr-4">
                <div 
                  className="prose prose-sm dark:prose-invert max-w-none"
                  dangerouslySetInnerHTML={{ __html: sanitizedContent }}
                />
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="html">
          <Textarea
            value={content}
            onChange={(e) => onContentChange(e.target.value)}
            className="font-mono text-xs h-[350px]"
            placeholder="<p>Article content...</p>"
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
