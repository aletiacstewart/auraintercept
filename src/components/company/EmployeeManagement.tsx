import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { toast } from 'sonner';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Plus, Copy, Users, Mail, Clock, Check, Briefcase, Settings2, Trash2 } from 'lucide-react';
import { format } from 'date-fns';

// Job types that correspond to AI agent categories
const JOB_TYPES = [
  { value: 'technician', label: 'Technician', description: 'Field service & repairs', color: 'bg-blue-500' },
  { value: 'booking_agent', label: 'Scheduling Agent', description: 'Scheduling & appointments', color: 'bg-green-500' },
  { value: 'dispatch', label: 'Dispatch', description: 'Emergency routing & assignment', color: 'bg-red-500' },
  { value: 'customer_service', label: 'Customer Service', description: 'Triage & follow-up', color: 'bg-purple-500' },
  { value: 'billing', label: 'Billing', description: 'Invoicing & quotes', color: 'bg-yellow-500' },
  { value: 'marketing', label: 'Marketing', description: 'Campaigns & outreach', color: 'bg-pink-500' },
  { value: 'inventory', label: 'Inventory', description: 'Stock management', color: 'bg-orange-500' },
  { value: 'analytics', label: 'Analytics', description: 'Reports & insights', color: 'bg-cyan-500' },
] as const;

type JobType = typeof JOB_TYPES[number]['value'];

function generateRegistrationCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 8; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

