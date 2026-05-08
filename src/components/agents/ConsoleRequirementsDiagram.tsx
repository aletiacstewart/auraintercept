import React, { useEffect, useRef } from 'react';
import mermaid from 'mermaid';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Monitor } from 'lucide-react';

const ConsoleRequirementsDiagram: React.FC = () => {
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
flowchart LR
    subgraph Agents["Required Anchor Agents"]
        T["🎧 AI Receptionist"]
        D["🚚 Dispatch/GPS Console"]
        AQ["👔 Admin + 💼 Quoting"]
        C["📣 Campaign Agent"]
        SC["✏️ Social Content"]
        I["💡 Insights Agent"]
    end
    
    subgraph Consoles["Control Centers Unlocked"]
        CP["🌐 Customer Portal"]
        FO["🚛 Field Operations"]
        BM["📋 Business Management"]
        MS["📣 Outreach & Sales Ops"]
        SM["📱 Social Media"]
        AR["📊 Analytics & Reports"]
    end
    
    T --> CP
    D --> FO
    AQ --> BM
    C --> MS
    SC --> SM
    I --> AR

    classDef agent fill:#0284c7,stroke:#38bdf8,color:#fff
    classDef console fill:#059669,stroke:#34d399,color:#fff
    
    class T,D,AQ,C,SC,I agent
    class CP,FO,BM,MS,SM,AR console
`;
        
        try {
          const { svg } = await mermaid.render('console-requirements-diagram', diagram);
          diagramRef.current.innerHTML = svg;
        } catch (error) {
          console.error('Mermaid render error:', error);
        }
      }
    };

    renderDiagram();
  }, []);

  return (
    <Card className="bg-card border-border">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2 text-card-foreground">
          <Monitor className="h-5 w-5 text-primary" />
          Console Requirements
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Each Control Center requires specific "anchor agents" to function. Enable the anchor agent to unlock the full console experience.
        </p>
      </CardHeader>
      <CardContent>
        <div 
          ref={diagramRef} 
          className="overflow-x-auto bg-slate-900/50 rounded-lg p-4 min-h-[200px]"
        />
        <div className="flex flex-wrap gap-4 mt-4 justify-center">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-sky-600" />
            <span className="text-sm text-muted-foreground">Required Agent</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-emerald-600" />
            <span className="text-sm text-muted-foreground">Unlocked Console</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default ConsoleRequirementsDiagram;
