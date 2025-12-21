-- Add lived_in column to visited_countries table
ALTER TABLE public.visited_countries
ADD COLUMN lived_in boolean NOT NULL DEFAULT false;