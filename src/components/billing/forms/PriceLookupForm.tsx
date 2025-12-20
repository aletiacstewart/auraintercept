import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { DollarSign, Search, ArrowLeft, Package, Wrench, User, Calendar } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { format } from 'date-fns';

interface PriceLookupFormProps {
  companyId: string;
  onCancel?: () => void;
}

export function PriceLookupForm({ companyId, onCancel }: PriceLookupFormProps) {
  const [searchType, setSearchType] = useState<'customer' | 'inventory' | 'service'>('service');
  const [searchQuery, setSearchQuery] = useState('');

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
    enabled: !!companyId && searchType === 'customer' && searchQuery.length >= 2,
  });

  const isLoading = loadingServices || loadingInventory || loadingQuotes;

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
          <TabsTrigger value="customer" className="text-xs">
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
          <div className="border rounded-lg max-h-72 overflow-y-auto">
            {isLoading ? (
              <div className="p-4 text-center text-sm text-muted-foreground">Loading...</div>
            ) : services.length === 0 ? (
              <div className="p-4 text-center text-sm text-muted-foreground">No services found</div>
            ) : (
              <div className="divide-y">
                {services.map((service) => (
                  <div key={service.id} className="p-3">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="font-medium text-sm">{service.name}</div>
                        {service.description && (
                          <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{service.description}</p>
                        )}
                        <div className="flex items-center gap-2 mt-1">
                          {service.category && (
                            <Badge variant="outline" className="text-xs">{service.category}</Badge>
                          )}
                          {service.duration_minutes && (
                            <span className="text-xs text-muted-foreground">{service.duration_minutes} min</span>
                          )}
                        </div>
                      </div>
                      <div className="text-right">
                        {service.price && (
                          <div className="font-semibold text-primary">${service.price.toFixed(2)}</div>
                        )}
                        {service.hourly_rate && (
                          <div className="text-xs text-muted-foreground">${service.hourly_rate}/hr</div>
                        )}
                        {service.flat_fee && (
                          <div className="text-xs text-muted-foreground">Flat: ${service.flat_fee}</div>
                        )}
                        {service.parts_cost && (
                          <div className="text-xs text-muted-foreground">Parts: ${service.parts_cost}</div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="inventory" className="mt-3">
          <div className="border rounded-lg max-h-72 overflow-y-auto">
            {isLoading ? (
              <div className="p-4 text-center text-sm text-muted-foreground">Loading...</div>
            ) : inventoryItems.length === 0 ? (
              <div className="p-4 text-center text-sm text-muted-foreground">No parts found</div>
            ) : (
              <div className="divide-y">
                {inventoryItems.map((item) => (
                  <div key={item.id} className="p-3">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-sm">{item.name}</span>
                          {item.sku && (
                            <span className="text-xs text-muted-foreground">#{item.sku}</span>
                          )}
                        </div>
                        {item.category && (
                          <Badge variant="outline" className="text-xs mt-1">{item.category}</Badge>
                        )}
                      </div>
                      <div className="text-right">
                        {item.unit_cost && (
                          <div className="font-semibold text-primary">${item.unit_cost.toFixed(2)}</div>
                        )}
                        <div className="text-xs text-muted-foreground">{item.quantity} in stock</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="customer" className="mt-3">
          <div className="border rounded-lg max-h-72 overflow-y-auto">
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
    </div>
  );
}
