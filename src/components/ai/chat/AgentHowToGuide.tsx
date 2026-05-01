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
  Share2,
  Home,
  Activity,
  MessageSquare,
  Mic,
  Mail,
  Video
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
  color?: string;
  description: string;
  steps: HowToStep[];
  tips?: string[];
}

const COLOR_CLASSES: Record<string, { bg: string; icon: string; activeBg: string; activeBorder: string; step: string }> = {
  cyan:    { bg: 'bg-cyan-500/10',    icon: 'text-cyan-500',    activeBg: 'bg-cyan-500/5',    activeBorder: 'border-cyan-500/50',    step: 'bg-cyan-500/20 text-cyan-600' },
  blue:    { bg: 'bg-blue-500/10',    icon: 'text-blue-500',    activeBg: 'bg-blue-500/5',    activeBorder: 'border-blue-500/50',    step: 'bg-blue-500/20 text-blue-600' },
  green:   { bg: 'bg-green-500/10',   icon: 'text-green-600',   activeBg: 'bg-green-500/5',   activeBorder: 'border-green-500/50',   step: 'bg-green-500/20 text-green-700' },
  violet:  { bg: 'bg-violet-500/10',  icon: 'text-violet-600',  activeBg: 'bg-violet-500/5',  activeBorder: 'border-violet-500/50',  step: 'bg-violet-500/20 text-violet-700' },
  amber:   { bg: 'bg-amber-500/10',   icon: 'text-amber-600',   activeBg: 'bg-amber-500/5',   activeBorder: 'border-amber-500/50',   step: 'bg-amber-500/20 text-amber-700' },
  orange:  { bg: 'bg-orange-500/10',  icon: 'text-orange-600',  activeBg: 'bg-orange-500/5',  activeBorder: 'border-orange-500/50',  step: 'bg-orange-500/20 text-orange-700' },
  indigo:  { bg: 'bg-indigo-500/10',  icon: 'text-indigo-600',  activeBg: 'bg-indigo-500/5',  activeBorder: 'border-indigo-500/50',  step: 'bg-indigo-500/20 text-indigo-700' },
  teal:    { bg: 'bg-teal-500/10',    icon: 'text-teal-600',    activeBg: 'bg-teal-500/5',    activeBorder: 'border-teal-500/50',    step: 'bg-teal-500/20 text-teal-700' },
  rose:    { bg: 'bg-rose-500/10',    icon: 'text-rose-600',    activeBg: 'bg-rose-500/5',    activeBorder: 'border-rose-500/50',    step: 'bg-rose-500/20 text-rose-700' },
  red:     { bg: 'bg-red-500/10',     icon: 'text-red-600',     activeBg: 'bg-red-500/5',     activeBorder: 'border-red-500/50',     step: 'bg-red-500/20 text-red-700' },
  yellow:  { bg: 'bg-yellow-500/10',  icon: 'text-yellow-600',  activeBg: 'bg-yellow-500/5',  activeBorder: 'border-yellow-500/50',  step: 'bg-yellow-500/20 text-yellow-700' },
  emerald: { bg: 'bg-emerald-500/10', icon: 'text-emerald-600', activeBg: 'bg-emerald-500/5', activeBorder: 'border-emerald-500/50', step: 'bg-emerald-500/20 text-emerald-700' },
  gray:    { bg: 'bg-gray-500/10',    icon: 'text-gray-600',    activeBg: 'bg-gray-500/5',    activeBorder: 'border-gray-500/50',    step: 'bg-gray-500/20 text-gray-700' },
  pink:    { bg: 'bg-pink-500/10',    icon: 'text-pink-600',    activeBg: 'bg-pink-500/5',    activeBorder: 'border-pink-500/50',    step: 'bg-pink-500/20 text-pink-700' },
};

