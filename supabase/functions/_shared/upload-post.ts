// Shared Upload-Post API helpers.
// Docs: https://docs.upload-post.com  — auth header is `Authorization: Apikey <key>`
const BASE = "https://api.upload-post.com";

export interface UploadPostAccount {
  platform: string;
  username?: string;
  display_name?: string;
  connected: boolean;
}

/** Map Aura platform ids to Upload-Post platform ids. */
export function toUploadPostPlatform(platform: string): string | null {
  const map: Record<string, string> = {
    facebook: "facebook",
    instagram: "instagram",
    linkedin: "linkedin",
    tiktok: "tiktok",
    youtube: "youtube",
    threads: "threads",
    x: "x",
    twitter: "x",
    google_business: "google_business",
    pinterest: "pinterest",
  };
  return map[platform] ?? null;
}

/** Platforms that cannot accept a text-only post. */
const REQUIRES_MEDIA = new Set(["instagram", "tiktok", "youtube", "pinterest"]);

export function profileUsernameFor(companyId: string): string {
  return `aura_${companyId.replace(/-/g, "")}`;
}

async function call(
  apiKey: string,
  path: string,
  init: RequestInit = {},
): Promise<{ ok: boolean; status: number; body: any }> {
  const res = await fetch(`${BASE}${path}`, {
    ...init,
    headers: { Authorization: `Apikey ${apiKey}`, ...(init.headers || {}) },
  });
  const text = await res.text();
  let body: any = text;
  try {
    body = JSON.parse(text);
  } catch {
    // keep raw text
  }
  if (!res.ok) {
    console.error(`[upload-post] ${path} failed [${res.status}]: ${text}`);
  }
  return { ok: res.ok, status: res.status, body };
}

/** Create the per-company Upload-Post profile if it does not exist yet. */
export async function ensureProfile(apiKey: string, username: string) {
  const existing = await call(apiKey, `/api/uploadposts/users/${encodeURIComponent(username)}`, {
    method: "GET",
  });
  if (existing.ok) return { ok: true, body: existing.body };

  const created = await call(apiKey, "/api/uploadposts/users", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username }),
  });
  return { ok: created.ok, status: created.status, body: created.body };
}

/** Build the hosted "connect your accounts" URL for this company. */
export async function generateConnectUrl(
  apiKey: string,
  username: string,
  opts: { redirectUrl?: string; title?: string; description?: string; logoUrl?: string; platforms?: string[] } = {},
) {
  const res = await call(apiKey, "/api/uploadposts/users/generate-jwt", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      username,
      redirect_url: opts.redirectUrl,
      logo_image: opts.logoUrl,
      redirect_button_text: "Back to Aura Intercept",
      connect_title: opts.title ?? "Connect your social accounts",
      connect_description:
        opts.description ?? "Aura Intercept will publish approved posts to the accounts you connect here.",
      platforms: opts.platforms,
    }),
  });
  return res;
}

/** Read the connected social accounts for a profile. */
export async function fetchProfile(apiKey: string, username: string) {
  return await call(apiKey, `/api/uploadposts/users/${encodeURIComponent(username)}`, { method: "GET" });
}

export async function deleteProfile(apiKey: string, username: string) {
  return await call(apiKey, `/api/uploadposts/users/${encodeURIComponent(username)}`, { method: "DELETE" });
}

export interface PublishArgs {
  apiKey: string;
  username: string;
  platforms: string[];
  content: string;
  imageUrl?: string | null;
  scheduledDate?: string | null;
  externalId?: string;
}

export interface PublishOutcome {
  success: boolean;
  status: number;
  error?: string;
  body?: any;
  platforms: string[];
}

/** Publish (or schedule) one post to one or more platforms through Upload-Post. */
export async function publishViaUploadPost(args: PublishArgs): Promise<PublishOutcome> {
  const mapped = args.platforms
    .map(toUploadPostPlatform)
    .filter((p): p is string => !!p)
    .filter((p) => (args.imageUrl ? true : !REQUIRES_MEDIA.has(p)));

  if (mapped.length === 0) {
    return {
      success: false,
      status: 400,
      platforms: [],
      error: args.imageUrl
        ? "No supported platforms selected"
        : "These platforms need an image or video — add media before publishing",
    };
  }

  const form = new FormData();
  form.append("user", args.username);
  for (const p of mapped) form.append("platform[]", p);
  form.append("title", args.content.slice(0, 2900));
  if (args.scheduledDate) form.append("scheduled_date", args.scheduledDate);
  if (args.externalId) form.append("external_id", args.externalId);

  let path = "/api/upload_text";
  if (args.imageUrl) {
    path = "/api/upload_photos";
    form.append("photos[]", args.imageUrl);
    form.append("caption", args.content.slice(0, 2900));
  }

  const res = await call(args.apiKey, path, { method: "POST", body: form });
  const providerError =
    !res.ok
      ? typeof res.body === "string"
        ? res.body
        : res.body?.error || res.body?.message || JSON.stringify(res.body)
      : undefined;

  return {
    success: res.ok,
    status: res.status,
    body: res.body,
    platforms: mapped,
    error: providerError,
  };
}
