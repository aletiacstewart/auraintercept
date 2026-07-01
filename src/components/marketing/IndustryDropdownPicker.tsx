import { useEffect, useState } from 'react';
import {
  Select, SelectContent, SelectGroup, SelectItem,
  SelectSeparator, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { INDUSTRY_CONTENT } from '@/lib/industryMarketingContent';
import {
  MAIN_INDUSTRY_CATEGORIES,
  findMainCategoryByPack,
  findMainCategoryByName,
  getSubTypesForMainCategory,
} from '@/lib/mainIndustryCategories';

interface IndustryDropdownPickerProps {
  value: string;
  /** Emits the parent main-category demoPack id (always). */
  onChange: (id: string) => void;
  /** Optional: receives (null, categoryName) — sub-types are display-only. */
  onBusinessTypeChange?: (businessTypeKey: string | null, categoryName: string) => void;
}

/**
 * Value = main category name (unique). Multiple main categories may share a
 * demoPack, so we key on the name. Sub-types are rendered as read-only text
 * beneath each main category and are not selectable.
 */
function encodeMain(name: string) { return `cat::${name}`; }
function decodeMain(v: string): { categoryName: string | null; pack: string } {
  if (v.startsWith('cat::')) {
    const name = v.slice(5);
    const cat = findMainCategoryByName(name);
    return { categoryName: name, pack: cat?.demoPack || 'default' };
  }
  const cat = findMainCategoryByPack(v);
  return { categoryName: cat?.name || null, pack: v };
}
function encodeFromPack(packId: string): string {
  const cat = findMainCategoryByPack(packId);
  return cat ? encodeMain(cat.name) : encodeMain('');
}

export function IndustryDropdownPicker({ value, onChange, onBusinessTypeChange }: IndustryDropdownPickerProps) {
  const [internal, setInternal] = useState<string>(() => encodeFromPack(value || 'default'));

  useEffect(() => {
    const cur = decodeMain(internal);
    if (cur.pack !== value) setInternal(encodeFromPack(value || 'default'));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  const decoded = decodeMain(internal);
  const currentCategory = decoded.categoryName
    ? findMainCategoryByName(decoded.categoryName)
    : findMainCategoryByPack(decoded.pack);
  const currentPack = INDUSTRY_CONTENT[decoded.pack] || INDUSTRY_CONTENT.default;
  const triggerLabel = currentCategory?.name || currentPack.label;

  const handleChange = (next: string) => {
    setInternal(next);
    const d = decodeMain(next);
    onChange(d.pack);
    if (onBusinessTypeChange) {
      onBusinessTypeChange(null, d.categoryName || '');
    }
  };

  return (
    <Select value={internal} onValueChange={handleChange}>
      <SelectTrigger className="w-full sm:w-[320px] h-11 bg-card border-border/60 text-base">
        <SelectValue>
          <span className="flex items-center gap-2">
            <span className="text-lg leading-none">{currentPack.emoji}</span>
            <span className="font-medium truncate">{triggerLabel}</span>
          </span>
        </SelectValue>
      </SelectTrigger>
      <SelectContent className="max-h-[60vh] w-[360px]">
        {MAIN_INDUSTRY_CATEGORIES.map((cat, idx) => {
          const Icon = cat.icon;
          const subs = getSubTypesForMainCategory(cat);
          return (
            <SelectGroup key={cat.name}>
              {idx > 0 && <SelectSeparator />}
              <SelectItem value={encodeMain(cat.name)} className="text-sm py-2">
                <span className="flex items-center gap-2">
                  <Icon className="w-3.5 h-3.5 text-primary flex-shrink-0" />
                  <span className="font-semibold text-primary">{cat.name}</span>
                </span>
              </SelectItem>
              {subs.map((b) => (
                <div
                  key={`${cat.name}:${b.key}`}
                  className="pl-9 pr-2 py-1 text-xs text-muted-foreground pointer-events-none select-none"
                >
                  {b.label}
                </div>
              ))}
            </SelectGroup>
          );
        })}
      </SelectContent>
    </Select>
  );
}