import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, CheckCircle, UserPlus, Users } from 'lucide-react';

const JOB_TYPES = [
  { value: 'technician', label: 'Technician' },
  { value: 'booking_agent', label: 'Scheduling Agent' },
  { value: 'dispatch', label: 'Dispatch' },
  { value: 'marketing_manager', label: 'Marketing Manager' },
  { value: 'sales_rep', label: 'Sales Rep' },
  { value: 'customer_service', label: 'Customer Service' },
  { value: 'inventory_manager', label: 'Inventory Manager' },
  { value: 'billing_specialist', label: 'Billing Specialist' },
  { value: 'compliance_officer', label: 'Compliance Officer' },
  { value: 'analytics_manager', label: 'Analytics Manager' },
];

interface CreateTestAccountsProps {
  companyId: string;
}

export function CreateTestAccounts({ companyId }: CreateTestAccountsProps) {
  const [loading, setLoading] = useState(false);
  const [creatingAll, setCreatingAll] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('Test123!');
  const [fullName, setFullName] = useState('');
  const [jobType, setJobType] = useState('');
  const [createdAccounts, setCreatedAccounts] = useState<string[]>([]);
  
  // Customer form state
  const [customerEmail, setCustomerEmail] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [customerLoading, setCustomerLoading] = useState(false);
  const [createdCustomers, setCreatedCustomers] = useState<string[]>([]);
  
  const { toast } = useToast();

  const createEmployeeAccount = async (type: string, emailOverride?: string, nameOverride?: string) => {
    const accountEmail = emailOverride || `${type.replace('_', '')}@test.com`;
    const accountName = nameOverride || `Test ${type.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}`;

    const { data, error } = await supabase.functions.invoke('create-demo-employee', {
      body: {
        email: accountEmail,
        password: 'Test123!',
        fullName: accountName,
        companyId,
        jobType: type,
      },
    });

    if (error) throw error;
    return data;
  };

  const createCustomerAccount = async (emailVal: string, nameVal: string) => {
    const { data, error } = await supabase.functions.invoke('create-demo-customer', {
      body: {
        email: emailVal,
        password: 'Test123!',
        fullName: nameVal,
        companyIds: [companyId],
      },
    });

    if (error) throw error;
    return data;
  };

  const handleCreateSingleEmployee = async () => {
    if (!email || !jobType) {
      toast({ title: 'Missing fields', description: 'Please fill in email and job type', variant: 'destructive' });
      return;
    }

    setLoading(true);
    try {
      await createEmployeeAccount(jobType, email, fullName || undefined);
      setCreatedAccounts(prev => [...prev, jobType]);
      toast({ title: 'Account created', description: `Test account for ${jobType} created successfully` });
      setEmail('');
      setFullName('');
      setJobType('');
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const handleCreateAllEmployees = async () => {
    setCreatingAll(true);
    const results: string[] = [];

    for (const type of JOB_TYPES) {
      try {
        await createEmployeeAccount(type.value);
        results.push(type.value);
        setCreatedAccounts(prev => [...prev, type.value]);
      } catch (error: any) {
        console.error(`Failed to create ${type.value}:`, error);
      }
    }

    toast({
      title: 'Bulk creation complete',
      description: `Created ${results.length} of ${JOB_TYPES.length} test accounts`,
    });
    setCreatingAll(false);
  };

  const handleCreateCustomer = async () => {
    if (!customerEmail) {
      toast({ title: 'Missing email', description: 'Please enter an email address', variant: 'destructive' });
      return;
    }

    setCustomerLoading(true);
    try {
      await createCustomerAccount(customerEmail, customerName || 'Test Customer');
      setCreatedCustomers(prev => [...prev, customerEmail]);
      toast({ title: 'Customer created', description: `Test customer ${customerEmail} created successfully` });
      setCustomerEmail('');
      setCustomerName('');
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } finally {
      setCustomerLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <UserPlus className="h-5 w-5" />
          Create Test Accounts
        </CardTitle>
        <CardDescription className="text-white/70">
          Create test accounts for employees and customers. Default password: Test123!
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="employees" className="w-full">
          <TabsList>
            <TabsTrigger value="employees">Employees</TabsTrigger>
            <TabsTrigger value="customers">Customers</TabsTrigger>
          </TabsList>
          
          <TabsContent value="employees" className="space-y-6 mt-4">
            {/* Single employee account creation */}
            <div className="space-y-4">
              <h3 className="text-sm font-medium">Create Single Employee</h3>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="test@test.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="fullName">Full Name</Label>
                  <Input
                    id="fullName"
                    placeholder="Test User"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="jobType">Job Type</Label>
                  <Select value={jobType} onValueChange={setJobType}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select job type" />
                    </SelectTrigger>
                    <SelectContent>
                      {JOB_TYPES.map((type) => (
                        <SelectItem key={type.value} value={type.value}>
                          {type.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-end">
                  <Button onClick={handleCreateSingleEmployee} disabled={loading}>
                    {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Create Employee
                  </Button>
                </div>
              </div>
            </div>

            {/* Bulk creation */}
            <div className="border-t pt-4">
              <h3 className="text-sm font-medium mb-4">Create All Test Employees</h3>
              <p className="text-sm text-white/70 mb-4">
                Creates one test account per job type with emails like technician@test.com, dispatch@test.com, etc.
              </p>
              <Button onClick={handleCreateAllEmployees} disabled={creatingAll} variant="outline">
                {creatingAll && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Create All 10 Test Employees
              </Button>
            </div>

            {/* Created accounts list */}
            {createdAccounts.length > 0 && (
              <div className="border-t pt-4">
                <h3 className="text-sm font-medium mb-2">Created Employees</h3>
                <div className="flex flex-wrap gap-2">
                  {createdAccounts.map((type, idx) => (
                    <div key={`${type}-${idx}`} className="flex items-center gap-1 text-sm bg-green-100 text-green-800 px-2 py-1 rounded">
                      <CheckCircle className="h-3 w-3" />
                      {type.replace('_', ' ')}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="customers" className="space-y-6 mt-4">
            {/* Customer account creation */}
            <div className="space-y-4">
              <h3 className="text-sm font-medium flex items-center gap-2">
                <Users className="h-4 w-4" />
                Create Customer Account
              </h3>
              <p className="text-sm text-white/70">
                Creates a customer account associated with this company. They can log in at the customer portal.
              </p>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="customerEmail">Email</Label>
                  <Input
                    id="customerEmail"
                    type="email"
                    placeholder="customer@test.com"
                    value={customerEmail}
                    onChange={(e) => setCustomerEmail(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="customerName">Full Name</Label>
                  <Input
                    id="customerName"
                    placeholder="Test Customer"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                  />
                </div>
              </div>
              <Button onClick={handleCreateCustomer} disabled={customerLoading}>
                {customerLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Create Customer
              </Button>
            </div>

            {/* Created customers list */}
            {createdCustomers.length > 0 && (
              <div className="border-t pt-4">
                <h3 className="text-sm font-medium mb-2">Created Customers</h3>
                <div className="flex flex-wrap gap-2">
                  {createdCustomers.map((email) => (
                    <div key={email} className="flex items-center gap-1 text-sm bg-blue-100 text-blue-800 px-2 py-1 rounded">
                      <CheckCircle className="h-3 w-3" />
                      {email}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
