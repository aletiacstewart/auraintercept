import {
  Flame, Droplet, Zap, Home, TreeDeciduous, Sparkles, HardHat, Shield,
  Refrigerator, Truck, Car, PawPrint, HeartPulse, Hammer, Building2, MapPin,
  Users, Send, FileText, HeartHandshake, Megaphone, Scissors, UtensilsCrossed,
  Briefcase, type LucideIcon,
} from 'lucide-react';

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
}

export const MAIN_INDUSTRY_CATEGORIES: MainIndustryCategory[] = [
  { name: 'HVAC & Mechanical',           icon: Flame,          count: 6,  description: 'AC, heating, ducts, mechanical',         demoPack: 'hvac' },
  { name: 'Plumbing',                    icon: Droplet,        count: 7,  description: 'Plumbers, septic, well, drain',          demoPack: 'plumbing' },
  { name: 'Electrical',                  icon: Zap,            count: 8,  description: 'Electricians, solar, EV, smart home',    demoPack: 'electrical' },
  { name: 'Roofing & Exterior',          icon: Home,           count: 12, description: 'Roof, siding, gutters, paint',           demoPack: 'roofing' },
  { name: 'Landscaping & Outdoor',       icon: TreeDeciduous,  count: 13, description: 'Lawn, trees, pool, pest, snow',          demoPack: 'landscape' },
  { name: 'Cleaning & Restoration',      icon: Sparkles,       count: 13, description: 'House, carpet, water/fire damage',       demoPack: 'handyman' },
  { name: 'Construction & Remodeling',   icon: HardHat,        count: 22, description: 'GC, kitchens, baths, flooring',          demoPack: 'construction' },
  { name: 'Home Inspection & Safety',    icon: Shield,         count: 11, description: 'Inspectors, chimney, locksmith, alarms', demoPack: 'security_systems' },
  { name: 'Appliance & Tech Services',   icon: Refrigerator,   count: 8,  description: 'Appliance, computer, TV, WiFi',          demoPack: 'appliance_repair' },
  { name: 'Moving & Junk Removal',       icon: Truck,          count: 9,  description: 'Movers, junk, towing, waste',            demoPack: 'handyman' },
  { name: 'Auto Services (Mobile)',      icon: Car,            count: 9,  description: 'Detail, glass, oil, mobile mechanic',    demoPack: 'auto_care' },
  { name: 'Pet & Animal Services',       icon: PawPrint,       count: 8,  description: 'Groomers, trainers, vets, sitters',      demoPack: 'veterinary' },
  { name: 'Health & Wellness',           icon: HeartPulse,     count: 1,  description: 'In-home massage & therapists',           demoPack: 'beauty_wellness' },
  { name: 'Specialty Trades',            icon: Hammer,         count: 13, description: 'Handyman, carpenter, pool, masonry',     demoPack: 'handyman' },
  { name: 'Utility & Infrastructure',    icon: Building2,      count: 5,  description: 'Propane, water, utility contractors',    demoPack: 'plumbing' },
  { name: 'Real Estate & Property',      icon: MapPin,         count: 11, description: 'Agents, mortgage, title, mgmt',          demoPack: 'real_estate' },
  { name: 'In-Home Personal Services',   icon: Users,          count: 9,  description: 'Trainer, tutor, nanny, chef',            demoPack: 'personal_assistant' },
  { name: 'Delivery & On-Site Logistics',icon: Send,           count: 4,  description: 'Furniture, fuel, water delivery',        demoPack: 'handyman' },
  { name: 'Insurance & Assessment',      icon: FileText,       count: 4,  description: 'Home/auto, adjusters, appraisers',       demoPack: 'real_estate' },
  { name: 'Senior & Lifestyle',          icon: HeartHandshake, count: 5,  description: 'Senior move, organize, energy audit',    demoPack: 'home_health' },
  { name: 'Event & Temporary',           icon: Megaphone,      count: 6,  description: 'Tents, party, DJ, catering, photo',      demoPack: 'beauty_wellness' },
  { name: 'Beauty & Salons',             icon: Scissors,       count: 2,  description: 'Salons, barbers, spa & nail studios',    demoPack: 'beauty_wellness' },
  { name: 'Restaurants & Food Delivery', icon: UtensilsCrossed,count: 2,  description: 'Restaurants, cafes, food delivery',      demoPack: 'restaurants' },
  { name: 'Personal Assistants',         icon: HeartHandshake, count: 1,  description: 'Personal & executive assistants',        demoPack: 'personal_assistant' },
  { name: 'B2B Pro Services',            icon: Briefcase,      count: 1,  description: 'Consultants & professional services',    demoPack: 'real_estate' },
];

export const MAIN_INDUSTRY_CATEGORY_COUNT = MAIN_INDUSTRY_CATEGORIES.length;

export function findMainCategoryByPack(packId: string | null | undefined): MainIndustryCategory | undefined {
  if (!packId) return undefined;
  return MAIN_INDUSTRY_CATEGORIES.find((c) => c.demoPack === packId);
}