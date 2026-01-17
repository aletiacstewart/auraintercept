import { useState, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';
import { Upload, X, Loader2, Image as ImageIcon } from 'lucide-react';

interface AboutSectionEditorProps {
  website: {
    id: string;
    show_about_section: boolean;
    about_image_url: string | null;
    about_header: string | null;
    about_subheader: string | null;
    about_paragraph: string | null;
  };
  companyId: string;
  onUpdate: (updates: any) => void;
  isUpdating: boolean;
}

const MAX_FILE_SIZE = 2 * 1024 * 1024; // 2MB
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

export function AboutSectionEditor({ website, companyId, onUpdate, isUpdating }: AboutSectionEditorProps) {
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!ALLOWED_TYPES.includes(file.type)) {
      toast.error('Please upload a JPG, PNG, or WEBP image');
      return;
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      toast.error('Image must be less than 2MB');
      return;
    }

    setIsUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const filePath = `${companyId}/about-image.${fileExt}`;

      // Delete existing image if any
      if (website.about_image_url) {
        const oldPath = website.about_image_url.split('/').slice(-2).join('/');
        await supabase.storage.from('smart-website-images').remove([oldPath]);
      }

      // Upload new image
      const { error: uploadError } = await supabase.storage
        .from('smart-website-images')
        .upload(filePath, file, { upsert: true });

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('smart-website-images')
        .getPublicUrl(filePath);

      // Update website with new image URL
      onUpdate({ about_image_url: publicUrl });
      toast.success('Image uploaded successfully');
    } catch (error: any) {
      console.error('Upload error:', error);
      toast.error(error.message || 'Failed to upload image');
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleRemoveImage = async () => {
    if (!website.about_image_url) return;

    try {
      const filePath = website.about_image_url.split('/').slice(-2).join('/');
      await supabase.storage.from('smart-website-images').remove([filePath]);
      onUpdate({ about_image_url: null });
      toast.success('Image removed');
    } catch (error: any) {
      console.error('Remove error:', error);
      toast.error(error.message || 'Failed to remove image');
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>About Section</CardTitle>
            <CardDescription>Add a two-column section with image and text below the hero</CardDescription>
          </div>
          <Switch
            checked={website.show_about_section}
            onCheckedChange={(checked) => onUpdate({ show_about_section: checked })}
            disabled={isUpdating}
          />
        </div>
      </CardHeader>

      {website.show_about_section && (
        <CardContent className="space-y-6">
          {/* Image Upload */}
          <div className="space-y-2">
            <Label>Section Image</Label>
            <div className="text-xs text-muted-foreground mb-2">
              Recommended: 600×400px (3:2 aspect ratio) • Max 2MB • JPG, PNG, or WEBP
            </div>

            {website.about_image_url ? (
              <div className="relative w-full max-w-sm">
                <img
                  src={website.about_image_url}
                  alt="About section"
                  className="w-full aspect-[3/2] object-cover rounded-lg border"
                />
                <Button
                  variant="destructive"
                  size="icon"
                  className="absolute top-2 right-2"
                  onClick={handleRemoveImage}
                  disabled={isUpdating}
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            ) : (
              <div
                className="w-full max-w-sm aspect-[3/2] border-2 border-dashed rounded-lg flex flex-col items-center justify-center gap-2 cursor-pointer hover:border-primary/50 transition-colors bg-muted/30"
                onClick={() => fileInputRef.current?.click()}
              >
                {isUploading ? (
                  <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
                ) : (
                  <>
                    <ImageIcon className="w-10 h-10 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">Click to upload image</span>
                  </>
                )}
              </div>
            )}

            <input
              ref={fileInputRef}
              type="file"
              accept=".jpg,.jpeg,.png,.webp"
              className="hidden"
              onChange={handleFileSelect}
              disabled={isUploading}
            />

            {!website.about_image_url && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading}
              >
                <Upload className="w-4 h-4 mr-2" />
                Upload Image
              </Button>
            )}
          </div>

          {/* Text Fields */}
          <div className="space-y-2">
            <Label>Header</Label>
            <Input
              defaultValue={website.about_header || ''}
              onBlur={(e) => onUpdate({ about_header: e.target.value })}
              placeholder="About Our Company"
              disabled={isUpdating}
            />
          </div>

          <div className="space-y-2">
            <Label>Sub-header</Label>
            <Input
              defaultValue={website.about_subheader || ''}
              onBlur={(e) => onUpdate({ about_subheader: e.target.value })}
              placeholder="Quality service since 2010"
              disabled={isUpdating}
            />
          </div>

          <div className="space-y-2">
            <Label>Paragraph</Label>
            <Textarea
              defaultValue={website.about_paragraph || ''}
              onBlur={(e) => onUpdate({ about_paragraph: e.target.value })}
              placeholder="Tell visitors about your company, your mission, and what makes you stand out..."
              rows={5}
              maxLength={750}
              disabled={isUpdating}
            />
            <p className="text-xs text-muted-foreground text-right">
              {website.about_paragraph?.length || 0} / 750 characters
            </p>
          </div>
        </CardContent>
      )}
    </Card>
  );
}
