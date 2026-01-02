import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Badge } from '@/components/ui/badge';
import { ExternalLink, Info, CheckCircle2 } from 'lucide-react';

export function CRMSetupGuides() {
  return (
    <div className="space-y-6">
      {/* Optional Note */}
      <Alert className="border-blue-500/30 bg-blue-500/5">
        <Info className="h-4 w-4 text-blue-500" />
        <AlertDescription className="text-sm">
          <strong>CRM integrations are optional.</strong> You can use the platform without connecting a CRM. 
          Connect your CRM only if you want to sync customer data, leads, deals, and activities between systems.
        </AlertDescription>
      </Alert>

      {/* HubSpot Setup Guide */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-orange-500 flex items-center justify-center text-xl">
              🟠
            </div>
            <div>
              <CardTitle className="text-lg">HubSpot Setup Guide</CardTitle>
              <CardDescription>Marketing, sales, and service platform</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Accordion type="single" collapsible className="w-full">
            <AccordionItem value="step-1">
              <AccordionTrigger className="text-sm">
                <span className="flex items-center gap-2">
                  <Badge variant="outline" className="rounded-full px-2 py-0.5 text-xs">1</Badge>
                  Create a Private App in HubSpot
                </span>
              </AccordionTrigger>
              <AccordionContent className="text-sm text-muted-foreground space-y-3">
                <ol className="list-decimal list-inside space-y-2">
                  <li>Log in to your HubSpot account</li>
                  <li>Navigate to <strong>Settings → Integrations → Private Apps</strong></li>
                  <li>Click <strong>"Create a private app"</strong></li>
                  <li>Give your app a name (e.g., "AI Booking Platform")</li>
                </ol>
                <a 
                  href="https://app.hubspot.com/settings" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-primary hover:underline"
                >
                  Open HubSpot Settings <ExternalLink className="w-3 h-3" />
                </a>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="step-2">
              <AccordionTrigger className="text-sm">
                <span className="flex items-center gap-2">
                  <Badge variant="outline" className="rounded-full px-2 py-0.5 text-xs">2</Badge>
                  Configure Scopes
                </span>
              </AccordionTrigger>
              <AccordionContent className="text-sm text-muted-foreground space-y-3">
                <p>Under the <strong>Scopes</strong> tab, enable the following permissions:</p>
                <ul className="list-disc list-inside space-y-1 ml-2">
                  <li><code className="bg-muted px-1 rounded">crm.objects.contacts.read</code></li>
                  <li><code className="bg-muted px-1 rounded">crm.objects.contacts.write</code></li>
                  <li><code className="bg-muted px-1 rounded">crm.objects.deals.read</code></li>
                  <li><code className="bg-muted px-1 rounded">crm.objects.deals.write</code></li>
                  <li><code className="bg-muted px-1 rounded">crm.objects.companies.read</code></li>
                </ul>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="step-3">
              <AccordionTrigger className="text-sm">
                <span className="flex items-center gap-2">
                  <Badge variant="outline" className="rounded-full px-2 py-0.5 text-xs">3</Badge>
                  Copy Your Access Token
                </span>
              </AccordionTrigger>
              <AccordionContent className="text-sm text-muted-foreground space-y-3">
                <ol className="list-decimal list-inside space-y-2">
                  <li>Click <strong>"Create app"</strong> to generate your private app</li>
                  <li>Copy the <strong>Access Token</strong> (starts with <code className="bg-muted px-1 rounded">pat-</code>)</li>
                  <li>Use the "Connect" button above to enter your token</li>
                </ol>
                <div className="flex items-center gap-2 text-green-600">
                  <CheckCircle2 className="w-4 h-4" />
                  <span className="text-xs">Token is stored securely and encrypted</span>
                </div>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </CardContent>
      </Card>

      {/* Salesforce Setup Guide */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-blue-500 flex items-center justify-center text-xl">
              ☁️
            </div>
            <div>
              <CardTitle className="text-lg">Salesforce Setup Guide</CardTitle>
              <CardDescription>Enterprise CRM platform</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Accordion type="single" collapsible className="w-full">
            <AccordionItem value="step-1">
              <AccordionTrigger className="text-sm">
                <span className="flex items-center gap-2">
                  <Badge variant="outline" className="rounded-full px-2 py-0.5 text-xs">1</Badge>
                  Find Your Instance URL
                </span>
              </AccordionTrigger>
              <AccordionContent className="text-sm text-muted-foreground space-y-3">
                <ol className="list-decimal list-inside space-y-2">
                  <li>Log in to your Salesforce org</li>
                  <li>Look at your browser's address bar</li>
                  <li>Your instance URL is the domain (e.g., <code className="bg-muted px-1 rounded">https://yourcompany.salesforce.com</code>)</li>
                </ol>
                <a 
                  href="https://login.salesforce.com" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-primary hover:underline"
                >
                  Login to Salesforce <ExternalLink className="w-3 h-3" />
                </a>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="step-2">
              <AccordionTrigger className="text-sm">
                <span className="flex items-center gap-2">
                  <Badge variant="outline" className="rounded-full px-2 py-0.5 text-xs">2</Badge>
                  Create a Connected App
                </span>
              </AccordionTrigger>
              <AccordionContent className="text-sm text-muted-foreground space-y-3">
                <ol className="list-decimal list-inside space-y-2">
                  <li>Go to <strong>Setup → Apps → App Manager</strong></li>
                  <li>Click <strong>"New Connected App"</strong></li>
                  <li>Fill in the required fields (name, email)</li>
                  <li>Enable <strong>OAuth Settings</strong></li>
                  <li>Add scopes: <code className="bg-muted px-1 rounded">api</code>, <code className="bg-muted px-1 rounded">refresh_token</code></li>
                </ol>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="step-3">
              <AccordionTrigger className="text-sm">
                <span className="flex items-center gap-2">
                  <Badge variant="outline" className="rounded-full px-2 py-0.5 text-xs">3</Badge>
                  Get Your Security Token
                </span>
              </AccordionTrigger>
              <AccordionContent className="text-sm text-muted-foreground space-y-3">
                <ol className="list-decimal list-inside space-y-2">
                  <li>Go to <strong>Settings → My Personal Information → Reset My Security Token</strong></li>
                  <li>A new token will be emailed to you</li>
                  <li>Combine your password + token as the Access Token</li>
                </ol>
                <div className="flex items-center gap-2 text-green-600">
                  <CheckCircle2 className="w-4 h-4" />
                  <span className="text-xs">Credentials are stored securely and encrypted</span>
                </div>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </CardContent>
      </Card>

      {/* Zoho CRM Setup Guide */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-red-500 flex items-center justify-center text-xl">
              🔴
            </div>
            <div>
              <CardTitle className="text-lg">Zoho CRM Setup Guide</CardTitle>
              <CardDescription>Cloud-based CRM solution</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Accordion type="single" collapsible className="w-full">
            <AccordionItem value="step-1">
              <AccordionTrigger className="text-sm">
                <span className="flex items-center gap-2">
                  <Badge variant="outline" className="rounded-full px-2 py-0.5 text-xs">1</Badge>
                  Access Zoho API Console
                </span>
              </AccordionTrigger>
              <AccordionContent className="text-sm text-muted-foreground space-y-3">
                <ol className="list-decimal list-inside space-y-2">
                  <li>Go to the Zoho API Console</li>
                  <li>Click <strong>"Add Client"</strong></li>
                  <li>Select <strong>"Self Client"</strong> for server-side integration</li>
                </ol>
                <a 
                  href="https://api-console.zoho.com/" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-primary hover:underline"
                >
                  Open Zoho API Console <ExternalLink className="w-3 h-3" />
                </a>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="step-2">
              <AccordionTrigger className="text-sm">
                <span className="flex items-center gap-2">
                  <Badge variant="outline" className="rounded-full px-2 py-0.5 text-xs">2</Badge>
                  Generate Access Token
                </span>
              </AccordionTrigger>
              <AccordionContent className="text-sm text-muted-foreground space-y-3">
                <ol className="list-decimal list-inside space-y-2">
                  <li>In your Self Client, go to <strong>"Generate Code"</strong></li>
                  <li>Add scopes: <code className="bg-muted px-1 rounded">ZohoCRM.modules.ALL</code></li>
                  <li>Generate and copy the authorization code</li>
                  <li>Use the code to generate an access token</li>
                </ol>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="step-3">
              <AccordionTrigger className="text-sm">
                <span className="flex items-center gap-2">
                  <Badge variant="outline" className="rounded-full px-2 py-0.5 text-xs">3</Badge>
                  Connect to Platform
                </span>
              </AccordionTrigger>
              <AccordionContent className="text-sm text-muted-foreground space-y-3">
                <ol className="list-decimal list-inside space-y-2">
                  <li>Copy your <strong>Client ID</strong> and <strong>Client Secret</strong></li>
                  <li>Click the "Connect" button above</li>
                  <li>Paste your API credentials</li>
                </ol>
                <div className="flex items-center gap-2 text-green-600">
                  <CheckCircle2 className="w-4 h-4" />
                  <span className="text-xs">Credentials are stored securely and encrypted</span>
                </div>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </CardContent>
      </Card>

      {/* Pipedrive Setup Guide */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-green-500 flex items-center justify-center text-xl">
              🟢
            </div>
            <div>
              <CardTitle className="text-lg">Pipedrive Setup Guide</CardTitle>
              <CardDescription>Sales-focused CRM</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Accordion type="single" collapsible className="w-full">
            <AccordionItem value="step-1">
              <AccordionTrigger className="text-sm">
                <span className="flex items-center gap-2">
                  <Badge variant="outline" className="rounded-full px-2 py-0.5 text-xs">1</Badge>
                  Find Your API Token
                </span>
              </AccordionTrigger>
              <AccordionContent className="text-sm text-muted-foreground space-y-3">
                <ol className="list-decimal list-inside space-y-2">
                  <li>Log in to your Pipedrive account</li>
                  <li>Click your profile picture → <strong>Personal preferences</strong></li>
                  <li>Go to the <strong>"API"</strong> tab</li>
                </ol>
                <a 
                  href="https://app.pipedrive.com/settings/api" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-primary hover:underline"
                >
                  Open Pipedrive API Settings <ExternalLink className="w-3 h-3" />
                </a>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="step-2">
              <AccordionTrigger className="text-sm">
                <span className="flex items-center gap-2">
                  <Badge variant="outline" className="rounded-full px-2 py-0.5 text-xs">2</Badge>
                  Copy Your Personal API Token
                </span>
              </AccordionTrigger>
              <AccordionContent className="text-sm text-muted-foreground space-y-3">
                <ol className="list-decimal list-inside space-y-2">
                  <li>In the API tab, find <strong>"Your personal API token"</strong></li>
                  <li>Click <strong>"Show"</strong> to reveal the token</li>
                  <li>Copy the token</li>
                </ol>
                <p className="text-xs text-amber-600">Note: Keep this token private. Anyone with it can access your Pipedrive data.</p>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="step-3">
              <AccordionTrigger className="text-sm">
                <span className="flex items-center gap-2">
                  <Badge variant="outline" className="rounded-full px-2 py-0.5 text-xs">3</Badge>
                  Connect to Platform
                </span>
              </AccordionTrigger>
              <AccordionContent className="text-sm text-muted-foreground space-y-3">
                <ol className="list-decimal list-inside space-y-2">
                  <li>Click the "Connect" button above</li>
                  <li>Paste your API token</li>
                  <li>Select which data to sync (contacts, deals, activities)</li>
                </ol>
                <div className="flex items-center gap-2 text-green-600">
                  <CheckCircle2 className="w-4 h-4" />
                  <span className="text-xs">Token is stored securely and encrypted</span>
                </div>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </CardContent>
      </Card>

      {/* Custom Webhook Setup Guide */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-purple-500 flex items-center justify-center text-xl">
              🔗
            </div>
            <div>
              <CardTitle className="text-lg">Custom Webhook Setup Guide</CardTitle>
              <CardDescription>Send data to your own endpoint</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Accordion type="single" collapsible className="w-full">
            <AccordionItem value="step-1">
              <AccordionTrigger className="text-sm">
                <span className="flex items-center gap-2">
                  <Badge variant="outline" className="rounded-full px-2 py-0.5 text-xs">1</Badge>
                  Prepare Your Webhook Endpoint
                </span>
              </AccordionTrigger>
              <AccordionContent className="text-sm text-muted-foreground space-y-3">
                <p>Your webhook endpoint should:</p>
                <ul className="list-disc list-inside space-y-1 ml-2">
                  <li>Accept <code className="bg-muted px-1 rounded">POST</code> requests</li>
                  <li>Parse JSON request bodies</li>
                  <li>Return a 2xx status code on success</li>
                  <li>Be accessible from the internet (HTTPS preferred)</li>
                </ul>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="step-2">
              <AccordionTrigger className="text-sm">
                <span className="flex items-center gap-2">
                  <Badge variant="outline" className="rounded-full px-2 py-0.5 text-xs">2</Badge>
                  Webhook Payload Format
                </span>
              </AccordionTrigger>
              <AccordionContent className="text-sm text-muted-foreground space-y-3">
                <p>Events will be sent with this structure:</p>
                <pre className="bg-muted p-3 rounded text-xs overflow-x-auto">
{`{
  "event": "contact.created | contact.updated | deal.created",
  "timestamp": "2024-01-15T10:30:00Z",
  "data": {
    "id": "...",
    "name": "...",
    "email": "...",
    // ... other fields
  }
}`}
                </pre>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="step-3">
              <AccordionTrigger className="text-sm">
                <span className="flex items-center gap-2">
                  <Badge variant="outline" className="rounded-full px-2 py-0.5 text-xs">3</Badge>
                  Configure Webhook (Optional: Add Secret)
                </span>
              </AccordionTrigger>
              <AccordionContent className="text-sm text-muted-foreground space-y-3">
                <ol className="list-decimal list-inside space-y-2">
                  <li>Click the "Connect" button above</li>
                  <li>Enter your webhook URL</li>
                  <li>Optionally add a secret for request verification</li>
                </ol>
                <p className="text-xs text-muted-foreground">
                  If a secret is provided, requests will include an <code className="bg-muted px-1 rounded">X-Webhook-Signature</code> header with an HMAC-SHA256 signature.
                </p>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </CardContent>
      </Card>
    </div>
  );
}
