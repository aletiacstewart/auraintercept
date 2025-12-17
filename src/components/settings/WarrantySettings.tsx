import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Shield, Save } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

export function WarrantySettings() {
  const [settings, setSettings] = useState({
    defaultWarrantyPeriod: 12,
    enableExpirationAlerts: true,
    alertDaysBefore: 30,
    autoExtendOffers: false,
    extendOfferDiscount: 10,
  });
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    // In a real app, save to database
    await new Promise(resolve => setTimeout(resolve, 500));
    toast.success('Warranty settings saved');
    setSaving(false);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="h-5 w-5" />
          Warranty Settings
        </CardTitle>
        <CardDescription>
          Configure default warranty terms and expiration alerts
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label>Default Warranty Period</Label>
            <Select
              value={String(settings.defaultWarrantyPeriod)}
              onValueChange={(v) => setSettings(s => ({ ...s, defaultWarrantyPeriod: Number(v) }))}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="3">3 months</SelectItem>
                <SelectItem value="6">6 months</SelectItem>
                <SelectItem value="12">1 year</SelectItem>
                <SelectItem value="24">2 years</SelectItem>
                <SelectItem value="60">5 years</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Alert Days Before Expiration</Label>
            <Input
              type="number"
              value={settings.alertDaysBefore}
              onChange={(e) => setSettings(s => ({ ...s, alertDaysBefore: Number(e.target.value) }))}
            />
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label>Enable Expiration Alerts</Label>
              <p className="text-sm text-muted-foreground">
                Send email alerts before warranties expire
              </p>
            </div>
            <Switch
              checked={settings.enableExpirationAlerts}
              onCheckedChange={(checked) => setSettings(s => ({ ...s, enableExpirationAlerts: checked }))}
            />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <Label>Auto-Send Extension Offers</Label>
              <p className="text-sm text-muted-foreground">
                Automatically send warranty extension offers before expiration
              </p>
            </div>
            <Switch
              checked={settings.autoExtendOffers}
              onCheckedChange={(checked) => setSettings(s => ({ ...s, autoExtendOffers: checked }))}
            />
          </div>

          {settings.autoExtendOffers && (
            <div className="space-y-2 pl-4 border-l-2 border-muted">
              <Label>Extension Offer Discount (%)</Label>
              <Input
                type="number"
                value={settings.extendOfferDiscount}
                onChange={(e) => setSettings(s => ({ ...s, extendOfferDiscount: Number(e.target.value) }))}
                className="max-w-xs"
              />
            </div>
          )}
        </div>

        <Button onClick={handleSave} disabled={saving}>
          <Save className="h-4 w-4 mr-2" />
          Save Settings
        </Button>
      </CardContent>
    </Card>
  );
}
