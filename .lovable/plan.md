
## What's Happening

The "Write Review" and "Leave Feedback" items in the image are guide cards inside the `AgentHowToGuide` component (rendered in the `WelcomeScreen`). The `AgentHowToGuide` renders a static list from `CUSTOMER_GUIDES` — it currently has no awareness of whether the customer has submitted feedback or what rating they gave.

The fix: when a customer submits the feedback form with 4+ stars, `AIAgentConsole.tsx` already calls `handleFeedbackSubmit(feedback)` which has `feedback.rating`. We store that rating in state and pass it down through `WelcomeScreen` → `AgentHowToGuide`, which then conditionally filters out the `'review'` guide card.

---

## Changes — 3 files

### 1. `src/components/ai/AIAgentConsole.tsx`
- Add state: `const [lastFeedbackRating, setLastFeedbackRating] = useState<number>(0);`
- In `handleFeedbackSubmit`, after setting form states, add: `setLastFeedbackRating(feedback.rating);`
- Pass `feedbackRating={lastFeedbackRating}` to `WelcomeScreen`

### 2. `src/components/ai/chat/WelcomeScreen.tsx`
- Add optional prop `feedbackRating?: number`
- Pass it through to `AgentHowToGuide` as `feedbackRating={feedbackRating}`

### 3. `src/components/ai/chat/AgentHowToGuide.tsx`
- Add optional prop `feedbackRating?: number` to `AgentHowToGuideProps`
- In the render, filter guides: `const visibleGuides = guides.filter(g => g.id !== 'review' || (feedbackRating !== undefined && feedbackRating >= 4));`

### Result
- On first visit: "Leave Feedback" shows, "Write Review" is hidden
- Customer submits 3-star feedback → "Write Review" still hidden
- Customer submits 4 or 5-star feedback → "Write Review" appears automatically in the guide list
