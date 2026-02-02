
# Move Content Engine to Social Media Signal Ops

## Overview
Add the Content Engine as a new tab within the Social Media Signal Ops console, providing direct access to the multi-channel generator alongside existing social-focused tools.

## Changes

### 1. Add "Content Engine" Tab to SocialMediaAgentConsole
**File:** `src/components/social/SocialMediaAgentConsole.tsx`

- Add new tab entry to `QUICK_ACTIONS` and `TABS` arrays
- Create new state for showing Content Engine view
- Import and render `MultiChannelGenerator` component when active

### 2. Update Tab Navigation
Add new tab with appropriate icon (Sparkles or Wand2) between existing tabs:
- Home | Single Post | Batch Posts | **Content Engine** | Drafts | Scheduled | Calendar

### 3. Import Required Components
Add imports for:
- `MultiChannelGenerator` from `@/components/content-engine/MultiChannelGenerator`
- `AIContentProfileManager` for Brand Voice access (optional)

### 4. Update Sidebar Navigation (Optional)
**File:** `src/components/dashboard/DashboardLayout.tsx`

Remove standalone Content Engine menu item since it will now be accessible within Social Media Ops.

---

## Technical Details

### Tab Configuration Update
```typescript
const QUICK_ACTIONS = [
  { id: 'create', label: 'Single Post', ... },
  { id: 'batch', label: 'Batch Posts', ... },
  { id: 'content-engine', label: 'Content Engine', icon: Wand2, message: 'Open multi-channel generator', featureColor: 'text-pink-400' },
  { id: 'drafts', label: 'Drafts', ... },
  // ...
];
```

### State Management
```typescript
const [showContentEngine, setShowContentEngine] = useState(false);
```

### Content Area Rendering
```typescript
{showContentEngine && (
  <div className="p-4">
    <MultiChannelGenerator />
  </div>
)}
```

---

## Summary of Relationships

| Feature | Scope | Purpose |
|---------|-------|---------|
| **Single Post** | Social only | Manual post creation with AI assist |
| **Batch Posts** | Social only | AI-generated multi-date scheduling |
| **Content Engine** | Multi-channel | One topic → Social + Blog + Email + SMS + Website |
| **Drafts/Scheduled** | Social only | Queue management for social posts |
| **Calendar** | Social only | Visual scheduling view |

The Content Engine complements the social-specific tools by providing a unified "hub" for generating consistent content across all marketing channels from a single creative brief.
