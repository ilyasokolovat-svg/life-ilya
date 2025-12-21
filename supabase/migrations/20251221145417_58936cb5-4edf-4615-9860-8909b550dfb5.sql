-- Add lived_in_periods column to store period data as JSON
ALTER TABLE public.visited_countries
ADD COLUMN lived_in_start_year integer,
ADD COLUMN lived_in_end_year integer,
ADD COLUMN lived_in_notes text;