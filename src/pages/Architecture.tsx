import { useState } from 'react';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { PageContainer } from '@/components/ui/page-container';
import { PageHeader } from '@/components/ui/page-header';
import { MermaidDiagram } from '@/components/architecture/MermaidDiagram';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Network } from 'lucide-react';

const diagrams = {
  overview: {
    title: 'Platform Architecture Overview',
    description: 'High-level view of all 7 consoles, AI Operatives Hub, and platform entry points',
    chart: `flowchart TB
    subgraph Public["🌐 Public Access"]
        Landing[Landing Page]
        PublicChat[Public Chat Widget]
        SmartWebsite[AI Smart Website]
    end
    
    subgraph CustomerPortal["👤 Customer Portal Console"]
        CustAuth[Customer Auth]
        CustDash[Customer Dashboard]
        CustChat[Message Aura - Text]
        CustVoice[Talk to Aura - Voice]
        CustAppts[My Appointments]
    end
    
    subgraph MainDashboard["🏢 Main Dashboard"]
        Auth[Authentication]
        
        subgraph AdminViews["Admin Views"]
            PlatformAdmin[Platform Admin]
            CompanyAdmin[Company Admin]
        end
        
        subgraph Consoles["7 Control Centers"]
            CustomerPortalC[Customer Portal]
            FieldOps[Field Operations]
            OutreachSales[Outreach & Sales Ops]
            SocialMedia[Social Media Ops]
            CreativeWeb[Creative & Web Presence]
            BusinessOps[Business Operations]
            AnalyticsReports[Analytics & Reports]
        end
        
        subgraph AIHub["🤖 AI Operatives Hub"]
            OperativesList[24 Smart AI Agents]
            AgentMonitor[Real-Time Monitor]
            AgentAnalytics[Performance Analytics]
        end
        
        subgraph Modules["Core Modules"]
            Appointments[Appointments]
            Customers[Customers]
            Employees[Employees]
            Inventory[Inventory]
            Invoices[Invoices]
            Quotes[Quotes]
            Campaigns[Campaigns]
            Leads[Leads]
            KnowledgeBase[Knowledge Base]
            Settings[Settings]
            ContentEngine[Content Engine]
        end
    end
    
    subgraph TechPortal["🔧 Technician Portal"]
        TechDash[Technician Dashboard]
        TechJobs[Job Queue]
        TechFieldOps[Field Operations AI]
    end
    
    Landing --> Auth
    Landing --> PublicChat
    Landing --> CustAuth
    Auth --> PlatformAdmin
    Auth --> CompanyAdmin
    Auth --> TechDash
    CustAuth --> CustDash`
  },
  roles: {
    title: 'User Roles & Access Flow',
    description: 'Authentication and role-based access control',
    chart: `flowchart TD
    Start([User Visits Platform]) --> AuthCheck{Authenticated?}
    
    AuthCheck -->|No| PublicRoutes[Public Routes Only]
    AuthCheck -->|Yes| RoleCheck{Check User Role}
    
    PublicRoutes --> Landing[Landing Page]
    PublicRoutes --> PublicChat[Public Chat]
    PublicRoutes --> CustAuth[Customer Auth]
    PublicRoutes --> SmartWeb[AI Smart Website]
    
    RoleCheck -->|platform_admin| PA[Platform Admin Dashboard]
    RoleCheck -->|company_admin| CA[Company Admin Dashboard]
    RoleCheck -->|employee| EmpCheck{Job Type?}
    RoleCheck -->|customer| Cust[Customer Portal]
    
    EmpCheck -->|technician| Tech[Technician Portal]
    EmpCheck -->|office| Emp[Employee Dashboard]
    
    PA --> AllCompanies[Manage All Companies]
    PA --> PlatformAnalytics[Platform Analytics]
    PA --> SystemSettings[System Settings]
    PA --> PlatformResources[Platform Resources]
    
    CA --> CompanySettings[Company Settings]
    CA --> ManageEmployees[Manage Employees]
    CA --> AIHub[AI Operatives Hub]
    CA --> Consoles7[7 Control Centers]
    CA --> Reports[Analytics & Reports]
    
    Tech --> JobQueue[Job Queue]
    Tech --> TechCalendar[Calendar]
    Tech --> FieldOpsAI[Field Operations AI]
    
    Cust --> MyAppts[My Appointments]
    Cust --> CustAI[Message Aura / Talk to Aura]`
  },
  agents: {
    title: '24 Smart AI Agents — 10 Consolidated Operatives',
    description: 'AI agent distribution across 4 tiers: Core (8), Boost (12), Pro (16), Elite (24)',
    chart: `flowchart TB
    subgraph Entry["Customer Entry Points"]
        Widget[Chat Widget]
        Console[AI Console]
        Voice[Voice Call - SignalWire]
        SMS[SMS - SignalWire]
    end
    
    subgraph Orchestrator["🎯 AI Orchestrator"]
        Router[Message Router]
        Context[Context Manager]
        Handoff[Handoff Controller]
    end
    
    subgraph CoreAgents["🟢 Aura Core — 8 Agents"]
        Triage[AI Receptionist]
        CJ[Customer Journey Agent<br/>Booking · Follow-Up · Review]
        CC[Creative Content Agent]
        WP[Web Presence Agent]
        OA[Outreach Agent<br/>Lead · Marketing]
    end
    
    subgraph BoostAgents["🔵 Aura Boost — +4 Agents"]
        Dispatch[Dispatch Agent]
        FN[Field Navigation Agent<br/>Route · ETA · Check-In]
    end
    
    subgraph ProAgents["🟣 Aura Pro — +4 Agents"]
        Campaign[Campaign Agent]
        OutreachAdv[Outreach Agent - Advanced]
        SFQ[Social Feed Queue Agent]
        SA[Social Analytics Agent]
    end
    
    subgraph EliteAgents["🟡 Aura Elite — +8 Agents"]
        Admin[Admin Agent]
        BF[Business Finance Agent<br/>Quoting · Invoice · Inventory]
        AI_Analytics[Analytics Intelligence Agent<br/>Insights · Performance · Revenue · Forecast]
    end
    
    Entry --> Router
    Router --> Context
    Context --> Triage
    Triage --> Handoff
    Handoff --> CJ
    Handoff --> CC
    Handoff --> OA
    Handoff --> Dispatch
    Handoff --> BF
    Handoff --> AI_Analytics`
  },
  handoff: {
    title: 'Agent Handoff Flow',
    description: 'How operatives collaborate and hand off conversations',
    chart: `sequenceDiagram
    participant C as Customer
    participant T as AI Receptionist
    participant CJ as Customer Journey
    participant D as Dispatch Agent
    participant FN as Field Navigation
    participant N as Notification System
    
    C->>T: "I need someone to fix my AC"
    T->>T: Analyze intent
    T->>CJ: Handoff with context
    CJ->>C: "I can help schedule that. When works for you?"
    C->>CJ: "Tomorrow at 2pm"
    CJ->>CJ: Check availability via Calendar Sync
    CJ->>C: "Confirmed for tomorrow 2pm"
    CJ->>D: Handoff for technician assignment
    D->>D: Find best available technician
    D->>FN: Assign route & ETA
    FN->>N: Trigger notifications
    N->>C: Email/SMS confirmation via Resend/SignalWire`
  },
  consoles: {
    title: '7 Control Centers + AI Operatives Hub',
    description: 'Console architecture with tier-based access',
    chart: `flowchart TB
    subgraph CoreTier["🟢 Aura Core — 3 Consoles"]
        CP[Customer Portal<br/>AI Receptionist + Customer Journey]
        OS[Outreach & Sales Ops<br/>Outreach Agent]
        CW[Creative & Web Presence<br/>Creative Content + Web Presence]
    end
    
    subgraph BoostTier["🔵 Aura Boost — +2 Consoles"]
        FO[Field Operations<br/>Dispatch + Field Navigation]
        SM[Social Media Ops<br/>Creative Content Agent]
    end
    
    subgraph EliteTier["🟡 Aura Elite — +2 Consoles"]
        BO[Business Operations<br/>Admin + Business Finance]
        AR[Analytics & Reports<br/>Analytics Intelligence]
    end
    
    subgraph Universal["🤖 All Tiers"]
        Hub[AI Operatives Hub<br/>Management Interface]
    end
    
    subgraph SharedUI["Shared Components"]
        ChatBubble[ChatBubble]
        FloatingInput[FloatingInput]
        QuickActions[QuickActionGrid]
        WelcomeScreen[WelcomeScreen]
        GlassHeader[GlassHeader]
    end
    
    subgraph Hooks["Hook Layer"]
        useMultiAgent[useMultiAgentChat]
        useAIAgent[useAIAgent]
        useOrchestrator[useAIAgentOrchestrator]
    end
    
    subgraph Backend["Edge Functions"]
        ChatFn[ai-agent-chat]
        OrchestratorFn[ai-orchestrator]
    end
    
    CoreTier --> SharedUI
    BoostTier --> SharedUI
    EliteTier --> SharedUI
    SharedUI --> Hooks
    Hooks --> Backend`
  },
  database: {
    title: 'Database Entity Relationships',
    description: 'Core database tables and relationships',
    chart: `erDiagram
    companies ||--o{ profiles : "has employees"
    companies ||--o{ appointments : "has"
    companies ||--o{ customers : "has"
    companies ||--o{ services : "offers"
    companies ||--o{ ai_agent_configs : "configures"
    companies ||--o{ marketing_campaigns : "runs"
    companies ||--o{ content_engine_history : "generates"
    
    profiles ||--o{ job_assignments : "assigned to"
    profiles ||--o{ employee_availability : "has"
    
    appointments ||--o{ job_assignments : "has"
    appointments ||--o{ reminder_logs : "triggers"
    appointments ||--o{ invoices : "generates"
    
    customers ||--o{ appointments : "books"
    customers ||--o{ customer_feedback : "provides"
    
    ai_agent_configs ||--o{ ai_agent_logs : "generates"
    ai_agent_context ||--o{ ai_agent_events : "triggers"
    
    companies {
        uuid id PK
        string name
        string slug
        string subscription_tier
        string logo_url
    }
    
    profiles {
        uuid id PK
        uuid company_id FK
        string full_name
        string email
    }
    
    appointments {
        uuid id PK
        uuid company_id FK
        uuid employee_id FK
        timestamp datetime
        string status
    }`
  },
  journey: {
    title: 'Customer Journey Flow',
    description: 'End-to-end customer experience across operatives',
    chart: `journey
    title Customer Journey
    section Discovery
      Visit website or Smart Website: 5: Customer
      Explore services: 4: Customer
      Start chat via Widget: 5: Customer
    section Booking
      AI Receptionist greets: 5: Customer, Triage
      Customer Journey books: 5: Customer, CustomerJourney
      Calendar sync confirms: 5: System
      Receive confirmation: 5: Customer, System
    section Service Day
      Get reminder via SMS/Email: 5: System
      Dispatch assigns technician: 4: Dispatch
      Field Navigation routes tech: 5: FieldNav
      Tech checks in on arrival: 5: Tech
      Service completed: 5: Tech
    section Post-Service
      Follow-up sent: 5: CustomerJourney
      Review request: 4: CustomerJourney
      Leave Google/Yelp review: 4: Customer
      Win-back campaign later: 5: Outreach`
  },
  edgeFunctions: {
    title: 'Edge Functions Architecture',
    description: 'Backend serverless functions and external integrations',
    chart: `flowchart LR
    subgraph Frontend["Frontend"]
        App[React App]
        Widget[Chat Widget]
        SmartWeb[Smart Website]
    end
    
    subgraph EdgeFunctions["Edge Functions"]
        subgraph AI["AI Functions"]
            AIChat[ai-agent-chat]
            AIOrch[ai-orchestrator]
            ContentGen[generate-content]
        end
        
        subgraph Comms["Communication"]
            SendEmail[send-appointment-email]
            SendSMS[send-appointment-sms]
            Reminders[appointment-reminders]
        end
        
        subgraph Integrations["Integrations"]
            Stripe[create-checkout]
            GoogleCal[google-calendar-sync]
            VoiceHandler[voice-handler]
            VoiceSWAIG[voice-swaig]
            SocialPublish[publish-social-content]
        end
        
        subgraph Voice["Voice AI"]
            ElevenLabs[elevenlabs-tts]
            VoiceClone[elevenlabs-clone-voice]
        end
        
        subgraph WidgetAPI["Widget & Web"]
            WidgetAPI2[widget-api]
            ChatWidget[chat-widget]
            SmartWebAPI[smart-website-api]
        end
        
        subgraph Subscription["Billing"]
            CheckSub[check-subscription]
            CreateCheckout[create-checkout]
            StripePortal[stripe-customer-portal]
        end
    end
    
    subgraph External["External Services"]
        Resend[Resend Email]
        SignalWireExt[SignalWire - Voice & SMS]
        StripeExt[Stripe - Payments]
        ElevenLabsExt[ElevenLabs - Voice AI]
        GoogleExt[Google Calendar]
        SocialAPIs[Social Media APIs]
        TavilyExt[Tavily - AI Research]
    end
    
    Frontend --> EdgeFunctions
    EdgeFunctions --> External`
  }
};

