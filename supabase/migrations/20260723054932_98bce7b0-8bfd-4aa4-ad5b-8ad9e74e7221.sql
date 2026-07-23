
CREATE TABLE public.target_companies (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  company_name text NOT NULL,
  category text,
  tier text,
  location_presence text,
  priority text NOT NULL DEFAULT 'Medium',
  status text NOT NULL DEFAULT 'Not started',
  target_roles text,
  careers_url text,
  warm_contact text,
  last_checked date,
  notes text,
  opportunity_id uuid REFERENCES public.job_opportunities(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX target_companies_user_idx ON public.target_companies(user_id);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.target_companies TO authenticated;
GRANT ALL ON public.target_companies TO service_role;

ALTER TABLE public.target_companies ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own target_companies select" ON public.target_companies
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users manage own target_companies insert" ON public.target_companies
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users manage own target_companies update" ON public.target_companies
  FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users manage own target_companies delete" ON public.target_companies
  FOR DELETE USING (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION public.update_target_companies_updated_at()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

CREATE TRIGGER update_target_companies_updated_at
BEFORE UPDATE ON public.target_companies
FOR EACH ROW EXECUTE FUNCTION public.update_target_companies_updated_at();
