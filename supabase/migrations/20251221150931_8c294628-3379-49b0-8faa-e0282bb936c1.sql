-- Add UPDATE policy for visited_countries table
CREATE POLICY "Users can update their own visited countries"
ON public.visited_countries
FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);