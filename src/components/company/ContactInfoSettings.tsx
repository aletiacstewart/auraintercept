import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Phone, Mail, MapPin, Globe, Loader2, Save } from 'lucide-react';
import { triggerSetupProgressRefresh } from '@/hooks/useSetupProgress';

export function ContactInfoSettings() {
  const { companyId } = useAuth();
  const queryClient = useQueryClient();
  
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [address, setAddress] = useState('');

  const { data: company, isLoading } = useQuery({
    queryKey: ['company-contact-info', companyId],
    queryFn: async () => {
      if (!companyId) return null;
      const { data, error } = await supabase
        .from('companies')
        .select('contact_phone, contact_email, contact_address')
        .eq('id', companyId)
        .single();
      
      if (error) throw error;
      return data;
    },
    enabled: !!companyId,
  });

  useEffect(() => {
    if (company) {
      setPhone(company.contact_phone || '');
      setEmail(company.contact_email || '');
      setAddress(company.contact_address || '');
    }
  }, [company]);

  const updateMutation = useMutation({
    mutationFn: async () => {
      if (!companyId) throw new Error('No company ID');
      
      const { error } = await supabase
        .from('companies')
        .update({
          contact_phone: phone || null,
          contact_email: email || null,
          contact_address: address || null,
        })
        .eq('id', companyId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['company-contact-info', companyId] });
      toast.success('Contact information updated successfully');
      triggerSetupProgressRefresh();
    },
    onError: (error) => {
      console.error('Failed to update contact info:', error);
      toast.error('Failed to update contact information');
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateMutation.mutate();
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Globe className="h-5 w-5" />
          Contact Information
        </CardTitle>
        <CardDescription>
          This information will be displayed on your Aura Web Presence contact section
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="contact-phone" className="flex items-center gap-2">
                <Phone className="h-4 w-4" />
                Phone Number
              </Label>
              <Input
                id="contact-phone"
                type="tel"
                placeholder="(555) 123-4567"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="contact-email" className="flex items-center gap-2">
                <Mail className="h-4 w-4" />
                Email Address
              </Label>
              <Input
                id="contact-email"
                type="email"
                placeholder="contact@yourcompany.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="contact-address" className="flex items-center gap-2">
              <MapPin className="h-4 w-4" />
              Business Address
            </Label>
            <Textarea
              id="contact-address"
              placeholder="123 Main Street, Suite 100&#10;City, State 12345"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              rows={3}
            />
          </div>
          
          <Button type="submit" disabled={updateMutation.isPending}>
            {updateMutation.isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                Save Contact Information
              </>
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
