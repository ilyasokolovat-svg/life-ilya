import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import type { WealthData } from '@/wealth/types';
import { GOAL_COLOR_PRESETS } from '../constants';
import { Trash2 } from 'lucide-react';

const sb = supabase as any;

type Source = 'net_worth' | 'total_portfolio' | 'linked_bucket' | 'manual';

export interface GoalDialogProps {
  d: WealthData;
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
  goal?: any | null; // null/undefined = create
}

export const GoalDialog: React.FC<GoalDialogProps> = ({ d, open, onClose, onSaved, goal }) => {
  const { user } = useAuth();
  const isEdit = !!goal;
  const [name, setName] = useState('');
  const [target, setTarget] = useState('1000000');
  const [deadline, setDeadline] = useState('2029-09');
  const [source, setSource] = useState<Source>('net_worth');
  const [bucketId, setBucketId] = useState<string>('');
  const [manualValue, setManualValue] = useState('0');
  const [plannedMonthly, setPlannedMonthly] = useState<string>('');
  const [color, setColor] = useState<string>(GOAL_COLOR_PRESETS[0]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) {
      setName(goal?.name ?? '');
      setTarget(String(goal?.target_amount ?? 1000000));
      setDeadline((goal?.target_date ?? '2029-09').slice(0, 7));
      const rawSrc = (goal?.value_source as string) || 'net_worth';
      const src: Source = rawSrc === 'linked_account' || rawSrc === 'linked_bucket' ? 'linked_bucket' : (rawSrc as Source);
      setSource(src);
      setBucketId(goal?.linked_account_id ?? '');
      setManualValue(String(goal?.manual_current_value ?? 0));
      setPlannedMonthly(goal?.planned_monthly_contribution != null ? String(goal.planned_monthly_contribution) : '');
      setColor(goal?.color ?? GOAL_COLOR_PRESETS[0]);
    }
  }, [open, goal]);

  const save = async () => {
    if (!user || !name.trim()) return;
    setSaving(true);
    const payload: any = {
      user_id: user.id,
      name: name.trim(),
      target_amount: Number(target) || 0,
      target_date: deadline,
      color,
      value_source: source === 'linked_bucket' ? 'linked_bucket' : source,
      linked_account_id: source === 'linked_bucket' ? bucketId || null : null,
      manual_current_value: source === 'manual' ? (Number(manualValue) || 0) : 0,
      planned_monthly_contribution: plannedMonthly.trim() === '' ? null : (Number(plannedMonthly) || null),
    };
    if (isEdit) {
      await sb.from('goals').update(payload).eq('id', goal.id);
    } else {
      await sb.from('goals').insert({ ...payload, priority: (d.goals.length || 0) + 1, allocation_pct: 100 });
    }
    setSaving(false);
    onSaved();
    onClose();
  };

  const remove = async () => {
    if (!goal) return;
    if (!confirm('Delete this goal?')) return;
    await sb.from('bonus_allocations').delete().eq('goal_id', goal.id);
    await sb.from('goals').delete().eq('id', goal.id);
    onSaved();
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Edit goal' : 'New goal'}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="space-y-1.5">
            <Label htmlFor="goal-name">Goal name</Label>
            <Input id="goal-name" value={name} onChange={e => setName(e.target.value)} placeholder="$1M net worth by Sep 2029" />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="goal-target">Target amount ($)</Label>
              <Input id="goal-target" type="number" value={target} onChange={e => setTarget(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="goal-deadline">Deadline</Label>
              <Input id="goal-deadline" type="month" value={deadline} onChange={e => setDeadline(e.target.value)} />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>Tracks which metric</Label>
            <Select value={source} onValueChange={(v) => setSource(v as Source)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="net_worth">Net worth (investments − credit card)</SelectItem>
                <SelectItem value="total_portfolio">Total investments</SelectItem>
                <SelectItem value="linked_bucket">Specific bucket</SelectItem>
                <SelectItem value="manual">Manual entry</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {source === 'linked_bucket' && (
            <div className="space-y-1.5">
              <Label>Bucket</Label>
              <Select value={bucketId} onValueChange={setBucketId}>
                <SelectTrigger><SelectValue placeholder="Select bucket" /></SelectTrigger>
                <SelectContent>
                  {d.investmentBuckets.map(b => (
                    <SelectItem key={b.id} value={b.id}>{b.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {source === 'manual' && (
            <div className="space-y-1.5">
              <Label htmlFor="manual-val">Current value ($)</Label>
              <Input id="manual-val" type="number" value={manualValue} onChange={e => setManualValue(e.target.value)} />
            </div>
          )}

          <div className="space-y-1.5">
            <Label>Color</Label>
            <div className="flex gap-2">
              {GOAL_COLOR_PRESETS.map(c => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setColor(c)}
                  className={`w-7 h-7 rounded-full border-2 transition ${color === c ? 'border-foreground scale-110' : 'border-transparent'}`}
                  style={{ backgroundColor: c }}
                  aria-label={`Color ${c}`}
                />
              ))}
            </div>
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-2">
          {isEdit && (
            <Button variant="destructive" onClick={remove} className="mr-auto">
              <Trash2 className="w-4 h-4 mr-1" /> Delete
            </Button>
          )}
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={save} disabled={saving || !name.trim()}>{saving ? 'Saving…' : 'Save'}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
