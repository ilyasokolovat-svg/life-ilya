import { useCallback, useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

const sb = supabase as any;

export const TRIP_CATEGORIES = [
  'Plane tickets',
  'Hotels',
  'Food',
  'Transport',
  'General spendings',
] as const;
export type TripCategory = typeof TRIP_CATEGORIES[number];

export interface FinanceTrip {
  id: string;
  title: string;
  destination: string | null;
  start_date: string;
  end_date: string;
  planned_budget: number;
  notes: string | null;
}

export interface TripExpense {
  id: string;
  trip_id: string;
  category: string;
  description: string | null;
  amount: number;
  spent_on: string | null;
}

export function useFinanceTrips() {
  const { user } = useAuth();
  const [trips, setTrips] = useState<FinanceTrip[]>([]);
  const [expenses, setExpenses] = useState<TripExpense[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    if (!user) return;
    const [t, e] = await Promise.all([
      sb.from('finance_trips').select('*').eq('user_id', user.id).order('start_date', { ascending: false }),
      sb.from('finance_trip_expenses').select('*').eq('user_id', user.id),
    ]);
    setTrips(t.data || []);
    setExpenses(e.data || []);
    setLoading(false);
  }, [user]);

  useEffect(() => { refresh(); }, [refresh]);

  const addTrip = async (t: Omit<FinanceTrip, 'id'>) => {
    if (!user) return;
    await sb.from('finance_trips').insert({ ...t, user_id: user.id });
    await refresh();
  };

  const updateTrip = async (id: string, patch: Partial<FinanceTrip>) => {
    await sb.from('finance_trips').update(patch).eq('id', id);
    await refresh();
  };

  const deleteTrip = async (id: string) => {
    await sb.from('finance_trips').delete().eq('id', id);
    await refresh();
  };

  const addExpense = async (e: Omit<TripExpense, 'id'>) => {
    if (!user) return;
    await sb.from('finance_trip_expenses').insert({ ...e, user_id: user.id });
    await refresh();
  };

  const updateExpense = async (id: string, patch: Partial<TripExpense>) => {
    await sb.from('finance_trip_expenses').update(patch).eq('id', id);
    await refresh();
  };

  const deleteExpense = async (id: string) => {
    await sb.from('finance_trip_expenses').delete().eq('id', id);
    await refresh();
  };

  return { trips, expenses, loading, refresh, addTrip, updateTrip, deleteTrip, addExpense, updateExpense, deleteExpense };
}

export const tripDays = (start: string, end: string): number => {
  const a = new Date(start).getTime();
  const b = new Date(end).getTime();
  if (Number.isNaN(a) || Number.isNaN(b)) return 0;
  return Math.max(1, Math.round((b - a) / 86_400_000) + 1);
};
