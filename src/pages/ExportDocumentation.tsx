import { forwardRef } from 'react';
import { PDFDownloadLink } from '@react-pdf/renderer';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { FileText, Download, Loader2, CheckCircle, DollarSign, Bot } from 'lucide-react';
import PlatformDocumentPDF from '@/components/documentation/PlatformDocumentPDF';
import PricingSummaryPDF from '@/components/documentation/PricingSummaryPDF';
import AIAgentGuidesPDF from '@/components/documentation/AIAgentGuidesPDF';

const ExportDocumentation = forwardRef<HTMLDivElement>((_, ref) => {

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Platform Documentation</h1>
          <p className="text-muted-foreground mt-1">
            Download comprehensive PDF documents about the platform for business proposals, 
            investor presentations, or internal documentation.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          {/* AI Agent Guide PDF */}
          <Card className="border-accent/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bot className="h-5 w-5 text-accent" />
                AI Agent & Console Guide
              </CardTitle>
              <CardDescription>
                Complete guide to all 18 AI agents, 5 consoles, features, dependencies & integrations
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2 text-sm text-card-foreground/70">
                <p className="font-medium text-card-foreground">Document includes:</p>
                <ul className="list-disc list-inside space-y-1 ml-2">
                  <li>5 Console Overviews</li>
                  <li>18 AI Agent Descriptions</li>
                  <li>Agent Dependencies & Requirements</li>
                  <li>3rd Party Integration Guide</li>
                  <li>Subscription Tier Access</li>
                  <li>Glossary & FAQ</li>
                </ul>
              </div>

              <PDFDownloadLink
                document={<AIAgentGuidesPDF />}
                fileName={`ai-agent-guide-${new Date().toISOString().split('T')[0]}.pdf`}
              >
                {({ loading, error }) => {
                  if (loading) {
                    return (
                      <Button disabled className="w-full">
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Generating PDF...
                      </Button>
                    );
                  }
                  
                  if (error) {
                    return (
                      <Button variant="destructive" disabled className="w-full">
                        Error generating PDF
                      </Button>
                    );
                  }

                  return (
                    <Button className="w-full">
                      <Download className="mr-2 h-4 w-4" />
                      Download AI Agent Guide
                    </Button>
                  );
                }}
              </PDFDownloadLink>
            </CardContent>
          </Card>

          {/* Business Documentation PDF */}
          <Card className="border-primary/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-primary" />
                Business Documentation PDF
              </CardTitle>
              <CardDescription>
                Complete platform overview with all features, AI agents, integrations, and architecture
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2 text-sm text-card-foreground/70">
                <p className="font-medium text-card-foreground">Document includes:</p>
                <ul className="list-disc list-inside space-y-1 ml-2">
                  <li>Executive Summary</li>
                  <li>Development Timeline (6 phases)</li>
                  <li>Project Complexity Score (87/100)</li>
                  <li>Complete AI Agents Catalog (18 agents)</li>
                  <li>5 Control Center Descriptions</li>
                  <li>Platform Features Overview</li>
                  <li>Third-Party Integrations</li>
                  <li>Technical Architecture</li>
                  <li>User Roles & Portals</li>
                  <li>Knowledge Base System</li>
                  <li>Communication Channels</li>
                  <li>Target Industries</li>
                </ul>
              </div>

              <PDFDownloadLink
                document={<PlatformDocumentPDF />}
                fileName={`platform-documentation-${new Date().toISOString().split('T')[0]}.pdf`}
              >
                {({ loading, error }) => {
                  if (loading) {
                    return (
                      <Button disabled className="w-full">
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Generating PDF...
                      </Button>
                    );
                  }
                  
                  if (error) {
                    return (
                      <Button variant="destructive" disabled className="w-full">
                        Error generating PDF
                      </Button>
                    );
                  }

                  return (
                    <Button className="w-full" variant="outline">
                      <Download className="mr-2 h-4 w-4" />
                      Download Platform Documentation
                    </Button>
                  );
                }}
              </PDFDownloadLink>
            </CardContent>
          </Card>

          {/* Pricing Summary PDF */}
          <Card className="border-secondary/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="h-5 w-5 text-secondary" />
                Pricing Summary PDF
              </CardTitle>
              <CardDescription>
                Complete subscription pricing breakdown with tier details and 3rd party integration costs
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2 text-sm text-card-foreground/70">
                <p className="font-medium text-card-foreground">Document includes:</p>
                <ul className="list-disc list-inside space-y-1 ml-2">
                  <li>Executive Pricing Summary</li>
                  <li>Three-Tier Comparison</li>
                  <li>Detailed Tier Breakdowns</li>
                  <li>Annual Discount Savings (16%)</li>
                  <li>3rd Party Integration Costs</li>
                  <li>Billing Clarifications</li>
                  <li>Total Cost Examples</li>
                </ul>
              </div>

              <PDFDownloadLink
                document={<PricingSummaryPDF />}
                fileName={`pricing-summary-${new Date().toISOString().split('T')[0]}.pdf`}
              >
                {({ loading, error }) => {
                  if (loading) {
                    return (
                      <Button disabled className="w-full">
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Generating PDF...
                      </Button>
                    );
                  }
                  
                  if (error) {
                    return (
                      <Button variant="destructive" disabled className="w-full">
                        Error generating PDF
                      </Button>
                    );
                  }

                  return (
                    <Button className="w-full" variant="outline">
                      <Download className="mr-2 h-4 w-4" />
                      Download Pricing Summary
                    </Button>
                  );
                }}
              </PDFDownloadLink>
            </CardContent>
          </Card>
        </div>

        {/* Document Contents Cards */}
        <div className="grid gap-6 md:grid-cols-3">
          <Card>
            <CardHeader>
              <CardTitle>AI Agent Guide Contents</CardTitle>
              <CardDescription>
                12-page user-friendly reference document
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {[
                  { page: 1, title: 'Cover Page', desc: 'Key stats: 5 consoles, 18 agents' },
                  { page: 2, title: 'Table of Contents', desc: 'Full document navigation' },
                  { page: 3, title: 'Introduction', desc: 'How to read the guide & legend' },
                  { page: 4, title: 'Customer Portal', desc: '4 agents with features' },
                  { page: 5, title: 'Field Operations', desc: '4 agents with features' },
                  { page: 6, title: 'Business Management', desc: '5 agents with features' },
                  { page: 7, title: 'Marketing & Analytics', desc: 'Consoles 4 & 5 overview' },
                  { page: 8, title: 'Analytics Agents', desc: '4 agents + dependency info' },
                  { page: 9, title: 'Agent Summary Table', desc: 'All 18 agents at a glance' },
                  { page: 10, title: 'Subscription Tiers', desc: 'Which agents per tier' },
                  { page: 11, title: '3rd Party Integrations', desc: 'Required & optional services' },
                  { page: 12, title: 'Glossary & FAQ', desc: 'Terms and common questions' },
                ].map((section, i) => (
                  <div key={i} className="flex items-start gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors">
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-accent/10 flex items-center justify-center">
                      <span className="text-xs font-medium text-accent">{section.page}</span>
                    </div>
                    <div>
                      <p className="font-medium text-sm text-card-foreground">{section.title}</p>
                      <p className="text-xs text-card-foreground/70">{section.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Platform Documentation Contents</CardTitle>
              <CardDescription>
                17-page comprehensive business document
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {[
                  { page: 1, title: 'Cover Page', desc: 'Platform branding and key stats' },
                  { page: 2, title: 'Table of Contents', desc: 'Full document navigation' },
                  { page: 3, title: 'Executive Summary', desc: 'Platform overview and value proposition' },
                  { page: 4, title: 'Development Timeline', desc: '6 phases with 30+ milestones' },
                  { page: 5, title: 'Complexity Score', desc: '87/100 enterprise-grade rating' },
                  { page: '6-8', title: 'AI Agents Catalog', desc: '18 agents across 5 categories' },
                  { page: 9, title: 'Control Centers', desc: '5 specialized consoles' },
                  { page: 10, title: 'Platform Features', desc: '8 key platform capabilities' },
                  { page: 11, title: 'Integrations', desc: 'Third-party services and APIs' },
                  { page: 12, title: 'Technical Architecture', desc: 'Frontend, backend, and AI stack' },
                ].map((section, i) => (
                  <div key={i} className="flex items-start gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors">
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                      <span className="text-xs font-medium text-primary">{section.page}</span>
                    </div>
                    <div>
                      <p className="font-medium text-sm text-card-foreground">{section.title}</p>
                      <p className="text-xs text-card-foreground/70">{section.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Pricing Summary Contents</CardTitle>
              <CardDescription>
                11-page pricing and billing document
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {[
                  { page: 1, title: 'Cover Page', desc: 'Branding with key pricing stats' },
                  { page: 2, title: 'Table of Contents', desc: 'Document navigation' },
                  { page: 3, title: 'Executive Summary', desc: 'Pricing overview and quick comparison' },
                  { page: 4, title: 'Tier Comparison', desc: 'Full feature matrix by tier' },
                  { page: 5, title: 'Single-Point Details', desc: '$497/mo tier breakdown' },
                  { page: 6, title: 'Multi-Track Details', desc: '$897/mo tier breakdown' },
                  { page: 7, title: 'Command Details', desc: '$1,497/mo tier breakdown' },
                  { page: 8, title: 'Annual Savings', desc: 'Discount calculations' },
                  { page: 9, title: '3rd Party Costs', desc: 'Integration pricing details' },
                  { page: 10, title: 'Billing Clarifications', desc: 'Company Stripe requirements' },
                  { page: 11, title: 'Cost Examples', desc: 'Total monthly cost scenarios' },
                ].map((section, i) => (
                  <div key={i} className="flex items-start gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors">
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-accent/10 flex items-center justify-center">
                      <span className="text-xs font-medium text-accent">{section.page}</span>
                    </div>
                    <div>
                      <p className="font-medium text-sm text-card-foreground">{section.title}</p>
                      <p className="text-xs text-card-foreground/70">{section.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        <Card className="bg-muted/30">
          <CardContent className="py-4">
            <div className="flex items-center gap-3">
              <CheckCircle className="h-5 w-5 text-green-500" />
              <div>
                <p className="font-medium text-card-foreground">Professional Formatting</p>
                <p className="text-sm text-card-foreground/70">
                  Both PDFs are professionally formatted with consistent branding, page numbers,
                  headers, and tables of contents for easy navigation.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
});

ExportDocumentation.displayName = 'ExportDocumentation';

export default ExportDocumentation;
