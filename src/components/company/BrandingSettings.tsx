import { useState, useEffect, forwardRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import { Upload, Save, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { triggerSetupProgressRefresh } from '@/hooks/useSetupProgress';

const PRESET_COLORS = [
  { primary: '#0EA5E9', secondary: '#8B5CF6', name: 'Ocean Violet' },
  { primary: '#10B981', secondary: '#3B82F6', name: 'Nature Blue' },
  { primary: '#F59E0B', secondary: '#EF4444', name: 'Sunset' },
  { primary: '#EC4899', secondary: '#8B5CF6', name: 'Pink Purple' },
  { primary: '#14B8A6', secondary: '#06B6D4', name: 'Teal Cyan' },
  { primary: '#6366F1', secondary: '#A855F7', name: 'Indigo Purple' },
];

export const BrandingSettings = forwardRef<HTMLDivElement, object>(function BrandingSettings(_props, ref) {
  const { companyId } = useAuth();
  const queryClient = useQueryClient();
  const [uploading, setUploading] = useState(false);
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [primaryColor, setPrimaryColor] = useState('#0EA5E9');
  const [secondaryColor, setSecondaryColor] = useState('#8B5CF6');
  const [companyName, setCompanyName] = useState('');
  const [chatWidgetTitle, setChatWidgetTitle] = useState('AI Assistant');
  const [chatWidgetSubtitle, setChatWidgetSubtitle] = useState('Always available to help');

  // Fetch company data
  const { data: company, isLoading } = useQuery({
    queryKey: ['company', companyId],
    queryFn: async () => {
      if (!companyId) return null;
      const { data, error } = await supabase
        .from('companies')
        .select('*')
        .eq('id', companyId)
        .single();
      
      if (error) throw error;
      return data;
    },
    enabled: !!companyId,
  });

  // Update local state when company data loads
  useEffect(() => {
    if (company) {
      setLogoUrl(company.logo_url);
      setPrimaryColor(company.primary_color || '#0EA5E9');
      setSecondaryColor(company.secondary_color || '#8B5CF6');
      setCompanyName(company.name);
      setChatWidgetTitle((company as any).chat_widget_title || 'AI Assistant');
      setChatWidgetSubtitle((company as any).chat_widget_subtitle || 'Always available to help');
    }
  }, [company]);

  const updateMutation = useMutation({
    mutationFn: async () => {
      if (!companyId) throw new Error('No company ID');

      const { error } = await supabase
        .from('companies')
        .update({
          name: companyName,
          logo_url: logoUrl,
          primary_color: primaryColor,
          secondary_color: secondaryColor,
          chat_widget_title: chatWidgetTitle,
          chat_widget_subtitle: chatWidgetSubtitle,
        } as any)
        .eq('id', companyId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['company'] });
      toast.success('Branding updated successfully!');
      triggerSetupProgressRefresh();
    },
    onError: (error) => {
      console.error('Error updating branding:', error);
      toast.error('Failed to update branding');
    },
  });

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !companyId) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Please upload an image file');
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      toast.error('Image must be less than 2MB');
      return;
    }

    setUploading(true);

    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${companyId}/logo.${fileExt}`;

      await supabase.storage.from('company-logos').remove([fileName]);

      const { error: uploadError } = await supabase.storage
        .from('company-logos')
        .upload(fileName, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('company-logos')
        .getPublicUrl(fileName);

      setLogoUrl(`${publicUrl}?t=${Date.now()}`);
      toast.success('Logo uploaded successfully');
    } catch (error) {
      console.error('Error uploading logo:', error);
      toast.error('Failed to upload logo');
    } finally {
      setUploading(false);
    }
  };

  const handleRemoveLogo = () => {
    setLogoUrl(null);
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  return (
    <div ref={ref} className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Branding & Settings</h1>
        <p className="text-muted-foreground">
          Customize your company's appearance
        </p>
      </div>

      {/* Company Info */}
      <Card className="border-border/50">
        <CardHeader>
          <CardTitle>Company Information</CardTitle>
          <CardDescription>
            Basic details about your company
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="company-name">Company Name</Label>
            <Input
              id="company-name"
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
              placeholder="Your Company Name"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="chat-widget-title">Chat Widget Title</Label>
              <Input
                id="chat-widget-title"
                value={chatWidgetTitle}
                onChange={(e) => setChatWidgetTitle(e.target.value)}
                placeholder="e.g., Talk to Aura"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="chat-widget-subtitle">Chat Widget Subtitle</Label>
              <Input
                id="chat-widget-subtitle"
                value={chatWidgetSubtitle}
                onChange={(e) => setChatWidgetSubtitle(e.target.value)}
                placeholder="e.g., Always available to help"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Logo Upload */}
      <Card className="border-border/50">
        <CardHeader>
          <CardTitle>Logo</CardTitle>
          <CardDescription>
            Your logo appears on Talk to Aura and communications
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-start gap-6">
            <div
              className="w-24 h-24 rounded-2xl border-2 border-dashed border-border flex items-center justify-center overflow-hidden bg-muted/50 cursor-pointer hover:border-primary transition-colors flex-shrink-0"
              onClick={() => document.getElementById('logo-upload-settings')?.click()}
            >
              {logoUrl ? (
                <img src={logoUrl} alt="Logo" className="w-full h-full object-contain p-2" />
              ) : (
                <div className="text-center text-muted-foreground">
                  <Upload className="w-6 h-6 mx-auto mb-1" />
                  <span className="text-xs">Upload</span>
                </div>
              )}
            </div>
            <input
              id="logo-upload-settings"
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleLogoUpload}
              disabled={uploading}
            />
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">
                PNG, JPG or SVG. Max 2MB. Square aspect ratio recommended.
              </p>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => document.getElementById('logo-upload-settings')?.click()}
                  disabled={uploading}
                >
                  {uploading ? 'Uploading...' : 'Change Logo'}
                </Button>
                {logoUrl && (
                  <Button
                    size="sm"
                    variant="ghost"
                    className="text-destructive hover:text-destructive"
                    onClick={handleRemoveLogo}
                  >
                    <Trash2 className="w-4 h-4 mr-1" />
                    Remove
                  </Button>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Brand Colors */}
      <Card className="border-border/50">
        <CardHeader>
          <CardTitle>Brand Colors</CardTitle>
          <CardDescription>
            Choose colors that match your brand identity
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Preset Palettes */}
          <div className="space-y-3">
            <Label>Quick Presets</Label>
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
              {PRESET_COLORS.map((preset) => (
                <button
                  key={preset.name}
                  className={cn(
                    'p-3 rounded-lg border-2 transition-all hover:scale-105',
                    primaryColor === preset.primary && secondaryColor === preset.secondary
                      ? 'border-primary'
                      : 'border-border'
                  )}
                  onClick={() => {
                    setPrimaryColor(preset.primary);
                    setSecondaryColor(preset.secondary);
                  }}
                >
                  <div
                    className="h-6 rounded-md mb-1"
                    style={{
                      background: `linear-gradient(135deg, ${preset.primary}, ${preset.secondary})`,
                    }}
                  />
                  <span className="text-xs font-medium truncate block">{preset.name}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Custom Colors */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="settings-primary-color">Primary Color</Label>
              <div className="flex gap-2">
                <div
                  className="w-10 h-10 rounded-lg border cursor-pointer flex-shrink-0"
                  style={{ backgroundColor: primaryColor }}
                  onClick={() => document.getElementById('settings-primary-picker')?.click()}
                />
                <Input
                  id="settings-primary-color"
                  value={primaryColor}
                  onChange={(e) => setPrimaryColor(e.target.value)}
                  placeholder="#0EA5E9"
                  maxLength={7}
                />
                <input
                  id="settings-primary-picker"
                  type="color"
                  value={primaryColor}
                  onChange={(e) => setPrimaryColor(e.target.value)}
                  className="sr-only"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="settings-secondary-color">Secondary Color</Label>
              <div className="flex gap-2">
                <div
                  className="w-10 h-10 rounded-lg border cursor-pointer flex-shrink-0"
                  style={{ backgroundColor: secondaryColor }}
                  onClick={() => document.getElementById('settings-secondary-picker')?.click()}
                />
                <Input
                  id="settings-secondary-color"
                  value={secondaryColor}
                  onChange={(e) => setSecondaryColor(e.target.value)}
                  placeholder="#8B5CF6"
                  maxLength={7}
                />
                <input
                  id="settings-secondary-picker"
                  type="color"
                  value={secondaryColor}
                  onChange={(e) => setSecondaryColor(e.target.value)}
                  className="sr-only"
                />
              </div>
            </div>
          </div>

          {/* Preview */}
          <div className="space-y-2">
            <Label>Preview</Label>
            <div className="p-4 rounded-lg border bg-card">
              <div className="flex items-center gap-3">
                <div
                  className="w-12 h-12 rounded-xl flex items-center justify-center text-primary-foreground font-bold"
                  style={{
                    background: `linear-gradient(135deg, ${primaryColor}, ${secondaryColor})`,
                  }}
                >
                  {logoUrl ? (
                    <img src={logoUrl} alt="Logo" className="w-8 h-8 object-contain" />
                  ) : (
                    companyName?.charAt(0) || 'C'
                  )}
                </div>
                <div>
                  <p className="font-semibold">{chatWidgetTitle || 'AI Assistant'}</p>
                  <p className="text-sm text-muted-foreground">{chatWidgetSubtitle || 'Always available to help'}</p>
                </div>
              </div>
              <div className="mt-3 flex gap-2">
                <Button
                  size="sm"
                  style={{ backgroundColor: primaryColor }}
                  className="text-primary-foreground"
                >
                  Book Now
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  style={{ borderColor: secondaryColor, color: secondaryColor }}
                >
                  Learn More
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Save Button */}
      <div className="flex justify-end">
        <Button
          onClick={() => updateMutation.mutate()}
          disabled={updateMutation.isPending}
          className="gap-2"
        >
          <Save className="w-4 h-4" />
          {updateMutation.isPending ? 'Saving...' : 'Save Changes'}
        </Button>
      </div>
    </div>
  );
});
