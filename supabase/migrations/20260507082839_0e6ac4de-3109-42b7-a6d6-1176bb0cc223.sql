INSERT INTO nw_snapshots (user_id, month, account_id, value)
WITH mapping AS (
  SELECT '1a37efae-b766-4557-8204-6163c618c973'::uuid AS bucket_id, 'ebadcc69-05f3-4202-8096-68309fe393e4'::uuid AS account_id
  UNION ALL SELECT 'ef3b4fa3-baec-49bd-a109-01ca4f19109f', '05aac848-ea83-4742-bff5-d7dfc89437ce'
  UNION ALL SELECT '5303f595-5591-4fa4-ab92-3e33be999d71', 'd7848cd8-c606-48d4-b515-c7bfba83e594'
)
SELECT i.user_id, i.month, m.account_id, i.value
FROM investment_snapshots i
JOIN mapping m ON m.bucket_id = i.bucket_id
WHERE NOT EXISTS (
  SELECT 1 FROM nw_snapshots n WHERE n.month = i.month AND n.account_id = m.account_id
);