import React, { useEffect, useRef } from 'react';
import mermaid from 'mermaid';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { GitBranch } from 'lucide-react';

interface AgentDependencyDiagramProps {
  highlightTier?: 'starter' | 'connect' | 'performance' | 'command' | 'all';
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
    subgraph CORE["🟢 CORE — $497/mo (was $697)"]
        direction TB
        Triage["🎧 AI Receptionist"]
        Booking["📅 Booking Agent"]
        Followup["📞 Follow-up Agent"]
        Review["⭐ Review Agent"]
        CreativeContent["🎨 Creative Content"]
        WebPresence["🌐 Web Presence"]
        LeadAgent["🎯 Lead Agent"]
        Marketing["📣 Marketing Agent"]
    end
    
    subgraph BOOST["🔵 BOOST — $897/mo (was $1,097)"]
        direction TB
        Dispatch["🚚 Dispatch/GPS Console"]
        Route["🗺️ Route Agent"]
        ETA["⏱️ ETA Agent"]
        Checkin["✅ Check-in Agent"]
    end
    
    subgraph PRO["🟣 PRO — $1,797/mo (was $1,997)"]
        direction TB
        Campaign["📣 Campaign Agent"]
        Outreach["📧 Outreach Agent"]
        SocialScheduler["📆 Social Scheduler Agent"]
        SocialAnalytics["📊 Social Analytics"]
        Admin["👔 Admin Agent"]
        Quoting["💼 Quoting Agent"]
    end

    subgraph ELITE["🟡 ELITE — $2,997/mo (was $3,997)"]
        direction TB
        Invoice["💳 Invoice Agent"]
        Inventory["📦 Inventory Agent"]
        Insights["📈 Insights Agent"]
        Performance["⚡ Performance Agent"]
        Revenue["💰 Revenue Agent"]
        Forecast["🔮 Forecast Agent"]
    end
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
    class Admin,Inventory,Campaign,Lead,SocialContent,SocialScheduler,SocialAnalytics,Insights,Performance,Revenue,Forecast command
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
            <div className="w-4 h-4 rounded bg-green-600" />
            <span className="text-sm text-card-foreground">Core ($497/mo · was $697)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-sky-600" />
            <span className="text-sm text-card-foreground">Boost ($897/mo · was $1,097)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-violet-600" />
            <span className="text-sm text-card-foreground">Pro ($1,797/mo · was $1,997)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-amber-600" />
            <span className="text-sm text-card-foreground">Elite ($2,997/mo · was $3,997)</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default AgentDependencyDiagram;
