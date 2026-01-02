import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { CalendarSubscription } from '@/components/integrations/CalendarSubscription';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, CalendarDays } from 'lucide-react';
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
              ICS Calendar Feed
            </CardTitle>
            <CardDescription>
              Subscribe to your appointments calendar
            </CardDescription>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            <p>Works with any calendar app (Google Calendar, Outlook, Apple Calendar). Simple setup, no OAuth required.</p>
          </CardContent>
        </Card>

        {/* Calendar Settings */}
        <CalendarSubscription type="company" />
      </div>
    </DashboardLayout>
  );
}
