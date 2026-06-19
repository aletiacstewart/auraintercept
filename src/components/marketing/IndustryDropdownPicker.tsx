import { useMemo, useState } from 'react';
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { INDUSTRY_CONTENT } from '@/lib/industryMarketingContent';
import { BUSINESS_TYPE_GROUPS, getPackIdForBusinessType, BUSINESS_TYPES } from '@/lib/businessTypeRegistry';
import { Search } from 'lucide-react';

interface IndustryDropdownPickerProps {
  value: string;
  onChange: (id: string) => void;
}

export function IndustryDropdownPicker({ value, onChange }: IndustryDropdownPickerProps) {
  const [search, setSearch] = useState('');
  const lookupKey = useMemo(
    () => BUSINESS_TYPES.find((b) => b.key === value || b.packId === value)?.key ?? value,
    [value],
  );
  const currentEntry = BUSINESS_TYPES.find((b) => b.key === lookupKey);
  const currentPack = INDUSTRY_CONTENT[getPackIdForBusinessType(lookupKey)] || INDUSTRY_CONTENT.default;
  const filteredGroups = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return BUSINESS_TYPE_GROUPS;
    return BUSINESS_TYPE_GROUPS.map((g) => ({
      ...g,
      items: g.items.filter(
        (b) => b.label.toLowerCase().includes(q) || b.category.toLowerCase().includes(q),
      ),
    })).filter((g) => g.items.length > 0);
  }, [search]);
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger className="w-full sm:w-[320px] h-11 bg-card border-border/60 text-base">
        <SelectValue>
          <span className="flex items-center gap-2">
            <span className="text-lg leading-none">{currentPack.emoji}</span>
            <span className="font-medium truncate">{currentEntry?.label || currentPack.label}</span>
          </span>
        </SelectValue>
      </SelectTrigger>
      <SelectContent className="max-h-[60vh] w-[340px]">
        <div className="sticky top-0 z-10 bg-popover border-b border-border/40 p-2">
          <div className="relative">
            <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
            <Input
              placeholder="Search 185+ business types…"
              className="h-8 pl-7 text-xs"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => e.stopPropagation()}
            />
          </div>
        </div>
        {filteredGroups.map((g) => (
          <SelectGroup key={g.category}>
            <SelectLabel className="flex items-center gap-1.5 text-primary font-bold uppercase tracking-wider text-[10px] underline underline-offset-4 decoration-primary/60 py-1.5">
              <span>{g.emoji}</span>
              <span>{g.category}</span>
              <span className="ml-auto text-muted-foreground/70 normal-case font-normal">{g.items.length}</span>
            </SelectLabel>
            {g.items.map((b) => (
              <SelectItem key={b.key} value={b.key} className="text-xs">
                {b.label}
              </SelectItem>
            ))}
          </SelectGroup>
        ))}
        {filteredGroups.length === 0 && (
          <div className="p-3 text-xs text-muted-foreground text-center">No business types match "{search}"</div>
        )}
      </SelectContent>
    </Select>
  );
}