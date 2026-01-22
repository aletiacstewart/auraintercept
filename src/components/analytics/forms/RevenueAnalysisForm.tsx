import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { toast } from 'sonner';
import { DollarSign, TrendingUp, CreditCard, Receipt, Calendar } from 'lucide-react';
import { subDays } from 'date-fns';

interface RevenueAnalysisFormProps {
  companyId: string;
  onCancel: () => void;
  onAnalyze?: (data: Record<string, unknown>) => void;
}

export const RevenueAnalysisForm: React.FC<RevenueAnalysisFormProps> = ({ companyId, onCancel, onAnalyze }) => {
  const [dateRange, setDateRange] = useState('30');
  const [groupBy, setGroupBy] = useState('service');

  const getDateRange = () => {
    const days = parseInt(dateRange);
    const endDate = new Date();
    const startDate = subDays(endDate, days);
    return { startDate, endDate };
  };

  const { startDate, endDate } = getDateRange();

  // Fetch revenue data
  const { data: revenueData, isLoading } = useQuery({
    queryKey: ['revenue-analysis', companyId, dateRange, groupBy],
    queryFn: async () => {
      // Get all paid invoices with line items
      const { data: invoices } = await supabase
        .from('invoices')
        .select(`
          id,
          total,
          subtotal,
          tax_amount,
          status,
          created_at,
          paid_at,
          invoice_line_items (
            description,
            quantity,
            unit_price,
            total
          )
        `)
        .eq('company_id', companyId)
        .eq('status', 'paid')
        .gte('created_at', startDate.toISOString())
        .lte('created_at', endDate.toISOString());

      const totalRevenue = invoices?.reduce((sum, inv) => sum + (inv.total || 0), 0) || 0;
      const totalTax = invoices?.reduce((sum, inv) => sum + (inv.tax_amount || 0), 0) || 0;
      const invoiceCount = invoices?.length || 0;
      const avgInvoice = invoiceCount > 0 ? totalRevenue / invoiceCount : 0;

      // Group by service/description
      const byService: Record<string, number> = {};
      invoices?.forEach(inv => {
        inv.invoice_line_items?.forEach(item => {
          const key = item.description || 'Other';
          byService[key] = (byService[key] || 0) + (item.total || 0);
        });
      });

      // Sort by revenue
      const serviceBreakdown = Object.entries(byService)
        .map(([service, revenue]) => ({ service, revenue, percentage: totalRevenue > 0 ? (revenue / totalRevenue) * 100 : 0 }))
        .sort((a, b) => b.revenue - a.revenue)
        .slice(0, 5);

      return {
        totalRevenue,
        totalTax,
        invoiceCount,
        avgInvoice,
        serviceBreakdown,
      };
    },
  });

  // Fetch pending revenue
  const { data: pendingData } = useQuery({
    queryKey: ['pending-revenue', companyId],
    queryFn: async () => {
      const { data } = await supabase
        .from('invoices')
        .select('total')
        .eq('company_id', companyId)
        .in('status', ['pending', 'sent']);
      
      return data?.reduce((sum, inv) => sum + (inv.total || 0), 0) || 0;
    },
  });

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-2">
          <Label className="flex items-center gap-1 text-sm font-medium text-muted-foreground">
            <Calendar className="h-3 w-3" />
            Date Range
          </Label>
          <Select value={dateRange} onValueChange={setDateRange}>
            <SelectTrigger className="h-9 text-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7">Last 7 days</SelectItem>
              <SelectItem value="30">Last 30 days</SelectItem>
              <SelectItem value="90">Last 90 days</SelectItem>
              <SelectItem value="365">Last year</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label className="text-sm font-medium text-muted-foreground">Group By</Label>
          <Select value={groupBy} onValueChange={setGroupBy}>
            <SelectTrigger className="h-9 text-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="service">Service Type</SelectItem>
              <SelectItem value="month">Month</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Summary Cards */}
      {isLoading ? (
        <div className="grid grid-cols-2 gap-3">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="p-4 rounded-lg bg-muted animate-pulse h-20" />
          ))}
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-3">
            <div className="p-4 rounded-lg bg-muted/50 border border-border">
              <div className="flex items-center gap-2 text-muted-foreground mb-1">
                <TrendingUp className="h-4 w-4" />
                <span className="text-sm">Total Revenue</span>
              </div>
              <p className="text-2xl font-bold text-secondary">
                ${(revenueData?.totalRevenue || 0).toLocaleString()}
              </p>
            </div>

            <div className="p-4 rounded-lg bg-muted/50 border border-border">
              <div className="flex items-center gap-2 text-muted-foreground mb-1">
                <CreditCard className="h-4 w-4" />
                <span className="text-sm">Pending</span>
              </div>
              <p className="text-2xl font-bold text-warning">
                ${(pendingData || 0).toLocaleString()}
              </p>
            </div>

            <div className="p-4 rounded-lg bg-muted/50 border border-border">
              <div className="flex items-center gap-2 text-muted-foreground mb-1">
                <Receipt className="h-4 w-4" />
                <span className="text-sm">Invoices Paid</span>
              </div>
              <p className="text-2xl font-bold text-foreground">{revenueData?.invoiceCount || 0}</p>
            </div>

            <div className="p-4 rounded-lg bg-muted/50 border border-border">
              <div className="flex items-center gap-2 text-muted-foreground mb-1">
                <DollarSign className="h-4 w-4" />
                <span className="text-sm">Avg Invoice</span>
              </div>
              <p className="text-2xl font-bold text-foreground">
                ${(revenueData?.avgInvoice || 0).toFixed(0)}
              </p>
            </div>
          </div>

          {/* Revenue by Service */}
          {revenueData?.serviceBreakdown && revenueData.serviceBreakdown.length > 0 && (
            <div className="space-y-3 p-4 rounded-lg bg-muted/50 border border-border">
              <h4 className="font-medium text-sm text-foreground">Top Revenue Sources</h4>
              <div className="space-y-3">
                {revenueData.serviceBreakdown.map((item, idx) => (
                  <div key={idx} className="space-y-1">
                    <div className="flex items-center justify-between text-sm text-foreground">
                      <span className="truncate max-w-[60%]">{item.service}</span>
                      <span className="font-medium">${item.revenue.toLocaleString()}</span>
                    </div>
                    <Progress value={item.percentage} className="h-2" />
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {/* Actions */}
      <div className="flex justify-end pt-2">
        <Button variant="outline" onClick={onCancel}>
          Close
        </Button>
      </div>
    </div>
  );
};
