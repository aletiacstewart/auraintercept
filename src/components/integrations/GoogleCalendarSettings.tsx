import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { Calendar, Check, Loader2, Unlink, RefreshCw, Plus, Palette, Pencil, Clock, Trash2, AlertCircle, Share2, Globe, Lock, Users, X, Bell, Mail } from 'lucide-react';
import { cn } from '@/lib/utils';
import { format, formatDistanceToNow } from 'date-fns';

interface GoogleCalendar {
  id: string;
  summary: string;
  primary: boolean;
  backgroundColor?: string;
}

interface SharedUser {
  email: string;
  role: string;
  id: string;
}

interface SharingSettings {
  isPublic: boolean;
  publicRole: string;
  sharedUsers: SharedUser[];
}

interface Reminder {
  method: 'email' | 'popup';
  minutes: number;
}

interface NotificationSettings {
  defaultReminders: Reminder[];
}

// Google Calendar supported colors
const CALENDAR_COLORS = [
  { id: '1', color: '#ac725e', name: 'Cocoa' },
  { id: '2', color: '#d06b64', name: 'Flamingo' },
  { id: '3', color: '#f83a22', name: 'Tomato' },
  { id: '4', color: '#fa573c', name: 'Tangerine' },
  { id: '5', color: '#ff7537', name: 'Pumpkin' },
  { id: '6', color: '#ffad46', name: 'Mango' },
  { id: '7', color: '#42d692', name: 'Eucalyptus' },
  { id: '8', color: '#16a765', name: 'Basil' },
  { id: '9', color: '#7bd148', name: 'Pistachio' },
  { id: '10', color: '#b3dc6c', name: 'Avocado' },
  { id: '11', color: '#fbe983', name: 'Citron' },
  { id: '12', color: '#fad165', name: 'Banana' },
  { id: '13', color: '#92e1c0', name: 'Sage' },
  { id: '14', color: '#9fe1e7', name: 'Peacock' },
  { id: '15', color: '#9fc6e7', name: 'Cobalt' },
  { id: '16', color: '#4986e7', name: 'Blueberry' },
  { id: '17', color: '#9a9cff', name: 'Lavender' },
  { id: '18', color: '#b99aff', name: 'Wisteria' },
  { id: '19', color: '#c2c2c2', name: 'Graphite' },
  { id: '20', color: '#cabdbf', name: 'Birch' },
  { id: '21', color: '#cca6ac', name: 'Cherry Blossom' },
  { id: '22', color: '#f691b2', name: 'Grape' },
  { id: '23', color: '#cd74e6', name: 'Amethyst' },
  { id: '24', color: '#a47ae2', name: 'Violet' },
];

