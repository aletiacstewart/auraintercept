
# Complete Implementation Plan: Contact, About, Blog, and Subscription Tiers

## Current Status

The previous implementation attempts were interrupted multiple times, resulting in:
- **Database**: `blog_posts` table created successfully
- **Missing Pages**: Contact.tsx, About.tsx, Blog.tsx, BlogPost.tsx, BlogManagement.tsx never created
- **Footer**: Still has placeholder `#` links for About and Blog  
- **Routes**: None of the new routes were registered
- **Auth.tsx**: Still shows old tier names (starter/professional/enterprise) instead of the 6-tier structure

---

## Implementation Plan

### 1. Create Contact Page (`src/pages/Contact.tsx`)

A professional contact page with:

**Lead Form**:
- Name, Email, Phone, Company Name (optional)
- Service Interest dropdown
- Message textarea
- Zod validation with toast feedback
- Inserts into existing `leads` table

**Contact Information**:
- Contact Person: Charles Perez
- Phone: 512-REP-AiAi (512-737-2424)
- Email: auraintercept@gmail.com

**AI Integration**:
- ElevenLabsWidget for "Talk to Aura" voice
- FloatingChatWidget for text chat

---

### 2. Create About Page (`src/pages/About.tsx`)

Company profile page featuring:
- Mission statement: Democratizing AI for service businesses
- Core values: Reliability, Innovation, Partnership, Care
- "Born in Texas" origin story
- Call-to-action linking to signup

---

### 3. Create Blog System

**Public Pages**:

| File | Purpose |
|------|---------|
| `src/pages/Blog.tsx` | Grid listing of published posts |
| `src/pages/BlogPost.tsx` | Individual article view by slug |

**Admin Management**:

| File | Purpose |
|------|---------|
| `src/pages/BlogManagement.tsx` | Platform admin CRUD for posts |

Features:
- Create/Edit/Delete posts with rich text content
- Toggle published status
- Featured image URL support
- Auto-generated slugs from titles

---

### 4. Update Navigation

**Footer (`src/components/layout/PublicFooter.tsx`)**:
- Link "About" to `/about`
- Link "Blog" to `/blog`
- Link "Contact" to `/contact`

**Dashboard (`src/components/dashboard/DashboardLayout.tsx`)**:
- Add "Blog Management" under Platform Resources
- Restrict to `platform_admin` role only

---

### 5. Update Auth.tsx Subscription Tiers

Replace the current 3-tier selection (starter/professional/enterprise) with the actual 6-tier structure:

| Tier | Price | Best For |
|------|-------|----------|
| Aura Express | $197/mo | Restaurants, cafes, food trucks |
| Aura Halo | $397/mo | Salons, spas, wellness businesses |
| Aura Core | $500/mo | AI-ready tools without automation |
| Single-Point | $1,500/mo | Small service companies |
| Multi-Track | $3,997/mo | Growing companies with field techs |
| Command | Custom | Enterprise operations |

Update the `selectedTier` state type and tier selection UI accordingly.

---

### 6. Register Routes (`src/App.tsx`)

Add the following routes:

```text
/contact        -> Contact.tsx (public)
/about          -> About.tsx (public)
/blog           -> Blog.tsx (public)
/blog/:slug     -> BlogPost.tsx (public)
/dashboard/blog-management -> BlogManagement.tsx (protected, platform_admin)
```

---

## Files to Create

| File | Type |
|------|------|
| `src/pages/Contact.tsx` | New |
| `src/pages/About.tsx` | New |
| `src/pages/Blog.tsx` | New |
| `src/pages/BlogPost.tsx` | New |
| `src/pages/BlogManagement.tsx` | New |

## Files to Modify

| File | Changes |
|------|---------|
| `src/App.tsx` | Add 5 new routes |
| `src/components/layout/PublicFooter.tsx` | Update About/Blog/Contact links |
| `src/components/dashboard/DashboardLayout.tsx` | Add Blog Management nav item |
| `src/pages/Auth.tsx` | Replace tier selection with 6-tier structure |

---

## Technical Notes

- The `blog_posts` table already exists with proper RLS policies (public read, platform_admin write)
- Will use existing `ElevenLabsWidget` and `FloatingChatWidget` components for Contact page
- Will import tier data from `src/lib/documentationConfig.ts` to ensure consistency
- Lead form will insert into existing `leads` table