// Communication Methods Guides (Aura Features)
const COMMUNICATION_METHODS_GUIDES: AgentGuide[] = [
  {
    id: 'message-aura',
    label: 'Message Aura (Text)',
    icon: MessageSquare,
    color: 'cyan',
    description: 'Text-based chat for customer inquiries - available on all tiers',
    steps: [
      { step: 1, title: 'Open Chat Widget', description: 'Click the chat icon in the bottom right corner of the website or portal' },
      { step: 2, title: 'Type Your Message', description: 'Enter your question or request using your keyboard' },
      { step: 3, title: 'Get AI Response', description: 'Receive instant text responses from the AI assistant' },
      { step: 4, title: 'Continue Conversation', description: 'Ask follow-up questions or request specific actions like booking' },
    ],
    tips: [
      'No microphone or special setup needed - just type!',
      'Works on all subscription tiers',
      'AI can help with scheduling, quotes, and general inquiries'
    ]
  },
  {
    id: 'talk-to-aura',
    label: 'Talk to Aura (Voice)',
    icon: Mic,
    color: 'violet',
    description: 'Speech-based conversations with AI - requires ElevenLabs + Twilio',
    steps: [
      { step: 1, title: 'Click Voice Button', description: 'Tap the microphone icon to start a voice conversation' },
      { step: 2, title: 'Allow Microphone', description: 'Grant permission for the browser to use your microphone' },
      { step: 3, title: 'Speak Naturally', description: 'Talk to the AI as you would to a person' },
      { step: 4, title: 'Listen to Response', description: 'Hear the AI\'s spoken response through your speakers' },
    ],
    tips: [
      'Requires Core tier or higher',
      'Uses ElevenLabs for natural-sounding voice',
      'Great for hands-free interactions',
      'Transcripts are available after the call'
    ]
  },
  {
    id: 'ask-aura',
    label: 'Ask Aura (Staff Only)',
    icon: Mic,
    color: 'blue',
    description: 'Internal voice navigation for dashboard control - staff only',
    steps: [
      { step: 1, title: 'Open Ask Aura', description: 'Click the floating Aura button or use the keyboard shortcut' },
      { step: 2, title: 'Speak Command', description: 'Say what you want to do, like "Go to appointments" or "Show today\'s schedule"' },
      { step: 3, title: 'Navigate Hands-Free', description: 'Aura will navigate you to the requested page or perform the action' },
      { step: 4, title: 'Ask Questions', description: 'Get quick answers like "How many appointments today?" without navigating' },
    ],
    tips: [
      'Only available within the staff dashboard',
      'Use for quick navigation and queries',
      'Supports commands like "Show appointments", "Open analytics"',
      'Great for multitasking and hands-free operation'
    ]
  },
  {
    id: 'sms-reminders',
    label: 'SMS Reminders',
    icon: Smartphone,
    color: 'green',
    description: 'Automated text message notifications for appointments',
    steps: [
      { step: 1, title: 'Automatic Setup', description: 'SMS reminders are automatically sent based on your settings' },
      { step: 2, title: '24-Hour Reminder', description: 'Customers receive a reminder 24 hours before their appointment' },
      { step: 3, title: '1-Hour Reminder', description: 'A final reminder is sent 1 hour before the scheduled time' },
      { step: 4, title: 'Confirmation Links', description: 'Customers can confirm or reschedule via links in the message' },
    ],
    tips: [
      'Requires Twilio integration',
      'Customers can opt-out via reply',
      'Configure timing in Notification Settings',
      'Reduces no-shows by up to 50%'
    ]
  },
  {
    id: 'email-reminders',
    label: 'Email Reminders',
    icon: Mail,
    color: 'amber',
    description: 'Automated email notifications for appointments and campaigns',
    steps: [
      { step: 1, title: 'Automatic Delivery', description: 'Email reminders are sent automatically based on your schedule' },
      { step: 2, title: 'Professional Templates', description: 'Branded templates include your company logo and colors' },
      { step: 3, title: 'Action Buttons', description: 'Customers can confirm, reschedule, or cancel directly from email' },
      { step: 4, title: 'Track Engagement', description: 'View open rates and clicks in the Analytics console' },
    ],
    tips: [
      'No external integration required',
      'Customize templates in Settings',
      'Works alongside SMS for maximum reach',
      'Include directions and preparation instructions'
    ]
  },
];

