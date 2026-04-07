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
    subgraph Public["Public Access"]
        Landing[Landing Page]
        PublicChat[Public Chat Widget]
        SmartWebsite[AI Smart Website]
    end
    
    subgraph CustomerPortal["Customer Portal Console - Core+"]
        CustAuth[Customer Auth]
        CustDash[Customer Dashboard]
        CustChat[Message Aura - Text]
        CustVoice[Talk to Aura - Voice]
        CustAppts[My Appointments]
    end
    
    subgraph MainDashboard["Main Dashboard"]
        Auth[Authentication]
        
        subgraph AdminViews["Admin Views"]
            PlatformAdmin[Platform Admin]
            CompanyAdmin[Company Admin]
        end
        
        subgraph CoreConsoles["Core Consoles - 3"]
            CustomerPortalC[Customer Portal]
            OutreachSales[Outreach and Sales Ops]
            CreativeWeb[Creative and Web Presence]
        end

        subgraph BoostConsoles["Boost Consoles - +2"]
            FieldOps[Field Operations]
            SocialMedia[Social Media Ops]
        end

        subgraph EliteConsoles["Elite Consoles - +2"]
            BusinessOps[Business Operations]
            AnalyticsReports[Analytics and Reports]
        end
        
        subgraph AIHub["AI Operatives Hub - All Tiers"]
            OperativesList[10 Consolidated Operatives]
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
            ContentEngine[Content Engine]
            Settings[Settings]
        end
    end
    
    subgraph TechPortal["Technician Portal"]
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
  agents: {
    title: '10 Consolidated Operatives (24 Agents)',
    description: 'AI operative distribution: Core (8) / Boost (12) / Pro (16) / Elite (24)',
    chart: `flowchart TB
    subgraph Entry["Customer Entry Points"]
        Widget[Chat Widget]
        Console[AI Console]
        Voice[Voice - SignalWire]
        SMS[SMS - SignalWire]
    end
    
    subgraph Orchestrator["AI Orchestrator"]
        Router[Message Router]
        Context[Context Manager]
        Handoff[Handoff Controller]
    end
    
    subgraph CoreOps["Core - 5 Operatives / 8 Agents"]
        Triage[AI Receptionist]
        CJ[Customer Journey<br/>Booking - Follow-Up - Review]
        CC[Creative Content<br/>Social - Blog - Email - SMS]
        WP[Web Presence<br/>SEO - Blog - Site]
        OA[Outreach<br/>Lead - Marketing - Campaigns]
    end
    
    subgraph BoostOps["Boost - +2 Operatives / +4 Agents"]
        Dispatch[Dispatch<br/>Skills - Zones - Workload]
        FN[Field Navigation<br/>Route - ETA - Check-In]
    end
    
    subgraph ProOps["Pro - +4 Agents"]
        Campaign[Campaign Agent]
        OutreachAdv[Outreach - Advanced]
        SFQ[Social Feed Queue]
        SA[Social Analytics]
    end
    
    subgraph EliteOps["Elite - +3 Operatives / +8 Agents"]
        Admin[Admin<br/>Settings - Users - Ops]
        BF[Business Finance<br/>Quoting - Invoice - Inventory]
        Analytics[Analytics Intelligence<br/>Insights - Performance - Revenue - Forecast]
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
    Handoff --> Analytics`
  },
  handoffs: {
    title: 'Cross-Console Handoff Flow',
    description: 'How operatives collaborate across consoles automatically',
    chart: `sequenceDiagram
    participant C as Customer
    participant T as AI Receptionist
    participant CJ as Customer Journey
    participant D as Dispatch
    participant FN as Field Navigation
    participant BF as Business Finance
    participant AI as Analytics Intelligence
    participant N as Notification System
    
    C->>T: I need someone to fix my AC
    T->>T: Analyze intent + collect info
    T->>CJ: Handoff with context
    CJ->>C: I can help schedule that. When works?
    C->>CJ: Tomorrow at 2pm
    CJ->>CJ: Check availability via Calendar Sync
    CJ->>C: Confirmed for tomorrow 2pm
    CJ->>D: Trigger dispatch on booking
    D->>D: Find best technician by skills + zone
    D->>FN: Assign route and ETA
    FN->>N: Trigger SMS/Email notifications
    N->>C: Confirmation via Resend/SignalWire
    Note over FN,BF: Job completed
    FN->>BF: Complete triggers invoice
    BF->>AI: Revenue data flows to analytics
    CJ->>C: Follow-up + review request`
  },
  consoles: {
    title: '7 Control Centers + AI Operatives Hub',
    description: 'Console architecture with tier-based access and operative mapping',
    chart: `flowchart TB
    subgraph CoreTier["Core - 3 Consoles"]
        CP[Customer Portal<br/>AI Receptionist + Customer Journey]
        OS[Outreach and Sales Ops<br/>Outreach Agent]
        CW[Creative and Web Presence<br/>Creative Content + Web Presence]
    end
    
    subgraph BoostTier["Boost - +2 Consoles"]
        FO[Field Operations<br/>Dispatch + Field Navigation]
        SM[Social Media Ops<br/>Creative Content Agent]
    end
    
    subgraph EliteTier["Elite - +2 Consoles"]
        BO[Business Operations<br/>Admin + Business Finance]
        AR[Analytics and Reports<br/>Analytics Intelligence]
    end
    
    subgraph Hub["All Tiers"]
        AIHub[AI Operatives Hub<br/>Management Interface]
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
    Hub --> SharedUI
    SharedUI --> Hooks
    Hooks --> Backend`
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
    CA --> Reports[Analytics and Reports]
    
    Tech --> JobQueue[Job Queue]
    Tech --> TechCalendar[Calendar]
    Tech --> FieldOpsAI[Field Operations AI]
    
    Cust --> MyAppts[My Appointments]
    Cust --> CustAI[Message Aura / Talk to Aura]`
  },
  operativeFlow: {
    title: 'Operative Network Flow',
    description: 'How 10 operatives connect across 7 consoles end-to-end',
    chart: `flowchart LR
    subgraph CustomerPortal["Customer Portal"]
        Triage[AI Receptionist]
        CJ[Customer Journey]
    end

    subgraph OutreachConsole["Outreach and Sales"]
        Outreach[Outreach Agent]
    end

    subgraph CreativeConsole["Creative and Web"]
        Creative[Creative Content]
        WebPresence[Web Presence]
    end

    subgraph FieldOpsConsole["Field Operations"]
        Dispatch[Dispatch]
        FieldNav[Field Navigation]
    end

    subgraph BusinessConsole["Business Operations"]
        Admin[Admin]
        BizFinance[Business Finance]
    end

    subgraph AnalyticsConsole["Analytics and Reports"]
        AnalyticsInt[Analytics Intelligence]
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
    Outreach --> AnalyticsInt`
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
      Get reminder via SMS and Email: 5: System
      Dispatch assigns technician: 4: Dispatch
      Field Navigation routes tech: 5: FieldNav
      Tech checks in on arrival: 5: Tech
      Service completed: 5: Tech
    section Post-Service
      Follow-up sent: 5: CustomerJourney
      Review request: 4: CustomerJourney
      Leave Google or Yelp review: 4: Customer
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
        
        subgraph WidgetAPI["Widget and Web"]
            WidgetAPI2[widget-api]
            ChatWidget[chat-widget]
            SmartWebAPI[smart-website-api]
        end
        
        subgraph Subscription["Billing"]
            CheckSub[check-subscription]
            CreateCheckout[create-checkout-session]
            StripePortal[stripe-customer-portal]
        end
    end
    
    subgraph External["External Services"]
        Resend[Resend Email]
        SignalWireExt[SignalWire - Voice and SMS]
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
