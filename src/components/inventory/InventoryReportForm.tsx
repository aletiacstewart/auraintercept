import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { X, Package, AlertTriangle, CheckCircle, RefreshCcw, Boxes } from 'lucide-react';
import { useIndustryPack } from '@/hooks/useIndustryPack';
import { getInventoryTaxonomy } from '@/lib/industryFormSchemas';

interface InventoryReportFormProps {
  companyId: string;
  onCancel: () => void;
  onAnalyze?: (data: Record<string, unknown>) => void;
}

type ReportView = 'stock_levels' | 'low_stock' | 'reorder';

export const InventoryReportForm: React.FC<InventoryReportFormProps> = ({ companyId, onCancel, onAnalyze: _onAnalyze }) => {
  const [reportView, setReportView] = useState<ReportView>('stock_levels');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const { pack } = useIndustryPack();
  const taxonomy = getInventoryTaxonomy(pack);
  const inventoryLabel = taxonomy.label || 'Inventory';

  // Fetch inventory data
  const { data: inventoryData, isLoading } = useQuery({
    queryKey: ['inventory-report', companyId, categoryFilter],
    queryFn: async () => {
      let query = supabase
        .from('inventory_items')
        .select('*')
        .eq('company_id', companyId)
        .eq('is_active', true);

      if (categoryFilter !== 'all') {
        query = query.eq('category', categoryFilter);
      }

      const { data: items } = await query;

      const totalItems = items?.length || 0;
      const totalValue = items?.reduce((sum, item) => sum + (item.quantity * (item.unit_cost || 0)), 0) || 0;
      const lowStockItems = items?.filter(item => item.quantity <= item.min_quantity) || [];
      const outOfStockItems = items?.filter(item => item.quantity === 0) || [];
      const healthyItems = items?.filter(item => item.quantity > item.min_quantity) || [];

      // Get unique categories — merge actual data with industry pack suggestions
      const dataCategories = [...new Set(items?.map(item => item.category).filter(Boolean))] as string[];
      const packCategories = (taxonomy.categories || []) as string[];
      const categories = [...new Set([...dataCategories, ...packCategories])];

      return {
        items: items || [],
        totalItems,
        totalValue,
        lowStockItems,
        outOfStockItems,
        healthyItems,
        categories,
      };
    },
  });

  const renderStockLevels = () => (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <div className="p-4 rounded-lg bg-background border">
          <div className="flex items-center gap-2 text-muted-foreground mb-1">
            <Boxes className="h-4 w-4" />
            <span className="text-sm">Total Items</span>
          </div>
          <p className="text-2xl font-bold text-foreground">{inventoryData?.totalItems || 0}</p>
        </div>

        <div className="p-4 rounded-lg bg-background border">
          <div className="flex items-center gap-2 text-muted-foreground mb-1">
            <Package className="h-4 w-4" />
            <span className="text-sm">Total Value</span>
          </div>
          <p className="text-2xl font-bold text-secondary">${(inventoryData?.totalValue || 0).toLocaleString()}</p>
        </div>

        <div className="p-4 rounded-lg bg-background border">
          <div className="flex items-center gap-2 text-muted-foreground mb-1">
            <CheckCircle className="h-4 w-4 text-secondary" />
            <span className="text-sm">Healthy Stock</span>
          </div>
          <p className="text-2xl font-bold text-secondary">{inventoryData?.healthyItems?.length || 0}</p>
        </div>

        <div className="p-4 rounded-lg bg-background border">
          <div className="flex items-center gap-2 text-muted-foreground mb-1">
            <AlertTriangle className="h-4 w-4 text-warning" />
            <span className="text-sm">Low Stock</span>
          </div>
          <p className="text-2xl font-bold text-warning">{inventoryData?.lowStockItems?.length || 0}</p>
        </div>
      </div>

      {/* Top items by value */}
      {inventoryData?.items && inventoryData.items.length > 0 && (
        <div className="p-4 rounded-lg bg-background border">
          <h4 className="font-medium mb-3">Top Items by Stock Level</h4>
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {inventoryData.items
              .sort((a, b) => b.quantity - a.quantity)
              .slice(0, 5)
              .map((item) => (
                <div key={item.id} className="flex items-center justify-between p-2 rounded bg-muted/50">
                  <div>
                    <p className="font-medium text-sm">{item.name}</p>
                    <p className="text-xs text-muted-foreground">{item.category || 'Uncategorized'}</p>
                  </div>
                  <Badge variant={item.quantity <= item.min_quantity ? 'destructive' : 'secondary'}>
                    {item.quantity} in stock
                  </Badge>
                </div>
              ))}
          </div>
        </div>
      )}
    </div>
  );

  const renderLowStock = () => (
    <div className="space-y-4">
      <h4 className="font-medium flex items-center gap-2">
        <AlertTriangle className="h-4 w-4 text-amber-500" />
        Low Stock Alert ({inventoryData?.lowStockItems?.length || 0} items)
      </h4>

      {inventoryData?.lowStockItems && inventoryData.lowStockItems.length > 0 ? (
        <div className="space-y-2 max-h-64 overflow-y-auto">
          {inventoryData.lowStockItems.map((item) => (
            <div key={item.id} className="p-4 rounded-lg bg-amber-50 border border-amber-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">{item.name}</p>
                  <p className="text-xs text-muted-foreground">{item.sku || 'No SKU'} • {item.category || 'Uncategorized'}</p>
                </div>
                <Badge variant={item.quantity === 0 ? 'destructive' : 'secondary'}>
                  {item.quantity === 0 ? 'Out of Stock' : `${item.quantity} left`}
                </Badge>
              </div>
              <div className="mt-2">
                <div className="flex justify-between text-xs text-muted-foreground mb-1">
                  <span>Stock Level</span>
                  <span>{item.quantity} / {item.min_quantity} min</span>
                </div>
                <Progress 
                  value={Math.min(100, (item.quantity / item.min_quantity) * 100)} 
                  className="h-2"
                />
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="p-4 rounded-lg bg-green-50 border border-green-200">
          <p className="font-medium text-green-800 flex items-center gap-2">
            <CheckCircle className="h-4 w-4" />
            All Items Well Stocked
          </p>
          <p className="text-sm text-green-700 mt-1">
            No items are currently below minimum stock levels.
          </p>
        </div>
      )}
    </div>
  );

  const renderReorder = () => (
    <div className="space-y-4">
      <h4 className="font-medium flex items-center gap-2">
        <RefreshCcw className="h-4 w-4 text-cyan-400" />
        Reorder Recommendations
      </h4>

      {inventoryData?.lowStockItems && inventoryData.lowStockItems.length > 0 ? (
        <>
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {inventoryData.lowStockItems.map((item) => {
              const reorderQty = Math.max(item.min_quantity * 2 - item.quantity, item.min_quantity);
              const estimatedCost = reorderQty * (item.unit_cost || 0);
              
              return (
                <div key={item.id} className="p-3 rounded-lg bg-background border">
                  <div className="flex items-center justify-between mb-2">
                    <p className="font-medium">{item.name}</p>
                    <Badge variant="outline">Reorder: {reorderQty}</Badge>
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-xs">
                    <div>
                      <p className="text-muted-foreground">Current</p>
                      <p className="font-medium text-foreground">{item.quantity}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Minimum</p>
                      <p className="font-medium text-foreground">{item.min_quantity}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Est. Cost</p>
                      <p className="font-medium text-foreground">${estimatedCost.toFixed(2)}</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="p-4 rounded-lg bg-secondary/10 border border-secondary/20">
            <p className="font-medium text-secondary-foreground">Total Reorder Estimate</p>
            <p className="text-2xl font-bold text-secondary mt-1">
              ${inventoryData.lowStockItems
                .reduce((sum, item) => {
                  const reorderQty = Math.max(item.min_quantity * 2 - item.quantity, item.min_quantity);
                  return sum + (reorderQty * (item.unit_cost || 0));
                }, 0)
                .toLocaleString()}
            </p>
            <p className="text-xs text-secondary mt-1">{inventoryData.lowStockItems.length} items need reordering</p>
          </div>
        </>
      ) : (
        <div className="p-4 rounded-lg bg-green-50 border border-green-200">
          <p className="font-medium text-green-800 flex items-center gap-2">
            <CheckCircle className="h-4 w-4" />
            No Reorders Needed
          </p>
          <p className="text-sm text-green-700 mt-1">
            All inventory items are above minimum stock levels.
          </p>
        </div>
      )}
    </div>
  );

  return (
    <Card className="border-orange-200 bg-orange-50/50">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <Package className="h-5 w-5 text-orange-600" />
            {inventoryLabel} Report
          </CardTitle>
          <Button variant="ghost" size="icon" onClick={onCancel}>
            <X className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Filters */}
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-2">
            <Label>Report Type</Label>
            <Select value={reportView} onValueChange={(v) => setReportView(v as ReportView)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="stock_levels">Stock Levels</SelectItem>
                <SelectItem value="low_stock">Low Stock Alert</SelectItem>
                <SelectItem value="reorder">Reorder Report</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Category</Label>
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {inventoryData?.categories?.map((cat) => (
                  <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Content */}
        {isLoading ? (
          <div className="grid grid-cols-2 gap-3">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="p-4 rounded-lg bg-background animate-pulse h-20" />
            ))}
          </div>
        ) : (
          <>
            {reportView === 'stock_levels' && renderStockLevels()}
            {reportView === 'low_stock' && renderLowStock()}
            {reportView === 'reorder' && renderReorder()}
          </>
        )}

        {/* Actions */}
        <div className="flex gap-2 pt-2">
          <Button variant="outline" onClick={onCancel} className="flex-1">
            Close
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
