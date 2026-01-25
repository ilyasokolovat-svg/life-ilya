-- Add vibe_rating column to social_event_archive
ALTER TABLE public.social_event_archive 
ADD COLUMN vibe_rating integer DEFAULT NULL;

-- Add UPDATE policy for social_event_archive
CREATE POLICY "Users can update their own archive entries" 
ON public.social_event_archive 
FOR UPDATE 
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);