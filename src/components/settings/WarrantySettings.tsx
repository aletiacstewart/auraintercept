import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Shield, Save, Wrench, Package, Factory, Loader2 } from 'lucide-react';
import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { triggerSetupProgressRefresh } from '@/hooks/useSetupProgress';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Skeleton } from '@/components/ui/skeleton';

const WARRANTY_PERIOD_OPTIONS = [
  { value: '0', label: 'No warranty' },
  { value: '3', label: '3 months' },
  { value: '6', label: '6 months' },
  { value: '12', label: '1 year' },
  { value: '24', label: '2 years' },
  { value: '36', label: '3 years' },
  { value: '60', label: '5 years' },
];

interface WarrantyPolicy {
  id?: string;
  company_id: string;
  name: string;
  coverage_type: string;
  duration_months: number;
  labor_covered: boolean;
  parts_covered: boolean;
  is_active: boolean;
}

export function WarrantySettings() {
  const { companyId } = useAuth();
  const queryClient = useQueryClient();
  
  const [settings, setSettings] = useState({
    serviceWarrantyPeriod: 12,
    partsWarrantyCompanyPeriod: 12,
    partsWarrantyManufacturerPeriod: 24,
    enableExpirationAlerts: true,
    alertDaysBefore: 30,
    autoExtendOffers: false,
    extendOfferDiscount: 10,
  });
  const [hasChanges, setHasChanges] = useState(false);

  // Fetch existing warranty policies
  const { data: policies, isLoading } = useQuery({
    queryKey: ['warranty-policies', companyId],
    queryFn: async () => {
      if (!companyId) return [];
      const { data, error } = await supabase
        .from('warranty_policies')
        .select('*')
        .eq('company_id', companyId)
        .in('coverage_type', ['service', 'parts_company', 'parts_manufacturer']);
      if (error) throw error;
      return data;
    },
    enabled: !!companyId,
  });

  // Sync local state with fetched data
  useEffect(() => {
    if (policies) {
      const servicePolicy = policies.find(p => p.coverage_type === 'service');
      const partsCompanyPolicy = policies.find(p => p.coverage_type === 'parts_company');
      const partsManufacturerPolicy = policies.find(p => p.coverage_type === 'parts_manufacturer');
      
      setSettings(s => ({
        ...s,
        serviceWarrantyPeriod: servicePolicy?.duration_months ?? 12,
        partsWarrantyCompanyPeriod: partsCompanyPolicy?.duration_months ?? 12,
        partsWarrantyManufacturerPeriod: partsManufacturerPolicy?.duration_months ?? 24,
      }));
      setHasChanges(false);
    }
  }, [policies]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (!companyId) throw new Error('No company ID');

      const warrantyPolicies: WarrantyPolicy[] = [
        {
          company_id: companyId,
          name: 'Service Warranty',
          coverage_type: 'service',
          duration_months: settings.serviceWarrantyPeriod,
          labor_covered: true,
          parts_covered: false,
          is_active: settings.serviceWarrantyPeriod > 0,
        },
        {
          company_id: companyId,
          name: 'Parts Warranty (Company)',
          coverage_type: 'parts_company',
          duration_months: settings.partsWarrantyCompanyPeriod,
          labor_covered: false,
          parts_covered: true,
          is_active: settings.partsWarrantyCompanyPeriod > 0,
        },
        {
          company_id: companyId,
          name: 'Parts Warranty (Manufacturer)',
          coverage_type: 'parts_manufacturer',
          duration_months: settings.partsWarrantyManufacturerPeriod,
          labor_covered: false,
          parts_covered: true,
          is_active: settings.partsWarrantyManufacturerPeriod > 0,
        },
      ];

      // Upsert each warranty policy
      for (const policy of warrantyPolicies) {
        const existingPolicy = policies?.find(p => p.coverage_type === policy.coverage_type);
        
        if (existingPolicy) {
          const { error } = await supabase
            .from('warranty_policies')
            .update({
              duration_months: policy.duration_months,
              is_active: policy.is_active,
            })
            .eq('id', existingPolicy.id);
          if (error) throw error;
        } else {
          const { error } = await supabase
            .from('warranty_policies')
            .insert(policy);
          if (error) throw error;
        }
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['warranty-policies', companyId] });
      toast.success('Warranty settings saved');
      triggerSetupProgressRefresh();
      setHasChanges(false);
    },
    onError: (error) => {
      console.error('Failed to save warranty settings:', error);
      toast.error('Failed to save warranty settings');
    },
  });

  const handleChange = (key: keyof typeof settings, value: number | boolean) => {
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
          <Skeleton className="h-20 w-full" />
        </CardContent>
      </Card>
    );
  }

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
              onValueChange={(v) => handleChange('serviceWarrantyPeriod', Number(v))}
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
              onValueChange={(v) => handleChange('partsWarrantyCompanyPeriod', Number(v))}
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
              onValueChange={(v) => handleChange('partsWarrantyManufacturerPeriod', Number(v))}
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
              onChange={(e) => handleChange('alertDaysBefore', Number(e.target.value))}
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
              onCheckedChange={(checked) => handleChange('enableExpirationAlerts', checked)}
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
              onCheckedChange={(checked) => handleChange('autoExtendOffers', checked)}
            />
          </div>

          {settings.autoExtendOffers && (
            <div className="space-y-2 pl-4 border-l-2 border-muted">
              <Label className="text-card-foreground">Extension Offer Discount (%)</Label>
              <Input
                type="number"
                value={settings.extendOfferDiscount}
                onChange={(e) => handleChange('extendOfferDiscount', Number(e.target.value))}
                className="max-w-xs"
              />
            </div>
          )}
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
