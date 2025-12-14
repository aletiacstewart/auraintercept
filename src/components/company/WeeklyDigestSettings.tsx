import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { Skeleton } from '@/components/ui/skeleton';
import { Mail, CalendarDays, Info } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useState, useEffect } from 'react';

const DAYS_OF_WEEK = [
  { value: '0', label: 'Sunday' },
  { value: '1', label: 'Monday' },
  { value: '2', label: 'Tuesday' },
  { value: '3', label: 'Wednesday' },
  { value: '4', label: 'Thursday' },
  { value: '5', label: 'Friday' },
  { value: '6', label: 'Saturday' },
];

export function WeeklyDigestSettings() {
  const { companyId } = useAuth();
  const queryClient = useQueryClient();
  
  const [enabled, setEnabled] = useState<boolean>(false);
  const [email, setEmail] = useState<string>('');
  const [day, setDay] = useState<string>('1');

  const { data: company, isLoading } = useQuery({
    queryKey: ['company-weekly-digest', companyId],
    queryFn: async () => {
      if (!companyId) return null;
      const { data, error } = await supabase
        .from('companies')
        .select('weekly_digest_enabled, weekly_digest_email, weekly_digest_day, last_weekly_digest_at')
        .eq('id', companyId)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!companyId,
  });

  useEffect(() => {
    if (company) {
      setEnabled(company.weekly_digest_enabled || false);
      setEmail(company.weekly_digest_email || '');
      setDay(String(company.weekly_digest_day ?? 1));
    }
  }, [company]);

  const updateMutation = useMutation({
    mutationFn: async (updates: {
      weekly_digest_enabled?: boolean;
      weekly_digest_email?: string | null;
      weekly_digest_day?: number;
    }) => {
      if (!companyId) throw new Error('No company ID');
      const { error } = await supabase
        .from('companies')
        .update(updates)
        .eq('id', companyId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['company-weekly-digest', companyId] });
      toast.success('Digest settings updated');
    },
    onError: () => {
      toast.error('Failed to update settings');
    },
  });

  const handleSave = () => {
    if (enabled && !email) {
      toast.error('Please enter an email address');
      return;
    }
    updateMutation.mutate({
      weekly_digest_enabled: enabled,
      weekly_digest_email: email || null,
      weekly_digest_day: parseInt(day),
    });
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-72" />
        </CardHeader>
        <CardContent className="space-y-4">
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CalendarDays className="h-5 w-5 text-primary" />
          Weekly Performance Digest
        </CardTitle>
        <CardDescription>
          Receive a weekly summary of appointments, reminders, and subscription trends
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <Alert>
          <Info className="h-4 w-4" />
          <AlertDescription>
            Get a comprehensive weekly report including appointment stats, reminder delivery rates,
            and customer subscription trends sent directly to your inbox.
          </AlertDescription>
        </Alert>

        <div className="flex items-center justify-between p-4 rounded-lg border bg-card">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-full bg-primary/10">
              <Mail className="h-5 w-5 text-primary" />
            </div>
            <div>
              <Label htmlFor="digest-enabled" className="text-base font-medium">
                Enable Weekly Digest
              </Label>
              <p className="text-sm text-muted-foreground">
                Receive performance reports via email
              </p>
            </div>
          </div>
          <Switch
            id="digest-enabled"
            checked={enabled}
            onCheckedChange={setEnabled}
          />
        </div>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="digest-email">Recipient Email</Label>
            <div className="flex items-center gap-2">
              <Mail className="h-4 w-4 text-muted-foreground" />
              <Input
                id="digest-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@company.com"
                disabled={!enabled}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="digest-day">Send On</Label>
            <Select value={day} onValueChange={setDay} disabled={!enabled}>
              <SelectTrigger id="digest-day">
                <SelectValue placeholder="Select day" />
              </SelectTrigger>
              <SelectContent>
                {DAYS_OF_WEEK.map((d) => (
                  <SelectItem key={d.value} value={d.value}>
                    {d.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              Digest will be sent every {DAYS_OF_WEEK.find(d => d.value === day)?.label} morning
            </p>
          </div>
        </div>

        {company?.last_weekly_digest_at && (
          <p className="text-sm text-muted-foreground">
            Last digest sent: {new Date(company.last_weekly_digest_at).toLocaleString()}
          </p>
        )}

        <Button 
          onClick={handleSave} 
          disabled={updateMutation.isPending}
          className="w-full"
        >
          {updateMutation.isPending ? 'Saving...' : 'Save Digest Settings'}
        </Button>
      </CardContent>
    </Card>
  );
}
