import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import { Plus, Pencil, Trash2, ExternalLink, Loader2 } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface Service {
  id: string;
  name: string;
  description: string | null;
  price: number | null;
  price_display: string | null;
  duration_minutes: number | null;
  is_active: boolean;
  service_type: string | null;
  website_show_service: boolean;
  website_show_price: boolean;
  website_show_duration: boolean;
  website_show_description: boolean;
}

const SERVICE_TYPES = [
  { value: 'standard', label: 'Standard' },
  { value: 'emergency', label: 'Emergency' },
  { value: 'maintenance', label: 'Maintenance' },
  { value: 'consultation', label: 'Consultation' },
];

const PRICE_DISPLAY_OPTIONS = [
  { value: 'fixed', label: 'Fixed Price' },
  { value: 'hourly', label: 'Per Hour' },
  { value: 'estimate', label: 'Free Estimate' },
  { value: 'quote', label: 'Quote Required' },
];

export function SmartWebsiteServicesEditor() {
  const { companyId } = useAuth();
  const queryClient = useQueryClient();
  const [showDialog, setShowDialog] = useState(false);
  const [editingService, setEditingService] = useState<Service | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    price_display: 'fixed',
    duration_minutes: '',
    service_type: 'standard',
    is_active: true,
    website_show_service: true,
    website_show_price: true,
    website_show_duration: true,
    website_show_description: true,
  });

  const { data: services, isLoading } = useQuery({
    queryKey: ['services-compact', companyId],
    queryFn: async () => {
      if (!companyId) return [];
      const { data, error } = await supabase
        .from('services')
        .select('id, name, description, price, price_display, duration_minutes, is_active, service_type, website_show_service, website_show_price, website_show_duration, website_show_description')
        .eq('company_id', companyId)
        .order('sort_order', { ascending: true });
      if (error) throw error;
      return data as Service[];
    },
    enabled: !!companyId,
  });

  const saveMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      if (!companyId) throw new Error('No company ID');
      
      const payload = {
        company_id: companyId,
        name: data.name,
        description: data.description || null,
        price: data.price ? parseFloat(data.price) : null,
        price_display: data.price_display,
        duration_minutes: data.duration_minutes ? parseInt(data.duration_minutes) : null,
        service_type: data.service_type,
        is_active: data.is_active,
        website_show_service: data.website_show_service,
        website_show_price: data.website_show_price,
        website_show_duration: data.website_show_duration,
        website_show_description: data.website_show_description,
      };

      if (editingService) {
        const { error } = await supabase
          .from('services')
          .update(payload)
          .eq('id', editingService.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('services')
          .insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['services-compact'] });
      toast.success(editingService ? 'Service updated!' : 'Service added!');
      handleCloseDialog();
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to save service');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('services').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['services-compact'] });
      toast.success('Service deleted!');
    },
    onError: () => {
      toast.error('Failed to delete service');
    },
  });

  const handleOpenDialog = (service?: Service) => {
    if (service) {
      setEditingService(service);
      setFormData({
        name: service.name,
        description: service.description || '',
        price: service.price?.toString() || '',
        price_display: service.price_display || 'fixed',
        duration_minutes: service.duration_minutes?.toString() || '',
        service_type: service.service_type || 'standard',
        is_active: service.is_active,
        website_show_service: service.website_show_service,
        website_show_price: service.website_show_price,
        website_show_duration: service.website_show_duration,
        website_show_description: service.website_show_description,
      });
    } else {
      setEditingService(null);
      setFormData({
        name: '',
        description: '',
        price: '',
        price_display: 'fixed',
        duration_minutes: '',
        service_type: 'standard',
        is_active: true,
        website_show_service: true,
        website_show_price: true,
        website_show_duration: true,
        website_show_description: true,
      });
    }
    setShowDialog(true);
  };

  const handleCloseDialog = () => {
    setShowDialog(false);
    setEditingService(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      toast.error('Service name is required');
      return;
    }
    saveMutation.mutate(formData);
  };

  const formatPrice = (service: Service) => {
    if (service.price_display === 'estimate') return 'Free Estimate';
    if (service.price_display === 'quote') return 'Quote Required';
    if (!service.price) return '-';
    const formatted = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(service.price);
    return service.price_display === 'hourly' ? `${formatted}/hr` : formatted;
  };

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-12 w-full" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {services && services.length > 0 ? (
        <div className="border rounded-lg overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Service</TableHead>
                <TableHead className="hidden sm:table-cell">Duration</TableHead>
                <TableHead>Price</TableHead>
                <TableHead className="hidden sm:table-cell">Status</TableHead>
                <TableHead className="w-[80px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {services.map((service) => (
                <TableRow key={service.id}>
                  <TableCell>
                    <p className="font-medium text-card-foreground">{service.name}</p>
                    {service.description && (
                      <p className="text-xs text-card-foreground/70 truncate max-w-[200px]">
                        {service.description}
                      </p>
                    )}
                  </TableCell>
                  <TableCell className="hidden sm:table-cell text-card-foreground/70">
                    {service.duration_minutes ? `${service.duration_minutes} min` : '-'}
                  </TableCell>
                  <TableCell className="text-card-foreground">{formatPrice(service)}</TableCell>
                  <TableCell className="hidden sm:table-cell">
                    <Badge variant={service.is_active ? 'default' : 'secondary'}>
                      {service.is_active ? 'Active' : 'Inactive'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 btn-ghost-card"
                        onClick={() => handleOpenDialog(service)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 btn-ghost-card text-destructive hover:text-destructive"
                        onClick={() => deleteMutation.mutate(service.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      ) : (
        <p className="text-card-foreground/70 text-sm text-center py-4">
          No services yet. Add your first service below.
        </p>
      )}

      <div className="flex items-center justify-between">
        <Button onClick={() => handleOpenDialog()} size="sm">
          <Plus className="h-4 w-4 mr-2" />
          Add Service
        </Button>

        <Link
          to="/dashboard/knowledge?tab=services"
          className="text-sm text-accent hover:underline flex items-center gap-1"
        >
          Full Services Manager
          <ExternalLink className="h-3 w-3" />
        </Link>
      </div>

      {/* Add/Edit Dialog */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{editingService ? 'Edit Service' : 'Add Service'}</DialogTitle>
            <DialogDescription>
              {editingService ? 'Update your service details' : 'Add a new service to display on your website'}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label>Service Name *</Label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g., AC Repair"
              />
            </div>
            
            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Brief description of the service"
                rows={2}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Service Type</Label>
                <Select
                  value={formData.service_type}
                  onValueChange={(value) => setFormData({ ...formData, service_type: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {SERVICE_TYPES.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Duration (min)</Label>
                <Input
                  type="number"
                  value={formData.duration_minutes}
                  onChange={(e) => setFormData({ ...formData, duration_minutes: e.target.value })}
                  placeholder="60"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Price Type</Label>
                <Select
                  value={formData.price_display}
                  onValueChange={(value) => setFormData({ ...formData, price_display: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {PRICE_DISPLAY_OPTIONS.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {(formData.price_display === 'fixed' || formData.price_display === 'hourly') && (
                <div className="space-y-2">
                  <Label>Price ($)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                    placeholder="99.00"
                  />
                </div>
              )}
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label>Active</Label>
                <p className="text-xs text-muted-foreground">Service is active in system</p>
              </div>
              <Switch
                checked={formData.is_active}
                onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
              />
            </div>

            <div className="border-t pt-4 mt-4">
              <Label className="text-sm font-semibold mb-3 block">Smart Website Display Options</Label>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-sm">Show on Website</Label>
                    <p className="text-xs text-muted-foreground">Display this service on Smart Website</p>
                  </div>
                  <Switch
                    checked={formData.website_show_service}
                    onCheckedChange={(checked) => setFormData({ ...formData, website_show_service: checked })}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-sm">Show Description</Label>
                    <p className="text-xs text-muted-foreground">Display service description</p>
                  </div>
                  <Switch
                    checked={formData.website_show_description}
                    onCheckedChange={(checked) => setFormData({ ...formData, website_show_description: checked })}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-sm">Show Price</Label>
                    <p className="text-xs text-muted-foreground">Display service price</p>
                  </div>
                  <Switch
                    checked={formData.website_show_price}
                    onCheckedChange={(checked) => setFormData({ ...formData, website_show_price: checked })}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-sm">Show Duration</Label>
                    <p className="text-xs text-muted-foreground">Display service duration</p>
                  </div>
                  <Switch
                    checked={formData.website_show_duration}
                    onCheckedChange={(checked) => setFormData({ ...formData, website_show_duration: checked })}
                  />
                </div>
              </div>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={handleCloseDialog}>
                Cancel
              </Button>
              <Button type="submit" disabled={saveMutation.isPending}>
                {saveMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                {editingService ? 'Update' : 'Add'} Service
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
