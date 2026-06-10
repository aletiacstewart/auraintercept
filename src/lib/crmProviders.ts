export type CrmProviderId = "hubspot" | "salesforce" | "zoho" | "pipedrive" | "generic";

export interface CrmProviderField {
  key: string;
  label: string;
  type: "text" | "password";
  placeholder?: string;
  helpText?: string;
  required?: boolean;
}

export interface CrmProviderDef {
  id: CrmProviderId;
  name: string;
  blurb: string;
  authType: "api_key" | "oauth" | "webhook";
  fields: CrmProviderField[];
  instructions: string[];
  docsUrl?: string;
  costNote?: string;
}

export const CRM_PROVIDERS: CrmProviderDef[] = [
  {
    id: "hubspot",
    name: "HubSpot",
    blurb: "Most popular SMB CRM. Two-way contact sync.",
    authType: "api_key",
    docsUrl: "https://app.hubspot.com/private-apps",
    fields: [
      { key: "access_token", label: "Private App Access Token", type: "password", placeholder: "pat-na1-...", required: true, helpText: "Create a Private App in HubSpot with crm.objects.contacts read/write scopes." },
    ],
    instructions: [
      "Sign in to HubSpot → Settings → Integrations → Private Apps.",
      "Click 'Create a private app'. Name it 'Aura Intercept'.",
      "On Scopes, enable: crm.objects.contacts.read, crm.objects.contacts.write.",
      "Click Create app → Show token → Copy the access token.",
      "Paste the token below and click Test connection.",
    ],
    costNote: "Uses your own HubSpot account; HubSpot bills you directly for any paid tier features.",
  },
  {
    id: "salesforce",
    name: "Salesforce",
    blurb: "Enterprise CRM. Pushes Aura leads as Salesforce Leads.",
    authType: "api_key",
    docsUrl: "https://help.salesforce.com/s/articleView?id=sf.connected_app_create.htm",
    fields: [
      { key: "instance_url", label: "Instance URL", type: "text", placeholder: "https://your-domain.my.salesforce.com", required: true },
      { key: "access_token", label: "Access Token", type: "password", required: true, helpText: "From your Connected App OAuth flow." },
    ],
    instructions: [
      "In Salesforce Setup → App Manager, create a Connected App with OAuth scopes: api, refresh_token.",
      "Complete an OAuth flow (or use SFDX login) to obtain an access_token and instance_url.",
      "Paste both values below and click Test connection.",
    ],
    costNote: "Uses your own Salesforce org; Salesforce bills you directly for licenses and API usage.",
  },
  {
    id: "zoho",
    name: "Zoho CRM",
    blurb: "Popular SMB CRM. Two-way contact and lead sync.",
    authType: "api_key",
    docsUrl: "https://www.zoho.com/crm/developer/docs/api/v2/oauth-overview.html",
    fields: [
      { key: "access_token", label: "OAuth Access Token", type: "password", required: true, helpText: "From a Zoho self-client OAuth flow." },
      { key: "dc", label: "Data Center", type: "text", placeholder: "com, eu, in, com.au", helpText: "Defaults to com." },
    ],
    instructions: [
      "Go to https://api-console.zoho.com and create a Self Client.",
      "Generate a grant token with scopes ZohoCRM.modules.ALL.",
      "Exchange the grant token for an access_token + refresh_token.",
      "Paste the access_token and your data center (com/eu/in/com.au) below.",
    ],
    costNote: "Uses your own Zoho CRM account; Zoho bills you directly for licenses.",
  },
  {
    id: "pipedrive",
    name: "Pipedrive",
    blurb: "Sales-focused CRM. Pushes contacts and pulls persons.",
    authType: "api_key",
    docsUrl: "https://pipedrive.readme.io/docs/how-to-find-the-api-token",
    fields: [
      { key: "api_key", label: "API Token", type: "password", required: true, helpText: "From Settings → Personal preferences → API." },
      { key: "domain", label: "Company Domain", type: "text", placeholder: "your-company", helpText: "The subdomain of your Pipedrive URL (e.g. your-company.pipedrive.com)." },
    ],
    instructions: [
      "In Pipedrive, click your avatar → Personal preferences → API.",
      "Copy your personal API token.",
      "Enter your company subdomain (the part before .pipedrive.com).",
      "Paste the values below and click Test connection.",
    ],
    costNote: "Uses your own Pipedrive account; Pipedrive bills you directly for licenses.",
  },
  {
    id: "generic",
    name: "Generic CRM (Webhook)",
    blurb: "Push new leads to any CRM via a webhook endpoint.",
    authType: "webhook",
    fields: [
      { key: "webhook_url", label: "Webhook URL", type: "text", placeholder: "https://your-crm.example.com/webhooks/aura", required: true },
      { key: "webhook_secret", label: "Shared Secret (optional)", type: "password", helpText: "Sent as X-Aura-Signature header for verification." },
    ],
    instructions: [
      "Create an inbound webhook endpoint in your CRM that accepts JSON POSTs.",
      "Aura will POST { event: 'lead.created', lead: { name, email, phone, source, notes } }.",
      "Optionally add a shared secret; Aura sends it in the X-Aura-Signature header.",
      "Paste the URL below and click Test connection.",
    ],
    costNote: "Whatever CRM you point this at — billing comes from that vendor, not Aura.",
  },
];

export const getCrmProvider = (id: CrmProviderId): CrmProviderDef | undefined =>
  CRM_PROVIDERS.find((p) => p.id === id);