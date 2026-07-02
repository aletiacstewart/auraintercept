// Section/field metadata used to render the printable onboarding workbook PDF.
// Mirrors the structure of CompanyOnboardingForm so the printed copy matches
// what the company will fill in online.

export interface WorkbookField {
  label: string;
  hint?: string;
  lines?: number; // how many ruled lines to render for the answer (default 1)
}

export interface WorkbookSection {
  title: string;
  intro?: string;
  fields: WorkbookField[];
}

export const WORKBOOK_SECTIONS: WorkbookSection[] = [
  {
    title: '1. Business Profile',
    intro: 'Tell us who you are so Aura can introduce your business correctly on every channel.',
    fields: [
      { label: 'Legal business name' },
      { label: 'DBA / brand name (if different)' },
      { label: 'Primary industry / vertical' },
      { label: 'Years in business' },
      { label: 'Website URL' },
      { label: 'Short company description (one paragraph)', lines: 4 },
      { label: 'Service area (cities / ZIP codes)', lines: 2 },
    ],
  },
  {
    title: '2. Contact Routing',
    intro: 'Where should Aura send leads, missed calls, and after-hours messages?',
    fields: [
      { label: 'Main business phone number' },
      { label: 'Main business email' },
      { label: 'Owner / decision-maker name + email' },
      { label: 'Billing contact name + email' },
      { label: 'After-hours escalation contact + phone' },
    ],
  },
  {
    title: '3. Business Hours & Holidays',
    intro: 'Aura answers 24/7 but uses these hours to decide what counts as "after hours".',
    fields: [
      { label: 'Monday – Friday hours' },
      { label: 'Saturday hours' },
      { label: 'Sunday hours' },
      { label: 'Holiday closures (list dates)', lines: 3 },
    ],
  },
  {
    title: '4. Services & Pricing',
    intro: 'List the services Aura should be able to quote, book, and explain to customers.',
    fields: [
      { label: 'Top 5 services with typical price range', lines: 6 },
      { label: 'Common service add-ons / upsells', lines: 3 },
      { label: 'Services we do NOT offer (so Aura can decline politely)', lines: 3 },
    ],
  },
  {
    title: '5. Team & Technicians',
    intro: 'Who will Aura dispatch jobs and messages to?',
    fields: [
      { label: 'Number of field technicians / staff' },
      { label: 'Names + roles + cell numbers (one per line)', lines: 6 },
      { label: 'Dispatcher / office manager name + email' },
    ],
  },
  {
    title: '6. Integrations & Accounts',
    intro: 'These providers require YOUR OWN ACCOUNT and a valid credit card on file — each provider invoices you directly and separately from your Aura plan fee. Concierge Onboarding configures them on your behalf using your logins. Do NOT paste API keys or passwords into this workbook; we collect secrets in a secure kickoff session.',
    fields: [
      { label: 'SignalWire account email (voice/SMS)' },
      { label: 'ElevenLabs account email (voice cloning)' },
      { label: 'Resend account email (transactional email)' },
      { label: 'Tavily account email (web search)' },
      { label: 'Stripe account email (payments)' },
      { label: 'A2P 10DLC brand/EIN ready? (yes / no)' },
      { label: 'Google account for Calendar (free, OAuth — no signup fee, no card)' },
      { label: 'Social media handles + admin access (Facebook, Instagram, LinkedIn, TikTok)', lines: 3 },
    ],
  },
  {
    title: '7. Authorization & Signature',
    intro: 'By signing below you authorize Aura Intercept to configure the accounts listed above on your behalf and confirm the information provided is accurate.',
    fields: [
      { label: 'Signer full name' },
      { label: 'Title' },
      { label: 'Date' },
      { label: 'Signature', lines: 2 },
    ],
  },
];