export function EmployeeManagement() {
  const { companyId, user } = useAuth();
  const queryClient = useQueryClient();
  const [inviteOpen, setInviteOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [generatedCode, setGeneratedCode] = useState<string | null>(null);

  // Fetch employees
  const { data: employees, isLoading: employeesLoading } = useQuery({
    queryKey: ['employees', companyId],
    queryFn: async () => {
      if (!companyId) return [];
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('company_id', companyId);
      
      if (error) throw error;
      return data;
    },
    enabled: !!companyId,
  });

  // Fetch employee job assignments
  const { data: jobAssignments, isLoading: jobsLoading } = useQuery({
    queryKey: ['employee-job-assignments', companyId],
    queryFn: async () => {
      if (!companyId) return [];
      const { data, error } = await supabase
        .from('employee_job_assignments')
        .select('*')
        .eq('company_id', companyId);
      
      if (error) throw error;
      return data;
    },
    enabled: !!companyId,
  });

  // Fetch pending invites
  const { data: pendingCodes, isLoading: codesLoading } = useQuery({
    queryKey: ['registration-codes', companyId],
    queryFn: async () => {
      if (!companyId) return [];
      const { data, error } = await supabase
        .from('employee_registration_codes')
        .select('*')
        .eq('company_id', companyId)
        .eq('used', false)
        .gt('expires_at', new Date().toISOString())
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data;
    },
    enabled: !!companyId,
  });

  // Generate invite code mutation
  const generateCodeMutation = useMutation({
    mutationFn: async (email: string) => {
      if (!companyId) throw new Error('No company ID');

      const code = generateRegistrationCode();
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 7); // 7 day expiry

      const { error } = await supabase
        .from('employee_registration_codes')
        .insert({
          company_id: companyId,
          code,
          email: email || null,
          expires_at: expiresAt.toISOString(),
        });

      if (error) throw error;
      return code;
    },
    onSuccess: (code) => {
      setGeneratedCode(code);
      queryClient.invalidateQueries({ queryKey: ['registration-codes'] });
      toast.success('Invite code generated!');
    },
    onError: (error) => {
      console.error('Error generating code:', error);
      toast.error('Failed to generate invite code');
    },
  });

  // Toggle job type mutation
  const toggleJobTypeMutation = useMutation({
    mutationFn: async ({ employeeId, jobType, isAssigned }: { employeeId: string; jobType: JobType; isAssigned: boolean }) => {
      if (!companyId) throw new Error('No company ID');

      if (isAssigned) {
        // Remove job type
        const { error } = await supabase
          .from('employee_job_assignments')
          .delete()
          .eq('employee_id', employeeId)
          .eq('job_type', jobType)
          .eq('company_id', companyId);
        if (error) throw error;
      } else {
        // Add job type (upsert to avoid duplicate constraint errors)
        const { error } = await supabase
          .from('employee_job_assignments')
          .upsert(
            {
              employee_id: employeeId,
              job_type: jobType,
              company_id: companyId,
              assigned_by: user?.id,
            },
            { onConflict: 'employee_id,job_type' }
          );
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employee-job-assignments'] });
      toast.success('Job assignments updated');
    },
    onError: (error) => {
      console.error('Error updating job assignment:', error);
      toast.error('Failed to update job assignment');
    },
  });

  // Remove employee mutation
  const removeEmployeeMutation = useMutation({
    mutationFn: async (employeeId: string) => {
      if (!companyId) throw new Error('No company ID');

      // First delete job assignments
      await supabase
        .from('employee_job_assignments')
        .delete()
        .eq('employee_id', employeeId)
        .eq('company_id', companyId);

      // Then remove company_id from profile (unlink from company)
      const { error } = await supabase
        .from('profiles')
        .update({ company_id: null })
        .eq('id', employeeId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employees'] });
      queryClient.invalidateQueries({ queryKey: ['employee-job-assignments'] });
      toast.success('Employee removed successfully');
    },
    onError: (error) => {
      console.error('Error removing employee:', error);
      toast.error('Failed to remove employee');
    },
  });

  const handleGenerateCode = () => {
    generateCodeMutation.mutate(inviteEmail);
  };

  const handleCopyCode = () => {
    if (generatedCode) {
      navigator.clipboard.writeText(generatedCode);
      toast.success('Code copied to clipboard!');
    }
  };

  const handleCloseDialog = () => {
    setInviteOpen(false);
    setInviteEmail('');
    setGeneratedCode(null);
  };

  const getEmployeeJobs = (employeeId: string): JobType[] => {
    return (jobAssignments || [])
      .filter(ja => ja.employee_id === employeeId)
      .map(ja => ja.job_type as JobType);
  };

  const isLoading = employeesLoading || codesLoading || jobsLoading;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Employees</h1>
          <p className="text-muted-foreground">
            Manage your team and assign job roles
          </p>
        </div>
        <Dialog open={inviteOpen} onOpenChange={setInviteOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="w-4 h-4" />
              Invite Employee
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Invite New Employee</DialogTitle>
              <DialogDescription>
                Generate a registration code for a new team member
              </DialogDescription>
            </DialogHeader>

            {!generatedCode ? (
              <div className="space-y-4 pt-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email Address (Optional)</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="employee@company.com"
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                  />
                  <p className="text-xs text-muted-foreground">
                    If provided, only this email can use the code
                  </p>
                </div>
                <Button
                  className="w-full"
                  onClick={handleGenerateCode}
                  disabled={generateCodeMutation.isPending}
                >
                  {generateCodeMutation.isPending ? 'Generating...' : 'Generate Code'}
                </Button>
              </div>
            ) : (
              <div className="space-y-4 pt-4">
                <div className="text-center">
                  <Check className="w-12 h-12 mx-auto text-green-500 mb-3" />
                  <p className="text-sm text-muted-foreground mb-4">
                    Share this code with your employee
                  </p>
                  <div className="flex items-center gap-2 justify-center">
                    <code className="text-2xl font-mono font-bold tracking-widest bg-muted px-4 py-2 rounded-lg">
                      {generatedCode}
                    </code>
                    <Button size="icon" variant="outline" onClick={handleCopyCode}>
                      <Copy className="w-4 h-4" />
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground mt-3">
                    This code expires in 7 days
                  </p>
                </div>
                <Button variant="outline" className="w-full" onClick={handleCloseDialog}>
                  Done
                </Button>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="border-border/50">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Employees
            </CardTitle>
            <Users className="w-5 h-5 text-primary" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <div className="text-3xl font-bold">{employees?.length ?? 0}</div>
            )}
          </CardContent>
        </Card>

        <Card className="border-border/50">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Pending Invites
            </CardTitle>
            <Mail className="w-5 h-5 text-secondary" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <div className="text-3xl font-bold">{pendingCodes?.length ?? 0}</div>
            )}
          </CardContent>
        </Card>

        <Card className="border-border/50">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Job Roles Assigned
            </CardTitle>
            <Briefcase className="w-5 h-5 text-accent" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <div className="text-3xl font-bold">{jobAssignments?.length ?? 0}</div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Employees Table */}
      <Card className="border-border/50">
        <CardHeader>
          <CardTitle>Team Members</CardTitle>
          <CardDescription>
            Manage employees and their job roles for AI agent access
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : employees && employees.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Job Roles</TableHead>
                  <TableHead>Joined</TableHead>
                  <TableHead className="w-[100px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {employees.map((employee) => {
                  const employeeJobs = getEmployeeJobs(employee.id);
                  return (
                    <TableRow key={employee.id}>
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full gradient-primary flex items-center justify-center text-primary-foreground text-sm font-bold">
                            {employee.full_name?.charAt(0) || 'E'}
                          </div>
                          {employee.full_name || 'Unknown'}
                        </div>
                      </TableCell>
                      <TableCell>{employee.email}</TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {employeeJobs.length > 0 ? (
                            employeeJobs.map((job) => {
                              const jobInfo = JOB_TYPES.find(j => j.value === job);
                              return (
                                <Badge key={job} variant="secondary" className="text-xs">
                                  {jobInfo?.label || job}
                                </Badge>
                              );
                            })
                          ) : (
                            <span className="text-muted-foreground text-sm">No roles assigned</span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        {format(new Date(employee.created_at), 'MMM d, yyyy')}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Popover>
                            <PopoverTrigger asChild>
                              <Button variant="ghost" size="sm" className="gap-1">
                                <Settings2 className="w-4 h-4" />
                                Roles
                              </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-72 max-h-[400px] overflow-y-auto" align="end" side="left">
                              <div className="space-y-3">
                                <h4 className="font-medium text-sm">Assign Job Roles</h4>
                                <p className="text-xs text-muted-foreground">
                                  Selected roles grant access to related AI agents
                                </p>
                                <div className="space-y-2">
                                  {JOB_TYPES.map((job) => {
                                    const isAssigned = employeeJobs.includes(job.value);
                                    return (
                                      <div
                                        key={job.value}
                                        className="flex items-center gap-3 p-2 rounded-md hover:bg-muted/50 cursor-pointer"
                                        onClick={() => toggleJobTypeMutation.mutate({
                                          employeeId: employee.id,
                                          jobType: job.value,
                                          isAssigned,
                                        })}
                                      >
                                        <Checkbox
                                          checked={isAssigned}
                                          disabled={toggleJobTypeMutation.isPending}
                                        />
                                        <div className="flex-1">
                                          <div className="flex items-center gap-2">
                                            <div className={`w-2 h-2 rounded-full ${job.color}`} />
                                            <span className="text-sm font-medium">{job.label}</span>
                                          </div>
                                          <p className="text-xs text-muted-foreground">{job.description}</p>
                                        </div>
                                      </div>
                                    );
                                  })}
                                </div>
                              </div>
                            </PopoverContent>
                          </Popover>
                          
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive hover:bg-destructive/10">
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Remove Employee</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Are you sure you want to remove <strong>{employee.full_name || employee.email}</strong> from your company? 
                                  This will revoke their access and remove all job role assignments. This action cannot be undone.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => removeEmployeeMutation.mutate(employee.id)}
                                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                >
                                  Remove
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-8">
              <Users className="w-12 h-12 mx-auto text-muted-foreground mb-3" />
              <p className="text-muted-foreground">No employees yet</p>
              <p className="text-sm text-muted-foreground">
                Invite your first team member to get started
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Pending Invites */}
      {pendingCodes && pendingCodes.length > 0 && (
        <Card className="border-border/50 border-dashed">
          <CardHeader>
            <CardTitle className="text-lg">Pending Invitations</CardTitle>
            <CardDescription>
              Codes waiting to be used
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Code</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead>Expires</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pendingCodes.map((code) => (
                  <TableRow key={code.id}>
                    <TableCell>
                      <code className="font-mono bg-muted px-2 py-1 rounded text-sm">
                        {code.code}
                      </code>
                    </TableCell>
                    <TableCell>{code.email || 'Any email'}</TableCell>
                    <TableCell>
                      {format(new Date(code.created_at), 'MMM d, yyyy')}
                    </TableCell>
                    <TableCell>
                      {format(new Date(code.expires_at), 'MMM d, yyyy')}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}