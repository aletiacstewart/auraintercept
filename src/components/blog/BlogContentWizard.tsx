import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { toast } from 'sonner';
import { Sparkles, Loader2, ArrowLeft, ArrowRight, Check, Search } from 'lucide-react';
import { BlogTopicInput } from './BlogTopicInput';
import { BlogPreview } from './BlogPreview';

interface BlogContentWizardProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: (data: {
    title: string;
    slug: string;
    excerpt: string;
    content: string;
  }) => void;
}

interface GeneratedBlog {
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  featuredImageDescription?: string;
  usedTavily?: boolean;
}

export function BlogContentWizard({ open, onOpenChange, onSuccess }: BlogContentWizardProps) {
  const { companyId } = useAuth();
  const [step, setStep] = useState(1);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationPhase, setGenerationPhase] = useState('');
  
  // Form state
  const [topic, setTopic] = useState('');
  const [keywords, setKeywords] = useState('');
  const [tone, setTone] = useState('professional');
  const [wordCount, setWordCount] = useState('1000');
  
  // Generated content state
  const [generatedBlog, setGeneratedBlog] = useState<GeneratedBlog | null>(null);

  // Check if Tavily is configured
  const { data: hasTavily } = useQuery({
    queryKey: ['tavily-configured', companyId],
    queryFn: async () => {
      if (!companyId) return false;
      const { data } = await supabase
        .from('tenant_integrations')
        .select('tavily_api_key')
        .eq('company_id', companyId)
        .single();
      return !!data?.tavily_api_key;
    },
    enabled: !!companyId,
  });

  // Fetch company info for context
  const { data: company } = useQuery({
    queryKey: ['company-info', companyId],
    queryFn: async () => {
      if (!companyId) return null;
      const { data } = await supabase
        .from('companies')
        .select('name, service_categories')
        .eq('id', companyId)
        .single();
      return data;
    },
    enabled: !!companyId,
  });

  const handleGenerate = async () => {
    if (!topic.trim()) {
      toast.error('Please enter a topic');
      return;
    }

    setIsGenerating(true);
    setStep(2);

    try {
      if (hasTavily) {
        setGenerationPhase('Researching current trends...');
        await new Promise(resolve => setTimeout(resolve, 500));
      }
      
      setGenerationPhase('Generating blog content...');

      const { data, error } = await supabase.functions.invoke('generate-blog-content', {
        body: {
          topic,
          keywords: keywords.split(',').map(k => k.trim()).filter(Boolean),
          tone,
          wordCount: parseInt(wordCount),
          companyId,
          companyName: company?.name,
          industry: company?.service_categories?.[0],
        },
      });

      if (error) throw error;

      if (data?.title && data?.content) {
        setGeneratedBlog({
          title: data.title,
          slug: data.slug,
          excerpt: data.excerpt,
          content: data.content,
          featuredImageDescription: data.featuredImageDescription,
          usedTavily: data.usedTavily,
        });
        setStep(3);
        toast.success('Blog content generated!');
      } else {
        throw new Error('Invalid response from AI');
      }
    } catch (error) {
      console.error('Generation error:', error);
      toast.error('Failed to generate content. Please try again.');
      setStep(1);
    } finally {
      setIsGenerating(false);
      setGenerationPhase('');
    }
  };

  const handleSave = () => {
    if (generatedBlog) {
      onSuccess({
        title: generatedBlog.title,
        slug: generatedBlog.slug,
        excerpt: generatedBlog.excerpt,
        content: generatedBlog.content,
      });
      handleClose();
    }
  };

  const handleClose = () => {
    setStep(1);
    setTopic('');
    setKeywords('');
    setTone('professional');
    setWordCount('1000');
    setGeneratedBlog(null);
    onOpenChange(false);
  };

  const getStepTitle = () => {
    switch (step) {
      case 1: return 'Topic & Settings';
      case 2: return 'Generating Content';
      case 3: return 'Review & Edit';
      default: return '';
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            AI Blog Generator
            <span className="text-sm font-normal text-muted-foreground ml-auto">
              Step {step} of 3: {getStepTitle()}
            </span>
          </DialogTitle>
        </DialogHeader>

        <Progress value={(step / 3) * 100} className="h-1" />

        {/* Step 1: Topic Input */}
        {step === 1 && (
          <div className="space-y-4 py-4">
            <BlogTopicInput
              topic={topic}
              keywords={keywords}
              tone={tone}
              wordCount={wordCount}
              hasTavily={!!hasTavily}
              onTopicChange={setTopic}
              onKeywordsChange={setKeywords}
              onToneChange={setTone}
              onWordCountChange={setWordCount}
            />

            <div className="flex justify-end gap-2 pt-4">
              <Button variant="outline" onClick={handleClose}>
                Cancel
              </Button>
              <Button onClick={handleGenerate} disabled={!topic.trim()}>
                Generate Blog
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </div>
          </div>
        )}

        {/* Step 2: Generating */}
        {step === 2 && (
          <div className="flex flex-col items-center justify-center py-12 space-y-4">
            <div className="relative">
              <Loader2 className="h-12 w-12 animate-spin text-primary" />
              {hasTavily && generationPhase.includes('Research') && (
                <Search className="h-5 w-5 absolute -top-1 -right-1 text-primary animate-pulse" />
              )}
            </div>
            <p className="text-lg font-medium">{generationPhase || 'Preparing...'}</p>
            <p className="text-sm text-muted-foreground text-center max-w-md">
              {hasTavily 
                ? 'AI is researching current trends and crafting your blog article...'
                : 'AI is crafting your blog article...'}
            </p>
          </div>
        )}

        {/* Step 3: Preview & Edit */}
        {step === 3 && generatedBlog && (
          <div className="space-y-4 py-4">
            <BlogPreview
              title={generatedBlog.title}
              slug={generatedBlog.slug}
              excerpt={generatedBlog.excerpt}
              content={generatedBlog.content}
              featuredImageDescription={generatedBlog.featuredImageDescription}
              usedTavily={generatedBlog.usedTavily}
              onTitleChange={(v) => setGeneratedBlog({ ...generatedBlog, title: v })}
              onSlugChange={(v) => setGeneratedBlog({ ...generatedBlog, slug: v })}
              onExcerptChange={(v) => setGeneratedBlog({ ...generatedBlog, excerpt: v })}
              onContentChange={(v) => setGeneratedBlog({ ...generatedBlog, content: v })}
            />

            <div className="flex justify-between gap-2 pt-4">
              <Button variant="outline" onClick={() => setStep(1)}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Start Over
              </Button>
              <div className="flex gap-2">
                <Button variant="outline" onClick={handleClose}>
                  Cancel
                </Button>
                <Button onClick={handleSave}>
                  <Check className="h-4 w-4 mr-2" />
                  Use This Content
                </Button>
              </div>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
