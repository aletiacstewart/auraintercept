import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Megaphone, Save, Copy, Link, Loader2 } from 'lucide-react';
import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { triggerSetupProgressRefresh } from '@/hooks/useSetupProgress';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Skeleton } from '@/components/ui/skeleton';

const WINBACK_PLACEHOLDERS = [
  { key: '{customer_name}', description: 'Customer\'s name' },
  { key: '{discount}', description: 'Discount value' },
  { key: '{company_name}', description: 'Your company name' },
  { key: '{link}', description: 'Campaign link' },
];

const REFERRAL_PLACEHOLDERS = [
  { key: '{customer_name}', description: 'Customer\'s name' },
  { key: '{discount}', description: 'Discount value' },
  { key: '{code}', description: 'Referral discount code' },
  { key: '{link}', description: 'Referral link' },
];

const copyToClipboard = (text: string) => {
  navigator.clipboard.writeText(text);
  toast.success(`Copied ${text} to clipboard`);
};

export function CampaignSettings() {
  const { companyId } = useAuth();
  const queryClient = useQueryClient();

  const [settings, setSettings] = useState({
    defaultDiscountType: 'percent',
    defaultDiscountValue: 10,
    referralRewardType: 'discount',
    referralRewardValue: 15,
    winbackTemplate: 'Hi {customer_name}, we miss you! Come back and enjoy {discount}% off your next service.',
    referralTemplate: 'Hi {customer_name}, thanks for referring a friend! Here\'s your {discount}% discount code: {code}',
    winbackIncludeLink: true,
    referralIncludeLink: true,
  });
  const [hasChanges, setHasChanges] = useState(false);

  // Fetch existing campaign templates
  const { data: campaigns, isLoading } = useQuery({
    queryKey: ['campaign-templates', companyId],
    queryFn: async () => {
      if (!companyId) return [];
      const { data, error } = await supabase
        .from('marketing_campaigns')
        .select('*')
        .eq('company_id', companyId)
        .in('campaign_type', ['winback_template', 'referral_template']);
      if (error) throw error;
      return data;
    },
    enabled: !!companyId,
  });

  // Sync local state with fetched data
  useEffect(() => {
    if (campaigns) {
      const winbackCampaign = campaigns.find(c => c.campaign_type === 'winback_template');
      const referralCampaign = campaigns.find(c => c.campaign_type === 'referral_template');
      
      if (winbackCampaign || referralCampaign) {
        setSettings(s => ({
          ...s,
          defaultDiscountType: winbackCampaign?.discount_type ?? 'percent',
          defaultDiscountValue: winbackCampaign?.discount_value ?? 10,
          referralRewardValue: referralCampaign?.discount_value ?? 15,
          winbackTemplate: winbackCampaign?.message_template ?? s.winbackTemplate,
          referralTemplate: referralCampaign?.message_template ?? s.referralTemplate,
        }));
      }
      setHasChanges(false);
    }
  }, [campaigns]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (!companyId) throw new Error('No company ID');

      const campaignTemplates = [
        {
          company_id: companyId,
          name: 'Win-back Template',
          campaign_type: 'winback_template',
          status: 'template',
          discount_type: settings.defaultDiscountType,
          discount_value: settings.defaultDiscountValue,
          message_template: settings.winbackTemplate,
        },
        {
          company_id: companyId,
          name: 'Referral Template',
          campaign_type: 'referral_template',
          status: 'template',
          discount_type: settings.referralRewardType,
          discount_value: settings.referralRewardValue,
          message_template: settings.referralTemplate,
        },
      ];

      // Upsert each campaign template
      for (const template of campaignTemplates) {
        const existingCampaign = campaigns?.find(c => c.campaign_type === template.campaign_type);
        
        if (existingCampaign) {
          const { error } = await supabase
            .from('marketing_campaigns')
            .update({
              discount_type: template.discount_type,
              discount_value: template.discount_value,
              message_template: template.message_template,
            })
            .eq('id', existingCampaign.id);
          if (error) throw error;
        } else {
          const { error } = await supabase
            .from('marketing_campaigns')
            .insert(template);
          if (error) throw error;
        }
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['campaign-templates', companyId] });
      toast.success('Campaign settings saved');
      triggerSetupProgressRefresh();
      setHasChanges(false);
    },
    onError: (error) => {
      console.error('Failed to save campaign settings:', error);
      toast.error('Failed to save campaign settings');
    },
  });

  const handleChange = <K extends keyof typeof settings>(key: K, value: typeof settings[K]) => {
    setSettings(s => ({ ...s, [key]: value }));
    setHasChanges(true);
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-72 mt-2" />
        </CardHeader>
        <CardContent className="space-y-4">
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-32 w-full" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Megaphone className="h-5 w-5" />
          Campaign Settings
        </CardTitle>
        <CardDescription>
          Configure default campaign and referral settings
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-4">
          <h3 className="font-medium text-card-foreground">Default Promotional Discount</h3>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label className="text-card-foreground">Discount Type</Label>
              <Select
                value={settings.defaultDiscountType}
                onValueChange={(v) => handleChange('defaultDiscountType', v)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="percent">Percentage</SelectItem>
                  <SelectItem value="fixed">Fixed Amount</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label className="text-card-foreground">Discount Value</Label>
              <Input
                type="number"
                value={settings.defaultDiscountValue}
                onChange={(e) => handleChange('defaultDiscountValue', Number(e.target.value))}
              />
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <h3 className="font-medium text-card-foreground">Referral Rewards</h3>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label className="text-card-foreground">Reward Type</Label>
              <Select
                value={settings.referralRewardType}
                onValueChange={(v) => handleChange('referralRewardType', v)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="discount">Discount</SelectItem>
                  <SelectItem value="credit">Account Credit</SelectItem>
                  <SelectItem value="gift">Gift Card</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label className="text-card-foreground">Reward Value (%)</Label>
              <Input
                type="number"
                value={settings.referralRewardValue}
                onChange={(e) => handleChange('referralRewardValue', Number(e.target.value))}
              />
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <h3 className="font-medium text-card-foreground">Message Templates</h3>
          <div className="space-y-6">
            <div className="space-y-3">
              <Label className="text-card-foreground">Win-back Campaign Template</Label>
              <Textarea
                value={settings.winbackTemplate}
                onChange={(e) => handleChange('winbackTemplate', e.target.value)}
                rows={3}
              />
              <div className="flex items-center justify-between p-4 rounded-lg bg-muted/30 border border-card-foreground/10">
                <div className="flex items-center gap-3">
                  <Link className="w-4 h-4 text-primary" />
                  <div>
                    <Label className="text-sm font-medium text-card-foreground">Include Campaign Link</Label>
                    <p className="text-xs text-card-foreground/70">Add a link for customers to redeem the offer</p>
                  </div>
                </div>
                <Switch
                  checked={settings.winbackIncludeLink}
                  onCheckedChange={(checked) => handleChange('winbackIncludeLink', checked)}
                />
              </div>
              <div className="space-y-2">
                <Badge variant="outline" className="text-xs text-card-foreground/80">Available Placeholders</Badge>
                <div className="flex flex-wrap gap-2">
                  {WINBACK_PLACEHOLDERS.map((placeholder) => (
                    <button
                      key={placeholder.key}
                      type="button"
                      onClick={() => copyToClipboard(placeholder.key)}
                      className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs bg-muted/50 hover:bg-muted rounded-md border border-border/50 transition-colors group"
                      title={placeholder.description}
                    >
                      <code className="text-primary font-mono">{placeholder.key}</code>
                      <Copy className="w-3 h-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                    </button>
                  ))}
                </div>
              </div>
            </div>
            <div className="space-y-3">
              <Label className="text-card-foreground">Referral Reward Template</Label>
              <Textarea
                value={settings.referralTemplate}
                onChange={(e) => handleChange('referralTemplate', e.target.value)}
                rows={3}
              />
              <div className="flex items-center justify-between p-4 rounded-lg bg-muted/30 border border-card-foreground/10">
                <div className="flex items-center gap-3">
                  <Link className="w-4 h-4 text-primary" />
                  <div>
                    <Label className="text-sm font-medium text-card-foreground">Include Referral Link</Label>
                    <p className="text-xs text-card-foreground/70">Add a referral link for customers to share</p>
                  </div>
                </div>
                <Switch
                  checked={settings.referralIncludeLink}
                  onCheckedChange={(checked) => handleChange('referralIncludeLink', checked)}
                />
              </div>
              <div className="space-y-2">
                <Badge variant="outline" className="text-xs text-card-foreground/80">Available Placeholders</Badge>
                <div className="flex flex-wrap gap-2">
                  {REFERRAL_PLACEHOLDERS.map((placeholder) => (
                    <button
                      key={placeholder.key}
                      type="button"
                      onClick={() => copyToClipboard(placeholder.key)}
                      className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs bg-muted/50 hover:bg-muted rounded-md border border-border/50 transition-colors group"
                      title={placeholder.description}
                    >
                      <code className="text-primary font-mono">{placeholder.key}</code>
                      <Copy className="w-3 h-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        <Button 
          onClick={() => saveMutation.mutate()} 
          disabled={saveMutation.isPending || !hasChanges}
        >
          {saveMutation.isPending ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <Save className="h-4 w-4 mr-2" />
          )}
          {saveMutation.isPending ? 'Saving...' : hasChanges ? 'Save Settings' : 'Saved'}
        </Button>
      </CardContent>
    </Card>
  );
}
