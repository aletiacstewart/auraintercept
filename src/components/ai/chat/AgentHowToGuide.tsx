import React, { useState } from 'react';
import { 
  ChevronDown, 
  ChevronUp, 
  Calendar, 
  AlertTriangle, 
  DollarSign, 
  Clock, 
  Sparkles, 
  MapPin, 
  Star, 
  ThumbsUp,
  HelpCircle,
  CheckCircle2,
  CheckCircle,
  Navigation,
  Truck,
  Phone,
  Bot,
  FileText,
  Receipt,
  Package,
  Shield,
  ClipboardList,
  Megaphone,
  Tag,
  Gift,
  TrendingUp,
  UserPlus,
  Users,
  BarChart3,
  Target,
  Download,
  Smartphone
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';

interface HowToStep {
  step: number;
  title: string;
  description: string;
}

interface AgentGuide {
  id: string;
  label: string;
  icon: React.ElementType;
  description: string;
  steps: HowToStep[];
  tips?: string[];
}

// Customer Engagement Guides
const CUSTOMER_ENGAGEMENT_GUIDES: AgentGuide[] = [
  {
    id: 'schedule',
    label: 'Book Appointment',
    icon: Calendar,
    description: 'Schedule a service appointment with our team',
    steps: [
      { step: 1, title: 'Select Service', description: 'Choose the type of service you need from our available options' },
      { step: 2, title: 'Pick Date & Time', description: 'Select your preferred date and available time slot' },
      { step: 3, title: 'Enter Details', description: 'Provide your contact information and service address' },
      { step: 4, title: 'Confirm Booking', description: 'Review and confirm your appointment details' },
    ],
    tips: ['Book at least 24 hours in advance for best availability', 'You can reschedule or cancel anytime from your portal']
  },
  {
    id: 'emergency',
    label: 'Emergency Service',
    icon: AlertTriangle,
    description: 'Request urgent emergency assistance',
    steps: [
      { step: 1, title: 'Describe Emergency', description: 'Tell us about the urgent situation you are facing' },
      { step: 2, title: 'Provide Location', description: 'Share your address so we can dispatch help immediately' },
      { step: 3, title: 'Contact Info', description: 'Give us your phone number for immediate callback' },
      { step: 4, title: 'Wait for Response', description: 'Our emergency team will contact you within minutes' },
    ],
    tips: ['Emergency services may have additional fees', 'Keep your phone nearby for immediate callback']
  },
  {
    id: 'quote',
    label: 'Get Quote',
    icon: DollarSign,
    description: 'Request a price estimate for services',
    steps: [
      { step: 1, title: 'Describe Project', description: 'Tell us what service or project you need a quote for' },
      { step: 2, title: 'Add Details', description: 'Provide any specifics like size, materials, or timeline' },
      { step: 3, title: 'Contact Info', description: 'Enter your email and phone for quote delivery' },
      { step: 4, title: 'Receive Quote', description: 'Get your detailed quote via email within 24 hours' },
    ],
    tips: ['Photos help us provide more accurate quotes', 'Quotes are typically valid for 30 days']
  },
  {
    id: 'hours',
    label: 'Business Hours',
    icon: Clock,
    description: 'View our operating hours and availability',
    steps: [
      { step: 1, title: 'Ask About Hours', description: 'Simply ask "What are your hours?" or click the Hours button' },
      { step: 2, title: 'View Schedule', description: 'See our complete weekly operating schedule' },
      { step: 3, title: 'Check Holidays', description: 'View any special holiday hours or closures' },
    ],
    tips: ['Emergency services may be available outside regular hours', 'You can book appointments online 24/7']
  },
  {
    id: 'services',
    label: 'Our Services',
    icon: Sparkles,
    description: 'Learn about available services and pricing',
    steps: [
      { step: 1, title: 'Browse Services', description: 'View our complete list of available services' },
      { step: 2, title: 'Get Details', description: 'Click any service to see full description and pricing' },
      { step: 3, title: 'Ask Questions', description: 'Chat with our AI to learn more about specific services' },
    ],
    tips: ['Ask about package deals or seasonal promotions', 'We can customize services to meet your needs']
  },
  {
    id: 'track',
    label: 'Track Appointment',
    icon: MapPin,
    description: 'Check the status of your scheduled appointment',
    steps: [
      { step: 1, title: 'Enter Details', description: 'Provide your email or phone used during booking' },
      { step: 2, title: 'Find Appointment', description: 'Select your appointment from the list' },
      { step: 3, title: 'View Status', description: 'See real-time status: confirmed, en-route, or completed' },
      { step: 4, title: 'Get Updates', description: 'Receive notifications as technician approaches' },
    ],
    tips: ['Enable SMS notifications for real-time updates', 'Track your technician location on the day of service']
  },
  {
    id: 'billing',
    label: 'Billing Inquiry',
    icon: DollarSign,
    description: 'View invoices and payment information',
    steps: [
      { step: 1, title: 'Verify Identity', description: 'Enter your email or phone to access billing' },
      { step: 2, title: 'View Invoices', description: 'See all past and pending invoices' },
      { step: 3, title: 'Make Payment', description: 'Pay outstanding balances securely online' },
      { step: 4, title: 'Download Receipt', description: 'Get PDF receipts for your records' },
    ],
    tips: ['Set up autopay for convenience', 'Contact us for payment plan options']
  },
  {
    id: 'feedback',
    label: 'Leave Feedback',
    icon: Star,
    description: 'Share your experience with our service',
    steps: [
      { step: 1, title: 'Select Service', description: 'Choose the service visit you want to rate' },
      { step: 2, title: 'Rate Experience', description: 'Give a star rating for overall satisfaction' },
      { step: 3, title: 'Add Comments', description: 'Share specific feedback or suggestions' },
      { step: 4, title: 'Submit', description: 'Your feedback helps us improve our service' },
    ],
    tips: ['Your feedback is confidential and valued', 'Mention specific technicians to recognize great work']
  },
  {
    id: 'review',
    label: 'Write Review',
    icon: ThumbsUp,
    description: 'Leave a public review on Google, Yelp, or Facebook',
    steps: [
      { step: 1, title: 'Choose Platform', description: 'Select Google, Yelp, or Facebook for your review' },
      { step: 2, title: 'Click Link', description: 'You will be redirected to the review platform' },
      { step: 3, title: 'Write Review', description: 'Share your experience with others' },
      { step: 4, title: 'Post Review', description: 'Submit your review on the platform' },
    ],
    tips: ['Reviews help other customers find us', 'Mention what made your experience great']
  },
];

// Field Operations Guides
const FIELD_OPS_GUIDES: AgentGuide[] = [
  {
    id: 'install-app',
    label: 'Install Field Ops App',
    icon: Smartphone,
    description: 'Install the mobile app for field technicians',
    steps: [
      { step: 1, title: 'Go to Install Page', description: 'Navigate to Settings → Install Field Ops App in your technician dashboard' },
      { step: 2, title: 'Scan QR Code', description: 'Use your phone camera to scan the QR code displayed' },
      { step: 3, title: 'Add to Home Screen', description: 'Follow prompts to install the app on your device' },
      { step: 4, title: 'Login', description: 'Sign in with your employee credentials to access your jobs' },
    ],
    tips: ['The app works offline for viewing job details', 'Enable notifications for real-time job assignments', 'Use the app for hands-free navigation and status updates']
  },
  {
    id: 'accept',
    label: 'Accept Job',
    icon: CheckCircle,
    description: 'Accept and confirm assigned jobs',
    steps: [
      { step: 1, title: 'View Assignment', description: 'Review the job details including customer info and service type' },
      { step: 2, title: 'Check Schedule', description: 'Confirm you can make the scheduled time' },
      { step: 3, title: 'Accept Job', description: 'Click Accept to confirm you will handle this job' },
      { step: 4, title: 'Get Directions', description: 'AI will automatically prompt you to get directions to the job site' },
    ],
    tips: ['Accept jobs promptly to avoid reassignment', 'Contact dispatch if you have scheduling conflicts', 'After accepting, follow the AI prompts for next steps']
  },
  {
    id: 'directions',
    label: 'Get Directions',
    icon: Navigation,
    description: 'Navigate to customer location',
    steps: [
      { step: 1, title: 'Select Job', description: 'Choose the job you need directions to' },
      { step: 2, title: 'Click Directions', description: 'Open navigation in your preferred maps app' },
      { step: 3, title: 'Follow Route', description: 'Follow the optimal route to the customer' },
      { step: 4, title: 'Mark En Route', description: 'AI will prompt you to mark yourself as en route' },
    ],
    tips: ['Check traffic conditions before departing', 'Save customer address for future visits']
  },
  {
    id: 'enroute',
    label: 'Mark En Route',
    icon: Truck,
    description: 'Update status when heading to a job',
    steps: [
      { step: 1, title: 'Start Travel', description: 'Begin traveling to the customer location' },
      { step: 2, title: 'Update Status', description: 'Click En Route to update your status' },
      { step: 3, title: 'Auto ETA', description: 'AI calculates and sends ETA to customer automatically' },
      { step: 4, title: 'Customer Notified', description: 'Customer receives SMS/email with your ETA' },
    ],
    tips: ['Update status as soon as you leave', 'ETA is automatically sent to customer via SMS and email']
  },
  {
    id: 'eta',
    label: 'Update ETA',
    icon: Clock,
    description: 'Manually override arrival time estimates',
    steps: [
      { step: 1, title: 'Check Conditions', description: 'Assess current travel or delay conditions' },
      { step: 2, title: 'Calculate Time', description: 'Estimate your new realistic arrival time' },
      { step: 3, title: 'Update ETA', description: 'Enter your expected arrival time' },
      { step: 4, title: 'Auto-Notify', description: 'Customer receives updated ETA notification' },
    ],
    tips: ['Update ETA if unexpected delays occur', 'Be realistic with time estimates']
  },
  {
    id: 'arrive-start',
    label: 'Arrive & Start Job',
    icon: MapPin,
    description: 'Confirm arrival and begin work in one step',
    steps: [
      { step: 1, title: 'Arrive On-Site', description: 'Park and prepare to meet the customer' },
      { step: 2, title: 'Click Arrive & Start', description: 'Update status to Arrived and In Progress simultaneously' },
      { step: 3, title: 'Take Before Photos', description: 'Document the job site before starting work' },
      { step: 4, title: 'Begin Service', description: 'Start the service work for the customer' },
    ],
    tips: ['Mark arrived immediately when on-site', 'Take before photos for documentation', 'Customer is automatically notified of your arrival']
  },
  {
    id: 'complete',
    label: 'Complete Job',
    icon: CheckCircle,
    description: 'Mark job as finished and document work',
    steps: [
      { step: 1, title: 'Finish Service', description: 'Complete all required service work' },
      { step: 2, title: 'Document Work', description: 'Add notes and take after photos' },
      { step: 3, title: 'Mark Complete', description: 'Click Complete Job to finish' },
      { step: 4, title: 'Quote or Invoice', description: 'AI will offer to generate a quote or invoice' },
    ],
    tips: ['Always document parts used', 'Take clear after photos for records', 'Generate invoice on-site for faster payment']
  },
  {
    id: 'quote',
    label: 'Generate Quote',
    icon: FileText,
    description: 'Create on-site quotes for additional work',
    steps: [
      { step: 1, title: 'Click Generate Quote', description: 'Open the quote form with job details pre-filled' },
      { step: 2, title: 'Add Line Items', description: 'Enter services and parts with pricing' },
      { step: 3, title: 'Review Total', description: 'Verify the quote total and details' },
      { step: 4, title: 'Send to Customer', description: 'Email or SMS the quote directly to customer' },
    ],
    tips: ['Generate quotes on-site while with the customer', 'Include detailed descriptions for clarity', 'Quotes can be converted to invoices later']
  },
  {
    id: 'invoice',
    label: 'Generate Invoice',
    icon: Receipt,
    description: 'Create invoices with optional payment links',
    steps: [
      { step: 1, title: 'Click Generate Invoice', description: 'Open invoice form with job details pre-filled' },
      { step: 2, title: 'Add Services', description: 'List all services and parts provided' },
      { step: 3, title: 'Add Payment Link', description: 'Toggle on Stripe payment link for instant pay' },
      { step: 4, title: 'Send to Customer', description: 'Email or SMS invoice with payment link' },
    ],
    tips: ['Include Stripe payment links for faster payment', 'Send invoice before leaving job site', 'Customer can pay immediately via the payment link']
  },
  {
    id: 'dispatch',
    label: 'Contact Dispatch',
    icon: Phone,
    description: 'Reach dispatch for urgent matters',
    steps: [
      { step: 1, title: 'Click Contact', description: 'Open dispatch communication' },
      { step: 2, title: 'Describe Issue', description: 'Explain the situation clearly' },
      { step: 3, title: 'Get Assistance', description: 'Dispatch will provide guidance' },
    ],
    tips: ['Use for urgent situations only', 'Have job details ready when calling']
  },
];

// Business Operations Guides
const BUSINESS_OPS_GUIDES: AgentGuide[] = [
  {
    id: 'quote',
    label: 'Create Quote',
    icon: FileText,
    description: 'Generate professional quotes for customers',
    steps: [
      { step: 1, title: 'Enter Customer', description: 'Add customer name and contact info' },
      { step: 2, title: 'Add Line Items', description: 'Select services and set quantities' },
      { step: 3, title: 'Apply Discounts', description: 'Add any applicable discounts' },
      { step: 4, title: 'Send Quote', description: 'Email or print the quote for customer' },
    ],
    tips: ['Include detailed descriptions', 'Set appropriate validity period']
  },
  {
    id: 'invoice',
    label: 'Generate Invoice',
    icon: Receipt,
    description: 'Create and send invoices for services',
    steps: [
      { step: 1, title: 'Select Customer', description: 'Choose customer or enter new details' },
      { step: 2, title: 'Add Services', description: 'List all services provided' },
      { step: 3, title: 'Set Terms', description: 'Configure payment terms and due date' },
      { step: 4, title: 'Send Invoice', description: 'Email invoice to customer' },
    ],
    tips: ['Convert quotes to invoices easily', 'Set up recurring invoices for regulars']
  },
  {
    id: 'inventory',
    label: 'Check Inventory',
    icon: Package,
    description: 'View and manage inventory levels',
    steps: [
      { step: 1, title: 'Search Items', description: 'Find parts by name or SKU' },
      { step: 2, title: 'Check Stock', description: 'View current quantity and location' },
      { step: 3, title: 'Reorder', description: 'Create purchase orders for low stock' },
    ],
    tips: ['Set minimum stock alerts', 'Track inventory usage per job']
  },
  {
    id: 'warranty-check',
    label: 'Warranty Check',
    icon: Shield,
    description: 'Verify warranty status for products',
    steps: [
      { step: 1, title: 'Enter Details', description: 'Input serial number or customer info' },
      { step: 2, title: 'View Coverage', description: 'See warranty terms and expiration' },
      { step: 3, title: 'Check Claims', description: 'Review any previous claims' },
    ],
    tips: ['Keep warranty cards updated', 'Register products promptly']
  },
  {
    id: 'warranty-claim',
    label: 'File Warranty Claim',
    icon: ClipboardList,
    description: 'Submit warranty claims for defective items',
    steps: [
      { step: 1, title: 'Verify Coverage', description: 'Confirm product is under warranty' },
      { step: 2, title: 'Document Issue', description: 'Describe the defect with photos' },
      { step: 3, title: 'Submit Claim', description: 'File claim with manufacturer' },
      { step: 4, title: 'Track Status', description: 'Monitor claim progress' },
    ],
    tips: ['Include clear photos of defects', 'Keep original receipts']
  },
  {
    id: 'pricing',
    label: 'Price Lookup',
    icon: DollarSign,
    description: 'Find service and product pricing',
    steps: [
      { step: 1, title: 'Search Service', description: 'Find service or product' },
      { step: 2, title: 'View Pricing', description: 'See base price and options' },
      { step: 3, title: 'Check Promotions', description: 'View active discounts' },
    ],
    tips: ['Check for seasonal pricing', 'Bundle services for discounts']
  },
];

// Marketing & Sales Guides
const MARKETING_SALES_GUIDES: AgentGuide[] = [
  {
    id: 'campaign',
    label: 'Create Campaign',
    icon: Megaphone,
    description: 'Launch marketing campaigns',
    steps: [
      { step: 1, title: 'Define Goals', description: 'Set campaign objectives and KPIs' },
      { step: 2, title: 'Select Audience', description: 'Choose target customer segments' },
      { step: 3, title: 'Create Content', description: 'Design email and SMS messages' },
      { step: 4, title: 'Schedule & Launch', description: 'Set timing and activate campaign' },
    ],
    tips: ['A/B test subject lines', 'Segment for better engagement']
  },
  {
    id: 'promo',
    label: 'Generate Promo Code',
    icon: Tag,
    description: 'Create promotional discount codes',
    steps: [
      { step: 1, title: 'Set Discount', description: 'Choose percentage or fixed amount' },
      { step: 2, title: 'Define Rules', description: 'Set usage limits and expiration' },
      { step: 3, title: 'Generate Code', description: 'Create unique promo code' },
      { step: 4, title: 'Distribute', description: 'Share via campaigns or direct' },
    ],
    tips: ['Track code usage', 'Create seasonal promotions']
  },
  {
    id: 'referral',
    label: 'Referral Program',
    icon: Gift,
    description: 'Set up and manage referral rewards',
    steps: [
      { step: 1, title: 'Configure Rewards', description: 'Set referrer and referee incentives' },
      { step: 2, title: 'Generate Links', description: 'Create unique referral links' },
      { step: 3, title: 'Track Referrals', description: 'Monitor conversions and rewards' },
      { step: 4, title: 'Issue Rewards', description: 'Fulfill referral bonuses' },
    ],
    tips: ['Promote to satisfied customers', 'Offer compelling rewards']
  },
  {
    id: 'winback',
    label: 'Win-Back Campaign',
    icon: TrendingUp,
    description: 'Re-engage inactive customers',
    steps: [
      { step: 1, title: 'Identify Lapsed', description: 'Find customers inactive 90+ days' },
      { step: 2, title: 'Create Offer', description: 'Design compelling comeback offer' },
      { step: 3, title: 'Send Campaign', description: 'Reach out via email and SMS' },
      { step: 4, title: 'Track Returns', description: 'Monitor re-engagement success' },
    ],
    tips: ['Personalize messaging', 'Offer limited-time incentives']
  },
  {
    id: 'lead',
    label: 'New Lead',
    icon: UserPlus,
    description: 'Add and manage sales leads',
    steps: [
      { step: 1, title: 'Enter Details', description: 'Add lead contact information' },
      { step: 2, title: 'Set Source', description: 'Tag where lead came from' },
      { step: 3, title: 'Assign Follow-up', description: 'Schedule initial contact' },
      { step: 4, title: 'Track Progress', description: 'Update lead status as they progress' },
    ],
    tips: ['Follow up within 24 hours', 'Log all interactions']
  },
  {
    id: 'customers',
    label: 'Customer Segments',
    icon: Users,
    description: 'View and manage customer groups',
    steps: [
      { step: 1, title: 'View Segments', description: 'See predefined customer groups' },
      { step: 2, title: 'Create Custom', description: 'Build segments based on criteria' },
      { step: 3, title: 'Target Campaigns', description: 'Use segments for marketing' },
    ],
    tips: ['Update segments regularly', 'Combine criteria for precision']
  },
];

// Analytics & Optimization Guides
const ANALYTICS_GUIDES: AgentGuide[] = [
  {
    id: 'performance',
    label: 'Performance Report',
    icon: BarChart3,
    description: 'Analyze business performance metrics',
    steps: [
      { step: 1, title: 'Select Period', description: 'Choose date range for analysis' },
      { step: 2, title: 'Choose Metrics', description: 'Select KPIs to include' },
      { step: 3, title: 'Generate Report', description: 'Create comprehensive report' },
      { step: 4, title: 'Review Insights', description: 'Analyze trends and patterns' },
    ],
    tips: ['Compare to previous periods', 'Set up weekly automated reports']
  },
  {
    id: 'revenue',
    label: 'Revenue Analysis',
    icon: DollarSign,
    description: 'Deep dive into revenue streams',
    steps: [
      { step: 1, title: 'View Breakdown', description: 'See revenue by service type' },
      { step: 2, title: 'Analyze Trends', description: 'Track month-over-month growth' },
      { step: 3, title: 'Identify Top Performers', description: 'Find highest revenue services' },
      { step: 4, title: 'Spot Opportunities', description: 'Discover growth areas' },
    ],
    tips: ['Track recurring vs one-time revenue', 'Monitor seasonal patterns']
  },
  {
    id: 'customers',
    label: 'Customer Insights',
    icon: Users,
    description: 'Understand customer behavior and value',
    steps: [
      { step: 1, title: 'View Demographics', description: 'Analyze customer profiles' },
      { step: 2, title: 'Check Lifetime Value', description: 'See CLV by segment' },
      { step: 3, title: 'Review Retention', description: 'Monitor churn rates' },
      { step: 4, title: 'Identify Opportunities', description: 'Find upsell potential' },
    ],
    tips: ['Focus on high-value segments', 'Track satisfaction scores']
  },
  {
    id: 'forecast',
    label: 'Trend Forecast',
    icon: TrendingUp,
    description: 'Predict future business trends',
    steps: [
      { step: 1, title: 'Select Metric', description: 'Choose what to forecast' },
      { step: 2, title: 'Set Timeframe', description: 'Define forecast period' },
      { step: 3, title: 'View Predictions', description: 'See AI-generated forecasts' },
      { step: 4, title: 'Plan Actions', description: 'Prepare for predicted trends' },
    ],
    tips: ['Consider seasonal factors', 'Update forecasts monthly']
  },
  {
    id: 'kpi',
    label: 'KPI Dashboard',
    icon: Target,
    description: 'Monitor key performance indicators',
    steps: [
      { step: 1, title: 'View Dashboard', description: 'See all KPIs at a glance' },
      { step: 2, title: 'Check Status', description: 'Green/yellow/red indicators' },
      { step: 3, title: 'Drill Down', description: 'Click any KPI for details' },
      { step: 4, title: 'Set Alerts', description: 'Configure threshold notifications' },
    ],
    tips: ['Review KPIs daily', 'Set realistic targets']
  },
  {
    id: 'export',
    label: 'Export Report',
    icon: Download,
    description: 'Download reports in various formats',
    steps: [
      { step: 1, title: 'Select Report', description: 'Choose which report to export' },
      { step: 2, title: 'Choose Format', description: 'Pick PDF, Excel, or CSV' },
      { step: 3, title: 'Configure Options', description: 'Set date range and filters' },
      { step: 4, title: 'Download', description: 'Save report to your device' },
    ],
    tips: ['Schedule automated exports', 'Share with stakeholders regularly']
  },
];

export type ConsoleType = 'customer' | 'fieldops' | 'businessops' | 'marketing' | 'analytics';

const CONSOLE_GUIDES: Record<ConsoleType, AgentGuide[]> = {
  customer: CUSTOMER_ENGAGEMENT_GUIDES,
  fieldops: FIELD_OPS_GUIDES,
  businessops: BUSINESS_OPS_GUIDES,
  marketing: MARKETING_SALES_GUIDES,
  analytics: ANALYTICS_GUIDES,
};

const CONSOLE_TITLES: Record<ConsoleType, string> = {
  customer: 'How to use our AI agents',
  fieldops: 'How to use Field Ops Console and App',
  businessops: 'How to use Business & Accounting AI',
  marketing: 'How to use Marketing & Sales AI',
  analytics: 'How to use Analytics & Optimization AI',
};

interface AgentHowToGuideProps {
  className?: string;
  defaultExpanded?: boolean;
  consoleType?: ConsoleType;
}

export const AgentHowToGuide: React.FC<AgentHowToGuideProps> = ({
  className,
  defaultExpanded = false,
  consoleType = 'customer',
}) => {
  const [isOpen, setIsOpen] = useState(defaultExpanded);
  const [expandedGuide, setExpandedGuide] = useState<string | null>(null);

  const guides = CONSOLE_GUIDES[consoleType];
  const title = CONSOLE_TITLES[consoleType];

  return (
    <div className={cn('w-full max-w-md mx-auto px-2', className)}>
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <CollapsibleTrigger asChild>
          <Button
            variant={isOpen ? "default" : "ghost"}
            size="sm"
            className={cn(
              "w-full flex items-center justify-center gap-2 text-xs py-1",
              !isOpen && "text-muted-foreground hover:text-foreground"
            )}
          >
            <HelpCircle className="h-3.5 w-3.5" />
            <span>{title}</span>
            {isOpen ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
          </Button>
        </CollapsibleTrigger>
        
        <CollapsibleContent className="mt-2 space-y-2">
          <div className="grid gap-2 max-h-[400px] overflow-y-auto pr-1">
            {guides.map((guide) => (
              <Card
                key={guide.id}
                className={cn(
                  'p-2 cursor-pointer transition-all duration-200',
                  'hover:border-primary/50 hover:shadow-sm',
                  expandedGuide === guide.id && 'border-primary/50 bg-primary/5'
                )}
                onClick={() => setExpandedGuide(expandedGuide === guide.id ? null : guide.id)}
              >
                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded-md bg-primary/10">
                    <guide.icon className="h-3.5 w-3.5 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="text-xs font-medium truncate">{guide.label}</h4>
                    <p className="text-[10px] text-muted-foreground truncate">{guide.description}</p>
                  </div>
                  {expandedGuide === guide.id ? (
                    <ChevronUp className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                  ) : (
                    <ChevronDown className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                  )}
                </div>
                
                {expandedGuide === guide.id && (
                  <div className="mt-3 pt-2 border-t space-y-2 animate-fade-in">
                    <div className="space-y-1.5">
                      {guide.steps.map((step) => (
                        <div key={step.step} className="flex gap-2">
                          <div className="shrink-0 flex items-center justify-center w-5 h-5 rounded-full bg-primary/20 text-primary text-[10px] font-bold">
                            {step.step}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-[11px] font-medium">{step.title}</p>
                            <p className="text-[10px] text-muted-foreground">{step.description}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                    
                    {guide.tips && guide.tips.length > 0 && (
                      <div className="pt-2 border-t">
                        <p className="text-[10px] font-medium text-muted-foreground mb-1">Tips:</p>
                        <ul className="space-y-0.5">
                          {guide.tips.map((tip, idx) => (
                            <li key={idx} className="flex items-start gap-1.5 text-[10px] text-muted-foreground">
                              <CheckCircle2 className="h-3 w-3 text-green-500 shrink-0 mt-0.5" />
                              <span>{tip}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                )}
              </Card>
            ))}
          </div>
        </CollapsibleContent>
      </Collapsible>
    </div>
  );
};
