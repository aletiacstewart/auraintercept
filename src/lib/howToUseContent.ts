import type { HowToUseModalProps } from '@/components/ui/HowToUseModal';

/**
 * Centralized "How to Use" copy for every console / KB tab.
 * Marketing-aligned wording — keep in sync with public site.
 */
type Content = Omit<HowToUseModalProps, 'className' | 'triggerLabel' | 'iconOnly'>;

export const HOW_TO_USE: Record<string, Content> = {
  knowledgeBase: {
    title: 'Knowledge Base',
    runsAutomatically: [
      'Feeds every AI agent — voice, chat, SMS, email — with your services, prices, and policies.',
      'Updates AI answers instantly when you edit a service or FAQ.',
      'Keeps the Customer Portal greeting and Smart Website content in sync.',
    ],
    whenYouStepIn: [
      'Adding a new service or seasonal promo.',
      'Updating prices or business hours.',
      'Reviewing what the AI is saying about your business.',
    ],
    steps: [
      'Click "AI Generate" to import from your existing website or PDF in 30 seconds.',
      'Review and edit the auto-filled Services, Hours, and FAQs.',
      'Add Smart Links (booking page, payment, reviews) so the AI can hand customers off correctly.',
      'Done — every agent now uses this knowledge automatically.',
    ],
    example:
      'Maria runs an HVAC company. She pastes her website URL — the AI extracts her 12 services, summer/winter hours, and 8 FAQs in 30 seconds. That night a customer calls at 11 PM asking about emergency AC repair. The AI quotes Maria\'s exact emergency rate, books the morning slot, and sends the customer a confirmation SMS — all without waking Maria up.',
  },

  servicesTab: {
    title: 'Services',
    runsAutomatically: [
      'AI agents quote your exact prices on every call, chat, and SMS.',
      'Smart Website and Customer Portal show your live service catalog.',
      'Booking flow auto-suggests duration and prep time.',
    ],
    whenYouStepIn: [
      'Adding a new offering or seasonal special.',
      'Adjusting pricing for inflation or new equipment costs.',
    ],
    steps: [
      'Click "Add Service" — name, price, duration.',
      'Optionally toggle "Bookable online" and "Featured".',
      'Save — the AI starts quoting it immediately.',
    ],
    example:
      'Add "Mini-Split Installation — $2,400, 4 hrs". A customer chats with the website that night asking about ductless options. The AI replies with the price, books a free estimate, and saves the lead in your dashboard.',
  },

  faqsTab: {
    title: 'FAQs',
    runsAutomatically: [
      'AI answers customer questions on chat, voice, SMS, and email using your own words.',
      'Reduces repetitive owner texts ("what time do you open?", "do you do weekends?").',
    ],
    whenYouStepIn: [
      'A customer asks something the AI didn\'t know — add it as an FAQ in 10 seconds.',
    ],
    steps: [
      'Click "Add FAQ" and type the question + your preferred answer.',
      'Save — the AI uses it on the next conversation.',
    ],
    example:
      'You keep getting "do you charge for estimates?" Add it once with your answer. The AI handles every future ask — at 2 AM, on Sundays, in three different channels.',
  },

  hoursTab: {
    title: 'Business Hours',
    runsAutomatically: [
      'AI books only inside your operating hours by default.',
      'Greets after-hours callers differently and offers to schedule for next-day.',
      'Triggers emergency-rate flow on holidays / overnight if configured.',
    ],
    whenYouStepIn: ['Holiday closures, vacation, or seasonal hour changes.'],
    steps: [
      'Toggle each day open/closed and set times.',
      'Optionally add holiday overrides.',
    ],
    example:
      'It\'s Christmas Eve. The AI tells callers you\'re closed but books them into your first available slot Dec 26 — no missed leads.',
  },

  documentsTab: {
    title: 'Documents',
    runsAutomatically: [
      'AI uses uploaded PDFs (service agreements, brochures, policy docs) as reference material.',
      'Quotes specific terms from documents when customers ask detailed questions.',
    ],
    whenYouStepIn: ['Uploading a new contract template, policy doc, or pricing sheet.'],
    steps: [
      'Click "Upload" and drop in PDFs, Word docs, or images.',
      'AI indexes them automatically.',
    ],
    example:
      'Upload your service agreement PDF. A customer asks "what is included in the standard plan?" — the AI cites the exact clause and offers to email the doc.',
  },

  smartLinksTab: {
    title: 'Smart Links',
    runsAutomatically: [
      'AI hands customers off to the right page based on intent (book, pay, review).',
      'Auto-generates QR codes you can print on invoices, trucks, or business cards.',
      'Tracks clicks per channel so you know what\'s working.',
    ],
    whenYouStepIn: [
      'Adding a new payment processor URL or seasonal promo landing page.',
    ],
    steps: [
      'Click "Add Smart Link" and pick the category (Booking, Pricing, Reviews, etc.).',
      'Paste the URL. Triggers are pre-filled from category.',
      'Click "QR Code" on any link to download/print.',
    ],
    example:
      'Customer texts "how do I pay my invoice?" — the AI sends the Stripe link automatically. You print the QR code on truck signage; new customers scan it and book directly.',
  },

  aiProfileTab: {
    title: 'AI Content Profile',
    runsAutomatically: [
      'Sets the brand voice every AI agent uses — tone, vocabulary, what to avoid.',
      'Powers the Content Engine for social posts, blogs, and email campaigns.',
    ],
    whenYouStepIn: ['Quarterly brand voice review or after a rebrand.'],
    steps: [
      'Pick your industry, tone (Friendly / Professional / Bold), target audience.',
      'List your unique selling points and topics to avoid.',
      'Click "Test Content" to preview a sample social post in your voice.',
    ],
    example:
      'Set tone to "Friendly + Direct" with USPs "same-day service, family-owned since 1998". Generate a Facebook post — the AI writes it in exactly that voice.',
  },

  inventoryTab: {
    title: 'Inventory',
    runsAutomatically: [
      'Tracks stock levels of parts and supplies.',
      'When an item drops below minimum quantity, automatically alerts the Dispatch operative to reorder or substitute.',
      'Surfaces low-stock items on technician work orders.',
    ],
    whenYouStepIn: [
      'Adding new SKUs or adjusting min-quantity thresholds.',
      'Receiving a delivery — bulk update quantities.',
    ],
    steps: [
      'Click "Add Item" — name, SKU, quantity, min quantity.',
      'When a tech uses an item, mark it consumed in Field Ops.',
      'Low-stock alert fires automatically — Dispatch operative reorders.',
    ],
    example:
      'You set "R-410A refrigerant" min qty = 2. A tech uses one cylinder this morning. Inventory drops to 2 → low-stock alert → Dispatch operative auto-emails your supplier for a refill before you run out.',
  },

  // ───────── 7 Consoles ─────────
  frontDeskConsole: {
    title: 'Front Desk Operative',
    runsAutomatically: [
      'Answers every call, chat, SMS, and email — 24/7, in seconds.',
      'Books appointments directly into your calendar.',
      'Sends confirmations + reminders. Asks for reviews after the job.',
      'Handles missed-call follow-ups within 60 seconds.',
    ],
    whenYouStepIn: [
      'Reviewing flagged conversations (escalations, refunds, complaints).',
      'Updating greeting or holiday hours.',
    ],
    steps: [
      'Make sure Knowledge Base is filled (Services, Hours, FAQs).',
      'Connect your phone number in Settings → Voice.',
      'Done — Front Desk handles everything else.',
    ],
    example:
      '11 PM Saturday: a homeowner\'s water heater dies. They text your number. Front Desk replies in 8 seconds, quotes your emergency rate, books the 7 AM slot, sends a confirmation, and pings your tech\'s phone — all while you\'re asleep.',
  },

  fieldOpsConsole: {
    title: 'Field Operations Console',
    whoUsesIt:
      'Dispatchers, operations managers, and owner-operators who run the day. Field team members see a simpler mobile view (Technician App) — this console is the desk-side command center.',
    runsAutomatically: [
      'Auto-assigns each job to the closest, most-skilled available team member.',
      'Sends ETA texts, arrival photos, and completion updates to the customer.',
      'Triggers check-in / check-out workflows on the team member’s phone.',
      'Watches route efficiency and flags gaps or overloaded schedules.',
      'Reorders parts and materials when inventory drops below reorder points.',
    ],
    whenYouStepIn: [
      'Manually re-assigning a job (sick team member, VIP customer, special skill).',
      'Reviewing the daily route efficiency summary or a flagged detour.',
      'Approving high-cost part reorders above your set threshold.',
    ],
    steps: [
      'Add your field team in Settings → Team and give each person a role + skills.',
      'Connect Google Calendar so bookings write straight to the right calendar.',
      'Open Field Ops → Dispatch. Confirm today’s jobs are assigned to the right people.',
      'Enable the Technician App (QR code at the top-right) so the team can check in from their phones.',
      'Turn on inventory reorder alerts under Settings → Inventory if you carry parts.',
      'Watch the dispatch board fill itself as bookings come in from Front Desk and the website.',
    ],
    aiActions: [
      'Reassign the 2pm job to whoever is closest',
      'Text the next customer that we are running 20 minutes late',
      'Show me every job flagged as at-risk today',
      'Reorder anything under its minimum stock',
      'What is my dispatch efficiency this week vs last week',
    ],
    commonIssues: [
      { q: 'Jobs aren’t auto-assigning', a: 'Confirm each team member has skills tagged and availability set for today.' },
      { q: 'ETA texts never went out', a: 'Check Integrations → SMS is connected and the customer’s phone is E.164 format.' },
      { q: 'Calendar didn’t update', a: 'Reconnect Google Calendar under Integrations → Calendar; the token may have expired.' },
      { q: 'The map shows nothing', a: 'Grant location permission on the team member’s phone and check they opened the Technician App today.' },
    ],
    connectsWith: [
      'Front Desk (drops new bookings straight onto the dispatch board)',
      'Business Management (completed jobs auto-generate invoices)',
      'Customer Portal (customers track ETA + confirm on-site)',
      'Google Calendar, SignalWire (SMS), and your inventory catalog',
    ],
    example:
      'A new booking lands at 9 AM. The console sees Alex is closest and holds the right skill tag, auto-assigns the job, texts the customer “Alex arriving 10:15 AM,” and updates the route map. When Alex taps “Complete” at 11:30, an invoice is generated and the customer gets a payment link before Alex is back in the truck.',
  },

  socialMediaConsole: {
    title: 'Social Media Console',
    runsAutomatically: [
      'Generates and schedules posts across Facebook, Instagram, LinkedIn, TikTok.',
      'Replies to comments and DMs in your brand voice.',
      'Generates AI images for posts when you don\'t have photos.',
    ],
    whenYouStepIn: [
      'Approving a post before it goes live (optional — set to auto-publish if you trust it).',
      'Reviewing engagement reports weekly.',
    ],
    steps: [
      'Connect your social accounts in Settings → Integrations.',
      'Set posting frequency (3x / week recommended).',
      'Sit back — content engine fills your calendar.',
    ],
    example:
      'Friday afternoon: AI generates 3 posts for next week — a customer testimonial, a tip ("Why your AC freezes up"), and a promo. You approve all 3 in 10 seconds. They post automatically Mon/Wed/Fri.',
  },

  outreachSalesConsole: {
    title: 'Marketing & Sales Console',
    whoUsesIt:
      'Owners, sales leads, and marketing operators. The console runs itself but this is where you review the pipeline, approve high-value quotes, and shape campaigns.',
    runsAutomatically: [
      'Follows up with every lead that didn’t book — email, SMS, or both.',
      'Re-engages dormant customers on the schedule you set (e.g., 30 / 60 / 90 / 180 days).',
      'Generates quotes from chat and voice conversations and sends them for approval.',
      'Runs seasonal campaigns from your industry template pack.',
      'Scores each lead by intent so hot ones bubble up first.',
    ],
    whenYouStepIn: [
      'Approving a quote above the auto-send threshold you set.',
      'Editing a campaign message or adjusting who it targets.',
      'Reviewing the weekly conversion snapshot.',
    ],
    steps: [
      'Confirm your Knowledge Base has services + pricing — quotes pull from there.',
      'Connect Email (Resend) and SMS (SignalWire) under Integrations.',
      'Set your re-engagement schedule under Marketing → Automation.',
      'Pick or edit a campaign template from your industry pack and press “Activate.”',
      'Set your quote-approval threshold under Settings → Sales.',
      'Watch the pipeline widget on this console — hot leads move to the top automatically.',
    ],
    aiActions: [
      'Send a follow-up to every lead that went cold this week',
      'Draft a re-engagement campaign for customers we haven’t seen in six months',
      'Show me every quote over $2,000 waiting for approval',
      'What is my lead-to-booking conversion this month',
      'Generate a spring promotion using our brand voice',
    ],
    commonIssues: [
      { q: 'Follow-ups aren’t sending', a: 'Check Email / SMS integrations are connected and your daily send caps aren’t hit.' },
      { q: 'Quotes reference wrong prices', a: 'Update the service in Knowledge Base — quotes pull live from there.' },
      { q: 'Campaign audience is empty', a: 'Widen the filter (industry, tag, last-seen) or import more leads via Leads → Import.' },
      { q: 'Leads aren’t being scored', a: 'The AI needs a few dozen booked jobs to calibrate; scoring becomes accurate around week 2.' },
    ],
    connectsWith: [
      'Knowledge Base (services + pricing for quotes)',
      'Front Desk (captures new leads from calls and chat)',
      'Business Management (won quotes flip to invoices)',
      'Email (Resend), SMS (SignalWire), Social publishing, CRM sync',
    ],
    example:
      'A lead received a $4,800 quote two weeks ago and went silent. The console sends a friendly nudge: “Hi Sarah — still weighing the install? We have an opening Thursday and a $200 seasonal rebate.” She replies, books, and the win rolls into your pipeline widget the same day.',
  },

  analyticsConsole: {
    title: 'Analytics',
    runsAutomatically: [
      'Tracks revenue, bookings, conversion, and AI activity in real time.',
      'Surfaces trends and anomalies (e.g., "bookings down 20% this week").',
      'Generates monthly performance reports.',
    ],
    whenYouStepIn: [
      'Asking the natural-language hero a question ("how was last week?").',
      'Reviewing the monthly report.',
    ],
    steps: [
      'No setup — analytics fill in as data flows.',
      'Use the chat box at the top to ask anything in plain English.',
    ],
    example:
      'You type: "What\'s my best service this month?" — Analytics replies: "Furnace tune-ups, $12,400 revenue from 31 jobs, up 18% vs. last month."',
  },

  businessMgmtConsole: {
    title: 'Business Management Console',
    whoUsesIt:
      'Owners, office managers, and bookkeepers. This is the money + operations backbone — invoicing, payments, forecasting, and compliance in one place.',
    runsAutomatically: [
      'Generates and emails invoices the moment a job is marked complete.',
      'Tracks payments, sends payment-received receipts, and chases overdue invoices on your cadence.',
      'Forecasts revenue and staffing needs from your past 30 / 60 / 90 days.',
      'Reconciles Stripe payouts against invoices daily.',
      'Flags refund requests, chargebacks, and compliance items that need a human look.',
    ],
    whenYouStepIn: [
      'Approving an invoice or refund above the threshold you set.',
      'Reviewing the monthly forecast and staffing recommendation.',
      'Answering a flagged compliance item (insurance expiring, permit due, etc.).',
    ],
    steps: [
      'Connect Stripe (or your payment provider) under Integrations → Payments — this uses your own Stripe account and card on file.',
      'Set your invoice template and email footer under Settings → Billing.',
      'Set approval thresholds for invoices and refunds under Settings → Sales.',
      'Turn on the overdue-follow-up cadence (default: day 7, 14, 30).',
      'Confirm the industry template pack matches your business — quote and invoice templates come from it.',
      'Watch the revenue widget on this console — it updates as payments settle.',
    ],
    aiActions: [
      'Show me every invoice over 30 days overdue',
      'Send a friendly overdue reminder to the top five',
      'What is my projected revenue for next month',
      'Refund the last payment from customer Alex Rivera',
      'Break down last month’s revenue by service',
    ],
    commonIssues: [
      { q: 'Invoices aren’t sending', a: 'Confirm the completed job has a customer email and Stripe is connected under Integrations.' },
      { q: 'Stripe payout doesn’t match', a: 'Open the reconciliation report — most mismatches are Stripe fees; the AI will label them.' },
      { q: 'Forecast looks off', a: 'Forecasts need ~30 days of data; new workspaces will see a “calibrating” label until enough data lands.' },
      { q: 'Refund won’t execute', a: 'Refunds above your threshold need admin approval — check the pending queue at the top of the console.' },
    ],
    connectsWith: [
      'Field Ops (completed jobs trigger invoicing)',
      'Marketing & Sales (won quotes flip to invoices)',
      'Analytics (revenue + forecast feed the KPI dashboard)',
      'Stripe / Paddle (payments) and your accounting export',
    ],
    example:
      'A team member finishes a job at 4 PM and taps “Complete” on their phone. The invoice generates using your industry template, emails the customer with a Stripe payment link, and the payment settles by 5 PM. The revenue widget on this console ticks up before you’ve seen the notification.',
  },

  webPresenceConsole: {
    title: 'Web Presence + Smart Website',
    runsAutomatically: [
      'Powers your live Smart Website with your services, hours, and reviews.',
      'Embedded chat widget answers visitor questions instantly.',
      'Captures leads and pushes them into the booking flow.',
    ],
    whenYouStepIn: [
      'Updating site theme or featured testimonials.',
      'Publishing a new blog post (or letting AI draft one).',
    ],
    steps: [
      'Set your site colors + logo in Settings → Brand.',
      'Copy the embed snippet onto any existing site if you already have one.',
    ],
    example:
      'A visitor lands on your site at midnight. Chat widget: "Hi! Need same-day service?" — they answer, AI quotes the price, books the slot. You wake up to a confirmed job.',
  },

  customerPortalConsole: {
    title: 'Customer Portal',
    runsAutomatically: [
      'Lets customers self-book, see appointment history, pay invoices, and chat with AI.',
      'Reduces inbound calls by 40-60%.',
      'Available as a public URL or installable app on customer phones.',
    ],
    whenYouStepIn: [
      'Sharing the portal URL with a new customer (or printing the QR code on invoices).',
    ],
    steps: [
      'Copy the Customer Portal URL from Settings → Customer Portal.',
      'Add it to your email signature, SMS templates, and printed materials.',
      'Print the QR code for trucks / business cards.',
    ],
    example:
      'A repeat customer wants to schedule maintenance. Instead of calling, she opens the portal, picks a slot, pays a deposit, and gets a confirmation — all in 90 seconds.',
  },

  aiOperativesHub: {
    title: 'AI Operatives Hub',
    runsAutomatically: [
      'Coordinates all 10 operatives across your 7 consoles.',
      'Hands off conversations between operatives (e.g., Front Desk → Booking → Dispatch).',
      'Logs every action for transparency and override.',
    ],
    whenYouStepIn: [
      'Reviewing handoffs flagged for human approval.',
      'Toggling individual agents on/off.',
    ],
    steps: [
      'Open the Hub to see all 10 operatives at a glance.',
      'Click any operative for live activity, recent decisions, and override controls.',
    ],
    example:
      'A customer chats in. Reception qualifies, hands to Booking which schedules, hands to Dispatch which assigns the tech, hands to Field Ops for check-in. You see the entire chain in the Hub timeline.',
  },

  specialistOperativesConsole: {
    title: 'Specialist Operatives',
    runsAutomatically: [
      'Surfaces industry-specific specialists (diagnostics, permits, listings, menus, reviews) tuned to your industry pack.',
      'Feeds specialist responses with your knowledge base and terminology.',
      'Hides specialists that don\'t apply to your industry so the roster stays focused.',
    ],
    whenYouStepIn: [
      'Testing a prompt before customers or technicians see it in the wild.',
      'Sanity-checking answers on a new specialist you just unlocked.',
    ],
    steps: [
      'Pick a specialist tab that matches the task (Diagnostic, Permit & Code, Listing Writer, etc.).',
      'Click one of the example prompts on the right or type your own.',
      'Review the answer — every reply is grounded in your industry pack.',
    ],
    example:
      'A roofing admin opens Insurance Claim, drops in three storm-damage photos and the loss date, and gets a claim-ready summary in 20 seconds — ready to forward to the carrier.',
  },

  contentEngineConsole: {
    title: 'Content Engine',
    runsAutomatically: [
      'Generates copy, images, and captions across website, social, email, blog, and SMS from one prompt.',
      'Keeps every channel on-brand using your Brand Voice profile.',
      'Tracks how many pieces each channel has generated so you can spot gaps.',
    ],
    whenYouStepIn: [
      'Setting or updating your Brand Voice profile.',
      'Approving a piece before it publishes.',
      'Scheduling a campaign from the calendar view.',
    ],
    steps: [
      'Open Brand Voice and confirm tone, audience, and do-not-say words.',
      'Go to Generate, pick channels, and describe what you want.',
      'Review, tweak, and publish or schedule from the calendar.',
    ],
    example:
      'Type "spring tune-up promo, $89, book by April 30" — the engine drafts a website banner, three social posts with images, an SMS blast, and a blog post in under a minute. You approve all five in one pass.',
  },

  videoConsole: {
    title: 'Video Console',
    runsAutomatically: [
      'Spins up a private Jitsi meeting room on demand — no accounts, no downloads for guests.',
      'Logs every session to Call History with the meeting URL and appointment link.',
      'Marks the linked appointment as in-progress the moment you open the room.',
    ],
    whenYouStepIn: [
      'Starting a video consult with a customer or prospect.',
      'Joining a meeting hosted elsewhere (Zoom, Meet, Jitsi) by pasting the link.',
    ],
    steps: [
      'Click New for a fresh room ID, or reuse a memorable one.',
      'Copy the meeting URL and share it via SMS, email, or the customer portal.',
      'Click Open meeting room to launch — the session is logged automatically.',
    ],
    example:
      'A prospect wants a same-day estimate walkthrough. You spin up a room, text the link, jump on together, share the quote screen, and the whole session shows up in Call History with the appointment attached.',
  },
};
