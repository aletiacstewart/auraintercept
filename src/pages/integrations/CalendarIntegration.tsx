import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { CalendarSubscription } from '@/components/integrations/CalendarSubscription';
import { CalDAVSubscription } from '@/components/integrations/CalDAVSubscription';
import { GoogleCalendarSettings } from '@/components/integrations/GoogleCalendarSettings';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, CalendarDays, Server, Zap, Rss } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function CalendarIntegration() {
  return (
    <DashboardLayout>
      <div className="space-y-6 animate-fade-in">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link to="/dashboard/integrations">
              <ArrowLeft className="w-4 h-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Calendar Integration</h1>
            <p className="text-muted-foreground">Sync appointments with your calendar</p>
          </div>
        </div>

        {/* Overview Card */}
        <Card className="border-border/50 bg-gradient-to-br from-primary/5 to-transparent">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-lg">
              <CalendarDays className="w-5 h-5 text-primary" />
              Choose Your Sync Method
            </CardTitle>
            <CardDescription>
              Multiple options to fit your needs - from simple one-way feeds to full two-way sync
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div className="flex items-start gap-2">
                <Rss className="w-4 h-4 text-muted-foreground mt-0.5" />
                <div>
                  <p className="font-medium">ICS Feeds</p>
                  <p className="text-muted-foreground text-xs">One-way, works everywhere</p>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <Server className="w-4 h-4 text-muted-foreground mt-0.5" />
                <div>
                  <p className="font-medium">CalDAV</p>
                  <p className="text-muted-foreground text-xs">Two-way, Apple/Android</p>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <Zap className="w-4 h-4 text-muted-foreground mt-0.5" />
                <div>
                  <p className="font-medium">Google Calendar</p>
                  <p className="text-muted-foreground text-xs">Two-way, instant updates</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Tabs */}
        <Tabs defaultValue="ics" className="space-y-4">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="ics" className="flex items-center gap-2">
              <Rss className="w-4 h-4" />
              <span className="hidden sm:inline">ICS Feeds</span>
              <span className="sm:hidden">ICS</span>
            </TabsTrigger>
            <TabsTrigger value="caldav" className="flex items-center gap-2">
              <Server className="w-4 h-4" />
              <span className="hidden sm:inline">CalDAV</span>
              <span className="sm:hidden">CalDAV</span>
            </TabsTrigger>
            <TabsTrigger value="google" className="flex items-center gap-2">
              <Zap className="w-4 h-4" />
              <span className="hidden sm:inline">Google</span>
              <span className="sm:hidden">Google</span>
            </TabsTrigger>
          </TabsList>

          {/* ICS Feeds Tab */}
          <TabsContent value="ics" className="space-y-4">
            <div className="rounded-lg border bg-card p-4">
              <h3 className="font-medium mb-1">ICS Calendar Feeds</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Simple subscription URLs that work with any calendar app. 
                One-way sync - your calendar will automatically show appointments.
              </p>
              <div className="flex flex-wrap gap-2">
                <span className="px-2 py-1 bg-green-500/10 text-green-600 text-xs rounded-full">Free</span>
                <span className="px-2 py-1 bg-muted text-muted-foreground text-xs rounded-full">Works Everywhere</span>
                <span className="px-2 py-1 bg-muted text-muted-foreground text-xs rounded-full">No Setup Required</span>
              </div>
            </div>
            <CalendarSubscription type="company" />
          </TabsContent>

          {/* CalDAV Tab */}
          <TabsContent value="caldav" className="space-y-4">
            <div className="rounded-lg border bg-card p-4">
              <h3 className="font-medium mb-1">CalDAV Two-Way Sync</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Full two-way sync with CalDAV-compatible apps. 
                Changes you make in your calendar app sync back to the platform.
              </p>
              <div className="flex flex-wrap gap-2">
                <span className="px-2 py-1 bg-green-500/10 text-green-600 text-xs rounded-full">Free</span>
                <span className="px-2 py-1 bg-blue-500/10 text-blue-600 text-xs rounded-full">Two-Way Sync</span>
                <span className="px-2 py-1 bg-muted text-muted-foreground text-xs rounded-full">Apple/Android/Thunderbird</span>
              </div>
            </div>
            <CalDAVSubscription type="company" />
          </TabsContent>

          {/* Google Calendar Tab */}
          <TabsContent value="google" className="space-y-4">
            <div className="rounded-lg border bg-card p-4">
              <h3 className="font-medium mb-1">Google Calendar Integration</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Native Google Calendar integration with instant two-way sync. 
                Requires Google Cloud OAuth setup.
              </p>
              <div className="flex flex-wrap gap-2">
                <span className="px-2 py-1 bg-blue-500/10 text-blue-600 text-xs rounded-full">Two-Way Sync</span>
                <span className="px-2 py-1 bg-purple-500/10 text-purple-600 text-xs rounded-full">Instant Updates</span>
                <span className="px-2 py-1 bg-amber-500/10 text-amber-600 text-xs rounded-full">Setup Required</span>
              </div>
            </div>
            <GoogleCalendarSettings />
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}
