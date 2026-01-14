import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { 
  Users, 
  Phone, 
  Mail, 
  Search, 
  Clock,
  CheckCircle,
  Flame,
  Plus,
  X,
} from 'lucide-react';
import { LeadScoreBadge } from '@/components/leads';
import { LeadForm } from '@/components/marketing/forms/LeadForm';

interface Lead {
  id: string;
  name: string | null;
  phone: string | null;
  email: string | null;
  source: string;
  service_interest: string | null;
  status: string;
  priority: string;
  score: number | null;
  score_factors: Record<string, number> | null;
  created_at: string;
}

const STATUS_CONFIG = {
  new: { label: 'New', color: 'bg-blue-500' },
  contacted: { label: 'Contacted', color: 'bg-yellow-500' },
  qualified: { label: 'Qualified', color: 'bg-purple-500' },
  converted: { label: 'Converted', color: 'bg-green-500' },
  lost: { label: 'Lost', color: 'bg-gray-500' },
};

const PRIORITY_CONFIG = {
  low: { label: 'Low', color: 'text-gray-500' },
  normal: { label: 'Normal', color: 'text-blue-500' },
  high: { label: 'High', color: 'text-orange-500' },
  hot: { label: 'Hot', color: 'text-red-500' },
};

interface LeadsManagerProps {
  onClose?: () => void;
}

