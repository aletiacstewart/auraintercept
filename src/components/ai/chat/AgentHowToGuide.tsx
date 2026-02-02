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
  FileText,
  Receipt,
  Package,
  ClipboardList,
  Tag,
  Gift,
  TrendingUp,
  UserPlus,
  Users,
  BarChart3,
  Target,
  Download,
  Smartphone,
  Bell,
  AlertCircle,
  Lightbulb,
  Share2,
  Home,
  Activity
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

// Customer Portal Guides
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

// Business Operations Guides - Updated to match console features
const BUSINESS_OPS_BASE_GUIDES: AgentGuide[] = [
  {
    id: 'aura-live',
    label: 'Aura Live',
    icon: Activity,
    description: 'Monitor real-time AI agent activity and events',
    steps: [
      { step: 1, title: 'Click Aura Live Tab', description: 'Open the real-time activity stream' },
      { step: 2, title: 'View Events', description: 'See live AI agent actions and decisions' },
      { step: 3, title: 'Track Handoffs', description: 'Monitor agent-to-agent handoffs and routing' },
      { step: 4, title: 'Review Confidence', description: 'Check confidence scores for AI decisions' },
    ],
    tips: ['Use to monitor AI decision quality', 'Track agent activity patterns for optimization']
  },
  {
    id: 'quote',
    label: 'Quote',
    icon: FileText,
    description: 'Generate professional quotes for customers',
    steps: [
      { step: 1, title: 'Click Quote Tab', description: 'Select the Quote button to open the quote form' },
      { step: 2, title: 'Add Customer', description: 'Enter customer name and contact details' },
      { step: 3, title: 'Add Line Items', description: 'Select services, set quantities and pricing' },
      { step: 4, title: 'Send Quote', description: 'Email or SMS the quote directly to customer' },
    ],
    tips: ['Convert quotes to invoices with one click', 'Set validity period for time-sensitive offers']
  },
  {
    id: 'invoice',
    label: 'Invoice',
    icon: Receipt,
    description: 'Create and send invoices for services',
    steps: [
      { step: 1, title: 'Click Invoice Tab', description: 'Select the Invoice button to open the form' },
      { step: 2, title: 'Select Customer', description: 'Choose existing customer or add new' },
      { step: 3, title: 'Add Services', description: 'List all services and parts provided' },
      { step: 4, title: 'Send with Payment', description: 'Include Stripe payment link for instant pay' },
    ],
    tips: ['Add payment links for faster collection', 'Set up recurring invoices for regulars']
  },
  {
    id: 'lead',
    label: 'Lead',
    icon: UserPlus,
    description: 'Add and track new sales leads',
    steps: [
      { step: 1, title: 'Click Lead Tab', description: 'Select Lead button to open lead form' },
      { step: 2, title: 'Enter Details', description: 'Add lead name, contact, and source' },
      { step: 3, title: 'Set Priority', description: 'Mark lead as hot, warm, or cold' },
      { step: 4, title: 'Schedule Follow-up', description: 'Set reminder for initial contact' },
    ],
    tips: ['Follow up within 24 hours for best conversion', 'Log all interactions for context']
  },
  {
    id: 'appointments',
    label: 'Appts',
    icon: Calendar,
    description: 'Manage appointments and scheduling',
    steps: [
      { step: 1, title: 'Click Appts Tab', description: 'Open the appointments manager' },
      { step: 2, title: 'View Schedule', description: 'See all upcoming appointments' },
      { step: 3, title: 'Create New', description: 'Add new appointment with customer details' },
      { step: 4, title: 'Assign Tech', description: 'Assign available technician to the job' },
    ],
    tips: ['Check technician availability before booking', 'Send confirmation reminders automatically']
  },
  {
    id: 'inventory',
    label: 'Inventory',
    icon: Package,
    description: 'View and manage inventory levels',
    steps: [
      { step: 1, title: 'Click Inventory Tab', description: 'Open inventory management' },
      { step: 2, title: 'Search Items', description: 'Find parts by name or SKU' },
      { step: 3, title: 'Check Stock', description: 'View quantity and reorder points' },
      { step: 4, title: 'Update Stock', description: 'Adjust quantities or add new items' },
    ],
    tips: ['Set low-stock alerts to avoid shortages', 'Track inventory usage per job']
  },
  {
    id: 'companies',
    label: 'Companies',
    icon: ClipboardList,
    description: 'Manage company accounts and settings',
    steps: [
      { step: 1, title: 'Click Companies Tab', description: 'Open company management' },
      { step: 2, title: 'View Company', description: 'See company details and configuration' },
      { step: 3, title: 'Edit Settings', description: 'Update company information' },
      { step: 4, title: 'Manage Branding', description: 'Configure logo and colors' },
    ],
    tips: ['Keep company details current for invoices', 'Set up branding for professional quotes']
  },
  {
    id: 'employees',
    label: 'Employees',
    icon: Users,
    description: 'Manage team members and assignments',
    steps: [
      { step: 1, title: 'Click Employees Tab', description: 'Open employee management' },
      { step: 2, title: 'View Team', description: 'See all employees and their roles' },
      { step: 3, title: 'Add Employee', description: 'Invite new team members' },
      { step: 4, title: 'Set Permissions', description: 'Configure role and access levels' },
    ],
    tips: ['Assign appropriate roles for security', 'Set up employee availability schedules']
  },
  {
    id: 'customers',
    label: 'Customers',
    icon: UserPlus,
    description: 'Manage customer profiles and history',
    steps: [
      { step: 1, title: 'Click Customers Tab', description: 'Open customer management' },
      { step: 2, title: 'Search Customer', description: 'Find by name, email, or phone' },
      { step: 3, title: 'View History', description: 'See service history and notes' },
      { step: 4, title: 'Edit Profile', description: 'Update contact and preference info' },
    ],
    tips: ['Keep customer notes updated', 'Track communication preferences']
  },
];

