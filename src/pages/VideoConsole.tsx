import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { PageContainer } from '@/components/ui/page-container';
import { PageHeader } from '@/components/ui/page-header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Video, Copy, ExternalLink, Calendar } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { HowToUseModal } from '@/components/ui/HowToUseModal';
import { HOW_TO_USE } from '@/lib/howToUseContent';

function newRoomId() {
  return 'aura-' + Math.random().toString(36).slice(2, 10);
}

export default function VideoConsole() {
  const { companyId } = useAuth();
  const [room, setRoom] = useState(newRoomId());
  const [joinUrl, setJoinUrl] = useState('');

  const meetingUrl = `https://meet.jit.si/${room}`;

  const { data: upcoming } = useQuery({
    queryKey: ['video-appointments', companyId],
    enabled: !!companyId,
    queryFn: async () => {
      const { data } = await supabase
        .from('appointments')
        .select('id, customer_name, customer_email, datetime, status, notes')
        .eq('company_id', companyId)
        .gte('datetime', new Date().toISOString())
        .order('datetime', { ascending: true })
        .limit(20);
      return data || [];
    },
  });

  const copy = (s: string) => { navigator.clipboard.writeText(s); toast.success('Copied'); };

  async function logSession(opts: {
    url: string;
    direction: 'outbound' | 'inbound';
    appointmentId?: string;
    customerName?: string | null;
    customerEmail?: string | null;
  }) {
    if (!companyId) return;
    try {
      await supabase.from('call_logs').insert({
        company_id: companyId,
        direction: opts.direction,
        status: 'in_progress',
        purpose: 'video-meeting',
        customer_name: opts.customerName || null,
        metadata: {
          source: 'video_console',
          provider: 'jitsi',
          meeting_url: opts.url,
          appointment_id: opts.appointmentId || null,
          customer_email: opts.customerEmail || null,
        },
      });
      if (opts.appointmentId) {
        await supabase
          .from('appointments')
          .update({ status: 'in_progress' })
          .eq('id', opts.appointmentId);
      }
    } catch (e) {
      console.error('Failed to log video session', e);
    }
  }

  return (
    <DashboardLayout>
      <PageContainer>
        <PageHeader
          icon={Video}
          title="Video Console"
          description="Start or join live video meetings with customers, prospects, and your team."
          action={<HowToUseModal {...HOW_TO_USE.videoConsole} />}
        />

        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Video className="h-5 w-5 text-primary" /> Start a meeting</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex gap-2">
                <Input value={room} onChange={(e) => setRoom(e.target.value)} placeholder="room-id" />
                <Button variant="outline" onClick={() => setRoom(newRoomId())}>New</Button>
              </div>
              <div className="flex items-center gap-2 rounded-md border border-border bg-muted/30 p-2 text-sm">
                <span className="truncate flex-1">{meetingUrl}</span>
                <Button size="sm" variant="ghost" onClick={() => copy(meetingUrl)}><Copy className="h-4 w-4" /></Button>
              </div>
              <Button
                className="w-full"
                onClick={() => {
                  logSession({ url: meetingUrl, direction: 'outbound' });
                  window.open(meetingUrl, '_blank', 'noreferrer');
                }}
              >
                <ExternalLink className="mr-2 h-4 w-4" /> Open meeting room
              </Button>
              <p className="text-xs text-muted-foreground">
                Share the link with attendees. Anyone with the link can join.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><ExternalLink className="h-5 w-5 text-primary" /> Join a meeting</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Input
                value={joinUrl}
                onChange={(e) => setJoinUrl(e.target.value)}
                placeholder="Paste meeting link..."
              />
              <Button
                className="w-full"
                disabled={!joinUrl}
                onClick={() => {
                  logSession({ url: joinUrl, direction: 'inbound' });
                  window.open(joinUrl, '_blank', 'noreferrer');
                }}
              >
                Join now
              </Button>
              <p className="text-xs text-muted-foreground">
                Works with Jitsi, Google Meet, Zoom, or any meeting URL.
              </p>
            </CardContent>
          </Card>
        </div>

        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Calendar className="h-5 w-5 text-primary" /> Upcoming appointments</CardTitle>
          </CardHeader>
          <CardContent>
            {!upcoming?.length ? (
              <p className="text-sm text-muted-foreground">No upcoming appointments. Create one from the Appointments page.</p>
            ) : (
              <div className="space-y-2">
                {upcoming.map((a) => (
                  <div key={a.id} className="flex items-center justify-between rounded-md border border-border p-3">
                    <div>
                      <div className="font-medium">{a.customer_name || 'Customer'}</div>
                      <div className="text-xs text-muted-foreground">{format(new Date(a.datetime), 'PPp')}</div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">{a.status}</Badge>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          const url = `https://meet.jit.si/aura-${a.id.slice(0, 8)}`;
                          logSession({
                            url,
                            direction: 'outbound',
                            appointmentId: a.id,
                            customerName: a.customer_name,
                            customerEmail: a.customer_email,
                          });
                          window.open(url, '_blank', 'noreferrer');
                        }}
                      >
                        <Video className="mr-1 h-4 w-4" /> Start
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </PageContainer>
    </DashboardLayout>
  );
}