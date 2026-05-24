
-- 1. Drop old YYYY-MM investment snapshots (superseded by YYYY-MM-DD historical entries)
DELETE FROM public.investment_snapshots WHERE length(month) = 7;

-- 2. Remove legacy duplicate cash account ("Cash " with trailing space) and "Trading account"
DELETE FROM public.nw_snapshots
WHERE account_id IN (
  SELECT id FROM public.accounts WHERE label IN ('Cash ', 'Trading account')
);

DELETE FROM public.accounts WHERE label IN ('Cash ', 'Trading account');
