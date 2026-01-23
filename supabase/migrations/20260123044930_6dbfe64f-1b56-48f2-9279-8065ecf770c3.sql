-- Add category column to social_experiences table
ALTER TABLE public.social_experiences 
ADD COLUMN category TEXT DEFAULT 'Chill';

-- Update existing default experiences with appropriate categories based on their titles
UPDATE public.social_experiences SET category = 'Chill' WHERE title ILIKE '%walk%' OR title ILIKE '%coffee%';
UPDATE public.social_experiences SET category = 'Active' WHERE title ILIKE '%padel%' OR title ILIKE '%topgolf%' OR title ILIKE '%golf%';
UPDATE public.social_experiences SET category = 'Adventure' WHERE title ILIKE '%shooting%' OR title ILIKE '%helicopter%';
UPDATE public.social_experiences SET category = 'Cultural' WHERE title ILIKE '%gallery%' OR title ILIKE '%art%' OR title ILIKE '%alserkal%';
UPDATE public.social_experiences SET category = 'Luxe' WHERE title ILIKE '%yacht%' OR title ILIKE '%fine dining%' OR title ILIKE '%speakeasy%';
UPDATE public.social_experiences SET category = 'Home' WHERE title ILIKE '%home%' OR title ILIKE '%board game%' OR title ILIKE '%dinner%';