// Customer Portal Guides
const CUSTOMER_ENGAGEMENT_GUIDES: AgentGuide[] = [
  {
    id: 'schedule',
    label: 'Book Appointment',
    icon: Calendar,
    color: 'amber',
    description: 'Schedule a service appointment with our team',
    steps: [
      { step: 1, title: 'Select Service', description: 'Choose the type of service you need from our available options' },
      { step: 2, title: 'Pick Date & Time', description: 'Select your preferred date and available time slot' },
      { step: 3, title: 'Enter Details', description: 'Provide your contact information and service address' },
      { step: 4, title: 'Confirm Booking', description: 'Review and confirm your appointment details' },
    ],
    tips: ['Book at least 24 hours in advance for best availability', 'You can reschedule or cancel anytime from your portal', 'Virtual services are available — meeting details are sent after staff confirms']
  },
  {
    id: 'emergency',
    label: 'Emergency Service',
    icon: AlertTriangle,
    color: 'red',
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
    color: 'green',
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
    color: 'blue',
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
    color: 'cyan',
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
    color: 'teal',
    description: 'Check the status of your scheduled appointment',
    steps: [
      { step: 1, title: 'Enter Details', description: 'Provide your email or phone used during booking' },
      { step: 2, title: 'Find Appointment', description: 'Select your appointment from the list' },
      { step: 3, title: 'View Status', description: 'See real-time status: confirmed, en-route, in-session, or completed' },
      { step: 4, title: 'Get Updates', description: 'Receive notifications as your service professional approaches or session begins' },
    ],
    tips: ['Enable SMS notifications for real-time updates', 'For in-person services, track your professional\'s location on the day of service', 'For virtual sessions, your meeting link will appear once confirmed']
  },
  {
    id: 'billing',
    label: 'Billing Inquiry',
    icon: DollarSign,
    color: 'green',
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
    color: 'yellow',
    description: 'Share your experience with our service',
    steps: [
      { step: 1, title: 'Select Service', description: 'Choose the service visit you want to rate' },
      { step: 2, title: 'Rate Experience', description: 'Give a star rating for overall satisfaction' },
      { step: 3, title: 'Add Comments', description: 'Share specific feedback or suggestions' },
      { step: 4, title: 'Submit', description: 'Your feedback helps us improve our service' },
    ],
    tips: ['Your feedback is confidential and valued', 'Mention specific team members to recognize great work']
  },
  {
    id: 'review',
    label: 'Write Review',
    icon: ThumbsUp,
    color: 'emerald',
    description: 'Leave a public review on Google, Yelp, or Facebook',
    steps: [
      { step: 1, title: 'Choose Platform', description: 'Select Google, Yelp, or Facebook for your review' },
      { step: 2, title: 'Click Link', description: 'You will be redirected to the review platform' },
      { step: 3, title: 'Write Review', description: 'Share your experience with others' },
      { step: 4, title: 'Post Review', description: 'Submit your review on the platform' },
    ],
    tips: ['Reviews help other customers find us', 'Mention what made your experience great']
  },
  {
    id: 'join-video',
    label: 'Join Video Session',
    icon: Video,
    color: 'violet',
    description: 'Connect to your virtual appointment via Google Meet',
    steps: [
      { step: 1, title: 'Check Confirmation', description: 'Look for the meeting link in your email or SMS confirmation after staff accepts' },
      { step: 2, title: 'Click Meeting Link', description: 'Open the Google Meet link from your confirmation or customer portal' },
      { step: 3, title: 'Allow Camera/Mic', description: 'Grant browser permissions for camera and microphone when prompted' },
      { step: 4, title: 'Join Session', description: 'Click Join to connect with your service professional' },
    ],
    tips: ['Meeting links are generated after your appointment is confirmed by staff', 'Test your camera and microphone before the session', 'You can also find the link in your customer portal under upcoming appointments']
  },
];

