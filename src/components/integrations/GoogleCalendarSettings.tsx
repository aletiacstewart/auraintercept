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
import { toast } from 'sonner';
import { Calendar, Check, Loader2, Unlink, RefreshCw, Plus, Palette } from 'lucide-react';
import { cn } from '@/lib/utils';

interface GoogleCalendar {
  id: string;
  summary: string;
  primary: boolean;
  backgroundColor?: string;
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
  const [selectedColor, setSelectedColor] = useState(CALENDAR_COLORS[7].color); // Default to Basil green

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

  // Connect to Google Calendar
  const connectMutation = useMutation({
    mutationFn: async () => {
      if (!companyId) throw new Error('No company ID');
      
      // Get the redirect URI (current page)
      const redirectUri = `${window.location.origin}/dashboard/integrations`;
      
      const { data, error } = await supabase.functions.invoke('google-calendar-auth', {
        body: {
          action: 'get_auth_url',
          companyId,
          redirectUri,
        },
      });

      if (error) throw error;
      if (!data?.authUrl) throw new Error('Failed to get auth URL');

      // Redirect to Google OAuth
      window.location.href = data.authUrl;
    },
    onError: (error) => {
      console.error('Failed to initiate Google Calendar connection:', error);
      toast.error('Failed to connect Google Calendar. Please ensure Google OAuth credentials are configured.');
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
      toast.success(`Synced ${data?.synced || 0} appointments to Google Calendar`);
    },
    onError: (error) => {
      console.error('Failed to sync appointments:', error);
      toast.error('Failed to sync appointments to Google Calendar');
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
    </>
  );
}
