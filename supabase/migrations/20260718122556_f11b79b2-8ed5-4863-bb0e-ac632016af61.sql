-- Task #152 — Free / Pro subscription tiers
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS subscription_expires_at timestamptz,
  ADD COLUMN IF NOT EXISTS paystack_subscription_code text;

ALTER TABLE public.generations
  ADD COLUMN IF NOT EXISTS is_watermarked boolean NOT NULL DEFAULT false;

CREATE TABLE IF NOT EXISTS public.subscriptions (
  id                       uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id                  uuid        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  paystack_subscription_code text      NOT NULL,
  paystack_customer_code   text,
  paystack_email_token     text,
  plan_code                text,
  status                   text        NOT NULL DEFAULT 'active',
  next_payment_date        timestamptz,
  amount_minor             integer,
  currency                 text        NOT NULL DEFAULT 'USD',
  created_at               timestamptz NOT NULL DEFAULT now(),
  updated_at               timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS subscriptions_user_active_idx
  ON public.subscriptions (user_id) WHERE status = 'active';
GRANT SELECT ON public.subscriptions TO authenticated;
GRANT ALL    ON public.subscriptions TO service_role;
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "own subscription select" ON public.subscriptions;
CREATE POLICY "own subscription select" ON public.subscriptions
  FOR SELECT USING (auth.uid() = user_id);
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'subscriptions_paystack_subscription_code_key') THEN
    ALTER TABLE public.subscriptions ADD CONSTRAINT subscriptions_paystack_subscription_code_key UNIQUE (paystack_subscription_code);
  END IF;
END $$;
DROP TRIGGER IF EXISTS subscriptions_touch ON public.subscriptions;
CREATE TRIGGER subscriptions_touch BEFORE UPDATE ON public.subscriptions
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

CREATE UNIQUE INDEX IF NOT EXISTS credit_ledger_monthly_aura_ref_idx
  ON public.credit_ledger (ref_id) WHERE reason = 'monthly_aura';

DROP FUNCTION IF EXISTS public.grant_monthly_aura(uuid, integer, uuid);
CREATE OR REPLACE FUNCTION public.grant_monthly_aura(_user uuid, _amount integer, _ref uuid)
RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.credit_ledger (user_id, delta, reason, ref_id)
  VALUES (_user, _amount, 'monthly_aura', _ref) ON CONFLICT DO NOTHING;
  IF NOT FOUND THEN RETURN false; END IF;
  INSERT INTO public.profiles (user_id, credits) VALUES (_user, _amount)
  ON CONFLICT (user_id) DO UPDATE SET credits = public.profiles.credits + _amount;
  RETURN true;
END; $$;

CREATE OR REPLACE FUNCTION public.activate_pro_subscription(_user uuid, _sub_code text, _expires_at timestamptz)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  UPDATE public.profiles SET plan='pro', subscription_expires_at=_expires_at, paystack_subscription_code=_sub_code
  WHERE user_id = _user;
END; $$;

CREATE OR REPLACE FUNCTION public.deactivate_pro_subscription(_user uuid)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  UPDATE public.profiles SET plan='free', subscription_expires_at=null, paystack_subscription_code=null
  WHERE user_id = _user;
END; $$;

CREATE OR REPLACE FUNCTION public.grant_free_monthly_aura_all(_month text DEFAULT to_char(now(), 'YYYY-MM'))
RETURNS integer LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE _amount int := 20; _credited int := 0; _rows int; _user_id uuid; _hash text; _ref uuid;
BEGIN
  FOR _user_id IN SELECT user_id FROM public.profiles WHERE (plan IS NULL OR plan <> 'pro') LOOP
    _hash := md5('free:' || _user_id::text || ':' || _month);
    _ref := (substring(_hash,1,8)||'-'||substring(_hash,9,4)||'-'||substring(_hash,13,4)||'-'||substring(_hash,17,4)||'-'||substring(_hash,21,12))::uuid;
    INSERT INTO public.credit_ledger (user_id, delta, reason, ref_id)
    VALUES (_user_id, _amount, 'monthly_aura', _ref) ON CONFLICT DO NOTHING;
    GET DIAGNOSTICS _rows = ROW_COUNT;
    IF _rows > 0 THEN
      UPDATE public.profiles SET credits = credits + _amount WHERE user_id = _user_id;
      _credited := _credited + 1;
    END IF;
  END LOOP;
  RETURN _credited;
END; $$;

