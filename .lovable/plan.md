

# Update How-To Guides + Service-Aware Content for Virtual, Beauty/Salon, and Real Estate Workflows

## Overview

This update addresses two things:

1. **Update the How-To Guide content** in `AgentHowToGuide.tsx` to include virtual/video session workflows, phone call appointment details, and industry-specific guidance for beauty/salon and real estate businesses.

2. **Whether to add a new job role** -- the answer is **no new job role is needed**. The existing `technician` job type already handles all service professionals (stylists, agents, therapists). The system differentiates behavior through the `delivery_type` on appointments and `industry_vertical` on companies, not through separate job roles. Adding a new role would break the booking engine's availability logic (which filters by `technician` job type) and create unnecessary complexity.

## What Changes

### 1. Update Field Ops How-To Guide (FIELD_OPS_GUIDES)

Add new guide entries and update existing ones:

- **New: "Start Virtual Session"** -- Steps for accepting a virtual job, receiving the meeting link, and joining the Google Meet session
- **New: "Phone Call Appointments"** -- Steps for accepting a phone call job, when the system sends call details to the customer, and completing a phone session
- **Update: "Accept Job"** -- Add note that for virtual appointments, a Google Meet link is automatically generated and sent to the customer upon acceptance
- **Update: "Get Directions"** -- Add tip clarifying this applies to in-person appointments only (not virtual or at-business)
- **Update: "Mark En Route"** -- Add tip noting this step is skipped for virtual and at-business appointments

### 2. Update Customer Portal How-To Guide (CUSTOMER_ENGAGEMENT_GUIDES)

- **New: "Join Video Session"** -- Steps for finding the meeting link in confirmations, joining Google Meet, and what to expect
- **Update: "Book Appointment"** -- Mention that virtual services are available and meeting details are sent after staff confirms
- **Update: "Track Appointment"** -- Update language from "technician approaches" to "service professional" and mention virtual session status tracking

### 3. Update Dispatch How-To Guide (DISPATCH_FIELD_OPS_GUIDES)

- **Update: "Status Legend"** -- Add virtual session statuses (e.g., "Virtual -- no travel steps shown")
- **Update: "Assign Technician"** -- Change language to "Assign Staff" with a tip noting terminology adapts by industry (Stylist, Agent, Therapist)

### 4. Update Business Ops How-To Guide (BUSINESS_OPS_BASE_GUIDES)

- **Update: "Appts" guide** -- Add step/tip about delivery type (virtual vs in-person) and how meeting links are auto-generated

### 5. Update Console Titles

- Change `fieldops` title from "How to use Technician-Field Ops Console and App" to "How to use Field Ops Console and App" (removing hardcoded "Technician" to be industry-neutral)

## Why No New Job Role

The current architecture already handles this cleanly:

- The `technician` job type in `employee_job_assignments` means "service professional who performs appointments" -- whether that's an HVAC tech, a stylist, a massage therapist, or a real estate agent
- The `delivery_type` on services/appointments controls the workflow (virtual vs in-person vs at-business)
- The `industry_vertical` on companies controls the terminology (Technician vs Stylist vs Agent)
- Adding a separate `stylist` or `agent` job type would require duplicating all booking, availability, and dispatch logic

The how-to guide updates will make this distinction clear to users by using inclusive language like "service professional" alongside industry-specific examples.

## Technical Details

### File to modify:
- `src/components/ai/chat/AgentHowToGuide.tsx`

### Specific changes:

**FIELD_OPS_GUIDES array** (lines 278-408):
- Add "Start Virtual Session" guide entry with Video icon
- Add "Phone Call Session" guide entry with Phone icon  
- Update "Accept Job" tips to mention virtual meeting link generation
- Update "Get Directions" tips about in-person only
- Update "Mark En Route" tips about in-person only
- Update "Arrive & Start Job" tips to mention virtual equivalent

**CUSTOMER_ENGAGEMENT_GUIDES array** (lines 159-275):
- Add "Join Video Session" guide entry
- Update "Book Appointment" steps to mention virtual option
- Update "Track Appointment" to use "service professional" language and mention virtual status

**DISPATCH_FIELD_OPS_GUIDES array** (lines 791-896):
- Update "Status Legend" to include virtual session info
- Update "Assign Technician" label and language to be industry-neutral

**BUSINESS_OPS_BASE_GUIDES array** (lines 411-529):
- Update "Appts" guide to mention delivery types

**CONSOLE_TITLES** (line 914):
- Change fieldops title to remove "Technician-"

### No database changes needed
### No new dependencies needed
### No breaking changes -- only content/text updates

