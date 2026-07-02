## Fix: Sidebar duplication report & sticky-header overlap

### 1. Sidebar duplication — cannot reproduce, no code change proposed
Verified via headless capture at `/dashboard/knowledge?tab=inventory` (platform_admin session, current build):
- `DashboardLayout` is imported in exactly one place per KB/Inventory route and mounts a single `<aside>` sidebar.
- HTML string contains exactly **1** "Configuration", **1** "Sign Out", **1** "Platform Admin"; "Knowledge Base" appears 3× only because it is the page title + nav item + tab label.
- Only one `position: sticky` element exists on the page (the top notification bar). No duplicated sidebar column, no duplicated footer block.
- Route graph in `src/App.tsx`: `/dashboard/knowledge` → `KnowledgeBase` (one `DashboardLayout`), `/dashboard/inventory` → `Inventory` (one `DashboardLayout`). No nested layout wrappers.

**Proposed action:** do not blind-edit. Ask the user to share a screenshot + exact URL + viewport width + which account role they were signed in as so we can reproduce. If they can reproduce, we'll re-open with concrete evidence.

### 2. Sticky top bar clips "Business Description" (and other section headers)
Root cause found while investigating:
- Outer shell (`DashboardLayout.tsx` line 465) uses `min-h-screen flex` with no fixed height, so `main` (line 749) with `overflow-y-auto flex-1` never becomes a real scroll container — the **window** scrolls instead.
- The header bar at line 753 is `sticky top-0 z-10`, height ≈ 57px. Because the window scrolls, the sticky bar pins to the viewport and overlaps any content that scrolls under it.
- On `KnowledgeBase.tsx` the tabs bar (`<TabsList>` line 69) is NOT sticky, so as the user scrolls to Business Description the tabs disappear and the top 57px of subsequent Card headers (`Business Description`, `Content Tone & Voice`, etc.) sit behind the notification bar → "usiness Description" appearance.

Two-part fix, scoped narrowly:

**a. Make the KB `TabsList` sticky beneath the notification bar** — in `src/pages/KnowledgeBase.tsx`:
- Wrap `<TabsList>` in a container with `sticky top-[57px] z-20 -mx-1 px-1 py-1 bg-[rgba(4,10,20,0.9)] backdrop-blur border-b border-[rgba(0,229,255,0.1)]` so the tabs stay pinned flush under the notification bar, providing a solid backdrop that prevents underlying content from bleeding through.
- No change to Tab semantics.

**b. Add scroll-offset breathing room to section headers** — in `src/components/knowledge/AIContentProfileManager.tsx` (and mirror on `BusinessContextManager.tsx` if it uses the same pattern):
- Add `scroll-mt-[128px]` on each top-level `<Card>` (or on their `CardHeader`s). This is the offset used when a header is scrolled into view via `scrollIntoView` / anchor jump, so it sits below the combined sticky bar (57px) + sticky tabs (~48px) with a small gap.
- Applies to: Industry Categories, Keywords & Terms, Business Description, Content Tone & Voice, Content Topics.

**c. Add the same `scroll-mt` to other KB tab panels' primary Cards** for consistency (Services, FAQs, Documents, Smart Links). Small utility-class-only change; no component refactor.

### Verification
Re-run the KB AI Profile page in headless capture and confirm:
- Tabs bar stays visible while scrolling down through Business Description.
- Business Description heading is fully visible when scrolled into view.
- No other page's layout regresses (sticky change is scoped to KB's `TabsList` wrapper).

### Out of scope
- Rewriting `DashboardLayout` to make `main` the true scroll container (larger change with broad side effects — worth doing later as its own pass if we want header behavior identical to native SPA shells).
- Making other pages' Tabs sticky (mirror this pattern later if the user reports the same symptom elsewhere).
