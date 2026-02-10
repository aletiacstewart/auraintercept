

# Fix: SWAIG Argument Parsing + Appointment Status Mismatch

## Root Cause Found

### Critical Bug: `argument.parsed` is an ARRAY, not an object

The logs prove it clearly:

```text
args=[{"service_type":"Aura Intercept Consultation","preferred_date":"2026-02-11"}]
```

SignalWire sends `argument.parsed` as an **array** containing a single object. The current code does:

```typescript
const args = body.argument?.parsed || {};
```

This assigns the raw array to `args`. Then when the functions do `args.service_type`, they get `undefined` because arrays don't have a `.service_type` property. Every SWAIG function silently fails -- no availability found, no booking possible, no services returned.

### Secondary Bug: Appointment status mismatch

The availability checker filters for `['pending', 'confirmed', 'in-progress']`, but existing appointments have status `scheduled`. This means "scheduled" appointments are invisible to the conflict checker, and the AI could double-book time slots.

## Changes

### 1. Fix argument parsing in `voice-swaig/index.ts` (line 29)

Change:
```typescript
const args = body.argument?.parsed || {};
```
To:
```typescript
const rawParsed = body.argument?.parsed;
const args = Array.isArray(rawParsed) ? (rawParsed[0] || {}) : (rawParsed || {});
```

This single fix will make ALL SWAIG functions work -- `check_availability`, `book_appointment`, `get_services`, and `transfer_call` will all receive the correct arguments.

### 2. Fix appointment status filter in `voice-swaig/index.ts` (line 134)

Change the status filter from:
```typescript
.in('status', ['pending', 'confirmed', 'in-progress'])
```
To:
```typescript
.in('status', ['pending', 'confirmed', 'in-progress', 'scheduled'])
```

This ensures scheduled appointments are included in conflict detection.

### 3. Add argument logging for debugging

After extracting args, log the raw `argument` object so we can verify the fix is working:
```typescript
console.log(`SWAIG raw argument:`, JSON.stringify(body.argument));
```

## No Database Changes

All fixes are in `voice-swaig/index.ts` only.

## Expected Results

| Issue | Before | After |
|-------|--------|-------|
| SWAIG args | `undefined` (array not unwrapped) | Correctly parsed object |
| Availability check | Fails silently, returns no slots | Returns actual available times |
| Booking | Cannot book (all fields undefined) | Books with correct customer info |
| Services query | Works (no args needed) | Still works |
| Double-booking | "scheduled" status ignored | All active statuses checked |

## What This Does NOT Fix (requires your action)

**Custom ElevenLabs voice**: The Jessica voice (`cgSgspJ2msm6clMCkdW9`) still requires your ElevenLabs API key to be added in the SignalWire dashboard. Without it, SignalWire uses its default voice. This is a dashboard setting, not a code fix.
