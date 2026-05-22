import { useEffect, useState, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import type { WealthData } from './types';
import {
  SEED_ACCOUNTS, SEED_BUCKETS, SEED_INVESTMENTS, SEED_NW, SEED_BUDGET_CATS,
  SEED_BUDGET_MONTHS, SEED_GOALS, SEED_SETTINGS,
} from './seed';

const empty: WealthData = {
  settings: null, accounts: [], nwSnapshots: [], budgetCategories: [],
  budgetMonths: [], budgetExtras: [], budgetSpending: [], investmentBuckets: [],
  investmentSnapshots: [], goals: [], bonusPools: [], bonusAllocations: [],
};

export const VIRTUAL_INVESTMENT_ACCOUNT_ID = '__investments__';

// Inject a synthetic "Investments" account whose monthly value is the sum of
// investment_snapshots for that month. Investments tab is single source of truth.
function withDerivedInvestments(data: WealthData): WealthData {
  if (!data.investmentSnapshots.length && !data.investmentBuckets.length) return data;
  const syntheticAccount = {
    id: VIRTUAL_INVESTMENT_ACCOUNT_ID,
    label: 'Investments',
    type: 'investments' as const,
    liquid: true,
    is_estimated: false,
    linked_goal_id: null,
    color: '#4ade80',
    sort_order: 1,
    target_pct: 0,
  };
  const accounts = data.accounts.some(a => a.id === VIRTUAL_INVESTMENT_ACCOUNT_ID)
    ? data.accounts
    : [...data.accounts, syntheticAccount as any];
  const perMonth = new Map<string, number>();
  for (const s of data.investmentSnapshots) {
    perMonth.set(s.month, (perMonth.get(s.month) || 0) + Number(s.value));
  }
  const synthSnaps = Array.from(perMonth.entries()).map(([month, value]) => ({
    id: `__inv__${month}`,
    month,
    account_id: VIRTUAL_INVESTMENT_ACCOUNT_ID,
    value,
  }));
  return { ...data, accounts, nwSnapshots: [...data.nwSnapshots, ...synthSnaps] };
}

const sb = supabase as any;

export function useWealthData() {
  const { user } = useAuth();
  const [data, setData] = useState<WealthData>(empty);
  const [loading, setLoading] = useState(true);
  const [seeding, setSeeding] = useState(false);
  const [firstTime, setFirstTime] = useState(false);

  const fetchAll = useCallback(async () => {
    if (!user) return;
    const uid = user.id;
    const [
      settings, accounts, nwSnapshots, budgetCategories, budgetMonths,
      budgetExtras, budgetSpending, investmentBuckets, investmentSnapshots,
      goals, bonusPools, bonusAllocations,
    ] = await Promise.all([
      sb.from('settings').select('*').eq('user_id', uid).maybeSingle(),
      sb.from('accounts').select('*').eq('user_id', uid).order('sort_order'),
      sb.from('nw_snapshots').select('*').eq('user_id', uid),
      sb.from('budget_categories').select('*').eq('user_id', uid).order('sort_order'),
      sb.from('budget_months').select('*').eq('user_id', uid),
      sb.from('budget_extras').select('*').eq('user_id', uid),
      sb.from('budget_spending').select('*').eq('user_id', uid),
      sb.from('investment_buckets').select('*').eq('user_id', uid).order('sort_order'),
      sb.from('investment_snapshots').select('*').eq('user_id', uid),
      sb.from('goals').select('*').eq('user_id', uid).order('priority'),
      sb.from('bonus_pools').select('*').eq('user_id', uid),
      sb.from('bonus_allocations').select('*').eq('user_id', uid),
    ]);
    setData(withDerivedInvestments({
      settings: settings.data,
      accounts: accounts.data || [],
      nwSnapshots: nwSnapshots.data || [],
      budgetCategories: budgetCategories.data || [],
      budgetMonths: budgetMonths.data || [],
      budgetExtras: budgetExtras.data || [],
      budgetSpending: budgetSpending.data || [],
      investmentBuckets: investmentBuckets.data || [],
      investmentSnapshots: investmentSnapshots.data || [],
      goals: goals.data || [],
      bonusPools: bonusPools.data || [],
      bonusAllocations: bonusAllocations.data || [],
    }));
    return settings.data;
  }, [user]);

  const seedingRef = useRef(false);

  const seed = useCallback(async () => {
    if (!user) return;
    if (seedingRef.current) return;
    seedingRef.current = true;
    const uid = user.id;

    // Idempotency guard: if settings exist, abort
    const { data: existing } = await sb.from('settings').select('id').eq('user_id', uid).maybeSingle();
    if (existing) { seedingRef.current = false; return; }

    setSeeding(true);

    await sb.from('settings').insert({ user_id: uid, ...SEED_SETTINGS });

    const { data: accs } = await sb.from('accounts').insert(
      SEED_ACCOUNTS.map(a => ({ ...a, user_id: uid }))
    ).select();
    const accMap: Record<string, string> = {};
    (accs || []).forEach((a: any) => { accMap[a.label] = a.id; });

    const { data: bucks } = await sb.from('investment_buckets').insert(
      SEED_BUCKETS.map(b => ({ ...b, user_id: uid }))
    ).select();
    const bMap: Record<string, string> = {};
    (bucks || []).forEach((b: any) => { bMap[b.label] = b.id; });

    const invRows: any[] = [];
    for (const [m, _t, c, s, cash] of SEED_INVESTMENTS) {
      invRows.push({ user_id: uid, month: m, bucket_id: bMap['Global ETFs & Stocks'], value: s, contribution: 0 });
      invRows.push({ user_id: uid, month: m, bucket_id: bMap['Crypto'], value: c, contribution: 0 });
      invRows.push({ user_id: uid, month: m, bucket_id: bMap['Cash in brokers'], value: cash, contribution: 0 });
    }
    await sb.from('investment_snapshots').insert(invRows);

    const nwRows: any[] = [];
    for (const [m, cash, inv, cry, car, cc] of SEED_NW) {
      nwRows.push({ user_id: uid, month: m, account_id: accMap['Cash & Yield'], value: cash });
      nwRows.push({ user_id: uid, month: m, account_id: accMap['ETFs & Stocks'], value: inv });
      nwRows.push({ user_id: uid, month: m, account_id: accMap['Crypto'], value: cry });
      nwRows.push({ user_id: uid, month: m, account_id: accMap['Car Loan'], value: car });
      nwRows.push({ user_id: uid, month: m, account_id: accMap['Credit Card'], value: cc });
    }
    await sb.from('nw_snapshots').insert(nwRows);

    await sb.from('budget_categories').insert(SEED_BUDGET_CATS.map(c => ({ ...c, user_id: uid })));

    for (const bm of SEED_BUDGET_MONTHS) {
      await sb.from('budget_months').insert({ user_id: uid, month: bm.month, salary: bm.salary });
      await sb.from('budget_extras').insert({ user_id: uid, month: bm.month, ...bm.extra });
    }

    await sb.from('goals').insert(SEED_GOALS.map(g => ({ ...g, user_id: uid })));

    setSeeding(false);
    setFirstTime(true);
    seedingRef.current = false;
    await fetchAll();
  }, [user, fetchAll]);

  const wipeAndReseed = useCallback(async () => {
    if (!user) return;
    const uid = user.id;
    setSeeding(true);
    const tables = [
      'bonus_allocations', 'bonus_pools', 'budget_spending', 'budget_extras', 'budget_months',
      'budget_categories', 'investment_snapshots', 'investment_buckets',
      'nw_snapshots', 'goals', 'accounts', 'settings',
    ];
    for (const t of tables) {
      await sb.from(t).delete().eq('user_id', uid);
    }
    setSeeding(false);
    await seed();
  }, [user, seed]);

  useEffect(() => {
    if (!user) return;
    (async () => {
      setLoading(true);
      const settings = await fetchAll();
      if (!settings) {
        await seed();
      }
      setLoading(false);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  return { data, loading, seeding, firstTime, setFirstTime, refresh: fetchAll, wipeAndReseed };
}
