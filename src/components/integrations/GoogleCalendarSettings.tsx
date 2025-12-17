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
import { toast } from 'sonner';
import { Calendar, Check, ExternalLink, Loader2, Unlink, RefreshCw } from 'lucide-react';
import { cn } from '@/lib/utils';

export function GoogleCalendarSettings() {
  const { companyId } = useAuth();
  const queryClient = useQueryClient();
  const [disconnectDialogOpen, setDisconnectDialogOpen] = useState(false);

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

  // Disconnect from Google Calendar
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
      toast.success('Google Calendar disconnected');
      setDisconnectDialogOpen(false);
    },
    onError: (error) => {
      console.error('Failed to disconnect Google Calendar:', error);
      toast.error('Failed to disconnect Google Calendar');
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
                    ? `Syncing with ${integration?.google_calendar_id || 'primary calendar'}`
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
              <div className="flex items-center gap-3">
                <Button
                  variant="outline"
                  onClick={() => setDisconnectDialogOpen(true)}
                  className="gap-2"
                >
                  <Unlink className="w-4 h-4" />
                  Disconnect
                </Button>
                <p className="text-sm text-muted-foreground">
                  Appointments will automatically sync to your Google Calendar
                </p>
              </div>
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
    </>
  );
}
