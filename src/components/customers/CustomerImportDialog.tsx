import { useState, useRef } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogHeader, 
  DialogTitle 
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { 
  Upload, 
  Download, 
  FileSpreadsheet, 
  AlertCircle, 
  CheckCircle2, 
  Loader2,
  FileText,
  X
} from 'lucide-react';
import { toast } from 'sonner';

interface CustomerImportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface ParsedCustomer {
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  address: string;
  sms_opt_in: boolean;
  email_opt_in: boolean;
  call_opt_in: boolean;
  error?: string;
}

interface ImportResult {
  success: number;
  failed: number;
  errors: string[];
}

const CSV_TEMPLATE = `first_name,last_name,email,phone,address,sms_opt_in,email_opt_in,call_opt_in
John,Doe,john.doe@example.com,(555) 123-4567,"123 Main St, City, State 12345",true,true,true
Jane,Smith,jane.smith@example.com,(555) 987-6543,"456 Oak Ave, Town, State 67890",true,true,false`;

export function CustomerImportDialog({ open, onOpenChange }: CustomerImportDialogProps) {
  const { companyId } = useAuth();
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [parsedCustomers, setParsedCustomers] = useState<ParsedCustomer[]>([]);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const [step, setStep] = useState<'upload' | 'preview' | 'importing' | 'complete'>('upload');
  const [importProgress, setImportProgress] = useState(0);

  const resetState = () => {
    setSelectedFile(null);
    setParsedCustomers([]);
    setImportResult(null);
    setStep('upload');
    setImportProgress(0);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleClose = (open: boolean) => {
    if (!open) {
      resetState();
    }
    onOpenChange(open);
  };

  const downloadTemplate = () => {
    const blob = new Blob([CSV_TEMPLATE], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'customer_import_template.csv';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    toast.success('Template downloaded');
  };

  const parseCSV = (text: string): ParsedCustomer[] => {
    const lines = text.trim().split('\n');
    if (lines.length < 2) return [];

    // Get headers and normalize them
    const headers = lines[0].split(',').map(h => h.trim().toLowerCase().replace(/[^a-z0-9_]/g, '_'));
    
    const customers: ParsedCustomer[] = [];

    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;

      // Parse CSV line (handle quoted values with commas)
      const values: string[] = [];
      let current = '';
      let inQuotes = false;
      
      for (const char of line) {
        if (char === '"') {
          inQuotes = !inQuotes;
        } else if (char === ',' && !inQuotes) {
          values.push(current.trim());
          current = '';
        } else {
          current += char;
        }
      }
      values.push(current.trim());

      // Map values to customer object
      const customer: ParsedCustomer = {
        first_name: '',
        last_name: '',
        email: '',
        phone: '',
        address: '',
        sms_opt_in: true,
        email_opt_in: true,
        call_opt_in: true,
      };

      headers.forEach((header, index) => {
        const value = values[index] || '';
        
        switch (header) {
          case 'first_name':
          case 'firstname':
          case 'first':
            customer.first_name = value;
            break;
          case 'last_name':
          case 'lastname':
          case 'last':
            customer.last_name = value;
            break;
          case 'email':
          case 'email_address':
            customer.email = value;
            break;
          case 'phone':
          case 'phone_number':
          case 'telephone':
            customer.phone = value;
            break;
          case 'address':
          case 'full_address':
          case 'street_address':
            customer.address = value;
            break;
          case 'sms_opt_in':
          case 'sms':
            customer.sms_opt_in = value.toLowerCase() === 'true' || value === '1' || value.toLowerCase() === 'yes';
            break;
          case 'email_opt_in':
          case 'email_notifications':
            customer.email_opt_in = value.toLowerCase() === 'true' || value === '1' || value.toLowerCase() === 'yes';
            break;
          case 'call_opt_in':
          case 'call':
          case 'phone_opt_in':
            customer.call_opt_in = value.toLowerCase() === 'true' || value === '1' || value.toLowerCase() === 'yes';
            break;
          // Handle combined name field
          case 'name':
          case 'full_name':
            const nameParts = value.split(' ');
            customer.first_name = nameParts[0] || '';
            customer.last_name = nameParts.slice(1).join(' ') || '';
            break;
        }
      });

      // Validate required fields
      if (!customer.first_name) {
        customer.error = 'First name is required';
      } else if (!customer.email) {
        customer.error = 'Email is required';
      } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(customer.email)) {
        customer.error = 'Invalid email format';
      }

      customers.push(customer);
    }

    return customers;
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    const validTypes = [
      'text/csv',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    ];
    
    const isCSV = file.name.toLowerCase().endsWith('.csv');
    const isExcel = file.name.toLowerCase().endsWith('.xlsx') || file.name.toLowerCase().endsWith('.xls');
    
    if (!validTypes.includes(file.type) && !isCSV && !isExcel) {
      toast.error('Please upload a CSV or Excel file');
      return;
    }

    setSelectedFile(file);

    try {
      if (isCSV || file.type === 'text/csv') {
        const text = await file.text();
        const customers = parseCSV(text);
        setParsedCustomers(customers);
        setStep('preview');
      } else if (isExcel) {
        // For Excel files, we'll read as text and try to parse
        // In a production app, you'd use a library like xlsx
        toast.error('Excel files (.xlsx/.xls) are not fully supported. Please save your file as CSV.');
        return;
      }
    } catch {
      toast.error('Failed to parse file');
    }
  };

  const importMutation = useMutation({
    mutationFn: async (customers: ParsedCustomer[]) => {
      if (!companyId) throw new Error('No company ID');

      const validCustomers = customers.filter(c => !c.error);
      const result: ImportResult = { success: 0, failed: 0, errors: [] };

      setStep('importing');
      
      for (let i = 0; i < validCustomers.length; i++) {
        const customer = validCustomers[i];
        const fullName = `${customer.first_name} ${customer.last_name}`.trim();

        try {
          const { error } = await supabase
            .from('customer_profiles')
            .insert({
              company_id: companyId,
              name: fullName,
              email: customer.email.trim(),
              phone: customer.phone || null,
              address: customer.address || null,
              sms_opt_out: !customer.sms_opt_in,
              email_opt_out: !customer.email_opt_in,
              call_opt_out: !customer.call_opt_in,
            });

          if (error) {
            result.failed++;
            if (error.code === '23505') {
              result.errors.push(`${customer.email}: Duplicate email`);
            } else {
              result.errors.push(`${customer.email}: ${error.message}`);
            }
          } else {
            result.success++;
          }
        } catch {
          result.failed++;
          result.errors.push(`${customer.email}: Unknown error`);
        }

        setImportProgress(Math.round(((i + 1) / validCustomers.length) * 100));
      }

      // Add count of customers with validation errors
      const invalidCount = customers.filter(c => c.error).length;
      if (invalidCount > 0) {
        result.failed += invalidCount;
        result.errors.push(`${invalidCount} customers had validation errors`);
      }

      return result;
    },
    onSuccess: (result) => {
      setImportResult(result);
      setStep('complete');
      queryClient.invalidateQueries({ queryKey: ['customers'] });
      
      if (result.success > 0) {
        toast.success(`Successfully imported ${result.success} customers`);
      }
      if (result.failed > 0) {
        toast.warning(`${result.failed} customers failed to import`);
      }
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Import failed');
      setStep('preview');
    },
  });

  const handleImport = () => {
    importMutation.mutate(parsedCustomers);
  };

  const validCount = parsedCustomers.filter(c => !c.error).length;
  const invalidCount = parsedCustomers.filter(c => c.error).length;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileSpreadsheet className="h-5 w-5 text-primary" />
            Import Customers
          </DialogTitle>
          <DialogDescription>
            Upload a CSV file to import multiple customers at once
          </DialogDescription>
        </DialogHeader>

        {step === 'upload' && (
          <div className="space-y-6">
            {/* Template Download */}
            <div className="flex items-center justify-between p-4 rounded-lg border border-dashed bg-muted/20">
              <div className="flex items-center gap-3">
                <FileText className="h-8 w-8 text-muted-foreground" />
                <div>
                  <p className="font-medium">Download Template</p>
                  <p className="text-sm text-muted-foreground">
                    Get a pre-formatted CSV template with all required columns
                  </p>
                </div>
              </div>
              <Button variant="outline" onClick={downloadTemplate}>
                <Download className="h-4 w-4 mr-2" />
                Download
              </Button>
            </div>

            {/* File Upload */}
            <div 
              className="flex flex-col items-center justify-center p-8 rounded-lg border-2 border-dashed hover:border-primary/50 transition-colors cursor-pointer"
              onClick={() => fileInputRef.current?.click()}
            >
              <Upload className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="font-medium">Click to upload or drag and drop</p>
              <p className="text-sm text-muted-foreground mt-1">
                CSV files only (max 20MB)
              </p>
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv,.xlsx,.xls"
                onChange={handleFileSelect}
                className="hidden"
              />
            </div>

            {/* Template Info */}
            <div className="rounded-lg border bg-muted/20 p-4">
              <h4 className="font-medium mb-2">Required Columns</h4>
              <div className="grid grid-cols-2 gap-2 text-sm text-muted-foreground">
                <div><Badge variant="secondary" className="mr-2">first_name</Badge>Required</div>
                <div><Badge variant="secondary" className="mr-2">email</Badge>Required</div>
                <div><Badge variant="outline" className="mr-2">last_name</Badge>Optional</div>
                <div><Badge variant="outline" className="mr-2">phone</Badge>Optional</div>
                <div><Badge variant="outline" className="mr-2">address</Badge>Optional</div>
                <div><Badge variant="outline" className="mr-2">sms_opt_in</Badge>true/false</div>
                <div><Badge variant="outline" className="mr-2">email_opt_in</Badge>true/false</div>
                <div><Badge variant="outline" className="mr-2">call_opt_in</Badge>true/false</div>
              </div>
            </div>
          </div>
        )}

        {step === 'preview' && (
          <div className="space-y-4">
            {/* File Info */}
            <div className="flex items-center justify-between p-3 rounded-lg border bg-muted/20">
              <div className="flex items-center gap-3">
                <FileSpreadsheet className="h-5 w-5 text-primary" />
                <div>
                  <p className="font-medium">{selectedFile?.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {parsedCustomers.length} customers found
                  </p>
                </div>
              </div>
              <Button variant="ghost" size="sm" onClick={resetState}>
                <X className="h-4 w-4" />
              </Button>
            </div>

            {/* Validation Summary */}
            <div className="flex gap-4">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-green-500" />
                <span className="text-sm">{validCount} valid</span>
              </div>
              {invalidCount > 0 && (
                <div className="flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 text-destructive" />
                  <span className="text-sm text-destructive">{invalidCount} with errors</span>
                </div>
              )}
            </div>

            {/* Preview List */}
            <ScrollArea className="h-[300px] rounded-lg border">
              <div className="p-4 space-y-2">
                {parsedCustomers.map((customer, index) => (
                  <div 
                    key={index}
                    className={`flex items-center justify-between p-3 rounded-lg border ${
                      customer.error ? 'border-destructive/50 bg-destructive/5' : 'bg-muted/20'
                    }`}
                  >
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">
                        {customer.first_name} {customer.last_name}
                      </p>
                      <p className="text-sm text-muted-foreground truncate">
                        {customer.email}
                      </p>
                    </div>
                    {customer.error ? (
                      <Badge variant="destructive" className="ml-2 shrink-0">
                        {customer.error}
                      </Badge>
                    ) : (
                      <CheckCircle2 className="h-4 w-4 text-green-500 ml-2 shrink-0" />
                    )}
                  </div>
                ))}
              </div>
            </ScrollArea>

            {/* Actions */}
            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={resetState}>
                Cancel
              </Button>
              <Button 
                onClick={handleImport} 
                disabled={validCount === 0}
              >
                Import {validCount} Customers
              </Button>
            </div>
          </div>
        )}

        {step === 'importing' && (
          <div className="space-y-6 py-8">
            <div className="flex flex-col items-center">
              <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
              <p className="font-medium">Importing customers...</p>
              <p className="text-sm text-muted-foreground">Please don't close this window</p>
            </div>
            <Progress value={importProgress} className="h-2" />
            <p className="text-center text-sm text-muted-foreground">{importProgress}% complete</p>
          </div>
        )}

        {step === 'complete' && importResult && (
          <div className="space-y-6">
            <div className="flex flex-col items-center py-6">
              <CheckCircle2 className="h-16 w-16 text-green-500 mb-4" />
              <p className="text-xl font-bold">Import Complete</p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 rounded-lg border bg-green-500/10 border-green-500/30">
                <p className="text-2xl font-bold text-green-600">{importResult.success}</p>
                <p className="text-sm text-muted-foreground">Successfully imported</p>
              </div>
              <div className="p-4 rounded-lg border bg-destructive/10 border-destructive/30">
                <p className="text-2xl font-bold text-destructive">{importResult.failed}</p>
                <p className="text-sm text-muted-foreground">Failed to import</p>
              </div>
            </div>

            {importResult.errors.length > 0 && (
              <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-4">
                <p className="font-medium text-destructive mb-2">Errors:</p>
                <ScrollArea className="max-h-[150px]">
                  <ul className="text-sm space-y-1">
                    {importResult.errors.map((error, index) => (
                      <li key={index} className="text-destructive/80">• {error}</li>
                    ))}
                  </ul>
                </ScrollArea>
              </div>
            )}

            <div className="flex justify-end">
              <Button onClick={() => handleClose(false)}>
                Done
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
