
# Phone Number Setup Wizard & Carrier Forwarding Guide

## What We're Building

A comprehensive **Phone Number Setup Wizard** that walks companies through all 4 options for connecting their existing phone number to the AI receptionist system, plus updates to the Missed Call Settings page so the system auto-configures the correct routing mode based on how the number is set up.

---

## The 4 Options

| Option | How It Works | Best For |
|---|---|---|
| **1. Conditional Call Forwarding (CFNA)** | Carrier rings business phone first; forwards to AI only on no-answer/busy | Companies who want to keep their number AND answer calls themselves first |
| **2. Number Porting** | Transfer existing number to SignalWire permanently | Cleanest setup -- full control over Ring First logic and SMS |
| **3. Unconditional Forwarding** | All calls forward from carrier to SignalWire immediately | Companies okay with AI handling 100% of calls but want to keep carrier |
| **4. New AI Number** | Use the SignalWire number as-is, update listings | New businesses or those okay with a new number |

---

## Changes

### 1. New Component: PhoneNumberSetupWizard

A step-by-step wizard component with:
- **Option selector** (4 cards with icons explaining each approach)
- **Carrier-specific instructions** for Conditional Forwarding (AT&T, Verizon, T-Mobile, Comcast/Xfinity, Spectrum, RingCentral, Grasshopper, generic VoIP)
  - Includes exact dial codes (e.g., `*61*[SignalWire#]*11*20#` for AT&T CFNA with 20-second delay)
- **Number porting guide** with timeline expectations and what to tell SignalWire support
- **Unconditional forwarding codes** per carrier
- **"New number" flow** with tips on updating Google Business Profile, Yelp, social media, etc.
- Auto-recommendation of the correct `call_routing_mode`:
  - Conditional Forwarding --> `ai_direct` (carrier already rang the phone)
  - Number Porting --> `ring_first` (SignalWire controls the ring)
  - Unconditional Forwarding --> `ai_direct` (all calls go straight to AI)
  - New AI Number --> either mode (user's choice)

### 2. Update MissedCallSettings.tsx

- Add a **"How is your number connected?"** selector above the routing mode:
  - Conditional Forwarding / Ported to SignalWire / Unconditional Forwarding / New AI Number
- When "Conditional Forwarding" is selected, auto-set `call_routing_mode` to `ai_direct` and show an info box explaining why (the carrier already performed the ring delay)
- When "Ported" is selected, default to `ring_first` and show the business phone / timeout controls
- Add a link to the Phone Number Setup Wizard for companies that haven't configured yet

### 3. Database: Add `phone_number_setup_type` Column

Add a new column to the `companies` table:
- `phone_number_setup_type` (text, nullable): `'conditional_forwarding'` | `'ported'` | `'unconditional_forwarding'` | `'new_number'`
- This persists the company's choice and drives smart defaults in MissedCallSettings

### 4. Update SignalWireSetupGuide.tsx

- Add a new accordion step (after "Purchase a Phone Number") titled **"Connect Your Existing Business Number"**
- Links to the Phone Number Setup Wizard component
- Brief summary of all 4 options with a recommendation

### 5. Update PlatformGuides.tsx

- Add a "Phone Number Setup" guide section under the Voice/SMS category
- Include carrier-specific instructions and the option comparison table

### 6. Update AIHelpCenter System Prompt

- Add phone number setup FAQ entries:
  - "How do I connect my existing phone number?"
  - "Do I need to change my phone number?"
  - "What is conditional call forwarding?"
  - "How do I port my number to SignalWire?"

---

## Technical Details

### New Files
- `src/components/company/PhoneNumberSetupWizard.tsx` -- The main wizard component

### Modified Files
| File | Change |
|---|---|
| `src/components/company/MissedCallSettings.tsx` | Add setup type selector, smart routing defaults, wizard link |
| `src/components/integrations/SignalWireSetupGuide.tsx` | Add accordion step for existing number connection |
| `src/pages/PlatformGuides.tsx` | Add phone number setup guide section |
| `src/components/help/AIHelpCenter.tsx` | Add phone setup FAQ to system prompt |

### Database Migration
```sql
ALTER TABLE public.companies
  ADD COLUMN IF NOT EXISTS phone_number_setup_type text;
```

### Carrier Dial Codes (embedded in wizard)

**Conditional Forwarding (No Answer):**
- AT&T: `*61*[number]*11*[seconds]#`
- Verizon: `*71[number]`
- T-Mobile: `**61*[number]*11*20#`
- Comcast/Xfinity: `*92[number]`
- Spectrum: via account portal
- RingCentral: Admin Portal > Call Handling > Forwarding Rules
- Grasshopper: Settings > Call Forwarding > Add Rule

**Unconditional Forwarding (All Calls):**
- AT&T: `*21*[number]#`
- Verizon: `*72[number]`
- T-Mobile: `**21*[number]#`

**Deactivation codes** included for each carrier so companies can reverse the setup.
