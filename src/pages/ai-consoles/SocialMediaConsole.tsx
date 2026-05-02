import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { PageContainer } from '@/components/ui/page-container';
import { PageHeader } from '@/components/ui/page-header';
import { SocialMediaAgentConsole } from '@/components/social/SocialMediaAgentConsole';
import { Button } from '@/components/ui/button';
import { Cpu, Share2 } from 'lucide-react';
import { ValueBadge } from '@/components/ui/value-badge';
import { FeatureGate } from '@/components/subscription/FeatureGate';
import { HowToUseModal } from '@/components/ui/HowToUseModal';
import { HOW_TO_USE } from '@/lib/howToUseContent';
import { useIndustryPack } from '@/hooks/useIndustryPack';

export default function SocialMediaConsole() {
  const { userRole } = useAuth();
  const navigate = useNavigate();
  const { pack } = useIndustryPack();
  
  const canManageSettings = userRole === 'platform_admin' || userRole === 'company_admin';
  const industryLabel = pack.label || 'service business';
  const description = `AI-powered social content, scheduling, and analytics for your ${industryLabel.toLowerCase()} business.`;

  return (
    <DashboardLayout>
      <PageContainer>
        <FeatureGate requiredConsole="social_media">
          <div className="space-y-6">
            <PageHeader
              icon={Share2}
              title="Social Media Console"
              description={description}
              featureColor="platform"
              showAuraBar
              badge={<ValueBadge label="Saves ~8 hrs/week on content" />}
              action={
                <div className="flex items-center gap-2">
                  <HowToUseModal {...HOW_TO_USE.socialMediaConsole} />
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
                </div>
              }
            />
            
            <SocialMediaAgentConsole />
          </div>
        </FeatureGate>
      </PageContainer>
    </DashboardLayout>
  );
}
