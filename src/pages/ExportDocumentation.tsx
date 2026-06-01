import { forwardRef } from 'react';
import { PDFDownloadLink } from '@react-pdf/renderer';
import { Link } from 'react-router-dom';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { PageContainer } from '@/components/ui/page-container';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { FileText, Download, Loader2, CheckCircle, DollarSign, Bot, BookOpen, Building2, FileDown, Share2, Video, BarChart3, Palette, Globe, Factory, ClipboardList, ExternalLink, HelpCircle, Megaphone } from 'lucide-react';
import { PageHeader } from '@/components/ui/page-header';
import PlatformDocumentPDF from '@/components/documentation/PlatformDocumentPDF';
import PricingSummaryPDF from '@/components/documentation/PricingSummaryPDF';
import AIAgentGuidesPDF from '@/components/documentation/AIAgentGuidesPDF';
import { ComprehensiveGuidesPDF } from '@/components/documentation/ComprehensiveGuidesPDF';
import CompanyGuidesPDF from '@/components/documentation/CompanyGuidesPDF';
import CompanyOnboardingPDF from '@/components/documentation/CompanyOnboardingPDF';
import SocialMediaContentPackPDF from '@/components/documentation/SocialMediaContentPackPDF';
import VideoScriptsPDF from '@/components/documentation/VideoScriptsPDF';
import VideoPromptsPDF from '@/components/documentation/VideoPromptsPDF';
import SalesPitchDataPDF from '@/components/documentation/SalesPitchDataPDF';
import BrandAssetGuidePDF from '@/components/documentation/BrandAssetGuidePDF';
import WebsiteCopyPDF from '@/components/documentation/WebsiteCopyPDF';
import IndustryMarketingKitPDF from '@/components/documentation/IndustryMarketingKitPDF';
import PlatformFAQPDF from '@/components/documentation/PlatformFAQPDF';
import MarketingSalesMasterPDF from '@/components/documentation/MarketingSalesMasterPDF';

