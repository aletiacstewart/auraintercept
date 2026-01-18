import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { PageContainer } from '@/components/ui/page-container';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Checkbox } from '@/components/ui/checkbox';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { toast } from 'sonner';
import { ArrowLeft, Save, User, Mail, Phone, MapPin, Calendar, Briefcase, ChevronDown, Settings2 } from 'lucide-react';
import { format } from 'date-fns';
import { RolePermissionsEditor } from '@/components/company/RolePermissionsEditor';
import type { DbJobType } from '@/hooks/useRolePermissions';

const JOB_TYPES: { value: DbJobType; label: string; description: string; color: string }[] = [
  { value: 'technician', label: 'Technician', description: 'Field service & repairs', color: 'bg-blue-500' },
  { value: 'booking_agent', label: 'Scheduling Agent', description: 'Scheduling & appointments', color: 'bg-green-500' },
  { value: 'dispatch', label: 'Dispatch', description: 'Emergency routing & assignment', color: 'bg-red-500' },
  { value: 'customer_service', label: 'Customer Service', description: 'Triage & follow-up', color: 'bg-purple-500' },
  { value: 'manager', label: 'Manager', description: 'Team oversight & full access', color: 'bg-indigo-500' },
  { value: 'billing', label: 'Billing', description: 'Invoicing & quotes', color: 'bg-yellow-500' },
  { value: 'marketing', label: 'Marketing', description: 'Campaigns & outreach', color: 'bg-pink-500' },
  { value: 'inventory', label: 'Inventory', description: 'Stock management', color: 'bg-orange-500' },
  { value: 'analytics', label: 'Analytics', description: 'Reports & insights', color: 'bg-cyan-500' },
];

