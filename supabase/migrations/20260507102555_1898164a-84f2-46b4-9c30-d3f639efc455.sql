UPDATE goals g SET value_source = 'linked_account',
  linked_account_id = (SELECT id FROM accounts WHERE user_id = g.user_id AND label = 'Car Loan' LIMIT 1)
WHERE name = 'Debt Free (Car Loan)';