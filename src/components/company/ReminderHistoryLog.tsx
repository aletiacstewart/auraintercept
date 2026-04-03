import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { History, Mail, MessageSquare, CheckCircle, XCircle, Clock, Loader2, Download, CalendarIcon, Phone } from "lucide-react";
import { format, startOfDay, endOfDay, subDays } from "date-fns";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { AuraEmptyState } from '@/components/ui/aura-empty-state';

interface ReminderLog {
  id: string;
  company_id: string;
  appointment_id: string;
  reminder_type: string;
  channel: string;
  status: string;
  recipient: string | null;
  message_preview: string | null;
  error_message: string | null;
  created_at: string;
}

export function ReminderHistoryLog() {
  const { companyId } = useAuth();
  const [startDate, setStartDate] = useState<Date | undefined>(subDays(new Date(), 7));
  const [endDate, setEndDate] = useState<Date | undefined>(new Date());

  const { data: logs, isLoading } = useQuery({
    queryKey: ["reminder-logs", companyId, startDate, endDate],
    queryFn: async () => {
      if (!companyId) return [];
      let query = supabase
        .from("reminder_logs")
        .select("*")
        .eq("company_id", companyId)
        .order("created_at", { ascending: false })
        .limit(500);

      if (startDate) {
        query = query.gte("created_at", startOfDay(startDate).toISOString());
      }
      if (endDate) {
        query = query.lte("created_at", endOfDay(endDate).toISOString());
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as ReminderLog[];
    },
    enabled: !!companyId,
    refetchInterval: 30000,
  });

  const exportToCSV = () => {
    if (!logs || logs.length === 0) {
      toast.error("No logs to export");
      return;
    }

    const headers = ["Date", "Type", "Channel", "Status", "Recipient", "Message Preview", "Error"];
    const rows = logs.map(log => [
      format(new Date(log.created_at), "yyyy-MM-dd HH:mm:ss"),
      log.reminder_type,
      log.channel,
      log.status,
      log.recipient || "",
      (log.message_preview || "").replace(/"/g, '""'),
      (log.error_message || "").replace(/"/g, '""')
    ]);

    const csvContent = [
      headers.join(","),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(","))
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `reminder-logs-${format(new Date(), "yyyy-MM-dd")}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    toast.success("Logs exported successfully");
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "sent":
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case "failed":
        return <XCircle className="h-4 w-4 text-destructive" />;
      case "skipped":
        return <Clock className="h-4 w-4 text-muted-foreground" />;
      default:
        return null;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "sent":
        return <Badge variant="default" className="bg-green-500">Sent</Badge>;
      case "failed":
        return <Badge variant="destructive">Failed</Badge>;
      case "skipped":
        return <Badge variant="secondary">Skipped</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getChannelIcon = (channel: string) => {
    switch (channel) {
      case "email":
        return <Mail className="h-4 w-4" />;
      case "call":
        return <Phone className="h-4 w-4" />;
      default:
        return <MessageSquare className="h-4 w-4" />;
    }
  };

  if (isLoading) {
    return (
      <Card className="border-border/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <History className="h-5 w-5" />
            Reminder History
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-border/50">
      <CardHeader className="space-y-4">
        <div className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <History className="h-5 w-5" />
              Reminder History
            </CardTitle>
            <CardDescription className="mt-1.5">
              Recent reminder notifications sent to customers
            </CardDescription>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={exportToCSV}
            disabled={!logs || logs.length === 0}
          >
            <Download className="h-4 w-4 mr-2" />
            Export CSV
          </Button>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className={cn(
                  "justify-start text-left font-normal",
                  !startDate && "text-muted-foreground"
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {startDate ? format(startDate, "MMM d, yyyy") : "Start date"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={startDate}
                onSelect={setStartDate}
                disabled={(date) => date > new Date() || (endDate ? date > endDate : false)}
                initialFocus
                className={cn("p-3 pointer-events-auto")}
              />
            </PopoverContent>
          </Popover>
          <span className="text-muted-foreground text-sm">to</span>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className={cn(
                  "justify-start text-left font-normal",
                  !endDate && "text-muted-foreground"
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {endDate ? format(endDate, "MMM d, yyyy") : "End date"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={endDate}
                onSelect={setEndDate}
                disabled={(date) => date > new Date() || (startDate ? date < startDate : false)}
                initialFocus
                className={cn("p-3 pointer-events-auto")}
              />
            </PopoverContent>
          </Popover>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setStartDate(subDays(new Date(), 7));
              setEndDate(new Date());
            }}
          >
            Last 7 days
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setStartDate(subDays(new Date(), 30));
              setEndDate(new Date());
            }}
          >
            Last 30 days
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {!logs || logs.length === 0 ? (
          <AuraEmptyState icon={History} title="No reminders found" description="Try adjusting the date range" />
        ) : (
          <>
            <p className="text-sm text-muted-foreground mb-3">{logs.length} reminder{logs.length !== 1 ? 's' : ''} found</p>
            <ScrollArea className="h-[400px] pr-4">
              <div className="space-y-3">
                {logs.map((log) => (
                  <div
                    key={log.id}
                    className="flex items-start gap-3 p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
                  >
                    <div className="flex items-center gap-2 mt-0.5">
                      {getStatusIcon(log.status)}
                      {getChannelIcon(log.channel)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <Badge variant="outline" className="text-xs">
                          {log.reminder_type}
                        </Badge>
                        {getStatusBadge(log.status)}
                        <span className="text-xs text-muted-foreground">
                          {format(new Date(log.created_at), "MMM d, yyyy h:mm a")}
                        </span>
                      </div>
                      {log.recipient && (
                        <p className="text-sm text-muted-foreground mt-1 truncate">
                          To: {log.recipient}
                        </p>
                      )}
                      {log.message_preview && (
                        <p className="text-sm mt-1 truncate">{log.message_preview}</p>
                      )}
                      {log.error_message && (
                        <p className="text-sm text-destructive mt-1">{log.error_message}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </>
        )}
      </CardContent>
    </Card>
  );
}
