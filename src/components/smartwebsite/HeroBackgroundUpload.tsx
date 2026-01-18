import { useState, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { 
  Image as ImageIcon, 
  Upload, 
  X, 
  Loader2,
  AlertTriangle
} from 'lucide-react';

const MAX_WIDTH = 1920;
const MAX_SIZE_MB = 5;

interface HeroBackgroundUploadProps {
  backgroundUrl: string | null;
  companyId: string;
  onUpdate: (url: string | null) => void;
  isUpdating: boolean;
}

export function HeroBackgroundUpload({ 
  backgroundUrl, 
  companyId, 
  onUpdate, 
  isUpdating 
}: HeroBackgroundUploadProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [isRemoving, setIsRemoving] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const validateAndResizeImage = (file: File): Promise<Blob> => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.src = URL.createObjectURL(file);
      
      img.onload = () => {
        URL.revokeObjectURL(img.src);
        
        // If image is within limits, use original
        if (img.width <= MAX_WIDTH) {
          resolve(file);
          return;
        }

        // Resize image
        const canvas = document.createElement('canvas');
        const ratio = MAX_WIDTH / img.width;
        canvas.width = MAX_WIDTH;
        canvas.height = img.height * ratio;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Could not get canvas context'));
          return;
        }

        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

        canvas.toBlob(
          (blob) => {
            if (blob) {
              resolve(blob);
            } else {
              reject(new Error('Failed to resize image'));
            }
          },
          file.type,
          0.9
        );
      };

      img.onerror = () => {
        URL.revokeObjectURL(img.src);
        reject(new Error('Failed to load image'));
      };
    });
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      toast.error('Please upload a JPEG, PNG, or WebP image');
      return;
    }

    // Validate file size
    if (file.size > MAX_SIZE_MB * 1024 * 1024) {
      toast.error(`Image must be less than ${MAX_SIZE_MB}MB`);
      return;
    }

    setIsUploading(true);

    try {
      // Validate and resize if needed
      const processedBlob = await validateAndResizeImage(file);

      // Delete existing background if present
      if (backgroundUrl) {
        const existingPath = backgroundUrl.split('/smart-website-images/')[1];
        if (existingPath) {
          await supabase.storage
            .from('smart-website-images')
            .remove([existingPath]);
        }
      }

      const fileName = `${companyId}/hero-background-${Date.now()}.${file.name.split('.').pop()}`;
      
      const { error: uploadError } = await supabase.storage
        .from('smart-website-images')
        .upload(fileName, processedBlob);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('smart-website-images')
        .getPublicUrl(fileName);

      onUpdate(publicUrl);
      toast.success('Hero background updated');
    } catch (error: any) {
      toast.error(error.message || 'Failed to upload image');
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleRemove = async () => {
    if (!backgroundUrl) return;

    setIsRemoving(true);

    try {
      const path = backgroundUrl.split('/smart-website-images/')[1];
      if (path) {
        await supabase.storage
          .from('smart-website-images')
          .remove([path]);
      }

      onUpdate(null);
      toast.success('Background removed');
    } catch (error: any) {
      toast.error(error.message || 'Failed to remove background');
    } finally {
      setIsRemoving(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ImageIcon className="w-5 h-5" />
          Hero Background
        </CardTitle>
        <CardDescription>
          Add a background image to your hero section (max {MAX_WIDTH}px width, auto-resized)
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Current Background Preview */}
        <div className="space-y-2">
          <Label>Current Background</Label>
          <div className="relative border rounded-lg overflow-hidden bg-muted aspect-[21/9]">
            {backgroundUrl ? (
              <>
                <img
                  src={backgroundUrl}
                  alt="Hero background"
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={handleRemove}
                    disabled={isRemoving}
                  >
                    {isRemoving ? (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <X className="w-4 h-4 mr-2" />
                    )}
                    Remove
                  </Button>
                </div>
              </>
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center text-muted-foreground">
                <ImageIcon className="w-12 h-12 mb-2 opacity-50" />
                <p className="text-sm">No background image</p>
              </div>
            )}
          </div>
        </div>

        {/* Upload Info */}
        <div className="flex items-center gap-2 p-3 bg-muted/50 rounded-lg text-sm text-muted-foreground">
          <AlertTriangle className="w-4 h-4 flex-shrink-0" />
          <span>Images wider than {MAX_WIDTH}px will be automatically resized</span>
        </div>

        {/* Upload Button */}
        <div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            onChange={handleFileSelect}
            className="hidden"
          />
          <Button
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading || isUpdating}
            variant="outline"
          >
            {isUploading ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Upload className="w-4 h-4 mr-2" />
            )}
            {backgroundUrl ? 'Replace Background' : 'Upload Background'}
          </Button>
          <p className="text-xs text-muted-foreground mt-2">
            JPEG, PNG, or WebP • Max {MAX_SIZE_MB}MB • Max {MAX_WIDTH}px width
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
