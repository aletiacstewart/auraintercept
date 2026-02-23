
# Fix AI Agent Flow Connections — Complete Audit & Repair

## Issues Found

After a thorough review of all 10 scenes, here are all the broken or missing connections:

### Scene 2 — Customer Portal
- Missing: `triage → review` — Receptionist should also be able to directly trigger a review request (not just via Follow-up)
- Missing: `booking → followup` — After a job is booked and completed, Scheduling should trigger Follow-up (currently triage → followup directly, but booking is the event that initiates follow-up)

### Scene 3 — Outreach & Sales
- Missing: `campaign → marketing_ag` — Campaign results feed back into Marketing for segmentation updates
- Missing: `lead → marketing_ag` — Lead qualification data feeds into Marketing segments

### Scene 4 — Social Media
- Missing: `social_analytics → social_content` — Analytics results feed back to Content creation (the feedback loop that makes content smarter over time)
- Missing: `social_analytics → social_scheduler` — Analytics informs scheduling timing (best times to post)

### Scene 5 — Creative & Web Presence
- Missing: `web_presence → f3` (Blog Posts) — Web Presence also publishes blog posts, not just Creative
- Currently `creative → f3` exists but Web Presence is the one that actually publishes to the site

### Scene 6 — Field Operations
- Missing: `dispatch → f1` — Dispatch → Skills-Based Assignment feature node has NO connection (f1 is orphaned)
- Missing: `route → checkin` — Route plan informs Check-in agent (so technician follows the optimized route to arrive at the right time)
- Missing: `eta → checkin` — ETA feeds into Check-in to trigger arrival notifications

### Scene 7 — Business Operations
- Missing: `inventory → quoting` — Inventory levels directly inform Quoting (parts availability affects estimates)
- Missing: `invoice → admin` — Invoice status/reports feed back to Admin for oversight

### Scene 8 — Analytics & Reports
- Missing: `insights → revenue` — Natural language queries directly pull from Revenue data
- Missing: `insights → forecast` — Insights also queries Forecast data
- Missing: `performance → revenue` — Performance KPIs include revenue metrics
- Missing: `performance → forecast` — Performance data feeds Forecast model

### Scene 9 — Full Network (most critical — the overview must show all cross-console flows)
- Missing: `booking → dispatch` — After booking, job is handed to Dispatch for technician assignment (KEY cross-console flow)
- Missing: `checkin → invoice_ag` — Check-in completion triggers Invoice generation (KEY cross-console flow)
- Missing: `lead → campaign` — Lead scoring feeds Campaign targeting (currently only `review → campaign` exists)
- Missing: `lead → marketing_ag` — Leads feed Marketing segments
- Missing: `marketing_ag → campaign` — Marketing triggers Campaigns
- Missing: `web_presence → social_content` — Web Presence publishes content that Social picks up
- Missing: `social_analytics → insights` — Social analytics data feeds the Analytics console Insights agent
- Missing: `inventory → quoting` — Cross-console: Inventory informs Quoting
- Missing: `insights → performance` — Analytics agents are fully disconnected from each other in Scene 9
- Missing: `revenue → forecast` — Same issue
- `admin` node exists in Scene 9 but has zero connections — needs `admin → quoting`, `admin → inventory`

## Technical Changes

**One file to modify:** `src/pages/AIAgentFlowDemo.tsx`

Changes per scene:

**Scene 2**: Add `booking → followup` connection (triage books → booking → followup is the correct linear flow)

**Scene 3**: Add `lead → marketing_ag` and `campaign → marketing_ag` connections

**Scene 4**: Add `social_analytics → social_content` (feedback loop) and `social_analytics → social_scheduler` connections

**Scene 5**: Add `web_presence → f3` connection so blog posts connect to Web Presence (alongside Creative)

**Scene 6**: Add `dispatch → f1`, `route → checkin`, and `eta → checkin` connections

**Scene 7**: Add `inventory → quoting` and `invoice → admin` connections

**Scene 8**: Add full cross-connections: `insights → revenue`, `insights → forecast`, `performance → revenue`, `performance → forecast`

**Scene 9 (Full Network)**: Add the critical cross-console handoff connections:
- `booking → dispatch` (Customer Portal → Field Ops)
- `checkin → invoice_ag` (Field Ops → Business Ops)
- `lead → marketing_ag`, `marketing_ag → campaign` (within Outreach)
- `web_presence → social_content` (Creative → Social)
- `social_analytics → insights` (Social → Analytics)
- `inventory → quoting` (within Business Ops)
- `admin → quoting`, `admin → inventory` (Admin oversight)
- `insights → performance`, `revenue → forecast` (within Analytics)

All `highlightConnections` arrays will be updated to include the new connection indices.

The narration text for Scene 9 will be updated to mention the additional cross-console handoffs: `Booking feeds Dispatch`, `Check-in triggers Invoice`, and `Social Analytics informs Insights`.