-- Heavy queue lanes
ALTER TABLE public.jobs ADD COLUMN IF NOT EXISTS queue text NOT NULL DEFAULT 'standard';
CREATE INDEX IF NOT EXISTS jobs_heavy_queue_idx ON public.jobs (priority DESC, scheduled_at)
  WHERE status = 'queued' AND queue = 'heavy';

CREATE OR REPLACE FUNCTION public.set_generation_watermark_from_plan()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE _plan text; _is_admin boolean := false;
BEGIN
  SELECT plan INTO _plan FROM public.profiles WHERE user_id = NEW.user_id;
  SELECT EXISTS(SELECT 1 FROM public.user_roles WHERE user_id = NEW.user_id AND role = 'admin') INTO _is_admin;
  NEW.is_watermarked := NOT (_plan = 'pro' OR _is_admin = true);
  RETURN NEW;
END; $$;
DROP TRIGGER IF EXISTS generation_watermark_from_plan ON public.generations;
CREATE TRIGGER generation_watermark_from_plan BEFORE INSERT ON public.generations
  FOR EACH ROW EXECUTE FUNCTION public.set_generation_watermark_from_plan();

-- Worker lanes
ALTER TABLE public.gpu_workers ADD COLUMN IF NOT EXISTS lanes text[] NOT NULL DEFAULT '{standard,heavy}';
CREATE OR REPLACE FUNCTION public.claim_next_job_v2(_worker text, _lanes text[])
RETURNS public.jobs LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE _row public.jobs;
BEGIN
  WITH next AS (
    SELECT id FROM public.jobs
    WHERE status='queued' AND scheduled_at <= now() AND queue = ANY(_lanes)
    ORDER BY priority DESC, scheduled_at ASC LIMIT 1 FOR UPDATE SKIP LOCKED
  )
  UPDATE public.jobs j SET status='processing', started_at=COALESCE(j.started_at, now()),
    locked_at=now(), locked_by=_worker, attempts=j.attempts+1
    FROM next WHERE j.id = next.id RETURNING j.* INTO _row;
  RETURN _row;
END; $$;
REVOKE EXECUTE ON FUNCTION public.claim_next_job_v2(text, text[]) FROM anon, authenticated, public;
GRANT EXECUTE ON FUNCTION public.claim_next_job_v2(text, text[]) TO service_role;

-- Spin engine variation
ALTER TABLE public.spin_jobs ADD COLUMN IF NOT EXISTS avatar_id uuid;
ALTER TABLE public.spin_jobs ADD COLUMN IF NOT EXISTS face_url text;
ALTER TABLE public.spin_jobs ADD COLUMN IF NOT EXISTS video_mode boolean NOT NULL DEFAULT false;
ALTER TABLE public.spin_variants ADD COLUMN IF NOT EXISTS prompt text;
ALTER TABLE public.spin_variants ADD COLUMN IF NOT EXISTS spec jsonb;
ALTER TABLE public.spin_variants ADD COLUMN IF NOT EXISTS error text;

-- Marketplace templates
CREATE TABLE IF NOT EXISTS public.marketplace_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  cover_url text,
  price_aura integer NOT NULL DEFAULT 0,
  workflow_id uuid,
  payload jsonb,
  status text NOT NULL DEFAULT 'draft',
  runs_count integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.marketplace_templates TO authenticated;
GRANT SELECT ON public.marketplace_templates TO anon;
GRANT ALL ON public.marketplace_templates TO service_role;
ALTER TABLE public.marketplace_templates ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "public read published" ON public.marketplace_templates;
CREATE POLICY "public read published" ON public.marketplace_templates FOR SELECT USING (status = 'published' OR auth.uid() = creator_user_id);
DROP POLICY IF EXISTS "creator manage own" ON public.marketplace_templates;
CREATE POLICY "creator manage own" ON public.marketplace_templates FOR ALL USING (auth.uid() = creator_user_id) WITH CHECK (auth.uid() = creator_user_id);

CREATE TABLE IF NOT EXISTS public.marketplace_template_runs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id uuid NOT NULL REFERENCES public.marketplace_templates(id) ON DELETE CASCADE,
  runner_user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  creator_user_id uuid NOT NULL,
  aura_charged integer NOT NULL,
  creator_cut_aura integer NOT NULL,
  platform_cut_aura integer NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.marketplace_template_runs TO authenticated;
