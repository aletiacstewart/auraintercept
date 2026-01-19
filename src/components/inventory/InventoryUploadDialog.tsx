import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { toast } from 'sonner';
import { Upload, FileText, Loader2, Info, Download } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useQueryClient } from '@tanstack/react-query';

interface InventoryUploadDialogProps {
  companyId: string;
}

const SAMPLE_CSV = `Name,SKU,Category,Quantity,Min Qty,Unit Cost,Supplier,Description
Air Filter 16x20x1,AF-16201,Filters,50,10,8.99,HVAC Supplies Inc,Standard pleated air filter
Capacitor 35/5 MFD,CAP-355,Electrical,25,5,12.50,ElectroParts Co,Dual run capacitor for AC units
Refrigerant R-410A,REF-410A,Refrigerant,12,3,89.99,CoolGas Supply,25lb cylinder
Thermostat Wire,TW-18-5,Wire & Cable,500,100,0.15,Wire World,18 gauge 5-conductor
Condensate Pump,CP-120,Pumps,8,2,45.00,PumpMaster Inc,Mini split condensate pump`;

export function InventoryUploadDialog({ companyId }: InventoryUploadDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [documentContent, setDocumentContent] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [activeTab, setActiveTab] = useState('upload');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const queryClient = useQueryClient();

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Check file size (max 1MB for text files)
    if (file.size > 1024 * 1024) {
      toast.error('File too large. Maximum size is 1MB.');
      return;
    }

    // Check file type
    const validTypes = ['text/csv', 'text/plain', 'application/vnd.ms-excel'];
    const validExtensions = ['.csv', '.txt', '.tsv'];
    const hasValidExtension = validExtensions.some(ext => file.name.toLowerCase().endsWith(ext));
    
    if (!validTypes.includes(file.type) && !hasValidExtension) {
      toast.error('Invalid file type. Please upload a CSV or TXT file.');
      return;
    }

    try {
      const text = await file.text();
      setDocumentContent(text);
      toast.success('File loaded successfully');
    } catch (error) {
      toast.error('Failed to read file');
    }
  };

  const handleProcessDocument = async () => {
    if (!documentContent.trim()) {
      toast.error('Please enter or upload document content');
      return;
    }

    setIsProcessing(true);
    try {
      const { data, error } = await supabase.functions.invoke('parse-inventory-document', {
        body: { documentContent, companyId },
      });

      if (error) {
        throw error;
      }

      if (data.error) {
        toast.error(data.error);
        return;
      }

      if (data.itemsInserted > 0) {
        toast.success(`Successfully imported ${data.itemsInserted} inventory items!`);
        queryClient.invalidateQueries({ queryKey: ['inventory'] });
        setIsOpen(false);
        setDocumentContent('');
      } else {
        toast.warning('No valid inventory items found in the document');
      }
    } catch (error: any) {
      console.error('Error processing document:', error);
      if (error.message?.includes('429')) {
        toast.error('Rate limit exceeded. Please try again later.');
      } else if (error.message?.includes('402')) {
        toast.error('AI credits required. Please add credits to continue.');
      } else {
        toast.error('Failed to process document');
      }
    } finally {
      setIsProcessing(false);
    }
  };

  const downloadSampleCSV = () => {
    const blob = new Blob([SAMPLE_CSV], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'inventory-sample.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">
          <Upload className="w-4 h-4 mr-2" />
          Import from Document
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5" />
            Import Inventory from Document
          </DialogTitle>
          <DialogDescription>
            Upload a CSV/TXT file or paste your inventory data. Our AI will extract and import the items.
          </DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="inline-flex h-auto p-2 bg-muted/30 rounded-2xl border border-border gap-1">
            <TabsTrigger value="upload" className="px-4 py-2 rounded-full data-[state=active]:bg-background data-[state=active]:shadow-sm data-[state=active]:border data-[state=active]:border-border/50 transition-all">Upload / Paste Data</TabsTrigger>
            <TabsTrigger value="format" className="px-4 py-2 rounded-full data-[state=active]:bg-background data-[state=active]:shadow-sm data-[state=active]:border data-[state=active]:border-border/50 transition-all">Sample Format</TabsTrigger>
          </TabsList>

          <TabsContent value="upload" className="space-y-4">
            <div className="space-y-2">
              <Label>Upload File</Label>
              <div className="flex gap-2">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv,.txt,.tsv"
                  onChange={handleFileUpload}
                  className="hidden"
                />
                <Button
                  variant="outline"
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full justify-start"
                >
                  <Upload className="w-4 h-4 mr-2" />
                  Choose CSV or TXT file...
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                Supported formats: CSV, TXT (max 1MB)
              </p>
            </div>

            <div className="space-y-2">
              <Label>Or Paste Document Content</Label>
              <Textarea
                value={documentContent}
                onChange={(e) => setDocumentContent(e.target.value)}
                placeholder="Paste your inventory list here...

Example:
Name, SKU, Quantity, Category
Air Filter, AF-001, 50, Filters
Capacitor, CAP-355, 25, Electrical"
                className="min-h-[200px] font-mono text-sm"
              />
            </div>

            <Alert>
              <Info className="h-4 w-4" />
              <AlertDescription>
                The AI will automatically detect and extract inventory data from your document.
                It supports various formats including CSV, tab-separated values, and text lists.
              </AlertDescription>
            </Alert>
          </TabsContent>

          <TabsContent value="format" className="space-y-4">
            <Alert>
              <Info className="h-4 w-4" />
              <AlertDescription>
                Your document should contain inventory items with at least a <strong>Name</strong> column.
                Other columns are optional but recommended.
              </AlertDescription>
            </Alert>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Sample CSV Format</Label>
                <Button variant="outline" size="sm" onClick={downloadSampleCSV}>
                  <Download className="w-4 h-4 mr-2" />
                  Download Sample
                </Button>
              </div>
              <div className="border rounded-lg overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name*</TableHead>
                      <TableHead>SKU</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead>Quantity</TableHead>
                      <TableHead>Min Qty</TableHead>
                      <TableHead>Unit Cost</TableHead>
                      <TableHead>Supplier</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    <TableRow>
                      <TableCell className="font-medium">Air Filter 16x20x1</TableCell>
                      <TableCell>AF-16201</TableCell>
                      <TableCell>Filters</TableCell>
                      <TableCell>50</TableCell>
                      <TableCell>10</TableCell>
                      <TableCell>$8.99</TableCell>
                      <TableCell>HVAC Supplies</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell className="font-medium">Capacitor 35/5 MFD</TableCell>
                      <TableCell>CAP-355</TableCell>
                      <TableCell>Electrical</TableCell>
                      <TableCell>25</TableCell>
                      <TableCell>5</TableCell>
                      <TableCell>$12.50</TableCell>
                      <TableCell>ElectroParts Co</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell className="font-medium">Refrigerant R-410A</TableCell>
                      <TableCell>REF-410A</TableCell>
                      <TableCell>Refrigerant</TableCell>
                      <TableCell>12</TableCell>
                      <TableCell>3</TableCell>
                      <TableCell>$89.99</TableCell>
                      <TableCell>CoolGas Supply</TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Supported Columns</Label>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div className="p-2 bg-muted rounded">
                  <strong>Name</strong> <span className="text-destructive">*required</span>
                  <p className="text-muted-foreground text-xs">Item name or description</p>
                </div>
                <div className="p-2 bg-muted rounded">
                  <strong>SKU</strong>
                  <p className="text-muted-foreground text-xs">Stock keeping unit / part number</p>
                </div>
                <div className="p-2 bg-muted rounded">
                  <strong>Category</strong>
                  <p className="text-muted-foreground text-xs">Item category for grouping</p>
                </div>
                <div className="p-2 bg-muted rounded">
                  <strong>Quantity</strong>
                  <p className="text-muted-foreground text-xs">Current stock (defaults to 0)</p>
                </div>
                <div className="p-2 bg-muted rounded">
                  <strong>Min Qty</strong>
                  <p className="text-muted-foreground text-xs">Low stock threshold (defaults to 5)</p>
                </div>
                <div className="p-2 bg-muted rounded">
                  <strong>Unit Cost</strong>
                  <p className="text-muted-foreground text-xs">Cost per unit in dollars</p>
                </div>
                <div className="p-2 bg-muted rounded">
                  <strong>Supplier</strong>
                  <p className="text-muted-foreground text-xs">Vendor / supplier name</p>
                </div>
                <div className="p-2 bg-muted rounded">
                  <strong>Description</strong>
                  <p className="text-muted-foreground text-xs">Additional item details</p>
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>

        <DialogFooter>
          <Button variant="outline" onClick={() => setIsOpen(false)}>
            Cancel
          </Button>
          <Button 
            onClick={handleProcessDocument} 
            disabled={isProcessing || !documentContent.trim()}
          >
            {isProcessing ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Processing...
              </>
            ) : (
              <>
                <Upload className="w-4 h-4 mr-2" />
                Import Items
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
