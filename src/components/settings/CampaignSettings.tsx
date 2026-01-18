import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Megaphone, Save, Copy, Link } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

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
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    await new Promise(resolve => setTimeout(resolve, 500));
    toast.success('Campaign settings saved');
    setSaving(false);
  };

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
                onValueChange={(v) => setSettings(s => ({ ...s, defaultDiscountType: v }))}
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
                onChange={(e) => setSettings(s => ({ ...s, defaultDiscountValue: Number(e.target.value) }))}
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
                onValueChange={(v) => setSettings(s => ({ ...s, referralRewardType: v }))}
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
                onChange={(e) => setSettings(s => ({ ...s, referralRewardValue: Number(e.target.value) }))}
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
                onChange={(e) => setSettings(s => ({ ...s, winbackTemplate: e.target.value }))}
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
                  onCheckedChange={(checked) => setSettings(s => ({ ...s, winbackIncludeLink: checked }))}
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
                onChange={(e) => setSettings(s => ({ ...s, referralTemplate: e.target.value }))}
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
                  onCheckedChange={(checked) => setSettings(s => ({ ...s, referralIncludeLink: checked }))}
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

        <Button onClick={handleSave} disabled={saving}>
          <Save className="h-4 w-4 mr-2" />
          Save Settings
        </Button>
      </CardContent>
    </Card>
  );
}
