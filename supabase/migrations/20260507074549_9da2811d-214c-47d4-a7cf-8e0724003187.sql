ALTER TABLE public.accounts ADD COLUMN IF NOT EXISTS target_pct numeric DEFAULT 0;
ALTER TABLE public.settings ADD COLUMN IF NOT EXISTS display_currency text DEFAULT 'USD';