import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import { Phone, Mail, MapPin, Save, Loader2, ExternalLink, UserPlus, User, Trash2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { triggerSetupProgressRefresh } from '@/hooks/useSetupProgress';

interface ContactPerson {
  name: string;
  title: string;
  phone: string;
  email: string;
}

export function SmartWebsiteContactEditor() {
  const { companyId } = useAuth();
  const queryClient = useQueryClient();
  
  // Primary contact
  const [primaryContact, setPrimaryContact] = useState<ContactPerson>({
    name: '',
    title: '',
    phone: '',
    email: '',
  });
  const [address, setAddress] = useState('');
  
  // Additional contacts
  const [contact2, setContact2] = useState<ContactPerson | null>(null);
  const [contact3, setContact3] = useState<ContactPerson | null>(null);

  // Fetch Smart Website data
  const { data: websiteData, isLoading } = useQuery({
    queryKey: ['smart-website-contact', companyId],
    queryFn: async () => {
      if (!companyId) return null;
      const { data, error } = await supabase
        .from('smart_websites')
        .select(`
          contact_name, contact_title, contact_phone, contact_email, contact_address,
          contact2_name, contact2_title, contact2_phone, contact2_email,
          contact3_name, contact3_title, contact3_phone, contact3_email
        `)
        .eq('company_id', companyId)
        .maybeSingle();
      
      if (error) throw error;
      return data;
    },
    enabled: !!companyId,
  });

  // Fall back to company contact if no smart website contact exists
  const { data: companyData } = useQuery({
    queryKey: ['company-contact-fallback', companyId],
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
    enabled: !!companyId && !websiteData,
  });

  useEffect(() => {
    if (websiteData) {
      setPrimaryContact({
        name: websiteData.contact_name || '',
        title: websiteData.contact_title || '',
        phone: websiteData.contact_phone || '',
        email: websiteData.contact_email || '',
      });
      setAddress(websiteData.contact_address || '');
      
      // Load contact 2 if exists
      if (websiteData.contact2_name || websiteData.contact2_phone || websiteData.contact2_email) {
        setContact2({
          name: websiteData.contact2_name || '',
          title: websiteData.contact2_title || '',
          phone: websiteData.contact2_phone || '',
          email: websiteData.contact2_email || '',
        });
      }
      
      // Load contact 3 if exists
      if (websiteData.contact3_name || websiteData.contact3_phone || websiteData.contact3_email) {
        setContact3({
          name: websiteData.contact3_name || '',
          title: websiteData.contact3_title || '',
          phone: websiteData.contact3_phone || '',
          email: websiteData.contact3_email || '',
        });
      }
    } else if (companyData) {
      // Use company data as fallback for initial setup
      setPrimaryContact(prev => ({
        ...prev,
        phone: companyData.contact_phone || '',
        email: companyData.contact_email || '',
      }));
      setAddress(companyData.contact_address || '');
    }
  }, [websiteData, companyData]);

  const updateMutation = useMutation({
    mutationFn: async () => {
      if (!companyId) throw new Error('No company ID');
      
      const { error } = await supabase
        .from('smart_websites')
        .update({
          contact_name: primaryContact.name || null,
          contact_title: primaryContact.title || null,
          contact_phone: primaryContact.phone || null,
          contact_email: primaryContact.email || null,
          contact_address: address || null,
          contact2_name: contact2?.name || null,
          contact2_title: contact2?.title || null,
          contact2_phone: contact2?.phone || null,
          contact2_email: contact2?.email || null,
          contact3_name: contact3?.name || null,
          contact3_title: contact3?.title || null,
          contact3_phone: contact3?.phone || null,
          contact3_email: contact3?.email || null,
        })
        .eq('company_id', companyId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['smart-website-contact', companyId] });
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

  const addContact = () => {
    if (!contact2) {
      setContact2({ name: '', title: '', phone: '', email: '' });
    } else if (!contact3) {
      setContact3({ name: '', title: '', phone: '', email: '' });
    }
  };

  const removeContact2 = () => {
    setContact2(null);
  };

  const removeContact3 = () => {
    setContact3(null);
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

  const canAddMore = !contact2 || !contact3;

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Primary Contact */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <User className="h-4 w-4 text-primary" />
          <Label className="font-semibold text-card-foreground">Primary Contact</Label>
        </div>
        
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="sw-name" className="text-card-foreground">Name</Label>
            <Input
              id="sw-name"
              placeholder="John Smith"
              value={primaryContact.name}
              onChange={(e) => setPrimaryContact({ ...primaryContact, name: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="sw-title" className="text-card-foreground">Title / Position</Label>
            <Input
              id="sw-title"
              placeholder="Owner, Manager, etc."
              value={primaryContact.title}
              onChange={(e) => setPrimaryContact({ ...primaryContact, title: e.target.value })}
            />
          </div>
        </div>
        
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="sw-phone" className="flex items-center gap-2 text-card-foreground">
              <Phone className="h-4 w-4" />
              Phone Number
            </Label>
            <Input
              id="sw-phone"
              type="tel"
              placeholder="(555) 123-4567"
              value={primaryContact.phone}
              onChange={(e) => setPrimaryContact({ ...primaryContact, phone: e.target.value })}
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
              value={primaryContact.email}
              onChange={(e) => setPrimaryContact({ ...primaryContact, email: e.target.value })}
            />
          </div>
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

      {/* Additional Contact 2 */}
      {contact2 && (
        <>
          <Separator />
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <User className="h-4 w-4 text-cyan-400" />
                <Label className="font-semibold text-card-foreground">Additional Contact #1</Label>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="text-destructive hover:text-destructive"
                onClick={removeContact2}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
            
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-2">
                <Label className="text-card-foreground">Name</Label>
                <Input
                  placeholder="Jane Doe"
                  value={contact2.name}
                  onChange={(e) => setContact2({ ...contact2, name: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label className="text-card-foreground">Title / Position</Label>
                <Input
                  placeholder="Sales Manager"
                  value={contact2.title}
                  onChange={(e) => setContact2({ ...contact2, title: e.target.value })}
                />
              </div>
            </div>
            
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-2">
                <Label className="flex items-center gap-2 text-card-foreground">
                  <Phone className="h-4 w-4" />
                  Phone Number
                </Label>
                <Input
                  type="tel"
                  placeholder="(555) 123-4567"
                  value={contact2.phone}
                  onChange={(e) => setContact2({ ...contact2, phone: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label className="flex items-center gap-2 text-card-foreground">
                  <Mail className="h-4 w-4" />
                  Email Address
                </Label>
                <Input
                  type="email"
                  placeholder="jane@company.com"
                  value={contact2.email}
                  onChange={(e) => setContact2({ ...contact2, email: e.target.value })}
                />
              </div>
            </div>
          </div>
        </>
      )}

      {/* Additional Contact 3 */}
      {contact3 && (
        <>
          <Separator />
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <User className="h-4 w-4 text-purple-500" />
                <Label className="font-semibold text-card-foreground">Additional Contact #2</Label>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="text-destructive hover:text-destructive"
                onClick={removeContact3}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
            
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-2">
                <Label className="text-card-foreground">Name</Label>
                <Input
                  placeholder="Bob Wilson"
                  value={contact3.name}
                  onChange={(e) => setContact3({ ...contact3, name: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label className="text-card-foreground">Title / Position</Label>
                <Input
                  placeholder="Service Technician"
                  value={contact3.title}
                  onChange={(e) => setContact3({ ...contact3, title: e.target.value })}
                />
              </div>
            </div>
            
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label className="flex items-center gap-2 text-card-foreground">
                  <Phone className="h-4 w-4" />
                  Phone Number
                </Label>
                <Input
                  type="tel"
                  placeholder="(555) 123-4567"
                  value={contact3.phone}
                  onChange={(e) => setContact3({ ...contact3, phone: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label className="flex items-center gap-2 text-card-foreground">
                  <Mail className="h-4 w-4" />
                  Email Address
                </Label>
                <Input
                  type="email"
                  placeholder="bob@company.com"
                  value={contact3.email}
                  onChange={(e) => setContact3({ ...contact3, email: e.target.value })}
                />
              </div>
            </div>
          </div>
        </>
      )}

      {/* Add Contact Button */}
      {canAddMore && (
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={addContact}
          className="w-full"
        >
          <UserPlus className="h-4 w-4 mr-2" />
          Add Contact Person ({contact2 ? '1' : '2'} remaining)
        </Button>
      )}
      
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
