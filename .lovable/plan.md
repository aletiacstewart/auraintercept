## Goal
Let users open multiple accordion sections at once across the whole app, and close each one independently.

## Change
Radix's `Accordion` supports two modes:
- `type="single" collapsible` (current) — opening a section auto-closes the previous one.
- `type="multiple"` — any number can be open at once; each closes independently on its own trigger click.

Sweep every `type="single" collapsible` accordion and switch it to `type="multiple"` (removing the now-unused `collapsible` prop, which only applies to `single`).

## Files to update (27 usages across 16 files)
- Pages: `Help.tsx` (2), `SignUp.tsx` (2), `SmartWebsiteManager.tsx`, `PlatformGuides.tsx`
- Integration guides: `TavilySetupGuide`, `SocialMediaSetupGuide`, `SignalWireSetupGuide`, `ResendSetupGuide`, `GoogleCalendarSettings`, `ElevenLabsVoiceSetupGuide`, `ElevenLabsSetupGuide`, `CostCalculatorHelp`
- Consoles/hubs: `businessops/BusinessOpsHubTabs.tsx` (5), `aura/AuraTabs.tsx` (4)
- Setup: `company/PhoneNumberSetupWizard.tsx` (2), `smartwebsite/LogoEditor.tsx` (2)

## Out of scope
- shadcn `Collapsible`, `DropdownMenu`, `Select`, and `Tabs` — these are inherently single-select UI patterns (dropdown menus close on selection, tabs show one panel). Changing them would break their semantics. Only `Accordion` components are swept.
- No visual, styling, or content changes.

## Verification
`rg 'type="single"' src` returns zero hits after the sweep; `tsgo` clean.
