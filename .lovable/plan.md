## Progressive Disclosure Consistency — 3 pages

Apply the existing `AuraIntelligenceSettings` accordion pattern (shadcn `Accordion type="multiple"`) to three currently always-expanded pages. Pure presentation — no changes to form fields, validation, save handlers, or AI actions.

### Fix 1 — `src/pages/Settings.tsx` (Company tab)
Line 115 `TabsContent value="company"`. Currently renders `BrandingSettings`, `ContactInfoSettings`, `PublicAppUrlSettings` stacked with `<Separator />`.
- Replace with `<Accordion type="multiple" defaultValue={['branding']} className="space-y-4">` containing three `AccordionItem`s (`branding`, `contact`, `app-url`).
- Each item: title + muted description in `AccordionTrigger`; existing component inside `AccordionContent`.
- Remove the old separators/headings.

### Fix 2 — `src/pages/KnowledgeBase.tsx` (AI Profile tab)
Line 112 `TabsContent value="ai-profile"`. Wrap its 6 sections in an accordion with `defaultValue={['industry','description']}` (Industry Categories + Business Description open by default; the other 4 collapsed). Preserve every "AI Generate", "Save Profile", "Test Content" button unchanged inside their sections.

### Fix 3 — `src/pages/Automation.tsx` (10 agents)
Currently maps `AGENTS` → `<Card>` per agent, all expanded (line 311+). Convert to collapsed row list:
- Container: `<div className="rounded-lg border divide-y">`
- Single-expanded state: `const [expandedAgentId, setExpandedAgentId] = useState<string | null>(null)`
- Each row: header button showing `agent.label`, `agent.description`, and current settings summary (`d.mode`, `Conf {confidence_threshold}`, `Cap ${max_value_usd}`, `{daily_action_cap}/day`) plus rotating `ChevronDown`.
- On expand: render the existing 4-field form + per-agent Save button unchanged inside a `<div className="p-4 pt-0 border-t bg-muted/20">`.
- Keep `drafts`, `updateDraft`, `saveAgent`, validation, and bulk actions untouched.

### Files touched
- `src/pages/Settings.tsx`
- `src/pages/KnowledgeBase.tsx`
- `src/pages/Automation.tsx`

Imports to add where missing: `Accordion, AccordionItem, AccordionTrigger, AccordionContent` from `@/components/ui/accordion`; `ChevronDown` from `lucide-react`; `cn` from `@/lib/utils`.

### Verification
- Settings → Company: Branding open, other two collapse/expand; saves still work.
- KB → AI Profile: 2 open, 4 collapsed; AI Generate / Save Profile / Test Content still fire.
- Automation: 10 collapsed rows with summary; expanding one shows form; Save persists per agent; bulk Save-All unaffected.
- No console errors; TypeScript passes.
