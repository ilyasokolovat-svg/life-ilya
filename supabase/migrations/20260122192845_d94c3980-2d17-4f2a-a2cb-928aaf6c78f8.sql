-- Add new columns to social_contacts for the redesigned system
ALTER TABLE social_contacts 
ADD COLUMN IF NOT EXISTS closeness TEXT DEFAULT 'Just Met',
ADD COLUMN IF NOT EXISTS where_met TEXT,
ADD COLUMN IF NOT EXISTS interesting_note TEXT;

-- Create weekly_outreach table for the checklist
CREATE TABLE IF NOT EXISTS weekly_outreach (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  week_start DATE NOT NULL,
  contact_id UUID REFERENCES social_contacts(id) ON DELETE CASCADE,
  contacted BOOLEAN DEFAULT false,
  confirmed_for TEXT CHECK (confirmed_for IN ('mid_week', 'weekend', NULL)),
  order_index INTEGER,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS on weekly_outreach
ALTER TABLE weekly_outreach ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for weekly_outreach
CREATE POLICY "Users can view their own outreach" ON weekly_outreach
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own outreach" ON weekly_outreach
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own outreach" ON weekly_outreach
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own outreach" ON weekly_outreach
  FOR DELETE USING (auth.uid() = user_id);

-- Add slot_type to weekly_social_plans for simpler event management
ALTER TABLE weekly_social_plans 
ADD COLUMN IF NOT EXISTS slot_type TEXT CHECK (slot_type IN ('mid_week', 'weekend'));