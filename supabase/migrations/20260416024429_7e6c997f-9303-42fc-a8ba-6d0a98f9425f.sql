
-- Create checkin_reviews table for storing check-in answers
CREATE TABLE public.checkin_reviews (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  checkin_type text NOT NULL, -- 'weekly' | 'monthly' | 'quarterly'
  period_key text NOT NULL,   -- '2025-W11' | '2025-03' | '2025-Q1'
  answers jsonb NOT NULL DEFAULT '{}'::jsonb,
  completed boolean NOT NULL DEFAULT false,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.checkin_reviews ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own checkin reviews"
  ON public.checkin_reviews FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own checkin reviews"
  ON public.checkin_reviews FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own checkin reviews"
  ON public.checkin_reviews FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own checkin reviews"
  ON public.checkin_reviews FOR DELETE
  USING (auth.uid() = user_id);

-- Create checkin_state table (one row per user)
CREATE TABLE public.checkin_state (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL UNIQUE,
  weekly_last date,
  monthly_last date,
  quarterly_last date,
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.checkin_state ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own checkin state"
  ON public.checkin_state FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own checkin state"
  ON public.checkin_state FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own checkin state"
  ON public.checkin_state FOR UPDATE
  USING (auth.uid() = user_id);

-- Add unique constraint for preventing duplicate reviews per period
CREATE UNIQUE INDEX checkin_reviews_user_type_period ON public.checkin_reviews (user_id, checkin_type, period_key);
