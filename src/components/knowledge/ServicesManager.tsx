import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { toast } from 'sonner';
import { Plus, Pencil, Trash2, Clock, DollarSign, MapPin, Video, HelpCircle } from 'lucide-react';

interface Service {
  id: string;
  name: string;
  description: string | null;
  duration_minutes: number | null;
  price: number | null;
  is_active: boolean;
  service_type: string | null;
  service_type_other: string | null;
  flat_fee: number | null;
  hourly_rate: number | null;
  parts_cost: number | null;
}

type ServiceType = 'in_person' | 'virtual' | 'other';

const SERVICE_TYPE_LABELS: Record<ServiceType, string> = {
  in_person: 'In Person',
  virtual: 'Virtual',
  other: 'Other',
};

const SERVICE_TYPE_ICONS: Record<ServiceType, React.ReactNode> = {
  in_person: <MapPin className="w-3 h-3" />,
  virtual: <Video className="w-3 h-3" />,
  other: <HelpCircle className="w-3 h-3" />,
};

export function ServicesManager() {
  const { companyId } = useAuth();
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingService, setEditingService] = useState<Service | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    duration_minutes: '',
    price: '',
    is_active: true,
    service_type: 'in_person' as ServiceType,
    service_type_other: '',
    flat_fee: '',
    hourly_rate: '',
    parts_cost: '',
  });

  const { data: services, isLoading } = useQuery({
    queryKey: ['services', companyId],
    queryFn: async () => {
      if (!companyId) return [];
      const { data, error } = await supabase
        .from('services')
        .select('*')
        .eq('company_id', companyId)
        .order('name');
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
        duration_minutes: data.duration_minutes ? parseInt(data.duration_minutes) : null,
        price: data.price ? parseFloat(data.price) : null,
        is_active: data.is_active,
        service_type: data.service_type,
        service_type_other: data.service_type === 'other' ? data.service_type_other : null,
        flat_fee: data.flat_fee ? parseFloat(data.flat_fee) : null,
        hourly_rate: data.hourly_rate ? parseFloat(data.hourly_rate) : null,
        parts_cost: data.parts_cost ? parseFloat(data.parts_cost) : null,
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
      queryClient.invalidateQueries({ queryKey: ['services'] });
      toast.success(editingService ? 'Service updated!' : 'Service created!');
      handleCloseDialog();
    },
    onError: (error) => {
      console.error('Error saving service:', error);
      toast.error('Failed to save service');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('services').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['services'] });
      toast.success('Service deleted');
    },
    onError: (error) => {
      console.error('Error deleting service:', error);
      toast.error('Failed to delete service');
    },
  });

  const handleOpenDialog = (service?: Service) => {
    if (service) {
      setEditingService(service);
      setFormData({
        name: service.name,
        description: service.description || '',
        duration_minutes: service.duration_minutes?.toString() || '',
        price: service.price?.toString() || '',
        is_active: service.is_active,
        service_type: (service.service_type as ServiceType) || 'in_person',
        service_type_other: service.service_type_other || '',
        flat_fee: service.flat_fee?.toString() || '',
        hourly_rate: service.hourly_rate?.toString() || '',
        parts_cost: service.parts_cost?.toString() || '',
      });
    } else {
      setEditingService(null);
      setFormData({
        name: '',
        description: '',
        duration_minutes: '',
        price: '',
        is_active: true,
        service_type: 'in_person',
        service_type_other: '',
        flat_fee: '',
        hourly_rate: '',
        parts_cost: '',
      });
    }
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setEditingService(null);
  };

  const handleSave = () => {
    if (!formData.name.trim()) {
      toast.error('Please enter a service name');
      return;
    }
    if (formData.service_type === 'other' && !formData.service_type_other.trim()) {
      toast.error('Please specify the service type');
      return;
    }
    saveMutation.mutate(formData);
  };

  const getServiceTypeDisplay = (service: Service) => {
    const type = (service.service_type as ServiceType) || 'in_person';
    if (type === 'other' && service.service_type_other) {
      return service.service_type_other;
    }
    return SERVICE_TYPE_LABELS[type];
  };

  const getPriceDisplay = (service: Service) => {
    const prices: string[] = [];
    if (service.flat_fee) prices.push(`$${service.flat_fee.toFixed(2)} flat`);
    if (service.hourly_rate) prices.push(`$${service.hourly_rate.toFixed(2)}/hr`);
    if (service.parts_cost) prices.push(`$${service.parts_cost.toFixed(2)} parts`);
    if (service.price) prices.push(`$${service.price.toFixed(2)}`);
    return prices.length > 0 ? prices.join(' + ') : '-';
  };

  return (
    <Card className="border-border/50">
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Services</CardTitle>
          <CardDescription>Services your business offers</CardDescription>
        </div>
        <Button onClick={() => handleOpenDialog()} className="gap-2">
          <Plus className="w-4 h-4" />
          Add Service
        </Button>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => <Skeleton key={i} className="h-12 w-full" />)}
          </div>
        ) : services && services.length > 0 ? (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Service</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Duration</TableHead>
                <TableHead>Pricing</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-24">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {services.map((service) => (
                <TableRow key={service.id}>
                  <TableCell>
                    <div>
                      <p className="font-medium">{service.name}</p>
                      {service.description && (
                        <p className="text-sm text-muted-foreground truncate max-w-xs">
                          {service.description}
                        </p>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1.5">
                      {SERVICE_TYPE_ICONS[(service.service_type as ServiceType) || 'in_person']}
                      <span className="text-sm">{getServiceTypeDisplay(service)}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    {service.duration_minutes ? (
                      <div className="flex items-center gap-1 text-muted-foreground">
                        <Clock className="w-4 h-4" />
                        {service.duration_minutes} min
                      </div>
                    ) : (
                      <span className="text-muted-foreground">-</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1 text-sm">
                      <DollarSign className="w-4 h-4 text-muted-foreground" />
                      {getPriceDisplay(service)}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={service.is_active ? 'default' : 'secondary'}>
                      {service.is_active ? 'Active' : 'Inactive'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button size="icon" variant="ghost" onClick={() => handleOpenDialog(service)}>
                        <Pencil className="w-4 h-4" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="text-destructive hover:text-destructive"
                        onClick={() => deleteMutation.mutate(service.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : (
          <div className="text-center py-8">
            <p className="text-muted-foreground">No services yet</p>
            <p className="text-sm text-muted-foreground">Add your first service to get started</p>
          </div>
        )}
      </CardContent>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingService ? 'Edit Service' : 'Add Service'}</DialogTitle>
            <DialogDescription>
              {editingService ? 'Update service details' : 'Create a new service offering'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 pt-4 max-h-[70vh] overflow-y-auto">
            <div className="space-y-2">
              <Label htmlFor="name">Service Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
                placeholder="e.g., Haircut, Consultation"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="service_type">Service Type *</Label>
              <Select
                value={formData.service_type}
                onValueChange={(value: ServiceType) => setFormData((prev) => ({ ...prev, service_type: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="in_person">
                    <div className="flex items-center gap-2">
                      <MapPin className="w-4 h-4" />
                      In Person
                    </div>
                  </SelectItem>
                  <SelectItem value="virtual">
                    <div className="flex items-center gap-2">
                      <Video className="w-4 h-4" />
                      Virtual
                    </div>
                  </SelectItem>
                  <SelectItem value="other">
                    <div className="flex items-center gap-2">
                      <HelpCircle className="w-4 h-4" />
                      Other
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {formData.service_type === 'other' && (
              <div className="space-y-2">
                <Label htmlFor="service_type_other">Specify Type *</Label>
                <Input
                  id="service_type_other"
                  value={formData.service_type_other}
                  onChange={(e) => setFormData((prev) => ({ ...prev, service_type_other: e.target.value }))}
                  placeholder="e.g., Hybrid, On-site"
                />
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
                placeholder="Brief description of the service"
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="duration">Duration (minutes) <span className="text-muted-foreground text-xs">(optional)</span></Label>
              <Input
                id="duration"
                type="number"
                min="15"
                step="15"
                value={formData.duration_minutes}
                onChange={(e) => setFormData((prev) => ({ ...prev, duration_minutes: e.target.value }))}
                placeholder="60"
              />
            </div>

            <div className="border-t pt-4">
              <Label className="text-base font-medium">Pricing</Label>
              <p className="text-sm text-muted-foreground mb-3">Set one or more pricing options</p>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="flat_fee">Flat Fee ($)</Label>
                  <Input
                    id="flat_fee"
                    type="number"
                    min="0"
                    step="0.01"
                    value={formData.flat_fee}
                    onChange={(e) => setFormData((prev) => ({ ...prev, flat_fee: e.target.value }))}
                    placeholder="0.00"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="hourly_rate">Hourly Rate ($)</Label>
                  <Input
                    id="hourly_rate"
                    type="number"
                    min="0"
                    step="0.01"
                    value={formData.hourly_rate}
                    onChange={(e) => setFormData((prev) => ({ ...prev, hourly_rate: e.target.value }))}
                    placeholder="0.00"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="parts_cost">Parts Cost ($)</Label>
                  <Input
                    id="parts_cost"
                    type="number"
                    min="0"
                    step="0.01"
                    value={formData.parts_cost}
                    onChange={(e) => setFormData((prev) => ({ ...prev, parts_cost: e.target.value }))}
                    placeholder="0.00"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="price">Base Price ($)</Label>
                  <Input
                    id="price"
                    type="number"
                    min="0"
                    step="0.01"
                    value={formData.price}
                    onChange={(e) => setFormData((prev) => ({ ...prev, price: e.target.value }))}
                    placeholder="0.00"
                  />
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3 pt-2">
              <Switch
                checked={formData.is_active}
                onCheckedChange={(checked) => setFormData((prev) => ({ ...prev, is_active: checked }))}
              />
              <Label>Active</Label>
            </div>

            <div className="flex gap-3 pt-4">
              <Button variant="outline" className="flex-1" onClick={handleCloseDialog}>
                Cancel
              </Button>
              <Button className="flex-1" onClick={handleSave} disabled={saveMutation.isPending}>
                {saveMutation.isPending ? 'Saving...' : 'Save'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
