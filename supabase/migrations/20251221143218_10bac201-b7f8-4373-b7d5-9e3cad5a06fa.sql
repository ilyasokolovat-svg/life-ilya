-- Create a table for manually added visited countries
CREATE TABLE public.visited_countries (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  country_code TEXT NOT NULL,
  country_name TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, country_code)
);

-- Enable Row Level Security
ALTER TABLE public.visited_countries ENABLE ROW LEVEL SECURITY;

-- Create policies for user access
CREATE POLICY "Users can view their own visited countries" 
ON public.visited_countries 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can add their own visited countries" 
ON public.visited_countries 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own visited countries" 
ON public.visited_countries 
FOR DELETE 
USING (auth.uid() = user_id);