export function GoogleCalendarSettings() {
  const { companyId } = useAuth();
  const queryClient = useQueryClient();
  const [disconnectDialogOpen, setDisconnectDialogOpen] = useState(false);
  const [createCalendarDialogOpen, setCreateCalendarDialogOpen] = useState(false);
  const [changeColorDialogOpen, setChangeColorDialogOpen] = useState(false);
  const [renameDialogOpen, setRenameDialogOpen] = useState(false);
  const [deleteCalendarDialogOpen, setDeleteCalendarDialogOpen] = useState(false);
  const [sharingDialogOpen, setSharingDialogOpen] = useState(false);
  const [notificationsDialogOpen, setNotificationsDialogOpen] = useState(false);
  const [newShareEmail, setNewShareEmail] = useState('');
  const [newShareRole, setNewShareRole] = useState<'reader' | 'writer'>('reader');
  const [pendingReminders, setPendingReminders] = useState<Reminder[]>([]);
  const [selectedColor, setSelectedColor] = useState(CALENDAR_COLORS[7].color); // Default to Basil green
  const [newCalendarName, setNewCalendarName] = useState('');

  // Fetch current Google Calendar connection status
  const { data: integration, isLoading } = useQuery({
    queryKey: ['google-calendar-integration', companyId],
    queryFn: async () => {
      if (!companyId) return null;
      const { data, error } = await supabase
        .from('tenant_integrations')
        .select('google_calendar_enabled, google_calendar_id, google_refresh_token')
        .eq('company_id', companyId)
        .maybeSingle();
      if (error && error.code !== 'PGRST116') throw error;
      return data;
    },
    enabled: !!companyId,
  });

  const isConnected = !!integration?.google_refresh_token && integration?.google_calendar_enabled;

  // Handle OAuth redirect results (keeps the flow "one-click" for companies)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const connected = params.get('gc') === 'connected';
    const error = params.get('gc_error');

    if (!connected && !error) return;

    if (connected) {
      toast.success('Google Calendar connected');
      queryClient.invalidateQueries({ queryKey: ['google-calendar-integration'] });
      queryClient.invalidateQueries({ queryKey: ['google-calendars'] });
    }

    if (error) {
      toast.error('Google Calendar connection failed');
    }

    params.delete('gc');
    params.delete('gc_error');
    const next = `${window.location.pathname}${params.toString() ? `?${params.toString()}` : ''}${window.location.hash}`;
    window.history.replaceState({}, '', next);
  }, [queryClient]);

  // Fetch available calendars when connected
  const { data: calendarsData, isLoading: calendarsLoading } = useQuery({
    queryKey: ['google-calendars', companyId],
    queryFn: async () => {
      if (!companyId) return null;
      const { data, error } = await supabase.functions.invoke('google-calendar-auth', {
        body: {
          action: 'list_calendars',
          companyId,
        },
      });
      if (error) throw error;
      return data as { calendars: GoogleCalendar[] };
    },
    enabled: isConnected,
  });

  // Fetch last sync timestamp and count
  const { data: syncStats } = useQuery({
    queryKey: ['google-calendar-sync-stats', companyId],
    queryFn: async () => {
      if (!companyId) return null;
      const { data, error, count } = await supabase
        .from('calendar_event_mappings')
        .select('last_synced_at', { count: 'exact' })
        .eq('company_id', companyId)
        .eq('sync_status', 'synced')
        .order('last_synced_at', { ascending: false })
        .limit(1);
      if (error && error.code !== 'PGRST116') throw error;
      return {
        lastSyncedAt: data?.[0]?.last_synced_at,
        totalSynced: count || 0
      };
    },
    enabled: isConnected,
  });

  // Fetch sharing settings
  const { data: sharingSettings, isLoading: sharingLoading } = useQuery({
    queryKey: ['google-calendar-sharing', companyId, integration?.google_calendar_id],
    queryFn: async () => {
      if (!companyId || !integration?.google_calendar_id) return null;
      const { data, error } = await supabase.functions.invoke('google-calendar-auth', {
        body: {
          action: 'get_sharing',
          companyId,
          calendarId: integration.google_calendar_id,
        },
      });
      if (error) throw error;
      return data as SharingSettings;
    },
    enabled: isConnected && !!integration?.google_calendar_id,
  });

  // Fetch notification settings
  const { data: notificationSettings, isLoading: notificationsLoading } = useQuery({
    queryKey: ['google-calendar-notifications', companyId, integration?.google_calendar_id],
    queryFn: async () => {
      if (!companyId || !integration?.google_calendar_id) return null;
      const { data, error } = await supabase.functions.invoke('google-calendar-auth', {
        body: {
          action: 'get_notifications',
          companyId,
          calendarId: integration.google_calendar_id,
        },
      });
      if (error) throw error;
      return data as NotificationSettings;
    },
    enabled: isConnected && !!integration?.google_calendar_id,
  });

  // Fetch failed syncs
  const { data: failedSyncs } = useQuery({
    queryKey: ['google-calendar-failed-syncs', companyId],
    queryFn: async () => {
      if (!companyId) return [];
      const { data, error } = await supabase
        .from('calendar_event_mappings')
        .select('id, appointment_id, last_synced_at')
        .eq('company_id', companyId)
        .eq('sync_status', 'failed')
        .order('last_synced_at', { ascending: false })
        .limit(10);
      if (error && error.code !== 'PGRST116') throw error;
      return data || [];
    },
    enabled: isConnected,
  });

  // Connect to Google Calendar
  const connectMutation = useMutation({
    mutationFn: async () => {
      if (!companyId) throw new Error('No company ID');

      // Where to return after Google finishes (this page)
      const returnTo = `${window.location.origin}/dashboard/integrations`;

      const { data, error } = await supabase.functions.invoke('google-calendar-auth', {
        body: {
          action: 'get_auth_url',
          companyId,
          returnTo,
        },
      });

      if (error) throw error;
      if (!data?.authUrl) throw new Error('Failed to get auth URL');

      // Redirect to Google OAuth
      window.location.href = data.authUrl;
    },
    onError: (error) => {
      console.error('Failed to initiate Google Calendar connection:', error);
      toast.error('Failed to start Google Calendar connection.');
    },
  });

  // Select calendar
  const selectCalendarMutation = useMutation({
    mutationFn: async (calendarId: string) => {
      if (!companyId) throw new Error('No company ID');
      
      const { error } = await supabase.functions.invoke('google-calendar-auth', {
        body: {
          action: 'select_calendar',
          companyId,
          calendarId,
        },
      });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['google-calendar-integration'] });
      toast.success('Calendar updated');
    },
    onError: (error) => {
      console.error('Failed to update calendar:', error);
      toast.error('Failed to update calendar selection');
    },
  });

  // Create dedicated calendar
  const createCalendarMutation = useMutation({
    mutationFn: async (color: string) => {
      if (!companyId) throw new Error('No company ID');
      
      const { data, error } = await supabase.functions.invoke('google-calendar-auth', {
        body: {
          action: 'create_calendar',
          companyId,
          calendarColor: color,
        },
      });

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['google-calendar-integration'] });
      queryClient.invalidateQueries({ queryKey: ['google-calendars'] });
      setCreateCalendarDialogOpen(false);
      toast.success(`Created calendar: ${data?.calendar?.summary || 'Appointments'}`);
    },
    onError: (error) => {
      console.error('Failed to create calendar:', error);
      toast.error('Failed to create dedicated calendar');
    },
  });

  // Change calendar color
  const changeColorMutation = useMutation({
    mutationFn: async (color: string) => {
      if (!companyId || !integration?.google_calendar_id) throw new Error('No calendar selected');
      
      const { data, error } = await supabase.functions.invoke('google-calendar-auth', {
        body: {
          action: 'change_color',
          companyId,
          calendarId: integration.google_calendar_id,
          calendarColor: color,
        },
      });

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['google-calendars'] });
      setChangeColorDialogOpen(false);
      toast.success('Calendar color updated');
    },
    onError: (error) => {
      console.error('Failed to change color:', error);
      toast.error('Failed to change calendar color');
    },
  });

  // Rename calendar
  const renameCalendarMutation = useMutation({
    mutationFn: async (name: string) => {
      if (!companyId || !integration?.google_calendar_id) throw new Error('No calendar selected');
      
      const { data, error } = await supabase.functions.invoke('google-calendar-auth', {
        body: {
          action: 'rename_calendar',
          companyId,
          calendarId: integration.google_calendar_id,
          calendarName: name,
        },
      });

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['google-calendars'] });
      setRenameDialogOpen(false);
      setNewCalendarName('');
      toast.success('Calendar renamed');
    },
    onError: (error) => {
      console.error('Failed to rename calendar:', error);
      toast.error('Failed to rename calendar');
    },
  });

  // Delete calendar
  const deleteCalendarMutation = useMutation({
    mutationFn: async () => {
      if (!companyId || !integration?.google_calendar_id) throw new Error('No calendar selected');
      
      const { data, error } = await supabase.functions.invoke('google-calendar-auth', {
        body: {
          action: 'delete_calendar',
          companyId,
          calendarId: integration.google_calendar_id,
        },
      });

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['google-calendars'] });
      queryClient.invalidateQueries({ queryKey: ['google-calendar-integration'] });
      queryClient.invalidateQueries({ queryKey: ['google-calendar-sync-stats'] });
      setDeleteCalendarDialogOpen(false);
      toast.success('Calendar deleted');
    },
    onError: (error: any) => {
      console.error('Failed to delete calendar:', error);
      toast.error(error?.message || 'Failed to delete calendar. You can only delete calendars you created.');
    },
  });

  const disconnectMutation = useMutation({
    mutationFn: async () => {
      if (!companyId) throw new Error('No company ID');
      
      const { error } = await supabase.functions.invoke('google-calendar-auth', {
        body: {
          action: 'disconnect',
          companyId,
        },
      });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['google-calendar-integration'] });
      queryClient.invalidateQueries({ queryKey: ['google-calendars'] });
      toast.success('Google Calendar disconnected');
      setDisconnectDialogOpen(false);
    },
    onError: (error) => {
      console.error('Failed to disconnect Google Calendar:', error);
      toast.error('Failed to disconnect Google Calendar');
    },
  });

  // Sync all appointments to Google Calendar
  const syncAllMutation = useMutation({
    mutationFn: async () => {
      if (!companyId) throw new Error('No company ID');
      
      const { data, error } = await supabase.functions.invoke('google-calendar-sync', {
        body: {
          action: 'full_sync',
          companyId,
        },
      });

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['google-calendar-sync-stats'] });
      toast.success(`Synced ${data?.synced || 0} appointments to Google Calendar`);
    },
    onError: (error) => {
      console.error('Failed to sync appointments:', error);
      toast.error('Failed to sync appointments to Google Calendar');
    },
  });

  // Retry failed syncs
  const retryFailedMutation = useMutation({
    mutationFn: async () => {
      if (!companyId) throw new Error('No company ID');
      
      const { data, error } = await supabase.functions.invoke('google-calendar-sync', {
        body: {
          action: 'retry_failed',
          companyId,
        },
      });

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['google-calendar-sync-stats'] });
      queryClient.invalidateQueries({ queryKey: ['google-calendar-failed-syncs'] });
      toast.success(`Retried ${data?.retried || 0} failed syncs`);
    },
    onError: (error) => {
      console.error('Failed to retry syncs:', error);
      toast.error('Failed to retry failed syncs');
    },
  });

  // Update visibility (public/private)
  const updateVisibilityMutation = useMutation({
    mutationFn: async (visibility: 'private' | 'public' | 'freeBusy') => {
      if (!companyId || !integration?.google_calendar_id) throw new Error('No calendar selected');
      
      const { data, error } = await supabase.functions.invoke('google-calendar-auth', {
        body: {
          action: 'update_sharing',
          companyId,
          calendarId: integration.google_calendar_id,
          visibility,
        },
      });

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['google-calendar-sharing'] });
      toast.success('Calendar visibility updated');
    },
    onError: (error) => {
      console.error('Failed to update visibility:', error);
      toast.error('Failed to update calendar visibility');
    },
  });

  // Share with user
  const shareWithUserMutation = useMutation({
    mutationFn: async ({ email, role }: { email: string; role: string }) => {
      if (!companyId || !integration?.google_calendar_id) throw new Error('No calendar selected');
      
      const { data, error } = await supabase.functions.invoke('google-calendar-auth', {
        body: {
          action: 'update_sharing',
          companyId,
          calendarId: integration.google_calendar_id,
          shareEmail: email,
          shareRole: role,
        },
      });

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['google-calendar-sharing'] });
      setNewShareEmail('');
      setNewShareRole('reader');
      toast.success('Calendar shared successfully');
    },
    onError: (error) => {
      console.error('Failed to share calendar:', error);
      toast.error('Failed to share calendar');
    },
  });

  // Remove sharing
  const removeSharingMutation = useMutation({
    mutationFn: async (ruleId: string) => {
      if (!companyId || !integration?.google_calendar_id) throw new Error('No calendar selected');
      
      const { data, error } = await supabase.functions.invoke('google-calendar-auth', {
        body: {
          action: 'update_sharing',
          companyId,
          calendarId: integration.google_calendar_id,
          removeRuleId: ruleId,
        },
      });

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['google-calendar-sharing'] });
      toast.success('Access removed');
    },
    onError: (error) => {
      console.error('Failed to remove sharing:', error);
      toast.error('Failed to remove access');
    },
  });

  // Update notification settings
  const updateNotificationsMutation = useMutation({
    mutationFn: async (reminders: Reminder[]) => {
      if (!companyId || !integration?.google_calendar_id) throw new Error('No calendar selected');
      
      const { data, error } = await supabase.functions.invoke('google-calendar-auth', {
        body: {
          action: 'update_notifications',
          companyId,
          calendarId: integration.google_calendar_id,
          reminders,
        },
      });

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['google-calendar-notifications'] });
      setNotificationsDialogOpen(false);
      toast.success('Notification settings updated');
    },
    onError: (error) => {
      console.error('Failed to update notifications:', error);
      toast.error('Failed to update notification settings');
    },
  });

  // Handle OAuth callback (check URL for code parameter)
  const handleOAuthCallback = async () => {
    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get('code');
    const state = urlParams.get('state'); // This contains companyId

    if (code && state) {
      try {
        const redirectUri = `${window.location.origin}/dashboard/integrations`;
        
        const { error } = await supabase.functions.invoke('google-calendar-auth', {
          body: {
            action: 'exchange_code',
            code,
            companyId: state,
            redirectUri,
          },
        });

        if (error) throw error;

        // Clear URL parameters
        window.history.replaceState({}, document.title, window.location.pathname);
        
        queryClient.invalidateQueries({ queryKey: ['google-calendar-integration'] });
        queryClient.invalidateQueries({ queryKey: ['google-calendars'] });
        toast.success('Google Calendar connected successfully!');
      } catch (error) {
        console.error('Failed to complete Google Calendar connection:', error);
        toast.error('Failed to complete Google Calendar connection');
        // Clear URL parameters even on error
        window.history.replaceState({}, document.title, window.location.pathname);
      }
    }
  };

  // Check for OAuth callback on mount
  useEffect(() => {
    handleOAuthCallback();
  }, []);

  // Find selected calendar name
  const selectedCalendarName = calendarsData?.calendars?.find(
    (c) => c.id === integration?.google_calendar_id
  )?.summary || integration?.google_calendar_id || 'primary calendar';

  if (isLoading) {
    return (
      <Card className="border-border/50">
        <CardHeader>
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-64 mt-2" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-10 w-32" />
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card className={cn(
        "border-border/50 transition-all",
        isConnected && "border-green-500/30 bg-green-500/5"
      )}>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={cn(
                "w-10 h-10 rounded-lg flex items-center justify-center",
                isConnected ? "bg-green-500/10" : "bg-blue-500/10"
              )}>
                <Calendar className={cn(
                  "w-5 h-5",
                  isConnected ? "text-green-600" : "text-blue-500"
                )} />
              </div>
              <div>
                <CardTitle className="text-lg flex items-center gap-2">
                  Google Calendar
                  {isConnected && (
                    <Badge variant="outline" className="bg-green-500/10 text-green-600 border-green-500/30">
                      <Check className="w-3 h-3 mr-1" />
                      Connected
                    </Badge>
                  )}
                </CardTitle>
                <CardDescription>
                  {isConnected 
                    ? `Syncing with ${selectedCalendarName}`
                    : 'Sync appointments with your Google Calendar (two-way sync)'
                  }
                  {isConnected && (
                    <span className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                      {syncStats?.totalSynced !== undefined && syncStats.totalSynced > 0 && (
                        <Badge variant="secondary" className="text-xs px-1.5 py-0">
                          {syncStats.totalSynced} synced
                        </Badge>
                      )}
                      {syncStats?.lastSyncedAt && (
                        <>
                          <Clock className="w-3 h-3" />
                          Last synced {formatDistanceToNow(new Date(syncStats.lastSyncedAt), { addSuffix: true })}
                          <span className="text-muted-foreground/60">
                            ({format(new Date(syncStats.lastSyncedAt), 'MMM d, h:mm a')})
                          </span>
                        </>
                      )}
                    </span>
                  )}
                </CardDescription>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-4">
            {isConnected ? (
              <>
                {/* Calendar Selector */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">Select Calendar</label>
                  {calendarsLoading ? (
                    <Skeleton className="h-10 w-full" />
                  ) : (
                    <Select
                      value={integration?.google_calendar_id || 'primary'}
                      onValueChange={(value) => selectCalendarMutation.mutate(value)}
                      disabled={selectCalendarMutation.isPending}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select a calendar" />
                      </SelectTrigger>
                      <SelectContent>
                        {calendarsData?.calendars?.map((calendar) => (
                          <SelectItem key={calendar.id} value={calendar.id}>
                            <div className="flex items-center gap-2">
                              {calendar.backgroundColor && (
                                <div 
                                  className="w-3 h-3 rounded-full" 
                                  style={{ backgroundColor: calendar.backgroundColor }}
                                />
                              )}
                              <span>{calendar.summary}</span>
                              {calendar.primary && (
                                <Badge variant="secondary" className="ml-1 text-xs">Primary</Badge>
                              )}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                  <div className="flex items-center gap-2">
                    <p className="text-xs text-muted-foreground flex-1">
                      Choose which calendar to sync appointments with
                    </p>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setCreateCalendarDialogOpen(true)}
                      disabled={createCalendarMutation.isPending}
                      className="gap-1 text-xs h-7"
                    >
                      <Plus className="w-3 h-3" />
                      Create New
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        const currentColor = calendarsData?.calendars?.find(
                          c => c.id === integration?.google_calendar_id
                        )?.backgroundColor;
                        if (currentColor) setSelectedColor(currentColor);
                        setChangeColorDialogOpen(true);
                      }}
                      disabled={changeColorMutation.isPending || !integration?.google_calendar_id}
                      className="gap-1 text-xs h-7"
                    >
                      <Palette className="w-3 h-3" />
                      Change Color
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        const currentName = calendarsData?.calendars?.find(
                          c => c.id === integration?.google_calendar_id
                        )?.summary;
                        if (currentName) setNewCalendarName(currentName);
                        setRenameDialogOpen(true);
                      }}
                      disabled={renameCalendarMutation.isPending || !integration?.google_calendar_id}
                      className="gap-1 text-xs h-7"
                    >
                      <Pencil className="w-3 h-3" />
                      Rename
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setDeleteCalendarDialogOpen(true)}
                      disabled={
                        deleteCalendarMutation.isPending || 
                        !integration?.google_calendar_id ||
                        integration?.google_calendar_id === 'primary' ||
                        integration?.google_calendar_id?.includes('@gmail.com') ||
                        integration?.google_calendar_id?.includes('@googlemail.com') ||
                        calendarsData?.calendars?.find(c => c.id === integration?.google_calendar_id)?.primary
                      }
                      className="gap-1 text-xs h-7 text-destructive hover:text-destructive"
                    >
                      <Trash2 className="w-3 h-3" />
                      Delete
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setSharingDialogOpen(true)}
                      disabled={!integration?.google_calendar_id}
                      className="gap-1 text-xs h-7"
                    >
                      <Share2 className="w-3 h-3" />
                      Share
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setPendingReminders(notificationSettings?.defaultReminders || []);
                        setNotificationsDialogOpen(true);
                      }}
                      disabled={!integration?.google_calendar_id}
                      className="gap-1 text-xs h-7"
                    >
                      <Bell className="w-3 h-3" />
                      Notifications
                    </Button>
                  </div>
                </div>

                <div className="flex items-center gap-3 flex-wrap">
                  <Button
                    variant="outline"
                    onClick={() => syncAllMutation.mutate()}
                    disabled={syncAllMutation.isPending}
                    className="gap-2"
                  >
                    {syncAllMutation.isPending ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <RefreshCw className="w-4 h-4" />
                    )}
                    Sync All Appointments
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setDisconnectDialogOpen(true)}
                    className="gap-2"
                  >
                    <Unlink className="w-4 h-4" />
                    Disconnect
                  </Button>
                </div>
                <p className="text-sm text-muted-foreground">
                  Appointments automatically sync to Google Calendar. Use "Sync All" to force-sync existing appointments.
                </p>

                {/* Failed Syncs Section */}
                {failedSyncs && failedSyncs.length > 0 && (
                  <div className="mt-4 p-3 rounded-lg border border-destructive/30 bg-destructive/5">
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2">
                        <AlertCircle className="w-4 h-4 text-destructive" />
                        <span className="text-sm font-medium text-destructive">
                          {failedSyncs.length} sync{failedSyncs.length > 1 ? 's' : ''} failed
                        </span>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => retryFailedMutation.mutate()}
                        disabled={retryFailedMutation.isPending}
                        className="gap-2 text-xs h-7"
                      >
                        {retryFailedMutation.isPending ? (
                          <Loader2 className="w-3 h-3 animate-spin" />
                        ) : (
                          <RefreshCw className="w-3 h-3" />
                        )}
                        Retry All
                      </Button>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      Some appointments failed to sync. Click "Retry All" to attempt syncing again.
                    </p>
                  </div>
                )}
              </>
            ) : (
              <div className="flex flex-col gap-3">
                <Button
                  onClick={() => connectMutation.mutate()}
                  disabled={connectMutation.isPending}
                  className="gap-2 w-fit"
                >
                  {connectMutation.isPending ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Calendar className="w-4 h-4" />
                  )}
                  Connect Google Calendar
                </Button>
                <p className="text-sm text-muted-foreground">
                  Requires Google OAuth credentials to be configured by platform admin.
                </p>
              </div>
            )}

            {/* Features list */}
            <div className="pt-2 border-t border-border/50">
              <p className="text-sm font-medium mb-2">Features:</p>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li className="flex items-center gap-2">
                  <RefreshCw className="w-3 h-3" />
                  Two-way sync between platform and Google Calendar
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-3 h-3" />
                  New appointments automatically appear in Google Calendar
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-3 h-3" />
                  Updates and cancellations sync both ways
                </li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Disconnect Confirmation Dialog */}
      <AlertDialog open={disconnectDialogOpen} onOpenChange={setDisconnectDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Disconnect Google Calendar?</AlertDialogTitle>
            <AlertDialogDescription>
              This will stop syncing appointments with your Google Calendar. Existing calendar events will remain but won't receive updates.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => disconnectMutation.mutate()}
              disabled={disconnectMutation.isPending}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {disconnectMutation.isPending ? (
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
              ) : null}
              Disconnect
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Create Calendar Dialog with Color Picker */}
      <Dialog open={createCalendarDialogOpen} onOpenChange={setCreateCalendarDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Create Dedicated Calendar</DialogTitle>
            <DialogDescription>
              Create a new Google Calendar for your appointments. Choose a color to help identify it.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Calendar Color</label>
              <div className="grid grid-cols-6 gap-2">
                {CALENDAR_COLORS.map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => setSelectedColor(c.color)}
                    className={cn(
                      "w-8 h-8 rounded-full border-2 transition-all hover:scale-110",
                      selectedColor === c.color 
                        ? "border-foreground ring-2 ring-foreground/20" 
                        : "border-transparent"
                    )}
                    style={{ backgroundColor: c.color }}
                    title={c.name}
                  />
                ))}
              </div>
              <p className="text-xs text-muted-foreground">
                Selected: {CALENDAR_COLORS.find(c => c.color === selectedColor)?.name || 'Custom'}
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setCreateCalendarDialogOpen(false)}
              disabled={createCalendarMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              onClick={() => createCalendarMutation.mutate(selectedColor)}
              disabled={createCalendarMutation.isPending}
            >
              {createCalendarMutation.isPending ? (
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
              ) : null}
              Create Calendar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Change Color Dialog */}
      <Dialog open={changeColorDialogOpen} onOpenChange={setChangeColorDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Change Calendar Color</DialogTitle>
            <DialogDescription>
              Select a new color for your calendar.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Calendar Color</label>
              <div className="grid grid-cols-6 gap-2">
                {CALENDAR_COLORS.map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => setSelectedColor(c.color)}
                    className={cn(
                      "w-8 h-8 rounded-full border-2 transition-all hover:scale-110",
                      selectedColor === c.color 
                        ? "border-foreground ring-2 ring-foreground/20" 
                        : "border-transparent"
                    )}
                    style={{ backgroundColor: c.color }}
                    title={c.name}
                  />
                ))}
              </div>
              <p className="text-xs text-muted-foreground">
                Selected: {CALENDAR_COLORS.find(c => c.color === selectedColor)?.name || 'Custom'}
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setChangeColorDialogOpen(false)}
              disabled={changeColorMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              onClick={() => changeColorMutation.mutate(selectedColor)}
              disabled={changeColorMutation.isPending}
            >
              {changeColorMutation.isPending ? (
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
              ) : null}
              Update Color
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Rename Calendar Dialog */}
      <Dialog open={renameDialogOpen} onOpenChange={setRenameDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Rename Calendar</DialogTitle>
            <DialogDescription>
              Enter a new name for your calendar.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Calendar Name</label>
              <Input
                value={newCalendarName}
                onChange={(e) => setNewCalendarName(e.target.value)}
                placeholder="Enter calendar name"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setRenameDialogOpen(false);
                setNewCalendarName('');
              }}
              disabled={renameCalendarMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              onClick={() => renameCalendarMutation.mutate(newCalendarName)}
              disabled={renameCalendarMutation.isPending || !newCalendarName.trim()}
            >
              {renameCalendarMutation.isPending ? (
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
              ) : null}
              Rename
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Calendar Dialog */}
      <AlertDialog open={deleteCalendarDialogOpen} onOpenChange={setDeleteCalendarDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Calendar</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{selectedCalendarName}"? This will permanently delete 
              the calendar and all its events from Google Calendar. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteCalendarMutation.isPending}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteCalendarMutation.mutate()}
              disabled={deleteCalendarMutation.isPending}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteCalendarMutation.isPending ? (
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
              ) : null}
              Delete Calendar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Sharing Settings Dialog */}
      <Dialog open={sharingDialogOpen} onOpenChange={setSharingDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Calendar Sharing Settings</DialogTitle>
            <DialogDescription>
              Control who can see your calendar events.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-6 py-4">
            {/* Visibility Settings */}
            <div className="space-y-3">
              <label className="text-sm font-medium">Public Visibility</label>
              <div className="grid gap-2">
                <button
                  type="button"
                  onClick={() => updateVisibilityMutation.mutate('private')}
                  disabled={updateVisibilityMutation.isPending}
                  className={cn(
                    "flex items-center gap-3 p-3 rounded-lg border text-left transition-colors",
                    !sharingSettings?.isPublic 
                      ? "border-primary bg-primary/5" 
                      : "border-border hover:bg-muted/50"
                  )}
                >
                  <Lock className="w-4 h-4 text-muted-foreground" />
                  <div className="flex-1">
                    <p className="text-sm font-medium">Private</p>
                    <p className="text-xs text-muted-foreground">Only people you share with can see events</p>
                  </div>
                  {!sharingSettings?.isPublic && <Check className="w-4 h-4 text-primary" />}
                </button>
                <button
                  type="button"
                  onClick={() => updateVisibilityMutation.mutate('freeBusy')}
                  disabled={updateVisibilityMutation.isPending}
                  className={cn(
                    "flex items-center gap-3 p-3 rounded-lg border text-left transition-colors",
                    sharingSettings?.isPublic && sharingSettings?.publicRole === 'freeBusyReader'
                      ? "border-primary bg-primary/5" 
                      : "border-border hover:bg-muted/50"
                  )}
                >
                  <Users className="w-4 h-4 text-muted-foreground" />
                  <div className="flex-1">
                    <p className="text-sm font-medium">Free/Busy Only</p>
                    <p className="text-xs text-muted-foreground">Others can see when you're busy but not event details</p>
                  </div>
                  {sharingSettings?.isPublic && sharingSettings?.publicRole === 'freeBusyReader' && <Check className="w-4 h-4 text-primary" />}
                </button>
                <button
                  type="button"
                  onClick={() => updateVisibilityMutation.mutate('public')}
                  disabled={updateVisibilityMutation.isPending}
                  className={cn(
                    "flex items-center gap-3 p-3 rounded-lg border text-left transition-colors",
                    sharingSettings?.isPublic && sharingSettings?.publicRole === 'reader'
                      ? "border-primary bg-primary/5" 
                      : "border-border hover:bg-muted/50"
                  )}
                >
                  <Globe className="w-4 h-4 text-muted-foreground" />
                  <div className="flex-1">
                    <p className="text-sm font-medium">Public</p>
                    <p className="text-xs text-muted-foreground">Anyone can see all event details</p>
                  </div>
                  {sharingSettings?.isPublic && sharingSettings?.publicRole === 'reader' && <Check className="w-4 h-4 text-primary" />}
                </button>
              </div>
            </div>

            {/* Share with specific people */}
            <div className="space-y-3 pt-2 border-t border-border">
              <label className="text-sm font-medium">Share with People</label>
              <div className="flex gap-2">
                <Input
                  type="email"
                  placeholder="Enter email address"
                  value={newShareEmail}
                  onChange={(e) => setNewShareEmail(e.target.value)}
                  className="flex-1"
                />
                <Select value={newShareRole} onValueChange={(v) => setNewShareRole(v as 'reader' | 'writer')}>
                  <SelectTrigger className="w-28">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="reader">View</SelectItem>
                    <SelectItem value="writer">Edit</SelectItem>
                  </SelectContent>
                </Select>
                <Button
                  size="icon"
                  onClick={() => shareWithUserMutation.mutate({ email: newShareEmail, role: newShareRole })}
                  disabled={shareWithUserMutation.isPending || !newShareEmail.includes('@')}
                >
                  {shareWithUserMutation.isPending ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Plus className="w-4 h-4" />
                  )}
                </Button>
              </div>

              {/* Shared users list */}
              {sharingLoading ? (
                <Skeleton className="h-16 w-full" />
              ) : sharingSettings?.sharedUsers && sharingSettings.sharedUsers.length > 0 ? (
                <div className="space-y-2">
                  {sharingSettings.sharedUsers.map((user) => (
                    <div key={user.id} className="flex items-center justify-between p-2 rounded-lg bg-muted/50">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                          <span className="text-xs font-medium text-primary">
                            {user.email.charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <div>
                          <p className="text-sm">{user.email}</p>
                          <p className="text-xs text-muted-foreground capitalize">
                            {user.role === 'reader' ? 'Can view' : user.role === 'writer' ? 'Can edit' : user.role}
                          </p>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeSharingMutation.mutate(user.id)}
                        disabled={removeSharingMutation.isPending}
                        className="h-8 w-8 p-0"
                      >
                        {removeSharingMutation.isPending ? (
                          <Loader2 className="w-3 h-3 animate-spin" />
                        ) : (
                          <X className="w-4 h-4" />
                        )}
                      </Button>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-2">
                  No one else has access to this calendar
                </p>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSharingDialogOpen(false)}>
              Done
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Notifications Settings Dialog */}
      <Dialog open={notificationsDialogOpen} onOpenChange={setNotificationsDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Event Notifications</DialogTitle>
            <DialogDescription>
              Configure default reminders for new calendar events.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {/* Current reminders */}
            <div className="space-y-3">
              <label className="text-sm font-medium">Default Reminders</label>
              {pendingReminders.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4 border border-dashed rounded-lg">
                  No reminders configured
                </p>
              ) : (
                <div className="space-y-2">
                  {pendingReminders.map((reminder, index) => (
                    <div key={index} className="flex items-center gap-2 p-2 rounded-lg bg-muted/50">
                      <div className="flex items-center gap-2 flex-1">
                        {reminder.method === 'email' ? (
                          <Mail className="w-4 h-4 text-muted-foreground" />
                        ) : (
                          <Bell className="w-4 h-4 text-muted-foreground" />
                        )}
                        <Select
                          value={reminder.method}
                          onValueChange={(value: 'email' | 'popup') => {
                            const updated = [...pendingReminders];
                            updated[index] = { ...updated[index], method: value };
                            setPendingReminders(updated);
                          }}
                        >
                          <SelectTrigger className="w-24 h-8">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="popup">Popup</SelectItem>
                            <SelectItem value="email">Email</SelectItem>
                          </SelectContent>
                        </Select>
                        <Select
                          value={reminder.minutes.toString()}
                          onValueChange={(value) => {
                            const updated = [...pendingReminders];
                            updated[index] = { ...updated[index], minutes: parseInt(value) };
                            setPendingReminders(updated);
                          }}
                        >
                          <SelectTrigger className="w-32 h-8">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="0">At time of event</SelectItem>
                            <SelectItem value="5">5 minutes before</SelectItem>
                            <SelectItem value="10">10 minutes before</SelectItem>
                            <SelectItem value="15">15 minutes before</SelectItem>
                            <SelectItem value="30">30 minutes before</SelectItem>
                            <SelectItem value="60">1 hour before</SelectItem>
                            <SelectItem value="120">2 hours before</SelectItem>
                            <SelectItem value="1440">1 day before</SelectItem>
                            <SelectItem value="2880">2 days before</SelectItem>
                            <SelectItem value="10080">1 week before</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setPendingReminders(pendingReminders.filter((_, i) => i !== index));
                        }}
                        className="h-8 w-8 p-0"
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
              
              {/* Add reminder button */}
              {pendingReminders.length < 5 && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setPendingReminders([...pendingReminders, { method: 'popup', minutes: 30 }]);
                  }}
                  className="w-full gap-2"
                >
                  <Plus className="w-4 h-4" />
                  Add Reminder
                </Button>
              )}
              <p className="text-xs text-muted-foreground">
                You can add up to 5 reminders. These will be applied to all new events.
              </p>
            </div>
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              onClick={() => setNotificationsDialogOpen(false)}
              disabled={updateNotificationsMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              onClick={() => updateNotificationsMutation.mutate(pendingReminders)}
              disabled={updateNotificationsMutation.isPending}
            >
              {updateNotificationsMutation.isPending ? (
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
              ) : null}
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
