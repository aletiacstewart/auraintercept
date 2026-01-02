import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { Calendar, RefreshCw, Link2, Unlink, CheckCircle2, AlertCircle, ExternalLink } from 'lucide-react';
import { format } from 'date-fns';
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

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;

export function GoogleCalendarSettings() {
  const { companyId } = useAuth();
  const queryClient = useQueryClient();
  const [disconnectDialogOpen, setDisconnectDialogOpen] = useState(false);

  // Fetch Google Calendar connection status
  const { data: connection, isLoading } = useQuery({
    queryKey: ['google-calendar-connection', companyId],
    queryFn: async () => {
      if (!companyId) return null;
      const { data, error } = await supabase
        .from('google_calendar_connections')
        .select('*')
        .eq('company_id', companyId)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!companyId,
  });

  // Connect to Google Calendar
  const connectMutation = useMutation({
    mutationFn: async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) throw new Error('Not authenticated');
      
      const response = await fetch(`${SUPABASE_URL}/functions/v1/google-calendar-auth?action=authorize`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to get auth URL');
      return data.authUrl;
    },
    onSuccess: (authUrl) => {
      // Handle iframe context - Google OAuth blocks embedded flows
      const isInIframe = window.self !== window.top;
      if (isInIframe) {
        // Redirect the top-level window to avoid iframe restrictions
        window.top?.location.assign(authUrl);
      } else {
        window.location.href = authUrl;
      }
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  // Disconnect from Google Calendar
  const disconnectMutation = useMutation({
    mutationFn: async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) throw new Error('Not authenticated');
      
      const response = await fetch(`${SUPABASE_URL}/functions/v1/google-calendar-auth?action=disconnect`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to disconnect');
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['google-calendar-connection'] });
      toast.success('Disconnected from Google Calendar');
      setDisconnectDialogOpen(false);
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  // Trigger a full sync
  const syncMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch(`${SUPABASE_URL}/functions/v1/google-calendar-sync`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'full_sync', companyId }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to sync');
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['google-calendar-connection'] });
      toast.success(`Synced ${data.synced || 0} appointments to Google Calendar`);
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Google Calendar
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-20 flex items-center justify-center">
            <RefreshCw className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        </CardContent>
      </Card>
    );
  }

  const isConnected = connection?.sync_enabled;

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-primary" />
            Google Calendar
          </CardTitle>
          <CardDescription>
            Two-way sync with instant updates
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-2 flex-wrap">
            <Badge variant="secondary" className="text-xs">
              Two-Way Sync
            </Badge>
            <Badge variant="outline" className="text-xs">
              Instant Updates
            </Badge>
            <Badge variant="outline" className="text-xs">
              Requires Setup
            </Badge>
          </div>

          {isConnected ? (
            <div className="space-y-4">
              <div className="flex items-center gap-2 p-3 rounded-lg bg-green-500/10 border border-green-500/20">
                <CheckCircle2 className="h-5 w-5 text-green-500" />
                <div className="flex-1">
                  <p className="text-sm font-medium">Connected</p>
                  {connection.last_sync_at && (
                    <p className="text-xs text-muted-foreground">
                      Last synced: {format(new Date(connection.last_sync_at), 'MMM d, h:mm a')}
                    </p>
                  )}
                </div>
              </div>

              {connection.last_error && (
                <div className="flex items-start gap-2 p-3 rounded-lg bg-destructive/10 border border-destructive/20">
                  <AlertCircle className="h-5 w-5 text-destructive mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-destructive">Sync Error</p>
                    <p className="text-xs text-muted-foreground">{connection.last_error}</p>
                  </div>
                </div>
              )}

              <div className="flex flex-wrap gap-2">
                <Button
                  onClick={() => syncMutation.mutate()}
                  disabled={syncMutation.isPending}
                  variant="outline"
                >
                  <RefreshCw className={`h-4 w-4 mr-2 ${syncMutation.isPending ? 'animate-spin' : ''}`} />
                  Sync Now
                </Button>
                <Button
                  variant="destructive"
                  onClick={() => setDisconnectDialogOpen(true)}
                >
                  <Unlink className="h-4 w-4 mr-2" />
                  Disconnect
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="rounded-lg border p-4 bg-muted/30">
                <h4 className="text-sm font-medium mb-2">Setup Required</h4>
                <p className="text-xs text-muted-foreground mb-3">
                  To use Google Calendar sync, your company needs Google OAuth credentials. 
                  This requires setting up a project in Google Cloud Console.
                </p>
                <Button
                  variant="link"
                  className="h-auto p-0 text-xs"
                  asChild
                >
                  <a 
                    href="https://console.cloud.google.com/apis/credentials" 
                    target="_blank" 
                    rel="noopener noreferrer"
                  >
                    <ExternalLink className="h-3 w-3 mr-1" />
                    Google Cloud Console
                  </a>
                </Button>
              </div>

              <Button
                onClick={() => connectMutation.mutate()}
                disabled={connectMutation.isPending}
                className="w-full"
              >
                <Link2 className={`h-4 w-4 mr-2 ${connectMutation.isPending ? 'animate-spin' : ''}`} />
                Connect Google Calendar
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      <AlertDialog open={disconnectDialogOpen} onOpenChange={setDisconnectDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Disconnect Google Calendar?</AlertDialogTitle>
            <AlertDialogDescription>
              This will stop syncing appointments with Google Calendar. 
              Existing events in Google Calendar will remain but won't be updated.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => disconnectMutation.mutate()}
              disabled={disconnectMutation.isPending}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {disconnectMutation.isPending ? 'Disconnecting...' : 'Disconnect'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
