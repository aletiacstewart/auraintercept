Add an explanation note to the Per-Agent Settings tab in `/dashboard/automation` so users understand what the three numeric thresholds control.

Plan:
1. Open `src/pages/Automation.tsx`.
2. Above the list of agent cards in the `settings` tab, insert a compact info block (e.g., a small Card or bordered note row) using theme tokens only.
3. Use a `HelpCircle` or `Info` icon and one-line definitions for each field:
   - **Min Confidence** — The lowest certainty score (0.0–1.0) the agent must reach before it can act without asking.
   - **Max Value / Action ($)** — The maximum dollar value of a single action the agent may auto-execute. Anything above this is sent for approval.
   - **Daily Auto Cap** — The maximum number of auto-executed actions this agent can run in one day. When reached, everything queues for approval.
4. Keep it compact and unobtrusive; do not change the existing input layout or logic. No backend changes are needed.
5. Verify the change renders correctly in the preview under the Per-Agent Settings tab.