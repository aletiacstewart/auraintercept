import { useState } from 'react';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { MermaidDiagram } from '@/components/architecture/MermaidDiagram';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';

const diagrams = {
  overview: {
    title: 'Platform Architecture Overview',
    description: 'High-level view of all platform entry points and modules',
    chart: `flowchart TB
    subgraph Public["🌐 Public Access"]
        Landing[Landing Page]
        PublicChat[Public Chat Widget]
    end
    
    subgraph CustomerPortal["👤 Customer Portal"]
        CustAuth[Customer Auth]
        CustDash[Customer Dashboard]
        CustChat[AI Chat Interface]
        CustAppts[My Appointments]
    end
    
    subgraph MainDashboard["🏢 Main Dashboard"]
        Auth[Authentication]
        
        subgraph AdminViews["Admin Views"]
            PlatformAdmin[Platform Admin]
            CompanyAdmin[Company Admin]
        end
        
        subgraph Modules["Core Modules"]
            Appointments[Appointments]
            Customers[Customers]
            Employees[Employees]
            Inventory[Inventory]
            Invoices[Invoices]
            Quotes[Quotes]
            Campaigns[Campaigns]
            Analytics[Analytics]
            KnowledgeBase[Knowledge Base]
            Settings[Settings]
        end
        
        subgraph AIHub["🤖 AI Agents Hub"]
            AIConsole[AI Agent Console]
            AgentSettings[Agent Settings]
            AgentTest[Agent Testing]
        end
    end
    
    subgraph TechPortal["🔧 Technician Portal"]
        TechDash[Technician Dashboard]
        TechJobs[Job Queue]
        TechCalendar[Calendar]
        TechAI[Field Ops AI]
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
    
    RoleCheck -->|platform_admin| PA[Platform Admin Dashboard]
    RoleCheck -->|company_admin| CA[Company Admin Dashboard]
    RoleCheck -->|employee| EmpCheck{Job Type?}
    RoleCheck -->|customer| Cust[Customer Portal]
    
    EmpCheck -->|technician| Tech[Technician Portal]
    EmpCheck -->|office| Emp[Employee Dashboard]
    
    PA --> AllCompanies[Manage All Companies]
    PA --> PlatformAnalytics[Platform Analytics]
    PA --> SystemSettings[System Settings]
    
    CA --> CompanySettings[Company Settings]
    CA --> ManageEmployees[Manage Employees]
    CA --> AIAgents[AI Agents Hub]
    CA --> Reports[Reports & Analytics]
    
    Tech --> JobQueue[Job Queue]
    Tech --> TechCalendar[Calendar]
    Tech --> FieldOpsAI[Field Ops AI]
    
    Cust --> MyAppts[My Appointments]
    Cust --> CustAI[Customer AI Chat]`
  },
  agents: {
    title: 'Multi-Agent Orchestration System',
    description: 'AI agent types and orchestration flow',
    chart: `flowchart TB
    subgraph Entry["Customer Entry Points"]
        Widget[Chat Widget]
        Console[AI Console]
        Voice[Voice Call]
        SMS[SMS]
    end
    
    subgraph Orchestrator["🎯 AI Orchestrator"]
        Router[Message Router]
        Context[Context Manager]
        Handoff[Handoff Controller]
    end
    
    subgraph Agents["🤖 Specialized Agents"]
        subgraph Phase1["Customer Engagement"]
            Triage[AI Receptionist]
            Booking[Scheduling Agent]
            Support[Support Agent]
        end
        
        subgraph Phase2["Field Operations"]
            Dispatch[Dispatch Agent]
            FieldOps[Field Ops Agent]
            Quality[Quality Agent]
        end
        
        subgraph Phase3["Business Ops"]
            Billing[Billing Agent]
            BizOps[Business Ops Agent]
            Inventory[Inventory Agent]
        end
        
        subgraph Phase4["Marketing"]
            Marketing[Marketing Agent]
            Retention[Retention Agent]
            Feedback[Feedback Agent]
        end
        
        subgraph Phase5["Analytics"]
            AnalyticsAgent[Analytics Agent]
            Reporting[Reporting Agent]
            Forecast[Forecast Agent]
        end
    end
    
    Entry --> Router
    Router --> Context
    Context --> Triage
    Triage --> Handoff
    Handoff --> Booking
    Handoff --> Support
    Handoff --> Dispatch
    Handoff --> Billing
    Handoff --> Marketing
    Handoff --> AnalyticsAgent`
  },
  handoff: {
    title: 'Agent Handoff Flow',
    description: 'How agents collaborate and hand off conversations',
    chart: `sequenceDiagram
    participant C as Customer
    participant T as AI Receptionist
    participant B as Scheduling Agent
    participant D as Dispatch Agent
    participant N as Notification System
    
    C->>T: "I need someone to fix my AC"
    T->>T: Analyze intent
    T->>B: Handoff with context
    B->>C: "I can help schedule that. When works for you?"
    C->>B: "Tomorrow at 2pm"
    B->>B: Check availability
    B->>C: "Confirmed for tomorrow 2pm"
    B->>D: Handoff for assignment
    D->>D: Find available technician
    D->>N: Trigger notifications
    N->>C: Email/SMS confirmation`
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
  consoles: {
    title: 'AI Console Types & Components',
    description: 'Different AI console implementations',
    chart: `flowchart TB
    subgraph Consoles["AI Agent Consoles"]
        AIAgent[AIAgentConsole<br/>Customer Engagement]
        Booking[BookingAgentConsole<br/>Appointment Management]
        FieldOps[FieldOpsAgentConsole<br/>Technician Support]
        Billing[BillingAgentConsole<br/>Financial Operations]
        BizOps[BusinessOpsAgentConsole<br/>Business & Accounting]
        Marketing[MarketingSalesAgentConsole<br/>Marketing & Sales]
        Analytics[AnalyticsAgentConsole<br/>Analytics & Optimization]
    end
    
    subgraph SharedUI["Shared UI Components"]
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
    
    Consoles --> SharedUI
    Consoles --> Hooks
    Hooks --> Backend`
  },
  journey: {
    title: 'Customer Journey Flow',
    description: 'End-to-end customer experience',
    chart: `journey
    title Customer Journey
    section Discovery
      Visit website: 5: Customer
      Explore services: 4: Customer
      Start chat: 5: Customer
    section Booking
      Describe need: 5: Customer, Triage
      Get quote: 4: Customer, Billing
      Schedule appointment: 5: Customer, Booking
      Receive confirmation: 5: Customer, System
    section Service Day
      Get reminder: 5: System
      Tech assigned: 4: Dispatch
      Tech en route: 5: Customer, Tech
      Service completed: 5: Tech
    section Post-Service
      Receive invoice: 4: Billing
      Make payment: 5: Customer
      Leave review: 4: Customer, Feedback
      Get follow-up: 5: Marketing`
  },
  edgeFunctions: {
    title: 'Edge Functions Architecture',
    description: 'Backend serverless functions',
    chart: `flowchart LR
    subgraph Frontend["Frontend"]
        App[React App]
        Widget[Chat Widget]
    end
    
    subgraph EdgeFunctions["Supabase Edge Functions"]
        subgraph AI["AI Functions"]
            AIChat[ai-agent-chat]
            AIOrch[ai-orchestrator]
            AIAgent[ai-agent]
        end
        
        subgraph Comms["Communication"]
            SendEmail[send-appointment-email]
            SendSMS[send-appointment-sms]
            Reminders[appointment-reminders]
        end
        
        subgraph Integrations["Integrations"]
            Stripe[create-checkout]
            GoogleCal[google-calendar-sync]
            Twilio[voice-handler]
        end
        
        subgraph Voice["Voice AI"]
            ElevenLabs[elevenlabs-tts]
            VoiceClone[elevenlabs-clone-voice]
        end
        
        subgraph WidgetAPI["Widget"]
            WidgetAPI2[widget-api]
            ChatWidget[chat-widget]
        end
    end
    
    subgraph External["External Services"]
        Resend[Resend Email]
        TwilioExt[Twilio]
        StripeExt[Stripe]
        ElevenLabsExt[ElevenLabs]
        GoogleExt[Google Calendar]
    end
    
    Frontend --> EdgeFunctions
    EdgeFunctions --> External`
  }
};

export default function Architecture() {
  const [activeTab, setActiveTab] = useState('overview');

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Architecture Documentation</h1>
          <p className="text-muted-foreground mt-2">
            Interactive platform flowcharts with download functionality
          </p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <ScrollArea className="w-full">
            <TabsList className="inline-flex w-max mb-4">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="roles">Roles & Access</TabsTrigger>
              <TabsTrigger value="agents">AI Agents</TabsTrigger>
              <TabsTrigger value="handoff">Agent Handoffs</TabsTrigger>
              <TabsTrigger value="database">Database</TabsTrigger>
              <TabsTrigger value="consoles">AI Consoles</TabsTrigger>
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
    </DashboardLayout>
  );
}
