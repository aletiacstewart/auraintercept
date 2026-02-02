
# Add Missing Content Engine Tabs to Social Media Console

## Overview
Expand the Content Engine integration in the Social Media Signal Ops console to include all 4 original tabs: Brand Voice, Generate, Dashboard, and Calendar, plus the Quick Stats section.

## Current State
- Only `MultiChannelGenerator` (Generate tab) was added
- Missing: Brand Voice, Dashboard, Calendar tabs
- Missing: Quick Stats cards

## Changes

### File: `src/components/social/SocialMediaAgentConsole.tsx`

**1. Add new imports:**
```typescript
import { ContentEngineDashboard } from '@/components/content-engine/ContentEngineDashboard';
import { ContentEngineCalendar } from '@/components/content-engine/ContentEngineCalendar';
import { AIContentProfileManager } from '@/components/knowledge/AIContentProfileManager';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
```

**2. Add Content Engine sub-tab state:**
```typescript
const [contentEngineTab, setContentEngineTab] = useState('settings');
```

**3. Update Content Engine render section:**
Replace the simple `MultiChannelGenerator` render with a full tabbed interface:

```typescript
{showContentEngine && effectiveCompanyId && (
  <div className="p-2 space-y-4">
    {/* Optional: Quick Stats */}
    
    <Tabs value={contentEngineTab} onValueChange={setContentEngineTab}>
      <TabsList>
        <TabsTrigger value="settings">Brand Voice</TabsTrigger>
        <TabsTrigger value="generator">Generate</TabsTrigger>
        <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
        <TabsTrigger value="calendar">Calendar</TabsTrigger>
      </TabsList>

      <TabsContent value="settings">
        <AIContentProfileManager />
      </TabsContent>
      <TabsContent value="generator">
        <MultiChannelGenerator />
      </TabsContent>
      <TabsContent value="dashboard">
        <ContentEngineDashboard />
      </TabsContent>
      <TabsContent value="calendar">
        <ContentEngineCalendar />
      </TabsContent>
    </Tabs>
  </div>
)}
```

## Result
The Content Engine tab within Social Media Signal Ops will have nested tabs matching the original standalone page:
- **Brand Voice** - Configure AI content profile
- **Generate** - Multi-channel content generator
- **Dashboard** - View content generation history/analytics
- **Calendar** - Visual content scheduling view
