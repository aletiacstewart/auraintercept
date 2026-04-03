import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { 
  Package, 
  Search, 
  AlertTriangle, 
  Plus,
  Edit,
  ArrowLeft,
  Filter
} from 'lucide-react';

interface InventoryItem {
  id: string;
  name: string;
  sku: string | null;
  description: string | null;
  quantity: number;
  min_quantity: number;
  unit_cost: number | null;
  supplier: string | null;
  category: string | null;
}

interface InventoryMatrixProps {
  companyId: string;
  onBack: () => void;
}

export function InventoryMatrix({ companyId, onBack }: InventoryMatrixProps) {
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState('');
  const [showLowStockOnly, setShowLowStockOnly] = useState(false);
  const [editItem, setEditItem] = useState<InventoryItem | null>(null);
  const [editQuantity, setEditQuantity] = useState(0);

  const { data: items = [], isLoading } = useQuery({
    queryKey: ['inventory-matrix', companyId],
    queryFn: async () => {
      const { data } = await supabase
        .from('inventory_items')
        .select('*')
        .eq('company_id', companyId)
        .eq('is_active', true)
        .order('name');
      return (data || []) as InventoryItem[];
    },
    enabled: !!companyId,
  });

  const filteredItems = items.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.sku?.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesLowStock = !showLowStockOnly || item.quantity <= item.min_quantity;
    return matchesSearch && matchesLowStock;
  });

  const lowStockCount = items.filter(i => i.quantity <= i.min_quantity).length;
  const totalValue = items.reduce((sum, item) => sum + (item.quantity * (item.unit_cost || 0)), 0);

  const updateQuantityMutation = useMutation({
    mutationFn: async ({ id, quantity }: { id: string; quantity: number }) => {
      const { error } = await supabase
        .from('inventory_items')
        .update({ quantity })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inventory-matrix'] });
      queryClient.invalidateQueries({ queryKey: ['inventory-alerts'] });
      toast.success('Quantity updated');
      setEditItem(null);
    },
    onError: () => toast.error('Failed to update quantity'),
  });

  const handleEditQuantity = (item: InventoryItem) => {
    setEditItem(item);
    setEditQuantity(item.quantity);
  };

  const handleSaveQuantity = () => {
    if (editItem) {
      updateQuantityMutation.mutate({ id: editItem.id, quantity: editQuantity });
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={onBack} className="h-8 w-8">
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-lg bg-accent/20">
            <Package className="h-5 w-5 text-accent" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-foreground">Inventory Matrix</h2>
            <p className="text-xs text-muted-foreground">Track parts and supplies</p>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <Card className="glass-panel border-accent/20">
          <CardContent className="p-4">
            <p className="text-2xl font-bold">{items.length}</p>
            <p className="text-xs text-muted-foreground">Total Items</p>
          </CardContent>
        </Card>
        <Card className="glass-panel border-accent/20">
          <CardContent className="p-4">
            <p className="text-2xl font-bold">${totalValue.toFixed(0)}</p>
            <p className="text-xs text-muted-foreground">Total Value</p>
          </CardContent>
        </Card>
        <Card className={`glass-panel ${lowStockCount > 0 ? 'border-destructive/40' : 'border-accent/20'}`}>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <p className="text-2xl font-bold">{lowStockCount}</p>
              {lowStockCount > 0 && <AlertTriangle className="h-4 w-4 text-destructive" />}
            </div>
            <p className="text-xs text-muted-foreground">Low Stock</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-4">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by name or SKU..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="pl-9 bg-background/50"
          />
        </div>
        <div className="flex items-center gap-2 p-2 rounded-lg bg-background/50 border border-accent/20">
          <Filter className="h-4 w-4 text-muted-foreground" />
          <Label htmlFor="low-stock" className="text-sm cursor-pointer">Low Stock Only</Label>
          <Switch
            id="low-stock"
            checked={showLowStockOnly}
            onCheckedChange={setShowLowStockOnly}
          />
        </div>
      </div>

      {/* Inventory Table */}
      <Card className="glass-panel border-accent/20 overflow-hidden">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="bg-background/50 hover:bg-background/50">
                <TableHead className="text-accent">Part Name</TableHead>
                <TableHead className="text-accent">SKU</TableHead>
                <TableHead className="text-accent">Category</TableHead>
                <TableHead className="text-accent text-right">Qty</TableHead>
                <TableHead className="text-accent text-right">Min</TableHead>
                <TableHead className="text-accent text-right">Cost</TableHead>
                <TableHead className="text-accent">Status</TableHead>
                <TableHead className="text-accent text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                    Loading inventory...
                  </TableCell>
                </TableRow>
              ) : filteredItems.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8}>
                    <AuraEmptyState
                      icon={Package}
                      title={showLowStockOnly ? 'No low stock items' : 'No inventory items yet'}
                      description={showLowStockOnly ? 'All items are well-stocked — great job!' : 'Track your parts and materials. Add items to get started.'}
                      compact
                    />
                  </TableCell>
                </TableRow>
              ) : (
                filteredItems.map(item => {
                  const isLowStock = item.quantity <= item.min_quantity;
                  return (
                    <TableRow 
                      key={item.id} 
                      className={`${isLowStock ? 'bg-destructive/5' : ''} hover:bg-background/50`}
                    >
                      <TableCell>
                        <div>
                          <p className="font-medium">{item.name}</p>
                          {item.description && (
                            <p className="text-xs text-muted-foreground truncate max-w-[200px]">
                              {item.description}
                            </p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="font-mono text-xs text-muted-foreground">
                        {item.sku || '-'}
                      </TableCell>
                      <TableCell>
                        {item.category ? (
                          <Badge variant="outline" className="text-xs text-white/70 border-white/30">
                            {item.category}
                          </Badge>
                        ) : '-'}
                      </TableCell>
                      <TableCell className="text-right">
                        <span className={`font-semibold ${isLowStock ? 'text-destructive' : ''}`}>
                          {item.quantity}
                        </span>
                      </TableCell>
                      <TableCell className="text-right text-muted-foreground">
                        {item.min_quantity}
                      </TableCell>
                      <TableCell className="text-right">
                        {item.unit_cost ? `$${item.unit_cost.toFixed(2)}` : '-'}
                      </TableCell>
                      <TableCell>
                        {isLowStock ? (
                          <Badge variant="outline" className="bg-destructive/10 text-destructive border-destructive/30 text-xs">
                            <AlertTriangle className="h-3 w-3 mr-1" />
                            Low Stock
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="bg-accent/10 text-accent border-accent/30 text-xs">
                            In Stock
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7"
                          onClick={() => handleEditQuantity(item)}
                        >
                          <Edit className="h-3 w-3" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Edit Quantity Dialog */}
      <Dialog open={!!editItem} onOpenChange={open => !open && setEditItem(null)}>
        <DialogContent className="glass-panel border-accent/20">
          <DialogHeader>
            <DialogTitle>Update Quantity</DialogTitle>
          </DialogHeader>
          {editItem && (
            <div className="space-y-4 py-4">
              <p className="font-medium">{editItem.name}</p>
              <div className="space-y-2">
                <Label>Current Quantity</Label>
                <Input
                  type="number"
                  value={editQuantity}
                  onChange={e => setEditQuantity(parseInt(e.target.value) || 0)}
                  className="bg-background/50"
                />
              </div>
              <p className="text-xs text-muted-foreground">
                Minimum quantity: {editItem.min_quantity}
              </p>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditItem(null)}>Cancel</Button>
            <Button 
              onClick={handleSaveQuantity} 
              disabled={updateQuantityMutation.isPending}
              className="bg-accent hover:bg-accent/90"
            >
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
