import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from 'sonner';
import { X, Download, FileSpreadsheet, Calendar, Loader2, FileText } from 'lucide-react';
import { format, subDays } from 'date-fns';
import jsPDF from 'jspdf';
import { useIndustryPack } from '@/hooks/useIndustryPack';
import {
  getIndustryReportTemplate,
  getSectionLabel,
  type ReportSectionId,
} from '@/lib/industryReportTemplates';

interface ExportReportFormProps {
  companyId: string;
  onCancel: () => void;
  onExport?: (data: { type: string; count: number }) => void;
}

// Report type ids — labels are resolved per-industry below.
const REPORT_TYPE_IDS: ReportSectionId[] = [
  'appointments', 'invoices', 'jobs', 'customers',
  'revenue', 'feedback', 'reminders', 'social',
];

// Field options organized by category
const FIELD_OPTIONS = {
  customerInfo: { label: 'Customer Info', fields: ['name', 'email', 'phone', 'address'] },
  serviceDetails: { label: 'Service Details', fields: ['service_type', 'duration', 'notes'] },
  financials: { label: 'Financials', fields: ['total', 'subtotal', 'tax', 'payment_status'] },
  status: { label: 'Status & Dates', fields: ['status', 'created_at', 'updated_at', 'completed_at'] },
  analytics: { label: 'Analytics', fields: ['rating', 'sentiment', 'response_time'] },
  marketing: { label: 'Marketing', fields: ['source', 'channel', 'campaign'] },
};

