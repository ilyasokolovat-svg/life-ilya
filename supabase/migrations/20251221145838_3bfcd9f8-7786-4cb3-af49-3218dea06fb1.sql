-- Add lived_in_periods as JSON array to support multiple periods
-- This replaces the individual year columns
ALTER TABLE public.visited_countries
ADD COLUMN lived_in_periods jsonb DEFAULT '[]'::jsonb;