import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { toast } from 'sonner';
import { Copy, Check, ExternalLink, Instagram, Facebook, Linkedin, Video, Building2, Webhook, DollarSign } from 'lucide-react';

interface SocialMediaSetupGuideProps {
  platform: 'facebook' | 'instagram' | 'linkedin' | 'tiktok' | 'google_business';
}

const PLATFORM_CONFIG = {
  facebook: {
    name: 'Facebook',
    icon: Facebook,
    color: 'bg-blue-600',
    description: 'Connect your Facebook Page to publish posts directly from the platform.',
    consoleUrl: 'https://developers.facebook.com/apps',
    authUrl: 'https://www.facebook.com/v24.0/dialog/oauth',
    docsUrl: 'https://developers.facebook.com/docs/pages-api/',
    steps: [
      {
        title: 'Create a Meta App',
        content: [
          'Go to Meta for Developers',
          'Click "Create App" and select "Business" type',
          'Enter your app name and contact email',
          'Complete the security check',
        ],
      },
      {
        title: 'Configure Facebook Login',
        content: [
          'In your app dashboard, click "Add Product"',
          'Select "Facebook Login" and click "Set Up"',
          'Choose "Web" as platform',
          'Add your OAuth redirect URL',
        ],
      },
      {
        title: 'Get App Credentials',
        content: [
          'Go to Settings → Basic',
          'Copy your App ID (public)',
          'Click "Show" to reveal App Secret',
          'Store App Secret securely',
        ],
      },
      {
        title: 'Request Permissions',
        content: [
          'pages_manage_posts - Post to your Pages',
          'pages_read_engagement - View post insights',
          'pages_show_list - List your Pages',
          'Submit for App Review if publishing publicly',
        ],
      },
    ],
    pricing: 'Free to use. Posts to your connected Pages at no cost.',
  },
  instagram: {
    name: 'Instagram',
    icon: Instagram,
    color: 'bg-gradient-to-br from-purple-600 to-pink-500',
    description: 'Publish photos and content to your Instagram Business or Creator account.',
    consoleUrl: 'https://developers.facebook.com/apps',
    authUrl: 'https://www.facebook.com/v24.0/dialog/oauth',
    docsUrl: 'https://developers.facebook.com/docs/instagram-api/',
    steps: [
      {
        title: 'Prerequisites',
        content: [
          'Instagram Business or Creator account required',
          'Account must be connected to a Facebook Page',
          'Use the same Meta App as Facebook integration',
          'No personal Instagram accounts supported',
        ],
      },
      {
        title: 'Enable Instagram Graph API',
        content: [
          'In your Meta App, go to "Add Product"',
          'Select "Instagram Graph API"',
          'Complete the product setup wizard',
          'Link your Instagram Business account',
        ],
      },
      {
        title: 'Request Instagram Permissions',
        content: [
          'instagram_basic - Access profile info',
          'instagram_content_publish - Publish media',
          'instagram_manage_comments - Manage comments',
          'Submit for review before going live',
        ],
      },
      {
        title: 'Content Requirements',
        content: [
          'Images must be JPEG format, max 8MB',
          'Aspect ratio between 4:5 and 1.91:1',
          'Videos: MP4, max 100MB, 3-60 seconds',
          'Carousel posts: 2-10 items',
        ],
      },
    ],
    pricing: 'Free to post. Uses Meta Graph API with same app as Facebook.',
  },
  linkedin: {
    name: 'LinkedIn',
    icon: Linkedin,
    color: 'bg-blue-700',
    description: 'Share updates to your LinkedIn profile or Company Page.',
    consoleUrl: 'https://www.linkedin.com/developers/apps',
    authUrl: 'https://www.linkedin.com/oauth/v2/authorization',
    docsUrl: 'https://learn.microsoft.com/en-us/linkedin/marketing/',
    steps: [
      {
        title: 'Create LinkedIn App',
        content: [
          'Go to LinkedIn Developers',
          'Click "Create App"',
          'Fill in app name, company, and logo',
          'Accept the Legal Agreement',
        ],
      },
      {
        title: 'Configure OAuth 2.0',
        content: [
          'Go to Auth tab in your app',
          'Add your OAuth 2.0 redirect URL',
          'Note the Client ID and Client Secret',
          'Enable required scopes',
        ],
      },
      {
        title: 'Request API Products',
        content: [
          'Go to Products tab',
          'Request "Share on LinkedIn" for personal posts',
          'Request "Marketing Developer Platform" for company posts',
          'Wait for approval (usually instant for Share)',
        ],
      },
      {
        title: 'API Requirements (2026)',
        content: [
          'Use X-Restli-Protocol-Version: 2.0.0 header',
          'UGC Posts API for creating posts',
          'Rate limit: 100 requests/day for shares',
          'Images must be uploaded first, then attached',
        ],
      },
    ],
    pricing: 'Free tier includes 100 share requests/day. Marketing API requires partnership.',
  },
  tiktok: {
    name: 'TikTok',
    icon: Video,
    color: 'bg-black',
    description: 'Post videos directly to TikTok using the Direct Post API.',
    consoleUrl: 'https://developers.tiktok.com/apps',
    authUrl: 'https://www.tiktok.com/v2/auth/authorize/',
    docsUrl: 'https://developers.tiktok.com/doc/content-posting-api-get-started',
    steps: [
      {
        title: 'Create TikTok Developer App',
        content: [
          'Sign in to TikTok for Developers',
          'Click "Manage Apps" → "Create App"',
          'Select "Content Posting" as use case',
          'Fill in app details and submit',
        ],
      },
      {
        title: 'Configure Redirect URI',
        content: [
          'Go to your app settings',
          'Add your OAuth redirect URI',
          'Enable "Login Kit" product',
          'Note your Client Key and Secret',
        ],
      },
      {
        title: 'Request Direct Post Access',
        content: [
          'In app settings, go to "Manage Products"',
          'Enable "Content Posting API"',
          'Select "Direct Post" scope',
          'Submit for review (takes 1-3 business days)',
        ],
      },
      {
        title: 'AI Content Disclosure (Required 2026)',
        content: [
          'All AI-generated content MUST include is_aigc: true',
          'This is a TikTok policy requirement',
          'Failure to comply may result in content removal',
          'Our system handles this automatically',
        ],
      },
    ],
    pricing: 'Free to post. Subject to TikTok creator monetization policies.',
  },
  google_business: {
    name: 'Google Business',
    icon: Building2,
    color: 'bg-green-600',
    description: 'Update your Google Business Profile with posts and updates.',
    consoleUrl: 'https://console.cloud.google.com',
    authUrl: 'https://accounts.google.com/o/oauth2/v2/auth',
    docsUrl: 'https://developers.google.com/my-business/content/posts-data',
    steps: [
      {
        title: 'Enable Business Profile API',
        content: [
          'Go to Google Cloud Console',
          'Create or select a project',
          'Enable "Business Profile API"',
          'Enable "My Business Business Information API"',
        ],
      },
      {
        title: 'Create OAuth Credentials',
        content: [
          'Go to APIs & Services → Credentials',
          'Create OAuth 2.0 Client ID',
          'Select "Web application" type',
          'Add your redirect URI',
        ],
      },
      {
        title: 'Configure Consent Screen',
        content: [
          'Set up OAuth consent screen',
          'Add scope: https://www.googleapis.com/auth/business.manage',
          'Add test users during development',
          'Submit for verification for production',
        ],
      },
      {
        title: 'Post Types Supported',
        content: [
          'What\'s New - General updates',
          'Events - Time-based promotions',
          'Offers - Discounts and deals',
          'Products - Showcase inventory',
        ],
      },
    ],
    pricing: 'Free. Uses same Google Cloud project as Calendar integration.',
  },
};

