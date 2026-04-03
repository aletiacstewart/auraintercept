import React from 'react';
import { LucideIcon } from 'lucide-react';
import { GlassHeader } from './GlassHeader';
import { MobileTabNav } from './MobileTabNav';

export interface CyberAgent {
  id: string;
  name: string;
  description: string;
  icon: LucideIcon;
  /** hex or rgba color for the glow */
  hsl: string; // e.g. '189,100%,65%'
  status: 'active' | 'standby' | 'off';
  metric1Value: number | string;
  metric1Label: string;
  metric2Value: number | string;
  metric2Label: string;
}

export interface CyberQuickAction {
  id: string;
  label: string;
  icon: LucideIcon;
  message: string;
  featureColor?: string;
  /** hsl string e.g. '189,100%,55%' — derived from featureColor if not set */
  hsl?: string;
}

interface Tab {
  id: string;
  label: string;
  icon: LucideIcon;
  featureColor?: string;
}

interface CyberConsoleLayoutProps {
  // Header props
  logoUrl?: string | null;
  companyName: string;
  agentLabel: string;
  agentColor: string;
  agentBgColor: string;
  subtitle: string;
  companyCreatedAt?: string | null;
  // Tabs
  tabs: Tab[];
  activeTab: string;
  onTabChange: (tab: string) => void;
  onHomeClick: () => void;
  // Left panel
  agents: CyberAgent[];
  currentAgentId?: string | null;
  onAgentClick?: (agentId: string) => void;
  sessionMetrics?: {
    status?: string;
    avgResponse?: string;
    satisfaction?: string;
  };
  // Right panel (kept for backward compat but no longer rendered)
  quickActions?: CyberQuickAction[];
  onQuickAction?: (message: string, id: string) => void;
  rightPanelFooter?: React.ReactNode;
  // Center content
  children: React.ReactNode;
  // GlassHeader extras
  showPhone?: boolean;
  onPhoneClick?: () => void;
  isOnline?: boolean;
  useDefaultLogo?: boolean;
}

const FEATURE_HSL_MAP: Record<string, string> = {
  'text-feature-overview': '189,100%,65%',
  'text-feature-fieldops': '84,100%,55%',
  'text-feature-customers': '38,100%,65%',
  'text-feature-analytics': '223,100%,65%',
  'text-feature-marketing': '292,100%,70%',
  'text-feature-quotes': '48,100%,65%',
  'text-feature-invoices': '142,72%,55%',
  'text-feature-leads': '262,83%,68%',
  'text-feature-appointments': '221,83%,68%',
  'text-feature-inventory': '172,72%,55%',
  'text-feature-platform': '189,100%,55%',
  'text-feature-employees': '48,100%,60%',
  'text-feature-ai': '265,89%,70%',
  'text-pink-400': '330,80%,70%',
  'text-destructive': '0,84%,60%',
};

function getHsl(action: CyberQuickAction): string {
  if (action.hsl) return action.hsl;
  if (action.featureColor && FEATURE_HSL_MAP[action.featureColor]) {
    return FEATURE_HSL_MAP[action.featureColor];
  }
  return '189,100%,55%';
}

