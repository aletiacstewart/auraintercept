import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, XCircle, Loader2, Search } from 'lucide-react';

interface TavilyStatusBadgeProps {
  companyId: string;
  className?: string;
  showDisconnected?: boolean;
}

export function TavilyStatusBadge({ companyId, className = '', showDisconnected = false }: TavilyStatusBadgeProps) {
  const [isConnected, setIsConnected] = useState<boolean | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkTavilyStatus = async () => {
      if (!companyId) {
        setIsConnected(false);
        setIsLoading(false);
        return;
      }

      try {
        const { data, error } = await supabase
          .from('tenant_integrations')
          .select('tavily_api_key')
          .eq('company_id', companyId)
          .maybeSingle();

        if (error) {
          console.error('Error checking Tavily status:', error);
          setIsConnected(false);
        } else {
          setIsConnected(!!data?.tavily_api_key);
        }
      } catch (err) {
        console.error('Error checking Tavily status:', err);
        setIsConnected(false);
      } finally {
        setIsLoading(false);
      }
    };

    checkTavilyStatus();
  }, [companyId]);

  if (isLoading) {
    return (
      <Badge variant="outline" className={`text-xs ${className}`}>
        <Loader2 className="h-3 w-3 mr-1 animate-spin" />
        Checking...
      </Badge>
    );
  }

  if (isConnected) {
    return (
      <Badge variant="outline" className={`text-xs bg-emerald-500/10 text-emerald-600 border-emerald-500/30 ${className}`}>
        <Search className="h-3 w-3 mr-1" />
        Tavily AI Research Enabled
      </Badge>
    );
  }

  if (showDisconnected) {
    return (
      <Badge variant="outline" className={`text-xs bg-muted text-muted-foreground ${className}`}>
        <XCircle className="h-3 w-3 mr-1" />
        Tavily Not Connected
      </Badge>
    );
  }

  return null;
}
