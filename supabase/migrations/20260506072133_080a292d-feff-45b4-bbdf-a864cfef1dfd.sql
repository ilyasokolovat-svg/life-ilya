
-- Settings
CREATE TABLE public.settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users NOT NULL UNIQUE,
  currency text DEFAULT '$',
  savings_rate_target numeric DEFAULT 30,
  fi_multiplier numeric DEFAULT 25,
  annual_growth_rate numeric DEFAULT 6,
  display_name text DEFAULT 'Ilya',
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE public.accounts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users NOT NULL,
  label text NOT NULL,
  type text NOT NULL CHECK (type IN ('cash','investments','retirement','property','debt')),
  liquid boolean DEFAULT true,
  is_estimated boolean DEFAULT false,
  linked_goal_id uuid,
  color text DEFAULT '#60a5fa',
  sort_order integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE public.nw_snapshots (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users NOT NULL,
  month text NOT NULL,
  account_id uuid REFERENCES public.accounts(id) ON DELETE CASCADE NOT NULL,
  value numeric NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, month, account_id)
);

CREATE TABLE public.budget_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users NOT NULL,
  label text NOT NULL,
  budget numeric NOT NULL DEFAULT 0,
  color text DEFAULT '#4ade80',
  sort_order integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE public.budget_months (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users NOT NULL,
  month text NOT NULL,
  salary numeric NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, month)
);

CREATE TABLE public.budget_extras (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users NOT NULL,
  month text NOT NULL,
  description text NOT NULL,
  amount numeric NOT NULL,
  type text NOT NULL CHECK (type IN ('bonus','freelance','dividend','tax-refund','other')),
  created_at timestamptz DEFAULT now()
);

CREATE TABLE public.budget_spending (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users NOT NULL,
  month text NOT NULL,
  category_id uuid REFERENCES public.budget_categories(id) ON DELETE CASCADE NOT NULL,
  actual numeric NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, month, category_id)
);

CREATE TABLE public.investment_buckets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users NOT NULL,
  label text NOT NULL,
  description text,
  color text DEFAULT '#4ade80',
  sort_order integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE public.investment_snapshots (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users NOT NULL,
  month text NOT NULL,
  bucket_id uuid REFERENCES public.investment_buckets(id) ON DELETE CASCADE NOT NULL,
  value numeric NOT NULL DEFAULT 0,
  contribution numeric NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, month, bucket_id)
);

CREATE TABLE public.goals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users NOT NULL,
  name text NOT NULL,
  target_amount numeric NOT NULL,
  target_date text NOT NULL,
  color text DEFAULT '#4ade80',
  priority integer NOT NULL DEFAULT 1,
  allocation_pct numeric NOT NULL DEFAULT 25,
  linked_account_id uuid REFERENCES public.accounts(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE public.bonus_pools (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users NOT NULL,
  month text NOT NULL,
  description text NOT NULL,
  source_extra_id uuid REFERENCES public.budget_extras(id) ON DELETE CASCADE,
  total_amount numeric NOT NULL,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE public.bonus_allocations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users NOT NULL,
  pool_id uuid REFERENCES public.bonus_pools(id) ON DELETE CASCADE NOT NULL,
  goal_id uuid REFERENCES public.goals(id) ON DELETE CASCADE NOT NULL,
  amount numeric NOT NULL,
  note text,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS on all tables and create owner policies
DO $$
DECLARE t text;
BEGIN
  FOR t IN SELECT unnest(ARRAY[
    'settings','accounts','nw_snapshots','budget_categories','budget_months',
    'budget_extras','budget_spending','investment_buckets','investment_snapshots',
    'goals','bonus_pools','bonus_allocations'
  ]) LOOP
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', t);
    EXECUTE format('CREATE POLICY "own_select" ON public.%I FOR SELECT USING (auth.uid() = user_id)', t);
    EXECUTE format('CREATE POLICY "own_insert" ON public.%I FOR INSERT WITH CHECK (auth.uid() = user_id)', t);
    EXECUTE format('CREATE POLICY "own_update" ON public.%I FOR UPDATE USING (auth.uid() = user_id)', t);
    EXECUTE format('CREATE POLICY "own_delete" ON public.%I FOR DELETE USING (auth.uid() = user_id)', t);
  END LOOP;
END $$;
