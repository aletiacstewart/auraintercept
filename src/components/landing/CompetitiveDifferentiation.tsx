import { Card, CardContent } from '@/components/ui/card';
import { Check, X, MessageSquare, Users, Bot, Phone, Calendar, TrendingUp, Clock, Zap } from 'lucide-react';

interface ComparisonRow {
  feature: string;
  traditional: string | boolean;
  aura: string | boolean;
}

interface ComparisonCategory {
  title: string;
  subtitle: string;
  icon: React.ReactNode;
  iconBg: string;
  comparisons: ComparisonRow[];
}

const categories: ComparisonCategory[] = [
  {
    title: 'Chatbot',
    subtitle: 'vs Aura Intercept',
    icon: <MessageSquare className="w-5 h-5" />,
    iconBg: 'bg-slate-500/20 text-slate-400',
    comparisons: [
      { feature: '24/7 Voice Answering', traditional: false, aura: true },
      { feature: 'Books Appointments Directly', traditional: false, aura: true },
      { feature: 'Multi-Agent Handoffs', traditional: false, aura: true },
      { feature: 'Understands Context', traditional: 'Scripted only', aura: 'Natural conversation' },
      { feature: 'Outbound Follow-ups', traditional: false, aura: true },
    ],
  },
  {
    title: 'Admin Staff',
    subtitle: 'vs Aura Intercept',
    icon: <Users className="w-5 h-5" />,
    iconBg: 'bg-amber-500/20 text-amber-400',
    comparisons: [
      { feature: 'Works 24/7/365', traditional: false, aura: true },
      { feature: 'Never Calls in Sick', traditional: false, aura: true },
      { feature: 'Handles Unlimited Calls', traditional: false, aura: true },
      { feature: 'Monthly Cost', traditional: '$3,500-$5,000', aura: 'From $497 (Launch Pricing)' },
      { feature: 'Training Required', traditional: 'Weeks/months', aura: 'Instant' },
    ],
  },
  {
    title: 'Generic CRM',
    subtitle: 'vs Aura Intercept',
    icon: <Bot className="w-5 h-5" />,
    iconBg: 'bg-purple-500/20 text-purple-400',
    comparisons: [
      { feature: 'AI Voice Answering', traditional: 'Voicemail', aura: 'True AI' },
      { feature: 'Specialized Agents', traditional: 'Basic automation', aura: '24 operatives' },
      { feature: 'Social Media Included', traditional: 'Extra cost', aura: 'Manual Bridge + Own API' },
      { feature: 'Smart Agent Handoffs', traditional: 'Siloed features', aura: true },
      { feature: 'Purpose-Built for Service', traditional: 'Generic', aura: true },
    ],
  },
];

const renderValue = (value: string | boolean, isAura: boolean) => {
  if (typeof value === 'boolean') {
    return value ? (
      <div className={`flex items-center gap-1.5 ${isAura ? 'text-emerald-400' : 'text-red-400'}`}>
        {value ? <Check className="w-4 h-4" /> : <X className="w-4 h-4" />}
        <span className="text-xs">{value ? 'Yes' : 'No'}</span>
      </div>
    ) : (
      <div className="flex items-center gap-1.5 text-red-400">
        <X className="w-4 h-4" />
        <span className="text-xs">No</span>
      </div>
    );
  }
  return (
    <span className={`text-xs ${isAura ? 'text-emerald-400 font-medium' : 'text-muted-foreground'}`}>
      {value}
    </span>
  );
};

export const CompetitiveDifferentiation = () => {
  return (
    <section className="py-16 md:py-24">
      <div className="container mx-auto px-4">
        {/* Section Header */}
        <div className="text-center mb-12">
          <p className="text-secondary font-medium mb-2 tracking-wide uppercase text-sm">
            Not Just Another Tool
          </p>
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            This Is <span className="gradient-text">Not a Chatbot</span>
          </h2>
          <p className="text-white max-w-2xl mx-auto">
            See how Aura Intercept's 24 Smart AI Agents compare to what you're using now.
          </p>
        </div>

        {/* Comparison Cards */}
        <div className="grid md:grid-cols-3 gap-6 max-w-6xl mx-auto">
          {categories.map((category) => (
            <Card key={category.title} className="dark-card-surface hover:shadow-lg transition-all duration-300 hover:border-primary/30">
              <CardContent className="p-5">
                {/* Card Header */}
                <div className="flex items-center gap-3 mb-4">
                  <div className={`p-2 rounded-lg ${category.iconBg}`}>
                    {category.icon}
                  </div>
                  <div>
                    <h3 className={`font-bold text-lg ${category.iconBg.split(' ').find(c => c.startsWith('text-')) ?? 'text-white'}`}>{category.title}</h3>
                    <p className="text-xs text-white">{category.subtitle}</p>
                  </div>
                </div>

                {/* Comparison Table */}
                <div className="space-y-0">
                  {/* Header Row */}
                  <div className="grid grid-cols-3 gap-2 pb-2 border-b border-border/50 mb-2">
                    <div className="text-xs font-medium text-white">Feature</div>
                    <div className="text-xs font-medium text-center text-white">Traditional</div>
                    <div className="text-xs font-medium text-center text-secondary">Aura</div>
                  </div>

                  {/* Feature Rows */}
                  {category.comparisons.map((row, idx) => (
                    <div 
                      key={row.feature} 
                      className={`grid grid-cols-3 gap-2 py-2 ${idx % 2 === 0 ? 'bg-muted/20' : ''} rounded px-1`}
                    >
                      <div className="text-xs text-white">{row.feature}</div>
                      <div className="flex justify-center">{renderValue(row.traditional, false)}</div>
                      <div className="flex justify-center">{renderValue(row.aura, true)}</div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Bottom Stats */}
        <div className="mt-12 grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto">
          <div className="text-center p-4 rounded-lg bg-muted/30">
            <Phone className="w-6 h-6 text-red-400 mx-auto mb-2" />
            <p className="text-2xl font-bold text-red-400">62%</p>
            <p className="text-xs text-white">Calls go unanswered</p>
          </div>
          <div className="text-center p-4 rounded-lg bg-muted/30">
            <Clock className="w-6 h-6 text-amber-400 mx-auto mb-2" />
            <p className="text-2xl font-bold text-amber-400">78%</p>
            <p className="text-xs text-white">Call competitor in 5 min</p>
          </div>
          <div className="text-center p-4 rounded-lg bg-muted/30">
            <TrendingUp className="w-6 h-6 text-emerald-400 mx-auto mb-2" />
            <p className="text-2xl font-bold text-emerald-400">$4,200</p>
            <p className="text-xs text-white">Avg. customer lifetime value</p>
          </div>
          <div className="text-center p-4 rounded-lg bg-muted/30">
            <Zap className="w-6 h-6 text-secondary mx-auto mb-2" />
            <p className="text-2xl font-bold text-secondary">0 sec</p>
            <p className="text-xs text-white">Aura response time</p>
          </div>
        </div>
      </div>
    </section>
  );
};
