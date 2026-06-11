import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { INDUSTRY_LIST } from '@/lib/industryMarketingContent';
import { filterVisibleIndustries } from '@/lib/industryVisibility';

interface IndustrySelectorProps {
  selected: string;
  onChange: (id: string) => void;
}

export function IndustrySelector({ selected, onChange }: IndustrySelectorProps) {
  const industries = filterVisibleIndustries(INDUSTRY_LIST);
  return (
    <div className="sticky top-[64px] z-40 bg-background/95 backdrop-blur border-b border-border/40 py-3">
      <div className="container max-w-7xl mx-auto px-4">
        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          <span className="text-sm font-medium text-muted-foreground whitespace-nowrap mr-2">
            I'm a:
          </span>
          {industries.map((ind) => (
            <Button
              key={ind.id}
              variant={selected === ind.id ? 'default' : 'outline'}
              size="sm"
              onClick={() => onChange(ind.id)}
              className={cn(
                'whitespace-nowrap',
                selected === ind.id && 'shadow-md'
              )}
            >
              <span className="mr-1.5">{ind.emoji}</span>
              {ind.label}
            </Button>
          ))}
        </div>
      </div>
    </div>
  );
}