const ExportDocumentation = forwardRef<HTMLDivElement>((_, ref) => {

  return (
    <DashboardLayout>
      <PageContainer>
        <div className="space-y-6">
          <PageHeader
            icon={FileDown}
            title="Export Documentation"
            description="Download comprehensive PDF documents about the platform for business proposals, investor presentations, or internal documentation"
            featureColor="overview"
          />

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {/* Marketing & Sales Master Guide */}
          <Card className="border-primary/40">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Megaphone className="h-5 w-5 text-primary" />
                Marketing & Sales Master Guide
              </CardTitle>
              <CardDescription>
                One sales-ready PDF covering every AI operative, feature, dashboard, and console
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2 text-sm text-card-foreground/70">
                <p className="font-medium text-card-foreground">Document includes:</p>
                <ul className="list-disc list-inside space-y-1 ml-2">
                  <li>4-Tier Pricing & Inclusions</li>
                  <li>10 AI Operatives (capabilities + use cases)</li>
                  <li>Industry Specialists overview</li>
                  <li>Platform Feature Catalog</li>
                  <li>Dashboards & 7 Consoles + AI Hub</li>
                  <li>3rd-Party Stack Disclosure</li>
                  <li>Trial structure & Sales Talking Points</li>
                </ul>
              </div>
              <PDFDownloadLink
                document={<MarketingSalesMasterPDF />}
                fileName={`marketing-sales-master-guide-${new Date().toISOString().split('T')[0]}.pdf`}
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
                      Download Master Guide
                    </Button>
                  );
                }}
              </PDFDownloadLink>
            </CardContent>
          </Card>

          {/* AI Agent Guide PDF */}
          <Card className="border-accent/20">
            {/* (existing card kept below) */}
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bot className="h-5 w-5 text-accent" />
                AI Agent & Console Guide
              </CardTitle>
            <CardDescription>
                Complete guide to all 10 AI Operatives across 7 Consoles + AI Operatives Hub, communication channels & integrations
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2 text-sm text-card-foreground/70">
                <p className="font-medium text-card-foreground">Document includes:</p>
                <ul className="list-disc list-inside space-y-1 ml-2">
                  <li>7 Console Overviews + AI Operatives Hub (Elite)</li>
                  <li>10 AI Operative Descriptions (24 underlying specialist agents)</li>
                  <li>Communication Channels</li>
                  <li>Agent Dependencies & Requirements</li>
                  <li>3rd Party Integration Guide (SignalWire, ElevenLabs, Resend, Tavily — your own accounts, billed separately by each provider)</li>
                  <li>4-Tier Subscription Access (Core / Boost / Pro / Elite)</li>
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
                  <li>Project Complexity Score</li>
                  <li>Complete Smart AI Agents Catalog (24 agents)</li>
                  <li>7 Control Center Descriptions</li>
                  <li>Technical Architecture</li>
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
                  <li>Four-Tier Comparison</li>
                  <li>Detailed Tier Breakdowns</li>
                  <li>Implementation Fees</li>
                  <li>3rd Party Integration Costs</li>
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

          {/* Comprehensive User Guide PDF */}
          <Card className="border-green-500/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BookOpen className="h-5 w-5 text-green-600" />
                Comprehensive User Guide
              </CardTitle>
              <CardDescription>
                Step-by-step guides for all platform features organized by category
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2 text-sm text-card-foreground/70">
                <p className="font-medium text-card-foreground">Document includes:</p>
                <ul className="list-disc list-inside space-y-1 ml-2">
                  <li>Getting Started Guides</li>
                  <li>AI Agents Configuration</li>
                  <li>Integrations Setup</li>
                  <li>Operations Management</li>
                  <li>Marketing & Campaigns</li>
                  <li>Analytics & Reports</li>
                </ul>
              </div>

              <PDFDownloadLink
                document={<ComprehensiveGuidesPDF />}
                fileName={`comprehensive-user-guide-${new Date().toISOString().split('T')[0]}.pdf`}
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
                      Download User Guide
                    </Button>
                  );
                }}
              </PDFDownloadLink>
            </CardContent>
          </Card>

          {/* Company Admin Guide PDF */}
          <Card className="border-orange-500/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="h-5 w-5 text-orange-600" />
                Company Admin Guide
              </CardTitle>
              <CardDescription>
                Focused guide for company administrators with setup and management guides
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2 text-sm text-card-foreground/70">
                <p className="font-medium text-card-foreground">Document includes:</p>
                <ul className="list-disc list-inside space-y-1 ml-2">
                  <li>Company Dashboard Overview</li>
                  <li>AI Agents Configuration</li>
                  <li>AI Consoles Usage</li>
                  <li>Integrations Setup</li>
                  <li>Operations Management</li>
                  <li>Business & Finance</li>
                </ul>
              </div>

              <PDFDownloadLink
                document={<CompanyGuidesPDF />}
                fileName={`company-admin-guide-${new Date().toISOString().split('T')[0]}.pdf`}
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
                      Download Admin Guide
                    </Button>
                  );
                }}
              </PDFDownloadLink>
            </CardContent>
          </Card>

          {/* Platform FAQ PDF */}
          <Card className="border-purple-500/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <HelpCircle className="h-5 w-5 text-purple-600" />
                Platform FAQ Document
              </CardTitle>
              <CardDescription>
                Comprehensive FAQ covering all platform features, pricing, and troubleshooting
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2 text-sm text-card-foreground/70">
                <p className="font-medium text-card-foreground">Document includes:</p>
                <ul className="list-disc list-inside space-y-1 ml-2">
                  <li>Getting Started FAQs</li>
                  <li>Subscription & Pricing</li>
                  <li>AI Operatives & Features</li>
                  <li>Consoles & Dashboards</li>
                  <li>Integrations & Setup</li>
                  <li>Troubleshooting Guide</li>
                </ul>
              </div>

              <PDFDownloadLink
                document={<PlatformFAQPDF />}
                fileName={`platform-faq-${new Date().toISOString().split('T')[0]}.pdf`}
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
                      Download Platform FAQ
                    </Button>
                  );
                }}
              </PDFDownloadLink>
            </CardContent>
          </Card>

          {/* Company Onboarding Questionnaire PDF */}
          <Card className="border-cyan-500/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ClipboardList className="h-5 w-5 text-cyan-600" />
                Company Onboarding Questionnaire
              </CardTitle>
              <CardDescription>
                Comprehensive questionnaire for new company onboarding with audit and setup forms
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2 text-sm text-card-foreground/70">
                <p className="font-medium text-card-foreground">Document includes:</p>
                <ul className="list-disc list-inside space-y-1 ml-2">
                  <li>Company Profile & Branding</li>
                  <li>Business Operations Details</li>
                  <li>30-Question AI Opportunity Audit</li>
                  <li>Integration Requirements Checklist</li>
                  <li>Knowledge Base Setup Forms</li>
                  <li>Employee Account Information</li>
                </ul>
              </div>

              <div className="flex flex-col gap-2">
                <Button asChild className="w-full">
                  <Link to="/onboarding" target="_blank">
                    <ExternalLink className="mr-2 h-4 w-4" />
                    Open Digital Form
                  </Link>
                </Button>

                <PDFDownloadLink
                  document={<CompanyOnboardingPDF />}
                  fileName={`company-onboarding-questionnaire-${new Date().toISOString().split('T')[0]}.pdf`}
                >
                  {({ loading, error }) => {
                    if (loading) {
                      return (
                        <Button disabled className="w-full" variant="outline">
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
                        Download PDF Version
                      </Button>
                    );
                  }}
                </PDFDownloadLink>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Outreach & Sales Documents Section */}
        <div className="mt-8">
          <h2 className="text-2xl font-bold text-foreground mb-4">Outreach & Sales Toolkit</h2>
          <p className="text-muted-foreground mb-6">Content generation resources for digital marketing, video production, and graphic design</p>
          
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {/* Social Media Content Pack */}
            <Card className="border-pink-500/20">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Share2 className="h-5 w-5 text-pink-500" />
                  Social Media Content Pack
                </CardTitle>
                <CardDescription>60+ ready-to-post templates for all 6 platforms with hashtags and AI prompts</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2 text-sm text-card-foreground/70">
                  <ul className="list-disc list-inside space-y-1 ml-2">
                    <li>IG, FB, LinkedIn, TikTok, GMB, SMS</li>
                    <li>30-Day Content Calendar</li>
                    <li>Hashtag Libraries</li>
                    <li>AI Generation Prompts</li>
                  </ul>
                </div>
                <PDFDownloadLink document={<SocialMediaContentPackPDF />} fileName={`social-media-content-pack-${new Date().toISOString().split('T')[0]}.pdf`}>
                  {({ loading, error }) => (
                    <Button className="w-full" variant="outline" disabled={loading}>
                      {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Download className="mr-2 h-4 w-4" />}
                      {loading ? 'Generating...' : 'Download Social Pack'}
                    </Button>
                  )}
                </PDFDownloadLink>
              </CardContent>
            </Card>

            {/* Video Scripts Library */}
            <Card className="border-purple-500/20">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Video className="h-5 w-5 text-purple-500" />
                  Video Script Library
                </CardTitle>
                <CardDescription>25+ production-ready scripts from 15s hooks to 5-min demos</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2 text-sm text-card-foreground/70">
                  <ul className="list-disc list-inside space-y-1 ml-2">
                    <li>Short-Form (15-30s) Hooks</li>
                    <li>Medium-Form (60-90s) Explainers</li>
                    <li>Long-Form Demo Scripts</li>
                    <li>B-Roll Shot Lists</li>
                  </ul>
                </div>
                <PDFDownloadLink document={<VideoScriptsPDF />} fileName={`video-scripts-library-${new Date().toISOString().split('T')[0]}.pdf`}>
                  {({ loading, error }) => (
                    <Button className="w-full" variant="outline" disabled={loading}>
                      {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Download className="mr-2 h-4 w-4" />}
                      {loading ? 'Generating...' : 'Download Video Scripts'}
                    </Button>
                  )}
                </PDFDownloadLink>
              </CardContent>
            </Card>

            {/* AI Promo Video Prompts */}
            <Card className="border-cyan-500/20">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Video className="h-5 w-5 text-cyan-500" />
                  AI Promo Video Prompts
                </CardTitle>
                <CardDescription>34 ready-to-paste prompts for Runway, Sora, Kling, and similar AI video tools</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2 text-sm text-card-foreground/70">
                  <ul className="list-disc list-inside space-y-1 ml-2">
                    <li>Video prompt per 8s clip</li>
                    <li>Voice-over / audio script</li>
                    <li>Graphic / image prompt</li>
                    <li>All 7 consoles + 24 agents</li>
                  </ul>
                </div>
                <PDFDownloadLink document={<VideoPromptsPDF />} fileName={`ai-promo-video-prompts-${new Date().toISOString().split('T')[0]}.pdf`}>
                  {({ loading }) => (
                    <Button className="w-full" variant="outline" disabled={loading}>
                      {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Download className="mr-2 h-4 w-4" />}
                      {loading ? 'Generating...' : 'Download Promo Prompts'}
                    </Button>
                  )}
                </PDFDownloadLink>
              </CardContent>
            </Card>

            {/* Sales Pitch Data */}
            <Card className="border-emerald-500/20">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5 text-emerald-500" />
                  Sales Pitch Data Pack
                </CardTitle>
                <CardDescription>Visual data, ROI calculators, objection handling, and case studies</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2 text-sm text-card-foreground/70">
                  <ul className="list-disc list-inside space-y-1 ml-2">
                    <li>Visual Bar Charts & Data</li>
                    <li>Competitor Comparisons</li>
                    <li>Objection Handling Scripts</li>
                    <li>Closing Techniques</li>
                  </ul>
                </div>
                <PDFDownloadLink document={<SalesPitchDataPDF />} fileName={`sales-pitch-data-${new Date().toISOString().split('T')[0]}.pdf`}>
                  {({ loading, error }) => (
                    <Button className="w-full" variant="outline" disabled={loading}>
                      {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Download className="mr-2 h-4 w-4" />}
                      {loading ? 'Generating...' : 'Download Sales Data'}
                    </Button>
                  )}
                </PDFDownloadLink>
              </CardContent>
            </Card>

            {/* Brand Asset Guide */}
            <Card className="border-blue-500/20">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Palette className="h-5 w-5 text-cyan-400" />
                  Brand Asset Guide
                </CardTitle>
                <CardDescription>Complete visual identity with colors, typography, and icon concepts</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2 text-sm text-card-foreground/70">
                  <ul className="list-disc list-inside space-y-1 ml-2">
                    <li>Hex Color Palettes</li>
                    <li>24 Agent Icon Concepts</li>
                    <li>Typography Guidelines</li>
                    <li>Template Specifications</li>
                  </ul>
                </div>
                <PDFDownloadLink document={<BrandAssetGuidePDF />} fileName={`brand-asset-guide-${new Date().toISOString().split('T')[0]}.pdf`}>
                  {({ loading, error }) => (
                    <Button className="w-full" variant="outline" disabled={loading}>
                      {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Download className="mr-2 h-4 w-4" />}
                      {loading ? 'Generating...' : 'Download Brand Guide'}
                    </Button>
                  )}
                </PDFDownloadLink>
              </CardContent>
            </Card>

            {/* Website Copy Pack */}
            <Card className="border-cyan-500/20">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Globe className="h-5 w-5 text-cyan-500" />
                  Website Copy Pack
                </CardTitle>
                <CardDescription>SEO-optimized headlines, feature blocks, FAQs, and metadata</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2 text-sm text-card-foreground/70">
                  <ul className="list-disc list-inside space-y-1 ml-2">
                    <li>Homepage Hero Variations</li>
                    <li>24 Agent Descriptions</li>
                    <li>Pricing Page Copy</li>
                    <li>SEO Metadata</li>
                  </ul>
                </div>
                <PDFDownloadLink document={<WebsiteCopyPDF />} fileName={`website-copy-pack-${new Date().toISOString().split('T')[0]}.pdf`}>
                  {({ loading, error }) => (
                    <Button className="w-full" variant="outline" disabled={loading}>
                      {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Download className="mr-2 h-4 w-4" />}
                      {loading ? 'Generating...' : 'Download Website Copy'}
                    </Button>
                  )}
                </PDFDownloadLink>
              </CardContent>
            </Card>

            {/* Industry Marketing Kits */}
            <Card className="border-amber-500/20">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Factory className="h-5 w-5 text-amber-500" />
                  Industry Marketing Kits
                </CardTitle>
                <CardDescription>Targeted content for HVAC, Plumbing, Electrical, and General Contracting</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2 text-sm text-card-foreground/70">
                  <ul className="list-disc list-inside space-y-1 ml-2">
                    <li>Industry Pain Points</li>
                    <li>Seasonal Marketing Angles</li>
                    <li>Email Campaign Templates</li>
                    <li>Competitor Positioning</li>
                  </ul>
                </div>
                <PDFDownloadLink document={<IndustryMarketingKitPDF />} fileName={`industry-marketing-kits-${new Date().toISOString().split('T')[0]}.pdf`}>
                  {({ loading, error }) => (
                    <Button className="w-full" variant="outline" disabled={loading}>
                      {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Download className="mr-2 h-4 w-4" />}
                      {loading ? 'Generating...' : 'Download Industry Kits'}
                    </Button>
                  )}
                </PDFDownloadLink>
              </CardContent>
            </Card>

            {/* AI Promo Video Prompts */}
            <Card className="border-purple-500/20">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Video className="h-5 w-5 text-purple-400" />
                  <CardTitle>AI Promo Video Prompts</CardTitle>
                </div>
                <CardDescription>
                  34 ready-to-use AI video generation prompts for Runway, Sora, Kling & more
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-sm font-medium mb-2 text-card-foreground">Includes:</p>
                  <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
                    <li>Console &amp; Agent Clips (34 total)</li>
                    <li>4m 32s Full Promo Video</li>
                    <li>Color-Coded by Console</li>
                    <li>Assembly Guide Included</li>
                  </ul>
                </div>
                <Link to="/dashboard/video-prompts">
                  <Button className="w-full" variant="outline">
                    <ExternalLink className="mr-2 h-4 w-4" />
                    View Video Prompts
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Document Contents Cards */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          <Card>
            <CardHeader>
              <CardTitle>AI Agent Guide Contents</CardTitle>
              <CardDescription>
                13-page user-friendly reference document
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {[
                  { page: 1, title: 'Cover Page', desc: 'Key stats: 7 consoles, 24 operatives' },
                  { page: 2, title: 'Table of Contents', desc: 'Full document navigation' },
                  { page: 3, title: 'Introduction', desc: 'How to read the guide & legend' },
                  { page: 4, title: 'Communication Channels', desc: 'Voice, SMS, Email, Chat' },
                  { page: 5, title: 'Customer Portal', desc: '4 agents with features' },
                  { page: 6, title: 'Field Operations', desc: '4 agents with features' },
                  { page: 7, title: 'Business Management', desc: '5 agents with features' },
                  { page: 8, title: 'Marketing & Analytics', desc: 'Consoles 4 & 5 overview' },
                  { page: 9, title: 'Analytics Agents', desc: '4 agents + dependency info' },
                  { page: 10, title: 'Agent Summary Table', desc: 'All 24 operatives at a glance' },
                  { page: 11, title: 'Subscription Tiers', desc: 'Which agents per tier' },
                  { page: 12, title: '3rd Party Integrations', desc: 'Required & optional services' },
                  { page: 13, title: 'Glossary & FAQ', desc: 'Terms and common questions' },
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
                  { page: '6-8', title: 'Smart AI Agents Catalog', desc: '24 agents across 7 consoles' },
                  { page: 9, title: 'Control Centers', desc: '7 specialized consoles' },
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
                  { page: 5, title: 'Core Details', desc: '$497/mo tier breakdown' },
                  { page: 6, title: 'Boost Details', desc: '$697/mo tier breakdown' },
                  { page: 7, title: 'Pro Details', desc: '$1,197/mo tier breakdown' },
                  { page: 8, title: 'Elite Details', desc: '$2,197/mo tier breakdown' },
                  { page: 9, title: 'Annual Savings', desc: 'Discount calculations' },
                  { page: 10, title: '3rd Party Costs', desc: 'Integration pricing details' },
                  { page: 11, title: 'Billing Clarifications', desc: 'Company Stripe requirements' },
                  { page: 12, title: 'Cost Examples', desc: 'Total monthly cost scenarios' },
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
                  All PDFs are professionally formatted with consistent branding, page numbers,
                  headers, and tables of contents for easy navigation.
                </p>
              </div>
            </div>
          </CardContent>
         </Card>
        </div>
      </PageContainer>
    </DashboardLayout>
  );
});

ExportDocumentation.displayName = 'ExportDocumentation';

export default ExportDocumentation;