export function SocialMediaSetupGuide({ platform }: SocialMediaSetupGuideProps) {
  const [copiedItems, setCopiedItems] = useState<Record<string, boolean>>({});
  const config = PLATFORM_CONFIG[platform];
  const Icon = config.icon;

  const copyToClipboard = async (text: string, itemId: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedItems(prev => ({ ...prev, [itemId]: true }));
      toast.success('Copied to clipboard!');
      setTimeout(() => {
        setCopiedItems(prev => ({ ...prev, [itemId]: false }));
      }, 2000);
    } catch {
      toast.error('Failed to copy');
    }
  };

  const OAUTH_CALLBACK_URL = `${window.location.origin}/api/social-oauth/callback`;

  return (
    <Card className="guide-card guide-card-social">
      <CardHeader>
        <div className="flex items-center gap-2">
          <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${config.color}`}>
            <Icon className="w-4 h-4 text-white" />
          </div>
          <CardTitle className="text-lg">{config.name} Setup Guide</CardTitle>
          <Badge variant="secondary">Social Media</Badge>
        </div>
        <CardDescription>{config.description}</CardDescription>
      </CardHeader>
      <CardContent>
        <Accordion type="single" collapsible className="w-full">
          {config.steps.map((step, index) => (
            <AccordionItem key={index} value={`step-${index + 1}`}>
              <AccordionTrigger className="text-sm">
                <span className="flex items-center gap-2">
                  <Badge variant="outline" className={`rounded-full px-2 py-0.5 text-xs text-white border-0 ${config.color}`}>
                    {index + 1}
                  </Badge>
                  {step.title}
                </span>
              </AccordionTrigger>
              <AccordionContent className="text-sm text-foreground/80 space-y-3">
                <ol className="list-decimal list-inside space-y-2">
                  {step.content.map((item, i) => (
                    <li key={i}>{item}</li>
                  ))}
                </ol>
              </AccordionContent>
            </AccordionItem>
          ))}

          {/* OAuth Callback URL */}
          <AccordionItem value="callback">
            <AccordionTrigger className="text-sm">
              <span className="flex items-center gap-2">
                <Badge variant="outline" className="rounded-full px-2 py-0.5 text-xs bg-amber-500 text-white border-amber-500">
                  <Webhook className="w-3 h-3" />
                </Badge>
                OAuth Callback URL
              </span>
            </AccordionTrigger>
            <AccordionContent className="text-sm text-foreground/80 space-y-3">
              <p>Add this URL as your OAuth redirect/callback URI in the {config.name} developer console:</p>
              <div className="bg-muted p-3 rounded-lg flex items-center justify-between gap-2">
                <code className="text-xs break-all">{OAUTH_CALLBACK_URL}</code>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => copyToClipboard(OAUTH_CALLBACK_URL, 'callback')}
                >
                  {copiedItems['callback'] ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                </Button>
              </div>
            </AccordionContent>
          </AccordionItem>

          {/* Pricing */}
          <AccordionItem value="pricing">
            <AccordionTrigger className="text-sm">
              <span className="flex items-center gap-2">
                <Badge variant="outline" className="rounded-full px-2 py-0.5 text-xs bg-green-500 text-white border-green-500">
                  <DollarSign className="w-3 h-3" />
                </Badge>
                Pricing & Limits
              </span>
            </AccordionTrigger>
            <AccordionContent className="text-sm text-foreground/80">
              <p>{config.pricing}</p>
            </AccordionContent>
          </AccordionItem>
        </Accordion>

        <div className="mt-4 flex gap-2">
          <Button variant="outline-card" size="sm" asChild>
            <a href={config.consoleUrl} target="_blank" rel="noopener noreferrer" className="gap-1">
              Developer Console <ExternalLink className="w-3 h-3" />
            </a>
          </Button>
          <Button variant="outline-card" size="sm" asChild>
            <a href={config.docsUrl} target="_blank" rel="noopener noreferrer" className="gap-1">
              API Docs <ExternalLink className="w-3 h-3" />
            </a>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
