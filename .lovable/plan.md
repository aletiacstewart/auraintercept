## Plan

1. **Add a campaign library tab to the Outreach & Sales console**
   - Add a new tab/action in `MarketingSalesAgentConsole` named **Campaigns** or **Review Campaigns**.
   - This tab will query saved `marketing_campaigns` for the current company and show both draft and sent campaigns directly in the console, instead of forcing users to find the separate `/dashboard/campaigns` page.

2. **Show useful review and sending data in-console**
   - Each campaign row/card will show status, channel icons, target segment, created date, last sent date, total sent, opens, clicks, and quick performance rates.
   - Include clear actions: **View Details**, **Send Now / Send Again**, and **Use Again / Duplicate** where appropriate.
   - `View Details` will link to the existing campaign detail page that shows recipient-level delivery/open/click records.

3. **Keep the create form and saved list connected**
   - After creating a campaign from the console form, invalidate/refetch the same campaign query so the new draft appears immediately in the new campaign library tab.
   - Adjust the success flow so users land on the saved campaign list instead of being sent back only to chat, making it obvious that the campaign was saved.

4. **Fix naming mismatch around query invalidation**
   - The console form currently invalidates `marketing-campaigns`, while the campaigns page uses `campaigns`. I’ll standardize the affected console query invalidation so newly created campaigns reliably appear without refresh.

## Technical notes

- Primary file: `src/components/marketing/MarketingSalesAgentConsole.tsx`.
- Likely small supporting edits: `src/components/marketing/forms/CampaignForm.tsx` for success behavior/query invalidation.
- No new database tables are needed; saved campaigns already live in `marketing_campaigns`, and send/open/click history lives in `campaign_sends`.