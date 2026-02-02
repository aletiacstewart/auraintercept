
# Option A: Consolidate Social Tools into "Social Posts" Tab

## Overview
Simplify the Social Media Signal Ops console by consolidating 5 social-specific tools (Single Post, Batch Posts, Drafts, Scheduled, Calendar) into a single "Social Posts" tab with sub-navigation. This reduces the main navigation from 7 tabs to 3 cleaner options.

## New Navigation Structure

**Before (7 tabs):**
```
Home | Single Post | Batch Posts | Content Engine | Drafts | Scheduled | Calendar
```

**After (3 tabs):**
```
Home | Social Posts | Content Engine
```

**Social Posts sub-tabs:**
```
Create | Batch | Drafts | Scheduled | Calendar
```

---

## Technical Changes

### File: `src/components/social/SocialMediaAgentConsole.tsx`

**1. Simplify QUICK_ACTIONS array:**
Replace 5 individual actions with 1 consolidated "Social Posts" action:
```typescript
const QUICK_ACTIONS = [
  { id: 'social-posts', label: 'Social Posts', icon: Share2, message: 'Manage social posts', featureColor: 'text-pink-400' },
  { id: 'content-engine', label: 'Content Engine', icon: Wand2, message: 'Open multi-channel generator', featureColor: 'text-pink-400' },
];
```

**2. Add Social Posts sub-tab state:**
```typescript
const [showSocialPosts, setShowSocialPosts] = useState(false);
const [socialPostsTab, setSocialPostsTab] = useState('create');
```

**3. Simplify form visibility states:**
Remove individual states (`showPostForm`, `showBatchWizard`, etc.) and rely on `socialPostsTab` value instead.

**4. Update handleQuickAction:**
```typescript
if (actionId === 'social-posts') {
  hideAllForms();
  setShowSocialPosts(true);
  setSocialPostsTab('create'); // Default to Create tab
  setActiveTab('chat');
  return;
}
```

**5. Create Social Posts nested tabs UI:**
```typescript
{showSocialPosts && effectiveCompanyId && (
  <div className="space-y-4">
    <Tabs value={socialPostsTab} onValueChange={setSocialPostsTab}>
      <TabsList>
        <TabsTrigger value="create">Create</TabsTrigger>
        <TabsTrigger value="batch">Batch</TabsTrigger>
        <TabsTrigger value="drafts">Drafts</TabsTrigger>
        <TabsTrigger value="scheduled">Scheduled</TabsTrigger>
        <TabsTrigger value="calendar">Calendar</TabsTrigger>
      </TabsList>

      <TabsContent value="create">
        <SocialContentWizard ... />
      </TabsContent>
      <TabsContent value="batch">
        <SocialBatchWizard ... />
      </TabsContent>
      <TabsContent value="drafts">
        <SocialFeedQueue initialFilter="pending" ... />
      </TabsContent>
      <TabsContent value="scheduled">
        <SocialScheduleQueue ... />
      </TabsContent>
      <TabsContent value="calendar">
        <SocialContentCalendar ... />
      </TabsContent>
    </Tabs>
  </div>
)}
```

**6. Update getActiveLabel function:**
```typescript
const getActiveLabel = () => {
  if (showSocialPosts) {
    const labels = {
      create: 'Create Post',
      batch: 'Batch Posts', 
      drafts: 'Drafts',
      scheduled: 'Scheduled',
      calendar: 'Calendar'
    };
    return labels[socialPostsTab] || 'Social Posts';
  }
  if (showContentEngine) return 'Content Engine';
  // ... rest
};
```

**7. Remove unused states and update hideAllForms:**
```typescript
const hideAllForms = () => {
  setShowSocialPosts(false);
  setShowContentEngine(false);
};
```

---

## Result

| Area | Before | After |
|------|--------|-------|
| Main tabs | 7 items | 3 items |
| Social tools | Scattered across tabs | Unified under "Social Posts" |
| Content Engine | Nested tabs | Unchanged (nested tabs) |
| Navigation depth | Mix of flat and nested | Consistent 2-level hierarchy |

## Benefits
- Cleaner, less cluttered main navigation
- Logical grouping of related social media tools
- Consistent pattern with Content Engine (both use nested tabs)
- Easier to find all social post management in one place
