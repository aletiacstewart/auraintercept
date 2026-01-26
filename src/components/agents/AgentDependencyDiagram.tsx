import React, { useEffect, useRef } from 'react';
import mermaid from 'mermaid';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { GitBranch } from 'lucide-react';

interface AgentDependencyDiagramProps {
  highlightTier?: 'single_point' | 'multi_track' | 'command' | 'all';
}

const AgentDependencyDiagram: React.FC<AgentDependencyDiagramProps> = ({ 
  highlightTier = 'all' 
}) => {
  const diagramRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    mermaid.initialize({
      startOnLoad: false,
      theme: 'base',
      themeVariables: {
        primaryColor: '#1e40af',
        primaryTextColor: '#ffffff',
        primaryBorderColor: '#3b82f6',
        lineColor: '#94a3b8',
        secondaryColor: '#1e293b',
        tertiaryColor: '#0f172a',
        background: '#0f172a',
        mainBkg: '#1e293b',
        nodeBorder: '#3b82f6',
        clusterBkg: '#1e293b',
        clusterBorder: '#475569',
        titleColor: '#f8fafc',
        edgeLabelBackground: '#1e293b',
      },
      flowchart: {
        useMaxWidth: true,
        htmlLabels: true,
        curve: 'basis',
        nodeSpacing: 50,
        rankSpacing: 60,
      },
    });

    const renderDiagram = async () => {
      if (diagramRef.current) {
        diagramRef.current.innerHTML = '';
        
        const diagram = `
flowchart TB
    subgraph SP["🟠 SINGLE-POINT — $497/mo"]
        direction TB
        Triage["🎧 AI Receptionist"]
        Followup["📞 Follow-up Agent"]
        Review["⭐ Review Agent"]
    end
    
    subgraph MT["🔵 MULTI-TRACK — $897/mo"]
        direction TB
        Booking["📅 Scheduling Agent"]
        Dispatch["🚚 Dispatch Agent"]
        Route["🗺️ Route Agent"]
        ETA["⏱️ ETA Agent"]
        Checkin["✅ Check-in Agent"]
        Quoting["💼 Quoting Agent"]
        Invoice["💳 Invoice Agent"]
    end
    
    subgraph CMD["🟣 COMMAND — $5,997/mo"]
        direction TB
        Admin["👔 Admin Agent"]
        Inventory["📦 Inventory Agent"]
        Warranty["🛡️ Warranty Agent"]
        Campaign["📣 Campaign Agent"]
        Lead["🎯 Lead Agent"]
        SocialContent["✏️ Social Content"]
        SocialScheduler["📆 Social Scheduler"]
        SocialAnalytics["📊 Social Analytics"]
        Insights["💡 Insights Agent"]
        Performance["📈 Performance Agent"]
        Revenue["💰 Revenue Agent"]
        Forecast["🔮 Forecast Agent"]
    end
    
    %% Core Dependencies from Triage
    Triage --> Booking
    Triage --> Followup
    Triage --> Review
    
    %% Field Operations Chain
    Dispatch --> Route
    Dispatch --> Checkin
    Route --> ETA
    
    %% Billing Chain
    Quoting --> Invoice
    
    %% Analytics Chain
    Insights --> Performance
    Insights --> Revenue
    Revenue --> Forecast
    Insights -.-> Forecast
    
    %% Social Media Chain
    SocialContent --> SocialScheduler
    SocialContent --> SocialAnalytics

    classDef singlePoint fill:#b45309,stroke:#f59e0b,color:#ffffff,font-weight:bold
    classDef multiTrack fill:#0369a1,stroke:#0ea5e9,color:#ffffff,font-weight:bold
    classDef command fill:#6d28d9,stroke:#a78bfa,color:#ffffff,font-weight:bold
    
    class Triage,Followup,Review singlePoint
    class Booking,Dispatch,Route,ETA,Checkin,Quoting,Invoice multiTrack
    class Admin,Inventory,Warranty,Campaign,Lead,SocialContent,SocialScheduler,SocialAnalytics,Insights,Performance,Revenue,Forecast command
`;
        
        try {
          const { svg } = await mermaid.render('agent-dependency-diagram', diagram);
          diagramRef.current.innerHTML = svg;
        } catch (error) {
          console.error('Mermaid render error:', error);
        }
      }
    };

    renderDiagram();
  }, [highlightTier]);

  return (
    <Card className="bg-card border-border">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2 text-card-foreground">
          <GitBranch className="h-5 w-5 text-primary" />
          Agent Dependency Flow
        </CardTitle>
        <p className="text-sm text-card-foreground/80">
          Arrows show which agents must be active for others to function. Follow the flow to understand prerequisites.
        </p>
      </CardHeader>
      <CardContent>
        <div 
          ref={diagramRef} 
          className="overflow-x-auto bg-slate-900/50 rounded-lg p-4 min-h-[500px]"
        />
        <div className="flex flex-wrap gap-4 mt-4 justify-center">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-amber-600" />
            <span className="text-sm text-card-foreground">Single-Point ($497/mo)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-sky-600" />
            <span className="text-sm text-card-foreground">Multi-Track ($897/mo)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-violet-600" />
            <span className="text-sm text-card-foreground">Command ($5,997/mo)</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default AgentDependencyDiagram;
