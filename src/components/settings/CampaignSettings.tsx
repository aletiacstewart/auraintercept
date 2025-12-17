import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Megaphone, Save } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

export function CampaignSettings() {
  const [settings, setSettings] = useState({
    defaultDiscountType: 'percent',
    defaultDiscountValue: 10,
    referralRewardType: 'discount',
    referralRewardValue: 15,
    winbackTemplate: 'Hi {customer_name}, we miss you! Come back and enjoy {discount}% off your next service.',
    referralTemplate: 'Hi {customer_name}, thanks for referring a friend! Here\'s your {discount}% discount code: {code}',
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
          <h3 className="font-medium">Default Promotional Discount</h3>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label>Discount Type</Label>
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
              <Label>Discount Value</Label>
              <Input
                type="number"
                value={settings.defaultDiscountValue}
                onChange={(e) => setSettings(s => ({ ...s, defaultDiscountValue: Number(e.target.value) }))}
              />
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <h3 className="font-medium">Referral Rewards</h3>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label>Reward Type</Label>
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
              <Label>Reward Value (%)</Label>
              <Input
                type="number"
                value={settings.referralRewardValue}
                onChange={(e) => setSettings(s => ({ ...s, referralRewardValue: Number(e.target.value) }))}
              />
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <h3 className="font-medium">Message Templates</h3>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Win-back Campaign Template</Label>
              <Textarea
                value={settings.winbackTemplate}
                onChange={(e) => setSettings(s => ({ ...s, winbackTemplate: e.target.value }))}
                rows={3}
              />
              <p className="text-xs text-muted-foreground">
                Variables: {'{customer_name}'}, {'{discount}'}, {'{company_name}'}
              </p>
            </div>
            <div className="space-y-2">
              <Label>Referral Reward Template</Label>
              <Textarea
                value={settings.referralTemplate}
                onChange={(e) => setSettings(s => ({ ...s, referralTemplate: e.target.value }))}
                rows={3}
              />
              <p className="text-xs text-muted-foreground">
                Variables: {'{customer_name}'}, {'{discount}'}, {'{code}'}
              </p>
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
