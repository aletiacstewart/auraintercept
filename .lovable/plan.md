
# Add Audio Scripts & Graphic Prompts to All 34 Video Prompt Cards

## What's Being Added

Each of the 34 clip cards on `/dashboard/video-prompts` will be upgraded with two new assets:

1. **8-Second Audio Script** — A short voiceover/narration script (2-3 sentences, ~20-25 words) timed for exactly 8 seconds of speech, matching the visual content of each clip.
2. **Graphic/Image Prompt** — A detailed prompt for AI image generators (Midjourney, DALL-E, Adobe Firefly) producing a still promotional graphic for each clip, tied directly to Aura Intercept's platform branding.

---

## Files to Modify

### 1. `src/pages/VideoPromptsPage.tsx` — Full Overhaul

**Data Model Change:** Extend the `Clip` interface with two new fields:
```typescript
interface Clip {
  num: number;
  name: string;
  prompt: string;         // existing video prompt
  audioScript: string;    // NEW: 8-second voiceover script
  imagePrompt: string;    // NEW: still graphic/image generation prompt
}
```

**ClipCard Component:** Expand to show all three assets in a tabbed layout (Video Prompt / Audio Script / Graphic Prompt) with individual copy buttons per tab. Three tabs using Radix `Tabs` (already installed) keeps the card compact.

```
┌──────────────────────────────────────────────────────┐
│ #1  Platform Intro                    [8s] [⋯ Copy]  │
├──────────────────────────────────────────────────────┤
│ [ Video Prompt ] [ Audio Script ] [ Graphic Prompt ] │
├──────────────────────────────────────────────────────┤
│ "Cinematic dark tech interface..."                   │
│                                          [Copy Tab]  │
└──────────────────────────────────────────────────────┘
```

**"Copy All" Update:** Update `handleCopyAll` to export all three assets per clip, formatted as:
```
=== CLIP 1: Platform Intro (8s) ===
VIDEO: ...
AUDIO: ...
GRAPHIC: ...
```

---

## All 34 Audio Scripts & Graphic Prompts

### Platform Intro (Clip 1)
- **Audio:** "Meet Aura Intercept — the AI operating system built for modern business. Seven intelligent consoles. Twenty-four dedicated operatives. One unified platform."
- **Graphic:** "Premium dark-background brand poster. Glowing 'AURA INTERCEPT' logo in bold futuristic sans-serif with electric cyan and deep blue gradient. Neural network rings orbiting the logo. Data streams radiating outward. Tagline 'Your AI Operating System' in white below. Ultra-sharp 4K product branding, no clutter."

---

### Console 1: Customer Portal

**Clip 2 — Customer Portal Console**
- **Audio:** "The Customer Portal Console handles every customer touchpoint — calls, chats, bookings, and reviews — with zero manual effort."
- **Graphic:** "Holographic dark UI mockup of the Aura Intercept Customer Portal console. Blue glowing chat bubbles and phone icons. Real-time message stream panels. 'Customer Portal' label badge. Futuristic SaaS dashboard screenshot style."

**Clip 3 — Triage Agent**
- **Audio:** "The Triage Agent is your AI receptionist — routing, sorting, and responding to every inbound inquiry the moment it arrives."
- **Graphic:** "AI receptionist avatar at a futuristic reception desk. Multiple holographic incoming call cards floating around it. Blue accent lighting, dark background. 'TRIAGE AGENT' label overlaid in clean UI font. Aura Intercept branding watermark."

**Clip 4 — Booking Agent**
- **Audio:** "The Booking Agent fills your calendar automatically — no back-and-forth, no missed appointments, just seamless scheduling."
- **Graphic:** "3D holographic calendar with glowing blue appointment slots. AI agent icon confirming bookings with checkmarks. Floating confirmation cards. 'BOOKING AGENT — Aura Intercept' badge overlay. Clean dark tech aesthetic."

**Clip 5 — Follow-Up Agent**
- **Audio:** "The Follow-Up Agent keeps every customer engaged — sending the right message at exactly the right moment, automatically."
- **Graphic:** "Circular layout of customer icons receiving glowing message streams from a central AI node. SMS and email symbols as light trails. 'FOLLOW-UP AGENT' overlay text. Blue tones, dark background, Aura Intercept branding."

