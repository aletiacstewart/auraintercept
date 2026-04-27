import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from '@/components/ui/select';
import { INDUSTRY_CONTENT, INDUSTRY_GROUPS } from '@/lib/industryMarketingContent';

interface IndustryDropdownPickerProps {
  value: string;
  onChange: (id: string) => void;
}

export function IndustryDropdownPicker({ value, onChange }: IndustryDropdownPickerProps) {
  const current = INDUSTRY_CONTENT[value] || INDUSTRY_CONTENT.other;
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger className="w-full sm:w-[320px] h-11 bg-card border-border/60 text-base">
        <SelectValue>
          <span className="flex items-center gap-2">
            <span className="text-lg leading-none">{current.emoji}</span>
            <span className="font-medium">{current.label}</span>
          </span>
        </SelectValue>
      </SelectTrigger>
      <SelectContent className="max-h-[60vh]">
        {INDUSTRY_GROUPS.map((g) => (
          <SelectGroup key={g.group}>
            <SelectLabel className="flex items-center gap-1.5 text-primary font-bold uppercase tracking-wider text-xs underline underline-offset-4 decoration-primary/60 py-1.5">
              <span>{g.emoji}</span>
              <span>{g.group}</span>
            </SelectLabel>
            {g.ids.map((id) => {
              const ind = INDUSTRY_CONTENT[id];
              if (!ind) return null;
              return (
                <SelectItem key={id} value={id}>
                  <span className="flex items-center gap-2">
                    <span>{ind.emoji}</span>
                    <span>{ind.label}</span>
                  </span>
                </SelectItem>
              );
            })}
          </SelectGroup>
        ))}
      </SelectContent>
    </Select>
  );
}