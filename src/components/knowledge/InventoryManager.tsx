import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { Plus, Package, AlertTriangle, Edit, Trash2, Search } from 'lucide-react';
import { InventoryUploadDialog } from '@/components/inventory/InventoryUploadDialog';

interface InventoryItem {
  id: string;
  company_id: string;
  name: string;
  sku: string | null;
  description: string | null;
  quantity: number;
  min_quantity: number;
  unit_cost: number | null;
  supplier: string | null;
  category: string | null;
  is_active: boolean;
  created_at: string;
  // CRM compatibility fields
  external_sku: string | null;
  barcode: string | null;
  manufacturer_part_number: string | null;
  crm_product_id: string | null;
  last_synced_at: string | null;
}

export function InventoryManager() {
  const { companyId } = useAuth();
  const queryClient = useQueryClient();
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editItem, setEditItem] = useState<InventoryItem | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');

  const [formData, setFormData] = useState({
    name: '',
    sku: '',
    description: '',
    quantity: 0,
    min_quantity: 5,
    unit_cost: 0,
    supplier: '',
    category: '',
    // CRM compatibility fields
    external_sku: '',
    barcode: '',
    manufacturer_part_number: '',
  });

  const { data: items = [], isLoading } = useQuery({
    queryKey: ['inventory', companyId],
    queryFn: async () => {
      if (!companyId) return [];
      const { data, error } = await supabase
        .from('inventory_items')
        .select('*')
        .eq('company_id', companyId)
        .eq('is_active', true)
        .order('name');
      if (error) throw error;
      return data as InventoryItem[];
    },
    enabled: !!companyId,
  });

  const categories = [...new Set(items.map(i => i.category).filter(Boolean))];

  const filteredItems = items.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.sku?.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesCategory = categoryFilter === 'all' || item.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  const lowStockItems = items.filter(i => i.quantity <= i.min_quantity);

  const addMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const { error } = await supabase.from('inventory_items').insert({
        company_id: companyId,
        name: data.name,
        sku: data.sku || null,
        description: data.description || null,
        quantity: data.quantity,
        min_quantity: data.min_quantity,
        unit_cost: data.unit_cost || null,
        supplier: data.supplier || null,
        category: data.category || null,
        // CRM compatibility fields
        external_sku: data.external_sku || null,
        barcode: data.barcode || null,
        manufacturer_part_number: data.manufacturer_part_number || null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inventory'] });
      toast.success('Item added successfully');
      setIsAddOpen(false);
      resetForm();
    },
    onError: () => toast.error('Failed to add item'),
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: typeof formData }) => {
      const { error } = await supabase.from('inventory_items').update({
        name: data.name,
        sku: data.sku || null,
        description: data.description || null,
        quantity: data.quantity,
        min_quantity: data.min_quantity,
        unit_cost: data.unit_cost || null,
        supplier: data.supplier || null,
        category: data.category || null,
        // CRM compatibility fields
        external_sku: data.external_sku || null,
        barcode: data.barcode || null,
        manufacturer_part_number: data.manufacturer_part_number || null,
      }).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inventory'] });
      toast.success('Item updated successfully');
      setEditItem(null);
      resetForm();
    },
    onError: () => toast.error('Failed to update item'),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('inventory_items')
        .update({ is_active: false })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inventory'] });
      toast.success('Item deleted');
    },
    onError: () => toast.error('Failed to delete item'),
  });

  const resetForm = () => {
    setFormData({
      name: '',
      sku: '',
      description: '',
      quantity: 0,
      min_quantity: 5,
      unit_cost: 0,
      supplier: '',
      category: '',
      external_sku: '',
      barcode: '',
      manufacturer_part_number: '',
    });
  };

  const openEditDialog = (item: InventoryItem) => {
    setEditItem(item);
    setFormData({
      name: item.name,
      sku: item.sku || '',
      description: item.description || '',
      quantity: item.quantity,
      min_quantity: item.min_quantity,
      unit_cost: item.unit_cost || 0,
      supplier: item.supplier || '',
      category: item.category || '',
      external_sku: item.external_sku || '',
      barcode: item.barcode || '',
      manufacturer_part_number: item.manufacturer_part_number || '',
    });
  };

  const handleSubmit = () => {
    if (!formData.name) {
      toast.error('Name is required');
      return;
    }
    if (editItem) {
      updateMutation.mutate({ id: editItem.id, data: formData });
    } else {
      addMutation.mutate(formData);
    }
  };

  const totalValue = items.reduce((sum, item) => sum + (item.quantity * (item.unit_cost || 0)), 0);

  const inventoryFormFields = (
    <div className="grid gap-4 py-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Name *</Label>
          <Input value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} />
        </div>
        <div className="space-y-2">
          <Label>SKU</Label>
          <Input value={formData.sku} onChange={e => setFormData({ ...formData, sku: e.target.value })} />
        </div>
      </div>
      <div className="space-y-2">
        <Label>Description</Label>
        <Textarea value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })} />
      </div>
      <div className="grid grid-cols-3 gap-4">
        <div className="space-y-2">
          <Label>Quantity</Label>
          <Input type="number" value={formData.quantity} onChange={e => setFormData({ ...formData, quantity: parseInt(e.target.value) || 0 })} />
        </div>
        <div className="space-y-2">
          <Label>Min Quantity</Label>
          <Input type="number" value={formData.min_quantity} onChange={e => setFormData({ ...formData, min_quantity: parseInt(e.target.value) || 0 })} />
        </div>
        <div className="space-y-2">
          <Label>Unit Cost ($)</Label>
          <Input type="number" step="0.01" value={formData.unit_cost} onChange={e => setFormData({ ...formData, unit_cost: parseFloat(e.target.value) || 0 })} />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Supplier</Label>
          <Input value={formData.supplier} onChange={e => setFormData({ ...formData, supplier: e.target.value })} />
        </div>
        <div className="space-y-2">
          <Label>Category</Label>
          <Input value={formData.category} onChange={e => setFormData({ ...formData, category: e.target.value })} />
        </div>
      </div>
      
      {/* CRM Compatibility Fields */}
      <div className="border-t border-border pt-4 mt-2">
        <Label className="text-sm text-muted-foreground mb-3 block">CRM & Product Catalog Fields</Label>
        <div className="grid grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label>External SKU</Label>
            <Input 
              placeholder="Supplier/MFG SKU" 
              value={formData.external_sku} 
              onChange={e => setFormData({ ...formData, external_sku: e.target.value })} 
            />
          </div>
          <div className="space-y-2">
            <Label>Barcode / UPC</Label>
            <Input 
              placeholder="UPC or barcode" 
              value={formData.barcode} 
              onChange={e => setFormData({ ...formData, barcode: e.target.value })} 
            />
          </div>
          <div className="space-y-2">
            <Label>Manufacturer Part #</Label>
            <Input 
              placeholder="MPN" 
              value={formData.manufacturer_part_number} 
              onChange={e => setFormData({ ...formData, manufacturer_part_number: e.target.value })} 
            />
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex gap-2">
          {companyId && <InventoryUploadDialog companyId={companyId} />}
          <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
            <DialogTrigger asChild>
              <Button onClick={resetForm}>
                <Plus className="w-4 h-4 mr-2" />
                Add Item
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add Inventory Item</DialogTitle>
                <DialogDescription>Add a new part or supply to your inventory.</DialogDescription>
              </DialogHeader>
              {inventoryFormFields}
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsAddOpen(false)}>Cancel</Button>
                <Button onClick={handleSubmit} disabled={addMutation.isPending}>Add Item</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-card-foreground/70">Total Items</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-card-foreground">{items.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-card-foreground/70">Total Value</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-card-foreground">${totalValue.toFixed(2)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-card-foreground/70">Categories</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-card-foreground">{categories.length}</div>
          </CardContent>
        </Card>
        <Card className={lowStockItems.length > 0 ? 'border-destructive' : ''}>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-card-foreground/70 flex items-center gap-2">
              {lowStockItems.length > 0 && <AlertTriangle className="w-4 h-4 text-destructive" />}
              Low Stock
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-card-foreground">{lowStockItems.length}</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search by name or SKU..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="All Categories" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            {categories.map(cat => (
              <SelectItem key={cat} value={cat!}>{cat}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Items Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>SKU</TableHead>
                <TableHead>Category</TableHead>
                <TableHead className="text-right">Quantity</TableHead>
                <TableHead className="text-right">Min Qty</TableHead>
                <TableHead className="text-right">Unit Cost</TableHead>
                <TableHead>Supplier</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">Loading...</TableCell>
                </TableRow>
              ) : filteredItems.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8}>
                    <AuraEmptyState
                      icon={Package}
                      title="No inventory items yet"
                      description="Add parts and materials to track stock levels and costs."
                      compact
                    />
                  </TableCell>
                </TableRow>
              ) : (
                filteredItems.map(item => (
                  <TableRow key={item.id}>
                    <TableCell className="font-medium">{item.name}</TableCell>
                    <TableCell className="text-muted-foreground">{item.sku || '-'}</TableCell>
                    <TableCell>
                      {item.category && <Badge variant="outline">{item.category}</Badge>}
                    </TableCell>
                    <TableCell className="text-right">
                      <span className={item.quantity <= item.min_quantity ? 'text-destructive font-medium' : ''}>
                        {item.quantity}
                      </span>
                    </TableCell>
                    <TableCell className="text-right text-muted-foreground">{item.min_quantity}</TableCell>
                    <TableCell className="text-right">{item.unit_cost ? `$${item.unit_cost.toFixed(2)}` : '-'}</TableCell>
                    <TableCell className="text-muted-foreground">{item.supplier || '-'}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button variant="ghost" size="icon" onClick={() => openEditDialog(item)}>
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => deleteMutation.mutate(item.id)}>
                          <Trash2 className="w-4 h-4 text-destructive" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <Dialog open={!!editItem} onOpenChange={open => !open && setEditItem(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Inventory Item</DialogTitle>
            <DialogDescription>Update item details.</DialogDescription>
          </DialogHeader>
          {inventoryFormFields}
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditItem(null)}>Cancel</Button>
            <Button onClick={handleSubmit} disabled={updateMutation.isPending}>Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
