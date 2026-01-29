
# Demo Accounts Documentation Page

## Overview
Create a new "Demo Accounts" page under Platform Resources in the dashboard, visible only to platform admins. This page will contain all demo account credentials and a comprehensive guide for conducting proper demos.

---

## Implementation Details

### 1. Create New Page: `src/pages/DemoAccounts.tsx`

A documentation page containing two main sections:

**Section A: Demo Account Credentials**

| Tier | Company Admin | Employee | Customer | Password |
|------|--------------|----------|----------|----------|
| **Aura Express** | companyxprs@demo.com | employeexprs@demo.com | — | aidemo*! |
| **Aura Halo** | companyhalo@demo.com | employeehalo@demo.com | — | aidemo*! |
| **Single-Point** | companysolo@demo.com | employeesolo@demo.com | customersolo@demo.com | aidemo*! |
| **Multi-Track** | companymulti@demo.com | employeemulti@demo.com | customermulti@demo.com | aidemo*! |
| **Command** | companycmd@demo.com | employeecmd@demo.com | customercmd@demo.com | aidemo*! |

**Section B: Demo Guide**

How-to guide with step-by-step instructions for:
- Company onboarding demo walkthrough
- Employee onboarding demo walkthrough
- Key features to highlight per tier
- Common demo scenarios and talking points

### 2. Update Navigation: `src/components/dashboard/DashboardLayout.tsx`

Add new navigation item under "Platform Resources":
- Label: "Demo Accounts"
- Icon: Users icon
- Route: `/dashboard/demo-accounts`
- Roles: `['platform_admin']` only

### 3. Add Route: `src/App.tsx`

Register the new route:
- Import `DemoAccounts` component
- Add protected route at `/dashboard/demo-accounts`

---

## Demo Guide Content

### Company Onboarding Demo Steps

1. **Login Setup**
   - Navigate to /auth
   - Select "Company Admin" login type
   - Use demo credentials for the tier being demonstrated

2. **Dashboard Overview**
   - Show main dashboard with KPIs and stats
   - Highlight the DashboardSetupNav progress bar
   - Explain tier-specific features available

3. **Quick Setup Walkthrough**
   - Branding configuration (logo, colors)
   - Business hours setup
   - Service catalog creation
   - FAQ setup for AI accuracy

4. **AI Agents Demonstration**
   - Navigate to AI Agents Hub
   - Show enabled vs locked agents based on tier
   - Demonstrate Talk to Aura voice interaction
   - Show Message Aura text interaction

5. **Integration Points**
   - Review 3rd party integration requirements
   - Show Twilio, ElevenLabs, Stripe setup areas
   - Calendar sync demonstration (if applicable)

### Employee Onboarding Demo Steps

1. **Employee Login**
   - Use employee demo credentials
   - Show limited dashboard view vs admin

2. **Mobile App Experience**
   - Demonstrate technician dashboard
   - Show job assignments and calendar
   - Field operations check-in flow

3. **Role-Specific Features**
   - Availability management
   - Appointment viewing
   - Customer interaction tools

---

## File Changes Summary

| File | Change Type |
|------|-------------|
| `src/pages/DemoAccounts.tsx` | Create new |
| `src/components/dashboard/DashboardLayout.tsx` | Add nav item |
| `src/App.tsx` | Add route |
