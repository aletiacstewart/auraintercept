

## Plan: Change 10 Consolidated AI Operatives → 24 Smart AI Agents

### Changes in `src/pages/Index.tsx`

**1. Update the section heading (lines 537-540)**
- Change "10 Consolidated AI Operatives" → "24 Smart AI Agents"
- Update subtitle accordingly

**2. Expand `agentCategories` (lines 15-108) to show all 24 individual agents instead of the 10 consolidated operatives**

Based on the legacy agent map, the 24 agents break down per console as:
- **Customer Portal (3):** AI Receptionist (triage), Booking, Follow-Up, Review → show individually
- **Field Operations (5):** Dispatch, Route, ETA, Check-In, Field Navigation
- **Business Operations (5):** Admin, Quoting, Invoice, Inventory, Business Finance
- **Analytics & Reports (4):** Insights, Performance, Revenue, Forecast
- **Outreach & Sales (4):** Campaign, Lead, Marketing, Outreach
- **Social Media (4):** Creative Content, Social Content, Social Scheduler, Social Analytics
- **Creative & Web Presence (2):** Creative Content, Web Presence

Adjusted to total 24 unique agents across 7 consoles.

**3. Add agent count badge to each console grid box (line 546-552)**
- Add a pill/badge next to each category name showing `{category.agents.length} AI Agents`
- Styled as a small neon-accented chip matching the category color

**4. Update "How It Works" step 2 (line 362)**
- Change "10 consolidated AI operatives" → "24 Smart AI Agents"

### Technical Details
- Only `src/pages/Index.tsx` is modified
- The `agentCategories` array is expanded with the individual agent entries
- Each category card gets a count badge via `category.agents.length`
- No backend or config changes needed — this is purely a landing page content update

