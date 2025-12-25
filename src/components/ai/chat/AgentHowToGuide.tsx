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
  CheckCircle2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
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

const AGENT_GUIDES: AgentGuide[] = [
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

interface AgentHowToGuideProps {
  className?: string;
  defaultExpanded?: boolean;
}

export const AgentHowToGuide: React.FC<AgentHowToGuideProps> = ({
  className,
  defaultExpanded = false,
}) => {
  const [isOpen, setIsOpen] = useState(defaultExpanded);
  const [expandedGuide, setExpandedGuide] = useState<string | null>(null);

  return (
    <div className={cn('w-full max-w-md mx-auto px-2', className)}>
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <CollapsibleTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            className="w-full flex items-center justify-center gap-2 text-muted-foreground hover:text-foreground text-xs py-1"
          >
            <HelpCircle className="h-3.5 w-3.5" />
            <span>How to use our AI agents</span>
            {isOpen ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
          </Button>
        </CollapsibleTrigger>
        
        <CollapsibleContent className="mt-2 space-y-2">
          <div className="grid gap-2">
            {AGENT_GUIDES.map((guide) => (
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
