// Startup migration validation — runs once per server process and verifies the
// live Postgres schema contains every table the backend depends on. Surfaces
// clear, actionable errors so an out-of-date database is caught at boot, not
// deep inside a user-facing request.
//
// Usage: call `ensureMigrationsCurrent()` from any server function. Result is
// memoized, so repeat calls are cheap (single boolean check).
//
// Source of truth for expected tables: supabase/migrations/*.sql
// Regenerate EXPECTED_TABLES by running:
//   grep -rhiE "create table (if not exists )?public\.[a-z_]+" supabase/migrations/ \
//     | sed -E 's/.*public\.([a-z_]+).*/\1/' | sort -u

export const EXPECTED_TABLES: readonly string[] = [
  "admin_asset_packs",
  "affiliate_events",
  "affiliates",
  "agent_chat_messages",
  "agent_sessions",
  "agent_user_memory",
  "api_balance_alerts",
  "api_keys",
  "app_settings",
  "aurora_templates",
  "avatars",
  "cli_device_codes",
  "cm_batch_items",
  "cm_batches",
  "cm_products",
  "cm_templates",
  "cm_videos",
  "comfy_runs",
  "comfy_workflows",
  "consent_logs",
  "contact_messages",
  "credit_ledger",
  "email_log",
  "events",
  "generations",
  "gift_cards",
  "gpu_workers",
  "growth_tool_runs",
  "guided_workflows",
  "jobs",
  "kids_stories",
  "leads",
  "legal_acceptances",
  "lipsync_jobs",
  "marketplace_template_runs",
  "marketplace_templates",
  "owner_withdrawals",
  "payments",
  "profiles",
  "promo_code_redemptions",
  "promo_codes",
  "provider_logs",
  "scheduler_heartbeats",
  "site_content",
  "site_images",
  "smoke_checks",
  "smoke_runs",
  "spin_jobs",
  "spin_variants",
  "studio",
  "subscriptions",
  "tiktok_accounts",
  "tiktok_jobs",
  "tiktok_posts",
  "tiktok_remixes",
  "user_assets",
  "user_photo_avatars",
  "user_roles",
  "user_webhooks",
  "waitlist",
  "worker_jobs",
  "worker_register_attempts",
  "workflows",
] as const;

// Critical functions the backend relies on. Missing entries here indicate an
// incomplete migration apply — see docs/BACKEND_SYNC.md for context.
export const EXPECTED_FUNCTIONS: readonly string[] = [
  "deduct_credits",
  "grant_credits",
  "handle_new_user",
  "has_role",
  "touch_updated_at",
] as const;

export type MigrationCheckResult = {
  ok: boolean;
  missingTables: string[];
  missingFunctions: string[];
  checkedAt: string;
};

let cached: MigrationCheckResult | null = null;
let inflight: Promise<MigrationCheckResult> | null = null;

async function runCheck(): Promise<MigrationCheckResult> {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

  const { data: tableRows, error: tableErr } = await supabaseAdmin
    .rpc("pg_catalog_tables" as never)
    .select()
    // Fallback: the RPC likely doesn't exist. We use a direct query instead below.
    .then((r) => r, () => ({ data: null, error: { message: "rpc-missing" } }));
  void tableRows;
  void tableErr;

  // Direct catalog query via PostgREST is blocked; use raw SQL through admin.
  // supabase-js exposes .from(...) but not arbitrary SQL. Use two lightweight
  // count-style probes instead: SELECT 1 FROM public.<table> LIMIT 0 for each
  // expected table. A missing table returns a PostgREST error whose code is
  // "42P01" (undefined_table) or message contains "does not exist".
  const missingTables: string[] = [];
  await Promise.all(
    EXPECTED_TABLES.map(async (t) => {
      const { error } = await supabaseAdmin.from(t as never).select("*", { head: true, count: "exact" }).limit(0);
      if (error && /does not exist|42P01|schema cache/i.test(error.message)) {
        missingTables.push(t);
      }
    }),
  );

  // Function probes: call each with dummy args and check for undefined_function.
  // We only care about existence, not a successful call.
  const missingFunctions: string[] = [];
  await Promise.all(
    EXPECTED_FUNCTIONS.map(async (fn) => {
      const { error } = await supabaseAdmin.rpc(fn as never, {} as never);
      if (error && /does not exist|42883|Could not find the function/i.test(error.message)) {
        missingFunctions.push(fn);
      }
    }),
  );

  const result: MigrationCheckResult = {
    ok: missingTables.length === 0 && missingFunctions.length === 0,
    missingTables: missingTables.sort(),
    missingFunctions: missingFunctions.sort(),
    checkedAt: new Date().toISOString(),
  };

  if (!result.ok) {
    console.error(
      "[migration-check] Database schema is out of date. " +
        `Missing tables: ${result.missingTables.join(", ") || "(none)"}. ` +
        `Missing functions: ${result.missingFunctions.join(", ") || "(none)"}. ` +
        "Apply pending migrations from supabase/migrations/ before continuing. " +
        "See docs/BACKEND_SYNC.md.",
    );
  } else {
    console.log(
      `[migration-check] Schema OK — ${EXPECTED_TABLES.length} tables and ${EXPECTED_FUNCTIONS.length} functions verified at ${result.checkedAt}.`,
    );
  }
  return result;
}

/**
 * Verify the live database schema matches what the backend expects. Memoized
 * per server process — safe to call from every server function.
 *
 * @param opts.throwOnMissing When true, throws a clear error if anything is
 *   missing. Default false (log-only) so a partial schema doesn't take the
 *   whole app down for read-only public routes.
 */
export async function ensureMigrationsCurrent(opts: { throwOnMissing?: boolean } = {}): Promise<MigrationCheckResult> {
  if (cached) return cached;
  if (!inflight) inflight = runCheck().then((r) => (cached = r));
  const result = await inflight;
  if (opts.throwOnMissing && !result.ok) {
    throw new Error(
      `Database schema out of date — missing tables [${result.missingTables.join(", ")}], ` +
        `missing functions [${result.missingFunctions.join(", ")}]. ` +
        `Apply pending migrations from supabase/migrations/. See docs/BACKEND_SYNC.md.`,
    );
  }
  return result;
}

/** Reset the memoized result (tests / after a migration apply). */
export function _resetMigrationCheckCache() {
  cached = null;
  inflight = null;
}
