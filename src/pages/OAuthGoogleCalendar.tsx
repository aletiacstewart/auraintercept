import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { RefreshCw, Calendar, ExternalLink, CheckCircle2, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { isLovablePreviewDomain, getPublishedDomain } from "@/lib/url";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;

/**
 * Detects whether the current page is loaded inside any iframe.
 */
function detectIframe(): boolean {
  try {
    return window.self !== window.top;
  } catch {
    // Cross-origin iframes throw a security error when accessing window.top
    return true;
  }
}

function navigateOutsideIframe(url: string) {
  // Best-effort: break out of any iframe wrapper.
  try {
    if (window.top && window.top !== window.self) {
      window.top.location.href = url;
      return;
    }
  } catch {
    // ignore
  }

  // Fallback: same-frame navigation
  window.location.href = url;
}

export default function OAuthGoogleCalendar() {
  const [authUrl, setAuthUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [isInIframe] = useState(detectIframe);
  const [autoRedirecting, setAutoRedirecting] = useState(false);
  const [isPreview] = useState(isLovablePreviewDomain);

  useEffect(() => {
    // Skip fetching auth URL if we're on preview domain - we'll show a message instead
    if (isPreview) {
      setLoading(false);
      return;
    }

    let cancelled = false;

    const fetchAuthUrl = async () => {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();

        if (!session?.access_token) {
          // Store current path so we can return after login
          localStorage.setItem(
            "gcal-return-url",
            window.location.origin + "/dashboard/integrations/calendar"
          );
          window.location.href = "/auth";
          return;
        }

        // Store return URL for after OAuth completes
        localStorage.setItem(
          "gcal-return-url",
          window.location.origin + "/dashboard/integrations/calendar"
        );

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
          setAuthUrl(data.authUrl);
          setLoading(false);

          // ──────────────────────────────────────────────────────────────────
          // AUTO-REDIRECT if we're inside an iframe (e.g., Lovable preview).
          // Google blocks accounts.google.com inside iframes, so we skip the
          // intermediate landing page and immediately navigate to Google.
          // ──────────────────────────────────────────────────────────────────
          if (detectIframe()) {
            setAutoRedirecting(true);
            navigateOutsideIframe(data.authUrl);
          }
        }
      } catch (e) {
        if (cancelled) return;
        setError(e instanceof Error ? e.message : "Failed to start Google auth");
        setLoading(false);
      }
    };

    fetchAuthUrl();

    return () => {
      cancelled = true;
    };
  }, [isPreview]);

  const handleConnect = () => {
    if (!authUrl) return;
    navigateOutsideIframe(authUrl);
  };

  const handleOpenOnPublishedSite = () => {
    const publishedUrl = `${getPublishedDomain()}/oauth/google-calendar`;
    window.open(publishedUrl, '_blank', 'noopener,noreferrer');
  };

  // Show preview domain warning
  if (isPreview) {
    return (
      <main className="min-h-screen flex items-center justify-center p-6 bg-background">
        <Card className="w-full max-w-lg">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 h-12 w-12 rounded-full bg-amber-500/10 flex items-center justify-center">
              <AlertTriangle className="h-6 w-6 text-amber-500" />
            </div>
            <CardTitle>Preview Environment Detected</CardTitle>
            <CardDescription>
              Google Calendar OAuth cannot be completed from the Lovable preview
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-4 rounded-lg bg-muted/50 border text-sm">
              <p className="text-foreground font-medium mb-2">Why is this happening?</p>
              <p className="text-muted-foreground text-sm">
                Google blocks OAuth flows from preview environments for security reasons. 
                To connect Google Calendar, you must use your published site.
              </p>
            </div>

            <div className="space-y-2">
              <Button onClick={handleOpenOnPublishedSite} className="w-full" size="lg">
                <ExternalLink className="h-4 w-4 mr-2" />
                Open on auraintercept.ai
              </Button>
              <p className="text-xs text-center text-muted-foreground">
                Opens the OAuth page on your published domain in a new tab
              </p>
            </div>

            <div className="pt-2 border-t">
              <p className="text-xs text-muted-foreground text-center">
                After connecting on your published site, return here to verify the connection.
              </p>
            </div>
          </CardContent>
        </Card>
      </main>
    );
  }

  // While auto-redirecting, show a brief loading state
  if (autoRedirecting) {
    return (
      <main className="min-h-screen flex items-center justify-center p-6 bg-background">
        <Card className="w-full max-w-lg">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
              <Calendar className="h-6 w-6 text-primary" />
            </div>
            <CardTitle>Redirecting to Google…</CardTitle>
            <CardDescription>
              Please wait while we open the Google sign-in page.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-center py-8">
              <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
      </main>
    );
  }

  return (
    <main className="min-h-screen flex items-center justify-center p-6 bg-background">
      <Card className="w-full max-w-lg">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
            <Calendar className="h-6 w-6 text-primary" />
          </div>
          <CardTitle>Connect Google Calendar</CardTitle>
          <CardDescription>
            {loading
              ? "Preparing connection..."
              : error
              ? "Something went wrong"
              : "Click below to authorize access to your Google Calendar"}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {error ? (
            <div className="space-y-4">
              <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20">
                <p className="text-sm text-destructive">{error}</p>
              </div>
              <Button
                onClick={() => window.location.reload()}
                variant="outline"
                className="w-full"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Try Again
              </Button>
            </div>
          ) : loading ? (
            <div className="flex items-center justify-center py-8">
              <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <div className="space-y-4">
              {isInIframe && (
                <div className="p-3 rounded-lg bg-muted/30 border text-sm text-foreground">
                  This screen is embedded. To avoid Google's security block, we'll
                  redirect you directly to Google.
                </div>
              )}

              <div className="space-y-2 text-sm text-muted-foreground">
                <div className="flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5 shrink-0" />
                  <span>View and manage your calendar events</span>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5 shrink-0" />
                  <span>Automatically sync appointments</span>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5 shrink-0" />
                  <span>Two-way sync with instant updates</span>
                </div>
              </div>

              <Button onClick={handleConnect} className="w-full" size="lg">
                <ExternalLink className="h-4 w-4 mr-2" />
                Continue to Google
              </Button>

              <p className="text-xs text-center text-muted-foreground">
                You'll be redirected to Google to sign in and authorize access
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </main>
  );
}