// Field Operations Guides
const FIELD_OPS_GUIDES: AgentGuide[] = [
  {
    id: 'install-app',
    label: 'Install Field Ops App',
    icon: Smartphone,
    color: 'blue',
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
    color: 'green',
    description: 'Accept and confirm assigned jobs',
    steps: [
      { step: 1, title: 'View Assignment', description: 'Review the job details including customer info and service type' },
      { step: 2, title: 'Check Schedule', description: 'Confirm you can make the scheduled time' },
      { step: 3, title: 'Accept Job', description: 'Click Accept to confirm you will handle this job' },
      { step: 4, title: 'Get Directions', description: 'AI will automatically prompt you to get directions to the job site' },
    ],
    tips: ['Accept jobs promptly to avoid reassignment', 'Contact dispatch if you have scheduling conflicts', 'After accepting, follow the AI prompts for next steps', 'For virtual appointments, a Google Meet link is auto-generated and sent to the customer upon acceptance']
  },
  {
    id: 'directions',
    label: 'Get Directions',
    icon: Navigation,
    color: 'cyan',
    description: 'Navigate to customer location',
    steps: [
      { step: 1, title: 'Select Job', description: 'Choose the job you need directions to' },
      { step: 2, title: 'Click Directions', description: 'Open navigation in your preferred maps app' },
      { step: 3, title: 'Follow Route', description: 'Follow the optimal route to the customer' },
      { step: 4, title: 'Mark En Route', description: 'AI will prompt you to mark yourself as en route' },
    ],
    tips: ['Check traffic conditions before departing', 'Save customer address for future visits', 'Directions apply to in-person appointments only — virtual and at-business jobs skip this step']
  },
  {
    id: 'enroute',
    label: 'Mark En Route',
    icon: Truck,
    color: 'orange',
    description: 'Update status when heading to a job',
    steps: [
      { step: 1, title: 'Start Travel', description: 'Begin traveling to the customer location' },
      { step: 2, title: 'Update Status', description: 'Click En Route to update your status' },
      { step: 3, title: 'Auto ETA', description: 'AI calculates and sends ETA to customer automatically' },
      { step: 4, title: 'Customer Notified', description: 'Customer receives SMS/email with your ETA' },
    ],
    tips: ['Update status as soon as you leave', 'ETA is automatically sent to customer via SMS and email', 'This step is skipped for virtual and at-business appointments']
  },
  {
    id: 'eta',
    label: 'Update ETA',
    icon: Clock,
    color: 'blue',
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
    color: 'amber',
    description: 'Confirm arrival and begin work in one step',
    steps: [
      { step: 1, title: 'Arrive On-Site', description: 'Park and prepare to meet the customer' },
      { step: 2, title: 'Click Arrive & Start', description: 'Update status to Arrived and In Progress simultaneously' },
      { step: 3, title: 'Take Before Photos', description: 'Document the job site before starting work' },
      { step: 4, title: 'Begin Service', description: 'Start the service work for the customer' },
    ],
    tips: ['Mark arrived immediately when on-site', 'Take before photos for documentation', 'Customer is automatically notified of your arrival', 'For virtual appointments, use "Start Virtual Session" instead']
  },
  {
    id: 'complete',
    label: 'Complete Job',
    icon: CheckCircle,
    color: 'emerald',
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
    color: 'blue',
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
    color: 'green',
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
    color: 'teal',
    description: 'Reach dispatch for urgent matters',
    steps: [
      { step: 1, title: 'Click Contact', description: 'Open dispatch communication' },
      { step: 2, title: 'Describe Issue', description: 'Explain the situation clearly' },
      { step: 3, title: 'Get Assistance', description: 'Dispatch will provide guidance' },
    ],
    tips: ['Use for urgent situations only', 'Have job details ready when calling']
  },
  {
    id: 'virtual-session',
    label: 'Start Virtual Session',
    icon: Video,
    color: 'violet',
    description: 'Join a virtual appointment via Google Meet',
    steps: [
      { step: 1, title: 'Accept Virtual Job', description: 'Accept the job — a Google Meet link is auto-generated and sent to the customer' },
      { step: 2, title: 'Open Meeting Link', description: 'Click "Start Virtual Session" to open Google Meet in your browser' },
      { step: 3, title: 'Join & Conduct Session', description: 'Connect with the customer and perform the virtual consultation or service' },
      { step: 4, title: 'Complete Job', description: 'Mark the job complete and add session notes as usual' },
    ],
    tips: ['Travel steps (directions, en route, arrive) are automatically hidden for virtual jobs', 'Ensure your camera and microphone work before the session', 'The meeting link is only generated after you accept the job']
  },
  {
    id: 'phone-session',
    label: 'Phone Call Appointments',
    icon: Phone,
    color: 'indigo',
    description: 'Handle appointments conducted over the phone',
    steps: [
      { step: 1, title: 'Accept Phone Job', description: 'Accept the phone appointment from your job queue' },
      { step: 2, title: 'Call Customer', description: 'Use the customer\'s phone number to initiate the call at the scheduled time' },
      { step: 3, title: 'Conduct Session', description: 'Perform the consultation, assessment, or service over the phone' },
      { step: 4, title: 'Complete & Document', description: 'Mark complete and add call notes, follow-up actions, or quotes' },
    ],
    tips: ['Phone appointments skip travel steps just like virtual sessions', 'Have the customer file and service details open during the call', 'Generate a quote or invoice right after the call while details are fresh']
  },
];

