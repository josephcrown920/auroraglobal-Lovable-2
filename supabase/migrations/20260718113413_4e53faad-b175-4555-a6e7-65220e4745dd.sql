-- Clean install: nuke public schema
DROP SCHEMA public CASCADE;
CREATE SCHEMA public;
GRANT USAGE ON SCHEMA public TO postgres, anon, authenticated, service_role;
GRANT ALL ON SCHEMA public TO postgres, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO postgres, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO postgres, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON FUNCTIONS TO postgres, service_role;
DO $CLEAN$ DECLARE r record;
BEGIN
  FOR r IN (SELECT policyname, tablename FROM pg_policies WHERE schemaname='storage') LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON storage.%I', r.policyname, r.tablename);
  END LOOP;
END $CLEAN$;

CREATE TABLE IF NOT EXISTS public.generations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  prompt text not null,
  mode text not null default 'performance',
  status text not null default 'pending',
  input_images jsonb not null default '[]'::jsonb,
  motion_video_url text,
  result_image_url text,
  error text,
  created_at timestamptz not null default now()
);
alter table public.generations enable row level security;
CREATE POLICY "own generations select" ON public.generations for select using (auth.uid() = user_id);
CREATE POLICY "own generations insert" ON public.generations for insert with check (auth.uid() = user_id);
CREATE POLICY "own generations update" ON public.generations for update using (auth.uid() = user_id);
CREATE POLICY "own generations delete" ON public.generations for delete using (auth.uid() = user_id);

