
CREATE TABLE public.goal_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  key text NOT NULL,
  name text NOT NULL,
  accent_color text NOT NULL DEFAULT '#6366f1',
  cadence text NOT NULL DEFAULT 'weekly',
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.goal_categories TO authenticated;
GRANT ALL ON public.goal_categories TO service_role;
ALTER TABLE public.goal_categories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own goal_categories" ON public.goal_categories FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE TABLE public.goal_horizons (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  category_id uuid NOT NULL REFERENCES public.goal_categories(id) ON DELETE CASCADE,
  tier text NOT NULL,
  label text NOT NULL DEFAULT '',
  target_date date,
  body text NOT NULL DEFAULT '',
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.goal_horizons TO authenticated;
GRANT ALL ON public.goal_horizons TO service_role;
ALTER TABLE public.goal_horizons ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own goal_horizons" ON public.goal_horizons FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE TABLE public.goal_quarters (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  category_id uuid NOT NULL REFERENCES public.goal_categories(id) ON DELETE CASCADE,
  label text NOT NULL,
  start_date date NOT NULL,
  end_date date NOT NULL,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.goal_quarters TO authenticated;
GRANT ALL ON public.goal_quarters TO service_role;
ALTER TABLE public.goal_quarters ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own goal_quarters" ON public.goal_quarters FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE TABLE public.goal_metrics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  quarter_id uuid NOT NULL REFERENCES public.goal_quarters(id) ON DELETE CASCADE,
  name text NOT NULL,
  current_value numeric NOT NULL DEFAULT 0,
  target_value numeric NOT NULL DEFAULT 0,
  start_value numeric,
  unit text NOT NULL DEFAULT '',
  direction text NOT NULL DEFAULT 'up',
  headline_priority integer NOT NULL DEFAULT 1,
  sort_order integer NOT NULL DEFAULT 0,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.goal_metrics TO authenticated;
GRANT ALL ON public.goal_metrics TO service_role;
ALTER TABLE public.goal_metrics ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own goal_metrics" ON public.goal_metrics FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE TABLE public.goal_routines (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  category_id uuid NOT NULL REFERENCES public.goal_categories(id) ON DELETE CASCADE,
  name text NOT NULL,
  target_per_week numeric NOT NULL DEFAULT 1,
  travel_mode_target numeric,
  is_binary boolean NOT NULL DEFAULT true,
  is_active boolean NOT NULL DEFAULT true,
  sort_order integer NOT NULL DEFAULT 0,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.goal_routines TO authenticated;
GRANT ALL ON public.goal_routines TO service_role;
ALTER TABLE public.goal_routines ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own goal_routines" ON public.goal_routines FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE TABLE public.routine_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  routine_id uuid NOT NULL REFERENCES public.goal_routines(id) ON DELETE CASCADE,
  week_start_date date NOT NULL,
  value numeric NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (routine_id, week_start_date)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.routine_log TO authenticated;
GRANT ALL ON public.routine_log TO service_role;
ALTER TABLE public.routine_log ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own routine_log" ON public.routine_log FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE TABLE public.checkins (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  week_start_date date NOT NULL,
  note text,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, week_start_date)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.checkins TO authenticated;
GRANT ALL ON public.checkins TO service_role;
ALTER TABLE public.checkins ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own checkins" ON public.checkins FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE TABLE public.goal_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE,
  travel_mode_active boolean NOT NULL DEFAULT false,
  travel_mode_until date,
  next_money_day date,
  todoist_note text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.goal_settings TO authenticated;
GRANT ALL ON public.goal_settings TO service_role;
ALTER TABLE public.goal_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own goal_settings" ON public.goal_settings FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

CREATE TRIGGER t_goal_categories_updated BEFORE UPDATE ON public.goal_categories FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER t_goal_horizons_updated BEFORE UPDATE ON public.goal_horizons FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER t_goal_quarters_updated BEFORE UPDATE ON public.goal_quarters FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER t_goal_metrics_updated BEFORE UPDATE ON public.goal_metrics FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER t_goal_routines_updated BEFORE UPDATE ON public.goal_routines FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER t_routine_log_updated BEFORE UPDATE ON public.routine_log FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER t_goal_settings_updated BEFORE UPDATE ON public.goal_settings FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
