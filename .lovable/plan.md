

## Phase 1: Aura Command Center as Default Dashboard

### What We're Building
Replace the current stat-card-heavy company admin dashboard with an **Aura-first Command Center** — a simplified hero experience that puts natural language interaction front and center, with existing business data moved into a collapsible section below.

### Changes

**1. New file: `src/components/dashboard/AuraCommandCenter.tsx`**

Top-to-bottom layout:
- **Hero command input** — large text input: "What do you want Aura to do today?" with voice toggle button. Uses existing `useUnifiedAura` hook for processing and `useVoice` for voice input.
- **6 suggested command cards** in a 2x3 grid (1-col on mobile): "Book today's emergency job", "Show overdue invoices & chase them", "Generate social posts for spring tune-ups", "Check today's dispatch schedule", "Create a quote for a new lead", "Show me this week's revenue". Clicking a card auto-populates and submits the command.
- **Aura Live activity feed** — renders the existing `AuraLiveStream` component showing real-time agent actions.

**2. Refactor: `src/components/dashboard/CompanyAdminDashboard.tsx`**

- Import and render `AuraCommandCenter` as the primary top section
- Wrap the existing stat cards grid, quick actions, and business metrics in a collapsible **"Business Snapshot"** section (collapsed by default, toggle with chevron)
- Keep all existing data queries, tier gating, and logic intact — just restructure the JSX layout

### Styling

All new UI uses **existing theme tokens only** — no hardcoded cyan/teal RGBA values:
- Card backgrounds: `bg-card`, `bg-muted`
- Borders: `border-border`, `hover:border-primary`
- Text: `text-foreground`, `text-muted-foreground`, `text-primary`
- Gradients: `from-primary to-secondary` (resolves via CSS variables)
- Shadows/glows: Tailwind shadow utilities + `shadow-glow` tokens
- The existing hardcoded `rgba(4,12,26,...)` and `rgba(0,229,255,...)` in the stat cards and quick actions will also be migrated to theme tokens in this pass

### What Stays the Same
- All backend/database untouched
- Sidebar navigation unchanged
- All existing consoles remain accessible
- `useUnifiedAura` hook reused as-is
- `AuraLiveStream` component reused as-is
- All stat data queries preserved (just visually collapsed)

