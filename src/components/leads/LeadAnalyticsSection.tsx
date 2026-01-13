import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  Legend,
} from 'recharts';
import { subDays, format, startOfDay, eachDayOfInterval } from 'date-fns';
import { 
  TrendingUp, 
  Users, 
  Target, 
  Clock,
  ChevronDown,
  ChevronUp,
  BarChart3
} from 'lucide-react';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';

interface Lead {
  id: string;
  status: string;
  priority: string;
  source: string;
  score: number | null;
  created_at: string;
}

const COLORS = ['hsl(var(--primary))', 'hsl(var(--secondary))', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

export function LeadAnalyticsSection() {
  const { companyId } = useAuth();
  const [isOpen, setIsOpen] = useState(true);
  const [timeRange, setTimeRange] = useState('30');

  const startDate = subDays(new Date(), parseInt(timeRange));

  const { data: leads = [] } = useQuery({
    queryKey: ['leads-analytics', companyId, timeRange],
    queryFn: async () => {
      if (!companyId) return [];
      const { data, error } = await supabase
        .from('leads')
        .select('id, status, priority, source, score, created_at')
        .eq('company_id', companyId)
        .gte('created_at', startDate.toISOString())
        .order('created_at', { ascending: true });
      if (error) throw error;
      return data as Lead[];
    },
    enabled: !!companyId,
  });

  // Calculate metrics
  const totalLeads = leads.length;
  const convertedLeads = leads.filter(l => l.status === 'converted').length;
  const conversionRate = totalLeads > 0 ? Math.round((convertedLeads / totalLeads) * 100) : 0;
  const avgScore = totalLeads > 0 
    ? Math.round(leads.reduce((acc, l) => acc + (l.score || 0), 0) / totalLeads) 
    : 0;
  const hotLeads = leads.filter(l => l.priority === 'hot').length;

  // Funnel data
  const funnelData = [
    { stage: 'New', count: leads.filter(l => l.status === 'new').length },
    { stage: 'Contacted', count: leads.filter(l => l.status === 'contacted').length },
    { stage: 'Qualified', count: leads.filter(l => l.status === 'qualified').length },
    { stage: 'Converted', count: leads.filter(l => l.status === 'converted').length },
  ];

  // Source breakdown
  const sourceData = Object.entries(
    leads.reduce((acc, lead) => {
      acc[lead.source] = (acc[lead.source] || 0) + 1;
      return acc;
    }, {} as Record<string, number>)
  ).map(([name, value]) => ({ name: name.charAt(0).toUpperCase() + name.slice(1), value }));

  // Daily trend
  const days = eachDayOfInterval({ start: startDate, end: new Date() });
  const trendData = days.map(day => {
    const dayStr = format(day, 'yyyy-MM-dd');
    const dayLeads = leads.filter(l => 
      format(new Date(l.created_at), 'yyyy-MM-dd') === dayStr
    );
    return {
      date: format(day, 'MMM d'),
      leads: dayLeads.length,
      converted: dayLeads.filter(l => l.status === 'converted').length,
    };
  });

  // Score distribution
  const scoreRanges = [
    { range: '0-20', min: 0, max: 20 },
    { range: '21-40', min: 21, max: 40 },
    { range: '41-60', min: 41, max: 60 },
    { range: '61-80', min: 61, max: 80 },
    { range: '81-100', min: 81, max: 100 },
  ];
  const scoreData = scoreRanges.map(({ range, min, max }) => ({
    range,
    count: leads.filter(l => (l.score || 0) >= min && (l.score || 0) <= max).length,
  }));

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CollapsibleTrigger asChild>
              <Button variant="ghost" className="p-0 h-auto hover:bg-transparent">
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  Lead Analytics
                  {isOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                </CardTitle>
              </Button>
            </CollapsibleTrigger>
            <Select value={timeRange} onValueChange={setTimeRange}>
              <SelectTrigger className="w-[130px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7">Last 7 days</SelectItem>
                <SelectItem value="30">Last 30 days</SelectItem>
                <SelectItem value="90">Last 90 days</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CollapsibleContent>
          <CardContent className="space-y-6">
            {/* Key Metrics */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="p-4 bg-white/5 rounded-lg border border-white/10">
                <div className="flex items-center gap-2 text-muted-foreground mb-1">
                  <Users className="h-4 w-4" />
                  <span className="text-sm">Total Leads</span>
                </div>
                <p className="text-2xl font-bold">{totalLeads}</p>
              </div>
              <div className="p-4 bg-white/5 rounded-lg border border-white/10">
                <div className="flex items-center gap-2 text-muted-foreground mb-1">
                  <Target className="h-4 w-4" />
                  <span className="text-sm">Conversion Rate</span>
                </div>
                <p className="text-2xl font-bold">{conversionRate}%</p>
              </div>
              <div className="p-4 bg-white/5 rounded-lg border border-white/10">
                <div className="flex items-center gap-2 text-muted-foreground mb-1">
                  <TrendingUp className="h-4 w-4" />
                  <span className="text-sm">Avg Score</span>
                </div>
                <p className="text-2xl font-bold">{avgScore}</p>
              </div>
              <div className="p-4 bg-white/5 rounded-lg border border-white/10">
                <div className="flex items-center gap-2 text-muted-foreground mb-1">
                  <Clock className="h-4 w-4" />
                  <span className="text-sm">Hot Leads</span>
                </div>
                <p className="text-2xl font-bold text-red-400">{hotLeads}</p>
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              {/* Conversion Funnel */}
              <div className="space-y-2">
                <h4 className="text-sm font-medium">Conversion Funnel</h4>
                <div className="h-[200px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={funnelData} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis type="number" stroke="hsl(var(--muted-foreground))" />
                      <YAxis dataKey="stage" type="category" stroke="hsl(var(--muted-foreground))" width={80} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: 'hsl(var(--card))',
                          border: '1px solid hsl(var(--border))',
                          borderRadius: '8px',
                        }}
                      />
                      <Bar dataKey="count" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Source Breakdown */}
              <div className="space-y-2">
                <h4 className="text-sm font-medium">Lead Sources</h4>
                <div className="h-[200px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={sourceData}
                        cx="50%"
                        cy="50%"
                        innerRadius={40}
                        outerRadius={70}
                        paddingAngle={2}
                        dataKey="value"
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                        labelLine={false}
                      >
                        {sourceData.map((_, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{
                          backgroundColor: 'hsl(var(--card))',
                          border: '1px solid hsl(var(--border))',
                          borderRadius: '8px',
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>

            {/* Lead Trend */}
            <div className="space-y-2">
              <h4 className="text-sm font-medium">Lead Trend</h4>
              <div className="h-[200px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={trendData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis 
                      dataKey="date" 
                      stroke="hsl(var(--muted-foreground))"
                      tick={{ fontSize: 12 }}
                      interval="preserveStartEnd"
                    />
                    <YAxis stroke="hsl(var(--muted-foreground))" />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'hsl(var(--card))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px',
                      }}
                    />
                    <Legend />
                    <Line
                      type="monotone"
                      dataKey="leads"
                      name="New Leads"
                      stroke="hsl(var(--primary))"
                      strokeWidth={2}
                      dot={false}
                    />
                    <Line
                      type="monotone"
                      dataKey="converted"
                      name="Converted"
                      stroke="#10b981"
                      strokeWidth={2}
                      dot={false}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Score Distribution */}
            <div className="space-y-2">
              <h4 className="text-sm font-medium">Score Distribution</h4>
              <div className="h-[150px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={scoreData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="range" stroke="hsl(var(--muted-foreground))" />
                    <YAxis stroke="hsl(var(--muted-foreground))" />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'hsl(var(--card))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px',
                      }}
                    />
                    <Bar dataKey="count" fill="hsl(var(--secondary))" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </CardContent>
        </CollapsibleContent>
      </Card>
    </Collapsible>
  );
}
