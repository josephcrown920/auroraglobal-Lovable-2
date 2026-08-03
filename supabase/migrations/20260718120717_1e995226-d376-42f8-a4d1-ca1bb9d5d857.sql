ALTER TABLE public.gpu_workers
  ADD COLUMN IF NOT EXISTS paused_reason text;