**Clip 6 — Review Agent**
- **Audio:** "The Review Agent turns happy customers into five-star advocates — requesting reviews at the perfect moment to build your reputation."
- **Graphic:** "Holographic five-star rating visualization with golden stars above customer silhouettes. Rising reputation score meter on the right. 'REVIEW AGENT — Aura Intercept' text overlay. Gold and blue on dark premium background."

---

### Console 2: Field Operations

**Clip 7 — Field Operations Console**
- **Audio:** "The Field Operations Console gives you real-time command of every technician, every job, and every route — all from one screen."
- **Graphic:** "Holographic city map with green glowing route lines connecting job site pins. Technician avatar icons positioned across the map. 'FIELD OPERATIONS CONSOLE — Aura Intercept' label. Dark background, military command center aesthetic."

**Clip 8 — Dispatch Agent**
- **Audio:** "The Dispatch Agent assigns the right technician to every job — instantly, intelligently, with no manual coordination required."
- **Graphic:** "Tactical dispatch board UI with technician avatars being assigned to job cards via animated green lines. Priority badges on each card. 'DISPATCH AGENT' label. Dark green-and-white tech dashboard style."

**Clip 9 — Route Agent**
- **Audio:** "The Route Agent calculates the most efficient path for every job — saving time, fuel, and frustration with every dispatch."
- **Graphic:** "Aerial view 3D city map with multiple optimized green neon route paths. Distance and ETA labels floating above paths. 'ROUTE AGENT — Aura Intercept' overlay. Clean GPS visualization aesthetic, dark background."

**Clip 10 — ETA Agent**
- **Audio:** "The ETA Agent keeps customers informed with live arrival updates — so no one is left wondering when their technician will arrive."
- **Graphic:** "Holographic countdown timer panel connected to a moving technician dot on a route map. Customer notification bubble showing '12 min away'. 'ETA AGENT' label. Green and cyan on dark background, precision tech feel."

**Clip 11 — Check-In Agent**
- **Audio:** "The Check-In Agent confirms job arrivals and completions automatically — creating a full digital paper trail for every site visit."
- **Graphic:** "Technician silhouette at a job site with a holographic check-in confirmation overlay. Before/after photo frames. Status badge changing from 'In Progress' to 'Complete'. 'CHECK-IN AGENT — Aura Intercept' label. Green on dark background."

---

### Console 3: Business Operations

**Clip 12 — Business Operations Console**
- **Audio:** "The Business Operations Console manages your quotes, invoices, inventory, and admin — all automated, all intelligent."
- **Graphic:** "Executive dark UI dashboard with multiple floating panels: quotes, invoices, inventory, and employee metrics. Purple holographic interface. 'BUSINESS OPERATIONS CONSOLE — Aura Intercept' header. Premium enterprise aesthetic."

**Clip 13 — Admin Agent**
- **Audio:** "The Admin Agent manages your users, companies, and settings — keeping your platform perfectly configured without IT overhead."
- **Graphic:** "Central AI brain node with orbiting management panels: Employees, Companies, Permissions, Settings. Purple glow organizational chart overlay. 'ADMIN AGENT — Aura Intercept' label. Dark premium background."

**Clip 14 — Quoting Agent**
- **Audio:** "The Quoting Agent generates professional quotes in seconds — accurate, branded, and ready to send the moment a job is scoped."
- **Graphic:** "Professional quote document assembling itself with line items, pricing, and signature line. 'Send Quote' CTA button glowing. 'QUOTING AGENT — Aura Intercept' overlay. Purple and gold on dark background."

**Clip 15 — Invoice Agent**
- **Audio:** "The Invoice Agent turns completed jobs into payment requests automatically — so revenue flows without chasing a single payment."
- **Graphic:** "Invoice document with payment link QR code materializing. Green checkmarks cascading as payment is received. Revenue counter ticking up. 'INVOICE AGENT — Aura Intercept' label. Purple and green on dark background."

**Clip 16 — Inventory Agent**
- **Audio:** "The Inventory Agent tracks every part and material in real time — alerting your team the moment stock runs low."
- **Graphic:** "3D holographic warehouse shelves with glowing stock level meters. Low-stock amber warning indicators. Parts tracked with floating quantity badges. 'INVENTORY AGENT — Aura Intercept' label. Purple and amber on dark background."

---

### Console 4: Outreach & Sales Ops

