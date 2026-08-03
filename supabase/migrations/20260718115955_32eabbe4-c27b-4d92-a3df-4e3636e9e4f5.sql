CREATE TABLE IF NOT EXISTS public.agent_chat_messages (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null check (role in ('user', 'assistant')),
  content text not null,
  plan jsonb,
  created_at timestamptz not null default now()
);
CREATE INDEX IF NOT EXISTS agent_chat_messages_user_created_idx ON public.agent_chat_messages (user_id, created_at desc);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.agent_chat_messages TO authenticated;
GRANT ALL ON public.agent_chat_messages TO service_role;
ALTER TABLE public.agent_chat_messages ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "agent_chat_messages_select_own" ON public.agent_chat_messages;
CREATE POLICY "agent_chat_messages_select_own" ON public.agent_chat_messages FOR SELECT TO authenticated USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "agent_chat_messages_insert_own" ON public.agent_chat_messages;
CREATE POLICY "agent_chat_messages_insert_own" ON public.agent_chat_messages FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "agent_chat_messages_delete_own" ON public.agent_chat_messages;
CREATE POLICY "agent_chat_messages_delete_own" ON public.agent_chat_messages FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE TABLE IF NOT EXISTS public.agent_user_memory (
  user_id uuid primary key references auth.users(id) on delete cascade,
  memory text not null default '',
  updated_at timestamptz not null default now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.agent_user_memory TO authenticated;
GRANT ALL ON public.agent_user_memory TO service_role;
ALTER TABLE public.agent_user_memory ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "agent_user_memory_select_own" ON public.agent_user_memory;
CREATE POLICY "agent_user_memory_select_own" ON public.agent_user_memory FOR SELECT TO authenticated USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "agent_user_memory_insert_own" ON public.agent_user_memory;
CREATE POLICY "agent_user_memory_insert_own" ON public.agent_user_memory FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "agent_user_memory_update_own" ON public.agent_user_memory;
CREATE POLICY "agent_user_memory_update_own" ON public.agent_user_memory FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "agent_user_memory_delete_own" ON public.agent_user_memory;
CREATE POLICY "agent_user_memory_delete_own" ON public.agent_user_memory FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE TABLE IF NOT EXISTS public.consent_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  tool text not null,
  policy_version text not null,
  consented_at timestamptz not null default now()
);
CREATE INDEX IF NOT EXISTS consent_logs_user_id_idx ON public.consent_logs(user_id);
ALTER TABLE public.consent_logs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "consent_logs_select_own" ON public.consent_logs;
CREATE POLICY "consent_logs_select_own" ON public.consent_logs FOR SELECT USING (auth.uid() = user_id);