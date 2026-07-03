import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { Save, Eye, EyeOff, Loader2, CheckCircle, Key } from 'lucide-react';

type SocialPlatform = 'facebook' | 'instagram' | 'linkedin' | 'tiktok' | 'google_business';

interface CredentialField {
  key: string;
  label: string;
  placeholder: string;
  required: boolean;
  tip?: string;
}

const PLATFORM_FIELDS: Record<SocialPlatform, CredentialField[]> = {
  facebook: [
    { key: 'meta_app_id', label: 'Meta App ID', placeholder: 'Your Meta App ID', required: true, tip: 'Found in Facebook Developer Console → App Settings → Basic' },
    { key: 'meta_app_secret', label: 'Meta App Secret', placeholder: 'Your Meta App Secret', required: true, tip: 'Keep this confidential — found next to App ID' },
  ],
  instagram: [
    { key: 'meta_app_id', label: 'Meta App ID', placeholder: 'Your Meta App ID', required: true, tip: 'Same Meta App used for Facebook & Instagram' },
    { key: 'meta_app_secret', label: 'Meta App Secret', placeholder: 'Your Meta App Secret', required: true },
  ],
  linkedin: [
    { key: 'linkedin_client_id', label: 'LinkedIn Client ID', placeholder: 'Your LinkedIn Client ID', required: true, tip: 'Found in LinkedIn Developer Portal → App → Auth' },
    { key: 'linkedin_client_secret', label: 'LinkedIn Client Secret', placeholder: 'Your LinkedIn Client Secret', required: true },
    { key: 'linkedin_org_id', label: 'Organization ID (optional)', placeholder: 'urn:li:organization:XXXXXXX', required: false, tip: 'Required for posting to a Company Page vs personal profile' },
  ],
  tiktok: [
    { key: 'tiktok_client_key', label: 'TikTok Client Key', placeholder: 'Your TikTok Client Key', required: true, tip: 'Found in TikTok Developer Portal → Manage Apps → Key' },
    { key: 'tiktok_client_secret', label: 'TikTok Client Secret', placeholder: 'Your TikTok Client Secret', required: true },
  ],
  google_business: [
    { key: 'google_business_client_id', label: 'Google Client ID', placeholder: 'Your Google Cloud Client ID', required: true, tip: 'Create OAuth 2.0 credentials in Google Cloud Console' },
    { key: 'google_business_client_secret', label: 'Google Client Secret', placeholder: 'Your Google Cloud Client Secret', required: true },
  ],
};

interface TenantSocialCredentialsFormProps {
  companyId: string;
  platform: SocialPlatform;
  onSaved?: () => void;
}

function maskValue(value: string): string {
  if (!value || value.length <= 4) return '****';
  return `****${value.slice(-4)}`;
}

export function TenantSocialCredentialsForm({
  companyId,
  platform,
  onSaved,
}: TenantSocialCredentialsFormProps) {
  const queryClient = useQueryClient();
  const [showSecrets, setShowSecrets] = useState<Record<string, boolean>>({});
  const [formValues, setFormValues] = useState<Record<string, string>>({});
  const [isDirty, setIsDirty] = useState(false);

  const fields = PLATFORM_FIELDS[platform];

  // Fetch existing credentials
  const { data: existing, isLoading } = useQuery({
    queryKey: ['tenant-integrations-creds', companyId, platform],
    queryFn: async () => {
      const { data } = await supabase
        .from('tenant_integrations')
        .select(fields.map(f => f.key).join(','))
        .eq('company_id', companyId)
        .maybeSingle();
      return data as unknown as Record<string, string> | null;
    },
    enabled: !!companyId,
  });

  const hasExistingCreds = existing && fields.some(f => existing[f.key]);

  const saveMutation = useMutation({
    mutationFn: async (values: Record<string, string>) => {
      // Only save non-empty values
      const updates = Object.fromEntries(
        Object.entries(values).filter(([, v]) => v.trim() !== '')
      );

      if (Object.keys(updates).length === 0) {
        throw new Error('Please enter at least one credential value');
      }

      // Check if row exists
      const { data: existingRow } = await supabase
        .from('tenant_integrations')
        .select('id')
        .eq('company_id', companyId)
        .maybeSingle();

      if (existingRow) {
        const { error } = await supabase
          .from('tenant_integrations')
          .update(updates as never)
          .eq('company_id', companyId);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('tenant_integrations')
          .insert({ company_id: companyId, ...updates });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      toast.success('Credentials saved successfully!');
      queryClient.invalidateQueries({ queryKey: ['tenant-integrations-creds'] });
      setFormValues({});
      setIsDirty(false);
      onSaved?.();
    },
    onError: (err: any) => toast.error(err.message || 'Failed to save credentials'),
  });

  const handleChange = (key: string, value: string) => {
    setFormValues(prev => ({ ...prev, [key]: value }));
    setIsDirty(true);
  };

  const toggleShow = (key: string) => {
    setShowSecrets(prev => ({ ...prev, [key]: !prev[key] }));
  };

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 py-4 text-muted-foreground text-sm">
        <Loader2 className="h-4 w-4 animate-spin" />
        Loading credentials...
      </div>
    );
  }

  return (
    <Card className="border-border/50">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Key className="h-4 w-4 text-muted-foreground" />
            <CardTitle className="text-sm">Your Developer App Credentials</CardTitle>
          </div>
          {hasExistingCreds && (
            <Badge className="bg-green-500/10 text-green-600 border-green-500/30 text-xs">
              <CheckCircle className="h-3 w-3 mr-1" />
              Configured
            </Badge>
          )}
        </div>
        <CardDescription className="text-xs">
          Enter your own developer app credentials to enable OAuth-based automatic posting.
          Values are encrypted and stored securely.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {fields.map((field) => {
          const existingValue = existing?.[field.key] || '';
          const currentValue = formValues[field.key] ?? '';
          const isSecret = field.key.includes('secret') || field.key.includes('token');
          const showField = showSecrets[field.key];

          return (
            <div key={field.key} className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label className="text-xs font-medium">
                  {field.label}
                  {field.required && <span className="text-destructive ml-1">*</span>}
                </Label>
                {existingValue && (
                  <span className="text-xs text-muted-foreground font-mono">
                    Current: {maskValue(existingValue)}
                  </span>
                )}
              </div>
              <div className="flex gap-2">
                <Input
                  type={isSecret && !showField ? 'password' : 'text'}
                  value={currentValue}
                  onChange={(e) => handleChange(field.key, e.target.value)}
                  placeholder={existingValue ? 'Enter new value to update' : field.placeholder}
                  className="text-sm font-mono"
                />
                {isSecret && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="shrink-0"
                    onClick={() => toggleShow(field.key)}
                  >
                    {showField ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                )}
              </div>
              {field.tip && (
                <p className="text-xs text-muted-foreground">💡 {field.tip}</p>
              )}
            </div>
          );
        })}

        <Button
          onClick={() => saveMutation.mutate(formValues)}
          disabled={!isDirty || saveMutation.isPending}
          className="w-full gap-2"
        >
          {saveMutation.isPending ? (
            <><Loader2 className="h-4 w-4 animate-spin" /> Saving...</>
          ) : (
            <><Save className="h-4 w-4" /> Save Credentials</>
          )}
        </Button>
      </CardContent>
    </Card>
  );
}
