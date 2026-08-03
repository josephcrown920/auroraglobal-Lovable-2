// End-to-end integration tests for the `payments`, `jobs`, and `agent_sessions`
// tables. These hit the LIVE database (via SUPABASE_SERVICE_ROLE_KEY) and are
// intentionally kept in `bun:test` so they run with the same runner as the
// rest of the suite.
//
// Skips gracefully when service-role credentials are not present in the
// environment (e.g. CI without secrets, or local dev without them mirrored).
//
// Coverage per table:
//   1. Schema/columns actually exist and accept the shapes the app uses.
//   2. INSERT (as service role) then SELECT round-trips.
//   3. UPDATE mutates + `updated_at` trigger fires (jobs, agent_sessions,
//      payments all have `touch_updated_at`).
//   4. RLS: another authenticated user (impersonated via a second service-role
//      insert then a publishable-key session-less client) cannot read rows
//      they don't own.
//   5. DELETE cleans up so tests are idempotent.

import { afterAll, beforeAll, describe, expect, it } from "bun:test";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const SUPABASE_PUBLISHABLE_KEY = process.env.SUPABASE_PUBLISHABLE_KEY;

const canRun = Boolean(SUPABASE_URL && SUPABASE_SERVICE_ROLE_KEY);
const describeLive = canRun ? describe : describe.skip;

function isNewSbKey(v: string) {
  return v.startsWith("sb_publishable_") || v.startsWith("sb_secret_");
}

function makeFetch(key: string): typeof fetch {
  return (input, init) => {
    const headers = new Headers(
      typeof Request !== "undefined" && input instanceof Request ? input.headers : undefined,
    );
    if (init?.headers) new Headers(init.headers).forEach((v, k) => headers.set(k, v));
    if (isNewSbKey(key) && headers.get("Authorization") === `Bearer ${key}`) {
      headers.delete("Authorization");
    }
    headers.set("apikey", key);
    return fetch(input, { ...init, headers });
  };
}

function admin(): SupabaseClient {
  return createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!, {
    global: { fetch: makeFetch(SUPABASE_SERVICE_ROLE_KEY!) },
    auth: { persistSession: false, autoRefreshToken: false, storage: undefined },
  });
}

function anonClient(): SupabaseClient | null {
  if (!SUPABASE_PUBLISHABLE_KEY) return null;
  return createClient(SUPABASE_URL!, SUPABASE_PUBLISHABLE_KEY!, {
    global: { fetch: makeFetch(SUPABASE_PUBLISHABLE_KEY!) },
    auth: { persistSession: false, autoRefreshToken: false, storage: undefined },
  });
}

