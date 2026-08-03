ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS referred_by_code TEXT;

CREATE TABLE IF NOT EXISTS public.api_keys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL DEFAULT 'CLI',
  key_hash TEXT NOT NULL UNIQUE,
  key_prefix TEXT NOT NULL,
  last_used_at TIMESTAMPTZ,
  revoked_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS api_keys_user_idx ON public.api_keys(user_id);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.api_keys TO authenticated;
GRANT ALL ON public.api_keys TO service_role;
ALTER TABLE public.api_keys ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "api_keys self read" ON public.api_keys;
CREATE POLICY "api_keys self read" ON public.api_keys FOR SELECT TO authenticated USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "api_keys self insert" ON public.api_keys;
CREATE POLICY "api_keys self insert" ON public.api_keys FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "api_keys self update" ON public.api_keys;
CREATE POLICY "api_keys self update" ON public.api_keys FOR UPDATE TO authenticated USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "api_keys self delete" ON public.api_keys;
CREATE POLICY "api_keys self delete" ON public.api_keys FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE TABLE IF NOT EXISTS public.cli_device_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  device_code TEXT NOT NULL UNIQUE,
  user_code TEXT NOT NULL UNIQUE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  api_key_plain TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (now() + interval '15 minutes'),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS cli_device_codes_user_code_idx ON public.cli_device_codes(user_code);
GRANT SELECT, UPDATE ON public.cli_device_codes TO authenticated;
GRANT ALL ON public.cli_device_codes TO service_role;
ALTER TABLE public.cli_device_codes ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "device_codes own read" ON public.cli_device_codes;
CREATE POLICY "device_codes own read" ON public.cli_device_codes FOR SELECT TO authenticated USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "device_codes auth approve" ON public.cli_device_codes;
CREATE POLICY "device_codes auth approve" ON public.cli_device_codes
  FOR UPDATE TO authenticated
  USING (status = 'pending' AND expires_at > now())
  WITH CHECK (user_id = auth.uid() AND status = 'approved');

CREATE TABLE IF NOT EXISTS public.spin_jobs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  prompt text not null,
  total int not null default 30,
  status text not null default 'running',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.spin_jobs TO authenticated;
