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
      theme: 'dark',
      themeVariables: {
        primaryColor: '#1e3a5f',
        primaryTextColor: '#f8fafc',
        primaryBorderColor: '#38bdf8',
        lineColor: '#64748b',
        secondaryColor: '#1e293b',
        tertiaryColor: '#0f172a',
      },
      flowchart: {
        useMaxWidth: true,
        htmlLabels: true,
        curve: 'basis',
      },
    });

    const renderDiagram = async () => {
      if (diagramRef.current) {
        diagramRef.current.innerHTML = '';
        
        const diagram = `
flowchart TB
    subgraph SP["🟠 Single-Point Tier — $497/mo"]
        direction TB
        Triage["🎧 AI Receptionist<br/><i>Core intake & routing</i>"]
        Followup["📞 Follow-up Agent<br/><i>Customer callbacks</i>"]
        Review["⭐ Review Agent<br/><i>Reputation management</i>"]
    end
    
    subgraph MT["🔵 Multi-Track Tier — $897/mo"]
        direction TB
        Booking["📅 Scheduling Agent<br/><i>Online booking</i>"]
        Dispatch["🚚 Dispatch Agent<br/><i>Job assignment</i>"]
        Route["🗺️ Route Agent<br/><i>Optimal routing</i>"]
        ETA["⏱️ ETA Agent<br/><i>Arrival tracking</i>"]
        Checkin["✅ Check-in Agent<br/><i>Job status updates</i>"]
        Quoting["💼 Quoting Agent<br/><i>Estimate creation</i>"]
        Invoice["💳 Invoice Agent<br/><i>Billing automation</i>"]
    end
    
    subgraph CMD["🟣 Command Tier — $1,497/mo"]
        direction TB
        Admin["👔 Admin Agent<br/><i>Business management</i>"]
        Inventory["📦 Inventory Agent<br/><i>Stock tracking</i>"]
        Warranty["🛡️ Warranty Agent<br/><i>Claims processing</i>"]
        Campaign["📣 Campaign Agent<br/><i>Marketing automation</i>"]
        Lead["🎯 Lead Agent<br/><i>Lead qualification</i>"]
        SocialContent["✏️ Social Content<br/><i>Content creation</i>"]
        SocialScheduler["📆 Social Scheduler<br/><i>Post scheduling</i>"]
        SocialAnalytics["📊 Social Analytics<br/><i>Engagement metrics</i>"]
        Insights["💡 Insights Agent<br/><i>Business intelligence</i>"]
        Performance["📈 Performance Agent<br/><i>KPI tracking</i>"]
        Revenue["💰 Revenue Agent<br/><i>Financial analysis</i>"]
        Forecast["🔮 Forecast Agent<br/><i>Predictive analytics</i>"]
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

    classDef singlePoint fill:#d97706,stroke:#fbbf24,color:#fff
    classDef multiTrack fill:#0284c7,stroke:#38bdf8,color:#fff
    classDef command fill:#7c3aed,stroke:#a78bfa,color:#fff
    classDef subgraphSP fill:#451a03,stroke:#d97706,color:#fbbf24
    classDef subgraphMT fill:#0c4a6e,stroke:#0284c7,color:#38bdf8
    classDef subgraphCMD fill:#2e1065,stroke:#7c3aed,color:#a78bfa
    
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
        <p className="text-sm text-muted-foreground">
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
            <span className="text-sm text-muted-foreground">Single-Point ($497/mo)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-sky-600" />
            <span className="text-sm text-muted-foreground">Multi-Track ($897/mo)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-violet-600" />
            <span className="text-sm text-muted-foreground">Command ($1,497/mo)</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default AgentDependencyDiagram;
