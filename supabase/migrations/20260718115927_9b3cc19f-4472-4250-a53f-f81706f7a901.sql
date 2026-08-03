CREATE TABLE IF NOT EXISTS public.comfy_workflows (
  id uuid primary key default gen_random_uuid(),
  owner_user_id uuid references auth.users(id) on delete cascade,
  name text not null,
  description text,
  kind text not null default 'image' check (kind in ('image', 'video')),
  workflow_json jsonb not null default '{}'::jsonb,
  declared_inputs jsonb not null default '[]'::jsonb,
  default_inputs jsonb not null default '{}'::jsonb,
  is_public boolean not null default false,
  created_by_admin boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
CREATE INDEX IF NOT EXISTS comfy_workflows_owner_updated_idx ON public.comfy_workflows (owner_user_id, updated_at desc);
CREATE INDEX IF NOT EXISTS comfy_workflows_public_idx ON public.comfy_workflows (is_public) where is_public;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.comfy_workflows TO authenticated;
GRANT ALL ON public.comfy_workflows TO service_role;
ALTER TABLE public.comfy_workflows ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "comfy_workflows_select" ON public.comfy_workflows;
CREATE POLICY "comfy_workflows_select" ON public.comfy_workflows FOR SELECT TO authenticated USING (auth.uid() = owner_user_id or is_public);
DROP POLICY IF EXISTS "comfy_workflows_insert_own" ON public.comfy_workflows;
CREATE POLICY "comfy_workflows_insert_own" ON public.comfy_workflows FOR INSERT TO authenticated WITH CHECK (auth.uid() = owner_user_id and is_public = false and created_by_admin = false);
DROP POLICY IF EXISTS "comfy_workflows_update_own" ON public.comfy_workflows;
CREATE POLICY "comfy_workflows_update_own" ON public.comfy_workflows FOR UPDATE TO authenticated USING (auth.uid() = owner_user_id) WITH CHECK (auth.uid() = owner_user_id and is_public = false and created_by_admin = false);
DROP POLICY IF EXISTS "comfy_workflows_delete_own" ON public.comfy_workflows;
CREATE POLICY "comfy_workflows_delete_own" ON public.comfy_workflows FOR DELETE TO authenticated USING (auth.uid() = owner_user_id);

CREATE TABLE IF NOT EXISTS public.comfy_runs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  workflow_id uuid references public.comfy_workflows(id) on delete set null,
  worker_id uuid references public.gpu_workers(id) on delete set null,
  status text not null default 'queued' check (status in ('queued', 'running', 'succeeded', 'failed')),
  progress_pct int not null default 0,
  prompt_id text,
  input_values jsonb not null default '{}'::jsonb,
  output_url text,
  output_kind text,
  error text,
  source text not null default 'run' check (source in ('run', 'admin', 'canvas')),
  generation_id uuid references public.generations(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
CREATE INDEX IF NOT EXISTS comfy_runs_user_created_idx ON public.comfy_runs (user_id, created_at desc);
CREATE INDEX IF NOT EXISTS comfy_runs_workflow_idx ON public.comfy_runs (workflow_id);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.comfy_runs TO authenticated;
GRANT ALL ON public.comfy_runs TO service_role;
ALTER TABLE public.comfy_runs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "comfy_runs_select_own" ON public.comfy_runs;
CREATE POLICY "comfy_runs_select_own" ON public.comfy_runs FOR SELECT TO authenticated USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "comfy_runs_insert_own" ON public.comfy_runs;
CREATE POLICY "comfy_runs_insert_own" ON public.comfy_runs FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "comfy_runs_update_own" ON public.comfy_runs;
CREATE POLICY "comfy_runs_update_own" ON public.comfy_runs FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "comfy_runs_delete_own" ON public.comfy_runs;
CREATE POLICY "comfy_runs_delete_own" ON public.comfy_runs FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE TABLE IF NOT EXISTS public.scheduler_heartbeats (
  name text PRIMARY KEY,
  last_run_at timestamptz,
  last_ok_at timestamptz,
  last_error text,
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.scheduler_heartbeats TO authenticated;
GRANT ALL ON public.scheduler_heartbeats TO service_role;
ALTER TABLE public.scheduler_heartbeats ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.reset_stale_processing_jobs(
  _max_age_seconds int,
  _backoff_seconds int
) RETURNS int
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  _ids uuid[];
  _count int;
BEGIN
  WITH stale AS (
    UPDATE public.jobs j
       SET status = 'queued',
           locked_at = NULL,
           locked_by = NULL,
           scheduled_at = now() + make_interval(secs => GREATEST(_backoff_seconds, 0)),
           error = 'stale_worker_lock'
     WHERE j.status = 'processing'
       AND j.locked_at IS NOT NULL
       AND j.locked_at < now() - make_interval(secs => GREATEST(_max_age_seconds, 1))
     RETURNING j.generation_id
  )
  SELECT count(*)::int,
         array_agg(generation_id) FILTER (WHERE generation_id IS NOT NULL)
    INTO _count, _ids
    FROM stale;
  IF _ids IS NOT NULL AND array_length(_ids, 1) > 0 THEN
    UPDATE public.generations
       SET status = 'pending'
     WHERE id = ANY(_ids)
       AND status IN ('processing', 'pending', 'retrying');
  END IF;
  RETURN COALESCE(_count, 0);
END; $$;
REVOKE ALL ON FUNCTION public.reset_stale_processing_jobs(int, int) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.reset_stale_processing_jobs(int, int) FROM anon, authenticated;
GRANT EXECUTE ON FUNCTION public.reset_stale_processing_jobs(int, int) TO service_role;
CREATE INDEX IF NOT EXISTS jobs_processing_lock_idx ON public.jobs (locked_at) WHERE status = 'processing';