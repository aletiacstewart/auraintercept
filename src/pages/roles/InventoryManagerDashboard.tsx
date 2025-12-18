import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { RoleDashboardLayout } from '@/components/dashboard/RoleDashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Package, AlertTriangle, ShoppingCart, BarChart3 } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export default function InventoryManagerDashboard() {
  const { user, loading: authLoading, companyId } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth');
    }
  }, [user, authLoading, navigate]);

  const { data: stats } = useQuery({
    queryKey: ['inventory-manager-stats', companyId],
    queryFn: async () => {
      if (!companyId) return null;
      
      const [total, lowStock] = await Promise.all([
        supabase
          .from('inventory_items')
          .select('id', { count: 'exact' })
          .eq('company_id', companyId)
          .eq('is_active', true),
        supabase
          .from('inventory_items')
          .select('id, quantity, min_quantity')
          .eq('company_id', companyId)
          .eq('is_active', true),
      ]);
      
      const lowStockCount = lowStock.data?.filter(i => i.quantity <= i.min_quantity).length || 0;
      
      return {
        totalItems: total.count || 0,
        lowStockItems: lowStockCount,
      };
    },
    enabled: !!companyId,
  });

  if (authLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Skeleton className="h-32 w-64" />
      </div>
    );
  }

  return (
    <RoleDashboardLayout jobRole="inventory_manager">
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Inventory Manager Dashboard</h1>
          <p className="text-muted-foreground">Manage stock levels and orders</p>
        </div>

        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Total Items</CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.totalItems || 0}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Low Stock</CardTitle>
              <AlertTriangle className="h-4 w-4 text-orange-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-500">{stats?.lowStockItems || 0}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Inventory</CardTitle>
              <ShoppingCart className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <Button size="sm" className="w-full" onClick={() => navigate('/dashboard/inventory')}>
                Manage
              </Button>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Reports</CardTitle>
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <Button size="sm" className="w-full" onClick={() => navigate('/dashboard/analytics')}>
                View
              </Button>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Inventory AI Console</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-4">Use AI to check stock levels, manage reorders, and track usage.</p>
            <Button onClick={() => navigate('/dashboard/ai-agent')}>
              Open AI Console
            </Button>
          </CardContent>
        </Card>
      </div>
    </RoleDashboardLayout>
  );
}
