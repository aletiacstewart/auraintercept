import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Globe, Save, ExternalLink, Info } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { isLovablePreviewOrigin, normalizePublicBaseUrl } from '@/lib/url';
import { toast } from 'sonner';

export function PublicAppUrlSettings() {
  const { companyId } = useAuth();
  const [publicUrl, setPublicUrl] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchPublicUrl = async () => {
      if (!companyId) return;
      
      const { data, error } = await supabase
        .from('companies')
        .select('public_app_url')
        .eq('id', companyId)
        .single();

      if (!error && data?.public_app_url) {
        setPublicUrl(data.public_app_url);
      }
      setIsLoading(false);
    };

    fetchPublicUrl();
  }, [companyId]);

  const handleSave = async () => {
    if (!companyId) return;

    const raw = publicUrl.trim();

    // Basic URL validation
    if (raw && !raw.startsWith('https://')) {
      toast.error('URL must start with https://');
      return;
    }

    const normalized = raw ? normalizePublicBaseUrl(raw) : null;

    if (raw && !normalized) {
      toast.error('Please enter a valid URL');
      return;
    }

    if (normalized && isLovablePreviewOrigin(normalized)) {
      toast.error('Please use your published app URL (not a preview lovableproject.com link).');
      return;
    }

    // If user pasted a full path, store just the origin so install links don't double up.
    if (normalized && normalized !== raw) {
      setPublicUrl(normalized);
    }

    setIsSaving(true);

    const { error } = await supabase
      .from('companies')
      .update({ public_app_url: normalized })
      .eq('id', companyId);

    if (error) {
      toast.error('Failed to save public URL');
      console.error(error);
    } else {
      toast.success('Public app URL saved');
    }

    setIsSaving(false);
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="h-24 flex items-center justify-center text-muted-foreground">
            Loading...
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Globe className="h-5 w-5" />
          Public App URL
        </CardTitle>
      <CardDescription>
          Set the public URL for app install QR codes. This should be your published/deployed app URL.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Alert>
          <Info className="h-4 w-4" />
          <AlertDescription>
            When you publish your app, copy the published URL here. The install QR codes for the 
            <strong> Technician Field Ops App</strong>, <strong>Dispatch-Field Ops App</strong>, and <strong>Bus.Mgt Ops App</strong> will 
            use this URL so users can install the apps without needing a Lovable account.
          </AlertDescription>
        </Alert>

        <div className="space-y-2">
          <Label htmlFor="public-url">Published App URL</Label>
          <div className="flex gap-2">
            <Input
              id="public-url"
              placeholder="https://your-app.lovable.app"
              value={publicUrl}
              onChange={(e) => setPublicUrl(e.target.value)}
              className="flex-1"
            />
            {publicUrl && (
              <Button
                variant="outline"
                size="icon"
                onClick={() => window.open(publicUrl, '_blank')}
                title="Open URL"
              >
                <ExternalLink className="h-4 w-4" />
              </Button>
            )}
          </div>
          <p className="text-xs text-muted-foreground">
            Leave empty to use the current page URL (may require Lovable login in preview mode)
          </p>
        </div>

        <Button onClick={handleSave} disabled={isSaving} className="gap-2">
          <Save className="h-4 w-4" />
          {isSaving ? 'Saving...' : 'Save URL'}
        </Button>
      </CardContent>
    </Card>
  );
}