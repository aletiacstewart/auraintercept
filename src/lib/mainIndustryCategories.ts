import {
  Flame, Droplet, Zap, Home, TreeDeciduous, Sparkles, HardHat, Shield,
  Refrigerator, Truck, Car, PawPrint, HeartPulse, Hammer, Building2, MapPin,
  Users, Send, FileText, HeartHandshake, Megaphone, Scissors, UtensilsCrossed,
  Briefcase, type LucideIcon,
} from 'lucide-react';
import { BUSINESS_TYPE_GROUPS, type BusinessTypeEntry } from './businessTypeRegistry';

/**
 * Canonical list of main industry categories shown to end users.
 * Single source of truth for:
 *  - Homepage Industries grid (`src/pages/Index.tsx`)
 *  - Live Demo industry picker (`IndustryDropdownPicker`)
 *  - Company SignUp industry dropdown (`src/pages/SignUp.tsx`)
 *
 * `demoPack` is the canonical industry pack id used everywhere downstream
 * (industry_vertical column, useIndustryPack, console context, etc.).
 */
export interface MainIndustryCategory {
  name: string;
  icon: LucideIcon;
  count: number;
  description: string;
  demoPack: string;
  /**
   * Name of the BUSINESS_TYPE_GROUPS category whose 185-type sub-list should
   * be shown under this main category in dropdowns. Leave undefined when
   * the main category has no sub-types in the registry (e.g. Beauty & Salons,
   * Restaurants, Personal Assistants, B2B Pro Services).
   */
  subTypeCategory?: string;
}

export const MAIN_INDUSTRY_CATEGORIES: MainIndustryCategory[] = [
  { name: 'HVAC & Mechanical',           icon: Flame,          count: 6,  description: 'AC, heating, ducts, mechanical',         demoPack: 'hvac',               subTypeCategory: 'HVAC & Mechanical' },
  { name: 'Plumbing',                    icon: Droplet,        count: 7,  description: 'Plumbers, septic, well, drain',          demoPack: 'plumbing',           subTypeCategory: 'Plumbing' },
  { name: 'Electrical',                  icon: Zap,            count: 8,  description: 'Electricians, solar, EV, smart home',    demoPack: 'electrical',         subTypeCategory: 'Electrical' },
  { name: 'Roofing & Exterior',          icon: Home,           count: 12, description: 'Roof, siding, gutters, paint',           demoPack: 'roofing',            subTypeCategory: 'Roofing & Exterior' },
  { name: 'Landscaping & Outdoor',       icon: TreeDeciduous,  count: 13, description: 'Lawn, trees, pool, pest, snow',          demoPack: 'landscape',          subTypeCategory: 'Landscaping & Outdoor' },
  { name: 'Cleaning & Restoration',      icon: Sparkles,       count: 13, description: 'House, carpet, water/fire damage',       demoPack: 'cleaning_restoration', subTypeCategory: 'Cleaning & Restoration' },
  { name: 'Construction & Remodeling',   icon: HardHat,        count: 22, description: 'GC, kitchens, baths, flooring',          demoPack: 'construction',       subTypeCategory: 'Construction & Remodeling' },
  { name: 'Home Inspection & Safety',    icon: Shield,         count: 11, description: 'Inspectors, chimney, locksmith, alarms', demoPack: 'home_inspection',    subTypeCategory: 'Home Inspection & Safety' },
  { name: 'Appliance & Tech Services',   icon: Refrigerator,   count: 8,  description: 'Appliance, computer, TV, WiFi',          demoPack: 'appliance_repair',   subTypeCategory: 'Appliance & Tech Services' },
  { name: 'Moving & Junk Removal',       icon: Truck,          count: 9,  description: 'Movers, junk, towing, waste',            demoPack: 'moving_junk',        subTypeCategory: 'Moving & Junk Removal' },
  { name: 'Auto Services (Mobile)',      icon: Car,            count: 9,  description: 'Detail, glass, oil, mobile mechanic',    demoPack: 'auto_care',          subTypeCategory: 'Auto Services (Mobile)' },
  { name: 'Pet & Animal Services',       icon: PawPrint,       count: 8,  description: 'Groomers, trainers, vets, sitters',      demoPack: 'pet_services',       subTypeCategory: 'Pet & Animal Services' },
  { name: 'Health & Wellness',           icon: HeartPulse,     count: 1,  description: 'In-home massage & therapists',           demoPack: 'health_wellness_inhome', subTypeCategory: 'Health & Wellness (In-Home)' },
  { name: 'Specialty Trades',            icon: Hammer,         count: 13, description: 'Handyman, carpenter, pool, masonry',     demoPack: 'specialty_trades',   subTypeCategory: 'Specialty Trades' },
  { name: 'Utility & Infrastructure',    icon: Building2,      count: 3,  description: 'Propane, water, utility contractors',    demoPack: 'utility_infrastructure', subTypeCategory: 'Utility & Infrastructure' },
  { name: 'Real Estate & Property',      icon: MapPin,         count: 10, description: 'Agents, mortgage, title, mgmt',          demoPack: 'real_estate',        subTypeCategory: 'Real Estate & Property' },
  { name: 'In-Home Personal Services',   icon: Users,          count: 11, description: 'Trainer, tutor, nanny, chef, PA',        demoPack: 'in_home_personal',   subTypeCategory: 'In-Home Personal Services' },
  { name: 'Delivery & On-Site Logistics',icon: Send,           count: 4,  description: 'Furniture, fuel, water delivery',        demoPack: 'delivery_logistics', subTypeCategory: 'Delivery & On-Site Logistics' },
  { name: 'Insurance & Assessment',      icon: FileText,       count: 4,  description: 'Home/auto, adjusters, appraisers',       demoPack: 'insurance_assessment', subTypeCategory: 'Insurance & Assessment' },
  { name: 'Senior & Lifestyle',          icon: HeartHandshake, count: 5,  description: 'Senior move, organize, energy audit',    demoPack: 'senior_lifestyle',   subTypeCategory: 'Senior & Lifestyle Services' },
  { name: 'Event & Temporary',           icon: Megaphone,      count: 6,  description: 'Tents, party, DJ, catering, photo',      demoPack: 'event_temporary',    subTypeCategory: 'Event & Temporary Services' },
  { name: 'Beauty & Salons',             icon: Scissors,       count: 14, description: 'Salons, barbers, spa & nail studios',    demoPack: 'beauty_wellness',      subTypeCategory: 'Beauty & Salons' },
  { name: 'Restaurants & Food Delivery', icon: UtensilsCrossed,count: 13, description: 'Restaurants, cafes, food delivery',      demoPack: 'restaurants',          subTypeCategory: 'Restaurants & Food Delivery' },
  { name: 'Personal Assistants',         icon: HeartHandshake, count: 11, description: 'Personal & executive assistants',      demoPack: 'personal_assistant',   subTypeCategory: 'Personal Assistants' },
  { name: 'B2B Pro Services',            icon: Briefcase,      count: 19, description: 'Consultants & professional services',    demoPack: 'b2b_pro_services',     subTypeCategory: 'B2B Pro Services' },
];

