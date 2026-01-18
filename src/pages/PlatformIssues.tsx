import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import {
  AlertTriangle,
  Bug,
  Lightbulb,
  Bot,
  Globe,
  CheckCircle2,
  Clock,
  XCircle,
  Eye,
  Filter,
  RefreshCw,
  AlertCircle,
} from 'lucide-react';
import { PageHeader } from '@/components/ui/page-header';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { PageContainer } from '@/components/ui/page-container';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

type IssueType = 'frontend_error' | 'ai_agent_error' | 'api_error' | 'user_reported' | 'feature_request';
type IssueSeverity = 'critical' | 'high' | 'medium' | 'low';
type IssueStatus = 'new' | 'acknowledged' | 'in_progress' | 'resolved' | 'wont_fix';

interface PlatformIssue {
  id: string;
  created_at: string;
  updated_at: string;
  issue_type: IssueType;
  severity: IssueSeverity;
  status: IssueStatus;
  company_id: string | null;
  user_id: string | null;
  user_role: string | null;
  title: string;
  description: string | null;
  error_stack: string | null;
  page_url: string | null;
  user_agent: string | null;
  metadata: Record<string, unknown> | null;
  resolved_at: string | null;
  resolved_by: string | null;
  resolution_notes: string | null;
}

const issueTypeConfig: Record<IssueType, { icon: typeof Bug; label: string; color: string }> = {
  frontend_error: { icon: AlertTriangle, label: 'Frontend Error', color: 'text-red-500' },
  ai_agent_error: { icon: Bot, label: 'AI Agent Error', color: 'text-purple-500' },
  api_error: { icon: Globe, label: 'API Error', color: 'text-orange-500' },
  user_reported: { icon: Bug, label: 'Bug Report', color: 'text-blue-500' },
  feature_request: { icon: Lightbulb, label: 'Feature Request', color: 'text-yellow-500' },
};

const severityConfig: Record<IssueSeverity, { label: string; variant: 'destructive' | 'default' | 'secondary' | 'outline' }> = {
  critical: { label: 'Critical', variant: 'destructive' },
  high: { label: 'High', variant: 'default' },
  medium: { label: 'Medium', variant: 'secondary' },
  low: { label: 'Low', variant: 'outline' },
};

const statusConfig: Record<IssueStatus, { icon: typeof Clock; label: string; color: string }> = {
  new: { icon: AlertTriangle, label: 'New', color: 'text-red-500' },
  acknowledged: { icon: Eye, label: 'Acknowledged', color: 'text-blue-500' },
  in_progress: { icon: Clock, label: 'In Progress', color: 'text-yellow-500' },
  resolved: { icon: CheckCircle2, label: 'Resolved', color: 'text-green-500' },
  wont_fix: { icon: XCircle, label: "Won't Fix", color: 'text-muted-foreground' },
};

