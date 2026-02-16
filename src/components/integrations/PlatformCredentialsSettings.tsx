import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { Settings, Eye, EyeOff, Save, Check, AlertCircle, Shield } from 'lucide-react';

interface PlatformConfig {
  platform: string;
  label: string;
  description: string;
  keys: { settingKey: string; label: string; placeholder: string }[];
}

const PLATFORM_CONFIGS: PlatformConfig[] = [
  {
    platform: 'meta',
    label: 'Meta (Facebook & Instagram)',
    description: 'One set of credentials covers both Facebook and Instagram.',
    keys: [
      { settingKey: 'META_APP_ID', label: 'App ID', placeholder: 'Enter your Meta App ID' },
      { settingKey: 'META_APP_SECRET', label: 'App Secret', placeholder: 'Enter your Meta App Secret' },
    ],
  },
  {
    platform: 'linkedin',
    label: 'LinkedIn',
    description: 'LinkedIn Developer App credentials for posting to profiles and company pages.',
    keys: [
      { settingKey: 'LINKEDIN_CLIENT_ID', label: 'Client ID', placeholder: 'Enter your LinkedIn Client ID' },
      { settingKey: 'LINKEDIN_CLIENT_SECRET', label: 'Client Secret', placeholder: 'Enter your LinkedIn Client Secret' },
    ],
  },
  {
    platform: 'tiktok',
    label: 'TikTok',
    description: 'TikTok Developer App credentials for content posting.',
    keys: [
      { settingKey: 'TIKTOK_CLIENT_KEY', label: 'Client Key', placeholder: 'Enter your TikTok Client Key' },
      { settingKey: 'TIKTOK_CLIENT_SECRET', label: 'Client Secret', placeholder: 'Enter your TikTok Client Secret' },
    ],
  },
  {
    platform: 'google',
    label: 'Google Business',
    description: 'Google Cloud OAuth credentials for Business Profile management.',
    keys: [
      { settingKey: 'GOOGLE_CLIENT_ID', label: 'Client ID', placeholder: 'Enter your Google Client ID' },
      { settingKey: 'GOOGLE_CLIENT_SECRET', label: 'Client Secret', placeholder: 'Enter your Google Client Secret' },
    ],
  },
];

export function PlatformCredentialsSettings() {
  const { userRole } = useAuth();
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState<Record<string, string>>({});
  const [showSecrets, setShowSecrets] = useState<Record<string, boolean>>({});
  const [editingPlatform, setEditingPlatform] = useState<string | null>(null);

  const isPlatformAdmin = userRole === 'platform_admin';

  const { data: settings, isLoading } = useQuery({
    queryKey: ['platform-settings'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('platform_settings')
        .select('setting_key, setting_value, updated_at');
      if (error) throw error;
      return data || [];
    },
    enabled: isPlatformAdmin,
  });

  const saveMutation = useMutation({
    mutationFn: async ({ keys, values }: { keys: string[]; values: Record<string, string> }) => {
      for (const key of keys) {
        const value = values[key];
        if (!value) continue;

        const existing = settings?.find((s) => s.setting_key === key);
        if (existing) {
          const { error } = await supabase
            .from('platform_settings')
            .update({ setting_value: value, updated_at: new Date().toISOString() })
            .eq('setting_key', key);
          if (error) throw error;
        } else {
          const { error } = await supabase
            .from('platform_settings')
            .insert({ setting_key: key, setting_value: value });
          if (error) throw error;
        }
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['platform-settings'] });
      toast.success('Platform credentials saved!');
      setEditingPlatform(null);
      setFormData({});
    },
    onError: () => toast.error('Failed to save credentials'),
  });

  const isConfigured = (config: PlatformConfig): boolean => {
    if (!settings) return false;
    return config.keys.every((k) =>
      settings.some((s) => s.setting_key === k.settingKey && s.setting_value)
    );
  };

  const handleEdit = (config: PlatformConfig) => {
    const data: Record<string, string> = {};
    config.keys.forEach((k) => {
      const existing = settings?.find((s) => s.setting_key === k.settingKey);
      if (existing) data[k.settingKey] = existing.setting_value;
    });
    setFormData(data);
    setEditingPlatform(config.platform);
  };

  const handleSave = (config: PlatformConfig) => {
    const keys = config.keys.map((k) => k.settingKey);
    saveMutation.mutate({ keys, values: formData });
  };

  if (!isPlatformAdmin) return null;

  return (
    <Card className="border-primary/20 bg-primary/5">
      <CardHeader>
        <div className="flex items-center gap-2">
          <Shield className="w-5 h-5 text-primary" />
          <CardTitle className="text-base">Platform API Credentials</CardTitle>
          <Badge variant="outline" className="text-xs">Platform Admin Only</Badge>
        </div>
        <CardDescription>
          These are platform-level credentials shared across all tenants. Configure them once — tenants will use OAuth to connect their accounts.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {PLATFORM_CONFIGS.map((config) => {
          const configured = isConfigured(config);
          const isEditing = editingPlatform === config.platform;

          return (
            <div key={config.platform} className="p-4 rounded-lg border border-border/50 bg-background space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">{config.label}</p>
                  <p className="text-xs text-muted-foreground">{config.description}</p>
                </div>
                <div className="flex items-center gap-2">
                  {configured ? (
                    <Badge className="bg-green-500/10 text-green-600 border-green-500/30">
                      <Check className="w-3 h-3 mr-1" /> Configured
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="text-amber-600 border-amber-500/30">
                      <AlertCircle className="w-3 h-3 mr-1" /> Not configured
                    </Badge>
                  )}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => isEditing ? setEditingPlatform(null) : handleEdit(config)}
                  >
                    <Settings className="w-3 h-3 mr-1" />
                    {isEditing ? 'Cancel' : configured ? 'Update' : 'Configure'}
                  </Button>
                </div>
              </div>

              {isEditing && (
                <div className="space-y-3 pt-2 border-t border-border/50">
                  {config.keys.map((k) => (
                    <div key={k.settingKey} className="space-y-1">
                      <Label className="text-xs">{k.label}</Label>
                      <div className="relative">
                        <Input
                          type={k.label.toLowerCase().includes('secret') || k.label.toLowerCase().includes('key')
                            ? (showSecrets[k.settingKey] ? 'text' : 'password')
                            : 'text'}
                          placeholder={k.placeholder}
                          value={formData[k.settingKey] || ''}
                          onChange={(e) => setFormData((prev) => ({ ...prev, [k.settingKey]: e.target.value }))}
                        />
                        {(k.label.toLowerCase().includes('secret') || k.label.toLowerCase().includes('key')) && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7"
                            onClick={() => setShowSecrets((prev) => ({ ...prev, [k.settingKey]: !prev[k.settingKey] }))}
                          >
                            {showSecrets[k.settingKey] ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                  <Button size="sm" onClick={() => handleSave(config)} disabled={saveMutation.isPending}>
                    <Save className="w-3 h-3 mr-1" />
                    {saveMutation.isPending ? 'Saving...' : 'Save Credentials'}
                  </Button>
                </div>
              )}
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
