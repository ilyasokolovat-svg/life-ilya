CREATE TABLE public.job_recruiters (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  name text NOT NULL,
  agency text,
  specialization text,
  region_focus text,
  email text,
  phone text,
  linkedin text,
  relationship_status text NOT NULL DEFAULT 'New',
  last_contacted date,
  next_followup date,
  roles_pitched text,
  notes text,
  sort_order integer DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.job_recruiters TO authenticated;
GRANT ALL ON public.job_recruiters TO service_role;

ALTER TABLE public.job_recruiters ENABLE ROW LEVEL SECURITY;

CREATE POLICY own_select ON public.job_recruiters FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY own_insert ON public.job_recruiters FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY own_update ON public.job_recruiters FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY own_delete ON public.job_recruiters FOR DELETE USING (auth.uid() = user_id);