// Business Operations Guides — Business Finance + Admin Operatives
const BUSINESS_OPS_BASE_GUIDES: AgentGuide[] = [
  {
    id: 'aura-live',
    label: 'Aura Live',
    icon: Activity,
    color: 'cyan',
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
    label: 'Create Quote',
    icon: FileText,
    color: 'blue',
    description: 'Generate professional quotes — handled by Business Finance Operative',
    steps: [
      { step: 1, title: 'Click Quote Tab', description: 'Select the Quote button to open the quote manager' },
      { step: 2, title: 'Add Customer', description: 'Enter customer name and contact details' },
      { step: 3, title: 'Add Line Items', description: 'Select services, set quantities and pricing' },
      { step: 4, title: 'Send Quote', description: 'Email or SMS the quote directly to the customer' },
    ],
    tips: ['The Business Finance Operative covers quoting, invoicing, and inventory in one place', 'Convert quotes to invoices with one click']
  },
  {
    id: 'invoice',
    label: 'Create Invoice',
    icon: Receipt,
    color: 'green',
    description: 'Create and send invoices with payment links — Business Finance Operative',
    steps: [
      { step: 1, title: 'Click Invoice Tab', description: 'Select the Invoice button to open the manager' },
      { step: 2, title: 'Select Customer', description: 'Choose existing customer or add new' },
      { step: 3, title: 'Add Services', description: 'List all services and parts provided' },
      { step: 4, title: 'Send with Payment Link', description: 'Include Stripe payment link for instant pay' },
    ],
    tips: ['Add Stripe payment links for faster collection', 'Send invoice before leaving the job site for same-day payment']
  },
  {
    id: 'lead',
    label: 'Add Lead',
    icon: UserPlus,
    color: 'violet',
    description: 'Track new sales leads — managed by Business Finance Operative',
    steps: [
      { step: 1, title: 'Click Lead Tab', description: 'Select Lead button to open the lead form' },
      { step: 2, title: 'Enter Details', description: 'Add lead name, contact info, and source' },
      { step: 3, title: 'Set Priority', description: 'Mark lead as hot, warm, or cold' },
      { step: 4, title: 'Schedule Follow-up', description: 'Set a reminder for initial contact' },
    ],
    tips: ['Follow up within 24 hours for best conversion', 'Log all interactions to maintain context']
  },
  {
    id: 'inventory',
    label: 'Manage Inventory',
    icon: Package,
    color: 'orange',
    description: 'View and manage inventory levels — Business Finance Operative',
    steps: [
      { step: 1, title: 'Click Inventory Tab', description: 'Open inventory management' },
      { step: 2, title: 'Search Items', description: 'Find parts by name or SKU' },
      { step: 3, title: 'Check Stock', description: 'View quantity levels and reorder points' },
      { step: 4, title: 'Update Stock', description: 'Adjust quantities or add new items' },
    ],
    tips: ['Set low-stock alerts to avoid shortages', 'Track inventory usage per job for cost reporting']
  },
  {
    id: 'appointments',
    label: 'Manage Appointments',
    icon: Calendar,
    color: 'amber',
    description: 'Create and manage appointments — handled by Admin Operative',
    steps: [
      { step: 1, title: 'Click Appts Tab', description: 'Open the appointments manager' },
      { step: 2, title: 'View Schedule', description: 'See all upcoming and past appointments' },
      { step: 3, title: 'Create New', description: 'Add appointment with customer details and delivery type (virtual, in-person, or at-business)' },
      { step: 4, title: 'Assign Staff', description: 'Assign an available team member to the job' },
    ],
    tips: ['The Admin Operative handles scheduling, staff, and operational settings', 'Virtual appointments auto-generate a Google Meet link when staff accepts', 'Delivery type controls whether travel steps appear in Field Ops']
  },
  {
    id: 'companies',
    label: 'Company Settings',
    icon: ClipboardList,
    color: 'indigo',
    description: 'Manage company accounts — Admin Operative (Platform Admin only)',
    steps: [
      { step: 1, title: 'Click Companies Tab', description: 'Open company management (Platform Admin only)' },
      { step: 2, title: 'View Companies', description: 'See all company accounts on the platform' },
      { step: 3, title: 'Edit Settings', description: 'Update company information and configuration' },
      { step: 4, title: 'Manage Branding', description: 'Configure logo, colors, and public-facing details' },
    ],
    tips: ['Keep company details current for accurate invoices and quotes', 'Set branding for professional customer-facing documents']
  },
  {
    id: 'employees',
    label: 'Manage Team',
    icon: Users,
    color: 'teal',
    description: 'Add and manage team members — Admin Operative',
    steps: [
      { step: 1, title: 'Click Employees Tab', description: 'Open employee management' },
      { step: 2, title: 'View Team', description: 'See all employees, roles, and status' },
      { step: 3, title: 'Invite Employee', description: 'Add new team member with email invite' },
      { step: 4, title: 'Set Role & Permissions', description: 'Configure access levels based on job type' },
    ],
    tips: ['Assign appropriate roles for data security', 'Set employee availability for smart scheduling']
  },
  {
    id: 'customers',
    label: 'Customer Profiles',
    icon: UserPlus,
    color: 'rose',
    description: 'View and manage customer history — Admin Operative',
    steps: [
      { step: 1, title: 'Click Customers Tab', description: 'Open customer management' },
      { step: 2, title: 'Search Customer', description: 'Find by name, email, or phone number' },
      { step: 3, title: 'View History', description: 'See full service history, notes, and preferences' },
      { step: 4, title: 'Edit Profile', description: 'Update contact info and communication preferences' },
    ],
    tips: ['Keep customer notes updated after each job', 'Track opt-out preferences to stay compliant']
  },
];