// Platform admin only Business Ops guides (Analytics features)
const BUSINESS_OPS_ADMIN_GUIDES: AgentGuide[] = [
  {
    id: 'performance',
    label: 'Performance Report',
    icon: BarChart3,
    description: 'Analyze team and business performance',
    steps: [
      { step: 1, title: 'Select Period', description: 'Choose date range for analysis' },
      { step: 2, title: 'Choose Metrics', description: 'Select KPIs to include' },
      { step: 3, title: 'Generate Report', description: 'Create comprehensive report' },
      { step: 4, title: 'Review Insights', description: 'Analyze trends and patterns' },
    ],
    tips: ['Compare to previous periods', 'Set up automated weekly reports']
  },
  {
    id: 'insights',
    label: 'Business Insights',
    icon: Lightbulb,
    description: 'Get AI-powered business recommendations',
    steps: [
      { step: 1, title: 'Ask Aura', description: 'Type your business question' },
      { step: 2, title: 'Get Analysis', description: 'AI analyzes your data in real-time' },
      { step: 3, title: 'View Results', description: 'See charts, metrics, and insights' },
      { step: 4, title: 'Take Action', description: 'Implement recommendations' },
    ],
    tips: ['Ask specific questions for better insights', 'Review insights weekly for trends']
  },
];

