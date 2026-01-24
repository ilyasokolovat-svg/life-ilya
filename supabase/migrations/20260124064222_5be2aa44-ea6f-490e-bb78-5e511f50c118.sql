-- Add completed field to weekly_social_plans to track if events were actually held
ALTER TABLE public.weekly_social_plans 
ADD COLUMN completed boolean NOT NULL DEFAULT false;

-- Add completed_at timestamp to know when it was marked complete
ALTER TABLE public.weekly_social_plans 
ADD COLUMN completed_at timestamp with time zone;

-- Create an archive table for completed past events (denormalized for easy querying)
CREATE TABLE public.social_event_archive (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  week_start DATE NOT NULL,
  slot_type TEXT NOT NULL,
  experience_title TEXT,
  experience_location TEXT,
  experience_cost INTEGER DEFAULT 0,
  guest_names TEXT[] DEFAULT '{}',
  guest_count INTEGER DEFAULT 0,
  completed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.social_event_archive ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own archive" 
ON public.social_event_archive 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own archive entries" 
ON public.social_event_archive 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own archive entries" 
ON public.social_event_archive 
FOR DELETE 
USING (auth.uid() = user_id);