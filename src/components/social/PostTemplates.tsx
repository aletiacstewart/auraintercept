import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  FileText, 
  Megaphone, 
  PartyPopper, 
  Wrench, 
  Star, 
  Sparkles,
  CheckCircle,
  Clock
} from 'lucide-react';

interface PostTemplate {
  id: string;
  name: string;
  icon: React.ComponentType<{ className?: string }>;
  description: string;
  template: string;
  category: 'promotional' | 'job-completion' | 'seasonal' | 'educational' | 'review';
}

const TEMPLATES: PostTemplate[] = [
  {
    id: 'seasonal-special',
    name: 'Seasonal Special',
    icon: PartyPopper,
    description: 'Promote seasonal offers and limited-time deals',
    template: "🌟 [Season] Special! [Discount]% off [Service] this [month]! \n\nDon't wait until it's too late - schedule your [service type] today and save big! Limited spots available.\n\n📞 Call us or book online!",
    category: 'promotional',
  },
  {
    id: 'job-complete',
    name: 'Job Completion',
    icon: CheckCircle,
    description: 'Showcase completed work with before/after',
    template: "✅ Another satisfied customer!\n\nJust completed a [service type] for a wonderful family in [area]. They were thrilled with the results!\n\n🔧 Quality work, fair prices, happy customers.\n\n#LocalBusiness #QualityService",
    category: 'job-completion',
  },
  {
    id: 'maintenance-reminder',
    name: 'Maintenance Reminder',
    icon: Wrench,
    description: 'Remind customers about regular maintenance',
    template: "⏰ Is your [equipment] ready for [season]?\n\nRegular maintenance prevents costly breakdowns and extends equipment life. Don't wait for problems to start!\n\n📅 Schedule your maintenance check today and enjoy peace of mind.",
    category: 'educational',
  },
  {
    id: 'review-request',
    name: 'Happy Customer',
    icon: Star,
    description: 'Share positive customer feedback',
    template: "⭐⭐⭐⭐⭐\n\n\"[Customer quote about excellent service]\"\n\nThank you to our amazing customers for trusting us with your [service type] needs!\n\nYour satisfaction is our top priority. 💙",
    category: 'review',
  },
  {
    id: 'quick-tip',
    name: 'Quick Tip',
    icon: FileText,
    description: 'Share helpful tips and advice',
    template: "💡 Pro Tip!\n\n[Helpful tip about maintenance or service]\n\nSmall steps can lead to big savings! Have questions? Our team is here to help.\n\n#ProTips #HomeCare",
    category: 'educational',
  },
  {
    id: 'limited-offer',
    name: 'Limited Time Offer',
    icon: Clock,
    description: 'Create urgency with time-sensitive deals',
    template: "🚨 LIMITED TIME OFFER!\n\n[Offer details] - Only [X] spots left this week!\n\n✓ [Benefit 1]\n✓ [Benefit 2]\n✓ [Benefit 3]\n\n📞 Call now before spots fill up!",
    category: 'promotional',
  },
  {
    id: 'new-service',
    name: 'New Service Announcement',
    icon: Megaphone,
    description: 'Announce new services or capabilities',
    template: "🎉 Exciting News!\n\nWe're now offering [new service]!\n\nOur team has expanded to bring you even better service options. Ask us about [service] today!\n\n#NewServices #GrowingBusiness",
    category: 'promotional',
  },
  {
    id: 'ai-generated',
    name: 'AI Generated',
    icon: Sparkles,
    description: 'Let AI create unique content for you',
    template: '',
    category: 'promotional',
  },
];

interface PostTemplatesProps {
  onSelect: (template: string) => void;
  onClose: () => void;
}

export const PostTemplates: React.FC<PostTemplatesProps> = ({ onSelect, onClose }) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  const categories = [
    { id: 'all', label: 'All' },
    { id: 'promotional', label: 'Promotional' },
    { id: 'job-completion', label: 'Job Completion' },
    { id: 'educational', label: 'Tips & Education' },
    { id: 'review', label: 'Reviews' },
  ];

  const filteredTemplates = selectedCategory === 'all' 
    ? TEMPLATES 
    : TEMPLATES.filter(t => t.category === selectedCategory);

  return (
    <div className="space-y-4">
      {/* Category Filter */}
      <div className="flex flex-wrap gap-2">
        {categories.map(cat => (
          <Button
            key={cat.id}
            variant={selectedCategory === cat.id ? 'default' : 'outline'}
            size="sm"
            onClick={() => setSelectedCategory(cat.id)}
            className="text-xs"
          >
            {cat.label}
          </Button>
        ))}
      </div>

      {/* Templates Grid */}
      <ScrollArea className="h-[300px]">
        <div className="grid grid-cols-1 gap-2 pr-4">
          {filteredTemplates.map(template => {
            const Icon = template.icon;
            return (
              <Card
                key={template.id}
                className="p-3 cursor-pointer hover:bg-muted/50 transition-colors border-card-foreground/10"
                onClick={() => {
                  if (template.id === 'ai-generated') {
                    onSelect('');
                  } else {
                    onSelect(template.template);
                  }
                  onClose();
                }}
              >
                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-lg bg-primary/10">
                    <Icon className="h-4 w-4 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="text-sm font-medium text-card-foreground">{template.name}</h4>
                    <p className="text-xs text-muted-foreground line-clamp-2">{template.description}</p>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      </ScrollArea>

      <Button variant="outline" onClick={onClose} className="w-full">
        Cancel
      </Button>
    </div>
  );
};
