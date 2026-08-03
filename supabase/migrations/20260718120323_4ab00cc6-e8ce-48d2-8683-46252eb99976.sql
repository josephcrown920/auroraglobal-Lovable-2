-- ===== 20260629010000_requeue_failed_jobs.sql =====
-- Task #87 — orphan-failure recovery.
-- Re-enqueue a single job that ended up `failed` (with a transient error, still
-- within the persistent-retry bounds) so generations that fell out of the active
-- queue keep getting retried instead of staying dead. The JS sweeper
-- (sweepFailedJobs) decides eligibility using the same terminal/transient
-- classifier as the worker loop, then calls this RPC per candidate.
--
-- Credit safety: the terminal-failure path ALWAYS released a failed job's
-- reservation, so re-running it means re-reserving fresh credits. This is done
-- atomically here under a row lock: if the user can no longer afford the job we
-- return 'insufficient_credits' and leave it failed (never thrash, never run a
-- job without a reservation). Concurrent sweepers serialize on the FOR UPDATE
-- lock — the second caller sees status != 'failed' and returns 'not_found', so a
-- job is never re-reserved twice.
CREATE OR REPLACE FUNCTION public.requeue_failed_job(_job uuid, _backoff_seconds int)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _row public.jobs;
  _ok boolean;
BEGIN
  SELECT * INTO _row FROM public.jobs WHERE id = _job AND status = 'failed' FOR UPDATE;
  IF NOT FOUND THEN
    RETURN 'not_found';
  END IF;

  -- Re-reserve the original amount (the failure already refunded it). Zero-cost
  -- (admin/free) jobs skip the reserve entirely.
  IF _row.credits_reserved > 0 THEN
    _ok := public.reserve_credits(_row.user_id, _row.credits_reserved, 'job_' || _row.kind, _row.id);
    IF NOT _ok THEN
      RETURN 'insufficient_credits';
    END IF;
  END IF;

  UPDATE public.jobs
     SET status = 'queued',
         scheduled_at = now() + make_interval(secs => GREATEST(_backoff_seconds, 0)),
         locked_at = NULL,
         locked_by = NULL,
         finished_at = NULL
   WHERE id = _row.id;

  IF _row.generation_id IS NOT NULL THEN
    UPDATE public.generations
       SET status = 'retrying'
     WHERE id = _row.generation_id;
  END IF;

  RETURN 'requeued';
END; $$;

-- Server-only (same hardening as reset_stale_processing_jobs): a SECURITY DEFINER
-- function is granted to PUBLIC by default, which over PostgREST would let any
-- anon/authenticated client force a re-reserve + re-queue on arbitrary job ids.
REVOKE ALL ON FUNCTION public.requeue_failed_job(uuid, int) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.requeue_failed_job(uuid, int) FROM anon, authenticated;
GRANT EXECUTE ON FUNCTION public.requeue_failed_job(uuid, int) TO service_role;

-- Index for the failed-orphan scan (status + age + attempts ordering).
CREATE INDEX IF NOT EXISTS jobs_failed_recover_idx
  ON public.jobs (created_at)
  WHERE status = 'failed';


-- ===== 20260629020000_app_settings.sql =====
-- Task — "Free GPU only" mode.
-- A tiny, generic key/value store for global app settings the owner controls at
-- runtime (survives restarts). The first setting is `free_gpu_only`: when ON the
-- orchestrator refuses every paid external provider and serves only the
-- self-hosted GPU pool plus genuinely free ($0) providers.
-- No public access: service-role writes (bypasses RLS); admin reads/writes go
-- through SECURITY-checked server fns using the service-role key, mirroring the
-- scheduler_heartbeats pattern.

CREATE TABLE IF NOT EXISTS public.app_settings (
  key text PRIMARY KEY,
  value jsonb NOT NULL,
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.app_settings TO authenticated;
GRANT ALL ON public.app_settings TO service_role;

ALTER TABLE public.app_settings ENABLE ROW LEVEL SECURITY;
-- No authenticated-client write policy is exposed: changing a global safety flag
-- must go through the admin-gated server fn, never directly from the browser.

-- ===== 20260629020000_kids_stories.sql =====
-- Faceless Kids Story Studio: one row per generated kids story.
-- A story turns a short brief (content type, age range, topic, length, character)
-- into a finished faceless MP4 via a single reserved `kids_story` job (see
-- runKidsStory in jobs.server.ts): LLM script -> per-scene illustration ->
-- image-to-video clip -> per-scene narration -> ffmpeg assembly on a self-hosted
-- GPU worker. `scenes` holds the ordered script plus per-scene render progress so
-- the /kids page can show step-by-step status and per-stage errors.
--
-- Owner-scoped: the user CRUDs their own rows; the job runner writes through the
-- service-role server (which bypasses RLS), so RLS only needs owner access.

create table if not exists public.kids_stories (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid not null references auth.users(id) on delete cascade,
  generation_id   uuid references public.generations(id) on delete set null,
  job_id          uuid references public.jobs(id) on delete set null,
  title           text,
  -- The user's request: content_type, age_range, topic, length, character ref,
  -- music choice, aspect — exactly what was submitted, for re-rendering/auditing.
  brief           jsonb not null default '{}'::jsonb,
  -- Ordered scenes: { narration, illustrationPrompt, status, imageUrl, clipUrl,
  -- narrationUrl, error }[]. Updated in place as each stage completes.
  scenes          jsonb not null default '[]'::jsonb,
  status          text not null default 'pending'
                    check (status in ('pending', 'scripting', 'rendering', 'assembling', 'succeeded', 'failed')),
  error           text,
  poster_url      text,
  final_video_url text,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create index if not exists kids_stories_user_created_idx
  on public.kids_stories (user_id, created_at desc);
create index if not exists kids_stories_generation_idx
  on public.kids_stories (generation_id);

grant select, insert, update, delete on public.kids_stories to authenticated;
grant all on public.kids_stories to service_role;

alter table public.kids_stories enable row level security;

drop policy if exists "kids_stories_select_own" on public.kids_stories;
DROP POLICY IF EXISTS "kids_stories_select_own" ON public.kids_stories;
CREATE POLICY "kids_stories_select_own" ON public.kids_stories
  for select to authenticated using (auth.uid() = user_id);

drop policy if exists "kids_stories_insert_own" on public.kids_stories;
DROP POLICY IF EXISTS "kids_stories_insert_own" ON public.kids_stories;
CREATE POLICY "kids_stories_insert_own" ON public.kids_stories
  for insert to authenticated with check (auth.uid() = user_id);

drop policy if exists "kids_stories_update_own" on public.kids_stories;
DROP POLICY IF EXISTS "kids_stories_update_own" ON public.kids_stories;
CREATE POLICY "kids_stories_update_own" ON public.kids_stories
  for update to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "kids_stories_delete_own" on public.kids_stories;
DROP POLICY IF EXISTS "kids_stories_delete_own" ON public.kids_stories;
CREATE POLICY "kids_stories_delete_own" ON public.kids_stories
  for delete to authenticated using (auth.uid() = user_id);

-- Reuse the project's shared updated_at trigger function.
drop trigger if exists kids_stories_touch on public.kids_stories;
CREATE OR REPLACE TRIGGER kids_stories_touch
  before update on public.kids_stories
  for each row execute function public.touch_updated_at();