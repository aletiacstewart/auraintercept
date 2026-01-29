
# Complete Implementation Plan

## Phase 1: Create All 5 Missing Pages

### 1.1 Contact Page (`src/pages/Contact.tsx`)
- Lead form with Zod validation (name, email, phone, company, service interest, message)
- Contact info: Charles Perez, 512-737-2424, auraintercept@gmail.com
- ElevenLabsWidget + FloatingChatWidget integration
- Inserts into existing `leads` table

### 1.2 About Page (`src/pages/About.tsx`)
- Mission: "Democratizing AI for service businesses"
- Core Values: Reliability, Innovation, Partnership, Care
- "Born in Texas" origin story
- CTA button → `/auth?mode=company`

### 1.3 Blog Listing (`src/pages/Blog.tsx`)
- Grid layout fetching published posts from `blog_posts` table
- Featured image, title, excerpt, date display
- Links to individual posts at `/blog/:slug`

### 1.4 Blog Post (`src/pages/BlogPost.tsx`)
- Fetches single post by URL slug
- Full content display with author, date
- Back navigation to `/blog`

### 1.5 Blog Management (`src/pages/BlogManagement.tsx`)
- Platform admin only (uses existing RLS)
- List all posts (drafts + published)
- Create/Edit/Delete posts
- Toggle publish status

---

## Phase 2: Update Routes in App.tsx

Add imports and routes:
```text
/contact              → Contact.tsx (public)
/about                → About.tsx (public)
/blog                 → Blog.tsx (public)
/blog/:slug           → BlogPost.tsx (public)
/dashboard/blog-management → BlogManagement.tsx (protected)
```

---

## Phase 3: Update Navigation

### PublicFooter.tsx
Change placeholder links:
- `About` → `/about`
- `Blog` → `/blog`
- `Contact` → `/contact`

### DashboardLayout.tsx
Add to Platform Resources section:
```typescript
{ label: 'Blog Management', icon: FileText, href: '/dashboard/blog-management', roles: ['platform_admin'] }
```

---

## Phase 4: Update Auth.tsx Subscription Tiers

Replace current 3-tier UI with 6 tiers from `documentationConfig.ts`:

| Tier | Price | Target |
|------|-------|--------|
| Aura Express | $197/mo | Restaurants, cafes |
| Aura Halo | $397/mo | Salons, spas |
| Aura Core | $500/mo | AI tools, no automation |
| Single-Point | $1,500/mo | Small service companies |
| Multi-Track | $3,997/mo | Growing companies |
| Aura Pro Command | $5,997/mo | Enterprise |

UI will use a 2-column layout for Express/Halo/Core (entry tiers) and Single-Point/Multi-Track/Command (service tiers).

---

## Summary

| Type | Count | Files |
|------|-------|-------|
| New Files | 5 | Contact, About, Blog, BlogPost, BlogManagement |
| Modified | 4 | App.tsx, PublicFooter, DashboardLayout, Auth.tsx |

All tier data will be pulled from `documentationConfig.ts` to maintain the single source of truth.
