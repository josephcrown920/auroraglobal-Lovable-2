REVOKE EXECUTE ON FUNCTION public.reserve_credits(uuid, integer, text, uuid) FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.commit_reservation(uuid, integer, text, uuid) FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.release_reservation(uuid, integer, text, uuid) FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.create_generation_and_reserve(uuid, text, text, int, jsonb) FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.claim_next_job(text) FROM anon, authenticated, public;
GRANT EXECUTE ON FUNCTION public.reserve_credits(uuid, integer, text, uuid) TO service_role;
GRANT EXECUTE ON FUNCTION public.commit_reservation(uuid, integer, text, uuid) TO service_role;
GRANT EXECUTE ON FUNCTION public.release_reservation(uuid, integer, text, uuid) TO service_role;
GRANT EXECUTE ON FUNCTION public.create_generation_and_reserve(uuid, text, text, int, jsonb) TO service_role;
GRANT EXECUTE ON FUNCTION public.claim_next_job(text) TO service_role;

ALTER TABLE public.gpu_workers
  ADD COLUMN IF NOT EXISTS protocol text NOT NULL DEFAULT 'custom',
  ADD COLUMN IF NOT EXISTS worker_role text;

CREATE TABLE IF NOT EXISTS public.avatars (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  handle text not null,
  lora_id text,
  sync_lora_id text,
  trigger_word text default 'style',
  style text default 'general',
  preview_url text,
  training_status text not null default 'completed'
    check (training_status in ('pending', 'in_progress', 'completed', 'failed')),
  training_submitted_at timestamptz default now(),
  training_completed_at timestamptz,
  training_error text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint avatars_name_not_empty check (char_length(name) > 0),
  constraint avatars_user_name_unique unique (user_id, name),
  constraint avatars_user_handle_unique unique (user_id, handle)
);
CREATE INDEX IF NOT EXISTS idx_avatars_user_id ON public.avatars(user_id);
CREATE INDEX IF NOT EXISTS idx_avatars_user_name ON public.avatars(user_id, name);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.avatars TO authenticated;
GRANT ALL ON public.avatars TO service_role;
ALTER TABLE public.avatars ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "avatars_select_own" ON public.avatars;
CREATE POLICY "avatars_select_own" ON public.avatars FOR SELECT USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "avatars_insert_own" ON public.avatars;
CREATE POLICY "avatars_insert_own" ON public.avatars FOR INSERT WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "avatars_update_own" ON public.avatars;
CREATE POLICY "avatars_update_own" ON public.avatars FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "avatars_delete_own" ON public.avatars;
CREATE POLICY "avatars_delete_own" ON public.avatars FOR DELETE USING (auth.uid() = user_id);
CREATE OR REPLACE TRIGGER avatars_touch BEFORE UPDATE ON public.avatars FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

CREATE OR REPLACE FUNCTION public.gpu_worker_inflight_inc(_worker uuid) RETURNS integer
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE _n integer;
BEGIN
  UPDATE public.gpu_workers SET in_flight = in_flight + 1 WHERE id = _worker RETURNING in_flight INTO _n;
  RETURN _n;
END; $$;

CREATE OR REPLACE FUNCTION public.gpu_worker_inflight_dec(_worker uuid) RETURNS integer
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE _n integer;
BEGIN
  UPDATE public.gpu_workers SET in_flight = GREATEST(in_flight - 1, 0), last_heartbeat = now() WHERE id = _worker RETURNING in_flight INTO _n;
  RETURN _n;
END; $$;

REVOKE EXECUTE ON FUNCTION public.gpu_worker_inflight_inc(uuid) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.gpu_worker_inflight_dec(uuid) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.gpu_worker_inflight_inc(uuid) TO service_role;
GRANT EXECUTE ON FUNCTION public.gpu_worker_inflight_dec(uuid) TO service_role;

ALTER TABLE public.payments ADD COLUMN IF NOT EXISTS profit_amount_minor integer;
ALTER TABLE public.payments ADD COLUMN IF NOT EXISTS credit_funding_amount_minor integer;
ALTER TABLE public.payments ADD COLUMN IF NOT EXISTS split_profit_pct numeric(5,2);

CREATE TABLE IF NOT EXISTS public.agent_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text,
  brief text not null default '',
  plan jsonb not null default '{}'::jsonb,
  iterations jsonb not null default '[]'::jsonb,
  messages jsonb not null default '[]'::jsonb,
  status text not null default 'draft',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
CREATE INDEX IF NOT EXISTS agent_sessions_user_updated_idx ON public.agent_sessions (user_id, updated_at desc);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.agent_sessions TO authenticated;
GRANT ALL ON public.agent_sessions TO service_role;
ALTER TABLE public.agent_sessions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "agent_sessions_select_own" ON public.agent_sessions;
CREATE POLICY "agent_sessions_select_own" ON public.agent_sessions FOR SELECT TO authenticated USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "agent_sessions_insert_own" ON public.agent_sessions;
CREATE POLICY "agent_sessions_insert_own" ON public.agent_sessions FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "agent_sessions_update_own" ON public.agent_sessions;
CREATE POLICY "agent_sessions_update_own" ON public.agent_sessions FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "agent_sessions_delete_own" ON public.agent_sessions;
CREATE POLICY "agent_sessions_delete_own" ON public.agent_sessions FOR DELETE TO authenticated USING (auth.uid() = user_id);

ALTER TABLE public.generations ADD COLUMN IF NOT EXISTS session_id uuid references public.agent_sessions(id) on delete set null;
ALTER TABLE public.generations ADD COLUMN IF NOT EXISTS agent_shot_id text;
CREATE INDEX IF NOT EXISTS generations_session_shot_idx ON public.generations (session_id, agent_shot_id);
ALTER TABLE public.generations ADD COLUMN IF NOT EXISTS result_text text;