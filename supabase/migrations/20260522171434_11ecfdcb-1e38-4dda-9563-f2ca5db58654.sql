-- Remove duplicate investment-mirror accounts from net worth.
-- Investments (ETFs & Stocks, Crypto) will now be derived from investment_snapshots.
DELETE FROM public.nw_snapshots
WHERE account_id IN (
  SELECT id FROM public.accounts
  WHERE label IN ('ETFs & Stocks', 'Crypto') AND type = 'investments'
);

DELETE FROM public.accounts
WHERE label IN ('ETFs & Stocks', 'Crypto') AND type = 'investments';