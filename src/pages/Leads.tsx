import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { 
  Users, 
  Phone, 
  Mail, 
  MessageSquare, 
  Search, 
  Filter,
  TrendingUp,
  Clock,
  CheckCircle,
  XCircle,
  Flame,
  Plus,
} from 'lucide-react';
import { LeadScoreBadge, LeadActivityTimeline, LeadFollowUpManager, LeadAnalyticsSection } from '@/components/leads';
import { LeadForm } from '@/components/marketing/forms/LeadForm';

interface Lead {
  id: string;
  name: string | null;
  phone: string | null;
  email: string | null;
  address: string | null;
  source: string;
  service_interest: string | null;
  intent: string | null;
  notes: string | null;
  status: string;
  priority: string;
  score: number | null;
  score_factors: Record<string, number> | null;
  created_at: string;
  follow_up_at: string | null;
}

const STATUS_CONFIG = {
  new: { label: 'New', color: 'bg-secondary', icon: Clock },
  contacted: { label: 'Contacted', color: 'bg-yellow-500', icon: Phone },
  qualified: { label: 'Qualified', color: 'bg-purple-500', icon: TrendingUp },
  converted: { label: 'Converted', color: 'bg-green-500', icon: CheckCircle },
  lost: { label: 'Lost', color: 'bg-muted', icon: XCircle },
};

const PRIORITY_CONFIG = {
  low: { label: 'Low', color: 'text-muted-foreground' },
  normal: { label: 'Normal', color: 'text-secondary' },
  high: { label: 'High', color: 'text-orange-500' },
  hot: { label: 'Hot', color: 'text-red-500', icon: Flame },
};

const SOURCE_CONFIG = {
  voice: { label: 'Voice', icon: Phone },
  sms: { label: 'SMS', icon: MessageSquare },
  chat: { label: 'Chat', icon: MessageSquare },
  email: { label: 'Email', icon: Mail },
  widget: { label: 'Widget', icon: Users },
};

