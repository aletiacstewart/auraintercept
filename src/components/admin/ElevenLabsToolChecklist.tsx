import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Copy, Check, ExternalLink, Wrench } from "lucide-react";
import { AURA_INTERCEPT_VOICE_PROMPT } from "@/lib/auraInterceptSalesPrompt";

const TOOL_NAME = "send_walkthrough_demo";

const TOOL_DESCRIPTION = `Send the caller a personalized, industry-matched live walkthrough demo of Aura via SMS + email. You MUST first capture: industry (map to one of the allowed enum values), full name, mobile phone (E.164 preferred, e.g. +15125551234), and email. Confirm each field back to the caller before calling this tool. After the tool returns, read the 'spoken' field VERBATIM. If the response is { ok: false, reason: 'industry_unavailable' }, politely decline self-serve demo and offer a human follow-up.`;

const PARAM_SCHEMA = {
  type: "object",
  properties: {
    industry: {
      type: "string",
      description: "Caller's industry, mapped to one of the allowed values.",
      enum: [
        "hvac", "plumbing", "electrical", "roofing", "solar",
        "landscape", "pool_spa", "pest_control", "appliance_repair",
        "handyman", "construction", "auto_care", "security_systems",
        "real_estate", "beauty_wellness", "restaurants",
        "personal_assistant", "fencing", "other"
      ]
    },
    name: { type: "string", description: "Caller's full name." },
    phone: { type: "string", description: "Mobile phone in E.164 format, e.g. +15125551234." },
    email: { type: "string", description: "Caller's email address." },
    company_name: { type: "string", description: "Optional business name." }
  },
  required: ["industry", "name", "phone", "email"]
};

const SYSTEM_PROMPT_SNIPPET = `When the caller wants to see Aura in action, a demo, or a walkthrough:
1. Ask for their industry. Map to one of: hvac, plumbing, electrical, roofing, solar, landscape, pool_spa, pest_control, appliance_repair, handyman, construction, auto_care, security_systems, real_estate, beauty_wellness, restaurants, personal_assistant, fencing, other.
2. Ask for their full name.
3. Ask for their mobile number (confirm digits, format as E.164 like +15125551234).
4. Ask for their email (spell back to confirm).
5. Call the client tool send_walkthrough_demo with { industry, name, phone, email, company_name? }.
6. Read the returned 'spoken' field VERBATIM. Do not paraphrase.
If the response is { ok: false, reason: 'industry_unavailable' }, apologize and offer a human follow-up instead.`;

function CopyButton({ text, label }: { text: string; label: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <Button
      size="sm"
      variant="outline"
      onClick={async () => {
        await navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 1500);
      }}
      className="gap-1"
    >
      {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
      {copied ? "Copied" : label}
    </Button>
  );
}

export function ElevenLabsToolChecklist() {
  return (
    <Card className="border-primary/20 bg-card/60 backdrop-blur-sm">
      <CardHeader>
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <Wrench className="h-5 w-5 text-primary" />
            <CardTitle>ElevenLabs Setup: <code className="text-primary">send_walkthrough_demo</code></CardTitle>
          </div>
          <Badge variant="outline" className="border-primary/30 text-primary">Manual dashboard step</Badge>
        </div>
        <CardDescription>
          Register this as a Client Tool on the Aura agent in the ElevenLabs dashboard. Without it, voice callers can't request a live walkthrough demo.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        <ol className="list-decimal list-inside space-y-2 text-sm text-muted-foreground">
          <li>Open the Aura agent in ElevenLabs → <strong>Tools</strong> → <strong>Add tool</strong> → <strong>Client Tool</strong>.</li>
          <li>Set <strong>Name</strong> to <code className="text-primary">{TOOL_NAME}</code>.</li>
          <li>Paste the <strong>Description</strong> below.</li>
          <li>Paste the <strong>Parameter Schema</strong> (JSON) below.</li>
          <li>Append the <strong>System Prompt</strong> snippet below to the agent's existing prompt.</li>
          <li>Save the agent, then test on <a href="/talk-to-aura" className="text-primary underline">/talk-to-aura</a>.</li>
        </ol>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs uppercase tracking-wider text-muted-foreground">Tool Name</span>
            <CopyButton text={TOOL_NAME} label="Copy" />
          </div>
          <pre className="text-xs bg-muted/40 border border-border rounded p-2 overflow-x-auto">{TOOL_NAME}</pre>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs uppercase tracking-wider text-muted-foreground">Description</span>
            <CopyButton text={TOOL_DESCRIPTION} label="Copy description" />
          </div>
          <pre className="text-xs bg-muted/40 border border-border rounded p-2 overflow-x-auto whitespace-pre-wrap">{TOOL_DESCRIPTION}</pre>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs uppercase tracking-wider text-muted-foreground">Parameter Schema (JSON)</span>
            <CopyButton text={JSON.stringify(PARAM_SCHEMA, null, 2)} label="Copy JSON" />
          </div>
          <pre className="text-xs bg-muted/40 border border-border rounded p-2 overflow-x-auto">{JSON.stringify(PARAM_SCHEMA, null, 2)}</pre>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs uppercase tracking-wider text-muted-foreground">System Prompt Append</span>
            <CopyButton text={SYSTEM_PROMPT_SNIPPET} label="Copy prompt" />
          </div>
          <pre className="text-xs bg-muted/40 border border-border rounded p-2 overflow-x-auto whitespace-pre-wrap">{SYSTEM_PROMPT_SNIPPET}</pre>
        </div>

        <div className="flex flex-wrap gap-2 pt-2 border-t border-border">
          <Button asChild size="sm" variant="outline" className="gap-1">
            <a href="https://elevenlabs.io/app/conversational-ai" target="_blank" rel="noreferrer">
              <ExternalLink className="h-3 w-3" /> Open ElevenLabs Agents
            </a>
          </Button>
          <Button asChild size="sm" variant="outline" className="gap-1">
            <a href="/talk-to-aura" target="_blank" rel="noreferrer">
              <ExternalLink className="h-3 w-3" /> Test on /talk-to-aura
            </a>
          </Button>
        </div>

        <div className="space-y-2 pt-4 border-t border-border">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div>
              <h4 className="text-sm font-semibold text-primary">Talk to Aura — Sales Prompt</h4>
              <p className="text-xs text-muted-foreground">
                Paste this as the system prompt on the Aura Intercept ElevenLabs agent
                (the one used by the website voice widget and inbound phone number).
                Aura Intercept only — customer companies use their own per-company prompts.
              </p>
            </div>
            <CopyButton text={AURA_INTERCEPT_VOICE_PROMPT} label="Copy voice prompt" />
          </div>
          <pre className="text-xs bg-muted/40 border border-border rounded p-2 overflow-x-auto whitespace-pre-wrap max-h-72">{AURA_INTERCEPT_VOICE_PROMPT}</pre>
        </div>
      </CardContent>
    </Card>
  );
}

export default ElevenLabsToolChecklist;