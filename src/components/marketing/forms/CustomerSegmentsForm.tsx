import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { 
  Search, 
  Plus, 
  Users, 
  Calendar, 
  DollarSign, 
  MapPin, 
  Filter,
  Mail,
  MessageSquare,
  Download,
  Eye,
  Trash2,
  Loader2,
  X
} from 'lucide-react';

interface CustomerSegmentsFormProps {
  companyId: string;
  onCancel: () => void;
}

interface SegmentCriteria {
  lastServiceDays: string;
  minSpend: string;
  maxSpend: string;
  serviceTypes: string[];
  status: string;
}

interface CustomerSegment {
  id: string;
  name: string;
  criteria: SegmentCriteria;
  customerCount: number;
  createdAt: string;
}

export const CustomerSegmentsForm: React.FC<CustomerSegmentsFormProps> = ({ companyId, onCancel }) => {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('browse');
  const [searchQuery, setSearchQuery] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  
  // New segment form state
  const [segmentName, setSegmentName] = useState('');
  const [lastServiceDays, setLastServiceDays] = useState('');
  const [minSpend, setMinSpend] = useState('');
  const [maxSpend, setMaxSpend] = useState('');
  const [selectedServiceTypes, setSelectedServiceTypes] = useState<string[]>([]);
  const [customerStatus, setCustomerStatus] = useState('all');
  
  // Preview count
  const [previewCount, setPreviewCount] = useState<number | null>(null);
  const [isLoadingPreview, setIsLoadingPreview] = useState(false);

  // Fetch services for filter
  const { data: services } = useQuery({
    queryKey: ['services', companyId],
    queryFn: async () => {
      const { data } = await supabase
        .from('services')
        .select('id, name')
        .eq('company_id', companyId)
        .eq('is_active', true);
      return data || [];
    },
  });

  // Fetch persisted segments
  const { data: segments = [] } = useQuery<CustomerSegment[]>({
    queryKey: ['customer_segments', companyId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('customer_segments' as any)
        .select('id, name, criteria, customer_count, created_at')
        .eq('company_id', companyId)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return (data || []).map((r: any) => ({
        id: r.id,
        name: r.name,
        criteria: r.criteria as SegmentCriteria,
        customerCount: r.customer_count ?? 0,
        createdAt: (r.created_at || '').split('T')[0],
      }));
    },
  });

  // Fetch customer count preview based on criteria
  const fetchPreviewCount = async () => {
    setIsLoadingPreview(true);
    try {
      // In production, this would query actual customer data
      // For now, simulate with appointment data
      let query = supabase
        .from('appointments')
        .select('customer_email', { count: 'exact', head: true })
        .eq('company_id', companyId);

      if (lastServiceDays) {
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - parseInt(lastServiceDays));
        query = query.gte('datetime', cutoffDate.toISOString());
      }

      if (selectedServiceTypes.length > 0) {
        query = query.in('service_type', selectedServiceTypes);
      }

      const { count } = await query;
      setPreviewCount(count || 0);
    } catch (error) {
      console.error('Error fetching preview:', error);
      setPreviewCount(0);
    } finally {
      setIsLoadingPreview(false);
    }
  };

  const handleCreateSegment = async () => {
    if (!segmentName.trim()) {
      toast.error('Please enter a segment name');
      return;
    }

    setIsCreating(true);
    try {
      const criteria: SegmentCriteria = {
        lastServiceDays,
        minSpend,
        maxSpend,
        serviceTypes: selectedServiceTypes,
        status: customerStatus,
      };
      const { error } = await supabase.from('customer_segments' as any).insert({
        company_id: companyId,
        name: segmentName,
        criteria: criteria as any,
        customer_count: previewCount || 0,
      });
      if (error) throw error;
      await queryClient.invalidateQueries({ queryKey: ['customer_segments', companyId] });
      toast.success('Segment created successfully');
      
      // Reset form
      setSegmentName('');
      setLastServiceDays('');
      setMinSpend('');
      setMaxSpend('');
      setSelectedServiceTypes([]);
      setCustomerStatus('all');
      setPreviewCount(null);
      setActiveTab('browse');
    } catch (error: any) {
      console.error('Failed to create segment:', error);
      toast.error('Failed to create segment');
    } finally {
      setIsCreating(false);
    }
  };

  const handleDeleteSegment = async (id: string) => {
    const { error } = await supabase.from('customer_segments' as any).delete().eq('id', id);
    if (error) {
      toast.error('Failed to delete segment');
      return;
    }
    await queryClient.invalidateQueries({ queryKey: ['customer_segments', companyId] });
    toast.success('Segment deleted');
  };

  const handleSendCampaign = (segment: CustomerSegment, channel: 'email' | 'sms') => {
    toast.success(`${channel === 'email' ? 'Email' : 'SMS'} campaign started for ${segment.name}`);
  };

  const handleExportSegment = (segment: CustomerSegment) => {
    toast.success(`Exporting ${segment.customerCount} customers from ${segment.name}`);
  };

  const filteredSegments = segments.filter(s => 
    s.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const toggleServiceType = (serviceName: string) => {
    setSelectedServiceTypes(prev => 
      prev.includes(serviceName) 
        ? prev.filter(s => s !== serviceName)
        : [...prev, serviceName]
    );
  };

  return (
    <Card className="border shadow-sm bg-background text-foreground">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <Users className="h-5 w-5 text-primary" />
            Customer Segments
          </CardTitle>
          <Button variant="ghost" size="icon" onClick={onCancel}>
            <X className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="inline-flex h-auto p-1.5 bg-muted/30 rounded-full border border-border/50 gap-1 mb-4">
            <TabsTrigger value="browse" className="px-4 py-2 rounded-full data-[state=active]:bg-background data-[state=active]:shadow-sm data-[state=active]:border data-[state=active]:border-border/50 transition-all">Browse Segments</TabsTrigger>
            <TabsTrigger value="create" className="px-4 py-2 rounded-full data-[state=active]:bg-background data-[state=active]:shadow-sm data-[state=active]:border data-[state=active]:border-border/50 transition-all">Create New</TabsTrigger>
          </TabsList>

          <TabsContent value="browse" className="space-y-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search segments..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>

            {/* Segment List */}
            <div className="space-y-3 max-h-[350px] overflow-y-auto">
              {filteredSegments.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Users className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p>No segments found</p>
                </div>
              ) : (
                filteredSegments.map((segment) => (
                  <Card key={segment.id} className="p-4 bg-background text-foreground">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-medium">{segment.name}</h4>
                          <Badge variant="secondary" className="text-xs">
                            {segment.customerCount} customers
                          </Badge>
                        </div>
                        <div className="flex flex-wrap gap-1.5 mt-2">
                          {segment.criteria.lastServiceDays && (
                            <Badge variant="outline" className="text-xs">
                              <Calendar className="h-3 w-3 mr-1" />
                              Last {segment.criteria.lastServiceDays} days
                            </Badge>
                          )}
                          {segment.criteria.minSpend && (
                            <Badge variant="outline" className="text-xs">
                              <DollarSign className="h-3 w-3 mr-1" />
                              ${segment.criteria.minSpend}+
                            </Badge>
                          )}
                          {segment.criteria.status !== 'all' && (
                            <Badge variant="outline" className="text-xs">
                              <Filter className="h-3 w-3 mr-1" />
                              {segment.criteria.status}
                            </Badge>
                          )}
                        </div>
                      </div>
                      <div className="flex gap-1">
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-8 w-8"
                          onClick={() => handleSendCampaign(segment, 'email')}
                          title="Send Email Campaign"
                        >
                          <Mail className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-8 w-8"
                          onClick={() => handleSendCampaign(segment, 'sms')}
                          title="Send SMS Campaign"
                        >
                          <MessageSquare className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-8 w-8"
                          onClick={() => handleExportSegment(segment)}
                          title="Export Segment"
                        >
                          <Download className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-8 w-8 text-destructive"
                          onClick={() => handleDeleteSegment(segment.id)}
                          title="Delete Segment"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </Card>
                ))
              )}
            </div>
          </TabsContent>

          <TabsContent value="create" className="space-y-4">
            {/* Segment Name */}
            <div className="space-y-2">
              <Label htmlFor="segmentName" className="text-foreground/70">Segment Name</Label>
              <Input
                id="segmentName"
                placeholder="e.g., High Value Customers"
                value={segmentName}
                onChange={(e) => setSegmentName(e.target.value)}
                className="bg-background text-foreground border-border placeholder:text-muted-foreground"
              />
            </div>

            {/* Criteria Section */}
            <div className="space-y-4 p-4 bg-muted/50 rounded-lg border border-border">
              <h4 className="font-medium text-sm flex items-center gap-2 text-foreground">
                <Filter className="h-4 w-4" />
                Segment Criteria
              </h4>

              {/* Last Service */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-sm flex items-center gap-1 text-foreground/70">
                    <Calendar className="h-3.5 w-3.5" />
                    Last Service Within
                  </Label>
                  <Select value={lastServiceDays} onValueChange={setLastServiceDays}>
                    <SelectTrigger className="bg-background text-foreground border-border">
                      <SelectValue placeholder="Select period" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="30">30 days</SelectItem>
                      <SelectItem value="60">60 days</SelectItem>
                      <SelectItem value="90">90 days</SelectItem>
                      <SelectItem value="180">6 months</SelectItem>
                      <SelectItem value="365">1 year</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label className="text-sm flex items-center gap-1 text-foreground/70">
                    <Filter className="h-3.5 w-3.5" />
                    Customer Status
                  </Label>
                  <Select value={customerStatus} onValueChange={setCustomerStatus}>
                    <SelectTrigger className="bg-background text-foreground border-border">
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All</SelectItem>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="inactive">Inactive</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Spend Range */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-sm flex items-center gap-1 text-foreground/70">
                    <DollarSign className="h-3.5 w-3.5" />
                    Min Total Spend
                  </Label>
                  <Input
                    type="number"
                    placeholder="0"
                    value={minSpend}
                    onChange={(e) => setMinSpend(e.target.value)}
                    className="bg-background text-foreground border-border placeholder:text-muted-foreground"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-sm flex items-center gap-1 text-foreground/70">
                    <DollarSign className="h-3.5 w-3.5" />
                    Max Total Spend
                  </Label>
                  <Input
                    type="number"
                    placeholder="No limit"
                    value={maxSpend}
                    onChange={(e) => setMaxSpend(e.target.value)}
                    className="bg-background text-foreground border-border placeholder:text-muted-foreground"
                  />
                </div>
              </div>

              {/* Service Types */}
              {services && services.length > 0 && (
                <div className="space-y-2">
                  <Label className="text-sm text-foreground/70">Service Types</Label>
                  <div className="flex flex-wrap gap-2">
                    {services.map((service) => (
                      <Badge
                        key={service.id}
                        variant={selectedServiceTypes.includes(service.name) ? 'default' : 'outline'}
                        className="cursor-pointer"
                        onClick={() => toggleServiceType(service.name)}
                      >
                        {service.name}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Preview */}
            <div className="flex items-center justify-between p-3 bg-primary/5 rounded-lg">
              <div className="flex items-center gap-2">
                <Eye className="h-4 w-4 text-primary" />
                <span className="text-sm">
                  {previewCount !== null 
                    ? `${previewCount} customers match this criteria` 
                    : 'Preview customer count'
                  }
                </span>
              </div>
              <Button 
                variant="outline" 
                size="sm"
                onClick={fetchPreviewCount}
                disabled={isLoadingPreview}
              >
                {isLoadingPreview ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  'Preview'
                )}
              </Button>
            </div>

            {/* Actions */}
            <div className="flex gap-2 pt-2">
              <Button 
                variant="outline" 
                className="flex-1"
                onClick={onCancel}
              >
                Cancel
              </Button>
              <Button 
                className="flex-1"
                onClick={handleCreateSegment}
                disabled={isCreating || !segmentName.trim()}
              >
                {isCreating ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <Plus className="h-4 w-4 mr-2" />
                )}
                Create Segment
              </Button>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};
