import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
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
  Loader2,
  Copy,
  Check,
  Trash2
} from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
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

export function CompaniesManager() {
  const { userRole, companyId } = useAuth();
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
  const [deletingCompany, setDeletingCompany] = useState<Company | null>(null);

  const isPlatformAdmin = userRole === 'platform_admin';
  const isCompanyAdmin = userRole === 'company_admin';

  // Fetch all companies for platform admin, or single company for company admin
  const { data: companies, isLoading } = useQuery({
    queryKey: ['companies', isPlatformAdmin ? 'all' : companyId],
    queryFn: async () => {
      if (isPlatformAdmin) {
        const { data, error } = await supabase
          .from('companies')
          .select('*')
          .order('created_at', { ascending: false });
        
        if (error) throw error;
        return data as Company[];
      } else if (isCompanyAdmin && companyId) {
        const { data, error } = await supabase
          .from('companies')
          .select('*')
          .eq('id', companyId)
          .single();
        
        if (error) throw error;
        return [data] as Company[];
      }
      return [];
    },
    enabled: isPlatformAdmin || (isCompanyAdmin && !!companyId),
  });

  // Fetch employee counts per company
  const { data: employeeCounts } = useQuery({
    queryKey: ['company-employee-counts'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('company_id');
      
      if (error) throw error;
      
      const counts: Record<string, number> = {};
      data?.forEach((profile) => {
        if (profile.company_id) {
          counts[profile.company_id] = (counts[profile.company_id] || 0) + 1;
        }
      });
      return counts;
    },
    enabled: isPlatformAdmin,
  });

  // Create company mutation
  const createMutation = useMutation({
    mutationFn: async (data: CompanyFormData) => {
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

      if (data.admin_email) {
        const { data: adminResult, error: adminError } = await supabase.functions.invoke('create-company-admin', {
          body: {
            companyId: newCompany.id,
            adminEmail: data.admin_email,
            adminName: data.admin_name,
          },
        });

        if (adminError) throw new Error(adminError.message || 'Failed to create company admin');
        if (adminResult?.error) throw new Error(adminResult.error);

        return { company: newCompany, credentials: { email: data.admin_email, password: adminResult.tempPassword } };
      }

      return { company: newCompany, credentials: null };
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ['companies'] });
      queryClient.invalidateQueries({ queryKey: ['company-employee-counts'] });
      
      if (result.credentials) {
        setCreatedCredentials(result.credentials);
        toast.success('Company and admin created!');
      } else {
        toast.success('Company created successfully!');
        setIsCreateOpen(false);
        resetForm();
      }
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to create company');
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
    onError: () => {
      toast.error('Failed to update company');
    },
  });

  // Delete company mutation
  const deleteMutation = useMutation({
    mutationFn: async (companyId: string) => {
      const { error } = await supabase
        .from('companies')
        .delete()
        .eq('id', companyId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['companies'] });
      queryClient.invalidateQueries({ queryKey: ['company-employee-counts'] });
      toast.success('Company deleted successfully');
      setDeletingCompany(null);
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to delete company');
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
    if (!formData.name.trim() || !formData.slug.trim()) {
      toast.error('Company name and slug are required');
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

  const filteredCompanies = companies?.filter((company) =>
    company.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    company.slug.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (!isPlatformAdmin && !isCompanyAdmin) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        You don't have access to manage companies.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header with Search and Add */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search companies..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        {isPlatformAdmin && (
          <Button onClick={() => setIsCreateOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Add Company
          </Button>
        )}
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="border-border/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Companies</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <div className="text-3xl font-bold">{companies?.length ?? 0}</div>
            )}
          </CardContent>
        </Card>
        <Card className="border-border/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Employees</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <div className="text-3xl font-bold">
                {Object.values(employeeCounts || {}).reduce((a, b) => a + b, 0)}
              </div>
            )}
          </CardContent>
        </Card>
        <Card className="border-border/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Avg per Company</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <div className="text-3xl font-bold">
                {companies?.length ? Math.round(Object.values(employeeCounts || {}).reduce((a, b) => a + b, 0) / companies.length) : 0}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Companies Table */}
      <Card className="border-border/50">
        <CardHeader>
          <CardTitle>Companies</CardTitle>
          <CardDescription>Manage tenant companies on the platform</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : filteredCompanies && filteredCompanies.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Company</TableHead>
                  <TableHead>Slug</TableHead>
                  <TableHead>Employees</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead className="w-[100px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredCompanies.map((company) => (
                  <TableRow key={company.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div 
                          className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-sm font-bold"
                          style={{ backgroundColor: company.primary_color || '#0EA5E9' }}
                        >
                          {company.name.charAt(0).toUpperCase()}
                        </div>
                        <span className="font-medium">{company.name}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="font-mono">{company.slug}</Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Users className="h-4 w-4 text-muted-foreground" />
                        {employeeCounts?.[company.id] || 0}
                      </div>
                    </TableCell>
                    <TableCell>{format(new Date(company.created_at), 'MMM d, yyyy')}</TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleEdit(company)}>
                            <Pencil className="h-4 w-4 mr-2" />
                            Edit
                          </DropdownMenuItem>
                          {isPlatformAdmin && (
                            <DropdownMenuItem 
                              className="text-destructive"
                              onClick={() => setDeletingCompany(company)}
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Delete
                            </DropdownMenuItem>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-12 text-muted-foreground">
              <Building2 className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No companies found</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create/Edit Dialog */}
      <Dialog 
        open={isCreateOpen || !!editingCompany} 
        onOpenChange={(open) => { 
          if (!open) { 
            setIsCreateOpen(false); 
            setEditingCompany(null); 
            resetForm(); 
          } 
        }}
      >
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {createdCredentials ? 'Company Admin Credentials' : editingCompany ? 'Edit Company' : 'Create New Company'}
            </DialogTitle>
            <DialogDescription>
              {createdCredentials 
                ? 'Share these credentials securely with the company admin'
                : editingCompany ? 'Update company information' : 'Add a new tenant company to the platform'
              }
            </DialogDescription>
          </DialogHeader>
          
          {createdCredentials ? (
            <div className="space-y-4 pt-4">
              <div className="text-center">
                <Check className="w-12 h-12 mx-auto text-green-500 mb-3" />
                <p className="text-sm text-muted-foreground mb-4">
                  Share these credentials with the company admin
                </p>
              </div>
              <div className="space-y-3 bg-muted/50 rounded-lg p-4">
                <div>
                  <Label className="text-xs text-muted-foreground">Email</Label>
                  <div className="flex items-center gap-2">
                    <code className="flex-1 text-sm">{createdCredentials.email}</code>
                    <Button size="icon" variant="ghost" onClick={() => {
                      navigator.clipboard.writeText(createdCredentials.email);
                      toast.success('Email copied');
                    }}>
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Temporary Password</Label>
                  <div className="flex items-center gap-2">
                    <code className="flex-1 text-sm font-mono">{createdCredentials.password}</code>
                    <Button size="icon" variant="ghost" onClick={() => {
                      navigator.clipboard.writeText(createdCredentials.password);
                      toast.success('Password copied');
                    }}>
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
              <Button 
                variant="outline" 
                className="w-full" 
                onClick={() => { setIsCreateOpen(false); resetForm(); }}
              >
                Done
              </Button>
            </div>
          ) : (
            <div className="space-y-4 pt-4">
              <div className="space-y-2">
                <Label htmlFor="name">Company Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => {
                    setFormData({ 
                      ...formData, 
                      name: e.target.value,
                      slug: generateSlug(e.target.value)
                    });
                  }}
                  placeholder="Acme Corp"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="slug">Slug *</Label>
                <Input
                  id="slug"
                  value={formData.slug}
                  onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                  placeholder="acme-corp"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="primary_color">Primary Color</Label>
                  <div className="flex gap-2">
                    <input
                      type="color"
                      value={formData.primary_color}
                      onChange={(e) => setFormData({ ...formData, primary_color: e.target.value })}
                      className="w-10 h-10 rounded cursor-pointer"
                    />
                    <Input
                      value={formData.primary_color}
                      onChange={(e) => setFormData({ ...formData, primary_color: e.target.value })}
                      className="font-mono"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="secondary_color">Secondary Color</Label>
                  <div className="flex gap-2">
                    <input
                      type="color"
                      value={formData.secondary_color}
                      onChange={(e) => setFormData({ ...formData, secondary_color: e.target.value })}
                      className="w-10 h-10 rounded cursor-pointer"
                    />
                    <Input
                      value={formData.secondary_color}
                      onChange={(e) => setFormData({ ...formData, secondary_color: e.target.value })}
                      className="font-mono"
                    />
                  </div>
                </div>
              </div>
              {!editingCompany && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="admin_email">Admin Email (Optional)</Label>
                    <Input
                      id="admin_email"
                      type="email"
                      value={formData.admin_email}
                      onChange={(e) => setFormData({ ...formData, admin_email: e.target.value })}
                      placeholder="admin@company.com"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="admin_name">Admin Name</Label>
                    <Input
                      id="admin_name"
                      value={formData.admin_name}
                      onChange={(e) => setFormData({ ...formData, admin_name: e.target.value })}
                      placeholder="John Doe"
                    />
                  </div>
                </>
              )}
              <div className="flex justify-end gap-3 pt-2">
                <Button 
                  variant="outline" 
                  onClick={() => { 
                    setIsCreateOpen(false); 
                    setEditingCompany(null); 
                    resetForm(); 
                  }}
                >
                  Cancel
                </Button>
                <Button 
                  onClick={handleSubmit}
                  disabled={createMutation.isPending || updateMutation.isPending}
                >
                  {(createMutation.isPending || updateMutation.isPending) && (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  )}
                  {editingCompany ? 'Update' : 'Create'}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deletingCompany} onOpenChange={(open) => !open && setDeletingCompany(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Company?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete "{deletingCompany?.name}" and all associated data. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => deletingCompany && deleteMutation.mutate(deletingCompany.id)}
            >
              {deleteMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                'Delete'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
