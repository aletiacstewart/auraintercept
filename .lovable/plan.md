Remove the "Three Promises. Zero Headaches." outcomes section from the homepage.

The section to remove is in `src/pages/Index.tsx`, lines 518-619, which includes:
- The "What Aura Does For You" badge and section heading
- The "Three Promises. Zero Headaches." title and subtitle
- The three promise cards (Never Miss a Call, Fill Your Calendar, Get Paid Faster)
- The "See the 24 agents that power this" scroll-down button

Action: Delete that entire `<section>` block. The "10 AI Operatives" section (`#agent-network-detail`) that follows will naturally move up to fill the space.