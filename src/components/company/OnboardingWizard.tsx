import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { Check, Upload, Palette, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';

interface OnboardingWizardProps {
  onComplete: () => void;
  initialStep?: number;
}

const PRESET_COLORS = [
  { primary: '#0EA5E9', secondary: '#8B5CF6', name: 'Ocean Violet' },
  { primary: '#10B981', secondary: '#3B82F6', name: 'Nature Blue' },
  { primary: '#F59E0B', secondary: '#EF4444', name: 'Sunset' },
  { primary: '#EC4899', secondary: '#8B5CF6', name: 'Pink Purple' },
  { primary: '#14B8A6', secondary: '#06B6D4', name: 'Teal Cyan' },
  { primary: '#6366F1', secondary: '#A855F7', name: 'Indigo Purple' },
];

export function OnboardingWizard({ onComplete, initialStep = 0 }: OnboardingWizardProps) {
  const { companyId } = useAuth();
  const [step, setStep] = useState(initialStep);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [primaryColor, setPrimaryColor] = useState('#0EA5E9');
  const [secondaryColor, setSecondaryColor] = useState('#8B5CF6');

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !companyId) return;

    // Validate file
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

      // Delete existing logo first
      await supabase.storage.from('company-logos').remove([fileName]);

      const { error: uploadError } = await supabase.storage
        .from('company-logos')
        .upload(fileName, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('company-logos')
        .getPublicUrl(fileName);

      setLogoUrl(publicUrl);
      toast.success('Logo uploaded successfully');
    } catch (error) {
      console.error('Error uploading logo:', error);
      toast.error('Failed to upload logo');
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async () => {
    if (!companyId) return;

    setSaving(true);

    try {
      const { error } = await supabase
        .from('companies')
        .update({
          logo_url: logoUrl,
          primary_color: primaryColor,
          secondary_color: secondaryColor,
        })
        .eq('id', companyId);

      if (error) throw error;

      toast.success('Branding saved successfully!');
      onComplete();
    } catch (error) {
      console.error('Error saving branding:', error);
      toast.error('Failed to save branding');
    } finally {
      setSaving(false);
    }
  };

  const steps = [
    { title: 'Upload Logo', icon: Upload },
    { title: 'Brand Colors', icon: Palette },
    { title: 'Finish', icon: Sparkles },
  ];

  return (
    <Card className="max-w-2xl mx-auto border-border/50">
      <CardHeader className="text-center pb-2">
        <CardTitle className="text-2xl">Setup Your Brand</CardTitle>
        <CardDescription>
          Customize how your AI agent looks to your customers
        </CardDescription>
      </CardHeader>

      {/* Progress Steps */}
      <div className="flex items-center justify-center gap-2 px-6 py-4">
        {steps.map((s, i) => (
          <div key={i} className="flex items-center gap-2">
            <div
              className={cn(
                'w-10 h-10 rounded-full flex items-center justify-center transition-all',
                i < step
                  ? 'bg-green-500 text-primary-foreground'
                  : i === step
                  ? 'gradient-primary text-primary-foreground'
                  : 'bg-muted text-muted-foreground'
              )}
            >
              {i < step ? (
                <Check className="w-5 h-5" />
              ) : (
                <s.icon className="w-5 h-5" />
              )}
            </div>
            {i < steps.length - 1 && (
              <div
                className={cn(
                  'w-12 h-1 rounded',
                  i < step ? 'bg-green-500' : 'bg-muted'
                )}
              />
            )}
          </div>
        ))}
      </div>

      <CardContent className="pt-4">
        {/* Step 1: Logo Upload */}
        {step === 0 && (
          <div className="space-y-6 animate-fade-in">
            <div className="text-center">
              <h3 className="text-lg font-semibold mb-2">Upload Your Logo</h3>
              <p className="text-muted-foreground text-sm">
                Your logo will appear on your AI chat widget and communications
              </p>
            </div>

            <div className="flex flex-col items-center gap-4">
              <div
                className="w-32 h-32 rounded-2xl border-2 border-dashed border-border flex items-center justify-center overflow-hidden bg-muted/50 cursor-pointer hover:border-primary transition-colors"
                onClick={() => document.getElementById('logo-upload')?.click()}
              >
                {logoUrl ? (
                  <img src={logoUrl} alt="Logo" className="w-full h-full object-contain p-2" />
                ) : (
                  <div className="text-center text-muted-foreground">
                    <Upload className="w-8 h-8 mx-auto mb-2" />
                    <span className="text-xs">Click to upload</span>
                  </div>
                )}
              </div>
              <input
                id="logo-upload"
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleLogoUpload}
                disabled={uploading}
              />
              <p className="text-xs text-muted-foreground">
                PNG, JPG or SVG. Max 2MB.
              </p>
            </div>

            <div className="flex justify-end gap-3 pt-4">
              <Button variant="outline" onClick={() => setStep(1)}>
                Skip for now
              </Button>
              <Button onClick={() => setStep(1)} disabled={uploading}>
                {uploading ? 'Uploading...' : 'Continue'}
              </Button>
            </div>
          </div>
        )}

        {/* Step 2: Brand Colors */}
        {step === 1 && (
          <div className="space-y-6 animate-fade-in">
            <div className="text-center">
              <h3 className="text-lg font-semibold mb-2">Choose Brand Colors</h3>
              <p className="text-muted-foreground text-sm">
                Select colors that match your brand identity
              </p>
            </div>

            {/* Preset Palettes */}
            <div className="space-y-3">
              <Label>Quick Presets</Label>
              <div className="grid grid-cols-3 gap-3">
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
                      className="h-8 rounded-md mb-2"
                      style={{
                        background: `linear-gradient(135deg, ${preset.primary}, ${preset.secondary})`,
                      }}
                    />
                    <span className="text-xs font-medium">{preset.name}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Custom Colors */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="primary-color">Primary Color</Label>
                <div className="flex gap-2">
                  <div
                    className="w-10 h-10 rounded-lg border cursor-pointer"
                    style={{ backgroundColor: primaryColor }}
                    onClick={() => document.getElementById('primary-picker')?.click()}
                  />
                  <Input
                    id="primary-color"
                    value={primaryColor}
                    onChange={(e) => setPrimaryColor(e.target.value)}
                    placeholder="#0EA5E9"
                    maxLength={7}
                  />
                  <input
                    id="primary-picker"
                    type="color"
                    value={primaryColor}
                    onChange={(e) => setPrimaryColor(e.target.value)}
                    className="sr-only"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="secondary-color">Secondary Color</Label>
                <div className="flex gap-2">
                  <div
                    className="w-10 h-10 rounded-lg border cursor-pointer"
                    style={{ backgroundColor: secondaryColor }}
                    onClick={() => document.getElementById('secondary-picker')?.click()}
                  />
                  <Input
                    id="secondary-color"
                    value={secondaryColor}
                    onChange={(e) => setSecondaryColor(e.target.value)}
                    placeholder="#8B5CF6"
                    maxLength={7}
                  />
                  <input
                    id="secondary-picker"
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
                      'A'
                    )}
                  </div>
                  <div>
                    <p className="font-semibold">Your Company</p>
                    <p className="text-sm text-muted-foreground">AI Assistant</p>
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

            <div className="flex justify-between gap-3 pt-4">
              <Button variant="outline" onClick={() => setStep(0)}>
                Back
              </Button>
              <Button onClick={() => setStep(2)}>
                Continue
              </Button>
            </div>
          </div>
        )}

        {/* Step 3: Finish */}
        {step === 2 && (
          <div className="space-y-6 animate-fade-in text-center">
            <div
              className="w-20 h-20 mx-auto rounded-full flex items-center justify-center"
              style={{
                background: `linear-gradient(135deg, ${primaryColor}, ${secondaryColor})`,
              }}
            >
              <Sparkles className="w-10 h-10 text-primary-foreground" />
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-2">You're All Set!</h3>
              <p className="text-muted-foreground text-sm">
                Your brand is ready. You can always update these settings later.
              </p>
            </div>

            {/* Summary */}
            <div className="p-4 rounded-lg bg-muted/50 text-left space-y-3">
              <div className="flex items-center gap-3">
                <Check className="w-5 h-5 text-green-500" />
                <span>{logoUrl ? 'Logo uploaded' : 'No logo (using default)'}</span>
              </div>
              <div className="flex items-center gap-3">
                <Check className="w-5 h-5 text-green-500" />
                <span>Brand colors configured</span>
                <div className="flex gap-1 ml-auto">
                  <div
                    className="w-5 h-5 rounded"
                    style={{ backgroundColor: primaryColor }}
                  />
                  <div
                    className="w-5 h-5 rounded"
                    style={{ backgroundColor: secondaryColor }}
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-between gap-3 pt-4">
              <Button variant="outline" onClick={() => setStep(1)}>
                Back
              </Button>
              <Button onClick={handleSave} disabled={saving}>
                {saving ? 'Saving...' : 'Complete Setup'}
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
