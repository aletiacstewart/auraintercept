import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { INDUSTRY_CONTENT } from '@/lib/industryMarketingContent';
import { MAIN_INDUSTRY_CATEGORIES, findMainCategoryByPack } from '@/lib/mainIndustryCategories';

interface IndustryDropdownPickerProps {
  value: string;
  onChange: (id: string) => void;
}

export function IndustryDropdownPicker({ value, onChange }: IndustryDropdownPickerProps) {
  const currentCategory = findMainCategoryByPack(value);
  const currentPack = INDUSTRY_CONTENT[value] || INDUSTRY_CONTENT.default;
  const triggerLabel = currentCategory?.name || currentPack.label;
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger className="w-full sm:w-[320px] h-11 bg-card border-border/60 text-base">
        <SelectValue>
          <span className="flex items-center gap-2">
            <span className="text-lg leading-none">{currentPack.emoji}</span>
            <span className="font-medium truncate">{triggerLabel}</span>
          </span>
        </SelectValue>
      </SelectTrigger>
      <SelectContent className="max-h-[60vh] w-[340px]">
        {MAIN_INDUSTRY_CATEGORIES.map((cat) => {
          const Icon = cat.icon;
          return (
            <SelectItem key={cat.demoPack + cat.name} value={cat.demoPack} className="text-sm">
              <span className="flex items-center gap-2">
                <Icon className="w-4 h-4 text-primary flex-shrink-0" />
                <span className="font-medium">{cat.name}</span>
              </span>
            </SelectItem>
          );
        })}
      </SelectContent>
    </Select>
  );
}