import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import { Phone, Mail, MapPin, Save, Loader2, ExternalLink } from 'lucide-react';
import { Link } from 'react-router-dom';
import { triggerSetupProgressRefresh } from '@/hooks/useSetupProgress';

export function SmartWebsiteContactEditor() {
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
      toast.success('Contact information saved!');
      triggerSetupProgressRefresh();
    },
    onError: (error) => {
      console.error('Failed to update contact info:', error);
      toast.error('Failed to save contact information');
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateMutation.mutate();
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-20 w-full" />
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="sw-phone" className="flex items-center gap-2 text-card-foreground">
            <Phone className="h-4 w-4" />
            Phone Number
          </Label>
          <Input
            id="sw-phone"
            type="tel"
            placeholder="(555) 123-4567"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="sw-email" className="flex items-center gap-2 text-card-foreground">
            <Mail className="h-4 w-4" />
            Email Address
          </Label>
          <Input
            id="sw-email"
            type="email"
            placeholder="contact@yourcompany.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="sw-address" className="flex items-center gap-2 text-card-foreground">
          <MapPin className="h-4 w-4" />
          Business Address
        </Label>
        <Textarea
          id="sw-address"
          placeholder="123 Main Street, Suite 100&#10;City, State 12345"
          value={address}
          onChange={(e) => setAddress(e.target.value)}
          rows={2}
        />
      </div>
      
      <div className="flex items-center justify-between pt-2">
        <Button type="submit" disabled={updateMutation.isPending}>
          {updateMutation.isPending ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Save className="mr-2 h-4 w-4" />
              Save Contact Info
            </>
          )}
        </Button>
        
        <Link
          to="/dashboard/settings?tab=contact"
          className="text-sm text-accent hover:underline flex items-center gap-1"
        >
          Full Contact Settings
          <ExternalLink className="h-3 w-3" />
        </Link>
      </div>
    </form>
  );
}
