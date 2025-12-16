import { useState, useRef } from 'react';
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
import { Separator } from '@/components/ui/separator';
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { toast } from 'sonner';
import { Plus, Pencil, Trash2, Clock, DollarSign, MapPin, Video, HelpCircle, Eye, Calculator, Copy, Download, Upload, MoreHorizontal, FileDown, FileUp } from 'lucide-react';

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
  in_person: <MapPin className="w-4 h-4" />,
  virtual: <Video className="w-4 h-4" />,
  other: <HelpCircle className="w-4 h-4" />,
};

const CSV_HEADERS = ['name', 'description', 'service_type', 'service_type_other', 'duration_minutes', 'flat_fee', 'hourly_rate', 'parts_cost', 'price', 'is_active'];

export function ServicesManager() {
  const { companyId } = useAuth();
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [importDialogOpen, setImportDialogOpen] = useState(false);
  const [importPreview, setImportPreview] = useState<Partial<Service>[]>([]);
  const [viewingService, setViewingService] = useState<Service | null>(null);
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

  const duplicateMutation = useMutation({
    mutationFn: async (service: Service) => {
      if (!companyId) throw new Error('No company ID');
      
      const payload = {
        company_id: companyId,
        name: `${service.name} (Copy)`,
        description: service.description,
        duration_minutes: service.duration_minutes,
        price: service.price,
        is_active: false, // Start as inactive
        service_type: service.service_type,
        service_type_other: service.service_type_other,
        flat_fee: service.flat_fee,
        hourly_rate: service.hourly_rate,
        parts_cost: service.parts_cost,
      };

      const { error } = await supabase.from('services').insert(payload);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['services'] });
      toast.success('Service duplicated! The copy is set to inactive.');
    },
    onError: (error) => {
      console.error('Error duplicating service:', error);
      toast.error('Failed to duplicate service');
    },
  });

  const importMutation = useMutation({
    mutationFn: async (servicesToImport: Partial<Service>[]) => {
      if (!companyId) throw new Error('No company ID');
      
      const payloads = servicesToImport.map(service => ({
        company_id: companyId,
        name: service.name || 'Unnamed Service',
        description: service.description || null,
        duration_minutes: service.duration_minutes || null,
        price: service.price || null,
        is_active: service.is_active ?? false,
        service_type: service.service_type || 'in_person',
        service_type_other: service.service_type_other || null,
        flat_fee: service.flat_fee || null,
        hourly_rate: service.hourly_rate || null,
        parts_cost: service.parts_cost || null,
      }));

      const { error } = await supabase.from('services').insert(payloads);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['services'] });
      toast.success(`Successfully imported ${importPreview.length} services`);
      setImportDialogOpen(false);
      setImportPreview([]);
    },
    onError: (error) => {
      console.error('Error importing services:', error);
      toast.error('Failed to import services');
    },
  });

  const handleExportCSV = () => {
    if (!services || services.length === 0) {
      toast.error('No services to export');
      return;
    }

    const csvContent = [
      CSV_HEADERS.join(','),
      ...services.map(service => [
        `"${(service.name || '').replace(/"/g, '""')}"`,
        `"${(service.description || '').replace(/"/g, '""')}"`,
        service.service_type || 'in_person',
        `"${(service.service_type_other || '').replace(/"/g, '""')}"`,
        service.duration_minutes || '',
        service.flat_fee || '',
        service.hourly_rate || '',
        service.parts_cost || '',
        service.price || '',
        service.is_active ? 'true' : 'false',
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `services_export_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    URL.revokeObjectURL(link.href);
    toast.success('Services exported successfully');
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const text = e.target?.result as string;
        const lines = text.split('\n').filter(line => line.trim());
        
        if (lines.length < 2) {
          toast.error('CSV file is empty or has no data rows');
          return;
        }

        const headers = lines[0].split(',').map(h => h.trim().toLowerCase().replace(/"/g, ''));
        const nameIndex = headers.indexOf('name');
        
        if (nameIndex === -1) {
          toast.error('CSV must have a "name" column');
          return;
        }

        const parsedServices: Partial<Service>[] = [];
        
        for (let i = 1; i < lines.length; i++) {
          const values = parseCSVLine(lines[i]);
          if (values.length === 0) continue;

          const service: Partial<Service> = {
            name: getCSVValue(values, headers, 'name') || `Service ${i}`,
            description: getCSVValue(values, headers, 'description') || null,
            service_type: getCSVValue(values, headers, 'service_type') || 'in_person',
            service_type_other: getCSVValue(values, headers, 'service_type_other') || null,
            duration_minutes: parseNumber(getCSVValue(values, headers, 'duration_minutes')),
            flat_fee: parseNumber(getCSVValue(values, headers, 'flat_fee')),
            hourly_rate: parseNumber(getCSVValue(values, headers, 'hourly_rate')),
            parts_cost: parseNumber(getCSVValue(values, headers, 'parts_cost')),
            price: parseNumber(getCSVValue(values, headers, 'price')),
            is_active: getCSVValue(values, headers, 'is_active')?.toLowerCase() === 'true',
          };
          
          parsedServices.push(service);
        }

        if (parsedServices.length === 0) {
          toast.error('No valid services found in CSV');
          return;
        }

        setImportPreview(parsedServices);
        setImportDialogOpen(true);
      } catch (error) {
        console.error('Error parsing CSV:', error);
        toast.error('Failed to parse CSV file');
      }
    };
    reader.readAsText(file);
    
    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const parseCSVLine = (line: string): string[] => {
    const values: string[] = [];
    let current = '';
    let inQuotes = false;
    
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      if (char === '"') {
        if (inQuotes && line[i + 1] === '"') {
          current += '"';
          i++;
        } else {
          inQuotes = !inQuotes;
        }
      } else if (char === ',' && !inQuotes) {
        values.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
    values.push(current.trim());
    return values;
  };

  const getCSVValue = (values: string[], headers: string[], key: string): string | null => {
    const index = headers.indexOf(key);
    return index >= 0 && values[index] ? values[index].replace(/^"|"$/g, '') : null;
  };

  const parseNumber = (value: string | null): number | null => {
    if (!value) return null;
    const num = parseFloat(value);
    return isNaN(num) ? null : num;
  };

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

  const handleViewDetails = (service: Service) => {
    setViewingService(service);
    setViewDialogOpen(true);
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

  const calculateTotalEstimate = (service: Service) => {
    let total = 0;
    if (service.flat_fee) total += service.flat_fee;
    if (service.hourly_rate && service.duration_minutes) {
      total += (service.hourly_rate * service.duration_minutes) / 60;
    }
    if (service.parts_cost) total += service.parts_cost;
    if (service.price) total += service.price;
    return total;
  };

  return (
    <Card className="border-border/50">
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Services</CardTitle>
          <CardDescription>Services your business offers</CardDescription>
        </div>
        <div className="flex gap-2">
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv"
            className="hidden"
            onChange={handleFileSelect}
          />
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="icon">
                <MoreHorizontal className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={handleExportCSV} disabled={!services || services.length === 0}>
                <FileDown className="w-4 h-4 mr-2" />
                Export CSV
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => fileInputRef.current?.click()}>
                <FileUp className="w-4 h-4 mr-2" />
                Import CSV
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <Button onClick={() => handleOpenDialog()} className="gap-2">
            <Plus className="w-4 h-4" />
            Add Service
          </Button>
        </div>
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
                <TableHead className="w-40">Actions</TableHead>
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
                      <Button size="icon" variant="ghost" onClick={() => handleViewDetails(service)} title="View Details">
                        <Eye className="w-4 h-4" />
                      </Button>
                      <Button size="icon" variant="ghost" onClick={() => handleOpenDialog(service)} title="Edit">
                        <Pencil className="w-4 h-4" />
                      </Button>
                      <Button 
                        size="icon" 
                        variant="ghost" 
                        onClick={() => duplicateMutation.mutate(service)} 
                        title="Duplicate"
                        disabled={duplicateMutation.isPending}
                      >
                        <Copy className="w-4 h-4" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="text-destructive hover:text-destructive"
                        onClick={() => deleteMutation.mutate(service.id)}
                        title="Delete"
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

      {/* View Details Dialog */}
      <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {viewingService?.name}
              <Badge variant={viewingService?.is_active ? 'default' : 'secondary'} className="ml-2">
                {viewingService?.is_active ? 'Active' : 'Inactive'}
              </Badge>
            </DialogTitle>
            <DialogDescription>Service details and pricing breakdown</DialogDescription>
          </DialogHeader>
          
          {viewingService && (
            <div className="space-y-6 pt-4">
              {/* Service Type */}
              <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                {SERVICE_TYPE_ICONS[(viewingService.service_type as ServiceType) || 'in_person']}
                <div>
                  <p className="text-sm text-muted-foreground">Service Type</p>
                  <p className="font-medium">{getServiceTypeDisplay(viewingService)}</p>
                </div>
              </div>

              {/* Description */}
              {viewingService.description && (
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Description</p>
                  <p className="text-sm">{viewingService.description}</p>
                </div>
              )}

              {/* Duration */}
              <div className="flex items-center gap-3">
                <Clock className="w-5 h-5 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">Duration</p>
                  <p className="font-medium">
                    {viewingService.duration_minutes ? `${viewingService.duration_minutes} minutes` : 'Not specified'}
                  </p>
                </div>
              </div>

              <Separator />

              {/* Pricing Breakdown */}
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <Calculator className="w-5 h-5 text-muted-foreground" />
                  <p className="font-medium">Pricing Breakdown</p>
                </div>
                
                <div className="space-y-3">
                  {viewingService.flat_fee && (
                    <div className="flex justify-between items-center py-2 px-3 rounded-lg bg-muted/30">
                      <span className="text-sm">Flat Fee</span>
                      <span className="font-medium">${viewingService.flat_fee.toFixed(2)}</span>
                    </div>
                  )}
                  
                  {viewingService.hourly_rate && (
                    <div className="flex justify-between items-center py-2 px-3 rounded-lg bg-muted/30">
                      <div>
                        <span className="text-sm">Hourly Rate</span>
                        {viewingService.duration_minutes && (
                          <span className="text-xs text-muted-foreground ml-2">
                            ({viewingService.duration_minutes} min = ${((viewingService.hourly_rate * viewingService.duration_minutes) / 60).toFixed(2)})
                          </span>
                        )}
                      </div>
                      <span className="font-medium">${viewingService.hourly_rate.toFixed(2)}/hr</span>
                    </div>
                  )}
                  
                  {viewingService.parts_cost && (
                    <div className="flex justify-between items-center py-2 px-3 rounded-lg bg-muted/30">
                      <span className="text-sm">Parts Cost</span>
                      <span className="font-medium">${viewingService.parts_cost.toFixed(2)}</span>
                    </div>
                  )}
                  
                  {viewingService.price && (
                    <div className="flex justify-between items-center py-2 px-3 rounded-lg bg-muted/30">
                      <span className="text-sm">Base Price</span>
                      <span className="font-medium">${viewingService.price.toFixed(2)}</span>
                    </div>
                  )}

                  {!viewingService.flat_fee && !viewingService.hourly_rate && !viewingService.parts_cost && !viewingService.price && (
                    <p className="text-sm text-muted-foreground text-center py-2">No pricing set</p>
                  )}

                  {/* Total Estimate */}
                  {(viewingService.flat_fee || viewingService.hourly_rate || viewingService.parts_cost || viewingService.price) && (
                    <>
                      <Separator className="my-2" />
                      <div className="flex justify-between items-center py-3 px-3 rounded-lg bg-primary/10">
                        <span className="font-medium">Estimated Total</span>
                        <span className="text-lg font-bold text-primary">
                          ${calculateTotalEstimate(viewingService).toFixed(2)}
                        </span>
                      </div>
                      {viewingService.hourly_rate && !viewingService.duration_minutes && (
                        <p className="text-xs text-muted-foreground text-center">
                          * Hourly rate not included in estimate (no duration set)
                        </p>
                      )}
                    </>
                  )}
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <Button variant="outline" className="flex-1" onClick={() => setViewDialogOpen(false)}>
                  Close
                </Button>
                <Button 
                  className="flex-1" 
                  onClick={() => {
                    setViewDialogOpen(false);
                    handleOpenDialog(viewingService);
                  }}
                >
                  <Pencil className="w-4 h-4 mr-2" />
                  Edit Service
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Add/Edit Dialog */}
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

      {/* Import Preview Dialog */}
      <Dialog open={importDialogOpen} onOpenChange={setImportDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileUp className="w-5 h-5" />
              Import Services
            </DialogTitle>
            <DialogDescription>
              Review the services to be imported. All imported services will be set to inactive by default.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 pt-4">
            <div className="border rounded-lg overflow-hidden">
              <div className="max-h-[40vh] overflow-y-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Duration</TableHead>
                      <TableHead>Pricing</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {importPreview.map((service, index) => (
                      <TableRow key={index}>
                        <TableCell className="font-medium">{service.name}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1.5">
                            {SERVICE_TYPE_ICONS[(service.service_type as ServiceType) || 'in_person']}
                            <span className="text-sm">
                              {service.service_type === 'other' && service.service_type_other
                                ? service.service_type_other
                                : SERVICE_TYPE_LABELS[(service.service_type as ServiceType) || 'in_person']}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          {service.duration_minutes ? `${service.duration_minutes} min` : '-'}
                        </TableCell>
                        <TableCell className="text-sm">
                          {[
                            service.flat_fee && `$${service.flat_fee} flat`,
                            service.hourly_rate && `$${service.hourly_rate}/hr`,
                            service.parts_cost && `$${service.parts_cost} parts`,
                            service.price && `$${service.price}`,
                          ].filter(Boolean).join(' + ') || '-'}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>

            <div className="flex items-center justify-between text-sm text-muted-foreground">
              <span>{importPreview.length} service(s) will be imported</span>
              <Badge variant="secondary">All set to Inactive</Badge>
            </div>

            <div className="flex gap-3 pt-2">
              <Button 
                variant="outline" 
                className="flex-1" 
                onClick={() => {
                  setImportDialogOpen(false);
                  setImportPreview([]);
                }}
              >
                Cancel
              </Button>
              <Button 
                className="flex-1" 
                onClick={() => importMutation.mutate(importPreview)}
                disabled={importMutation.isPending}
              >
                {importMutation.isPending ? 'Importing...' : `Import ${importPreview.length} Services`}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