export const LeadsManager: React.FC<LeadsManagerProps> = ({ onClose }) => {
  const { companyId } = useAuth();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [isAddLeadOpen, setIsAddLeadOpen] = useState(false);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [newStatus, setNewStatus] = useState<string>('');

  const { data: leads = [], isLoading } = useQuery({
    queryKey: ['leads', companyId, statusFilter],
    queryFn: async () => {
      if (!companyId) return [];
      let query = supabase
        .from('leads')
        .select('*')
        .eq('company_id', companyId)
        .order('created_at', { ascending: false });

      if (statusFilter !== 'all') query = query.eq('status', statusFilter);

      const { data, error } = await query;
      if (error) throw error;
      return data as Lead[];
    },
    enabled: !!companyId,
  });

  const updateStatusMutation = useMutation({
    mutationFn: async ({ leadId, status }: { leadId: string; status: string }) => {
      const { error } = await supabase
        .from('leads')
        .update({ status, updated_at: new Date().toISOString() })
        .eq('id', leadId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leads'] });
      toast.success('Lead status updated');
      setSelectedLead(null);
    },
    onError: () => toast.error('Failed to update lead'),
  });

  const filteredLeads = leads.filter(lead => {
    if (!search) return true;
    const searchLower = search.toLowerCase();
    return (
      lead.name?.toLowerCase().includes(searchLower) ||
      lead.phone?.includes(search) ||
      lead.email?.toLowerCase().includes(searchLower)
    );
  });

  const stats = {
    total: leads.length,
    new: leads.filter(l => l.status === 'new').length,
    hot: leads.filter(l => l.priority === 'hot').length,
    converted: leads.filter(l => l.status === 'converted').length,
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-foreground">Leads</h3>
          <p className="text-sm text-foreground/70">Manage and follow up on potential customers</p>
        </div>
        <div className="flex items-center gap-2">
          <Dialog open={isAddLeadOpen} onOpenChange={setIsAddLeadOpen}>
            <DialogTrigger asChild>
              <Button size="sm">
                <Plus className="w-4 h-4 mr-2" />
                New Lead
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto p-0 border-0">
              {companyId && (
                <LeadForm
                  companyId={companyId}
                  onCancel={() => setIsAddLeadOpen(false)}
                  onSuccess={() => {
                    setIsAddLeadOpen(false);
                    queryClient.invalidateQueries({ queryKey: ['leads'] });
                  }}
                />
              )}
            </DialogContent>
          </Dialog>
          {onClose && (
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card className="bg-background/50">
          <CardContent className="p-3">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-foreground/70" />
              <span className="text-xl font-bold">{stats.total}</span>
            </div>
            <p className="text-xs text-foreground/70">Total</p>
          </CardContent>
        </Card>
        <Card className="bg-background/50">
          <CardContent className="p-3">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-blue-500" />
              <span className="text-xl font-bold">{stats.new}</span>
            </div>
            <p className="text-xs text-foreground/70">New</p>
          </CardContent>
        </Card>
        <Card className="bg-background/50">
          <CardContent className="p-3">
            <div className="flex items-center gap-2">
              <Flame className="h-4 w-4 text-red-500" />
              <span className="text-xl font-bold">{stats.hot}</span>
            </div>
            <p className="text-xs text-foreground/70">Hot</p>
          </CardContent>
        </Card>
        <Card className="bg-background/50">
          <CardContent className="p-3">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-500" />
              <span className="text-xl font-bold">{stats.converted}</span>
            </div>
            <p className="text-xs text-foreground/70">Converted</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search leads..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 h-9 bg-white"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-32 h-9 bg-white">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All</SelectItem>
            <SelectItem value="new">New</SelectItem>
            <SelectItem value="contacted">Contacted</SelectItem>
            <SelectItem value="qualified">Qualified</SelectItem>
            <SelectItem value="converted">Converted</SelectItem>
            <SelectItem value="lost">Lost</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Leads List */}
      <Card className="bg-background/50">
        <CardHeader className="py-3 px-4">
          <CardTitle className="text-sm">All Leads ({filteredLeads.length})</CardTitle>
        </CardHeader>
        <CardContent className="px-4 pb-4 pt-0">
          {isLoading ? (
            <div className="text-center py-6 text-foreground/70 text-sm">Loading...</div>
          ) : filteredLeads.length === 0 ? (
            <div className="text-center py-6 text-foreground/70 text-sm">
              No leads found.
            </div>
          ) : (
            <div className="space-y-2">
              {filteredLeads.slice(0, 6).map((lead) => {
                const statusConfig = STATUS_CONFIG[lead.status as keyof typeof STATUS_CONFIG] || STATUS_CONFIG.new;
                const priorityConfig = PRIORITY_CONFIG[lead.priority as keyof typeof PRIORITY_CONFIG] || PRIORITY_CONFIG.normal;

                return (
                  <Dialog key={lead.id}>
                    <DialogTrigger asChild>
                      <div 
                        className="p-3 border rounded-lg hover:bg-muted/50 cursor-pointer transition-colors"
                        onClick={() => {
                          setSelectedLead(lead);
                          setNewStatus(lead.status);
                        }}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="font-medium text-sm truncate">{lead.name || 'Unknown'}</span>
                              <LeadScoreBadge 
                                score={lead.score || 0} 
                                scoreFactors={lead.score_factors || undefined}
                                size="sm"
                              />
                              {lead.priority === 'hot' && <Flame className="h-3.5 w-3.5 text-red-500" />}
                            </div>
                            <div className="flex flex-wrap items-center gap-2 text-xs text-foreground/70">
                              {lead.phone && (
                                <span className="flex items-center gap-1">
                                  <Phone className="h-3 w-3" /> {lead.phone}
                                </span>
                              )}
                              {lead.email && (
                                <span className="flex items-center gap-1">
                                  <Mail className="h-3 w-3" /> {lead.email}
                                </span>
                              )}
                            </div>
                          </div>
                          <div className="flex flex-col items-end gap-1">
                            <Badge className={`${statusConfig.color} text-white text-xs`}>
                              {statusConfig.label}
                            </Badge>
                            <span className="text-xs text-foreground/70">
                              {format(new Date(lead.created_at), 'MMM d')}
                            </span>
                          </div>
                        </div>
                      </div>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Lead Details</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="text-sm text-foreground/70">Name</label>
                            <p className="font-medium">{lead.name || '-'}</p>
                          </div>
                          <div>
                            <label className="text-sm text-foreground/70">Phone</label>
                            <p className="font-medium">{lead.phone || '-'}</p>
                          </div>
                          <div>
                            <label className="text-sm text-foreground/70">Email</label>
                            <p className="font-medium">{lead.email || '-'}</p>
                          </div>
                          <div>
                            <label className="text-sm text-foreground/70">Source</label>
                            <p className="font-medium capitalize">{lead.source}</p>
                          </div>
                        </div>
                        {lead.service_interest && (
                          <div>
                            <label className="text-sm text-foreground/70">Service Interest</label>
                            <p className="font-medium">{lead.service_interest}</p>
                          </div>
                        )}
                        <div>
                          <label className="text-sm text-foreground/70 mb-2 block">Update Status</label>
                          <Select value={newStatus} onValueChange={setNewStatus}>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="new">New</SelectItem>
                              <SelectItem value="contacted">Contacted</SelectItem>
                              <SelectItem value="qualified">Qualified</SelectItem>
                              <SelectItem value="converted">Converted</SelectItem>
                              <SelectItem value="lost">Lost</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <Button 
                          onClick={() => updateStatusMutation.mutate({ leadId: lead.id, status: newStatus })}
                          disabled={newStatus === lead.status}
                          className="w-full"
                        >
                          Update Status
                        </Button>
                      </div>
                    </DialogContent>
                  </Dialog>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
