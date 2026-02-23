import { useState } from 'react';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { PageContainer } from '@/components/ui/page-container';
import { PageHeader } from '@/components/ui/page-header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Copy, Check, Video, Info, Clapperboard } from 'lucide-react';
import { toast } from 'sonner';

interface Clip {
  num: number;
  name: string;
  prompt: string;
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
      { num: 1, name: 'Platform Intro', prompt: 'Cinematic dark tech interface materializing from particles of light. A glowing neural network forms the words "AURA INTERCEPT" in bold futuristic typography. Holographic rings orbit the logo as data streams flow outward in all directions. Deep blue and electric cyan color palette. Premium SaaS product reveal. 4K, cinematic lighting, shallow depth of field.' },
    ],
  },
  {
    title: 'Console 1: Customer Portal',
    color: 'text-blue-400',
    borderColor: 'border-blue-500/30',
    bgColor: 'bg-blue-500/10',
    clips: [
      { num: 2, name: 'Customer Portal Console', prompt: 'Sleek holographic command center with a glowing blue interface. A 3D chat bubble and phone icon pulse at the center. Customer messages stream in from the left while AI responses flow out to the right in real-time. Digital waves represent voice calls being answered instantly. Blue neon glow, dark background, futuristic customer service hub. 4K cinematic.' },
      { num: 3, name: 'Triage Agent', prompt: 'A glowing AI avatar behind a futuristic reception desk, answering multiple holographic phone lines simultaneously. Caller profiles appear as floating cards that get instantly categorized and routed. Streams of text and voice waveforms flow through the avatar. Blue accent lighting, dark tech environment. 4K, smooth motion.' },
      { num: 4, name: 'Booking Agent', prompt: 'A holographic calendar floating in 3D space. Time slots light up and fill automatically as appointment requests fly in as glowing orbs. The AI agent icon stamps each booking with a confirmation checkmark. Calendar syncs ripple outward like digital waves. Blue-green glow, premium tech aesthetic. 4K cinematic.' },
      { num: 5, name: 'Follow-Up Agent', prompt: 'Streams of glowing SMS messages and emails launching from a central AI node outward to customer icons arranged in a circle. Each message trail leaves a soft light trail. Notification badges pulse as responses come back. Automated follow-up sequences visualized as flowing light paths. Warm blue tones, dark background. 4K.' },
      { num: 6, name: 'Review Agent', prompt: 'Five-star ratings materializing as golden holographic stars above satisfied customer silhouettes. Review request messages fly out from a central AI hub. Positive reviews aggregate into a rising reputation score meter. Gold and blue color palette, premium dark tech environment. 4K cinematic motion.' },
    ],
  },
  {
    title: 'Console 2: Field Operations',
    color: 'text-green-400',
    borderColor: 'border-green-500/30',
    bgColor: 'bg-green-500/10',
    clips: [
      { num: 7, name: 'Field Operations Console', prompt: 'Aerial view of a city transforming into a holographic 3D map with glowing green route lines connecting job sites. Technician icons pulse at different locations. A dispatch board overlays the map with live status updates scrolling. Green neon accents on dark background, military-grade command center aesthetic. 4K cinematic.' },
      { num: 8, name: 'Dispatch Agent', prompt: 'A tactical command screen showing technician avatars being assigned to job pins on a holographic city map. Assignment lines connect dispatchers to field workers with satisfying snap animations. Job cards slide into place with priority indicators. Green and white on dark background, real-time operations feel. 4K.' },
      { num: 9, name: 'Route Agent', prompt: 'A 3D holographic city map with multiple glowing route paths being calculated simultaneously. Routes optimize in real-time, shifting and rerouting as traffic data flows in. Distance and time indicators float above each path. GPS precision visualization. Green neon lines on dark map. 4K cinematic aerial view.' },
      { num: 10, name: 'ETA Agent', prompt: 'A countdown timer hologram connected to a moving technician dot on a route map. The ETA updates dynamically as the dot progresses. Customer notification bubbles appear showing live arrival updates. Time crystals shatter and reform with each recalculation. Green and cyan accents, dark tech background. 4K.' },
      { num: 11, name: 'Check-In Agent', prompt: 'A technician silhouette arriving at a job site, triggering a holographic check-in confirmation. Before and after photo frames materialize. Job notes type themselves into floating cards. Completion status transforms from "In Progress" to "Complete" with a satisfying glow effect. Green accent on dark background. 4K.' },
    ],
  },
  {
    title: 'Console 3: Business Operations',
    color: 'text-purple-400',
    borderColor: 'border-purple-500/30',
    bgColor: 'bg-purple-500/10',
    clips: [
      { num: 12, name: 'Business Operations Console', prompt: 'A premium executive dashboard materializing with multiple floating panels showing quotes, invoices, inventory levels, and employee metrics. Data flows between panels like liquid light. Charts and graphs animate upward. Purple and violet holographic interface on dark background, enterprise command center. 4K cinematic.' },
      { num: 13, name: 'Admin Agent', prompt: 'A central AI brain node connected to orbiting management panels: employees, companies, settings, and permissions. Each panel pulses with real-time data. Toggle switches flip automatically as the AI configures operations. Purple glow with organizational chart overlay. Dark premium background. 4K.' },
      { num: 14, name: 'Quoting Agent', prompt: 'A blank document transforming into a detailed professional quote with line items, pricing, and terms populating themselves automatically. The quote assembles piece by piece with satisfying snap animations. A "Send Quote" button pulses and fires the document to a customer icon. Purple and gold accents. 4K cinematic.' },
      { num: 15, name: 'Invoice Agent', prompt: 'Professional invoices generating automatically from completed job cards. Payment links materialize and fly to customer devices. A payment received notification triggers a cascade of green checkmarks. Revenue counter ticks upward. Purple and green on dark background, financial precision aesthetic. 4K.' },
      { num: 16, name: 'Inventory Agent', prompt: 'A 3D warehouse visualization with holographic shelves. Stock levels displayed as glowing bar meters. Low-stock items flash amber warnings. Reorder notifications launch automatically. Parts and materials tracked with floating quantity badges. Purple and amber accents on dark background, logistics precision. 4K cinematic.' },
    ],
  },
  {
    title: 'Console 4: Outreach & Sales Ops',
    color: 'text-orange-400',
    borderColor: 'border-orange-500/30',
    bgColor: 'bg-orange-500/10',
    clips: [
      { num: 17, name: 'Outreach & Sales Console', prompt: 'A marketing war room with holographic campaign dashboards, lead funnels visualized as 3D pipelines, and audience segments displayed as clustered light particles. Conversion metrics pulse in real-time. Campaign launches visualized as energy waves. Orange and amber glow on dark background, sales intelligence center. 4K.' },
      { num: 18, name: 'Campaign Agent', prompt: 'Multiple marketing campaigns visualized as orbiting satellites around a central brand hub. Each campaign shows reach metrics, engagement sparks, and conversion funnels. A new campaign launches with a burst of energy, deploying across email, SMS, and social channels simultaneously. Orange neon on dark background. 4K cinematic.' },
      { num: 19, name: 'Lead Agent', prompt: 'Raw leads entering a holographic funnel from multiple sources — web forms, calls, social media. The AI scores each lead with a glowing temperature gauge from cold blue to hot red. Qualified leads route automatically to sales pipelines. Lead cards sort and prioritize themselves. Orange and red accents on dark. 4K.' },
      { num: 20, name: 'Marketing Agent', prompt: 'Customer segments forming as clusters of light particles that group by behavior, demographics, and engagement. The AI draws targeting crosshairs around high-value segments. Personalized message templates generate for each group. Data-driven audience intelligence visualization. Orange and white on dark background. 4K cinematic.' },
    ],
  },
  {
    title: 'Console 5: Social Media Ops',
    color: 'text-pink-400',
    borderColor: 'border-pink-500/30',
    bgColor: 'bg-pink-500/10',
    clips: [
      { num: 21, name: 'Social Media Console', prompt: 'A social media command center with 6 platform icons (Facebook, Instagram, X, LinkedIn, TikTok, YouTube) orbiting a central content hub. Posts schedule themselves on a visual calendar. Engagement metrics flow inward as animated data streams. Pink and magenta holographic interface on dark background. 4K cinematic.' },
      { num: 22, name: 'Social Content Agent', prompt: 'AI generating social media posts in real-time: text writes itself, images compose automatically, hashtags materialize. Multiple post variants for different platforms fan out from a single content idea like cards being dealt. Creative sparks and writing animations. Pink and white on dark background. 4K.' },
      { num: 23, name: 'Social Scheduler Agent', prompt: 'A holographic weekly calendar with time slots filling with scheduled posts across 6 social platforms. Posts slide into optimal time slots with satisfying click animations. A clock visualization shows best-posting-time intelligence. Queue management with drag-and-drop feel. Pink and cyan on dark background. 4K cinematic.' },
      { num: 24, name: 'Social Analytics Agent', prompt: 'Social media metrics exploding into view: engagement rates as rising bar charts, follower growth as climbing line graphs, viral content highlighted with pulse effects. Platform comparison dashboards side by side. Performance insights materialize as floating text cards. Pink and gold accents on dark background. 4K.' },
    ],
  },
  {
    title: 'Console 6: Creative & Web Presence',
    color: 'text-violet-400',
    borderColor: 'border-violet-500/30',
    bgColor: 'bg-violet-500/10',
    clips: [
      { num: 25, name: 'Creative & Web Presence Console', prompt: 'A creative studio merged with a web development environment. On one side, multi-channel content generates across blog, email, SMS, and social formats. On the other, a website builds itself with SEO scores rising. Content Engine and web builder unified in a violet holographic workspace. Dark background. 4K cinematic.' },
      { num: 26, name: 'Creative Agent', prompt: 'A blank canvas transforming into multi-format content: blog posts, email templates, SMS messages, and social graphics generating simultaneously from a single AI prompt. Each format materializes in its own floating panel. Brand voice settings glow as guardrails. Violet and white creative energy on dark background. 4K.' },
      { num: 27, name: 'Web Presence Agent', prompt: 'A website wireframe assembling itself block by block with AI-optimized layouts. SEO score meters climb upward. Blog posts auto-publish with metadata tags floating into place. Site performance metrics pulse green. Mobile and desktop views toggle seamlessly. Violet and green accents on dark background. 4K cinematic.' },
    ],
  },
  {
    title: 'Console 7: Analytics & Reports',
    color: 'text-cyan-400',
    borderColor: 'border-cyan-500/30',
    bgColor: 'bg-cyan-500/10',
    clips: [
      { num: 28, name: 'Analytics & Reports Console', prompt: 'An executive intelligence center with 8 specialized dashboard panels materializing in a semicircle. KPI gauges, revenue charts, forecast projections, and export options all animate simultaneously. Data flows between panels like neural connections. Cyan and teal holographic interface on dark background. 4K cinematic.' },
      { num: 29, name: 'Insights Agent', prompt: 'Raw business data transforming into actionable insights: numbers morph into clear trend arrows, patterns highlight themselves, and AI-generated insight cards materialize with recommendations. A magnifying glass scans data and reveals hidden opportunities. Cyan and white on dark background. 4K cinematic.' },
      { num: 30, name: 'Performance Agent', prompt: 'KPI dashboards with real-time performance gauges: customer satisfaction, response times, job completion rates, and team efficiency all displayed as dynamic meter visualizations. Green indicators pulse for exceeding targets, amber for warnings. Cyan and green on dark background. 4K.' },
      { num: 31, name: 'Revenue Agent', prompt: 'Revenue streams visualized as flowing rivers of golden light merging into a total revenue counter. Monthly recurring revenue charts build upward. Payment analytics show transaction patterns. Profit margins calculate in real-time with satisfying number animations. Cyan and gold on dark background. 4K cinematic.' },
      { num: 32, name: 'Forecast Agent', prompt: 'A timeline extending into the future with predictive data curves projecting forward. AI confidence bands glow around forecast lines. Seasonal patterns visualize as wave overlays. What-if scenarios branch like decision trees. Crystal ball aesthetic meets data science. Cyan and purple on dark background. 4K cinematic.' },
    ],
  },
  {
    title: 'AI Operatives Hub',
    color: 'text-indigo-400',
    borderColor: 'border-indigo-500/30',
    bgColor: 'bg-indigo-500/10',
    clips: [
      { num: 33, name: 'AI Operatives Hub', prompt: 'All 24 AI operative icons arranging themselves in a grand neural network formation. Connection lines pulse between agents showing real-time handoffs. A central command node monitors all agents simultaneously. Batch activation switches toggle with cascade effects. Indigo and white holographic command center on dark background. 4K cinematic.' },
    ],
  },
  {
    title: 'Platform Finale',
    color: 'text-yellow-400',
    borderColor: 'border-yellow-500/30',
    bgColor: 'bg-yellow-500/10',
    clips: [
      { num: 34, name: 'Platform Finale', prompt: 'The full Aura Intercept neural network zooming out to reveal the complete 24-agent ecosystem connected across 7 consoles. The network pulses with activity as the tagline "Your AI Operating System" materializes in bold typography. The Aura Intercept logo locks in center frame with a final energy pulse. Deep blue, cyan, and gold premium palette. 4K cinematic.' },
    ],
  },
];

