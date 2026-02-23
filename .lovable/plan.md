
# Add Templates & AI Topic Suggestions to Content Engine

## What Is Currently There

The `MultiChannelGenerator` input panel has:
- A `Textarea` for "Topic or Campaign Theme"
- Channel checkboxes
- AI Image toggle
- Generate button

The `IndustryTemplateSelector` component already exists and has pre-written templates for 18+ industries broken out by platform (Instagram, Facebook, LinkedIn, TikTok, SMS). It is currently only shown in the Social Media console's **Home/Welcome screen** chat area — never in the actual generator.

The `PostTemplates` component has 5 general post templates (Seasonal Special, Job Completion, Maintenance Reminder, Happy Customer, Quick Tip).

## The Two Things To Add

### 1. Templates Button — Put Existing Templates Into the Topic Field
Add the `IndustryTemplateSelector` directly inside the `MultiChannelGenerator` input panel, right below the topic textarea. When a user picks a template, it loads the template text into the `topic` field so they can use it or edit it as their generation prompt.

The `IndustryTemplateSelector` already accepts an `onSelectTemplate` prop that fires with the template text — we just wire it to `setTopic(template)`.

We also add the general `PostTemplates` component (the 5 quick ones) as a second "Quick Templates" button for common use cases, similarly wiring selection to `setTopic`.

### 2. AI Suggest Topics — Generate 5 Topic Ideas from a Keyword
Add an "AI Suggest" button next to the topic label. When clicked, it calls the existing `content-engine` edge function (or a lightweight call) with a prompt like "suggest 5 campaign topic ideas" and populates a small dropdown of clickable suggestions below the textarea.

**Implementation approach**: Use `supabase.functions.invoke('content-engine')` with `channel: 'suggestions'` and `topic: currentTopic || 'general business'`. The edge function returns suggestions as a JSON array. We render them as clickable chips below the textarea — clicking one sets the topic.

If the `content-engine` edge function doesn't support a `suggestions` channel, we add that branch to the edge function.

---

## Detailed File Changes

### 1. `src/components/content-engine/MultiChannelGenerator.tsx`

**Add to imports**:
- `IndustryTemplateSelector` from `@/components/social/IndustryTemplateSelector`
- `PostTemplates` from `@/components/social/PostTemplates`  
- `Lightbulb`, `ChevronDown` from `lucide-react`

**Add state**:
```typescript
const [suggestingTopics, setSuggestingTopics] = useState(false);
const [topicSuggestions, setTopicSuggestions] = useState<string[]>([]);
const [showSuggestions, setShowSuggestions] = useState(false);
```

**Add `handleSuggestTopics` function**:
Calls `supabase.functions.invoke('content-engine', { body: { channel: 'suggestions', topic: topic || 'general home services business', companyId: effectiveCompanyId } })` and sets the returned array to `topicSuggestions`.

**Update the Topic textarea section** (lines 586–596) to include:

```
[Label: "Topic or Campaign Theme"]  [AI Suggest button]  [Templates button]

[Textarea for topic]

[If showSuggestions: chip row of 5 AI-suggested topics]
[Industry Templates picker (IndustryTemplateSelector wired to setTopic)]
```

The **"AI Suggest"** button shows a `Lightbulb` icon, calls `handleSuggestTopics`, and shows a spinner while loading. Suggestions appear as clickable `Badge` chips below the textarea — clicking a chip sets the topic and hides the chips.

The **"Templates"** section shows the `IndustryTemplateSelector` component inline with `onSelectTemplate={(template) => setTopic(template)}`.

### 2. `supabase/functions/content-engine/index.ts`

Add a `suggestions` channel handler that:
- Takes the `topic` (or a general keyword) 
- Returns a JSON array of 5 campaign topic/theme ideas
- Example system prompt: "You are a marketing expert. Generate 5 specific, actionable campaign topic ideas for a business based on this theme. Return ONLY a JSON array of 5 strings, no explanation."
- The response is parsed and returned as `{ content: ["topic 1", "topic 2", ...] }`

This is a small addition to the existing switch/if-else in the edge function.

---

## New Input Panel Layout (After Changes)

```
┌─────────────────────────────────────────────────┐
│  Topic or Campaign Theme        [💡 AI Suggest] │
│  ┌─────────────────────────────────────────────┐│
│  │ e.g., Spring AC Maintenance Special...      ││
│  └─────────────────────────────────────────────┘│
│                                                  │
│  [AI suggestions row - chips, shown after click] │
│  • Spring Tune-Up Deal  • Filter Replacement ... │
│                                                  │
│  [✨ Industry Templates ▼] ← existing component  │
│                                                  │
│  Select Channels                                 │
│  ☑ Social Media    ☑ Blog   ...                 │
│                                                  │
│  [Generate AI Image toggle]                      │
│                                                  │
│  [Generate Content]                              │
└─────────────────────────────────────────────────┘
```

---

## Files Changed

| File | Change |
|---|---|
| `src/components/content-engine/MultiChannelGenerator.tsx` | Add AI Suggest button + suggestions chips + wire IndustryTemplateSelector into topic field |
| `supabase/functions/content-engine/index.ts` | Add `suggestions` channel handler that returns 5 topic ideas as a JSON array |

## What Stays the Same
- All channel generation logic — unchanged
- Copy & Open platform buttons — unchanged
- Save actions (Schedule Post, Create Campaign, etc.) — unchanged
- Brand Voice, Dashboard, Calendar tabs — unchanged
- IndustryTemplateSelector and PostTemplates components themselves — unchanged, just reused