export const ExportReportForm: React.FC<ExportReportFormProps> = ({ companyId, onCancel, onExport }) => {
  const { pack } = useIndustryPack(companyId);
  const reportTemplate = getIndustryReportTemplate(pack);
  const REPORT_TYPES = REPORT_TYPE_IDS.map((id) => ({
    id,
    label: getSectionLabel(pack, id),
  }));
  const [selectedReports, setSelectedReports] = useState<string[]>(['appointments']);
  const [dateRange, setDateRange] = useState('30');
  const [exportFormat, setExportFormat] = useState('csv');
  const [isExporting, setIsExporting] = useState(false);
  
  const [includeFields, setIncludeFields] = useState({
    customerInfo: true,
    serviceDetails: true,
    financials: true,
    status: true,
    analytics: false,
    marketing: false,
  });

  const getDateRange = () => {
    const days = parseInt(dateRange);
    const endDate = new Date();
    const startDate = subDays(endDate, days);
    return { startDate, endDate };
  };

  const { startDate, endDate } = getDateRange();

  // Fetch record counts for preview
  const { data: recordCounts, isLoading } = useQuery({
    queryKey: ['export-preview', companyId, selectedReports, dateRange],
    queryFn: async () => {
      const counts: Record<string, number> = {};
      
      for (const reportType of selectedReports) {
        if (reportType === 'appointments') {
          const { count } = await supabase
            .from('appointments')
            .select('*', { count: 'exact', head: true })
            .eq('company_id', companyId)
            .gte('datetime', startDate.toISOString())
            .lte('datetime', endDate.toISOString());
          counts.appointments = count || 0;
        } else if (reportType === 'invoices') {
          const { count } = await supabase
            .from('invoices')
            .select('*', { count: 'exact', head: true })
            .eq('company_id', companyId)
            .gte('created_at', startDate.toISOString())
            .lte('created_at', endDate.toISOString());
          counts.invoices = count || 0;
        } else if (reportType === 'jobs') {
          const { count } = await supabase
            .from('job_assignments')
            .select('*', { count: 'exact', head: true })
            .eq('company_id', companyId)
            .gte('created_at', startDate.toISOString())
            .lte('created_at', endDate.toISOString());
          counts.jobs = count || 0;
        } else if (reportType === 'customers') {
          const { count } = await supabase
            .from('customer_profiles')
            .select('*', { count: 'exact', head: true })
            .eq('company_id', companyId);
          counts.customers = count || 0;
        } else if (reportType === 'revenue') {
          const { count } = await supabase
            .from('invoices')
            .select('*', { count: 'exact', head: true })
            .eq('company_id', companyId)
            .eq('status', 'paid')
            .gte('created_at', startDate.toISOString())
            .lte('created_at', endDate.toISOString());
          counts.revenue = count || 0;
        } else if (reportType === 'feedback') {
          const { count } = await supabase
            .from('customer_feedback')
            .select('*', { count: 'exact', head: true })
            .eq('company_id', companyId)
            .gte('created_at', startDate.toISOString())
            .lte('created_at', endDate.toISOString());
          counts.feedback = count || 0;
        } else if (reportType === 'reminders') {
          // Count reminder-related records from appointments
          const { count } = await supabase
            .from('appointments')
            .select('*', { count: 'exact', head: true })
            .eq('company_id', companyId)
            .or('reminder_24h_sent.eq.true,reminder_1h_sent.eq.true')
            .gte('datetime', startDate.toISOString())
            .lte('datetime', endDate.toISOString());
          counts.reminders = count || 0;
        } else if (reportType === 'social') {
          const { count } = await supabase
            .from('social_content_drafts')
            .select('*', { count: 'exact', head: true })
            .eq('company_id', companyId)
            .gte('created_at', startDate.toISOString())
            .lte('created_at', endDate.toISOString());
          counts.social = count || 0;
        }
      }

      return counts;
    },
  });

  const totalRecords = Object.values(recordCounts || {}).reduce((sum, count) => sum + count, 0);

  const handleReportToggle = (reportId: string) => {
    setSelectedReports(prev => 
      prev.includes(reportId)
        ? prev.filter(id => id !== reportId)
        : [...prev, reportId]
    );
  };

  const fetchReportData = async (reportType: string) => {
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
    } else if (reportType === 'customers') {
      const { data: customers } = await supabase
        .from('customer_profiles')
        .select('*')
        .eq('company_id', companyId)
        .order('created_at', { ascending: false });
      data = customers || [];
    } else if (reportType === 'revenue') {
      const { data: invoices } = await supabase
        .from('invoices')
        .select('*')
        .eq('company_id', companyId)
        .eq('status', 'paid')
        .gte('created_at', startDate.toISOString())
        .lte('created_at', endDate.toISOString())
        .order('created_at', { ascending: false });
      data = invoices || [];
    } else if (reportType === 'feedback') {
      const { data: feedback } = await supabase
        .from('customer_feedback')
        .select('*')
        .eq('company_id', companyId)
        .gte('created_at', startDate.toISOString())
        .lte('created_at', endDate.toISOString())
        .order('created_at', { ascending: false });
      data = feedback || [];
      } else if (reportType === 'reminders') {
        // Get appointments with reminder data
        const { data: reminderData } = await supabase
          .from('appointments')
          .select('id, customer_name, customer_email, datetime, reminder_24h_sent, reminder_24h_sent_at, reminder_1h_sent, reminder_1h_sent_at')
          .eq('company_id', companyId)
          .or('reminder_24h_sent.eq.true,reminder_1h_sent.eq.true')
          .gte('datetime', startDate.toISOString())
          .lte('datetime', endDate.toISOString())
          .order('datetime', { ascending: false });
        data = reminderData || [];
    } else if (reportType === 'social') {
      const { data: social } = await supabase
        .from('social_content_drafts')
        .select('*')
        .eq('company_id', companyId)
        .gte('created_at', startDate.toISOString())
        .lte('created_at', endDate.toISOString())
        .order('created_at', { ascending: false });
      data = social || [];
    }
    
    return data;
  };

  const convertToCSV = (data: any[], reportType: string) => {
    if (data.length === 0) return '';
    
    const headers = Object.keys(data[0]).filter(k => k !== 'company_id');
    const csvContent = [
      headers.join(','),
      ...data.map(row => 
        headers.map(h => {
          const val = row[h];
          if (val === null || val === undefined) return '';
          if (typeof val === 'object') return `"${JSON.stringify(val).replace(/"/g, '""')}"`;
          return `"${String(val).replace(/"/g, '""')}"`;
        }).join(',')
      )
    ].join('\n');
    
    return csvContent;
  };

  const generatePDF = (allData: Record<string, any[]>) => {
    const doc = new jsPDF();
    let yPosition = 20;
    
    doc.setFontSize(18);
    doc.text(reportTemplate.reportTitle, 20, yPosition);
    yPosition += 10;
    
    doc.setFontSize(10);
    doc.text(`Generated: ${format(new Date(), 'MMM d, yyyy HH:mm')}`, 20, yPosition);
    doc.text(`Period: ${format(startDate, 'MMM d')} - ${format(endDate, 'MMM d, yyyy')}`, 20, yPosition + 5);
    yPosition += 20;
    
    Object.entries(allData).forEach(([reportType, data]) => {
      if (yPosition > 270) {
        doc.addPage();
        yPosition = 20;
      }
      
      const reportLabel = getSectionLabel(pack, reportType as ReportSectionId);
      doc.setFontSize(14);
      doc.text(reportLabel, 20, yPosition);
      yPosition += 8;
      
      doc.setFontSize(10);
      doc.text(`Total Records: ${data.length}`, 20, yPosition);
      yPosition += 15;
      
      // Add summary stats for each report type
      if (reportType === 'invoices' || reportType === 'revenue') {
        const total = data.reduce((sum, inv) => sum + (inv.total || 0), 0);
        doc.text(`Total Amount: $${total.toLocaleString()}`, 20, yPosition);
        yPosition += 10;
      }
      
      if (reportType === 'feedback') {
        const avgRating = data.length > 0 
          ? data.reduce((sum, f) => sum + (f.rating || 0), 0) / data.length 
          : 0;
        doc.text(`Average Rating: ${avgRating.toFixed(1)} / 5`, 20, yPosition);
        yPosition += 10;
      }
      
      yPosition += 5;
    });
    
    return doc;
  };

  const handleExport = async () => {
    if (selectedReports.length === 0) {
      toast.error('Please select at least one report type');
      return;
    }
    
    setIsExporting(true);
    
    try {
      const allData: Record<string, any[]> = {};
      
      for (const reportType of selectedReports) {
        const data = await fetchReportData(reportType);
        if (data.length > 0) {
          allData[reportType] = data;
        }
      }

      if (Object.keys(allData).length === 0) {
        toast.error('No data to export');
        return;
      }

      if (exportFormat === 'csv') {
        // Create combined CSV or separate files
        if (selectedReports.length === 1) {
          const reportType = selectedReports[0];
          const csvContent = convertToCSV(allData[reportType] || [], reportType);
          const blob = new Blob([csvContent], { type: 'text/csv' });
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `${reportType}_report_${format(new Date(), 'yyyy-MM-dd')}.csv`;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          URL.revokeObjectURL(url);
        } else {
          // Multiple reports - create a zip-like structure with all CSVs
          for (const [reportType, data] of Object.entries(allData)) {
            const csvContent = convertToCSV(data, reportType);
            const blob = new Blob([csvContent], { type: 'text/csv' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `${reportType}_report_${format(new Date(), 'yyyy-MM-dd')}.csv`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
          }
        }
        
        toast.success(`Exported ${Object.values(allData).flat().length} records to CSV`);
      } else if (exportFormat === 'pdf') {
        const doc = generatePDF(allData);
        doc.save(`analytics_report_${format(new Date(), 'yyyy-MM-dd')}.pdf`);
        toast.success(`Exported report to PDF`);
      }
      
      onExport?.({ type: selectedReports.join(','), count: Object.values(allData).flat().length });
    } catch (error) {
      console.error('Export error:', error);
      toast.error('Failed to export report');
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <Card className="border-border bg-card shadow-sm">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2 text-foreground">
            <Download className="h-5 w-5 text-primary" />
            Export Report
          </CardTitle>
          <Button variant="ghost-card" size="icon" onClick={onCancel}>
            <X className="h-5 w-5" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4 bg-muted/50 rounded-b-lg">
        {/* Report Types - Checkboxes */}
        <div className="space-y-3 p-3 rounded-lg bg-muted/50 border border-border">
          <h4 className="font-medium text-sm text-foreground">Select Report Types</h4>
          <div className="grid grid-cols-2 gap-3">
            {REPORT_TYPES.map(report => (
              <div key={report.id} className="flex items-center gap-2">
                <Checkbox
                  id={`report-${report.id}`}
                  checked={selectedReports.includes(report.id)}
                  onCheckedChange={() => handleReportToggle(report.id)}
                />
                <Label htmlFor={`report-${report.id}`} className="text-sm cursor-pointer text-foreground/70">
                  {report.label}
                </Label>
              </div>
            ))}
          </div>
        </div>

        {/* Date Range & Format */}
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
                <SelectItem value="pdf">PDF</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Include Fields */}
        <div className="space-y-3 p-3 rounded-lg bg-muted/50 border border-border">
          <h4 className="font-medium text-sm text-foreground">Include Fields</h4>
          <div className="grid grid-cols-2 gap-3">
            {Object.entries(FIELD_OPTIONS).map(([key, option]) => (
              <div key={key} className="flex items-center gap-2">
                <Checkbox
                  id={key}
                  checked={includeFields[key as keyof typeof includeFields]}
                  onCheckedChange={(checked) => setIncludeFields(prev => ({ ...prev, [key]: !!checked }))}
                />
                <Label htmlFor={key} className="text-sm cursor-pointer text-foreground/70">{option.label}</Label>
              </div>
            ))}
          </div>
        </div>

        {/* Preview */}
        <div className="p-3 rounded-lg bg-muted/50 border border-border flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-foreground">Records to Export</p>
            <p className="text-xs text-foreground/50">
              {format(startDate, 'MMM d')} - {format(endDate, 'MMM d, yyyy')}
            </p>
            {selectedReports.length > 0 && (
              <p className="text-xs text-foreground/50 mt-1">
                {selectedReports.length} report type{selectedReports.length > 1 ? 's' : ''} selected
              </p>
            )}
          </div>
          <div className="text-right">
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <p className="text-2xl font-bold">{totalRecords.toLocaleString()}</p>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-2 pt-2">
          <Button 
            className="flex-1" 
            onClick={handleExport}
            disabled={isExporting || totalRecords === 0 || selectedReports.length === 0}
          >
            {isExporting ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : exportFormat === 'pdf' ? (
              <FileText className="h-4 w-4 mr-2" />
            ) : (
              <Download className="h-4 w-4 mr-2" />
            )}
            {isExporting ? 'Exporting...' : `Download ${exportFormat.toUpperCase()}`}
          </Button>
          <Button variant="outline" onClick={onCancel}>
            Close
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
