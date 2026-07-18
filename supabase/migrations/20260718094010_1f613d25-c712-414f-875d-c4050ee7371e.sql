
ALTER TABLE public.budget_spending
  ADD COLUMN IF NOT EXISTS locked boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS source text NOT NULL DEFAULT 'manual';

CREATE TABLE IF NOT EXISTS public.expense_category_mappings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  source_label text NOT NULL,
  target_category_id uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, source_label)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.expense_category_mappings TO authenticated;
GRANT ALL ON public.expense_category_mappings TO service_role;
ALTER TABLE public.expense_category_mappings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own expense mappings"
  ON public.expense_category_mappings FOR ALL
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE TABLE IF NOT EXISTS public.expense_imports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  filename text NOT NULL,
  row_count integer NOT NULL DEFAULT 0,
  months_touched text[] NOT NULL DEFAULT '{}',
  imported_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.expense_imports TO authenticated;
GRANT ALL ON public.expense_imports TO service_role;
ALTER TABLE public.expense_imports ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own expense imports"
  ON public.expense_imports FOR ALL
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
