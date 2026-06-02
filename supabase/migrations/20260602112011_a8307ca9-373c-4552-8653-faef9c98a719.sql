CREATE TABLE public.b2broker_deals (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  company_name text NOT NULL,
  product text,
  arr_usd numeric NOT NULL DEFAULT 0,
  expected_bonus_usd numeric NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'in_progress',
  notes text,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.b2broker_deals TO authenticated;
GRANT ALL ON public.b2broker_deals TO service_role;

ALTER TABLE public.b2broker_deals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "own_select" ON public.b2broker_deals FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "own_insert" ON public.b2broker_deals FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "own_update" ON public.b2broker_deals FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "own_delete" ON public.b2broker_deals FOR DELETE USING (auth.uid() = user_id);

CREATE INDEX idx_b2broker_deals_user ON public.b2broker_deals(user_id);