// Marketing & Sales Guides
const MARKETING_SALES_GUIDES: AgentGuide[] = [
  {
    id: 'campaign',
    label: 'Promotional / Promo Code',
    icon: Tag,
    description: 'Create promotional campaigns with discount codes',
    steps: [
      { step: 1, title: 'Select Campaign Type', description: 'Choose Promotional / Promo Code from campaign types' },
      { step: 2, title: 'Set Discount', description: 'Configure percentage or fixed amount discount' },
      { step: 3, title: 'Define Rules', description: 'Set usage limits, expiration, and eligibility' },
      { step: 4, title: 'Launch Campaign', description: 'Distribute via email, SMS, or direct share' },
    ],
    tips: ['Track code usage for ROI', 'Create seasonal promotions for better engagement']
  },
  {
    id: 'referral',
    label: 'Referral Program',
    icon: Gift,
    description: 'Set up and manage customer referral rewards',
    steps: [
      { step: 1, title: 'Configure Rewards', description: 'Set referrer and referee incentives' },
      { step: 2, title: 'Generate Links', description: 'Create unique referral codes and links' },
      { step: 3, title: 'Track Referrals', description: 'Monitor conversions and pending rewards' },
      { step: 4, title: 'Issue Rewards', description: 'Fulfill referral bonuses automatically or manually' },
    ],
    tips: ['Promote to satisfied customers after completed jobs', 'Offer compelling rewards that drive action']
  },
  {
    id: 'winback',
    label: 'Win-Back Campaign',
    icon: TrendingUp,
    description: 'Re-engage inactive and lapsed customers',
    steps: [
      { step: 1, title: 'Identify Lapsed', description: 'Find customers inactive for 90+ days' },
      { step: 2, title: 'Create Offer', description: 'Design compelling comeback incentive' },
      { step: 3, title: 'Send Campaign', description: 'Reach out via email and SMS' },
      { step: 4, title: 'Track Returns', description: 'Monitor re-engagement and conversion success' },
    ],
    tips: ['Personalize messaging based on past services', 'Offer limited-time incentives to create urgency']
  },
  {
    id: 'seasonal',
    label: 'Seasonal Campaign',
    icon: Calendar,
    description: 'Launch time-based seasonal promotions',
    steps: [
      { step: 1, title: 'Select Season/Event', description: 'Choose holiday, season, or special event' },
      { step: 2, title: 'Create Themed Offer', description: 'Design seasonal discount or bundle' },
      { step: 3, title: 'Set Campaign Window', description: 'Define start and end dates for the promotion' },
      { step: 4, title: 'Schedule Launch', description: 'Automate campaign to go live at the right time' },
    ],
    tips: ['Plan campaigns 2-3 weeks ahead of season', 'Use themed messaging and visuals for impact']
  },
  {
    id: 'loyalty',
    label: 'Loyalty Program',
    icon: Star,
    description: 'Reward repeat customers with loyalty benefits',
    steps: [
      { step: 1, title: 'Define Tiers', description: 'Create loyalty levels based on spend or visits' },
      { step: 2, title: 'Set Rewards', description: 'Configure benefits for each loyalty tier' },
      { step: 3, title: 'Enroll Customers', description: 'Add eligible customers to the program' },
      { step: 4, title: 'Track & Reward', description: 'Monitor points earned and rewards redeemed' },
    ],
    tips: ['Communicate tier progress to motivate customers', 'Offer exclusive perks for top-tier members']
  },
  {
    id: 'customers',
    label: 'Customer Segments',
    icon: Users,
    description: 'View and manage customer target groups',
    steps: [
      { step: 1, title: 'View Segments', description: 'See predefined customer groups and filters' },
      { step: 2, title: 'Create Custom', description: 'Build segments based on behavior criteria' },
      { step: 3, title: 'Target Campaigns', description: 'Use segments for precise campaign targeting' },
    ],
    tips: ['Update segments regularly as customer data changes', 'Combine criteria for precision targeting']
  },
];

// Social Media Ops Guides
const SOCIAL_MEDIA_GUIDES: AgentGuide[] = [
  {
    id: 'create-post',
    label: 'Create Post',
    icon: FileText,
    description: 'Create new social media content for multiple platforms',
    steps: [
      { step: 1, title: 'Click New Post', description: 'Open the post creation form from the navigation' },
      { step: 2, title: 'Select Platforms', description: 'Choose which platforms to create content for (Instagram, Facebook, LinkedIn, etc.)' },
      { step: 3, title: 'Write Content', description: 'Enter your message or use AI to generate platform-optimized content' },
      { step: 4, title: 'Add Hashtags', description: 'Include relevant hashtags for better reach' },
    ],
    tips: ['Each platform has character limits - AI will optimize automatically', 'Upload images for better engagement']
  },
  {
    id: 'manage-drafts',
    label: 'Manage Drafts',
    icon: FileText,
    description: 'Review and edit pending social media drafts',
    steps: [
      { step: 1, title: 'Click Drafts', description: 'Open the drafts queue to see all pending content' },
      { step: 2, title: 'Review Content', description: 'Check AI-generated content from job completions' },
      { step: 3, title: 'Edit if Needed', description: 'Make any adjustments to messaging or hashtags' },
      { step: 4, title: 'Approve & Publish', description: 'Approve content to publish immediately or schedule for later' },
    ],
    tips: ['Job completion photos automatically generate social content', 'Filter by platform to focus on specific channels']
  },
  {
    id: 'schedule-posts',
    label: 'Schedule Posts',
    icon: Calendar,
    description: 'Schedule content for optimal publishing times',
    steps: [
      { step: 1, title: 'Click Scheduled', description: 'View your scheduled posts queue' },
      { step: 2, title: 'Set Date & Time', description: 'Choose when to publish each post' },
      { step: 3, title: 'Select Timezone', description: 'Ensure correct timezone for your audience' },
      { step: 4, title: 'Confirm Schedule', description: 'Posts will automatically publish at scheduled time' },
    ],
    tips: ['Best times: Instagram 11am-1pm, LinkedIn 7-8am, Facebook 9am-12pm', 'Schedule posts ahead for consistent presence']
  },
  {
    id: 'content-calendar',
    label: 'Content Calendar',
    icon: Calendar,
    description: 'View your content publishing calendar',
    steps: [
      { step: 1, title: 'Click Calendar', description: 'Open the content calendar view' },
      { step: 2, title: 'Navigate Months', description: 'Use arrows to view different months' },
      { step: 3, title: 'View Day Details', description: 'Click any date to see scheduled and published content' },
      { step: 4, title: 'Track Activity', description: 'Blue dots = scheduled, green dots = published' },
    ],
    tips: ['Plan content at least a week in advance', 'Maintain consistent posting frequency']
  },
];

