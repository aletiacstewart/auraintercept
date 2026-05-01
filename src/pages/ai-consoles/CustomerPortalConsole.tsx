import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { PageContainer } from '@/components/ui/page-container';
import { AIAgentConsole } from '@/components/ai/AIAgentConsole';
import { AIAgentChat } from '@/components/ai/AIAgentChat';
import { WidgetPreview } from '@/components/widget/WidgetPreview';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Monitor, Code, Cpu, Eye, HeadphonesIcon, PanelRightOpen } from 'lucide-react';
import { PageHeader } from '@/components/ui/page-header';
import { FeatureGate } from '@/components/subscription/FeatureGate';
import { InstallOnPhoneButton } from '@/components/ui/install-on-phone-button';
import { HowToUseModal } from '@/components/ui/HowToUseModal';
import { HOW_TO_USE } from '@/lib/howToUseContent';
import { SpecialistOperativesLauncher } from '@/components/ai/SpecialistOperativesLauncher';
import { useIndustryPack } from '@/hooks/useIndustryPack';
import { getPortalCopy } from '@/lib/industryPortalCopy';

export default function CustomerPortalConsole() {
  const { userRole } = useAuth();
  const navigate = useNavigate();
  const [viewMode, setViewMode] = useState<'customer' | 'debug'>('customer');
  const [showPreview, setShowPreview] = useState(false);
  const { pack } = useIndustryPack();
  const copy = getPortalCopy(pack);

  const canManageSettings = userRole === 'platform_admin' || userRole === 'company_admin';

  return (
    <DashboardLayout>
      <PageContainer>
        <FeatureGate requiredConsole="customer_portal">
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
              title={copy.title}
              description={copy.description}
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
                  <HowToUseModal {...HOW_TO_USE.customerPortalConsole} />
                  {canManageSettings && (
                    <>
                      <InstallOnPhoneButton to="/dashboard/customer-portal-app-install" />
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setShowPreview((p) => !p)}
                        className="hidden lg:flex gap-1.5"
                      >
                        <PanelRightOpen className="h-3.5 w-3.5" />
                        {showPreview ? 'Hide Preview' : 'Live Preview'}
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => navigate('/dashboard/ai-agents')}
                      >
                        <Cpu className="h-3.5 w-3.5 mr-1.5" />
                        Manage Agents
                      </Button>
                    </>
                  )}
                  {userRole !== 'employee' && (
                    <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as 'customer' | 'debug')}>
                      <TabsList className="inline-flex h-auto p-1 bg-muted/30 rounded-full border border-border/50 gap-0.5">
                        <TabsTrigger value="customer" className="text-xs px-3 py-1.5 rounded-full data-[state=active]:bg-background data-[state=active]:shadow-sm data-[state=active]:border data-[state=active]:border-border/50 transition-all">
                          <Monitor className="h-3 w-3 mr-1" />
                          Customer View
                        </TabsTrigger>
                        <TabsTrigger value="debug" className="text-xs px-3 py-1.5 rounded-full data-[state=active]:bg-background data-[state=active]:shadow-sm data-[state=active]:border data-[state=active]:border-border/50 transition-all">
                          <Code className="h-3 w-3 mr-1" />
                          Debug
                        </TabsTrigger>
                      </TabsList>
                    </Tabs>
                  )}
                </div>
              }
            />
            
            <div className={showPreview ? 'flex gap-6' : ''}>
              <div className={showPreview ? 'flex-1 min-w-0' : ''}>
                {viewMode === 'customer' ? (
                  <AIAgentConsole allowCompanySelection={userRole === 'platform_admin' || userRole === 'company_admin'} />
                ) : (
                  <AIAgentChat />
                )}
                <div className="mt-6">
                  <SpecialistOperativesLauncher
                    show={['diagnostic', 'site_survey', 'insurance_claim']}
                    subtitle={copy.specialistSubtitle}
                  />
                </div>
              </div>
              {showPreview && (
                <div className="hidden lg:block w-[420px] shrink-0 sticky top-4 self-start">
                  <WidgetPreview />
                </div>
              )}
            </div>
          </div>
        </FeatureGate>
      </PageContainer>
    </DashboardLayout>
  );
}