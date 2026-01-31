import { useState } from 'react';
import { Sparkles, RefreshCw, Wand2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
export type ContentType = 
  | 'hero_headline' | 'hero_subheadline' | 'cta_text'
  | 'night_headline' | 'night_subheadline' | 'emergency_cta'
  | 'about_header' | 'about_subheader' | 'about_paragraph'
  | 'holiday_headline' | 'holiday_subheadline'
  | 'service_name' | 'service_description'
  | 'email_subject' | 'email_heading' | 'email_message'
  | 'social_content'
  | 'blog_title' | 'blog_excerpt' | 'blog_content';

interface AIContentButtonProps {
  contentType: ContentType;
  existingContent?: string;
  onGenerate: (content: string) => void;
  context?: {
    companyName?: string;
    industry?: string;
    tone?: string;
    holidayName?: string;
    platform?: string;
    templateType?: string;
    serviceType?: string;
  };
  disabled?: boolean;
  size?: 'sm' | 'default';
}

export function AIContentButton({
  contentType,
  existingContent,
  onGenerate,
  context,
  disabled = false,
  size = 'sm',
}: AIContentButtonProps) {
  const [isLoading, setIsLoading] = useState(false);
  const { companyId } = useAuth();

  const handleAction = async (action: 'generate' | 'reword') => {
    if (action === 'reword' && !existingContent?.trim()) {
      toast.error('No content to reword');
      return;
    }

    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('generate-website-content', {
        body: {
          contentType,
          action,
          existingContent: existingContent?.trim(),
          context,
          companyId, // Pass companyId to fetch AI Content Profile
        },
      });

      if (error) throw error;

      if (data?.content) {
        onGenerate(data.content);
        toast.success(action === 'generate' ? 'Content generated!' : 'Content improved!');
      } else {
        throw new Error('No content returned');
      }
    } catch (error: any) {
      console.error('AI content generation error:', error);
      if (error?.message?.includes('429') || error?.context?.status === 429) {
        toast.error('Rate limit exceeded. Please try again in a moment.');
      } else if (error?.message?.includes('402') || error?.context?.status === 402) {
        toast.error('AI credits exhausted. Please add credits to continue.');
      } else {
        toast.error('Failed to generate content. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const hasContent = !!existingContent?.trim();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size={size === 'sm' ? 'icon' : 'default'}
          className={size === 'sm' ? 'h-7 w-7' : ''}
          disabled={disabled || isLoading}
          type="button"
        >
          {isLoading ? (
            <RefreshCw className="h-4 w-4 animate-spin text-primary" />
          ) : (
            <Sparkles className="h-4 w-4 text-primary" />
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        <DropdownMenuItem onClick={() => handleAction('generate')}>
          <Wand2 className="h-4 w-4 mr-2" />
          Generate New
        </DropdownMenuItem>
        <DropdownMenuItem 
          onClick={() => handleAction('reword')}
          disabled={!hasContent}
          className={!hasContent ? 'opacity-50 cursor-not-allowed' : ''}
        >
          <RefreshCw className="h-4 w-4 mr-2" />
          Reword / Improve
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
