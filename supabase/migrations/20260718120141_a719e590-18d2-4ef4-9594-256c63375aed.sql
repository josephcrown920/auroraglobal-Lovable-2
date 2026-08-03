ALTER TABLE public.generations ADD COLUMN IF NOT EXISTS is_public boolean NOT NULL DEFAULT false, ADD COLUMN IF NOT EXISTS share_token text UNIQUE;
CREATE INDEX IF NOT EXISTS generations_share_token_idx ON public.generations(share_token) WHERE share_token IS NOT NULL;
CREATE INDEX IF NOT EXISTS generations_is_public_idx ON public.generations(is_public) WHERE is_public = true;

CREATE TABLE IF NOT EXISTS public.email_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  to_email text NOT NULL,
  template text NOT NULL,
  status text NOT NULL DEFAULT 'sent',
  error text,
  sent_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.email_log TO authenticated;
GRANT ALL ON public.email_log TO service_role;
ALTER TABLE public.email_log ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "users read own email log" ON public.email_log;
CREATE POLICY "users read own email log" ON public.email_log FOR SELECT TO authenticated USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "service writes email log" ON public.email_log;
CREATE POLICY "service writes email log" ON public.email_log FOR INSERT TO service_role WITH CHECK (true);