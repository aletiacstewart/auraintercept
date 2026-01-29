import React, { useState, useEffect, forwardRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
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
      {/* Platform Installation Guide - Comprehensive embed code generators */}
      {companySlug && <PlatformInstallGuide companySlug={companySlug} />}

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Live Preview</CardTitle>
              <CardDescription className="text-muted-foreground">
                Test your AI Agent Virtual Assistant before adding it to your website
              </CardDescription>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleRefresh}
              className="gap-2"
            >
              <RefreshCw className="h-4 w-4" />
              Refresh
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="relative bg-gradient-to-br from-muted/30 to-muted/60 rounded-lg overflow-hidden border">
            {companySlug ? (
              <iframe
                key={`widget-preview-${iframeKey}`}
                src={`/chat/${companySlug}?embed=true&v=${iframeKey}`}
                className="w-full h-[600px] border-0 rounded-lg"
                title="Customer App Preview"
                allow="microphone"
              />
            ) : (
              <div className="flex items-center justify-center h-[600px] text-muted-foreground">
                Loading preview...
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
});

WidgetPreview.displayName = 'WidgetPreview';
