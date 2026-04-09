

# Add EIN/DBA/LLC/Inc Requirement to Beta & 10DLC Notices

## What changes

Update the FCC 10DLC notice on both the **Homepage** and **Sign Up page** to include that each company must provide their **EIN, DBA, LLC, or Inc** documentation so we can register them for FCC 10DLC compliance.

## Files to edit

### 1. `src/pages/Index.tsx` (~lines 969-971)
- Expand the 10DLC notice paragraph to add a sentence explaining the company registration requirement
- Add: "Each company will be required to provide their EIN, DBA, LLC, or Inc documentation so that we can register and get your business approved for FCC 10DLC compliance."

### 2. `src/pages/Auth.tsx` (~lines 734-736)
- Same addition to the compact 10DLC notice on the signup page

## Content to add (appended to existing 10DLC text)

> **Company Requirement:** Each company must provide their EIN, DBA, and LLC or Inc documentation so we can register your business for FCC 10DLC approval.

