import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, CheckCircle, UserPlus, Info } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

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

interface CreateEmployeeAccountsProps {
  companyId: string;
}

function generateTempPassword(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789!@#$%';
  let password = '';
  for (let i = 0; i < 12; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return password;
}

export function CreateTestEmployees({ companyId }: CreateEmployeeAccountsProps) {
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [fullName, setFullName] = useState('');
  const [jobType, setJobType] = useState('');
  const [createdAccounts, setCreatedAccounts] = useState<{ email: string; jobType: string }[]>([]);
  
  const { toast } = useToast();

  const handleCreateEmployee = async () => {
    if (!email || !jobType || !fullName) {
      toast({ title: 'Missing fields', description: 'Please fill in all fields', variant: 'destructive' });
      return;
    }

    setLoading(true);
    try {
      const tempPassword = generateTempPassword();
      
      const { data, error } = await supabase.functions.invoke('create-demo-employee', {
        body: {
          email,
          password: tempPassword,
          fullName,
          companyId,
          jobType,
          mustChangePassword: true,
          sendWelcomeEmail: true,
        },
      });

      if (error) throw error;
      
      setCreatedAccounts(prev => [...prev, { email, jobType }]);
      toast({ 
        title: 'Account created', 
        description: `Employee account created. A temporary password has been sent to ${email}. They will be prompted to change it on first login.` 
      });
      setEmail('');
      setFullName('');
      setJobType('');
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <UserPlus className="h-5 w-5" />
          Create Accounts
        </CardTitle>
        <CardDescription className="text-white/70">
          Create employee accounts, assign roles, and send temporary passwords via email. Employees will be prompted to change their password on first login.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Employee account creation */}
        <div className="space-y-4">
          <h3 className="text-sm font-medium">Create Employee Account</h3>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="employee@company.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="fullName">Full Name</Label>
              <Input
                id="fullName"
                placeholder="John Smith"
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
              <Button onClick={handleCreateEmployee} disabled={loading}>
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Create Employee
              </Button>
            </div>
          </div>
        </div>

        {/* Info about self-registration */}
        <Alert className="border-blue-500/50 bg-blue-500/10">
          <Info className="h-4 w-4 text-blue-400" />
          <AlertDescription className="text-white/80">
            <strong>Employee Self-Registration:</strong> If you prefer employees to sign up themselves, 
            share your company's <strong>Registration Code</strong> (found on the dashboard next to your company name). 
            Employees can use this code during signup to join your company.
          </AlertDescription>
        </Alert>

        {/* Created accounts list */}
        {createdAccounts.length > 0 && (
          <div className="border-t pt-4">
            <h3 className="text-sm font-medium mb-2">Recently Created Employees</h3>
            <div className="flex flex-wrap gap-2">
              {createdAccounts.map((account, idx) => (
                <div key={`${account.email}-${idx}`} className="flex items-center gap-1 text-sm bg-green-500/20 text-green-400 px-2 py-1 rounded">
                  <CheckCircle className="h-3 w-3" />
                  {account.email} ({account.jobType.replace('_', ' ')})
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
