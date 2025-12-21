import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { format } from 'date-fns';
import { Shield, Plus, Search, AlertTriangle, CheckCircle, FileText } from 'lucide-react';
import { WarrantyForm } from '@/components/billing/forms/WarrantyForm';

export default function Warranties() {
  const { companyId } = useAuth();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);

  const { data: warranties, isLoading } = useQuery({
    queryKey: ['warranties', companyId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('warranty_records')
        .select('*')
        .eq('company_id', companyId)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data || [];
    },
    enabled: !!companyId,
  });

  const { data: claims } = useQuery({
    queryKey: ['warranty-claims', companyId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('warranty_claims')
        .select('*, warranty_records(customer_name, coverage_type)')
        .eq('company_id', companyId)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data || [];
    },
    enabled: !!companyId,
  });

  const filteredWarranties = warranties?.filter(w =>
    w.customer_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    w.equipment_type?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusBadge = (endDate: string, isActive: boolean) => {
    if (!isActive || new Date(endDate) < new Date()) {
      return <Badge variant="destructive" className="gap-1"><AlertTriangle className="h-3 w-3" /> Expired</Badge>;
    }
    return <Badge className="gap-1 bg-green-500/20 text-green-700 border-green-500/30"><CheckCircle className="h-3 w-3" /> Active</Badge>;
  };

  const handleSuccess = () => {
    setDialogOpen(false);
    queryClient.invalidateQueries({ queryKey: ['warranties'] });
  };

  return (
    <DashboardLayout>
      <div className="space-y-6 animate-fade-in">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
              <Shield className="h-6 w-6" />
              Warranty Management
            </h1>
            <p className="text-muted-foreground">Track warranty records and process claims</p>
          </div>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button><Plus className="h-4 w-4 mr-2" /> New Warranty</Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle>Create Warranty Record</DialogTitle>
                <DialogDescription>Add a new warranty for a customer</DialogDescription>
              </DialogHeader>
              {companyId && (
                <WarrantyForm
                  companyId={companyId}
                  mode="direct"
                  showBackButton={false}
                  onSuccess={handleSuccess}
                  onCancel={() => setDialogOpen(false)}
                />
              )}
            </DialogContent>
          </Dialog>
        </div>

        <Tabs defaultValue="warranties" className="space-y-4">
          <TabsList>
            <TabsTrigger value="warranties">Warranties ({warranties?.length || 0})</TabsTrigger>
            <TabsTrigger value="claims">Claims ({claims?.length || 0})</TabsTrigger>
          </TabsList>

          <TabsContent value="warranties" className="space-y-4">
            <div className="relative max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Search..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-9" />
            </div>
            {isLoading ? (
              <div className="space-y-4">{[1, 2, 3].map(i => <Skeleton key={i} className="h-24" />)}</div>
            ) : filteredWarranties?.length === 0 ? (
              <Card><CardContent className="flex flex-col items-center justify-center py-12">
                <Shield className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium">No warranties found</h3>
              </CardContent></Card>
            ) : (
              <div className="grid gap-4">
                {filteredWarranties?.map(w => (
                  <Card key={w.id}><CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <h3 className="font-medium">{w.customer_name}</h3>
                          {getStatusBadge(w.warranty_end_date, w.is_active)}
                        </div>
                        <p className="text-sm text-muted-foreground">{w.equipment_type} {w.equipment_model && `- ${w.equipment_model}`}</p>
                      </div>
                      <div className="text-right text-sm text-muted-foreground">
                        <p>Start: {format(new Date(w.warranty_start_date), 'MMM d, yyyy')}</p>
                        <p>End: {format(new Date(w.warranty_end_date), 'MMM d, yyyy')}</p>
                      </div>
                    </div>
                  </CardContent></Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="claims" className="space-y-4">
            {claims?.length === 0 ? (
              <Card><CardContent className="flex flex-col items-center justify-center py-12">
                <FileText className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium">No warranty claims</h3>
              </CardContent></Card>
            ) : (
              <div className="grid gap-4">
                {claims?.map(c => (
                  <Card key={c.id}><CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="font-medium">{c.warranty_records?.coverage_type} Warranty</h3>
                        <p className="text-sm text-muted-foreground">{c.warranty_records?.customer_name}</p>
                        <p className="text-sm">{c.issue_description}</p>
                      </div>
                      <Badge variant="outline">{c.status}</Badge>
                    </div>
                  </CardContent></Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}
