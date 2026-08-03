-- ===== 20260702000000_heavy_queue.sql =====
-- Task #153: cost control guardrails — heavy job queue
-- Adds a `queue` column to jobs (default 'standard') and updates the
-- set_job_priority_from_plan trigger so heavy-queue jobs always sort BELOW
-- standard free-tier work. No changes to claim_next_job are required: it already
-- orders by priority DESC, scheduled_at ASC, so heavy jobs float to the bottom.
--
-- Priority grid after this migration:
--   Standard + Pro  →  +10    Standard + Free  →   0
--   Heavy    + Pro  →  −10    Heavy    + Free  →  −20
--
-- Heavy kinds are auto-classified by the trigger (lipsync) so no changes are
-- needed to the create_generation_and_reserve RPC.

ALTER TABLE public.jobs
  ADD COLUMN IF NOT EXISTS queue text NOT NULL DEFAULT 'standard';

-- Partial index supporting heavy-queue-aware scheduling scans.
CREATE INDEX IF NOT EXISTS jobs_heavy_queue_idx
  ON public.jobs (priority DESC, scheduled_at)
  WHERE status = 'queued' AND queue = 'heavy';

-- ─── Recreate the priority trigger ──────────────────────────────────────────
-- Now also:
-- 1. Auto-classifies lipsync jobs (and any other HEAVY_KINDS) as heavy queue.
-- 2. Subtracts 20 from the priority of heavy-queue jobs so they always trail
--    standard work without requiring a separate worker lane or RPC change.
CREATE OR REPLACE FUNCTION public.set_job_priority_from_plan()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _base int;
BEGIN
  _base := COALESCE((
    SELECT CASE
      WHEN p.plan = 'pro' THEN 10
      WHEN EXISTS(
        SELECT 1 FROM public.user_roles ur
        WHERE ur.user_id = NEW.user_id AND ur.role = 'admin'
      ) THEN 10
      ELSE 0
    END
    FROM public.profiles p
    WHERE p.user_id = NEW.user_id
    LIMIT 1
  ), 0);

  -- Auto-classify kinds that are always heavy (expensive, non-urgent).
  -- Respects an explicit queue value already set by the application layer.
  IF NEW.queue = 'standard' THEN
    IF NEW.kind IN ('lipsync') OR
       (NEW.payload IS NOT NULL AND NEW.payload->>'kind' IN ('lipsync')) THEN
      NEW.queue := 'heavy';
    END IF;
  END IF;

  -- Heavy-queue jobs sort below every standard job (free baseline = 0),
  -- so a lipsync render never delays a quick image generation.
  NEW.priority := _base - (CASE WHEN NEW.queue = 'heavy' THEN 20 ELSE 0 END);
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS job_priority_from_plan ON public.jobs;
CREATE OR REPLACE TRIGGER job_priority_from_plan
  BEFORE INSERT ON public.jobs
  FOR EACH ROW EXECUTE FUNCTION public.set_job_priority_from_plan();


-- ===== 20260702000001_heavy_queue_4k_classify.sql =====
-- Task #153: extend heavy-queue auto-classification to 4K + multi-angle reshoot
-- Complements 20260702000000_heavy_queue.sql which only covered lipsync.
-- The trigger now also auto-classifies jobs whose payload indicates a 4K/2160p
-- resolution or whose kind is reshoot / multi_angle, matching classifyJobQueue()
-- in src/lib/billing.plans.ts so the TypeScript and DB layers stay in sync.

