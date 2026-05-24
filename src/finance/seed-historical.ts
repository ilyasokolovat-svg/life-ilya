import { supabase } from '@/integrations/supabase/client';

const sb = supabase as any;

// Historical entries. For 2024-10-09 there is no total — total derived from crypto+etfs.
// For entries with only total (2021-2023), we store total in ETFs bucket placeholder; better:
// store as a single "Total portfolio" snapshot under ETFs bucket, with crypto/cash zero.
// For entries with crypto+etfs, cash = total - crypto - etfs.
export type HistEntry = { date: string; total?: number; crypto?: number; etfs?: number };

export const HISTORICAL: HistEntry[] = [
  { date: '2021-01-24', total: 10240 },
  { date: '2021-05-05', total: 18102 },
  { date: '2021-05-22', total: 18077 },
  { date: '2021-08-07', total: 22272 },
  { date: '2021-08-17', total: 24822 },
  { date: '2021-08-23', total: 24008 },
  { date: '2021-09-12', total: 25600 },
  { date: '2021-10-20', total: 16512 },
  { date: '2021-10-26', total: 18816 },
  { date: '2021-11-11', total: 20689 },
  { date: '2021-11-22', total: 20211 },
  { date: '2021-12-26', total: 18669 },
  { date: '2022-01-02', total: 18317 },
  { date: '2022-01-08', total: 16000 },
  { date: '2022-01-16', total: 17001 },
  { date: '2022-01-22', total: 12867 },
  { date: '2022-02-06', total: 17540 },
  { date: '2022-03-12', total: 17731 },
  { date: '2022-03-28', total: 21617 },
  { date: '2022-04-03', total: 22134 },
  { date: '2022-04-15', total: 12979 },
  { date: '2022-05-04', total: 13572 },
  { date: '2022-08-03', total: 24960 },
  { date: '2022-08-25', total: 28713 },
  { date: '2022-09-04', total: 26884 },
  { date: '2022-11-01', total: 28253 },
  { date: '2022-11-05', total: 28893 },
  { date: '2022-11-22', total: 23160 },
  { date: '2023-01-11', total: 23366 },
  { date: '2023-01-22', total: 25882 },
  { date: '2023-01-29', total: 27756 },
  { date: '2023-02-12', total: 27648 },
  { date: '2023-02-18', total: 28709 },
  { date: '2023-03-04', total: 28292 },
  { date: '2023-03-12', total: 27158 },
  { date: '2023-03-19', total: 28271 },
  { date: '2023-04-02', total: 29842 },
  { date: '2023-09-13', total: 28951 },
  { date: '2023-10-22', total: 28090 },
  { date: '2023-10-27', total: 60388 },
  { date: '2023-11-12', total: 64554 },
  { date: '2024-01-24', total: 56603 },
  { date: '2024-02-16', total: 61869 },
  { date: '2024-04-21', total: 64384 },
  { date: '2024-07-11', total: 49293, crypto: 28720, etfs: 19430 },
  { date: '2024-08-15', total: 45464, crypto: 25836, etfs: 18500 },
  { date: '2024-10-09', crypto: 30429, etfs: 16852 },
  { date: '2024-11-02', total: 46768, crypto: 31385, etfs: 15383 },
  { date: '2024-11-10', total: 54209 },
  { date: '2024-11-14', total: 54977 },
  { date: '2024-11-27', total: 62527 },
  { date: '2024-12-02', total: 68033 },
  { date: '2024-12-05', total: 72412, crypto: 55342, etfs: 17070 },
  { date: '2024-12-30', total: 63435, crypto: 46435, etfs: 17000 },
  { date: '2025-02-18', total: 45977, crypto: 33477, etfs: 12500 },
  { date: '2025-03-04', total: 39019, crypto: 29214, etfs: 9805 },
  { date: '2025-06-14', total: 41004, crypto: 25354, etfs: 10750 },
  { date: '2025-08-12', total: 49911, crypto: 32583, etfs: 17328 },
  { date: '2025-09-05', total: 53003, crypto: 33452, etfs: 18190 },
  { date: '2025-11-13', total: 54867, crypto: 33445, etfs: 21422 },
  { date: '2025-12-03', total: 54873, crypto: 31646, etfs: 23227 },
  { date: '2026-05-05', total: 59498, crypto: 25896, etfs: 27402 },
];

