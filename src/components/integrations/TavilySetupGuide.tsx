import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { ExternalLink, Search, Shield, CheckCircle, Zap } from 'lucide-react';

export function TavilySetupGuide() {
  return (
    <Card className="guide-card guide-card-calendar">
      <CardHeader>
        <div className="flex items-center gap-2">
          <Search className="w-5 h-5 text-cyan-500" />
          <CardTitle className="text-lg">Tavily AI Setup Guide</CardTitle>
          <Badge variant="secondary">AI Research</Badge>
        </div>
        <CardDescription>
          Configure Tavily for AI-powered web research to enhance your social media content with current trends.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Accordion type="single" collapsible className="w-full">
          {/* Step 1: What is Tavily */}
          <AccordionItem value="step-1">
            <AccordionTrigger className="text-sm">
              <span className="flex items-center gap-2">
                <Badge variant="outline" className="rounded-full px-2 py-0.5 text-xs bg-cyan-500 text-white border-cyan-500">1</Badge>
                What is Tavily?
              </span>
            </AccordionTrigger>
            <AccordionContent className="text-sm text-foreground/80 space-y-3">
              <p>Tavily is an <strong>AI-optimized search API</strong> specifically designed for AI agents and LLMs:</p>
              <ul className="list-disc list-inside space-y-2">
                <li><strong>Structured Data</strong> - Returns clean, AI-ready results (not raw HTML)</li>
                <li><strong>Citations Included</strong> - Every result comes with source URLs</li>
                <li><strong>Fast & Accurate</strong> - Optimized for speed and relevance</li>
                <li><strong>Perfect for Content</strong> - Find current industry trends for social posts</li>
              </ul>
              <div className="bg-cyan-500/10 border border-cyan-500/20 rounded-lg p-3">
                <p className="text-cyan-600 dark:text-cyan-400 text-xs">
                  <strong>💡 How we use it:</strong> When generating social media content, Tavily searches for current trends in your industry to make posts more relevant and timely.
                </p>
              </div>
            </AccordionContent>
          </AccordionItem>

          {/* Step 2: Create Free Account */}
          <AccordionItem value="step-2">
            <AccordionTrigger className="text-sm">
              <span className="flex items-center gap-2">
                <Badge variant="outline" className="rounded-full px-2 py-0.5 text-xs bg-cyan-500 text-white border-cyan-500">2</Badge>
                Create Free Account
              </span>
            </AccordionTrigger>
            <AccordionContent className="text-sm text-foreground/80 space-y-3">
              <ol className="list-decimal list-inside space-y-2">
                <li>Go to <a href="https://tavily.com" target="_blank" rel="noopener noreferrer" className="text-secondary hover:underline">tavily.com</a></li>
                <li>Click <strong>Get Started</strong> or <strong>Sign Up</strong></li>
                <li>Create an account with your email</li>
                <li>Verify your email address</li>
              </ol>
              <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-3">
                <div className="flex items-center gap-2 text-green-600 dark:text-green-400">
                  <CheckCircle className="w-4 h-4" />
                  <span className="font-medium text-xs">No credit card required for free tier!</span>
                </div>
              </div>
              <a 
                href="https://tavily.com" 
                target="_blank" 
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-secondary hover:underline"
              >
                Create Tavily Account <ExternalLink className="w-3 h-3" />
              </a>
            </AccordionContent>
          </AccordionItem>

          {/* Step 3: Get API Key */}
          <AccordionItem value="step-3">
            <AccordionTrigger className="text-sm">
              <span className="flex items-center gap-2">
                <Badge variant="outline" className="rounded-full px-2 py-0.5 text-xs bg-cyan-500 text-white border-cyan-500">3</Badge>
                Get Your API Key
              </span>
            </AccordionTrigger>
            <AccordionContent className="text-sm text-foreground/80 space-y-3">
              <ol className="list-decimal list-inside space-y-2">
                <li>Log in to your Tavily account</li>
                <li>Navigate to your <strong>Dashboard</strong> or <strong>API Keys</strong> section</li>
                <li>Your API key will be displayed (or click to generate one)</li>
                <li>Copy the key - it starts with <code className="text-xs bg-muted px-1 rounded">tvly-</code></li>
              </ol>
              
              <div className="bg-muted p-4 rounded-lg space-y-2">
                <div className="flex items-center gap-2">
                  <Shield className="w-4 h-4 text-cyan-500" />
                  <span className="font-medium text-foreground">API Key Format</span>
                </div>
                <code className="text-xs">tvly-xxxxxxxxxxxxxxxxxxxxxxxx</code>
                <p className="text-xs text-muted-foreground">Starts with "tvly-" followed by a unique identifier</p>
              </div>
              <a 
                href="https://app.tavily.com" 
                target="_blank" 
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-secondary hover:underline"
              >
                Go to Tavily Dashboard <ExternalLink className="w-3 h-3" />
              </a>
            </AccordionContent>
          </AccordionItem>

          {/* Step 4: Free Tier Details */}
          <AccordionItem value="step-4">
            <AccordionTrigger className="text-sm">
              <span className="flex items-center gap-2">
                <Badge variant="outline" className="rounded-full px-2 py-0.5 text-xs bg-cyan-500 text-white border-cyan-500">4</Badge>
                Your Tavily Account & Billing
              </span>
            </AccordionTrigger>
            <AccordionContent className="text-sm text-foreground/80 space-y-3">
              <div className="bg-muted p-4 rounded-lg space-y-3">
                <div className="flex items-center gap-2 text-green-600">
                  <CheckCircle className="w-4 h-4" />
                  <span className="font-medium">Your own Tavily account · valid credit card on file · billed directly by Tavily</span>
                </div>
                <div className="space-y-2 pt-2 border-t">
                  <div className="flex justify-between">
                    <span>Free tier</span>
                    <span className="font-medium">1,000 credits/month — no card required</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Overage rate</span>
                    <span className="font-medium">$0.008 / credit</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Project plans</span>
                    <span className="font-medium">From ~$30/month</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Search credits</span>
                    <span className="font-medium">1 credit / query</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Extract credits</span>
                    <span className="font-medium">1 credit / URL</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Map credits</span>
                    <span className="font-medium">1 credit / call</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Billing</span>
                    <span className="font-medium">Direct from Tavily · separate from Aura plan</span>
                  </div>
                </div>
                <p className="text-xs text-foreground/80 pt-2 border-t">
                  Tavily invoices your card on file directly at the provider's published rates. Aura does not resell or mark up Tavily usage.
                </p>
              </div>
            </AccordionContent>
          </AccordionItem>

          {/* Step 5: How It Works */}
          <AccordionItem value="step-5">
            <AccordionTrigger className="text-sm">
              <span className="flex items-center gap-2">
                <Badge variant="outline" className="rounded-full px-2 py-0.5 text-xs bg-cyan-500 text-white border-cyan-500">5</Badge>
                How It's Used
              </span>
            </AccordionTrigger>
            <AccordionContent className="text-sm text-foreground/80 space-y-3">
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full bg-cyan-500/20 flex items-center justify-center flex-shrink-0">
                    <Zap className="w-4 h-4 text-cyan-500" />
                  </div>
                  <div>
                    <p className="font-medium text-foreground">Enhanced Social Content</p>
                    <p className="text-xs">When generating social posts, Tavily searches for current trends and news in your industry.</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full bg-cyan-500/20 flex items-center justify-center flex-shrink-0">
                    <Search className="w-4 h-4 text-cyan-500" />
                  </div>
                  <div>
                    <p className="font-medium text-foreground">Real-Time Data</p>
                    <p className="text-xs">Get up-to-date information instead of outdated AI knowledge.</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full bg-cyan-500/20 flex items-center justify-center flex-shrink-0">
                    <Shield className="w-4 h-4 text-cyan-500" />
                  </div>
                  <div>
                    <p className="font-medium text-foreground">Citations Included</p>
                    <p className="text-xs">Every fact comes with a source URL for credibility.</p>
                  </div>
                </div>
              </div>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </CardContent>
    </Card>
  );
}
