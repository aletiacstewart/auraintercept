import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { RoleDashboardLayout } from '@/components/dashboard/RoleDashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Package, AlertTriangle, ShoppingCart, BarChart3, Bot, TrendingDown } from 'lucide-react';
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

  const { data: profile, isLoading: profileLoading } = useQuery({
    queryKey: ['profile', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      const { data } = await supabase
        .from('profiles')
        .select('*, companies(*)')
        .eq('id', user.id)
        .maybeSingle();
      return data;
    },
    enabled: !!user?.id,
  });

  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ['inventory-manager-stats', companyId],
    queryFn: async () => {
      if (!companyId) return null;
      
      const [total, items, transactions] = await Promise.all([
        supabase
          .from('inventory_items')
          .select('id', { count: 'exact' })
          .eq('company_id', companyId)
          .eq('is_active', true),
        supabase
          .from('inventory_items')
          .select('id, quantity, min_quantity, unit_cost')
          .eq('company_id', companyId)
          .eq('is_active', true),
        supabase
          .from('inventory_transactions')
          .select('quantity, item_id')
          .eq('company_id', companyId)
          .eq('transaction_type', 'used')
          .gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()),
      ]);
      
      const lowStockCount = items.data?.filter(i => i.quantity <= i.min_quantity).length || 0;
      const totalValue = items.data?.reduce((sum, i) => sum + (i.quantity * (i.unit_cost || 0)), 0) || 0;
      const weeklyUsage = transactions.data?.reduce((sum, t) => sum + Math.abs(t.quantity), 0) || 0;
      
      return {
        totalItems: total.count || 0,
        lowStockItems: lowStockCount,
        totalValue,
        weeklyUsage,
      };
    },
    enabled: !!companyId,
  });

  const isLoading = profileLoading || statsLoading;

  if (authLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Skeleton className="h-32 w-64" />
      </div>
    );
  }

  return (
    <RoleDashboardLayout jobRole="inventory_manager">
      <div className="space-y-8 animate-fade-in">
        {/* Header */}
        <div>
          {isLoading ? (
            <>
              <Skeleton className="h-8 w-48 mb-2" />
              <Skeleton className="h-4 w-64" />
            </>
          ) : (
            <>
              <h1 className="text-3xl font-bold tracking-tight">
                Welcome, {profile?.full_name || 'Inventory Manager'}
              </h1>
              <p className="text-muted-foreground mt-1">
                {profile?.companies?.name || 'Inventory Dashboard'}
              </p>
            </>
          )}
        </div>

        {/* Quick Stats */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
          <Card className="border-border/50">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Items
              </CardTitle>
              <Package className="w-5 h-5 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{stats?.totalItems ?? 0}</div>
              <p className="text-xs text-muted-foreground mt-1">Active items</p>
            </CardContent>
          </Card>

          <Card className="border-border/50">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Low Stock
              </CardTitle>
              <AlertTriangle className="w-5 h-5 text-orange-500" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-orange-600">{stats?.lowStockItems ?? 0}</div>
              <p className="text-xs text-muted-foreground mt-1">Need reorder</p>
            </CardContent>
          </Card>

          <Card className="border-border/50">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Value
              </CardTitle>
              <ShoppingCart className="w-5 h-5 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-green-600">${stats?.totalValue?.toLocaleString() ?? 0}</div>
              <p className="text-xs text-muted-foreground mt-1">Inventory value</p>
            </CardContent>
          </Card>

          <Card className="border-border/50">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Weekly Usage
              </CardTitle>
              <TrendingDown className="w-5 h-5 text-secondary" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{stats?.weeklyUsage ?? 0}</div>
              <p className="text-xs text-muted-foreground mt-1">Parts used</p>
            </CardContent>
          </Card>

          <Card className="border-border/50">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Inventory
              </CardTitle>
              <Package className="w-5 h-5 text-accent" />
            </CardHeader>
            <CardContent>
              <Button size="sm" className="w-full" onClick={() => navigate('/dashboard/inventory')}>
                Manage
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Inventory AI Console Card */}
        <Card className="border-border/50">
          <CardHeader>
            <CardTitle>Inventory AI Console</CardTitle>
            <p className="text-sm text-muted-foreground">Use AI to check stock levels, manage reorders, and track usage</p>
          </CardHeader>
          <CardContent>
            <Button onClick={() => navigate('/dashboard/ai-agent')}>
              Open AI Console
            </Button>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <div className="grid gap-4 md:grid-cols-5">
          <Button
            variant="outline"
            className="h-auto py-6 flex flex-col items-center gap-2"
            onClick={() => navigate('/dashboard/ai-agent')}
          >
            <Bot className="w-6 h-6 text-primary" />
            <span>AI Console</span>
          </Button>
          <Button
            variant="outline"
            className="h-auto py-6 flex flex-col items-center gap-2"
            onClick={() => navigate('/dashboard/inventory')}
          >
            <Package className="w-6 h-6 text-secondary" />
            <span>Inventory</span>
          </Button>
          <Button
            variant="outline"
            className="h-auto py-6 flex flex-col items-center gap-2"
            onClick={() => navigate('/dashboard/analytics')}
          >
            <BarChart3 className="w-6 h-6 text-accent" />
            <span>Reports</span>
          </Button>
          <Button
            variant="outline"
            className="h-auto py-6 flex flex-col items-center gap-2"
            onClick={() => navigate('/dashboard/ai-agents')}
          >
            <ShoppingCart className="w-6 h-6 text-primary" />
            <span>AI Agents Hub</span>
          </Button>
          <Button
            variant="outline"
            className="h-auto py-6 flex flex-col items-center gap-2"
            onClick={() => navigate('/dashboard/settings')}
          >
            <AlertTriangle className="w-6 h-6 text-secondary" />
            <span>Settings</span>
          </Button>
        </div>
      </div>
    </RoleDashboardLayout>
  );
}