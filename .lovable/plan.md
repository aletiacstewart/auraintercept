
# Move Blog Management Under Web Presence & Create Company Blog Page

## Overview
1. Create a new **"Web Presence"** sidebar category containing the existing Web Presence manager and Blog Management
2. Create a company-specific blog page at `/site/:subdomain/blog` that displays posts authored by users from that company
3. Add blog navigation to the SmartWebsite header/footer

---

## Technical Changes

### 1. Sidebar Reorganization (`src/components/dashboard/DashboardLayout.tsx`)

**Current State:**
- "Web Presence" is a single item under "Overview"
- "Blog Management" is under "Platform Resources"

**New Structure:**
Create a new "Web Presence" group:
```
Web Presence (group)
├── Web Presence (manager) - /dashboard/smart-website
└── Blog Management - /dashboard/blog-management
```

**Changes:**
- Remove "Web Presence" from "Overview" items
- Remove "Blog Management" from "Platform Resources" items
- Add new "Web Presence" group after "Overview" with both items

### 2. Create Company Blog Page (`src/pages/CompanyBlog.tsx`)

New page at route `/site/:subdomain/blog` that:
- Fetches the company ID from the website subdomain
- Queries blog posts where `author_id` matches profiles with that `company_id`
- Displays posts in a grid format matching the SmartWebsite styling
- Uses the company's primary color for branding
- Links back to the main SmartWebsite

### 3. Create Company Blog Post Page (`src/pages/CompanyBlogPost.tsx`)

New page at route `/site/:subdomain/blog/:slug` that:
- Displays a single blog post with full content
- Matches the SmartWebsite styling
- Has navigation back to the blog list

### 4. Add Routes (`src/App.tsx`)

Add two new public routes:
```typescript
<Route path="/site/:subdomain/blog" element={<CompanyBlog />} />
<Route path="/site/:subdomain/blog/:slug" element={<CompanyBlogPost />} />
```

### 5. Add Blog Link to SmartWebsite (`src/pages/SmartWebsite.tsx`)

Add optional blog navigation:
- Add `show_blog` toggle to website data interface
- Add "Blog" link in header navigation (next to CTA button)
- Add "Blog" link in footer

### 6. Add Blog Toggle to SmartWebsiteManager (`src/pages/SmartWebsiteManager.tsx`)

Add a switch to enable/disable the blog section on the public website.

### 7. Database Migration

Add `show_blog` column to `company_websites` table:
```sql
ALTER TABLE company_websites 
ADD COLUMN show_blog boolean DEFAULT false;
```

---

## New Files to Create

| File | Purpose |
|------|---------|
| `src/pages/CompanyBlog.tsx` | Company-specific blog listing page |
| `src/pages/CompanyBlogPost.tsx` | Company-specific single blog post page |

---

## Files to Modify

| File | Changes |
|------|---------|
| `src/components/dashboard/DashboardLayout.tsx` | Reorganize sidebar nav |
| `src/App.tsx` | Add new routes |
| `src/pages/SmartWebsite.tsx` | Add blog navigation links |
| `src/pages/SmartWebsiteManager.tsx` | Add blog toggle switch |

---

## Result

**Sidebar (Before):**
```
Overview
├── Dashboard
├── Quick Setup
├── Web Presence  ← single item
├── ...

Platform Resources
├── ...
├── Blog Management  ← here
├── ...
```

**Sidebar (After):**
```
Overview
├── Dashboard
├── Quick Setup
├── ...

Web Presence  ← new group
├── Web Presence Manager
├── Blog Management

Platform Resources
├── ...  ← Blog Management removed
```

**Public Site URLs:**
- `/site/company-name` - Main website
- `/site/company-name/blog` - Company blog listing
- `/site/company-name/blog/article-slug` - Individual blog post
