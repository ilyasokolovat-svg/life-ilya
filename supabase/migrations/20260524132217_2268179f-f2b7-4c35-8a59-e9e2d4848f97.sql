ALTER TABLE public.goals DROP CONSTRAINT IF EXISTS goals_value_source_check;
ALTER TABLE public.goals ADD CONSTRAINT goals_value_source_check
  CHECK (value_source IN ('net_worth', 'total_portfolio', 'linked_account', 'linked_bucket', 'manual'));

ALTER TABLE public.goals DROP CONSTRAINT IF EXISTS goals_linked_account_id_fkey;

UPDATE public.goals
SET value_source = 'linked_bucket',
    linked_account_id = '41444409-5be5-4cc6-920e-3ddf482aa6b3'
WHERE name = 'Emergency Fund';