**Clip 17 — Outreach & Sales Console**
- **Audio:** "The Outreach and Sales Console arms your team with campaigns, leads, and audience intelligence — turning prospects into loyal customers."
- **Graphic:** "Marketing war room dark UI with holographic campaign dashboards, 3D lead funnel pipelines, and audience segment clusters. 'OUTREACH & SALES CONSOLE — Aura Intercept' header. Orange and amber on dark background."

**Clip 18 — Campaign Agent**
- **Audio:** "The Campaign Agent launches multi-channel marketing campaigns across email, SMS, and social — all from a single command."
- **Graphic:** "Multiple campaign satellites orbiting a central brand hub with reach and conversion metrics. Campaign launch energy burst. 'CAMPAIGN AGENT — Aura Intercept' overlay. Orange neon on dark background."

**Clip 19 — Lead Agent**
- **Audio:** "The Lead Agent scores and qualifies every inbound lead automatically — so your team only talks to the prospects most likely to convert."
- **Graphic:** "Holographic lead funnel with leads entering from web, calls, and social media icons. AI temperature gauge scoring each lead. 'LEAD AGENT — Aura Intercept' label. Orange and red accents on dark background."

**Clip 20 — Marketing Agent**
- **Audio:** "The Marketing Agent segments your audience and personalizes outreach — delivering the right message to the right person every time."
- **Graphic:** "Audience segment clusters of light particles grouped by behavior and demographics. AI targeting crosshairs on high-value segments. Personalized message templates. 'MARKETING AGENT — Aura Intercept' label. Orange and white on dark background."

---

### Console 5: Social Media Ops

**Clip 21 — Social Media Console**
- **Audio:** "The Social Media Console manages content, scheduling, and analytics across every major platform — from one intelligent command center."
- **Graphic:** "Social media command center with 6 platform icons orbiting a content hub. Visual post calendar with scheduled items. 'SOCIAL MEDIA CONSOLE — Aura Intercept' header. Pink and magenta holographic interface, dark background."

**Clip 22 — Social Content Agent**
- **Audio:** "The Social Content Agent generates platform-perfect posts for every channel — captions, hashtags, and visuals created in seconds."
- **Graphic:** "AI generating social post cards fanning out for Facebook, Instagram, X, LinkedIn, TikTok, YouTube simultaneously. Hashtags materializing. 'SOCIAL CONTENT AGENT — Aura Intercept' label. Pink and white on dark background."

**Clip 23 — Social Scheduler Agent**
- **Audio:** "The Social Scheduler Agent posts at the optimal time on every platform — so your content always reaches the largest possible audience."
- **Graphic:** "Holographic weekly calendar with post slots filling across 6 platform rows. Best-time indicators glowing on optimal slots. 'SOCIAL SCHEDULER AGENT — Aura Intercept' label. Pink and cyan on dark background."

**Clip 24 — Social Analytics Agent**
- **Audio:** "The Social Analytics Agent tracks every metric that matters — from engagement and reach to follower growth and top-performing content."
- **Graphic:** "Social analytics dashboard with rising bar charts, follower growth lines, and viral content highlights. Platform comparison side by side. 'SOCIAL ANALYTICS AGENT — Aura Intercept' label. Pink and gold on dark background."

---

### Console 6: Creative & Web Presence

**Clip 25 — Creative & Web Presence Console**
- **Audio:** "The Creative and Web Presence Console builds your content and powers your digital footprint — all driven by AI, all on brand."
- **Graphic:** "Split dark UI showing content generator on the left (blog, email, SMS, social) and website builder on the right with rising SEO score. 'CREATIVE & WEB PRESENCE CONSOLE — Aura Intercept' header. Violet on dark background."

**Clip 26 — Creative Agent**
- **Audio:** "The Creative Agent generates blogs, emails, social content, and SMS messages simultaneously — maintaining your brand voice across every channel."
- **Graphic:** "Multi-format content panels materializing: blog post, email template, SMS bubble, social graphic. Brand voice guardrail glow around all panels. 'CREATIVE AGENT — Aura Intercept' label. Violet and white on dark background."

**Clip 27 — Web Presence Agent**
- **Audio:** "The Web Presence Agent builds and optimizes your digital footprint — publishing SEO-ready content that grows your visibility automatically."
- **Graphic:** "Website wireframe building itself block by block. SEO score meter rising to 98. Auto-publishing blog post with floating metadata tags. Mobile and desktop toggle views. 'WEB PRESENCE AGENT — Aura Intercept' label. Violet and green on dark background."

---

### Console 7: Analytics & Reports