const MARKER = '2021-01-24';

export async function seedHistoricalIfNeeded(userId: string): Promise<boolean> {
  // Check marker — if we already have a snapshot dated 2021-01-24, skip.
  const { data: existing } = await sb
    .from('investment_snapshots')
    .select('id')
    .eq('user_id', userId)
    .eq('month', MARKER)
    .limit(1);
  if (existing && existing.length) return false;

  // Ensure buckets exist (label → id)
  const { data: bucketRows } = await sb
    .from('investment_buckets')
    .select('*')
    .eq('user_id', userId);
  const bucketByLabel = new Map<string, string>();
  (bucketRows || []).forEach((b: any) => bucketByLabel.set(b.label, b.id));

  const ensureBucket = async (label: string, color: string, sort: number) => {
    if (bucketByLabel.has(label)) return bucketByLabel.get(label)!;
    const { data } = await sb
      .from('investment_buckets')
      .insert({ user_id: userId, label, color, sort_order: sort, description: '' })
      .select()
      .single();
    bucketByLabel.set(label, data.id);
    return data.id as string;
  };

  const etfsId = await ensureBucket('Global ETFs & Stocks', '#534AB7', 0);
  const cryptoId = await ensureBucket('Crypto', '#EF9F27', 1);
  const cashId = await ensureBucket('Cash in brokers', '#1D9E75', 2);

  const rows: any[] = [];
  for (const e of HISTORICAL) {
    const hasSplit = e.crypto != null && e.etfs != null;
    if (hasSplit) {
      const total = e.total ?? (e.crypto! + e.etfs!);
      const cash = Math.max(0, total - e.crypto! - e.etfs!);
      rows.push({ user_id: userId, month: e.date, bucket_id: etfsId, value: e.etfs, contribution: 0 });
      rows.push({ user_id: userId, month: e.date, bucket_id: cryptoId, value: e.crypto, contribution: 0 });
      rows.push({ user_id: userId, month: e.date, bucket_id: cashId, value: cash, contribution: 0 });
    } else if (e.total != null) {
      // No split available — put entire total under ETFs as best guess
      rows.push({ user_id: userId, month: e.date, bucket_id: etfsId, value: e.total, contribution: 0 });
      rows.push({ user_id: userId, month: e.date, bucket_id: cryptoId, value: 0, contribution: 0 });
      rows.push({ user_id: userId, month: e.date, bucket_id: cashId, value: 0, contribution: 0 });
    }
  }

  if (rows.length) {
    // Chunk to avoid payload limits
    for (let i = 0; i < rows.length; i += 200) {
      await sb.from('investment_snapshots').insert(rows.slice(i, i + 200));
    }
  }

  return true;
}

// Ensure the default $1M goal exists.
export async function seedInitialGoalIfNeeded(userId: string): Promise<void> {
  const { data: goals } = await sb.from('goals').select('id, name').eq('user_id', userId);
  if (goals && goals.length) return;
  await sb.from('goals').insert({
    user_id: userId,
    name: '$1M net worth by Sep 2029',
    target_amount: 1_000_000,
    target_date: '2029-09',
    color: '#534AB7',
    priority: 1,
    allocation_pct: 100,
    value_source: 'net_worth',
    manual_current_value: 0,
  });
}

// Ensure debt accounts (Credit Card, Car Loan) and cash account exist.
export async function ensureCoreAccounts(userId: string): Promise<void> {
  const { data: accs } = await sb.from('accounts').select('*').eq('user_id', userId);
  const labels = new Set((accs || []).map((a: any) => a.label));
  const ensure = async (label: string, type: string, color: string, sort: number, liquid: boolean) => {
    if (labels.has(label)) return;
    await sb.from('accounts').insert({
      user_id: userId, label, type, color, sort_order: sort, liquid, is_estimated: false,
    });
  };
  await ensure('Cash & Yield', 'cash', '#1D9E75', 0, true);
  await ensure('Credit Card', 'debt', '#E24B4A', 10, true);
  await ensure('Car Loan', 'debt', '#EF9F27', 11, false);
}
