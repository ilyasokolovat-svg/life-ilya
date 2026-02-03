-- Drop the existing check constraint and add a new one that includes 'date'
ALTER TABLE weekly_social_plans DROP CONSTRAINT IF EXISTS weekly_social_plans_slot_type_check;

-- Add the new constraint that includes 'date' as a valid slot type
ALTER TABLE weekly_social_plans ADD CONSTRAINT weekly_social_plans_slot_type_check 
  CHECK (slot_type IS NULL OR slot_type IN ('mid_week', 'weekend', 'date'));