// Outreach & Sales Ops Guides — Consolidated Outreach Operative
const MARKETING_SALES_GUIDES: AgentGuide[] = [
  {
    id: 'campaign',
    label: 'Create Campaign',
    icon: Tag,
    color: 'violet',
    description: 'Launch email or SMS marketing campaigns',
    steps: [
      { step: 1, title: 'Click Campaign Tab', description: 'Select Campaign from the quick actions at the top' },
      { step: 2, title: 'Choose Campaign Type', description: 'Pick from Promotional, Win-Back, Seasonal, or Loyalty' },
      { step: 3, title: 'Configure & Audience', description: 'Set message, discount, and target customer segment' },
      { step: 4, title: 'Launch', description: 'Send immediately or schedule for a future date' },
    ],
    tips: ['The Outreach Operative handles campaign creation, lead scoring, and segmentation in one place', 'Track code usage for ROI after launch']
  },
  {
    id: 'leads',
    label: 'Manage Leads',
    icon: UserPlus,
    color: 'pink',
    description: 'Add, score, and follow up on sales leads',
    steps: [
      { step: 1, title: 'Click Leads Tab', description: 'Select Leads from the quick actions' },
      { step: 2, title: 'Add New Lead', description: 'Enter lead name, contact info, and source' },
      { step: 3, title: 'Set Priority', description: 'Mark as hot, warm, or cold based on intent' },
      { step: 4, title: 'Schedule Follow-up', description: 'Set a reminder for outreach within 24 hours' },
    ],
    tips: ['The Outreach Operative auto-scores leads from AI chat interactions', 'Follow up within 24 hours for best conversion rates']
  },
  {
    id: 'referral',
    label: 'Referral Program',
    icon: Gift,
    color: 'orange',
    description: 'Set up customer referral rewards and tracking',
    steps: [
      { step: 1, title: 'Open Referral Settings', description: 'Ask the Outreach AI to set up a referral program' },
      { step: 2, title: 'Configure Rewards', description: 'Set referrer and referee incentives (cash, discount, gift)' },
      { step: 3, title: 'Share Codes', description: 'Distribute unique referral links via email or SMS' },
      { step: 4, title: 'Track & Fulfill', description: 'Monitor conversions and issue rewards automatically' },
    ],
    tips: ['Promote to satisfied customers after completed jobs', 'Offer compelling rewards to drive action']
  },
  {
    id: 'customers',
    label: 'Customer Segments',
    icon: Users,
    color: 'teal',
    description: 'View and target customer groups for campaigns',
    steps: [
      { step: 1, title: 'Click Marketing Tab', description: 'Select Marketing from the quick actions' },
      { step: 2, title: 'View Segments', description: 'See predefined groups: New, Returning, Lapsed, VIP' },
      { step: 3, title: 'Create Custom Segment', description: 'Build filters based on spend, service, or behavior' },
      { step: 4, title: 'Target Campaign', description: 'Link segment to a campaign for precise targeting' },
    ],
    tips: ['Segments update automatically as customer data changes', 'Combine multiple criteria for precision targeting']
  },
  {
    id: 'winback',
    label: 'Win-Back Campaign',
    icon: TrendingUp,
    color: 'amber',
    description: 'Re-engage lapsed customers automatically',
    steps: [
      { step: 1, title: 'Ask Outreach AI', description: 'Type "Create a win-back campaign" in the chat' },
      { step: 2, title: 'AI Identifies Lapsed', description: 'AI finds customers inactive for 90+ days' },
      { step: 3, title: 'Set Offer', description: 'Define your comeback incentive or discount' },
      { step: 4, title: 'Launch & Track', description: 'Send via email/SMS and monitor re-engagement' },
    ],
    tips: ['Personalize messaging based on past services', 'Urgency (limited-time offers) drives higher re-engagement']
  },
];

