

## Plan: Add "Best For" Descriptions to Each Pricing Card

### What Changes
Update the 3 pricing cards in `src/pages/Index.tsx` to add a short "Best for" description below each plan's subtitle, describing the ideal company type.

### Descriptions
- **Aura Connect** — *"Best for solo operators, salons, consultants, and small service businesses that need AI-powered booking, outreach, and web presence."*
- **Aura Performance** — *"Best for HVAC, plumbing, electrical, and field service companies that dispatch technicians and manage jobs on the go."*
- **Aura Command** — *"Best for multi-location franchises, property management firms, and enterprise teams that need full analytics, white-label branding, and centralized control."*

### Technical Details
- **File:** `src/pages/Index.tsx`
- **Lines ~806, ~859, ~909:** Replace the current one-line subtitles (e.g., "Core booking & outreach") with a 2-line block: keep the short tagline, then add a new `<p>` with the "Best for" text styled as `text-[10px] text-card-foreground/50 italic mb-2`.
- No other files affected.

