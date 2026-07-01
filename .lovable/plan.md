
## Fix Industry Dropdown Selection Behavior

Refactor `src/components/marketing/IndustryDropdownPicker.tsx` so the main industry categories drive the Dynamic Demo page selection and sub-types are shown as an informational list only.

### Changes

1. **Main category = the selectable item (cyan header row)**
   - Replace the current pattern (cyan `SelectLabel` header + separate "All X — see demo" `SelectItem`) with a single selectable `SelectItem` per main category, styled as the cyan header with icon + name.
   - Selecting it sets the demo pack to that main category's `demoPack`, exactly like before we added the 185 sub-categories.

2. **Sub-types = non-selectable list**
   - Render each sub-type as a plain `<div>` (not a `SelectItem`) under its main category, indented, muted text, `pointer-events-none` so it can't be clicked/highlighted.
   - Purely informational — shows users what business types fall under the main category.

3. **Remove "— see demo" text** from every row.

4. **Trigger label** always shows the currently selected main category name + emoji (no sub-type label needed since sub-types are no longer selectable).

5. **Simplify value encoding**
   - Value = main category name only (drop `sub::` encoding entirely).
   - `onBusinessTypeChange` (if still passed by parent) fires with `(null, categoryName)` since only main categories are selectable.

### Result
- Cyan main category rows in the dropdown are clickable and swap the Dynamic Demo page per selection (restoring pre-185-subcategory behavior).
- Sub-types render below each main category as a read-only reference list.
- "— see demo" text is gone.
- No changes needed to `ForBusiness.tsx` — it already reacts to `onChange(packId)`.
