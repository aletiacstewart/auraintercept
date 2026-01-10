import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, CheckCircle, UserPlus, Info, Eye, EyeOff } from 'lucide-react';
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
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [selectedJobTypes, setSelectedJobTypes] = useState<string[]>([]);
  const [createdAccounts, setCreatedAccounts] = useState<{ email: string; jobTypes: string[] }[]>([]);
  
  const { toast } = useToast();

  const toggleJobType = (value: string) => {
    setSelectedJobTypes(prev => 
      prev.includes(value) 
        ? prev.filter(jt => jt !== value)
        : [...prev, value]
    );
  };

  const handleCreateEmployee = async () => {
    if (!email || selectedJobTypes.length === 0 || !fullName || !password) {
      toast({ title: 'Missing fields', description: 'Please fill in email, full name, password, and at least one job type', variant: 'destructive' });
      return;
    }

    if (password.length < 8) {
      toast({ title: 'Weak password', description: 'Password must be at least 8 characters', variant: 'destructive' });
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('create-demo-employee', {
        body: {
          email,
          password,
          fullName,
          phone,
          address,
          companyId,
          jobTypes: selectedJobTypes,
          mustChangePassword: true,
          sendWelcomeEmail: true,
        },
      });

      if (error) throw error;
      
      setCreatedAccounts(prev => [...prev, { email, jobTypes: selectedJobTypes }]);
      toast({ 
        title: 'Account created', 
        description: `Employee account created. A welcome email has been sent to ${email}. They will be prompted to change their password on first login.` 
      });
      setEmail('');
      setFullName('');
      setPhone('');
      setAddress('');
      setPassword('');
      setSelectedJobTypes([]);
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
              <Label htmlFor="email">Email *</Label>
              <Input
                id="email"
                type="email"
                placeholder="employee@company.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="fullName">Full Name *</Label>
              <Input
                id="fullName"
                placeholder="John Smith"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Cell Phone</Label>
              <Input
                id="phone"
                type="tel"
                placeholder="+1 (555) 123-4567"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">Used for GPS directions and Field Ops App</p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="address">Address</Label>
              <Input
                id="address"
                placeholder="123 Main St, City, State ZIP"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password *</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Minimum 8 characters"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">Employee will be prompted to change on first login</p>
            </div>
            <div className="space-y-2">
              <Button 
                type="button" 
                variant="outline" 
                size="sm"
                onClick={() => {
                  const generated = generateTempPassword();
                  setPassword(generated);
                  setShowPassword(true);
                }}
              >
                Generate Password
              </Button>
            </div>
          </div>
          
          {/* Job Types Multi-Select */}
          <div className="space-y-3">
            <Label>Job Types * <span className="text-muted-foreground font-normal">(Select all that apply)</span></Label>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {JOB_TYPES.map((type) => (
                <div key={type.value} className="flex items-center space-x-2">
                  <Checkbox
                    id={`job-${type.value}`}
                    checked={selectedJobTypes.includes(type.value)}
                    onCheckedChange={() => toggleJobType(type.value)}
                  />
                  <Label htmlFor={`job-${type.value}`} className="text-sm cursor-pointer">
                    {type.label}
                  </Label>
                </div>
              ))}
            </div>
          </div>
          
          <div>
            <Button onClick={handleCreateEmployee} disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Create Employee
            </Button>
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
                  {account.email} ({account.jobTypes.map(jt => jt.replace('_', ' ')).join(', ')})
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
