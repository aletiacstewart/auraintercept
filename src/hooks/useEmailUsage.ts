import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface EmailUsageRow {
  period_type: "day" | "month";
  period_key: string;
  count: number;
  cap: number;
}

export interface EmailAttemptRow {
  id: string;
  to_email: string;
  template: string | null;
  status: string;
  reason: string | null;
  priority: string;
  created_at: string;
}

export function useEmailUsage(companyId?: string | null) {
  const [daily, setDaily] = useState<EmailUsageRow | null>(null);
  const [monthly, setMonthly] = useState<EmailUsageRow | null>(null);
  const [recent, setRecent] = useState<EmailAttemptRow[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    setLoading(true);
    const today = new Date().toISOString().slice(0, 10);
    const month = new Date().toISOString().slice(0, 7);

    let q = supabase
      .from("email_usage_counters")
      .select("period_type, period_key, count, cap")
      .in("period_key", [today, month]);
    if (companyId) q = q.eq("company_id", companyId);
    else q = q.is("company_id", null);

    const { data: counters } = await q;
    setDaily(
      (counters?.find((r) => r.period_type === "day") as EmailUsageRow) ?? {
        period_type: "day", period_key: today, count: 0, cap: 100,
      },
    );
    setMonthly(
      (counters?.find((r) => r.period_type === "month") as EmailUsageRow) ?? {
        period_type: "month", period_key: month, count: 0, cap: 3000,
      },
    );

    let r = supabase
      .from("email_send_attempts")
      .select("id,to_email,template,status,reason,priority,created_at")
      .order("created_at", { ascending: false })
      .limit(25);
    if (companyId) r = r.eq("company_id", companyId);
    const { data: attempts } = await r;
    setRecent((attempts ?? []) as EmailAttemptRow[]);
    setLoading(false);
  }, [companyId]);

  useEffect(() => { refresh(); }, [refresh]);

  return { daily, monthly, recent, loading, refresh };
}