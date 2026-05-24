import { useEffect, useRef, useState } from 'react';
import { useWealthData } from '@/wealth/useWealthData';
import { useAuth } from '@/contexts/AuthContext';
import { seedHistoricalIfNeeded, seedInitialGoalIfNeeded, ensureCoreAccounts } from './seed-historical';

export function useFinance() {
  const { user } = useAuth();
  const wealth = useWealthData();
  const ranRef = useRef(false);
  const [historicalSeeding, setHistoricalSeeding] = useState(false);

  // After base seed completes, run historical + initial-goal seed once.
  useEffect(() => {
    if (!user) return;
    if (wealth.loading || wealth.seeding) return;
    if (ranRef.current) return;
    ranRef.current = true;
    (async () => {
      setHistoricalSeeding(true);
      try {
        await ensureCoreAccounts(user.id);
        const added = await seedHistoricalIfNeeded(user.id);
        await seedInitialGoalIfNeeded(user.id);
        if (added) await wealth.refresh();
        else await wealth.refresh(); // refresh once to pick up any new accounts
      } finally {
        setHistoricalSeeding(false);
      }
    })();
  }, [user, wealth.loading, wealth.seeding]); // eslint-disable-line react-hooks/exhaustive-deps

  return { ...wealth, historicalSeeding };
}
