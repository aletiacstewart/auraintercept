# Reset Aura Intercept Blog & Regenerate Product-Focused Posts

## Goal
Clear every existing post from the public Aura Intercept blog (`/blog`) and replace them with a fresh set of posts specifically about Aura Intercept — the platform, its services, the 10 operatives / 24 agents, pricing/trial, and third-party integration model.

## Step 1 — Purge existing posts
Delete all rows from `blog_posts` that belong to the Aura Intercept platform blog (rows with no `company_id`, i.e. platform-level posts surfaced at `/blog`). Company-tenant blog posts stay untouched.

- One DB delete scoped to platform rows only.
- Confirm `/blog` renders the empty state after the delete.

## Step 2 — Seed a product-focused topic calendar
Replace the generic "top-10-industries" seed in `PlatformBlogPanel.tsx` with an Aura-Intercept-specific topic set. Roughly 12 posts, scheduled 2× per week starting tomorrow 9am, covering:

**Platform & positioning**
- What Aura Intercept actually is (AI operatives for service businesses)
- The 10-operative / 24-agent model, plain-English
- Cyber-Sentry design + why the "always-on control room" UI

**Operatives / AI agents (one post each on the highest-value ones)**
- Front Desk (AI receptionist + missed-call rescue)
- On The Way (dispatch + technician workflow)
- Billing (quotes, invoices, payments)
- Lead Capture & Scoring (CRM + pipeline)
- Content Engine (social + blog automation)
- Conversational Intelligence (Message Aura / Talk to Aura)
- Analytics operative (natural-language KPIs)

**Services & workflows**
- 60-Day Live Trial: how the 30d concierge + 30d live use works
- Third-party pass-through model (SignalWire, ElevenLabs, Resend, Tavily, Stripe, Upload-Post) — no markups, no bundling
- Industry template packs (28 verticals) and how packs shape prompts, forms, KPIs
- Smart Website + embedded chat/booking widgets

Each seed entry provides `topic`, `keywords`, and a staggered `scheduledFor`. Kept in the same shape the existing panel already generates.

## Step 3 — Generate the posts
Use the existing `generate-platform-blog` edge function (already wired up in `PlatformBlogPanel`) — no function changes needed. Run it once with the new seed at target word count ~900. Posts land in `blog_posts` with `published_at` in the future; the existing `publish-scheduled-blog-posts` cron flips them live on schedule.

Optionally flip the first 2–3 posts to `published = true` immediately so `/blog` isn't empty right after the purge.

## Step 4 — Verify
- Reload `/blog`: only the new Aura-Intercept posts appear.
- Spot-check one post detail page renders.
- Confirm scheduled posts have future `published_at` and `published = false`.

## Technical notes
- Files touched: `src/components/admin/PlatformBlogPanel.tsx` (new seed function).
- No schema changes, no new edge functions, no changes to `Blog.tsx` or `BlogPost.tsx`.
- Delete scope: `delete from blog_posts where company_id is null` (platform posts only). If any platform posts should be preserved, list their slugs before running.

## Out of scope
- Company/tenant blogs.
- Blog UI/design changes.
- SEO metadata changes beyond what the generator already writes.
- New categories/tags schema.

## Open question
Do you want the first few posts published immediately, or should everything roll out on the 2×/week schedule starting tomorrow?
