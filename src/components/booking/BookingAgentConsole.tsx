import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useMultiAgentChat, ChatMessage } from '@/hooks/useMultiAgentChat';
import { useAuth } from '@/contexts/AuthContext';
import { useCRMConnection } from '@/hooks/useCRMConnection';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { BookingForm, BookingData } from '@/components/ai/BookingForm';
import { FeedbackForm } from '@/components/ai/FeedbackForm';
import { QuoteForm, QuoteData } from '@/components/ai/QuoteForm';
import { ReviewForm } from '@/components/ai/ReviewForm';
import { CRMStatusIndicator, CRMSyncButton } from '@/components/crm/CRMStatusIndicator';
import { getAgentStyle } from '@/lib/agentStyles';
import { 
  Send, 
  Calendar, 
  Clock, 
  Phone, 
  MessageSquare,
  Bot,
  User,
  Loader2,
  X,
  Star,
  FileText,
  RotateCcw,
  XCircle,
  Search,
  ArrowLeft,
  Home
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { toast } from 'sonner';

interface QuickAction {
  id: string;
  label: string;
  icon: React.ElementType;
  message: string;
  variant?: 'default' | 'destructive' | 'outline' | 'secondary';
}

const QUICK_ACTIONS: QuickAction[] = [
  { id: 'book', label: 'Book Appointment', icon: Calendar, message: '' },
  { id: 'reschedule', label: 'Reschedule', icon: RotateCcw, message: 'I need to reschedule an existing appointment' },
  { id: 'cancel', label: 'Cancel', icon: XCircle, message: 'I need to cancel an appointment', variant: 'destructive' },
  { id: 'followup', label: 'Follow Up', icon: Phone, message: 'I need to follow up with a customer about their recent service' },
  { id: 'review', label: 'Request Review', icon: Star, message: 'I want to request a review from a customer' },
  { id: 'quote', label: 'Get Quote', icon: FileText, message: 'I need to generate a quote for a customer' },
  { id: 'lookup', label: 'Lookup Customer', icon: Search, message: 'I need to look up a customer\'s appointment history' },
];

interface AppointmentInfo {
  id: string;
  customer_name: string;
  customer_phone: string | null;
  customer_email: string | null;
  service_type: string;
  datetime: string;
  status: string;
  customer_address: string | null;
}

interface Service {
  id: string;
  name: string;
  description: string | null;
  duration_minutes: number;
  price: number | null;
}

interface BookingAgentConsoleProps {
  companyId?: string;
  className?: string;
}

export function BookingAgentConsole({ companyId, className }: BookingAgentConsoleProps) {
  const { user, companyId: authCompanyId } = useAuth();
  const effectiveCompanyId = companyId || authCompanyId;
  
  // CRM integration hook - non-blocking sync
  const { isConnected: isCRMConnected, trySyncCustomer, trySyncAppointment, isSyncingCustomer } = useCRMConnection();
  
  const [inputValue, setInputValue] = useState('');
  const [showAppointmentSelector, setShowAppointmentSelector] = useState(false);
  const [showBookingForm, setShowBookingForm] = useState(false);
  const [showFeedbackForm, setShowFeedbackForm] = useState(false);
  const [showQuoteForm, setShowQuoteForm] = useState(false);
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [showCustomerSearch, setShowCustomerSearch] = useState(false);
  const [customerSearchQuery, setCustomerSearchQuery] = useState('');
  const [customerSearchResults, setCustomerSearchResults] = useState<AppointmentInfo[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isSubmittingBooking, setIsSubmittingBooking] = useState(false);
  const [isSubmittingFeedback, setIsSubmittingFeedback] = useState(false);
  const [isSubmittingQuote, setIsSubmittingQuote] = useState(false);
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);
  const [selectorAction, setSelectorAction] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const { messages, isLoading, currentAgent, sendMessage } = useMultiAgentChat({
    companyId: effectiveCompanyId || undefined,
    userId: user?.id,
    initialAgent: 'booking',
    onAgentChange: (agent) => {
      console.log('[BookingConsole] Agent changed to:', agent);
    },
  });

  // Fetch services for booking form
  const { data: services = [] } = useQuery({
    queryKey: ['services-booking-console', effectiveCompanyId],
    queryFn: async () => {
      if (!effectiveCompanyId) return [];
      const { data, error } = await supabase
        .from('services')
        .select('id, name, description, duration_minutes, price')
        .eq('company_id', effectiveCompanyId)
        .eq('is_active', true)
        .order('sort_order', { ascending: true });
      
      if (error) {
        console.error('Error fetching services:', error);
        return [];
      }
      return (data || []) as Service[];
    },
    enabled: !!effectiveCompanyId,
  });

  // Fetch today's appointments for quick selection
  const { data: todayAppointments = [] } = useQuery({
    queryKey: ['today-appointments-booking', effectiveCompanyId],
    queryFn: async () => {
      if (!effectiveCompanyId) return [];

      const today = new Date();
      const startOfDay = new Date(today.setHours(0, 0, 0, 0)).toISOString();
      const endOfDay = new Date(today.setHours(23, 59, 59, 999)).toISOString();

      const { data, error } = await supabase
        .from('appointments')
        .select('*')
        .eq('company_id', effectiveCompanyId)
        .gte('datetime', startOfDay)
        .lte('datetime', endOfDay)
        .order('datetime', { ascending: true });

      if (error) {
        console.error('Error fetching appointments:', error);
        return [];
      }

      return (data || []) as AppointmentInfo[];
    },
    enabled: !!effectiveCompanyId,
    refetchInterval: 60000,
  });

  // Fetch recent appointments for lookup
  const { data: recentAppointments = [] } = useQuery({
    queryKey: ['recent-appointments-booking', effectiveCompanyId],
    queryFn: async () => {
      if (!effectiveCompanyId) return [];

      const { data, error } = await supabase
        .from('appointments')
        .select('*')
        .eq('company_id', effectiveCompanyId)
        .order('datetime', { ascending: false })
        .limit(20);

      if (error) {
        console.error('Error fetching recent appointments:', error);
        return [];
      }

      return (data || []) as AppointmentInfo[];
    },
    enabled: !!effectiveCompanyId && showAppointmentSelector,
  });

  // Fetch company review links
  const { data: companySettings } = useQuery({
    queryKey: ['company-review-links', effectiveCompanyId],
    queryFn: async () => {
      if (!effectiveCompanyId) return null;
      const { data, error } = await supabase
        .from('companies')
        .select('review_google_url, review_facebook_url, review_yelp_url')
        .eq('id', effectiveCompanyId)
        .single();
      
      if (error) {
        console.error('Error fetching company settings:', error);
        return null;
      }
      return data;
    },
    enabled: !!effectiveCompanyId,
  });

  const reviewLinks = [
    { platform: 'Google', url: companySettings?.review_google_url || '' },
    { platform: 'Facebook', url: companySettings?.review_facebook_url || '' },
    { platform: 'Yelp', url: companySettings?.review_yelp_url || '' },
  ].filter(link => link.url);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async () => {
    if (!inputValue.trim() || isLoading) return;
    const message = inputValue;
    setInputValue('');
    await sendMessage(message);
  };

  const handleQuickAction = useCallback(async (action: QuickAction) => {
    if (action.id === 'book') {
      setShowBookingForm(true);
      return;
    }
    if (action.id === 'followup') {
      setShowFeedbackForm(true);
      return;
    }
    if (action.id === 'quote') {
      setShowQuoteForm(true);
      return;
    }
    if (action.id === 'review') {
      setShowReviewForm(true);
      return;
    }
    if (action.id === 'reschedule' || action.id === 'cancel') {
      setShowAppointmentSelector(true);
      setSelectorAction(action.id);
      return;
    }
    if (action.id === 'lookup') {
      setShowCustomerSearch(true);
      setCustomerSearchQuery('');
      setCustomerSearchResults([]);
      return;
    }
    await sendMessage(action.message);
  }, [sendMessage]);

  const handleBookingSubmit = async (bookingData: BookingData) => {
    if (!effectiveCompanyId) return;
    
    setIsSubmittingBooking(true);
    try {
      // Get selected service names
      const selectedServiceNames = services
        .filter(s => bookingData.selectedServices.includes(s.id))
        .map(s => s.name)
        .join(', ');

      // Calculate total duration
      const totalDuration = services
        .filter(s => bookingData.selectedServices.includes(s.id))
        .reduce((sum, s) => sum + (s.duration_minutes || 60), 0);

      // Create the appointment datetime
      const appointmentDate = new Date(bookingData.date);
      const [hours, minutes] = bookingData.time.split(':');
      appointmentDate.setHours(parseInt(hours), parseInt(minutes), 0, 0);

      // Insert the appointment directly
      const { data: appointment, error } = await supabase
        .from('appointments')
        .insert({
          company_id: effectiveCompanyId,
          customer_name: bookingData.customerName.trim(),
          customer_phone: bookingData.customerPhone.trim(),
          customer_address: bookingData.customerAddress.trim(),
          service_type: selectedServiceNames,
          datetime: appointmentDate.toISOString(),
          duration_minutes: totalDuration,
          notes: bookingData.notes || null,
          status: 'scheduled',
        })
        .select()
        .single();

      if (error) throw error;

      toast.success('Appointment booked successfully!', {
        description: `${bookingData.customerName} - ${format(appointmentDate, 'MMM d, yyyy h:mm a')}`
      });

      // Non-blocking CRM sync - sync customer and appointment if CRM is connected
      trySyncCustomer(
        '', // No email in this form
        bookingData.customerName,
        bookingData.customerPhone
      );
      
      trySyncAppointment({
        service_type: selectedServiceNames,
        datetime: appointmentDate.toISOString(),
        notes: bookingData.notes,
      });

      setShowBookingForm(false);
      
      // Send a message to the chat about the booking
      await sendMessage(
        `I just booked an appointment for ${bookingData.customerName} on ${format(appointmentDate, 'MMMM d, yyyy')} at ${format(appointmentDate, 'h:mm a')} for ${selectedServiceNames}. The service address is ${bookingData.customerAddress}.`
      );

    } catch (error) {
      console.error('Error booking appointment:', error);
      toast.error('Failed to book appointment', {
        description: 'Please try again or contact support'
      });
    } finally {
      setIsSubmittingBooking(false);
    }
  };

  const handleFeedbackSubmit = async (feedbackData: {
    rating: number;
    sentiment: 'positive' | 'neutral' | 'negative';
    note: string;
    customerName: string;
    customerPhone: string;
    serviceDate?: Date;
  }) => {
    if (!effectiveCompanyId) return;
    
    setIsSubmittingFeedback(true);
    try {
      // Insert feedback into database
      const { error } = await supabase
        .from('customer_feedback')
        .insert({
          company_id: effectiveCompanyId,
          customer_name: feedbackData.customerName,
          customer_phone: feedbackData.customerPhone || null,
          rating: feedbackData.rating,
          sentiment: feedbackData.sentiment,
          feedback_note: feedbackData.note || null,
          source: 'booking_console',
        });

      if (error) throw error;

      toast.success('Feedback recorded successfully!', {
        description: `${feedbackData.customerName} - ${feedbackData.sentiment} (${feedbackData.rating} stars)`
      });

      setShowFeedbackForm(false);
      
      // Send a message to the chat about the feedback
      await sendMessage(
        `I recorded follow-up feedback from ${feedbackData.customerName}. They rated their experience ${feedbackData.rating}/5 stars (${feedbackData.sentiment}). ${feedbackData.note ? `Note: "${feedbackData.note}"` : ''}`
      );

    } catch (error) {
      console.error('Error submitting feedback:', error);
      toast.error('Failed to submit feedback', {
        description: 'Please try again or contact support'
      });
    } finally {
      setIsSubmittingFeedback(false);
    }
  };

  const handleQuoteSubmit = async (quoteData: QuoteData) => {
    if (!effectiveCompanyId) return;
    
    setIsSubmittingQuote(true);
    try {
      // Get selected service names and calculate total
      const selectedServiceDetails = services.filter(s => quoteData.selectedServices.includes(s.id));
      const selectedServiceNames = selectedServiceDetails.map(s => s.name).join(', ');
      const estimatedTotal = selectedServiceDetails.reduce((sum, s) => sum + (s.price || 0), 0);

      // Insert quote into database
      const { data: quote, error } = await supabase
        .from('quotes')
        .insert({
          company_id: effectiveCompanyId,
          customer_name: quoteData.customerName,
          customer_phone: quoteData.customerPhone || null,
          customer_email: quoteData.customerEmail || null,
          customer_address: quoteData.customerAddress || null,
          notes: quoteData.issueDescription || null,
          subtotal: estimatedTotal,
          total_amount: estimatedTotal,
          status: 'draft',
        })
        .select()
        .single();

      if (error) throw error;

      // Insert quote line items
      if (quote && selectedServiceDetails.length > 0) {
        const lineItems = selectedServiceDetails.map(service => ({
          quote_id: quote.id,
          service_id: service.id,
          description: service.name,
          quantity: 1,
          unit_price: service.price || 0,
          total: service.price || 0,
        }));

        await supabase.from('quote_line_items').insert(lineItems);
      }

      toast.success('Quote created successfully!', {
        description: `${quoteData.customerName} - $${estimatedTotal.toFixed(2)}`
      });

      setShowQuoteForm(false);
      
      // Send a message to the chat about the quote
      await sendMessage(
        `I created a quote for ${quoteData.customerName} for ${selectedServiceNames}. Total: $${estimatedTotal.toFixed(2)}. ${quoteData.issueDescription ? `Issue: "${quoteData.issueDescription}"` : ''}`
      );

    } catch (error) {
      console.error('Error creating quote:', error);
      toast.error('Failed to create quote', {
        description: 'Please try again or contact support'
      });
    } finally {
      setIsSubmittingQuote(false);
    }
  };

  const handleReviewSubmit = async (reviewData: {
    rating: number;
    comment: string;
    customerName: string;
    customerPhone: string;
    selectedPlatforms: string[];
  }) => {
    setIsSubmittingReview(true);
    try {
      toast.success('Review request sent!', {
        description: `${reviewData.customerName} - ${reviewData.selectedPlatforms.join(', ')}`
      });

      setShowReviewForm(false);
      
      // Send a message to the chat about the review request
      await sendMessage(
        `I sent a review request to ${reviewData.customerName} for ${reviewData.selectedPlatforms.join(', ')}. ${reviewData.comment ? `They commented: "${reviewData.comment}"` : ''}`
      );

    } catch (error) {
      console.error('Error sending review request:', error);
      toast.error('Failed to send review request', {
        description: 'Please try again or contact support'
      });
    } finally {
      setIsSubmittingReview(false);
    }
  };

  const handleSelectAppointment = useCallback(async (appointment: AppointmentInfo) => {
    setShowAppointmentSelector(false);
    
    let message = '';
    if (selectorAction === 'reschedule') {
      message = `I need to reschedule the appointment for ${appointment.customer_name} (${appointment.service_type}) currently scheduled for ${format(new Date(appointment.datetime), 'MMM d, yyyy h:mm a')}`;
    } else if (selectorAction === 'cancel') {
      message = `I need to cancel the appointment for ${appointment.customer_name} (${appointment.service_type}) scheduled for ${format(new Date(appointment.datetime), 'MMM d, yyyy h:mm a')}`;
    }
    
    setSelectorAction(null);
    await sendMessage(message);
  }, [selectorAction, sendMessage]);

  const handleCustomerSearch = async () => {
    if (!customerSearchQuery.trim() || !effectiveCompanyId) return;
    
    setIsSearching(true);
    try {
      const searchTerm = customerSearchQuery.trim().toLowerCase();
      
      const { data, error } = await supabase
        .from('appointments')
        .select('*')
        .eq('company_id', effectiveCompanyId)
        .or(`customer_name.ilike.%${searchTerm}%,customer_phone.ilike.%${searchTerm}%,customer_email.ilike.%${searchTerm}%`)
        .order('datetime', { ascending: false })
        .limit(20);

      if (error) throw error;
      
      setCustomerSearchResults((data || []) as AppointmentInfo[]);
    } catch (error) {
      console.error('Error searching customers:', error);
      toast.error('Search failed', { description: 'Please try again' });
    } finally {
      setIsSearching(false);
    }
  };

  const getAgentBadge = (agentType?: string) => {
    const style = getAgentStyle(agentType);
    return (
      <Badge variant="secondary" className={cn('text-[10px] px-1.5 py-0', style.bgColor, style.color)}>
        {style.label}
      </Badge>
    );
  };

  const renderMessage = (msg: ChatMessage, index: number) => {
    const isUser = msg.role === 'user';
    
    return (
      <div
        key={index}
        className={cn(
          'flex gap-2 animate-fade-in',
          isUser ? 'justify-end' : 'justify-start'
        )}
      >
        {!isUser && (
          <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
            <Bot className="w-4 h-4 text-primary" />
          </div>
        )}
        <div
          className={cn(
            'max-w-[85%] rounded-2xl px-3 py-2',
            isUser 
              ? 'bg-primary text-primary-foreground rounded-br-md' 
              : 'bg-muted rounded-bl-md'
          )}
        >
          {!isUser && msg.agent && (
            <div className="mb-1">
              {getAgentBadge(msg.agent)}
            </div>
          )}
          <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
          {msg.timestamp && (
            <p className={cn(
              'text-[10px] mt-1',
              isUser ? 'text-primary-foreground/70' : 'text-muted-foreground'
            )}>
              {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </p>
          )}
        </div>
        {isUser && (
          <div className="w-7 h-7 rounded-full bg-secondary flex items-center justify-center shrink-0">
            <User className="w-4 h-4 text-secondary-foreground" />
          </div>
        )}
      </div>
    );
  };

  return (
    <div className={cn('flex flex-col bg-background rounded-lg border border-border', className)}>
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border">
        <div className="flex items-center gap-2">
          {(showBookingForm || showFeedbackForm || showQuoteForm || showReviewForm || showCustomerSearch) && (
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => {
                setShowBookingForm(false);
                setShowFeedbackForm(false);
                setShowQuoteForm(false);
                setShowReviewForm(false);
                setShowCustomerSearch(false);
              }}
              className="mr-1"
            >
              <ArrowLeft className="w-4 h-4" />
            </Button>
          )}
          <Bot className="w-5 h-5 text-primary" />
          <span className="font-medium">
            {showBookingForm ? 'Book New Appointment' : showFeedbackForm ? 'Customer Follow Up' : showQuoteForm ? 'Create Quote' : showReviewForm ? 'Request Review' : showCustomerSearch ? 'Look Up Customer' : 'Booking AI Assistant'}
          </span>
          {!showBookingForm && !showFeedbackForm && !showQuoteForm && !showReviewForm && !showCustomerSearch && currentAgent && (
            <Badge variant="outline" className="text-xs">
              {getAgentStyle(currentAgent).label}
            </Badge>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="secondary" className="text-xs">
            {todayAppointments.length} today
          </Badge>
        </div>
      </div>

      {/* Booking Form View */}
      {showBookingForm ? (
        <div className="flex-1 overflow-auto p-4">
          <BookingForm
            services={services}
            onSubmit={handleBookingSubmit}
            isLoading={isSubmittingBooking}
          />
        </div>
      ) : showFeedbackForm ? (
        <div className="flex-1 overflow-auto p-4">
          <FeedbackForm
            onSubmit={handleFeedbackSubmit}
            isLoading={isSubmittingFeedback}
          />
        </div>
      ) : showQuoteForm ? (
        <div className="flex-1 overflow-auto p-4">
          <QuoteForm
            services={services}
            onSubmit={handleQuoteSubmit}
          />
        </div>
      ) : showReviewForm ? (
        <div className="flex-1 overflow-auto p-4">
          <ReviewForm
            onSubmit={handleReviewSubmit}
            isLoading={isSubmittingReview}
            reviewLinks={reviewLinks}
          />
        </div>
      ) : showCustomerSearch ? (
        <div className="flex-1 overflow-auto p-4">
          <div className="space-y-4">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleCustomerSearch();
              }}
              className="flex gap-2"
            >
              <Input
                value={customerSearchQuery}
                onChange={(e) => setCustomerSearchQuery(e.target.value)}
                placeholder="Search by name, phone, or email..."
                className="flex-1"
              />
              <Button type="submit" disabled={isSearching || !customerSearchQuery.trim()}>
                {isSearching ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
              </Button>
            </form>
            
            {customerSearchResults.length > 0 ? (
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">{customerSearchResults.length} result(s) found</p>
                {customerSearchResults.map((apt) => (
                  <Card key={apt.id} className="hover:bg-accent/50 transition-colors">
                    <CardContent className="p-3">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <p className="font-medium">{apt.customer_name}</p>
                          <div className="text-sm text-muted-foreground space-y-0.5">
                            {apt.customer_phone && <p>{apt.customer_phone}</p>}
                            {apt.customer_email && <p className="truncate">{apt.customer_email}</p>}
                            {apt.customer_address && <p className="truncate">{apt.customer_address}</p>}
                          </div>
                        </div>
                        <div className="text-right shrink-0">
                          <Badge variant={apt.status === 'completed' ? 'secondary' : apt.status === 'cancelled' ? 'destructive' : 'default'} className="text-xs mb-1">
                            {apt.status}
                          </Badge>
                          <p className="text-xs text-muted-foreground">{apt.service_type}</p>
                          <p className="text-xs font-medium">{format(new Date(apt.datetime), 'MMM d, yyyy')}</p>
                          <p className="text-xs text-muted-foreground">{format(new Date(apt.datetime), 'h:mm a')}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : customerSearchQuery && !isSearching ? (
              <div className="text-center py-8 text-muted-foreground">
                <Search className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p>No results found for "{customerSearchQuery}"</p>
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <Search className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p>Enter a name, phone, or email to search</p>
              </div>
            )}
          </div>
        </div>
      ) : (
        <>
          {/* Quick Actions */}
          <div className="px-4 py-3 border-b border-border bg-muted/30">
            <div className="flex flex-wrap gap-2">
              {QUICK_ACTIONS.map((action) => (
                <Button
                  key={action.id}
                  variant={action.variant || 'outline'}
                  size="sm"
                  onClick={() => handleQuickAction(action)}
                  className="text-xs"
                >
                  <action.icon className="w-3 h-3 mr-1" />
                  {action.label}
                </Button>
              ))}
            </div>
          </div>

          {/* Appointment Selector Modal */}
          {showAppointmentSelector && (
            <div className="px-4 py-3 border-b border-border bg-muted/50">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">
                  Select Appointment to {selectorAction === 'reschedule' ? 'Reschedule' : 'Cancel'}
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setShowAppointmentSelector(false);
                    setSelectorAction(null);
                  }}
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
              <ScrollArea className="h-48">
                <div className="space-y-2">
                  {recentAppointments.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-4">No appointments found</p>
                  ) : (
                    recentAppointments.map((apt) => (
                      <Card
                        key={apt.id}
                        className="cursor-pointer hover:bg-accent transition-colors"
                        onClick={() => handleSelectAppointment(apt)}
                      >
                        <CardContent className="p-3">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="font-medium text-sm">{apt.customer_name}</p>
                              <p className="text-xs text-muted-foreground">{apt.service_type}</p>
                            </div>
                            <div className="text-right">
                              <p className="text-xs font-medium">{format(new Date(apt.datetime), 'MMM d')}</p>
                              <p className="text-xs text-muted-foreground">{format(new Date(apt.datetime), 'h:mm a')}</p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))
                  )}
                </div>
              </ScrollArea>
            </div>
          )}

          {/* Messages */}
          <ScrollArea ref={scrollRef} className="flex-1 p-4">
            <div className="space-y-4">
              {messages.length === 0 ? (
                <div className="text-center py-12">
                  <Bot className="w-12 h-12 mx-auto text-muted-foreground mb-3" />
                  <h3 className="font-medium mb-1">Booking AI Assistant</h3>
                  <p className="text-sm text-muted-foreground">
                    Use the quick actions above or type a message to get started
                  </p>
                </div>
              ) : (
                messages.map((msg, index) => renderMessage(msg, index))
              )}
              {isLoading && (
                <div className="flex gap-2 justify-start">
                  <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center">
                    <Bot className="w-4 h-4 text-primary" />
                  </div>
                  <div className="bg-muted rounded-2xl rounded-bl-md px-3 py-2">
                    <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
                  </div>
                </div>
              )}
            </div>
          </ScrollArea>

          {/* Input */}
          <div className="p-4 border-t border-border">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSend();
              }}
              className="flex gap-2"
            >
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => {
                  setShowBookingForm(false);
                  setShowFeedbackForm(false);
                  setShowQuoteForm(false);
                  setShowReviewForm(false);
                  setShowCustomerSearch(false);
                  setShowAppointmentSelector(false);
                  setSelectorAction(null);
                }}
                className="shrink-0"
                title="Back to Home"
              >
                <Home className="w-4 h-4" />
              </Button>
              <Input
                ref={inputRef}
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder="Type a message or use quick actions..."
                disabled={isLoading}
                className="flex-1"
              />
              <Button type="submit" disabled={isLoading || !inputValue.trim()}>
                <Send className="w-4 h-4" />
              </Button>
            </form>
          </div>
        </>
      )}
    </div>
  );
}
