import { useState, useEffect } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Calendar } from '@/components/ui/calendar';
import { parseUTCDateTime } from '@/lib/dateUtils';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { format, addDays, setHours, setMinutes, isBefore } from 'date-fns';
import { Calendar as CalendarIcon, Clock, MapPin, User, Phone, Mail, XCircle, CalendarCheck, Loader2, CheckCircle, AlertTriangle, Bell, BellOff, MessageSquare } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';

interface Appointment {
  id: string;
  customer_name: string;
  customer_email: string | null;
  customer_phone: string | null;
  service_type: string;
  datetime: string;
  duration_minutes: number;
  status: string;
  notes: string | null;
  customer_token: string;
  sms_opt_out: boolean;
  email_opt_out: boolean;
  call_opt_out: boolean;
  delivery_type: string | null;
  meeting_link: string | null;
  companies: {
    id: string;
    name: string;
    primary_color: string | null;
    logo_url: string | null;
  } | null;
}

export default function CustomerPortal() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  
  const [appointment, setAppointment] = useState<Appointment | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [rescheduleDialogOpen, setRescheduleDialogOpen] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [preferencesLoading, setPreferencesLoading] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [selectedTime, setSelectedTime] = useState<string>('');

  useEffect(() => {
    if (token) {
      fetchAppointment();
    } else {
      setError('No appointment token provided');
      setLoading(false);
    }
  }, [token]);

  const fetchAppointment = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('customer-portal', {
        body: { action: 'get', token }
      });

      if (error) throw error;
      if (data.error) throw new Error(data.error);

      setAppointment(data.appointment);
    } catch (err) {
      console.error('Failed to fetch appointment:', err);
      setError(err instanceof Error ? err.message : 'Failed to load appointment');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = async () => {
    setActionLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('customer-portal', {
        body: { action: 'cancel', token }
      });

      if (error) throw error;
      if (data.error) throw new Error(data.error);

      toast.success('Appointment cancelled successfully');
      setAppointment(prev => prev ? { ...prev, status: 'cancelled' } : null);
      setCancelDialogOpen(false);
    } catch (err) {
      console.error('Failed to cancel appointment:', err);
      toast.error(err instanceof Error ? err.message : 'Failed to cancel appointment');
    } finally {
      setActionLoading(false);
    }
  };

  const handleReschedule = async () => {
    if (!selectedDate || !selectedTime) {
      toast.error('Please select a date and time');
      return;
    }

    const [hours, minutes] = selectedTime.split(':').map(Number);
    const newDatetime = setMinutes(setHours(selectedDate, hours), minutes);

    if (isBefore(newDatetime, new Date())) {
      toast.error('Please select a future date and time');
      return;
    }

    setActionLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('customer-portal', {
        body: { action: 'reschedule', token, newDatetime: newDatetime.toISOString() }
      });

      if (error) throw error;
      if (data.error) throw new Error(data.error);

      toast.success('Appointment rescheduled successfully');
      setAppointment(prev => prev ? { ...prev, datetime: newDatetime.toISOString(), status: 'scheduled' } : null);
      setRescheduleDialogOpen(false);
    } catch (err) {
      console.error('Failed to reschedule appointment:', err);
      toast.error(err instanceof Error ? err.message : 'Failed to reschedule appointment');
    } finally {
      setActionLoading(false);
    }
  };

  const handleUpdatePreferences = async (field: 'sms_opt_out' | 'email_opt_out' | 'call_opt_out', value: boolean) => {
    setPreferencesLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('customer-portal', {
        body: { action: 'update-preferences', token, preferences: { [field]: value } }
      });

      if (error) throw error;
      if (data.error) throw new Error(data.error);

      setAppointment(prev => prev ? { ...prev, [field]: value } : null);
      toast.success('Notification preferences updated');
    } catch (err) {
      console.error('Failed to update preferences:', err);
      toast.error(err instanceof Error ? err.message : 'Failed to update preferences');
    } finally {
      setPreferencesLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'scheduled':
        return <Badge className="bg-blue-500/10 text-blue-600 border-blue-500/30">Scheduled</Badge>;
      case 'completed':
        return <Badge className="bg-green-500/10 text-green-600 border-green-500/30">Completed</Badge>;
      case 'cancelled':
        return <Badge className="bg-red-500/10 text-red-600 border-red-500/30">Cancelled</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const timeSlots = [
    '09:00', '09:30', '10:00', '10:30', '11:00', '11:30',
    '12:00', '12:30', '13:00', '13:30', '14:00', '14:30',
    '15:00', '15:30', '16:00', '16:30', '17:00'
  ];

  const primaryColor = appointment?.companies?.primary_color || '#0EA5E9';

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="w-full max-w-lg">
          <CardHeader>
            <Skeleton className="h-8 w-48 mb-2" />
            <Skeleton className="h-4 w-64" />
          </CardHeader>
          <CardContent className="space-y-4">
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-20 w-full" />
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error || !appointment) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="w-full max-w-lg text-center">
          <CardHeader>
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-destructive/10 flex items-center justify-center">
              <AlertTriangle className="w-8 h-8 text-destructive" />
            </div>
            <CardTitle>Appointment Not Found</CardTitle>
            <CardDescription>
              {error || 'We couldn\'t find this appointment. The link may be invalid or expired.'}
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  const appointmentDate = parseUTCDateTime(appointment.datetime);
  const isPast = isBefore(appointmentDate, new Date());
  const canModify = appointment.status === 'scheduled' && !isPast;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div 
        className="w-full py-8 px-4"
        style={{ background: `linear-gradient(135deg, ${primaryColor}, ${primaryColor}dd)` }}
      >
        <div className="max-w-lg mx-auto text-center text-white">
          {appointment.companies?.logo_url ? (
            <img 
              src={appointment.companies.logo_url} 
              alt={appointment.companies.name} 
              className="h-12 mx-auto mb-4 object-contain"
            />
          ) : (
            <h1 className="text-2xl font-bold mb-2">{appointment.companies?.name || 'Appointment'}</h1>
          )}
          <p className="opacity-90">Manage Your Appointment</p>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-lg mx-auto p-4 -mt-8">
        <Card className="shadow-lg">
          <CardHeader>
            <div className="flex items-start justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <CalendarCheck className="w-5 h-5" />
                  {appointment.service_type}
                </CardTitle>
                <CardDescription className="mt-1">
                  Booking for {appointment.customer_name}
                </CardDescription>
              </div>
              {getStatusBadge(appointment.status)}
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Appointment Details */}
            <div className="space-y-4 p-4 rounded-lg bg-muted/50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <CalendarIcon className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="font-medium">{format(appointmentDate, 'EEEE, MMMM d, yyyy')}</p>
                  <p className="text-sm text-muted-foreground">Date</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Clock className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="font-medium">{format(appointmentDate, 'h:mm a')}</p>
                  <p className="text-sm text-muted-foreground">{appointment.duration_minutes} minutes</p>
                </div>
              </div>

              {/* Join Meeting button for virtual appointments */}
              {appointment.meeting_link && appointment.status === 'scheduled' && (
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-green-500/10 flex items-center justify-center">
                    <CalendarCheck className="w-5 h-5 text-green-600" />
                  </div>
                  <div className="flex-1">
                    <a
                      href={appointment.meeting_link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground font-medium text-sm hover:opacity-90 transition-opacity"
                    >
                      Join Video Session
                    </a>
                    <p className="text-sm text-muted-foreground mt-1">Virtual appointment</p>
                  </div>
                </div>
              )}

              {appointment.delivery_type === 'virtual' && !appointment.meeting_link && appointment.status === 'scheduled' && (
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
                    <Phone className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="font-medium">Phone Session</p>
                    <p className="text-sm text-muted-foreground">We will call you at your scheduled time</p>
                  </div>
                </div>
              )}

              {appointment.customer_email && (
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Mail className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium">{appointment.customer_email}</p>
                    <p className="text-sm text-muted-foreground">Email</p>
                  </div>
                </div>
              )}

              {appointment.customer_phone && (
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Phone className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium">{appointment.customer_phone}</p>
                    <p className="text-sm text-muted-foreground">Phone</p>
                  </div>
                </div>
              )}
            </div>

            {/* Notification Preferences Summary */}
            {appointment.status === 'scheduled' && !isPast && (
              <div className="flex flex-wrap items-center gap-2 p-3 rounded-lg bg-muted/30 border border-border/50">
                <span className="text-xs font-medium text-muted-foreground mr-1">Reminders:</span>
                {appointment.customer_phone && (
                  <>
                    <Badge 
                      variant={appointment.sms_opt_out ? "outline" : "secondary"}
                      className={cn(
                        "text-xs gap-1",
                        appointment.sms_opt_out ? "opacity-50" : "bg-green-500/10 text-green-600 border-green-500/30"
                      )}
                    >
                      <MessageSquare className="w-3 h-3" />
                      SMS {appointment.sms_opt_out ? "Off" : "On"}
                    </Badge>
                    <Badge 
                      variant={appointment.call_opt_out ? "outline" : "secondary"}
                      className={cn(
                        "text-xs gap-1",
                        appointment.call_opt_out ? "opacity-50" : "bg-green-500/10 text-green-600 border-green-500/30"
                      )}
                    >
                      <Phone className="w-3 h-3" />
                      Call {appointment.call_opt_out ? "Off" : "On"}
                    </Badge>
                  </>
                )}
                {appointment.customer_email && (
                  <Badge 
                    variant={appointment.email_opt_out ? "outline" : "secondary"}
                    className={cn(
                      "text-xs gap-1",
                      appointment.email_opt_out ? "opacity-50" : "bg-green-500/10 text-green-600 border-green-500/30"
                    )}
                  >
                    <Mail className="w-3 h-3" />
                    Email {appointment.email_opt_out ? "Off" : "On"}
                  </Badge>
                )}
              </div>
            )}

            {/* Notification Preferences */}
            {appointment.status === 'scheduled' && !isPast && (
              <div className="space-y-3 p-4 rounded-lg border bg-card">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Bell className="w-4 h-4 text-muted-foreground" />
                    <h4 className="font-medium text-sm">Reminder Preferences</h4>
                  </div>
                  {preferencesLoading && <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />}
                </div>

                {/* Show re-subscribe banner if any channel is opted out */}
                {(appointment.sms_opt_out || appointment.email_opt_out || appointment.call_opt_out) && (
                  <div className="flex items-center gap-2 p-3 rounded-md bg-amber-500/10 border border-amber-500/20 mb-3">
                    <BellOff className="w-4 h-4 text-amber-600 shrink-0" />
                    <p className="text-xs text-amber-700">
                      Some reminders are turned off. Toggle them on below to re-subscribe.
                    </p>
                  </div>
                )}
                
                {appointment.customer_phone && (
                  <>
                    <div className={cn(
                      "flex items-center justify-between p-3 rounded-md transition-colors",
                      appointment.sms_opt_out ? "bg-muted/50" : "bg-green-500/5"
                    )}>
                      <div className="flex items-center gap-2">
                        <MessageSquare className={cn(
                          "w-4 h-4",
                          appointment.sms_opt_out ? "text-muted-foreground" : "text-green-600"
                        )} />
                        <div>
                          <Label htmlFor="sms-reminders" className="text-sm cursor-pointer">
                            SMS Reminders
                          </Label>
                          {appointment.sms_opt_out && (
                            <p className="text-xs text-muted-foreground">Currently unsubscribed</p>
                          )}
                        </div>
                      </div>
                      <Switch
                        id="sms-reminders"
                        checked={!appointment.sms_opt_out}
                        onCheckedChange={(checked) => handleUpdatePreferences('sms_opt_out', !checked)}
                        disabled={preferencesLoading}
                      />
                    </div>
                    
                    <div className={cn(
                      "flex items-center justify-between p-3 rounded-md transition-colors",
                      appointment.call_opt_out ? "bg-muted/50" : "bg-green-500/5"
                    )}>
                      <div className="flex items-center gap-2">
                        <Phone className={cn(
                          "w-4 h-4",
                          appointment.call_opt_out ? "text-muted-foreground" : "text-green-600"
                        )} />
                        <div>
                          <Label htmlFor="call-reminders" className="text-sm cursor-pointer">
                            Voice Call Reminders
                          </Label>
                          {appointment.call_opt_out && (
                            <p className="text-xs text-muted-foreground">Currently unsubscribed</p>
                          )}
                        </div>
                      </div>
                      <Switch
                        id="call-reminders"
                        checked={!appointment.call_opt_out}
                        onCheckedChange={(checked) => handleUpdatePreferences('call_opt_out', !checked)}
                        disabled={preferencesLoading}
                      />
                    </div>
                  </>
                )}
                
                {appointment.customer_email && (
                  <div className={cn(
                    "flex items-center justify-between p-3 rounded-md transition-colors",
                    appointment.email_opt_out ? "bg-muted/50" : "bg-green-500/5"
                  )}>
                    <div className="flex items-center gap-2">
                      <Mail className={cn(
                        "w-4 h-4",
                        appointment.email_opt_out ? "text-muted-foreground" : "text-green-600"
                      )} />
                      <div>
                        <Label htmlFor="email-reminders" className="text-sm cursor-pointer">
                          Email Reminders
                        </Label>
                        {appointment.email_opt_out && (
                          <p className="text-xs text-muted-foreground">Currently unsubscribed</p>
                        )}
                      </div>
                    </div>
                    <Switch
                      id="email-reminders"
                      checked={!appointment.email_opt_out}
                      onCheckedChange={(checked) => handleUpdatePreferences('email_opt_out', !checked)}
                      disabled={preferencesLoading}
                    />
                  </div>
                )}
                
                <p className="text-xs text-muted-foreground mt-2">
                  Toggle to subscribe or unsubscribe from reminder notifications.
                </p>
              </div>
            )}

            {/* Status Messages */}
            {appointment.status === 'cancelled' && (
              <div className="flex items-center gap-3 p-4 rounded-lg bg-destructive/10 text-destructive">
                <XCircle className="w-5 h-5" />
                <p className="text-sm">This appointment has been cancelled.</p>
              </div>
            )}

            {appointment.status === 'completed' && (
              <div className="flex items-center gap-3 p-4 rounded-lg bg-green-500/10 text-green-600">
                <CheckCircle className="w-5 h-5" />
                <p className="text-sm">This appointment has been completed. Thank you!</p>
              </div>
            )}

            {isPast && appointment.status === 'scheduled' && (
              <div className="flex items-center gap-3 p-4 rounded-lg bg-orange-500/10 text-orange-600">
                <AlertTriangle className="w-5 h-5" />
                <p className="text-sm">This appointment time has passed.</p>
              </div>
            )}

            {/* Actions */}
            {canModify && (
              <div className="flex gap-3">
                <Button 
                  variant="outline" 
                  className="flex-1"
                  onClick={() => setRescheduleDialogOpen(true)}
                >
                  <CalendarIcon className="w-4 h-4 mr-2" />
                  Reschedule
                </Button>
                <Button 
                  variant="destructive" 
                  className="flex-1"
                  onClick={() => setCancelDialogOpen(true)}
                >
                  <XCircle className="w-4 h-4 mr-2" />
                  Cancel
                </Button>
              </div>
            )}

            {/* Company Contact */}
            <p className="text-xs text-center text-muted-foreground">
              Need help? Contact {appointment.companies?.name || 'us'} directly.
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Cancel Dialog */}
      <AlertDialog open={cancelDialogOpen} onOpenChange={setCancelDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cancel Appointment</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to cancel your {appointment.service_type} appointment on {format(appointmentDate, 'MMMM d, yyyy')} at {format(appointmentDate, 'h:mm a')}?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Keep Appointment</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleCancel}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={actionLoading}
            >
              {actionLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Cancelling...
                </>
              ) : (
                'Yes, Cancel'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Reschedule Dialog */}
      <Dialog open={rescheduleDialogOpen} onOpenChange={setRescheduleDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Reschedule Appointment</DialogTitle>
            <DialogDescription>
              Select a new date and time for your appointment.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 pt-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Select Date</label>
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={setSelectedDate}
                disabled={(date) => isBefore(date, addDays(new Date(), -1))}
                className="rounded-md border"
              />
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Select Time</label>
              <Select value={selectedTime} onValueChange={setSelectedTime}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose a time" />
                </SelectTrigger>
                <SelectContent>
                  {timeSlots.map((time) => (
                    <SelectItem key={time} value={time}>
                      {format(setMinutes(setHours(new Date(), parseInt(time.split(':')[0])), parseInt(time.split(':')[1])), 'h:mm a')}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex gap-3 pt-4">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => setRescheduleDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button
                className="flex-1"
                onClick={handleReschedule}
                disabled={actionLoading || !selectedDate || !selectedTime}
              >
                {actionLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  'Confirm Reschedule'
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
