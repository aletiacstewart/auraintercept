import {
  Calendar,
  Cloud,
  Apple,
  MessageSquare,
  Hash,
  Webhook,
  Phone,
  Mail,
  ShieldOff,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

export type HealthcareIntegrationKey =
  | "google_calendar"
  | "ms_calendar"
  | "apple_calendar"
  | "twilio_byo"
  | "slack"
  | "ms_teams"
  | "frontdesk_webhook"
  | "mailchimp_recall"
  | "constant_contact_recall";

export interface HealthcareIntegrationDef {
  key: HealthcareIntegrationKey;
  label: string;
  description: string;
  scope: "calendar" | "messaging" | "telephony" | "webhook" | "recall_export";
  icon: LucideIcon;
  fields: Array<{
    name: string;
    label: string;
    type: "text" | "password" | "url";
    placeholder?: string;
    required?: boolean;
    helper?: string;
  }>;
}

export const HEALTHCARE_INTEGRATIONS: HealthcareIntegrationDef[] = [
  {
    key: "google_calendar",
    label: "Google Calendar",
    description: "Two-way sync of Aura-booked appointments with the practice's Google Calendar.",
    scope: "calendar",
    icon: Calendar,
    fields: [],
  },
  {
    key: "ms_calendar",
    label: "Microsoft 365 / Outlook Calendar",
    description: "Sync appointments to the practice's Outlook calendar.",
    scope: "calendar",
    icon: Cloud,
    fields: [],
  },
  {
    key: "apple_calendar",
    label: "Apple / iCloud Calendar (CalDAV)",
    description: "One-way push of new appointments to iCloud via CalDAV.",
    scope: "calendar",
    icon: Apple,
    fields: [
      { name: "caldav_url", label: "CalDAV URL", type: "url", required: true, placeholder: "https://caldav.icloud.com/..." },
      { name: "username", label: "Apple ID", type: "text", required: true },
      { name: "app_password", label: "App-Specific Password", type: "password", required: true, helper: "Generate at appleid.apple.com" },
    ],
  },
  {
    key: "twilio_byo",
    label: "Twilio (Bring Your Own Number)",
    description: "Send SMS through the practice's own Twilio account instead of the bundled number.",
    scope: "telephony",
    icon: Phone,
    fields: [
      { name: "account_sid", label: "Account SID", type: "text", required: true },
      { name: "auth_token", label: "Auth Token", type: "password", required: true },
      { name: "from_number", label: "From Number (E.164)", type: "text", required: true, placeholder: "+15551234567" },
    ],
  },
  {
    key: "slack",
    label: "Slack",
    description: "Post new appointments and insurance verification requests to a Slack channel.",
    scope: "messaging",
    icon: Hash,
    fields: [
      { name: "webhook_url", label: "Incoming Webhook URL", type: "url", required: true, placeholder: "https://hooks.slack.com/services/..." },
    ],
  },
  {
    key: "ms_teams",
    label: "Microsoft Teams",
    description: "Post new appointments and insurance verification requests to a Teams channel.",
    scope: "messaging",
    icon: MessageSquare,
    fields: [
      { name: "webhook_url", label: "Incoming Webhook URL", type: "url", required: true },
    ],
  },
  {
    key: "frontdesk_webhook",
    label: "Front-Desk Webhook",
    description: "Generic POST endpoint for booking and insurance events. Wire to Zapier, Make, n8n, or your own inbox.",
    scope: "webhook",
    icon: Webhook,
    fields: [
      { name: "webhook_url", label: "Endpoint URL", type: "url", required: true },
      { name: "shared_secret", label: "Shared Secret (optional)", type: "password", helper: "Sent as X-Aura-Signature header" },
    ],
  },
  {
    key: "mailchimp_recall",
    label: "Mailchimp (Recall List Export)",
    description: "Export opted-in patients (name + email + last visit date only — no PHI) for recall campaigns.",
    scope: "recall_export",
    icon: Mail,
    fields: [
      { name: "api_key", label: "Mailchimp API Key", type: "password", required: true },
      { name: "list_id", label: "Audience / List ID", type: "text", required: true },
    ],
  },
  {
    key: "constant_contact_recall",
    label: "Constant Contact (Recall List Export)",
    description: "Export opted-in patients (name + email + last visit date only — no PHI) for recall campaigns.",
    scope: "recall_export",
    icon: Mail,
    fields: [
      { name: "api_key", label: "Constant Contact API Key", type: "password", required: true },
      { name: "list_id", label: "List ID", type: "text", required: true },
    ],
  },
];

/**
 * Explicit blocklist — these are healthcare integrations we DO NOT support
 * because the platform's scope is appointments + insurance email only
 * (no PMS / EHR / clearinghouse / pharmacy / lab).
 */
export const HEALTHCARE_INTEGRATIONS_OUT_OF_SCOPE = [
  { key: "dentrix", label: "Dentrix" },
  { key: "eaglesoft", label: "Eaglesoft" },
  { key: "open_dental", label: "Open Dental" },
  { key: "epic", label: "Epic" },
  { key: "athenahealth", label: "athenahealth" },
  { key: "drchrono", label: "DrChrono" },
  { key: "practice_fusion", label: "Practice Fusion" },
  { key: "nea", label: "NEA / FastAttach" },
  { key: "dental_xchange", label: "DentalXChange" },
  { key: "surescripts", label: "Surescripts" },
] as const;

export const OUT_OF_SCOPE_REASON =
  "Aura is scoped to appointments + insurance verification emails only. " +
  "Connections to practice-management, EHR, clearinghouse, pharmacy, or lab systems are out of scope.";