export default function EmployeeDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { companyId, userRole } = useAuth();
  const queryClient = useQueryClient();
  
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [homeAddress, setHomeAddress] = useState('');
  const [expandedRole, setExpandedRole] = useState<DbJobType | null>(null);

  const isCompanyAdmin = userRole === 'company_admin' || userRole === 'platform_admin';

  // Fetch employee details
  const { data: employee, isLoading } = useQuery({
    queryKey: ['employee-detail', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', id)
        .single();
      
      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });

  // Fetch job assignments
  const { data: jobAssignments = [] } = useQuery({
    queryKey: ['employee-jobs', id, companyId],
    queryFn: async () => {
      const { data } = await supabase
        .from('employee_job_assignments')
        .select('job_type')
        .eq('employee_id', id!)
        .eq('company_id', companyId!);
      return data?.map(j => j.job_type) || [];
    },
    enabled: !!id && !!companyId,
  });

  // Set initial form values when employee data loads
  useEffect(() => {
    if (employee) {
      setFullName(employee.full_name || '');
      setPhone(employee.phone || '');
      setHomeAddress(employee.home_address || '');
    }
  }, [employee]);

  // Update employee mutation
  const updateEmployeeMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from('profiles')
        .update({
          full_name: fullName,
          phone,
          home_address: homeAddress,
        })
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Employee updated successfully');
      queryClient.invalidateQueries({ queryKey: ['employee-detail', id] });
      queryClient.invalidateQueries({ queryKey: ['employees'] });
    },
    onError: (error) => {
      toast.error('Failed to update employee');
      console.error(error);
    },
  });

  // Toggle job type mutation
  const toggleJobTypeMutation = useMutation({
    mutationFn: async ({ jobType, isAssigned }: { jobType: DbJobType; isAssigned: boolean }) => {
      if (isAssigned) {
        const { error } = await supabase
          .from('employee_job_assignments')
          .delete()
          .eq('employee_id', id!)
          .eq('company_id', companyId!)
          .eq('job_type', jobType);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('employee_job_assignments')
          .insert([{
            employee_id: id!,
            company_id: companyId!,
            job_type: jobType,
          }]);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employee-jobs', id, companyId] });
      queryClient.invalidateQueries({ queryKey: ['job-assignments'] });
      toast.success('Job role updated');
    },
    onError: () => {
      toast.error('Failed to update job role');
    },
  });

  if (isLoading) {
    return (
      <DashboardLayout>
        <PageContainer>
          <div className="space-y-6">
            <Skeleton className="h-8 w-64" />
            <Skeleton className="h-[400px] w-full" />
          </div>
        </PageContainer>
      </DashboardLayout>
    );
  }

  if (!employee) {
    return (
      <DashboardLayout>
        <PageContainer>
          <div className="flex flex-col items-center justify-center h-[400px] text-white/70">
            <p>Employee not found</p>
            <Button variant="outline" className="mt-4" onClick={() => navigate('/dashboard/employees')}>
              Back to Employees
            </Button>
          </div>
        </PageContainer>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <PageContainer>
        <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate('/dashboard/employees')}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full gradient-primary flex items-center justify-center text-primary-foreground text-2xl font-bold">
              {employee.full_name?.charAt(0) || 'E'}
            </div>
            <div>
              <h1 className="text-2xl font-bold">{employee.full_name || 'Unknown Employee'}</h1>
              <p className="text-white/70">{employee.email}</p>
            </div>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Basic Information */}
          <Card className="border-border/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5 text-primary" />
                Employee Information
              </CardTitle>
              <CardDescription className="text-white/70">
                Update employee details
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="fullName">Full Name</Label>
                <Input
                  id="fullName"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Enter full name"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-white/50" />
                  <Input
                    id="email"
                    value={employee.email || ''}
                    disabled
                    className="bg-muted/50"
                  />
                </div>
                <p className="text-xs text-white/50">Email cannot be changed</p>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="phone">Phone</Label>
                <div className="flex items-center gap-2">
                  <Phone className="h-4 w-4 text-white/50" />
                  <Input
                    id="phone"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="Enter phone number"
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="address">Home Address</Label>
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-white/50" />
                  <Input
                    id="address"
                    value={homeAddress}
                    onChange={(e) => setHomeAddress(e.target.value)}
                    placeholder="Enter home address"
                  />
                </div>
              </div>

              <div className="pt-4 flex items-center justify-between text-sm text-white/50">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  Joined: {employee.created_at ? format(new Date(employee.created_at), 'MMM d, yyyy') : 'Unknown'}
                </div>
              </div>

              <Button 
                className="w-full gap-2" 
                onClick={() => updateEmployeeMutation.mutate()}
                disabled={updateEmployeeMutation.isPending}
              >
                <Save className="h-4 w-4" />
                {updateEmployeeMutation.isPending ? 'Saving...' : 'Save Changes'}
              </Button>
            </CardContent>
          </Card>

          {/* Job Roles */}
          <Card className="border-border/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Briefcase className="h-5 w-5 text-primary" />
                Job Roles
              </CardTitle>
              <CardDescription className="text-white/70">
                Assign job roles to grant access to related AI agents
                {isCompanyAdmin && (
                  <span className="block mt-1 text-xs text-primary">
                    Click <Settings2 className="h-3 w-3 inline" /> to customize role permissions
                  </span>
                )}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {JOB_TYPES.map((job) => {
                  const isAssigned = jobAssignments.includes(job.value);
                  const isExpanded = expandedRole === job.value;
                  
                  return (
                    <div key={job.value} className="space-y-2">
                      <div
                        className={`flex items-center gap-3 p-3 rounded-lg border transition-colors ${
                          isAssigned 
                            ? 'border-primary/50 bg-primary/10' 
                            : 'border-border/50 hover:bg-muted/50'
                        }`}
                      >
                        <Checkbox
                          checked={isAssigned}
                          disabled={toggleJobTypeMutation.isPending}
                          onCheckedChange={() => toggleJobTypeMutation.mutate({
                            jobType: job.value,
                            isAssigned,
                          })}
                        />
                        <div 
                          className="flex-1 cursor-pointer"
                          onClick={() => toggleJobTypeMutation.mutate({
                            jobType: job.value,
                            isAssigned,
                          })}
                        >
                          <div className="flex items-center gap-2">
                            <div className={`w-2 h-2 rounded-full ${job.color}`} />
                            <span className="font-medium">{job.label}</span>
                          </div>
                          <p className="text-xs text-muted-foreground ml-4">{job.description}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          {isAssigned && (
                            <Badge variant="secondary" className="text-xs">Active</Badge>
                          )}
                          {isCompanyAdmin && (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              onClick={(e) => {
                                e.stopPropagation();
                                setExpandedRole(isExpanded ? null : job.value);
                              }}
                            >
                              <ChevronDown className={`h-4 w-4 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                            </Button>
                          )}
                        </div>
                      </div>
                      
                      {/* Role Permissions Editor (collapsible) */}
                      {isCompanyAdmin && isExpanded && companyId && (
                        <div className="ml-4 animate-in slide-in-from-top-2">
                          <RolePermissionsEditor
                            companyId={companyId}
                            jobType={job.value}
                            jobLabel={job.label}
                          />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </div>
        </div>
      </PageContainer>
    </DashboardLayout>
  );
}
