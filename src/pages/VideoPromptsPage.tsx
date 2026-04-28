import { useState } from 'react';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { PageContainer } from '@/components/ui/page-container';
import { PageHeader } from '@/components/ui/page-header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Copy, Check, Video, Info, Clapperboard, Film, Mic, ImageIcon } from 'lucide-react';
import { toast } from 'sonner';

interface Clip {
  num: number;
  name: string;
  prompt: string;
  audioScript: string;
  imagePrompt: string;
}

interface Section {
  title: string;
  color: string;
  borderColor: string;
  bgColor: string;
  clips: Clip[];
}

const sections: Section[] = [
  {
    title: 'Platform Intro',
    color: 'text-blue-400',
    borderColor: 'border-blue-500/30',
    bgColor: 'bg-blue-500/10',
    clips: [
      {
        num: 1,
        name: 'Platform Intro',
        prompt: 'Cinematic dark tech interface materializing from particles of light. A glowing neural network forms the words "AURA INTERCEPT" in bold futuristic typography. Holographic rings orbit the logo as data streams flow outward in all directions. Deep blue and electric cyan color palette. Premium SaaS product reveal. 4K, cinematic lighting, shallow depth of field.',
        audioScript: 'Meet Aura Intercept — the AI operating system built for modern business. Seven intelligent consoles. Twenty-four dedicated operatives. One unified platform.',
        imagePrompt: 'Premium dark-background brand poster. Glowing "AURA INTERCEPT" logo in bold futuristic sans-serif with electric cyan and deep blue gradient. Neural network rings orbiting the logo. Data streams radiating outward. Tagline "Your AI Operating System" in white below. Ultra-sharp 4K product branding, no clutter.',
      },
    ],
  },
  {
    title: 'Console 1: Customer Portal',
    color: 'text-blue-400',
    borderColor: 'border-blue-500/30',
    bgColor: 'bg-blue-500/10',
    clips: [
      {
        num: 2,
        name: 'Customer Portal Console',
        prompt: 'Sleek holographic command center with a glowing blue interface. A 3D chat bubble and phone icon pulse at the center. Customer messages stream in from the left while AI responses flow out to the right in real-time. Digital waves represent voice calls being answered instantly. Blue neon glow, dark background, futuristic customer service hub. 4K cinematic.',
        audioScript: 'The Customer Portal Console handles every customer touchpoint — calls, chats, bookings, and reviews — with zero manual effort.',
        imagePrompt: 'Holographic dark UI mockup of the Aura Intercept Customer Portal console. Blue glowing chat bubbles and phone icons. Real-time message stream panels. "Customer Portal" label badge. Futuristic SaaS dashboard screenshot style.',
      },
      {
        num: 3,
        name: 'Triage Agent',
        prompt: 'A glowing AI avatar behind a futuristic reception desk, answering multiple holographic phone lines simultaneously. Caller profiles appear as floating cards that get instantly categorized and routed. Streams of text and voice waveforms flow through the avatar. Blue accent lighting, dark tech environment. 4K, smooth motion.',
        audioScript: 'The Triage Agent is your AI receptionist — routing, sorting, and responding to every inbound inquiry the moment it arrives.',
        imagePrompt: 'AI receptionist avatar at a futuristic reception desk. Multiple holographic incoming call cards floating around it. Blue accent lighting, dark background. "TRIAGE AGENT" label overlaid in clean UI font. Aura Intercept branding watermark.',
      },
      {
        num: 4,
        name: 'Booking Agent',
        prompt: 'A holographic calendar floating in 3D space. Time slots light up and fill automatically as appointment requests fly in as glowing orbs. The AI agent icon stamps each booking with a confirmation checkmark. Calendar syncs ripple outward like digital waves. Blue-green glow, premium tech aesthetic. 4K cinematic.',
        audioScript: 'The Booking Agent fills your calendar automatically — no back-and-forth, no missed appointments, just seamless scheduling.',
        imagePrompt: '3D holographic calendar with glowing blue appointment slots. AI agent icon confirming bookings with checkmarks. Floating confirmation cards. "BOOKING AGENT — Aura Intercept" badge overlay. Clean dark tech aesthetic.',
      },
      {
        num: 5,
        name: 'Follow-Up Agent',
        prompt: 'Streams of glowing SMS messages and emails launching from a central AI node outward to customer icons arranged in a circle. Each message trail leaves a soft light trail. Notification badges pulse as responses come back. Automated follow-up sequences visualized as flowing light paths. Warm blue tones, dark background. 4K.',
        audioScript: 'The Follow-Up Agent keeps every customer engaged — sending the right message at exactly the right moment, automatically.',
        imagePrompt: 'Circular layout of customer icons receiving glowing message streams from a central AI node. SMS and email symbols as light trails. "FOLLOW-UP AGENT" overlay text. Blue tones, dark background, Aura Intercept branding.',
      },
      {
        num: 6,
        name: 'Review Agent',
        prompt: 'Five-star ratings materializing as golden holographic stars above satisfied customer silhouettes. Review request messages fly out from a central AI hub. Positive reviews aggregate into a rising reputation score meter. Gold and blue color palette, premium dark tech environment. 4K cinematic motion.',
        audioScript: 'The Review Agent turns happy customers into five-star advocates — requesting reviews at the perfect moment to build your reputation.',
        imagePrompt: 'Holographic five-star rating visualization with golden stars above customer silhouettes. Rising reputation score meter on the right. "REVIEW AGENT — Aura Intercept" text overlay. Gold and blue on dark premium background.',
      },
    ],
  },
  {
    title: 'Console 2: Field Operations',
    color: 'text-green-400',
    borderColor: 'border-green-500/30',
    bgColor: 'bg-green-500/10',
    clips: [
      {
        num: 7,
        name: 'Field Operations Console',
        prompt: 'Aerial view of a city transforming into a holographic 3D map with glowing green route lines connecting job sites. Technician icons pulse at different locations. A dispatch board overlays the map with live status updates scrolling. Green neon accents on dark background, military-grade command center aesthetic. 4K cinematic.',
        audioScript: 'The Field Operations Console gives you real-time command of every technician, every job, and every route — all from one screen.',
        imagePrompt: 'Holographic city map with green glowing route lines connecting job site pins. Technician avatar icons positioned across the map. "FIELD OPERATIONS CONSOLE — Aura Intercept" label. Dark background, military command center aesthetic.',
      },
      {
        num: 8,
        name: 'Dispatch Agent',
        prompt: 'A tactical command screen showing technician avatars being assigned to job pins on a holographic city map. Assignment lines connect dispatchers to field workers with satisfying snap animations. Job cards slide into place with priority indicators. Green and white on dark background, real-time operations feel. 4K.',
        audioScript: 'The Dispatch Agent assigns the right technician to every job — instantly, intelligently, with no manual coordination required.',
        imagePrompt: 'Tactical dispatch board UI with technician avatars being assigned to job cards via animated green lines. Priority badges on each card. "DISPATCH AGENT" label. Dark green-and-white tech dashboard style.',
      },
      {
        num: 9,
        name: 'Route Agent',
        prompt: 'A 3D holographic city map with multiple glowing route paths being calculated simultaneously. Routes optimize in real-time, shifting and rerouting as traffic data flows in. Distance and time indicators float above each path. GPS precision visualization. Green neon lines on dark map. 4K cinematic aerial view.',
        audioScript: 'The Route Agent calculates the most efficient path for every job — saving time, fuel, and frustration with every dispatch.',
        imagePrompt: 'Aerial view 3D city map with multiple optimized green neon route paths. Distance and ETA labels floating above paths. "ROUTE AGENT — Aura Intercept" overlay. Clean GPS visualization aesthetic, dark background.',
      },
      {
        num: 10,
        name: 'ETA Agent',
        prompt: 'A countdown timer hologram connected to a moving technician dot on a route map. The ETA updates dynamically as the dot progresses. Customer notification bubbles appear showing live arrival updates. Time crystals shatter and reform with each recalculation. Green and cyan accents, dark tech background. 4K.',
        audioScript: 'The ETA Agent keeps customers informed with live arrival updates — so no one is left wondering when their technician will arrive.',
        imagePrompt: 'Holographic countdown timer panel connected to a moving technician dot on a route map. Customer notification bubble showing "12 min away". "ETA AGENT" label. Green and cyan on dark background, precision tech feel.',
      },
      {
        num: 11,
        name: 'Check-In Agent',
        prompt: 'A technician silhouette arriving at a job site, triggering a holographic check-in confirmation. Before and after photo frames materialize. Job notes type themselves into floating cards. Completion status transforms from "In Progress" to "Complete" with a satisfying glow effect. Green accent on dark background. 4K.',
        audioScript: 'The Check-In Agent confirms job arrivals and completions automatically — creating a full digital paper trail for every site visit.',
        imagePrompt: 'Technician silhouette at a job site with a holographic check-in confirmation overlay. Before/after photo frames. Status badge changing from "In Progress" to "Complete". "CHECK-IN AGENT — Aura Intercept" label. Green on dark background.',
      },
    ],
  },
  {
    title: 'Console 3: Business Operations',
    color: 'text-purple-400',
    borderColor: 'border-purple-500/30',
    bgColor: 'bg-purple-500/10',
    clips: [
      {
        num: 12,
        name: 'Business Operations Console',
        prompt: 'A premium executive dashboard materializing with multiple floating panels showing quotes, invoices, inventory levels, and employee metrics. Data flows between panels like liquid light. Charts and graphs animate upward. Purple and violet holographic interface on dark background, enterprise command center. 4K cinematic.',
        audioScript: 'The Business Operations Console manages your quotes, invoices, inventory, and admin — all automated, all intelligent.',
        imagePrompt: 'Executive dark UI dashboard with multiple floating panels: quotes, invoices, inventory, and employee metrics. Purple holographic interface. "BUSINESS OPERATIONS CONSOLE — Aura Intercept" header. Premium enterprise aesthetic.',
      },
      {
        num: 13,
        name: 'Admin Agent',
        prompt: 'A central AI brain node connected to orbiting management panels: employees, companies, settings, and permissions. Each panel pulses with real-time data. Toggle switches flip automatically as the AI configures operations. Purple glow with organizational chart overlay. Dark premium background. 4K.',
        audioScript: 'The Admin Agent manages your users, companies, and settings — keeping your platform perfectly configured without IT overhead.',
        imagePrompt: 'Central AI brain node with orbiting management panels: Employees, Companies, Permissions, Settings. Purple glow organizational chart overlay. "ADMIN AGENT — Aura Intercept" label. Dark premium background.',
      },
      {
        num: 14,
        name: 'Quoting Agent',
        prompt: 'A blank document transforming into a detailed professional quote with line items, pricing, and terms populating themselves automatically. The quote assembles piece by piece with satisfying snap animations. A "Send Quote" button pulses and fires the document to a customer icon. Purple and gold accents. 4K cinematic.',
        audioScript: 'The Quoting Agent generates professional quotes in seconds — accurate, branded, and ready to send the moment a job is scoped.',
        imagePrompt: 'Professional quote document assembling itself with line items, pricing, and signature line. "Send Quote" CTA button glowing. "QUOTING AGENT — Aura Intercept" overlay. Purple and gold on dark background.',
      },
      {
        num: 15,
        name: 'Invoice Agent',
        prompt: 'Professional invoices generating automatically from completed job cards. Payment links materialize and fly to customer devices. A payment received notification triggers a cascade of green checkmarks. Revenue counter ticks upward. Purple and green on dark background, financial precision aesthetic. 4K.',
        audioScript: 'The Invoice Agent turns completed jobs into payment requests automatically — so revenue flows without chasing a single payment.',
        imagePrompt: 'Invoice document with payment link QR code materializing. Green checkmarks cascading as payment is received. Revenue counter ticking up. "INVOICE AGENT — Aura Intercept" label. Purple and green on dark background.',
      },
      {
        num: 16,
        name: 'Inventory Agent',
        prompt: 'A 3D warehouse visualization with holographic shelves. Stock levels displayed as glowing bar meters. Low-stock items flash amber warnings. Reorder notifications launch automatically. Parts and materials tracked with floating quantity badges. Purple and amber accents on dark background, logistics precision. 4K cinematic.',
        audioScript: 'The Inventory Agent tracks every part and material in real time — alerting your team the moment stock runs low.',
        imagePrompt: '3D holographic warehouse shelves with glowing stock level meters. Low-stock amber warning indicators. Parts tracked with floating quantity badges. "INVENTORY AGENT — Aura Intercept" label. Purple and amber on dark background.',
      },
    ],
  },
  {
    title: 'Console 4: Outreach & Sales Ops',
    color: 'text-orange-400',
    borderColor: 'border-orange-500/30',
    bgColor: 'bg-orange-500/10',
    clips: [
      {
        num: 17,
        name: 'Outreach & Sales Console',
        prompt: 'A marketing war room with holographic campaign dashboards, lead funnels visualized as 3D pipelines, and audience segments displayed as clustered light particles. Conversion metrics pulse in real-time. Campaign launches visualized as energy waves. Orange and amber glow on dark background, sales intelligence center. 4K.',
        audioScript: 'The Outreach and Sales Console arms your team with campaigns, leads, and audience intelligence — turning prospects into loyal customers.',
        imagePrompt: 'Marketing war room dark UI with holographic campaign dashboards, 3D lead funnel pipelines, and audience segment clusters. "OUTREACH & SALES CONSOLE — Aura Intercept" header. Orange and amber on dark background.',
      },
      {
        num: 18,
        name: 'Campaign Agent',
        prompt: 'Multiple marketing campaigns visualized as orbiting satellites around a central brand hub. Each campaign shows reach metrics, engagement sparks, and conversion funnels. A new campaign launches with a burst of energy, deploying across email, SMS, and social channels simultaneously. Orange neon on dark background. 4K cinematic.',
        audioScript: 'The Campaign Agent launches multi-channel marketing campaigns across email, SMS, and social — all from a single command.',
        imagePrompt: 'Multiple campaign satellites orbiting a central brand hub with reach and conversion metrics. Campaign launch energy burst. "CAMPAIGN AGENT — Aura Intercept" overlay. Orange neon on dark background.',
      },
      {
        num: 19,
        name: 'Lead Agent',
        prompt: 'Raw leads entering a holographic funnel from multiple sources — web forms, calls, social media. The AI scores each lead with a glowing temperature gauge from cold blue to hot red. Qualified leads route automatically to sales pipelines. Lead cards sort and prioritize themselves. Orange and red accents on dark. 4K.',
        audioScript: 'The Lead Agent scores and qualifies every inbound lead automatically — so your team only talks to the prospects most likely to convert.',
        imagePrompt: 'Holographic lead funnel with leads entering from web, calls, and social media icons. AI temperature gauge scoring each lead. "LEAD AGENT — Aura Intercept" label. Orange and red accents on dark background.',
      },
      {
        num: 20,
        name: 'Marketing Agent',
        prompt: 'Customer segments forming as clusters of light particles that group by behavior, demographics, and engagement. The AI draws targeting crosshairs around high-value segments. Personalized message templates generate for each group. Data-driven audience intelligence visualization. Orange and white on dark background. 4K cinematic.',
        audioScript: 'The Marketing Agent segments your audience and personalizes outreach — delivering the right message to the right person every time.',
        imagePrompt: 'Audience segment clusters of light particles grouped by behavior and demographics. AI targeting crosshairs on high-value segments. Personalized message templates. "MARKETING AGENT — Aura Intercept" label. Orange and white on dark background.',
      },
    ],
  },
  {
    title: 'Console 5: Social Media Ops',
    color: 'text-pink-400',
    borderColor: 'border-pink-500/30',
    bgColor: 'bg-pink-500/10',
    clips: [
      {
        num: 21,
        name: 'Social Media Console',
        prompt: 'A social media command center with 6 platform icons (Facebook, Instagram, X, LinkedIn, TikTok, YouTube) orbiting a central content hub. Posts schedule themselves on a visual calendar. Engagement metrics flow inward as animated data streams. Pink and magenta holographic interface on dark background. 4K cinematic.',
        audioScript: 'The Social Media Console manages content, scheduling, and analytics across every major platform — from one intelligent command center.',
        imagePrompt: 'Social media command center with 6 platform icons orbiting a content hub. Visual post calendar with scheduled items. "SOCIAL MEDIA CONSOLE — Aura Intercept" header. Pink and magenta holographic interface, dark background.',
      },
      {
        num: 22,
        name: 'Creative Content Agent',
        prompt: 'AI generating social media posts in real-time: text writes itself, images compose automatically, hashtags materialize. Multiple post variants for different platforms fan out from a single content idea like cards being dealt. Creative sparks and writing animations. Pink and white on dark background. 4K.',
        audioScript: 'The Creative Content Agent generates platform-perfect posts for every channel — captions, hashtags, and visuals created in seconds.',
        imagePrompt: 'AI generating social post cards fanning out for Facebook, Instagram, X, LinkedIn, TikTok, YouTube simultaneously. Hashtags materializing. "SOCIAL CONTENT AGENT — Aura Intercept" label. Pink and white on dark background.',
      },
      {
        num: 23,
        name: 'Social Scheduler Agent',
        prompt: 'A holographic weekly calendar with time slots filling with scheduled posts across 6 social platforms. Posts slide into optimal time slots with satisfying click animations. A clock visualization shows best-posting-time intelligence. Queue management with drag-and-drop feel. Pink and cyan on dark background. 4K cinematic.',
        audioScript: 'The Social Scheduler Agent posts at the optimal time on every platform — so your content always reaches the largest possible audience.',
        imagePrompt: 'Holographic weekly calendar with post slots filling across 6 platform rows. Best-time indicators glowing on optimal slots. "SOCIAL SCHEDULER AGENT — Aura Intercept" label. Pink and cyan on dark background.',
      },
      {
        num: 24,
        name: 'Social Analytics Agent',
        prompt: 'Social media metrics exploding into view: engagement rates as rising bar charts, follower growth as climbing line graphs, viral content highlighted with pulse effects. Platform comparison dashboards side by side. Performance insights materialize as floating text cards. Pink and gold accents on dark background. 4K.',
        audioScript: 'The Social Analytics Agent tracks every metric that matters — from engagement and reach to follower growth and top-performing content.',
        imagePrompt: 'Social analytics dashboard with rising bar charts, follower growth lines, and viral content highlights. Platform comparison side by side. "SOCIAL ANALYTICS AGENT — Aura Intercept" label. Pink and gold on dark background.',
      },
    ],
  },
  {
    title: 'Console 6: Creative & Web Presence',
    color: 'text-violet-400',
    borderColor: 'border-violet-500/30',
    bgColor: 'bg-violet-500/10',
    clips: [
      {
        num: 25,
        name: 'Creative & Web Presence Console',
        prompt: 'A creative studio merged with a web development environment. On one side, multi-channel content generates across blog, email, SMS, and social formats. On the other, a website builds itself with SEO scores rising. Content Engine and web builder unified in a violet holographic workspace. Dark background. 4K cinematic.',
        audioScript: 'The Creative and Web Presence Console builds your content and powers your digital footprint — all driven by AI, all on brand.',
        imagePrompt: 'Split dark UI showing content generator on the left (blog, email, SMS, social) and website builder on the right with rising SEO score. "CREATIVE & WEB PRESENCE CONSOLE — Aura Intercept" header. Violet on dark background.',
      },
      {
        num: 26,
        name: 'Creative Agent',
        prompt: 'A blank canvas transforming into multi-format content: blog posts, email templates, SMS messages, and social graphics generating simultaneously from a single AI prompt. Each format materializes in its own floating panel. Brand voice settings glow as guardrails. Violet and white creative energy on dark background. 4K.',
        audioScript: 'The Creative Agent generates blogs, emails, social content, and SMS messages simultaneously — maintaining your brand voice across every channel.',
        imagePrompt: 'Multi-format content panels materializing: blog post, email template, SMS bubble, social graphic. Brand voice guardrail glow around all panels. "CREATIVE AGENT — Aura Intercept" label. Violet and white on dark background.',
      },
      {
        num: 27,
        name: 'Web Presence Agent',
        prompt: 'A website wireframe assembling itself block by block with AI-optimized layouts. SEO score meters climb upward. Blog posts auto-publish with metadata tags floating into place. Site performance metrics pulse green. Mobile and desktop views toggle seamlessly. Violet and green accents on dark background. 4K cinematic.',
        audioScript: 'The Web Presence Agent builds and optimizes your digital footprint — publishing SEO-ready content that grows your visibility automatically.',
        imagePrompt: 'Website wireframe building itself block by block. SEO score meter rising to 98. Auto-publishing blog post with floating metadata tags. Mobile and desktop toggle views. "WEB PRESENCE AGENT — Aura Intercept" label. Violet and green on dark background.',
      },
    ],
  },
  {
    title: 'Console 7: Analytics & Reports',
    color: 'text-cyan-400',
    borderColor: 'border-cyan-500/30',
    bgColor: 'bg-cyan-500/10',
    clips: [
      {
        num: 28,
        name: 'Analytics & Reports Console',
        prompt: 'An executive intelligence center with 8 specialized dashboard panels materializing in a semicircle. KPI gauges, revenue charts, forecast projections, and export options all animate simultaneously. Data flows between panels like neural connections. Cyan and teal holographic interface on dark background. 4K cinematic.',
        audioScript: 'The Analytics and Reports Console delivers real-time intelligence across every area of your business — so decisions are always data-driven.',
        imagePrompt: 'Executive intelligence center with 8 dashboard panels in semicircle formation: KPIs, revenue, forecasts, performance. "ANALYTICS & REPORTS CONSOLE — Aura Intercept" header. Cyan and teal holographic interface, dark background.',
      },
      {
        num: 29,
        name: 'Insights Agent',
        prompt: 'Raw business data transforming into actionable insights: numbers morph into clear trend arrows, patterns highlight themselves, and AI-generated insight cards materialize with recommendations. A magnifying glass scans data and reveals hidden opportunities. Cyan and white on dark background. 4K cinematic.',
        audioScript: 'The Insights Agent transforms raw data into clear, actionable recommendations — surfacing the opportunities your business needs to act on.',
        imagePrompt: 'Raw data numbers morphing into trend arrows and insight cards with AI recommendations. Magnifying glass scanning data patterns. "INSIGHTS AGENT — Aura Intercept" label. Cyan and white on dark background.',
      },
      {
        num: 30,
        name: 'Performance Agent',
        prompt: 'KPI dashboards with real-time performance gauges: customer satisfaction, response times, job completion rates, and team efficiency all displayed as dynamic meter visualizations. Green indicators pulse for exceeding targets, amber for warnings. Cyan and green on dark background. 4K.',
        audioScript: 'The Performance Agent monitors every KPI in real time — flagging what\'s working, what needs attention, and what to optimize next.',
        imagePrompt: 'KPI gauge dashboard with customer satisfaction, response time, and completion rate meters. Green success indicators, amber warnings. "PERFORMANCE AGENT — Aura Intercept" label. Cyan and green on dark background.',
      },
      {
        num: 31,
        name: 'Revenue Agent',
        prompt: 'Revenue streams visualized as flowing rivers of golden light merging into a total revenue counter. Monthly recurring revenue charts build upward. Payment analytics show transaction patterns. Profit margins calculate in real-time with satisfying number animations. Cyan and gold on dark background. 4K cinematic.',
        audioScript: 'The Revenue Agent tracks every dollar flowing through your business — giving you complete financial clarity with zero manual reporting.',
        imagePrompt: 'Revenue streams as golden light rivers merging into a total MRR counter. Payment analytics chart. Profit margin calculator. "REVENUE AGENT — Aura Intercept" label. Cyan and gold on dark background.',
      },
      {
        num: 32,
        name: 'Forecast Agent',
        prompt: 'A timeline extending into the future with predictive data curves projecting forward. AI confidence bands glow around forecast lines. Seasonal patterns visualize as wave overlays. What-if scenarios branch like decision trees. Crystal ball aesthetic meets data science. Cyan and purple on dark background. 4K cinematic.',
        audioScript: 'The Forecast Agent projects your business trajectory — using AI to predict demand, revenue, and growth with confidence intervals.',
        imagePrompt: 'Future timeline with predictive curves, AI confidence band glows, seasonal wave overlays, and branching what-if scenarios. "FORECAST AGENT — Aura Intercept" label. Cyan and purple on dark background.',
      },
    ],
  },
  {
    title: 'AI Operatives Hub',
    color: 'text-indigo-400',
    borderColor: 'border-indigo-500/30',
    bgColor: 'bg-indigo-500/10',
    clips: [
      {
        num: 33,
        name: 'AI Operatives Hub',
        prompt: 'All 24 AI agent icons arranging themselves in a grand neural network formation. Connection lines pulse between agents showing real-time handoffs. A central command node monitors all agents simultaneously. Batch activation switches toggle with cascade effects. Indigo and white holographic command center on dark background. 4K cinematic.',
        audioScript: 'The AI Operatives Hub is mission control for all 24 agents — activate, monitor, and coordinate your entire AI workforce from one screen.',
        imagePrompt: 'Grand neural network of 24 AI agent icons connected with pulsing lines. Central command node monitoring all agents. Batch activation panel. "AI OPERATIVES HUB — Aura Intercept" label. Indigo and white holographic command center, dark background.',
      },
    ],
  },
  {
    title: 'Platform Finale',
    color: 'text-yellow-400',
    borderColor: 'border-yellow-500/30',
    bgColor: 'bg-yellow-500/10',
    clips: [
      {
        num: 34,
        name: 'Platform Finale',
        prompt: 'The full Aura Intercept neural network zooming out to reveal the complete 24-agent ecosystem connected across 7 consoles. The network pulses with activity as the tagline "Your AI Operating System" materializes in bold typography. The Aura Intercept logo locks in center frame with a final energy pulse. Deep blue, cyan, and gold premium palette. 4K cinematic.',
        audioScript: 'Aura Intercept. Seven consoles. Twenty-four agents. One platform. Your AI operating system is ready.',
        imagePrompt: 'Full Aura Intercept ecosystem zoomed out: all 7 console icons connected to 24 agent nodes in one unified glowing network. Tagline "Your AI Operating System" in large futuristic type. Aura Intercept logo centered with energy pulse ring. Deep blue, cyan, and gold premium brand poster. 4K.',
      },
    ],
  },
];