// Analytics & Optimization Guides
const ANALYTICS_GUIDES: AgentGuide[] = [
  {
    id: 'home',
    label: 'Home Dashboard',
    icon: Home,
    description: 'Overview of your analytics dashboard',
    steps: [
      { step: 1, title: 'View Summary', description: 'See key metrics at a glance' },
      { step: 2, title: 'Quick Actions', description: 'Access tabs for detailed analytics' },
      { step: 3, title: 'Ask Aura', description: 'Type questions about your data' },
      { step: 4, title: 'Get Insights', description: 'Receive AI-powered recommendations' },
    ],
    tips: ['Use the chat to ask about trends', 'Click any tab for detailed views']
  },
  {
    id: 'report',
    label: 'Performance Report',
    icon: BarChart3,
    description: 'Analyze business performance metrics',
    steps: [
      { step: 1, title: 'Click Report Tab', description: 'Open the performance report view' },
      { step: 2, title: 'Select Period', description: 'Choose date range for analysis' },
      { step: 3, title: 'View Metrics', description: 'See appointments, revenue, completion rates' },
      { step: 4, title: 'Close When Done', description: 'Click Close to return to Home' },
    ],
    tips: ['Compare to previous periods', 'Track month-over-month trends']
  },
  {
    id: 'revenue',
    label: 'Revenue Analysis',
    icon: DollarSign,
    description: 'Deep dive into revenue streams',
    steps: [
      { step: 1, title: 'Click Revenue Tab', description: 'Open revenue analysis view' },
      { step: 2, title: 'View Breakdown', description: 'See revenue by service type' },
      { step: 3, title: 'Check Pending', description: 'Track outstanding payments' },
      { step: 4, title: 'Close When Done', description: 'Click Close to return to Home' },
    ],
    tips: ['Track recurring vs one-time revenue', 'Monitor seasonal patterns']
  },
  {
    id: 'insights',
    label: 'Customer Insights',
    icon: Users,
    description: 'Understand customer behavior and value',
    steps: [
      { step: 1, title: 'Click Insights Tab', description: 'Open customer insights view' },
      { step: 2, title: 'View Demographics', description: 'See total, new, and returning customers' },
      { step: 3, title: 'Check Retention', description: 'Monitor retention and satisfaction rates' },
      { step: 4, title: 'Close When Done', description: 'Click Close to return to Home' },
    ],
    tips: ['Focus on high-value segments', 'Track satisfaction scores']
  },
  {
    id: 'forecast',
    label: 'Trend Forecast',
    icon: TrendingUp,
    description: 'Predict future business trends',
    steps: [
      { step: 1, title: 'Click Forecast Tab', description: 'Open trend forecasting view' },
      { step: 2, title: 'Select Metric', description: 'Choose what to forecast' },
      { step: 3, title: 'View Predictions', description: 'See AI-generated forecasts' },
      { step: 4, title: 'Close When Done', description: 'Click Close to return to Home' },
    ],
    tips: ['Consider seasonal factors', 'Update forecasts monthly']
  },
  {
    id: 'kpi',
    label: 'KPI Dashboard',
    icon: Target,
    description: 'Monitor key performance indicators',
    steps: [
      { step: 1, title: 'Click KPIs Tab', description: 'Open KPI dashboard view' },
      { step: 2, title: 'Select Period', description: 'Choose week, month, or quarter' },
      { step: 3, title: 'Review Metrics', description: 'See completion rate, revenue, jobs, response time' },
      { step: 4, title: 'Close When Done', description: 'Click Close to return to Home' },
    ],
    tips: ['Review KPIs daily', 'Track progress toward targets']
  },
  {
    id: 'social',
    label: 'Social Analytics',
    icon: Share2,
    description: 'Track social media publishing activity',
    steps: [
      { step: 1, title: 'Click Social Tab', description: 'Open social media analytics view' },
      { step: 2, title: 'View Platform Stats', description: 'See posts per platform (Instagram, Facebook, etc.)' },
      { step: 3, title: 'Check Publish Rate', description: 'Monitor draft to published ratio' },
      { step: 4, title: 'Get AI Insights', description: 'Click button for AI recommendations' },
    ],
    tips: ['Track which platforms perform best', 'Monitor publish rate consistency']
  },
  {
    id: 'reminders',
    label: 'Reminder Insights',
    icon: Bell,
    description: 'Analyze reminder effectiveness',
    steps: [
      { step: 1, title: 'Click Reminders Tab', description: 'Open reminder analytics view' },
      { step: 2, title: 'View Delivery Stats', description: 'See SMS and email reminder metrics' },
      { step: 3, title: 'Check Success Rates', description: 'Monitor delivery and confirmation rates' },
      { step: 4, title: 'Close When Done', description: 'Click Close to return to Home' },
    ],
    tips: ['Track which reminder types work best', 'Monitor opt-out rates']
  },
  {
    id: 'export',
    label: 'Export Reports',
    icon: Download,
    description: 'Download reports in CSV or PDF format',
    steps: [
      { step: 1, title: 'Click Export Tab', description: 'Open export report view' },
      { step: 2, title: 'Select Report Types', description: 'Check boxes for reports to include' },
      { step: 3, title: 'Choose Format', description: 'Select CSV or PDF' },
      { step: 4, title: 'Download', description: 'Click Download button to save' },
    ],
    tips: ['Export multiple reports at once', 'Share PDF reports with stakeholders']
  },
];

