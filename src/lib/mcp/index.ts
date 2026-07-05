import { auth, defineMcp } from "@lovable.dev/mcp-js";
import whoamiTool from "./tools/whoami";
import listLeadsTool from "./tools/list-leads";
import listAppointmentsTool from "./tools/list-appointments";
import searchCustomersTool from "./tools/list-customers";

// See ai-intercept OAuth notes: mcp-js requires the direct supabase.co issuer
// (never a lovable proxy), and the project ref must be a build-time literal so
// the entry stays import-safe during manifest extraction and cold start.
const projectRef = import.meta.env.VITE_SUPABASE_PROJECT_ID ?? "project-ref-unset";

export default defineMcp({
  name: "aura-intercept-mcp",
  title: "Aura Intercept",
  version: "0.1.0",
  instructions:
    "Read tools for the signed-in Aura Intercept user's workspace. Use `whoami` to confirm identity, `list_leads` for recent leads, `list_upcoming_appointments` for scheduled jobs, and `search_customers` to look up a customer by name, email, or phone.",
  auth: auth.oauth.issuer({
    issuer: `https://${projectRef}.supabase.co/auth/v1`,
    acceptedAudiences: "authenticated",
  }),
  tools: [whoamiTool, listLeadsTool, listAppointmentsTool, searchCustomersTool],
});