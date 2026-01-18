import { useState, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { 
  Images, 
  Upload, 
  X, 
  AlertTriangle,
  Loader2,
  GripVertical
} from 'lucide-react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  rectSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

const MAX_GALLERY_IMAGES = 5;

interface GalleryManagerProps {
  galleryImages: string[];
  companyId: string;
  onUpdate: (images: string[]) => void;
  isUpdating: boolean;
}

interface SortableImageProps {
  url: string;
  index: number;
  onRemove: (url: string) => void;
  isRemoving: boolean;
}

function SortableImage({ url, index, onRemove, isRemoving }: SortableImageProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: url });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="relative group aspect-square rounded-lg overflow-hidden border bg-muted"
    >
      <img
        src={url}
        alt={`Gallery image ${index + 1}`}
        className="w-full h-full object-cover"
      />
      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors" />
      
      {/* Drag handle */}
      <button
        {...attributes}
        {...listeners}
        className="absolute top-2 left-2 p-1.5 bg-white/90 rounded-md opacity-0 group-hover:opacity-100 transition-opacity cursor-grab active:cursor-grabbing"
      >
        <GripVertical className="w-4 h-4 text-gray-600" />
      </button>
      
      {/* Remove button */}
      <button
        onClick={() => onRemove(url)}
        disabled={isRemoving}
        className="absolute top-2 right-2 p-1.5 bg-red-500 hover:bg-red-600 rounded-md opacity-0 group-hover:opacity-100 transition-opacity text-white disabled:opacity-50"
      >
        {isRemoving ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          <X className="w-4 h-4" />
        )}
      </button>
      
      {/* Index badge */}
      <div className="absolute bottom-2 left-2 px-2 py-0.5 bg-black/70 rounded text-white text-xs">
        {index + 1}
      </div>
    </div>
  );
}

export function GalleryManager({ 
  galleryImages, 
  companyId, 
  onUpdate, 
  isUpdating 
}: GalleryManagerProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [removingUrl, setRemovingUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      toast.error('Please upload a JPEG, PNG, or WebP image');
      return;
    }

    // Validate file size (2MB max)
    if (file.size > 2 * 1024 * 1024) {
      toast.error('Image must be less than 2MB');
      return;
    }

    setIsUploading(true);

    try {
      const fileName = `${companyId}/gallery-${Date.now()}.${file.name.split('.').pop()}`;
      
      const { error: uploadError } = await supabase.storage
        .from('smart-website-images')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('smart-website-images')
        .getPublicUrl(fileName);

      // FIFO Logic: if at max capacity, remove oldest image
      let newGallery = [...galleryImages];
      
      if (newGallery.length >= MAX_GALLERY_IMAGES) {
        const oldestUrl = newGallery[0];
        
        // Delete oldest from storage
        const oldestPath = oldestUrl.split('/smart-website-images/')[1];
        if (oldestPath) {
          await supabase.storage
            .from('smart-website-images')
            .remove([oldestPath]);
        }
        
        // Remove from array (FIFO - remove first)
        newGallery = newGallery.slice(1);
        toast.info('Oldest image replaced (5 image limit)');
      }

      // Add new image
      newGallery = [...newGallery, publicUrl];
      onUpdate(newGallery);
      toast.success('Image added to gallery');
    } catch (error: any) {
      toast.error(error.message || 'Failed to upload image');
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleRemove = async (url: string) => {
    setRemovingUrl(url);
    
    try {
      // Delete from storage
      const path = url.split('/smart-website-images/')[1];
      if (path) {
        await supabase.storage
          .from('smart-website-images')
          .remove([path]);
      }

      // Remove from gallery
      const newGallery = galleryImages.filter(img => img !== url);
      onUpdate(newGallery);
      toast.success('Image removed');
    } catch (error: any) {
      toast.error(error.message || 'Failed to remove image');
    } finally {
      setRemovingUrl(null);
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = galleryImages.findIndex(url => url === active.id);
      const newIndex = galleryImages.findIndex(url => url === over.id);
      
      const newGallery = arrayMove(galleryImages, oldIndex, newIndex);
      onUpdate(newGallery);
    }
  };

  const isAtCapacity = galleryImages.length >= MAX_GALLERY_IMAGES;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Images className="w-5 h-5" />
              Gallery Management
            </CardTitle>
            <CardDescription>
              Upload up to {MAX_GALLERY_IMAGES} images for your gallery section
            </CardDescription>
          </div>
          <Badge variant={isAtCapacity ? 'secondary' : 'outline'}>
            {galleryImages.length}/{MAX_GALLERY_IMAGES} Images
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* FIFO Warning */}
        {isAtCapacity && (
          <div className="flex items-center gap-2 p-3 bg-amber-50 border border-amber-200 rounded-lg text-amber-800 text-sm">
            <AlertTriangle className="w-4 h-4 flex-shrink-0" />
            <span>Gallery is full. Adding a new image will replace the oldest one.</span>
          </div>
        )}

        {/* Gallery Grid */}
        {galleryImages.length > 0 ? (
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext items={galleryImages} strategy={rectSortingStrategy}>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
                {galleryImages.map((url, index) => (
                  <SortableImage
                    key={url}
                    url={url}
                    index={index}
                    onRemove={handleRemove}
                    isRemoving={removingUrl === url}
                  />
                ))}
              </div>
            </SortableContext>
          </DndContext>
        ) : (
          <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-8 text-center">
            <Images className="w-12 h-12 mx-auto text-muted-foreground/50 mb-3" />
            <p className="text-muted-foreground">No gallery images yet</p>
            <p className="text-sm text-muted-foreground/70">Upload your first image below</p>
          </div>
        )}

        {/* Upload Button */}
        <div className="flex items-center gap-4">
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
            {isUploading ? 'Uploading...' : 'Add Image'}
          </Button>
          <p className="text-xs text-muted-foreground">
            JPEG, PNG, or WebP • Max 2MB • Drag to reorder
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
