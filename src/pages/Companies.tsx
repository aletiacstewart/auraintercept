import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { toast } from 'sonner';
import { 
  Building2, 
  Plus, 
  Search, 
  MoreHorizontal, 
  Pencil, 
  Users, 
  Settings,
  Loader2,
  ExternalLink,
  Copy,
  Check,
  Mail
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';

interface Company {
  id: string;
  name: string;
  slug: string;
  logo_url: string | null;
  primary_color: string | null;
  secondary_color: string | null;
  created_at: string;
  updated_at: string;
}

interface CompanyFormData {
  name: string;
  slug: string;
  primary_color: string;
  secondary_color: string;
  admin_email: string;
  admin_name: string;
}

export default function Companies() {
  const { userRole } = useAuth();
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState('');
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingCompany, setEditingCompany] = useState<Company | null>(null);
  const [formData, setFormData] = useState<CompanyFormData>({
    name: '',
    slug: '',
    primary_color: '#0EA5E9',
    secondary_color: '#8B5CF6',
    admin_email: '',
    admin_name: '',
  });
  const [createdCredentials, setCreatedCredentials] = useState<{ email: string; password: string } | null>(null);

  // Fetch all companies - hooks must be called before any conditional returns
  const { data: companies, isLoading } = useQuery({
    queryKey: ['companies'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('companies')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as Company[];
    },
    enabled: userRole === 'platform_admin',
  });

  // Fetch employee counts per company
  const { data: employeeCounts } = useQuery({
    queryKey: ['company-employee-counts'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('company_id');
      
      if (error) throw error;
      
      // Count employees per company
      const counts: Record<string, number> = {};
      data?.forEach((profile) => {
        if (profile.company_id) {
          counts[profile.company_id] = (counts[profile.company_id] || 0) + 1;
        }
      });
      return counts;
    },
    enabled: userRole === 'platform_admin',
  });

  // Create company mutation
  const createMutation = useMutation({
    mutationFn: async (data: CompanyFormData) => {
      // First create the company
      const { data: newCompany, error } = await supabase
        .from('companies')
        .insert({
          name: data.name,
          slug: data.slug.toLowerCase().replace(/\s+/g, '-'),
          primary_color: data.primary_color,
          secondary_color: data.secondary_color,
        })
        .select()
        .single();
      
      if (error) throw error;

      // If admin email provided, create the admin user
      if (data.admin_email) {
        const { data: adminResult, error: adminError } = await supabase.functions.invoke('create-company-admin', {
          body: {
            companyId: newCompany.id,
            adminEmail: data.admin_email,
            adminName: data.admin_name,
          },
        });

        if (adminError) {
          console.error('Admin creation error:', adminError);
          throw new Error(adminError.message || 'Failed to create company admin');
        }

        if (adminResult?.error) {
          throw new Error(adminResult.error);
        }

        return { company: newCompany, credentials: { email: data.admin_email, password: adminResult.tempPassword } };
      }

      return { company: newCompany, credentials: null };
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ['companies'] });
      queryClient.invalidateQueries({ queryKey: ['company-employee-counts'] });
      
      if (result.credentials) {
        setCreatedCredentials(result.credentials);
        toast.success('Company and admin created! Share the credentials with the admin.');
      } else {
        toast.success('Company created successfully!');
        setIsCreateOpen(false);
        resetForm();
      }
    },
    onError: (error: any) => {
      console.error('Create error:', error);
      if (error.message?.includes('duplicate')) {
        toast.error('A company with this slug already exists');
      } else {
        toast.error(error.message || 'Failed to create company');
      }
    },
  });

  // Update company mutation
  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: CompanyFormData }) => {
      const { error } = await supabase
        .from('companies')
        .update({
          name: data.name,
          slug: data.slug.toLowerCase().replace(/\s+/g, '-'),
          primary_color: data.primary_color,
          secondary_color: data.secondary_color,
        })
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['companies'] });
      toast.success('Company updated successfully!');
      setEditingCompany(null);
      resetForm();
    },
    onError: (error: any) => {
      console.error('Update error:', error);
      toast.error('Failed to update company');
    },
  });

  const resetForm = () => {
    setFormData({
      name: '',
      slug: '',
      primary_color: '#0EA5E9',
      secondary_color: '#8B5CF6',
      admin_email: '',
      admin_name: '',
    });
    setCreatedCredentials(null);
  };

  const handleEdit = (company: Company) => {
    setFormData({
      name: company.name,
      slug: company.slug,
      primary_color: company.primary_color || '#0EA5E9',
      secondary_color: company.secondary_color || '#8B5CF6',
      admin_email: '',
      admin_name: '',
    });
    setEditingCompany(company);
  };

  const handleSubmit = () => {
    if (!formData.name.trim()) {
      toast.error('Company name is required');
      return;
    }
    if (!formData.slug.trim()) {
      toast.error('Company slug is required');
      return;
    }

    if (editingCompany) {
      updateMutation.mutate({ id: editingCompany.id, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const generateSlug = (name: string) => {
    return name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
  };

  // Redirect non-platform admins (after all hooks)
  if (userRole !== 'platform_admin') {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <p className="text-muted-foreground">You don't have access to this page.</p>
        </div>
      </DashboardLayout>
    );
  }

  // Filter companies by search
  const filteredCompanies = companies?.filter((company) =>
    company.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    company.slug.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <DashboardLayout>
      <div className="space-y-6 animate-fade-in">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Companies</h1>
            <p className="text-muted-foreground">
              Manage tenant companies on the platform
            </p>
          </div>
          <Dialog open={isCreateOpen} onOpenChange={(open) => { setIsCreateOpen(open); if (!open) resetForm(); }}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Add Company
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle>
                  {createdCredentials ? 'Company Admin Credentials' : 'Create New Company'}
                </DialogTitle>
                <DialogDescription>
                  {createdCredentials 
                    ? 'Share these credentials securely with the company admin'
                    : 'Add a new tenant company to the platform'
                  }
                </DialogDescription>
              </DialogHeader>
              {createdCredentials ? (
                <CredentialsDisplay 
                  credentials={createdCredentials} 
                  onClose={() => { setIsCreateOpen(false); resetForm(); }} 
                />
              ) : (
                <CompanyForm
                  formData={formData}
                  setFormData={setFormData}
                  onSubmit={handleSubmit}
                  onCancel={() => { setIsCreateOpen(false); resetForm(); }}
                  isLoading={createMutation.isPending}
                  generateSlug={generateSlug}
                />
              )}
            </DialogContent>
          </Dialog>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card className="border-border/50">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Companies
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">{companies?.length || 0}</p>
            </CardContent>
          </Card>
          <Card className="border-border/50">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Employees
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">
                {Object.values(employeeCounts || {}).reduce((a, b) => a + b, 0)}
              </p>
            </CardContent>
          </Card>
          <Card className="border-border/50">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                This Month
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">
                {companies?.filter(c => {
                  const created = new Date(c.created_at);
                  const now = new Date();
                  return created.getMonth() === now.getMonth() && 
                         created.getFullYear() === now.getFullYear();
                }).length || 0}
              </p>
              <p className="text-xs text-muted-foreground">new companies</p>
            </CardContent>
          </Card>
        </div>

        {/* Search and Table */}
        <Card className="border-border/50">
          <CardHeader>
            <div className="flex items-center gap-4">
              <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search companies..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-3">
                {[1, 2, 3, 4, 5].map((i) => (
                  <Skeleton key={i} className="h-16 w-full" />
                ))}
              </div>
            ) : filteredCompanies && filteredCompanies.length > 0 ? (
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Company</TableHead>
                      <TableHead>Slug</TableHead>
                      <TableHead>Employees</TableHead>
                      <TableHead>Branding</TableHead>
                      <TableHead>Created</TableHead>
                      <TableHead className="w-[80px]"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredCompanies.map((company) => (
                      <TableRow key={company.id}>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <div 
                              className="w-10 h-10 rounded-lg flex items-center justify-center text-white font-bold"
                              style={{ backgroundColor: company.primary_color || '#0EA5E9' }}
                            >
                              {company.name.charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <p className="font-medium">{company.name}</p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="font-mono text-xs">
                            {company.slug}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1 text-muted-foreground">
                            <Users className="w-4 h-4" />
                            <span>{employeeCounts?.[company.id] || 0}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <div 
                              className="w-5 h-5 rounded-full border"
                              style={{ backgroundColor: company.primary_color || '#0EA5E9' }}
                              title="Primary color"
                            />
                            <div 
                              className="w-5 h-5 rounded-full border"
                              style={{ backgroundColor: company.secondary_color || '#8B5CF6' }}
                              title="Secondary color"
                            />
                          </div>
                        </TableCell>
                        <TableCell className="text-muted-foreground text-sm">
                          {format(new Date(company.created_at), 'MMM d, yyyy')}
                        </TableCell>
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon">
                                <MoreHorizontal className="w-4 h-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => handleEdit(company)}>
                                <Pencil className="w-4 h-4 mr-2" />
                                Edit
                              </DropdownMenuItem>
                              <DropdownMenuItem>
                                <Settings className="w-4 h-4 mr-2" />
                                Settings
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <div className="text-center py-12">
                <Building2 className="w-12 h-12 mx-auto text-muted-foreground mb-3" />
                <p className="text-muted-foreground">No companies found</p>
                <p className="text-sm text-muted-foreground">
                  {searchQuery ? 'Try a different search term' : 'Create your first company to get started'}
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Edit Dialog */}
      <Dialog open={!!editingCompany} onOpenChange={() => { setEditingCompany(null); resetForm(); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Company</DialogTitle>
            <DialogDescription>
              Update company details
            </DialogDescription>
          </DialogHeader>
          <CompanyForm
            formData={formData}
            setFormData={setFormData}
            onSubmit={handleSubmit}
            onCancel={() => { setEditingCompany(null); resetForm(); }}
            isLoading={updateMutation.isPending}
            generateSlug={generateSlug}
            isEdit
          />
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}

// Form component
function CompanyForm({
  formData,
  setFormData,
  onSubmit,
  onCancel,
  isLoading,
  generateSlug,
  isEdit = false,
}: {
  formData: CompanyFormData;
  setFormData: (data: CompanyFormData) => void;
  onSubmit: () => void;
  onCancel: () => void;
  isLoading: boolean;
  generateSlug: (name: string) => string;
  isEdit?: boolean;
}) {
  return (
    <div className="space-y-4 pt-4">
      <div className="space-y-2">
        <Label htmlFor="name">Company Name *</Label>
        <Input
          id="name"
          placeholder="Acme Corporation"
          value={formData.name}
          onChange={(e) => {
            const name = e.target.value;
            setFormData({
              ...formData,
              name,
              slug: !isEdit ? generateSlug(name) : formData.slug,
            });
          }}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="slug">URL Slug *</Label>
        <Input
          id="slug"
          placeholder="acme-corporation"
          value={formData.slug}
          onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
          className="font-mono"
        />
        <p className="text-xs text-muted-foreground">
          Used in widget URLs and API endpoints
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="primary_color">Primary Color</Label>
          <div className="flex gap-2">
            <Input
              type="color"
              id="primary_color"
              value={formData.primary_color}
              onChange={(e) => setFormData({ ...formData, primary_color: e.target.value })}
              className="w-12 h-10 p-1 cursor-pointer"
            />
            <Input
              value={formData.primary_color}
              onChange={(e) => setFormData({ ...formData, primary_color: e.target.value })}
              className="flex-1 font-mono text-sm"
            />
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="secondary_color">Secondary Color</Label>
          <div className="flex gap-2">
            <Input
              type="color"
              id="secondary_color"
              value={formData.secondary_color}
              onChange={(e) => setFormData({ ...formData, secondary_color: e.target.value })}
              className="w-12 h-10 p-1 cursor-pointer"
            />
            <Input
              value={formData.secondary_color}
              onChange={(e) => setFormData({ ...formData, secondary_color: e.target.value })}
              className="flex-1 font-mono text-sm"
            />
          </div>
        </div>
      </div>

      {/* Admin Assignment Section - Only for create */}
      {!isEdit && (
        <div className="border-t pt-4 mt-4">
          <div className="flex items-center gap-2 mb-3">
            <Mail className="w-4 h-4 text-muted-foreground" />
            <Label className="text-sm font-medium">Company Admin (Optional)</Label>
          </div>
          <div className="space-y-3">
            <div className="space-y-2">
              <Label htmlFor="admin_name">Admin Name</Label>
              <Input
                id="admin_name"
                placeholder="John Smith"
                value={formData.admin_name}
                onChange={(e) => setFormData({ ...formData, admin_name: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="admin_email">Admin Email</Label>
              <Input
                id="admin_email"
                type="email"
                placeholder="admin@company.com"
                value={formData.admin_email}
                onChange={(e) => setFormData({ ...formData, admin_email: e.target.value })}
              />
              <p className="text-xs text-muted-foreground">
                An account will be created and temporary credentials will be shown after creation
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="flex gap-3 pt-4">
        <Button variant="outline" className="flex-1" onClick={onCancel}>
          Cancel
        </Button>
        <Button className="flex-1" onClick={onSubmit} disabled={isLoading}>
          {isLoading ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              {isEdit ? 'Updating...' : 'Creating...'}
            </>
          ) : (
            isEdit ? 'Update Company' : 'Create Company'
          )}
        </Button>
      </div>
    </div>
  );
}

// Credentials display component
function CredentialsDisplay({ 
  credentials, 
  onClose 
}: { 
  credentials: { email: string; password: string }; 
  onClose: () => void;
}) {
  const [copiedEmail, setCopiedEmail] = useState(false);
  const [copiedPassword, setCopiedPassword] = useState(false);

  const copyToClipboard = async (text: string, type: 'email' | 'password') => {
    await navigator.clipboard.writeText(text);
    if (type === 'email') {
      setCopiedEmail(true);
      setTimeout(() => setCopiedEmail(false), 2000);
    } else {
      setCopiedPassword(true);
      setTimeout(() => setCopiedPassword(false), 2000);
    }
    toast.success(`${type === 'email' ? 'Email' : 'Password'} copied!`);
  };

  return (
    <div className="space-y-4 pt-4">
      <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-lg p-4">
        <p className="text-sm text-amber-800 dark:text-amber-200">
          <strong>Important:</strong> Share these credentials securely with the company admin. 
          They should change their password after first login.
        </p>
      </div>

      <div className="space-y-3">
        <div className="space-y-2">
          <Label>Email</Label>
          <div className="flex gap-2">
            <Input value={credentials.email} readOnly className="font-mono bg-muted" />
            <Button 
              variant="outline" 
              size="icon"
              onClick={() => copyToClipboard(credentials.email, 'email')}
            >
              {copiedEmail ? <Check className="w-4 h-4 text-green-600" /> : <Copy className="w-4 h-4" />}
            </Button>
          </div>
        </div>

        <div className="space-y-2">
          <Label>Temporary Password</Label>
          <div className="flex gap-2">
            <Input value={credentials.password} readOnly className="font-mono bg-muted" />
            <Button 
              variant="outline" 
              size="icon"
              onClick={() => copyToClipboard(credentials.password, 'password')}
            >
              {copiedPassword ? <Check className="w-4 h-4 text-green-600" /> : <Copy className="w-4 h-4" />}
            </Button>
          </div>
        </div>
      </div>

      <Button className="w-full" onClick={onClose}>
        Done
      </Button>
    </div>
  );
}
