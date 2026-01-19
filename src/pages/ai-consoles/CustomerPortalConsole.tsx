import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { PageContainer } from '@/components/ui/page-container';
import { AIAgentConsole } from '@/components/ai/AIAgentConsole';
import { AIAgentChat } from '@/components/ai/AIAgentChat';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Monitor, Code, Cpu, Eye, HeadphonesIcon } from 'lucide-react';
import { PageHeader } from '@/components/ui/page-header';
import { FeatureGate } from '@/components/subscription/FeatureGate';

export default function CustomerPortalConsole() {
  const { userRole } = useAuth();
  const navigate = useNavigate();
  const [viewMode, setViewMode] = useState<'customer' | 'debug'>('customer');
  
  const canManageSettings = userRole === 'platform_admin' || userRole === 'company_admin';

  return (
    <DashboardLayout>
      <PageContainer>
        <FeatureGate requiredTier="enterprise">
          <div className="space-y-6">
            {/* Admin Preview Mode Banner */}
            {canManageSettings && (
              <Alert className="bg-amber-500/10 border-amber-500/30">
                <Eye className="h-4 w-4 text-amber-500" />
                <AlertDescription className="text-amber-600 dark:text-amber-400">
                  <span className="font-medium">Admin Preview Mode</span> — You are viewing this console as an administrator. 
                  In production, customers access their AI Agent Virtual Assistant via the embedded widget on your website.
                </AlertDescription>
              </Alert>
            )}

            <PageHeader
              icon={HeadphonesIcon}
              title="Customer Portal Console"
              description="AI-powered customer service portal"
              featureColor="customers"
              showAuraBar
              badge={
                canManageSettings ? (
                  <Badge variant="outline" className="bg-amber-100 text-amber-700 border-amber-300 dark:bg-amber-900/30 dark:text-amber-400 dark:border-amber-700">
                    Admin Preview
                  </Badge>
                ) : undefined
              }
              action={
                <div className="flex items-center gap-2">
                  {canManageSettings && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => navigate('/dashboard/ai-agents')}
                    >
                      <Cpu className="h-3.5 w-3.5 mr-1.5" />
                      Manage Agents
                    </Button>
                  )}
                  {userRole !== 'employee' && (
                    <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as 'customer' | 'debug')}>
                      <TabsList className="h-8">
                        <TabsTrigger value="customer" className="text-xs h-7 px-3">
                          <Monitor className="h-3 w-3 mr-1" />
                          Customer View
                        </TabsTrigger>
                        <TabsTrigger value="debug" className="text-xs h-7 px-3">
                          <Code className="h-3 w-3 mr-1" />
                          Debug
                        </TabsTrigger>
                      </TabsList>
                    </Tabs>
                  )}
                </div>
              }
            />
            
            {viewMode === 'customer' ? (
              <AIAgentConsole allowCompanySelection={userRole === 'platform_admin'} />
            ) : (
              <AIAgentChat />
            )}
          </div>
        </FeatureGate>
      </PageContainer>
    </DashboardLayout>
  );
}
