import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { toast } from 'sonner';
import { Wrench, Loader2, Check, AlertCircle } from 'lucide-react';

interface TechnicianServiceAssignmentsProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  employeeId: string;
  employeeName: string;
}

interface Service {
  id: string;
  name: string;
  description: string | null;
  duration_minutes: number;
  price: number | null;
}

export function TechnicianServiceAssignments({
  open,
  onOpenChange,
  employeeId,
  employeeName,
}: TechnicianServiceAssignmentsProps) {
  const { companyId, user } = useAuth();
  const queryClient = useQueryClient();
  const [selectedServices, setSelectedServices] = useState<Set<string>>(new Set());
  const [initialServices, setInitialServices] = useState<Set<string>>(new Set());

  // Fetch all company services
  const { data: services, isLoading: servicesLoading } = useQuery({
    queryKey: ['services', companyId],
    queryFn: async () => {
      if (!companyId) return [];
      const { data, error } = await supabase
        .from('services')
        .select('*')
        .eq('company_id', companyId)
        .eq('is_active', true)
        .order('name');

      if (error) throw error;
      return data as Service[];
    },
    enabled: !!companyId && open,
  });

  // Fetch technician's current service assignments
  const { data: currentAssignments, isLoading: assignmentsLoading } = useQuery({
    queryKey: ['technician-service-assignments', employeeId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('technician_service_assignments')
        .select('service_id')
        .eq('technician_id', employeeId);

      if (error) throw error;
      return data.map((a) => a.service_id);
    },
    enabled: !!employeeId && open,
  });

  // Initialize selected services when data loads
  useEffect(() => {
    if (currentAssignments) {
      const serviceSet = new Set(currentAssignments);
      setSelectedServices(serviceSet);
      setInitialServices(serviceSet);
    }
  }, [currentAssignments]);

  // Save mutation
  const saveMutation = useMutation({
    mutationFn: async () => {
      if (!companyId) throw new Error('No company ID');

      const currentServiceIds = Array.from(selectedServices);
      const initialServiceIds = Array.from(initialServices);

      // Find services to add
      const toAdd = currentServiceIds.filter((id) => !initialServiceIds.includes(id));
      // Find services to remove
      const toRemove = initialServiceIds.filter((id) => !currentServiceIds.includes(id));

      // Remove unselected services
      if (toRemove.length > 0) {
        const { error } = await supabase
          .from('technician_service_assignments')
          .delete()
          .eq('technician_id', employeeId)
          .in('service_id', toRemove);

        if (error) throw error;
      }

      // Add new services
      if (toAdd.length > 0) {
        const { error } = await supabase.from('technician_service_assignments').insert(
          toAdd.map((serviceId) => ({
            technician_id: employeeId,
            service_id: serviceId,
            company_id: companyId,
            assigned_by: user?.id,
          }))
        );

        if (error) throw error;
      }
    },
    onSuccess: () => {
      toast.success('Service assignments updated');
      queryClient.invalidateQueries({ queryKey: ['technician-service-assignments'] });
      setInitialServices(new Set(selectedServices));
      onOpenChange(false);
    },
    onError: (error) => {
      console.error('Error updating service assignments:', error);
      toast.error('Failed to update service assignments');
    },
  });

  const toggleService = (serviceId: string) => {
    setSelectedServices((prev) => {
      const next = new Set(prev);
      if (next.has(serviceId)) {
        next.delete(serviceId);
      } else {
        next.add(serviceId);
      }
      return next;
    });
  };

  const selectAll = () => {
    if (services) {
      setSelectedServices(new Set(services.map((s) => s.id)));
    }
  };

  const clearAll = () => {
    setSelectedServices(new Set());
  };

  const hasChanges = () => {
    if (selectedServices.size !== initialServices.size) return true;
    for (const id of selectedServices) {
      if (!initialServices.has(id)) return true;
    }
    return false;
  };

  const isLoading = servicesLoading || assignmentsLoading;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Wrench className="h-5 w-5 text-primary" />
            Assign Services
          </DialogTitle>
          <DialogDescription>
            Select which services <span className="font-medium">{employeeName}</span> can perform.
            Only appointments for these services will be assigned to this technician.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {isLoading ? (
            <div className="space-y-2">
              {[1, 2, 3, 4].map((i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : services && services.length > 0 ? (
            <>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">
                  {selectedServices.size} of {services.length} selected
                </span>
                <div className="flex gap-2">
                  <Button variant="ghost" size="sm" onClick={selectAll}>
                    Select All
                  </Button>
                  <Button variant="ghost" size="sm" onClick={clearAll}>
                    Clear
                  </Button>
                </div>
              </div>

              <ScrollArea className="h-[300px] rounded-md border p-3">
                <div className="space-y-2">
                  {services.map((service) => {
                    const isSelected = selectedServices.has(service.id);
                    return (
                      <div
                        key={service.id}
                        className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                          isSelected
                            ? 'border-primary bg-primary/5'
                            : 'border-border hover:bg-muted/50'
                        }`}
                        onClick={() => toggleService(service.id)}
                      >
                        <Checkbox checked={isSelected} className="pointer-events-none" />
                        <div className="flex-1 min-w-0">
                          <p className="font-medium truncate">{service.name}</p>
                          {service.description && (
                            <p className="text-xs text-muted-foreground truncate">
                              {service.description}
                            </p>
                          )}
                        </div>
                        <Badge variant="secondary" className="text-xs shrink-0">
                          {service.duration_minutes} min
                        </Badge>
                        {isSelected && <Check className="h-4 w-4 text-primary shrink-0" />}
                      </div>
                    );
                  })}
                </div>
              </ScrollArea>

              {selectedServices.size === 0 && (
                <div className="flex items-center gap-2 text-sm text-amber-600 bg-amber-50 dark:bg-amber-900/20 p-3 rounded-lg">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  <span>
                    No services selected. This technician won't be assigned any appointments.
                  </span>
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <Wrench className="h-10 w-10 mx-auto mb-3 opacity-50" />
              <p>No services found.</p>
              <p className="text-sm">Add services in the Knowledge Base first.</p>
            </div>
          )}
        </div>

        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            onClick={() => saveMutation.mutate()}
            disabled={!hasChanges() || saveMutation.isPending}
          >
            {saveMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Save Changes
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
