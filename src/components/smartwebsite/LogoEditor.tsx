import { useState, useRef, useCallback, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { 
  Image as ImageIcon, 
  Crop as CropIcon, 
  Upload, 
  Loader2,
  Square,
  RectangleHorizontal,
  Sparkles,
  Blend,
  ChevronDown
} from 'lucide-react';
import ReactCrop, { Crop, PixelCrop, centerCrop, makeAspectCrop } from 'react-image-crop';
import 'react-image-crop/dist/ReactCrop.css';

interface LogoEditorProps {
  logoUrl: string | null;
  companyId: string;
  onUpdate: (logoUrl: string) => void;
  transparencyMode: 'none' | 'multiply' | 'contrast';
  onTransparencyChange: (mode: 'none' | 'multiply' | 'contrast') => void;
  isUpdating: boolean;
}

function centerAspectCrop(
  mediaWidth: number,
  mediaHeight: number,
  aspect: number
) {
  return centerCrop(
    makeAspectCrop(
      {
        unit: '%',
        width: 90,
      },
      aspect,
      mediaWidth,
      mediaHeight
    ),
    mediaWidth,
    mediaHeight
  );
}

export function LogoEditor({ 
  logoUrl, 
  companyId, 
  onUpdate, 
  transparencyMode,
  onTransparencyChange,
  isUpdating 
}: LogoEditorProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [isCropping, setIsCropping] = useState(false);
  const [isSavingCrop, setIsSavingCrop] = useState(false);
  const [tempImageUrl, setTempImageUrl] = useState<string | null>(null);
  const [crop, setCrop] = useState<Crop>();
  const [completedCrop, setCompletedCrop] = useState<PixelCrop>();
  const [aspect, setAspect] = useState<number | undefined>(undefined);
  const [scale, setScale] = useState(1);
  const imgRef = useRef<HTMLImageElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const onImageLoad = useCallback((e: React.SyntheticEvent<HTMLImageElement>) => {
    const { width, height } = e.currentTarget;
    if (aspect) {
      setCrop(centerAspectCrop(width, height, aspect));
    }
  }, [aspect]);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/svg+xml'];
    if (!allowedTypes.includes(file.type)) {
      toast.error('Please upload a JPEG, PNG, WebP, or SVG image');
      return;
    }

    // Validate file size (2MB max)
    if (file.size > 2 * 1024 * 1024) {
      toast.error('Image must be less than 2MB');
      return;
    }

    // Create temporary URL for cropping
    const url = URL.createObjectURL(file);
    setTempImageUrl(url);
    setIsCropping(true);
    setCrop(undefined);
    setCompletedCrop(undefined);
    setScale(1);
    setAspect(undefined);
  };

  const handleSaveCrop = async () => {
    if (!imgRef.current || !completedCrop) {
      toast.error('Please select a crop area');
      return;
    }

    setIsSavingCrop(true);

    try {
      const image = imgRef.current;
      const scaleX = image.naturalWidth / image.width;
      const scaleY = image.naturalHeight / image.height;

      const canvas = document.createElement('canvas');
      canvas.width = completedCrop.width * scaleX;
      canvas.height = completedCrop.height * scaleY;

      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('No 2d context');

      ctx.drawImage(
        image,
        completedCrop.x * scaleX,
        completedCrop.y * scaleY,
        completedCrop.width * scaleX,
        completedCrop.height * scaleY,
        0,
        0,
        canvas.width,
        canvas.height
      );

      // Convert to blob
      const blob = await new Promise<Blob>((resolve, reject) => {
        canvas.toBlob(
          (blob) => {
            if (blob) resolve(blob);
            else reject(new Error('Canvas to Blob failed'));
          },
          'image/png',
          0.95
        );
      });

      // Upload to storage
      const fileName = `${companyId}/logo-cropped-${Date.now()}.png`;
      
      const { error: uploadError } = await supabase.storage
        .from('smart-website-images')
        .upload(fileName, blob);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('smart-website-images')
        .getPublicUrl(fileName);

      onUpdate(publicUrl);
      setIsCropping(false);
      setTempImageUrl(null);
      toast.success('Logo cropped and saved');
    } catch (error: any) {
      toast.error(error.message || 'Failed to save cropped logo');
    } finally {
      setIsSavingCrop(false);
    }
  };

  const handleUploadWithoutCrop = async () => {
    if (!tempImageUrl) return;

    setIsSavingCrop(true);

    try {
      // Fetch the blob from temp URL and upload
      const response = await fetch(tempImageUrl);
      const blob = await response.blob();

      const fileName = `${companyId}/logo-${Date.now()}.png`;
      
      const { error: uploadError } = await supabase.storage
        .from('smart-website-images')
        .upload(fileName, blob);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('smart-website-images')
        .getPublicUrl(fileName);

      onUpdate(publicUrl);
      setIsCropping(false);
      setTempImageUrl(null);
      toast.success('Logo saved');
    } catch (error: any) {
      toast.error(error.message || 'Failed to save logo');
    } finally {
      setIsSavingCrop(false);
    }
  };

  // Cleanup temp URL on unmount
  useEffect(() => {
    return () => {
      if (tempImageUrl) {
        URL.revokeObjectURL(tempImageUrl);
      }
    };
  }, [tempImageUrl]);

  const getLogoStyle = () => {
    const style: React.CSSProperties = {};
    
    if (transparencyMode === 'contrast') {
      style.filter = 'contrast(150%) brightness(110%)';
    }
    if (transparencyMode === 'multiply') {
      style.mixBlendMode = 'multiply';
    }
    
    return style;
  };

  return (
    <>
      <Collapsible>
        <Card>
          <CollapsibleTrigger className="w-full">
            <CardHeader className="flex flex-row items-center justify-between">
              <div className="flex items-center gap-2">
                <CropIcon className="h-5 w-5 text-primary" />
                <div className="text-left">
                  <CardTitle className="text-lg">Logo Editor</CardTitle>
                  <CardDescription>Upload and crop your company logo</CardDescription>
                </div>
              </div>
              <ChevronDown className="h-5 w-5 text-card-foreground/70" />
            </CardHeader>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <CardContent className="pt-0 space-y-4">
              {/* Current Logo Preview */}
              <div className="space-y-3">
                <Label>Current Logo</Label>
                <div 
                  className="border rounded-lg p-4 bg-white flex items-center justify-center min-h-[120px]"
                  style={{ backgroundColor: transparencyMode === 'multiply' ? '#f5f5f5' : 'white' }}
                >
                  {logoUrl ? (
                    <img
                      src={logoUrl}
                      alt="Company logo"
                      className="max-h-24 max-w-full object-contain"
                      style={getLogoStyle()}
                    />
                  ) : (
                    <div className="text-center text-muted-foreground">
                      <ImageIcon className="w-12 h-12 mx-auto mb-2 opacity-50" />
                      <p className="text-sm">No logo uploaded</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Transparency Toggle */}
              {logoUrl && (
                <div className="space-y-3">
                  <Label>Background Transparency Effect</Label>
                  <p className="text-xs text-muted-foreground mb-2">
                    Apply visual effects to help remove white backgrounds from logos
                  </p>
                  <ToggleGroup
                    type="single"
                    value={transparencyMode}
                    onValueChange={(value) => value && onTransparencyChange(value as 'none' | 'multiply' | 'contrast')}
                    className="justify-start"
                  >
                    <ToggleGroupItem value="none" aria-label="Original">
                      <ImageIcon className="w-4 h-4 mr-1" />
                      Original
                    </ToggleGroupItem>
                    <ToggleGroupItem value="multiply" aria-label="Blend mode">
                      <Blend className="w-4 h-4 mr-1" />
                      Blend
                    </ToggleGroupItem>
                    <ToggleGroupItem value="contrast" aria-label="High contrast">
                      <Sparkles className="w-4 h-4 mr-1" />
                      Contrast
                    </ToggleGroupItem>
                  </ToggleGroup>
                </div>
              )}

              {/* Upload Button */}
              <div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/svg+xml"
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
                  {logoUrl ? 'Replace Logo' : 'Upload Logo'}
                </Button>
                <p className="text-xs text-muted-foreground mt-2">
                  JPEG, PNG, WebP, or SVG • Max 2MB
                </p>
              </div>
            </CardContent>
          </CollapsibleContent>
        </Card>
      </Collapsible>

      {/* Crop Dialog */}
      <Dialog open={isCropping} onOpenChange={(open) => {
        if (!open && tempImageUrl) {
          URL.revokeObjectURL(tempImageUrl);
          setTempImageUrl(null);
        }
        setIsCropping(open);
      }}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Crop Logo</DialogTitle>
            <DialogDescription>
              Adjust the crop area and click save to apply changes
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* Aspect Ratio Options */}
            <div className="space-y-2">
              <Label>Aspect Ratio</Label>
              <ToggleGroup
                type="single"
                value={aspect ? String(aspect) : 'free'}
                onValueChange={(value) => {
                  if (value === 'free') {
                    setAspect(undefined);
                  } else {
                    setAspect(Number(value));
                    if (imgRef.current) {
                      const { width, height } = imgRef.current;
                      setCrop(centerAspectCrop(width, height, Number(value)));
                    }
                  }
                }}
                className="justify-start"
              >
                <ToggleGroupItem value="free">
                  Free
                </ToggleGroupItem>
                <ToggleGroupItem value="1">
                  <Square className="w-4 h-4 mr-1" />
                  Square
                </ToggleGroupItem>
                <ToggleGroupItem value="1.7778">
                  <RectangleHorizontal className="w-4 h-4 mr-1" />
                  16:9
                </ToggleGroupItem>
                <ToggleGroupItem value="2">
                  <RectangleHorizontal className="w-4 h-4 mr-1" />
                  2:1
                </ToggleGroupItem>
              </ToggleGroup>
            </div>

            {/* Zoom Slider */}
            <div className="space-y-2">
              <Label>Zoom: {Math.round(scale * 100)}%</Label>
              <Slider
                value={[scale]}
                min={0.5}
                max={3}
                step={0.1}
                onValueChange={([value]) => setScale(value)}
              />
            </div>

            {/* Crop Area */}
            <div className="border rounded-lg overflow-hidden bg-gray-100 flex items-center justify-center min-h-[300px]">
              {tempImageUrl && (
                <ReactCrop
                  crop={crop}
                  onChange={(_, percentCrop) => setCrop(percentCrop)}
                  onComplete={(c) => setCompletedCrop(c)}
                  aspect={aspect}
                >
                  <img
                    ref={imgRef}
                    src={tempImageUrl}
                    alt="Crop preview"
                    onLoad={onImageLoad}
                    style={{ 
                      transform: `scale(${scale})`,
                      maxHeight: '400px',
                      transformOrigin: 'center'
                    }}
                  />
                </ReactCrop>
              )}
            </div>
          </div>

          <DialogFooter className="flex gap-2">
            <Button 
              variant="outline" 
              onClick={() => {
                if (tempImageUrl) {
                  URL.revokeObjectURL(tempImageUrl);
                  setTempImageUrl(null);
                }
                setIsCropping(false);
              }}
            >
              Cancel
            </Button>
            <Button
              variant="secondary"
              onClick={handleUploadWithoutCrop}
              disabled={isSavingCrop}
            >
              Use Original
            </Button>
            <Button
              onClick={handleSaveCrop}
              disabled={isSavingCrop || !completedCrop}
            >
              {isSavingCrop && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Apply Crop
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
