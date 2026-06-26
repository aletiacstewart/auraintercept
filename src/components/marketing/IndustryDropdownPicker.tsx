import { useEffect, useState } from 'react';
import {
  Select, SelectContent, SelectGroup, SelectItem, SelectLabel,
  SelectSeparator, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { INDUSTRY_CONTENT } from '@/lib/industryMarketingContent';
import {
  MAIN_INDUSTRY_CATEGORIES,
  findMainCategoryByPack,
  getSubTypesForMainCategory,
} from '@/lib/mainIndustryCategories';

interface IndustryDropdownPickerProps {
  value: string;
  /** Emits the parent main-category demoPack id (always). */
  onChange: (id: string) => void;
  /** Optional: receives the raw business-type key when a sub-type is picked, else null. */
  onBusinessTypeChange?: (businessTypeKey: string | null, categoryName: string) => void;
}

/**
 * Encode each select item value uniquely while still mapping back to the
 * parent main-category demoPack. Format:
 *   "main:<demoPack>"           — "All <category>" row (parent only)
 *   "sub:<demoPack>::<typeKey>" — a specific sub-business-type
 */
function encodeMain(pack: string) { return `main:${pack}`; }
function encodeSub(pack: string, key: string) { return `sub:${pack}::${key}`; }
function decode(v: string): { pack: string; subKey: string | null } {
  if (v.startsWith('sub:')) {
    const [pack, ...rest] = v.slice(4).split('::');
    return { pack, subKey: rest.join('::') };
  }
  if (v.startsWith('main:')) return { pack: v.slice(5), subKey: null };
  // Backward-compat: treat raw pack id as main selection.
  return { pack: v, subKey: null };
}

export function IndustryDropdownPicker({ value, onChange, onBusinessTypeChange }: IndustryDropdownPickerProps) {
  // Internal value carries either main: or sub: prefix; parent always sees demoPack.
  const [internal, setInternal] = useState<string>(() => encodeMain(value || 'default'));

  // Keep internal in sync when parent changes the pack externally (e.g. query param).
  useEffect(() => {
    const cur = decode(internal);
    if (cur.pack !== value) setInternal(encodeMain(value || 'default'));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  const decoded = decode(internal);
  const currentCategory = findMainCategoryByPack(decoded.pack);
  const currentPack = INDUSTRY_CONTENT[decoded.pack] || INDUSTRY_CONTENT.default;
  const subLabel = decoded.subKey
    ? (currentCategory ? getSubTypesForMainCategory(currentCategory).find((s) => s.key === decoded.subKey)?.label : null)
    : null;
  const triggerLabel = subLabel || currentCategory?.name || currentPack.label;

  const handleChange = (next: string) => {
    setInternal(next);
    const d = decode(next);
    onChange(d.pack);
    if (onBusinessTypeChange) {
      const cat = findMainCategoryByPack(d.pack);
      onBusinessTypeChange(d.subKey, cat?.name || '');
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
              <SelectLabel className="flex items-center gap-2 pt-2">
                <Icon className="w-3.5 h-3.5 text-primary flex-shrink-0" />
                <span className="font-semibold text-primary">{cat.name}</span>
              </SelectLabel>
              <SelectItem value={encodeMain(cat.demoPack)} className="text-sm">
                <span className="font-medium">All {cat.name}</span>
                <span className="text-muted-foreground text-xs ml-1">— see demo</span>
              </SelectItem>
              {subs.map((b) => (
                <SelectItem
                  key={`${cat.name}:${b.key}`}
                  value={encodeSub(cat.demoPack, b.key)}
                  className="text-sm pl-7"
                >
                  {b.label}
                </SelectItem>
              ))}
            </SelectGroup>
          );
        })}
      </SelectContent>
    </Select>
  );
}