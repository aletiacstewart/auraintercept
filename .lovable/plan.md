# Plan: Google Search Console Verification for auraintercept.ai

## What's happening

Google gave you a verification meta tag to add to your site's `<head>`. Once Google can fetch that tag from your live homepage, it verifies you own the site and unlocks Search Console (indexing status, search queries, sitemap submission, etc.).

**Current state (confirmed):**
- The tag `<meta name="google-site-verification" content="2T4DnI1qJ6ZDMx_UXdDXqeicCiqfWLtzZ3uqdxvhIIg" />` is **not** in `index.html` and **not** on the live site.
- The sitemap at `https://auraintercept.ai/sitemap.xml` is valid and live (8 URLs on the `auraintercept.ai` origin).
- `robots.txt` correctly references the sitemap.
- No Google Search Console connection is linked to this project yet.

## Steps

### 1. Add the verification meta tag to `index.html`
Insert the exact tag Google gave you into the `<head>` of `index.html`, alongside the existing meta tags:

```html
<meta name="google-site-verification" content="2T4DnI1qJ6ZDMx_UXdDXqeicCiqfWLtzZ3uqdxvhIIg" />
```

No other head changes — the sitemap is already valid and live, so only the tag is needed.

### 2. Link a Google Search Console connection to this project
Call `standard_connectors--connect` with the `google_search_console` connector. This opens a card where you pick or create a Google account connection (OAuth). Linking it lets Lovable verify the site via the Google API and enables ongoing monitoring (search performance snapshots, indexing status, sitemap management).

> **Important:** the Google account you connect must be the **same account** that generated the verification token you already have. If it's a different account, I'll request a fresh token through the connector and use that one instead — the flow still works, just with a different tag value.

### 3. Publish the site
Request a publish via `preview_ui--publish` so the meta tag goes live on `https://auraintercept.ai/`. The tag only needs to be live at the root URL (`https://auraintercept.ai/`) for verification.

### 4. Verify the site via the Google API
Once the tag is live, call the Site Verification API (`POST /siteVerification/v1/webResource`) through the linked connector to tell Google to fetch and confirm the tag. A 200 response means verified.

If Google returns `failedToFindMetaTag`, I'll fetch the live HTML to confirm the exact tag is present and retry — no extra publish needed once the tag is confirmed live.

### 5. Add the verified site to Search Console
Call `PUT /webmasters/v3/sites/https%3A%2F%2Fauraintercept.ai%2F` to register the verified URL-prefix property (`https://auraintercept.ai/`) in your Search Console property list.

### 6. List properties, select the verified one, and submit the sitemap
- Call `GET /webmasters/v3/sites` to confirm the new property appears.
- Submit the sitemap (`PUT /webmasters/v3/sites/{siteUrl}/sitemaps/https%3A%2F%2Fauraintercept.ai%2Fsitemap.xml`) to the selected property.

## What you'll have when done
- `https://auraintercept.ai/` verified in Google Search Console.
- Sitemap submitted for crawling.
- A linked GSC connection enabling ongoing search-performance monitoring and indexing checks through Lovable.

## Alternative (no connector)
If you'd rather not link a connector, I can just add the tag and publish — you'd then click "Verify" yourself in your own Google Search Console and submit the sitemap there manually. The connector path is recommended because it enables ongoing monitoring and automatic sitemap management.
