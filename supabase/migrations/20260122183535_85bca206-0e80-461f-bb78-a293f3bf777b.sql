-- Create social_contacts table for People CRM
CREATE TABLE public.social_contacts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  instagram TEXT,
  circle TEXT NOT NULL DEFAULT 'Other',
  vibe_score INTEGER NOT NULL DEFAULT 3 CHECK (vibe_score >= 1 AND vibe_score <= 5),
  status TEXT NOT NULL DEFAULT 'Lead',
  last_contacted DATE,
  next_action TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create social_experiences table for Experience Repository
CREATE TABLE public.social_experiences (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  title TEXT NOT NULL,
  tier TEXT NOT NULL DEFAULT 'Low',
  estimated_cost INTEGER NOT NULL DEFAULT 0,
  ideal_group_size TEXT,
  description TEXT,
  location TEXT,
  is_default BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create weekly_social_plans table for Weekly Planner
CREATE TABLE public.weekly_social_plans (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  week_start DATE NOT NULL,
  day_of_week INTEGER NOT NULL CHECK (day_of_week >= 1 AND day_of_week <= 7),
  experience_id UUID REFERENCES public.social_experiences(id) ON DELETE SET NULL,
  custom_title TEXT,
  guest_ids UUID[] DEFAULT '{}',
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create sunday_outreach_tasks table for Sunday Reset Dashboard
CREATE TABLE public.sunday_outreach_tasks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  week_start DATE NOT NULL,
  contact_id UUID REFERENCES public.social_contacts(id) ON DELETE CASCADE,
  outreach_type TEXT NOT NULL,
  completed BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.social_contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.social_experiences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.weekly_social_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sunday_outreach_tasks ENABLE ROW LEVEL SECURITY;

-- RLS policies for social_contacts
CREATE POLICY "Users can view their own contacts" ON public.social_contacts FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own contacts" ON public.social_contacts FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own contacts" ON public.social_contacts FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own contacts" ON public.social_contacts FOR DELETE USING (auth.uid() = user_id);

-- RLS policies for social_experiences
CREATE POLICY "Users can view their own experiences" ON public.social_experiences FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own experiences" ON public.social_experiences FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own experiences" ON public.social_experiences FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own experiences" ON public.social_experiences FOR DELETE USING (auth.uid() = user_id);

-- RLS policies for weekly_social_plans
CREATE POLICY "Users can view their own weekly plans" ON public.weekly_social_plans FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own weekly plans" ON public.weekly_social_plans FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own weekly plans" ON public.weekly_social_plans FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own weekly plans" ON public.weekly_social_plans FOR DELETE USING (auth.uid() = user_id);

-- RLS policies for sunday_outreach_tasks
CREATE POLICY "Users can view their own outreach tasks" ON public.sunday_outreach_tasks FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own outreach tasks" ON public.sunday_outreach_tasks FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own outreach tasks" ON public.sunday_outreach_tasks FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own outreach tasks" ON public.sunday_outreach_tasks FOR DELETE USING (auth.uid() = user_id);