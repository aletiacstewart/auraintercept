## Video Blog Page for Aura Intercept Promo Videos

Create a new public page `/video-blog` that showcases promo videos, starting with the uploaded video from Charles Perez (Owner).

### What to build

1. **Upload the video as a Lovable Asset**
   - Upload `user-uploads://2026-07-11-123239750.mp4` via `lovable-assets create` → `src/assets/charles-perez-promo.mp4.asset.json`

2. **New page: `src/pages/VideoBlog.tsx`**
   - Uses `PublicHeader` + `PublicFooter` (same shell as `/blog`)
   - `SEO` tags (title: "Video Blog | Aura Intercept", description, path `/video-blog`)
   - Hero section matching `/blog` styling (gradient bg, H1 "Aura Intercept Video Blog", subtitle)
   - Grid of video cards (responsive: 1 / 2 / 3 columns)
   - Each card shows:
     - Video thumbnail (native `<video>` with `preload="metadata"` so first frame shows, `object-contain` in a 16:9 container with dark bg — so the **entire video is visible, not cropped**)
     - Title, author/role line ("Charles Perez — Owner"), short description, date
     - Play overlay icon
   - Clicking a card opens a **modal viewer** (shadcn `Dialog`) with a larger `<video controls autoPlay>` sized to fit viewport (`max-h-[85vh]`, `object-contain`, black letterbox background)
   - Videos defined in a local `PROMO_VIDEOS` array (no DB) — easy to add more later

3. **Video entry (first one)**
   - Title: "Aura Intercept in Action"
   - Author: "Charles Perez — Owner"
   - Date: today
   - Source: the uploaded asset URL

4. **Routing**
   - Add `<Route path="/video-blog" element={<VideoBlog />} />` in `src/App.tsx`
   - Add a "Video Blog" link in `PublicFooter` (and optionally next to Blog in header if there's room — will confirm placement matches existing nav)

### Technical notes

- Use `AspectRatio` (shadcn) or `aspect-video` Tailwind class with `object-contain` + `bg-black` to guarantee full video visibility regardless of source aspect ratio.
- Modal: shadcn `Dialog` with `DialogContent` widened (`max-w-5xl`), video autoplays on open and pauses/unmounts on close.
- No DB / edge function changes — pure frontend page, matching the codebase's `/blog` styling conventions.
- Uses design tokens only (no hardcoded colors) per Cyber-Sentry standard.

### Out of scope

- No admin UI to upload new promo videos (videos added by editing the `PROMO_VIDEOS` array + running `lovable-assets create`). Can be added later if wanted.