export default function Leads() {
  const { companyId } = useAuth();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [newStatus, setNewStatus] = useState<string>('');
  const [followUpNotes, setFollowUpNotes] = useState('');
  const [isAddLeadOpen, setIsAddLeadOpen] = useState(false);

  const { data: leads = [], isLoading } = useQuery({
    queryKey: ['leads', companyId, statusFilter, priorityFilter],
    queryFn: async () => {
      if (!companyId) return [];
      let query = supabase
        .from('leads')
        .select('*')
        .eq('company_id', companyId)
        .order('created_at', { ascending: false });

      if (statusFilter !== 'all') query = query.eq('status', statusFilter);
      if (priorityFilter !== 'all') query = query.eq('priority', priorityFilter);

      const { data, error } = await query;
      if (error) throw error;
      return data as Lead[];
    },
    enabled: !!companyId,
  });

  const updateStatusMutation = useMutation({
    mutationFn: async ({ leadId, status, notes }: { leadId: string; status: string; notes?: string }) => {
      const updateData: any = { status, updated_at: new Date().toISOString() };
      if (notes) updateData.notes = notes;
      
      const { error } = await supabase
        .from('leads')
        .update(updateData)
        .eq('id', leadId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leads'] });
      toast.success('Lead status updated');
      setSelectedLead(null);
      setFollowUpNotes('');
    },
    onError: () => toast.error('Failed to update lead'),
  });

  const filteredLeads = leads.filter(lead => {
    if (!search) return true;
    const searchLower = search.toLowerCase();
    return (
      lead.name?.toLowerCase().includes(searchLower) ||
      lead.phone?.includes(search) ||
      lead.email?.toLowerCase().includes(searchLower) ||
      lead.service_interest?.toLowerCase().includes(searchLower)
    );
  });

  const stats = {
    total: leads.length,
    new: leads.filter(l => l.status === 'new').length,
    hot: leads.filter(l => l.priority === 'hot').length,
    converted: leads.filter(l => l.status === 'converted').length,
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Leads</h1>
            <p className="text-white/70">Manage and follow up on potential customers</p>
          </div>
          <Dialog open={isAddLeadOpen} onOpenChange={setIsAddLeadOpen}>
            <DialogTrigger asChild>
              <Button>
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
        </div>

        {/* Analytics Section */}
        <LeadAnalyticsSection />

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Users className="h-5 w-5 text-white/70" />
                <span className="text-2xl font-bold">{stats.total}</span>
              </div>
              <p className="text-sm text-white/70">Total Leads</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-blue-500" />
                <span className="text-2xl font-bold">{stats.new}</span>
              </div>
              <p className="text-sm text-white/70">New Leads</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Flame className="h-5 w-5 text-red-500" />
                <span className="text-2xl font-bold">{stats.hot}</span>
              </div>
              <p className="text-sm text-white/70">Hot Leads</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-green-500" />
                <span className="text-2xl font-bold">{stats.converted}</span>
              </div>
              <p className="text-sm text-white/70">Converted</p>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="p-4">
            <div className="flex flex-wrap gap-4">
              <div className="flex-1 min-w-[200px]">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search leads..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="pl-9"
                  />
                </div>
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[150px]">
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="new">New</SelectItem>
                  <SelectItem value="contacted">Contacted</SelectItem>
                  <SelectItem value="qualified">Qualified</SelectItem>
                  <SelectItem value="converted">Converted</SelectItem>
                  <SelectItem value="lost">Lost</SelectItem>
                </SelectContent>
              </Select>
              <Select value={priorityFilter} onValueChange={setPriorityFilter}>
                <SelectTrigger className="w-[150px]">
                  <SelectValue placeholder="Priority" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Priority</SelectItem>
                  <SelectItem value="hot">Hot</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="normal">Normal</SelectItem>
                  <SelectItem value="low">Low</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Leads List */}
        <Card>
          <CardHeader>
            <CardTitle>All Leads ({filteredLeads.length})</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-center py-8 text-white/70">Loading leads...</div>
            ) : filteredLeads.length === 0 ? (
              <div className="text-center py-8 text-white/70">
                No leads found. Leads are automatically captured when customers interact with your AI agents.
              </div>
            ) : (
              <div className="space-y-3">
                {filteredLeads.map((lead) => {
                  const statusConfig = STATUS_CONFIG[lead.status as keyof typeof STATUS_CONFIG] || STATUS_CONFIG.new;
                  const priorityConfig = PRIORITY_CONFIG[lead.priority as keyof typeof PRIORITY_CONFIG] || PRIORITY_CONFIG.normal;
                  const sourceConfig = SOURCE_CONFIG[lead.source as keyof typeof SOURCE_CONFIG];

                  return (
                    <Dialog key={lead.id}>
                      <DialogTrigger asChild>
                        <div 
                          className="p-4 border rounded-lg hover:bg-muted/50 cursor-pointer transition-colors"
                          onClick={() => {
                            setSelectedLead(lead);
                            setNewStatus(lead.status);
                          }}
                        >
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                <span className="font-medium truncate">{lead.name || 'Unknown'}</span>
                                <LeadScoreBadge 
                                  score={lead.score || 0} 
                                  scoreFactors={lead.score_factors || undefined}
                                  size="sm"
                                />
                                {lead.priority === 'hot' && <Flame className="h-4 w-4 text-red-500" />}
                                <Badge variant="outline" className={priorityConfig.color}>
                                  {priorityConfig.label}
                                </Badge>
                              </div>
                              <div className="flex flex-wrap items-center gap-3 text-sm text-white/70">
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
                                {sourceConfig && (
                                  <span className="flex items-center gap-1">
                                    <sourceConfig.icon className="h-3 w-3" /> {sourceConfig.label}
                                  </span>
                                )}
                              </div>
                              {lead.service_interest && (
                                <p className="text-sm mt-1">
                                  <span className="text-white/70">Interest:</span> {lead.service_interest}
                                </p>
                              )}
                            </div>
                            <div className="flex flex-col items-end gap-1">
                              <Badge className={`${statusConfig.color} text-white`}>
                                {statusConfig.label}
                              </Badge>
                              <span className="text-xs text-white/70">
                                {format(new Date(lead.created_at), 'MMM d, h:mm a')}
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
                          <Tabs defaultValue="details">
                            <TabsList className="grid w-full grid-cols-3">
                              <TabsTrigger value="details">Details</TabsTrigger>
                              <TabsTrigger value="activity">Activity</TabsTrigger>
                              <TabsTrigger value="followups">Follow-ups</TabsTrigger>
                            </TabsList>
                            <TabsContent value="details" className="space-y-4 mt-4">
                              <div className="flex items-center gap-3 mb-4">
                                <LeadScoreBadge 
                                  score={lead.score || 0} 
                                  scoreFactors={lead.score_factors || undefined}
                                  size="lg"
                                />
                                <div>
                                  <p className="text-sm text-muted-foreground">Lead Score</p>
                                  <p className="font-medium">{lead.score || 0}/100</p>
                                </div>
                              </div>
                              <div className="grid grid-cols-2 gap-4">
                                <div>
                                  <label className="text-sm text-white/70">Name</label>
                                  <p className="font-medium">{lead.name || '-'}</p>
                                </div>
                                <div>
                                  <label className="text-sm text-white/70">Phone</label>
                                  <p className="font-medium">{lead.phone || '-'}</p>
                                </div>
                                <div>
                                  <label className="text-sm text-white/70">Email</label>
                                  <p className="font-medium">{lead.email || '-'}</p>
                                </div>
                                <div>
                                  <label className="text-sm text-white/70">Source</label>
                                  <p className="font-medium capitalize">{lead.source}</p>
                                </div>
                              </div>
                              {lead.service_interest && (
                                <div>
                                  <label className="text-sm text-white/70">Service Interest</label>
                                  <p className="font-medium">{lead.service_interest}</p>
                                </div>
                              )}
                              {lead.notes && (
                                <div>
                                  <label className="text-sm text-white/70">Notes</label>
                                  <p className="text-sm bg-muted p-2 rounded">{lead.notes}</p>
                                </div>
                              )}
                              <div>
                                <label className="text-sm text-white/70 mb-2 block">Update Status</label>
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
                              <div>
                                <label className="text-sm text-white/70 mb-2 block">Follow-up Notes</label>
                                <Textarea
                                  placeholder="Add notes about this lead..."
                                  value={followUpNotes}
                                  onChange={(e) => setFollowUpNotes(e.target.value)}
                                />
                              </div>
                              <div className="flex gap-2">
                                <Button
                                  className="flex-1"
                                  onClick={() => updateStatusMutation.mutate({
                                    leadId: lead.id,
                                    status: newStatus,
                                    notes: followUpNotes || undefined,
                                  })}
                                  disabled={updateStatusMutation.isPending}
                                >
                                  Update Lead
                                </Button>
                                {lead.phone && (
                                  <Button variant="outline" asChild>
                                    <a href={`tel:${lead.phone}`}>
                                      <Phone className="h-4 w-4" />
                                    </a>
                                  </Button>
                                )}
                                {lead.email && (
                                  <Button variant="outline" asChild>
                                    <a href={`mailto:${lead.email}`}>
                                      <Mail className="h-4 w-4" />
                                    </a>
                                  </Button>
                                )}
                              </div>
                            </TabsContent>
                            <TabsContent value="activity" className="mt-4">
                              <LeadActivityTimeline leadId={lead.id} maxHeight="400px" />
                            </TabsContent>
                            <TabsContent value="followups" className="mt-4">
                              <LeadFollowUpManager 
                                leadId={lead.id}
                                leadName={lead.name}
                                leadPhone={lead.phone}
                                leadEmail={lead.email}
                              />
                            </TabsContent>
                          </Tabs>
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
    </DashboardLayout>
  );
}
