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
        title: '1. Create a Meta App',
        content: [
          'Go to developers.facebook.com/apps → click "Create App"',
          'Choose a use case: select "Other" → click Next',
          'Select app type: choose "Business" → click Next',
          'Enter App Name (e.g., "Aura Intercept"), Contact Email, and optionally link a Business Portfolio',
          'Click "Create App" — you\'ll land on the App Dashboard',
        ],
      },
      {
        title: '2. Settings → Basic',
        content: [
          'In the left sidebar, click Settings → Basic',
          'Copy your App ID (shown at top — public, safe to share)',
          'Click "Show" next to App Secret → copy it (keep this private!)',
          'Set App Domains to your production domain (e.g., auraintercept.ai)',
          'Set Privacy Policy URL (required for App Review)',
          'Set Terms of Service URL (required for App Review)',
          'Scroll to "Data Deletion Request URL" and paste the URL below',
          'Scroll to "Deauthorize Callback URL" and paste the URL below',
          'Click "Save Changes" at the bottom',
        ],
        urls: [
          { label: 'Data Deletion Request URL', urlKey: 'dataDeletion' as const },
          { label: 'Deauthorize Callback URL', urlKey: 'deauthorize' as const },
        ],
      },
      {
        title: '3. Use Cases → Add Use Cases',
        content: [
          'In the left sidebar, click "Use Cases"',
          'You\'ll see available use cases — click "Customize" or "Add" on each:',
          '✅ "Authenticate and request data from users with Facebook Login" — click Customize',
          '✅ "Manage everything on your Page" — click Customize to add Page permissions',
          '✅ "Engage with customers on Messenger from Meta" — click Customize (for webhooks & messaging)',
          '✅ "Manage messaging & content on Instagram" — click Customize (for Instagram posting)',
          'Each use case opens a panel showing required permissions and setup steps',
        ],
      },
      {
        title: '4. Use Cases → Facebook Login → Settings',
        content: [
          'Click "Customize" on the "Facebook Login" use case',
          'In the setup panel, click "Go to settings" or find "Facebook Login → Settings" in the left sidebar',
          'Under "Valid OAuth Redirect URIs", paste the redirect URI below',
          'Click "Save Changes"',
          'This is where your OAuth callback will redirect after user authorization',
        ],
        urls: [
          { label: 'Valid OAuth Redirect URI', urlKey: 'oauth' as const },
        ],
      },
      {
        title: '5. Use Cases → Page Permissions',
        content: [
          'Click "Customize" on the "Manage everything on your Page" use case',
          'You\'ll see a list of permissions — click "Add" next to each required one:',
          '✅ pages_manage_posts — Publish and manage posts on your Pages',
          '✅ pages_read_engagement — View post insights and engagement data',
          '✅ pages_show_list — Allow users to select which Page to connect',
          '✅ pages_read_user_content — Read user-posted content on Pages',
          '✅ business_management — Manage business assets',
          'Each permission shows its status: "Ready for testing" or "Approved"',
        ],
      },
      {
        title: '6. Use Cases → Messenger → Configure Webhooks',
        content: [
          'Click "Customize" on the "Messenger from Meta" use case',
          'You\'ll see 3 numbered steps in the setup panel:',
          '',
          '— Step 1: Configure webhooks —',
          'Click "Configure" next to webhooks',
          'Paste the Webhook Callback URL below into the "Callback URL" field',
          'Enter a Verify Token — choose any secret string (e.g., "aura_verify_2024")',
          'Click "Verify and Save" — Meta will send a GET request to verify your endpoint',
          '⚠️ Save your Verify Token! You\'ll need to store it as META_WEBHOOK_VERIFY_TOKEN in your integration secrets',
          '',
          '— Step 2: Generate access tokens —',
          'Click "Add Page" to connect your Facebook Page',
          'Select your Page from the dialog and grant all requested permissions',
          'Once added, click "Add Subscriptions" next to your page',
          'Subscribe to: messages, messaging_postbacks, messaging_optins',
          'Click "Generate" to create a Page Access Token',
          'IMPORTANT: This is a short-lived token — exchange it for a long-lived one (see Step 9)',
          '',
          '— Step 3: Complete App Review —',
          'This links to App Review (covered in Step 10)',
        ],
        urls: [
          { label: 'Webhook Callback URL', urlKey: 'webhook' as const },
        ],
      },
      {
        title: '7. Webhooks (Global) → Subscribe to Page Events',
        content: [
          'In the left sidebar, click "Webhooks" (not inside a use case)',
          'In the dropdown at the top, select "Page" as the object type',
          'If not already configured, click "Subscribe to this object"',
          'Use the same Callback URL and Verify Token from Step 6',
          'Click "Verify and Save"',
          '',
          'Now subscribe to individual fields by clicking "Subscribe" next to each:',
          '✅ feed — Posts published/updated on your Page (REQUIRED for posting)',
          '✅ messages — Incoming Messenger messages',
          '✅ messaging_postbacks — Button click callbacks from Messenger',
          '✅ messaging_optins — User opt-in events',
          '⬜ leadgen — Facebook Lead Ads (optional)',
          '⬜ mention — Page @mentions (optional)',
          '',
          'Leave all other fields (affiliation, attire, parking, culinary_team, etc.) UNSUBSCRIBED',
          'Use API version v24.0 for all subscriptions',
        ],
        urls: [
          { label: 'Webhook Callback URL', urlKey: 'webhook' as const },
        ],
      },
      {
        title: '8. App Roles → Add Testers',
        content: [
          'In the left sidebar, click "App Roles" → "Roles"',
          'Click "Add People" to invite team members for testing',
          'Assign roles: Admin, Developer, or Tester',
          'Testers must accept the invitation via their Facebook account',
          'While the app is in Development mode, only people with roles can use it',
          'You need at least one tester to verify your integration before App Review',
        ],
      },
      {
        title: '9. Exchange for Long-Lived Token',
        content: [
          'The token from Step 6 expires in ~1 hour — you must exchange it',
          'Make this API call (replace the values):',
          '',
          'GET https://graph.facebook.com/v24.0/oauth/access_token',
          '  ?grant_type=fb_exchange_token',
          '  &client_id=YOUR_APP_ID',
          '  &client_secret=YOUR_APP_SECRET',
          '  &fb_exchange_token=SHORT_LIVED_TOKEN',
          '',
          'The response contains a long-lived token (valid ~60 days)',
          'Store this long-lived Page Access Token in your integration settings on this page',
          'Set a reminder to refresh the token before it expires',
        ],
      },
      {
        title: '10. App Review → Submit Permissions',
        content: [
          'In the left sidebar, click "App Review" → "Requests"',
          'You\'ll see all permissions that need review listed here',
          'Click "Request" next to each permission you need approved',
          'For each permission, provide:',
          '• A clear description of how your app uses this permission',
          '• A screencast demo (2-5 minutes) showing the integration flow',
          '• Include: connecting a page → creating a post → viewing the published post',
          'Submit all permissions together for faster review',
          'Review typically takes 1-5 business days',
          'Until approved, only users with Admin/Developer/Tester roles can use the app',
        ],
      },
      {
        title: '11. Go Live',
        content: [
          'Once App Review is approved, go to Settings → Basic',
          'Toggle App Mode from "Development" to "Live"',
          '',
          '✅ Final Checklist:',
          '• App Mode set to "Live"',
          '• All required permissions approved via App Review',
          '• Webhook endpoint active and responding (test with Webhooks → Test button)',
          '• Long-lived Page Access Token stored and valid',
          '• Privacy Policy and Terms of Service URLs accessible',
          '• Data Deletion and Deauthorize callback URLs configured',
          '• OAuth Redirect URI configured in Facebook Login settings',
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
          'Go to your Meta App → Instagram Messaging (left sidebar)',
          'Scroll down to the "Webhooks" section',
          'Click "Add callback URL"',
          'Paste the Callback URL below into the "Callback URL" field',
          'Set a Verify Token (same one you used for Facebook, e.g., "aura_verify_2024")',
          'Click "Verify and save"',
          'Subscribe to: comments, messages (optional), story_insights',
          'Note: Apps will only receive test webhooks while unpublished — no production data until published',
        ],
        urls: [
          { label: 'Webhook Callback URL', urlKey: 'webhook' as const },
        ],
      },
      {
        title: 'Instagram Messaging — Access Tokens',
        content: [
          'In your Meta App → Instagram Messaging (left sidebar)',
          'Scroll to the "Access tokens" section',
          'You can generate a token if: 1) You are a Page admin, and 2) The app has permission to manage messages',
          'If you see "No page permissions granted", click "Add or remove Pages"',
          'Select your Facebook Page that is linked to your Instagram Business account',
          'Grant the required permissions when prompted',
          'Once the page is added, generate the access token',
          'Store this token in your integration settings',
        ],
      },
      {
        title: 'Instagram Webhook Debugger',
        content: [
          'In Instagram Messaging → scroll to "Webhook Debugger" section',
          'Enter your Page IDs (up to 10, separated by commas or spaces)',
          'Click "Submit" to check your app\'s subscription status for those pages',
          'This verifies that your webhook is properly connected and receiving events',
          'Use this to troubleshoot if you\'re not receiving webhook notifications',
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
