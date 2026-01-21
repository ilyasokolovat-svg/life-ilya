-- Create focus_blocks table for tracking work sessions
CREATE TABLE public.focus_blocks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  goal TEXT NOT NULL,
  started_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  ended_at TIMESTAMP WITH TIME ZONE,
  duration_minutes INTEGER,
  completed BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.focus_blocks ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view their own focus blocks"
ON public.focus_blocks
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own focus blocks"
ON public.focus_blocks
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own focus blocks"
ON public.focus_blocks
FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own focus blocks"
ON public.focus_blocks
FOR DELETE
USING (auth.uid() = user_id);

-- Create index for faster queries by user and date
CREATE INDEX idx_focus_blocks_user_date ON public.focus_blocks(user_id, created_at DESC);