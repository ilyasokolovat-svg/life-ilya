import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { todayISO, fmtUSD } from '../utils';

const sb = supabase as any;

export const DebtUpdateDialog: React.FC<{
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
  accountId: string | undefined;
  accountLabel: string;
  previousValue: number; // stored value (negative for debts)
}> = ({ open, onClose, onSaved, accountId, accountLabel, previousValue }) => {
  const { user } = useAuth();
  const prevAbs = Math.abs(previousValue);
  const [balance, setBalance] = useState(String(prevAbs));
  const [date, setDate] = useState(todayISO());
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) {
      setBalance(String(prevAbs));
      setDate(todayISO());
    }
  }, [open, prevAbs]);

  const num = Number(balance) || 0;
  const change = num - prevAbs;

  const save = async () => {
    if (!user || !accountId) return;
    setSaving(true);
    // Always store debt as negative for consistency with existing data.
    const storedValue = -Math.abs(num);
    // Upsert by (user, month, account)
    const { data: existing } = await sb
      .from('nw_snapshots')
      .select('id')
      .eq('user_id', user.id)
      .eq('account_id', accountId)
      .eq('month', date)
      .maybeSingle();
    if (existing) {
      await sb.from('nw_snapshots').update({ value: storedValue }).eq('id', existing.id);
    } else {
      await sb.from('nw_snapshots').insert({ user_id: user.id, account_id: accountId, month: date, value: storedValue });
    }
    setSaving(false);
    onSaved();
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Update {accountLabel}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="space-y-1.5">
            <Label htmlFor="debt-bal">Current balance ($)</Label>
            <Input id="debt-bal" type="number" autoFocus value={balance} onChange={e => setBalance(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="debt-date">Date</Label>
            <Input id="debt-date" type="date" value={date} onChange={e => setDate(e.target.value)} />
          </div>
          <div className="text-xs text-muted-foreground space-y-1 p-3 bg-muted rounded-md">
            <div>Previous: <span className="font-mono">{fmtUSD(prevAbs)}</span></div>
            <div>
              Change:{' '}
              <span className={`font-mono ${change > 0 ? 'text-destructive' : change < 0 ? 'text-emerald-600' : ''}`}>
                {fmtUSD(change, { sign: true })}
              </span>
            </div>
          </div>
          <p className="text-[11px] text-muted-foreground italic">Saved to debt history in Details.</p>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={save} disabled={saving}>{saving ? 'Saving…' : 'Save'}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
