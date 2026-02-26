import React, { useState, useEffect, forwardRef } from 'react';

import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { PlatformInstallGuide } from './PlatformInstallGuide';
import { RefreshCw } from 'lucide-react';

export const WidgetPreview = forwardRef<HTMLDivElement>((_, ref) => {
  const { companyId } = useAuth();
  const [companySlug, setCompanySlug] = useState<string>('');
  const [iframeKey, setIframeKey] = useState(Date.now());

  useEffect(() => {
    const fetchCompany = async () => {
      if (!companyId) return;
      const { data } = await supabase
        .from('companies')
        .select('slug')
        .eq('id', companyId)
        .single();
      if (data) setCompanySlug(data.slug);
    };
    fetchCompany();
  }, [companyId]);

  const handleRefresh = () => {
    setIframeKey(Date.now());
  };

  return (
    <div ref={ref} className="space-y-6">
      {/* Platform Installation Guide */}
      {companySlug && <PlatformInstallGuide companySlug={companySlug} />}

      <div className="rounded-xl overflow-hidden" style={{ background: 'rgba(2,8,18,0.97)', border: '1px solid rgba(0,229,255,0.15)', borderTop: '3px solid rgba(0,229,255,0.6)' }}>
        <div className="flex items-center justify-between p-4 border-b" style={{ borderColor: 'rgba(0,229,255,0.1)' }}>
          <div>
            <h2 className="text-lg font-bold text-white/90">Live Preview</h2>
            <p className="text-white/40 text-sm">
              Test your AI Agent Virtual Assistant before adding it to your website
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            className="gap-2 border-cyan-400/30 text-cyan-400 hover:bg-cyan-400/10"
          >
            <RefreshCw className="h-4 w-4" />
            Refresh
          </Button>
        </div>
        <div className="p-4" style={{ background: 'rgba(3,9,20,0.95)' }}>
          <div className="relative rounded-lg overflow-hidden border" style={{ borderColor: 'rgba(0,229,255,0.1)', background: 'rgba(2,6,14,0.98)' }}>
            {companySlug ? (
              <iframe
                key={`widget-preview-${iframeKey}`}
                src={`/chat/${companySlug}?embed=true&v=${iframeKey}`}
                className="w-full h-[600px] border-0 rounded-lg"
                title="Customer App Preview"
                allow="microphone"
              />
            ) : (
              <div className="flex items-center justify-center h-[600px] text-white/40">
                Loading preview...
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
});

WidgetPreview.displayName = 'WidgetPreview';