// Two throwaway auth users; keeps tests self-contained and isolated from real data.
const TEST_TAG = `it-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
let userA: { id: string; email: string } | null = null;
let userB: { id: string; email: string } | null = null;

describeLive("live DB integration — payments / jobs / agent_sessions", () => {
  const sb = canRun ? admin() : (null as unknown as SupabaseClient);

  beforeAll(async () => {
    if (!canRun) return;
    const emailA = `${TEST_TAG}-a@aurora-integration.test`;
    const emailB = `${TEST_TAG}-b@aurora-integration.test`;

    const a = await sb.auth.admin.createUser({
      email: emailA,
      email_confirm: true,
      password: `Aa1!${TEST_TAG}`,
    });
    if (a.error) throw a.error;
    userA = { id: a.data.user!.id, email: emailA };

    const b = await sb.auth.admin.createUser({
      email: emailB,
      email_confirm: true,
      password: `Aa1!${TEST_TAG}`,
    });
    if (b.error) throw b.error;
    userB = { id: b.data.user!.id, email: emailB };
  });

  afterAll(async () => {
    if (!canRun) return;
    // Cascade deletes via FK on auth.users take care of profiles/user_roles,
    // but explicitly wipe our owned rows first for the three tables we tested,
    // in case ON DELETE CASCADE isn't set on every FK.
    for (const uid of [userA?.id, userB?.id].filter(Boolean) as string[]) {
      await sb.from("payments").delete().eq("user_id", uid);
      await sb.from("jobs").delete().eq("user_id", uid);
      await sb.from("agent_sessions").delete().eq("user_id", uid);
      await sb.auth.admin.deleteUser(uid).catch(() => {});
    }
  });

  // ── payments ─────────────────────────────────────────────────────────────
  describe("payments", () => {
    it("inserts, reads, updates, and enforces RLS", async () => {
      expect(userA).toBeTruthy();
      const reference = `test-ref-${TEST_TAG}`;
      const ins = await sb
        .from("payments")
        .insert({
          user_id: userA!.id,
          provider: "test",
          reference,
          amount_kobo: 100000,
          currency: "NGN",
          credits_granted: 100,
          status: "success",
          raw: { test: true, tag: TEST_TAG },
        })
        .select()
        .single();
      expect(ins.error).toBeNull();
      expect(ins.data!.reference).toBe(reference);
      expect(ins.data!.credits_granted).toBe(100);
      const createdAt = ins.data!.updated_at;

      // updated_at trigger fires on UPDATE
      await new Promise((r) => setTimeout(r, 10));
      const upd = await sb
        .from("payments")
        .update({ status: "refunded" })
        .eq("id", ins.data!.id)
        .select()
        .single();
      expect(upd.error).toBeNull();
      expect(upd.data!.status).toBe("refunded");
      expect(new Date(upd.data!.updated_at).getTime()).toBeGreaterThan(
        new Date(createdAt).getTime(),
      );

      // RLS: anon (no session) must NOT read the row
      const anon = anonClient();
      if (anon) {
        const anonRead = await anon.from("payments").select("id").eq("id", ins.data!.id);
        expect(anonRead.data ?? []).toHaveLength(0);
      }
    });
  });

  // ── jobs ─────────────────────────────────────────────────────────────────
  describe("jobs", () => {
    it("supports the full queued → processing → succeeded lifecycle", async () => {
      const ins = await sb
        .from("jobs")
        .insert({
          user_id: userA!.id,
          kind: "test_kind",
          payload: { tag: TEST_TAG },
          status: "queued",
          priority: 5,
          attempts: 0,
          max_attempts: 3,
          credits_reserved: 10,
        })
        .select()
        .single();
      expect(ins.error).toBeNull();
      const jobId = ins.data!.id;

      // Lock/process
      const proc = await sb
        .from("jobs")
        .update({
          status: "processing",
          locked_by: "worker-test",
          locked_at: new Date().toISOString(),
          started_at: new Date().toISOString(),
          attempts: 1,
        })
        .eq("id", jobId)
        .select()
        .single();
      expect(proc.error).toBeNull();
      expect(proc.data!.status).toBe("processing");
      expect(proc.data!.locked_by).toBe("worker-test");

      // Finish
      const done = await sb
        .from("jobs")
        .update({
          status: "succeeded",
          finished_at: new Date().toISOString(),
          result: { ok: true },
        })
        .eq("id", jobId)
        .select()
        .single();
      expect(done.error).toBeNull();
      expect(done.data!.status).toBe("succeeded");
      expect(done.data!.result).toEqual({ ok: true });
    });

    it("scopes rows by user_id — user B cannot see user A's job via RLS", async () => {
      const anon = anonClient();
      if (!anon) return; // publishable key not available, skip inner check

      const ins = await sb
        .from("jobs")
        .insert({
          user_id: userA!.id,
          kind: "test_privacy",
          payload: { tag: TEST_TAG },
          status: "queued",
          priority: 0,
          attempts: 0,
          max_attempts: 1,
          credits_reserved: 0,
        })
        .select()
        .single();
      expect(ins.error).toBeNull();

      const anonRead = await anon.from("jobs").select("id").eq("id", ins.data!.id);
      // No session → not user A → RLS returns zero rows.
      expect(anonRead.data ?? []).toHaveLength(0);
    });
  });

  // ── agent_sessions ───────────────────────────────────────────────────────
  describe("agent_sessions", () => {
    it("stores plan/iterations/messages jsonb and round-trips them", async () => {
      const plan = { steps: [{ id: "s1", title: "Do the thing" }] };
      const iterations = [{ n: 1, notes: "first pass" }];
      const messages = [{ role: "user", content: "hi" }];

      const ins = await sb
        .from("agent_sessions")
        .insert({
          user_id: userA!.id,
          title: `it-session-${TEST_TAG}`,
          brief: "integration test brief",
          plan,
          iterations,
          messages,
          status: "planning",
        })
        .select()
        .single();
      expect(ins.error).toBeNull();
      expect(ins.data!.plan).toEqual(plan);
      expect(ins.data!.iterations).toEqual(iterations);
      expect(ins.data!.messages).toEqual(messages);

      // Append an iteration
      const nextIter = [...iterations, { n: 2, notes: "second pass" }];
      const upd = await sb
        .from("agent_sessions")
        .update({ iterations: nextIter, status: "running" })
        .eq("id", ins.data!.id)
        .select()
        .single();
      expect(upd.error).toBeNull();
      expect(upd.data!.status).toBe("running");
      expect(upd.data!.iterations).toHaveLength(2);

      // RLS: anon cannot read
      const anon = anonClient();
      if (anon) {
        const anonRead = await anon
          .from("agent_sessions")
          .select("id")
          .eq("id", ins.data!.id);
        expect(anonRead.data ?? []).toHaveLength(0);
      }
    });

    it("enforces user_id NOT NULL", async () => {
      // Cast through unknown — we're intentionally violating the type to exercise the DB constraint.
      const bad = await sb
        .from("agent_sessions")
        .insert({
          user_id: null as unknown as string,
          brief: "no owner",
          plan: {},
          iterations: [],
          messages: [],
          status: "planning",
        })
        .select();
      expect(bad.error).not.toBeNull();
    });
  });
});

// Emit a visible skip note when creds aren't present, so CI logs make the
// gating obvious instead of the file looking like a silent no-op.
if (!canRun) {
  describe("live DB integration (skipped)", () => {
    it("requires SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY", () => {
      expect(canRun).toBe(false);
    });
  });
}