CREATE OR REPLACE FUNCTION public.set_job_priority_from_plan()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _base int;
BEGIN
  _base := COALESCE((
    SELECT CASE
      WHEN p.plan = 'pro' THEN 10
      WHEN EXISTS(
        SELECT 1 FROM public.user_roles ur
        WHERE ur.user_id = NEW.user_id AND ur.role = 'admin'
      ) THEN 10
      ELSE 0
    END
    FROM public.profiles p
    WHERE p.user_id = NEW.user_id
    LIMIT 1
  ), 0);

  -- Auto-classify heavy jobs when the application layer has not already done so.
  -- Criteria mirror classifyJobQueue() in src/lib/billing.plans.ts exactly:
  --   • lipsync kind
  --   • 4K / 2160p resolution (expensive provider tier)
  --   • reshoot / multi_angle kind (6-image burst)
  IF NEW.queue = 'standard' THEN
    IF NEW.kind IN ('lipsync', 'reshoot', 'multi_angle')
       OR (NEW.payload IS NOT NULL AND NEW.payload->>'kind' IN ('lipsync', 'reshoot', 'multi_angle'))
       OR (NEW.payload IS NOT NULL AND NEW.payload->>'resolution' IN ('4K', '2160p'))
    THEN
      NEW.queue := 'heavy';
    END IF;
  END IF;

  -- Heavy-queue jobs sort below every standard job (free baseline = 0).
  NEW.priority := _base - (CASE WHEN NEW.queue = 'heavy' THEN 20 ELSE 0 END);
  RETURN NEW;
END;
$$;

-- ===== 20260702120000_worker_lanes.sql =====
-- Task #153: worker lanes — workers advertise which job queues they serve.
--
-- 1. gpu_workers.lanes: a self-hosted worker registers the lanes it is willing
--    to serve ('standard', 'heavy'). Default = both, so every existing row and
--    every legacy register call keeps its current behavior.
-- 2. claim_next_job_v2: lane-aware copy of claim_next_job — identical atomic
--    checkout (FOR UPDATE SKIP LOCKED) plus `queue = ANY(_lanes)`, so the
--    in-app runner can dedicate a batch slot to the heavy lane (heavy work
--    never starves under a flood of standard jobs) while standard slots are
--    never blocked behind heavy renders.
-- claim_next_job(text) stays in place untouched for rollback safety.

ALTER TABLE public.gpu_workers
  ADD COLUMN IF NOT EXISTS lanes text[] NOT NULL DEFAULT '{standard,heavy}';

CREATE OR REPLACE FUNCTION public.claim_next_job_v2(_worker text, _lanes text[])
RETURNS public.jobs
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE _row public.jobs;
BEGIN
  WITH next AS (
    SELECT id FROM public.jobs
     WHERE status = 'queued'
       AND scheduled_at <= now()
       AND queue = ANY(_lanes)
     ORDER BY priority DESC, scheduled_at ASC
     LIMIT 1
     FOR UPDATE SKIP LOCKED
  )
  UPDATE public.jobs j
     SET status = 'processing',
         started_at = COALESCE(j.started_at, now()),
         locked_at = now(),
         locked_by = _worker,
         attempts = j.atterts + 1
    FROM next
   WHERE j.id = next.id
  RETURNING j.* INTO _row;
  RETURN _row;
END; $$;

-- Same lockdown as claim_next_job: service-role only.
REVOKE EXECUTE ON FUNCTION public.claim_next_job_v2(text, text[]) FROM anon, authenticated, public;
GRANT EXECUTE ON FUNCTION public.claim_next_job_v2(text, text[]) TO service_role;


-- ===== 20260703000000_spin_engine_variation.sql =====
-- Spin viral-engine upgrade: identity linkage + per-variant variation specs.
-- Each spin variant now carries a rich, LLM-generated (or deterministic-fallback)
-- scene spec plus the fully-composed image prompt used to render it, so the grid
-- produces genuinely UNIQUE looks (location/outfit/camera/lighting/mood/framing)
-- while staying locked to one avatar's face reference.

-- Identity the whole batch is locked to (nullable: batches can run without a face).
ALTER TABLE public.spin_jobs ADD COLUMN IF NOT EXISTS avatar_id uuid;
ALTER TABLE public.spin_jobs ADD COLUMN IF NOT EXISTS face_url text;

-- Per-variant generation inputs + failure surface.
ALTER TABLE public.spin_variants ADD COLUMN IF NOT EXISTS prompt text;
ALTER TABLE public.spin_variants ADD COLUMN IF NOT EXISTS spec jsonb;
ALTER TABLE public.spin_variants ADD COLUMN IF NOT EXISTS kind text NOT NULL DEFAULT 'image';
ALTER TABLE public.spin_variants ADD COLUMN IF NOT EXISTS error text;