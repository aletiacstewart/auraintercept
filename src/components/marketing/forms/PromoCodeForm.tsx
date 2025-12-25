import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { X, Tag, Plus, Copy, Search, Check } from 'lucide-react';
import { format } from 'date-fns';

interface PromoCodeFormProps {
  companyId: string;
  onCancel: () => void;
  onSuccess?: (data: { code: string; discount: string }) => void;
}

export const PromoCodeForm: React.FC<PromoCodeFormProps> = ({ companyId, onCancel, onSuccess }) => {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('create');
  const [searchQuery, setSearchQuery] = useState('');
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  
  const [formData, setFormData] = useState({
    code: '',
    discountType: 'percent',
    discountValue: '',
    expiresAt: '',
    usageLimit: '',
  });

  // Fetch existing campaigns with promo codes
  const { data: campaigns } = useQuery({
    queryKey: ['promo-campaigns', companyId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('marketing_campaigns')
        .select('*')
        .eq('company_id', companyId)
        .not('promo_code', 'is', null)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data;
    },
  });

  const generateCode = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = '';
    for (let i = 0; i < 8; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setFormData(prev => ({ ...prev, code }));
  };

  const createPromoCode = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase
        .from('marketing_campaigns')
        .insert({
          company_id: companyId,
          name: `Promo: ${formData.code}`,
          campaign_type: 'promotional',
          promo_code: formData.code,
          discount_type: formData.discountType,
          discount_value: parseFloat(formData.discountValue),
          end_date: formData.expiresAt || null,
          status: 'active',
          channels: [],
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      toast.success('Promo code created successfully!');
      queryClient.invalidateQueries({ queryKey: ['promo-campaigns'] });
      const discount = data.discount_type === 'percent' ? `${data.discount_value}%` : `$${data.discount_value}`;
      onSuccess?.({ code: data.promo_code, discount });
      setFormData({ code: '', discountType: 'percent', discountValue: '', expiresAt: '', usageLimit: '' });
      setActiveTab('existing');
    },
    onError: (error) => {
      toast.error('Failed to create promo code: ' + error.message);
    },
  });

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    toast.success('Promo code copied!');
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.code || !formData.discountValue) {
      toast.error('Please fill in required fields');
      return;
    }
    createPromoCode.mutate();
  };

  const filteredCampaigns = campaigns?.filter(c => 
    c.promo_code?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <Card className="border-orange-200 bg-orange-50/50">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <Tag className="h-5 w-5 text-orange-600" />
            Promo Codes
          </CardTitle>
          <Button variant="ghost" size="icon" onClick={onCancel}>
            <X className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-2 mb-4">
            <TabsTrigger value="create">
              <Plus className="h-4 w-4 mr-1" />
              Create New
            </TabsTrigger>
            <TabsTrigger value="existing">
              <Search className="h-4 w-4 mr-1" />
              Existing Codes
            </TabsTrigger>
          </TabsList>

          <TabsContent value="create">
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Promo Code */}
              <div className="space-y-2">
                <Label>Promo Code *</Label>
                <div className="flex gap-2">
                  <Input
                    placeholder="SUMMER20"
                    value={formData.code}
                    onChange={(e) => setFormData(prev => ({ ...prev, code: e.target.value.toUpperCase() }))}
                    className="flex-1"
                  />
                  <Button type="button" variant="outline" onClick={generateCode}>
                    Generate
                  </Button>
                </div>
              </div>

              {/* Discount */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label>Discount Type</Label>
                  <Select
                    value={formData.discountType}
                    onValueChange={(value) => setFormData(prev => ({ ...prev, discountType: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="percent">Percentage (%)</SelectItem>
                      <SelectItem value="fixed">Fixed Amount ($)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Discount Value *</Label>
                  <Input
                    type="number"
                    placeholder={formData.discountType === 'percent' ? '20' : '50'}
                    value={formData.discountValue}
                    onChange={(e) => setFormData(prev => ({ ...prev, discountValue: e.target.value }))}
                  />
                </div>
              </div>

              {/* Expiration */}
              <div className="space-y-2">
                <Label>Expires On (Optional)</Label>
                <Input
                  type="date"
                  value={formData.expiresAt}
                  onChange={(e) => setFormData(prev => ({ ...prev, expiresAt: e.target.value }))}
                />
              </div>

              {/* Actions */}
              <div className="flex gap-2 pt-2">
                <Button
                  type="submit"
                  className="flex-1"
                  disabled={createPromoCode.isPending}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  {createPromoCode.isPending ? 'Creating...' : 'Create Promo Code'}
                </Button>
                <Button type="button" variant="outline" onClick={onCancel}>
                  Cancel
                </Button>
              </div>
            </form>
          </TabsContent>

          <TabsContent value="existing">
            <div className="space-y-4">
              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search promo codes..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>

              {/* List */}
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {filteredCampaigns?.length === 0 ? (
                  <p className="text-center text-muted-foreground py-4">No promo codes found</p>
                ) : (
                  filteredCampaigns?.map((campaign) => (
                    <div
                      key={campaign.id}
                      className="flex items-center justify-between p-3 rounded-lg border bg-background"
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <code className="font-mono font-bold text-orange-600">
                            {campaign.promo_code}
                          </code>
                          <Badge variant={campaign.status === 'active' ? 'default' : 'secondary'}>
                            {campaign.status}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {campaign.discount_type === 'percent' 
                            ? `${campaign.discount_value}% off`
                            : `$${campaign.discount_value} off`}
                          {campaign.end_date && ` • Expires ${format(new Date(campaign.end_date), 'MMM d, yyyy')}`}
                        </p>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleCopyCode(campaign.promo_code!)}
                      >
                        {copiedCode === campaign.promo_code ? (
                          <Check className="h-4 w-4 text-green-600" />
                        ) : (
                          <Copy className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  ))
                )}
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};
