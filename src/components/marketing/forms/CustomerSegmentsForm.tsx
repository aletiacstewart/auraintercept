import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
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

// Mock segments for demo (in production, these would come from a database table)
const MOCK_SEGMENTS: CustomerSegment[] = [
  {
    id: '1',
    name: 'High Value Customers',
    criteria: { lastServiceDays: '90', minSpend: '500', maxSpend: '', serviceTypes: [], status: 'active' },
    customerCount: 45,
    createdAt: '2024-01-15',
  },
  {
    id: '2',
    name: 'Inactive (90+ days)',
    criteria: { lastServiceDays: '90', minSpend: '', maxSpend: '', serviceTypes: [], status: 'inactive' },
    customerCount: 128,
    createdAt: '2024-01-10',
  },
  {
    id: '3',
    name: 'New Customers',
    criteria: { lastServiceDays: '30', minSpend: '', maxSpend: '', serviceTypes: [], status: 'active' },
    customerCount: 32,
    createdAt: '2024-02-01',
  },
];

export const CustomerSegmentsForm: React.FC<CustomerSegmentsFormProps> = ({ companyId, onCancel }) => {
  const [activeTab, setActiveTab] = useState('browse');
  const [searchQuery, setSearchQuery] = useState('');
  const [segments, setSegments] = useState<CustomerSegment[]>(MOCK_SEGMENTS);
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
      // In production, save to database
      const newSegment: CustomerSegment = {
        id: Date.now().toString(),
        name: segmentName,
        criteria: {
          lastServiceDays,
          minSpend,
          maxSpend,
          serviceTypes: selectedServiceTypes,
          status: customerStatus,
        },
        customerCount: previewCount || 0,
        createdAt: new Date().toISOString().split('T')[0],
      };

      setSegments([newSegment, ...segments]);
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
    } catch (error) {
      toast.error('Failed to create segment');
    } finally {
      setIsCreating(false);
    }
  };

  const handleDeleteSegment = (id: string) => {
    setSegments(segments.filter(s => s.id !== id));
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
    <Card className="border shadow-sm">
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
          <TabsList className="grid w-full grid-cols-2 mb-4">
            <TabsTrigger value="browse">Browse Segments</TabsTrigger>
            <TabsTrigger value="create">Create New</TabsTrigger>
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
                  <Card key={segment.id} className="p-4">
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
              <Label htmlFor="segmentName">Segment Name</Label>
              <Input
                id="segmentName"
                placeholder="e.g., High Value Customers"
                value={segmentName}
                onChange={(e) => setSegmentName(e.target.value)}
              />
            </div>

            {/* Criteria Section */}
            <div className="space-y-4 p-4 bg-muted/50 rounded-lg">
              <h4 className="font-medium text-sm flex items-center gap-2">
                <Filter className="h-4 w-4" />
                Segment Criteria
              </h4>

              {/* Last Service */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-sm flex items-center gap-1">
                    <Calendar className="h-3.5 w-3.5" />
                    Last Service Within
                  </Label>
                  <Select value={lastServiceDays} onValueChange={setLastServiceDays}>
                    <SelectTrigger>
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
                  <Label className="text-sm flex items-center gap-1">
                    <Filter className="h-3.5 w-3.5" />
                    Customer Status
                  </Label>
                  <Select value={customerStatus} onValueChange={setCustomerStatus}>
                    <SelectTrigger>
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
                  <Label className="text-sm flex items-center gap-1">
                    <DollarSign className="h-3.5 w-3.5" />
                    Min Total Spend
                  </Label>
                  <Input
                    type="number"
                    placeholder="0"
                    value={minSpend}
                    onChange={(e) => setMinSpend(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-sm flex items-center gap-1">
                    <DollarSign className="h-3.5 w-3.5" />
                    Max Total Spend
                  </Label>
                  <Input
                    type="number"
                    placeholder="No limit"
                    value={maxSpend}
                    onChange={(e) => setMaxSpend(e.target.value)}
                  />
                </div>
              </div>

              {/* Service Types */}
              {services && services.length > 0 && (
                <div className="space-y-2">
                  <Label className="text-sm">Service Types</Label>
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
