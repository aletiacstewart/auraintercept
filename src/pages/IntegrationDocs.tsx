import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Code, Globe, FileCode, Puzzle, CheckCircle2 } from 'lucide-react';

const IntegrationDocs = () => {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Website Integration Guide</h1>
          <p className="text-muted-foreground">
            Embed AI chat on any website platform
          </p>
        </div>

        <Tabs defaultValue="wordpress" className="space-y-4">
          <TabsList className="grid w-full grid-cols-2 lg:grid-cols-5">
            <TabsTrigger value="wordpress" className="gap-2">
              <Globe className="h-4 w-4" />
              WordPress
            </TabsTrigger>
            <TabsTrigger value="wix" className="gap-2">
              <Puzzle className="h-4 w-4" />
              Wix
            </TabsTrigger>
            <TabsTrigger value="squarespace" className="gap-2">
              <FileCode className="h-4 w-4" />
              Squarespace
            </TabsTrigger>
            <TabsTrigger value="shopify" className="gap-2">
              <Code className="h-4 w-4" />
              Shopify
            </TabsTrigger>
            <TabsTrigger value="html" className="gap-2">
              <Code className="h-4 w-4" />
              HTML
            </TabsTrigger>
          </TabsList>

          <TabsContent value="wordpress">
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <CardTitle>WordPress Installation</CardTitle>
                  <Badge variant="secondary">Recommended: Iframe</Badge>
                </div>
                <CardDescription>
                  Add the chat widget to your WordPress site
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <h4 className="font-semibold flex items-center gap-2">
                    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs">1</span>
                    Using Custom HTML Block (Gutenberg)
                  </h4>
                  <ol className="ml-8 space-y-2 text-sm text-muted-foreground list-decimal">
                    <li>Edit the page where you want the chat widget</li>
                    <li>Add a "Custom HTML" block</li>
                    <li>Paste the iframe embed code from the Widget page</li>
                    <li>Publish or update the page</li>
                  </ol>
                </div>

                <div className="space-y-4">
                  <h4 className="font-semibold flex items-center gap-2">
                    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs">2</span>
                    Site-Wide Installation (Theme)
                  </h4>
                  <ol className="ml-8 space-y-2 text-sm text-muted-foreground list-decimal">
                    <li>Go to Appearance → Theme File Editor</li>
                    <li>Select footer.php (or header.php)</li>
                    <li>Paste the JavaScript embed code before the closing tag</li>
                    <li>Save the file</li>
                  </ol>
                  <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-3 text-sm">
                    <strong>Note:</strong> If using a block theme, add a Custom HTML block to your footer template instead.
                  </div>
                </div>

                <div className="space-y-4">
                  <h4 className="font-semibold flex items-center gap-2">
                    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs">3</span>
                    Using a Plugin (WPCode)
                  </h4>
                  <ol className="ml-8 space-y-2 text-sm text-muted-foreground list-decimal">
                    <li>Install the "WPCode" plugin</li>
                    <li>Go to Code Snippets → Add Snippet</li>
                    <li>Choose "Add Your Custom Code"</li>
                    <li>Set code type to "HTML Snippet"</li>
                    <li>Paste the embed code and set location to "Site Wide Footer"</li>
                    <li>Activate the snippet</li>
                  </ol>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="wix">
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <CardTitle>Wix Installation</CardTitle>
                  <Badge variant="secondary">Use: Iframe</Badge>
                </div>
                <CardDescription>
                  Add the chat widget to your Wix website
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <h4 className="font-semibold flex items-center gap-2">
                    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs">1</span>
                    Using Embed HTML Element
                  </h4>
                  <ol className="ml-8 space-y-2 text-sm text-muted-foreground list-decimal">
                    <li>Open your Wix Editor</li>
                    <li>Click "Add" (+) → "Embed Code" → "Embed HTML"</li>
                    <li>Paste the iframe embed code</li>
                    <li>Position the element where you want it (usually bottom-right)</li>
                    <li>Pin the element so it stays fixed on scroll</li>
                    <li>Publish your site</li>
                  </ol>
                </div>

                <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-3 text-sm">
                  <strong>Pro Tip:</strong> To make the widget appear on all pages, add it to a site-wide header or footer section.
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="squarespace">
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <CardTitle>Squarespace Installation</CardTitle>
                  <Badge variant="secondary">Use: Iframe or JS</Badge>
                </div>
                <CardDescription>
                  Add the chat widget to your Squarespace website
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <h4 className="font-semibold flex items-center gap-2">
                    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs">1</span>
                    Site-Wide (Code Injection)
                  </h4>
                  <ol className="ml-8 space-y-2 text-sm text-muted-foreground list-decimal">
                    <li>Go to Settings → Advanced → Code Injection</li>
                    <li>Paste the JavaScript embed code in the "Footer" section</li>
                    <li>Save and publish</li>
                  </ol>
                  <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-3 text-sm">
                    <strong>Note:</strong> Code Injection requires a Business plan or higher.
                  </div>
                </div>

                <div className="space-y-4">
                  <h4 className="font-semibold flex items-center gap-2">
                    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs">2</span>
                    Single Page (Code Block)
                  </h4>
                  <ol className="ml-8 space-y-2 text-sm text-muted-foreground list-decimal">
                    <li>Edit the page</li>
                    <li>Add a "Code" block</li>
                    <li>Paste the iframe embed code</li>
                    <li>Save the page</li>
                  </ol>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="shopify">
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <CardTitle>Shopify Installation</CardTitle>
                  <Badge variant="secondary">Use: JavaScript</Badge>
                </div>
                <CardDescription>
                  Add the chat widget to your Shopify store
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <h4 className="font-semibold flex items-center gap-2">
                    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs">1</span>
                    Using Theme Editor
                  </h4>
                  <ol className="ml-8 space-y-2 text-sm text-muted-foreground list-decimal">
                    <li>Go to Online Store → Themes</li>
                    <li>Click "Actions" → "Edit code"</li>
                    <li>Find theme.liquid in the Layout folder</li>
                    <li>Paste the JavaScript embed code before the closing &lt;/body&gt; tag</li>
                    <li>Save the file</li>
                  </ol>
                </div>

                <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-3 text-sm flex items-start gap-2">
                  <CheckCircle2 className="h-5 w-5 text-green-500 shrink-0 mt-0.5" />
                  <div>
                    <strong>Best Practice:</strong> The widget will appear on all pages including product pages, cart, and checkout.
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="html">
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <CardTitle>Generic HTML Installation</CardTitle>
                  <Badge variant="secondary">Works Everywhere</Badge>
                </div>
                <CardDescription>
                  Add the chat widget to any HTML website
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <h4 className="font-semibold">JavaScript Embed (Recommended)</h4>
                  <p className="text-sm text-muted-foreground">
                    Add this code before the closing &lt;/body&gt; tag:
                  </p>
                  <pre className="bg-muted p-4 rounded-lg text-xs overflow-x-auto font-mono">
{`<script 
  src="https://your-supabase-url/functions/v1/chat-widget" 
  data-company="your-company-slug" 
  defer
></script>`}
                  </pre>
                </div>

                <div className="space-y-4">
                  <h4 className="font-semibold">Iframe Embed (Alternative)</h4>
                  <p className="text-sm text-muted-foreground">
                    Add this anywhere in your HTML:
                  </p>
                  <pre className="bg-muted p-4 rounded-lg text-xs overflow-x-auto font-mono">
{`<iframe 
  src="https://your-domain.com/chat/your-company-slug?embed=true" 
  width="400" 
  height="600" 
  style="border:none;border-radius:16px;position:fixed;bottom:20px;right:20px;z-index:9999;"
></iframe>`}
                  </pre>
                </div>

                <div className="bg-muted/50 p-4 rounded-lg space-y-2">
                  <h4 className="font-medium">Troubleshooting</h4>
                  <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
                    <li>Make sure your company slug is correct</li>
                    <li>Check that the widget script URL is accessible</li>
                    <li>Verify no other scripts are blocking the widget</li>
                    <li>Check browser console for any error messages</li>
                  </ul>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
};

export default IntegrationDocs;