// Social Media Ops Guides — Consolidated Creative Content Operative
const SOCIAL_MEDIA_GUIDES: AgentGuide[] = [
  {
    id: 'ai-chat',
    label: 'Ask the AI',
    icon: MessageSquare,
    color: 'pink',
    description: 'Chat with the Creative Content AI for ideas and copy',
    steps: [
      { step: 1, title: 'Start on Home Tab', description: 'The Home tab opens a direct chat with the Creative Content operative' },
      { step: 2, title: 'Describe Your Goal', description: 'Say what you need: "Write a Facebook post about our spring sale"' },
      { step: 3, title: 'Review AI Output', description: 'The AI generates platform-optimized content with hashtags' },
      { step: 4, title: 'Copy & Use', description: 'Copy the text and post manually, or send to Create Content for scheduling' },
    ],
    tips: ['The Creative Content operative covers all 6 platforms: Instagram, Facebook, LinkedIn, TikTok, GMB, and X', 'Ask for variations — "Give me 3 versions of this post"']
  },
  {
    id: 'create-content',
    label: 'Create Content',
    icon: Share2,
    color: 'violet',
    description: 'Use the multi-channel content generator and dashboard',
    steps: [
      { step: 1, title: 'Click Create Content Tab', description: 'Open the multi-channel content engine' },
      { step: 2, title: 'Set Brand Voice', description: 'Go to Brand Voice settings to configure your tone and industry profile' },
      { step: 3, title: 'Generate Content', description: 'Use the Generator tab to create content for all selected platforms at once' },
      { step: 4, title: 'Review Dashboard & Calendar', description: 'Track history in Dashboard and plan ahead in the Calendar view' },
    ],
    tips: ['Set up your Brand Voice profile first for better AI output', 'Use the Calendar tab to plan a full month of content in one session']
  },
  {
    id: 'my-posts',
    label: 'My Posts',
    icon: FileText,
    color: 'blue',
    description: 'View and manage your saved drafts and published posts',
    steps: [
      { step: 1, title: 'Click My Posts Tab', description: 'Open the unified post feed' },
      { step: 2, title: 'Filter by Status', description: 'Toggle between Pending drafts and Published posts' },
      { step: 3, title: 'Review Drafts', description: 'Edit or approve AI-generated drafts before posting' },
      { step: 4, title: 'Publish or Schedule', description: 'Post immediately or set a scheduled publish time' },
    ],
    tips: ['Drafts are created automatically when the AI generates content', 'Use the Manual Bridge: copy optimized content and paste directly into each platform app']
  },
  {
    id: 'brand-voice',
    label: 'Brand Voice Setup',
    icon: Star,
    color: 'amber',
    description: 'Configure your AI content profile for consistent branding',
    steps: [
      { step: 1, title: 'Open Create Content Tab', description: 'Click Create Content then select Brand Voice' },
      { step: 2, title: 'Set Industry & Tone', description: 'Choose your industry and preferred tone (professional, friendly, bold, etc.)' },
      { step: 3, title: 'Add Keywords', description: 'Enter brand keywords, services, and topics to feature' },
      { step: 4, title: 'Save Profile', description: 'All future AI content will follow your brand guidelines' },
    ],
    tips: ['Complete the Brand Voice setup before generating your first batch of content', 'Add avoid-topics to keep content on-brand']
  },
  {
    id: 'content-calendar',
    label: 'Content Calendar',
    icon: Calendar,
    color: 'teal',
    description: 'Plan and visualize your publishing schedule',
    steps: [
      { step: 1, title: 'Open Create Content Tab', description: 'Click Create Content then select Calendar' },
      { step: 2, title: 'Navigate Months', description: 'Use arrows to browse past and future months' },
      { step: 3, title: 'View Day Details', description: 'Click any date to see scheduled and published content for that day' },
      { step: 4, title: 'Track Activity', description: 'Blue dots = scheduled, green dots = published' },
    ],
    tips: ['Plan content at least a week in advance for consistent posting', 'Aim for 3–5 posts per week across all platforms']
  },
];

// Analytics & Optimization Guides
const ANALYTICS_GUIDES: AgentGuide[] = [
  {
    id: 'home',
    label: 'Home Dashboard',
    icon: Home,
    color: 'cyan',
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
    color: 'blue',
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
    color: 'green',
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
    color: 'teal',
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
    color: 'orange',
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
    color: 'red',
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
    color: 'violet',
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
    color: 'amber',
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
    color: 'gray',
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
    color: 'cyan',
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
    color: 'blue',
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
    label: 'Assign Staff',
    icon: UserPlus,
    color: 'violet',
    description: 'Assign or reassign team members to jobs',
    steps: [
      { step: 1, title: 'Find Unassigned Job', description: 'Locate jobs with pending or no staff assignment' },
      { step: 2, title: 'Click Assign', description: 'Open the staff assignment dialog' },
      { step: 3, title: 'Select Team Member', description: 'Choose from available staff based on location and workload' },
      { step: 4, title: 'Confirm Assignment', description: 'Team member receives notification and job appears in their queue' },
    ],
    tips: ['Smart assignment considers distance, workload, and service history', 'You can reassign jobs if someone becomes unavailable', 'Terminology adapts by industry: Technician, Stylist, Agent, Therapist, etc.']
  },
  {
    id: 'real-time-eta',
    label: 'Real-Time ETAs',
    icon: Clock,
    color: 'amber',
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
    color: 'teal',
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
    color: 'red',
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
    color: 'green',
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
    color: 'emerald',
    description: 'Understand job status indicators',
    steps: [
      { step: 1, title: 'Pending (Yellow)', description: 'Job assigned but not yet accepted by staff' },
      { step: 2, title: 'Accepted (Blue)', description: 'Staff has accepted the job assignment' },
      { step: 3, title: 'En Route (Cyan)', description: 'Staff is traveling to customer location (in-person only)' },
      { step: 4, title: 'On Site/In Progress (Orange)', description: 'Staff has arrived or virtual session is underway' },
    ],
    tips: ['Green indicates completed jobs', 'Status updates are real-time from the field ops app', 'Virtual appointments skip En Route — they go directly from Accepted to In Progress']
  },
];

