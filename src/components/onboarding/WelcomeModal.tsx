import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Sparkles, 
  Settings, 
  Phone, 
  Bot, 
  Calendar, 
  ClipboardCheck, 
  Navigation, 
  MessageSquare,
  ChevronRight,
  Rocket
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useIndustryPack } from '@/hooks/useIndustryPack';

interface WelcomeModalProps {
  isOpen: boolean;
  onClose: () => void;
  userRole: string | null;
  userName?: string;
  companyName?: string;
  jobTypes?: string[];
}

interface ActionItem {
  icon: React.ElementType;
  title: string;
  description: string;
  link?: string;
  primary?: boolean;
}

export function WelcomeModal({ 
  isOpen, 
  onClose, 
  userRole, 
  userName,
  companyName,
  jobTypes = []
}: WelcomeModalProps) {
  const navigate = useNavigate();
  const [isClosing, setIsClosing] = useState(false);
  const isTechnician = jobTypes.includes('technician');
  const { pack } = useIndustryPack();
  const jobNoun = (pack.terminology?.job as string) || 'Job';
  const apptNoun = (pack.terminology?.appointment as string) || 'Appointment';

  const handleClose = () => {
    setIsClosing(true);
    setTimeout(() => {
      onClose();
      setIsClosing(false);
    }, 200);
  };

  const handleAction = (link?: string) => {
    handleClose();
    if (link) {
      navigate(link);
    }
  };

  // Content based on user role
  const getContent = () => {
    if (isTechnician) {
      return {
        title: `Welcome to ${companyName || 'Your Team'}!`,
        subtitle: "Your mobile job center",
        description: `Everything you need for your day is right here. Accept ${jobNoun.toLowerCase()}s, navigate to customers, and update status\u2014all in one place.`,
        actions: [
          {
            icon: ClipboardCheck,
            title: `View Today\u2019s ${jobNoun}s`,
            description: `See assigned ${jobNoun.toLowerCase()}s and accept work`,
            link: '/technician/jobs',
            primary: true
          },
          {
            icon: Navigation,
            title: "One-Tap Navigation",
            description: "Get directions to any job instantly",
          },
          {
            icon: MessageSquare,
            title: "AI Assistant",
            description: "Ask questions about jobs or procedures",
            link: '/technician/assistant'
          }
        ],
        tips: [
          "Tap a job card to see full details",
          "Use 'Check In' when you arrive at a site",
          "The AI Assistant can help with troubleshooting"
        ]
      };
    }

    if (userRole === 'company_admin' || userRole === 'platform_admin') {
      return {
        title: `Welcome${userName ? `, ${userName}` : ''}!`,
        subtitle: "Your AI Command Center",
        description: "This is your hub for managing operations, AI agents, and team performance. Let's get you set up for success.",
        actions: [
          {
            icon: Settings,
            title: "Complete Setup",
            description: "Configure hours, services & integrations",
            link: '/dashboard/quick-setup',
            primary: true
          },
          {
            icon: Bot,
            title: "Configure AI Agents",
            description: "Activate your AI workforce",
            link: '/dashboard/ai-operatives-hub'
          },
          {
            icon: Phone,
            title: "Test Voice AI",
            description: "Make a test call to hear your AI",
            link: '/dashboard/settings?tab=voice'
          }
        ],
        tips: [
          "Complete the setup checklist to unlock all features",
          "AI Agents work 24/7 once activated",
          "Check Analytics for real-time performance data"
        ]
      };
    }

    // Employee (non-technician)
    return {
      title: `Welcome to ${companyName || 'the Team'}!`,
      subtitle: "Your workspace is ready",
      description: `Access your schedule, manage ${jobNoun.toLowerCase()}s, and collaborate with your team from one central dashboard.`,
      actions: [
        {
          icon: Calendar,
          title: "View Your Schedule",
          description: `See upcoming ${apptNoun.toLowerCase()}s & ${jobNoun.toLowerCase()}s`,
          link: '/dashboard/appointments',
          primary: true
        },
        {
          icon: MessageSquare,
          title: "AI Assistant",
          description: "Get help anytime",
          link: '/dashboard/ai-operatives-hub'
        }
      ],
      tips: [
        "Quick Actions give you one-click access to common tasks",
        "Your role determines which features you can access",
        "Check with your admin if you need additional permissions"
      ]
    };
  };

  const content = getContent();

  return (
    <Dialog open={isOpen && !isClosing} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="sm:max-w-lg p-0 overflow-hidden bg-background border-border">
        <AnimatePresence mode="wait">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
          >
            {/* Header with gradient */}
            <div className="relative bg-gradient-to-br from-primary/10 via-primary/5 to-transparent p-6 pb-4">
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.1, type: "spring", stiffness: 200 }}
                className="absolute top-4 right-4"
              >
                <Sparkles className="h-8 w-8 text-primary/40" />
              </motion.div>
              
              <DialogHeader className="text-left">
                <Badge variant="secondary" className="w-fit mb-2">
                  <Rocket className="h-3 w-3 mr-1" />
                  Getting Started
                </Badge>
                <DialogTitle className="text-2xl font-bold">
                  {content.title}
                </DialogTitle>
                <DialogDescription className="text-base text-muted-foreground">
                  <span className="font-medium text-foreground">{content.subtitle}</span>
                  <br />
                  {content.description}
                </DialogDescription>
              </DialogHeader>
            </div>

            {/* Action Cards */}
            <div className="p-6 pt-2 space-y-3">
              {content.actions.map((action, index) => (
                <motion.button
                  key={action.title}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.2 + index * 0.1 }}
                  onClick={() => handleAction(action.link)}
                  className={`w-full flex items-center gap-4 p-4 rounded-lg border transition-all duration-200 text-left group ${
                    action.primary 
                      ? 'bg-primary/5 border-primary/20 hover:bg-primary/10 hover:border-primary/30' 
                      : 'bg-muted/30 border-border hover:bg-muted/50'
                  }`}
                >
                  <div className={`p-2 rounded-lg ${
                    action.primary ? 'bg-primary/10' : 'bg-muted'
                  }`}>
                    <action.icon className={`h-5 w-5 ${
                      action.primary ? 'text-primary' : 'text-muted-foreground'
                    }`} />
                  </div>
                  <div className="flex-1">
                    <p className={`font-medium ${
                      action.primary ? 'text-primary' : 'text-foreground'
                    }`}>
                      {action.title}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {action.description}
                    </p>
                  </div>
                  <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:text-foreground transition-colors" />
                </motion.button>
              ))}
            </div>

            {/* Tips Section */}
            <div className="px-6 pb-4">
              <div className="bg-muted/30 rounded-lg p-4">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">
                  Quick Tips
                </p>
                <ul className="space-y-1">
                  {content.tips.map((tip, index) => (
                    <li key={index} className="text-sm text-muted-foreground flex items-start gap-2">
                      <span className="text-primary mt-1">•</span>
                      {tip}
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Footer */}
            <div className="px-6 pb-6 flex justify-between items-center">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleClose}
                className="text-muted-foreground"
              >
                Skip for now
              </Button>
              <Button onClick={handleClose}>
                Get Started
                <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </div>
          </motion.div>
        </AnimatePresence>
      </DialogContent>
    </Dialog>
  );
}
