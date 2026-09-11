CREATE TABLE public.finance_trips (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  title text NOT NULL,
  destination text,
  start_date date NOT NULL,
  end_date date NOT NULL,
  planned_budget numeric NOT NULL DEFAULT 0,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.finance_trips TO authenticated;
GRANT ALL ON public.finance_trips TO service_role;

ALTER TABLE public.finance_trips ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage their own finance trips"
  ON public.finance_trips FOR ALL TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE TRIGGER t_finance_trips_updated BEFORE UPDATE ON public.finance_trips
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE public.finance_trip_expenses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  trip_id uuid NOT NULL REFERENCES public.finance_trips(id) ON DELETE CASCADE,
  category text NOT NULL,
  description text,
  amount numeric NOT NULL DEFAULT 0,
  spent_on date,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.finance_trip_expenses TO authenticated;
GRANT ALL ON public.finance_trip_expenses TO service_role;

ALTER TABLE public.finance_trip_expenses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage their own trip expenses"
  ON public.finance_trip_expenses FOR ALL TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE TRIGGER t_finance_trip_expenses_updated BEFORE UPDATE ON public.finance_trip_expenses
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE INDEX idx_finance_trip_expenses_trip ON public.finance_trip_expenses(trip_id);