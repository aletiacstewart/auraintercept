import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { Calendar, Copy, RefreshCw, ExternalLink, Smartphone, Monitor, Check } from 'lucide-react';
import { getCalendarSubscribeUrl, getCalendarFeedUrl, copyToClipboard } from '@/lib/calendarUtils';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface CalendarSubscriptionProps {
  type: 'employee' | 'company';
  title?: string;
  description?: string;
}

export function CalendarSubscription({ 
  type, 
  title = type === 'employee' ? 'My Calendar Feed' : 'Company Calendar Feed',
  description = type === 'employee' 
    ? 'Subscribe to see your assigned jobs in any calendar app'
    : 'Subscribe to see all company appointments in any calendar app'
}: CalendarSubscriptionProps) {
  const { user, companyId } = useAuth();
  const queryClient = useQueryClient();
  const [instructionsOpen, setInstructionsOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  // Fetch the calendar feed token
  const { data: tokenData, isLoading } = useQuery({
    queryKey: ['calendar-feed-token', type, type === 'employee' ? user?.id : companyId],
    queryFn: async () => {
      if (type === 'employee' && user?.id) {
        const { data, error } = await supabase
          .from('profiles')
          .select('calendar_feed_token')
          .eq('id', user.id)
          .single();
        if (error) throw error;
        return data?.calendar_feed_token;
      } else if (type === 'company' && companyId) {
        const { data, error } = await supabase
          .from('companies')
          .select('calendar_feed_token')
          .eq('id', companyId)
          .single();
        if (error) throw error;
        return data?.calendar_feed_token;
      }
      return null;
    },
    enabled: type === 'employee' ? !!user?.id : !!companyId,
  });

  // Regenerate token
  const regenerateMutation = useMutation({
    mutationFn: async () => {
      const newToken = crypto.randomUUID();
      if (type === 'employee' && user?.id) {
        const { error } = await supabase
          .from('profiles')
          .update({ calendar_feed_token: newToken })
          .eq('id', user.id);
        if (error) throw error;
      } else if (type === 'company' && companyId) {
        const { error } = await supabase
          .from('companies')
          .update({ calendar_feed_token: newToken })
          .eq('id', companyId);
        if (error) throw error;
      }
      return newToken;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['calendar-feed-token', type] });
      toast.success('Calendar feed URL regenerated. Old links will stop working.');
    },
    onError: () => {
      toast.error('Failed to regenerate calendar feed');
    },
  });

  const subscribeUrl = tokenData ? getCalendarSubscribeUrl(tokenData, type) : '';
  const httpUrl = tokenData ? getCalendarFeedUrl(tokenData, type) : '';

  const handleCopy = async () => {
    if (await copyToClipboard(httpUrl)) {
      setCopied(true);
      toast.success('Calendar URL copied to clipboard');
      setTimeout(() => setCopied(false), 2000);
    } else {
      toast.error('Failed to copy URL');
    }
  };

  const handleSubscribe = () => {
    if (subscribeUrl) {
      window.location.href = subscribeUrl;
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            {title}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-20 flex items-center justify-center">
            <RefreshCw className="h-5 w-5 animate-spin text-card-foreground" />
          </div>
        </CardContent>
      </Card>
    );
  }

  // Company-wide ICS feed isn't wired up yet — Coming Soon state
  if (type === 'company' && !tokenData) {
    return (
      <Card className="opacity-60">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-muted-foreground" />
            {title}
          </CardTitle>
          <CardDescription className="text-card-foreground">{description}</CardDescription>
        </CardHeader>
        <CardContent>
          <Badge variant="outline" className="text-xs text-muted-foreground border-muted-foreground/40">
            Coming Soon
          </Badge>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-primary" />
            {title}
          </CardTitle>
          <CardDescription className="text-card-foreground">{description}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-2 flex-wrap">
            <Badge variant="secondary" className="text-xs">
              Free
            </Badge>
            <Badge variant="outline" className="text-xs text-card-foreground">
              Works with All Calendar Apps
            </Badge>
            <Badge variant="outline" className="text-xs text-card-foreground">
              Auto-Updates
            </Badge>
          </div>

          {tokenData ? (
            <div className="space-y-4">
              <div className="flex gap-2">
                <Input
                  value={httpUrl}
                  readOnly
                  className="font-mono text-xs bg-white text-slate-800"
                />
                <Button
                  variant="outline"
                  size="icon"
                  onClick={handleCopy}
                  title="Copy URL"
                >
                  {copied ? (
                    <Check className="h-4 w-4 text-green-500" />
                  ) : (
                    <Copy className="h-4 w-4 text-foreground" />
                  )}
                </Button>
              </div>

              <div className="flex flex-wrap gap-2">
                <Button onClick={handleSubscribe} className="flex-1 min-w-[150px]">
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Subscribe Now
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setInstructionsOpen(true)}
                >
                  How to Add
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => regenerateMutation.mutate()}
                  disabled={regenerateMutation.isPending}
                  title="Generate new URL (old links will stop working)"
                >
                  <RefreshCw className={`h-4 w-4 text-foreground ${regenerateMutation.isPending ? 'animate-spin' : ''}`} />
                </Button>
              </div>
            </div>
          ) : null}
        </CardContent>
      </Card>

      <Dialog open={instructionsOpen} onOpenChange={setInstructionsOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>How to Subscribe to Your Calendar</DialogTitle>
            <DialogDescription>
              Choose your calendar app and follow the instructions
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="rounded-lg border p-4 space-y-2">
              <div className="flex items-center gap-2">
                <Monitor className="h-5 w-5 text-muted-foreground" />
                <h4 className="font-medium">Google Calendar (Desktop)</h4>
              </div>
              <ol className="text-sm text-muted-foreground space-y-1 list-decimal list-inside">
                <li>Open Google Calendar in your browser</li>
                <li>Click the + next to "Other calendars"</li>
                <li>Select "From URL"</li>
                <li>Paste the calendar URL and click "Add calendar"</li>
              </ol>
            </div>

            <div className="rounded-lg border p-4 space-y-2">
              <div className="flex items-center gap-2">
                <Smartphone className="h-5 w-5 text-muted-foreground" />
                <h4 className="font-medium">iPhone / Apple Calendar</h4>
              </div>
              <ol className="text-sm text-muted-foreground space-y-1 list-decimal list-inside">
                <li>Click the "Subscribe Now" button above</li>
                <li>Or go to Settings → Calendar → Accounts</li>
                <li>Add Account → Other → Add Subscribed Calendar</li>
                <li>Paste the calendar URL</li>
              </ol>
            </div>

            <div className="rounded-lg border p-4 space-y-2">
              <div className="flex items-center gap-2">
                <Monitor className="h-5 w-5 text-muted-foreground" />
                <h4 className="font-medium">Microsoft Outlook</h4>
              </div>
              <ol className="text-sm text-muted-foreground space-y-1 list-decimal list-inside">
                <li>Open Outlook and go to Calendar</li>
                <li>Click "Add calendar" → "From Internet"</li>
                <li>Paste the calendar URL and click OK</li>
              </ol>
            </div>

            <div className="bg-muted/50 rounded-lg p-3 text-sm">
              <p className="text-muted-foreground">
                <strong>Note:</strong> Calendar apps refresh automatically every few hours. 
                New appointments will appear within 1-24 hours depending on your app's settings.
              </p>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
