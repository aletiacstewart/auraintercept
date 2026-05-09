import { useAuth } from "@/contexts/AuthContext";
import { useEmailUsage } from "@/hooks/useEmailUsage";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { RefreshCw, Mail, Shield } from "lucide-react";

export default function EmailLimits() {
  const { companyId } = useAuth();
  const { daily, monthly, recent, loading, refresh } = useEmailUsage(companyId);

  const dailyPct = daily ? Math.min(100, Math.round((daily.count / Math.max(1, daily.cap)) * 100)) : 0;
  const monthlyPct = monthly ? Math.min(100, Math.round((monthly.count / Math.max(1, monthly.cap)) * 100)) : 0;

  const statusVariant = (s: string) => {
    if (s === "sent") return "default";
    if (s === "overridden_critical") return "secondary";
    return "destructive";
  };

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-semibold flex items-center gap-2">
            <Mail className="h-6 w-6 text-primary" />
            Email Limits & Usage
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Resend is capped at 100 emails/day and 3,000/month per company. Critical emails
            (cancellations, password resets) bypass the cap automatically.
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={refresh} disabled={loading}>
          <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Today</CardTitle>
            <CardDescription>{daily?.period_key}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-baseline justify-between">
              <span className="text-3xl font-bold">{daily?.count ?? 0}</span>
              <span className="text-muted-foreground">/ {daily?.cap ?? 100}</span>
            </div>
            <Progress value={dailyPct} />
            <p className="text-xs text-muted-foreground">{dailyPct}% of daily cap used</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">This month</CardTitle>
            <CardDescription>{monthly?.period_key}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-baseline justify-between">
              <span className="text-3xl font-bold">{monthly?.count ?? 0}</span>
              <span className="text-muted-foreground">/ {monthly?.cap ?? 3000}</span>
            </div>
            <Progress value={monthlyPct} />
            <p className="text-xs text-muted-foreground">{monthlyPct}% of monthly cap used</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Shield className="h-4 w-4 text-muted-foreground" />
            Recent send attempts
          </CardTitle>
          <CardDescription>Last 25 attempts including blocked sends.</CardDescription>
        </CardHeader>
        <CardContent>
          {recent.length === 0 ? (
            <p className="text-sm text-muted-foreground">No attempts yet.</p>
          ) : (
            <div className="space-y-2">
              {recent.map((r) => (
                <div key={r.id} className="flex items-center justify-between text-sm border-b border-border/50 py-2">
                  <div className="min-w-0 flex-1">
                    <div className="truncate font-medium">{r.to_email}</div>
                    <div className="text-xs text-muted-foreground">
                      {r.template ?? "—"} · {new Date(r.created_at).toLocaleString()}
                    </div>
                  </div>
                  <Badge variant={statusVariant(r.status)}>{r.status.replace("_", " ")}</Badge>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="border-amber-500/30 bg-amber-500/5">
        <CardHeader>
          <CardTitle className="text-base">How limits behave</CardTitle>
        </CardHeader>
        <CardContent className="text-sm space-y-2 text-muted-foreground">
          <p>· Marketing & digest emails are blocked once the cap is hit and counted as "blocked daily/monthly".</p>
          <p>· Critical transactional emails (cancellations, auth, payment receipts) bypass the cap and log as "overridden critical".</p>
          <p>· Admins are notified at 80% and 100% via the staff notification channel.</p>
          <p>· To customize per-company caps, set <code className="text-xs">companies.email_caps</code> JSONB to <code className="text-xs">{`{"daily":150,"monthly":4000}`}</code>.</p>
        </CardContent>
      </Card>
    </div>
  );
}