function ClipCard({ clip, sectionColor, sectionBorderColor }: { clip: Clip; sectionColor: string; sectionBorderColor: string }) {
  const [copiedTab, setCopiedTab] = useState<string | null>(null);
  const [copiedAll, setCopiedAll] = useState(false);

  const handleCopyTab = (type: 'video' | 'audio' | 'graphic') => {
    const text = type === 'video' ? clip.prompt : type === 'audio' ? clip.audioScript : clip.imagePrompt;
    navigator.clipboard.writeText(text);
    setCopiedTab(type);
    toast.success(`Clip ${clip.num} ${type} prompt copied!`);
    setTimeout(() => setCopiedTab(null), 2000);
  };

  const handleCopyAll = () => {
    const text = `=== CLIP ${clip.num}: ${clip.name} (8s) ===\nVIDEO: ${clip.prompt}\n\nAUDIO: ${clip.audioScript}\n\nGRAPHIC: ${clip.imagePrompt}`;
    navigator.clipboard.writeText(text);
    setCopiedAll(true);
    toast.success(`All assets for Clip ${clip.num} copied!`);
    setTimeout(() => setCopiedAll(false), 2000);
  };

  return (
    <Card className={`border ${sectionBorderColor}`}>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <Badge variant="outline" className={`shrink-0 font-mono text-xs ${sectionColor} border-current/40`}>
              #{clip.num}
            </Badge>
            <CardTitle className="text-sm font-semibold truncate">{clip.name}</CardTitle>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <Badge variant="secondary" className="text-xs">8s</Badge>
            <Button size="sm" variant="ghost" className="h-7 px-2 text-xs gap-1" onClick={handleCopyAll} title="Copy all assets">
              {copiedAll ? <Check className="h-3 w-3 text-green-600" /> : <Copy className="h-3 w-3" />}
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <Tabs defaultValue="video">
          <TabsList className="w-full mb-2">
            <TabsTrigger value="video" className="flex-1 gap-1 text-xs">
              <Film className="h-3 w-3" />
              Video
            </TabsTrigger>
            <TabsTrigger value="audio" className="flex-1 gap-1 text-xs">
              <Mic className="h-3 w-3" />
              Audio
            </TabsTrigger>
            <TabsTrigger value="graphic" className="flex-1 gap-1 text-xs">
              <ImageIcon className="h-3 w-3" />
              Graphic
            </TabsTrigger>
          </TabsList>
          <TabsContent value="video" className="mt-0">
            <div className="relative">
              <p className="text-xs text-foreground leading-relaxed pr-8">{clip.prompt}</p>
              <Button size="sm" variant="ghost" className="absolute top-0 right-0 h-6 w-6 p-0 text-muted-foreground hover:text-foreground" onClick={() => handleCopyTab('video')}>
                {copiedTab === 'video' ? <Check className="h-3 w-3 text-green-400" /> : <Copy className="h-3 w-3" />}
              </Button>
            </div>
          </TabsContent>
          <TabsContent value="audio" className="mt-0">
            <div className="relative">
              <p className="text-xs text-foreground leading-relaxed pr-8 italic">{clip.audioScript}</p>
              <Button size="sm" variant="ghost" className="absolute top-0 right-0 h-6 w-6 p-0 text-muted-foreground hover:text-foreground" onClick={() => handleCopyTab('audio')}>
                {copiedTab === 'audio' ? <Check className="h-3 w-3 text-green-400" /> : <Copy className="h-3 w-3" />}
              </Button>
            </div>
          </TabsContent>
          <TabsContent value="graphic" className="mt-0">
            <div className="relative">
              <p className="text-xs text-foreground leading-relaxed pr-8">{clip.imagePrompt}</p>
              <Button size="sm" variant="ghost" className="absolute top-0 right-0 h-6 w-6 p-0 text-muted-foreground hover:text-foreground" onClick={() => handleCopyTab('graphic')}>
                {copiedTab === 'graphic' ? <Check className="h-3 w-3 text-green-400" /> : <Copy className="h-3 w-3" />}
              </Button>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}

export default function VideoPromptsPage() {
  const [copiedAll, setCopiedAll] = useState(false);

  const handleCopyAll = () => {
    const allText = sections.flatMap(s =>
      s.clips.map(c =>
        `=== CLIP ${c.num}: ${c.name} (8s) ===\nVIDEO: ${c.prompt}\n\nAUDIO: ${c.audioScript}\n\nGRAPHIC: ${c.imagePrompt}`
      )
    ).join('\n\n---\n\n');
    navigator.clipboard.writeText(allText);
    setCopiedAll(true);
    toast.success('All 34 prompts (Video + Audio + Graphic) copied to clipboard!');
    setTimeout(() => setCopiedAll(false), 2000);
  };

  return (
    <DashboardLayout>
      <PageContainer>
        <PageHeader
          icon={Clapperboard}
          title="Promo Video Prompts"
          description="34 AI video generation prompts for Runway, Sora, Kling, and similar tools. Each clip includes a video prompt, 8-second audio script, and graphic image prompt."
        />

        <div className="space-y-6 pb-8">
          {/* Assembly Guide */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Info className="h-4 w-4 text-primary" />
                  <CardTitle className="text-sm text-foreground">Assembly Guide</CardTitle>
                </div>
                <Button size="sm" variant="outline" onClick={handleCopyAll} className="h-7 text-xs border-border/50 text-foreground hover:bg-white/10">
                  {copiedAll ? <Check className="mr-1 h-3 w-3 text-green-400" /> : <Copy className="mr-1 h-3 w-3" />}
                  Copy All 34 Prompts
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm mb-4">
                <div className="text-center p-3 rounded-lg bg-muted border border-border">
                  <p className="text-2xl font-bold">34</p>
                  <p className="text-xs text-muted-foreground">Total Clips</p>
                </div>
                <div className="text-center p-3 rounded-lg bg-muted border border-border">
                  <p className="text-2xl font-bold">4:32</p>
                  <p className="text-xs text-muted-foreground">Total Runtime</p>
                </div>
                <div className="text-center p-3 rounded-lg bg-muted border border-border">
                  <p className="text-2xl font-bold">0.5s</p>
                  <p className="text-xs text-muted-foreground">Dissolve (within console)</p>
                </div>
                <div className="text-center p-3 rounded-lg bg-muted border border-border">
                  <p className="text-2xl font-bold">1s</p>
                  <p className="text-xs text-muted-foreground">Glitch (between consoles)</p>
                </div>
              </div>
              <div className="flex flex-wrap gap-2 text-xs mb-3">
                {[
                  { label: 'Customer Portal', color: 'bg-blue-500/20 text-blue-300 border border-blue-500/30' },
                  { label: 'Field Operations', color: 'bg-green-500/20 text-green-300 border border-green-500/30' },
                  { label: 'Business Ops', color: 'bg-purple-500/20 text-purple-300 border border-purple-500/30' },
                  { label: 'Outreach & Sales', color: 'bg-orange-500/20 text-orange-300 border border-orange-500/30' },
                  { label: 'Social Media', color: 'bg-pink-500/20 text-pink-300 border border-pink-500/30' },
                  { label: 'Creative & Web', color: 'bg-violet-500/20 text-violet-300 border border-violet-500/30' },
                  { label: 'Analytics & Reports', color: 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30' },
                  { label: 'AI Operatives Hub', color: 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30' },
                ].map(item => (
                  <span key={item.label} className={`px-2 py-1 rounded-full font-medium ${item.color}`}>{item.label}</span>
                ))}
              </div>
              <div className="flex flex-wrap gap-3 text-xs text-foreground/85 border-t border-border/50 pt-3">
                <span className="flex items-center gap-1"><Film className="h-3 w-3" /> Video — AI video generation prompt</span>
                <span className="flex items-center gap-1"><Mic className="h-3 w-3" /> Audio — 8-second voiceover script</span>
                <span className="flex items-center gap-1"><ImageIcon className="h-3 w-3" /> Graphic — Still image generation prompt</span>
              </div>
            </CardContent>
          </Card>

          {/* Sections */}
          {sections.map(section => (
            <div key={section.title}>
              <div className={`flex items-center gap-2 mb-3 px-1`}>
                <Video className={`h-4 w-4 ${section.color}`} />
                <h2 className={`text-sm font-semibold ${section.color}`}>{section.title}</h2>
                <Badge variant="outline" className="text-xs">{section.clips.length} clip{section.clips.length !== 1 ? 's' : ''}</Badge>
              </div>
              <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                {section.clips.map(clip => (
                  <ClipCard
                    key={clip.num}
                    clip={clip}
                    sectionColor={section.color}
                    sectionBorderColor={section.borderColor}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      </PageContainer>
    </DashboardLayout>
  );
}