export default function PlatformIssues() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [severityFilter, setSeverityFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedIssue, setSelectedIssue] = useState<PlatformIssue | null>(null);
  const [resolutionNotes, setResolutionNotes] = useState('');
  const [newStatus, setNewStatus] = useState<IssueStatus>('acknowledged');

  const { data: issues, isLoading, refetch } = useQuery({
    queryKey: ['platform-issues', statusFilter, typeFilter, severityFilter],
    queryFn: async () => {
      let query = supabase
        .from('platform_issues')
        .select('*')
        .order('created_at', { ascending: false });

      if (statusFilter !== 'all') {
        query = query.eq('status', statusFilter as IssueStatus);
      }
      if (typeFilter !== 'all') {
        query = query.eq('issue_type', typeFilter as IssueType);
      }
      if (severityFilter !== 'all') {
        query = query.eq('severity', severityFilter as IssueSeverity);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as PlatformIssue[];
    },
  });

  const updateIssueMutation = useMutation({
    mutationFn: async ({ id, status, notes }: { id: string; status: IssueStatus; notes?: string }) => {
      const updateData: {
        status: IssueStatus;
        resolution_notes: string | null;
        resolved_at?: string;
        resolved_by?: string | null;
      } = {
        status,
        resolution_notes: notes || null,
      };
      
      if (status === 'resolved' || status === 'wont_fix') {
        updateData.resolved_at = new Date().toISOString();
        updateData.resolved_by = user?.id || null;
      }

      const { error } = await supabase
        .from('platform_issues')
        .update(updateData)
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['platform-issues'] });
      toast({ title: 'Issue updated successfully' });
      setSelectedIssue(null);
      setResolutionNotes('');
    },
    onError: () => {
      toast({ title: 'Failed to update issue', variant: 'destructive' });
    },
  });

  const filteredIssues = issues?.filter((issue) =>
    searchQuery
      ? issue.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        issue.description?.toLowerCase().includes(searchQuery.toLowerCase())
      : true
  );

  const stats = {
    total: issues?.length || 0,
    new: issues?.filter((i) => i.status === 'new').length || 0,
    critical: issues?.filter((i) => i.severity === 'critical' && i.status !== 'resolved').length || 0,
    resolved: issues?.filter((i) => i.status === 'resolved').length || 0,
  };

  return (
    <DashboardLayout>
      <PageContainer>
        <div className="space-y-6">
          <PageHeader
            icon={AlertCircle}
            title="Platform Issues"
            description="Monitor and resolve issues across the platform"
            featureColor="platform"
            action={
              <Button onClick={() => refetch()} variant="outline" size="sm">
                <RefreshCw className="mr-2 h-4 w-4" />
                Refresh
              </Button>
            }
          />

          {/* Stats Cards */}
          <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Issues</CardTitle>
              <Bug className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">New</CardTitle>
              <AlertTriangle className="h-4 w-4 text-red-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-500">{stats.new}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Critical Unresolved</CardTitle>
              <AlertTriangle className="h-4 w-4 text-destructive" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-destructive">{stats.critical}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Resolved</CardTitle>
              <CheckCircle2 className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-500">{stats.resolved}</div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Filter className="h-5 w-5" />
              Filters
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-4">
              <div className="flex-1 min-w-[200px]">
                <Input
                  placeholder="Search issues..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[150px]">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="new">New</SelectItem>
                  <SelectItem value="acknowledged">Acknowledged</SelectItem>
                  <SelectItem value="in_progress">In Progress</SelectItem>
                  <SelectItem value="resolved">Resolved</SelectItem>
                  <SelectItem value="wont_fix">Won't Fix</SelectItem>
                </SelectContent>
              </Select>
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger className="w-[150px]">
                  <SelectValue placeholder="Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="frontend_error">Frontend Error</SelectItem>
                  <SelectItem value="ai_agent_error">AI Agent Error</SelectItem>
                  <SelectItem value="api_error">API Error</SelectItem>
                  <SelectItem value="user_reported">Bug Report</SelectItem>
                  <SelectItem value="feature_request">Feature Request</SelectItem>
                </SelectContent>
              </Select>
              <Select value={severityFilter} onValueChange={setSeverityFilter}>
                <SelectTrigger className="w-[150px]">
                  <SelectValue placeholder="Severity" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Severities</SelectItem>
                  <SelectItem value="critical">Critical</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="low">Low</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Issues Table */}
        <Card>
          <CardHeader>
            <CardTitle>Issues</CardTitle>
            <CardDescription>
              {filteredIssues?.length || 0} issues found
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-center py-8 text-muted-foreground">Loading issues...</div>
            ) : filteredIssues?.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">No issues found</div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Type</TableHead>
                    <TableHead>Title</TableHead>
                    <TableHead>Severity</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredIssues?.map((issue) => {
                    const typeInfo = issueTypeConfig[issue.issue_type];
                    const TypeIcon = typeInfo.icon;
                    const statusInfo = statusConfig[issue.status];
                    const StatusIcon = statusInfo.icon;
                    const severityInfo = severityConfig[issue.severity];

                    return (
                      <TableRow key={issue.id}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <TypeIcon className={`h-4 w-4 ${typeInfo.color}`} />
                            <span className="text-sm">{typeInfo.label}</span>
                          </div>
                        </TableCell>
                        <TableCell className="max-w-[300px]">
                          <div className="truncate font-medium">{issue.title}</div>
                          {issue.page_url && (
                            <div className="text-xs text-muted-foreground truncate">
                              {issue.page_url}
                            </div>
                          )}
                        </TableCell>
                        <TableCell>
                          <Badge variant={severityInfo.variant}>{severityInfo.label}</Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <StatusIcon className={`h-4 w-4 ${statusInfo.color}`} />
                            <span className="text-sm">{statusInfo.label}</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {format(new Date(issue.created_at), 'MMM d, h:mm a')}
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setSelectedIssue(issue);
                              setNewStatus(issue.status === 'new' ? 'acknowledged' : issue.status);
                              setResolutionNotes(issue.resolution_notes || '');
                            }}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {/* Issue Detail Dialog */}
        <Dialog open={!!selectedIssue} onOpenChange={() => setSelectedIssue(null)}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{selectedIssue?.title}</DialogTitle>
              <DialogDescription>
                {selectedIssue && issueTypeConfig[selectedIssue.issue_type].label} •{' '}
                {selectedIssue && format(new Date(selectedIssue.created_at), 'PPpp')}
              </DialogDescription>
            </DialogHeader>

            {selectedIssue && (
              <div className="space-y-4">
                <div className="flex gap-2">
                  <Badge variant={severityConfig[selectedIssue.severity].variant}>
                    {severityConfig[selectedIssue.severity].label}
                  </Badge>
                  <Badge variant="outline">{statusConfig[selectedIssue.status].label}</Badge>
                </div>

                {selectedIssue.description && (
                  <div>
                    <Label className="text-muted-foreground">Description</Label>
                    <p className="mt-1">{selectedIssue.description}</p>
                  </div>
                )}

                {selectedIssue.page_url && (
                  <div>
                    <Label className="text-muted-foreground">Page URL</Label>
                    <p className="mt-1 text-sm font-mono bg-muted p-2 rounded">
                      {selectedIssue.page_url}
                    </p>
                  </div>
                )}

                {selectedIssue.error_stack && (
                  <div>
                    <Label className="text-muted-foreground">Error Stack</Label>
                    <pre className="mt-1 text-xs bg-muted p-3 rounded overflow-auto max-h-48">
                      {selectedIssue.error_stack}
                    </pre>
                  </div>
                )}

                {selectedIssue.user_role && (
                  <div>
                    <Label className="text-muted-foreground">User Role</Label>
                    <p className="mt-1">{selectedIssue.user_role}</p>
                  </div>
                )}

                {/* Screenshot */}
                {(selectedIssue.metadata as { screenshot_url?: string })?.screenshot_url && (
                  <div>
                    <Label className="text-muted-foreground">Screenshot</Label>
                    <a
                      href={(selectedIssue.metadata as { screenshot_url: string }).screenshot_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block mt-1"
                    >
                      <img
                        src={(selectedIssue.metadata as { screenshot_url: string }).screenshot_url}
                        alt="Issue screenshot"
                        className="max-w-full h-auto max-h-64 rounded-lg border border-border hover:opacity-90 transition-opacity cursor-pointer"
                      />
                    </a>
                  </div>
                )}

                <div className="border-t pt-4 space-y-4">
                  <div>
                    <Label>Update Status</Label>
                    <Select value={newStatus} onValueChange={(v) => setNewStatus(v as IssueStatus)}>
                      <SelectTrigger className="mt-1">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="acknowledged">Acknowledged</SelectItem>
                        <SelectItem value="in_progress">In Progress</SelectItem>
                        <SelectItem value="resolved">Resolved</SelectItem>
                        <SelectItem value="wont_fix">Won't Fix</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label>Resolution Notes</Label>
                    <Textarea
                      className="mt-1"
                      value={resolutionNotes}
                      onChange={(e) => setResolutionNotes(e.target.value)}
                      placeholder="Add notes about the resolution..."
                      rows={3}
                    />
                  </div>

                  <Button
                    onClick={() =>
                      updateIssueMutation.mutate({
                        id: selectedIssue.id,
                        status: newStatus,
                        notes: resolutionNotes,
                      })
                    }
                    disabled={updateIssueMutation.isPending}
                    className="w-full"
                  >
                    {updateIssueMutation.isPending ? 'Updating...' : 'Update Issue'}
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
        </div>
      </PageContainer>
    </DashboardLayout>
  );
}
