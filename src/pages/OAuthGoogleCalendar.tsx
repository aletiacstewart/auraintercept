import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { RefreshCw, Calendar, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;

export default function OAuthGoogleCalendar() {
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    const run = async () => {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();

        if (!session?.access_token) {
          // Send user to login; they can retry after.
          window.location.href = "/auth";
          return;
        }

        const response = await fetch(
          `${SUPABASE_URL}/functions/v1/google-calendar-auth?action=authorize`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${session.access_token}`,
            },
          }
        );

        const data = await response.json();
        if (!response.ok) throw new Error(data.error || "Failed to get auth URL");

        if (!cancelled) {
          window.location.href = data.authUrl;
        }
      } catch (e) {
        if (cancelled) return;
        setError(e instanceof Error ? e.message : "Failed to start Google auth");
      }
    };

    run();

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <main className="min-h-[70vh] flex items-center justify-center p-6">
      <Card className="w-full max-w-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-primary" />
            Connect Google Calendar
          </CardTitle>
          <CardDescription>
            Redirecting you to Google to authorize access.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {error ? (
            <div className="space-y-3">
              <p className="text-sm text-destructive">{error}</p>
              <Button asChild variant="outline" className="w-full">
                <a
                  href={`${SUPABASE_URL}/functions/v1/google-calendar-auth?action=authorize`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Try again in new tab
                </a>
              </Button>
            </div>
          ) : (
            <div className="flex items-center justify-center py-8">
              <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          )}
        </CardContent>
      </Card>
    </main>
  );
}