CREATE POLICY "studio user upload" ON storage.objects for insert with check (bucket_id = 'studio' and auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "studio user update" ON storage.objects for update using (bucket_id = 'studio' and auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "studio user delete" ON storage.objects for delete using (bucket_id = 'studio' and auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "studio own folder select" ON storage.objects for select using (bucket_id = 'studio' and auth.uid()::text = (storage.foldername(name))[1]);

ALTER TABLE public.generations
  ADD COLUMN IF NOT EXISTS model text,
  ADD COLUMN IF NOT EXISTS kind text NOT NULL DEFAULT 'image',
  ADD COLUMN IF NOT EXISTS result_video_url text,
  ADD COLUMN IF NOT EXISTS audio_url text;

CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique,
  email text,
  display_name text,
  plan text not null default 'free',
  credits integer not null default 5,
  lifetime_credits_purchased integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.profiles enable row level security;
CREATE POLICY "profile self select" ON public.profiles for select using (auth.uid() = user_id);
CREATE POLICY "profile self insert" ON public.profiles for insert with check (auth.uid() = user_id);

CREATE TABLE IF NOT EXISTS public.credit_ledger (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  delta integer not null,
  reason text not null,
  ref_id uuid,
  created_at timestamptz not null default now()
);
alter table public.credit_ledger enable row level security;
CREATE POLICY "ledger self select" ON public.credit_ledger for select using (auth.uid() = user_id);

CREATE TABLE IF NOT EXISTS public.payments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  provider text not null default 'paystack',
  reference text not null unique,
  amount_kobo integer not null,
  currency text not null default 'NGN',
  credits_granted integer not null default 0,
  status text not null default 'pending',
  raw jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.payments enable row level security;
CREATE POLICY "payments self select" ON public.payments for select using (auth.uid() = user_id);

alter table public.generations add column if not exists credits_cost integer not null default 1;

create or replace function public.touch_updated_at()
returns trigger language plpgsql security invoker set search_path = public as $$
begin new.updated_at = now(); return new; end; $$;

CREATE OR REPLACE TRIGGER profiles_touch before update on public.profiles for each row execute function public.touch_updated_at();
CREATE OR REPLACE TRIGGER payments_touch before update on public.payments for each row execute function public.touch_updated_at();

do $$ begin create type public.app_role as enum ('admin', 'user'); exception when duplicate_object then null; end $$;

CREATE TABLE IF NOT EXISTS public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  role public.app_role not null,
  created_at timestamptz not null default now(),
  unique (user_id, role)
);
grant select on public.user_roles to authenticated;
grant all on public.user_roles to service_role;
alter table public.user_roles enable row level security;
CREATE POLICY "self read roles" ON public.user_roles for select to authenticated using (auth.uid() = user_id);

create or replace function public.has_role(_user uuid, _role public.app_role)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.user_roles where user_id = _user and role = _role);
$$;
revoke execute on function public.has_role(uuid, public.app_role) from public, anon;
grant execute on function public.has_role(uuid, public.app_role) to authenticated, service_role;

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (user_id, email, credits) values (new.id, new.email, 5)
    on conflict (user_id) do nothing;
  insert into public.credit_ledger (user_id, delta, reason) values (new.id, 5, 'signup_bonus');
  return new;
end;
$$;
revoke execute on function public.handle_new_user() from public, anon, authenticated;
drop trigger if exists on_auth_user_created on auth.users;
CREATE OR REPLACE TRIGGER on_auth_user_created after insert on auth.users
  for each row execute function public.handle_new_user();

create or replace function public.deduct_credits(_user uuid, _amount integer, _reason text, _ref uuid)
returns boolean language plpgsql security definer set search_path = public as $$
declare _new int;
begin
  update public.profiles set credits = credits - _amount
    where user_id = _user and credits >= _amount returning credits into _new;
  if _new is null then return false; end if;
  insert into public.credit_ledger (user_id, delta, reason, ref_id) values (_user, -_amount, _reason, _ref);
  return true;
end; $$;

create or replace function public.grant_credits(_user uuid, _amount integer, _reason text, _ref uuid)
returns void language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (user_id, credits) values (_user, _amount)
  on conflict (user_id) do update set credits = public.profiles.credits + excluded.credits;
  if _reason = 'purchase' then
    update public.profiles set lifetime_credits_purchased = lifetime_credits_purchased + _amount where user_id = _user;
  end if;
  insert into public.credit_ledger (user_id, delta, reason, ref_id) values (_user, _amount, _reason, _ref);
end; $$;
revoke execute on function public.deduct_credits(uuid, integer, text, uuid) from public, anon, authenticated;
revoke execute on function public.grant_credits(uuid, integer, text, uuid) from public, anon, authenticated;
grant execute on function public.deduct_credits(uuid, integer, text, uuid) to service_role;
grant execute on function public.grant_credits(uuid, integer, text, uuid) to service_role;

CREATE POLICY "profile self update" ON public.profiles
  FOR UPDATE TO authenticated USING (auth.uid() = user_id)
  WITH CHECK (
    auth.uid() = user_id
    AND credits IS NOT DISTINCT FROM (SELECT p.credits FROM public.profiles p WHERE p.user_id = auth.uid())
    AND plan IS NOT DISTINCT FROM (SELECT p.plan FROM public.profiles p WHERE p.user_id = auth.uid())
    AND lifetime_credits_purchased IS NOT DISTINCT FROM (SELECT p.lifetime_credits_purchased FROM public.profiles p WHERE p.user_id = auth.uid())
  );

CREATE POLICY "admin read all gens" ON public.generations for select to authenticated using (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "admin read all payments" ON public.payments for select to authenticated using (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "admin read all profiles" ON public.profiles for select to authenticated using (public.has_role(auth.uid(), 'admin'));

CREATE TABLE IF NOT EXISTS public.events (
  id uuid primary key default gen_random_uuid(),
  name text not null, path text, user_id uuid, session_id text, payload jsonb,
  created_at timestamptz not null default now()
);
CREATE INDEX IF NOT EXISTS events_created_at_idx on public.events (created_at desc);
CREATE INDEX IF NOT EXISTS events_name_idx on public.events (name);
alter table public.events enable row level security;
CREATE POLICY "anyone can insert events" ON public.events FOR INSERT TO anon, authenticated
  WITH CHECK (user_id IS NULL OR user_id = auth.uid());
CREATE POLICY "admin reads events" ON public.events FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));

ALTER TABLE public.generations
  ADD COLUMN IF NOT EXISTS is_favorite boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS tags text[] NOT NULL DEFAULT '{}';
CREATE INDEX IF NOT EXISTS generations_user_fav_idx ON public.generations(user_id, is_favorite) WHERE is_favorite = true;

CREATE TABLE IF NOT EXISTS public.gift_cards (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text NOT NULL UNIQUE,
  credits integer NOT NULL CHECK (credits > 0),
  amount_usd numeric(10,2) NOT NULL DEFAULT 0,
  design text NOT NULL DEFAULT 'aurora',
  note text,
  created_by uuid NOT NULL,
  redeemed_by uuid,
  redeemed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.gift_cards ENABLE ROW LEVEL SECURITY;
CREATE POLICY "admin manage gift cards" ON public.gift_cards
  FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

CREATE TABLE IF NOT EXISTS public.provider_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid, provider text NOT NULL, endpoint text NOT NULL, kind text NOT NULL,
  status text NOT NULL, latency_ms integer, cost_usd numeric(10,4), error text, ref_id uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.provider_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "admin reads provider logs" ON public.provider_logs FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'::app_role));
CREATE INDEX IF NOT EXISTS provider_logs_created_idx ON public.provider_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS provider_logs_provider_idx ON public.provider_logs(provider, status);

CREATE TABLE IF NOT EXISTS public.contact_messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID, email TEXT NOT NULL, name TEXT,
  topic TEXT NOT NULL DEFAULT 'general', message TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'new',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.contact_messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "anyone can send contact message" ON public.contact_messages FOR INSERT TO anon, authenticated
WITH CHECK (
  length(coalesce(message,'')) BETWEEN 5 AND 5000
  AND length(coalesce(email,'')) BETWEEN 5 AND 320
  AND email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$'
  AND length(coalesce(topic,'')) <= 64
  AND (name IS NULL OR length(name) <= 120)
  AND (user_id IS NULL OR user_id = auth.uid())
  AND status = 'new'
);
CREATE POLICY "admin reads contact" ON public.contact_messages FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'::public.app_role));
CREATE POLICY "admin updates contact" ON public.contact_messages FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin'::public.app_role));

CREATE TABLE IF NOT EXISTS public.legal_acceptances (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL, document TEXT NOT NULL, version TEXT NOT NULL,
  accepted_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  ip TEXT, user_agent TEXT,
  UNIQUE (user_id, document, version)
);
ALTER TABLE public.legal_acceptances ENABLE ROW LEVEL SECURITY;
CREATE POLICY "self insert acceptance" ON public.legal_acceptances FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "self read acceptance" ON public.legal_acceptances FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "admin reads acceptance" ON public.legal_acceptances FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'::public.app_role));

CREATE TABLE IF NOT EXISTS public.gpu_workers (
  id uuid primary key default gen_random_uuid(),
  name text not null, endpoint_url text not null, auth_token text,
  region text default 'global',
  capabilities text[] not null default '{image}',
  models text[] not null default '{}',
  priority int not null default 100, status text not null default 'active',
  max_concurrency int not null default 4, in_flight int not null default 0,
  last_heartbeat timestamptz, created_at timestamptz not null default now()
);
alter table public.gpu_workers enable row level security;
CREATE POLICY "admin manage workers" ON public.gpu_workers for all to authenticated
  using (has_role(auth.uid(),'admin')) with check (has_role(auth.uid(),'admin'));

CREATE TABLE IF NOT EXISTS public.worker_jobs (
  id uuid primary key default gen_random_uuid(),
  worker_id uuid references public.gpu_workers(id) on delete set null,
  user_id uuid, kind text not null, status text not null default 'queued',
  latency_ms int, cost_usd numeric, error text, ref_id uuid,
  created_at timestamptz not null default now()
);
alter table public.worker_jobs enable row level security;
CREATE POLICY "admin reads worker jobs" ON public.worker_jobs for select to authenticated using (has_role(auth.uid(),'admin'));

CREATE TABLE IF NOT EXISTS public.workflows (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null, name text not null, description text,
  graph jsonb not null default '{}'::jsonb, is_public boolean not null default false,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
alter table public.workflows enable row level security;
CREATE POLICY "wf select own or public" ON public.workflows FOR SELECT TO authenticated USING (auth.uid() = user_id OR is_public = true);
CREATE POLICY "wf insert own" ON public.workflows FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "wf update own" ON public.workflows FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "wf delete own" ON public.workflows FOR DELETE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "wf admin read" ON public.workflows FOR SELECT TO authenticated USING (has_role(auth.uid(),'admin'));
CREATE OR REPLACE TRIGGER workflows_touch before update on public.workflows for each row execute function public.touch_updated_at();

CREATE TABLE IF NOT EXISTS public.affiliates (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique, code text not null unique,
  commission_pct int not null default 20, total_earned_usd numeric not null default 0,
  payout_email text, created_at timestamptz not null default now()
);
alter table public.affiliates enable row level security;
CREATE POLICY "aff self read" ON public.affiliates for select to authenticated using (auth.uid()=user_id);
CREATE POLICY "aff self upsert" ON public.affiliates for insert to authenticated with check (auth.uid()=user_id);
CREATE POLICY "aff self update" ON public.affiliates FOR UPDATE TO authenticated USING (auth.uid() = user_id)
  WITH CHECK (
    auth.uid() = user_id
    AND commission_pct IS NOT DISTINCT FROM (SELECT a.commission_pct FROM public.affiliates a WHERE a.user_id = auth.uid())
    AND total_earned_usd IS NOT DISTINCT FROM (SELECT a.total_earned_usd FROM public.affiliates a WHERE a.user_id = auth.uid())
    AND code IS NOT DISTINCT FROM (SELECT a.code FROM public.affiliates a WHERE a.user_id = auth.uid())
  );
CREATE POLICY "aff admin read" ON public.affiliates for select to authenticated using (has_role(auth.uid(),'admin'));

CREATE TABLE IF NOT EXISTS public.affiliate_events (
  id uuid primary key default gen_random_uuid(),
  code text not null, user_id uuid, kind text not null,
  amount_usd numeric default 0, ref_id uuid,
  created_at timestamptz not null default now()
);
alter table public.affiliate_events enable row level security;
CREATE POLICY "aff events insert validated" ON public.affiliate_events FOR INSERT TO anon, authenticated
  WITH CHECK (
    kind = 'click' AND (amount_usd IS NULL OR amount_usd = 0)
    AND (user_id IS NULL OR user_id = auth.uid())
    AND EXISTS (SELECT 1 FROM public.affiliates a WHERE a.code = affiliate_events.code)
  );
CREATE POLICY "aff events admin read" ON public.affiliate_events for select to authenticated using (has_role(auth.uid(),'admin'));
CREATE POLICY "aff events owner read" ON public.affiliate_events for select to authenticated
  using (exists (select 1 from public.affiliates a where a.code = affiliate_events.code and a.user_id = auth.uid()));

ALTER TABLE public.generations REPLICA IDENTITY FULL;
DO $$ BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.generations;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS public.leads (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT NOT NULL, source TEXT NOT NULL DEFAULT 'landing',
  ref_code TEXT, user_agent TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS leads_email_idx ON public.leads (lower(email));
CREATE INDEX IF NOT EXISTS leads_created_at_idx ON public.leads (created_at DESC);
GRANT INSERT ON public.leads TO anon, authenticated;
GRANT ALL ON public.leads TO service_role;
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can submit a lead" ON public.leads FOR INSERT TO anon, authenticated
  WITH CHECK (email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$');
CREATE POLICY "Admins can view leads" ON public.leads FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));

CREATE TABLE IF NOT EXISTS public.lipsync_jobs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL, video_url text NOT NULL, audio_url text NOT NULL,
  engine text NOT NULL DEFAULT 'sync-v2', status text NOT NULL DEFAULT 'queued',
  result_url text, error text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.lipsync_jobs TO authenticated;
GRANT ALL ON public.lipsync_jobs TO service_role;
ALTER TABLE public.lipsync_jobs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "lipsync own select" ON public.lipsync_jobs FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "lipsync own insert" ON public.lipsync_jobs FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "lipsync own update" ON public.lipsync_jobs FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "lipsync own delete" ON public.lipsync_jobs FOR DELETE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "lipsync admin read" ON public.lipsync_jobs FOR SELECT TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));
CREATE OR REPLACE TRIGGER lipsync_jobs_touch BEFORE UPDATE ON public.lipsync_jobs FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
