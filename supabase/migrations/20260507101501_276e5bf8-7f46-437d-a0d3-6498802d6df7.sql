
ALTER TABLE goals ADD COLUMN IF NOT EXISTS value_source text NOT NULL DEFAULT 'net_worth';
ALTER TABLE goals DROP CONSTRAINT IF EXISTS goals_value_source_check;
ALTER TABLE goals ADD CONSTRAINT goals_value_source_check CHECK (value_source IN ('net_worth','total_portfolio','linked_account','manual'));
ALTER TABLE goals ADD COLUMN IF NOT EXISTS manual_current_value numeric DEFAULT 0;

UPDATE goals SET value_source = 'net_worth' WHERE name IN ('Financial Independence','2026 Net Worth Target');

UPDATE goals g SET value_source = 'linked_account',
  linked_account_id = (SELECT a.id FROM accounts a WHERE a.user_id = g.user_id AND a.label = 'Cash & Yield' LIMIT 1)
WHERE name = 'Emergency Fund';

UPDATE goals g SET value_source = 'linked_account',
  linked_account_id = (SELECT a.id FROM accounts a WHERE a.user_id = g.user_id AND a.label ILIKE 'Car Loan%' LIMIT 1)
WHERE name = 'Pay Off Car Loan';