export const MAIN_INDUSTRY_CATEGORY_COUNT = MAIN_INDUSTRY_CATEGORIES.length;

export function findMainCategoryByPack(packId: string | null | undefined): MainIndustryCategory | undefined {
  if (!packId) return undefined;
  return MAIN_INDUSTRY_CATEGORIES.find((c) => c.demoPack === packId);
}

export function findMainCategoryByName(name: string | null | undefined): MainIndustryCategory | undefined {
  if (!name) return undefined;
  return MAIN_INDUSTRY_CATEGORIES.find((c) => c.name === name);
}

/**
 * Sub-business-types listed under a main category, drawn from the
 * 185-entry Business Type Registry. Empty when the main category has
 * no registry-defined sub-types.
 */
export function getSubTypesForMainCategory(cat: MainIndustryCategory): BusinessTypeEntry[] {
  if (!cat.subTypeCategory) return [];
  const grp = BUSINESS_TYPE_GROUPS.find((g) => g.category === cat.subTypeCategory);
  return grp ? grp.items : [];
}

/**
 * Resolve a sub-type key OR a demoPack id to its parent main category.
 * Used by dropdowns so any chosen sub-type still routes to the main
 * category's demo page.
 */
export function resolveMainCategory(input: string | null | undefined): MainIndustryCategory | undefined {
  if (!input) return undefined;
  const direct = findMainCategoryByPack(input);
  if (direct) return direct;
  // Try sub-type lookup
  for (const cat of MAIN_INDUSTRY_CATEGORIES) {
    const subs = getSubTypesForMainCategory(cat);
    if (subs.some((s) => s.key === input || s.label === input)) return cat;
  }
  return undefined;
}