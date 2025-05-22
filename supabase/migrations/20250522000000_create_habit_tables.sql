
-- Create function to create habit_days table if it doesn't exist
CREATE OR REPLACE FUNCTION create_habit_days_table()
RETURNS void AS $$
BEGIN
  CREATE TABLE IF NOT EXISTS habit_days (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL,
    date TEXT NOT NULL,
    habit_data JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(user_id, date)
  );
  
  -- Add row level security policies
  ALTER TABLE habit_days ENABLE ROW LEVEL SECURITY;
  
  -- Create policy for users to access only their own data
  CREATE POLICY habit_days_user_policy
    ON habit_days
    USING (user_id = auth.uid())
    WITH CHECK (user_id = auth.uid());
END;
$$ LANGUAGE plpgsql;

-- Create function to create habit_goals table if it doesn't exist
CREATE OR REPLACE FUNCTION create_habit_goals_table()
RETURNS void AS $$
BEGIN
  CREATE TABLE IF NOT EXISTS habit_goals (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL,
    month_key TEXT NOT NULL,
    goals_data JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(user_id, month_key)
  );
  
  -- Add row level security policies
  ALTER TABLE habit_goals ENABLE ROW LEVEL SECURITY;
  
  -- Create policy for users to access only their own data
  CREATE POLICY habit_goals_user_policy
    ON habit_goals
    USING (user_id = auth.uid())
    WITH CHECK (user_id = auth.uid());
END;
$$ LANGUAGE plpgsql;
