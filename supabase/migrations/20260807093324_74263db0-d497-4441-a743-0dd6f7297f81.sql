ALTER TABLE public.routine_log
  ADD COLUMN IF NOT EXISTS note text,
  ADD COLUMN IF NOT EXISTS target_snapshot numeric;