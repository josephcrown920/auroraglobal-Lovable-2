CREATE TABLE IF NOT EXISTS public.tiktok_accounts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references public.profiles(user_id) on delete cascade,
  open_id text not null,
  username text,
  display_name text,
  avatar_url text,
  access_token text not null,
  refresh_token text not null,
  token_expires_at timestamptz not null,
  refresh_expires_at timestamptz not null,
  scope text,
  oauth_state text,
  oauth_state_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.tiktok_accounts TO authenticated;
GRANT ALL ON public.tiktok_accounts TO service_role;
ALTER TABLE public.tiktok_accounts ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "own tiktok account" ON public.tiktok_accounts;
CREATE POLICY "own tiktok account" ON public.tiktok_accounts FOR ALL USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

CREATE TABLE IF NOT EXISTS public.tiktok_posts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(user_id) on delete cascade,
  generation_id text,
  video_url text not null,
  title text,
  publish_id text,
  status text not null default 'pending',
  error_msg text,
  posted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.tiktok_posts TO authenticated;
GRANT ALL ON public.tiktok_posts TO service_role;
ALTER TABLE public.tiktok_posts ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "own tiktok posts" ON public.tiktok_posts;
CREATE POLICY "own tiktok posts" ON public.tiktok_posts FOR ALL USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

CREATE OR REPLACE FUNCTION public.set_tiktok_updated_at()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN new.updated_at = now(); RETURN new; END;
$$;
CREATE OR REPLACE TRIGGER tiktok_accounts_updated_at BEFORE UPDATE ON public.tiktok_accounts FOR EACH ROW EXECUTE FUNCTION public.set_tiktok_updated_at();
CREATE OR REPLACE TRIGGER tiktok_posts_updated_at BEFORE UPDATE ON public.tiktok_posts FOR EACH ROW EXECUTE FUNCTION public.set_tiktok_updated_at();

ALTER TABLE public.agent_chat_messages ADD COLUMN IF NOT EXISTS skill_meta jsonb;
ALTER TABLE public.agent_user_memory ADD COLUMN IF NOT EXISTS structured_memory jsonb;

ALTER TABLE public.generations ADD COLUMN IF NOT EXISTS is_hidden boolean NOT NULL DEFAULT false;
CREATE INDEX IF NOT EXISTS generations_hidden_idx ON public.generations (user_id, is_hidden, created_at desc);