function ClipCard({ clip, sectionColor, sectionBorderColor }: { clip: Clip; sectionColor: string; sectionBorderColor: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(clip.prompt);
    setCopied(true);
    toast.success(`Clip ${clip.num} prompt copied!`);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Card className={`border ${sectionBorderColor} bg-card/50`}>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <Badge variant="outline" className={`shrink-0 font-mono text-xs ${sectionColor}`}>
              #{clip.num}
            </Badge>
            <CardTitle className="text-sm font-semibold truncate">{clip.name}</CardTitle>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <Badge variant="secondary" className="text-xs">8s</Badge>
            <Button size="sm" variant="ghost" className="h-7 px-2" onClick={handleCopy}>
              {copied ? <Check className="h-3 w-3 text-green-400" /> : <Copy className="h-3 w-3" />}
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <p className="text-xs text-muted-foreground leading-relaxed">{clip.prompt}</p>
      </CardContent>
    </Card>
  );
}

export default function VideoPromptsPage() {
  const [copiedAll, setCopiedAll] = useState(false);

  const handleCopyAll = () => {
    const allText = sections.flatMap(s =>
      s.clips.map(c => `=== CLIP ${c.num}: ${c.name} (8s) ===\n${c.prompt}`)
    ).join('\n\n');
    navigator.clipboard.writeText(allText);
    setCopiedAll(true);
    toast.success('All 34 prompts copied to clipboard!');
    setTimeout(() => setCopiedAll(false), 2000);
  };

  return (
    <DashboardLayout>
      <PageContainer variant="transparent">
        <PageHeader
          icon={Clapperboard}
          title="Promo Video Prompts"
          description="34 AI video generation prompts for Runway, Sora, Kling, and similar tools. Produce 8-second clips then merge for a full 4m 32s platform promo."
        />

        <div className="space-y-6 pb-8">
          {/* Assembly Guide */}
          <Card className="border-border/50 bg-card/50">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Info className="h-4 w-4 text-muted-foreground" />
                  <CardTitle className="text-sm">Assembly Guide</CardTitle>
                </div>
                <Button size="sm" variant="outline" onClick={handleCopyAll} className="h-7 text-xs">
                  {copiedAll ? <Check className="mr-1 h-3 w-3 text-green-400" /> : <Copy className="mr-1 h-3 w-3" />}
                  Copy All 34 Prompts
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm mb-4">
                <div className="text-center p-3 rounded-lg bg-muted/30">
                  <p className="text-2xl font-bold text-foreground">34</p>
                  <p className="text-xs text-muted-foreground">Total Clips</p>
                </div>
                <div className="text-center p-3 rounded-lg bg-muted/30">
                  <p className="text-2xl font-bold text-foreground">4:32</p>
                  <p className="text-xs text-muted-foreground">Total Runtime</p>
                </div>
                <div className="text-center p-3 rounded-lg bg-muted/30">
                  <p className="text-2xl font-bold text-foreground">0.5s</p>
                  <p className="text-xs text-muted-foreground">Dissolve (within console)</p>
                </div>
                <div className="text-center p-3 rounded-lg bg-muted/30">
                  <p className="text-2xl font-bold text-foreground">1s</p>
                  <p className="text-xs text-muted-foreground">Glitch (between consoles)</p>
                </div>
              </div>
              <div className="flex flex-wrap gap-2 text-xs">
                {[
                  { label: 'Customer Portal', color: 'bg-blue-500/20 text-blue-400' },
                  { label: 'Field Operations', color: 'bg-green-500/20 text-green-400' },
                  { label: 'Business Ops', color: 'bg-purple-500/20 text-purple-400' },
                  { label: 'Outreach & Sales', color: 'bg-orange-500/20 text-orange-400' },
                  { label: 'Social Media', color: 'bg-pink-500/20 text-pink-400' },
                  { label: 'Creative & Web', color: 'bg-violet-500/20 text-violet-400' },
                  { label: 'Analytics & Reports', color: 'bg-cyan-500/20 text-cyan-400' },
                  { label: 'AI Operatives Hub', color: 'bg-indigo-500/20 text-indigo-400' },
                ].map(item => (
                  <span key={item.label} className={`px-2 py-1 rounded-full font-medium ${item.color}`}>{item.label}</span>
                ))}
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
