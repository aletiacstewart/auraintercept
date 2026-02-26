
## What Needs to Be Added to Company Signup

The current Auth.tsx already shows 3rd-party cost cards, but is missing two critical disclosure sections that companies must acknowledge **before** creating their account:

### 1. Required Document Checklist Section (left column, company mode)
Add a collapsible "Required Documents & Setup Checklist" section showing what companies need to have ready:

**A2P 10DLC Registration (SMS Compliance)**
- Business legal name, EIN/Tax ID, business address
- Business type (LLC, Corp, Sole Proprietor)
- Use-case description (what SMS messages will say)
- Estimated monthly SMS volume
- Sample message content
- Brand registration ($4 one-time) + Campaign registration ($15 one-time) + $10/mo recurring

**SignalWire Setup**
- Create account at signalwire.com
- Purchase a phone number (~$2/mo)
- Submit A2P 10DLC campaign through their portal
- Costs: Usage-based ($0.004/SMS, $0.006/min voice)

**ElevenLabs Setup**
- Create account at elevenlabs.io
- API key for voice synthesis
- Select/clone a voice for your AI agent
- Costs: Free (10k chars) → $5/mo (30k) → $99/mo (500k)

**Resend Setup**
- Create account at resend.com
- Verify your sending domain (DNS records)
- API key for transactional emails
- Costs: Free (3k/mo) → $20/mo (50k)

**Knowledge Base Documents (for AI to work)**
- Business description / About Us content
- Service list with descriptions and pricing
- FAQ document (common customer questions)
- Business hours and holiday schedule
- Service area / zip codes

### 2. Pre-Signup Acknowledgment Checkboxes
Add required checkboxes on the signup form (company mode only) that must all be checked before the "Start Free Trial" button is enabled:

1. ☐ I understand A2P 10DLC registration is required for SMS and takes 2-4 weeks for approval
2. ☐ I acknowledge 3rd-party service costs (SignalWire, ElevenLabs, Resend) are separate from my subscription
3. ☐ I will provide knowledge base documents during onboarding for the AI to function properly
4. ☐ I have read and agree to the Terms of Service and Privacy Policy

### Implementation Plan

**File: `src/pages/Auth.tsx`**
1. Add a new `SignupRequirementsAccordion` inline section in the left column (company mode) below the 3rd-party cost grid — uses existing `Accordion` from Radix.
2. Add 4 new acknowledgment checkboxes state: `const [setupAcknowledged, setSetupAcknowledged] = useState({a2p: false, costs: false, knowledgeBase: false})`
3. Gate the signup button: disabled until `termsAgreed && setupAcknowledged.a2p && setupAcknowledged.costs && setupAcknowledged.knowledgeBase`
4. The acknowledgment checkboxes render inside the signup form (TabsContent value="signup") for company mode only — above the submit button

**File: `src/components/subscription/ThirdPartyCostDisclosureDialog.tsx`**
5. Add A2P 10DLC as a `required: true` cost item (currently missing from the checkout disclosure dialog)

No database changes needed.
