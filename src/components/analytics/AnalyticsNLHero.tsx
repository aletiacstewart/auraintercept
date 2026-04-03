import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { BarChart3, Send, TrendingUp, DollarSign, Users, Sparkles } from 'lucide-react';

interface AnalyticsNLHeroProps {
  onSubmit: (query: string) => void;
  isLoading?: boolean;
}

const SAMPLE_QUERIES = [
  { label: 'Revenue this month', icon: DollarSign, query: 'Show me revenue analysis for this month with trends' },
  { label: 'Top performing agents', icon: TrendingUp, query: 'Which AI agents are performing best? Show success rates and response times' },
  { label: 'Customer insights', icon: Users, query: 'Give me customer insights — retention, satisfaction, and growth trends' },
  { label: 'Business forecast', icon: Sparkles, query: 'Forecast next month demand and capacity needs based on current trends' },
];

export const AnalyticsNLHero: React.FC<AnalyticsNLHeroProps> = ({ onSubmit, isLoading }) => {
  const [query, setQuery] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim() || isLoading) return;
    onSubmit(query.trim());
    setQuery('');
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Hero section */}
      <div className="text-center space-y-2 pt-4">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-primary/10 mb-2">
          <BarChart3 className="h-6 w-6 text-primary" />
        </div>
        <h2 className="text-xl font-semibold text-foreground">Ask about your business</h2>
        <p className="text-sm text-muted-foreground max-w-md mx-auto">
          Ask any question about revenue, performance, customers, or forecasts — Aura will analyze your data and respond.
        </p>
      </div>

      {/* NL Input */}
      <form onSubmit={handleSubmit} className="max-w-2xl mx-auto space-y-3">
        <div className="relative">
          <Textarea
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="e.g. How did revenue compare to last month? Which services are growing fastest?"
            className="min-h-[80px] resize-none pr-12 bg-card border-border/60 focus:border-primary/50 text-sm"
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSubmit(e);
              }
            }}
          />
          <Button
            type="submit"
            size="icon"
            disabled={!query.trim() || isLoading}
            className="absolute bottom-2 right-2 h-8 w-8"
          >
            <Send className="h-3.5 w-3.5" />
          </Button>
        </div>
      </form>

      {/* Sample queries */}
      <div className="max-w-2xl mx-auto">
        <p className="text-xs text-muted-foreground mb-2 text-center">Try one of these:</p>
        <div className="grid grid-cols-2 gap-2">
          {SAMPLE_QUERIES.map((sq) => (
            <button
              key={sq.label}
              onClick={() => onSubmit(sq.query)}
              disabled={isLoading}
              className="flex items-center gap-2 p-2.5 rounded-lg border border-border/50 bg-card/50 hover:border-primary/40 hover:bg-card transition-all text-left group"
            >
              <sq.icon className="h-4 w-4 text-primary shrink-0" />
              <span className="text-xs font-medium text-foreground group-hover:text-primary transition-colors">{sq.label}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
