
# Consolidate Business Management UI

## Summary

This plan:
1. **Adds Aura Live** to the Business Mgt Ops Console (showing real-time agent activity)
2. **Removes** the "Business Management" sidebar category and the "Business Mgt Ops Overview" page
3. **Renames** "Business Mobile Apps" to "Business Mgt Console & Mobile App"

---

## Changes Overview

| File | Change |
|------|--------|
| `src/components/billing/BusinessOpsAgentConsole.tsx` | Add AuraLiveStream component to Welcome screen |
| `src/components/dashboard/DashboardLayout.tsx` | Remove "Business Management" category, rename "Business Mobile Apps" |
| `src/lib/voiceNavigation.ts` | Update routes to point to console instead of overview |
| `src/contexts/VoiceContext.tsx` | Update onAuraActivate destination |
| `src/hooks/useUnifiedAura.ts` | Update page context mapping |
| `src/components/aura/AuraQuickResponsePopup.tsx` | Update handleViewFull destination |
| `src/App.tsx` | Remove/redirect business-operations route |

---

## Technical Details

### 1. Add Aura Live to Business Mgt Ops Console

In `BusinessOpsAgentConsole.tsx`:
- Import `AuraLiveStream` component
- Add it to the WelcomeScreen area, above the quick action buttons
- Only show when user has a companyId

```typescript
// In the welcome screen area
{showWelcome && effectiveCompanyId && (
  <div className="space-y-6">
    <AuraLiveStream companyId={effectiveCompanyId} />
    <WelcomeScreen ... />
  </div>
)}
```

### 2. Update Sidebar Navigation

In `DashboardLayout.tsx`:

**Remove** the "Business Management" category (lines 96-102):
```typescript
// DELETE:
{
  label: 'Business Management',
  requiredTier: 'command',
  items: [
    { label: 'Business Mgt Ops Overview', ... },
  ],
},
```

**Rename** "Business Mobile Apps" to "Business Mgt Console & Mobile App":
```typescript
{
  label: 'Business Mgt Console & Mobile App',  // was: 'Business Mobile Apps'
  requiredTier: 'command',
  items: [...],
},
```

### 3. Update Voice Navigation & Routes

**voiceNavigation.ts** - Point business ops commands to the console:
```typescript
'business ops': '/dashboard/ai-consoles/business-mgt-ops',
'business operations': '/dashboard/ai-consoles/business-mgt-ops',
```

**VoiceContext.tsx** - Update Aura activation:
```typescript
onAuraActivate: () => {
  navigate('/dashboard/ai-consoles/business-mgt-ops');
}
```

**useUnifiedAura.ts** - Update page context:
```typescript
'/dashboard/ai-consoles/business-mgt-ops': 'Business Mgt Ops Console...'
```

**AuraQuickResponsePopup.tsx** - Update view full:
```typescript
navigate('/dashboard/ai-consoles/business-mgt-ops');
```

### 4. Handle Route Redirect

In `App.tsx` - Redirect old route to console:
```typescript
<Route 
  path="/dashboard/business-operations" 
  element={<Navigate to="/dashboard/ai-consoles/business-mgt-ops" replace />} 
/>
```

---

## Result

### Before:
```
Sidebar:
├── Business Management
│   └── Business Mgt Ops Overview  ← (separate page with Aura Live)
├── Business Mobile Apps
│   ├── Business Mgt Ops Console   ← (no Aura Live)
│   └── ...
```

### After:
```
Sidebar:
├── Business Mgt Console & Mobile App
│   ├── Business Mgt Ops Console   ← (NOW includes Aura Live!)
│   └── ...
```

---

## Files to Modify

1. `src/components/billing/BusinessOpsAgentConsole.tsx` - Add AuraLiveStream
2. `src/components/dashboard/DashboardLayout.tsx` - Remove category, rename section
3. `src/lib/voiceNavigation.ts` - Update route mappings
4. `src/contexts/VoiceContext.tsx` - Update Aura destination
5. `src/hooks/useUnifiedAura.ts` - Update page context
6. `src/components/aura/AuraQuickResponsePopup.tsx` - Update navigation
7. `src/App.tsx` - Add redirect from old route
