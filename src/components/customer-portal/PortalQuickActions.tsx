import { useNavigate } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import {
  Wrench, Receipt, Calendar, Clock, MessageCircle, Home, FileText,
  Sparkles, UtensilsCrossed, MapPin, Bell, type LucideIcon,
} from 'lucide-react';
import { useIndustryPack } from '@/hooks/useIndustryPack';

interface QuickAction {
  label: string;
  icon: LucideIcon;
  /** Pre-fills the chat with this command. */
  prompt: string;
}

const TRADES: QuickAction[] = [
  { label: 'Request Service', icon: Wrench, prompt: 'I need to request service.' },
  { label: 'Track My Tech', icon: MapPin, prompt: 'Where is my technician?' },
  { label: 'My Invoices', icon: Receipt, prompt: 'Show me my invoices.' },
  { label: 'Reschedule Visit', icon: Calendar, prompt: 'I need to reschedule my appointment.' },
];
const OUTDOOR: QuickAction[] = [
  { label: 'Request Visit', icon: Wrench, prompt: 'I need to request a service visit.' },
  { label: 'My Schedule', icon: Calendar, prompt: 'When is my next service visit?' },
  { label: 'Last Visit Photos', icon: FileText, prompt: 'Show me the photos from my last service visit.' },
  { label: 'My Invoices', icon: Receipt, prompt: 'Show me my invoices.' },
];
const REPAIR: QuickAction[] = [
  { label: 'New Repair Ticket', icon: Wrench, prompt: 'I have a new repair to request.' },
  { label: 'Check Ticket Status', icon: Clock, prompt: 'What is the status of my repair?' },
  { label: 'Service History', icon: FileText, prompt: 'Show me my service history.' },
  { label: 'My Invoices', icon: Receipt, prompt: 'Show me my invoices.' },
];
const BOOKING: QuickAction[] = [
  { label: 'Book Appointment', icon: Calendar, prompt: 'I would like to book an appointment.' },
  { label: 'My Bookings', icon: Clock, prompt: 'Show me my upcoming bookings.' },
  { label: 'Reschedule', icon: Bell, prompt: 'I need to reschedule.' },
  { label: 'Message Us', icon: MessageCircle, prompt: 'I have a question.' },
];

const BY_CLUSTER: Record<string, QuickAction[]> = {
  trades: TRADES, outdoor: OUTDOOR, repair: REPAIR, booking: BOOKING,
};

const BY_INDUSTRY: Record<string, QuickAction[]> = {
  real_estate: [
    { label: 'Browse Listings', icon: Home, prompt: 'Show me your active listings.' },
    { label: 'My Showings', icon: Calendar, prompt: 'What showings do I have scheduled?' },
    { label: 'Schedule Showing', icon: Clock, prompt: 'I would like to schedule a showing.' },
    { label: 'Contact My Agent', icon: MessageCircle, prompt: 'Please connect me with my agent.' },
  ],
  beauty_wellness: [
    { label: 'Book Appointment', icon: Calendar, prompt: 'I would like to book an appointment.' },
    { label: 'My Stylist', icon: Sparkles, prompt: 'Show me my stylist and past services.' },
    { label: 'Service Menu', icon: FileText, prompt: 'What services do you offer?' },
    { label: 'Reschedule', icon: Clock, prompt: 'I need to reschedule.' },
  ],
  restaurants: [
    { label: 'Get Booking Link', icon: Calendar, prompt: 'Send me the link to book a table.' },
    { label: 'Menu Link', icon: UtensilsCrossed, prompt: 'Send me the menu link.' },
    { label: 'Hours & Location', icon: Clock, prompt: 'What are your hours and where are you located?' },
    { label: 'Catering / Private Events', icon: MessageCircle, prompt: 'I have a catering or private event question.' },
  ],
  personal_assistant: [
    { label: 'New Request', icon: MessageCircle, prompt: 'I have a new task to request.' },
    { label: 'My Tasks', icon: FileText, prompt: 'Show me my open tasks.' },
    { label: 'Schedule Time', icon: Calendar, prompt: 'I need to schedule time with my assistant.' },
    { label: 'My Invoices', icon: Receipt, prompt: 'Show me my invoices.' },
  ],
};

interface Props {
  companyId: string | null;
  onAction: (prompt: string) => void;
}

export function PortalQuickActions({ companyId, onAction }: Props) {
  const { pack, loading } = useIndustryPack(companyId);
  if (loading || !pack) return null;
  const actions = BY_INDUSTRY[pack.industry_id] ?? BY_CLUSTER[pack.cluster] ?? BOOKING;

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 px-4 pt-4">
      {actions.map((a) => {
        const Icon = a.icon;
        return (
          <Card
            key={a.label}
            onClick={() => onAction(a.prompt)}
            className="p-3 flex flex-col items-center text-center gap-1.5 cursor-pointer
                       hover:border-primary/50 hover:bg-primary/5 transition-all"
          >
            <Icon className="h-5 w-5 text-primary" />
            <span className="text-xs font-medium text-foreground leading-tight">{a.label}</span>
          </Card>
        );
      })}
    </div>
  );
}
