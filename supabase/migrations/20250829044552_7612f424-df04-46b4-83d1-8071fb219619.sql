-- Create travel_periods table
CREATE TABLE public.travel_periods (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  location TEXT NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  emoji TEXT DEFAULT '✈️',
  color TEXT DEFAULT '#8B5CF6',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.travel_periods ENABLE ROW LEVEL SECURITY;

-- Create policies for travel periods
CREATE POLICY "Users can view their own travel periods" 
ON public.travel_periods 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own travel periods" 
ON public.travel_periods 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own travel periods" 
ON public.travel_periods 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own travel periods" 
ON public.travel_periods 
FOR DELETE 
USING (auth.uid() = user_id);

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_travel_periods_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_travel_periods_updated_at
BEFORE UPDATE ON public.travel_periods
FOR EACH ROW
EXECUTE FUNCTION public.update_travel_periods_updated_at();