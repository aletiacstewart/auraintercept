import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Shield, Send, ArrowLeft, Mail, MessageSquare, Loader2, Search, User, Calendar, Package, Clock, CheckCircle, AlertCircle } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { format, addMonths, differenceInDays } from 'date-fns';
import { toast } from 'sonner';

interface WarrantyInfo {
  appointmentId: string;
  customerName: string;
  customerPhone: string | null;
  customerEmail: string | null;
  serviceType: string;
  completedDate: string;
  warrantyExpiresDate: string;
  daysRemaining: number;
  isExpired: boolean;
  status: string;
}

interface WarrantyLookupFormProps {
  companyId: string;
  onCancel?: () => void;
}

export function WarrantyLookupForm({ companyId, onCancel }: WarrantyLookupFormProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedWarranty, setSelectedWarranty] = useState<WarrantyInfo | null>(null);
  const [sendEmail, setSendEmail] = useState(true);
  const [sendSms, setSendSms] = useState(false);
  const [isSending, setIsSending] = useState(false);

  // Default warranty period in months (can be customized per company)
  const WARRANTY_PERIOD_MONTHS = 12;

  // Search for completed jobs with warranty info
  const { data: appointments = [], isLoading: searchingJobs } = useQuery({
    queryKey: ['warranty-lookup-search', companyId, searchQuery],
    queryFn: async () => {
      if (!searchQuery.trim()) return [];
      const { data } = await supabase
        .from('appointments')
        .select('id, customer_name, customer_phone, customer_email, service_type, datetime, status')
        .eq('company_id', companyId)
        .eq('status', 'completed')
        .or(`customer_name.ilike.%${searchQuery}%,customer_phone.ilike.%${searchQuery}%,customer_email.ilike.%${searchQuery}%`)
        .order('datetime', { ascending: false })
        .limit(10);
      return data || [];
    },
    enabled: !!companyId && searchQuery.length >= 2,
  });

  const handleSelectAppointment = (appointmentId: string) => {
    const apt = appointments.find(a => a.id === appointmentId);
    if (apt) {
      const completedDate = new Date(apt.datetime);
      const warrantyExpiresDate = addMonths(completedDate, WARRANTY_PERIOD_MONTHS);
      const today = new Date();
      const daysRemaining = differenceInDays(warrantyExpiresDate, today);
      const isExpired = daysRemaining < 0;

      setSelectedWarranty({
        appointmentId: apt.id,
        customerName: apt.customer_name || '',
        customerPhone: apt.customer_phone,
        customerEmail: apt.customer_email,
        serviceType: apt.service_type || '',
        completedDate: apt.datetime,
        warrantyExpiresDate: warrantyExpiresDate.toISOString(),
        daysRemaining: Math.max(0, daysRemaining),
        isExpired,
        status: isExpired ? 'Expired' : daysRemaining <= 30 ? 'Expiring Soon' : 'Active',
      });
    }
  };

  const handleSendWarrantyInfo = async () => {
    if (!selectedWarranty) return;
    if (!sendEmail && !sendSms) {
      toast.error('Please select at least one delivery method');
      return;
    }

    setIsSending(true);

    try {
      const channels = [];
      if (sendEmail && selectedWarranty.customerEmail) channels.push('email');
      if (sendSms && selectedWarranty.customerPhone) channels.push('sms');

      // Here you would integrate with your email/SMS sending functions
      // For now, we'll show a success message
      await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate API call

      toast.success(`Warranty information sent via ${channels.join(' and ')}`);
      
      // Reset form
      setSelectedWarranty(null);
      setSearchQuery('');
    } catch (error) {
      console.error('Error sending warranty info:', error);
      toast.error('Failed to send warranty information');
    } finally {
      setIsSending(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Active':
        return 'text-green-600 bg-green-100';
      case 'Expiring Soon':
        return 'text-amber-600 bg-amber-100';
      case 'Expired':
        return 'text-red-600 bg-red-100';
      default:
        return 'text-muted-foreground bg-muted';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'Active':
        return <CheckCircle className="h-4 w-4" />;
      case 'Expiring Soon':
        return <Clock className="h-4 w-4" />;
      case 'Expired':
        return <AlertCircle className="h-4 w-4" />;
      default:
        return <Shield className="h-4 w-4" />;
    }
  };

  const canSend = selectedWarranty && (
    (sendEmail && selectedWarranty.customerEmail) ||
    (sendSms && selectedWarranty.customerPhone)
  );

  return (
    <div className="space-y-3 p-4 bg-muted/50 rounded-lg">
      <div className="flex items-center gap-2 mb-3">
        {onCancel && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={onCancel}
            className="h-7 w-7 p-0 rounded-full hover:bg-muted"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
        )}
        <Shield className="h-5 w-5 text-primary" />
        <h3 className="font-semibold text-foreground">Warranty Lookup</h3>
      </div>

      {/* Search Section */}
      {!selectedWarranty && (
        <div className="space-y-2">
          <Label className="text-sm font-medium flex items-center gap-2 text-foreground/70">
            <Search className="h-4 w-4" />
            Search Customer or Job
          </Label>
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by name, phone, or email..."
            className="h-9 text-sm bg-white text-slate-900 border-border placeholder:text-slate-400"
          />
          {searchQuery.length >= 2 && appointments.length > 0 && (
            <div className="border border-border rounded-lg max-h-48 overflow-y-auto bg-white">
              {appointments.map((apt) => (
                <button
                  key={apt.id}
                  type="button"
                  onClick={() => handleSelectAppointment(apt.id)}
                  className="w-full text-left p-2 hover:bg-muted/50 border-b border-border last:border-b-0 text-sm transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <User className="h-3.5 w-3.5 text-foreground/50" />
                      <span className="font-medium text-foreground">{apt.customer_name}</span>
                    </div>
                    <span className="text-xs text-green-600">completed</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-foreground/50 mt-1">
                    <Calendar className="h-3 w-3" />
                    {format(new Date(apt.datetime), 'MMM d, yyyy')} - {apt.service_type}
                  </div>
                </button>
              ))}
            </div>
          )}
          {searchingJobs && <p className="text-xs text-foreground/50">Searching...</p>}
          {searchQuery.length >= 2 && !searchingJobs && appointments.length === 0 && (
            <p className="text-xs text-foreground/50 text-center py-2">No completed jobs found</p>
          )}
        </div>
      )}

      {/* Warranty Details */}
      {selectedWarranty && (
        <div className="space-y-3">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => {
              setSelectedWarranty(null);
              setSearchQuery('');
            }}
            className="text-xs text-muted-foreground"
          >
            ← Search again
          </Button>

          {/* Warranty Status Card */}
          <div className="border border-border rounded-lg p-4 space-y-3 bg-white">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-primary" />
                <span className="font-semibold text-foreground">Warranty Status</span>
              </div>
              <span className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${getStatusColor(selectedWarranty.status)}`}>
                {getStatusIcon(selectedWarranty.status)}
                {selectedWarranty.status}
              </span>
            </div>

            <div className="grid gap-2 text-sm">
              <div className="flex items-center gap-2">
                <User className="h-4 w-4 text-foreground/50" />
                <span className="font-medium text-foreground">{selectedWarranty.customerName}</span>
              </div>
              <div className="flex items-center gap-2">
                <Package className="h-4 w-4 text-foreground/50" />
                <span className="text-foreground">{selectedWarranty.serviceType}</span>
              </div>
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-foreground/50" />
                <span className="text-foreground">Service Date: {format(new Date(selectedWarranty.completedDate), 'MMM d, yyyy')}</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-foreground/50" />
                <span className="text-foreground">
                  Expires: {format(new Date(selectedWarranty.warrantyExpiresDate), 'MMM d, yyyy')}
                  {!selectedWarranty.isExpired && (
                    <span className="text-foreground/50 ml-1">
                      ({selectedWarranty.daysRemaining} days remaining)
                    </span>
                  )}
                </span>
              </div>
            </div>

            {selectedWarranty.customerPhone && (
              <p className="text-xs text-foreground/50">Phone: {selectedWarranty.customerPhone}</p>
            )}
            {selectedWarranty.customerEmail && (
              <p className="text-xs text-foreground/50">Email: {selectedWarranty.customerEmail}</p>
            )}
          </div>

          {/* Send Options */}
          <div className="border border-border rounded-lg p-3 space-y-2 bg-white">
            <Label className="text-sm font-medium text-foreground">Send Warranty Info Via</Label>
            <div className="flex items-center gap-6">
              <label className="flex items-center gap-2 cursor-pointer">
                <Switch 
                  checked={sendEmail} 
                  onCheckedChange={setSendEmail}
                  disabled={!selectedWarranty.customerEmail}
                />
                <Mail className="h-4 w-4 text-foreground/50" />
                <span className="text-sm text-foreground">Email</span>
                {!selectedWarranty.customerEmail && (
                  <span className="text-xs text-foreground/50">(no email)</span>
                )}
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <Switch 
                  checked={sendSms} 
                  onCheckedChange={setSendSms}
                  disabled={!selectedWarranty.customerPhone}
                />
                <MessageSquare className="h-4 w-4 text-foreground/50" />
                <span className="text-sm text-foreground">SMS</span>
                {!selectedWarranty.customerPhone && (
                  <span className="text-xs text-foreground/50">(no phone)</span>
                )}
              </label>
            </div>
          </div>

          <Button 
            onClick={handleSendWarrantyInfo} 
            className="w-full h-9" 
            disabled={!canSend || isSending}
          >
            {isSending ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Sending...
              </>
            ) : (
              <>
                <Send className="h-4 w-4 mr-2" />
                Send Warranty Information
              </>
            )}
          </Button>
        </div>
      )}
    </div>
  );
}
