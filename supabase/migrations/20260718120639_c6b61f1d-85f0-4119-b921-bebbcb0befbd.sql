-- Schema additions referenced by the ported source but absent from the repo migrations.

-- Lip-sync gallery stores the source video(s) used for each render.
ALTER TABLE public.generations
  ADD COLUMN IF NOT EXISTS input_videos jsonb DEFAULT '[]'::jsonb;

-- GPU workers can advertise RunPod synchronous mode.
ALTER TABLE public.gpu_workers
  ADD COLUMN IF NOT EXISTS runpod_sync boolean NOT NULL DEFAULT false;

-- Lip-sync jobs can optionally belong to a batch.
ALTER TABLE public.lipsync_jobs
  ADD COLUMN IF NOT EXISTS batch_id uuid;

-- User-owned webhooks for generation/lifecycle events.
CREATE TABLE IF NOT EXISTS public.user_webhooks (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  url        text NOT NULL,
  events     text[] NOT NULL DEFAULT '{}',
  secret     text NOT NULL,
  active     boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS user_webhooks_user_idx
  ON public.user_webhooks (user_id);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.user_webhooks TO authenticated;
GRANT ALL ON public.user_webhooks TO service_role;

ALTER TABLE public.user_webhooks ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "user_webhooks_select_own" ON public.user_webhooks;
CREATE POLICY "user_webhooks_select_own" ON public.user_webhooks
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "user_webhooks_insert_own" ON public.user_webhooks;
CREATE POLICY "user_webhooks_insert_own" ON public.user_webhooks
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "user_webhooks_update_own" ON public.user_webhooks;
CREATE POLICY "user_webhooks_update_own" ON public.user_webhooks
  FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "user_webhooks_delete_own" ON public.user_webhooks;
CREATE POLICY "user_webhooks_delete_own" ON public.user_webhooks
  FOR DELETE TO authenticated USING (auth.uid() = user_id);