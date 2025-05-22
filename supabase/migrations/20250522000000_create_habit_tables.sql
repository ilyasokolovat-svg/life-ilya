
-- Create extension for UUID generation if it doesn't exist
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create habit_days table
CREATE TABLE IF NOT EXISTS public.habit_days (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL,
  date TEXT NOT NULL,
  habit_data JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, date)
);

-- Add Row Level Security policies
ALTER TABLE public.habit_days ENABLE ROW LEVEL SECURITY;

-- Create policy that allows users to access only their own data
DROP POLICY IF EXISTS habit_days_user_policy ON public.habit_days;
CREATE POLICY habit_days_user_policy
  ON public.habit_days
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Create habit_goals table
CREATE TABLE IF NOT EXISTS public.habit_goals (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL,
  month_key TEXT NOT NULL,
  goals_data JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, month_key)
);

-- Add Row Level Security policies
ALTER TABLE public.habit_goals ENABLE ROW LEVEL SECURITY;

-- Create policy that allows users to access only their own data
DROP POLICY IF EXISTS habit_goals_user_policy ON public.habit_goals;
CREATE POLICY habit_goals_user_policy
  ON public.habit_goals
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Create functions for backward compatibility
CREATE OR REPLACE FUNCTION create_habit_days_table()
RETURNS void AS $$
BEGIN
  -- This is now a no-op since we've created the table above
  -- but we keep it to maintain compatibility with existing code
  NULL;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION create_habit_goals_table()
RETURNS void AS $$
BEGIN
  -- This is now a no-op since we've created the table above
  -- but we keep it to maintain compatibility with existing code
  NULL;
END;
$$ LANGUAGE plpgsql;