export const CyberConsoleLayout: React.FC<CyberConsoleLayoutProps> = ({
  logoUrl,
  companyName,
  agentLabel,
  agentColor,
  agentBgColor,
  subtitle,
  companyCreatedAt,
  tabs,
  activeTab,
  onTabChange,
  onHomeClick,
  agents,
  currentAgentId,
  onAgentClick,
  sessionMetrics,
  children,
  showPhone,
  onPhoneClick,
  isOnline,
  useDefaultLogo,
}) => {
  const metrics = sessionMetrics ?? {
    status: 'Live',
    avgResponse: '<1s',
    satisfaction: '98.4%',
  };

  const agentColors = [
    { hsl: '189,100%,65%', border: 'rgba(0,229,255,0.3)', glow: 'rgba(0,229,255,0.12)', text: 'text-cyan-400' },
    { hsl: '152,69%,60%', border: 'rgba(52,211,153,0.3)', glow: 'rgba(52,211,153,0.12)', text: 'text-emerald-400' },
    { hsl: '270,72%,68%', border: 'rgba(168,85,247,0.3)', glow: 'rgba(168,85,247,0.12)', text: 'text-purple-400' },
    { hsl: '48,96%,55%', border: 'rgba(250,204,21,0.3)', glow: 'rgba(250,204,21,0.12)', text: 'text-yellow-400' },
  ];

  return (
    <div
      className="flex flex-col overflow-hidden rounded-xl"
      style={{
        height: 'calc(100vh - 140px)',
        minHeight: '560px',
        background: 'rgba(2,8,18,0.97)',
        border: '1px solid rgba(0,229,255,0.15)',
        borderTop: '3px solid rgba(0,229,255,0.6)',
        boxShadow: '0 0 40px rgba(0,0,0,0.6), 0 0 60px rgba(0,229,255,0.05)',
      }}
    >
      {/* Glass Header */}
      <GlassHeader
        logoUrl={logoUrl}
        companyName={companyName}
        agentLabel={agentLabel}
        agentColor={agentColor}
        agentBgColor={agentBgColor}
        subtitle={subtitle}
        showPhone={showPhone}
        onPhoneClick={onPhoneClick}
        isOnline={isOnline}
        useDefaultLogo={useDefaultLogo ?? !logoUrl}
        companyCreatedAt={companyCreatedAt}
      />

      {/* Tab Navigation */}
      <MobileTabNav
        tabs={tabs}
        activeTab={activeTab}
        onTabChange={onTabChange}
        onHomeClick={onHomeClick}
      />

      {/* 3-Column Cyber Layout (desktop) / Single column (mobile) */}
      <div className="flex-1 flex min-h-0 overflow-hidden">

        {/* ── LEFT PANEL: Active Agents ── */}
        <div
          className="hidden lg:flex flex-col w-56 shrink-0 border-r border-border/30 overflow-y-auto bg-card/95"
        >
          {/* Panel Header */}
          <div className="px-3 pt-3 pb-2 flex items-center gap-2 border-b border-border/20">
            <div className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
            <span className="text-[10px] font-bold uppercase tracking-widest text-primary/80">Active Agents</span>
          </div>

          {/* Agent Cards */}
          <div className="flex-1 p-2 space-y-2">
            {agents.map((agent, idx) => {
              const colors = agentColors[idx % agentColors.length];
              const AgentIcon = agent.icon;
              const isActive = currentAgentId === agent.id || (!currentAgentId && idx === 0 && agent.status === 'active');

              return (
                <div
                  key={agent.id}
                  onClick={() => onAgentClick?.(agent.id)}
                  className="rounded-lg p-2.5 border transition-all duration-200 select-none"
                  style={{
                    background: isActive ? colors.glow : 'rgba(255,255,255,0.02)',
                    borderColor: isActive ? colors.border : 'rgba(255,255,255,0.06)',
                    boxShadow: isActive ? `0 0 12px ${colors.glow}` : 'none',
                    cursor: onAgentClick ? 'pointer' : 'default',
                    transform: isActive ? 'scale(1.01)' : undefined,
                  }}
                  onMouseEnter={e => {
                    if (!isActive && onAgentClick) {
                      (e.currentTarget as HTMLDivElement).style.borderColor = colors.border;
                      (e.currentTarget as HTMLDivElement).style.background = `${colors.glow}80`;
                    }
                  }}
                  onMouseLeave={e => {
                    if (!isActive && onAgentClick) {
                      (e.currentTarget as HTMLDivElement).style.borderColor = 'rgba(255,255,255,0.06)';
                      (e.currentTarget as HTMLDivElement).style.background = 'rgba(255,255,255,0.02)';
                    }
                  }}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div
                        className="h-7 w-7 rounded-lg flex items-center justify-center shrink-0"
                        style={{ background: colors.glow, border: `1px solid ${colors.border}` }}
                      >
                        <AgentIcon className={`h-3.5 w-3.5 ${colors.text}`} />
                      </div>
                      <div className="min-w-0">
                        <p className="text-[11px] font-semibold text-foreground/90 truncate">{agent.name}</p>
                        <p className="text-[9px] text-muted-foreground truncate max-w-[90px]">{agent.description}</p>
                      </div>
                    </div>
                    <div
                      className="text-[8px] font-bold uppercase px-1.5 py-0.5 rounded shrink-0 ml-1 transition-all duration-200"
                      style={
                        agent.status === 'off'
                          ? { color: 'hsl(var(--muted-foreground))', background: 'hsl(var(--muted) / 0.5)' }
                          : isActive
                          ? { color: 'rgb(0,229,255)', background: 'rgba(0,229,255,0.12)', border: '1px solid rgba(0,229,255,0.3)' }
                          : { color: 'rgb(250,204,21)', background: 'rgba(250,204,21,0.1)', border: '1px solid rgba(250,204,21,0.25)' }
                      }
                    >
                      {agent.status === 'off' ? 'Off' : isActive ? 'Active' : 'Standby'}
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-1">
                    <div className="text-center p-1 rounded" style={{ background: 'rgba(255,255,255,0.03)' }}>
                      <p className={`text-[12px] font-bold ${colors.text}`}>{agent.metric1Value}</p>
                      <p className="text-[8px] text-muted-foreground uppercase">{agent.metric1Label}</p>
                    </div>
                    <div className="text-center p-1 rounded bg-muted/30">
                      <p className={`text-[12px] font-bold ${colors.text}`}>{agent.metric2Value}</p>
                      <p className="text-[8px] text-muted-foreground uppercase">{agent.metric2Label}</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Session Metrics Footer */}
          <div className="p-3 border-t border-border/20">
            <p className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground/50 mb-2">Session Metrics</p>
            <div className="space-y-1.5">
              <div className="flex justify-between items-center">
                <span className="text-[10px] text-muted-foreground">Session Status</span>
                <span className="text-[10px] font-bold text-primary">{metrics.status}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-[10px] text-muted-foreground">Avg Response</span>
                <span className="text-[10px] font-bold text-orange-400">{metrics.avgResponse}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-[10px] text-muted-foreground">Satisfaction</span>
                <span className="text-[10px] font-bold text-emerald-400">{metrics.satisfaction}</span>
              </div>
            </div>
          </div>
        </div>

        {/* ── CENTER: Content ── */}
        <div className="flex-1 flex flex-col min-h-0 overflow-hidden" style={{ background: 'rgba(3,9,20,0.95)' }}>
          {children}
        </div>

        {/* Right panel removed — actions are in the top tab row */}

      </div>{/* end 3-col flex */}
    </div>
  );
};
