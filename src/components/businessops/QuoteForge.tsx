import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from 'sonner';
import { 
  FileText, 
  Plus, 
  Minus, 
  Search,
  User,
  Mail,
  Phone,
  MapPin,
  Sparkles,
  Check,
  ArrowLeft
} from 'lucide-react';

interface Service {
  id: string;
  name: string;
  description: string | null;
  price: number | null;
  flat_fee: number | null;
  hourly_rate: number | null;
  category: string | null;
}

interface LineItem {
  serviceId: string;
  name: string;
  quantity: number;
  unitPrice: number;
}

interface QuoteForgeProps {
  companyId: string;
  onBack: () => void;
  onSuccess?: () => void;
}

export function QuoteForge({ companyId, onBack, onSuccess }: QuoteForgeProps) {
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedItems, setSelectedItems] = useState<LineItem[]>([]);
  const [customerName, setCustomerName] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerAddress, setCustomerAddress] = useState('');
  const [notes, setNotes] = useState('');
  const [taxRate, setTaxRate] = useState(0);
  const [validDays, setValidDays] = useState(30);

  // Fetch services catalog
  const { data: services = [] } = useQuery({
    queryKey: ['services-catalog', companyId],
    queryFn: async () => {
      const { data } = await supabase
        .from('services')
        .select('*')
        .eq('company_id', companyId)
        .eq('is_active', true)
        .order('category', { ascending: true })
        .order('name');
      return (data || []) as Service[];
    },
    enabled: !!companyId,
  });

  // Group services by category
  const groupedServices = useMemo(() => {
    const filtered = services.filter(s => 
      s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.description?.toLowerCase().includes(searchQuery.toLowerCase())
    );
    
    const groups: Record<string, Service[]> = {};
    filtered.forEach(service => {
      const cat = service.category || 'General';
      if (!groups[cat]) groups[cat] = [];
      groups[cat].push(service);
    });
    return groups;
  }, [services, searchQuery]);

  const getServicePrice = (service: Service) => {
    return service.price || service.flat_fee || service.hourly_rate || 0;
  };

  const addService = (service: Service) => {
    const existing = selectedItems.find(i => i.serviceId === service.id);
    if (existing) {
      setSelectedItems(items => 
        items.map(i => i.serviceId === service.id ? { ...i, quantity: i.quantity + 1 } : i)
      );
    } else {
      setSelectedItems(items => [...items, {
        serviceId: service.id,
        name: service.name,
        quantity: 1,
        unitPrice: getServicePrice(service),
      }]);
    }
  };

  const updateQuantity = (serviceId: string, delta: number) => {
    setSelectedItems(items => 
      items.map(i => {
        if (i.serviceId === serviceId) {
          const newQty = Math.max(1, i.quantity + delta);
          return { ...i, quantity: newQty };
        }
        return i;
      })
    );
  };

  const removeItem = (serviceId: string) => {
    setSelectedItems(items => items.filter(i => i.serviceId !== serviceId));
  };

  const subtotal = selectedItems.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0);
  const taxAmount = subtotal * (taxRate / 100);
  const total = subtotal + taxAmount;

  const createQuoteMutation = useMutation({
    mutationFn: async () => {
      const validUntil = new Date();
      validUntil.setDate(validUntil.getDate() + validDays);

      const { data: quote, error: quoteError } = await supabase
        .from('quotes')
        .insert({
          company_id: companyId,
          customer_name: customerName,
          customer_email: customerEmail || null,
          customer_phone: customerPhone || null,
          customer_address: customerAddress || null,
          notes: notes || null,
          subtotal,
          tax_rate: taxRate,
          tax_amount: taxAmount,
          total_amount: total,
          valid_until: validUntil.toISOString(),
          status: 'draft',
        })
        .select()
        .single();

      if (quoteError) throw quoteError;

      // Insert line items
      const lineItems = selectedItems.map(item => ({
        quote_id: quote.id,
        service_id: item.serviceId,
        description: item.name,
        quantity: item.quantity,
        unit_price: item.unitPrice,
        total: item.quantity * item.unitPrice,
      }));

      const { error: itemsError } = await supabase
        .from('quote_line_items')
        .insert(lineItems);

      if (itemsError) throw itemsError;

      return quote;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['quotes'] });
      queryClient.invalidateQueries({ queryKey: ['pending-quotes'] });
      toast.success('Quote created successfully!');
      onSuccess?.();
      onBack();
    },
    onError: () => toast.error('Failed to create quote'),
  });

  const handleSubmit = () => {
    if (!customerName.trim()) {
      toast.error('Customer name is required');
      return;
    }
    if (selectedItems.length === 0) {
      toast.error('Please add at least one service');
      return;
    }
    createQuoteMutation.mutate();
  };

  const isSelected = (serviceId: string) => selectedItems.some(i => i.serviceId === serviceId);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={onBack} className="h-8 w-8">
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-lg bg-accent/20">
            <Sparkles className="h-5 w-5 text-accent" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-foreground">Quote Forge</h2>
            <p className="text-xs text-muted-foreground">Build branded quotes instantly</p>
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Services Catalog */}
        <Card className="glass-panel border-accent/20">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <FileText className="h-4 w-4 text-accent" />
              Services Catalog
            </CardTitle>
            <div className="relative mt-2">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search services..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="pl-9 bg-background/50"
              />
            </div>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[350px]">
              {Object.keys(groupedServices).length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
                  <FileText className="h-8 w-8 mb-2 opacity-50" />
                  <p className="text-sm">No services found</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {Object.entries(groupedServices).map(([category, categoryServices]) => (
                    <div key={category}>
                      <p className="text-xs font-medium text-muted-foreground mb-2">{category}</p>
                      <div className="space-y-1">
                        {categoryServices.map(service => (
                          <div
                            key={service.id}
                            className={`flex items-center justify-between p-3 rounded-lg cursor-pointer transition-all ${
                              isSelected(service.id) 
                                ? 'bg-accent/20 border border-accent/40' 
                                : 'bg-background/50 hover:bg-background/80 border border-transparent'
                            }`}
                            onClick={() => addService(service)}
                          >
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <p className="font-medium text-sm truncate">{service.name}</p>
                                {isSelected(service.id) && (
                                  <Check className="h-3 w-3 text-accent" />
                                )}
                              </div>
                              {service.description && (
                                <p className="text-xs text-muted-foreground truncate">{service.description}</p>
                              )}
                            </div>
                            <Badge variant="outline" className="bg-accent/10 text-accent border-accent/30 ml-2">
                              ${getServicePrice(service).toFixed(0)}
                            </Badge>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </CardContent>
        </Card>

        {/* Quote Builder */}
        <div className="space-y-4">
          {/* Customer Info */}
          <Card className="glass-panel border-accent/20">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Customer Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs flex items-center gap-1">
                    <User className="h-3 w-3" /> Name *
                  </Label>
                  <Input
                    value={customerName}
                    onChange={e => setCustomerName(e.target.value)}
                    placeholder="Customer name"
                    className="h-8 text-sm bg-background/50"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs flex items-center gap-1">
                    <Phone className="h-3 w-3" /> Phone
                  </Label>
                  <Input
                    value={customerPhone}
                    onChange={e => setCustomerPhone(e.target.value)}
                    placeholder="Phone number"
                    className="h-8 text-sm bg-background/50"
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs flex items-center gap-1">
                  <Mail className="h-3 w-3" /> Email
                </Label>
                <Input
                  value={customerEmail}
                  onChange={e => setCustomerEmail(e.target.value)}
                  placeholder="customer@email.com"
                  className="h-8 text-sm bg-background/50"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs flex items-center gap-1">
                  <MapPin className="h-3 w-3" /> Address
                </Label>
                <Input
                  value={customerAddress}
                  onChange={e => setCustomerAddress(e.target.value)}
                  placeholder="Service address"
                  className="h-8 text-sm bg-background/50"
                />
              </div>
            </CardContent>
          </Card>

          {/* Selected Items */}
          <Card className="glass-panel border-accent/20">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Selected Services ({selectedItems.length})</CardTitle>
            </CardHeader>
            <CardContent>
              {selectedItems.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  Click services from the catalog to add them
                </p>
              ) : (
                <div className="space-y-2">
                  {selectedItems.map(item => (
                    <div key={item.serviceId} className="flex items-center justify-between p-2 rounded-lg bg-background/50">
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm truncate">{item.name}</p>
                        <p className="text-xs text-muted-foreground">${item.unitPrice.toFixed(2)} each</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6"
                          onClick={() => updateQuantity(item.serviceId, -1)}
                        >
                          <Minus className="h-3 w-3" />
                        </Button>
                        <span className="w-6 text-center text-sm font-medium">{item.quantity}</span>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6"
                          onClick={() => updateQuantity(item.serviceId, 1)}
                        >
                          <Plus className="h-3 w-3" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6 text-destructive hover:text-destructive"
                          onClick={() => removeItem(item.serviceId)}
                        >
                          ×
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Totals */}
              <div className="border-t border-accent/20 mt-4 pt-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span>${subtotal.toFixed(2)}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <span className="text-muted-foreground">Tax</span>
                    <Input
                      type="number"
                      value={taxRate}
                      onChange={e => setTaxRate(parseFloat(e.target.value) || 0)}
                      className="w-16 h-6 text-xs text-center bg-background/50"
                    />
                    <span className="text-muted-foreground">%</span>
                  </div>
                  <span>${taxAmount.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-lg font-bold border-t border-accent/20 pt-2">
                  <span>Total</span>
                  <span className="text-accent">${total.toFixed(2)}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Notes & Submit */}
          <div className="space-y-3">
            <Textarea
              placeholder="Additional notes..."
              value={notes}
              onChange={e => setNotes(e.target.value)}
              className="h-20 text-sm bg-background/50 resize-none"
            />
            <Button 
              className="w-full bg-accent hover:bg-accent/90 text-accent-foreground"
              onClick={handleSubmit}
              disabled={createQuoteMutation.isPending}
            >
              <FileText className="h-4 w-4 mr-2" />
              {createQuoteMutation.isPending ? 'Creating...' : 'Generate Quote'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
