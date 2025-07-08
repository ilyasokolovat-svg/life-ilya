
-- Add priority field to goals_data table
ALTER TABLE goals_data ADD COLUMN priority TEXT DEFAULT 'medium' CHECK (priority IN ('high', 'medium', 'low'));

-- Add day assignment fields for the weekly planner
ALTER TABLE goals_data ADD COLUMN assigned_day TEXT CHECK (assigned_day IN ('monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'));
ALTER TABLE goals_data ADD COLUMN assigned_time_slot TEXT CHECK (assigned_time_slot IN ('morning', 'afternoon', 'evening'));

-- Create indexes for better performance
CREATE INDEX idx_goals_data_priority ON goals_data(priority);
CREATE INDEX idx_goals_data_assigned_day ON goals_data(assigned_day);
