import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface TavilyUsageRow {
  period_key: string;
  credits: number;
  cap: number;
}

export interface TavilyAttemptRow {
  id: string;
  operation: string;
  depth: string | null;
  url_count: number | null;
  credits: number;
  status: string;
  reason: string | null;
  source: string | null;
  created_at: string;
}

export function useTavilyUsage(companyId?: string | null) {
  const [monthly, setMonthly] = useState<TavilyUsageRow | null>(null);
  const [recent, setRecent] = useState<TavilyAttemptRow[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    setLoading(true);
    const month = new Date().toISOString().slice(0, 7);

    let q = supabase
      .from("tavily_usage_counters")
      .select("period_key, credits, cap")
      .eq("period_type", "month")
      .eq("period_key", month);
    if (companyId) q = q.eq("company_id", companyId);
    else q = q.is("company_id", null);

    const { data: counters } = await q;
    setMonthly(
      (counters?.[0] as TavilyUsageRow) ?? { period_key: month, credits: 0, cap: 1000 },
    );

    let r = supabase
      .from("tavily_usage_attempts")
      .select("id,operation,depth,url_count,credits,status,reason,source,created_at")
      .order("created_at", { ascending: false })
      .limit(25);
    if (companyId) r = r.eq("company_id", companyId);
    const { data: attempts } = await r;
    setRecent((attempts ?? []) as TavilyAttemptRow[]);
    setLoading(false);
  }, [companyId]);

  useEffect(() => { refresh(); }, [refresh]);

  return { monthly, recent, loading, refresh };
}