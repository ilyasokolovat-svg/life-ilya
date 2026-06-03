
CREATE TABLE public.job_opportunities (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  company_name TEXT NOT NULL,
  role_title TEXT,
  direction TEXT NOT NULL DEFAULT 'Dubai',
  stage TEXT NOT NULL DEFAULT 'Lead',
  company_stage TEXT DEFAULT 'Unknown',
  base_salary_monthly_usd NUMERIC DEFAULT 0,
  equity_offered TEXT DEFAULT 'Unknown',
  entity_type TEXT DEFAULT 'Unknown',
  contact_name TEXT,
  contact_role TEXT,
  contact_linkedin TEXT,
  source TEXT,
  next_action TEXT,
  next_action_date DATE,
  notes TEXT,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.job_opportunities TO authenticated;
GRANT ALL ON public.job_opportunities TO service_role;
ALTER TABLE public.job_opportunities ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own_select" ON public.job_opportunities FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "own_insert" ON public.job_opportunities FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "own_update" ON public.job_opportunities FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "own_delete" ON public.job_opportunities FOR DELETE USING (auth.uid() = user_id);

CREATE TABLE public.weekly_activity (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  week_start_date DATE NOT NULL,
  applications_sent INTEGER NOT NULL DEFAULT 0,
  outreach_sent INTEGER NOT NULL DEFAULT 0,
  linkedin_posts INTEGER NOT NULL DEFAULT 0,
  recruiter_contacts INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, week_start_date)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.weekly_activity TO authenticated;
GRANT ALL ON public.weekly_activity TO service_role;
ALTER TABLE public.weekly_activity ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own_select" ON public.weekly_activity FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "own_insert" ON public.weekly_activity FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "own_update" ON public.weekly_activity FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "own_delete" ON public.weekly_activity FOR DELETE USING (auth.uid() = user_id);

CREATE TABLE public.job_search_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE,
  target_offer_date DATE NOT NULL DEFAULT '2026-10-31',
  checkpoint_date DATE NOT NULL DEFAULT '2026-08-31',
  weekly_target_applications INTEGER NOT NULL DEFAULT 7,
  weekly_target_outreach INTEGER NOT NULL DEFAULT 9,
  weekly_target_posts INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.job_search_settings TO authenticated;
GRANT ALL ON public.job_search_settings TO service_role;
ALTER TABLE public.job_search_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own_select" ON public.job_search_settings FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "own_insert" ON public.job_search_settings FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "own_update" ON public.job_search_settings FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "own_delete" ON public.job_search_settings FOR DELETE USING (auth.uid() = user_id);
