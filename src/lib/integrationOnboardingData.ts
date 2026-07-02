/**
 * Step-by-step onboarding data for every 3rd-party integration a company
 * needs to set up. Each provider is owned by the CUSTOMER on their own
 * account with their own credit card. Aura Intercept never resells, marks
 * up, or marks up third-party usage.
 */

export interface OnboardingStep {
  title: string;
  detail: string;
  screenshotHint?: string;
}

export interface IntegrationProvider {
  id: string;
  name: string;
  purpose: string;
  whyNeeded: string;
  estTime: string;
  estCost: string;
  signupUrl: string;
  prereqs: string[];
  steps: OnboardingStep[];
  whatToPasteBack: string[];
  verification: string[];
}

export const POLICY_BANNER =
  'Each provider listed here is billed directly to the customer on the ' +
  "customer's own credit card. Aura Intercept never resells, marks up, " +
  'or marks up third-party usage. The Aura plan fee is a platform-only ' +
  'subscription and is invoiced separately from any provider below.';

export const INTEGRATION_PROVIDERS: IntegrationProvider[] = [
  {
    id: 'stripe',
    name: 'Stripe (Customer Payments)',
    purpose: 'Accept card payments from the company\'s own end customers.',
    whyNeeded:
      'Aura uses Stripe to invoice the company\'s customers, run subscriptions, and capture deposits booked through the AI agents.',
    estTime: '20-40 minutes',
    estCost: '2.9% + $0.30 per successful charge (Stripe standard, billed by Stripe directly)',
    signupUrl: 'https://dashboard.stripe.com/register',
    prereqs: [
      'Legal business name and EIN / tax ID',
      'Business bank account routing + account number',
      'Owner / principal ID for KYC',
    ],
    steps: [
      {
        title: 'Create the Stripe account',
        detail: 'Sign up at dashboard.stripe.com/register using the company\'s primary admin email (not a personal email).',
      },
      {
        title: 'Complete business profile',
        detail: 'Enter legal business name, EIN, address, support phone, business website, and product description ("Aura Intercept AI receptionist and field service software").',
      },
      {
        title: 'Add bank account for payouts',
        detail: 'Settings -> Payouts -> Bank accounts -> Add. Verify with micro-deposits if requested.',
      },
      {
        title: 'Activate the account',
        detail: 'Submit identity documents for the principal owner. Wait for "Activated" badge on the dashboard home.',
      },
      {
        title: 'Generate API keys',
        detail: 'Developers -> API keys. Copy the Publishable key and reveal + copy a Restricted key (recommended) or the Secret key.',
        screenshotHint: 'Stripe Dashboard -> Developers -> API keys panel showing both keys.',
      },
    ],
    whatToPasteBack: [
      'Publishable key (pk_live_...)',
      'Secret or restricted key (sk_live_... / rk_live_...)',
      'Stripe Account ID (acct_...) shown under Settings -> Account details',
    ],
    verification: [
      'Account shows "Activated" in Stripe dashboard',
      'Test charge of $1 succeeds from Aura admin',
      'Payout schedule visible in Stripe -> Payouts',
    ],
  },
  {
    id: 'signalwire',
    name: 'SignalWire (Voice + SMS Telephony)',
    purpose: 'Phone numbers, inbound call routing, SMS delivery, and the PSTN bridge that connects callers to the ElevenLabs voice AI.',
    whyNeeded:
      'Every inbound call and outbound SMS rides on SignalWire. Without it the AI receptionist cannot answer the phone.',
    estTime: '30-60 minutes (plus 1-3 weeks for A2P 10DLC approval)',
    estCost: 'Phone number $1-3/mo, voice ~$0.0095/min, SMS ~$0.0079/segment, A2P 10DLC brand $4 one-time + campaign $10/mo (billed by SignalWire and carriers)',
    signupUrl: 'https://signalwire.com/signup',
    prereqs: [
      'Valid credit card',
      'Legal business name, EIN, and address (for 10DLC)',
      'Sample SMS messages and opt-in language',
    ],
    steps: [
      {
        title: 'Create SignalWire space',
        detail: 'Sign up at signalwire.com/signup. Pick a Space name like {company}-aura. The full Space URL will be {space}.signalwire.com.',
      },
      {
        title: 'Add payment method',
        detail: 'Billing -> Payment methods -> Add card. Add at least $20 starter credit.',
      },
      {
        title: 'Buy a phone number',
        detail: 'Phone Numbers -> Buy a number -> filter by area code -> select Voice + SMS capable -> Purchase.',
        screenshotHint: 'SignalWire Phone Numbers search results with Voice/SMS checkboxes.',
      },
      {
        title: 'Generate API credentials',
        detail: 'API -> Credentials -> Show / Copy Project ID and API Token. Note the Space URL too.',
      },
      {
        title: 'Submit A2P 10DLC brand',
        detail: 'Messaging -> 10DLC -> Register Brand. Enter EIN, legal name, vertical, website. Expect 1-3 day approval.',
      },
      {
        title: 'Submit A2P 10DLC campaign',
        detail: 'After brand approval, register a campaign (use case: Customer Care or Mixed). Paste sample messages and opt-in flow. Expect 1-2 weeks for carrier approval.',
      },
      {
        title: 'Wire the webhook URL',
        detail: 'Aura admin will generate the inbound webhook URL. In SignalWire, edit the phone number -> set Voice handler to the Aura URL using POST.',
      },
    ],
    whatToPasteBack: [
      'Project ID (UUID)',
      'API Token',
      'Space URL ({space}.signalwire.com)',
      'Purchased phone number in E.164 format (+15551234567)',
    ],
    verification: [
      'Inbound test call answered by Aura voice AI',
      'Outbound SMS test delivered',
      '10DLC campaign status = Approved',
    ],
  },
  {
    id: 'elevenlabs',
    name: 'ElevenLabs (Voice AI Brain)',
    purpose: 'Conversational AI, text-to-speech, and the client-tools that let Aura book appointments, look up jobs, and navigate the UI by voice.',
    whyNeeded:
      'ElevenLabs powers the actual conversation. SignalWire is the phone line; ElevenLabs is the voice and the brain.',
    estTime: '30-45 minutes',
    estCost: 'Creator $22/mo or Pro $99/mo recommended; usage billed by ElevenLabs per minute',
    signupUrl: 'https://elevenlabs.io/sign-up',
    prereqs: [
      'Valid credit card',
      'Decided which voice persona to use',
    ],
    steps: [
      {
        title: 'Create ElevenLabs account',
        detail: 'Sign up at elevenlabs.io/sign-up using the company admin email.',
      },
      {
        title: 'Select and pay for a plan',
        detail: 'Subscription -> pick Creator (lower volume) or Pro. Add card. Plans renew monthly.',
      },
      {
        title: 'Create a Conversational AI agent',
        detail: 'Conversational AI -> Agents -> Create agent. Name it for the company (e.g. "Acme HVAC Front Desk"). Pick a voice.',
        screenshotHint: 'ElevenLabs Conversational AI -> Agents list.',
      },
      {
        title: 'Configure client tools',
        detail: 'In the agent settings, enable the client tools Aura expects (booking, navigation, lookups). Aura will provide the exact tool names and JSON schemas. Paste the copyable wait-constraint values exactly as given.',
      },
      {
        title: 'Copy the Agent ID',
        detail: 'Inside the agent page, copy the Agent ID from the URL or the top of the page.',
      },
      {
        title: 'Create API key',
        detail: 'Profile -> API Keys -> Create new key. Scope: Conversational AI + Text-to-Speech. Copy the key once shown.',
      },
    ],
    whatToPasteBack: [
      'Agent ID',
      'API Key',
      'Selected voice ID',
    ],
    verification: [
      'Test conversation from the ElevenLabs widget responds with the correct persona',
      'Test client tool fires (e.g. "book me an appointment") and shows up in Aura logs',
      'Voice answers a real SignalWire inbound call end-to-end',
    ],
  },
  {
    id: 'resend',
    name: 'Resend (Transactional + Marketing Email)',
    purpose: 'Sends all outbound email: confirmations, receipts, follow-ups, marketing campaigns.',
    whyNeeded:
      'Email confirmations and quotes need a verified sending domain so messages do not land in spam.',
    estTime: '20-30 minutes (plus DNS propagation up to 24h)',
    estCost: 'Free up to 3,000 emails/mo, then $20/mo for 50k. Billed by Resend.',
    signupUrl: 'https://resend.com/signup',
    prereqs: [
      'Access to the DNS zone for the sending domain (e.g. company.com)',
      'Valid credit card if expecting >3,000 emails/mo',
    ],
    steps: [
      {
        title: 'Create Resend account',
        detail: 'Sign up at resend.com/signup with the company admin email.',
      },
      {
        title: 'Add and verify domain',
        detail: 'Domains -> Add Domain -> enter sending domain. Resend will show 3 DNS records (SPF TXT, DKIM TXT, MX or return-path).',
        screenshotHint: 'Resend Domains page showing the 3 required DNS records.',
      },
      {
        title: 'Add DNS records at the registrar',
        detail: 'At the DNS provider (Cloudflare, GoDaddy, Route53, etc.) add each record exactly as shown. Wait 5-60 minutes, then click Verify.',
      },
      {
        title: 'Add payment method',
        detail: 'Settings -> Billing -> Add card. Skip if staying under free tier.',
      },
      {
        title: 'Generate API key',
        detail: 'API Keys -> Create API key. Permission: Full access. Name: aura-intercept. Copy the key once.',
      },
    ],
    whatToPasteBack: [
      'API Key (re_...)',
      'Verified sending domain',
      'Default From address (e.g. hello@company.com)',
    ],
    verification: [
      'Domain status = Verified in Resend',
      'Test email from Aura admin lands in inbox (not spam)',
      'SPF + DKIM pass in the email header check',
    ],
  },
  {
    id: 'tavily',
    name: 'Tavily (Web Search for Operatives)',
    purpose: 'Real-time web search used by the Research and Marketing operatives.',
    whyNeeded:
      'Without Tavily the AI cannot fetch current pricing, competitor info, or local market data.',
    estTime: '5-10 minutes',
    estCost: 'Free tier 1,000 searches/mo, paid plans from $30/mo. Billed by Tavily.',
    signupUrl: 'https://tavily.com',
    prereqs: ['Valid credit card if exceeding free tier'],
    steps: [
      {
        title: 'Create Tavily account',
        detail: 'Sign up at tavily.com using the company admin email.',
      },
      {
        title: 'Add payment method (optional)',
        detail: 'Skip if usage stays under 1,000 searches/mo. Otherwise Billing -> Add card.',
      },
      {
        title: 'Copy API key',
        detail: 'Dashboard -> API Keys -> copy the default key (tvly-...).',
      },
    ],
    whatToPasteBack: ['API Key (tvly-...)'],
    verification: ['Test search from Research operative returns results'],
  },
  {
    id: 'google-oauth',
    name: 'Google Account + Calendar OAuth',
    purpose: 'Two-way calendar sync — works with any free Google account.',
    whyNeeded:
      'Booking confirmation events land on the technician\'s real Google Calendar. No paid Google Workspace subscription is required — a free Google account works.',
    estTime: '15-30 minutes (first time)',
    estCost: 'Free. Uses Google Calendar OAuth on any free Google account. No Google Workspace plan required.',
    signupUrl: 'https://console.cloud.google.com',
    prereqs: [
      'Any free Google account (Workspace not required)',
      'Verified ownership of the sending domain',
    ],
    steps: [
      {
        title: 'Create a Google Cloud project',
        detail: 'console.cloud.google.com -> top bar -> New Project. Name it "Aura Intercept - {company}".',
      },
      {
        title: 'Enable required APIs',
        detail: 'APIs & Services -> Library -> enable: Google Calendar API, Gmail API, Google Drive API, People API.',
      },
      {
        title: 'Configure OAuth consent screen',
        detail: 'APIs & Services -> OAuth consent screen -> External -> fill app name, support email, logo, authorized domain (auraintercept.ai), developer contact.',
        screenshotHint: 'OAuth consent screen branding tab.',
      },
      {
        title: 'Add scopes',
        detail: 'Add: openid, email, profile, calendar, calendar.events, gmail.send, drive.file.',
      },
      {
        title: 'Create OAuth Client ID',
        detail: 'Credentials -> Create Credentials -> OAuth client ID -> Web application. Authorized JavaScript origins: https://auraintercept.ai and the company\'s custom domain. Authorized redirect URIs: https://auraintercept.ai/auth/google/callback (exact list provided by Aura admin).',
        screenshotHint: 'OAuth Client ID creation page showing origins + redirect URIs.',
      },
      {
        title: 'Copy Client ID and Secret',
        detail: 'Copy both values immediately. Store securely.',
      },
      {
        title: 'Submit for verification (if external)',
        detail: 'If the app will be used by users outside the Workspace, submit to Google for verification. Allow 1-4 weeks.',
      },
    ],
    whatToPasteBack: ['OAuth Client ID', 'OAuth Client Secret', 'Authorized domain'],
    verification: [
      'Test user can complete the consent flow without "unverified app" warning (or accept it for internal use)',
      'Test event created from Aura appears on the Google Calendar within 1 minute',
    ],
  },
  {
    id: 'social-oauth',
    name: 'Social Media OAuth Apps',
    purpose: 'Auto-post from the Content Engine to the company\'s social accounts.',
    whyNeeded:
      'Without OAuth apps the Content Engine can only generate content, not publish it.',
    estTime: '2-4 hours total across all networks',
    estCost: 'Free for developer apps. Ad spend billed by each network.',
    signupUrl: 'https://developers.facebook.com',
    prereqs: [
      'Admin access to each social account (Facebook Page, Instagram Business, LinkedIn Company, X account, TikTok Business, YouTube channel)',
      'Verified business identity on Facebook for Instagram posting',
    ],
    steps: [
      {
        title: 'Facebook + Instagram (Meta)',
        detail: 'developers.facebook.com -> My Apps -> Create App -> Business type. Add products: Facebook Login, Instagram Graph API. App Review required for pages_manage_posts, instagram_content_publish.',
      },
      {
        title: 'LinkedIn',
        detail: 'linkedin.com/developers -> Create app -> attach to LinkedIn Company Page. Request access to "Share on LinkedIn" and "Marketing Developer Platform".',
      },
      {
        title: 'X (Twitter)',
        detail: 'developer.x.com -> Projects & Apps -> create app -> upgrade to Basic plan ($100/mo) for write access. Generate OAuth 2.0 keys.',
      },
      {
        title: 'TikTok',
        detail: 'developers.tiktok.com -> Manage Apps -> Create -> request Content Posting API scope.',
      },
      {
        title: 'YouTube',
        detail: 'Reuse the same Google Cloud project from Google OAuth step. Enable YouTube Data API v3. Add scope youtube.upload.',
      },
      {
        title: 'Manual fallback',
        detail: 'Any network the company does not want to OAuth can use the manual publish flow inside Aura (copy caption + download asset, post manually).',
      },
    ],
    whatToPasteBack: [
      'Per network: App / Client ID + Client Secret + redirect URI confirmation',
    ],
    verification: [
      'Test post from Content Engine appears on the live feed for each connected network',
    ],
  },
  {
    id: 'custom-domain',
    name: 'Custom Domain (Smart Website + Email)',
    purpose: 'Use the company\'s own domain for the public Smart Website and email From address.',
    whyNeeded:
      'Customers should see company.com, not a Lovable preview URL.',
    estTime: '15-30 minutes (plus DNS propagation up to 24h)',
    estCost: 'Domain registration billed by registrar (typically $10-20/yr).',
    signupUrl: 'https://www.namecheap.com',
    prereqs: ['Owned domain and access to its DNS zone'],
    steps: [
      {
        title: 'Add the domain in Aura admin',
        detail: 'Settings -> Smart Website -> Custom Domain -> enter the apex or subdomain. Aura will show a CNAME target and a TXT verification record.',
      },
      {
        title: 'Add the CNAME record',
        detail: 'At the registrar (Cloudflare, GoDaddy, Namecheap, Route53) add a CNAME for the chosen host pointing to the value shown by Aura. Use a subdomain like www or app.',
      },
      {
        title: 'Add the TXT verification record',
        detail: 'Add a TXT record with the exact name and value Aura provides. This proves ownership.',
      },
      {
        title: 'Wait for verification',
        detail: 'DNS can take 5 minutes to 24 hours. Aura admin will flip the status to Verified automatically.',
      },
    ],
    whatToPasteBack: ['Final published domain (e.g. https://www.company.com)'],
    verification: [
      'Smart Website loads on the custom domain with valid HTTPS certificate',
      'No mixed-content or cert warnings in the browser',
    ],
  },
];