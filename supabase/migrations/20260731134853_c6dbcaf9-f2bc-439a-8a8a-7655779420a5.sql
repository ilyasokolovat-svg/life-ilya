ALTER TABLE public.goal_metrics
  ADD COLUMN IF NOT EXISTS short_name text,
  ADD COLUMN IF NOT EXISTS last_updated_at timestamptz;

UPDATE public.goal_metrics SET last_updated_at = updated_at WHERE last_updated_at IS NULL;