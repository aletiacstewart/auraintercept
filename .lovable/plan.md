
# Simplified ElevenLabs Body Parameters Setup Guide

## Problem
The current guide for body parameters is confusing because:
1. The table format doesn't match what users see in ElevenLabs Form Mode
2. "Type" and "Value" columns are hard to understand
3. Users don't know exactly which fields to fill and what to select from dropdowns
4. The difference between "Value" (constant) and "LLM Prompt" (AI-filled) isn't clear

## Solution
Replace the complex table with a simple, step-by-step card-based layout that shows each parameter as a separate visual "form field" - exactly mimicking what users will see in ElevenLabs.

## UI Changes

### New Parameter Card Design
Each body parameter will be displayed as a visual card with:
- Clear numbered step (1, 2, 3...)
- Field name with copy button
- "Type" dropdown indicator (showing exactly what to select)
- For "Value" type: the exact value to paste
- For "LLM Prompt" type: a simple explanation like "AI will fill this from conversation"

### Visual Layout Per Parameter

```text
┌──────────────────────────────────────────────────┐
│ Parameter 1                                      │
├──────────────────────────────────────────────────┤
│ Identifier: [action]                    [Copy]   │
│ Description: [The action to perform]    [Copy]   │
│ Required: ☑ Yes                                  │
│ Type: Select "Value" from dropdown               │
│ Value: [get_services]                   [Copy]   │
└──────────────────────────────────────────────────┘
```

For LLM Prompt parameters:
```text
┌──────────────────────────────────────────────────┐
│ Parameter 3                                      │
├──────────────────────────────────────────────────┤
│ Identifier: [service_type]              [Copy]   │
│ Description: [The service type...]      [Copy]   │
│ Required: ☑ Yes                                  │
│ Type: Select "LLM Prompt" from dropdown          │
│ (AI fills this automatically from conversation)  │
└──────────────────────────────────────────────────┘
```

### Key Visual Improvements
1. Remove the confusing table format entirely
2. Add clear "Step X of Y" indicators for each parameter
3. Show exact dropdown selections with colored badges
4. Add a "Quick Reference" legend at the top explaining Value vs LLM Prompt
5. Include visual icons to differentiate fixed values vs AI-filled

### Updated Data Structure
The `bodyParams` will be enhanced with:
- `identifier` - the field name to enter
- `description` - the description text
- `required` - boolean for the checkbox
- `valueType` - "value" or "llm_prompt" (matching exact ElevenLabs terminology)
- `value` - only for "value" type parameters

## Files to Modify

**src/components/integrations/ElevenLabsSetupGuide.tsx**
- Update `getToolConfigs` to use clearer property names
- Replace the body parameters table with individual parameter cards
- Add a legend/key section explaining "Value" vs "LLM Prompt"
- Style each parameter as a distinct visual card
- Make copy buttons more prominent for each field
- Add "Required" checkbox indicator

---

## Technical Details

### Parameter Card Component Structure
```tsx
// New structure for each body parameter
{
  identifier: 'action',
  description: 'The action to perform',
  required: true,
  valueType: 'value', // or 'llm_prompt'
  value: 'get_services' // only when valueType is 'value'
}
```

### Visual Styling
- Parameter cards with `border rounded-lg p-4`
- Clear "Step" badge: `bg-primary text-primary-foreground`
- "Value" type badge: `bg-blue-100 text-blue-800`
- "LLM Prompt" type badge: `bg-purple-100 text-purple-800`
- Each field on its own row for clarity
