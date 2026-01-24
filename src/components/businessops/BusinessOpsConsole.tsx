import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card } from '@/components/ui/card';
import { FinancialPulseDashboard } from './FinancialPulseDashboard';
import { InventoryMatrix } from './InventoryMatrix';
import { PaymentConnectionsSettings } from './PaymentConnectionsSettings';

type ViewType = 'dashboard' | 'inventory' | 'payments';

interface BusinessOpsConsoleProps {
  companyId?: string;
}

export function BusinessOpsConsole({ companyId: propCompanyId }: BusinessOpsConsoleProps) {
  const { companyId: authCompanyId, userRole } = useAuth();
  const effectiveCompanyId = propCompanyId || authCompanyId;
  const [currentView, setCurrentView] = useState<ViewType>('dashboard');
  
  const isPlatformAdmin = userRole === 'platform_admin';

  const handleNavigate = (section: ViewType) => {
    setCurrentView(section);
  };

  const handleBack = () => {
    setCurrentView('dashboard');
  };

  if (!effectiveCompanyId) {
    return (
      <Card className="h-[600px] flex items-center justify-center shadow-xl surface-elevated-dark border-border/50">
        <p className="text-card-foreground/70">No company selected</p>
      </Card>
    );
  }

  return (
    <Card className="min-h-[600px] flex flex-col overflow-hidden shadow-xl surface-elevated-dark border-border/50">

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 console-surface rounded-lg">
        {currentView === 'dashboard' && (
          <FinancialPulseDashboard 
            companyId={effectiveCompanyId} 
            onNavigate={handleNavigate}
            showQuotes={false}
            userRole={userRole}
          />
        )}
        {currentView === 'inventory' && isPlatformAdmin && (
          <InventoryMatrix 
            companyId={effectiveCompanyId} 
            onBack={handleBack}
          />
        )}
        {currentView === 'payments' && (
          <PaymentConnectionsSettings 
            companyId={effectiveCompanyId} 
            onBack={handleBack}
          />
        )}
      </div>
    </Card>
  );
}
