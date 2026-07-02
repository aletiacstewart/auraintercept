import { type TutorialStep } from '@/hooks/useTutorial';

// ─── SHARED STEPS (all roles/plans) ───────────────────────────────────────────

const sharedWelcome: TutorialStep[] = [
  {
    id: 'welcome',
    title: 'Welcome to Aura Intercept',
    description: 'This tutorial walks you through every section of the platform. Your 10 consolidated AI Operatives, consoles, and integrations work together to automate your business 24/7.',
    tip: 'Your progress is saved — pause and resume anytime. Click Next to move forward at your own pace.',
    targetSelector: '[data-tour-id="sidebar-logo"]',
    route: '/dashboard',
    position: 'right',
  },
  {
    id: 'dashboard-overview',
    title: 'Dashboard — Your Command Center',
    description: 'The dashboard shows key metrics, upcoming appointments, AI Operative activity, and a real-time feed of everything happening in your business at a glance.',
    tip: 'The dashboard adapts based on your subscription tier and role. Higher tiers unlock more panels and AI analytics.',
    targetSelector: '[data-tour-id="main-content"]',
    route: '/dashboard',
    position: 'bottom',
  },
];

// ─── COMPANY ADMIN & PLATFORM ADMIN STEPS ──────────────────────────────────

const adminSteps: TutorialStep[] = [
  // Overview
  {
    id: 'quick-setup',
    title: 'Quick Setup',
    description: 'Your first stop after signing up. Configure your company profile, business hours, service types, employee info, and branding. Everything here powers how your AI Operatives respond to customers.',
    tryIt: 'Click Quick Setup to configure your company before going live.',
    targetSelector: '[data-tour-id="nav-quick-setup"]',
    route: '/dashboard',
    position: 'right',
  },

  // Customer Console
  {
    id: 'customer-portal',
    title: 'Customer Portal Console',
    description: 'The live AI console your team uses to monitor customer interactions. See AI chat conversations, appointment bookings, and customer messages in real-time. The Customer Engagement Operative manages all customer-facing interactions.',
    tip: 'Customers get a free mobile-friendly portal with AI chat, appointment tracking, and direct contact links.',
    targetSelector: '[data-tour-id="nav-customer-portal"]',
    route: '/dashboard',
    position: 'right',
  },
  {
    id: 'customer-website-app',
    title: 'Customer Website App',
    description: 'Embed a branded AI chat widget on your website. Customers can book appointments, request quotes, and chat with your AI receptionist 24/7 — directly from your site.',
    tip: 'Copy the embed code from this page and paste it into your website\'s HTML.',
    targetSelector: '[data-tour-id="nav-customer-website-app"]',
    route: '/dashboard',
    position: 'right',
  },
  {
    id: 'customer-portal-install',
    title: 'Customer Portal App Install',
    description: 'Guide your customers through installing the Aura customer portal as a Progressive Web App (PWA) on their phone — giving them a native-app-like experience for tracking and booking.',
    targetSelector: '[data-tour-id="nav-customer-portal-install"]',
    route: '/dashboard',
    position: 'right',
  },

  // Business Management
  {
    id: 'business-mgt',
    title: 'Business Management Console',
    description: 'Your central hub for daily operations. The Business Finance Operative handles quotes, invoices, and inventory. The Admin Operative manages appointments, team members, leads, and customer profiles. Includes the Aura Live real-time activity feed.',
    tryIt: 'Open Business Management to see the live activity feed and all operational modules.',
    targetSelector: '[data-tour-id="nav-business-mgt-ops"]',
    route: '/dashboard',
    position: 'right',
  },
  {
    id: 'business-mgt-install',
    title: 'Business Mgt App Install',
    description: 'Install the Business Management console as a PWA on your device for fast mobile access to operations, quotes, and customer records — no app store required.',
    targetSelector: '[data-tour-id="nav-business-mgt-install"]',
    route: '/dashboard',
    position: 'right',
  },
  {
    id: 'analytics-reports',
    title: 'Analytics & Reports Console',
    description: 'AI deep-dive analytics powered by the Analytics Intelligence Operative. Revenue trends, customer lifetime value, operative performance, conversion rates, and business forecasting — all generated automatically.',
    tip: 'Available on Performance and Command tiers. Upgrade to unlock predictive revenue and customer insights.',
    targetSelector: '[data-tour-id="nav-analytics-reports"]',
    route: '/dashboard',
    position: 'right',
  },

  // Marketing
  {
    id: 'marketing-sales',
    title: 'Outreach & Sales Console',
    description: 'Run SMS and email campaigns, win-back sequences, referral programs, and seasonal promos. The Outreach Operative manages campaigns, lead qualification, and customer segmentation in one unified console with Campaign, Leads, and Marketing tabs.',
    tip: 'Available on Growth tier and above. Build your customer list by syncing with your appointment history.',
    targetSelector: '[data-tour-id="nav-marketing-sales"]',
    route: '/dashboard',
    position: 'right',
  },

  // Social Media
  {
    id: 'social-media',
    title: 'Social Media Console',
    description: 'Generate AI content for Instagram, Facebook, LinkedIn, TikTok, GMB, and X. The Creative Content Operative creates platform-specific posts tailored to your brand voice. Use the Manual Bridge to copy content and post directly — no API approval needed.',
    tip: 'Available on Growth tier and above. Use Create Content for generation and My Posts to manage your drafts.',
    targetSelector: '[data-tour-id="nav-social-media"]',
    route: '/dashboard',
    position: 'right',
  },

  // Web Presence
  {
    id: 'web-presence',
    title: 'Web Presence Manager',
    description: 'Build and manage your company website with AI-generated pages, SEO optimization, blog management, and an embeddable customer chat widget — all without a developer. The Web Presence Operative handles content creation and updates.',
    tip: 'Available on Business tier and above. AI generates content using your company profile and knowledge base.',
    targetSelector: '[data-tour-id="nav-web-presence"]',
    route: '/dashboard',
    position: 'right',
  },

  // Field Ops
  {
    id: 'field-ops',
    title: 'Field Operations Console',
    description: 'The Field Navigation Operative powers this mobile-first console for your field team. Accept jobs, get directions, mark en-route, update ETAs, arrive, complete, and generate invoices — all in one workflow.',
    tip: 'Available on Field Ops tier and above. Technicians install this as a PWA for hands-free field operations.',
    targetSelector: '[data-tour-id="nav-field-ops"]',
    route: '/dashboard',
    position: 'right',
  },
  {
    id: 'field-ops-install',
    title: 'Technician Field Ops App Install',
    description: 'Guide technicians through installing the Field Ops mobile app as a PWA. They\'ll get job assignments, GPS navigation, check-in tools, quote/invoice generation, and customer info on their phone.',
    targetSelector: '[data-tour-id="nav-field-ops-install"]',
    route: '/dashboard',
    position: 'right',
  },
  {
    id: 'dispatch-ops',
    title: 'Dispatch-Field Ops Console',
    description: 'The Dispatch Operative handles smart AI dispatching — automatic technician assignment based on proximity, availability, skills, and workload. Includes a live map view, real-time job status, and ETA tracking for all active jobs.',
    tip: 'The Dispatch Operative automatically assigns the best-matched technician for each incoming job request.',
    targetSelector: '[data-tour-id="nav-dispatch-ops"]',
    route: '/dashboard',
    position: 'right',
  },
  {
    id: 'dispatch-ops-install',
    title: 'Dispatch Field Ops App Install',
    description: 'Install the Dispatch console as a PWA on your dispatcher\'s device for mobile dispatching, live map tracking, and job management from anywhere.',
    targetSelector: '[data-tour-id="nav-dispatch-ops-install"]',
    route: '/dashboard',
    position: 'right',
  },

  // Configuration
  {
    id: 'ai-operatives-hub',
    title: 'AI Operatives Hub',
    description: 'The nerve center of your AI workforce. Enable or disable any of the 24 AI Operatives, monitor their performance metrics, view real-time event logs, and fine-tune operative behavior from one central management interface.',
    tryIt: 'Open the Hub to see all 24 AI Operatives, their health status, and enable the ones you need.',
    targetSelector: '[data-tour-id="nav-ai-operatives"]',
    route: '/dashboard',
    position: 'right',
  },
  {
    id: 'knowledge-base',
    title: 'Knowledge Base',
    description: 'Train your AI Operatives with company-specific information. Upload FAQs, service details, pricing, policies, and common answers that operatives reference during every conversation.',
    tip: 'The more detailed your Knowledge Base, the more accurate and helpful your AI Operatives become. Start with your top 10 FAQs.',
    targetSelector: '[data-tour-id="nav-knowledge-base"]',
    route: '/dashboard',
    position: 'right',
  },
  {
    id: 'calculators',
    title: 'Cost Calculators',
    description: 'Estimate your monthly platform costs based on appointment volume, communication channels (SMS, email, voice), and average transaction values before you commit.',
    tip: 'Use the calculator to compare costs across tiers and find the right plan for your business size.',
    targetSelector: '[data-tour-id="nav-calculators"]',
    route: '/dashboard',
    position: 'right',
  },

  // Integrations
  {
    id: 'integrations-overview',
    title: '3rd Party Integrations Overview',
    description: 'Connect the external services that power your AI Operatives: voice (ElevenLabs), SMS & phone (SignalWire), email (Resend), calendar (Google), and AI research (Tavily). Social media posting uses the built-in Manual Bridge — no API setup required.',
    tryIt: 'Click 3rd Party Overview to see all available integrations and their current setup status.',
    targetSelector: '[data-tour-id="nav-integrations-overview"]',
    route: '/dashboard',
    position: 'right',
  },
  {
    id: 'voice-integration',
    title: 'Voice Agent — ElevenLabs',
    description: 'Connect ElevenLabs for natural, human-sounding AI voice conversations. Your AI Receptionist answers every incoming call with a chosen voice, 24/7 — no hold times.',
    tip: 'Choose from dozens of voice options or clone your own. The voice operative handles calls even when your office is closed.',
    targetSelector: '[data-tour-id="nav-voice-agent"]',
    route: '/dashboard',
    position: 'right',
  },
  {
    id: 'sms-integration',
    title: 'Voice & SMS — SignalWire',
    description: 'Set up phone numbers for inbound and outbound calling plus two-way SMS. Handles appointment confirmations, reminders, win-back messages, and emergency alerts.',
    tip: 'SignalWire provides the phone infrastructure. Get a local or toll-free number and configure call routing rules here.',
    targetSelector: '[data-tour-id="nav-voice-sms"]',
    route: '/dashboard',
    position: 'right',
  },
  {
    id: 'email-integration',
    title: 'Email — Resend',
    description: 'Configure transactional email for appointment confirmations, reminders, marketing campaigns, review requests, and follow-up sequences using Resend\'s reliable delivery.',
    tip: 'Use your own domain for best deliverability. Add your domain in Resend and paste the API key here.',
    targetSelector: '[data-tour-id="nav-email"]',
    route: '/dashboard',
    position: 'right',
  },
  {
    id: 'calendar-integration',
    title: 'Calendar — Google',
    description: 'Sync appointments bidirectionally with Google Calendar. New bookings automatically appear on your calendar, and events created in Google Calendar sync back to the platform.',
    tip: 'Use the same email address for your Aura account and Google Calendar for automatic sync detection.',
    targetSelector: '[data-tour-id="nav-calendar"]',
    route: '/dashboard',
    position: 'right',
  },
  {
    id: 'tavily-integration',
    title: 'AI Research — Tavily',
    description: 'Supercharge your AI Operatives with real-time web research. Tavily lets operatives find current information when generating blog posts, social content, and answering complex customer questions.',
    tip: 'Get a free Tavily API key at tavily.com. It significantly improves the quality of AI-generated content.',
    targetSelector: '[data-tour-id="nav-ai-research"]',
    route: '/dashboard',
    position: 'right',
  },

  // Help
  {
    id: 'help',
    title: 'Help & Support',
    description: 'Access platform documentation, step-by-step guides, and the AI Help Center. Use the Aura Assistant (floating button) for instant answers, or submit a bug report directly from the sidebar.',
    tip: 'The AI Help Center knows your current page and surfaces relevant tips automatically.',
    targetSelector: '[data-tour-id="nav-help"]',
    route: '/dashboard',
    position: 'right',
  },
];

