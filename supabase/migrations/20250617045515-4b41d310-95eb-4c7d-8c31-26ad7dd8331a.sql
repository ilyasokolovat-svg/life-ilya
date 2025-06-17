
-- Create a table for standalone todos
CREATE TABLE public.standalone_todos (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users NOT NULL,
  text TEXT NOT NULL,
  completed BOOLEAN NOT NULL DEFAULT false,
  hidden BOOLEAN NOT NULL DEFAULT false,
  deadline TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add Row Level Security (RLS) to ensure users can only see their own todos
ALTER TABLE public.standalone_todos ENABLE ROW LEVEL SECURITY;

-- Create policy that allows users to SELECT their own todos
CREATE POLICY "Users can view their own standalone todos" 
  ON public.standalone_todos 
  FOR SELECT 
  USING (auth.uid() = user_id);

-- Create policy that allows users to INSERT their own todos
CREATE POLICY "Users can create their own standalone todos" 
  ON public.standalone_todos 
  FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

-- Create policy that allows users to UPDATE their own todos
CREATE POLICY "Users can update their own standalone todos" 
  ON public.standalone_todos 
  FOR UPDATE 
  USING (auth.uid() = user_id);

-- Create policy that allows users to DELETE their own todos
CREATE POLICY "Users can delete their own standalone todos" 
  ON public.standalone_todos 
  FOR DELETE 
  USING (auth.uid() = user_id);
