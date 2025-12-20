import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Package, Search, ArrowLeft, AlertTriangle, CheckCircle } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Badge } from '@/components/ui/badge';

interface InventoryItem {
  id: string;
  name: string;
  sku: string | null;
  category: string | null;
  quantity: number;
  min_quantity: number;
  unit_cost: number | null;
  supplier: string | null;
}

interface InventorySearchFormProps {
  companyId: string;
  onCancel?: () => void;
  onSelectItem?: (item: InventoryItem) => void;
}

export function InventorySearchForm({ companyId, onCancel, onSelectItem }: InventorySearchFormProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');

  const { data: inventoryItems = [], isLoading } = useQuery({
    queryKey: ['inventory-search', companyId, searchQuery, categoryFilter],
    queryFn: async () => {
      let query = supabase
        .from('inventory_items')
        .select('*')
        .eq('company_id', companyId)
        .eq('is_active', true)
        .order('name');

      if (searchQuery.trim()) {
        query = query.or(`name.ilike.%${searchQuery}%,sku.ilike.%${searchQuery}%`);
      }
      if (categoryFilter && categoryFilter !== 'all') {
        query = query.eq('category', categoryFilter);
      }

      const { data } = await query.limit(50);
      return (data || []) as InventoryItem[];
    },
    enabled: !!companyId,
  });

  // Get unique categories
  const { data: categories = [] } = useQuery({
    queryKey: ['inventory-categories', companyId],
    queryFn: async () => {
      const { data } = await supabase
        .from('inventory_items')
        .select('category')
        .eq('company_id', companyId)
        .eq('is_active', true)
        .not('category', 'is', null);
      
      const uniqueCategories = [...new Set(data?.map(d => d.category).filter(Boolean))];
      return uniqueCategories as string[];
    },
    enabled: !!companyId,
  });

  const getStockStatus = (item: InventoryItem) => {
    if (item.quantity <= 0) return { status: 'out', label: 'Out of Stock', color: 'destructive' };
    if (item.quantity <= item.min_quantity) return { status: 'low', label: 'Low Stock', color: 'warning' };
    return { status: 'ok', label: 'In Stock', color: 'success' };
  };

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
        <Package className="h-5 w-5 text-primary" />
        <h3 className="font-semibold">Inventory Search</h3>
      </div>

      <div className="space-y-3">
        <div className="grid grid-cols-2 gap-2">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by name or SKU..."
              className="pl-9 h-9 text-sm"
            />
          </div>
          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="h-9 text-sm">
              <SelectValue placeholder="All Categories" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              {categories.map((cat) => (
                <SelectItem key={cat} value={cat}>{cat}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Results */}
        <div className="border rounded-lg max-h-80 overflow-y-auto">
          {isLoading ? (
            <div className="p-4 text-center text-sm text-muted-foreground">Loading...</div>
          ) : inventoryItems.length === 0 ? (
            <div className="p-4 text-center text-sm text-muted-foreground">No items found</div>
          ) : (
            <div className="divide-y">
              {inventoryItems.map((item) => {
                const stockStatus = getStockStatus(item);
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => onSelectItem?.(item)}
                    className="w-full text-left p-3 hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-sm truncate">{item.name}</span>
                          {item.sku && (
                            <span className="text-xs text-muted-foreground">#{item.sku}</span>
                          )}
                        </div>
                        <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                          {item.category && <span>{item.category}</span>}
                          {item.supplier && <span>• {item.supplier}</span>}
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-1">
                        <Badge 
                          variant={stockStatus.color === 'destructive' ? 'destructive' : stockStatus.color === 'warning' ? 'secondary' : 'default'}
                          className="text-xs"
                        >
                          {stockStatus.status === 'out' && <AlertTriangle className="h-3 w-3 mr-1" />}
                          {stockStatus.status === 'ok' && <CheckCircle className="h-3 w-3 mr-1" />}
                          {item.quantity} qty
                        </Badge>
                        {item.unit_cost && (
                          <span className="text-xs text-muted-foreground">${item.unit_cost.toFixed(2)}</span>
                        )}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        <div className="text-xs text-muted-foreground text-center">
          {inventoryItems.length} items found
        </div>
      </div>
    </div>
  );
}
