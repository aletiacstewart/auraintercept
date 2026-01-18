import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Shield, Save, Wrench, Package, Factory } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

const WARRANTY_PERIOD_OPTIONS = [
  { value: '3', label: '3 months' },
  { value: '6', label: '6 months' },
  { value: '12', label: '1 year' },
  { value: '24', label: '2 years' },
  { value: '36', label: '3 years' },
  { value: '60', label: '5 years' },
];

export function WarrantySettings() {
  const [settings, setSettings] = useState({
    // Service warranty by company
    serviceWarrantyPeriod: 12,
    // Parts warranty by company
    partsWarrantyCompanyPeriod: 12,
    // Parts warranty by manufacturer
    partsWarrantyManufacturerPeriod: 24,
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
        {/* Warranty Periods Section */}
        <div className="space-y-4">
          <h3 className="font-medium text-card-foreground">Default Warranty Periods</h3>
          
          {/* Service Warranty by Company */}
          <div className="flex items-center justify-between p-4 rounded-lg border bg-card">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-full bg-primary/10">
                <Wrench className="h-5 w-5 text-primary" />
              </div>
              <div>
                <Label className="text-base font-medium text-card-foreground">Service Warranty</Label>
                <p className="text-sm text-card-foreground/70">Labor and workmanship warranty by your company</p>
              </div>
            </div>
            <Select
              value={String(settings.serviceWarrantyPeriod)}
              onValueChange={(v) => setSettings(s => ({ ...s, serviceWarrantyPeriod: Number(v) }))}
            >
              <SelectTrigger className="w-[140px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {WARRANTY_PERIOD_OPTIONS.map(opt => (
                  <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Parts Warranty by Company */}
          <div className="flex items-center justify-between p-4 rounded-lg border bg-card">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-full bg-primary/10">
                <Package className="h-5 w-5 text-primary" />
              </div>
              <div>
                <Label className="text-base font-medium text-card-foreground">Parts Warranty (Company)</Label>
                <p className="text-sm text-card-foreground/70">Parts warranty provided by your company</p>
              </div>
            </div>
            <Select
              value={String(settings.partsWarrantyCompanyPeriod)}
              onValueChange={(v) => setSettings(s => ({ ...s, partsWarrantyCompanyPeriod: Number(v) }))}
            >
              <SelectTrigger className="w-[140px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {WARRANTY_PERIOD_OPTIONS.map(opt => (
                  <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Parts Warranty by Manufacturer */}
          <div className="flex items-center justify-between p-4 rounded-lg border bg-card">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-full bg-primary/10">
                <Factory className="h-5 w-5 text-primary" />
              </div>
              <div>
                <Label className="text-base font-medium text-card-foreground">Parts Warranty (Manufacturer)</Label>
                <p className="text-sm text-card-foreground/70">Parts warranty provided by the manufacturer</p>
              </div>
            </div>
            <Select
              value={String(settings.partsWarrantyManufacturerPeriod)}
              onValueChange={(v) => setSettings(s => ({ ...s, partsWarrantyManufacturerPeriod: Number(v) }))}
            >
              <SelectTrigger className="w-[140px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {WARRANTY_PERIOD_OPTIONS.map(opt => (
                  <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Alert Settings */}
        <div className="space-y-4">
          <h3 className="font-medium text-card-foreground">Alert Settings</h3>
          
          <div className="space-y-2">
            <Label className="text-card-foreground">Alert Days Before Expiration</Label>
            <Input
              type="number"
              value={settings.alertDaysBefore}
              onChange={(e) => setSettings(s => ({ ...s, alertDaysBefore: Number(e.target.value) }))}
              className="max-w-[200px]"
            />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <Label className="text-card-foreground">Enable Expiration Alerts</Label>
              <p className="text-sm text-card-foreground/70">
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
              <Label className="text-card-foreground">Auto-Send Extension Offers</Label>
              <p className="text-sm text-card-foreground/70">
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
              <Label className="text-card-foreground">Extension Offer Discount (%)</Label>
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