export type ConsoleType = 'customer' | 'fieldops' | 'businessops' | 'businessops_admin' | 'marketing' | 'analytics' | 'dispatch' | 'social' | 'communication';

const CONSOLE_GUIDES: Record<ConsoleType, AgentGuide[]> = {
  customer: CUSTOMER_ENGAGEMENT_GUIDES,
  fieldops: FIELD_OPS_GUIDES,
  businessops: BUSINESS_OPS_BASE_GUIDES,
  businessops_admin: BUSINESS_OPS_BASE_GUIDES,
  marketing: MARKETING_SALES_GUIDES,
  analytics: ANALYTICS_GUIDES,
  dispatch: DISPATCH_FIELD_OPS_GUIDES,
  social: SOCIAL_MEDIA_GUIDES,
  communication: COMMUNICATION_METHODS_GUIDES,
};

const CONSOLE_TITLES: Record<ConsoleType, string> = {
  customer: 'How to use the Customer Portal',
  fieldops: 'How to use Field Ops Console & App',
  businessops: 'How to use Business Management Console',
  businessops_admin: 'How to use Business Management Console',
  marketing: 'How to use Outreach & Sales Ops',
  analytics: 'How to use Analytics Intelligence',
  dispatch: 'How to use Dispatch & Field Ops',
  social: 'How to use Social Media Ops',
  communication: 'Aura Communication Methods',
};

interface AgentHowToGuideProps {
  className?: string;
  defaultExpanded?: boolean;
  consoleType?: ConsoleType;
  feedbackRating?: number;
}

export const AgentHowToGuide: React.FC<AgentHowToGuideProps> = ({
  className,
  defaultExpanded = false,
  consoleType = 'customer',
  feedbackRating,
}) => {
  const [isOpen, setIsOpen] = useState(defaultExpanded);
  const [expandedGuide, setExpandedGuide] = useState<string | null>(null);

  const allGuides = CONSOLE_GUIDES[consoleType];
  const guides = allGuides.filter(g => g.id !== 'review' || (feedbackRating !== undefined && feedbackRating >= 4));
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
            {guides.map((guide) => {
              const c = COLOR_CLASSES[guide.color ?? 'cyan'];
              return (
                <Card
                  key={guide.id}
                  className={cn(
                    'p-2 cursor-pointer transition-all duration-200 border',
                    expandedGuide === guide.id ? `${c.activeBorder} ${c.activeBg}` : 'border-border/50 hover:border-border'
                  )}
                  onClick={() => setExpandedGuide(expandedGuide === guide.id ? null : guide.id)}
                >
                  <div className="flex items-center gap-2">
                    <div className={cn('p-1.5 rounded-md shrink-0', c.bg)}>
                      <guide.icon className={cn('h-3.5 w-3.5', c.icon)} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className={cn('text-xs font-medium truncate', c.icon)}>{guide.label}</h4>
                      <p className="text-[10px] text-white truncate">{guide.description}</p>
                    </div>
                    {expandedGuide === guide.id ? (
                      <ChevronUp className={cn('h-3.5 w-3.5 shrink-0', c.icon)} />
                    ) : (
                      <ChevronDown className="h-3.5 w-3.5 text-card-foreground/40 shrink-0" />
                    )}
                  </div>
                  
                  {expandedGuide === guide.id && (
                    <div className="mt-3 pt-2 border-t border-border/40 space-y-2 animate-fade-in">
                      <div className="space-y-1.5">
                        {guide.steps.map((step) => (
                          <div key={step.step} className="flex gap-2">
                            <div className={cn('shrink-0 flex items-center justify-center w-5 h-5 rounded-full text-[10px] font-bold', c.step)}>
                              {step.step}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className={cn('text-[11px] font-medium', c.icon)}>{step.title}</p>
                              <p className="text-[10px] text-white">{step.description}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                      
                      {guide.tips && guide.tips.length > 0 && (
                        <div className="pt-2 border-t border-border/40">
                          <p className="text-[10px] font-medium text-white mb-1">Tips:</p>
                          <ul className="space-y-0.5">
                            {guide.tips.map((tip, idx) => (
                              <li key={idx} className="flex items-start gap-1.5 text-[10px] text-white">
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
              );
            })}
          </div>
        </CollapsibleContent>
      </Collapsible>
    </div>
  );
};
