import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface WarrantyPolicyFormProps {
  companyId: string;
  policy?: any;
  onSuccess: () => void;
  onCancel: () => void;
}

export function WarrantyPolicyForm({ companyId, policy, onSuccess, onCancel }: WarrantyPolicyFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: policy?.name || '',
    description: policy?.description || '',
    coverage_type: policy?.coverage_type || 'standard',
    duration_months: policy?.duration_months || 12,
    coverage_details: policy?.coverage_details || '',
    terms_conditions: policy?.terms_conditions || '',
    exclusions: policy?.exclusions || '',
    labor_covered: policy?.labor_covered ?? true,
    parts_covered: policy?.parts_covered ?? true,
    is_active: policy?.is_active ?? true,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      if (policy?.id) {
        const { error } = await supabase
          .from('warranty_policies')
          .update(formData)
          .eq('id', policy.id);
        if (error) throw error;
        toast.success('Warranty policy updated');
      } else {
        const { error } = await supabase
          .from('warranty_policies')
          .insert({ ...formData, company_id: companyId });
        if (error) throw error;
        toast.success('Warranty policy created');
      }
      onSuccess();
    } catch (error: any) {
      toast.error(error.message || 'Failed to save warranty policy');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="name">Policy Name *</Label>
        <Input
          id="name"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          placeholder="e.g., Standard Parts Warranty"
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          placeholder="Brief description of this warranty"
          rows={2}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="coverage_type">Coverage Type</Label>
          <Select
            value={formData.coverage_type}
            onValueChange={(value) => setFormData({ ...formData, coverage_type: value })}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="standard">Standard</SelectItem>
              <SelectItem value="extended">Extended</SelectItem>
              <SelectItem value="comprehensive">Comprehensive</SelectItem>
              <SelectItem value="limited">Limited</SelectItem>
              <SelectItem value="manufacturer">Manufacturer</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="duration_months">Duration (Months)</Label>
          <Input
            id="duration_months"
            type="number"
            min={1}
            value={formData.duration_months}
            onChange={(e) => setFormData({ ...formData, duration_months: parseInt(e.target.value) || 12 })}
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="coverage_details">Coverage Details</Label>
        <Textarea
          id="coverage_details"
          value={formData.coverage_details}
          onChange={(e) => setFormData({ ...formData, coverage_details: e.target.value })}
          placeholder="What is covered under this warranty..."
          rows={3}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="exclusions">Exclusions</Label>
        <Textarea
          id="exclusions"
          value={formData.exclusions}
          onChange={(e) => setFormData({ ...formData, exclusions: e.target.value })}
          placeholder="What is NOT covered..."
          rows={2}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="terms_conditions">Terms & Conditions</Label>
        <Textarea
          id="terms_conditions"
          value={formData.terms_conditions}
          onChange={(e) => setFormData({ ...formData, terms_conditions: e.target.value })}
          placeholder="Additional terms and conditions..."
          rows={2}
        />
      </div>

      <div className="flex flex-wrap gap-6">
        <div className="flex items-center gap-2">
          <Switch
            id="labor_covered"
            checked={formData.labor_covered}
            onCheckedChange={(checked) => setFormData({ ...formData, labor_covered: checked })}
          />
          <Label htmlFor="labor_covered">Labor Covered</Label>
        </div>

        <div className="flex items-center gap-2">
          <Switch
            id="parts_covered"
            checked={formData.parts_covered}
            onCheckedChange={(checked) => setFormData({ ...formData, parts_covered: checked })}
          />
          <Label htmlFor="parts_covered">Parts Covered</Label>
        </div>

        <div className="flex items-center gap-2">
          <Switch
            id="is_active"
            checked={formData.is_active}
            onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
          />
          <Label htmlFor="is_active">Active</Label>
        </div>
      </div>

      <div className="flex justify-end gap-2 pt-4">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" disabled={isLoading}>
          {isLoading ? 'Saving...' : policy?.id ? 'Update Policy' : 'Create Policy'}
        </Button>
      </div>
    </form>
  );
}
