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
        title: '1. Register as a Meta Developer',
        content: [
          'Go to developers.facebook.com and click "Get Started"',
          'Log in with your Facebook account',
          'Accept the Meta Platform Terms and Developer Policies',
          'Verify your account (phone or email verification may be required)',
          'Once verified, you\'ll have access to the Meta Developer Dashboard',
        ],
      },
      {
        title: '2. Create a New App',
        content: [
          'From the Developer Dashboard, click "Create App"',
          'You\'ll see a list of use cases with checkboxes — select these three:',
          '✅ "Authenticate and request data from users with Facebook Login"',
          '✅ "Manage everything on your Page"',
          '✅ "Engage with customers on Messenger from Meta"',
          'Click "Next"',
          'Enter your App Name (e.g., "Aura Intercept")',
          'Enter your App Contact Email',
          'Under "Business Portfolio", link your Meta Business Portfolio (or create one)',
          'Click "Create App"',
          'You\'ll be redirected to the App Dashboard',
        ],
      },
      {
        title: '3. App Dashboard → Overview',
        content: [
          'You\'re now on the App Dashboard overview page',
          'Note your App ID displayed at the top of the page — you\'ll need this later',
          'Below, you\'ll see the use cases you selected during creation',
          'Each use case shows which products were added (Facebook Login, Webhooks, etc.)',
          'The left sidebar now shows all available navigation sections for your app',
        ],
      },
      {
        title: '4. Settings → Basic',
        content: [
          'In the left sidebar, click "Settings" → "Basic"',
          'Copy your App ID (displayed at the top — this is public)',
          'Click "Show" next to App Secret → copy it (keep this private!)',
          'Set "App Domains" to your production domain (e.g., auraintercept.ai)',
          'Set "Privacy Policy URL" (required for App Review)',
          'Set "Terms of Service URL" (required for App Review)',
          'Scroll down to "Data Deletion Request URL" — paste the URL below',
          'Scroll down to "Deauthorize Callback URL" — paste the URL below',
          'Click "Save Changes" at the bottom of the page',
        ],
        urls: [
          { label: 'Data Deletion Request URL', urlKey: 'dataDeletion' as const },
          { label: 'Deauthorize Callback URL', urlKey: 'deauthorize' as const },
        ],
      },
      {
        title: '5. Settings → Advanced (Optional)',
        content: [
          'In the left sidebar, click "Settings" → "Advanced"',
          'Review "Server IP Allowlists" if you want to restrict API access by IP',
          'Check the "API version" settings — ensure v24.0 or later is selected',
          'Review "Security" settings as needed',
          'This step is optional — defaults work for most setups',
        ],
      },
      {
        title: '6. Use Cases → Customize Facebook Login',
        content: [
          'In the left sidebar, click "Use Cases"',
          'Find "Authenticate and request data from users with Facebook Login"',
          'Click "Customize" on that use case',
          'In the configuration panel, navigate to "Facebook Login" → "Settings"',
          'Under "Valid OAuth Redirect URIs", paste the redirect URI below',
          'Click "Save Changes"',
          'This is where users will be redirected after authorizing your app',
        ],
        urls: [
          { label: 'Valid OAuth Redirect URI', urlKey: 'oauth' as const },
        ],
      },
      {
        title: '7. Use Cases → Customize Page Permissions',
        content: [
          'Go back to "Use Cases" in the left sidebar',
          'Find "Manage everything on your Page"',
          'Click "Customize" on that use case',
          'You\'ll see a list of available permissions — click "Add" next to each:',
          '✅ pages_manage_posts — Publish and manage posts on your Pages',
          '✅ pages_read_engagement — View post insights and engagement data',
          '✅ pages_show_list — Allow users to select which Page to connect',
          '✅ pages_read_user_content — Read user-posted content on Pages',
          '✅ pages_manage_metadata — Manage Page metadata and settings',
          'Each permission will show its status: "Ready for testing" or "Needs review"',
        ],
      },
      {
        title: '8. Use Cases → Customize Messenger',
        content: [
          'Go back to "Use Cases" in the left sidebar',
          'Find "Engage with customers on Messenger from Meta"',
          'Click "Customize" on that use case',
          '',
          '— Configure Webhooks —',
          'In the configuration panel, find the webhooks section',
          'Paste the Webhook Callback URL below into the "Callback URL" field',
          'Enter a Verify Token — choose any secret string (e.g., "aura_verify_2024")',
          'Click "Verify and Save" — Meta will send a GET request to verify your endpoint',
          '⚠️ Save your Verify Token! Store it as META_WEBHOOK_VERIFY_TOKEN in your integration secrets',
          '',
          '— Generate Access Tokens —',
          'In the access tokens section, click "Add Page"',
          'Select your Facebook Page from the dialog and grant all requested permissions',
          'Once the page is added, click "Add Subscriptions" next to your page',
          'Subscribe to: messages, messaging_postbacks, messaging_optins',
          'Click "Generate" to create a Page Access Token',
          'IMPORTANT: This is a short-lived token — exchange it for a long-lived one (see Step 11)',
        ],
        urls: [
          { label: 'Webhook Callback URL', urlKey: 'webhook' as const },
        ],
      },
      {
        title: '9. Webhooks (Global Sidebar)',
        content: [
          'In the left sidebar, click "Webhooks" (this is a top-level item, not inside a use case)',
          'In the dropdown at the top, select "Page" as the object type',
          'If not already configured, paste the Callback URL and Verify Token from Step 8',
          'Click "Verify and Save"',
          '',
          'Subscribe to individual fields by clicking "Subscribe" next to each:',
          '✅ feed — Posts published/updated on your Page (REQUIRED for content publishing)',
          '✅ messages — Incoming Messenger messages',
          '✅ messaging_postbacks — Button click callbacks from Messenger',
          '✅ messaging_optins — User opt-in events',
          '',
          '⬜ Leave ALL other fields UNSUBSCRIBED (affiliation, attire, parking, culinary_team, etc.)',
          'Use API version v24.0 for all subscriptions',
        ],
        urls: [
          { label: 'Webhook Callback URL', urlKey: 'webhook' as const },
        ],
      },
      {
        title: '10. App Roles → Roles',
        content: [
          'In the left sidebar, click "App Roles" → "Roles"',
          'Click "Add People" to invite team members',
          'Assign roles: Admin, Developer, or Tester',
          'Invited users must accept the invitation via their Facebook account',
          'While the app is in Development mode, only people with assigned roles can use it',
          'You need at least one tester to verify your integration before submitting for App Review',
        ],
      },
      {
        title: '11. Exchange for Long-Lived Token',
        content: [
          'The Page Access Token from Step 8 expires in ~1 hour — you must exchange it',
          'Make this API call (replace the placeholder values):',
          '',
          'GET https://graph.facebook.com/v24.0/oauth/access_token',
          '  ?grant_type=fb_exchange_token',
          '  &client_id=YOUR_APP_ID',
          '  &client_secret=YOUR_APP_SECRET',
          '  &fb_exchange_token=SHORT_LIVED_TOKEN',
          '',
          'The response contains a long-lived token (valid ~60 days)',
          'Store this long-lived Page Access Token in your integration settings',
          'Set a reminder to refresh the token before it expires',
        ],
      },
      {
        title: '12. App Review → Requests',
        content: [
          'In the left sidebar, click "App Review" → "Requests"',
          'You\'ll see all permissions that need review listed here',
          'Click "Request" next to each permission you need approved',
          'For each permission, you must provide:',
          '• A clear description of how your app uses this permission',
          '• A screencast demo (2-5 minutes) showing the full integration flow',
          '• Include: connecting a page → creating a post → viewing the published post',
          'Submit all permissions together for faster review',
          'Review typically takes 1-5 business days',
          'Until approved, only users with Admin/Developer/Tester roles can use the app',
        ],
      },
      {
        title: '13. Go Live',
        content: [
          'Once App Review is approved, go to "Settings" → "Basic"',
          'Toggle "App Mode" from "Development" to "Live"',
          '',
          '✅ Final Checklist:',
          '• App Mode set to "Live"',
          '• All required permissions approved via App Review',
          '• Webhook endpoint active and responding (test via Webhooks → Test button)',
          '• Long-lived Page Access Token stored and valid',
          '• Privacy Policy and Terms of Service URLs accessible',
          '• Data Deletion Request URL configured (Step 4)',
          '• Deauthorize Callback URL configured (Step 4)',
          '• OAuth Redirect URI configured (Step 6)',
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
          'Uses the same Meta App created in the Facebook setup guide above',
          'If you haven\'t created a Meta App yet, follow the Facebook guide Steps 1-4 first',
          'Meta Business Portfolio must be linked to the app',
        ],
      },
      {
        title: 'Add Instagram Use Case to Your App',
        content: [
          'In your Meta App, go to "Use Cases" in the left sidebar',
          'Find "Manage messaging and content on Instagram"',
          'Click "Add" or "Customize" on that use case',
          'If you didn\'t select this during app creation, you can add it here',
          'This adds Instagram-specific products and permissions to your app',
        ],
      },
      {
        title: 'Add Required Content Permissions (Facebook Login path)',
        content: [
          'Click "Customize" on the Instagram use case',
          'Under "API setup with Facebook login", look for "Manage content on Instagram"',
          'Click "Add required content permissions" — this adds:',
          '✅ instagram_basic — Access profile info and media',
          '✅ instagram_content_publish — Create and publish media',
          '✅ pages_read_engagement — Read page engagement data',
          '✅ business_management — Manage business assets',
          '✅ pages_show_list — List pages connected to Instagram',
        ],
      },
      {
        title: 'Add Messaging Permissions (Optional)',
        content: [
          'Under "Send messages on Instagram" section (if needed for DMs):',
          '✅ instagram_manage_messages — Send and receive DMs',
          '✅ instagram_basic — Already added above',
          '✅ pages_read_engagement — Already added above',
          '✅ pages_show_list — Already added above',
          '✅ business_management — Already added above',
        ],
      },
      {
        title: 'Configure Instagram Webhooks',
        content: [
          'In the left sidebar, find "Instagram Messaging" or the Instagram webhook section',
          'Click "Add callback URL"',
          'Paste the Webhook Callback URL below into the "Callback URL" field',
          'Set a Verify Token (use the same one from your Facebook setup, e.g., "aura_verify_2024")',
          'Click "Verify and Save"',
          'Subscribe to: comments, messages (optional), story_insights',
          'Note: In Development mode, only test webhooks are received — no production data until published',
        ],
        urls: [
          { label: 'Webhook Callback URL', urlKey: 'webhook' as const },
        ],
      },
      {
        title: 'Instagram Access Tokens',
        content: [
          'In the Instagram Messaging section, scroll to "Access tokens"',
          'Click "Add Page" or "Add or remove Pages" if no page is listed',
          'Select your Facebook Page that is linked to your Instagram Business account',
          'Grant all requested permissions when prompted',
          'Once added, click "Generate" to create an access token',
          'Store this token in your integration settings',
          'Use the Webhook Debugger section to verify your subscription status',
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
          'Go to "App Review" → "Requests" in the left sidebar',
          'Submit all Instagram permissions for review',
          'Provide clear use-case descriptions and a screencast demo (2-5 min)',
          'Instagram requires successful app review before accessing live user data',
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
