import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { toast } from "@/hooks/use-toast";
import { Trash2, Mail, AlertTriangle, Ban, RefreshCw } from "lucide-react";
import { format } from "date-fns";

interface SuppressedEmail {
  id: string;
  email: string;
  reason: string;
  suppressed_at: string;
  source_event_id: string | null;
}

export function SuppressedEmailsManager() {
  const queryClient = useQueryClient();
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const { data: suppressedEmails, isLoading, refetch } = useQuery({
    queryKey: ["suppressed-emails"],
    queryFn: async () => {
      const { data: profile } = await supabase
        .from("profiles")
        .select("company_id")
        .eq("id", (await supabase.auth.getUser()).data.user?.id || "")
        .maybeSingle();

      if (!profile?.company_id) return [];

      const { data, error } = await supabase
        .from("suppressed_emails")
        .select("*")
        .eq("company_id", profile.company_id)
        .order("suppressed_at", { ascending: false });

      if (error) throw error;
      return data as SuppressedEmail[];
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("suppressed_emails")
        .delete()
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["suppressed-emails"] });
      toast({
        title: "Email unsuppressed",
        description: "The email address has been removed from the suppression list.",
      });
      setDeletingId(null);
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to remove email from suppression list.",
        variant: "destructive",
      });
      console.error("Error removing suppressed email:", error);
    },
  });

  const getReasonBadge = (reason: string) => {
    if (reason === "bounce") {
      return (
        <Badge variant="destructive" className="gap-1">
          <Ban className="h-3 w-3" />
          Bounced
        </Badge>
      );
    }
    return (
      <Badge variant="secondary" className="gap-1 bg-amber-100 text-amber-800 hover:bg-amber-100">
        <AlertTriangle className="h-3 w-3" />
        Complaint
      </Badge>
    );
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            Suppressed Emails
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Mail className="h-5 w-5" />
              Suppressed Emails
            </CardTitle>
            <CardDescription>
              Emails that have bounced or received spam complaints are automatically suppressed.
            </CardDescription>
          </div>
          <Button variant="outline" size="sm" onClick={() => refetch()}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {!suppressedEmails || suppressedEmails.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Mail className="h-12 w-12 mx-auto mb-3 opacity-30" />
            <p>No suppressed emails</p>
            <p className="text-sm mt-1">
              Emails that bounce or receive complaints will appear here.
            </p>
          </div>
        ) : (
          <>
            <div className="mb-4 p-3 bg-muted rounded-lg">
              <p className="text-sm text-muted-foreground">
                <strong>{suppressedEmails.length}</strong> email{suppressedEmails.length !== 1 ? "s" : ""} suppressed. 
                Digest emails will not be sent to these addresses until removed from this list.
              </p>
            </div>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Email Address</TableHead>
                  <TableHead>Reason</TableHead>
                  <TableHead>Suppressed On</TableHead>
                  <TableHead className="w-[100px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {suppressedEmails.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell className="font-medium">{item.email}</TableCell>
                    <TableCell>{getReasonBadge(item.reason)}</TableCell>
                    <TableCell className="text-muted-foreground">
                      {format(new Date(item.suppressed_at), "MMM d, yyyy 'at' h:mm a")}
                    </TableCell>
                    <TableCell>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-destructive hover:text-destructive hover:bg-destructive/10"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Remove from suppression list?</AlertDialogTitle>
                            <AlertDialogDescription>
                              This will allow digest emails to be sent to <strong>{item.email}</strong> again. 
                              If the email continues to bounce or receive complaints, it will be re-added automatically.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => deleteMutation.mutate(item.id)}
                              disabled={deleteMutation.isPending}
                            >
                              {deleteMutation.isPending ? "Removing..." : "Remove"}
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </>
        )}
      </CardContent>
    </Card>
  );
}
