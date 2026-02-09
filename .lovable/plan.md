

## Fix: XML Escaping Bug Causing No Audio on Outbound Calls

### Root Cause

All TwiML `action` and `<Redirect>` URLs contain unescaped `&` characters in query parameters. In XML, `&` inside attribute values is invalid and must be written as `&amp;`. SignalWire's XML parser rejects the malformed elements, causing the `<Gather>` (and its nested `<Play>`/`<Say>`) to be silently skipped. The call falls through to `<Hangup/>`.

Example of current broken output:
```text
action="https://...voice-handler?action=outbound-response&callLogId=xxx"
                                                         ^ INVALID XML
```

### Fix

**File: `supabase/functions/voice-handler/index.ts`**

Create a helper function to escape URLs for use in XML attributes, and apply it to every URL used in `action=""` attributes and `<Redirect>` text content throughout the file.

```typescript
function escapeXmlAttr(url: string): string {
  return url.replace(/&/g, '&amp;');
}
```

Apply to all TwiML URL references across these handler functions:
- `handleIncoming` -- `gatherUrl`, `timeoutUrl` in `action` and `<Redirect>`
- `handleOutbound` -- `responseUrl` in `action` (both the Play and Say paths)
- `handleOutboundResponse` -- no URLs in attributes (just text content, already escaped)
- `handleIncomingGather` -- `gatherUrl`, `timeoutUrl` in `action` and `<Redirect>`
- `handleTimeout` -- `gatherUrl` in `action`

Every place a URL with query parameters appears in a TwiML attribute or element text.

### Files Modified
- `supabase/functions/voice-handler/index.ts` -- add URL escaping for all TwiML attribute URLs
