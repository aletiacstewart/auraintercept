import { useState, useRef, useMemo } from 'react';
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
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { toast } from 'sonner';
import { Plus, Pencil, Trash2, Clock, DollarSign, MapPin, Video, HelpCircle, Eye, Calculator, Copy, MoreHorizontal, FileDown, FileUp, GripVertical, FolderOpen, ChevronDown, ChevronRight, Filter } from 'lucide-react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

interface Service {
  id: string;
  name: string;
  description: string | null;
  duration_minutes: number | null;
  price: number | null;
  price_display: string | null;
  is_active: boolean;
  service_type: string | null;
  service_type_other: string | null;
  flat_fee: number | null;
  hourly_rate: number | null;
  parts_cost: number | null;
  sort_order: number | null;
  category: string | null;
  // CRM compatibility fields
  crm_product_id: string | null;
  sync_to_crm: boolean;
  last_synced_at: string | null;
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

const CSV_HEADERS = ['Service Name', 'Category', 'Description', 'Service Type', 'Service Type (Other)', 'Duration (Minutes)', 'Pricing Display', 'Flat Fee', 'Hourly Rate', 'Parts Cost', 'Base Price', 'Active'];

// Map CSV headers to database field names
const CSV_HEADER_MAP: Record<string, string> = {
  'service name': 'name',
  'category': 'category',
  'description': 'description',
  'service type': 'service_type',
  'service type (other)': 'service_type_other',
  'duration (minutes)': 'duration_minutes',
  'pricing display': 'price_display',
  'pricing': 'price_display',
  'price display': 'price_display',
  'flat fee': 'flat_fee',
  'hourly rate': 'hourly_rate',
  'parts cost': 'parts_cost',
  'base price': 'price',
  'active': 'is_active',
  // Also support legacy/database field names for backward compatibility
  'name': 'name',
  'service_type': 'service_type',
  'service_type_other': 'service_type_other',
  'duration_minutes': 'duration_minutes',
  'price_display': 'price_display',
  'flat_fee': 'flat_fee',
  'hourly_rate': 'hourly_rate',
  'parts_cost': 'parts_cost',
  'price': 'price',
  'is_active': 'is_active',
};

// Map service type display values to database values
const SERVICE_TYPE_VALUE_MAP: Record<string, string> = {
  'in person': 'in_person',
  'in_person': 'in_person',
  'virtual': 'virtual',
  'other': 'other',
  'flat rate': 'in_person',
  'hourly': 'in_person',
  'variable': 'other',
};

interface SortableRowProps {
  service: Service;
  getServiceTypeDisplay: (service: Service) => string;
  getPriceDisplay: (service: Service) => string;
  onView: () => void;
  onEdit: () => void;
  onDuplicate: () => void;
  onDelete: () => void;
  isDuplicating: boolean;
  showCategory?: boolean;
}

function SortableRow({
  service,
  getServiceTypeDisplay,
  getPriceDisplay,
  onView,
  onEdit,
  onDuplicate,
  onDelete,
  isDuplicating,
  showCategory = false,
}: SortableRowProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: service.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <TableRow ref={setNodeRef} style={style} className={isDragging ? 'bg-muted' : ''}>
      <TableCell className="w-10">
        <button
          {...attributes}
          {...listeners}
          className="cursor-grab active:cursor-grabbing p-1 hover:bg-muted rounded"
          title="Drag to reorder"
        >
          <GripVertical className="w-4 h-4 text-muted-foreground" />
        </button>
      </TableCell>
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
      {showCategory && (
        <TableCell>
          {service.category ? (
            <Badge variant="outline" className="text-xs text-muted-foreground border-white/30">
              {service.category}
            </Badge>
          ) : (
            <span className="text-muted-foreground text-sm">-</span>
          )}
        </TableCell>
      )}
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
          <Button size="icon" variant="ghost" onClick={onView} title="View Details">
            <Eye className="w-4 h-4" />
          </Button>
          <Button size="icon" variant="ghost" onClick={onEdit} title="Edit">
            <Pencil className="w-4 h-4" />
          </Button>
          <Button
            size="icon"
            variant="ghost"
            onClick={onDuplicate}
            title="Duplicate"
            disabled={isDuplicating}
          >
            <Copy className="w-4 h-4" />
          </Button>
          <Button
            size="icon"
            variant="ghost"
            className="text-destructive hover:text-destructive"
            onClick={onDelete}
            title="Delete"
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      </TableCell>
    </TableRow>
  );
}

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
  const [groupByCategory, setGroupByCategory] = useState(false);
  const [categoryFilter, setCategoryFilter] = useState<string | null>(null);
  const [collapsedCategories, setCollapsedCategories] = useState<Set<string>>(new Set());
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    duration_minutes: '',
    price: '',
    price_display: '',
    is_active: true,
    service_type: 'in_person' as ServiceType,
    service_type_other: '',
    flat_fee: '',
    hourly_rate: '',
    parts_cost: '',
    category: '',
    // CRM compatibility fields
    sync_to_crm: false,
  });

  const { data: services, isLoading } = useQuery({
    queryKey: ['services', companyId],
    queryFn: async () => {
      if (!companyId) return [];
      const { data, error } = await supabase
        .from('services')
        .select('*')
        .eq('company_id', companyId)
        .order('sort_order', { ascending: true, nullsFirst: false })
        .order('name');
      if (error) throw error;
      return (data || []) as unknown as Service[];
    },
    enabled: !!companyId,
  });

  // Get unique categories from services
  const categories = useMemo(() => {
    if (!services) return [];
    const cats = services
      .map(s => s.category)
      .filter((c): c is string => !!c);
    return [...new Set(cats)].sort();
  }, [services]);

  // Group services by category
  const groupedServices = useMemo(() => {
    if (!services) return {};
    const filtered = categoryFilter 
      ? services.filter(s => s.category === categoryFilter)
      : services;
    
    if (!groupByCategory) return { '': filtered };
    
    const groups: Record<string, Service[]> = {};
    filtered.forEach(service => {
      const cat = service.category || 'Uncategorized';
      if (!groups[cat]) groups[cat] = [];
      groups[cat].push(service);
    });
    return groups;
  }, [services, groupByCategory, categoryFilter]);

  const toggleCategory = (category: string) => {
    setCollapsedCategories(prev => {
      const next = new Set(prev);
      if (next.has(category)) {
        next.delete(category);
      } else {
        next.add(category);
      }
      return next;
    });
  };

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const reorderMutation = useMutation({
    mutationFn: async (reorderedServices: { id: string; sort_order: number }[]) => {
      const updates = reorderedServices.map(({ id, sort_order }) =>
        supabase.from('services').update({ sort_order }).eq('id', id)
      );
      await Promise.all(updates);
    },
    onError: (error) => {
      console.error('Error reordering services:', error);
      toast.error('Failed to save order');
      queryClient.invalidateQueries({ queryKey: ['services'] });
    },
  });

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    
    if (!over || active.id === over.id || !services) return;

    const oldIndex = services.findIndex((s) => s.id === active.id);
    const newIndex = services.findIndex((s) => s.id === over.id);
    
    if (oldIndex === -1 || newIndex === -1) return;

    const reordered = arrayMove(services, oldIndex, newIndex);
    
    // Optimistically update the cache
    queryClient.setQueryData(['services', companyId], reordered);
    
    // Save the new order
    const updates = reordered.map((service, index) => ({
      id: service.id,
      sort_order: index,
    }));
    reorderMutation.mutate(updates);
  };

  const saveMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      if (!companyId) throw new Error('No company ID');
      
      const payload = {
        company_id: companyId,
        name: data.name,
        description: data.description || null,
        duration_minutes: data.duration_minutes ? parseInt(data.duration_minutes) : null,
        price: data.price ? parseFloat(data.price) : null,
        price_display: data.price_display || null,
        is_active: data.is_active,
        service_type: data.service_type,
        service_type_other: data.service_type === 'other' ? data.service_type_other : null,
        flat_fee: data.flat_fee ? parseFloat(data.flat_fee) : null,
        hourly_rate: data.hourly_rate ? parseFloat(data.hourly_rate) : null,
        parts_cost: data.parts_cost ? parseFloat(data.parts_cost) : null,
        category: data.category || null,
        // CRM compatibility field
        sync_to_crm: data.sync_to_crm,
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
        category: service.category,
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
        price_display: service.price_display || null,
        is_active: service.is_active ?? false,
        service_type: service.service_type || 'in_person',
        service_type_other: service.service_type_other || null,
        flat_fee: service.flat_fee || null,
        hourly_rate: service.hourly_rate || null,
        parts_cost: service.parts_cost || null,
        category: service.category || null,
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
        `"${(service.category || '').replace(/"/g, '""')}"`,
        `"${(service.description || '').replace(/"/g, '""')}"`,
        service.service_type ? SERVICE_TYPE_LABELS[(service.service_type as ServiceType)] || service.service_type : 'In Person',
        `"${(service.service_type_other || '').replace(/"/g, '""')}"`,
        service.duration_minutes || '',
        `"${(service.price_display || '').replace(/"/g, '""')}"`,
        service.flat_fee || '',
        service.hourly_rate || '',
        service.parts_cost || '',
        service.price || '',
        service.is_active ? 'Yes' : 'No',
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

  const handleDownloadTemplate = () => {
    // Template example row aligned with CSV_HEADERS:
    // ['Service Name', 'Category', 'Description', 'Service Type', 'Service Type (Other)', 
    //  'Duration (Minutes)', 'Pricing Display', 'Flat Fee', 'Hourly Rate', 'Parts Cost', 'Base Price', 'Active']
    const exampleRow = [
      'Example Service',      // Service Name
      'Maintenance',          // Category
      'Description of the service', // Description
      'In Person',            // Service Type
      '',                     // Service Type (Other)
      '60',                   // Duration (Minutes)
      '$100-$250',            // Pricing Display
      '50',                   // Flat Fee
      '75',                   // Hourly Rate
      '25',                   // Parts Cost
      '100',                  // Base Price
      'Yes',                  // Active
    ].map(v => `"${v}"`).join(',');

    const csvContent = [CSV_HEADERS.join(','), exampleRow].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'services_import_template.csv';
    link.click();
    URL.revokeObjectURL(link.href);
    toast.success('Template downloaded');
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
        
        // Map headers to database field names
        const mappedHeaders = headers.map(h => CSV_HEADER_MAP[h] || h);
        const nameIndex = mappedHeaders.indexOf('name');
        
        if (nameIndex === -1) {
          toast.error('CSV must have a "Service Name" or "name" column');
          return;
        }

        const parsedServices: Partial<Service>[] = [];
        
        for (let i = 1; i < lines.length; i++) {
          const values = parseCSVLine(lines[i]);
          if (values.length === 0) continue;

          // Parse service type - handle display values
          const rawServiceType = getCSVValue(values, mappedHeaders, 'service_type')?.toLowerCase() || '';
          const serviceType = SERVICE_TYPE_VALUE_MAP[rawServiceType] || 'in_person';
          
          // Parse active status - handle Yes/No and true/false
          const rawActive = getCSVValue(values, mappedHeaders, 'is_active')?.toLowerCase() || '';
          const isActive = rawActive === 'yes' || rawActive === 'true';

          const service: Partial<Service> = {
            name: getCSVValue(values, mappedHeaders, 'name') || `Service ${i}`,
            category: getCSVValue(values, mappedHeaders, 'category') || null,
            description: getCSVValue(values, mappedHeaders, 'description') || null,
            service_type: serviceType,
            service_type_other: getCSVValue(values, mappedHeaders, 'service_type_other') || null,
            duration_minutes: parseNumber(getCSVValue(values, mappedHeaders, 'duration_minutes')),
            price_display: getCSVValue(values, mappedHeaders, 'price_display') || null,
            flat_fee: parseNumber(getCSVValue(values, mappedHeaders, 'flat_fee')),
            hourly_rate: parseNumber(getCSVValue(values, mappedHeaders, 'hourly_rate')),
            parts_cost: parseNumber(getCSVValue(values, mappedHeaders, 'parts_cost')),
            price: parseNumber(getCSVValue(values, mappedHeaders, 'price')),
            is_active: isActive,
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
    // Handle price ranges like "$75 - $200" by extracting first number
    // Also handle currency symbols and commas
    const cleaned = value.replace(/[$,]/g, '').trim();
    // If it's a range (contains "-" with spaces or multiple numbers), extract first number
    const rangeMatch = cleaned.match(/^([\d.]+)/);
    if (rangeMatch) {
      const num = parseFloat(rangeMatch[1]);
      return isNaN(num) ? null : num;
    }
    const num = parseFloat(cleaned);
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
        price_display: service.price_display || '',
        is_active: service.is_active,
        service_type: (service.service_type as ServiceType) || 'in_person',
        service_type_other: service.service_type_other || '',
        flat_fee: service.flat_fee?.toString() || '',
        hourly_rate: service.hourly_rate?.toString() || '',
        parts_cost: service.parts_cost?.toString() || '',
        category: service.category || '',
        sync_to_crm: service.sync_to_crm || false,
      });
    } else {
      setEditingService(null);
      setFormData({
        name: '',
        description: '',
        duration_minutes: '',
        price: '',
        price_display: '',
        is_active: true,
        service_type: 'in_person',
        service_type_other: '',
        flat_fee: '',
        hourly_rate: '',
        parts_cost: '',
        category: '',
        sync_to_crm: false,
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
    // Use custom price_display if set
    if (service.price_display) {
      return service.price_display;
    }
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
          <CardDescription className="text-muted-foreground">Services your business offers</CardDescription>
        </div>
        <div className="flex gap-2">
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv"
            className="hidden"
            onChange={handleFileSelect}
          />
          {categories.length > 0 && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="gap-2">
                  <Filter className="w-4 h-4" />
                  {categoryFilter || 'All Categories'}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => setCategoryFilter(null)}>
                  All Categories
                </DropdownMenuItem>
                {categories.map(cat => (
                  <DropdownMenuItem key={cat} onClick={() => setCategoryFilter(cat)}>
                    {cat}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          )}
          {categories.length > 0 && (
            <Button
              variant={groupByCategory ? 'secondary' : 'outline'}
              size="sm"
              className="gap-2"
              onClick={() => setGroupByCategory(!groupByCategory)}
            >
              <FolderOpen className="w-4 h-4" />
              Group
            </Button>
          )}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="icon">
                <MoreHorizontal className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={handleDownloadTemplate}>
                <FileDown className="w-4 h-4 mr-2" />
                Download Template
              </DropdownMenuItem>
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
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            {groupByCategory ? (
              <div className="space-y-4">
                {Object.entries(groupedServices).map(([category, categoryServices]) => (
                  <Collapsible
                    key={category}
                    open={!collapsedCategories.has(category)}
                    onOpenChange={() => toggleCategory(category)}
                  >
                    <CollapsibleTrigger asChild>
                      <div className="flex items-center gap-2 p-2 rounded-lg bg-muted/50 cursor-pointer hover:bg-muted">
                        {collapsedCategories.has(category) ? (
                          <ChevronRight className="w-4 h-4" />
                        ) : (
                          <ChevronDown className="w-4 h-4" />
                        )}
                        <FolderOpen className="w-4 h-4 text-muted-foreground" />
                        <span className="font-medium">{category}</span>
                        <Badge variant="secondary" className="ml-auto">
                          {categoryServices.length}
                        </Badge>
                      </div>
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead className="w-10"></TableHead>
                            <TableHead className="text-white">Service</TableHead>
                            <TableHead className="text-white">Type</TableHead>
                            <TableHead className="text-white">Duration</TableHead>
                            <TableHead className="text-white">Pricing</TableHead>
                            <TableHead className="text-white">Status</TableHead>
                            <TableHead className="w-40 text-white">Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          <SortableContext items={categoryServices.map(s => s.id)} strategy={verticalListSortingStrategy}>
                            {categoryServices.map((service) => (
                              <SortableRow
                                key={service.id}
                                service={service}
                                getServiceTypeDisplay={getServiceTypeDisplay}
                                getPriceDisplay={getPriceDisplay}
                                onView={() => handleViewDetails(service)}
                                onEdit={() => handleOpenDialog(service)}
                                onDuplicate={() => duplicateMutation.mutate(service)}
                                onDelete={() => deleteMutation.mutate(service.id)}
                                isDuplicating={duplicateMutation.isPending}
                              />
                            ))}
                          </SortableContext>
                        </TableBody>
                      </Table>
                    </CollapsibleContent>
                  </Collapsible>
                ))}
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-10"></TableHead>
                    <TableHead className="text-white">Service</TableHead>
                    <TableHead className="text-white">Category</TableHead>
                    <TableHead className="text-white">Type</TableHead>
                    <TableHead className="text-white">Duration</TableHead>
                    <TableHead className="text-white">Pricing</TableHead>
                    <TableHead className="text-white">Status</TableHead>
                    <TableHead className="w-40 text-white">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <SortableContext items={(groupedServices[''] || []).map(s => s.id)} strategy={verticalListSortingStrategy}>
                    {(groupedServices[''] || []).map((service) => (
                      <SortableRow
                        key={service.id}
                        service={service}
                        getServiceTypeDisplay={getServiceTypeDisplay}
                        getPriceDisplay={getPriceDisplay}
                        onView={() => handleViewDetails(service)}
                        onEdit={() => handleOpenDialog(service)}
                        onDuplicate={() => duplicateMutation.mutate(service)}
                        onDelete={() => deleteMutation.mutate(service.id)}
                        isDuplicating={duplicateMutation.isPending}
                        showCategory
                      />
                    ))}
                  </SortableContext>
                </TableBody>
              </Table>
            )}
          </DndContext>
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
              {/* Category */}
              {viewingService.category && (
                <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                  <FolderOpen className="w-5 h-5 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">Category</p>
                    <p className="font-medium">{viewingService.category}</p>
                  </div>
                </div>
              )}

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
                  {viewingService.price_display && (
                    <div className="flex justify-between items-center py-3 px-3 rounded-lg bg-primary/10">
                      <span className="text-sm font-medium">Custom Pricing</span>
                      <span className="font-bold text-primary">{viewingService.price_display}</span>
                    </div>
                  )}

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

                  {!viewingService.price_display && !viewingService.flat_fee && !viewingService.hourly_rate && !viewingService.parts_cost && !viewingService.price && (
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
              <Label htmlFor="category">Category <span className="text-muted-foreground text-xs">(optional)</span></Label>
              <Input
                id="category"
                value={formData.category}
                onChange={(e) => setFormData((prev) => ({ ...prev, category: e.target.value }))}
                placeholder="e.g., Hair, Nails, Consultation"
                list="category-suggestions"
              />
              {categories.length > 0 && (
                <datalist id="category-suggestions">
                  {categories.map(cat => <option key={cat} value={cat} />)}
                </datalist>
              )}
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
              
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="price_display">Custom Pricing Display <span className="text-muted-foreground text-xs">(optional)</span></Label>
                  <Input
                    id="price_display"
                    value={formData.price_display}
                    onChange={(e) => setFormData((prev) => ({ ...prev, price_display: e.target.value }))}
                    placeholder="e.g., $100-$250, Starting at $50, Call for quote"
                  />
                  <p className="text-xs text-muted-foreground">
                    If set, this will be shown instead of calculated pricing below
                  </p>
                </div>

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
            </div>

            <div className="flex items-center gap-3 pt-2">
              <Switch
                checked={formData.is_active}
                onCheckedChange={(checked) => setFormData((prev) => ({ ...prev, is_active: checked }))}
              />
              <Label>Active</Label>
            </div>

            {/* CRM Sync Option */}
            <div className="border-t pt-4 mt-2">
              <Label className="text-sm text-muted-foreground mb-3 block">CRM Integration</Label>
              <div className="flex items-center gap-3">
                <Switch
                  checked={formData.sync_to_crm}
                  onCheckedChange={(checked) => setFormData((prev) => ({ ...prev, sync_to_crm: checked }))}
                />
                <div>
                  <Label>Sync to CRM as Product</Label>
                  <p className="text-xs text-muted-foreground">When enabled, this service will sync to your connected CRM</p>
                </div>
              </div>
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
                          {service.price_display || [
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
