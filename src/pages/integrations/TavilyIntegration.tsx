import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { PageContainer } from '@/components/ui/page-container';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { Search, Eye, EyeOff, Loader2, Check, ExternalLink, Zap, Gauge } from 'lucide-react';
import { Link } from 'react-router-dom';
import { PageHeader } from '@/components/ui/page-header';
import { TavilySetupGuide } from '@/components/integrations/TavilySetupGuide';

export default function TavilyIntegration() {
  const { companyId } = useAuth();
  const queryClient = useQueryClient();
  const [apiKey, setApiKey] = useState('');
  const [showKey, setShowKey] = useState(false);

  const { data: integrations } = useQuery({
    queryKey: ['integrations', companyId],
    queryFn: async () => {
      if (!companyId) return null;
      const { data, error } = await supabase
        .from('tenant_integrations')
        .select('*')
        .eq('company_id', companyId)
        .maybeSingle();
      if (error && error.code !== 'PGRST116') throw error;
      return data;
    },
    enabled: !!companyId,
  });

  const saveMutation = useMutation({
    mutationFn: async (key: string) => {
      if (!companyId) throw new Error('No company ID');
      const payload = { company_id: companyId, tavily_api_key: key };
      if (integrations?.id) {
        const { error } = await supabase.from('tenant_integrations').update(payload).eq('id', integrations.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('tenant_integrations').insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['integrations'] });
      toast.success('Tavily API key saved!');
      setApiKey('');
    },
    onError: () => toast.error('Failed to save API key'),
  });

  const handleSave = () => {
    if (!apiKey.trim()) {
      toast.error('Please enter an API key');
      return;
    }
    saveMutation.mutate(apiKey.trim());
  };

  const isConnected = !!integrations?.tavily_api_key;
  const maskedKey = integrations?.tavily_api_key 
    ? `${integrations.tavily_api_key.substring(0, 8)}...${integrations.tavily_api_key.slice(-4)}`
    : '';

  return (
    <DashboardLayout>
      <PageContainer>
        <div className="space-y-6 animate-fade-in">
          {/* Header */}
          <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
            <PageHeader
              icon={Search}
              title="AI Research"
              description="AI-powered web search for enhanced content generation"
              featureColor="integrations"
              showAuraBar
            />
            <div className="flex items-center gap-2">
              {isConnected && (
                <Badge className="bg-green-500/10 text-green-600 border-green-500/30">
                  <Check className="w-3 h-3 mr-1" />
                  Connected
                </Badge>
              )}
              <Button variant="outline" size="sm" asChild>
                <a href="https://tavily.com" target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="w-4 h-4 mr-2" />
                  Tavily Dashboard
                </a>
              </Button>
              <Button variant="outline" size="sm" asChild>
                <Link to="/dashboard/tavily-limits">
                  <Gauge className="w-4 h-4 mr-2" />
                  Usage & Limits
                </Link>
              </Button>
            </div>
          </div>

          {/* Connection Card */}
          <Card className="border-border/50">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-cyan-500 flex items-center justify-center">
                  <Search className="w-5 h-5 text-white" />
                </div>
                <div>
                  <CardTitle className="text-lg">Tavily AI Connection</CardTitle>
                  <CardDescription>Connect your Tavily account for AI-powered web research</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {isConnected && (
                <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-green-600" />
                      <span className="text-sm font-medium text-green-600">Connected</span>
                    </div>
                    <code className="text-xs text-muted-foreground">{maskedKey}</code>
                  </div>
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="api-key">{isConnected ? 'Update API Key' : 'API Key'}</Label>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Input
                      id="api-key"
                      type={showKey ? 'text' : 'password'}
                      placeholder="tvly-..."
                      value={apiKey}
                      onChange={(e) => setApiKey(e.target.value)}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3"
                      onClick={() => setShowKey(!showKey)}
                    >
                      {showKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </Button>
                  </div>
                  <Button onClick={handleSave} disabled={saveMutation.isPending}>
                    {saveMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                    {isConnected ? 'Update' : 'Connect'}
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  Get your API key from <a href="https://app.tavily.com" target="_blank" rel="noopener noreferrer" className="text-secondary hover:underline">app.tavily.com</a>
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Features */}
          <div className="grid gap-4 md:grid-cols-3">
            <Card className="border-border/50">
              <CardContent className="pt-6">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-lg bg-cyan-500/20 flex items-center justify-center">
                    <Zap className="w-5 h-5 text-cyan-500" />
                  </div>
                  <div>
                    <h3 className="font-medium">1,000 Credits / mo Bundled</h3>
                    <p className="text-sm text-muted-foreground">Included in your plan · overage $0.008/credit</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="border-border/50">
              <CardContent className="pt-6">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-lg bg-cyan-500/20 flex items-center justify-center">
                    <Search className="w-5 h-5 text-cyan-500" />
                  </div>
                  <div>
                    <h3 className="font-medium">AI-Optimized Results</h3>
                    <p className="text-sm text-muted-foreground">Structured data built for AI agents</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="border-border/50">
              <CardContent className="pt-6">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-lg bg-cyan-500/20 flex items-center justify-center">
                    <ExternalLink className="w-5 h-5 text-cyan-500" />
                  </div>
                  <div>
                    <h3 className="font-medium">Citations Included</h3>
                    <p className="text-sm text-muted-foreground">Source URLs for every result</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Setup Guide */}
          <TavilySetupGuide />
        </div>
      </PageContainer>
    </DashboardLayout>
  );
}
