import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { DollarSign, Search, ArrowLeft, Package, Wrench, User, Calendar, Check, Plus, Minus, Send, Loader2, Mail, MessageSquare, X, ShoppingCart } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { format } from 'date-fns';
import { toast } from 'sonner';

interface SelectedService {
  id: string;
  name: string;
  price: number;
  quantity: number;
  type: 'service';
}

interface SelectedPart {
  id: string;
  name: string;
  price: number;
  quantity: number;
  type: 'part';
}

type SelectedItem = SelectedService | SelectedPart;

interface PriceLookupFormProps {
  companyId: string;
  onCancel?: () => void;
}

export function PriceLookupForm({ companyId, onCancel }: PriceLookupFormProps) {
  const [searchType, setSearchType] = useState<'service' | 'inventory' | 'quote'>('service');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Quote builder state
  const [selectedItems, setSelectedItems] = useState<SelectedItem[]>([]);
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [customerAddress, setCustomerAddress] = useState('');
  const [notes, setNotes] = useState('');
  const [sendEmail, setSendEmail] = useState(true);
  const [sendSms, setSendSms] = useState(false);
  const [isSending, setIsSending] = useState(false);

  // Search services
  const { data: services = [], isLoading: loadingServices } = useQuery({
    queryKey: ['service-prices', companyId, searchQuery],
    queryFn: async () => {
      let query = supabase
        .from('services')
        .select('id, name, description, price, hourly_rate, flat_fee, parts_cost, duration_minutes, category')
        .eq('company_id', companyId)
        .eq('is_active', true)
        .order('name');

      if (searchQuery.trim()) {
        query = query.ilike('name', `%${searchQuery}%`);
      }

      const { data } = await query.limit(20);
      return data || [];
    },
    enabled: !!companyId && searchType === 'service',
  });

  // Search inventory items
  const { data: inventoryItems = [], isLoading: loadingInventory } = useQuery({
    queryKey: ['inventory-prices', companyId, searchQuery],
    queryFn: async () => {
      let query = supabase
        .from('inventory_items')
        .select('id, name, sku, category, unit_cost, quantity')
        .eq('company_id', companyId)
        .eq('is_active', true)
        .order('name');

      if (searchQuery.trim()) {
        query = query.or(`name.ilike.%${searchQuery}%,sku.ilike.%${searchQuery}%`);
      }

      const { data } = await query.limit(20);
      return data || [];
    },
    enabled: !!companyId && searchType === 'inventory',
  });

  // Search customer quotes
  const { data: quotes = [], isLoading: loadingQuotes } = useQuery({
    queryKey: ['customer-quotes', companyId, searchQuery],
    queryFn: async () => {
      if (!searchQuery.trim()) return [];
      const { data } = await supabase
        .from('quotes')
        .select('id, customer_name, customer_phone, subtotal, total_amount, status, created_at')
        .eq('company_id', companyId)
        .or(`customer_name.ilike.%${searchQuery}%,customer_phone.ilike.%${searchQuery}%`)
        .order('created_at', { ascending: false })
        .limit(10);
      return data || [];
    },
    enabled: !!companyId && searchType === 'quote' && searchQuery.length >= 2,
  });

  const isLoading = loadingServices || loadingInventory || loadingQuotes;

  const addService = (service: typeof services[0]) => {
    const price = service.price || service.flat_fee || service.hourly_rate || 0;
    const existingIndex = selectedItems.findIndex(item => item.id === service.id && item.type === 'service');
    
    if (existingIndex >= 0) {
      const updated = [...selectedItems];
      updated[existingIndex].quantity += 1;
      setSelectedItems(updated);
    } else {
      setSelectedItems([...selectedItems, {
        id: service.id,
        name: service.name,
        price,
        quantity: 1,
        type: 'service',
      }]);
    }
    toast.success(`Added ${service.name}`);
  };

  const addPart = (item: typeof inventoryItems[0]) => {
    const price = item.unit_cost || 0;
    const existingIndex = selectedItems.findIndex(i => i.id === item.id && i.type === 'part');
    
    if (existingIndex >= 0) {
      const updated = [...selectedItems];
      updated[existingIndex].quantity += 1;
      setSelectedItems(updated);
    } else {
      setSelectedItems([...selectedItems, {
        id: item.id,
        name: item.name,
        price,
        quantity: 1,
        type: 'part',
      }]);
    }
    toast.success(`Added ${item.name}`);
  };

  const updateQuantity = (index: number, delta: number) => {
    const updated = [...selectedItems];
    updated[index].quantity = Math.max(1, updated[index].quantity + delta);
    setSelectedItems(updated);
  };

  const removeItem = (index: number) => {
    setSelectedItems(selectedItems.filter((_, i) => i !== index));
  };

  const subtotal = selectedItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const taxRate = 0; // Can be configured
  const taxAmount = subtotal * taxRate;
  const total = subtotal + taxAmount;

  const handleSendQuote = async () => {
    if (!customerName.trim()) {
      toast.error('Please enter customer name');
      return;
    }
    if (selectedItems.length === 0) {
      toast.error('Please add at least one service or part');
      return;
    }
    if (!sendEmail && !sendSms) {
      toast.error('Please select at least one delivery method');
      return;
    }

    setIsSending(true);
    try {
      // Create quote in database
      const { data: quote, error: quoteError } = await supabase
        .from('quotes')
        .insert({
          company_id: companyId,
          customer_name: customerName,
          customer_phone: customerPhone || null,
          customer_email: customerEmail || null,
          customer_address: customerAddress || null,
          notes: notes || null,
          subtotal,
          tax_rate: taxRate,
          tax_amount: taxAmount,
          total_amount: total,
          status: 'pending',
        })
        .select()
        .single();

      if (quoteError) throw quoteError;

      // Create line items
      const lineItems = selectedItems.map(item => ({
        quote_id: quote.id,
        description: item.name,
        quantity: item.quantity,
        unit_price: item.price,
        total: item.price * item.quantity,
        service_id: item.type === 'service' ? item.id : null,
      }));

      const { error: lineError } = await supabase
        .from('quote_line_items')
        .insert(lineItems);

      if (lineError) throw lineError;

      const channels = [];
      if (sendEmail && customerEmail) channels.push('email');
      if (sendSms && customerPhone) channels.push('SMS');

      toast.success(`Quote created and sent via ${channels.join(' and ')}`);
      
      // Reset form
      setSelectedItems([]);
      setCustomerName('');
      setCustomerPhone('');
      setCustomerEmail('');
      setCustomerAddress('');
      setNotes('');
    } catch (error) {
      console.error('Error creating quote:', error);
      toast.error('Failed to create quote');
    } finally {
      setIsSending(false);
    }
  };

  const isServiceSelected = (id: string) => selectedItems.some(item => item.id === id && item.type === 'service');
  const isPartSelected = (id: string) => selectedItems.some(item => item.id === id && item.type === 'part');

  return (
    <div className="space-y-3 p-3">
      <div className="flex items-center gap-2 mb-3">
        {onCancel && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={onCancel}
            className="h-7 w-7 p-0 rounded-full hover:bg-muted"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
        )}
        <DollarSign className="h-5 w-5 text-primary" />
        <h3 className="font-semibold">Price Lookup</h3>
        {selectedItems.length > 0 && (
          <Badge variant="secondary" className="ml-auto">
            <ShoppingCart className="h-3 w-3 mr-1" />
            {selectedItems.length} items
          </Badge>
        )}
      </div>

      <Tabs value={searchType} onValueChange={(v) => { setSearchType(v as any); setSearchQuery(''); }}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="service" className="text-xs">
            <Wrench className="h-3.5 w-3.5 mr-1" />
            Services
          </TabsTrigger>
          <TabsTrigger value="inventory" className="text-xs">
            <Package className="h-3.5 w-3.5 mr-1" />
            Parts
          </TabsTrigger>
          <TabsTrigger value="quote" className="text-xs">
            <User className="h-3.5 w-3.5 mr-1" />
            Quotes
          </TabsTrigger>
        </TabsList>

        <div className="mt-3">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={
                searchType === 'service' ? 'Search services...' :
                searchType === 'inventory' ? 'Search parts by name or SKU...' :
                'Search customer by name or phone...'
              }
              className="pl-9 h-9 text-sm"
            />
          </div>
        </div>

        <TabsContent value="service" className="mt-3">
          <div className="border rounded-lg max-h-48 overflow-y-auto">
            {isLoading ? (
              <div className="p-4 text-center text-sm text-muted-foreground">Loading...</div>
            ) : services.length === 0 ? (
              <div className="p-4 text-center text-sm text-muted-foreground">No services found</div>
            ) : (
              <div className="divide-y">
                {services.map((service) => {
                  const selected = isServiceSelected(service.id);
                  return (
                    <div 
                      key={service.id} 
                      className={`p-3 transition-colors ${selected ? 'bg-primary/5' : ''}`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="font-medium text-sm">{service.name}</div>
                          {service.description && (
                            <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{service.description}</p>
                          )}
                          <div className="flex items-center gap-2 mt-1">
                            {service.category && (
                              <Badge variant="outline" className="text-xs text-muted-foreground border-white/30">{service.category}</Badge>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="text-right mr-2">
                            {service.price && (
                              <div className="font-semibold text-primary">${service.price.toFixed(2)}</div>
                            )}
                            {service.hourly_rate && (
                              <div className="text-xs text-muted-foreground">${service.hourly_rate}/hr</div>
                            )}
                          </div>
                          <Button
                            type="button"
                            size="sm"
                            variant={selected ? 'secondary' : 'default'}
                            onClick={() => addService(service)}
                            className="h-7 w-7 p-0"
                          >
                            {selected ? <Check className="h-3.5 w-3.5" /> : <Plus className="h-3.5 w-3.5" />}
                          </Button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="inventory" className="mt-3">
          <div className="border rounded-lg max-h-48 overflow-y-auto">
            {isLoading ? (
              <div className="p-4 text-center text-sm text-muted-foreground">Loading...</div>
            ) : inventoryItems.length === 0 ? (
              <div className="p-4 text-center text-sm text-muted-foreground">No parts found</div>
            ) : (
              <div className="divide-y">
                {inventoryItems.map((item) => {
                  const selected = isPartSelected(item.id);
                  return (
                    <div 
                      key={item.id} 
                      className={`p-3 transition-colors ${selected ? 'bg-primary/5' : ''}`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-sm">{item.name}</span>
                            {item.sku && (
                              <span className="text-xs text-muted-foreground">#{item.sku}</span>
                            )}
                          </div>
                          <div className="flex items-center gap-2 mt-1">
                            {item.category && (
                              <Badge variant="outline" className="text-xs text-muted-foreground border-white/30">{item.category}</Badge>
                            )}
                            <span className="text-xs text-muted-foreground">{item.quantity} in stock</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="text-right mr-2">
                            {item.unit_cost && (
                              <div className="font-semibold text-primary">${item.unit_cost.toFixed(2)}</div>
                            )}
                          </div>
                          <Button
                            type="button"
                            size="sm"
                            variant={selected ? 'secondary' : 'default'}
                            onClick={() => addPart(item)}
                            className="h-7 w-7 p-0"
                          >
                            {selected ? <Check className="h-3.5 w-3.5" /> : <Plus className="h-3.5 w-3.5" />}
                          </Button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="quote" className="mt-3">
          <div className="border rounded-lg max-h-48 overflow-y-auto">
            {searchQuery.length < 2 ? (
              <div className="p-4 text-center text-sm text-muted-foreground">
                Enter at least 2 characters to search
              </div>
            ) : isLoading ? (
              <div className="p-4 text-center text-sm text-muted-foreground">Loading...</div>
            ) : quotes.length === 0 ? (
              <div className="p-4 text-center text-sm text-muted-foreground">No quotes found</div>
            ) : (
              <div className="divide-y">
                {quotes.map((quote) => (
                  <div key={quote.id} className="p-3">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <User className="h-3.5 w-3.5 text-muted-foreground" />
                          <span className="font-medium text-sm">{quote.customer_name}</span>
                        </div>
                        <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                          <Calendar className="h-3 w-3" />
                          {format(new Date(quote.created_at), 'MMM d, yyyy')}
                          <Badge variant={quote.status === 'accepted' ? 'default' : 'secondary'} className="text-xs">
                            {quote.status}
                          </Badge>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-semibold text-primary">${quote.total_amount.toFixed(2)}</div>
                        <div className="text-xs text-muted-foreground">Subtotal: ${quote.subtotal.toFixed(2)}</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>

      {/* Selected Items / Quote Builder */}
      {selectedItems.length > 0 && (
        <div className="border rounded-lg p-3 bg-muted/30 space-y-3">
          <div className="flex items-center justify-between">
            <Label className="text-sm font-semibold flex items-center gap-2">
              <ShoppingCart className="h-4 w-4" />
              Quote Items
            </Label>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setSelectedItems([])}
              className="h-6 text-xs text-muted-foreground"
            >
              Clear all
            </Button>
          </div>
          
          <div className="space-y-2 max-h-32 overflow-y-auto">
            {selectedItems.map((item, index) => (
              <div key={`${item.type}-${item.id}`} className="flex items-center justify-between bg-background rounded-md p-2 text-sm">
                <div className="flex-1">
                  <span className="font-medium">{item.name}</span>
                  <Badge variant="outline" className="ml-2 text-xs">
                    {item.type === 'service' ? 'Service' : 'Part'}
                  </Badge>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => updateQuantity(index, -1)}
                    className="h-6 w-6 p-0"
                  >
                    <Minus className="h-3 w-3" />
                  </Button>
                  <span className="w-6 text-center">{item.quantity}</span>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => updateQuantity(index, 1)}
                    className="h-6 w-6 p-0"
                  >
                    <Plus className="h-3 w-3" />
                  </Button>
                  <span className="w-16 text-right font-medium">${(item.price * item.quantity).toFixed(2)}</span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => removeItem(index)}
                    className="h-6 w-6 p-0 text-destructive hover:text-destructive"
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            ))}
          </div>

          <div className="border-t pt-2 flex justify-between text-sm font-semibold">
            <span>Total</span>
            <span className="text-primary">${total.toFixed(2)}</span>
          </div>
        </div>
      )}

      {/* Customer Information & Send */}
      {selectedItems.length > 0 && (
        <div className="space-y-3 border rounded-lg p-3">
          <Label className="text-sm font-semibold">Customer Information</Label>
          
          <div className="grid grid-cols-2 gap-2">
            <Input
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              placeholder="Customer Name *"
              className="h-9 text-sm"
              required
            />
            <Input
              type="tel"
              value={customerPhone}
              onChange={(e) => setCustomerPhone(e.target.value)}
              placeholder="Phone Number"
              className="h-9 text-sm"
            />
          </div>
          
          <div className="grid grid-cols-2 gap-2">
            <Input
              type="email"
              value={customerEmail}
              onChange={(e) => setCustomerEmail(e.target.value)}
              placeholder="Email Address"
              className="h-9 text-sm"
            />
            <Input
              value={customerAddress}
              onChange={(e) => setCustomerAddress(e.target.value)}
              placeholder="Address"
              className="h-9 text-sm"
            />
          </div>
          
          <Textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Notes (optional)"
            rows={2}
            className="text-sm resize-none"
          />

          <div className="border rounded-lg p-3 space-y-2 bg-muted/30">
            <Label className="text-sm font-medium">Send Quote Via</Label>
            <div className="flex items-center gap-6">
              <label className="flex items-center gap-2 cursor-pointer">
                <Switch checked={sendEmail} onCheckedChange={setSendEmail} />
                <Mail className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">Email</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <Switch checked={sendSms} onCheckedChange={setSendSms} />
                <MessageSquare className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">SMS</span>
              </label>
            </div>
          </div>

          <Button 
            onClick={handleSendQuote} 
            className="w-full h-9" 
            disabled={!customerName.trim() || isSending || (!sendEmail && !sendSms)}
          >
            {isSending ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Creating Quote...
              </>
            ) : (
              <>
                <Send className="h-4 w-4 mr-2" />
                Create & Send Quote (${total.toFixed(2)})
              </>
            )}
          </Button>
        </div>
      )}
    </div>
  );
}