// ─── PLATFORM ADMIN-ONLY STEPS ─────────────────────────────────────────────

const platformAdminSteps: TutorialStep[] = [
  {
    id: 'subscription-analytics',
    title: 'Subscription Analytics',
    description: 'Platform-wide revenue and subscription metrics. Track MRR, churn rate, tier distribution, trial conversions, and growth trends across all companies on the platform.',
    targetSelector: '[data-tour-id="nav-subscription-analytics"]',
    route: '/dashboard',
    position: 'right',
  },
  {
    id: 'platform-issues',
    title: 'Platform Issues',
    description: 'Monitor and manage bug reports submitted by company admins and employees across the platform. Triage, track status, and resolve issues from a centralized dashboard.',
    targetSelector: '[data-tour-id="nav-platform-issues"]',
    route: '/dashboard',
    position: 'right',
  },
  {
    id: 'platform-guides',
    title: 'Platform Guides',
    description: 'Comprehensive documentation for all subscription tiers and 24 AI Operatives. Manage and publish guide content that all users see in their Help section.',
    targetSelector: '[data-tour-id="nav-platform-guides"]',
    route: '/dashboard',
    position: 'right',
  },
  {
    id: 'ai-agent-demo',
    title: 'AI Agent Flow Demo',
    description: 'An animated 10-scene visualization of the Aura AI Operative network — perfect for client presentations and sales demos. Shows how all 10 Operatives route, hand off, and collaborate across every console.',
    tryIt: 'Click AI Agent Demo to launch the full-screen animated demo. Use Auto-Play for a hands-free walkthrough.',
    targetSelector: '[data-tour-id="nav-ai-agent-demo"]',
    route: '/dashboard',
    position: 'right',
  },
  {
    id: 'architecture',
    title: 'Platform Architecture',
    description: 'A technical diagram of the platform\'s AI Operative network, data flows, and integration points. Useful for technical discussions and understanding how operatives communicate.',
    targetSelector: '[data-tour-id="nav-architecture"]',
    route: '/dashboard',
    position: 'right',
  },
  {
    id: 'export-docs',
    title: 'Export Documentation',
    description: 'Generate and download all platform documentation PDFs — including tier comparisons, operative guides, integration instructions, and pricing sheets — for offline sharing.',
    tip: 'All exported PDFs are generated from the centralized documentation config to ensure they\'re always up to date.',
    targetSelector: '[data-tour-id="nav-export-docs"]',
    route: '/dashboard',
    position: 'right',
  },
];

