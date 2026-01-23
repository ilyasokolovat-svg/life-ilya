-- Create playbook_tips table for customizable Host's Playbook content
CREATE TABLE public.playbook_tips (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  section TEXT NOT NULL CHECK (section IN ('timeline', 'alchemy', 'scripts')),
  title TEXT NOT NULL,
  content JSONB NOT NULL DEFAULT '{}'::jsonb,
  order_index INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.playbook_tips ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own playbook tips"
ON public.playbook_tips FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own playbook tips"
ON public.playbook_tips FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own playbook tips"
ON public.playbook_tips FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own playbook tips"
ON public.playbook_tips FOR DELETE
USING (auth.uid() = user_id);

-- Create index for faster queries
CREATE INDEX idx_playbook_tips_user_section ON public.playbook_tips(user_id, section, order_index);