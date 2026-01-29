
# Implementation Plan: Complete Contact, About, Blog System & Subscription Tiers

This plan will finish the work that was interrupted multiple times.

---

## Phase 1: Create Public Pages

### 1.1 Contact Page (`src/pages/Contact.tsx`)

A professional contact page with:

**Lead Form Fields**:
- Name (required)
- Email (required, validated)
- Phone (optional)
- Company Name (optional)
- Service Interest (dropdown)
- Message (textarea)

**Contact Information**:
- Contact Person: **Charles Perez**
- Phone: **512-REP-AiAi** (512-737-2424)
- Email: **auraintercept@gmail.com**

**AI Integration**:
- ElevenLabsWidget for "Talk to Aura" voice experience
- FloatingChatWidget for text chat

---

### 1.2 About Page (`src/pages/About.tsx`)

Company profile featuring:
- Mission: Democratizing AI for service businesses
- Core Values: Reliability, Innovation, Partnership, Care
- "Born in Texas" origin story
- Call-to-action button linking to `/auth?mode=company`

---

## Phase 2: Blog System

### 2.1 Public Blog Listing (`src/pages/Blog.tsx`)

- Grid layout of published posts from `blog_posts` table
- Featured image, title, excerpt, publication date
- Click to navigate to individual post

### 2.2 Individual Blog Post (`src/pages/BlogPost.tsx`)

- Fetches post by slug from URL
- Displays full content, author, date
- Back button to blog listing

### 2.3 Admin Blog Management (`src/pages/BlogManagement.tsx`)

Platform admin-only page with:
- List of all posts (published and drafts)
- Create new post form (title, slug, content, featured image URL)
- Edit existing posts
- Toggle published/draft status
- Delete posts

---

## Phase 3: Update Auth.tsx Subscription Tiers

Replace the current 3-tier structure with the 6-tier model:

| Tier | Price | Target Audience |
|------|-------|-----------------|
| Aura Express | $197/mo | Restaurants, cafes, food trucks |
| Aura Halo | $397/mo | Salons, spas, wellness |
| Aura Core | $500/mo | AI-ready tools, no automation |
| Single-Point | $1,500/mo | Small service companies |
| Multi-Track | $3,997/mo | Growing companies with field techs |
| Aura Pro Command | $5,997/mo | Enterprise (Large Scale Business) |

---

## Phase 4: Navigation & Routing

### 4.1 Update PublicFooter.tsx

Change placeholder `#` links:
- About → `/about`
- Blog → `/blog`
- Contact → `/contact`

### 4.2 Update DashboardLayout.tsx

Add to Platform Resources section:
- "Blog Management" (FileText icon, `/dashboard/blog-management`, platform_admin only)

### 4.3 Register Routes in App.tsx

```text
/contact                        → Contact.tsx (public)
/about                          → About.tsx (public)
/blog                           → Blog.tsx (public)
/blog/:slug                     → BlogPost.tsx (public)
/dashboard/blog-management      → BlogManagement.tsx (protected, platform_admin)
```

---

## Files Summary

### New Files (5)
| File | Purpose |
|------|---------|
| `src/pages/Contact.tsx` | Public contact page with lead form |
| `src/pages/About.tsx` | Company profile page |
| `src/pages/Blog.tsx` | Public blog listing |
| `src/pages/BlogPost.tsx` | Individual article view |
| `src/pages/BlogManagement.tsx` | Admin CRUD for blog posts |

### Modified Files (4)
| File | Changes |
|------|---------|
| `src/App.tsx` | Add 5 new routes |
| `src/components/layout/PublicFooter.tsx` | Update navigation links |
| `src/components/dashboard/DashboardLayout.tsx` | Add Blog Management to sidebar |
| `src/pages/Auth.tsx` | Update to 6-tier subscription model |

---

## Technical Notes

- The `blog_posts` table already exists with RLS policies (public read, platform_admin write)
- Will use existing `ElevenLabsWidget` and `FloatingChatWidget` components
- Lead form inserts into existing `leads` table
- Tier data will be synchronized with `documentationConfig.ts`
