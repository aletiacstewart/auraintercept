import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { toast } from 'sonner';
import { X, Users, UserPlus, UserMinus, Star, TrendingUp, Calendar } from 'lucide-react';
import { format, subDays, subMonths } from 'date-fns';

interface CustomerInsightsFormProps {
  companyId: string;
  onCancel: () => void;
  onAnalyze?: (data: Record<string, unknown>) => void;
}

export const CustomerInsightsForm: React.FC<CustomerInsightsFormProps> = ({ companyId, onCancel, onAnalyze }) => {
  const [dateRange, setDateRange] = useState('90');

  const getDateRange = () => {
    const days = parseInt(dateRange);
    const endDate = new Date();
    const startDate = subDays(endDate, days);
    return { startDate, endDate };
  };

  const { startDate, endDate } = getDateRange();

  // Fetch customer insights
  const { data: insights, isLoading } = useQuery({
    queryKey: ['customer-insights', companyId, dateRange],
    queryFn: async () => {
      // Get all appointments with customer info
      const { data: appointments } = await supabase
        .from('appointments')
        .select('customer_email, customer_phone, customer_name, datetime, status')
        .eq('company_id', companyId)
        .order('datetime', { ascending: false });

      // Unique customers (by email or phone)
      const customerMap = new Map();
      const newCustomerMap = new Map();
      const returningCustomerMap = new Map();

      appointments?.forEach(apt => {
        const key = apt.customer_email || apt.customer_phone || apt.customer_name;
        if (!key) return;

        if (!customerMap.has(key)) {
          customerMap.set(key, { name: apt.customer_name, firstVisit: apt.datetime, visits: 1 });
        } else {
          const existing = customerMap.get(key);
          existing.visits += 1;
          if (new Date(apt.datetime) < new Date(existing.firstVisit)) {
            existing.firstVisit = apt.datetime;
          }
        }
      });

      // Categorize by date range
      customerMap.forEach((value, key) => {
        const firstVisit = new Date(value.firstVisit);
        if (firstVisit >= startDate && firstVisit <= endDate) {
          newCustomerMap.set(key, value);
        }
        if (value.visits > 1) {
          returningCustomerMap.set(key, value);
        }
      });

      // Calculate inactive customers (no visits in period)
      const activeInPeriod = new Set();
      appointments?.forEach(apt => {
        const aptDate = new Date(apt.datetime);
        if (aptDate >= startDate && aptDate <= endDate) {
          const key = apt.customer_email || apt.customer_phone || apt.customer_name;
          if (key) activeInPeriod.add(key);
        }
      });
      
      const inactiveCount = customerMap.size - activeInPeriod.size;

      // Get feedback stats
      const { data: feedback } = await supabase
        .from('customer_feedback')
        .select('rating')
        .eq('company_id', companyId)
        .gte('created_at', startDate.toISOString());

      const avgRating = feedback && feedback.length > 0
        ? feedback.reduce((sum, f) => sum + (f.rating || 0), 0) / feedback.length
        : 0;

      const positiveRatings = feedback?.filter(f => (f.rating || 0) >= 4).length || 0;
      const satisfactionRate = feedback && feedback.length > 0
        ? (positiveRatings / feedback.length) * 100
        : 0;

      return {
        totalCustomers: customerMap.size,
        newCustomers: newCustomerMap.size,
        returningCustomers: returningCustomerMap.size,
        inactiveCustomers: inactiveCount > 0 ? inactiveCount : 0,
        avgRating,
        satisfactionRate,
        reviewCount: feedback?.length || 0,
        retentionRate: customerMap.size > 0 ? (returningCustomerMap.size / customerMap.size) * 100 : 0,
      };
    },
  });

  return (
    <Card className="border-border bg-card">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2 text-foreground">
            <Users className="h-5 w-5 text-primary" />
            Customer Insights
          </CardTitle>
          <Button variant="ghost" size="icon" onClick={onCancel} className="text-foreground/70 hover:text-foreground">
            <X className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4 bg-muted/50 rounded-b-lg">
        {/* Filters */}
        <div className="space-y-2">
          <Label className="flex items-center gap-1 text-foreground/70">
            <Calendar className="h-3 w-3" />
            Analysis Period
          </Label>
          <Select value={dateRange} onValueChange={setDateRange}>
            <SelectTrigger className="bg-white text-slate-900 border-border">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="30">Last 30 days</SelectItem>
              <SelectItem value="90">Last 90 days</SelectItem>
              <SelectItem value="180">Last 6 months</SelectItem>
              <SelectItem value="365">Last year</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Metrics */}
        {isLoading ? (
          <div className="grid grid-cols-2 gap-3">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="p-4 rounded-lg bg-white/5 animate-pulse h-20" />
            ))}
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 gap-3">
              <div className="p-4 rounded-lg bg-muted/50 border border-border">
                <div className="flex items-center gap-2 text-foreground/70 mb-1">
                  <Users className="h-4 w-4" />
                  <span className="text-sm">Total Customers</span>
                </div>
                <p className="text-2xl font-bold text-foreground">{insights?.totalCustomers || 0}</p>
              </div>

              <div className="p-4 rounded-lg bg-muted/50 border border-border">
                <div className="flex items-center gap-2 text-foreground/70 mb-1">
                  <UserPlus className="h-4 w-4 text-green-500" />
                  <span className="text-sm">New Customers</span>
                </div>
                <p className="text-2xl font-bold text-green-600">{insights?.newCustomers || 0}</p>
              </div>

              <div className="p-4 rounded-lg bg-muted/50 border border-border">
                <div className="flex items-center gap-2 text-foreground/70 mb-1">
                  <TrendingUp className="h-4 w-4 text-blue-500" />
                  <span className="text-sm">Returning</span>
                </div>
                <p className="text-2xl font-bold text-blue-600">{insights?.returningCustomers || 0}</p>
              </div>

              <div className="p-4 rounded-lg bg-muted/50 border border-border">
                <div className="flex items-center gap-2 text-foreground/70 mb-1">
                  <UserMinus className="h-4 w-4 text-orange-500" />
                  <span className="text-sm">Inactive</span>
                </div>
                <p className="text-2xl font-bold text-orange-600">{insights?.inactiveCustomers || 0}</p>
              </div>
            </div>

            {/* Retention & Satisfaction */}
            <div className="space-y-3 p-4 rounded-lg bg-muted/50 border border-border">
              <h4 className="font-medium text-sm text-foreground">Customer Health</h4>
              
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm text-foreground">
                  <span>Retention Rate</span>
                  <span className="font-medium">{(insights?.retentionRate || 0).toFixed(1)}%</span>
                </div>
                <Progress value={insights?.retentionRate || 0} className="h-2" />
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm text-foreground">
                  <span className="flex items-center gap-1">
                    <Star className="h-4 w-4 text-yellow-500" />
                    Satisfaction Rate
                  </span>
                  <span className="font-medium">{(insights?.satisfactionRate || 0).toFixed(1)}%</span>
                </div>
                <Progress value={insights?.satisfactionRate || 0} className="h-2" />
              </div>

              <div className="flex items-center justify-between text-sm pt-2 border-t border-border text-foreground">
                <span>Average Rating</span>
                <Badge variant="outline" className="flex items-center gap-1 border-border">
                  <Star className="h-3 w-3 text-yellow-500 fill-yellow-500" />
                  {(insights?.avgRating || 0).toFixed(1)} / 5
                </Badge>
              </div>
            </div>
          </>
        )}

        {/* Actions */}
        <div className="flex gap-2 pt-2">
          <Button variant="outline" className="flex-1" onClick={() => toast.info('Customer list coming soon!')}>
            View Customers
          </Button>
          <Button variant="outline" onClick={onCancel}>
            Close
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