// ─── EMPLOYEE-SPECIFIC STEPS ───────────────────────────────────────────────

const employeeSteps: TutorialStep[] = [
  {
    id: 'my-schedule',
    title: 'My Schedule',
    description: 'Your personal appointment calendar. View all upcoming jobs assigned to you, see customer details, and check service notes before each appointment.',
    tryIt: 'Check your schedule each morning to see your day\'s jobs and customer addresses.',
    targetSelector: '[data-tour-id="nav-my-schedule"]',
    route: '/dashboard',
    position: 'right',
  },
  {
    id: 'tech-ai-console',
    title: 'Field Operations Console',
    description: 'Your AI field operations assistant. Accept jobs, get turn-by-turn directions, mark en-route, update your ETA, arrive and start jobs, then complete them and generate invoices — all in one streamlined workflow.',
    tip: 'The Field Navigation Operative is pre-trained with your company\'s service protocols so responses are accurate and on-brand.',
    targetSelector: '[data-tour-id="nav-tech-ai-console"]',
    route: '/dashboard',
    position: 'right',
  },
  {
    id: 'my-jobs',
    title: 'My Jobs',
    description: 'A full list of all jobs assigned to you — past, present, and upcoming. See job status, customer info, notes, and complete jobs directly from this page.',
    tryIt: 'Open My Jobs to see your current workload and mark completed jobs.',
    targetSelector: '[data-tour-id="nav-my-jobs"]',
    route: '/dashboard',
    position: 'right',
  },
  {
    id: 'tech-calendar',
    title: 'Calendar',
    description: 'A calendar view of all your assigned appointments. Get a weekly or monthly overview of your schedule and quickly navigate to specific job details.',
    targetSelector: '[data-tour-id="nav-tech-calendar"]',
    route: '/dashboard',
    position: 'right',
  },
  {
    id: 'job-history',
    title: 'Job History',
    description: 'A complete log of all jobs you\'ve completed. Review past customer interactions, service notes, and outcomes for reference or re-scheduling.',
    targetSelector: '[data-tour-id="nav-job-history"]',
    route: '/dashboard',
    position: 'right',
  },
  {
    id: 'availability',
    title: 'Availability',
    description: 'Set your weekly availability so the AI Dispatch Operative only assigns jobs when you\'re actually working. Keep this updated to prevent scheduling conflicts.',
    tip: 'Updating your availability helps the AI assign jobs more accurately and improves your team\'s overall scheduling efficiency.',
    targetSelector: '[data-tour-id="nav-availability"]',
    route: '/dashboard',
    position: 'right',
  },
  {
    id: 'tech-profile',
    title: 'My Profile',
    description: 'Update your personal information, contact details, service skills, and notification preferences. Your profile helps the Dispatch Operative match you to the right jobs.',
    targetSelector: '[data-tour-id="nav-tech-profile"]',
    route: '/dashboard',
    position: 'right',
  },
  {
    id: 'tech-install',
    title: 'Install the App',
    description: 'Install Aura as a Progressive Web App on your phone for fast access to your jobs, schedule, and Field Ops console. Works like a native app — no app store needed.',
    tryIt: 'Follow the install instructions on this page to add Aura to your home screen.',
    targetSelector: '[data-tour-id="nav-tech-install"]',
    route: '/dashboard',
    position: 'right',
  },
];

