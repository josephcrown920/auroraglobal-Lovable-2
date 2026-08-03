ALTER TABLE public.gpu_workers
  ADD COLUMN IF NOT EXISTS last_probe_at timestamptz,
  ADD COLUMN IF NOT EXISTS last_probe_ok boolean,
  ADD COLUMN IF NOT EXISTS last_probe_detail text,
  ADD COLUMN IF NOT EXISTS last_probe_error text;