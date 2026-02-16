import { useState } from 'react';
import { getPublishedDomain } from '@/lib/url';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { toast } from 'sonner';
import { Copy, Check, ExternalLink, Instagram, Facebook, Linkedin, Video, Building2, DollarSign } from 'lucide-react';

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
          'Go to developers.facebook.com → My Apps → Create App',
          'Select "Other" for use case, then "Business" as app type',
          'Enter your app name (e.g., "Aura Intercept") and contact email',
          'Link to your Meta Business Account (create one if needed)',
        ],
      },
      {
        title: 'Add Required Use Cases',
        content: [
          'In App Dashboard → Use Cases → click "Customize" or "Add"',
          '✅ "Manage everything on your Page" — required to publish posts to Facebook Pages',
          '✅ "Manage messaging & content on Instagram" — required for Instagram posting',
          '✅ "Engage with customers on Messenger from Meta" — for Messenger integration (optional)',
          'For each use case, click "Customize" and add all required permissions',
        ],
      },
      {
        title: 'Configure Facebook Login for Business',
        content: [
          'In Use Cases → "Manage everything on your Page" → Customize',
          'Go to "API setup with Facebook login" section',
          'Add the OAuth Redirect URI below to "Valid OAuth Redirect URIs"',
          'Under Settings → Basic, set your App Domains, Privacy Policy URL, and Terms of Service URL',
        ],
        urls: [
          { label: 'OAuth Redirect URI', urlKey: 'oauth' as const },
        ],
      },
      {
        title: 'Set Required URLs in App Settings',
        content: [
          'Go to Settings → Basic in your Meta App',
          'Set Privacy Policy URL (required for review)',
          'Set Terms of Service URL (required for review)',
          'Under Settings → Advanced, paste the Deauthorize Callback URL below',
          'Paste the Data Deletion Request URL below (GDPR compliance)',
        ],
        urls: [
          { label: 'Deauthorize Callback URL', urlKey: 'deauthorize' as const },
          { label: 'Data Deletion Request URL', urlKey: 'dataDeletion' as const },
        ],
      },
      {
        title: 'Get App Credentials',
        content: [
          'Go to Settings → Basic',
          'Copy your App ID (public — safe to share)',
          'Click "Show" to reveal App Secret (keep private!)',
          'Store App Secret in the integration settings on this page',
        ],
      },
      {
        title: 'Required Permissions (Facebook)',
        content: [
          'pages_manage_posts — Publish and manage posts on your Pages',
          'pages_read_engagement — View post insights and engagement data',
          'pages_show_list — Allow users to select which Page to connect',
          'pages_read_user_content — Read user-posted content on Pages',
          'business_management — Manage business assets',
          'All permissions must be approved via App Review before going live',
        ],
      },
      {
        title: '⚙️ Configure Webhooks (Step 1 in Messenger Use Case)',
        content: [
          'In Use Cases → "Messenger from Meta" → Customize',
          'Expand "1. Configure webhooks" section',
          'Paste the Callback URL below into the "Callback URL" field',
          'Set Verify Token to a secret string you choose (save it securely)',
          'Click "Verify and save" — Meta will send a GET request to verify your endpoint',
          'If verification fails, ensure your webhook function is deployed and the verify token matches',
        ],
        urls: [
          { label: 'Webhook Callback URL', urlKey: 'webhook' as const },
        ],
      },
      {
        title: '📋 Subscribe to Webhook Fields',
        content: [
          'After webhook verification, you must subscribe to specific fields',
          '✅ feed — Notifies when posts are published/updated on your Page (REQUIRED for posting)',
          '✅ messages — Receive incoming Messenger messages',
          '✅ messaging_postbacks — Receive button click callbacks from Messenger',
          '✅ messaging_optins — When users opt in to receive messages',
          '⬜ leadgen — Capture leads from Facebook Lead Ads (optional)',
          '⬜ mention — When your page is @mentioned (optional)',
          '⬜ ratings — When your page receives ratings (optional)',
          'Leave all other fields (affiliation, attire, parking, etc.) UNSUBSCRIBED — they are not needed',
        ],
      },
      {
        title: '🔑 Generate Page Access Tokens (Step 2)',
        content: [
          'In the same Messenger settings, expand "2. Generate access tokens"',
          'Click "Add Page" and select your Facebook Page (e.g., "Aura Intercept")',
          'Click "Generate" next to your page to create a Page Access Token',
          'IMPORTANT: This generates a short-lived token — exchange it for a long-lived token via the API',
          'Click "Add Subscriptions" to subscribe the page to your chosen webhook fields',
          'Select the same fields you enabled above (feed, messages, etc.)',
          'Store the Page Access Token in your integration settings',
        ],
      },
      {
        title: '🛡️ Complete App Review (Step 3)',
        content: [
          'Go to App Review → Requests in your Meta App',
          'Request pages_messaging permission to send messages to all users',
          'Submit each permission with a clear description of how you use it',
          'Provide a screencast demo (2-5 minutes) showing the integration flow',
          'Include: connecting a page, creating a post, viewing the published post',
          'Review typically takes 1-5 business days',
          'Until approved, only users with Admin/Developer/Tester roles can use the app',
        ],
      },
      {
        title: '🚀 Go Live Checklist',
        content: [
          'App mode must be set to "Live" (not "Development") in Settings → Basic',
          'All required permissions must be approved via App Review',
          'Webhook endpoint must be active and responding to events',
          'Page Access Token must be valid (long-lived, not expired)',
          'Privacy Policy and Terms of Service URLs must be accessible',
          'Deauthorize and Data Deletion callback URLs must be configured',
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
    docsUrl: 'https://developers.facebook.com/docs/instagram-platform/',
    steps: [
      {
        title: 'Prerequisites',
        content: [
          'Instagram Business or Creator account required (not personal)',
          'Instagram account MUST be connected to a Facebook Page',
          'Uses the same Meta App as Facebook integration — create one app for both',
          'Meta Business Account must be linked to the app',
        ],
      },
      {
        title: 'Add Instagram API Use Case',
        content: [
          'In your Meta App → Use Cases → Add "Instagram API"',
          'Click "Customize" on the Instagram API use case',
          'You will see two setup paths: "API setup with Instagram login" and "API setup with Facebook login"',
          'Use "API setup with Facebook login" — this is required for content publishing',
        ],
      },
      {
        title: 'Add Required Content Permissions (Facebook Login path)',
        content: [
          'Under "Manage content on Instagram" section, click "Add required content permissions"',
          'instagram_basic — Access profile info and media',
          'instagram_content_publishing — Create and publish media',
          'pages_read_engagement — Read page engagement data',
          'business_management — Manage business assets',
          'pages_show_list — List pages connected to Instagram',
        ],
      },
      {
        title: 'Add Messaging Permissions (optional)',
        content: [
          'Under "Send messages on Instagram" section (if needed):',
          'instagram_manage_messages — Send and receive DMs',
          'instagram_basic — Already added above',
          'pages_read_engagement — Already added above',
          'pages_show_list — Already added above',
          'business_management — Already added above',
        ],
      },
      {
        title: 'Add Instagram Login Permissions (alternative path)',
        content: [
          'Under "API setup with Instagram login" section:',
          'instagram_business_basic — Access business profile info',
          'instagram_manage_comments — Read and manage comments',
          'instagram_business_manage_messages — Send and receive DMs',
          'Click "Add all required permissions" to enable them',
        ],
      },
      {
        title: 'Configure Instagram Webhooks',
        content: [
          'In Instagram API → Customize → Webhooks section',
          'Paste the Callback URL below into the "Callback URL" field',
          'Set a Verify Token (any secret string you choose — save it)',
          'Click "Verify and save"',
          'Subscribe to: comments, messages (optional), story_insights',
          'Note: App must be in "Published" state to receive webhooks',
        ],
        urls: [
          { label: 'Webhook Callback URL', urlKey: 'webhook' as const },
        ],
      },
      {
        title: 'Set Up Instagram Business Login',
        content: [
          'In Instagram API → Customize → "Set up Instagram business login"',
          'Click "Set up" and paste the OAuth redirect URI below',
          'This enables your tenant users to connect their Instagram accounts',
        ],
        urls: [
          { label: 'OAuth Redirect URI', urlKey: 'oauth' as const },
        ],
      },
      {
        title: 'Generate Access Tokens (Testing)',
        content: [
          'In Instagram API → "Generate access tokens" section',
          'Click "Add account" to connect your Instagram test account',
          'Before adding, assign "Instagram Tester" role in Roles tab',
          'The tester must accept the invitation on Instagram',
          'Generate a token to test API calls before going live',
        ],
      },
      {
        title: 'Content Requirements',
        content: [
          'Images: JPEG format, max 8MB, aspect ratio between 4:5 and 1.91:1',
          'Videos: MP4, max 100MB, 3-60 seconds, minimum 720p',
          'Carousel posts: 2-10 items (images or videos)',
          'Reels: MP4, 0-90 seconds, 9:16 aspect ratio recommended',
          'All media must be hosted on a publicly accessible URL before publishing',
        ],
      },
      {
        title: 'Complete App Review',
        content: [
          'Go to App Review → submit permissions for review',
          'Instagram requires successful app review before accessing live data',
          'Provide clear use-case descriptions and a screencast demo',
          'Until approved, only users with Tester/Admin roles can use the integration',
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
          'Paste the OAuth redirect URL below into "Authorized redirect URLs"',
          'Note the Client ID and Client Secret',
          'Enable required scopes',
        ],
        urls: [
          { label: 'OAuth Redirect URL', urlKey: 'oauth' as const },
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
          'Paste the OAuth redirect URI below',
          'Enable "Login Kit" product',
          'Note your Client Key and Secret',
        ],
        urls: [
          { label: 'OAuth Redirect URI', urlKey: 'oauth' as const },
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
          'Paste the redirect URI below into "Authorized redirect URIs"',
        ],
        urls: [
          { label: 'OAuth Redirect URI', urlKey: 'oauth' as const },
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

  const publishedDomain = getPublishedDomain();
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
  const urlMap: Record<string, string> = {
    oauth: `${publishedDomain}/api/social-oauth/callback`,
    webhook: `${supabaseUrl}/functions/v1/social-webhook`,
    deauthorize: `${supabaseUrl}/functions/v1/social-oauth-deauthorize`,
    dataDeletion: `${supabaseUrl}/functions/v1/social-oauth-data-deletion`,
  };

  

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
                {step.urls && step.urls.length > 0 && (
                  <div className="space-y-2 mt-3">
                    {step.urls.map((urlItem, i) => (
                      <div key={i}>
                        <p className="text-xs font-medium mb-1 text-foreground">{urlItem.label}:</p>
                        <div className="bg-primary/10 p-3 rounded-lg flex items-center justify-between gap-2 border border-primary/20">
                          <code className="text-xs break-all text-foreground font-mono">{urlMap[urlItem.urlKey]}</code>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => copyToClipboard(urlMap[urlItem.urlKey], `${urlItem.urlKey}-${index}-${i}`)}
                          >
                            {copiedItems[`${urlItem.urlKey}-${index}-${i}`] ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </AccordionContent>
            </AccordionItem>
          ))}

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