GRANT ALL ON public.spin_jobs TO service_role;
ALTER TABLE public.spin_jobs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "own spin_jobs" ON public.spin_jobs;
CREATE POLICY "own spin_jobs" ON public.spin_jobs FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE TABLE IF NOT EXISTS public.spin_variants (
  id uuid primary key default gen_random_uuid(),
  job_id uuid not null references public.spin_jobs(id) on delete cascade,
  user_id uuid not null,
  idx int not null,
  label text not null,
  status text not null default 'queued',
  url text,
  error text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
CREATE INDEX IF NOT EXISTS spin_variants_job_idx ON public.spin_variants(job_id, idx);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.spin_variants TO authenticated;
GRANT ALL ON public.spin_variants TO service_role;
ALTER TABLE public.spin_variants ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "own spin_variants" ON public.spin_variants;
CREATE POLICY "own spin_variants" ON public.spin_variants FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE OR REPLACE TRIGGER spin_jobs_touch BEFORE UPDATE ON public.spin_jobs FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
CREATE OR REPLACE TRIGGER spin_variants_touch BEFORE UPDATE ON public.spin_variants FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

ALTER TABLE public.generations ADD COLUMN IF NOT EXISTS camera_movement text NULL;
CREATE INDEX IF NOT EXISTS idx_generations_camera_movement ON public.generations(camera_movement);

ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS credits_reserved integer NOT NULL DEFAULT 0;

CREATE OR REPLACE FUNCTION public.reserve_credits(_user uuid, _amount integer, _reason text, _ref uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE _ok int;
BEGIN
  UPDATE public.profiles
     SET credits = credits - _amount,
         credits_reserved = credits_reserved + _amount
   WHERE user_id = _user
     AND credits >= _amount
   RETURNING credits INTO _ok;
  IF _ok IS NULL THEN RETURN false; END IF;
  INSERT INTO public.credit_ledger (user_id, delta, reason, ref_id)
    VALUES (_user, -_amount, 'reserve:' || _reason, _ref);
  RETURN true;
END; $$;

CREATE OR REPLACE FUNCTION public.commit_reservation(_user uuid, _amount integer, _reason text, _ref uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.profiles
     SET credits_reserved = GREATEST(credits_reserved - _amount, 0)
   WHERE user_id = _user;
  INSERT INTO public.credit_ledger (user_id, delta, reason, ref_id)
    VALUES (_user, 0, 'commit:' || _reason, _ref);
END; $$;

CREATE OR REPLACE FUNCTION public.release_reservation(_user uuid, _amount integer, _reason text, _ref uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.profiles
     SET credits = credits + _amount,
         credits_reserved = GREATEST(credits_reserved - _amount, 0)
   WHERE user_id = _user;
  INSERT INTO public.credit_ledger (user_id, delta, reason, ref_id)
    VALUES (_user, _amount, 'release:' || _reason, _ref);
END; $$;

CREATE TABLE IF NOT EXISTS public.jobs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  kind text NOT NULL,
  payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  status text NOT NULL DEFAULT 'queued',
  priority int NOT NULL DEFAULT 0,
  attempts int NOT NULL DEFAULT 0,
  max_attempts int NOT NULL DEFAULT 3,
  credits_reserved int NOT NULL DEFAULT 0,
  generation_id uuid,
  parent_job_id uuid,
  scheduled_at timestamptz NOT NULL DEFAULT now(),
  started_at timestamptz,
  finished_at timestamptz,
  locked_at timestamptz,
  locked_by text,
  error text,
  result jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.jobs TO authenticated;
GRANT ALL ON public.jobs TO service_role;
ALTER TABLE public.jobs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Owners read jobs" ON public.jobs;
CREATE POLICY "Owners read jobs" ON public.jobs FOR SELECT TO authenticated USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Owners insert jobs" ON public.jobs;
CREATE POLICY "Owners insert jobs" ON public.jobs FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "Owners cancel own queued jobs" ON public.jobs;
CREATE POLICY "Owners cancel own queued jobs" ON public.jobs FOR UPDATE TO authenticated USING (auth.uid() = user_id AND status IN ('queued','processing')) WITH CHECK (auth.uid() = user_id);
CREATE INDEX IF NOT EXISTS jobs_queue_idx ON public.jobs (status, scheduled_at, priority DESC) WHERE status = 'queued';
CREATE INDEX IF NOT EXISTS jobs_user_idx ON public.jobs (user_id, created_at DESC);
CREATE OR REPLACE TRIGGER jobs_touch_updated BEFORE UPDATE ON public.jobs FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

CREATE OR REPLACE FUNCTION public.create_generation_and_reserve(
  _user uuid,
  _kind text,
  _prompt text,
  _amount int,
  _payload jsonb
) RETURNS TABLE (job_id uuid, generation_id uuid)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _gen uuid;
  _job uuid;
  _ok boolean;
BEGIN
  _ok := public.reserve_credits(_user, _amount, 'job_' || _kind, gen_random_uuid());
  IF NOT _ok THEN
    RAISE EXCEPTION 'insufficient_credits';
  END IF;
  INSERT INTO public.generations (user_id, prompt, kind, status, credits_cost)
    VALUES (_user, COALESCE(_prompt, ''), _kind, 'pending', _amount)
    RETURNING id INTO _gen;
  INSERT INTO public.jobs (user_id, kind, payload, credits_reserved, generation_id)
    VALUES (_user, _kind, _payload, _amount, _gen)
    RETURNING id INTO _job;
  RETURN QUERY SELECT _job, _gen;
END; $$;

CREATE OR REPLACE FUNCTION public.claim_next_job(_worker text)
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
     ORDER BY priority DESC, scheduled_at ASC
     LIMIT 1
     FOR UPDATE SKIP LOCKED
  )
  UPDATE public.jobs j
     SET status = 'processing',
         started_at = COALESCE(j.started_at, now()),
         locked_at = now(),
         locked_by = _worker,
         attempts = j.attempts + 1
    FROM next
   WHERE j.id = next.id
  RETURNING j.* INTO _row;
  RETURN _row;
END; $$;

CREATE TABLE IF NOT EXISTS public.tiktok_remixes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  source_video_url text NOT NULL,
  source_generation_id uuid,
  target_count int NOT NULL DEFAULT 10,
  status text NOT NULL DEFAULT 'queued',
  highlights jsonb NOT NULL DEFAULT '[]'::jsonb,
  child_generation_ids jsonb NOT NULL DEFAULT '[]'::jsonb,
  child_job_ids jsonb NOT NULL DEFAULT '[]'::jsonb,
  prompt text,
  error text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.tiktok_remixes TO authenticated;
GRANT ALL ON public.tiktok_remixes TO service_role;
ALTER TABLE public.tiktok_remixes ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Owners manage remixes" ON public.tiktok_remixes;
CREATE POLICY "Owners manage remixes" ON public.tiktok_remixes FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE OR REPLACE TRIGGER tiktok_remixes_touch_updated BEFORE UPDATE ON public.tiktok_remixes FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();