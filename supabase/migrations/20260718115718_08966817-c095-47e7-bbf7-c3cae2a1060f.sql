-- ===== 20260612030210_b6b481aa-c519-466b-8f4b-bfaa7427ad4f.sql =====
DROP POLICY IF EXISTS "studio user upload" ON storage.objects;
CREATE POLICY "studio user upload" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'studio' AND auth.uid()::text = (storage.foldername(name))[1]);
DROP POLICY IF EXISTS "studio user update" ON storage.objects;
CREATE POLICY "studio user update" ON storage.objects FOR UPDATE USING (bucket_id = 'studio' AND auth.uid()::text = (storage.foldername(name))[1]);
DROP POLICY IF EXISTS "studio user delete" ON storage.objects;
CREATE POLICY "studio user delete" ON storage.objects FOR DELETE USING (bucket_id = 'studio' AND auth.uid()::text = (storage.foldername(name))[1]);
DROP POLICY IF EXISTS "studio own folder select" ON storage.objects;
CREATE POLICY "studio own folder select" ON storage.objects FOR SELECT USING (bucket_id = 'studio' AND auth.uid()::text = (storage.foldername(name))[1]);

-- ===== 20260612032810_d05efd93-6f51-48d7-a01e-22bcb7cca911.sql =====
REVOKE EXECUTE ON FUNCTION public.grant_credits(uuid, integer, text, uuid) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.deduct_credits(uuid, integer, text, uuid) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.grant_credits(uuid, integer, text, uuid) TO service_role;
GRANT EXECUTE ON FUNCTION public.deduct_credits(uuid, integer, text, uuid) TO service_role;
GRANT EXECUTE ON FUNCTION public.handle_new_user() TO service_role;

-- ===== 20260612032839_3b2f5c81-aaef-45ea-aea8-80c5a15e3255.sql =====
CREATE OR REPLACE FUNCTION public.has_role(_user uuid, _role app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path = public
AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user AND role = _role);
$$;

-- ===== 20260612050014_14d4a0d7-219a-4b0b-9bd9-ae6cc7278b71.sql =====
CREATE TABLE IF NOT EXISTS public.smoke_runs (
  id uuid primary key default gen_random_uuid(),
  triggered_by uuid not null references auth.users(id) on delete cascade,
  started_at timestamptz not null default now(),
  finished_at timestamptz,
  total_cost_usd numeric(10,4) default 0,
  summary jsonb
);
GRANT SELECT, INSERT, UPDATE ON public.smoke_runs TO authenticated;
GRANT ALL ON public.smoke_runs TO service_role;
ALTER TABLE public.smoke_runs ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS public.smoke_checks (
  id uuid primary key default gen_random_uuid(),
  run_id uuid not null references public.smoke_runs(id) on delete cascade,
  step int not null,
  name text not null,
  status text not null default 'pending',
  latency_ms int,
  cost_usd numeric(10,4),
  output_url text,
  error text,
  raw jsonb,
  created_at timestamptz not null default now()
);
GRANT SELECT, INSERT, UPDATE ON public.smoke_checks TO authenticated;
GRANT ALL ON public.smoke_checks TO service_role;
ALTER TABLE public.smoke_checks ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS smoke_checks_run_idx ON public.smoke_checks(run_id, step);

DROP POLICY IF EXISTS "admin manages smoke runs" ON public.smoke_runs;
CREATE POLICY "admin manages smoke runs" ON public.smoke_runs
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "admin manages smoke checks" ON public.smoke_checks;
CREATE POLICY "admin manages smoke checks" ON public.smoke_checks
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- ===== 20260612055738_9fb6adf7-50c6-482d-8daf-c6a245809657.sql =====
INSERT INTO public.user_roles (user_id, role) VALUES ('9b98dc9e-f0ae-4230-a296-55ec557a9650', 'admin') ON CONFLICT (user_id, role) DO NOTHING;