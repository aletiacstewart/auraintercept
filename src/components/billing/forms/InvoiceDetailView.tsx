import React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  ArrowLeft, 
  CreditCard, 
  Calendar, 
  User, 
  Mail, 
  Phone, 
  FileText,
  CheckCircle2,
  Clock,
  AlertTriangle,
  ExternalLink
} from 'lucide-react';
import { format } from 'date-fns';

interface Invoice {
  id: string;
  invoice_number: string | null;
  customer_name: string;
  customer_email: string | null;
  customer_phone: string | null;
  subtotal: number;
  total: number;
  status: string;
  due_date: string | null;
  created_at: string;
  paid_at: string | null;
}

interface InvoiceDetailViewProps {
  invoice: Invoice;
  onBack: () => void;
  onPayNow?: (invoice: Invoice) => void;
}

export function InvoiceDetailView({ invoice, onBack, onPayNow }: InvoiceDetailViewProps) {
  const getStatusInfo = (status: string) => {
    switch (status) {
      case 'paid':
        return { 
          badge: <Badge className="bg-green-100 text-green-700 hover:bg-green-100">Paid</Badge>,
          icon: <CheckCircle2 className="h-8 w-8 text-green-500" />,
          message: 'This invoice has been paid. Thank you!'
        };
      case 'sent':
        return { 
          badge: <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-100">Awaiting Payment</Badge>,
          icon: <Clock className="h-8 w-8 text-blue-500" />,
          message: 'Payment is pending. Please pay before the due date.'
        };
      case 'overdue':
        return { 
          badge: <Badge variant="destructive">Overdue</Badge>,
          icon: <AlertTriangle className="h-8 w-8 text-destructive" />,
          message: 'This invoice is overdue. Please pay as soon as possible.'
        };
      case 'draft':
        return { 
          badge: <Badge variant="secondary">Draft</Badge>,
          icon: <FileText className="h-8 w-8 text-muted-foreground" />,
          message: 'This invoice is still being prepared.'
        };
      default:
        return { 
          badge: <Badge variant="outline">{status}</Badge>,
          icon: <FileText className="h-8 w-8 text-muted-foreground" />,
          message: ''
        };
    }
  };

  const statusInfo = getStatusInfo(invoice.status);
  const showPayButton = invoice.status === 'sent' || invoice.status === 'overdue';

  return (
    <div className="space-y-4 p-3">
      <div className="flex items-center gap-2">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={onBack}
          className="h-7 w-7 p-0 rounded-full hover:bg-muted"
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <CreditCard className="h-5 w-5 text-primary" />
        <h3 className="font-semibold">Invoice Details</h3>
      </div>

      {/* Status Card */}
      <Card className="border-0 shadow-sm bg-muted/30">
        <CardContent className="p-4">
          <div className="flex items-center gap-4">
            {statusInfo.icon}
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                {statusInfo.badge}
                {invoice.invoice_number && (
                  <span className="text-sm text-muted-foreground">#{invoice.invoice_number}</span>
                )}
              </div>
              <p className="text-sm text-muted-foreground">{statusInfo.message}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Amount */}
      <Card className="border-0 shadow-sm">
        <CardContent className="p-4 text-center">
          <p className="text-sm text-muted-foreground mb-1">Total Amount</p>
          <p className="text-3xl font-bold text-primary">${invoice.total.toFixed(2)}</p>
          {invoice.subtotal !== invoice.total && (
            <p className="text-sm text-muted-foreground mt-1">
              Subtotal: ${invoice.subtotal.toFixed(2)}
            </p>
          )}
        </CardContent>
      </Card>

      {/* Details */}
      <Card className="border-0 shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">Invoice Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center gap-3 text-sm">
            <User className="h-4 w-4 text-muted-foreground" />
            <span>{invoice.customer_name}</span>
          </div>
          
          {invoice.customer_email && (
            <div className="flex items-center gap-3 text-sm">
              <Mail className="h-4 w-4 text-muted-foreground" />
              <span>{invoice.customer_email}</span>
            </div>
          )}
          
          {invoice.customer_phone && (
            <div className="flex items-center gap-3 text-sm">
              <Phone className="h-4 w-4 text-muted-foreground" />
              <span>{invoice.customer_phone}</span>
            </div>
          )}
          
          <div className="flex items-center gap-3 text-sm">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <span>Created: {format(new Date(invoice.created_at), 'MMM d, yyyy')}</span>
          </div>
          
          {invoice.due_date && invoice.status !== 'paid' && (
            <div className="flex items-center gap-3 text-sm">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <span className={invoice.status === 'overdue' ? 'text-destructive font-medium' : ''}>
                Due: {format(new Date(invoice.due_date), 'MMM d, yyyy')}
              </span>
            </div>
          )}
          
          {invoice.paid_at && (
            <div className="flex items-center gap-3 text-sm text-green-600">
              <CheckCircle2 className="h-4 w-4" />
              <span>Paid on {format(new Date(invoice.paid_at), 'MMM d, yyyy')}</span>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Pay Now Button */}
      {showPayButton && onPayNow && (
        <Button 
          onClick={() => onPayNow(invoice)} 
          className="w-full"
          size="lg"
        >
          <CreditCard className="h-4 w-4 mr-2" />
          Pay Now - ${invoice.total.toFixed(2)}
        </Button>
      )}

      {/* Contact for Questions */}
      <p className="text-xs text-center text-muted-foreground">
        Have questions about this invoice? Use the chat to contact us.
      </p>
    </div>
  );
}
