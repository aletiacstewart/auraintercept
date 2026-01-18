import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { X, Download, FileSpreadsheet, Calendar, Mail, Loader2 } from 'lucide-react';
import { format, subDays, startOfMonth, endOfMonth } from 'date-fns';

interface ExportReportFormProps {
  companyId: string;
  onCancel: () => void;
  onExport?: (data: { type: string; count: number }) => void;
}

export const ExportReportForm: React.FC<ExportReportFormProps> = ({ companyId, onCancel, onExport }) => {
  const [reportType, setReportType] = useState('appointments');
  const [dateRange, setDateRange] = useState('30');
  const [exportFormat, setExportFormat] = useState('csv');
  const [emailTo, setEmailTo] = useState('');
  const [isExporting, setIsExporting] = useState(false);
  
  const [includeFields, setIncludeFields] = useState({
    customerInfo: true,
    serviceDetails: true,
    financials: true,
    status: true,
  });

  const getDateRange = () => {
    const days = parseInt(dateRange);
    const endDate = new Date();
    const startDate = subDays(endDate, days);
    return { startDate, endDate };
  };

  const { startDate, endDate } = getDateRange();

  // Fetch record count for preview
  const { data: recordCount, isLoading } = useQuery({
    queryKey: ['export-preview', companyId, reportType, dateRange],
    queryFn: async () => {
      let count = 0;
      
      if (reportType === 'appointments') {
        const { count: c } = await supabase
          .from('appointments')
          .select('*', { count: 'exact', head: true })
          .eq('company_id', companyId)
          .gte('datetime', startDate.toISOString())
          .lte('datetime', endDate.toISOString());
        count = c || 0;
      } else if (reportType === 'invoices') {
        const { count: c } = await supabase
          .from('invoices')
          .select('*', { count: 'exact', head: true })
          .eq('company_id', companyId)
          .gte('created_at', startDate.toISOString())
          .lte('created_at', endDate.toISOString());
        count = c || 0;
      } else if (reportType === 'jobs') {
        const { count: c } = await supabase
          .from('job_assignments')
          .select('*', { count: 'exact', head: true })
          .eq('company_id', companyId)
          .gte('created_at', startDate.toISOString())
          .lte('created_at', endDate.toISOString());
        count = c || 0;
      } else if (reportType === 'customers') {
        const { data } = await supabase
          .from('appointments')
          .select('customer_email, customer_phone')
          .eq('company_id', companyId);
        const uniqueCustomers = new Set(data?.map(d => d.customer_email || d.customer_phone).filter(Boolean));
        count = uniqueCustomers.size;
      }

      return count;
    },
  });

  const handleExport = async () => {
    setIsExporting(true);
    
    try {
      let data: any[] = [];
      
      if (reportType === 'appointments') {
        const { data: appointments } = await supabase
          .from('appointments')
          .select('*')
          .eq('company_id', companyId)
          .gte('datetime', startDate.toISOString())
          .lte('datetime', endDate.toISOString())
          .order('datetime', { ascending: false });
        data = appointments || [];
      } else if (reportType === 'invoices') {
        const { data: invoices } = await supabase
          .from('invoices')
          .select('*')
          .eq('company_id', companyId)
          .gte('created_at', startDate.toISOString())
          .lte('created_at', endDate.toISOString())
          .order('created_at', { ascending: false });
        data = invoices || [];
      } else if (reportType === 'jobs') {
        const { data: jobs } = await supabase
          .from('job_assignments')
          .select('*, appointments(customer_name, customer_email, customer_phone, service_type)')
          .eq('company_id', companyId)
          .gte('created_at', startDate.toISOString())
          .lte('created_at', endDate.toISOString())
          .order('created_at', { ascending: false });
        data = jobs || [];
      }

      if (data.length === 0) {
        toast.error('No data to export');
        return;
      }

      // Convert to CSV
      if (exportFormat === 'csv') {
        const headers = Object.keys(data[0]).filter(k => k !== 'company_id');
        const csvContent = [
          headers.join(','),
          ...data.map(row => 
            headers.map(h => {
              const val = row[h];
              if (val === null || val === undefined) return '';
              if (typeof val === 'object') return JSON.stringify(val).replace(/"/g, '""');
              return `"${String(val).replace(/"/g, '""')}"`;
            }).join(',')
          )
        ].join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${reportType}_report_${format(new Date(), 'yyyy-MM-dd')}.csv`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        toast.success(`Exported ${data.length} records to CSV`);
      } else {
        toast.info('JSON export coming soon!');
      }
    } catch (error) {
      console.error('Export error:', error);
      toast.error('Failed to export report');
    } finally {
      setIsExporting(false);
    }
  };

  const reportTypeLabels = {
    appointments: 'Appointments',
    invoices: 'Invoices',
    jobs: 'Job Assignments',
    customers: 'Customer List',
  };

  return (
    <Card className="border-border bg-card shadow-sm">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2 text-foreground">
            <Download className="h-5 w-5 text-primary" />
            Export Report
          </CardTitle>
          <Button variant="ghost" size="icon" onClick={onCancel} className="text-card-foreground hover:text-secondary hover:bg-secondary/10">
            <X className="h-5 w-5" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4 bg-muted/50 rounded-b-lg">
        {/* Report Type */}
        <div className="space-y-2">
          <Label className="text-foreground/70">Report Type</Label>
          <Select value={reportType} onValueChange={setReportType}>
            <SelectTrigger className="bg-sidebar-background text-sidebar-foreground border-sidebar-border">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="appointments">Appointments</SelectItem>
              <SelectItem value="invoices">Invoices</SelectItem>
              <SelectItem value="jobs">Job Assignments</SelectItem>
              <SelectItem value="customers">Customer List</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Date Range */}
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-2">
            <Label className="flex items-center gap-1 text-foreground/70">
              <Calendar className="h-3 w-3" />
              Date Range
            </Label>
            <Select value={dateRange} onValueChange={setDateRange}>
              <SelectTrigger className="bg-sidebar-background text-sidebar-foreground border-sidebar-border">
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
            <Label className="flex items-center gap-1 text-foreground/70">
              <FileSpreadsheet className="h-3 w-3" />
              Format
            </Label>
            <Select value={exportFormat} onValueChange={setExportFormat}>
              <SelectTrigger className="bg-sidebar-background text-sidebar-foreground border-sidebar-border">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="csv">CSV</SelectItem>
                <SelectItem value="json">JSON</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Include Fields */}
        <div className="space-y-3 p-3 rounded-lg bg-muted/50 border border-border">
          <h4 className="font-medium text-sm text-foreground">Include Fields</h4>
          <div className="grid grid-cols-2 gap-3">
            <div className="flex items-center gap-2">
              <Checkbox
                id="customerInfo"
                checked={includeFields.customerInfo}
                onCheckedChange={(checked) => setIncludeFields(prev => ({ ...prev, customerInfo: !!checked }))}
              />
              <Label htmlFor="customerInfo" className="text-sm cursor-pointer text-foreground/70">Customer Info</Label>
            </div>
            <div className="flex items-center gap-2">
              <Checkbox
                id="serviceDetails"
                checked={includeFields.serviceDetails}
                onCheckedChange={(checked) => setIncludeFields(prev => ({ ...prev, serviceDetails: !!checked }))}
              />
              <Label htmlFor="serviceDetails" className="text-sm cursor-pointer text-foreground/70">Service Details</Label>
            </div>
            <div className="flex items-center gap-2">
              <Checkbox
                id="financials"
                checked={includeFields.financials}
                onCheckedChange={(checked) => setIncludeFields(prev => ({ ...prev, financials: !!checked }))}
              />
              <Label htmlFor="financials" className="text-sm cursor-pointer text-foreground/70">Financials</Label>
            </div>
            <div className="flex items-center gap-2">
              <Checkbox
                id="status"
                checked={includeFields.status}
                onCheckedChange={(checked) => setIncludeFields(prev => ({ ...prev, status: !!checked }))}
              />
              <Label htmlFor="status" className="text-sm cursor-pointer text-foreground/70">Status</Label>
            </div>
          </div>
        </div>

        {/* Preview */}
        <div className="p-3 rounded-lg bg-muted/50 border border-border flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-foreground">Records to Export</p>
            <p className="text-xs text-foreground/50">
              {format(startDate, 'MMM d')} - {format(endDate, 'MMM d, yyyy')}
            </p>
          </div>
          <div className="text-right">
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <p className="text-2xl font-bold">{recordCount?.toLocaleString() || 0}</p>
            )}
          </div>
        </div>

        {/* Email Option */}
        <div className="space-y-2">
          <Label className="flex items-center gap-1 text-foreground/70">
            <Mail className="h-3 w-3" />
            Email Report To (optional)
          </Label>
          <Input
            type="email"
            placeholder="email@example.com"
            value={emailTo}
            onChange={(e) => setEmailTo(e.target.value)}
            className="bg-sidebar-background text-sidebar-foreground border-sidebar-border placeholder:text-muted-foreground"
          />
        </div>

        {/* Actions */}
        <div className="flex gap-2 pt-2">
          <Button 
            className="flex-1" 
            onClick={handleExport}
            disabled={isExporting || recordCount === 0}
          >
            {isExporting ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Download className="h-4 w-4 mr-2" />
            )}
            {isExporting ? 'Exporting...' : 'Export Report'}
          </Button>
          <Button variant="outline" onClick={onCancel}>
            Cancel
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