// ─── COMPLETION ────────────────────────────────────────────────────────────

const completionStep: TutorialStep[] = [
  {
    id: 'tutorial-complete',
    title: 'Tutorial Complete! 🎉',
    description: 'You\'ve explored all sections of Aura Intercept. Your 24 AI Operatives are ready to start automating your business. Start with Quick Setup, then connect your integrations to go live.',
    tip: 'Use the floating Aura button (bottom-right) anytime to get AI help on the page you\'re viewing.',
    targetSelector: '[data-tour-id="sidebar-logo"]',
    route: '/dashboard',
    position: 'right',
  },
];

// ─── EXPORTS ───────────────────────────────────────────────────────────────

/** Steps for Company Admin and Platform Admin */
export const dashboardTutorialSteps: TutorialStep[] = [
  ...sharedWelcome,
  ...adminSteps,
  ...completionStep,
];

/** Steps for Platform Admin (adds platform-only items after admin steps) */
export const platformAdminTutorialSteps: TutorialStep[] = [
  ...sharedWelcome,
  ...adminSteps,
  ...platformAdminSteps,
  ...completionStep,
];

/** Steps for Employee role */
export const employeeTutorialSteps: TutorialStep[] = [
  ...sharedWelcome,
  ...employeeSteps,
  ...completionStep,
];