// Dispatch Field Ops Guides
const DISPATCH_FIELD_OPS_GUIDES: AgentGuide[] = [
  {
    id: 'map-view',
    label: 'Map View',
    icon: MapPin,
    description: 'Monitor all technicians and jobs on an interactive map',
    steps: [
      { step: 1, title: 'View Map', description: 'Click Map View tab to see all active jobs and technicians' },
      { step: 2, title: 'Track Locations', description: 'See real-time technician locations with status indicators' },
      { step: 3, title: 'Click Job Markers', description: 'Click on job markers to view details and take actions' },
      { step: 4, title: 'Monitor Coverage', description: 'Ensure technicians are optimally distributed across service area' },
    ],
    tips: ['Color-coded markers indicate job status', 'Technician locations update automatically every 30 seconds']
  },
  {
    id: 'agenda-view',
    label: 'Agenda View',
    icon: ClipboardList,
    description: 'View all jobs in a detailed list format',
    steps: [
      { step: 1, title: 'Switch to Agenda', description: 'Click Agenda View tab to see job list' },
      { step: 2, title: 'Filter by Status', description: 'Jobs are grouped by status: Pending, En Route, On Site, Completed' },
      { step: 3, title: 'View Details', description: 'Click any job to see customer info, technician, and financials' },
      { step: 4, title: 'Take Actions', description: 'Assign, reassign, notify customer, or cancel from each job card' },
    ],
    tips: ['Use Agenda View for detailed job management', 'Completed jobs are shown separately for review']
  },
  {
    id: 'assign-tech',
    label: 'Assign Technician',
    icon: UserPlus,
    description: 'Assign or reassign technicians to jobs',
    steps: [
      { step: 1, title: 'Find Unassigned Job', description: 'Locate jobs with pending or no technician assignment' },
      { step: 2, title: 'Click Assign', description: 'Open the technician assignment dialog' },
      { step: 3, title: 'Select Technician', description: 'Choose from available technicians based on location and workload' },
      { step: 4, title: 'Confirm Assignment', description: 'Technician receives notification and job appears in their queue' },
    ],
    tips: ['Smart assignment considers distance, workload, and service history', 'You can reassign jobs if a technician becomes unavailable']
  },
  {
    id: 'real-time-eta',
    label: 'Real-Time ETAs',
    icon: Clock,
    description: 'Monitor and manage customer arrival notifications',
    steps: [
      { step: 1, title: 'View ETA Panel', description: 'Click Show ETA Panel to see all en-route technicians' },
      { step: 2, title: 'Monitor Arrivals', description: 'See estimated arrival times for each active job' },
      { step: 3, title: 'Track Notifications', description: 'View which customers have been notified of technician approach' },
      { step: 4, title: 'Send Updates', description: 'Manually trigger ETA updates if needed' },
    ],
    tips: ['Customers are auto-notified when technician marks en-route', 'ETA panel shows notification status for each job']
  },
  {
    id: 'notify-customer',
    label: 'Notify Customer',
    icon: Bell,
    description: 'Send updates and notifications to customers',
    steps: [
      { step: 1, title: 'Select Job', description: 'Find the job you need to send a notification for' },
      { step: 2, title: 'Click Notify', description: 'Open the notification dialog from job actions' },
      { step: 3, title: 'Compose Message', description: 'Write or customize the notification message' },
      { step: 4, title: 'Send via Email/SMS', description: 'Choose channels and send notification to customer' },
    ],
    tips: ['Use for delays, schedule changes, or special instructions', 'Customers can reply to SMS notifications']
  },
  {
    id: 'cancel-job',
    label: 'Cancel Appointment',
    icon: AlertCircle,
    description: 'Cancel jobs and notify relevant parties',
    steps: [
      { step: 1, title: 'Select Job', description: 'Find the appointment to cancel' },
      { step: 2, title: 'Click Cancel', description: 'Open the cancellation dialog' },
      { step: 3, title: 'Enter Reason', description: 'Provide a reason for cancellation (optional)' },
      { step: 4, title: 'Confirm Cancel', description: 'Technician and customer are automatically notified' },
    ],
    tips: ['Cancelled jobs are logged for reporting', 'Consider rescheduling instead of cancelling when possible']
  },
  {
    id: 'job-financials',
    label: 'View Job Financials',
    icon: Receipt,
    description: 'Track quotes and invoices for each job',
    steps: [
      { step: 1, title: 'Open Job Details', description: 'Click on a job in Agenda View to expand details' },
      { step: 2, title: 'View Financials Tab', description: 'See linked quotes and invoices for the appointment' },
      { step: 3, title: 'Check Status', description: 'View payment status and amounts for each document' },
      { step: 4, title: 'Open Documents', description: 'Click to view full quote or invoice details' },
    ],
    tips: ['Technicians can generate quotes and invoices on-site', 'Payment status updates automatically when customer pays']
  },
  {
    id: 'status-legend',
    label: 'Status Legend',
    icon: CheckCircle,
    description: 'Understand job status indicators',
    steps: [
      { step: 1, title: 'Pending (Yellow)', description: 'Job assigned but not yet accepted by technician' },
      { step: 2, title: 'Accepted (Blue)', description: 'Technician has accepted the job assignment' },
      { step: 3, title: 'En Route (Cyan)', description: 'Technician is traveling to customer location' },
      { step: 4, title: 'On Site/In Progress (Orange)', description: 'Technician has arrived and is working on the job' },
    ],
    tips: ['Green indicates completed jobs', 'Status updates are real-time from technician app']
  },
];

