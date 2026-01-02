import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { CalendarSubscription } from '@/components/integrations/CalendarSubscription';
import { GoogleCalendarSettings } from '@/components/integrations/GoogleCalendarSettings';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, Calendar, CalendarDays } from 'lucide-react';
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

        {/* Info Card */}
        <Card className="border-border/50 bg-primary/5">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-lg">
              <CalendarDays className="w-5 h-5 text-primary" />
              Calendar Options
            </CardTitle>
            <CardDescription>
              Choose how you want to sync your appointments
            </CardDescription>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            <ul className="list-disc list-inside space-y-1">
              <li><strong>ICS Calendar Feed (Recommended)</strong> - Free, works with any calendar app (Google, Outlook, Apple). Simple setup, no OAuth required.</li>
              <li><strong>Google Calendar</strong> - Two-way sync with Google Calendar. Requires OAuth setup in Google Cloud Console.</li>
            </ul>
          </CardContent>
        </Card>

        {/* Calendar Settings */}
        <div className="grid gap-4 md:grid-cols-2">
          <CalendarSubscription type="company" />
          <GoogleCalendarSettings />
        </div>
      </div>
    </DashboardLayout>
  );
}
