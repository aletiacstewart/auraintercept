import { useState, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { Camera, Upload, X, Image, Loader2 } from 'lucide-react';

interface JobPhotoUploadProps {
  jobId: string;
  beforePhotos: string[];
  afterPhotos: string[];
  onPhotosUpdated: (before: string[], after: string[]) => void;
}

export function JobPhotoUpload({ 
  jobId, 
  beforePhotos = [], 
  afterPhotos = [], 
  onPhotosUpdated 
}: JobPhotoUploadProps) {
  const [uploading, setUploading] = useState<'before' | 'after' | null>(null);
  const beforeInputRef = useRef<HTMLInputElement>(null);
  const afterInputRef = useRef<HTMLInputElement>(null);

  const handleUpload = async (files: FileList | null, type: 'before' | 'after') => {
    if (!files || files.length === 0) return;

    setUploading(type);
    const newUrls: string[] = [];

    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        
        // Validate file type
        if (!file.type.startsWith('image/')) {
          toast.error(`${file.name} is not an image`);
          continue;
        }

        // Validate file size (max 10MB)
        if (file.size > 10 * 1024 * 1024) {
          toast.error(`${file.name} is too large (max 10MB)`);
          continue;
        }

        const fileExt = file.name.split('.').pop();
        const fileName = `${jobId}/${type}/${Date.now()}-${i}.${fileExt}`;

        const { error: uploadError, data } = await supabase.storage
          .from('job-photos')
          .upload(fileName, file);

        if (uploadError) {
          console.error('Upload error:', uploadError);
          toast.error(`Failed to upload ${file.name}`);
          continue;
        }

        const { data: urlData } = supabase.storage
          .from('job-photos')
          .getPublicUrl(fileName);

        newUrls.push(urlData.publicUrl);
      }

      if (newUrls.length > 0) {
        const updatedBefore = type === 'before' ? [...beforePhotos, ...newUrls] : beforePhotos;
        const updatedAfter = type === 'after' ? [...afterPhotos, ...newUrls] : afterPhotos;

        // Update database
        const { error: updateError } = await supabase
          .from('job_assignments')
          .update({
            before_photos: updatedBefore,
            after_photos: updatedAfter,
          })
          .eq('id', jobId);

        if (updateError) {
          console.error('Update error:', updateError);
          toast.error('Failed to save photos');
        } else {
          onPhotosUpdated(updatedBefore, updatedAfter);
          toast.success(`${newUrls.length} photo(s) uploaded`);
        }
      }
    } catch (error) {
      console.error('Upload error:', error);
      toast.error('Failed to upload photos');
    } finally {
      setUploading(null);
    }
  };

  const handleRemovePhoto = async (url: string, type: 'before' | 'after') => {
    const updatedBefore = type === 'before' ? beforePhotos.filter(p => p !== url) : beforePhotos;
    const updatedAfter = type === 'after' ? afterPhotos.filter(p => p !== url) : afterPhotos;

    // Extract file path from URL to delete from storage
    try {
      const urlParts = url.split('/job-photos/');
      if (urlParts[1]) {
        await supabase.storage.from('job-photos').remove([urlParts[1]]);
      }
    } catch (e) {
      console.error('Failed to delete from storage:', e);
    }

    // Update database
    const { error } = await supabase
      .from('job_assignments')
      .update({
        before_photos: updatedBefore,
        after_photos: updatedAfter,
      })
      .eq('id', jobId);

    if (error) {
      toast.error('Failed to remove photo');
    } else {
      onPhotosUpdated(updatedBefore, updatedAfter);
      toast.success('Photo removed');
    }
  };

  return (
    <div className="space-y-4 p-3 bg-muted/30 rounded-lg border">
      <Label className="flex items-center gap-1 text-sm font-medium">
        <Camera className="w-4 h-4" />
        Job Photos
      </Label>

      {/* Before Photos */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
            Before Photos
          </span>
          <input
            ref={beforeInputRef}
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={(e) => handleUpload(e.target.files, 'before')}
          />
          <Button
            size="sm"
            variant="outline"
            onClick={() => beforeInputRef.current?.click()}
            disabled={uploading !== null}
          >
            {uploading === 'before' ? (
              <Loader2 className="w-4 h-4 mr-1 animate-spin" />
            ) : (
              <Upload className="w-4 h-4 mr-1" />
            )}
            Upload
          </Button>
        </div>
        
        {beforePhotos.length > 0 ? (
          <div className="grid grid-cols-3 gap-2">
            {beforePhotos.map((url, idx) => (
              <div key={idx} className="relative group aspect-square">
                <img
                  src={url}
                  alt={`Before ${idx + 1}`}
                  className="w-full h-full object-cover rounded-md"
                />
                <button
                  onClick={() => handleRemovePhoto(url, 'before')}
                  className="absolute top-1 right-1 bg-destructive text-destructive-foreground rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex items-center justify-center h-20 border border-dashed rounded-md text-muted-foreground text-xs">
            <Image className="w-4 h-4 mr-1" />
            No before photos
          </div>
        )}
      </div>

      {/* After Photos */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
            After Photos
          </span>
          <input
            ref={afterInputRef}
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={(e) => handleUpload(e.target.files, 'after')}
          />
          <Button
            size="sm"
            variant="outline"
            onClick={() => afterInputRef.current?.click()}
            disabled={uploading !== null}
          >
            {uploading === 'after' ? (
              <Loader2 className="w-4 h-4 mr-1 animate-spin" />
            ) : (
              <Upload className="w-4 h-4 mr-1" />
            )}
            Upload
          </Button>
        </div>
        
        {afterPhotos.length > 0 ? (
          <div className="grid grid-cols-3 gap-2">
            {afterPhotos.map((url, idx) => (
              <div key={idx} className="relative group aspect-square">
                <img
                  src={url}
                  alt={`After ${idx + 1}`}
                  className="w-full h-full object-cover rounded-md"
                />
                <button
                  onClick={() => handleRemovePhoto(url, 'after')}
                  className="absolute top-1 right-1 bg-destructive text-destructive-foreground rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex items-center justify-center h-20 border border-dashed rounded-md text-muted-foreground text-xs">
            <Image className="w-4 h-4 mr-1" />
            No after photos
          </div>
        )}
      </div>
    </div>
  );
}
