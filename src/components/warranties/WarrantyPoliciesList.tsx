import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { supabase } from '@/integrations/supabase/client';
import { Plus, Edit, Trash2, Shield, Clock, Wrench, Package } from 'lucide-react';
import { WarrantyPolicyForm } from './WarrantyPolicyForm';
import { toast } from 'sonner';

interface WarrantyPoliciesListProps {
  companyId: string;
}

export function WarrantyPoliciesList({ companyId }: WarrantyPoliciesListProps) {
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingPolicy, setEditingPolicy] = useState<any>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const { data: policies, isLoading } = useQuery({
    queryKey: ['warranty-policies', companyId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('warranty_policies')
        .select('*')
        .eq('company_id', companyId)
        .order('sort_order', { ascending: true });
      if (error) throw error;
      return data || [];
    },
    enabled: !!companyId,
  });

  const handleSuccess = () => {
    setDialogOpen(false);
    setEditingPolicy(null);
    queryClient.invalidateQueries({ queryKey: ['warranty-policies'] });
  };

  const handleEdit = (policy: any) => {
    setEditingPolicy(policy);
    setDialogOpen(true);
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      const { error } = await supabase
        .from('warranty_policies')
        .delete()
        .eq('id', deleteId);
      if (error) throw error;
      toast.success('Warranty policy deleted');
      queryClient.invalidateQueries({ queryKey: ['warranty-policies'] });
    } catch (error: any) {
      toast.error(error.message || 'Failed to delete policy');
    } finally {
      setDeleteId(null);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map(i => <Skeleton key={i} className="h-32" />)}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button onClick={() => { setEditingPolicy(null); setDialogOpen(true); }}>
          <Plus className="h-4 w-4 mr-2" /> Add Warranty Policy
        </Button>
      </div>

      {policies?.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Shield className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium">No warranty policies defined</h3>
            <p className="text-muted-foreground text-sm mt-1">
              Create warranty policies that customers can view
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {policies?.map(policy => (
            <Card key={policy.id} className={!policy.is_active ? 'opacity-60' : ''}>
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Shield className="h-4 w-4" />
                      {policy.name}
                    </CardTitle>
                    <div className="flex gap-2">
                      <Badge variant="outline" className="capitalize">
                        {policy.coverage_type}
                      </Badge>
                      {!policy.is_active && (
                        <Badge variant="secondary">Inactive</Badge>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="icon" onClick={() => handleEdit(policy)}>
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => setDeleteId(policy.id)}>
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {policy.description && (
                  <p className="text-sm text-muted-foreground">{policy.description}</p>
                )}
                
                <div className="flex flex-wrap gap-3 text-sm">
                  <div className="flex items-center gap-1 text-muted-foreground">
                    <Clock className="h-4 w-4" />
                    <span>{policy.duration_months} months</span>
                  </div>
                  {policy.labor_covered && (
                    <div className="flex items-center gap-1 text-green-600">
                      <Wrench className="h-4 w-4" />
                      <span>Labor</span>
                    </div>
                  )}
                  {policy.parts_covered && (
                    <div className="flex items-center gap-1 text-green-600">
                      <Package className="h-4 w-4" />
                      <span>Parts</span>
                    </div>
                  )}
                </div>

                {policy.coverage_details && (
                  <div className="text-sm">
                    <span className="font-medium">Coverage: </span>
                    <span className="text-muted-foreground line-clamp-2">{policy.coverage_details}</span>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingPolicy ? 'Edit Warranty Policy' : 'Create Warranty Policy'}</DialogTitle>
            <DialogDescription>
              Define warranty offerings that customers can view
            </DialogDescription>
          </DialogHeader>
          <WarrantyPolicyForm
            companyId={companyId}
            policy={editingPolicy}
            onSuccess={handleSuccess}
            onCancel={() => setDialogOpen(false)}
          />
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Warranty Policy?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete this warranty policy.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
