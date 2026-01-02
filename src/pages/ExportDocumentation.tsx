import { useState } from 'react';
import { PDFDownloadLink } from '@react-pdf/renderer';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { FileText, Download, Loader2, CheckCircle } from 'lucide-react';
import PlatformDocumentPDF from '@/components/documentation/PlatformDocumentPDF';

export default function ExportDocumentation() {
  const [isGenerating, setIsGenerating] = useState(true);

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Platform Documentation</h1>
          <p className="text-muted-foreground mt-1">
            Download a comprehensive PDF document about the platform for business proposals, 
            investor presentations, or internal documentation.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <Card className="border-primary/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-primary" />
                Business Documentation PDF
              </CardTitle>
              <CardDescription>
                Complete platform overview with all features, AI agents, integrations, and pricing
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2 text-sm text-muted-foreground">
                <p className="font-medium text-foreground">Document includes:</p>
                <ul className="list-disc list-inside space-y-1 ml-2">
                  <li>Executive Summary</li>
                  <li>Complete AI Agents Catalog (22+ agents)</li>
                  <li>5 Agent Console Descriptions</li>
                  <li>Platform Features Overview</li>
                  <li>Third-Party Integrations</li>
                  <li>Technical Architecture</li>
                  <li>User Roles & Portals</li>
                  <li>Knowledge Base System</li>
                  <li>Communication Channels</li>
                  <li>Target Industries</li>
                  <li>Pricing Model</li>
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
                    <Button className="w-full">
                      <Download className="mr-2 h-4 w-4" />
                      Download PDF Documentation
                    </Button>
                  );
                }}
              </PDFDownloadLink>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Document Contents</CardTitle>
              <CardDescription>
                15-page comprehensive business document
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {[
                  { page: 1, title: 'Cover Page', desc: 'Platform branding and key stats' },
                  { page: 2, title: 'Table of Contents', desc: 'Full document navigation' },
                  { page: 3, title: 'Executive Summary', desc: 'Platform overview and value proposition' },
                  { page: '4-6', title: 'AI Agents Catalog', desc: '22+ agents across 5 categories' },
                  { page: 7, title: 'Agent Consoles', desc: '5 specialized control centers' },
                  { page: 8, title: 'Platform Features', desc: '8 key platform capabilities' },
                  { page: 9, title: 'Integrations', desc: 'Third-party services and APIs' },
                  { page: 10, title: 'Technical Architecture', desc: 'Frontend, backend, and AI stack' },
                  { page: 11, title: 'User Roles', desc: 'Role-based access control' },
                  { page: 12, title: 'Knowledge Base', desc: 'Company information management' },
                  { page: 13, title: 'Communication Channels', desc: 'Voice, SMS, email, and chat' },
                  { page: 14, title: 'Target Industries', desc: 'Service business verticals' },
                  { page: 15, title: 'Pricing Model', desc: 'Enterprise tier and usage costs' },
                ].map((section, i) => (
                  <div key={i} className="flex items-start gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors">
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                      <span className="text-xs font-medium text-primary">{section.page}</span>
                    </div>
                    <div>
                      <p className="font-medium text-sm">{section.title}</p>
                      <p className="text-xs text-muted-foreground">{section.desc}</p>
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
                <p className="font-medium">Professional Formatting</p>
                <p className="text-sm text-muted-foreground">
                  The PDF is professionally formatted with consistent branding, page numbers, 
                  headers, and a table of contents for easy navigation.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
