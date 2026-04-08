import { useState } from 'react';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { PageContainer } from '@/components/ui/page-container';
import { PageHeader } from '@/components/ui/page-header';
import { MermaidDiagram } from '@/components/architecture/MermaidDiagram';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Network } from 'lucide-react';

// Shared classDef block for flowcharts
const tierStyles = `
    classDef core fill:#059669,stroke:#34d399,color:#fff,stroke-width:2px
    classDef boost fill:#0284c7,stroke:#38bdf8,color:#fff,stroke-width:2px
    classDef pro fill:#7c3aed,stroke:#a78bfa,color:#fff,stroke-width:2px
    classDef elite fill:#b45309,stroke:#f59e0b,color:#fff,stroke-width:2px
    classDef system fill:#334155,stroke:#64748b,color:#e2e8f0,stroke-width:2px
    classDef external fill:#be123c,stroke:#fb7185,color:#fff,stroke-width:2px
    classDef entry fill:#0d9488,stroke:#2dd4bf,color:#fff,stroke-width:2px`;

const diagrams = {
  overview: {
    title: 'Platform Architecture Overview',
    description: 'High-level view of all 7 consoles, AI Operatives Hub, and platform entry points',
    chart: `flowchart TB
    subgraph Public["Public Access"]
        Landing["Landing Page"]
        PublicChat["Public Chat\nWidget"]
        SmartWebsite["AI Smart\nWebsite"]
    end
    
    subgraph CustomerPortal["Customer Portal Console - Core"]
        CustAuth["Customer\nAuth"]
        CustDash["Customer\nDashboard"]
        CustChat["Message Aura\nText"]
        CustVoice["Talk to Aura\nVoice"]
        CustAppts["My\nAppointments"]
    end
    
    subgraph MainDashboard["Main Dashboard"]
        Auth["Authentication"]
        
        subgraph AdminViews["Admin Views"]
            PlatformAdmin["Platform\nAdmin"]
            CompanyAdmin["Company\nAdmin"]
        end
        
        subgraph CoreConsoles["Core Consoles - 3"]
            CustomerPortalC["Customer\nPortal"]
            OutreachSales["Outreach &\nSales Ops"]
            CreativeWeb["Creative &\nWeb Presence"]
        end

        subgraph BoostConsoles["Boost Consoles - +2"]
            FieldOps["Field\nOperations"]
            SocialMedia["Social\nMedia Ops"]
        end

        subgraph EliteConsoles["Elite Consoles - +2"]
            BusinessOps["Business\nOperations"]
            AnalyticsReports["Analytics &\nReports"]
        end
        
        subgraph AIHub["AI Operatives Hub - All Tiers"]
            OperativesList["10 Consolidated\nOperatives"]
            AgentMonitor["Real-Time\nMonitor"]
            AgentAnalytics["Performance\nAnalytics"]
        end
        
        subgraph Modules["Core Modules"]
            Appointments["Appointments"]
            Customers["Customers"]
            Employees["Employees"]
            Inventory["Inventory"]
            Invoices["Invoices"]
            Quotes["Quotes"]
            Campaigns["Campaigns"]
            Leads["Leads"]
            KnowledgeBase["Knowledge\nBase"]
            ContentEngine["Content\nEngine"]
            Settings["Settings"]
        end
    end
    
    subgraph TechPortal["Technician Portal"]
        TechDash["Technician\nDashboard"]
        TechJobs["Job Queue"]
        TechFieldOps["Field Ops AI"]
    end
    
    Landing --> Auth
    Landing --> PublicChat
    Landing --> CustAuth
    Auth --> PlatformAdmin
    Auth --> CompanyAdmin
    Auth --> TechDash
    CustAuth --> CustDash

    class Landing,PublicChat,SmartWebsite entry
    class CustAuth,CustDash,CustChat,CustVoice,CustAppts core
    class Auth,PlatformAdmin,CompanyAdmin system
    class CustomerPortalC,OutreachSales,CreativeWeb core
    class FieldOps,SocialMedia boost
    class BusinessOps,AnalyticsReports elite
    class OperativesList,AgentMonitor,AgentAnalytics pro
    class Appointments,Customers,Employees,Inventory,Invoices,Quotes,Campaigns,Leads,KnowledgeBase,ContentEngine,Settings system
    class TechDash,TechJobs,TechFieldOps boost
${tierStyles}`
  },
  agents: {
    title: '10 Consolidated Operatives (24 Agents)',
    description: 'AI operative distribution: Core (8) / Boost (12) / Pro (16) / Elite (24)',
    chart: `flowchart TB
    subgraph Entry["Customer Entry Points"]
        Widget["Chat Widget"]
        Console["AI Console"]
        Voice["Voice\nSignalWire"]
        SMS["SMS\nSignalWire"]
    end
    
    subgraph Orchestrator["AI Orchestrator"]
        Router["Message\nRouter"]
        Context["Context\nManager"]
        Handoff["Handoff\nController"]
    end
    
    subgraph CoreOps["Core - 5 Operatives / 8 Agents"]
        Triage["AI\nReceptionist"]
        CJ["Customer Journey\nBooking / Follow-Up\nReview"]
        CC["Creative Content\nSocial / Blog\nEmail / SMS"]
        WP["Web Presence\nSEO / Blog\nSite"]
        OA["Outreach\nLead / Marketing\nCampaigns"]
    end
    
    subgraph BoostOps["Boost - +2 Operatives / +4 Agents"]
        Dispatch["Dispatch\nSkills / Zones\nWorkload"]
        FN["Field Navigation\nRoute / ETA\nCheck-In"]
    end
    
    subgraph ProOps["Pro - +4 Agents"]
        Campaign["Campaign\nAgent"]
        OutreachAdv["Outreach\nAdvanced"]
        SFQ["Social Feed\nQueue"]
        SA["Social\nAnalytics"]
    end
    
    subgraph EliteOps["Elite - +3 Operatives / +8 Agents"]
        Admin["Admin\nSettings / Users\nOps"]
        BF["Business Finance\nQuoting / Invoice\nInventory"]
        Analytics["Analytics Intel\nInsights / Perf\nRevenue / Forecast"]
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
    Handoff --> Analytics

    class Widget,Console,Voice,SMS entry
    class Router,Context,Handoff system
    class Triage,CJ,CC,WP,OA core
    class Dispatch,FN boost
    class Campaign,OutreachAdv,SFQ,SA pro
    class Admin,BF,Analytics elite
${tierStyles}`
  },
  handoffs: {
    title: 'Cross-Console Handoff Flow',
    description: 'How operatives collaborate across consoles automatically',
    chart: `sequenceDiagram
    box rgb(13,148,136) Entry
    participant C as Customer
    end
    box rgb(5,150,105) Core Agents
    participant T as AI Receptionist
    participant CJ as Customer Journey
    end
    box rgb(2,132,199) Boost Agents
    participant D as Dispatch
    participant FN as Field Nav
    end
    box rgb(180,83,9) Elite Agents
    participant BF as Biz Finance
    participant AI as Analytics Intel
    end
    box rgb(51,65,85) System
    participant N as Notifications
    end
    
    C->>T: I need AC repair
    T->>T: Analyze intent
    T->>CJ: Handoff with context
    CJ->>C: When works for you?
    C->>CJ: Tomorrow 2pm
    CJ->>CJ: Check calendar
    CJ->>C: Confirmed 2pm
    CJ->>D: Trigger dispatch
    D->>D: Find best tech
    D->>FN: Assign route + ETA
    FN->>N: Send notifications
    N->>C: SMS/Email confirm
    Note over FN,BF: Job completed
    FN->>BF: Trigger invoice
    BF->>AI: Revenue data
    CJ->>C: Follow-up + review`
  },
  consoles: {
    title: '7 Control Centers + AI Operatives Hub',
    description: 'Console architecture with tier-based access and operative mapping',
    chart: `flowchart TB
    subgraph CoreTier["Core - 3 Consoles"]
        CP["Customer Portal\nReceptionist +\nCustomer Journey"]
        OS["Outreach & Sales\nOutreach Agent"]
        CW["Creative & Web\nCreative Content +\nWeb Presence"]
    end
    
    subgraph BoostTier["Boost - +2 Consoles"]
        FO["Field Operations\nDispatch +\nField Navigation"]
        SM["Social Media Ops\nCreative Content"]
    end
    
    subgraph EliteTier["Elite - +2 Consoles"]
        BO["Business Ops\nAdmin +\nBiz Finance"]
        AR["Analytics & Reports\nAnalytics Intel"]
    end
    
    subgraph Hub["All Tiers"]
        AIHub["AI Operatives Hub\nManagement"]
    end
    
    subgraph SharedUI["Shared Components"]
        ChatBubble["ChatBubble"]
        FloatingInput["FloatingInput"]
        QuickActions["QuickAction\nGrid"]
        WelcomeScreen["Welcome\nScreen"]
        GlassHeader["GlassHeader"]
    end
    
    subgraph Hooks["Hook Layer"]
        useMultiAgent["useMultiAgent\nChat"]
        useAIAgent["useAIAgent"]
        useOrchestrator["useAIAgent\nOrchestrator"]
    end
    
    subgraph Backend["Edge Functions"]
        ChatFn["ai-agent-chat"]
        OrchestratorFn["ai-orchestrator"]
    end
    
    CoreTier --> SharedUI
    BoostTier --> SharedUI
    EliteTier --> SharedUI
    Hub --> SharedUI
    SharedUI --> Hooks
    Hooks --> Backend

    class CP,OS,CW core
    class FO,SM boost
    class BO,AR elite
    class AIHub pro
    class ChatBubble,FloatingInput,QuickActions,WelcomeScreen,GlassHeader system
    class useMultiAgent,useAIAgent,useOrchestrator system
    class ChatFn,OrchestratorFn external
${tierStyles}`
  },
  roles: {
    title: 'User Roles & Access Flow',
    description: 'Authentication and role-based access control',
    chart: `flowchart TD
    Start(["User Visits\nPlatform"]) --> AuthCheck{"Authenticated?"}
    
    AuthCheck -->|No| PublicRoutes["Public Routes"]
    AuthCheck -->|Yes| RoleCheck{"Check Role"}
    
    PublicRoutes --> Landing["Landing Page"]
    PublicRoutes --> PublicChat["Public Chat"]
    PublicRoutes --> CustAuth["Customer Auth"]
    PublicRoutes --> SmartWeb["AI Smart\nWebsite"]
    
    RoleCheck -->|platform_admin| PA["Platform Admin\nDashboard"]
    RoleCheck -->|company_admin| CA["Company Admin\nDashboard"]
    RoleCheck -->|employee| EmpCheck{"Job Type?"}
    RoleCheck -->|customer| Cust["Customer\nPortal"]
    
    EmpCheck -->|technician| Tech["Technician\nPortal"]
    EmpCheck -->|office| Emp["Employee\nDashboard"]
    
    PA --> AllCompanies["Manage All\nCompanies"]
    PA --> PlatformAnalytics["Platform\nAnalytics"]
    PA --> SystemSettings["System\nSettings"]
    PA --> PlatformResources["Platform\nResources"]
    
    CA --> CompanySettings["Company\nSettings"]
    CA --> ManageEmployees["Manage\nEmployees"]
    CA --> AIHub["AI Operatives\nHub"]
    CA --> Consoles7["7 Control\nCenters"]
    CA --> Reports["Analytics &\nReports"]
    
    Tech --> JobQueue["Job Queue"]
    Tech --> TechCalendar["Calendar"]
    Tech --> FieldOpsAI["Field Ops AI"]
    
    Cust --> MyAppts["My\nAppointments"]
    Cust --> CustAI["Message Aura\nTalk to Aura"]

    class Start,AuthCheck,RoleCheck,EmpCheck system
    class PublicRoutes,Landing,PublicChat,CustAuth,SmartWeb entry
    class PA,AllCompanies,PlatformAnalytics,SystemSettings,PlatformResources elite
    class CA,CompanySettings,ManageEmployees,AIHub,Consoles7,Reports core
    class Tech,JobQueue,TechCalendar,FieldOpsAI boost
    class Emp system
    class Cust,MyAppts,CustAI core
${tierStyles}`
  },
  operativeFlow: {
    title: 'Operative Network Flow',
    description: 'How 10 operatives connect across 7 consoles end-to-end',
    chart: `flowchart LR
    subgraph CustomerPortal["Customer Portal"]
        Triage["AI\nReceptionist"]
        CJ["Customer\nJourney"]
    end

    subgraph OutreachConsole["Outreach & Sales"]
        Outreach["Outreach\nAgent"]
    end

    subgraph CreativeConsole["Creative & Web"]
        Creative["Creative\nContent"]
        WebPresence["Web\nPresence"]
    end

    subgraph FieldOpsConsole["Field Operations"]
        Dispatch["Dispatch"]
        FieldNav["Field\nNavigation"]
    end

    subgraph BusinessConsole["Business Ops"]
        Admin["Admin"]
        BizFinance["Business\nFinance"]
    end

    subgraph AnalyticsConsole["Analytics & Reports"]
        AnalyticsInt["Analytics\nIntelligence"]
    end

    Triage --> CJ
    CJ --> Dispatch
    CJ --> Outreach
    Outreach --> Creative
    Creative --> WebPresence
    Dispatch --> FieldNav
    FieldNav --> BizFinance
    BizFinance --> AnalyticsInt
    Admin --> BizFinance
    Outreach --> AnalyticsInt

    class Triage,CJ core
    class Outreach core
    class Creative,WebPresence core
    class Dispatch,FieldNav boost
    class Admin,BizFinance elite
    class AnalyticsInt elite
${tierStyles}`
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
      Visit website: 5: Customer
      Explore services: 4: Customer
      Start chat: 5: Customer
    section Booking
      Receptionist greets: 5: Customer, Triage
      Journey books appt: 5: Customer, CJ
      Calendar confirms: 5: System
      Get confirmation: 5: Customer, System
    section Service Day
      SMS/Email reminder: 5: System
      Dispatch assigns tech: 4: Dispatch
      Field Nav routes: 5: FieldNav
      Tech checks in: 5: Tech
      Service done: 5: Tech
    section Post-Service
      Follow-up sent: 5: CJ
      Review request: 4: CJ
      Leave review: 4: Customer
      Win-back campaign: 5: Outreach`
  },
  edgeFunctions: {
    title: 'Edge Functions Architecture',
    description: 'Backend serverless functions and external integrations',
    chart: `flowchart LR
    subgraph Frontend["Frontend"]
        App["React App"]
        Widget["Chat Widget"]
        SmartWeb["Smart Website"]
    end
    
    subgraph EdgeFunctions["Edge Functions"]
        subgraph AI["AI Functions"]
            AIChat["ai-agent-chat"]
            AIOrch["ai-orchestrator"]
            ContentGen["generate-content"]
        end
        
        subgraph Comms["Communication"]
            SendEmail["send-appt\nemail"]
            SendSMS["send-appt\nsms"]
            Reminders["appt-reminders"]
        end
        
        subgraph Integrations["Integrations"]
            Stripe["create-checkout"]
            GoogleCal["google-cal\nsync"]
            VoiceHandler["voice-handler"]
            VoiceSWAIG["voice-swaig"]
            SocialPublish["publish-social\ncontent"]
        end
        
        subgraph VoiceAI["Voice AI"]
            ElevenLabs["elevenlabs-tts"]
            VoiceClone["elevenlabs\nclone-voice"]
        end
        
        subgraph WidgetAPI["Widget & Web"]
            WidgetAPI2["widget-api"]
            ChatWidget["chat-widget"]
            SmartWebAPI["smart-website\napi"]
        end
        
        subgraph Subscription["Billing"]
            CheckSub["check-sub"]
            CreateCheckout["create-checkout\nsession"]
            StripePortal["stripe-customer\nportal"]
        end
    end
    
    subgraph External["External Services"]
        Resend["Resend\nEmail"]
        SignalWireExt["SignalWire\nVoice & SMS"]
        StripeExt["Stripe\nPayments"]
        ElevenLabsExt["ElevenLabs\nVoice AI"]
        GoogleExt["Google\nCalendar"]
        SocialAPIs["Social Media\nAPIs"]
        TavilyExt["Tavily\nAI Research"]
    end
    
    Frontend --> EdgeFunctions
    EdgeFunctions --> External

    class App,Widget,SmartWeb entry
    class AIChat,AIOrch,ContentGen pro
    class SendEmail,SendSMS,Reminders core
    class Stripe,GoogleCal,VoiceHandler,VoiceSWAIG,SocialPublish boost
    class ElevenLabs,VoiceClone boost
    class WidgetAPI2,ChatWidget,SmartWebAPI core
    class CheckSub,CreateCheckout,StripePortal elite
    class Resend,SignalWireExt,StripeExt,ElevenLabsExt,GoogleExt,SocialAPIs,TavilyExt external
${tierStyles}`
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
            description="Interactive platform flowcharts — 7 consoles, 10 operatives, 24 agents, 4 tiers"
            featureColor="overview"
          />

          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <ScrollArea className="w-full">
              <TabsList className="inline-flex w-max mb-4">
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="agents">Operatives (10)</TabsTrigger>
                <TabsTrigger value="operativeFlow">Network Flow</TabsTrigger>
                <TabsTrigger value="handoffs">Handoffs</TabsTrigger>
                <TabsTrigger value="consoles">Consoles (7+Hub)</TabsTrigger>
                <TabsTrigger value="roles">Roles & Access</TabsTrigger>
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
