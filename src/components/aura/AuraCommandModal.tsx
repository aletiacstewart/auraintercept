import { useEffect } from 'react';
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import { 
  Sparkles, 
  TrendingUp, 
  DollarSign, 
  Users, 
  BarChart3, 
  Target,
  Clock 
} from 'lucide-react';

interface AuraCommandModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  query: string;
  onQueryChange: (query: string) => void;
  onSubmit: (query: string) => void;
}

const QUICK_SUGGESTIONS = [
  { 
    id: 'revenue', 
    label: 'What is my total revenue this month?', 
    icon: DollarSign,
    category: 'Revenue' 
  },
  { 
    id: 'forecast', 
    label: 'What is my projected revenue next month?', 
    icon: TrendingUp,
    category: 'Forecast' 
  },
  { 
    id: 'performance', 
    label: 'Who are my top performing team members?', 
    icon: Users,
    category: 'Performance' 
  },
  { 
    id: 'kpi', 
    label: 'Show me my key performance metrics', 
    icon: Target,
    category: 'KPIs' 
  },
  { 
    id: 'comparison', 
    label: 'Compare this month to last month', 
    icon: BarChart3,
    category: 'Comparison' 
  },
  { 
    id: 'trends', 
    label: 'What trends should I be aware of?', 
    icon: Clock,
    category: 'Insights' 
  },
];

export function AuraCommandModal({
  open,
  onOpenChange,
  query,
  onQueryChange,
  onSubmit,
}: AuraCommandModalProps) {
  // Handle Enter key to submit custom query
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Enter' && open && query.trim()) {
        e.preventDefault();
        onSubmit(query);
      }
    };
    
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [open, query, onSubmit]);

  return (
    <CommandDialog open={open} onOpenChange={onOpenChange}>
      <div className="flex items-center gap-2 px-3 border-b border-border">
        <Sparkles className="h-5 w-5 text-primary" />
        <CommandInput 
          placeholder="Ask Aura anything about your data..."
          value={query}
          onValueChange={onQueryChange}
        />
      </div>
      <CommandList>
        <CommandEmpty>
          {query.trim() ? (
            <div className="py-6 text-center">
              <p className="text-sm text-muted-foreground">Press Enter to ask Aura:</p>
              <p className="text-sm font-medium mt-1">"{query}"</p>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">Start typing to ask Aura...</p>
          )}
        </CommandEmpty>
        
        <CommandGroup heading="Quick Questions">
          {QUICK_SUGGESTIONS.map((suggestion) => {
            const Icon = suggestion.icon;
            return (
              <CommandItem
                key={suggestion.id}
                onSelect={() => onSubmit(suggestion.label)}
                className="flex items-center gap-3 py-3"
              >
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
                  <Icon className="h-4 w-4 text-primary" />
                </div>
                <div className="flex flex-col">
                  <span className="text-sm">{suggestion.label}</span>
                  <span className="text-xs text-muted-foreground">{suggestion.category}</span>
                </div>
              </CommandItem>
            );
          })}
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  );
}