**Clip 28 — Analytics & Reports Console**
- **Audio:** "The Analytics and Reports Console delivers real-time intelligence across every area of your business — so decisions are always data-driven."
- **Graphic:** "Executive intelligence center with 8 dashboard panels in semicircle formation: KPIs, revenue, forecasts, performance. 'ANALYTICS & REPORTS CONSOLE — Aura Intercept' header. Cyan and teal holographic interface, dark background."

**Clip 29 — Insights Agent**
- **Audio:** "The Insights Agent transforms raw data into clear, actionable recommendations — surfacing the opportunities your business needs to act on."
- **Graphic:** "Raw data numbers morphing into trend arrows and insight cards with AI recommendations. Magnifying glass scanning data patterns. 'INSIGHTS AGENT — Aura Intercept' label. Cyan and white on dark background."

**Clip 30 — Performance Agent**
- **Audio:** "The Performance Agent monitors every KPI in real time — flagging what's working, what needs attention, and what to optimize next."
- **Graphic:** "KPI gauge dashboard with customer satisfaction, response time, and completion rate meters. Green success indicators, amber warnings. 'PERFORMANCE AGENT — Aura Intercept' label. Cyan and green on dark background."

**Clip 31 — Revenue Agent**
- **Audio:** "The Revenue Agent tracks every dollar flowing through your business — giving you complete financial clarity with zero manual reporting."
- **Graphic:** "Revenue streams as golden light rivers merging into a total MRR counter. Payment analytics chart. Profit margin calculator. 'REVENUE AGENT — Aura Intercept' label. Cyan and gold on dark background."

**Clip 32 — Forecast Agent**
- **Audio:** "The Forecast Agent projects your business trajectory — using AI to predict demand, revenue, and growth with confidence intervals."
- **Graphic:** "Future timeline with predictive curves, AI confidence band glows, seasonal wave overlays, and branching what-if scenarios. 'FORECAST AGENT — Aura Intercept' label. Cyan and purple on dark background."

---

**Clip 33 — AI Operatives Hub**
- **Audio:** "The AI Operatives Hub is mission control for all 24 agents — activate, monitor, and coordinate your entire AI workforce from one screen."
- **Graphic:** "Grand neural network of 24 AI operative icons connected with pulsing lines. Central command node monitoring all agents. Batch activation panel. 'AI OPERATIVES HUB — Aura Intercept' label. Indigo and white holographic command center, dark background."

**Clip 34 — Platform Finale**
- **Audio:** "Aura Intercept. Seven consoles. Twenty-four operatives. One platform. Your AI operating system is ready."
- **Graphic:** "Full Aura Intercept ecosystem zoomed out: all 7 console icons connected to 24 agent nodes in one unified glowing network. Tagline 'Your AI Operating System' in large futuristic type. Aura Intercept logo centered with energy pulse ring. Deep blue, cyan, and gold premium brand poster. 4K."

---

## Card UI Changes (ClipCard Component)

Each card expands from a single text block to a **3-tab layout**:

```
┌────────────────────────────────────────────────────────┐
│ #4  Booking Agent                        [8s]  [Copy]  │
├────────────────────────────────────────────────────────┤
│  [🎬 Video]   [🎙 Audio Script]   [🖼 Graphic]         │
├────────────────────────────────────────────────────────┤
│  "A holographic calendar floating in 3D space..."      │
│                                              [Copy ↗]  │
└────────────────────────────────────────────────────────┘
```

- Uses `@radix-ui/react-tabs` (already installed as shadcn Tabs)
- Tab icons: `Film` for Video, `Mic` for Audio, `Image` for Graphic
- Each tab content has its own individual Copy button
- The top-right "Copy" button copies all three assets for that clip combined
- "Copy All 34 Prompts" in the Assembly Guide exports all three assets per clip

## Implementation

Single file edit: `src/pages/VideoPromptsPage.tsx`

1. Extend `Clip` interface with `audioScript: string` and `imagePrompt: string`
2. Add `audioScript` and `imagePrompt` to all 34 clip objects in the `sections` array
3. Update `ClipCard` to use Tabs with Film/Mic/Image icons and per-tab copy buttons
4. Update top-level copy buttons to include all three asset types per clip
5. Import `Tabs, TabsContent, TabsList, TabsTrigger` from `@/components/ui/tabs` and `Film, Mic, ImageIcon` from `lucide-react`
