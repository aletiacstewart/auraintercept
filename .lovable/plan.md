
# Add Restaurants Industry Grid Box

## Overview
Add a "Restaurants" industry card to the landing page Industries section to support the Aura Express tier marketing.

## Change Details

### File: `src/pages/Index.tsx`

**Add to the "Wellness & Personal" category** (lines 362-371):

Current:
```typescript
{
  category: 'Wellness & Personal',
  emoji: '💆',
  subtitle: 'Services',
  industries: [{
    name: 'Beauty & Wellness',
    icon: Scissors,
    description: 'Salons & Massage'
  }]
}
```

Updated:
```typescript
{
  category: 'Wellness & Personal',
  emoji: '💆',
  subtitle: 'Services',
  industries: [{
    name: 'Beauty & Wellness',
    icon: Scissors,
    description: 'Salons & Massage'
  }, {
    name: 'Restaurants',
    icon: UtensilsCrossed,
    description: 'Cafes & Food Service'
  }]
}
```

**Add Import** (at the top of the file with other lucide-react imports):
- Add `UtensilsCrossed` to the existing lucide-react import statement

## Visual Result
The Industries section will now show "Restaurants" alongside "Beauty & Wellness" in the Wellness & Personal category, with a utensils icon and "Cafes & Food Service" description. This aligns with the Aura Express tier targeting restaurants.

## Technical Details
- Icon: `UtensilsCrossed` from lucide-react (fork and knife crossed)
- Category: Wellness & Personal Services
- Description: "Cafes & Food Service"
