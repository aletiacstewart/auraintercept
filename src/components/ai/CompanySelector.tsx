import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Building2, Search, ChevronRight, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Company {
  id: string;
  name: string;
  logo_url: string | null;
  primary_color: string | null;
}

interface CompanySelectorProps {
  onSelectCompany: (companyId: string) => void;
  title?: string;
  subtitle?: string;
}

export const CompanySelector: React.FC<CompanySelectorProps> = ({
  onSelectCompany,
  title = "Select a Company",
  subtitle = "Choose a company to interact with their AI assistant"
}) => {
  const [searchQuery, setSearchQuery] = React.useState('');

  const { data: companies, isLoading } = useQuery({
    queryKey: ['available-companies'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('companies')
        .select('id, name, logo_url, primary_color')
        .order('name');
      
      if (error) throw error;
      return data as Company[];
    },
  });

  const filteredCompanies = React.useMemo(() => {
    if (!companies) return [];
    if (!searchQuery.trim()) return companies;
    
    const query = searchQuery.toLowerCase();
    return companies.filter(company => 
      company.name.toLowerCase().includes(query)
    );
  }, [companies, searchQuery]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
          <p className="text-muted-foreground">Loading companies...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <div className="p-4 sm:p-6 border-b bg-gradient-to-r from-primary/5 to-primary/10">
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2 rounded-lg bg-primary/10">
            <Building2 className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h2 className="text-lg font-semibold">{title}</h2>
            <p className="text-sm text-muted-foreground">{subtitle}</p>
          </div>
        </div>
        
        <div className="relative mt-4">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search companies..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-2">
        {filteredCompanies.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            {searchQuery ? 'No companies found matching your search' : 'No companies available'}
          </div>
        ) : (
          filteredCompanies.map((company) => (
            <Card 
              key={company.id}
              className={cn(
                "cursor-pointer transition-all hover:shadow-md hover:border-primary/50",
                "group"
              )}
              onClick={() => onSelectCompany(company.id)}
            >
              <CardContent className="p-4 flex items-center gap-4">
                <div 
                  className="w-12 h-12 rounded-lg flex items-center justify-center shrink-0 overflow-hidden"
                  style={{ 
                    backgroundColor: company.primary_color ? `${company.primary_color}20` : 'hsl(var(--muted))' 
                  }}
                >
                  {company.logo_url ? (
                    <img 
                      src={company.logo_url} 
                      alt={company.name}
                      className="w-full h-full object-contain"
                    />
                  ) : (
                    <Building2 
                      className="h-6 w-6" 
                      style={{ color: company.primary_color || 'hsl(var(--muted-foreground))' }}
                    />
                  )}
                </div>
                
                <div className="flex-1 min-w-0">
                  <h3 className="font-medium truncate">{company.name}</h3>
                  <p className="text-sm text-muted-foreground">Click to start chatting</p>
                </div>
                
                <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors shrink-0" />
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
};
