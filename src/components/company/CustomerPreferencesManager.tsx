import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { parseUTCDateTime } from '@/lib/dateUtils';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Users, Mail, Phone, MessageSquare, Loader2, Search, CheckCircle, XCircle, Save, Power } from "lucide-react";
import { triggerSetupProgressRefresh } from "@/hooks/useSetupProgress";
import { Label } from "@/components/ui/label";
import { format } from "date-fns";
import { toast } from "sonner";
import { AuraEmptyState } from '@/components/ui/aura-empty-state';

interface AppointmentWithPrefs {
  id: string;
  customer_name: string;
  customer_email: string | null;
  customer_phone: string | null;
  datetime: string;
  service_type: string;
  status: string;
  sms_opt_out: boolean;
  email_opt_out: boolean;
  call_opt_out: boolean;
}

export function CustomerPreferencesManager() {
  const { companyId } = useAuth();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("scheduled");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isEnabled, setIsEnabled] = useState(true);
  const [enabledLoaded, setEnabledLoaded] = useState(false);

  // Fetch company's customer_prefs_enabled setting
  const { data: companySetting } = useQuery({
    queryKey: ["company-customer-prefs-enabled", companyId],
    queryFn: async () => {
      if (!companyId) return null;
      const { data, error } = await supabase
        .from("companies")
        .select("customer_prefs_enabled, name")
        .eq("id", companyId)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!companyId,
  });

  // Sync isEnabled state with database value
  useEffect(() => {
    if (companySetting && !enabledLoaded) {
      setIsEnabled(companySetting.customer_prefs_enabled ?? true);
      setEnabledLoaded(true);
    }
  }, [companySetting, enabledLoaded]);

  const { data: appointments, isLoading } = useQuery({
    queryKey: ["appointments-preferences", companyId, statusFilter],
    queryFn: async () => {
      if (!companyId) return [];
      let query = supabase
        .from("appointments")
        .select("id, customer_name, customer_email, customer_phone, datetime, service_type, status, sms_opt_out, email_opt_out, call_opt_out")
        .eq("company_id", companyId)
        .order("datetime", { ascending: false })
        .limit(200);

      if (statusFilter !== "all") {
        query = query.eq("status", statusFilter);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as AppointmentWithPrefs[];
    },
    enabled: !!companyId,
  });

  const [hasChanges, setHasChanges] = useState(false);
  const [pendingChanges, setPendingChanges] = useState<Map<string, Partial<AppointmentWithPrefs>>>(new Map());

  const handlePreferenceChange = (id: string, field: string, value: boolean) => {
    setHasChanges(true);
    setPendingChanges(prev => {
      const newMap = new Map(prev);
      const existing = newMap.get(id) || {};
      newMap.set(id, { ...existing, [field]: value });
      return newMap;
    });
  };

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (!companyId) throw new Error("No company ID");
      
      // Save the enabled toggle to companies table
      const { error: companyError } = await supabase
        .from("companies")
        .update({ customer_prefs_enabled: isEnabled })
        .eq("id", companyId);
      if (companyError) throw companyError;

      // Save individual appointment preference changes
      const updates = Array.from(pendingChanges.entries());
      for (const [id, changes] of updates) {
        const { error } = await supabase
          .from("appointments")
          .update(changes)
          .eq("id", id);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["appointments-preferences"] });
      queryClient.invalidateQueries({ queryKey: ["company-customer-prefs-enabled"] });
      toast.success("Customer preferences saved");
      triggerSetupProgressRefresh();
      setHasChanges(false);
      setPendingChanges(new Map());
    },
    onError: (error) => {
      toast.error("Failed to save preferences");
      console.error(error);
    },
  });

  const updatePreferenceMutation = useMutation({
    mutationFn: async ({ id, field, value }: { id: string; field: string; value: boolean }) => {
      const { error } = await supabase
        .from("appointments")
        .update({ [field]: value } as never)
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["appointments-preferences"] });
    },
    onError: (error) => {
      toast.error("Failed to update preference");
      console.error(error);
    },
  });

  const bulkUpdateMutation = useMutation({
    mutationFn: async ({ ids, field, value }: { ids: string[]; field: string; value: boolean }) => {
      const { error } = await supabase
        .from("appointments")
        .update({ [field]: value } as never)
        .in("id", ids);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["appointments-preferences"] });
      setSelectedIds(new Set());
      toast.success("Preferences updated successfully");
    },
    onError: (error) => {
      toast.error("Failed to update preferences");
      console.error(error);
    },
  });

  const filteredAppointments = appointments?.filter(apt => 
    apt.customer_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    apt.customer_email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    apt.customer_phone?.includes(searchTerm)
  ) || [];

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedIds(new Set(filteredAppointments.map(a => a.id)));
    } else {
      setSelectedIds(new Set());
    }
  };

  const handleSelectOne = (id: string, checked: boolean) => {
    const newSet = new Set(selectedIds);
    if (checked) {
      newSet.add(id);
    } else {
      newSet.delete(id);
    }
    setSelectedIds(newSet);
  };

  const handleBulkUpdate = (field: string, value: boolean) => {
    if (selectedIds.size === 0) {
      toast.error("Please select appointments first");
      return;
    }
    bulkUpdateMutation.mutate({ ids: Array.from(selectedIds), field, value });
  };

  const getPreferenceBadge = (optOut: boolean, hasContact: boolean) => {
    if (!hasContact) {
      return <Badge variant="outline" className="text-xs opacity-50">N/A</Badge>;
    }
    return optOut ? (
      <Badge variant="outline" className="text-xs text-destructive border-destructive/30">Off</Badge>
    ) : (
      <Badge variant="outline" className="text-xs text-green-600 border-green-500/30">On</Badge>
    );
  };

  if (isLoading) {
    return (
      <Card className="border-border/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Customer Preferences
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-border/50">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Customer Preferences
            </CardTitle>
            <CardDescription>
              Manage notification preferences for customer appointments
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Label htmlFor="customer-prefs-toggle" className="text-sm text-muted-foreground">
              {isEnabled ? "Enabled" : "Disabled"}
            </Label>
            <Switch
              id="customer-prefs-toggle"
              checked={isEnabled}
              onCheckedChange={(checked) => {
                setIsEnabled(checked);
                setHasChanges(true);
              }}
            />
          </div>
        </div>
      </CardHeader>
      <CardContent className={`space-y-4 ${!isEnabled ? 'opacity-50 pointer-events-none' : ''}`}>
        {/* Filters */}
        <div className="flex flex-wrap gap-3">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by name, email, or phone..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="scheduled">Scheduled</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
              <SelectItem value="cancelled">Cancelled</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Bulk Actions */}
        {selectedIds.size > 0 && (
          <div className="flex flex-wrap items-center gap-2 p-3 rounded-lg bg-muted/50 border">
            <span className="text-sm font-medium">{selectedIds.size} selected:</span>
            <div className="flex flex-wrap gap-2">
              <Button size="sm" variant="outline" onClick={() => handleBulkUpdate("sms_opt_out", false)}>
                <MessageSquare className="h-3 w-3 mr-1" />
                Enable SMS
              </Button>
              <Button size="sm" variant="outline" onClick={() => handleBulkUpdate("sms_opt_out", true)}>
                <MessageSquare className="h-3 w-3 mr-1 opacity-50" />
                Disable SMS
              </Button>
              <Button size="sm" variant="outline" onClick={() => handleBulkUpdate("email_opt_out", false)}>
                <Mail className="h-3 w-3 mr-1" />
                Enable Email
              </Button>
              <Button size="sm" variant="outline" onClick={() => handleBulkUpdate("email_opt_out", true)}>
                <Mail className="h-3 w-3 mr-1 opacity-50" />
                Disable Email
              </Button>
              <Button size="sm" variant="outline" onClick={() => handleBulkUpdate("call_opt_out", false)}>
                <Phone className="h-3 w-3 mr-1" />
                Enable Calls
              </Button>
              <Button size="sm" variant="outline" onClick={() => handleBulkUpdate("call_opt_out", true)}>
                <Phone className="h-3 w-3 mr-1 opacity-50" />
                Disable Calls
              </Button>
            </div>
          </div>
        )}

        {/* Table */}
        {filteredAppointments.length === 0 ? (
          <AuraEmptyState
            icon={Users}
            title={companySetting?.name ? `No appointments for ${companySetting.name} yet` : 'No appointments yet'}
            description="Appointments with customer preferences will appear here once bookings come in."
          />
        ) : (
          <ScrollArea className="h-[500px]">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[50px]">
                    <Checkbox
                      checked={selectedIds.size === filteredAppointments.length && filteredAppointments.length > 0}
                      onCheckedChange={handleSelectAll}
                    />
                  </TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Appointment</TableHead>
                  <TableHead className="text-center">
                    <div className="flex items-center justify-center gap-1">
                      <MessageSquare className="h-3 w-3" />
                      SMS
                    </div>
                  </TableHead>
                  <TableHead className="text-center">
                    <div className="flex items-center justify-center gap-1">
                      <Mail className="h-3 w-3" />
                      Email
                    </div>
                  </TableHead>
                  <TableHead className="text-center">
                    <div className="flex items-center justify-center gap-1">
                      <Phone className="h-3 w-3" />
                      Call
                    </div>
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredAppointments.map((apt) => (
                  <TableRow key={apt.id}>
                    <TableCell>
                      <Checkbox
                        checked={selectedIds.has(apt.id)}
                        onCheckedChange={(checked) => handleSelectOne(apt.id, !!checked)}
                      />
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium">{apt.customer_name}</p>
                        <p className="text-xs text-muted-foreground truncate max-w-[200px]">
                          {apt.customer_email || apt.customer_phone || "No contact"}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="text-sm">{apt.service_type}</p>
                        <p className="text-xs text-muted-foreground">
                          {format(parseUTCDateTime(apt.datetime), "MMM d, yyyy")}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell className="text-center">
                      <Switch
                        checked={pendingChanges.get(apt.id)?.sms_opt_out !== undefined 
                          ? !pendingChanges.get(apt.id)?.sms_opt_out 
                          : !apt.sms_opt_out}
                        onCheckedChange={(checked) => 
                          handlePreferenceChange(apt.id, "sms_opt_out", !checked)
                        }
                        disabled={!apt.customer_phone}
                      />
                    </TableCell>
                    <TableCell className="text-center">
                      <Switch
                        checked={pendingChanges.get(apt.id)?.email_opt_out !== undefined 
                          ? !pendingChanges.get(apt.id)?.email_opt_out 
                          : !apt.email_opt_out}
                        onCheckedChange={(checked) => 
                          handlePreferenceChange(apt.id, "email_opt_out", !checked)
                        }
                        disabled={!apt.customer_email}
                      />
                    </TableCell>
                    <TableCell className="text-center">
                      <Switch
                        checked={pendingChanges.get(apt.id)?.call_opt_out !== undefined 
                          ? !pendingChanges.get(apt.id)?.call_opt_out 
                          : !apt.call_opt_out}
                        onCheckedChange={(checked) => 
                          handlePreferenceChange(apt.id, "call_opt_out", !checked)
                        }
                        disabled={!apt.customer_phone}
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </ScrollArea>
        )}

        <div className="flex items-center justify-between pt-4 border-t">
          <p className="text-xs text-muted-foreground">
            Showing {filteredAppointments.length} of {appointments?.length || 0} appointments
          </p>
          <Button 
            onClick={() => saveMutation.mutate()} 
            disabled={!hasChanges || saveMutation.isPending}
          >
            {saveMutation.isPending ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Save className="h-4 w-4 mr-2" />
            )}
            Save Preferences
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}