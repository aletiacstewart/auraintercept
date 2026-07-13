import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Quote } from 'lucide-react';

export interface Testimonial {
  id: string;
  quote?: string;
  firstName: string;
  lastInitial: string;
  businessName: string;
  industryRole: string;
  avatarUrl?: string;
  isPlaceholder?: boolean;
}

export const TESTIMONIALS: Testimonial[] = [
  {
    id: 'placeholder-001',
    firstName: 'Aura',
    lastInitial: 'I.',
    businessName: 'Aura Intercept',
    industryRole: 'Field service automation platform',
    isPlaceholder: true,
  },
];

function InitialsAvatar({ firstName, lastInitial }: { firstName: string; lastInitial: string }) {
  const initials = `${firstName.charAt(0)}${lastInitial.charAt(0)}`.toUpperCase();
  return (
    <Avatar className="h-10 w-10 border border-border/60">
      <AvatarFallback className="bg-primary/15 text-primary text-xs font-semibold">
        {initials}
      </AvatarFallback>
    </Avatar>
  );
}

interface TestimonialSectionProps {
  title?: string;
  subtitle?: string;
  testimonials?: Testimonial[];
}

export function TestimonialSection({
  title = 'What early users are saying',
  subtitle = 'Real feedback from business owners using Aura to automate calls, booking, and follow-ups.',
  testimonials = TESTIMONIALS,
}: TestimonialSectionProps) {
  const visible = testimonials.slice(0, 3);

  return (
    <section className="py-10 bg-background">
      <div className="container max-w-6xl mx-auto px-4">
        <div className="text-center mb-6">
          <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-2">
            {title}
          </h2>
          <p className="text-sm text-muted-foreground max-w-2xl mx-auto">
            {subtitle}
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-4">
          {visible.map((t) => (
            <Card
              key={t.id}
              className="border-border/60 bg-card/50 backdrop-blur-sm h-full flex flex-col"
            >
              <CardContent className="p-5 flex flex-col h-full">
                {t.isPlaceholder ? (
                  <div className="flex-1 flex flex-col items-center justify-center text-center py-8">
                    <Badge variant="outline" className="text-[10px]">
                      Early user — case study coming soon
                    </Badge>
                  </div>
                ) : (
                  <>
                    <Quote className="w-5 h-5 text-primary/60 mb-3" />
                    <blockquote className="text-sm text-foreground leading-relaxed flex-1">
                      "{t.quote}"
                    </blockquote>
                  </>
                )}

                <div className="flex items-center gap-3 mt-4 pt-4 border-t border-border/40">
                  {t.avatarUrl ? (
                    <Avatar className="h-10 w-10 border border-border/60">
                      <img
                        src={t.avatarUrl}
                        alt={`${t.firstName} ${t.lastInitial} avatar`}
                        className="aspect-square h-full w-full object-cover"
                      />
                    </Avatar>
                  ) : (
                    <InitialsAvatar firstName={t.firstName} lastInitial={t.lastInitial} />
                  )}
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-foreground truncate">
                      {t.firstName} {t.lastInitial}
                    </p>
                    <p className="text-xs text-muted-foreground truncate">
                      {t.businessName}
                    </p>
                    <p className="text-[10px] text-primary/80 truncate">
                      {t.industryRole}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
