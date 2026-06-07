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
    runsAutomatically: [
      'Auto-assigns jobs to the closest / most-skilled tech.',
      'Sends ETA texts to customers automatically.',
      'Triggers check-in/check-out workflows on the tech\'s phone.',
      'Reorders parts when inventory runs low.',
    ],
    whenYouStepIn: [
      'Manually re-assigning a job (sick tech, special-request customer).',
      'Reviewing daily route efficiency.',
    ],
    steps: [
      'Add your technicians in Settings → Team.',
      'Connect Google Calendar (optional but recommended).',
      'Watch the Dispatch board fill itself.',
    ],
    example:
      'A new booking lands at 9 AM. Dispatch sees Tech A is closest with the right skill, auto-assigns the job, texts the customer "Tech A arriving 10:15 AM", and updates the route map. You didn\'t touch a thing.',
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
    title: 'Outreach & Sales Console',
    runsAutomatically: [
      'Sends follow-up emails/SMS to leads who didn\'t book.',
      'Re-engages dormant customers (e.g., "it\'s been 6 months since your tune-up").',
      'Generates and sends quotes from chat conversations.',
    ],
    whenYouStepIn: [
      'Reviewing high-value quotes before they go out (optional approval gate).',
    ],
    steps: [
      'Set re-engagement schedule (default: 30/60/90/180 days).',
      'Approve quote templates.',
    ],
    example:
      'A lead got a $4,800 quote 2 weeks ago and went silent. The AI sends a friendly nudge: "Hey Sarah — still considering the install? We have an opening Thursday and a $200 spring rebate." She books.',
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
    runsAutomatically: [
      'Generates invoices and sends them automatically when a job completes.',
      'Tracks payments and follows up on overdue invoices.',
      'Forecasts revenue and staffing needs from past data.',
    ],
    whenYouStepIn: [
      'Approving an invoice over a threshold you set.',
      'Reviewing the monthly forecast.',
    ],
    steps: [
      'Connect Stripe in Settings → Integrations.',
      'Set invoice template and approval thresholds.',
    ],
    example:
      'Tech finishes a job at 4 PM, taps "Complete" on his phone. Invoice auto-generates, gets emailed to the customer, payment hits Stripe by 5 PM. You see the cash in your dashboard.',
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
};
