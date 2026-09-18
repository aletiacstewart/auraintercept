import { createClient } from "npm:@supabase/supabase-js@2";
import {
  deleteProfile,
  ensureProfile,
  fetchProfile,
  generateConnectUrl,
  profileUsernameFor,
  publishViaUploadPost,
} from "../_shared/upload-post.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const admin = createClient(supabaseUrl, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

    // --- Identify the caller -------------------------------------------------
    const authHeader = req.headers.get("Authorization") ?? "";
    const anon = createClient(supabaseUrl, Deno.env.get("SUPABASE_ANON_KEY")!, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: userData } = await anon.auth.getUser();
    const user = userData?.user;
    if (!user) return json({ error: "Not signed in" }, 401);

    const body = await req.json().catch(() => ({}));
    const action: string = body.action ?? "status";

    const { data: profile } = await admin
      .from("profiles")
      .select("company_id")
      .eq("id", user.id)
      .maybeSingle();

    const { data: roles } = await admin.from("user_roles").select("role").eq("user_id", user.id);
    const isPlatformAdmin = (roles ?? []).some((r: any) => r.role === "platform_admin");
    const companyId: string | null = body.companyId ?? profile?.company_id ?? null;

    if (!companyId) return json({ error: "No company workspace found for this account" }, 400);
    if (!isPlatformAdmin && profile?.company_id !== companyId) {
      return json({ error: "Not allowed for this company" }, 403);
    }

    // --- Load integration row -----------------------------------------------
    const { data: integ } = await admin
      .from("tenant_integrations")
      .select(
        "id, upload_post_api_key, upload_post_profile, upload_post_enabled, upload_post_auto_publish, upload_post_accounts, upload_post_synced_at",
      )
      .eq("company_id", companyId)
      .maybeSingle();

    const apiKey: string | null =
      (integ?.upload_post_api_key as string | null) || Deno.env.get("UPLOAD_POST_API_KEY") || null;
    const username = (integ?.upload_post_profile as string | null) || profileUsernameFor(companyId);

    const saveIntegration = async (patch: Record<string, unknown>) => {
      if (integ?.id) {
        const { error } = await admin.from("tenant_integrations").update(patch).eq("company_id", companyId);
        if (error) throw error;
      } else {
        const { error } = await admin.from("tenant_integrations").insert({ company_id: companyId, ...patch });
        if (error) throw error;
      }
    };

    const requireKey = () =>
      apiKey ? null : json({ error: "No Upload-Post API key is configured yet", needsApiKey: true }, 400);

    switch (action) {
      // ---------------------------------------------------------------- status
      case "status": {
        if (!apiKey) {
          return json({
            configured: false,
            needsApiKey: true,
            enabled: false,
            autoPublish: false,
            accounts: [],
            usingPlatformKey: false,
          });
        }
        const res = await fetchProfile(apiKey, username);
        const social = res.ok ? res.body?.profile?.social_accounts ?? res.body?.social_accounts ?? {} : {};
        const accounts = Object.entries(social)
          .filter(([, v]) => v && (typeof v === "string" ? v.length > 0 : true))
          .map(([platform, v]: [string, any]) => ({
            platform,
            username: typeof v === "string" ? v : v?.username ?? v?.display_name ?? null,
          }));

        if (res.ok) {
          await saveIntegration({
            upload_post_profile: username,
            upload_post_accounts: social,
            upload_post_synced_at: new Date().toISOString(),
          }).catch((e) => console.error("[upload-post] status save failed", e));
        }

        return json({
          configured: true,
          profileExists: res.ok,
          profile: username,
          enabled: integ?.upload_post_enabled ?? false,
          autoPublish: integ?.upload_post_auto_publish ?? false,
          accounts,
          usingPlatformKey: !integ?.upload_post_api_key,
          lastSyncedAt: integ?.upload_post_synced_at ?? null,
          providerError: res.ok ? undefined : res.body,
        });
      }

      // ------------------------------------------------------------- save_key
      case "save_key": {
        const key: string = (body.apiKey ?? "").trim();
        if (!key) return json({ error: "Enter your Upload-Post API key" }, 400);
        await saveIntegration({ upload_post_api_key: key, upload_post_profile: username });
        const created = await ensureProfile(key, username);
        return json({ success: true, profile: username, profileReady: created.ok });
      }

      // ---------------------------------------------------------- connect_link
      case "connect_link": {
        const missing = requireKey();
        if (missing) return missing;
        await ensureProfile(apiKey!, username);
        const res = await generateConnectUrl(apiKey!, username, {
          redirectUrl: body.redirectUrl,
          logoUrl: body.logoUrl,
          platforms: body.platforms,
        });
        if (!res.ok) {
          return json({ error: "Upload-Post rejected the request", details: res.body }, res.status);
        }
        await saveIntegration({ upload_post_profile: username, upload_post_enabled: true });
        return json({ success: true, url: res.body?.access_url, expiresIn: res.body?.duration });
      }

      // -------------------------------------------------------------- settings
      case "settings": {
        const patch: Record<string, unknown> = {};
        if (typeof body.enabled === "boolean") patch.upload_post_enabled = body.enabled;
        if (typeof body.autoPublish === "boolean") patch.upload_post_auto_publish = body.autoPublish;
        if (Object.keys(patch).length === 0) return json({ error: "Nothing to update" }, 400);
        await saveIntegration(patch);
        return json({ success: true, ...patch });
      }

      // ------------------------------------------------------------ disconnect
      case "disconnect": {
        if (apiKey) await deleteProfile(apiKey, username).catch(() => null);
        await saveIntegration({
          upload_post_enabled: false,
          upload_post_auto_publish: false,
          upload_post_accounts: {},
          upload_post_synced_at: null,
        });
        return json({ success: true });
      }

      // --------------------------------------------------------------- publish
      case "publish": {
        const missing = requireKey();
        if (missing) return missing;
        const platforms: string[] = body.platforms ?? [];
        const content: string = body.content ?? "";
        if (!content.trim()) return json({ error: "Nothing to post — the content is empty" }, 400);

        const result = await publishViaUploadPost({
          apiKey: apiKey!,
          username,
          platforms,
          content,
          imageUrl: body.imageUrl ?? null,
          scheduledDate: body.scheduledDate ?? null,
          externalId: body.externalId,
        });
        return json(result, result.success ? 200 : result.status || 502);
      }

      default:
        return json({ error: `Unknown action: ${action}` }, 400);
    }
  } catch (error) {
    console.error("[upload-post] error:", error);
    return json({ error: error instanceof Error ? error.message : "Unknown error" }, 500);
  }
});