GRANT ALL ON public.marketplace_template_runs TO service_role;
ALTER TABLE public.marketplace_template_runs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "runner or creator" ON public.marketplace_template_runs;
CREATE POLICY "runner or creator" ON public.marketplace_template_runs FOR SELECT USING (auth.uid() = runner_user_id OR auth.uid() = creator_user_id);

-- Finalize helpers
CREATE OR REPLACE FUNCTION public.finalize_marketplace_run(
  _runner_user_id uuid, _creator_user_id uuid, _template_id uuid,
  _aura_charged int, _creator_cut_aura int, _platform_cut_aura int,
  _amount int, _reason text, _ref uuid, _creator_ref uuid
) RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.marketplace_template_runs (template_id, runner_user_id, creator_user_id, aura_charged, creator_cut_aura, platform_cut_aura)
  VALUES (_template_id, _runner_user_id, _creator_user_id, _aura_charged, _creator_cut_aura, _platform_cut_aura);
  PERFORM public.commit_reservation(_runner_user_id, _amount, _reason, _ref);
  IF _creator_cut_aura > 0 AND _creator_user_id IS DISTINCT FROM _runner_user_id THEN
    PERFORM public.grant_credits(_creator_user_id, _creator_cut_aura, 'marketplace_creator_cut:' || _template_id::text, _creator_ref);
  END IF;
END; $$;
REVOKE ALL ON FUNCTION public.finalize_marketplace_run(uuid, uuid, uuid, integer, integer, integer, integer, text, uuid, uuid) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.finalize_marketplace_run(uuid, uuid, uuid, integer, integer, integer, integer, text, uuid, uuid) TO service_role;

-- GPU worker probe
ALTER TABLE public.gpu_workers ADD COLUMN IF NOT EXISTS probe_status text;
ALTER TABLE public.gpu_workers ADD COLUMN IF NOT EXISTS max_in_flight int NOT NULL DEFAULT 4;

CREATE OR REPLACE FUNCTION public.gpu_worker_inflight_inc_cap(_worker uuid, _cap int)
RETURNS int LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE _n int;
BEGIN
  UPDATE public.gpu_workers SET in_flight = in_flight + 1
  WHERE id = _worker AND in_flight < _cap RETURNING in_flight INTO _n;
  RETURN COALESCE(_n, -1);
END; $$;

CREATE OR REPLACE FUNCTION public.finalize_job(_job uuid, _status text, _error text)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  UPDATE public.jobs SET status = _status, error = _error, finished_at = now(),
    locked_at = NULL, locked_by = NULL WHERE id = _job;
END; $$;

CREATE OR REPLACE FUNCTION public.reconcile_stuck_reservations(_max_age_seconds int)
RETURNS int LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE _count int := 0;
BEGIN
  RETURN _count;
END; $$;

-- Growth tool runs
CREATE TABLE IF NOT EXISTS public.growth_tool_runs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  tool text NOT NULL,
  payload jsonb,
  result jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.growth_tool_runs TO authenticated;
GRANT ALL ON public.growth_tool_runs TO service_role;
ALTER TABLE public.growth_tool_runs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "own growth runs" ON public.growth_tool_runs;
CREATE POLICY "own growth runs" ON public.growth_tool_runs FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Worker register attempts
CREATE TABLE IF NOT EXISTS public.worker_register_attempts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  worker_name text,
  ip text,
  user_agent text,
  ok boolean NOT NULL DEFAULT false,
  reason text,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT ALL ON public.worker_register_attempts TO service_role;
ALTER TABLE public.worker_register_attempts ENABLE ROW LEVEL SECURITY;

-- Owner withdrawals
CREATE TABLE IF NOT EXISTS public.owner_withdrawals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  amount_minor int NOT NULL,
  currency text NOT NULL DEFAULT 'USD',
  status text NOT NULL DEFAULT 'pending',
  destination jsonb,
  processed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.owner_withdrawals TO authenticated;
GRANT ALL ON public.owner_withdrawals TO service_role;
ALTER TABLE public.owner_withdrawals ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "own withdrawals" ON public.owner_withdrawals;
CREATE POLICY "own withdrawals" ON public.owner_withdrawals FOR SELECT USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "own insert withdrawals" ON public.owner_withdrawals;
CREATE POLICY "own insert withdrawals" ON public.owner_withdrawals FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Promo codes
CREATE TABLE IF NOT EXISTS public.promo_codes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text UNIQUE NOT NULL,
  aura_amount int NOT NULL DEFAULT 0,
  discount_pct int,
  max_redemptions int,
  redemptions_count int NOT NULL DEFAULT 0,
  expires_at timestamptz,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.promo_codes TO authenticated;
