import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, CheckCircle, Users } from 'lucide-react';

interface CreateTestCustomersProps {
  companyId: string;
}

export function CreateTestCustomers({ companyId }: CreateTestCustomersProps) {
  const [customerEmail, setCustomerEmail] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [customerLoading, setCustomerLoading] = useState(false);
  const [createdCustomers, setCreatedCustomers] = useState<string[]>([]);
  
  const { toast } = useToast();

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
          <Users className="h-5 w-5" />
          Create Test Customer
        </CardTitle>
        <CardDescription className="text-white/70">
          Create a customer account associated with this company. Default password: Test123!
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-white/70">
          They can log in at the customer portal to view appointments, quotes, and invoices.
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
      </CardContent>
    </Card>
  );
}
