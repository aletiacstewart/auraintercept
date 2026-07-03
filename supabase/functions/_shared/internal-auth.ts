// Shared authorization helper for edge functions that expose privileged actions.
// Supports two calling patterns:
//   1) Internal server-to-server calls that present the SUPABASE_SERVICE_ROLE_KEY as a Bearer token.
//   2) End-user calls that present a valid Supabase user JWT — optionally required to belong to a specific company.

import { createClient, SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";

export interface AuthContext {
  isService: boolean;
  userId: string | null;
  companyId: string | null;
  roles: string[];
}

/**
 * Authorizes an incoming edge-function request.
 *
 * @param req             the incoming Request
 * @param requiredCompanyId  when provided, non-service callers must belong to this company
 * @returns { ok, ctx?, error? }
 */
export async function authorizeInternalRequest(
  req: Request,
  requiredCompanyId?: string | null,
): Promise<{ ok: true; ctx: AuthContext } | { ok: false; status: number; error: string }> {
  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;

  const authHeader = req.headers.get("authorization") ?? req.headers.get("Authorization");
  if (!authHeader || !authHeader.toLowerCase().startsWith("bearer ")) {
    return { ok: false, status: 401, error: "Unauthorized" };
  }
  const token = authHeader.slice(7).trim();

  // Fast path: service role key (server-to-server).
  if (token === serviceRoleKey) {
    return { ok: true, ctx: { isService: true, userId: null, companyId: null, roles: ["service_role"] } };
  }

  // User JWT path.
  const userClient: SupabaseClient = createClient(supabaseUrl, anonKey, {
    global: { headers: { Authorization: `Bearer ${token}` } },
  });

  const { data: claimsData, error: claimsError } = await userClient.auth.getClaims(token);
  if (claimsError || !claimsData?.claims) {
    return { ok: false, status: 401, error: "Invalid token" };
  }

  // service_role-shaped JWT (issued to backend); accept as service.
  const jwtRole = (claimsData.claims as Record<string, unknown>).role;
  if (jwtRole === "service_role") {
    return { ok: true, ctx: { isService: true, userId: null, companyId: null, roles: ["service_role"] } };
  }

  const userId = claimsData.claims.sub as string;

  const admin: SupabaseClient = createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const [{ data: rolesRow }, { data: profileRow }] = await Promise.all([
    admin.from("user_roles").select("role").eq("user_id", userId),
    admin.from("profiles").select("company_id").eq("id", userId).maybeSingle(),
  ]);

  const roles = (rolesRow ?? []).map((r: { role: string }) => r.role);
  const companyId = profileRow?.company_id ?? null;

  if (requiredCompanyId) {
    const isPlatformAdmin = roles.includes("platform_admin");
    if (!isPlatformAdmin && companyId !== requiredCompanyId) {
      return { ok: false, status: 403, error: "Forbidden — company scope mismatch" };
    }
  }

  return { ok: true, ctx: { isService: false, userId, companyId, roles } };
}