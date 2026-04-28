## Add "Live Demo" link to PublicHeader

Add a new nav button next to "Free Audit" in `src/components/layout/PublicHeader.tsx` that links to `/for-business` (the dynamic industry demo page).

### Changes

**1. `src/components/layout/PublicHeader.tsx`**
- Import a `Sparkles` (or `Zap`) icon from lucide-react.
- Add a new `<Button variant="ghost">` immediately after the Free Audit button:
  - Label: `t('nav.liveDemo')`
  - Icon: `Sparkles` (small, primary accent to draw attention)
  - onClick: `navigate('/for-business')`
  - Same styling as Free Audit (`hidden sm:flex`, white text, hover states)

**2. `src/locales/en/common.json`**
- Add `"liveDemo": "Live Demo"` under the `nav` block.

**3. `src/locales/es/common.json`**
- Add `"liveDemo": "Demo en vivo"` under the `nav` block.

### Result
The header will show, on small screens and up:
`Home · Free Audit · Live Demo · Customer Portal · Sign In · Start Free Trial`

Live Demo routes to `/for-business`, which is the dynamic industry demo page where users can pick their industry and launch the 48-hour demo.