export type ConsoleType = 'customer' | 'fieldops' | 'businessops' | 'businessops_admin' | 'marketing' | 'analytics' | 'dispatch' | 'social';

const CONSOLE_GUIDES: Record<ConsoleType, AgentGuide[]> = {
  customer: CUSTOMER_ENGAGEMENT_GUIDES,
  fieldops: FIELD_OPS_GUIDES,
  businessops: BUSINESS_OPS_BASE_GUIDES,
  businessops_admin: [...BUSINESS_OPS_BASE_GUIDES, ...BUSINESS_OPS_ADMIN_GUIDES],
  marketing: MARKETING_SALES_GUIDES,
  analytics: ANALYTICS_GUIDES,
  dispatch: DISPATCH_FIELD_OPS_GUIDES,
  social: SOCIAL_MEDIA_GUIDES,
};

const CONSOLE_TITLES: Record<ConsoleType, string> = {
  customer: 'How to use our AI agents',
  fieldops: 'How to use Technician-Field Ops Console and App',
  businessops: 'How to use Business Mgt Ops Console',
  businessops_admin: 'How to use Business Mgt Ops Console',
  marketing: 'How to use Marketing & Sales AI',
  analytics: 'How to use Analytics & Optimization AI',
  dispatch: 'How to use Dispatch-Field Ops Console',
  social: 'How to use Social Media Ops AI',
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
          <div className="grid gap-2 pr-1">
            {guides.map((guide) => (
              <Card
                key={guide.id}
                className={cn(
                  'p-2 cursor-pointer transition-all duration-200 bg-white text-foreground',
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
                    <h4 className="text-xs font-medium text-foreground truncate">{guide.label}</h4>
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
                            <p className="text-[11px] font-medium text-foreground">{step.title}</p>
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
