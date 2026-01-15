import { useState, useRef } from 'react';
import { Bug, Lightbulb, Bot, HelpCircle, Loader2, Send, ImagePlus, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

type IssueType = 'user_reported' | 'feature_request' | 'ai_agent_error';

interface ReportIssueDialogProps {
  trigger?: React.ReactNode;
}

export function ReportIssueDialog({ trigger }: ReportIssueDialogProps) {
  const [open, setOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [issueType, setIssueType] = useState<IssueType>('user_reported');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [screenshot, setScreenshot] = useState<File | null>(null);
  const [screenshotPreview, setScreenshotPreview] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const { user, userRole } = useAuth();

  const issueTypes = [
    { value: 'user_reported', label: 'Bug Report', icon: Bug, description: 'Something is broken' },
    { value: 'feature_request', label: 'Feature Request', icon: Lightbulb, description: 'Suggest an improvement' },
    { value: 'ai_agent_error', label: 'AI Agent Issue', icon: Bot, description: 'AI not working correctly' },
  ] as const;

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast({
        title: 'Invalid file type',
        description: 'Please select an image file (PNG, JPG, etc.)',
        variant: 'destructive',
      });
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: 'File too large',
        description: 'Screenshot must be less than 5MB',
        variant: 'destructive',
      });
      return;
    }

    setScreenshot(file);
    
    // Create preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setScreenshotPreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const removeScreenshot = () => {
    setScreenshot(null);
    setScreenshotPreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const uploadScreenshot = async (): Promise<string | null> => {
    if (!screenshot || !user) return null;

    setIsUploading(true);
    try {
      const fileExt = screenshot.name.split('.').pop();
      const fileName = `${user.id}/${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('issue-screenshots')
        .upload(fileName, screenshot);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('issue-screenshots')
        .getPublicUrl(fileName);

      return publicUrl;
    } catch (error) {
      console.error('Screenshot upload failed:', error);
      toast({
        title: 'Upload failed',
        description: 'Could not upload screenshot. Report will be submitted without it.',
        variant: 'destructive',
      });
      return null;
    } finally {
      setIsUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      toast({
        title: 'Title required',
        description: 'Please provide a brief title for your report.',
        variant: 'destructive',
      });
      return;
    }

    setIsSubmitting(true);
    try {
      let companyId: string | null = null;
      
      if (user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('company_id')
          .eq('id', user.id)
          .single();
        companyId = profile?.company_id || null;
      }

      // Upload screenshot if present
      const screenshotUrl = await uploadScreenshot();

      const { error } = await supabase.from('platform_issues').insert({
        issue_type: issueType,
        severity: issueType === 'ai_agent_error' ? 'high' : 'medium',
        title: title.trim(),
        description: description.trim() || null,
        page_url: window.location.href,
        user_agent: navigator.userAgent,
        user_id: user?.id || null,
        company_id: companyId,
        user_role: userRole || null,
        metadata: {
          submitted_from: 'report_dialog',
          timestamp: new Date().toISOString(),
          screenshot_url: screenshotUrl,
        },
      });

      if (error) throw error;

      toast({
        title: 'Report submitted',
        description: 'Thank you! Our team will review your report.',
      });
      
      setOpen(false);
      setTitle('');
      setDescription('');
      setIssueType('user_reported');
      removeScreenshot();
    } catch (error) {
      console.error('Failed to submit report:', error);
      toast({
        title: 'Submission failed',
        description: 'Unable to submit your report. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline" size="sm">
            <HelpCircle className="mr-2 h-4 w-4" />
            Report Issue
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Report an Issue</DialogTitle>
          <DialogDescription>
            Help us improve by reporting bugs or suggesting features.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-3">
            <Label>Issue Type</Label>
            <RadioGroup
              value={issueType}
              onValueChange={(value) => setIssueType(value as IssueType)}
              className="grid grid-cols-3 gap-2"
            >
              {issueTypes.map(({ value, label, icon: Icon, description }) => (
                <label
                  key={value}
                  className={`flex flex-col items-center gap-1 p-3 rounded-lg border cursor-pointer transition-colors ${
                    issueType === value
                      ? 'border-primary bg-primary/5'
                      : 'border-border hover:border-primary/50'
                  }`}
                >
                  <RadioGroupItem value={value} className="sr-only" />
                  <Icon className={`h-5 w-5 ${issueType === value ? 'text-primary' : 'text-muted-foreground'}`} />
                  <span className="text-xs font-medium text-center">{label}</span>
                </label>
              ))}
            </RadioGroup>
          </div>

          <div className="space-y-2">
            <Label htmlFor="title">Title *</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Brief description of the issue"
              maxLength={200}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Details (optional)</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Steps to reproduce, expected behavior, or additional context..."
              rows={3}
              maxLength={2000}
            />
          </div>

          {/* Screenshot Upload */}
          <div className="space-y-2">
            <Label>Screenshot (optional)</Label>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileSelect}
              className="hidden"
            />
            
            {screenshotPreview ? (
              <div className="relative">
                <img
                  src={screenshotPreview}
                  alt="Screenshot preview"
                  className="w-full h-32 object-cover rounded-lg border border-border"
                />
                <Button
                  type="button"
                  variant="destructive"
                  size="icon"
                  className="absolute top-2 right-2 h-6 w-6"
                  onClick={removeScreenshot}
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
            ) : (
              <Button
                type="button"
                variant="outline"
                className="w-full h-20 border-dashed"
                onClick={() => fileInputRef.current?.click()}
              >
                <div className="flex flex-col items-center gap-1 text-muted-foreground">
                  <ImagePlus className="h-5 w-5" />
                  <span className="text-xs">Add screenshot</span>
                </div>
              </Button>
            )}
          </div>

          <div className="text-xs text-muted-foreground bg-muted p-2 rounded">
            Current page and browser info will be included automatically.
          </div>

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting || isUploading}>
              {isSubmitting || isUploading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Send className="mr-2 h-4 w-4" />
              )}
              {isUploading ? 'Uploading...' : 'Submit Report'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