export default function Architecture() {
  const [activeTab, setActiveTab] = useState('overview');

  return (
    <DashboardLayout>
      <PageContainer>
        <div className="space-y-6">
          <PageHeader
            icon={Network}
            title="Architecture Documentation"
            description="Interactive platform flowcharts — 7 consoles, 24 agents, 10 operatives"
            featureColor="overview"
          />

          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <ScrollArea className="w-full">
              <TabsList className="inline-flex w-max mb-4">
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="roles">Roles & Access</TabsTrigger>
                <TabsTrigger value="agents">AI Agents (24)</TabsTrigger>
                <TabsTrigger value="handoff">Agent Handoffs</TabsTrigger>
                <TabsTrigger value="consoles">Consoles (7+Hub)</TabsTrigger>
                <TabsTrigger value="database">Database</TabsTrigger>
                <TabsTrigger value="journey">Customer Journey</TabsTrigger>
                <TabsTrigger value="edgeFunctions">Edge Functions</TabsTrigger>
              </TabsList>
            </ScrollArea>

            {Object.entries(diagrams).map(([key, diagram]) => (
              <TabsContent key={key} value={key} className="mt-0">
                <MermaidDiagram
                  chart={diagram.chart}
                  title={diagram.title}
                  description={diagram.description}
                />
              </TabsContent>
            ))}
          </Tabs>
        </div>
      </PageContainer>
    </DashboardLayout>
  );
}