GRANT ALL ON public.promo_codes TO service_role;
ALTER TABLE public.promo_codes ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "read active promo" ON public.promo_codes;
CREATE POLICY "read active promo" ON public.promo_codes FOR SELECT TO authenticated USING (active = true);

CREATE TABLE IF NOT EXISTS public.promo_code_redemptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code_id uuid NOT NULL REFERENCES public.promo_codes(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  aura_granted int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(code_id, user_id)
);
GRANT SELECT ON public.promo_code_redemptions TO authenticated;
GRANT ALL ON public.promo_code_redemptions TO service_role;
ALTER TABLE public.promo_code_redemptions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "own redemptions" ON public.promo_code_redemptions;
CREATE POLICY "own redemptions" ON public.promo_code_redemptions FOR SELECT USING (auth.uid() = user_id);

-- Guided workflows
CREATE TABLE IF NOT EXISTS public.guided_workflows (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  steps jsonb NOT NULL,
  is_public boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.guided_workflows TO authenticated;
GRANT ALL ON public.guided_workflows TO service_role;
ALTER TABLE public.guided_workflows ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "own or public workflow" ON public.guided_workflows;
CREATE POLICY "own or public workflow" ON public.guided_workflows FOR SELECT USING (auth.uid() = user_id OR is_public = true);
DROP POLICY IF EXISTS "own manage workflow" ON public.guided_workflows;
CREATE POLICY "own manage workflow" ON public.guided_workflows FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Aurora templates (official library)
CREATE TABLE IF NOT EXISTS public.aurora_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text UNIQUE NOT NULL,
  title text NOT NULL,
  description text,
  category text,
  cover_url text,
  payload jsonb,
  aura_cost int NOT NULL DEFAULT 0,
  is_public boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.aurora_templates TO authenticated, anon;
GRANT ALL ON public.aurora_templates TO service_role;
ALTER TABLE public.aurora_templates ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "public read aurora templates" ON public.aurora_templates;
CREATE POLICY "public read aurora templates" ON public.aurora_templates FOR SELECT USING (is_public = true);
DROP POLICY IF EXISTS "admin manage aurora templates" ON public.aurora_templates;
CREATE POLICY "admin manage aurora templates" ON public.aurora_templates FOR ALL USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- User photo avatars
CREATE TABLE IF NOT EXISTS public.user_photo_avatars (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name text,
  photo_url text NOT NULL,
  face_meta jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.user_photo_avatars TO authenticated;
GRANT ALL ON public.user_photo_avatars TO service_role;
ALTER TABLE public.user_photo_avatars ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "own photo avatars" ON public.user_photo_avatars;
CREATE POLICY "own photo avatars" ON public.user_photo_avatars FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Site images
CREATE TABLE IF NOT EXISTS public.site_images (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text UNIQUE NOT NULL,
  url text NOT NULL,
  alt text,
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.site_images TO anon, authenticated;
GRANT ALL ON public.site_images TO service_role;
ALTER TABLE public.site_images ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "public read site images" ON public.site_images;
CREATE POLICY "public read site images" ON public.site_images FOR SELECT USING (true);
DROP POLICY IF EXISTS "admin manage site images" ON public.site_images;
CREATE POLICY "admin manage site images" ON public.site_images FOR ALL USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Onboarding + spend limit
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS onboarding_bonus_granted boolean NOT NULL DEFAULT false;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS daily_spend_limit int;

-- Batch lipsync
ALTER TABLE public.lipsync_jobs ADD COLUMN IF NOT EXISTS batch_id uuid;
ALTER TABLE public.lipsync_jobs ADD COLUMN IF NOT EXISTS batch_index int;

-- Agent skills memory
ALTER TABLE public.agent_chat_messages ADD COLUMN IF NOT EXISTS skill_meta jsonb;
ALTER TABLE public.agent_user_memory ADD COLUMN IF NOT EXISTS structured_memory jsonb;

-- Generations extras
ALTER TABLE public.generations ADD COLUMN IF NOT EXISTS is_hidden boolean NOT NULL DEFAULT false;
ALTER TABLE public.generations ADD COLUMN IF NOT EXISTS result_text text;
CREATE INDEX IF NOT EXISTS generations_hidden_idx ON public.generations (user_id, is_hidden, created_at desc);