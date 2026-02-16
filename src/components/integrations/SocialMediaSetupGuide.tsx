import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { toast } from 'sonner';
import { Copy, Check, ExternalLink, Instagram, Facebook, Linkedin, Video, Building2, DollarSign, FileText, Clock } from 'lucide-react';

interface SocialMediaSetupGuideProps {
  platform: 'facebook' | 'instagram' | 'linkedin' | 'tiktok' | 'google_business';
}

const PLATFORM_CONFIG = {
  facebook: {
    name: 'Facebook',
    icon: Facebook,
    color: 'bg-blue-600',
    description: 'Platform admin guide: Register Aura Intercept as a Meta Tech Provider to enable one-click Facebook Page connections for all tenants.',
    consoleUrl: 'https://developers.facebook.com/apps',
    docsUrl: 'https://developers.facebook.com/docs/pages-api/',
    reviewTimeline: '1–5 business days for App Review',
    requiredDocs: ['Privacy Policy (public URL)', 'Terms of Service (public URL)', 'Data Processing Agreement', 'Business Verification documents (business license, utility bill, or bank statement)'],
    steps: [
      {
        title: '1. Register as a Meta Developer',
        content: [
          'Go to developers.facebook.com and click "Get Started"',
          'Log in with your Facebook account (use the Aura Intercept company account)',
          'Accept the Meta Platform Terms and Developer Policies',
          'Verify your account (phone or email verification required)',
          'You now have access to the Meta Developer Dashboard',
        ],
      },
      {
        title: '2. Create a "Business" Type App',
        content: [
          'From the Developer Dashboard, click "Create App"',
          'Select these use cases:',
          '✅ "Authenticate and request data from users with Facebook Login"',
          '✅ "Manage everything on your Page"',
          '✅ "Engage with customers on Messenger from Meta"',
          'Click "Next"',
          'App Name: "Aura Intercept" (or your platform name)',
          'App Contact Email: your platform admin email',
          'Link your Meta Business Portfolio (or create one)',
          'Click "Create App" — you\'ll be redirected to the App Dashboard',
        ],
      },
      {
        title: '3. Settings → Basic — Configure App Details',
        content: [
          'In left sidebar: "Settings" → "Basic"',
          'Copy your App ID — enter this in Platform Settings above as META_APP_ID',
          'Click "Show" next to App Secret → copy it — enter as META_APP_SECRET',
          'Set "App Domains" to: auraintercept.ai',
          'Set "Privacy Policy URL" to your published privacy policy',
          'Set "Terms of Service URL" to your published terms',
          'Set "Data Deletion Request URL" — paste the URL below',
          'Set "Deauthorize Callback URL" — paste the URL below',
          'Click "Save Changes"',
        ],
        urls: [
          { label: 'Data Deletion Request URL', urlKey: 'dataDeletion' as const },
          { label: 'Deauthorize Callback URL', urlKey: 'deauthorize' as const },
        ],
      },
      {
        title: '4. Facebook Login → Configure OAuth Redirect',
        content: [
          'In left sidebar: "Use Cases"',
          'Find "Authenticate and request data from users with Facebook Login"',
          'Click "Customize"',
          'Navigate to "Facebook Login" → "Settings"',
          'Under "Valid OAuth Redirect URIs", paste the redirect URI below',
          'Click "Save Changes"',
          'This is where Meta redirects users after they authorize their Page',
        ],
        urls: [
          { label: 'Valid OAuth Redirect URI', urlKey: 'oauth' as const },
        ],
      },
      {
        title: '5. Add Required Permissions',
        content: [
          'Go to "Use Cases" → "Manage everything on your Page" → "Customize"',
          'Click "Add" next to each permission:',
          '✅ pages_manage_posts — Publish and manage posts',
          '✅ pages_read_engagement — View post insights and engagement',
          '✅ pages_show_list — Let users select which Page to connect',
          '✅ pages_read_user_content — Read user-posted content',
          '✅ pages_manage_metadata — Manage Page metadata',
          'Each will show status: "Ready for testing" or "Needs review"',
        ],
      },
      {
        title: '6. Configure Webhooks',
        content: [
          'In left sidebar: "Webhooks" (top-level item)',
          'Select "Page" as the object type',
          'Paste the Webhook Callback URL below',
          'Enter a Verify Token (e.g., "aura_verify_2024") — save this securely',
          'Click "Verify and Save"',
          'Subscribe to these fields:',
          '✅ feed — Posts published/updated (REQUIRED)',
          '✅ messages — Incoming Messenger messages',
          '✅ messaging_postbacks — Button click callbacks',
          '✅ messaging_optins — User opt-in events',
          '⬜ Leave ALL other fields unsubscribed',
        ],
        urls: [
          { label: 'Webhook Callback URL', urlKey: 'webhook' as const },
        ],
      },
      {
        title: '7. Business Verification',
        content: [
          'Go to "Settings" → "Business Verification" (or Meta Business Suite)',
          'Upload one of these documents:',
          '• Business license or registration certificate',
          '• Utility bill (recent, showing business name and address)',
          '• Bank statement (showing business name)',
          'Verification typically takes 1–3 business days',
          'Required before submitting for App Review',
        ],
      },
      {
        title: '8. App Review — Submit All Permissions',
        content: [
          'In left sidebar: "App Review" → "Requests"',
          'Click "Request" next to each permission needing approval',
          'For each, provide:',
          '• Clear description of how Aura Intercept uses this permission',
          '• A screencast demo (2–5 minutes) showing:',
          '  - A tenant connecting their Facebook Page via OAuth',
          '  - Creating a post through the AI content engine',
          '  - The post appearing on the connected Page',
          'Submit all permissions together for faster review',
          'Expect 1–5 business days for review',
          'Until approved, only Admin/Developer/Tester roles can use the app',
        ],
      },
      {
        title: '9. Go Live',
        content: [
          'Once App Review is approved:',
          'Go to "Settings" → "Basic" → toggle App Mode to "Live"',
          '',
          '✅ Final Checklist:',
          '• App Mode set to "Live"',
          '• All permissions approved via App Review',
          '• Webhook endpoint active and responding',
          '• META_APP_ID and META_APP_SECRET entered in Platform Settings',
          '• Privacy Policy and Terms of Service URLs accessible',
          '• Data Deletion URL configured',
          '• Deauthorize Callback URL configured',
          '• OAuth Redirect URI configured',
        ],
      },
    ],
    pricing: 'Free to use. Posts to connected Pages at no cost. Same Meta App covers both Facebook and Instagram.',
  },
  instagram: {
    name: 'Instagram',
    icon: Instagram,
    color: 'bg-gradient-to-br from-purple-600 to-pink-500',
    description: 'Platform admin guide: Add Instagram capabilities to your existing Meta App for automatic Instagram Business account connections.',
    consoleUrl: 'https://developers.facebook.com/apps',
    docsUrl: 'https://developers.facebook.com/docs/instagram-platform/',
    reviewTimeline: '1–5 business days (included with Facebook App Review)',
    requiredDocs: ['Same as Facebook — uses the same Meta App', 'Instagram Business or Creator account must be linked to a Facebook Page'],
    steps: [
      {
        title: '1. Prerequisites',
        content: [
          'You MUST have completed the Facebook setup first — Instagram uses the same Meta App',
          'META_APP_ID and META_APP_SECRET are shared between Facebook and Instagram',
          'Tenant Instagram accounts must be Instagram Business or Creator (not personal)',
          'Each Instagram account must be connected to a Facebook Page',
        ],
      },
      {
        title: '2. Add Instagram Use Case to Your Meta App',
        content: [
          'In your Meta App, go to "Use Cases" in the left sidebar',
          'Find "Manage messaging and content on Instagram"',
          'Click "Add" or "Customize"',
          'This adds Instagram-specific products and permissions to your existing app',
        ],
      },
      {
        title: '3. Add Instagram Content Permissions',
        content: [
          'Click "Customize" on the Instagram use case',
          'Under "API setup with Facebook login" → "Manage content on Instagram"',
          'Click "Add required content permissions":',
          '✅ instagram_basic — Access profile info and media',
          '✅ instagram_content_publish — Create and publish media',
          '✅ pages_read_engagement — Read page engagement data (already added)',
          '✅ business_management — Manage business assets',
          '✅ pages_show_list — List pages connected to Instagram (already added)',
        ],
      },
      {
        title: '4. Configure Instagram Business Login',
        content: [
          'In Instagram API → Customize → "Set up Instagram business login"',
          'Click "Set up" and paste the OAuth redirect URI below',
          'This enables tenants to connect their Instagram accounts through the same OAuth flow',
          'The redirect URI is the same one used for Facebook',
        ],
        urls: [
          { label: 'OAuth Redirect URI', urlKey: 'oauth' as const },
        ],
      },
      {
        title: '5. Content Publishing Requirements',
        content: [
          'Images: JPEG format, max 8MB, aspect ratio between 4:5 and 1.91:1',
          'Videos: MP4, max 100MB, 3–60 seconds, minimum 720p',
          'Carousel posts: 2–10 items',
          'Reels: MP4, 0–90 seconds, 9:16 aspect ratio recommended',
          'All media must be hosted on a publicly accessible URL before publishing',
          'Our AI content engine handles these requirements automatically',
        ],
      },
      {
        title: '6. Submit for App Review',
        content: [
          'If not already submitted with Facebook permissions:',
          'Go to "App Review" → "Requests"',
          'Submit all Instagram permissions for review',
          'Provide use-case descriptions and screencast demo showing:',
          '  - Tenant connecting Instagram Business account',
          '  - AI generating a post for Instagram',
          '  - Post appearing on the connected account',
          'Include in the same submission as Facebook permissions if possible',
        ],
      },
    ],
    pricing: 'Free to post. Uses same Meta Graph API and App as Facebook — no additional cost or app needed.',
  },
  linkedin: {
    name: 'LinkedIn',
    icon: Linkedin,
    color: 'bg-blue-700',
    description: 'Platform admin guide: Register a LinkedIn Developer App for one-click LinkedIn connections for all tenants.',
    consoleUrl: 'https://www.linkedin.com/developers/apps',
    docsUrl: 'https://learn.microsoft.com/en-us/linkedin/marketing/',
    reviewTimeline: '"Share on LinkedIn" is instant; "Marketing Developer Platform" takes 1–2 weeks',
    requiredDocs: ['LinkedIn Company Page (you must be a verified admin)', 'App logo (100x100px PNG)', 'Privacy Policy URL', 'Terms of Service URL'],
    steps: [
      {
        title: '1. Create LinkedIn Developer App',
        content: [
          'Go to linkedin.com/developers/apps',
          'Click "Create App"',
          'App name: "Aura Intercept" (or your platform name)',
          'LinkedIn Page: Link to your company\'s LinkedIn Page (you must be a verified admin)',
          'App logo: Upload your platform logo (100x100px PNG)',
          'Accept the Legal Agreement',
          'Click "Create App"',
        ],
      },
      {
        title: '2. Configure OAuth 2.0',
        content: [
          'Go to the "Auth" tab in your app',
          'Copy Client ID — enter in Platform Settings as LINKEDIN_CLIENT_ID',
          'Copy Client Secret — enter as LINKEDIN_CLIENT_SECRET',
          'Under "Authorized redirect URLs for your app", paste the URL below',
          'Click "Update"',
        ],
        urls: [
          { label: 'OAuth Redirect URL', urlKey: 'oauth' as const },
        ],
      },
      {
        title: '3. Request API Products',
        content: [
          'Go to the "Products" tab',
          'Request these products:',
          '',
          '✅ "Share on LinkedIn" — Enables personal profile posting',
          '   → Usually approved instantly',
          '',
          '✅ "Sign In with LinkedIn using OpenID Connect" — Enables OAuth login',
          '   → Usually approved instantly',
          '',
          '✅ "Marketing Developer Platform" — Enables Company Page posting',
          '   → Requires application with:',
          '   • Use-case description explaining how tenants post to their company pages',
          '   • Expected monthly API volume',
          '   • Your company website URL',
          '   • Review takes 1–2 weeks',
        ],
      },
      {
        title: '4. Required OAuth Scopes',
        content: [
          'Once products are approved, these scopes become available:',
          '• openid — OpenID Connect authentication',
          '• profile — Basic profile information',
          '• w_member_social — Post on behalf of members',
          '• r_organization_social — Read organization posts',
          '• w_organization_social — Post to organization pages',
          '',
          'Our OAuth flow requests these automatically when tenants connect',
        ],
      },
      {
        title: '5. API Requirements & Limits',
        content: [
          'Rate limit: 100 share requests/day per app',
          'Must use X-Restli-Protocol-Version: 2.0.0 header (handled automatically)',
          'Images must be uploaded to LinkedIn first, then attached to posts',
          'Organization (Company Page) posting requires "Marketing Developer Platform" approval',
          'Personal posting works immediately after "Share on LinkedIn" approval',
        ],
      },
    ],
    pricing: 'Free tier: 100 share requests/day. Marketing API for Company Pages requires partnership approval but is free to use.',
  },
  tiktok: {
    name: 'TikTok',
    icon: Video,
    color: 'bg-black',
    description: 'Platform admin guide: Register a TikTok Developer App for one-click TikTok connections for all tenants.',
    consoleUrl: 'https://developers.tiktok.com/apps',
    docsUrl: 'https://developers.tiktok.com/doc/content-posting-api-get-started',
    reviewTimeline: '1–3 business days for app review',
    requiredDocs: ['Privacy Policy URL', 'Terms of Service URL', 'Demo video (2–5 min) showing the content publishing flow', 'Use-case description'],
    steps: [
      {
        title: '1. Register as TikTok Developer',
        content: [
          'Go to developers.tiktok.com',
          'Sign in or create a TikTok for Developers account',
          'Complete account verification if prompted',
        ],
      },
      {
        title: '2. Create Developer App',
        content: [
          'Click "Manage Apps" → "Create App"',
          'App name: "Aura Intercept" (or your platform name)',
          'Description: Explain that this is a social media management platform',
          'Select "Content Posting API" as the primary use case',
          'Fill in all required fields and submit',
        ],
      },
      {
        title: '3. Configure OAuth Redirect',
        content: [
          'In your app settings, go to "Platform Settings"',
          'Paste the OAuth Redirect URI below',
          'Copy Client Key — enter in Platform Settings as TIKTOK_CLIENT_KEY',
          'Copy Client Secret — enter as TIKTOK_CLIENT_SECRET',
        ],
        urls: [
          { label: 'OAuth Redirect URI', urlKey: 'oauth' as const },
        ],
      },
      {
        title: '4. Enable Required Products',
        content: [
          'In "Manage Products" section:',
          '✅ Enable "Login Kit" — Required for OAuth authentication',
          '✅ Enable "Content Posting API" — Required for publishing content',
          'Request "Direct Post" scope — Allows posting directly without inbox review',
          'Submit for review with your use-case description',
        ],
      },
      {
        title: '5. AI Content Disclosure (REQUIRED)',
        content: [
          'TikTok policy requires all AI-generated content to include the is_aigc: true flag',
          'Our platform handles this automatically when publishing',
          'Failure to disclose AI-generated content may result in:',
          '• Content removal',
          '• Account suspension',
          '• App deactivation',
          'Include this requirement in your App Review submission',
        ],
      },
      {
        title: '6. Submit for Review',
        content: [
          'Go to your app overview and click "Submit for Review"',
          'Provide:',
          '• Detailed use-case description',
          '• Demo video (2–5 minutes) showing:',
          '  - Tenant connecting their TikTok account via OAuth',
          '  - AI generating video content',
          '  - Content being posted with is_aigc flag',
          '• Privacy Policy and Terms of Service URLs',
          'Review typically takes 1–3 business days',
        ],
      },
    ],
    pricing: 'Free to post. Subject to TikTok creator policies. Video content only (no static images).',
  },
  google_business: {
    name: 'Google Business',
    icon: Building2,
    color: 'bg-green-600',
    description: 'Platform admin guide: Set up Google Cloud OAuth for one-click Google Business Profile connections.',
    consoleUrl: 'https://console.cloud.google.com',
    docsUrl: 'https://developers.google.com/my-business/content/posts-data',
    reviewTimeline: 'OAuth consent screen verification: 1–3 weeks for production',
    requiredDocs: ['Privacy Policy URL (displayed on OAuth consent screen)', 'Terms of Service URL', 'App logo for consent screen', 'Homepage URL'],
    steps: [
      {
        title: '1. Create/Select Google Cloud Project',
        content: [
          'Go to console.cloud.google.com',
          'Create a new project or select an existing one',
          'Recommended: Use the same project as your Google Calendar integration if you have one',
          'Note the project name for reference',
        ],
      },
      {
        title: '2. Enable Required APIs',
        content: [
          'Go to "APIs & Services" → "Library"',
          'Search and enable:',
          '✅ "Business Profile API"',
          '✅ "My Business Business Information API"',
          '✅ "My Business Account Management API"',
          'Each API must be individually enabled',
        ],
      },
      {
        title: '3. Create OAuth 2.0 Credentials',
        content: [
          'Go to "APIs & Services" → "Credentials"',
          'Click "Create Credentials" → "OAuth client ID"',
          'Application type: "Web application"',
          'Name: "Aura Intercept Social" (or similar)',
          'Under "Authorized redirect URIs", paste the URI below',
          'Click "Create"',
          'Copy Client ID — enter in Platform Settings as GOOGLE_CLIENT_ID',
          'Copy Client Secret — enter as GOOGLE_CLIENT_SECRET',
        ],
        urls: [
          { label: 'OAuth Redirect URI', urlKey: 'oauth' as const },
        ],
      },
      {
        title: '4. Configure OAuth Consent Screen',
        content: [
          'Go to "APIs & Services" → "OAuth consent screen"',
          'User type: "External" (for production use)',
          'Fill in:',
          '• App name: "Aura Intercept"',
          '• User support email: your platform admin email',
          '• App logo: upload your platform logo',
          '• App homepage: https://auraintercept.ai',
          '• Privacy Policy URL: your published privacy policy',
          '• Terms of Service URL: your published terms',
          '• Developer contact email: your email',
          '',
          'Add scope: https://www.googleapis.com/auth/business.manage',
          'Click "Save and Continue"',
        ],
      },
      {
        title: '5. Add Test Users (Development Phase)',
        content: [
          'While in development, only listed test users can authorize',
          'Add email addresses of team members for testing',
          'Up to 100 test users allowed',
          'Test users can immediately authorize and use the integration',
        ],
      },
      {
        title: '6. Submit for Verification (Production)',
        content: [
          'Once testing is complete, submit for Google\'s OAuth verification',
          'Go to "OAuth consent screen" → click "Publish App"',
          'You may need to submit a verification request:',
          '• Provide a video demo of the OAuth flow',
          '• Explain why each scope is needed',
          '• Show how data is used and stored',
          'Verification typically takes 1–3 weeks',
          'Until verified, a "This app isn\'t verified" warning appears for users',
        ],
      },
      {
        title: '7. Supported Post Types',
        content: [
          'Once connected, tenants can publish these post types to their Google Business Profile:',
          '• What\'s New — General business updates',
          '• Events — Time-based promotions with start/end dates',
          '• Offers — Discounts and deals with optional coupon codes',
          '• Products — Showcase inventory items',
          'All post types are supported by our AI content engine',
        ],
      },
    ],
    pricing: 'Free. Uses Google Cloud free tier. Can share the same project as Calendar integration.',
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

  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
  const urlMap: Record<string, string> = {
    oauth: `${supabaseUrl}/functions/v1/social-oauth?action=callback`,
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
          <Badge variant="secondary">Platform Admin</Badge>
        </div>
        <CardDescription>{config.description}</CardDescription>
      </CardHeader>
      <CardContent>
        {/* Review Timeline */}
        <div className="flex items-center gap-2 mb-4 p-2 rounded bg-muted border border-border text-xs">
          <Clock className="w-3 h-3 text-muted-foreground" />
          <span className="text-muted-foreground">Estimated review time:</span>
          <span className="font-medium">{config.reviewTimeline}</span>
        </div>

        {/* Required Documents */}
        <div className="mb-4 p-3 rounded-lg border border-amber-500/30 bg-amber-500/5">
          <div className="flex items-center gap-2 mb-2">
            <FileText className="w-4 h-4 text-amber-600" />
            <span className="text-sm font-medium text-foreground">Required Documents</span>
          </div>
          <ul className="text-xs text-muted-foreground space-y-1">
            {config.requiredDocs.map((doc, i) => (
              <li key={i} className="flex items-start gap-1">
                <span className="text-amber-600 mt-0.5">•</span>
                {doc}
              </li>
            ))}
          </ul>
        </div>

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
